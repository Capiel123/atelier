// =========================================================
// APP.JS — Maestro do app
// Liga eventos de clique/tecla/input, inicializa o app,
// registra o Service Worker, cria o FAB e o window.__atelier.
// =========================================================

/* --- AÇÕES QUE MUTAM S (disparam snapshot para Ctrl+Z) --- */
// 💡 Se criar uma nova ação que altere S, adicione o nome aqui — senão o undo não pega.
const MUTATING_ACTIONS = new Set(['tog','stog','log','del','sdel','subUp','cp','padd','pdel','gadd','gdel','skillAdd','skillArch','skillRestore','cAdd','cDel','cArchive','cmdAdd','cmdAddFull','cmdDel','cmdUp','cmdDown','setTaskColor','setnext','moveUp','moveDown','setEnergy','postpone','moveToDay','qaJob','jobAddFull','jobStage','jobApply','jobFollowUp','jobCreateTask','jobDel','reviewJobFollowUp','reviewJobSnooze','reviewComplete','reviewArchive','reviewArchiveProj','reviewContactDone','reviewContactSnooze','reviewSavePriority','contactSend','contactReceive','contactSnooze','contactUnsnooze','contactClearWaiting','contactLog','snoozeApply','toggleTagFilter','clearTagFilter','setTheme','clearCustomAccent','logoRemove','focusDurAdd','focusDurRem','clientAdd','clientDel','pcomplete','puncomplete','histReopen','histCopy','histDel','workLogSave','pgadd','pgtog','pgdel','pgup','pgdown','areaAdd','areaArch','trashRestore','trashDelete','trashEmpty','contactConvert','jobConvert','closeFocusStop','closeFocusConfirm','toggleSection','resetXp']);

/* --- RASTREAR <details> ABERTOS (para persistir após render) --- */
// 💡 Sem isso, cada re-render fecharia o painel "Editar" que o usuário abriu.
document.addEventListener('toggle', ev => {
  if (ev.target.tagName === 'DETAILS' && ev.target.dataset.eid) {
    if (ev.target.open) openEdits.add(ev.target.dataset.eid);
    else openEdits.delete(ev.target.dataset.eid);
  }
}, true);

/* --- CLIQUE (grande roteador de ações) --- */
document.addEventListener('click', ev => {
  // Fechar overlays ao clicar fora deles
  if (ev.target.classList.contains('shortcuts-modal')) {ev.target.remove(); return;}
  if (ev.target.classList.contains('more-sheet')) {hideMoreSheet(); return;}

  const btn = ev.target.closest('[data-a]');
  if (!btn || btn.tagName === 'INPUT' || btn.tagName === 'SELECT') return;
  const a = btn.dataset.a; const id = btn.dataset.id; const i = btn.dataset.i;
  const t = id && T(id); const c = id && S.contacts.find(x => x.id === id);

  // Card da Fila: alterna só quando o clique não é em controle interno nem no corpo expandido
  if (a === 'toggleQueueCard' && ev.target.closest('.queue-body, input, textarea, select, button, a, label, summary, [contenteditable="true"]')) return;

  // Toda ação mutante tira um snapshot ANTES de executar (para Ctrl+Z)
  if (MUTATING_ACTIONS.has(a)) snapshot();

  switch (a) {
    case 'tab': tab = btn.dataset.t; selectedTaskId = null; hideMoreSheet(); break;
    case 'day': day = +i; if (S && S.cfg && S.cfg.sectionsCollapsed) S.cfg.sectionsCollapsed.done = true; break;
    case 'showShortcuts': showShortcutsHelp(); return;
    case 'closeShortcuts': document.getElementById('shortcutsModal')?.remove(); return;
    case 'moreOpen': showMoreSheet(); return;
    case 'closeMore': hideMoreSheet(); return;
    case 'toggleQuickAdd': showQuickAdd = !showQuickAdd; render(); return;
    case 'toggleFilters': showFilters = !showFilters; render(); return;
    case 'toggleWeekSummary': weekSummaryCollapsed = !weekSummaryCollapsed; render(); return;
    case 'setTheme': S.cfg.theme = id; applyTheme(); save(); render(); toast('Tema: ' + THEMES[id].n); return;
    case 'setCustomAccent': return;
    case 'clearCustomAccent': S.cfg.accentColor = null; applyTheme(); save(); render(); toast('Accent do tema restaurado'); return;
    case 'logoRemove': S.cfg.logo = null; save(); applyLogo(); render(); toast('Logo removida'); return;
    case 'focusDurAdd': {const v = +V('focusDurAdd'); if (!v || v < 1) return; if (!S.cfg.focusDurations) S.cfg.focusDurations = []; if (!S.cfg.focusDurations.includes(v)) S.cfg.focusDurations.push(v); S.cfg.focusDurations.sort((a,b)=>a-b); break;}
    case 'focusDurRem': {const m = +btn.dataset.m; S.cfg.focusDurations = (S.cfg.focusDurations||[]).filter(x => x !== m); if (S.cfg.defaultFocus === m) S.cfg.defaultFocus = S.cfg.focusDurations[0] || 25; break;}
    case 'resetXp': {if (!confirm('Resetar XP de todas as habilidades e o pool? Isso não recupera níveis perdidos.')) return; S.xpPool = 0; S.skills.forEach(sk => {sk.xp = 0; touch(sk);}); S.tasks.forEach(t => {t.xpClaimed = false; (t.subs||[]).forEach(sb => {sb.xpClaimed = false;});}); toast('XP zerado'); break;}
    case 'areaAdd': {
      const n = V('newAreaName'); if (!n) return;
      const color = V('newAreaColor') || '#d4a84b';
      S.areas.push({id: uid(), n, color, archived:false, order:S.areas.length, updatedAt:Date.now()});
      break;
    }
    case 'areaArch': {
      const ar = S.areas.find(x => x.id === id); if (!ar) return;
      if (!ar.archived) {
        const using = S.tasks.filter(t => t.area === id && !t.done).length;
        if (using > 0 && !confirm(`${using} tarefa(s) pendente(s) usam esta área. Arquivar mesmo assim?`)) return;
      }
      ar.archived = !ar.archived;
      ar.updatedAt = Date.now();
      break;
    }
    case 'dismissBackup': S.cfg.backupReminderDismissedAt = Date.now(); save(); renderBackupBanner(); return;
    case 'dismissRecovery': recoveryNotice = null; renderBackupBanner(); return;
    case 'restoreSnapshot': {
      const info = readRestorableCopy('snapshot');
      if (!info || info.error) {toast('Cópia automática indisponível', true); return;}
      const when = info.ts ? new Date(info.ts).toLocaleString('pt-BR') : 'data desconhecida';
      if (!confirm(`Restaurar a cópia automática de ${when}?\n\nOs dados atuais serão substituídos. Uma cópia do estado atual será guardada antes.`)) return;
      const res = restoreCopy('snapshot', true);
      if (!res.ok) {
        const msg = res.error === 'storage' ? 'Não foi possível gravar. Seus dados atuais foram mantidos.' : res.error === 'missing' ? 'A cópia não foi encontrada. Nada foi alterado.' : 'A cópia está inválida. Nada foi alterado.';
        toast(msg, true); return;
      }
      applyTheme(); render(); toast('Cópia automática restaurada');
      return;
    }
    case 'restorePrev': {
      const info = readRestorableCopy('prev');
      if (!info || info.error) {toast('Cópia anterior indisponível', true); return;}
      const when = info.ts ? new Date(info.ts).toLocaleString('pt-BR') : 'data desconhecida';
      if (!confirm(`Restaurar a cópia anterior à importação (${when})?\n\nOs dados atuais serão substituídos. Uma cópia do estado atual será guardada antes.`)) return;
      const res = restoreCopy('prev', true);
      if (!res.ok) {
        const msg = res.error === 'storage' ? 'Não foi possível gravar. Seus dados atuais foram mantidos.' : res.error === 'missing' ? 'A cópia não foi encontrada. Nada foi alterado.' : 'A cópia está inválida. Nada foi alterado.';
        toast(msg, true); return;
      }
      applyTheme(); render(); toast('Cópia anterior restaurada');
      return;
    }
    case 'dlCorrupt': {
      const raw = readCorruptContent();
      if (!raw) {toast('Nada preservado', true); return;}
      const fn = 'atelier-conteudo-preservado-' + iso(new Date()) + '.json';
      if (downloadJSON(fn, raw)) toast('Conteúdo preservado baixado');
      else {copyTxt(raw); toast('Conteúdo preservado copiado');}
      return;
    }
    case 'authSendLink': {
      const el = document.getElementById('authEmail');
      const email = ((el && el.value) || '').trim();
      if (!email) {toast('Informe seu e-mail', true); return;}
      if (typeof authSendMagicLink === 'function') authSendMagicLink(email);
      else toast('Autenticação indisponível', true);
      return;
    }
    case 'authLogout': {
      if (typeof authLogout === 'function') authLogout();
      else toast('Autenticação indisponível', true);
      return;
    }
    case 'openSearch': openSearch(); return;
    case 'searchGo': goToSearchResult(btn.dataset.tab, btn.dataset.target); return;
    case 'toggleQueueCard': {
      if (!id) break;
      selectedTaskId = id;
      if (expandedTasks.has(id)) expandedTasks.delete(id);
      else expandedTasks.add(id);
      if (tab === 'q') {
        const ql = document.getElementById('queueList');
        if (ql) ql.innerHTML = dayTasks(null).length ? dayTasks(null).map(t => cardQueue(t)).join('') : '<div class="msg">Fila vazia.</div>';
      } else {
        refreshTaskList();
      }
      return;
    }
    case 'moveToDay': {
      const tt = T(id);
      if (tt) {
        tt.day = +i;
        tt.order = dayTasks(tt.day).length;
        touch(tt);
        save(); render();
        toast('Movida para ' + DAYS[tt.day]);
      }
      break;
    }
    case 'expandTask': {
      if (!id) break;
      if (expandedTasks.has(id)) expandedTasks.delete(id);
      else expandedTasks.add(id);
      refreshTaskList();
      return;
    }
    case 'selectTask': {
      if (!id) break;
      selectedTaskId = id;
      refreshTaskList();
      return;
    }
    case 'expandSubs': {
      if (!id) break;
      expandedSubs.add(id);
      subsCollapsed.delete(id);
      refreshTaskList();
      return;
    }
      case 'collapseSubs': {
      if (!id) break;
      subsCollapsed.add(id);
      expandedSubs.delete(id);
      refreshTaskList();
      return;
    }
    case 'collapseCard': {
      if (!id) break;
      expandedTasks.delete(id);
      expandedSubs.delete(id);
      subsCollapsed.add(id);
      refreshTaskList();
      return;
    }
    case 'expandAll': {      forcedCompact = false;
      expandedTasks.clear();
      expandedSubs.clear();
      subsCollapsed.clear();
      render();
      return;
    }
    case 'collapseAll': {
      forcedCompact = true;
      expandedTasks.clear();
      expandedSubs.clear();
      subsCollapsed.clear();
      render();
      return;
    }
    case 'toggleSection': {
      const sec = btn.dataset.section;
      if (!S.cfg.sectionsCollapsed) S.cfg.sectionsCollapsed = {};
      S.cfg.sectionsCollapsed[sec] = !S.cfg.sectionsCollapsed[sec];
      save(); refreshTaskList();
      return;
    }
    case 'gotoClient': {tab = 'clients'; render(); setTimeout(() => {const el = document.querySelector(`[data-p="clients:${id}:n"]`)?.closest('.client-card'); if (el) {el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight'); setTimeout(() => el.classList.remove('highlight'), 2100);}}, 100); return;}
    case 'gotoProject': {tab = 'proj'; render(); setTimeout(() => {const el = document.querySelector(`[data-p="projects:${id}:n"]`)?.closest('.card'); if (el) {el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight'); setTimeout(() => el.classList.remove('highlight'), 2100);}}, 100); return;}
    case 'clientAdd': {const n = V('clientN'); if (!n) return; S.clients.push(mkClient({n})); break;}
    case 'clientDel': if (!confirm('Excluir cliente? Ele vai para o lixo. Projetos vinculados ficam sem cliente.')) return; softDelete('clients', id); alive(S.projects).forEach(p => {if (p.clientId === id) {p.clientId = ''; touch(p);}}); alive(S.contacts).forEach(ct => {if (ct.clientId === id) {ct.clientId = null; touch(ct);}}); break;
    case 'pcomplete': {const p = S.projects.find(x => x.id === id); if (p && !p.completedAt) {p.completedAt = Date.now(); touch(p); toast('Projeto concluído');} break;}
    case 'puncomplete': {const p = S.projects.find(x => x.id === id); if (p) {p.completedAt = null; touch(p); toast('Reaberto');} break;}
    case 'pgadd': {
      const p = S.projects.find(x => x.id === id); if (!p) break;
      const inp = document.querySelector('[data-pgadd="' + id + '"]');
      const txt = ((inp && inp.value) || '').trim(); if (!txt) break;
      p.goals = p.goals || [];
      p.goals.push({id: uid(), t: txt, d: false, order: p.goals.length});
      touch(p);
      break;
    }
    case 'pgtog': {
      const p = S.projects.find(x => x.id === id); if (!p) break;
      const g = (p.goals || []).find(x => x.id === btn.dataset.g); if (!g) break;
      g.d = !g.d; touch(p);
      break;
    }
    case 'pgdel': {
      const p = S.projects.find(x => x.id === id); if (!p) break;
      p.goals = (p.goals || []).filter(x => x.id !== btn.dataset.g); touch(p);
      break;
    }
    case 'pgup': case 'pgdown': {
      const p = S.projects.find(x => x.id === id); if (!p) break;
      const arr = [...(p.goals || [])].sort((a,b) => (a.order||0) - (b.order||0));
      const idx = arr.findIndex(x => x.id === btn.dataset.g);
      const nidx = idx + (a === 'pgup' ? -1 : 1);
      if (idx < 0 || nidx < 0 || nidx >= arr.length) break;
      [arr[idx], arr[nidx]] = [arr[nidx], arr[idx]];
      arr.forEach((x, ix) => x.order = ix);
      p.goals = arr; touch(p);
      break;
    }
    case 'histReopen': {const tt = T(id); if (tt && tt.done) {tt.done = false; tt.doneAt = null; touch(tt); toast('Tarefa reaberta');} break;}
    case 'histCopy': {const tt = T(id); if (!tt) return; const copy = {...tt, id: uid(), done: false, doneAt: null, xpClaimed: false, next: false, order: 0, spent: 0, logs: [], subs: (tt.subs||[]).map(sb => ({...sb, id: uid(), d:false, xpClaimed:false, logs:[]})), day: todayI(), createdAt: Date.now(), updatedAt: Date.now(), postponedCount: 0}; S.tasks.push(copy); toast('Copiada para hoje'); break;}
    case 'histDel': if (!confirm('Excluir tarefa permanentemente do histórico?')) return; S.tasks = S.tasks.filter(x => x.id !== id); break;
    case 'earnFilter': earningsFilter = btn.dataset.v; render(); return;
    case 'histFilter': historyFilter = btn.dataset.v; render(); return;
    case 'openWorkLog': {openWorkLogSheet(id); return;}
    case 'closeWorkLog': {closeWorkLogSheet(); return;}
    case 'workLogSave': {if (!id) break; saveWorkLog(id, V('wlText')); closeWorkLogSheet(); toast('Resumo salvo'); break;}
    case 'reportOpen': {openReportSheet(); return;}
    case 'closeReport': {closeReportSheet(); return;}
    case 'reportCopy': {const rg = reportWeekRange(); copyTxt(weeklyReportMarkdown(buildWeeklyReport(rg.start, rg.end))); return;}
    case 'reportWeekPrev': {reportWeekOffset--; render(); return;}
    case 'reportWeekNext': {reportWeekOffset++; render(); return;}
    case 'reportWeekToday': {reportWeekOffset = 0; render(); return;}
    case 'tog': {
      if (!t) break;
      if (!t.done) {
        const card = btn.closest('.card');
        const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const completeTask = () => {
          t.done = true; t.doneAt = Date.now(); touch(t);
          if (!isPersonalSection(t)) {
            const xp = taskBaseXp(t);
            toast('+' + xp + ' XP');
          } else {
            toast('Concluída (sem XP)');
          }
          awardTaskXp(t);
          if (t.next) t.next = false;
          if (focusTaskId === t.id) closeFocus();
          save();
          render();
        };

        if (card && !isReduced) {
          card.classList.add('task-completing');
          btn.classList.add('checked');
          btn.textContent = '✓';
          setTimeout(completeTask, 300);
          return;
        } else {
          completeTask();
          return;
        }
      } else {
        t.done = false; t.doneAt = null; touch(t);
        toast('Tarefa reaberta');
        break;
      }
    }
    case 'stog': {if (!t) break; const sb = t.subs[+i]; if (!sb) break; sb.d = !sb.d; if (sb.d && !isPersonalSection(t)) {const xp = subXp(sb, t); if (awardSubXp(t, sb)) toast('+' + xp + ' XP');} else if (sb.d) {awardSubXp(t, sb);} touch(t); break;}
    case 'log': if (!t) break; t.logs.push({id: uid(), minutes: +btn.dataset.m, start: Date.now(), end: Date.now(), subId: null, note: 'manual'}); t.spent = taskMinutes(t); touch(t); break;
    case 'startTimer': if (!t) break; startTimer(t.id, null); return;
    case 'startSubTimer': startTimer(t.id, btn.dataset.sub, S.cfg.defaultFocus || 25); return;
    case 'stopTimer': stopTimer(); return;
    case 'setnext': if (!t) break; if (t.next) {t.next = false; touch(t);} else {S.tasks.forEach(x => {if (x.next) {x.next = false; touch(x);}}); t.next = true; touch(t); toast('⭐');} break;
    case 'moveUp': case 'moveDown': if (!t) break; reorderTask(t, a === 'moveUp' ? -1 : 1); break;
    case 'setTaskColor': if (!t) break; t.color = btn.dataset.color || ''; touch(t); break;
    case 'cp': {if (!t) break; const copy = {...t, id: uid(), done:false, doneAt:null, xpClaimed:false, next:false, order:0, spent:0, logs:[], subs: t.subs.map(sb => ({...sb, id: uid(), d:false, xpClaimed:false, logs:[]})), day: i === 'q' ? null : +i, createdAt: Date.now(), updatedAt: Date.now(), postponedCount: 0}; if (copy.day != null) copy.order = dayTasks(copy.day).length; S.tasks.push(copy); toast('Copiada'); break;}
    case 'del': if (!t) break; S.tasks = S.tasks.filter(x => x.id !== id); break;
    case 'sdel': {if (!t) break; t.subs.splice(+i, 1); touch(t); break;}
    case 'subUp': {if (!t) break; const subs = [...t.subs].sort((a,b) => (a.order||0)-(b.order||0)); const idx = +i; if (idx <= 0) break; [subs[idx-1], subs[idx]] = [subs[idx], subs[idx-1]]; subs.forEach((s, ix) => s.order = ix); t.subs = subs; touch(t); break;}
    case 'qa': {const el = $('#qa'); if (el && el.value.trim()) {addQuick(dv(el.dataset.d), el.value); el.value = '';} break;}
    case 'bulk': {const el = $('#bulk'); if (el && el.value.trim()) {addBulk(dv(btn.dataset.d), el.value); el.value = '';} break;}
    case 'setEnergy': setEnergy(currentEnergySlot(), btn.dataset.e); break;
    case 'toggleLabelsFilter': filterState.showLabels = !filterState.showLabels; render(); return;
    case 'toggleLabelFilter': {const lid = btn.dataset.id; if (filterState.labels.includes(lid)) filterState.labels = filterState.labels.filter(x => x !== lid); else filterState.labels.push(lid); render(); return;}
    case 'clearFilters': filterState = {text:'', type:'', area:'', proj:'', labels:[], showLabels:false}; render(); return;
    case 'focusMode': if (!t) break; openFocus(t.id); return;
    case 'closeFocus': closeFocus(); return;
    case 'closeFocusCancel': document.getElementById('closeFocusModal')?.remove(); return;
    case 'closeFocusStop': document.getElementById('closeFocusModal')?.remove(); stopTimer(); focusTaskId = null; document.getElementById('focusOverlay')?.remove(); return;
    case 'closeFocusConfirm': {
      document.getElementById('closeFocusModal')?.remove();
      const tt = S.tasks.find(x => x.id === S.timer?.taskId);
      const sub = S.timer?.subId && tt?.subs.find(s => s.id === S.timer.subId);
      const lbl = sub ? sub.t : tt?.t || 'tarefa';
      focusTaskId = null;
      document.getElementById('focusOverlay')?.remove();
      toast('Timer continua em ' + lbl.slice(0,30) + ' · ⏸ no topo');
      return;
    }
    case 'focusStart': {
      const task = T(focusTaskId);
      if (!task) break;
      const firstPending = (task.subs||[]).filter(s => !s.d).sort((a,b) => (a.order||0)-(b.order||0))[0];
      startTimer(task.id, firstPending ? firstPending.id : null, focusTargetMin);
      renderFocus();
      return;
    }
    case 'focusPause': pauseTimer(); return;
    case 'focusResume': resumeTimer(); return;
    case 'focusSkip': advancePhase(); return;
    case 'focusStop': stopTimer(); return;
    case 'focusSetTarget': focusTargetMin = +btn.dataset.m; renderFocus(); return;
    case 'focusSelectSub': {
      const task = T(focusTaskId);
      if (!task) break;
      const subId = btn.dataset.sub;
      if (!subId) break;
      if (S.timer && S.timer.taskId === task.id) {
        S.timer.subId = subId;
        save();
        renderTimer();
        renderFocus();
        toast('Etapa alterada');
      } else {
        startTimer(task.id, subId, focusTargetMin);
        renderFocus();
      }
      return;
    }
    case 'qaJob': {const el = $('#qaJob'); if (el && el.value.trim()) {const job = parseJobLine(el.value); if (job) S.applications.push(job); el.value = '';} break;}
    case 'jobAddFull': {const client = V('jClient'); if (!client) {toast('Cliente obrigatório', true); return;} S.applications.push(mkJob({client, role: V('jRole'), url: V('jUrl'), platform: V('jPlatform'), area: V('jArea'), subarea: V('jSubarea'), ticket: +V('jTicket') || 0, priority: +V('jPriority') || 1, contactName: V('jContact'), contactInfo: V('jContactInfo'), notes: V('jNotes')})); break;}
    case 'jobApply': {const app = S.applications.find(x => x.id === id); if (app && app.stage === 'prospect') {changeJobStage(app, 'applied'); toast('✓ Aplicada');} break;}
    case 'jobFollowUp': {const app = S.applications.find(x => x.id === id); if (app) recordJobInteraction(app); break;}
    case 'jobCreateTask': {const app = S.applications.find(x => x.id === id); if (app) createFollowUpTask(app); break;}
    case 'jobConvert': {
      const app = S.applications.find(x => x.id === id); if (!app || app.projectId) break;
      const proj = mkProject({n: `${app.client} — ${app.role || 'Projeto'}`, area: 'Carreira', due: '', reward:'', billingType: app.ticket ? 'fixed' : 'none', billingValue: app.ticket || 0, currency: 'BRL', completedAt: null});
      S.projects.push(proj);
      app.projectId = proj.id; touch(app);
      toast('Projeto criado: ' + proj.n);
      break;
    }
    case 'jobDel': if (!confirm('Excluir vaga? Ela vai para o lixo.')) return; softDelete('applications', id); break;
    case 'reviewJobFollowUp': {const app = S.applications.find(x => x.id === id); if (app) recordJobInteraction(app); break;}
    case 'reviewJobSnooze': {const app = S.applications.find(x => x.id === id); if (app) {const d = new Date(); d.setDate(d.getDate()+7); app.nextFollowUp = iso(d); touch(app);} break;}
    case 'contactView': contactView[btn.dataset.type] = btn.dataset.mode; render(); return;
    case 'toggleTagFilter': {const tp = btn.dataset.type, tag = btn.dataset.tag; const arr = contactFilterState[tp].tags; if (arr.includes(tag)) contactFilterState[tp].tags = arr.filter(x => x !== tag); else contactFilterState[tp].tags.push(tag); render(); return;}
    case 'clearTagFilter': contactFilterState[btn.dataset.type].tags = []; render(); return;
    case 'cAdd': {const type = btn.dataset.type; const n = V('cN_' + type); if (!n) {toast('Nome obrigatório', true); return;} const cad = +V('cCadence_' + type) || (type === 'pro' ? 30 : 21); const tagsStr = V('cTags_' + type) || ''; const tags = tagsStr.split(',').map(x => x.trim()).filter(Boolean); S.contacts.push(mkContact({n, type, cat: V('cCat_' + type) || (type === 'pro' ? 'Prospect' : 'Conhecido'), where: V('cWhere_' + type), url: V('cUrl_' + type), role: V('cRole_' + type), context: V('cContext_' + type), notes: V('cNotes_' + type), lastConversation: V('cLastConv_' + type), cadence: cad, tags})); break;}
    case 'contactSend': {if (!c) break; logInteraction(c, 'out', 'msg', ''); toast('Enviei · +' + (c.cadence || 30) + 'd'); break;}
    case 'contactReceive': {if (!c) break; logInteraction(c, 'in', 'msg', ''); toast('Resposta registrada'); break;}
    case 'contactConvert': {
      if (!c || c.clientId) break;
      const projs = alive(S.clients);
      const name = prompt('Nome do cliente (criar novo ou digitar existente):', c.n);
      if (!name) break;
      let existing = projs.find(x => x.n.toLowerCase() === name.toLowerCase());
      if (existing) {c.clientId = existing.id; touch(c); toast('Vinculado a cliente: ' + existing.n);}
      else {const cl = mkClient({n: name}); S.clients.push(cl); c.clientId = cl.id; touch(c); toast('Cliente criado: ' + name);}
      break;
    }
    case 'contactSnooze': {if (!c) break; showSnoozeMenu(c.id); return;}
    case 'snoozeApply': {if (!c) break; const days = +btn.dataset.days || 7; const reason = btn.dataset.reason || 'other'; snoozeContact(c, days, reason); closeSnoozeMenu(); toast('Adiado ' + days + 'd'); break;}
    case 'contactUnsnooze': {if (!c) break; c.snoozedUntil = ''; c.snoozeReason = ''; touch(c); toast('Adiamento cancelado'); break;}
    case 'contactClearWaiting': {if (!c) break; c.waitingFor = false; c.waitingSince = null; touch(c); toast('Cancelado'); break;}
    case 'contactLog': {if (!c) break; openInteractionSheet(c.id); return;}
    case 'contactOrbitClick': {if (!c) break; const card = document.querySelector(`[data-p="contacts:${c.id}:n"]`)?.closest('.contact-card'); if (card) {card.scrollIntoView({behavior:'smooth', block:'center'}); card.classList.add('highlight'); setTimeout(() => card.classList.remove('highlight'), 2100);} break;}
    case 'cDel': if (!confirm('Excluir contato? Ele vai para o lixo.')) return; softDelete('contacts', id); break;
    case 'cArchive': {if (!c) break; c.archived = !c.archived; touch(c); break;}
    case 'padd': {const n = V('pn'); if (!n) break; S.projects.push(mkProject({n, area: V('pa') || 'Carreira', due: V('pdu'), reward: V('prw'), clientId: V('pclient') || ''})); break;}
    case 'pdel': if (!confirm('Excluir projeto? Ele vai para o lixo.')) return; softDelete('projects', id); break;
    case 'claim': {const p = S.projects.find(x => x.id === id); if (p) {p.claimed = true; touch(p);} break;}
    case 'parch': {const p = S.projects.find(x => x.id === id); if (p) {p.archived = !p.archived; touch(p);} break;}
    case 'cm': cal = new Date(cal.getFullYear(), cal.getMonth() + (+i), 1); break;
    case 'gadd': {const tt = V('gn'); if (tt) S.goals.push(mkGoal({t: tt, due: V('gd')})); break;}
    case 'gdel': if (!confirm('Excluir meta?')) return; softDelete('goals', id); break;
    case 'skillPeriod': skillsFilter = btn.dataset.v; break;
    case 'skillAdd': {const n = V('skillN'); if (!n) break; const newSkill = mkSkill(n, V('skillC') || '#6f8de0'); newSkill.order = S.skills.length; S.skills.push(newSkill); break;}
    case 'skillArch': {const s = S.skills.find(x => x.id === id); if (s) {s.archived = true; touch(s);} break;}
    case 'skillRestore': {const s = S.skills.find(x => x.id === id); if (s) {s.archived = false; touch(s);} break;}
    case 'cmdAdd': {const n = V('cmdN'); if (!n) break; const newCmd = mkCommand(n, V('cmdCat') || 'Geral', ''); newCmd.order = S.commands.length; S.commands.push(newCmd); break;}
    case 'cmdAddFull': {const n = V('cmdN2'); if (!n) break; const newCmd = mkCommand(n, V('cmdCat2') || 'Geral', V('cmdCmd') || '', V('cmdEx') || ''); newCmd.order = S.commands.length; S.commands.push(newCmd); break;}
    case 'cmdDel': S.commands = S.commands.filter(x => x.id !== id); break;
    case 'cmdUp': case 'cmdDown': {const sorted = [...S.commands].sort((a,b) => (a.order||0)-(b.order||0)); const idx = sorted.findIndex(x => x.id === id); const nidx = idx + (a === 'cmdUp' ? -1 : 1); if (idx < 0 || nidx < 0 || nidx >= sorted.length) break; [sorted[idx], sorted[nidx]] = [sorted[nidx], sorted[idx]]; sorted.forEach((x, ix) => x.order = ix); S.commands = sorted; break;}
    case 'reviewToggle': {const check = btn.dataset.check; S.cfg.reviewChecks = S.cfg.reviewChecks || {}; const wIso = iso(weekStart()); if (!S.cfg.reviewChecks[wIso]) S.cfg.reviewChecks[wIso] = {}; S.cfg.reviewChecks[wIso][check] = !S.cfg.reviewChecks[wIso][check]; break;}
    case 'reviewComplete': {const tt = T(id); if (tt) {tt.done = true; tt.doneAt = Date.now(); touch(tt); awardTaskXp(tt);} break;}
    case 'reviewArchive': S.tasks = S.tasks.filter(x => x.id !== id); break;
    case 'reviewArchiveProj': {const p = S.projects.find(x => x.id === id); if (p) {p.archived = true; touch(p);} break;}
    case 'reviewContactDone': {if (c) logInteraction(c, 'out'); break;}
    case 'reviewContactSnooze': {if (c) snoozeContact(c, 7, 'not-a-good-moment'); break;}
    case 'reviewSavePriority': {S.cfg.weekPriority = S.cfg.weekPriority || {}; S.cfg.weekPriority[iso(weekStart())] = {text: V('reviewPriority'), savedAt: Date.now()}; toast('Salvo'); break;}
    case 'closeSnooze': closeSnoozeMenu(); return;
    case 'closeInteraction': closeInteractionSheet(); return;
    case 'trashRestore': {
      const type = btn.dataset.type;
      if (type === 'trash') {
        const tr = (S.trash||[]).find(x => x.task && x.task.id === id);
        if (tr) {S.tasks.push(tr.task); S.trash = S.trash.filter(x => x.id !== tr.id);}
      } else restoreItem(type, id);
      toast('Restaurado');
      break;
    }
    case 'trashDelete': {
      const type = btn.dataset.type;
      if (!confirm('Excluir permanentemente? Não pode ser desfeito.')) return;
      if (type === 'trash') {S.trash = (S.trash||[]).filter(x => !(x.task && x.task.id === id));}
      else hardDelete(type, id);
      toast('Excluído permanentemente');
      break;
    }
    case 'trashEmpty': {
      if (!confirm('Esvaziar lixo? Todos os itens deletados serão removidos permanentemente.')) return;
      if (!confirm('Confirmar mais uma vez: isso não pode ser desfeito.')) return;
      ['projects','clients','contacts','applications','skills','goals'].forEach(k => {S[k] = (S[k]||[]).filter(x => !x.deletedAt);});
      S.trash = [];
      toast('Lixo esvaziado');
      break;
    }
    case 'cpj': copyTxt(JSON.stringify(S)); S.cfg.lastBackupAt = Date.now(); save(); renderBackupBanner(); toast('Copiado'); return;
    case 'dl': {
      const filename = 'atelier-backup-' + iso(new Date()) + '.json';
      const content = JSON.stringify(S, null, 1);

      const fallbackDownload = () => {
        if (!downloadJSON(filename, content)) {
          toast('Download indisponível', true);
          copyTxt(content);
        } else {
          S.cfg.lastBackupAt = Date.now(); save(); renderBackupBanner(); toast('Backup baixado');
        }
      };

      // Mobile moderno: usa navigator.share (menu nativo de "Salvar em…").
      // 💡 Fallback para download tradicional se o navegador não suportar compartilhar arquivos.
      if (navigator.canShare) {
        try {
          const file = new File([content], filename, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({ title: 'Backup Ateliê', files: [file] })
              .then(() => { S.cfg.lastBackupAt = Date.now(); save(); renderBackupBanner(); toast('Backup salvo'); })
              .catch(err => { console.warn(err); fallbackDownload(); });
            return;
          }
        } catch(e) {}
      }
      fallbackDownload();
      return;
    }
    case 'clrDone': if (confirm('Limpar concluídas?')) {S.tasks.filter(t => t.done).forEach(t => {S.trash = S.trash || []; S.trash.unshift({id: uid(), task: JSON.parse(JSON.stringify(t)), deletedAt: Date.now()});}); S.tasks = S.tasks.filter(t => !t.done); if (S.trash.length > 200) S.trash = S.trash.slice(0, 200);} break;
    case 'imp': doImport(V('imp')); return;
    default: return;
  }
  save(); render();
});

/* --- MUDANÇA EM INPUTS/SELECTS (inclusive os data-p) --- */
document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.id === 'logoInput') {
    const file = el.files[0]; if (!file) return;
    if (file.size > 500*1024) {toast('Máx 500KB', true); el.value = ''; return;}
    if (!/^image\/(png|svg\+xml|webp)$/.test(file.type)) {toast('Use PNG, SVG ou WEBP', true); el.value = ''; return;}
    const reader = new FileReader();
    reader.onload = () => {snapshot(); S.cfg.logo = reader.result; save(); applyLogo(); render(); toast('Logo atualizada');};
    reader.onerror = () => toast('Erro ao ler arquivo', true);
    reader.readAsDataURL(file);
    el.value = '';
    return;
  }
  if (el.id === 'importFileInput') {
    const file = el.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { doImport(reader.result); el.value = ''; };
    reader.onerror = () => { toast('Erro ao ler arquivo', true); el.value = ''; };
    reader.readAsText(file);
    return;
  }
  if (el.dataset.areaColor) {const a = S.areas.find(x => x.id === el.dataset.areaColor); if (a) {a.color = el.value; touch(a); save(); render();} return;}
  if (el.dataset.areaName) {const a = S.areas.find(x => x.id === el.dataset.areaName); if (a) {a.n = el.value.trim() || a.n; touch(a); save(); render();} return;}
  if (el.dataset.a === 'setCustomAccent') {snapshot(); S.cfg.accentColor = el.value; applyTheme(); save(); render(); toast('Accent: ' + el.value); return;}
  if (el.id === 'autoPriorityToggle') {S.cfg.autoPriority = el.checked; save(); refreshTaskList(); return;}
  if (el.id === 'filterType') {filterState.type = el.value; refreshTaskList(); return;}
  if (el.id === 'filterArea') {filterState.area = el.value; refreshTaskList(); return;}
  if (el.id === 'filterProj') {filterState.proj = el.value; refreshTaskList(); return;}
  if (el.id === 'jobFilterStage') {jobFilter.stage = el.value; render(); return;}
  if (el.id === 'jobFilterArea') {jobFilter.area = el.value; render(); return;}
  if (el.id && el.id.startsWith('contactCatFilter_')) {const type = el.id.replace('contactCatFilter_',''); contactFilterState[type].cat = el.value; render(); return;}
  if (el.id && el.id.startsWith('contactStatusFilter_')) {const type = el.id.replace('contactStatusFilter_',''); contactFilterState[type].status = el.value; render(); return;}
  if (el.id && el.id.startsWith('contactSortFilter_')) {const type = el.id.replace('contactSortFilter_',''); contactFilterState[type].sort = el.value; render(); return;}
  if (el.dataset.a === 'postpone') {const t = T(el.dataset.id); if (t && el.value) postponeTask(t, el.value); el.value = ''; return;}
  if (el.dataset.a === 'jobStage') {const app = S.applications.find(x => x.id === el.dataset.id); if (app && el.value) {snapshot(); changeJobStage(app, el.value); save(); render();} el.value = ''; return;}
  if (el.dataset.a === 'focusSub') {
    const t = S.tasks.find(x => x.id === focusTaskId);
    if (t) {
      const sb = el.dataset.sub ? (t.subs||[]).find(x => x.id === el.dataset.sub) : t.subs[+el.dataset.i];
      if (sb) {
        sb.d = el.checked;
        if (sb.d) awardSubXp(t, sb);
        if (sb.d && S.timer && S.timer.taskId === t.id && S.timer.subId === sb.id) {
          const nextPending = (t.subs||[]).filter(s => !s.d).sort((a,b)=>(a.order||0)-(b.order||0))[0];
          S.timer.subId = nextPending ? nextPending.id : null;
          renderTimer();
        }
        touch(t);
        save();
        renderFocus();
      }
    }
    return;
  }
  if (el.dataset.c) {
    const key = el.dataset.c;
    if (['autoPriority','focusNoStop'].includes(key)) S.cfg[key] = el.checked;
    else if (key === 'defaultFocus') {S.cfg[key] = +el.value || 25; if (!S.timer) focusTargetMin = S.cfg[key];}
    else if (key === 'usdRate') S.cfg[key] = +el.value || 5.2;
    else if (key === 'eurRate') S.cfg[key] = +el.value || 5.6;
    else if (key === 'primaryCurrency' || key === 'taskDensity') S.cfg[key] = el.value;
    else S.cfg[key] = Math.max(1, +el.value || 1);
    save(); render(); return;
  }
  if (el.dataset.skillTask) {const task = T(el.dataset.skillTask); if (!task) return; task.skills = task.skills || []; if (el.checked) {if (!task.skills.includes(el.dataset.skillId)) task.skills.push(el.dataset.skillId);} else task.skills = task.skills.filter(x => x !== el.dataset.skillId); touch(task); save(); render(); return;}
  if (el.dataset.labelTask) {const task = T(el.dataset.labelTask); if (!task) return; task.labels = task.labels || []; if (el.checked) {if (!task.labels.includes(el.dataset.labelId)) task.labels.push(el.dataset.labelId);} else task.labels = task.labels.filter(x => x !== el.dataset.labelId); touch(task); save(); render(); return;}
  const p = el.dataset.p;
  if (!p) return;
  const [col, id, key] = p.split(':');
  const obj = (S[col] || []).find(x => x.id === id); if (!obj) return;

  snapshot();

  let v = el.value;
  if (el.type === 'number' || el.type === 'range') v = +v || 0;
  if (col === 'tasks' && key === 'pr') v = +v;
  if (col === 'applications' && key === 'priority') v = +v;
  if (col === 'contacts' && key === 'priority') v = +v;
  if (col === 'projects') {
    if (key === 'billingValue' || key === 'actualValue' || key === 'manualHours') {v = (v === '' || v == null) ? null : +v;}
  }
  if (key === 'day') v = dv(v);
  if (key === 'time') v = v || '';
  if (key === 'section') v = v || '';
  if (col === 'contacts' && key === 'tagsStr') {obj.tags = v.split(',').map(x => x.trim()).filter(Boolean);} else {obj[key] = v;}
  touch(obj);
  save(); render();
});

/* --- INPUT (busca/filtros com debounce) --- */
let searchDebounce = null;
document.addEventListener('input', ev => {
  if (ev.target.id === 'searchInput') {
    const q = ev.target.value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => renderSearchResults(q), 150);
    return;
  }
  if (ev.target.id === 'filterText') {filterState.text = ev.target.value; clearTimeout(searchDebounce); searchDebounce = setTimeout(() => refreshTaskList(), 120);}
  if (ev.target.id === 'jobSearch') {jobFilter.text = ev.target.value; clearTimeout(searchDebounce); searchDebounce = setTimeout(() => {render(); const inp = document.getElementById('jobSearch'); if (inp) {inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);}}, 200);}
  if (ev.target.id && ev.target.id.startsWith('contactSearch_')) {const type = ev.target.id.replace('contactSearch_',''); contactFilterState[type].text = ev.target.value; clearTimeout(searchDebounce); searchDebounce = setTimeout(() => {render(); const inp = document.getElementById('contactSearch_' + type); if (inp) {inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);}}, 200);}
});

/* --- ENTER (adicionar rápido) --- */
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter') return;
  const el = ev.target;
  if (el.id === 'searchInput') {
    const first = document.querySelector('.search-result[data-first="1"]');
    if (first) goToSearchResult(first.dataset.tab, first.dataset.target);
    ev.preventDefault();
    return;
  }
  if (el.id === 'qa') {if (el.value.trim()) {addQuick(dv(el.dataset.d), el.value); el.value = ''; save(); render();} ev.preventDefault();}
  else if (el.id === 'qaJob') {if (el.value.trim()) {const job = parseJobLine(el.value); if (job) S.applications.push(job); el.value = ''; save(); render();} ev.preventDefault();}
  else if (el.id === 'clientN') {if (el.value.trim()) {snapshot(); S.clients.push(mkClient({n: el.value.trim()})); el.value=''; save(); render();} ev.preventDefault();}
  else if (el.dataset.a === 'sadd' && el.value.trim()) {const t = T(el.dataset.id); if (t) {t.subs = t.subs || []; t.subs.push({id: uid(), t: el.value.trim(), d:false, xpClaimed:false, est:0, order:t.subs.length, logs:[]}); touch(t); el.value = ''; save(); render();} ev.preventDefault();}
  else if (el.dataset.pgadd && el.value.trim()) {const p = S.projects.find(x => x.id === el.dataset.pgadd); if (p) {p.goals = p.goals || []; p.goals.push({id: uid(), t: el.value.trim(), d:false, order:p.goals.length}); touch(p); el.value = ''; save(); render();} ev.preventDefault();}
});

/* --- ATALHOS GLOBAIS DE TECLADO --- */
document.addEventListener('keydown', ev => {
  const tag = document.activeElement.tagName;
  const isTyping = ['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement.isContentEditable;
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {ev.preventDefault(); openSearch(); return;}
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {if (isTyping) return; ev.preventDefault(); undo(); return;}
  if (isTyping) return;
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches?.('.section-header[data-a]')) {
    ev.preventDefault();
    ev.target.click();
    return;
  }
  if (ev.key === 'n' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {ev.preventDefault(); const qa = document.getElementById('qa') || document.getElementById('qaJob'); if (qa) qa.focus(); return;}
  if (ev.key === 'f' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {ev.preventDefault(); const nt = S.tasks.find(t => t.next && !t.done) || S.tasks.find(t => !t.done && t.day === day); if (nt) openFocus(nt.id); else toast('Sem tarefa pendente'); return;}
  if (ev.key === 'Escape') {
    if (document.getElementById('searchModal')) {closeSearch(); return;}
    if (document.getElementById('closeFocusModal')) {document.getElementById('closeFocusModal').remove(); return;}
    if (focusTaskId) {closeFocus(); return;}
    const sc = document.getElementById('shortcutsModal'); if (sc) {sc.remove(); return;}
    closeSnoozeMenu(); closeInteractionSheet(); closeWorkLogSheet(); closeReportSheet(); hideMoreSheet();
    return;
  }
  if (ev.key === ' ' && focusTaskId) {
    ev.preventDefault();
    const task = T(focusTaskId);
    if (S.timer && S.timer.taskId === focusTaskId) {if (S.timer.paused) resumeTimer(); else pauseTimer();}
    else if (task) {const firstPending = (task.subs||[]).filter(s => !s.d).sort((a,b) => (a.order||0)-(b.order||0))[0]; startTimer(task.id, firstPending ? firstPending.id : null, focusTargetMin); renderFocus();}
    return;
  }
  if (ev.key === '?' || (ev.shiftKey && ev.key === '/')) {ev.preventDefault(); showShortcutsHelp(); return;}
});

/* --- CONTENTEDITABLE DE SUBTAREFAS E METAS (salvar ao perder foco) --- */
document.addEventListener('blur', ev => {
  const el = ev.target;
  if (!el.dataset) return;
  if (el.dataset.pgedit) {
    const [pid, gid] = el.dataset.pgedit.split(':');
    const p = S.projects.find(x => x.id === pid); if (!p) return;
    const g = (p.goals || []).find(x => x.id === gid); if (!g) return;
    const newText = el.textContent.trim();
    if (newText && newText !== g.t) {g.t = newText; touch(p); save();}
    return;
  }
  if (!el.dataset.subedit) return;
  const [tid, sid] = el.dataset.subedit.split(':');
  const t = T(tid); if (!t) return;
  const sb = t.subs.find(x => x.id === sid); if (!sb) return;
  // Remove o prefixo visual "▶ " que aparece quando a subtarefa está rodando
  const newText = el.textContent.trim().replace(/^▶\s*/, '');
  if (newText && newText !== sb.t) {sb.t = newText; touch(t); save();}
}, true);

/* --- MODAL DE INTERAÇÃO (precisa de listener dedicado, criado dinamicamente) --- */
document.addEventListener('click', ev => {
  const btn = ev.target.closest('[data-a="interactionSave"]');
  if (!btn) return;
  const id = btn.dataset.id;
  const c = S.contacts.find(x => x.id === id); if (!c) return;
  snapshot();
  const dir = (document.getElementById('iaDir') || {}).value || 'out';
  const type = (document.getElementById('iaType') || {}).value || 'msg';
  const note = (document.getElementById('iaNote') || {}).value || '';
  logInteraction(c, dir, type, note);
  closeInteractionSheet();
  save(); render();
  toast('Registrada');
}, true);

/* --- IMPORTAÇÃO DE BACKUP --- */
function doImport(text) {
  try {
    if (!text || !text.trim()) {toast('Nada', true); return;}
    const parsed = JSON.parse(text);
    if (!parsed.tasks || !parsed.projects) throw new Error('Estrutura inválida');
    const wasBlocked = recoveryBlocked;
    if (!wasBlocked) backupLocal();
    const migrated = migrate(parsed);
    if (!migrated) throw new Error('Estrutura inválida');
    recoveryBlocked = false; recoveryNotice = null;
    S = migrated; applyTheme(); const ok = save(); autoSnapshotWrite(); render();
    if (ok) toast(wasBlocked ? 'Importado.' : 'Importado. Snapshot anterior em ' + LS_BACKUP);
  } catch(e) {toast('JSON inválido: ' + e.message, true);}
}

/* --- INICIALIZAÇÃO DO APP --- */
(function init() {
  const loaded = loadStateSafely();
  S = loaded.state;
  if (loaded.mode === 'blocked') setSaveState('blocked');
  else {save(); autoSnapshotWrite();}
  applyTheme();
  lastSlot = currentEnergySlot();
  focusTargetMin = S.cfg.defaultFocus || 25;
  applyLogo();
  render();
  // Se havia um timer em andamento antes do reload, retoma e avisa
  if (S.timer) {const elapsed = Math.round(timerElapsedSec() / 60); toast('Timer retomado: ' + elapsed + 'min'); renderTimer();}
  // Sincronização remota opcional (Claude DB) — degrada silenciosamente se indisponível
  if (loaded.mode !== 'blocked') {
    (async () => {
      try {const c = window.claude; if (!c) return; const [u, d] = await Promise.all([c.use('user'), c.use('db')]); if (!u || !d) return; const id = await u.id(); if (!id) return; dbDoc = d.collection('data/users/' + id).doc('app'); const snap = await dbDoc.get(); if (snap.exists && snap.data().json && !dirty) {const remote = migrate(JSON.parse(snap.data().json)); if (remote) {S = remote; applyTheme(); save(); render();}}} catch(e) {}
    })();
    // Evita que o fetch remoto sobrescreva dados locais nos primeiros 500ms
    setTimeout(() => {dirty = false;}, 500);
  }
  // Snapshot automático: ao abrir (acima), periodicamente e ao sair/ocultar a aba
  setInterval(autoSnapshotWrite, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {if (document.visibilityState === 'hidden') autoSnapshotWrite();});
  window.addEventListener('pagehide', () => autoSnapshotWrite());
})();

/* --- API PÚBLICA (console para debug) --- */
window.__atelier = {get S(){return S}, save, render, migrate, seed, undo, contactScore, connectionDepth, xpProgression, applyTheme, THEMES, projectEarnings, clientById, timerElapsedSec, getAreas, areaColor, softDelete, restoreItem, listAllDeleted, levelInfo, taskSection, sectionProgress, taskBaseXp, isPersonalSection, saveWorkLog, workLogsForTask, buildWeeklyReport, weeklyReportMarkdown, reportWeekRange};

/* --- BOTÃO FLUTUANTE (FAB) — só aparece quando há um campo de "nova tarefa" na tela --- */
(function () {
  const f = document.createElement('button');
  f.className = 'fab'; f.id = 'fab'; f.hidden = true; f.textContent = '+';
  f.setAttribute('aria-label', 'Nova tarefa');
  document.body.appendChild(f);
  const find = () => document.getElementById('qa') || document.getElementById('qaJob');
  const canAdd = () => tab === 'week' || tab === 'q' || !!find();
  const sync = () => { f.hidden = !canAdd(); };
  f.addEventListener('click', () => {
    if (tab === 'week') {
      let needRender = false;
      if (!showQuickAdd) { showQuickAdd = true; needRender = true; }
      if (weekSummaryCollapsed) { weekSummaryCollapsed = false; needRender = true; }
      if (needRender) render();
    }
    const q = find();
    if (!q) return;
    q.scrollIntoView({block: 'center', behavior: 'smooth'});
    setTimeout(() => q.focus(), 150);
  });
  // Esconde o FAB enquanto o usuário digita em qualquer input (evita cobrir o teclado)
  document.addEventListener('focusin', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) f.style.display = 'none'; });
  document.addEventListener('focusout', () => { f.style.display = ''; });
  const app = document.getElementById('app');
  if (app) new MutationObserver(sync).observe(app, {childList: true});
  sync();
})();

/* --- PWA: SERVICE WORKER + INDICADOR DE SYNC --- */
(function initPWA() {
  const isHttp = location.protocol === 'http:' || location.protocol === 'https:';

  function setSyncState(state) {
    const p = document.getElementById('syncPill');
    if (!p) return;
    p.dataset.state = state;
    const labels = { saving: 'Salvando…', saved: 'Salvo', error: 'Falha ao salvar', blocked: 'Bloqueado', offline: 'Offline' };
    p.querySelector('.sp-text').textContent = labels[state] || state;
  }

  // Indicador reflete o resultado real de save() (ver estado.js)
  if (typeof onSaveState === 'function') onSaveState(setSyncState);
  setSyncState(saveState);
  window.addEventListener('online', () => refreshSaveState());
  window.addEventListener('offline', () => {if (saveState === 'saved') setSyncState('offline');});
  setTimeout(() => {if (navigator.onLine) refreshSaveState(); else if (saveState === 'saved') setSyncState('offline');}, 400);

  if (!isHttp || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000); // verifica updates 1x/hora

        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(reg);
            }
          });
        });
      })
      .catch((err) => console.warn('[PWA] SW register failed:', err));
  });

  function showUpdateBanner(reg) {
    if (document.getElementById('updateBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.className = 'update-banner';
    banner.innerHTML = `
      <span class="ub-msg">✨ Nova versão disponível</span>
      <button data-pwa="update">Atualizar</button>
      <button data-pwa="dismiss" aria-label="Depois">✕</button>
    `;
    const header = document.querySelector('.wrap > header');
    (header)?.insertAdjacentElement('afterend', banner);

    banner.addEventListener('click', (ev) => {
      const act = ev.target.dataset.pwa;
      if (act === 'update') {
        if (reg.waiting) {
          // Espera o SW novo assumir, depois recarrega (evita loop)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          }, { once: true });
          reg.waiting.postMessage('SKIP_WAITING');
        } else {
          window.location.reload();
        }
      } else if (act === 'dismiss') {
        banner.remove();
      }
    });
  }
})();

/* --- TICKS DE FUNDO (atualizações periódicas) --- */
setInterval(() => {if (S.timer) renderTimer();}, 500);                             // relógio do timer no topo
setInterval(() => {const slot = currentEnergySlot(); if (slot !== lastSlot) {lastSlot = slot; if (S && S.cfg.autoPriority && tab === 'week') refreshTaskList();}}, 60000); // reordena quando muda o período do dia
setInterval(() => {if (!S.timer || S.timer.paused || !S.timer.targetMin) return; if (timerElapsedSec() / 60 >= S.timer.targetMin) advancePhase();}, 800); // troca de fase do pomodoro
setInterval(() => {if (focusTaskId) updateFocusTimer();}, 500);                    // anel do modo foco