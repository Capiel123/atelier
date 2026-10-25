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

  var ORDER = (window.__importer && window.__importer.ORDER) ||
    ['user_settings','labels','areas','skills','clients','projects','tasks','contacts','applications','goals','work_logs'];

  // Tabela → chave da coleção em S; null = caso especial (user_settings).
  var S_KEYS = { user_settings: null, labels: 'labels', areas: 'areas', skills: 'skills', clients: 'clients', projects: 'projects', tasks: 'tasks', contacts: 'contacts', applications: 'applications', goals: 'goals', work_logs: 'workLogs' };
  var HAS_DELETED = { user_settings: false, labels: false, areas: false, skills: true, clients: true, projects: true, tasks: true, contacts: true, applications: true, goals: true, work_logs: false };

  var state = { status: 'idle', pending: 0, lastError: null, lastFlushAt: null, owner: null, deviceId: null, inFlight: false, enqTimer: null, flushTimer: null };

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
        items.push({ op: o, row: rowFor(table, S, user.id, ent) });
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

  async function flushOnce() {
    if (state.inFlight) return;
    var user = authUser();
    if (!user) { setStatus('paused'); return; }
    var client = await getClient();
    if (!client) { setStatus(navigator && navigator.onLine === false ? 'offline' : 'paused'); scheduleRetry(); return; }
    // isolamento por conta
    var owner = localStorage.getItem(OWNER_KEY) || null;
    if (owner && owner !== user.id) { state.owner = owner; setStatus('paused'); return; }
    if (!owner) { localStorage.setItem(OWNER_KEY, user.id); owner = user.id; }
    state.owner = owner;
    state.inFlight = true;
    try { await doFlush(client, user); }
    catch (e) { setStatus('error', String(e && e.message || e)); }
    finally { state.inFlight = false; }
  }

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
    if (state.flushTimer) return;
    state.flushTimer = setTimeout(function () { state.flushTimer = null; withLock(flushOnce); }, (ms == null ? 1200 : ms));
  }
  function scheduleRetry() {
    var store = readJSON(OUTBOX_KEY, { seq: 0, ops: [] });
    var earliest = null;
    store.ops.forEach(function (o) { if (o.nextAttemptAt && (earliest === null || o.nextAttemptAt < earliest)) earliest = o.nextAttemptAt; });
    var delay = earliest ? Math.max(5000, earliest - Date.now()) : 30000;
    if (state.flushTimer) return; // já agendado
    state.flushTimer = setTimeout(function () { state.flushTimer = null; withLock(flushOnce); }, Math.min(delay, 30000));
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
    var label = { synced: 'Tudo sincronizado.', pending: p + ' alteração(ões) pendente(s).', sending: 'Enviando…', paused: 'Sincronização pausada (conta diferente).', error: 'Erro ao sincronizar: ' + (state.lastError || ''), offline: 'Sem conexão. As alterações ficam na fila.' }[st] || '';
    return '<div class="msg">' + label + '</div>' +
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
    flushNow: function () { withLock(flushOnce); },
    forceFullSync: forceFullSync,
    getState: function () { return { status: state.status, pending: state.pending, lastError: state.lastError, lastFlushAt: state.lastFlushAt, owner: state.owner, deviceId: state.deviceId }; },
    statusHTML: statusHTML,
    _test: {
      enqueueAll: enqueueAll, doFlush: doFlush, hashStr: hashStr, isoMs: isoMs,
      buildBaseline: buildBaseline, readJSON: readJSON, writeJSON: writeJSON,
      OUTBOX_KEY: OUTBOX_KEY, SEEN_KEY: SEEN_KEY, DEVICE_KEY: DEVICE_KEY, OWNER_KEY: OWNER_KEY,
      ORDER: ORDER, HAS_DELETED: HAS_DELETED, S_KEYS: S_KEYS
    }
  };
  window.syncFlushNow = function () { window.__sync.flushNow(); };
  window.syncForceFull = function () { if (confirm('Reenviar todo o estado local para a conta?')) window.__sync.forceFullSync(); };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', function () { scheduleFlush(50); });
    window.addEventListener('offline', function () { setStatus('offline'); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleFlush(100); });
  }
})();
