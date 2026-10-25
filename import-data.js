// =========================================================
// IMPORT-DATA.JS — Fase 3: importação inicial (one-time)
// Lê o estado local S e faz upsert nas tabelas do Supabase,
// na ordem das FKs. Idempotente (onConflict user_id,id).
// NÃO faz sincronização contínua, fila, conflitos nem timer.
// Usa apenas a sessão do usuário autenticado (RLS). Nunca
// usa service_role; o app continua funcionando offline.
// =========================================================
(function () {
  'use strict';

  var ORDER = ['user_settings','labels','areas','skills','clients','projects','tasks','contacts','applications','goals','work_logs'];

  function iso(ms) { return (typeof ms === 'number' && isFinite(ms)) ? new Date(ms).toISOString() : null; }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d == null ? null : d); }
  // Colunas inteiras (integer/smallint/bigint) não aceitam decimais:
  // arredonda para evitar "invalid input syntax for type integer/bigint".
  function int(v, d) { return Math.round(num(v, d)); }
  function text(v, d) { return (v == null || v === '') ? (d == null ? '' : d) : String(v); }
  function nullStr(v) { return (v == null || v === '') ? null : String(v); }
  function arr(v) { return Array.isArray(v) ? v : []; }

  function task(t, uid) {
    var logs = arr(t.logs);
    return {
      user_id: uid, id: t.id,
      title: text(t.t), description: text(t.desc),
      priority: int(t.pr, 1), estimate_minutes: int(t.est, 0),
      spent_minutes: logs.reduce(function (a, l) { return a + int(l.minutes, 0); }, 0),
      day: (t.day == null) ? null : int(t.day, 0),
      sort_order: int(t.order, 0), is_next: !!t.next, done: !!t.done,
      done_at: iso(t.doneAt), area: text(t.area, 'Carreira'),
      skills: arr(t.skills), project_id: nullStr(t.proj),
      due_date: nullStr(t.due), due_time: nullStr(t.time), section: text(t.section),
      subs: arr(t.subs), logs: logs, xp_claimed: !!t.xpClaimed,
      type: text(t.type), color: text(t.color), labels: arr(t.labels),
      postponed_count: int(t.postponedCount, 0), last_postponed_at: iso(t.lastPostponedAt),
      deleted_at: null, client_updated_at: int(t.updatedAt, 0)
    };
  }

  function project(p, uid) {
    return {
      user_id: uid, id: p.id, name: text(p.n), area: text(p.area, 'Carreira'),
      due_date: nullStr(p.due), reward: text(p.reward), claimed: !!p.claimed, archived: !!p.archived,
      client_id: nullStr(p.clientId), legacy_client: text(p.client),
      billing_type: text(p.billingType, 'none'), billing_value: num(p.billingValue, 0),
      actual_value: (p.actualValue == null || p.actualValue === '') ? null : num(p.actualValue, 0),
      completed_at: iso(p.completedAt),
      manual_hours: (p.manualHours == null || p.manualHours === '') ? null : num(p.manualHours, 0),
      currency: text(p.currency, 'BRL'), goals: arr(p.goals),
      deleted_at: iso(p.deletedAt), client_updated_at: int(p.updatedAt, 0)
    };
  }

  function client(c, uid) {
    return { user_id: uid, id: c.id, name: text(c.n), notes: text(c.notes), deleted_at: iso(c.deletedAt), client_updated_at: int(c.updatedAt, 0) };
  }

  function contact(c, uid) {
    return {
      user_id: uid, id: c.id, name: text(c.n), type: text(c.type, 'pro'), category: text(c.cat, 'Prospect'),
      where_: text(c.where), url: text(c.url), role: text(c.role), context: text(c.context),
      interests: text(c.interests), notes: text(c.notes), priority: int(c.priority, 1),
      last_contact: nullStr(c.lastContact), next_contact: nullStr(c.nextContact), next_action: text(c.nextAction),
      cadence: int(c.cadence, 30), archived: !!c.archived, last_conversation: text(c.lastConversation),
      waiting_for: !!c.waitingFor, waiting_since: iso(c.waitingSince), tags: arr(c.tags),
      birthday: text(c.birthday), important_dates: arr(c.importantDates),
      snoozed_until: nullStr(c.snoozedUntil), snooze_reason: text(c.snoozeReason),
      interactions: arr(c.interactions), sent_count: int(c.sentCount, 0), received_count: int(c.receivedCount, 0),
      client_id: nullStr(c.clientId), deleted_at: iso(c.deletedAt), client_updated_at: int(c.updatedAt, 0)
    };
  }

  function application(a, uid) {
    return {
      user_id: uid, id: a.id, client: text(a.client), role: text(a.role), url: text(a.url),
      contact_name: text(a.contactName), contact_info: text(a.contactInfo), platform: text(a.platform),
      area: text(a.area), subarea: text(a.subarea), ticket: num(a.ticket, 0), priority: int(a.priority, 1),
      notes: text(a.notes), stage: text(a.stage, 'prospect'), stage_history: arr(a.stageHistory),
      found_at: iso(a.foundAt) || new Date().toISOString(), applied_at: iso(a.appliedAt), first_response_at: iso(a.firstResponseAt),
      next_follow_up: nullStr(a.nextFollowUp), last_interaction_at: iso(a.lastInteractionAt),
      linked_task_id: nullStr(a.linkedTaskId), project_id: nullStr(a.projectId), interactions: arr(a.interactions),
      deleted_at: iso(a.deletedAt), client_updated_at: int(a.updatedAt, 0)
    };
  }

  function skill(s, uid) {
    return { user_id: uid, id: s.id, name: text(s.n), color: text(s.color, '#9a94a3'), archived: !!s.archived, xp: int(s.xp, 0), sort_order: int(s.order, 0), deleted_at: iso(s.deletedAt), client_updated_at: int(s.updatedAt, 0) };
  }

  function goal(g, uid) {
    return { user_id: uid, id: g.id, title: text(g.t), progress: int(g.p, 0), due_date: nullStr(g.due), deleted_at: iso(g.deletedAt), client_updated_at: int(g.updatedAt, 0) };
  }

  function label(l, uid) {
    return { user_id: uid, id: l.id, name: text(l.n), color: text(l.color), sort_order: int(l.order, 0), client_updated_at: 0 };
  }

  function area(a, uid) {
    return { user_id: uid, id: a.id, name: text(a.n), color: text(a.color), archived: !!a.archived, sort_order: int(a.order, 0), client_updated_at: int(a.updatedAt, 0) };
  }

  function workLog(w, uid) {
    return { user_id: uid, id: w.id, date: nullStr(w.date), ts: iso(w.ts) || new Date().toISOString(), task_id: nullStr(w.taskId), task_title: text(w.taskTitle), project_id: nullStr(w.projectId), project_name: text(w.projName), area: text(w.area), text: text(w.text), client_updated_at: int(w.ts, 0) };
  }

  function cfgForImport(cfg) {
    var c = Object.assign({}, cfg || {});
    delete c.lastBackupAt;
    delete c.backupReminderDismissedAt;
    return c;
  }

  function mapAll(S, uid) {
    var tables = {};
    tables.user_settings = [{
      user_id: uid,
      data: { cfg: cfgForImport(S.cfg), energy: (S.energy || {}), xpPool: int(S.xpPool, 0), commands: arr(S.commands) },
      client_updated_at: int(S.lastModified, 0)
    }];
    tables.labels = arr(S.labels).map(function (l) { return label(l, uid); });
    tables.areas = arr(S.areas).map(function (a) { return area(a, uid); });
    tables.skills = arr(S.skills).map(function (s) { return skill(s, uid); });
    tables.clients = arr(S.clients).map(function (c) { return client(c, uid); });
    tables.projects = arr(S.projects).map(function (p) { return project(p, uid); });
    tables.tasks = arr(S.tasks).map(function (t) { return task(t, uid); });
    tables.contacts = arr(S.contacts).map(function (c) { return contact(c, uid); });
    tables.applications = arr(S.applications).map(function (a) { return application(a, uid); });
    tables.goals = arr(S.goals).map(function (g) { return goal(g, uid); });
    tables.work_logs = arr(S.workLogs).map(function (w) { return workLog(w, uid); });
    return tables;
  }

  function preview(S) {
    var t = mapAll(S, 'x');
    var out = {};
    ORDER.forEach(function (k) { out[k] = (t[k] || []).length; });
    return out;
  }

  function authUser() {
    try { var a = window.__auth && window.__auth.getState ? window.__auth.getState() : null; return (a && a.user && a.user.id) ? a.user : null; } catch (e) { return null; }
  }

  async function getClient() {
    try { return (window.__auth && window.__auth.getClient) ? await window.__auth.getClient() : null; } catch (e) { return null; }
  }

  async function importAll() {
    var user = authUser();
    if (!user) return { error: 'Conecte-se à conta antes de importar.' };
    var client = await getClient();
    if (!client) return { error: 'Serviço indisponível (sem conexão?). O app continua local.' };
    if (typeof S === 'undefined' || !S || !S.tasks) return { error: 'Estado local não encontrado.' };
    var all = mapAll(S, user.id);
    var results = {};
    for (var i = 0; i < ORDER.length; i++) {
      var k = ORDER[i];
      var rows = all[k] || [];
      if (!rows.length) { results[k] = { sent: 0 }; continue; }
      try {
        var onConflict = (k === 'user_settings') ? 'user_id' : 'user_id,id';
        var r = await client.from(k).upsert(rows, { onConflict: onConflict, ignoreDuplicates: false });
        results[k] = r.error ? { error: r.error.message } : { sent: rows.length };
      } catch (e) { results[k] = { error: String(e && e.message || e) }; }
    }
    return { results: results };
  }

  async function verify() {
    var user = authUser();
    if (!user) return { error: 'Não autenticado.' };
    var client = await getClient();
    if (!client) return { error: 'Serviço indisponível.' };
    if (typeof S === 'undefined' || !S) return { error: 'Estado local não encontrado.' };
    var local = preview(S);
    var remote = {};
    for (var i = 0; i < ORDER.length; i++) {
      var k = ORDER[i];
      try {
        var r = await client.from(k).select('id', { count: 'exact', head: true });
        remote[k] = r.error ? { error: r.error.message } : r.count;
      } catch (e) { remote[k] = { error: String(e && e.message || e) }; }
    }
    return { local: local, remote: remote };
  }

  function syncSection() {
    var user = authUser();
    var summary = '';
    try { var p = preview(S); summary = p.tasks + ' tarefas · ' + p.projects + ' projetos · ' + p.contacts + ' contatos · ' + p.work_logs + ' registros'; } catch (e) {}
    if (!user) {
      return '<div class="section-group"><h3 style="margin-top:0">Sincronização</h3><div class="msg">Entre na Conta para importar seus dados locais para o Supabase.</div></div>';
    }
    return '<div class="section-group"><h3 style="margin-top:0">Sincronização</h3>' +
      '<div class="msg">Importação inicial (uma vez): ' + summary + '.</div>' +
      '<div class="acts" style="margin-top:6px"><button data-a="dataImport">Importar dados para a conta</button></div>' +
      '<div class="msg">Repetível e segura: não duplica registros e não apaga nada localmente. A sincronização contínua vem em fases futuras.</div></div>';
  }

  window.__importer = { ORDER: ORDER, mapAll: mapAll, preview: preview, importAll: importAll, verify: verify, _task: task, _project: project, _contact: contact };
  window.syncSection = syncSection;
  window.runDataImport = async function () {
    if (!confirm('Importar seus dados locais para a conta Supabase?\n\nÉ repetível (não duplica) e não apaga os dados locais.')) return;
    if (typeof toast === 'function') toast('Importando…');
    var r = await importAll();
    if (r.error) { if (typeof toast === 'function') toast(r.error, true); return; }
    var ok = 0, errs = 0, firstErr = '';
    Object.keys(r.results || {}).forEach(function (k) {
      if (r.results[k].error) { errs++; if (!firstErr) firstErr = k + ': ' + r.results[k].error; }
      else ok++;
    });
    window.__importer.lastReport = r.results;
    if (typeof toast === 'function') toast(errs ? ('Importação com ' + errs + ' erro(s): ' + firstErr) : 'Importação concluída.');
    if (typeof render === 'function') render();
  };
})();
