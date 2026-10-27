// =========================================================
// MERGE.JS — Fase 5: mapeamento reverso (remoto→local) e
// políticas de merge/conflito. Sem rede; funções puras.
// =========================================================
(function () {
  'use strict';

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d == null ? null : d); }
  function isoMs(v) { if (v == null || v === '') return null; if (typeof v === 'number') return v; var t = Date.parse(v); return isFinite(t) ? t : null; }
  function str(v, d) { return (v == null || v === '') ? (d == null ? '' : d) : String(v); }
  function nullStr(v) { return (v == null || v === '') ? null : String(v); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(36); }

  // LWW determinístico: vence o maior client_updated_at; empate → updated_at (servidor);
  // empate final → 0 (o chamador decide, normalmente o remoto vence).
  function decide(aCu, aU, bCu, bU) {
    var acu = num(aCu, 0), bcu = num(bCu, 0);
    if (acu !== bcu) return acu > bcu ? 1 : -1;
    var au = Date.parse(aU || 0) || 0, bu = Date.parse(bU || 0) || 0;
    if (au !== bu) return au > bu ? 1 : -1;
    return 0;
  }

  function unionById(a, b, keyFn) {
    var map = {};
    arr(a).forEach(function (x) { var k = keyFn(x); if (k != null && k !== '') map[k] = x; });
    arr(b).forEach(function (x) { var k = keyFn(x); if (k != null && k !== '') map[k] = x; }); // b vence no mesmo id
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function workLogId(taskId, date) { return 'wl_' + fnv(String(taskId || '') + '|' + String(date || '')); }
  function workLogKey(taskId, date) { return String(taskId || '') + '|' + String(date || ''); }

  /* ---------- mapeamento reverso (remoto → local) ---------- */
  function fromTask(r) {
    var logs = arr(r.logs);
    return {
      id: r.id, t: str(r.title), desc: str(r.description), pr: num(r.priority, 1),
      est: num(r.estimate_minutes, 0),
      spent: logs.reduce(function (a, l) { return a + num(l.minutes, 0); }, 0),
      day: (r.day == null) ? null : num(r.day, 0), order: num(r.sort_order, 0),
      next: !!r.is_next, done: !!r.done, doneAt: isoMs(r.done_at),
      area: str(r.area, 'Carreira'), skills: arr(r.skills), proj: nullStr(r.project_id) || '',
      due: nullStr(r.due_date) || '', time: nullStr(r.due_time) || '', section: str(r.section),
      subs: arr(r.subs), logs: logs, xpClaimed: !!r.xp_claimed,
      type: str(r.type), color: str(r.color), labels: arr(r.labels),
      createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0),
      postponedCount: num(r.postponed_count, 0), lastPostponedAt: isoMs(r.last_postponed_at)
    };
  }
  function fromProject(r) {
    return {
      id: r.id, n: str(r.name), area: str(r.area, 'Carreira'), due: nullStr(r.due_date) || '',
      reward: str(r.reward), claimed: !!r.claimed, archived: !!r.archived,
      clientId: nullStr(r.client_id) || '', client: str(r.legacy_client),
      billingType: str(r.billing_type, 'none'), billingValue: num(r.billing_value, 0),
      actualValue: (r.actual_value == null) ? null : num(r.actual_value, 0),
      completedAt: isoMs(r.completed_at),
      manualHours: (r.manual_hours == null) ? null : num(r.manual_hours, 0),
      currency: str(r.currency, 'BRL'), goals: arr(r.goals),
      deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0)
    };
  }
  function fromClient(r) { return { id: r.id, n: str(r.name), notes: str(r.notes), deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0) }; }
  function fromContact(r) {
    return {
      id: r.id, n: str(r.name), type: str(r.type, 'pro'), cat: str(r.category, 'Prospect'),
      where: str(r.where_), url: str(r.url), role: str(r.role), context: str(r.context),
      interests: str(r.interests), notes: str(r.notes), priority: num(r.priority, 1),
      lastContact: nullStr(r.last_contact) || '', nextContact: nullStr(r.next_contact) || '', nextAction: str(r.next_action),
      cadence: num(r.cadence, 30), archived: !!r.archived, lastConversation: str(r.last_conversation),
      waitingFor: !!r.waiting_for, waitingSince: isoMs(r.waiting_since), tags: arr(r.tags),
      birthday: str(r.birthday), importantDates: arr(r.important_dates),
      snoozedUntil: nullStr(r.snoozed_until) || '', snoozeReason: str(r.snooze_reason),
      interactions: arr(r.interactions), sentCount: num(r.sent_count, 0), receivedCount: num(r.received_count, 0),
      clientId: nullStr(r.client_id) || '', deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0)
    };
  }
  function fromApplication(r) {
    return {
      id: r.id, client: str(r.client), role: str(r.role), url: str(r.url),
      contactName: str(r.contact_name), contactInfo: str(r.contact_info), platform: str(r.platform),
      area: str(r.area), subarea: str(r.subarea), ticket: num(r.ticket, 0), priority: num(r.priority, 1),
      notes: str(r.notes), stage: str(r.stage, 'prospect'), stageHistory: arr(r.stage_history),
      foundAt: isoMs(r.found_at) || Date.now(), appliedAt: isoMs(r.applied_at), firstResponseAt: isoMs(r.first_response_at),
      nextFollowUp: nullStr(r.next_follow_up) || '', lastInteractionAt: isoMs(r.last_interaction_at),
      linkedTaskId: nullStr(r.linked_task_id) || '', projectId: nullStr(r.project_id) || '', interactions: arr(r.interactions),
      deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0)
    };
  }
  function fromSkill(r) { return { id: r.id, n: str(r.name), color: str(r.color, '#9a94a3'), archived: !!r.archived, xp: num(r.xp, 0), order: num(r.sort_order, 0), deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0) }; }
  function fromGoal(r) { return { id: r.id, t: str(r.title), p: num(r.progress, 0), due: nullStr(r.due_date) || '', deletedAt: isoMs(r.deleted_at), createdAt: isoMs(r.created_at) || Date.now(), updatedAt: num(r.client_updated_at, 0) }; }
  function fromLabel(r) { return { id: r.id, n: str(r.name), color: str(r.color), order: num(r.sort_order, 0) }; }
  function fromArea(r) { return { id: r.id, n: str(r.name), color: str(r.color), archived: !!r.archived, order: num(r.sort_order, 0), updatedAt: num(r.client_updated_at, 0) }; }
  function fromWorkLog(r) {
    return {
      id: r.id, date: nullStr(r.date) || '', ts: num(r.client_updated_at, 0) || isoMs(r.ts) || Date.now(),
      taskId: nullStr(r.task_id) || '', taskTitle: str(r.task_title), projId: nullStr(r.project_id) || '',
      projName: str(r.project_name), area: str(r.area), text: str(r.text)
    };
  }
  // active_timer → S.timer (ou null quando task_id é nulo = "sem sessão").
  function fromTimer(r) {
    if (r == null || r.task_id == null || r.task_id === '') return null;
    return {
      taskId: str(r.task_id), subId: nullStr(r.sub_id) || null,
      startedAt: isoMs(r.started_at), accumulated: num(r.accumulated_seconds, 0),
      paused: !!r.paused, targetMin: (r.target_min == null) ? null : num(r.target_min, 0),
      phase: nullStr(r.phase) || null, focusMin: (r.focus_min == null) ? null : num(r.focus_min, 0),
      restMin: (r.rest_min == null) ? null : num(r.rest_min, 0), cycleCount: num(r.cycle_count, 0),
      updatedAt: num(r.client_updated_at, 0)
    };
  }

  function fromRow(table, row) {
    switch (table) {
      case 'tasks': return fromTask(row);
      case 'projects': return fromProject(row);
      case 'clients': return fromClient(row);
      case 'contacts': return fromContact(row);
      case 'applications': return fromApplication(row);
      case 'skills': return fromSkill(row);
      case 'goals': return fromGoal(row);
      case 'labels': return fromLabel(row);
      case 'areas': return fromArea(row);
      case 'work_logs': return fromWorkLog(row);
      case 'active_timer': return fromTimer(row);
    }
    return null;
  }

  function logKey(l) { return l.id; }
  function subKey(s) { return s.id; }
  function interactionKey(i) { return (i.at || '') + '|' + (i.type || '') + '|' + (i.direction || ''); }
  function stageKey(s) { return (s.stage || '') + '|' + (s.at || ''); }

  function unionLogs(a, b) { return unionById(a, b, logKey); }
  function unionSubs(a, b) {
    var map = {};
    arr(a).forEach(function (s) { if (s.id != null) map[s.id] = s; });
    arr(b).forEach(function (s) {
      if (s.id == null) return;
      if (map[s.id]) {
        var prev = map[s.id];
        var merged = Object.assign({}, prev, s, { logs: unionById(prev.logs, s.logs, logKey) });
        // Tombstone de exclusão: subtarefa excluída não deve "ressuscitar" por uma versão antiga.
        if (prev.deletedAt || s.deletedAt) merged.deletedAt = Math.max(prev.deletedAt || 0, s.deletedAt || 0);
        map[s.id] = merged;
      } else {
        map[s.id] = s;
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  // Merge de uma tarefa: campos escalares por LWW; logs/subs por união (append-only, com tombstone em subs).
  function mergeTask(local, remoteRow) {
    var remote = fromTask(remoteRow);
    if (!local) return remote;
    var d = decide(local.updatedAt, 0, remote.updatedAt, remoteRow.updated_at);
    var base = (d >= 0) ? local : remote; // >=0 → local vence; -1 → remoto vence; empate 0 → local (empate final: local não é pior; escalares idênticos)
    var merged = Object.assign({}, base);
    // Estado de conclusão é "final": versão antiga não reabre uma tarefa já concluída.
    // done:true carrega doneAt; done:false (reaberta) carrega updatedAt — vence o mais recente.
    var ld = !!local.done, rd = !!remote.done;
    if (ld !== rd) {
      var doneSide = ld ? local : remote;
      var notDoneSide = ld ? remote : local;
      var doneAt = num(doneSide.doneAt, 0);
      var notUpd = num(notDoneSide.updatedAt, 0);
      var keepDone = doneAt >= notUpd;
      merged.done = keepDone;
      merged.doneAt = keepDone ? doneAt : null;
    } else if (ld && rd) {
      merged.doneAt = Math.max(num(local.doneAt, 0), num(remote.doneAt, 0));
    }
    merged.logs = unionLogs(local.logs, remote.logs);
    merged.subs = unionSubs(local.subs, remote.subs);
    merged.spent = merged.logs.reduce(function (a, l) { return a + num(l.minutes, 0); }, 0);
    return merged;
  }

  function mergeContact(local, remoteRow) {
    var remote = fromContact(remoteRow);
    if (!local) return remote;
    var d = decide(local.updatedAt, 0, remote.updatedAt, remoteRow.updated_at);
    var base = (d >= 0) ? local : remote;
    var merged = Object.assign({}, base);
    merged.interactions = unionById(local.interactions, remote.interactions, interactionKey);
    return merged;
  }

  function mergeApplication(local, remoteRow) {
    var remote = fromApplication(remoteRow);
    if (!local) return remote;
    var d = decide(local.updatedAt, 0, remote.updatedAt, remoteRow.updated_at);
    var base = (d >= 0) ? local : remote;
    var merged = Object.assign({}, base);
    merged.interactions = unionById(local.interactions, remote.interactions, interactionKey);
    merged.stageHistory = unionById(local.stageHistory, remote.stageHistory, stageKey);
    return merged;
  }

  // mergeEntity(table, localEntityOrNull, remoteRow) → { action:'set'|'delete'|'keep', entity } 
  // 'set' → substitui local por entity; 'delete' → remove local; 'keep' → mantém local.
  function mergeEntity(table, local, remoteRow) {
    // tombstone (deleted_at não nulo) apenas em tabelas com deleted_at
    var hasDeleted = ['tasks','projects','clients','contacts','applications','skills','goals'].indexOf(table) >= 0;
    if (hasDeleted && remoteRow.deleted_at != null) {
      if (!local) return { action: 'keep', entity: null };
      var d = decide(local.updatedAt || 0, 0, num(remoteRow.client_updated_at, 0), remoteRow.updated_at);
      return (d > 0) ? { action: 'keep', entity: local } : { action: 'delete', entity: null };
    }
    var merged;
    if (table === 'tasks') merged = mergeTask(local, remoteRow);
    else if (table === 'contacts') merged = mergeContact(local, remoteRow);
    else if (table === 'applications') merged = mergeApplication(local, remoteRow);
    else {
      var remote = fromRow(table, remoteRow);
      if (!local) return { action: 'set', entity: remote };
      var dd = decide(local.updatedAt || 0, 0, remote.updatedAt || 0, remoteRow.updated_at);
      merged = (dd >= 0) ? local : remote;
    }
    return { action: 'set', entity: merged };
  }

  // Merge de work_logs: dedupe por (task_id, date); vence o mais novo; id determinístico (só quando task_id existe).
  function mergeWorkLog(local, remoteRow) {
    var remote = fromWorkLog(remoteRow);
    if (!local) { if (remote.taskId) remote.id = workLogId(remote.taskId, remote.date); return remote; }
    var d = decide(local.ts || 0, 0, remote.ts || 0, remoteRow.updated_at);
    var winner = (d >= 0) ? local : remote;
    if (winner.taskId) winner.id = workLogId(winner.taskId, winner.date);
    return winner;
  }

  window.__merge = {
    decide: decide, fromRow: fromRow, fromTimer: fromTimer, mergeEntity: mergeEntity, mergeWorkLog: mergeWorkLog,
    workLogId: workLogId, workLogKey: workLogKey,
    unionLogs: unionLogs, unionSubs: unionSubs,
    _test: { fromTask: fromTask, fromProject: fromProject, fromContact: fromContact, fromWorkLog: fromWorkLog, fromTimer: fromTimer }
  };
})();
