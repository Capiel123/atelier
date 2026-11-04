// =========================================================
// SYNC.JS — Fase 4: outbox e envio (push) local → Supabase
// - Fila persistente, coalescência, tombstones, retry/backoff.
// - Somente push: nunca lê dados remotos nem aplica no local.
// - Roda apenas com a sessão do usuário dono da fila (RLS).
// - Sem service_role; o app continua funcionando offline.
// =========================================================
(function () {
  'use strict';

  var OUTBOX_KEY = 'atelier_sync_outbox';
  var SEEN_KEY = 'atelier_sync_seen';
  var DEVICE_KEY = 'atelier_sync_device_id';
  var OWNER_KEY = 'atelier_sync_owner';
  var CURSORS_KEY = 'atelier_sync_cursors';
  var SEEDID_KEY = 'atelier_sync_seedId';
  var SETTINGS_CU_KEY = 'atelier_sync_settings_cu';

  var ORDER = (window.__importer && window.__importer.ORDER
    ? window.__importer.ORDER.slice()
    : ['user_settings','labels','areas','skills','clients','projects','tasks','contacts','applications','goals','work_logs']);
  if (ORDER.indexOf('active_timer') === -1) ORDER.push('active_timer');

  // Tabela → chave da coleção em S; null = caso especial (linha única por usuário).
  var S_KEYS = { user_settings: null, active_timer: null, labels: 'labels', areas: 'areas', skills: 'skills', clients: 'clients', projects: 'projects', tasks: 'tasks', contacts: 'contacts', applications: 'applications', goals: 'goals', work_logs: 'workLogs' };
  var HAS_DELETED = { user_settings: false, active_timer: false, labels: false, areas: false, skills: true, clients: true, projects: true, tasks: true, contacts: true, applications: true, goals: true, work_logs: false };

  var state = { status: 'idle', pending: 0, lastError: null, lastFlushAt: null, lastPullAt: null, owner: null, deviceId: null, inFlight: false, hydrated: false, enqTimer: null, flushTimer: null, flushAt: null };

  /* ---------------- storage ---------------- */
  function readJSON(key, dflt) { try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : dflt; } catch (e) { return dflt; } }
  function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------------- lock (cross-tab) ---------------- */
  function withLock(fn) {
    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
      return navigator.locks.request('atelier_sync_v1', { mode: 'exclusive' }, function () { return fn(); });
    }
    return Promise.resolve().then(fn);
  }

  /* ---------------- helpers ---------------- */
  function isoMs(ms) { return (typeof ms === 'number' && isFinite(ms)) ? new Date(ms).toISOString() : null; }
  function hashStr(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(36); }
  function tableRank(t) { var r = ORDER.indexOf(t); return r === -1 ? 999 : r; }
  function sortOps(a, b) { var r = tableRank(a.table) - tableRank(b.table); return r !== 0 ? r : a.seq - b.seq; }
  function backoffMs(attempts) {
    var base = [5000, 20000, 120000, 600000, 1800000][Math.min(attempts, 4)] || 1800000;
    return Math.round(base * (1 + (Math.random() * 0.4 - 0.2)));
  }
  // Erros permanentes/de dados (SQLSTATE) → fallback linha a linha; o resto é transiente (rede/auth/rate).
  function isDataError(err) {
    if (!err) return false;
    var c = err.code;
    if (c) return /^(22|23|42|42501|42601|42703|42883)/.test(String(c));
    return false;
  }

  function authUser() {
    try { var a = window.__auth && window.__auth.getState ? window.__auth.getState() : null; return (a && a.user && a.user.id) ? a.user : null; } catch (e) { return null; }
  }
  function getClient() {
    try { return (window.__auth && window.__auth.getClient) ? window.__auth.getClient() : null; } catch (e) { return null; }
  }

  /* ---------------- entidades ---------------- */
  function entitiesFor(table, S) {
    if (table === 'user_settings') return [{ id: 'settings', obj: S }];
    if (table === 'active_timer') return [{ id: 'timer', obj: S }];
    var arr = S[S_KEYS[table]];
    if (!Array.isArray(arr)) return [];
    return arr.map(function (e) { return { id: e.id, obj: e }; });
  }
  function findEntity(table, S, id) {
    if (table === 'user_settings' || table === 'active_timer') return S;
    var arr = S[S_KEYS[table]];
    if (!Array.isArray(arr)) return null;
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function versionOf(table, S, obj) {
    if (table === 'user_settings') {
      try { return hashStr(JSON.stringify(window.__importer.settingsPayload(S))); } catch (e) { return hashStr(JSON.stringify(S.cfg)); }
    }
    if (table === 'active_timer') {
      try { return hashStr(JSON.stringify(window.__importer.timerPayload(S))); } catch (e) { return hashStr(JSON.stringify(S.timer)); }
    }
    return hashStr(JSON.stringify(obj));
  }
  function rowFor(table, S, uid, entity) {
    if (table === 'user_settings') return window.__importer.settingsRow(S, uid);
    if (table === 'active_timer') return window.__importer.timerRow(S, uid);
    return window.__importer.mapOne(table, entity, uid);
  }

  /* ---------------- outbox ops ---------------- */
  function opKey(o) { return o.table + '|' + o.id; }
  function removeOp(store, table, id) { store.ops = store.ops.filter(function (o) { return !(o.table === table && o.id === id); }); }
  function pushOp(store, table, id, kind) {
    removeOp(store, table, id);
    store.ops.push({ seq: ++store.seq, table: table, id: id, kind: kind, ts: Date.now(), attempts: 0, nextAttemptAt: 0, lastError: null });
  }

  function buildBaseline(S) {
    var seen = {};
    ORDER.forEach(function (table) {
      seen[table] = {};
      entitiesFor(table, S).forEach(function (en) {
        seen[table][en.id] = { h: versionOf(table, S, en.obj), flushed: true };
      });
    });
    return seen;
  }

  /* ---------------- enqueue (diff) ---------------- */
  function enqueueAll() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.tasks)) return;
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    var seen = readJSON(SEEN_KEY, null);
    if (seen === null) {
      // Primeira execução: adota o estado atual como baseline (pós-importação da Fase 3).
      writeJSON(SEEN_KEY, buildBaseline(S));
      if (!store.ops.length) { state.pending = 0; renderSync(); return; }
      // se já havia ops (ex.: recarga), mantém e segue
    }
    var changed = false;
    ORDER.forEach(function (table) {
      seen[table] = seen[table] || {};
      var current = {};
      entitiesFor(table, S).forEach(function (en) {
        current[en.id] = true;
        var h = versionOf(table, S, en.obj);
        var prev = seen[table][en.id];
        if (!prev || prev.h !== h) {
          pushOp(store, table, en.id, 'upsert');
          seen[table][en.id] = { h: h, flushed: false };
          changed = true;
        }
      });
      // v100: estado local ausente NUNCA vira exclusão remota.
      // Exclusões são explícitas (markDeleted / softDelete); aqui só esquecemos a entidade.
      Object.keys(seen[table]).forEach(function (id) {
        if (current[id]) return;
        var prev = seen[table][id];
        if (prev && prev.h === 'DELETED') return; // tombstone já registrado
        removeOp(store, table, id); // criou e sumiu antes de enviar: descarta a op
        delete seen[table][id];
        changed = true;
      });
    });
    if (changed) {
      if (!writeJSON(OUTBOX_KEY, store)) { setStatus('error', 'Falha ao gravar a fila'); return; }
      writeJSON(SEEN_KEY, seen);
    }
    state.pending = store.ops.length;
    renderSync();
  }

  /* ---------------- flush ---------------- */
  async function doFlush(client, user) {
    if (typeof S === 'undefined' || !S) return;
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    var seen = readJSON(SEEN_KEY, null) || {};
    if (!store.ops.length) { setStatus('synced'); return; }

    var now = Date.now();
    var due = store.ops.filter(function (o) { return !o.nextAttemptAt || o.nextAttemptAt <= now; }).sort(sortOps);
    if (!due.length) { setStatus('pending'); return; }

    var byTable = {};
    due.forEach(function (o) { (byTable[o.table] = byTable[o.table] || []).push(o); });

    setStatus('sending');
    for (var t = 0; t < ORDER.length; t++) {
      var table = ORDER[t];
      var ops = byTable[table];
      if (!ops || !ops.length) continue;

      // monta itens {op,row} na ordem das ops
      var items = [];
      ops.forEach(function (o) {
        if (o.kind === 'tombstone') {
          items.push({ op: o, row: { user_id: user.id, id: o.id, deleted_at: isoMs(o.ts), client_updated_at: o.ts } });
          return;
        }
        var ent = findEntity(table, S, o.id);
        if (!ent) {
          // v88: NÃO fabricar exclusão no envio. Descarta a op; se a entidade sumiu
          // de verdade, o próximo enqueueAll decide (e o tombstone só sai quando a
          // entidade já tinha sido enviada antes).
          removeOp(store, o.table, o.id);
          return;
        }
        var row = rowFor(table, S, user.id, ent);
        if (table === 'work_logs' && row.task_id) row.id = window.__merge.workLogId(row.task_id, row.date || '');
        items.push({ op: o, row: row });
      });

      if (!items.length) { markDone(store, seen, ops); continue; }

      // v95: LWW no PUSH. Um aparelho com estado velho não pode sobrescrever um
      // remoto mais novo (ex.: tarefa concluída no PC e reaberta por um upsert
      // pendente do celular). Só vale para tarefas; tombstone mantém prioridade.
      if (table === 'tasks') {
        var remoteCu = await fetchRemoteVersions(client, user, table, items);
        if (remoteCu) {
          var kept = [];
          items.forEach(function (it) {
            if (!it.row || it.row.deleted_at) { kept.push(it); return; }
            var rcu = remoteCu[it.row.id];
            if (rcu != null && Number(rcu) > Number(it.row.client_updated_at || 0)) {
              markDone(store, seen, [it.op]); // remoto vence: o pull já/logo traz o estado
              return;
            }
            kept.push(it);
          });
          items = kept;
          if (!items.length) continue;
        }
      }

      var onConflict = (table === 'user_settings' || table === 'active_timer') ? 'user_id' : 'user_id,id';
      var batch = await tryUpsert(client, table, items.map(function (i) { return i.row; }), onConflict);

      if (!batch.error) { markDone(store, seen, ops); continue; }

      if (isDataError(batch.error)) {
        // fallback linha a linha para isolar o registro problemático
        for (var i = 0; i < items.length; i++) {
          var one = await tryUpsert(client, table, [items[i].row], onConflict);
          if (!one.error) { markDone(store, seen, [items[i].op]); }
          else if (table === 'work_logs' && one.error.code === '23505') { await reconcileWorkLog23505(client, user, items[i].row, store, seen, items[i].op); }
          else { markFailed(store, items[i].op, one.error); }
        }
      } else {
        // falha transiente (rede/auth/rate): mantém tudo e para
        ops.forEach(function (o) { markFailed(store, o, batch.error); });
        break;
      }
    }

    state.lastFlushAt = Date.now();
    if (!writeJSON(OUTBOX_KEY, store)) setStatus('error', 'Falha ao gravar a fila');
    writeJSON(SEEN_KEY, seen);
    state.pending = store.ops.length;
    renderSync();
    scheduleRetry();
  }

  // v95: busca `client_updated_at` remoto das linhas do lote (feature-detect: se o
  // cliente não tiver `select` — harnesses antigos — devolve null e o push segue).
  // v98 (K26): divide os ids em lotes curtos para não estourar a URL do PostgREST
  // (ex.: "Reenviar tudo"). Cada lote consulta e agrega no mesmo mapa.
  var REMOTE_VERSION_CHUNK = 100;
  function fetchRemoteVersions(client, user, table, items) {
    var ids = [];
    var seenIds = {};
    items.forEach(function (it) {
      var id = it.row && it.row.id;
      if (!id || seenIds[id]) return;
      seenIds[id] = true;
      ids.push(id);
    });
    if (!ids.length) return Promise.resolve(null);
    try { var probe = client.from(table); if (!probe || typeof probe.select !== 'function') return Promise.resolve(null); } catch (e) { return Promise.resolve(null); }
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (v) { if (done) return; done = true; clearTimeout(timer); resolve(v); };
      var timer = setTimeout(function () { finish(null); }, 8000);
      (async function () {
        var map = {};
        for (var i = 0; i < ids.length; i += REMOTE_VERSION_CHUNK) {
          if (done) return;
          var chunk = ids.slice(i, i + REMOTE_VERSION_CHUNK);
          var r = await client.from(table).select('id,client_updated_at').eq('user_id', user.id).in('id', chunk);
          if (!r || r.error) { finish(null); return; }
          (r.data || []).forEach(function (x) { map[x.id] = x.client_updated_at; });
        }
        finish(map);
      })().catch(function () { finish(null); });
    });
  }

  function tryUpsert(client, table, rows, onConflict) {    var deadline = Date.now() + 20000;
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { resolve({ error: { code: null, message: 'timeout' } }); }, 20000);
      Promise.resolve(client.from(table).upsert(rows, { onConflict: onConflict, ignoreDuplicates: false }))
        .then(function (r) { clearTimeout(timer); resolve({ error: r.error || null }); })
        .catch(function (e) { clearTimeout(timer); resolve({ error: e || { message: 'fetch' } }); });
    });
  }

  async function reconcileWorkLog23505(client, user, row, store, seen, op) {
    try {
      var r = await client.from('work_logs').select('*').eq('user_id', user.id).eq('task_id', row.task_id).eq('date', row.date).maybeSingle();
      if (r.error || !r.data) { markFailed(store, op, r.error || { message: 'sem linha remota' }); return; }
      var remote = r.data;
      var localWins = numVal(row.client_updated_at, 0) > numVal(remote.client_updated_at, 0);
      if (localWins) {
        // local vence: renomeia a linha remota para o id determinístico e aplica o conteúdo local
        var upd = await client.from('work_logs').update(Object.assign({}, row, { id: window.__merge.workLogId(row.task_id, row.date || '') })).eq('user_id', user.id).eq('id', remote.id);
        if (upd.error) { markFailed(store, op, upd.error); return; }
      }
      var winner = applyWorkLogRow(localWins ? row : remote);
      markDone(store, seen, [op]);
      seen['work_logs'] = seen['work_logs'] || {};
      delete seen['work_logs'][op.id];
      if (winner && winner.id) seen['work_logs'][winner.id] = { h: hashStr(JSON.stringify(winner)), flushed: true };
      if (typeof save === 'function') save();
    } catch (e) { markFailed(store, op, e); }
  }

  function markDone(store, seen, ops) {
    ops.forEach(function (o) {
      removeOp(store, o.table, o.id);
      if (seen[o.table] && seen[o.table][o.id]) {
        if (o.kind === 'tombstone') delete seen[o.table][o.id];
        else seen[o.table][o.id].flushed = true;
      }
    });
  }
  function markFailed(store, op, err) {
    var o = null;
    for (var i = 0; i < store.ops.length; i++) if (store.ops[i].table === op.table && store.ops[i].id === op.id) { o = store.ops[i]; break; }
    if (!o) return;
    o.attempts = (o.attempts || 0) + 1;
    o.nextAttemptAt = Date.now() + backoffMs(o.attempts);
    o.lastError = String((err && err.message) || err || 'erro');
  }

  /* ---------------- exclusão explícita ---------------- */
  // v88: exclusão de tarefa (del/histDel) enfileira o tombstone na hora, mesmo que
  // a entidade nunca tenha sido enviada. Antes, apagar uma tarefa recém-editada
  // podia não propagar (ou propagar por ausência, sem intenção).
  function markDeleted(table, id) {
    if (!HAS_DELETED[table] || !id) return;
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    pushOp(store, table, id, 'tombstone');
    var seen = readJSON(SEEN_KEY, null);
    if (seen && seen[table]) seen[table][id] = { h: 'DELETED', flushed: true };
    if (!writeJSON(OUTBOX_KEY, store)) return;
    if (seen) writeJSON(SEEN_KEY, seen);
    state.pending = store.ops.length;
    renderSync();
  }

  /* ---------------- propriedade da conta ---------------- */
  // Adota uma nova conta: limpa apenas metadados de sync por-conta; NÃO toca em S
  // nem na outbox. Cursores já são por-account (isolados por uid), sem necessidade de limpeza.
  function adoptAccount(newUid) {
    localStorage.setItem(OWNER_KEY, newUid);
    localStorage.removeItem(SEEN_KEY);        // força re-baseline via pull inicial (merge seguro)
    localStorage.removeItem(SETTINGS_CU_KEY); // nova conta: user_settings podem aplicar
    localStorage.removeItem(SEEDID_KEY);      // reavalia o seed para a nova conta
    state.owner = newUid;
    state.hydrated = false;
    // Troca de conta: desvincula a sessão de timer local (não vaza para a nova conta).
    // O pull inicial da nova conta reaplicará a sessão remota correspondente.
    if (typeof S !== 'undefined' && S) { S.timer = null; S.timerStoppedAt = Date.now(); if (typeof save === 'function') save(); }
  }
  // Resolve o dono da fila. Retorna { owner, blocked }.
  // Regra: outbox vazia → adota o novo UID; outbox pendente → pausa (preserva a fila).
  function resolveOwner(user) {
    var owner = localStorage.getItem(OWNER_KEY) || null;
    if (!owner) { localStorage.setItem(OWNER_KEY, user.id); state.owner = user.id; return { owner: user.id, blocked: false }; }
    if (owner === user.id) { state.owner = owner; return { owner: owner, blocked: false }; }
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    if (!store.ops.length) { adoptAccount(user.id); return { owner: user.id, blocked: false }; }
    state.owner = owner;
    return { owner: owner, blocked: true };
  }
  // Destrava a sincronização para a conta atual: descarta a fila pendente da conta
  // anterior e os metadados de sync por-conta. NÃO toca em S nem nos dados remotos.
  // Só deve ser chamado após confirmação explícita do usuário.
  function clearSyncQueue() {
    localStorage.removeItem(OUTBOX_KEY);
    localStorage.removeItem(OWNER_KEY);
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(SETTINGS_CU_KEY);
    localStorage.removeItem(SEEDID_KEY);
    state.pending = 0;
    state.owner = null;
    state.hydrated = false;
    setStatus('pending');
  }
  // Reconstroi o estado local a partir da conta autenticada: descarta o S local
  // (dados de teste/offline) e os metadados de sync, preserva autenticação/deviceId/owner,
  // e re-puxa o remoto (pull inicial com seed → substituição). NÃO altera o Supabase.
  // Roda sob o lock e faz o pull diretamente (sem depender de timer), com retry em falha.
  function resetLocalData() {
    return withLock(async function () {
      var user = authUser();
      if (!user) { setStatus('paused'); return; }
      // v97 (K22): exige cliente/online ANTES de tocar no local. Se o pull falhar,
      // desfaz tudo (S + fila + metadados) — nada de perder alteração não enviada.
      var client = await getClient();
      if (!client) { setStatus(navigator && navigator.onLine === false ? 'offline' : 'paused'); return; }
      var own = resolveOwner(user);
      if (own.blocked) { setStatus('paused-account'); return; }
      // v100: até o pull concluir, nada de push.
      state.hydrated = false;
      var prevS = (typeof S !== 'undefined') ? S : null;
      var KEYS = [OUTBOX_KEY, SEEN_KEY, SETTINGS_CU_KEY, SEEDID_KEY, CURSORS_KEY];
      var prev = {};
      KEYS.forEach(function (k) { prev[k] = localStorage.getItem(k); });
      KEYS.forEach(function (k) { localStorage.removeItem(k); });
      state.pending = 0;
      var keepTheme = (typeof S !== 'undefined' && S && S.cfg && S.cfg.theme) || 'obsidian';
      var keepAccent = (typeof S !== 'undefined' && S && S.cfg) ? S.cfg.accentColor : null;
      if (typeof S !== 'undefined' && typeof seed === 'function') { try { S = seed(); } catch (e) {} }
      if (S && S.cfg) { S.cfg.theme = keepTheme; S.cfg.accentColor = keepAccent; } // preferências locais
      if (typeof applyTheme === 'function') applyTheme();
      if (typeof save === 'function') save();
      if (typeof render === 'function') render();
      state.inFlight = true;
      try { await doPull(client, user); }
      catch (e) {
        if (prevS) S = prevS;
        KEYS.forEach(function (k) {
          if (prev[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, prev[k]);
        });
        state.pending = readJSON(OUTBOX_KEY, { seq: 0, ops: [] }).ops.length;
        if (typeof applyTheme === 'function') applyTheme();
        if (typeof save === 'function') save();
        if (typeof render === 'function') render();
        setStatus('error', 'Não foi possível baixar os dados; nada foi alterado');
        scheduleFlush(30000);
      }
      finally { state.inFlight = false; }
    });
  }

  // v97 (K20): depois de substituir S por importação/restauração de cópia, zera o
  // rastro de sync e regrava o baseline do estado novo. Sem isso, entidades do
  // baseline antigo que sumiram viram tombstone e apagam o remoto.
  function resetStateBaseline() {
    localStorage.removeItem(OUTBOX_KEY);
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(CURSORS_KEY);
    if (typeof S !== 'undefined' && S) writeJSON(SEEN_KEY, buildBaseline(S));
    state.pending = 0;
    renderSync();
  }

  /* ---------------- recuperação de excluídas (v101) ----------------
     O usuário não precisa de SQL: busca no servidor as linhas com deleted_at
     recente, restaura (deleted_at=null + client_updated_at novo) e aplica local. */
  var RECOVER_TABLES = ['tasks', 'projects', 'clients', 'contacts', 'applications', 'goals', 'skills'];
  var RECOVER_LABEL = { tasks: 'Tarefa', projects: 'Projeto', clients: 'Cliente', contacts: 'Contato', applications: 'Vaga', goals: 'Meta', skills: 'Habilidade' };
  function recoverTitle(table, r) {
    if (table === 'tasks') return r.title || r.t || '(sem título)';
    if (table === 'applications') return (r.client || '') + (r.role ? ' · ' + r.role : '') || '(sem título)';
    return r.name || r.n || r.title || r.client || '(sem título)';
  }
  async function fetchDeleted(days) {
    var user = authUser();
    if (!user) throw new Error('Entre na conta');
    var client = await getClient();
    if (!client) throw new Error('Sem conexão');
    var since = new Date(Date.now() - Math.max(1, days || 30) * 86400000).toISOString();
    var out = [];
    for (var i = 0; i < RECOVER_TABLES.length; i++) {
      var table = RECOVER_TABLES[i];
      var res = await client.from(table).select('*').eq('user_id', user.id)
        .not('deleted_at', 'is', null).gte('deleted_at', since)
        .order('deleted_at', { ascending: false }).limit(200);
      if (res && res.error) throw res.error;
      (res && res.data || []).forEach(function (r) {
        out.push({ table: table, id: r.id, title: recoverTitle(table, r), deletedAt: r.deleted_at, kind: RECOVER_LABEL[table] });
      });
    }
    out.sort(function (a, b) { return String(b.deletedAt).localeCompare(String(a.deletedAt)); });
    return out.slice(0, 300);
  }
  function recoverDeleted(items) {
    return withLock(async function () {
      var user = authUser();
      if (!user) throw new Error('Entre na conta');
      var client = await getClient();
      if (!client) throw new Error('Sem conexão');
      var now = Date.now();
      var restored = [];
      for (var i = 0; i < (items || []).length; i++) {
        var it = items[i];
        if (!it || !it.table || !it.id) continue;
        var up = await client.from(it.table).update({ deleted_at: null, client_updated_at: now }).eq('user_id', user.id).eq('id', it.id);
        if (up && up.error) throw up.error;
        var rr = await client.from(it.table).select('*').eq('user_id', user.id).eq('id', it.id).limit(1);
        if (rr && rr.error) throw rr.error;
        var row = rr && rr.data && rr.data[0];
        if (row && typeof applyRemoteRow === 'function') { applyRemoteRow(it.table, row); restored.push(it); }
      }
      // seen de DELETED pendente bloquearia o pull (v92): re-baseline dos restaurados
      var seen = readJSON(SEEN_KEY, null) || buildBaseline(S);
      restored.forEach(function (it) {
        var e = findEntity(it.table, S, it.id);
        if (e) { seen[it.table] = seen[it.table] || {}; seen[it.table][it.id] = { h: versionOf(it.table, S, e), flushed: true }; }
      });
      writeJSON(SEEN_KEY, seen);
      var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
      restored.forEach(function (it) { removeOp(store, it.table, it.id); });
      writeJSON(OUTBOX_KEY, store);
      state.pending = store.ops.length;
      state.hydrated = false; // próximo ciclo puxa antes de qualquer envio
      if (typeof save === 'function') save();
      if (typeof render === 'function') render();
      scheduleFlush(300);
      return restored.length;
    });
  }

  async function flushOnce() {
    if (state.inFlight) return;
    var user = authUser();
    if (!user) { setStatus('paused'); return; }
    var client = await getClient();
    if (!client) { setStatus(navigator && navigator.onLine === false ? 'offline' : 'paused'); scheduleRetry(); return; }
    // isolamento por conta (mesma regra em push e pull)
    var own = resolveOwner(user);
    if (own.blocked) { setStatus('paused-account'); return; }
    // v100: nunca fazer push antes da hidratação remota. Um local vazio/seed não
    // pode preceder o pull; o próximo syncCycle puxa e então envia.
    if (!state.hydrated) { setStatus('pending'); scheduleFlush(1500); return; }
    state.inFlight = true;
    try { await doFlush(client, user); }
    catch (e) { setStatus('error', String(e && e.message || e)); }
    finally { state.inFlight = false; }
  }

  /* ---------------- FASE 5: pull ---------------- */
  function numVal(v, d) { var n = Number(v); return isFinite(n) ? n : (d == null ? null : d); }
  function readCursors() { return readJSON(CURSORS_KEY, {}); }
  function writeCursors(c) { writeJSON(CURSORS_KEY, c); }
  function cursorFor(c, uid, table) { return (c[uid] && c[uid][table]) || null; }
  function setCursor(c, uid, table, v) { c[uid] = c[uid] || {}; c[uid][table] = v; }

  function isPristineSeed() {
    try {
      if (!S || !S._seedId) return false;
      if (!Array.isArray(S.tasks) || S.tasks.length !== 1) return false;
      if (!Array.isArray(S.projects) || S.projects.length !== 1) return false;
      if (!Array.isArray(S.goals) || S.goals.length !== 1) return false;
      if ((S.clients || []).length || (S.contacts || []).length || (S.applications || []).length || (S.workLogs || []).length) return false;
      return S.tasks[0].t === 'Bloco A: prospecção ativa' && S.projects[0].id === 'p1' && S.goals[0].id === 'g1';
    } catch (e) { return false; }
  }

  function countSeen(seen) {
    var n = 0;
    if (!seen) return 0;
    ORDER.forEach(function (t) { n += Object.keys(seen[t] || {}).length; });
    return n;
  }

  // v100 (BUG 1): local "pristine seed" + memória de sync existente = perda de
  // estado local (cache/corrupção/reload no meio). Nunca é uma exclusão: zera o
  // rastro de sync e deixa o pull hidratar do remoto. Nada remoto é apagado.
  function guardStateLoss() {
    if (typeof S === 'undefined' || !S) return false;
    if (!isPristineSeed()) return false;
    var seen = readJSON(SEEN_KEY, null);
    if (!seen || !countSeen(seen)) return false;
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(OUTBOX_KEY);
    localStorage.removeItem(CURSORS_KEY);
    localStorage.removeItem(SETTINGS_CU_KEY);
    state.pending = 0;
    state.hydrated = false;
    setStatus('pending');
    return true;
  }

  function applyUserSettings(row) {
    var cu = numVal(row.client_updated_at, 0);
    var last = numVal(localStorage.getItem(SETTINGS_CU_KEY), 0);
    if (last && cu <= last) return false;
    var data = row.data || {};
    var cfg = Object.assign({}, data.cfg || {});
    // v100 (BUG 3): recolhimento de seções é preferência LOCAL (não vai no pull).
    var localSections = (S.cfg && S.cfg.sectionsCollapsed) || null;
    cfg.lastBackupAt = (S.cfg && S.cfg.lastBackupAt) || null;
    cfg.backupReminderDismissedAt = (S.cfg && S.cfg.backupReminderDismissedAt) || 0;
    // preferências visuais são LOCAIS: não sobrescrever com o valor remoto
    var localTheme = (S.cfg && S.cfg.theme) || 'obsidian';
    var localAccent = (S.cfg && S.cfg.accentColor != null) ? S.cfg.accentColor : null;
    S.cfg = cfg; S.energy = data.energy || {}; S.xpPool = numVal(data.xpPool, 0);
    S.commands = Array.isArray(data.commands) ? data.commands : [];
    // Fase 4: S.pomodoros viaja no blob de user_settings (JSONB), sem tabela nova.
    // Se o remoto ainda não tem o campo (cliente antigo), preserva o local.
    if (Array.isArray(data.pomodoros)) S.pomodoros = data.pomodoros;
    S.cfg.theme = localTheme;
    S.cfg.accentColor = localAccent;
    if (localSections) S.cfg.sectionsCollapsed = localSections;
    localStorage.setItem(SETTINGS_CU_KEY, String(cu));
    return true;
  }

  // Aplica a sessão de timer remota (LWW por client_updated_at). Não registra minutos:
  // os minutos são gravados apenas pelo dispositivo que encerra a fase localmente.
  function applyTimerRow(row) {
    var remoteCu = numVal(row.client_updated_at, 0);
    var localTimer = (S && S.timer) || null;
    var localCu = localTimer ? numVal(localTimer.updatedAt, 0) : numVal((S && S.timerStoppedAt) || 0, 0);
    if (remoteCu <= localCu) return false; // local vence ou empate → mantém
    var had = !!localTimer;
    var next = window.__merge.fromTimer(row); // null = sem sessão
    if (!next) {
      // v98 (K25): grava o marcador da parada remota. Sem isso, o próximo pull
      // compara de novo com o timestamp antigo e reaplica save()+render() em loop.
      S.timerStoppedAt = remoteCu;
      S.timer = null;
      if (had && typeof toast === 'function') {
        toast('Sessão encerrada em outro dispositivo'); // aviso discreto, sem sair do modo foco
      }
      return true;
    }
    S.timer = next;
    return true;
  }

  function applyWorkLogRow(row) {
    var list = S.workLogs || (S.workLogs = []);
    var local = null;
    if (row.task_id) {
      local = list.find(function (l) { return l.taskId === row.task_id && l.date === (row.date || ''); }) || null;
    } else {
      local = list.find(function (l) { return l.id === row.id; }) || null;
    }
    var winner = window.__merge.mergeWorkLog(local, row);
    var changed = !local || JSON.stringify(local) !== JSON.stringify(winner);
    S.workLogs = list.filter(function (l) { return !(row.task_id && l.taskId === row.task_id && l.date === (row.date || '')) && l.id !== winner.id; });
    S.workLogs.push(winner);
    return { winner: winner, changed: changed, id: winner.id };
  }

  // Retorna { changed: bool, id: string|null } — id da entidade afetada (ou 'settings').
  function applyRemoteRow(table, row) {
    if (table === 'user_settings') { return { changed: applyUserSettings(row), id: 'settings' }; }
    if (table === 'active_timer') { return { changed: applyTimerRow(row), id: 'timer' }; }
    if (table === 'work_logs') { var wl = applyWorkLogRow(row); return { changed: wl.changed, id: wl.id }; }
    var key = S_KEYS[table];
    if (!key) return { changed: false, id: null };
    var list = S[key];
    if (!Array.isArray(list)) return { changed: false, id: null };
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === row.id) { idx = i; break; } }
    var local = idx >= 0 ? list[idx] : null;
    var res = window.__merge.mergeEntity(table, local, row);
    if (res.action === 'delete') { if (idx >= 0) { list.splice(idx, 1); return { changed: true, id: row.id }; } return { changed: false, id: row.id }; }
    if (res.action === 'set') {
      // v92: só conta como mudança se o conteúdo realmente mudou. Sem isso, o pull
      // re-aplicava a linha de borda (cursor gte) e disparava save()+render() em loop
      // — o contador "N pend" piscava sem parar.
      var changed = !local || JSON.stringify(local) !== JSON.stringify(res.entity);
      if (idx >= 0) list[idx] = res.entity; else list.push(res.entity);
      return { changed: changed, id: row.id };
    }
    return { changed: false, id: row.id };
  }

  function fetchRows(client, user, table, cursor) {
    // v89: só ordena por `id` nas tabelas que têm essa coluna — user_settings e
    // active_timer são singleton por user_id e o PostgREST rejeitava a ordenação
    // ("column user_settings.id does not exist"), derrubando o pull inteiro.
    var hasId = (table !== 'user_settings' && table !== 'active_timer');
    var q = client.from(table).select('*').eq('user_id', user.id).order('updated_at', { ascending: true });
    if (hasId) q = q.order('id', { ascending: true });
    q = q.limit(500);
    if (cursor) q = q.gte('updated_at', cursor);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject({ message: 'timeout no pull de ' + table }); }, 20000);
      Promise.resolve(q).then(function (r) {
        clearTimeout(timer);
        if (r.error) reject(r.error); else resolve(r.data || []);
      }).catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  async function doPull(client, user) {
    if (typeof S === 'undefined' || !S) return;
    var seen = readJSON(SEEN_KEY, null);
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    var changedList = [];

    if (seen === null) {
      // primeira ativação: só com a outbox vazia (flush prévio ok)
      if (store.ops.length) { setStatus('pending'); return; }
      var pristine = isPristineSeed();
      for (var ti = 0; ti < ORDER.length; ti++) {
        var table = ORDER[ti];
        var rows = await fetchRows(client, user, table, null);
        if (table === 'user_settings') { if (rows.length) applyUserSettings(rows[0]); continue; }
        if (table === 'active_timer') { if (rows.length) applyTimerRow(rows[0]); continue; }
        var key = S_KEYS[table];
        if (!key) continue;
        // v97 (K21): o caminho pristine ignora tombstones e os descarta (antes uma
        // linha excluída virava tarefa viva e podia ser "des-excluída" ao editar).
        if (pristine) { S[key] = rows.filter(function (r) { return r.deleted_at == null; }).map(function (r) { return window.__merge.fromRow(table, r); }); }
        else { rows.forEach(function (r) { var x = applyRemoteRow(table, r); if (x.changed) changedList.push({ table: table, id: x.id }); }); }
      }
      if (typeof save === 'function') save();
      writeJSON(SEEN_KEY, buildBaseline(S));
      if (S._seedId) localStorage.setItem(SEEDID_KEY, S._seedId);
      state.pending = readJSON(OUTBOX_KEY, { seq: 0, ops: [] }).ops.length;
      if (typeof reconcileTimerTask === 'function') reconcileTimerTask();
      if (typeof applyTheme === 'function') applyTheme();
      if (typeof render === 'function') render();
      state.lastPullAt = Date.now();
      state.hydrated = true;
      renderSync();
      return;
    }

    // incremental por tabela, cursor com paginação
    var cursors = readCursors();
    var maxByTable = {};
    for (var t2 = 0; t2 < ORDER.length; t2++) {
      var tb = ORDER[t2];
      var cursor = cursorFor(cursors, user.id, tb);
      var maxUpd = cursor;
      while (true) {
        var page = await fetchRows(client, user, tb, cursor);
        if (!page.length) break;
        for (var pi = 0; pi < page.length; pi++) {
          var r = page[pi];
          // v92: tombstone local pendente não pode ser "ressuscitado" por um pull que
          // rodou antes do flush (o servidor ainda tem a linha viva).
          if (seen && seen[tb] && seen[tb][r.id] && seen[tb][r.id].h === 'DELETED') continue;
          var x = applyRemoteRow(tb, r);
          if (x.changed) changedList.push({ table: tb, id: x.id });
        }
        var last = page[page.length - 1].updated_at;
        var advanced = !!last && last !== cursor;
        if (last) { cursor = last; maxUpd = last; }
        if (page.length < 500) break;
        if (!advanced) break; // página inteira no mesmo instante: não avança (evita loop)
      }
      if (maxUpd) setCursor(cursors, user.id, tb, maxUpd);
    }

    if (changedList.length) {
      if (typeof save === 'function' && !save()) return; // não avança cursor se falhou a gravação
      // anti-loop: marca seen das entidades aplicadas (flushed)
      var seenNow = readJSON(SEEN_KEY, null) || {};
      changedList.forEach(function (ch) {
        if (ch.table === 'user_settings') {
          seenNow.user_settings = seenNow.user_settings || {};
          seenNow.user_settings.settings = { h: hashStr(JSON.stringify(window.__importer.settingsPayload(S))), flushed: true };
          return;
        }
        if (ch.table === 'active_timer') {
          seenNow.active_timer = seenNow.active_timer || {};
          seenNow.active_timer.timer = { h: versionOf('active_timer', S, S), flushed: true };
          return;
        }
        seenNow[ch.table] = seenNow[ch.table] || {};
        var key = S_KEYS[ch.table];
        var e = null;
        if (key) { var arr = S[key] || []; for (var i = 0; i < arr.length; i++) if (arr[i].id === ch.id) { e = arr[i]; break; } }
        if (e) seenNow[ch.table][ch.id] = { h: hashStr(JSON.stringify(e)), flushed: true };
        else delete seenNow[ch.table][ch.id];
      });
      writeJSON(SEEN_KEY, seenNow);
      if (typeof applyTheme === 'function') applyTheme();
      if (typeof render === 'function') render();
      // v97: se o pull mudou (ou apagou) a tarefa em foco, o overlay precisa refletir.
      // `renderFocus` já fecha quando a tarefa sumiu/foi concluída.
      try {
        if (typeof renderFocus === 'function' && typeof focusTaskId !== 'undefined' && focusTaskId && document.getElementById('focusOverlay')) renderFocus();
      } catch (e) {}
    }
    writeCursors(cursors);
    state.pending = readJSON(OUTBOX_KEY, { seq: 0, ops: [] }).ops.length;
    if (typeof reconcileTimerTask === 'function') reconcileTimerTask();
    state.lastPullAt = Date.now();
    state.hydrated = true;
    renderSync();
  }

  async function pullOnce() {
    if (state.inFlight) return true;
    var user = authUser();
    if (!user) { setStatus('paused'); return true; }
    var client = await getClient();
    if (!client) { setStatus(navigator && navigator.onLine === false ? 'offline' : 'paused'); scheduleFlush(30000); return false; }
    var own = resolveOwner(user);
    if (own.blocked) { setStatus('paused-account'); return true; }
    state.inFlight = true;
    try { await doPull(client, user); return true; }
    catch (e) { setStatus('error', String(e && e.message || e)); scheduleFlush(30000); return false; }
    finally { state.inFlight = false; }
  }

  async function syncCycle() { var ok = await pullOnce(); if (ok) await flushOnce(); }

  function forceFullSync() {
    return withLock(function () {
      var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
      // limpa a fila e reenfileira tudo como baseline a ser enviado
      store.ops = [];
      writeJSON(OUTBOX_KEY, store);
      // v88: `seen` VAZIO (não null) → enqueueAll enfileira todas as entidades.
      // Com null, o enqueueAll fazia o baseline e o botão não enviava nada.
      writeJSON(SEEN_KEY, {});
      return enqueueAll();
    }).then(function () { scheduleFlush(100); });
  }

  /* ---------------- agendamento e UI ---------------- */
  function scheduleEnqueue() { if (state.enqTimer) return; state.enqTimer = setTimeout(function () { state.enqTimer = null; withLock(enqueueAll); }, 80); }
  function scheduleFlush(ms) {
    var delay = (ms == null ? 1200 : ms);
    var target = Date.now() + delay;
    // Se já há um flush agendado para antes, mantém (debounce).
    if (state.flushTimer && state.flushAt && state.flushAt <= target) return;
    if (state.flushTimer) clearTimeout(state.flushTimer);
    state.flushAt = target;
    state.flushTimer = setTimeout(function () { state.flushTimer = null; state.flushAt = null; withLock(syncCycle); }, delay);
  }
  function scheduleRetry() {
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    var earliest = null;
    store.ops.forEach(function (o) { if (o.nextAttemptAt && (earliest === null || o.nextAttemptAt < earliest)) earliest = o.nextAttemptAt; });
    if (!earliest) return; // nada em backoff: não deixa um polling pendente
    scheduleFlush(Math.max(5000, Math.min(earliest - Date.now(), 30000)));
  }

  function setStatus(status, error) {
    state.status = status;
    state.lastError = error || null;
    // v91: marcador do header só aparece para erro PERSISTENTE (ver pillMarker).
    if (status === 'error') { if (state.errorSince == null) state.errorSince = Date.now(); }
    else state.errorSince = null;
    renderSync();
  }

  // v91/v92: política do marcador remoto do #syncPill. Devolve 'error' | 'paused' | null.
  // - erro só com ALTERAÇÃO PENDENTE e depois de persistir ~30s (falha transitória de
  //   pull sem fila não acende nada);
  // - conta pausada (ação necessária) aparece na hora;
  // - pending/sending/synced/offline e pulls normais NUNCA acendem.
  var ERROR_MARKER_DELAY_MS = 30000;
  function pillMarker(status, hasUser, errorSince, pending, now) {
    if (hasUser === false) return null;
    if (status === 'paused-account') return 'paused';
    var p = (typeof pending === 'number' && isFinite(pending)) ? pending : 0;
    var t = (now == null) ? Date.now() : now;
    if (status === 'error' && p > 0 && errorSince && (t - errorSince) >= ERROR_MARKER_DELAY_MS) return 'error';
    return null;
  }

  function pad2(n) { return ('0' + n).slice(-2); }

  // Data/hora absoluta. Não usa timer: é recalculada quando o painel renderiza
  // (abertura da Config, mudança de estado ou evento de rede).
  function formatStamp(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
      return 'hoje às ' + hm;
    }
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate()) {
      return 'ontem às ' + hm;
    }
    var date = pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
    if (d.getFullYear() !== now.getFullYear()) date += '/' + d.getFullYear();
    return date + ' às ' + hm;
  }

  var VISUAL_STATES = { synced: 1, pending: 1, sending: 1, error: 1, paused: 1, 'paused-account': 1, offline: 1 };
  function statusVisual(status, pending) {
    if (VISUAL_STATES[status]) return status;
    return pending > 0 ? 'pending' : 'synced';
  }

  function statusSnapshot() {
    return {
      status: state.status,
      pending: state.pending,
      lastError: state.lastError,
      errorSince: state.errorSince,
      lastFlushAt: state.lastFlushAt,
      lastPullAt: state.lastPullAt,
      owner: state.owner,
      deviceId: state.deviceId,
      inFlight: state.inFlight,
      hasUser: !!authUser()
    };
  }

  // Evento apenas de leitura para o header; não altera outbox/pull/flush.
  function emitStatus() {
    if (typeof window === 'undefined' || !window.dispatchEvent) return;
    var detail = statusSnapshot();
    try {
      var ev;
      if (typeof CustomEvent === 'function') {
        ev = new CustomEvent('atelier:sync-status', { detail: detail });
      } else if (typeof Event === 'function') {
        ev = new Event('atelier:sync-status');
        ev.detail = detail;
      } else {
        return;
      }
      window.dispatchEvent(ev);
    } catch (e) {}
  }

  // O header mantém apenas o #syncPill (gravação local). O estado detalhado
  // da sincronização remota vive na seção "Sincronização" da aba Config.
  function renderSync() {
    // Emite antes do return: o painel pode não existir, mas o header precisa
    // limpar/atualizar o marcador remoto mesmo fora da aba Config.
    emitStatus();
    var el = document.getElementById('syncStatusPanel');
    if (!el) return;
    el.innerHTML = statusHTML();
  }

  function statusHTML() {
    var user = authUser();
    var p = state.pending;
    if (!user) return '<div class="msg">Entre na Conta para sincronizar as alterações locais.</div>';
    var st = state.status;
    // Erros/pausas continuam visíveis mesmo offline; o offline vence apenas
    // estados neutros (idle/synced/pending).
    var priority = { sending: 1, error: 2, 'paused-account': 3, paused: 4 };
    if (!priority[st] && navigator && navigator.onLine === false) st = 'offline';
    var visual = statusVisual(st, p);
    var label = {
      synced: 'Tudo sincronizado.',
      pending: p + ' alteração(ões) pendente(s).',
      sending: 'Enviando…',
      paused: 'Sincronização pausada (sem conta).',
      'paused-account': 'Sincronização pausada: há operações pendentes de outra conta.',
      error: 'Erro ao sincronizar' + (state.lastError ? ': ' + state.lastError : '.'),
      offline: 'Sem conexão. As alterações ficam na fila.'
    }[st] || (p > 0 ? p + ' alteração(ões) pendente(s).' : 'Nenhuma alteração pendente.');
    var unlock = (st === 'paused-account')
      ? '<div class="acts" style="margin-top:6px"><button data-a="syncClearQueue">Descartar fila pendente e usar esta conta</button></div>' +
        '<div class="msg">Apaga apenas a fila pendente da conta anterior; seus dados locais e os dados do Supabase não são alterados.</div>'
      : '';
    var stampFlush = formatStamp(state.lastFlushAt);
    var stampPull = formatStamp(state.lastPullAt);
    var stamps = '';
    if (stampFlush) stamps += '<span class="sync-last">Último envio: ' + stampFlush + '</span>';
    if (stampPull) stamps += '<span class="sync-last">Último pull: ' + stampPull + '</span>';
    return '<div class="sync-status" data-state="' + visual + '">' +
        '<span class="sync-status-dot" aria-hidden="true"></span>' +
        '<span class="sync-status-text">' + label + '</span>' +
      '</div>' +
      (stamps ? '<div class="sync-last-row">' + stamps + '</div>' : '') +
      unlock +
      '<div class="acts" style="margin-top:6px"><button data-a="syncFlushNow">Enviar agora</button><button data-a="syncForceFull">Reenviar tudo</button><button data-a="syncResetLocal">Restaurar dados da conta</button><button data-a="recoverOpen">Recuperar excluídas</button></div>';
  }

  function onSave() { scheduleEnqueue(); scheduleFlush(); }
  function onAuth() { scheduleFlush(100); }

  /* ---------------- init ---------------- */
  function init() {
    var dev = localStorage.getItem(DEVICE_KEY);
    if (!dev) { dev = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY, dev); }
    state.deviceId = dev;
    state.owner = localStorage.getItem(OWNER_KEY) || null;
    // v100 (BUG 1): se o local é o seed mas já houve sync, NÃO enfileirar nada —
    // trata como perda de estado e deixa o pull hidratar.
    guardStateLoss();
    // adota baseline e enfileira o que for necessário (sem rede)
    withLock(enqueueAll);
    scheduleFlush(800);
    emitStatus();
  }

  window.__sync = {
    onSave: onSave,
    onAuth: onAuth,
    flushNow: function () { return withLock(flushOnce); },
    syncNow: function () { return withLock(syncCycle); },
    markDeleted: markDeleted,
    resetStateBaseline: resetStateBaseline,
    fetchDeleted: fetchDeleted,
    recoverDeleted: recoverDeleted,
    clearSyncQueue: clearSyncQueue,
    resetLocalData: resetLocalData,
    forceFullSync: forceFullSync,
    getState: statusSnapshot,
    statusHTML: statusHTML,
    pillMarker: pillMarker,
    _test: {
      enqueueAll: enqueueAll, doFlush: doFlush, hashStr: hashStr, isoMs: isoMs,
      guardStateLoss: guardStateLoss, state: state, fetchDeleted: fetchDeleted, recoverDeleted: recoverDeleted,
      buildBaseline: buildBaseline, readJSON: readJSON, writeJSON: writeJSON,
      OUTBOX_KEY: OUTBOX_KEY, SEEN_KEY: SEEN_KEY, DEVICE_KEY: DEVICE_KEY, OWNER_KEY: OWNER_KEY,
      CURSORS_KEY: CURSORS_KEY, SEEDID_KEY: SEEDID_KEY, SETTINGS_CU_KEY: SETTINGS_CU_KEY,
      ORDER: ORDER, HAS_DELETED: HAS_DELETED, S_KEYS: S_KEYS,
      setStatus: setStatus, pillMarker: pillMarker, ERROR_MARKER_DELAY_MS: ERROR_MARKER_DELAY_MS,
      scheduleFlush: scheduleFlush, scheduleRetry: scheduleRetry,
      pullOnce: pullOnce, doPull: doPull, syncCycle: syncCycle, applyRemoteRow: applyRemoteRow, applyTimerRow: applyTimerRow, isPristineSeed: isPristineSeed,
      versionOf: versionOf, rowFor: rowFor, markDeleted: markDeleted, fetchRows: fetchRows, resetStateBaseline: resetStateBaseline,
      fetchRemoteVersions: fetchRemoteVersions, REMOTE_VERSION_CHUNK: REMOTE_VERSION_CHUNK,
      resolveOwner: resolveOwner, adoptAccount: adoptAccount, clearSyncQueue: clearSyncQueue, resetLocalData: resetLocalData
    }
  };
  window.syncFlushNow = function () { return window.__sync.syncNow(); };
  window.syncClearQueue = function () {
    if (confirm('Descartar a fila de sincronização pendente e usar a conta atual? Os dados locais NÃO são apagados.')) {
      window.__sync.clearSyncQueue();
      window.__sync.syncNow();
    }
  };
  window.syncResetLocal = function () {
    if (confirm('Apagar TODOS os dados locais deste dispositivo e baixar novamente da conta Supabase?\n\nIsso NÃO altera os dados do Supabase. Dados locais de teste serão perdidos.')) {
      window.__sync.resetLocalData();
    }
  };
  window.syncForceFull = function () { if (confirm('Reenviar todo o estado local para a conta?')) window.__sync.forceFullSync(); };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', function () { scheduleFlush(50); renderSync(); });
    window.addEventListener('offline', function () { setStatus('offline'); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleFlush(100); });
  }
})();
