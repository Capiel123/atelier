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

  var ORDER = (window.__importer && window.__importer.ORDER) ||
    ['user_settings','labels','areas','skills','clients','projects','tasks','contacts','applications','goals','work_logs'];

  // Tabela → chave da coleção em S; null = caso especial (user_settings).
  var S_KEYS = { user_settings: null, labels: 'labels', areas: 'areas', skills: 'skills', clients: 'clients', projects: 'projects', tasks: 'tasks', contacts: 'contacts', applications: 'applications', goals: 'goals', work_logs: 'workLogs' };
  var HAS_DELETED = { user_settings: false, labels: false, areas: false, skills: true, clients: true, projects: true, tasks: true, contacts: true, applications: true, goals: true, work_logs: false };

  var state = { status: 'idle', pending: 0, lastError: null, lastFlushAt: null, owner: null, deviceId: null, inFlight: false, enqTimer: null, flushTimer: null, flushAt: null };

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
    var arr = S[S_KEYS[table]];
    if (!Array.isArray(arr)) return [];
    return arr.map(function (e) { return { id: e.id, obj: e }; });
  }
  function findEntity(table, S, id) {
    if (table === 'user_settings') return S;
    var arr = S[S_KEYS[table]];
    if (!Array.isArray(arr)) return null;
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function versionOf(table, S, obj) {
    if (table === 'user_settings') {
      try { return hashStr(JSON.stringify(window.__importer.settingsPayload(S))); } catch (e) { return hashStr(JSON.stringify(S.cfg)); }
    }
    return hashStr(JSON.stringify(obj));
  }
  function rowFor(table, S, uid, entity) {
    if (table === 'user_settings') return window.__importer.settingsRow(S, uid);
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
      // exclusões (entidades que sumiram)
      Object.keys(seen[table]).forEach(function (id) {
        if (current[id]) return;
        var prev = seen[table][id];
        if (prev.h === 'DELETED') return; // já tombstoneado, aguardando envio
        if (prev.flushed === true) {
          if (HAS_DELETED[table]) {
            pushOp(store, table, id, 'tombstone');
            seen[table][id] = { h: 'DELETED', flushed: true };
            changed = true;
          } else {
            // sem deleted_at: nada a enviar (app não exclui labels/areas/work_logs)
            removeOp(store, table, id);
            delete seen[table][id];
            changed = true;
          }
        } else {
          // criou e excluiu antes de enviar: descarta a op pendente, sem tombstone
          removeOp(store, table, id);
          delete seen[table][id];
          changed = true;
        }
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
          // upsert cuja entidade sumiu: vira tombstone se a tabela suporta
          if (HAS_DELETED[table]) items.push({ op: o, row: { user_id: user.id, id: o.id, deleted_at: isoMs(Date.now()), client_updated_at: Date.now() } });
          // senão, será descartada abaixo (sem linha)
          return;
        }
        var row = rowFor(table, S, user.id, ent);
        if (table === 'work_logs' && row.task_id) row.id = window.__merge.workLogId(row.task_id, row.date || '');
        items.push({ op: o, row: row });
      });

      if (!items.length) { markDone(store, seen, ops); continue; }

      var onConflict = (table === 'user_settings') ? 'user_id' : 'user_id,id';
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

  function tryUpsert(client, table, rows, onConflict) {
    var deadline = Date.now() + 20000;
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

  /* ---------------- propriedade da conta ---------------- */
  // Adota uma nova conta: limpa apenas metadados de sync por-conta; NÃO toca em S
  // nem na outbox. Cursores já são por-account (isolados por uid), sem necessidade de limpeza.
  function adoptAccount(newUid) {
    localStorage.setItem(OWNER_KEY, newUid);
    localStorage.removeItem(SEEN_KEY);        // força re-baseline via pull inicial (merge seguro)
    localStorage.removeItem(SETTINGS_CU_KEY); // nova conta: user_settings podem aplicar
    localStorage.removeItem(SEEDID_KEY);      // reavalia o seed para a nova conta
    state.owner = newUid;
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
    setStatus('pending');
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

  function applyUserSettings(row) {
    var cu = numVal(row.client_updated_at, 0);
    var last = numVal(localStorage.getItem(SETTINGS_CU_KEY), 0);
    if (last && cu <= last) return false;
    var data = row.data || {};
    var cfg = Object.assign({}, data.cfg || {});
    cfg.lastBackupAt = (S.cfg && S.cfg.lastBackupAt) || null;
    cfg.backupReminderDismissedAt = (S.cfg && S.cfg.backupReminderDismissedAt) || 0;
    S.cfg = cfg; S.energy = data.energy || {}; S.xpPool = numVal(data.xpPool, 0);
    S.commands = Array.isArray(data.commands) ? data.commands : [];
    localStorage.setItem(SETTINGS_CU_KEY, String(cu));
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
    S.workLogs = list.filter(function (l) { return !(row.task_id && l.taskId === row.task_id && l.date === (row.date || '')) && l.id !== winner.id; });
    S.workLogs.push(winner);
    return winner;
  }

  // Retorna { changed: bool, id: string|null } — id da entidade afetada (ou 'settings').
  function applyRemoteRow(table, row) {
    if (table === 'user_settings') { return { changed: applyUserSettings(row), id: 'settings' }; }
    if (table === 'work_logs') { return { changed: true, id: applyWorkLogRow(row).id }; }
    var key = S_KEYS[table];
    if (!key) return { changed: false, id: null };
    var list = S[key];
    if (!Array.isArray(list)) return { changed: false, id: null };
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === row.id) { idx = i; break; } }
    var local = idx >= 0 ? list[idx] : null;
    var res = window.__merge.mergeEntity(table, local, row);
    if (res.action === 'delete') { if (idx >= 0) list.splice(idx, 1); return { changed: true, id: row.id }; }
    if (res.action === 'set') { if (idx >= 0) list[idx] = res.entity; else list.push(res.entity); return { changed: true, id: row.id }; }
    return { changed: false, id: row.id };
  }

  async function fetchRows(client, user, table, cursor) {
    var q = client.from(table).select('*').eq('user_id', user.id).order('updated_at', { ascending: true }).limit(500);
    if (cursor) q = q.gt('updated_at', cursor);
    var r = await q;
    if (r.error) throw r.error;
    return r.data || [];
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
        var key = S_KEYS[table];
        if (!key) continue;
        if (pristine) { S[key] = rows.map(function (r) { return window.__merge.fromRow(table, r); }); }
        else { rows.forEach(function (r) { var x = applyRemoteRow(table, r); if (x.changed) changedList.push({ table: table, id: x.id }); }); }
      }
      if (typeof save === 'function') save();
      writeJSON(SEEN_KEY, buildBaseline(S));
      if (S._seedId) localStorage.setItem(SEEDID_KEY, S._seedId);
      state.pending = readJSON(OUTBOX_KEY, { seq: 0, ops: [] }).ops.length;
      if (typeof render === 'function') render();
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
          var x = applyRemoteRow(tb, r);
          if (x.changed) changedList.push({ table: tb, id: x.id });
        }
        var last = page[page.length - 1].updated_at;
        if (last) { cursor = last; maxUpd = last; }
        if (page.length < 500) break;
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
        seenNow[ch.table] = seenNow[ch.table] || {};
        var key = S_KEYS[ch.table];
        var e = null;
        if (key) { var arr = S[key] || []; for (var i = 0; i < arr.length; i++) if (arr[i].id === ch.id) { e = arr[i]; break; } }
        if (e) seenNow[ch.table][ch.id] = { h: hashStr(JSON.stringify(e)), flushed: true };
        else delete seenNow[ch.table][ch.id];
      });
      writeJSON(SEEN_KEY, seenNow);
      if (typeof render === 'function') render();
    }
    writeCursors(cursors);
    state.pending = readJSON(OUTBOX_KEY, { seq: 0, ops: [] }).ops.length;
    renderSync();
  }

  async function pullOnce() {
    if (state.inFlight) return;
    var user = authUser();
    if (!user) { setStatus('paused'); return; }
    var client = await getClient();
    if (!client) return;
    var own = resolveOwner(user);
    if (own.blocked) { setStatus('paused-account'); return; }
    state.inFlight = true;
    try { await doPull(client, user); }
    catch (e) { setStatus('error', String(e && e.message || e)); }
    finally { state.inFlight = false; }
  }

  async function syncCycle() { await pullOnce(); await flushOnce(); }

  function forceFullSync() {
    return withLock(function () {
      localStorage.removeItem(SEEN_KEY);
      var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
      // limpa a fila e reenfileira tudo como baseline a ser enviado
      store.ops = [];
      writeJSON(OUTBOX_KEY, store);
      writeJSON(SEEN_KEY, null);
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
    renderSync();
  }
  function renderSync() {
    var el = document.getElementById('cloudPill');
    if (!el) return;
    var user = authUser();
    var p = state.pending;
    var st = state.status;
    if (st === 'sending') { el.dataset.state = 'sending'; el.querySelector('.sp-text').textContent = 'Sincronizando…'; el.hidden = false; }
    else if (st === 'error') { el.dataset.state = 'error'; el.querySelector('.sp-text').textContent = 'Erro de sync'; el.hidden = false; }
    else if (st === 'paused-account') { el.dataset.state = 'paused'; el.querySelector('.sp-text').textContent = 'Pausada: outra conta'; el.hidden = false; }
    else if (st === 'paused') { el.dataset.state = 'paused'; el.querySelector('.sp-text').textContent = 'Sync pausada'; el.hidden = false; }
    else if (navigator && navigator.onLine === false) { el.dataset.state = 'offline'; el.querySelector('.sp-text').textContent = 'Offline'; el.hidden = false; }
    else if (p > 0) { el.dataset.state = 'pending'; el.querySelector('.sp-text').textContent = p + ' pendente' + (p === 1 ? '' : 's'); el.hidden = false; }
    else if (user) { el.dataset.state = 'synced'; el.querySelector('.sp-text').textContent = 'Sincronizado'; el.hidden = false; }
    else { el.hidden = true; }
  }

  function statusHTML() {
    var user = authUser();
    var p = state.pending;
    if (!user) return '<div class="msg">Entre na Conta para sincronizar as alterações locais.</div>';
    var st = state.status;
    if (navigator && navigator.onLine === false) st = 'offline';
    var label = { synced: 'Tudo sincronizado.', pending: p + ' alteração(ões) pendente(s).', sending: 'Enviando…', paused: 'Sincronização pausada (sem conta).', 'paused-account': 'Sincronização pausada: há operações pendentes de outra conta.', error: 'Erro ao sincronizar: ' + (state.lastError || ''), offline: 'Sem conexão. As alterações ficam na fila.' }[st] || '';
    var unlock = (st === 'paused-account')
      ? '<div class="acts" style="margin-top:6px"><button data-a="syncClearQueue">Descartar fila pendente e usar esta conta</button></div>' +
        '<div class="msg">Apaga apenas a fila pendente da conta anterior; seus dados locais e os dados do Supabase não são alterados.</div>'
      : '';
    return '<div class="msg">' + label + '</div>' + unlock +
      '<div class="acts" style="margin-top:6px"><button data-a="syncFlushNow">Enviar agora</button><button data-a="syncForceFull">Reenviar tudo</button></div>';
  }

  function onSave() { scheduleEnqueue(); scheduleFlush(); }
  function onAuth() { scheduleFlush(100); }

  /* ---------------- init ---------------- */
  function init() {
    var dev = localStorage.getItem(DEVICE_KEY);
    if (!dev) { dev = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY, dev); }
    state.deviceId = dev;
    state.owner = localStorage.getItem(OWNER_KEY) || null;
    // adota baseline e enfileira o que for necessário (sem rede)
    withLock(enqueueAll);
    scheduleFlush(800);
  }

  window.__sync = {
    onSave: onSave,
    onAuth: onAuth,
    flushNow: function () { return withLock(flushOnce); },
    syncNow: function () { return withLock(syncCycle); },
    clearSyncQueue: clearSyncQueue,
    forceFullSync: forceFullSync,
    getState: function () { return { status: state.status, pending: state.pending, lastError: state.lastError, lastFlushAt: state.lastFlushAt, owner: state.owner, deviceId: state.deviceId, inFlight: state.inFlight }; },
    statusHTML: statusHTML,
    _test: {
      enqueueAll: enqueueAll, doFlush: doFlush, hashStr: hashStr, isoMs: isoMs,
      buildBaseline: buildBaseline, readJSON: readJSON, writeJSON: writeJSON,
      OUTBOX_KEY: OUTBOX_KEY, SEEN_KEY: SEEN_KEY, DEVICE_KEY: DEVICE_KEY, OWNER_KEY: OWNER_KEY,
      CURSORS_KEY: CURSORS_KEY, SEEDID_KEY: SEEDID_KEY, SETTINGS_CU_KEY: SETTINGS_CU_KEY,
      ORDER: ORDER, HAS_DELETED: HAS_DELETED, S_KEYS: S_KEYS,
      scheduleFlush: scheduleFlush, scheduleRetry: scheduleRetry,
      pullOnce: pullOnce, doPull: doPull, syncCycle: syncCycle, applyRemoteRow: applyRemoteRow, isPristineSeed: isPristineSeed,
      resolveOwner: resolveOwner, adoptAccount: adoptAccount, clearSyncQueue: clearSyncQueue
    }
  };
  window.syncFlushNow = function () { return window.__sync.syncNow(); };
  window.syncClearQueue = function () {
    if (confirm('Descartar a fila de sincronização pendente e usar a conta atual? Os dados locais NÃO são apagados.')) {
      window.__sync.clearSyncQueue();
      window.__sync.syncNow();
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
