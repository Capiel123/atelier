// =========================================================
// INTERFACE.JS — Desenho do app
// Toda a geração de HTML: views, cards, modais, overlays.
// Nada aqui guarda estado — só lê S e devolve strings/DOM.
// =========================================================

/* --- FEEDBACK E AJUDA (utilitários) --- */
function toast(m, isErr) {const t = $('#toast'); t.textContent = m; t.className = 'toast on' + (isErr ? ' err' : ''); clearTimeout(toastTmr); toastTmr = setTimeout(() => t.classList.remove('on'), 2600);}
function copyTxt(s) {const fb = () => {const a = document.createElement('textarea'); a.value = s; document.body.appendChild(a); a.select(); try {document.execCommand('copy');} catch(e) {} a.remove();}; try {if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(() => toast('Copiado')).catch(() => {fb(); toast('Copiado');}); else {fb(); toast('Copiado');}} catch {fb(); toast('Copiado');}}
function downloadJSON(fn, content) {try {const blob = new Blob([content], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => {URL.revokeObjectURL(url); a.remove();}, 200); return true;} catch(e) {return false;}}

/* --- ÍCONES POR IDENTIDADE (v99) ---
   O sprite inline (index.html) tem uma família por tema: #i-<família>-<nome>.
   A família ativa vem de data-icon-set, gravada por applyTheme(). */
function ico(name, cls) {
  const el = document.documentElement;
  const set = (el && el.dataset && el.dataset.iconSet) || 'soft';
  // v100: fallback arquitetural — família sem o símbolo usa `soft`; nunca fica vazio.
  // Em ambiente sem sprite (testes), mantém a família ativa.
  let use = set;
  try {
    if (document.getElementById) {
      const hasFamily = !!document.getElementById('i-' + set + '-' + name);
      const hasSoft = !!document.getElementById('i-soft-' + name);
      if (!hasFamily && hasSoft) use = 'soft';
    }
  } catch (e) { /* mantém a família ativa */ }
  return `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${use}-${name}"/></svg>`;
}

// Seções da Semana: glifo antigo → símbolo do sprite.
const SECTION_ICON = { commitment:'flag', work:'briefcase', personal:'user' };
function sectionIcon(section) {return ico(SECTION_ICON[section] || 'briefcase');}

// v100: mapas dos glifos guardados nas constantes de domínio (estado.js).
// A geometria continua no sprite; aqui só traduzimos o dado antigo para o nome.
const TASK_TYPE_ICON = {criativa:'sparkle',profunda:'focus',admin:'briefcase',comunicacao:'mail',aprendizado:'star',manutencao:'repeat'};
const ENERGY_ICON = {low:'clock',med:'timer',high:'bolt'};
const INTERACTION_ICON = {msg:'mail',call:'bell',email:'mail',meet:'calendar',other:'more'};
const TRASH_ICON = {task:'check',project:'briefcase',client:'user',contact:'mail',application:'mail',skill:'sparkle',goal:'flag'};

// Header, timer e FAB não passam pelo render(); applyTheme() chama esta função.
function refreshStaticIcons() {
  const search = document.querySelector('.search-btn');
  if (search) search.innerHTML = ico('search');
  const stop = document.getElementById('tstop');
  if (stop) stop.innerHTML = ico('pause') + ' Parar';
  const fab = document.getElementById('fab');
  if (fab) fab.innerHTML = ico('plus');
}

/* --- MODAL DE ATALHOS --- */
function showShortcutsHelp() {
  let el = document.getElementById('shortcutsModal');
  if (el) {el.remove(); return;}
  el = document.createElement('div');
  el.id = 'shortcutsModal';
  el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content">
    <h3 style="margin-top:0">Atalhos de teclado</h3>
    <div class="shortcut-row"><span><kbd>Ctrl</kbd> + <kbd>K</kbd></span><span>Buscar global</span></div>
    <div class="shortcut-row"><span><kbd>Ctrl</kbd> + <kbd>Z</kbd></span><span>Desfazer (30 estados)</span></div>
    <div class="shortcut-row"><span><kbd>N</kbd></span><span>Focar em nova tarefa</span></div>
    <div class="shortcut-row"><span><kbd>F</kbd></span><span>Modo foco</span></div>
    <div class="shortcut-row"><span><kbd>Esc</kbd></span><span>Sair do foco / fechar painel</span></div>
    <div class="shortcut-row"><span><kbd>Espaço</kbd></span><span>Iniciar / pausar / retomar (no foco)</span></div>
    <div class="shortcut-row"><span><kbd>Enter</kbd></span><span>Adicionar tarefa / subtarefa</span></div>
    <div class="shortcut-row"><span><kbd>?</kbd></span><span>Este painel</span></div>
    <button data-a="closeShortcuts" style="margin-top:14px;width:100%">Fechar</button>
  </div>`;
  document.body.appendChild(el);
}

/* --- RECUPERAR EXCLUÍDAS DO SERVIDOR (v101) ---
   Sem SQL: lista as linhas com deleted_at recente e restaura as marcadas. */
function openRecoverSheet() {
  let old = document.getElementById('recoverModal');
  if (old) {old.remove(); return;}
  const el = document.createElement('div');
  el.id = 'recoverModal';
  el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content" style="max-width:560px">
    <h3 style="margin-top:0">Recuperar excluídas</h3>
    <div class="msg" id="recoverHint">Buscando itens excluídos no servidor…</div>
    <div id="recoverList" style="max-height:50vh;overflow:auto;margin-top:6px"></div>
    <div class="acts" style="margin-top:12px">
      <button data-a="recoverApply" disabled>Restaurar selecionadas</button>
      <button data-a="closeRecover">Fechar</button>
    </div>
  </div>`;
  document.body.appendChild(el);
  const done = (items) => {
    const box = document.getElementById('recoverList');
    const hint = document.getElementById('recoverHint');
    if (!box || !hint) return;
    if (!items.length) {hint.textContent = 'Nenhum item excluído nos últimos 30 dias.'; return;}
    hint.textContent = 'Marque o que deseja restaurar (últimos 30 dias). Itens excluídos de propósito também aparecem — desmarque-os.';
    box.innerHTML = items.map(it => `<label style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bd)">
      <input type="checkbox" data-recover="${esc(it.table)}:${esc(it.id)}" checked style="margin-top:3px">
      <span style="flex:1"><b>${esc(it.title)}</b><br><span style="font-size:12px;color:var(--mu)">${esc(it.kind)} · ${new Date(it.deletedAt).toLocaleString('pt-BR')}</span></span>
    </label>`).join('');
    const b = document.querySelector('#recoverModal [data-a="recoverApply"]');
    if (b) b.disabled = false;
  };
  const fail = (e) => {
    const hint = document.getElementById('recoverHint');
    if (hint) hint.textContent = 'Não foi possível buscar: ' + (e && e.message ? e.message : 'erro de rede') + '.';
  };
  try {
    if (!window.__sync || !window.__sync.fetchDeleted) throw new Error('Sincronização indisponível');
    window.__sync.fetchDeleted(30).then(done).catch(fail);
  } catch (e) {fail(e);}
}

/* --- VERIFICAR DUPLICADAS (v103) — não apaga nada sem confirmação --- */
function openDuplicatesSheet() {
  let old = document.getElementById('dupesModal');
  if (old) {old.remove(); return;}
  const groups = (typeof findDuplicateGroups === 'function') ? findDuplicateGroups(S.tasks) : [];
  const el = document.createElement('div');
  el.id = 'dupesModal';
  el.className = 'shortcuts-modal';
  let body;
  if (!groups.length) {
    body = '<div class="msg">Nenhuma tarefa duplicada encontrada (mesmo título).</div>';
  } else {
    const list = groups.map(g => {
      const sorted = g.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return `<div style="border-bottom:1px solid var(--bd);padding:8px 0">
        <div style="font-weight:600;margin-bottom:4px">${esc(sorted[0].t)}</div>
        ${sorted.map((t, i) => `<label style="display:flex;gap:8px;align-items:flex-start;padding:3px 0">
          <input type="checkbox" data-dupe="${esc(t.id)}" ${i === 0 ? '' : 'checked'} style="margin-top:2px">
          <span style="flex:1;font-size:12.5px;color:var(--mu)">${t.day == null ? 'Fila' : esc(DAYS[t.day] || '')} · ${esc(t.area || '')} · ${t.done ? 'concluída' : 'pendente'}${i === 0 ? ' · <b style="color:var(--ok)">mais antiga (manter)</b>' : ''}</span>
        </label>`).join('')}
      </div>`;
    }).join('');
    body = `<div class="msg">Marque as cópias que deseja excluir (as mais antigas ficam desmarcadas). Elas vão para o lixo.</div>${list}`;
  }
  el.innerHTML = `<div class="shortcuts-content" style="max-width:560px">
    <h3 style="margin-top:0">Verificar duplicadas</h3>
    ${body}
    <div class="acts" style="margin-top:12px">
      <button data-a="dupesApply" ${groups.length ? '' : 'disabled'}>Excluir selecionadas</button>
      <button data-a="closeDupes">Fechar</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

/* --- BUSCA GLOBAL (overlay) --- */
function openSearch() {
  const el = document.createElement('div');
  el.id = 'searchModal';
  el.className = 'search-modal';
  el.innerHTML = '<div class="search-content"><div class="search-head"><input id="searchInput" placeholder="Buscar em tudo…" value="" autofocus><button type="button" class="icon-x search-close" data-a="closeSearch" aria-label="Fechar busca" title="Fechar busca (Esc)">✕</button></div><div id="searchResults"></div><div class="msg search-hint">Esc ou ✕ fecha · Enter no primeiro resultado</div></div>';
  document.body.appendChild(el);
  setTimeout(() => document.getElementById('searchInput')?.focus(), 30);
  renderSearchResults('');
}
function closeSearch() {document.getElementById('searchModal')?.remove(); searchQuery = '';}
function renderSearchResults(q) {
  searchQuery = q;
  const box = document.getElementById('searchResults');
  if (!box) return;
  if (!q.trim()) {box.innerHTML = '<div class="msg center">Digite para buscar.</div>'; return;}
  const r = globalSearch(q);
  if (!r) return;
  const total = Object.values(r).reduce((a,arr) => a + arr.length, 0);
  if (!total) {box.innerHTML = '<div class="msg center">Nada encontrado.</div>'; return;}
  const groups = [
    ['tasks','Tarefas','check','var(--ac)', t => ({title: t.t, sub: `${areaLabel(t.area)} · ${t.est?t.est+'min':'sem est.'}`, tab:'week', target:`[data-p="tasks:${t.id}:t"]`})],
    ['projects','Projetos','briefcase','#4fb3a2', p => ({title: p.n, sub: areaLabel(p.area), tab:'proj', target:`[data-p="projects:${p.id}:n"]`})],
    ['clients','Clientes','user','var(--ok)', c => ({title: c.n, sub: '', tab:'clients', target:`[data-p="clients:${c.id}:n"]`})],
    ['contacts','Contatos','mail','#e0626a', c => ({title: c.n, sub: `${c.cat} · ${c.type==='pro'?'Rede':'Amizade'}`, tab: c.type==='pro'?'rede':'friends', target:`[data-p="contacts:${c.id}:n"]`})],
    ['applications','Vagas','mail','#c9764a', a => ({title: `${a.client} — ${a.role||''}`, sub: jobStage(a).n, tab:'jobs', target:`[data-p="applications:${a.id}:client"]`})],
    ['skills','Habilidades','sparkle','#a374d4', s => ({title: s.n, sub: '', tab:'skills', target:`[data-p="skills:${s.id}:n"]`})],
    ['goals','Metas','flag','#b8a9c4', g => ({title: g.t, sub: '', tab:'goal', target:`[data-p="goals:${g.id}:t"]`})]
  ];
  let html = '<div class="search-counter">' + groups.filter(([k]) => r[k].length).map(([k,l]) => `${r[k].length} ${l.toLowerCase()}`).join(' · ') + '</div>';
  let first = true;
  groups.forEach(([k, label, icon, color, fmt]) => {
    if (!r[k].length) return;
    html += `<div class="search-group"><div class="search-group-label">${label}</div>`;
    r[k].forEach(item => {
      const info = fmt(item);
      html += `<div class="search-result" data-a="searchGo" data-tab="${info.tab}" data-target="${esc(info.target)}" data-first="${first?'1':'0'}">
        <span class="search-icon" style="color:${color}" aria-hidden="true">${ico(icon)}</span>
        <div class="search-body"><div class="search-title">${esc(info.title)}</div>${info.sub?`<div class="search-sub">${esc(info.sub)}</div>`:''}</div>
      </div>`;
      first = false;
    });
    html += '</div>';
  });
  box.innerHTML = html;
}
function goToSearchResult(tabName, target) {
  closeSearch();
  tab = tabName;
  render();
  // Scroll + highlight após render (pequeno delay para o HTML existir no DOM)
  setTimeout(() => {
    const el = document.querySelector(target)?.closest('.card, .client-card, .contact-card, .job-card');
    if (el) {
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2100);
    }
  }, 120);
}

/* --- BANNER DE BACKUP --- */
function renderBackupBanner() {
  const el = document.getElementById('backupBanner');
  if (!el) return;
  if (recoveryNotice && recoveryNotice.type === 'blocked') {
    el.innerHTML = `<div class="backup-banner"><span>Não foi possível ler os dados salvos neste navegador. O conteúdo original foi preservado e nada foi apagado. Para continuar, importe um backup em Config → Importar.</span><button data-a="tab" data-t="config">Abrir Config</button></div>`;
    return;
  }
  if (recoveryNotice && recoveryNotice.type === 'recovered') {
    const when = new Date(recoveryNotice.ts).toLocaleString('pt-BR');
    el.innerHTML = `<div class="backup-banner"><span>Dados recuperados da cópia automática de segurança de ${when}. Se algo estiver faltando, importe seu backup mais recente.</span><button data-a="dismissRecovery" title="Ocultar">✕</button></div>`;
    return;
  }
  if (!shouldShowBackupReminder()) {el.innerHTML = ''; return;}
  const never = !S.cfg.lastBackupAt;
  const days = never ? 0 : Math.floor((Date.now() - S.cfg.lastBackupAt) / 86400000);
  const text = never ? 'Você ainda não fez backup. Seus dados vivem só neste navegador.' : `Último backup: ${days} dia${days!==1?'s':''} atrás.`;
  el.innerHTML = `<div class="backup-banner"><span>${text}</span><button data-a="dl">Baixar JSON</button><button data-a="dismissBackup" title="Ocultar por 24h">✕</button></div>`;
}

/* --- AVISOS INFORMATIVOS (componente reutilizável) ---
   Markup único: .notice + .notice-text + ação opcional + ✕ de dispensar.
   Nunca use para avisos críticos (save bloqueado, dados ilegíveis, falha de
   sync): esses continuam sem ✕ e sempre visíveis. */
function notice(o) {
  const opts = o || {};
  const id = esc(opts.id || '');
  const tone = opts.tone === 'warn' ? ' notice--warn' : '';
  const label = esc(opts.dismissLabel || 'Dispensar aviso');
  const actions = opts.actions ? `<div class="notice-actions">${opts.actions}</div>` : '';
  const dismiss = opts.dismissible === false ? '' : `<button type="button" class="icon-x notice-dismiss" data-a="dismissNotice" data-notice="${id}" aria-label="${label}" title="${label}">✕</button>`;
  return `<div class="notice${tone}" data-notice="${id}"><div class="notice-text">${opts.html || ''}</div>${actions}${dismiss}</div>`;
}

// Escopo de dispensa por aviso. O de revisão vale para a semana ISO corrente
// (a mesma chave de cfg.reviewChecks); os demais são globais neste dispositivo.
function noticeScopeFor(id, now = new Date()) {
  return id === 'review-hint' ? iso(weekStart(now)) : 'global';
}

// "É dia de revisão semanal": aparece em Mon/Dom enquanto a revisão da semana
// não estiver concluída e o usuário não tiver dispensado o aviso nesta semana.
// Dispensar NÃO marca checks nem altera weekPriority.
function reviewHintHTML(now = new Date()) {
  const wIso = iso(weekStart(now));
  const checks = S.cfg.reviewChecks?.[wIso];
  const checkedCount = Object.keys(checks || {}).filter(k => checks[k]).length;
  const reviewDone = checkedCount >= 4 && S.cfg.weekPriority?.[wIso]?.text;
  if (!reviewDone && [0, 6].includes((now.getDay() + 6) % 7) && !isNoticeDismissed('review-hint', wIso)) {
    return notice({
      id: 'review-hint',
      html: '<b>É dia de revisão semanal.</b> <a href="#" data-a="tab" data-t="review">Abrir →</a>'
    });
  }
  return '';
}

/* --- MENU "MAIS" (mobile) --- */
function showMoreSheet() {
  const el = document.getElementById('moreSheet');
  if (!el) return;
  el.innerHTML = `<div class="more-sheet-panel"><div class="big" style="margin-bottom:8px"><b>Menu</b><button data-a="closeMore" aria-label="Fechar menu" title="Fechar menu">${ico('x')}</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">${TABS.map(t => `<button data-a="tab" data-t="${t[0]}" class="${t[0]===tab?'on':''}" style="padding:12px 8px;font-size:12px;background:var(--s2);border:1px solid var(--bd)">${t[1]}</button>`).join('')}</div></div>`;
  el.classList.add('open');
}
function hideMoreSheet() {document.getElementById('moreSheet')?.classList.remove('open');}

/* --- LISTAS DE ABAS --- */
const TABS = [
  ['week','Hoje'],['q','Fila'],['jobs','Vagas'],['proj','Projetos'],
  ['clients','Clientes'],['earn','Rendimento'],
  ['cal','Prazos'],['goal','Metas'],['skills','Habilidades'],['stats','Stats'],
  ['review','Revisão'],['rede','Rede'],['friends','Amizades'],
  ['history','Histórico'],['cmds','Comandos'],['config','Config']
];
const BOTTOM_TABS = ['week','q','jobs','stats','more'];
const BOTTOM_LABELS = {week:'Hoje',q:'Fila',jobs:'Vagas',stats:'Stats',more:'Mais'};
const BOTTOM_ICONS = {week:'calendar',q:'inbox',jobs:'briefcase',stats:'clock',more:'menu'};

function renderBottomNav() {
  const el = document.getElementById('bottomNav');
  if (!el) return;
  const primary = BOTTOM_TABS.slice(0,-1);
  el.innerHTML = BOTTOM_TABS.map(k => {
    const active = k === 'more' ? !primary.includes(tab) : tab === k;
    return `<button data-a="${k==='more'?'moreOpen':'tab'}" data-t="${k}" class="${active?'on':''}"><span class="bn-icon" aria-hidden="true">${ico(BOTTOM_ICONS[k])}</span><span>${BOTTOM_LABELS[k]}</span></button>`;
  }).join('');
}

/* --- RENDER MESTRE --- */
function render() {
  const gxp = globalXp();
  const info = levelInfo(gxp);
  $('#lvl').innerHTML = `Nível <b>${info.lv}</b> · ${Math.round(gxp)} XP<div class="lb"><div style="width:${info.progress*100}%"></div></div>`;
  $('#nav').innerHTML = TABS.map(t => `<button class="${t[0]===tab?'on':''}" data-a="tab" data-t="${t[0]}">${t[1]}</button>`).join('');
  applyLogo();
  renderBackupBanner();
  $('#app').innerHTML = VIEWS[tab] ? VIEWS[tab]() : '<div class="empty">Aba não encontrada</div>';
  renderBottomNav();
  renderTimer();
}

function applyLogo() {
  const el = $('#logo');
  if (!el) return;
  el.innerHTML = (S.cfg.logo ? `<img src="${esc(S.cfg.logo)}" alt="">` : '') + '<span class="logo-text">ATELIER</span>';
  if (S.cfg.logo) {
    // Favicon dinâmico: usa a logo customizada como ícone da aba
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {fav = document.createElement('link'); fav.rel = 'icon'; document.head.appendChild(fav);}
    fav.href = S.cfg.logo;
  }
}

/* --- BARRA DE PROGRESSO (helper visual) --- */
function bar(p, label, msg) {
  const pct = Math.max(0, Math.min(100, Number(p) || 0));
  const span = pct > 0 ? (10000 / pct).toFixed(2) : '100';
  const lbl = label ? `<span>${label.includes('%') ? label : `${pct}% · ${label}`}</span>` : '';
  return `<div class="bar" data-p="${pct}"><div class="fill" style="width:${pct}%;--bar-span:${span}%"></div>${[25,50,75].map(x => `<i class="${pct>=x?'lit':''}" style="left:${x}%"></i>`).join('')}${lbl}</div>${msg ? `<div class="msg">${msg}</div>` : ''}`;
}

/* Gradiente da barra para as prévias de tema (cards de Config/onboarding). */
function themeBarGradient(t) {
  if (!t) return '';
  if (t.progressGradient) return t.progressGradient;
  if (t.progressType === 'bronze' && t.bronze)
    return `linear-gradient(180deg,color-mix(in srgb,${t.bronze} 72%,white),${t.bronze} 45%,color-mix(in srgb,${t.bronze} 93%,black))`;
  return `linear-gradient(90deg,${t.bu},${t.ac})`;
}

/* v114 — prioridade Nordic como risquinhos inline (3/2/1), sem depender de
   data-dot-shape nem de máscaras antigas. Fora do Nordic, mantém o `.dot` de cor. */
function prMark(pr) {
  let nordic = false;
  try { nordic = !!(typeof S !== 'undefined' && S.cfg && THEMES[S.cfg.theme] && THEMES[S.cfg.theme].family === 'nordic'); } catch (e) {}
  if (!nordic) return `<i class="dot" data-pr="${pr}" style="--pr-c:${PRC[pr]}"></i>`;
  const tx = 'var(--tx)', bd = 'var(--bd)';
  const cols = pr === 0 ? [tx, tx, tx] : pr === 1 ? [tx, tx, bd] : [tx, bd, bd];
  const bg = cols.map((c, i) => `linear-gradient(${c},${c}) ${i * 5}px 0/2px 100% no-repeat`).join(',');
  return `<i class="pr-bars" data-pr="${pr}" aria-hidden="true" style="background:${bg}"></i>`;
}

/* --- DATA REAL DO DIA SELECIONADO (0=Seg … 6=Dom) --- */
function weekDateForDay(dayIndex, refDate = new Date()) {
  const monday = weekStart(refDate);
  const target = new Date(monday);
  target.setDate(target.getDate() + (Number(dayIndex) || 0));
  return target;
}

/* =========================================================
   VIEWS — cada aba tem uma função que devolve HTML
   ========================================================= */

function viewWeek() {
  const ts = dayTasks(day);
  // Escopo da semana: pendentes + concluídas nesta semana, sem as "limpas".
  // Concluídas de semanas anteriores saem dos números (card segue em "Concluídas").
  const activeDayTasks = ts.filter(t => inWeekScope(t));
  const total = activeDayTasks.length;
  const done = activeDayTasks.filter(t => isDoneThisWeek(t)).length;
  const allProg = sectionProgress(activeDayTasks);
  const totalSpent = activeDayTasks.reduce((a,t) => a + taskMinutesThisWeek(t), 0);
  const dayDate = iso(weekDateForDay(day)).split('-').reverse().join('/');
  const cap = S.cfg.cap || 360;
  const full = allProg.totalWeight > cap;
  const nextTask = S.tasks.find(t => t.next && !isDone(t));
  const slot = currentEnergySlot(); const currentE = getTodayEnergy()[slot];
  const slotLabel = {morning:'Manhã', afternoon:'Tarde', evening:'Noite'}[slot];
  const nextCard = nextTask ? `<div class="next-card"><div><div class="nc-label">${ico('star', 'ico--on')} Próxima</div><div class="nc-title">${esc(nextTask.t)}</div><div class="nc-meta">${PR[nextTask.pr]} · ${esc(areaLabel(nextTask.area))}${nextTask.est?' · '+fmtMin(nextTask.est):''}</div></div><div class="nc-actions"><button class="go" data-a="focusMode" data-id="${nextTask.id}">${ico('focus')} Focar</button><button data-a="setnext" data-id="${nextTask.id}" title="Remover da próxima" aria-label="Remover da próxima">${ico('x')}</button></div></div>` : '';
  const compact = getTaskCompactMode();
  const prCounts = [0,1,2].map(pr => activeDayTasks.filter(t => !isDone(t) && t.pr === pr).length);
  const gxp = globalXp(); const lvlInfo = levelInfo(gxp);

  const quickAddHtml = showQuickAdd ? adder(day) : '';
  const filtersHtml = showFilters ? filterBar() : '';
  const controlsRow = `<div class="week-controls-row">
    <button data-a="openQuickAdd" class="week-add-btn">${ico('plus')} Adicionar Tarefa</button>
    <button data-a="toggleFilters" class="week-ctrl-btn${showFilters?' on':''}">${ico('search')} Filtros</button>
    <label class="auto-prio-label week-ctrl-btn"><input type="checkbox" id="autoPriorityToggle" ${S.cfg.autoPriority?'checked':''}><span>${ico('star')} Auto</span></label>
  </div>`;

  // v104 — cabeçalho do dia: 3 modos no MESMO DOM (CSS decide o que aparece).
  const dhMode = getDayHeadMode();
  const energyCollapsed = getEnergyCollapsed();
  const toolsCollapsed = getToolsCollapsed();
  const energyName = (ENERGY_LEVELS.find(x => x.id === currentE) || {}).n || currentE;
  const prevDay = (day + 6) % 7;
  const nextDay = (day + 1) % 7;
  const prInds = prCounts.map((n, i) => `<span class="pr-ind" title="${PR[i]}" style="${n===0?'opacity:.35':''}">${prMark(i)}${n}</span>`).join('');
  const dayHead = `<section class="day-head" data-mode="${dhMode}" role="group" aria-label="Cabeçalho do dia">
    <div class="day-head-row">
      <button class="day-head-arrow day-head-arrow--prev" data-a="day" data-i="${prevDay}" aria-label="Dia anterior" title="Dia anterior">${ico('chevron-down','ico--prev')}</button>
      <button class="day-head-cycle" data-a="dayHeadCycle" aria-expanded="${dhMode !== 'min'}" aria-label="Alternar resumo do dia">
        <span class="th-day"><span class="th-day-full">${DAYS_FULL[day]}</span><span class="th-day-min">${DAYS[day]}</span></span>
        <span class="th-date">${dayDate}</span>
        <span class="day-head-chev" aria-hidden="true">${ico('chevron-down')}</span>
      </button>
      <div class="day-head-meta">
        <span class="dh-time">Gasto <b>${fmtMin(totalSpent)}</b> / Est. <b class="${full?'wr':''}">${fmtMin(allProg.totalWeight)}</b></span>
        <span class="pr-group" title="Prioridade (alta · média · baixa)">${prInds}</span>
      </div>
      <button class="day-head-arrow day-head-arrow--next" data-a="day" data-i="${nextDay}" aria-label="Próximo dia" title="Próximo dia">${ico('chevron-down','ico--next')}</button>
    </div>
    <div class="day-head-lvl"><span class="lvl-ind">Nv ${lvlInfo.lv} · ${Math.round(gxp)} XP</span></div>
    <div class="day-head-bar">${bar(allProg.pct, '', '')}</div>
    <div class="day-head-extra">
      <div class="days">${DAYS.map((d,i) => {const a = dayTasks(i).filter(t => inWeekScope(t)); return `<button class="${i===day?'on':''}" data-a="day" data-i="${i}">${d}${i===todayI()?'<i></i>':''}<small>${a.filter(t=>isDoneThisWeek(t)).length}/${a.length}</small></button>`;}).join('')}</div>
      ${nextCard}
      ${quickAddHtml}
      <div class="day-head-toggles">
        <button class="energy-toggle" data-a="toggleEnergy" aria-expanded="${!energyCollapsed}" title="Mostrar/ocultar níveis de energia">
          <span>Energia · ${esc(slotLabel)}</span><span class="energy-current">${esc(energyName)}</span><span class="energy-chev" aria-hidden="true">${ico('chevron-down')}</span>
        </button>
        <button class="tools-toggle" data-a="toggleTools" aria-expanded="${!toolsCollapsed}" title="Mostrar/ocultar ferramentas">
          ${ico('menu')} Ferramentas <span class="tools-chev" aria-hidden="true">${ico('chevron-down')}</span>
        </button>
      </div>
      ${energyCollapsed ? '' : `<div class="energy-row"><div class="energy-pills">${ENERGY_LEVELS.map(e => `<button data-a="setEnergy" data-e="${e.id}" class="${currentE===e.id?'active':''}">${ico(ENERGY_ICON[e.id] || 'bolt')} ${e.n}</button>`).join('')}</div></div>`}
      ${toolsCollapsed ? '' : `<div class="tools-body">${filtersHtml}${controlsRow}</div>`}
    </div>
  </section>`;

  // Controles: Adicionar (primário) + Filtros + Auto (secundários), na mesma linha
  return `${dayHead}
    ${reviewHintHTML()}
    <div class="tasks-header">
      <h3 style="margin:0">Tarefas <span class="count" id="taskCount"></span></h3>
      <div class="tasks-header-actions" data-all="${getTaskCompactMode() ? 'collapsed' : 'expanded'}" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button data-a="expandAll" style="padding:4px 8px;font-size:12px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:6px;" title="Expandir todos" aria-label="Expandir todos">${ico('chevron-down')} Expandir</button>
        <button data-a="collapseAll" style="padding:4px 8px;font-size:12px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:6px;" title="Recolher todos" aria-label="Recolher todos">${ico('chevron-up')} Recolher</button>
      </div>
    </div>
    <div id="taskList">${renderFilteredTasks()}</div>`;
}

function adder(d) {
  const dd = d ?? '';
  return `<div style="margin-bottom:12px; background:var(--s1); padding:10px; border-radius:12px; border:1px solid var(--bd);">
    <div class="add">
      <input id="qa" data-d="${dd}" placeholder="Nova tarefa rápida… (ex: ~30 !a #proj @14:30)">
      <button data-a="qa" data-d="${dd}" aria-label="Adicionar tarefa">${ico('plus')}</button>
      <button data-a="toggleQuickAdd" title="Fechar" aria-label="Fechar" style="background:transparent; border-color:transparent; color:var(--mu); width:auto; padding:0 8px;">${ico('x')}</button>
    </div>
    <details><summary style="font-size:11px;opacity:0.8">${ico('sparkle')} Dica: atalhos e múltiplas tarefas</summary>
      <div style="font-size:11.5px;color:var(--mu);padding:8px;background:var(--s2);border-radius:8px;margin-top:4px;margin-bottom:8px;line-height:1.5">
        <b>!a</b>, <b>!m</b>, <b>!b</b> → Prioridade (Alta, Média, Baixa)<br>
        <b>~30</b> → Estimativa de tempo (minutos)<br>
        <b>#projeto</b> → Associa a um projeto ativo<br>
        <b>@14:30</b> → Define horário do compromisso
      </div>
      <textarea id="bulk" rows="3" placeholder="Adicionar várias (uma por linha):\nTarefa 1\nTarefa 2 ~45 !a"></textarea>
      <button data-a="bulk" data-d="${dd}" style="width:100%;margin-top:4px">Criar várias</button>
    </details>
  </div>`;
}

function filterBar() {
  const hasLabels = filterState.labels.length > 0;
  const areaOpts = getAreas().map(a => [a.id, a.n]);
  return `<div class="filter-bar" style="margin-bottom:12px;">
    <input id="filterText" placeholder="Filtrar…" value="${esc(filterState.text)}">
    <select id="filterType"><option value="">Tipo</option>${TASK_TYPES.map(tt => `<option value="${tt.id}" ${filterState.type===tt.id?'selected':''}>${tt.n}</option>`).join('')}</select>
    <select id="filterArea"><option value="">Área</option>${areaOpts.map(a => `<option value="${esc(a[0])}" ${filterState.area===a[0]?'selected':''}>${esc(a[1])}</option>`).join('')}</select>
    <select id="filterProj"><option value="">Projeto</option>${alive(S.projects).filter(p=>!p.archived).map(p => `<option value="${p.id}" ${filterState.proj===p.id?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
    <button data-a="toggleLabelsFilter" class="${hasLabels?'on':''}">Labels${hasLabels?' · '+filterState.labels.length:''}</button>
    <button data-a="clearFilters">${ico('x')} Limpar</button>
  </div>
  ${filterState.showLabels ? `<div class="labels-filter">${S.labels.map(l => `<button class="label-pill ${filterState.labels.includes(l.id)?'on':''}" style="--lc:${themeColor(l.color)}" data-a="toggleLabelFilter" data-id="${l.id}">${esc(l.n)}</button>`).join('')}</div>` : ''}`;
}

function getTaskCompactMode() {
  if (forcedCompact !== null) return forcedCompact;
  const d = S.cfg.taskDensity || 'auto';
  if (d === 'compact') return true;
  if (d === 'full') return false;
  return window.innerWidth <= 640;
}

// v94: primeira tarefa PENDENTE da lista visível (mesma ordem e filtros do render).
// O atalho `f` usava `t.next`/`S.tasks` e abria uma tarefa "sem critério".
function firstPendingTaskInList() {
  const ctx = buildCtx();
  let list = dayTasks(day).filter(t => inWeekScope(t) && !isDone(t));
  if (filterState.text) { const q = filterState.text.toLowerCase(); list = list.filter(t => t.t.toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q)); }
  if (filterState.type) list = list.filter(t => t.type === filterState.type);
  if (filterState.area) list = list.filter(t => t.area === filterState.area);
  if (filterState.proj) list = list.filter(t => t.proj === filterState.proj);
  if (filterState.labels.length) list = list.filter(t => filterState.labels.every(lid => (t.labels||[]).includes(lid)));
  const cmp = S.cfg.autoPriority
    ? (a, b) => computeTaskScore(b, ctx) - computeTaskScore(a, ctx) || (a.order||0) - (b.order||0)
    : (a, b) => (a.order||0) - (b.order||0);
  for (const sec of SECTION_ORDER) {
    const items = list.filter(t => taskSection(t) === sec).sort(cmp);
    if (items.length) return items[0];
  }
  return null;
}

function renderFilteredTasks() {
  const ctx = buildCtx();
  const dayList = dayTasks(day);
  let list = dayList;
  if (filterState.text) {const q = filterState.text.toLowerCase(); list = list.filter(t => t.t.toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q));}
  if (filterState.type) list = list.filter(t => t.type === filterState.type);
  if (filterState.area) list = list.filter(t => t.area === filterState.area);
  if (filterState.proj) list = list.filter(t => t.proj === filterState.proj);
  if (filterState.labels.length) list = list.filter(t => filterState.labels.every(lid => (t.labels||[]).includes(lid)));

  // Escopo da semana: pendentes + concluídas nesta semana, sem as "limpas".
  // Concluídas de semanas anteriores não entram nos números (ficam em "Concluídas").
  const plan = list.filter(t => inWeekScope(t));
  const hasFilter = !!(filterState.text || filterState.type || filterState.area || filterState.proj || (filterState.labels || []).length);

  // setTimeout(0) garante que a contagem (#taskCount) atualize após o HTML entrar no DOM
  setTimeout(() => {
    const el = document.getElementById('taskCount');
    if (el) el.textContent = `(${plan.filter(t=>!isDone(t)).length} pend · ${plan.filter(t=>isDone(t)).length} feitas)`;
  }, 0);

  if (!dayList.length) return '<div class="msg">Nada ainda.</div>';
  if (!list.length) return '<div class="msg">Nada com esses filtros.</div>';

  // "Concluídas" lista o que está concluído e não foi limpo — inclusive semanas
  // anteriores (é o histórico do board). Os números usam `plan`/inWeekScope.
  const doneTasks = list.filter(t => isDone(t) && !isClearedFromDone(t));
  const compact = getTaskCompactMode();
  const sectionsCollapsed = S.cfg.sectionsCollapsed || {};

  const sectionsHtml = SECTION_ORDER.map(section => {
    const allItems = plan.filter(t => taskSection(t) === section);
    if (!allItems.length) return '';
    const pendingItems = allItems.filter(t => !isDone(t));
    const meta = sectionMeta(section);
    const collapsed = !!sectionsCollapsed[section];
    const pend = pendingItems.length;
    // Barra da seção na lista reflete o estado persistente (`isDone`); as métricas
    // da semana continuam com `isDoneThisWeek` no summary/dashboard.
    const prog = sectionProgress(allItems, isDone);

    let ordered;
    if (S.cfg.autoPriority) {
      ordered = pendingItems.map(t => ({t, score: computeTaskScore(t, ctx)})).sort((a,b) => b.score - a.score || (a.t.order||0) - (b.t.order||0));
    } else {
      ordered = pendingItems.map(t => ({t, score: null})).sort((a,b) => (a.t.order||0) - (b.t.order||0));
    }

    const headerHtml = `<div class="section-header" data-a="toggleSection" data-section="${section}" role="button" tabindex="0" aria-expanded="${!collapsed}">
      <div class="section-header-title">
        <span class="section-ico" style="--c:${meta.color};font-size:14px">${sectionIcon(section)}</span>
        <b class="section-title" style="--c:${meta.color}">${meta.n}</b>
        <span class="section-header-meta">${pend} pend · ${allItems.length} total</span>
      </div>
      <div class="section-header-right">
        <div class="section-progress"><div style="width:${prog.pct}%;background:${meta.color}"></div></div>
        <span class="section-pct">${prog.pct}%</span>
        <span class="chev">${ico(collapsed ? 'chevron-down' : 'chevron-up')}</span>
      </div>
    </div>`;

    if (collapsed) return headerHtml;
    if (!pendingItems.length) {
      return headerHtml + `<div class="msg" style="font-size:11.5px;color:var(--mu);margin:6px 8px 12px;opacity:0.8">✓ Todas as tarefas de ${meta.n.toLowerCase()} concluídas.</div>`;
    }
    const cardsHtml = ordered.map(({t, score}) => compact && !expandedTasks.has(t.id) ? cardTaskCompact(t, score) : cardTask(t, score)).join('');
    return headerHtml + cardsHtml;
  }).join('');

  let doneSectionHtml = '';
  if (doneTasks.length) {
    const doneCollapsed = S.cfg.sectionsCollapsed?.done ?? true;
    const doneCardsHtml = doneCollapsed ? '' : `
      <div class="done-tasks-list">
        ${doneTasks.map(t => compact && !expandedTasks.has(t.id) ? cardTaskCompact(t, null) : cardTask(t, null)).join('')}
      </div>`;
    doneSectionHtml = `
      <div class="section-header done-section-header" data-a="toggleSection" data-section="done" role="button" tabindex="0" aria-expanded="${!doneCollapsed}" style="margin-top:20px;">
        <div class="section-header-title">
          <span style="color:var(--ok);font-size:14px">✓</span>
          <b style="color:var(--tx)">Concluídas <span class="done-count">(${doneTasks.length})</span></b>
          <span class="section-header-meta">${doneTasks.length} ${doneTasks.length === 1 ? 'concluída' : 'concluídas'}</span>
        </div>
        <div class="section-header-right">
          <button data-a="clrDone" title="Ocultar concluídas da lista" style="padding:3px 9px;font-size:11px;background:transparent;border:1px solid var(--bd);border-radius:6px;color:var(--mu);cursor:pointer">Limpar concluídas</button>
          <span class="chev">${ico(doneCollapsed ? 'chevron-down' : 'chevron-up')}</span>
        </div>
      </div>
      ${doneCardsHtml}`;
  }

  return (sectionsHtml + doneSectionHtml) || (hasFilter
    ? '<div class="msg">Nada com esses filtros.</div>'
    : '<div class="msg">Nada planejado para esta semana.</div>');
}

function refreshTaskList() {const el = document.getElementById('taskList'); if (el) el.innerHTML = renderFilteredTasks();}

/* --- ATUALIZAÇÕES PARCIAIS DO CARD (foco e performance) --- */
// Troca só a lista de subtarefas do card (sem recriar #app), mantendo o input
// de adição vivo. Para cards ainda sem .subs, insere a lista depois da barra.
function refreshTaskSubs(taskId) {
  const t = T(taskId);
  const card = document.querySelector(`[data-card="${taskId}"]`);
  if (!t || !card) return false;
  const oldBadge = card.querySelector(':scope > .subs-badge');
  const subsEl = card.querySelector('.subs');
  if (subsEl) {
    subsEl.outerHTML = renderSubs(t);
  } else {
    const queueBody = card.querySelector('.queue-body');
    const toolbar = card.querySelector(':scope > .card-toolbar');
    if (queueBody) {
      const acts = queueBody.querySelector('.acts');
      if (!acts) return false;
      acts.insertAdjacentHTML('beforebegin', renderSubs(t));
    } else if (toolbar) {
      toolbar.insertAdjacentHTML('afterend', renderSubs(t));
    } else {
      return false;
    }
  }
  // Havia um badge "n/m subs" no lugar da lista (subtarefas recolhidas);
  // com a lista recém-inserida ele ficaria duplicado.
  if (oldBadge && oldBadge.isConnected) oldBadge.remove();
  const actives = activeSubs(t); const done = actives.filter(s => s.d).length;
  const qCount = card.querySelector('.queue-subcount');
  if (qCount) { qCount.textContent = actives.length ? `${done}/${actives.length} sub` : ''; qCount.style.display = actives.length ? '' : 'none'; }
  return true;
}

// Re-renderiza apenas um card da view atual (Semana ou Fila).
function refreshTaskCard(taskId) {
  const t = T(taskId);
  const el = document.querySelector(`[data-card="${taskId}"]`);
  if (!t || !el) return false;
  const score = isDone(t) ? null : (S.cfg.autoPriority ? computeTaskScore(t, buildCtx()) : null);
  el.outerHTML = tab === 'q'
    ? cardQueue(t)
    : (getTaskCompactMode() && !expandedTasks.has(t.id) ? cardTaskCompact(t, score) : cardTask(t, score));
  return true;
}

// Devolve o foco ao input de subtarefa e coloca o cursor no fim.
// Usado depois de adicionar uma sub (o teclado do mobile não deve fechar).
function focusSubAddInput(taskId) {
  setTimeout(() => {
    const inFocus = typeof focusTaskId !== 'undefined' && focusTaskId === taskId && document.getElementById('focusOverlay');
    let inp = document.querySelector(inFocus ? '#focusOverlay [data-a="sadd"]' : `[data-card="${taskId}"] [data-a="sadd"]`);
    if (!inp) inp = document.querySelector(`[data-a="sadd"][data-id="${taskId}"]`);
    if (!inp) return;
    try { inp.focus({preventScroll:true}); } catch (e) { inp.focus(); }
    const end = inp.value.length;
    try { inp.setSelectionRange(end, end); } catch (e) {}
  }, 0);
}

// Renderiza pills de habilidades/labels com limite visual. As selecionadas
// aparecem primeiro; o restante fica sob "+ Editar" (sem perder os checkboxes).
const PILL_VISIBLE_LIMIT = 6;
function pillPicker(items, selectedIds, kind, taskId) {
  const selected = new Set(selectedIds || []);
  const ordered = items.slice().sort((a, b) => (selected.has(b.id) ? 1 : 0) - (selected.has(a.id) ? 1 : 0));
  const visible = ordered.slice(0, PILL_VISIBLE_LIMIT);
  const rest = ordered.slice(PILL_VISIBLE_LIMIT);
  const group = `${taskId}:${kind}`;
  const open = rest.length && openPillGroups.has(group) ? ' open' : '';
  const pill = x => `<label><input type="checkbox" data-${kind}-task="${taskId}" data-${kind}-id="${x.id}" ${selected.has(x.id)?'checked':''}><span style="--pc:${x.color}">${esc(x.n)}</span></label>`;
  return `<div class="pill-stack">${visible.map(pill).join('')}</div>${rest.length ? `<details class="pill-more" data-pill-group="${group}"${open}><summary>+ Editar (${rest.length})</summary><div class="pill-stack">${rest.map(pill).join('')}</div></details>` : ''}`;
}

function cardTaskCompact(t, score) {
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id)).filter(Boolean);
  const borderColor = themeColor(t.color || (skillObjs[0]?.color) || areaColor(t.area));
  const spent = taskMinutes(t);
  const isQuick = t.est && t.est <= 10;
  const runningThis = S.timer && S.timer.taskId === t.id;
  const _as = activeSubs(t); const subsTotal = _as.length; const subsDone = _as.filter(s => s.d).length;
  const isSelected = selectedTaskId === t.id;
  const doneNow = isDone(t);
  return `<div class="card compact ${doneNow?'done':''} ${t.next?'next-card-in':''} ${isSelected?'selected':''}" style="--c:${borderColor}" data-card="${t.id}" data-a="expandTask" data-id="${t.id}">
    <div class="row" style="align-items:center; width:100%;">
      <button class="chk" data-a="tog" data-id="${t.id}">${doneNow?'✓':''}</button>
      <div class="ti">
        <div class="compact-tt">${t.time?`<span style="color:var(--wr)">${ico('clock')} ${esc(t.time)} </span>`:''}${esc(t.t)}</div>
        <div class="compact-meta">
          ${prMark(t.pr)}
          <span>${fmtMin(spent)}${t.est?'/'+fmtMin(t.est):''}</span>
          ${subsTotal?`<span>· ${subsDone}/${subsTotal} sub</span>`:''}
          ${isQuick?`<span style="color:var(--mu)">${ico('bolt')}</span>`:''}
          ${t.next?`<span style="color:var(--ac)">${ico('star', 'ico--on')}</span>`:''}
          ${runningThis?`<span style="color:var(--bu)">${ico('play')}</span>`:''}
        </div>
      </div>
      <span class="chev">${ico('chevron-down')}</span>
    </div>
  </div>`;
}

function cardTask(t, score) {
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id)).filter(Boolean);
  const borderColor = themeColor(t.color || (skillObjs[0]?.color) || areaColor(t.area));
  const type = TASK_TYPES.find(x => x.id === t.type); const proj = S.projects.find(p => p.id === t.proj);
  const spent = taskMinutes(t); const pctT = t.est ? Math.min(100, Math.round(spent / t.est * 100)) : 0;
  const subsTotal = activeSubs(t).length;
  const runningThis = S.timer && S.timer.taskId === t.id && !S.timer.subId;
  const isQuick = t.est && t.est <= 10;
  const labels = (t.labels||[]).map(lid => S.labels.find(l => l.id === lid)).filter(Boolean);
  const stuck = isStuck(t); const urgentStuck = isUrgentStuck(t); const over = isOverEstimate(t);
  const k = f => `tasks:${t.id}:${f}`;
  const isSelected = selectedTaskId === t.id;
  const doneNow = isDone(t);
  // Estado 2 (comprimido): subs recolhidas pelo cabeçalho "Fases"; o card
  // continua expandido (barra de ações visível), mas sem a lista e sem detalhes.
  const subsCollapsedNow = subsTotal > 0 && subsCollapsed.has(t.id);
  const scoreTip = score != null ? scoreBreakdown(t, buildCtx()) : '';
  // Sinalizadores aparecem na toolbar (desktop) e, no mobile, junto da linha
  // de labels para não gastar uma faixa vertical só com a pontuação.
  const flagsHtml = `${stuck ? `<span class="postpone-badge ${urgentStuck?'urgent':'stuck'}">${ico('repeat')} ${t.postponedCount}x</span>` : ''}${over ? `<span class="parkinson-badge">${ico('timer')} 2×</span>` : ''}${score != null ? `<span class="score-badge ${scoreClass(score)}" title="${esc(scoreTip)}">${score}</span>` : ''}`;

  return `<div class="card ${doneNow?'done':''} ${t.next?'next-card-in':''} ${isSelected?'selected':''}" style="--c:${borderColor}" data-card="${t.id}">
    <div class="row task-header" data-a="expandTask" data-id="${t.id}">
      <button class="chk" data-a="tog" data-id="${t.id}">${doneNow?'✓':''}</button>
      <div class="ti" data-a="expandTask" data-id="${t.id}" style="cursor:pointer;">
        <div class="tt">${type ? `<span class="type-icon ${type.id}" aria-hidden="true">${ico(TASK_TYPE_ICON[type.id] || 'flag')}</span>` : ''}<span class="tt-title-text">${esc(t.t)}</span><button type="button" class="tt-edit" data-a="editInline" data-kind="title" data-id="${t.id}" title="Editar título" aria-label="Editar título">${ico('edit')}</button>${isQuick ? `<span class="quick-ind">${ico('bolt')}</span>` : ''}${t.time ? `<span class="tag" style="color:var(--wr)">${ico('clock')} ${esc(t.time)}</span>` : ''}</div>
        ${t.desc ? `<div class="tdesc">${esc(t.desc)}</div>` : ''}
        <div class="meta">${prMark(t.pr)}${PR[t.pr]}<span class="tag tag-area" style="--c:${areaColor(t.area)}">${esc(areaLabel(t.area))}</span>${flagsHtml ? `<span class="task-flags task-flags--inline">${flagsHtml}</span>` : ''}${skillObjs.map(s => `<span class="tag tag-skill" style="--c:${themeColor(s.color)}">${esc(s.n)}</span>`).join('')}${proj ? `<span class="tag">${esc(proj.n)}</span>` : ''}${t.due ? `<span class="tag">prazo ${fmtDate(t.due)}</span>` : ''}${t.next ? `<span class="tag" style="color:var(--ac)">${ico('star', 'ico--on')}</span>` : ''}${labels.slice(0,4).map(l => `<span class="label-pill" style="--lc:${themeColor(l.color)}">${esc(l.n)}</span>`).join('')}${labels.length>4 ? `<span class="label-pill">+${labels.length-4}</span>` : ''}</div>
      </div>
      <div class="tm" data-a="expandTask" data-id="${t.id}" style="cursor:pointer;">
        <div class="tm-time"><b>${fmtMin(spent)}</b><span class="tm-sep">/</span><button type="button" class="tm-est" data-a="editInline" data-kind="est" data-id="${t.id}" title="Editar tempo estimado" aria-label="Editar tempo estimado">${t.est ? fmtMin(t.est) : '—'}</button><span class="tm-chev" aria-hidden="true">${ico('chevron-up')}</span></div>
        <div class="mini"><div style="width:${pctT}%;--bar-span:${pctT>0?(10000/pctT).toFixed(2):100}%"></div></div>
      </div>
    </div>

    <div class="card-toolbar">
      ${flagsHtml ? `<div class="task-flags">${flagsHtml}</div>` : ''}
      <div class="acts">
      <div class="timer-segmented-bar">
        <div class="act-group act-play">
          ${runningThis ? `<button data-a="stopTimer" class="act-main" style="background:var(--bu)" title="Pausar timer" aria-label="Pausar timer">${ico('pause')}</button>` : `<button data-a="startTimer" data-id="${t.id}" class="act-main" ${S.timer?'disabled':''} title="Iniciar timer" aria-label="Iniciar timer">${ico('play')}</button>`}
          <button data-a="focusMode" data-id="${t.id}" class="act-icon" title="Modo foco" aria-label="Modo foco">${ico('focus')}</button>
        </div>
        <div class="time-stepper" role="group" aria-label="Ajustar tempo">
          <button data-a="log" data-id="${t.id}" data-m="-5" title="Menos 5 minutos">−5m</button>
          <span class="time-stepper-value" title="Gasto / estimado">${fmtMin(spent)}${t.est?'/'+fmtMin(t.est):''}</span>
          <button data-a="log" data-id="${t.id}" data-m="5" title="Mais 5 minutos">+5m</button>
        </div>
        <select class="postpone-sel" data-a="postpone" data-id="${t.id}" aria-label="Adiar tarefa"><option value="">→ adiar</option><option value="1">amanhã</option><option value="7">+7d</option><option value="queue">fila</option></select>
      </div>
      <details class="act-menu copy-menu">
        <summary title="Copiar para dia" aria-label="Copiar para dia">${ico('copy')}</summary>
        <div class="act-menu-panel">
          ${DAYS.map((d,di) => `<button data-a="cp" data-id="${t.id}" data-i="${di}">${d}</button>`).join('')}
          <button data-a="cp" data-id="${t.id}" data-i="q">Fila</button>
        </div>
      </details>
      <button data-a="setnext" data-id="${t.id}" title="Próxima tarefa" aria-label="Próxima tarefa">${ico('star', t.next ? 'ico--on' : '')}</button>
      <button data-a="del" data-id="${t.id}" class="act-del" title="Excluir tarefa" aria-label="Excluir tarefa">${ico('trash')}</button>
      <details class="act-menu task-more-menu">
        <summary title="Mais ações" aria-label="Mais ações">${ico('more')}</summary>
        <div class="act-menu-panel">
          <button data-a="moveUp" data-id="${t.id}" title="Subir">${ico('arrow-up')} Subir</button>
          <button data-a="moveDown" data-id="${t.id}" title="Descer">${ico('arrow-down')} Descer</button>
          ${doneNow ? `<button data-a="openWorkLog" data-id="${t.id}" title="Registrar/editar resumo do trabalho">${ico('edit')} Resumo</button>` : ''}
          <button data-a="openTaskDetails" data-id="${t.id}">${ico('edit')} Editar detalhes</button>
        </div>
      </details>
      </div>
    </div>

    ${renderSubs(t)}

    ${subsCollapsedNow ? '' : `<details data-eid="${t.id}" ${openEdits.has(t.id)?'open':''}>
      <summary>Editar detalhes</summary>
      <div class="form"><label>Prioridade<select data-p="${esc(k('pr'))}">${selOptions(PR.map((x,i)=>[i,x]), t.pr)}</select></label><label>Tipo<select data-p="${esc(k('type'))}">${selOptions([['','—'],...TASK_TYPES.map(x=>[x.id,x.n])], t.type)}</select></label><label>Área<select data-p="${esc(k('area'))}">${selOptions(taskAreaOptions(t), t.area)}</select></label><label>Projeto<select data-p="${esc(k('proj'))}">${selOptions([['','—'],...alive(S.projects).map(p=>[p.id,p.n])], t.proj)}</select></label><label>Estimativa<input type="number" data-p="${esc(k('est'))}" value="${t.est||0}"></label><label>Hora (compromisso)<input type="time" data-p="${esc(k('time'))}" value="${esc(t.time||'')}"></label><label>Seção<select data-p="${esc(k('section'))}">${selOptions([['','Auto'],['work','Trabalho'],['commitment','Compromisso'],['personal','Pessoal']], t.section||'')}</select></label><label>Dia<select data-p="${esc(k('day'))}">${selOptions([['','Fila'],...DAYS.map((d,i)=>[i,d])], t.day??'')}</select></label><label>Prazo<input type="date" data-p="${esc(k('due'))}" value="${esc(t.due||'')}"></label><label class="full">Habilidades${pillPicker(alive(S.skills).filter(s=>!s.archived), t.skills||[], 'skill', t.id)}</label><label class="full">Labels${pillPicker(S.labels, t.labels||[], 'label', t.id)}</label><label class="full">Título${inp(k('t'), t.t)}</label><label class="full">Descrição<textarea data-p="${esc(k('desc'))}" rows="2">${esc(t.desc||'')}</textarea></label><label class="full">Cor<div class="color-picker-row"><div class="color-dot ${!t.color?'selected':''}" style="background:transparent;border:1px dashed var(--bd)" data-a="setTaskColor" data-id="${t.id}" data-color="">⊘</div>${COLOR_PALETTE.map(p => `<div class="color-dot ${t.color===p.c?'selected':''}" style="background:${p.c}" title="${p.n}" data-a="setTaskColor" data-id="${t.id}" data-color="${p.c}"></div>`).join('')}</div></label></div>
    </details>`}
  </div>`;
}

function taskAreaOptions(t) {
  const active = getAreas();
  const activeIds = active.map(a => a.id);
  const opts = active.map(a => [a.id, a.n]);
  // Se a tarefa usa uma área arquivada, inclui como opção extra (para não "perder" o valor no select)
  if (t.area && !activeIds.includes(t.area)) {
    const all = (S.areas||[]).find(a => a.id === t.area);
    opts.push([t.area, (all?.n || t.area) + ' (arquivada)']);
  }
  return opts;
}

function renderSubs(t) {
  const SUBS_VISIBLE_LIMIT = 5;
  const runningSub = S.timer && S.timer.taskId === t.id ? S.timer.subId : null;
  const actives = activeSubs(t);
  const subsDone = actives.filter(s => s.d).length;
  const subsTotal = actives.length;
  const subPct = subsTotal ? Math.round(subsDone / subsTotal * 100) : 0;
  // Estado 3 (completo) é o padrão ao expandir o card. Clicar no cabeçalho
  // "Fases" recolhe para o estado 2: só a contagem, sem lista/adição/detalhes.
  const collapsed = subsTotal > 0 && subsCollapsed.has(t.id);
  const showAll = subsShowAll.has(t.id) || subsTotal <= SUBS_VISIBLE_LIMIT;
  const visibleSubs = collapsed ? [] : (showAll ? actives : actives.slice(0, SUBS_VISIBLE_LIMIT));
  const hiddenCount = subsTotal - visibleSubs.length;
  const canHide = !collapsed && subsTotal > SUBS_VISIBLE_LIMIT && showAll;
  const rowsHtml = visibleSubs.map((s) => {
    const mins = subMinutes(t, s.id); const isRunning = runningSub === s.id;
    return `<div class="sub ${isRunning?'run':''}" data-subrow="${t.id}:${s.id}"><span class="sub-drag" draggable="true" data-dragsub="${t.id}:${s.id}" title="Arrastar para reordenar" aria-hidden="true">${ico('more','ico--drag')}</span><button class="chk s" data-a="stog" data-id="${t.id}" data-sub="${s.id}">${s.d?'✓':''}</button><span class="sub-txt ${s.d?'x':''}" contenteditable="true" data-subedit="${t.id}:${s.id}">${isRunning?`<span contenteditable="false" class="sub-run-ico">${ico('play')}</span> `:''}${esc(s.t)}</span><span class="sub-time">${mins?fmtMin(mins):''}</span>${isRunning ? `<button class="btn-sm run" data-a="stopTimer" title="Pausar subtarefa" aria-label="Pausar subtarefa">${ico('pause')}</button>` : `<button class="btn-sm" data-a="startSubTimer" data-id="${t.id}" data-sub="${s.id}" title="Iniciar subtarefa" aria-label="Iniciar subtarefa" ${S.timer?'disabled':''}>${ico('play')}</button>`}<button class="btn-sm" data-a="subUp" data-id="${t.id}" data-sub="${s.id}" title="Subir" aria-label="Subir">${ico('arrow-up')}</button><button class="btn-sm" data-a="subDown" data-id="${t.id}" data-sub="${s.id}" title="Descer" aria-label="Descer">${ico('arrow-down')}</button><button class="btn-sm sub-del" data-a="sdel" data-id="${t.id}" data-sub="${s.id}" title="Excluir subtarefa" aria-label="Excluir subtarefa">${ico('trash')}</button></div>`;
  }).join('');
  const addHtml = collapsed ? '' : `<div class="sub-add">
      <input data-a="sadd" data-id="${t.id}" placeholder="+ Adicionar subtarefa" aria-label="Adicionar subtarefa">
    </div>`;
  return `<div class="subs${collapsed ? ' subs--collapsed' : ''}">
    ${subsTotal ? `<div class="subs-head">
      <button type="button" class="subs-count subs-toggle" data-a="toggleSubs" data-id="${t.id}" aria-expanded="${!collapsed}" title="${collapsed ? 'Mostrar subtarefas' : 'Recolher subtarefas'}">
        <span>Fases (${subsDone}/${subsTotal} · ${subPct}%)</span>
        <span class="chev subs-chev" aria-hidden="true">${ico(collapsed ? 'chevron-down' : 'chevron-up')}</span>
      </button>
      <button data-a="collapseCard" data-id="${t.id}" title="Recolher card" aria-label="Recolher card" class="subs-collapse">${ico('chevron-up')}</button>
    </div>` : ''}
    ${rowsHtml}
    ${!collapsed && hiddenCount > 0 ? `<button class="subs-showall" data-a="showAllSubs" data-id="${t.id}">Ver todas as ${subsTotal} subtarefas</button>` : ''}
    ${canHide ? `<button class="subs-showall" data-a="hideAllSubs" data-id="${t.id}" title="Voltar a mostrar só as ${SUBS_VISIBLE_LIMIT} primeiras">Mostrar menos</button>` : ''}
    ${addHtml}
  </div>`;
}

function viewQueue() {
  return `<div class="msg" style="margin-bottom:12px">Registre ideias e tarefas rapidamente, sem precisar de data.</div>${adder(null)}
  <div id="queueList">
    ${dayTasks(null).length ? dayTasks(null).map(t => cardQueue(t)).join('') : '<div class="msg">Fila vazia.</div>'}
  </div>`;
}

function cardQueue(t) {
  const isExpanded = expandedTasks.has(t.id);
  const isSelected = selectedTaskId === t.id;
  const k = f => `tasks:${t.id}:${f}`;
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id) || S.skills.find(s => s.n === id)).filter(Boolean);
  const labelObjs = (t.labels || []).map(id => S.labels.find(l => l.id === id) || S.labels.find(l => l.n === id)).filter(Boolean);
  const borderColor = themeColor(t.color || (skillObjs[0]?.color) || areaColor(t.area));
  const _as = activeSubs(t); const subsTotal = _as.length; const subsDone = _as.filter(s => s.d).length;

  let html = `<div class="card ${isExpanded?'':'compact'} queue-card ${isSelected?'selected':''}" style="--c:${borderColor}" data-card="${t.id}" data-a="toggleQueueCard" data-id="${t.id}">
    <div class="row" style="align-items:center;cursor:pointer;flex:1;min-width:0">
      <div class="ti" style="min-width:0">
        <div class="tt">${esc(t.t)}</div>
        <div class="meta">
          ${prMark(t.pr)}
          ${t.time ? `<span class="tag" style="color:var(--wr)">${ico('clock')} ${esc(t.time)}</span>` : ''}
          ${t.est ? `<span class="tag">${ico('timer')} ${fmtMin(t.est)}</span>` : ''}
          ${subsTotal ? `<span class="tag queue-subcount">${subsDone}/${subsTotal} sub</span>` : ''}
          ${skillObjs.map(s => `<span class="tag tag-skill" style="--c:${themeColor(s.color)}">${esc(s.n)}</span>`).join('')}
          ${labelObjs.slice(0,4).map(l => `<span class="label-pill" style="--lc:${themeColor(l.color)}">${esc(l.n)}</span>`).join('')}${labelObjs.length>4 ? `<span class="label-pill">+${labelObjs.length-4}</span>` : ''}
        </div>
      </div>
      <span class="chev" style="flex:none;margin-left:auto">${ico(isExpanded ? 'chevron-up' : 'chevron-down')}</span>
    </div>`;

  if (isExpanded) {
    html += `<div class="queue-body" style="margin-top:12px;border-top:1px solid var(--bd);padding-top:12px">
      <div class="queue-schedule">
        <span class="queue-schedule-label">Agendar para:</span>
        <div class="queue-days">
          ${DAYS.map((d,i) => `<button data-a="cp" data-id="${t.id}" data-i="${i}" title="Duplicar para ${d}">${d}</button>`).join('')}
          <button data-a="cp" data-id="${t.id}" data-i="q" class="queue-dup" title="Duplicar na Fila">${ico('copy')} Duplicar</button>
        </div>
      </div>

      <textarea data-p="${esc(k('desc'))}" placeholder="Descrição e notas da tarefa..." rows="2" style="margin-bottom:8px">${esc(t.desc||'')}</textarea>
      ${renderSubs(t)}

      <div class="acts" style="margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="queue-order" aria-label="Reordenar na Fila">
          <button data-a="moveUp" data-id="${t.id}" title="Subir na Fila" aria-label="Subir na Fila">${ico('arrow-up')}</button>
          <button data-a="moveDown" data-id="${t.id}" title="Descer na Fila" aria-label="Descer na Fila">${ico('arrow-down')}</button>
        </div>
        <button data-a="del" data-id="${t.id}" style="margin-left:auto;background:transparent;border:1px solid var(--bd)">${ico('trash')} Excluir</button>
      </div>

      <details data-eid="${t.id}" ${openEdits.has(t.id)?'open':''} style="margin-top:12px">
        <summary>Edição completa (Metadados)</summary>
        <div class="form">
          <label class="full">Título${inp(k('t'), t.t)}</label>
          <label>Prioridade<select data-p="${esc(k('pr'))}">${selOptions(PR.map((x,i)=>[i,x]), t.pr)}</select></label>
          <label>Tipo<select data-p="${esc(k('type'))}">${selOptions([['','—'],...TASK_TYPES.map(x=>[x.id,x.n])], t.type)}</select></label>
          <label>Área<select data-p="${esc(k('area'))}">${selOptions(taskAreaOptions(t), t.area)}</select></label>
          <label>Projeto<select data-p="${esc(k('proj'))}">${selOptions([['','—'],...alive(S.projects).map(p=>[p.id,p.n])], t.proj)}</select></label>
          <label>Estimativa<input type="number" data-p="${esc(k('est'))}" value="${t.est||0}"></label>
          <label class="full">Habilidades<div class="pill-stack">${alive(S.skills).filter(s=>!s.archived).map(s => `<label><input type="checkbox" data-skill-task="${t.id}" data-skill-id="${s.id}" ${(t.skills||[]).includes(s.id)?'checked':''}><span style="--pc:${s.color}">${esc(s.n)}</span></label>`).join('')}</div></label>
          <label class="full">Labels<div class="pill-stack">${S.labels.map(l => `<label><input type="checkbox" data-label-task="${t.id}" data-label-id="${l.id}" ${(t.labels||[]).includes(l.id)?'checked':''}><span style="--pc:${l.color}">${esc(l.n)}</span></label>`).join('')}</div></label>
          <label class="full">Cor<div class="color-picker-row"><div class="color-dot ${!t.color?'selected':''}" style="background:transparent;border:1px dashed var(--bd)" data-a="setTaskColor" data-id="${t.id}" data-color="">⊘</div>${COLOR_PALETTE.map(p => `<div class="color-dot ${t.color===p.c?'selected':''}" style="background:${p.c}" title="${p.n}" data-a="setTaskColor" data-id="${t.id}" data-color="${p.c}"></div>`).join('')}</div></label>
        </div>
      </details>
    </div>`;
  }
  html += `</div>`;
  return html;
}

/* v121 — rascunhos de formulários de criação (Vagas/Rede) sobrevivem a re-render. */
const FORM_DRAFT_KEY = 'atelier_form_drafts_v1';
let _formDrafts = null;
function formDrafts() {
  if (_formDrafts) return _formDrafts;
  try { _formDrafts = JSON.parse(sessionStorage.getItem(FORM_DRAFT_KEY) || '{}') || {}; }
  catch (e) { _formDrafts = {}; }
  return _formDrafts;
}
function draftGet(key) { const v = formDrafts()[key]; return v == null ? '' : String(v); }
function draftSet(key, value) {
  const d = formDrafts(); d[key] = String(value == null ? '' : value);
  try { sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
}
function draftClear(prefix) {
  const d = formDrafts(); Object.keys(d).forEach(k => { if (k.indexOf(prefix) === 0) delete d[k]; });
  try { sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
}
if (typeof document !== 'undefined' && document.addEventListener) {
  const absorb = ev => {
    const el = ev.target;
    const key = el && el.dataset && el.dataset.draft;
    if (key) draftSet(key, el.value);
  };
  document.addEventListener('input', absorb, true);
  document.addEventListener('change', absorb, true);
}
try { window.__atelierDraftClear = draftClear; } catch (e) {}

function viewJobs() {
  let filtered = alive(S.applications);
  if (jobFilter.stage === 'active') filtered = filtered.filter(a => !isJobTerminal(a));
  else if (jobFilter.stage !== 'all') filtered = filtered.filter(a => a.stage === jobFilter.stage);
  if (jobFilter.area) filtered = filtered.filter(a => a.area === jobFilter.area);
  if (jobFilter.priority === 'high') filtered = filtered.filter(a => +a.priority === 0);
  if (jobFilter.platform) filtered = filtered.filter(a => a.platform === jobFilter.platform);
  if (jobFilter.text) {const q = jobFilter.text.toLowerCase(); filtered = filtered.filter(a => (a.client||'').toLowerCase().includes(q) || (a.role||'').toLowerCase().includes(q));}
  const items = filtered.map(a => ({a, score: jobScore(a)})).sort((x,y) => {const xa = isJobTerminal(x.a), ya = isJobTerminal(y.a); if (xa !== ya) return xa ? 1 : -1; return y.score - x.score;});
  const stats = jobStats();
  const overdue = alive(S.applications).filter(a => !isJobTerminal(a) && a.nextFollowUp && a.nextFollowUp < iso(new Date())).length;
  const jobDraft = k => draftGet('job:' + k);
  const jobDraftEsc = k => esc(jobDraft(k));
  const jAreas = jobAreaOptions(jobDraft('jArea'));
  const jSubs = jobSubareaOptions(jobDraft('jSubarea'));
  const jPlatforms = jobPlatformFilterOptions();
  return `<datalist id="jobPlatforms">${jPlatforms.map(p => `<option value="${esc(p)}">`).join('')}</datalist><datalist id="jobSubareas">${jSubs.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="job-kpis"><div class="kpi"><div class="kpi-label">Ativas</div><div class="kpi-value">${stats.active.length}</div><div class="kpi-sub">${overdue?`<span class="late">${overdue} atrasada${overdue>1?'s':''}</span>`:'em dia'}</div></div><div class="kpi"><div class="kpi-label">Taxa resp.</div><div class="kpi-value">${stats.applied.length?Math.round(stats.responseRate*100)+'%':'—'}</div><div class="kpi-sub">${stats.responded.length}/${stats.applied.length}</div></div><div class="kpi"><div class="kpi-label">Pipeline</div><div class="kpi-value" style="font-size:16px">${fmtBRL(stats.pipelineValue)}</div><div class="kpi-sub">ponderado</div></div><div class="kpi"><div class="kpi-label">1ª resp.</div><div class="kpi-value">${stats.medianTime?stats.medianTime.toFixed(0)+'d':'—'}</div><div class="kpi-sub">mediana</div></div></div>
    <div class="job-kpis-mobile"><div class="kpi job-kpi-mobile"><div class="kpi-mobile-head"><span class="kpi-label">Vagas ativas</span><b>${stats.active.length}</b>${overdue?`<span class="late">${overdue} atrasada${overdue>1?'s':''}</span>`:'<span class="kpi-sub">em dia</span>'}</div><div class="kpi-mobile-row"><span>Resposta <b>${stats.applied.length?Math.round(stats.responseRate*100)+'%':'—'}</b></span><span>Pipeline <b>${fmtBRL(stats.pipelineValue)}</b></span><span>1ª resp. <b>${stats.medianTime?stats.medianTime.toFixed(0)+'d':'—'}</b></span></div></div></div>
    <div class="add"><input id="qaJob" placeholder="Cliente - Vaga ~2500 !a @linkedin #ilustracao"><button data-a="qaJob">+</button></div>
    <details data-eid="jobAdd" ${openEdits.has('jobAdd')?'open':''}><summary>+ detalhes</summary><div class="form"><label>Cliente<input id="jClient" data-draft="job:jClient" value="${jobDraftEsc('jClient')}"></label><label>Vaga<input id="jRole" data-draft="job:jRole" value="${jobDraftEsc('jRole')}"></label><label class="full">Link<input id="jUrl" data-draft="job:jUrl" value="${jobDraftEsc('jUrl')}"></label><label>Plataforma<input id="jPlatform" list="jobPlatforms" data-draft="job:jPlatform" value="${jobDraftEsc('jPlatform')}"></label><label>Área<select id="jArea" data-draft="job:jArea"><option value="">—</option>${jAreas.map(a=>`<option ${jobDraft('jArea')===a?'selected':''}>${esc(a)}</option>`).join('')}</select></label><label>Subárea<input id="jSubarea" list="jobSubareas" data-draft="job:jSubarea" value="${jobDraftEsc('jSubarea')}"></label><label>Ticket<input id="jTicket" type="number" data-draft="job:jTicket" value="${jobDraftEsc('jTicket')}"></label><label>Prioridade<select id="jPriority" data-draft="job:jPriority">${PR.map((x,i)=>`<option value="${i}" ${String(i)===(jobDraft('jPriority')||'1')?'selected':''}>${x}</option>`).join('')}</select></label><label>Contato<input id="jContact" data-draft="job:jContact" value="${jobDraftEsc('jContact')}"></label><label>Email/handle<input id="jContactInfo" data-draft="job:jContactInfo" value="${jobDraftEsc('jContactInfo')}"></label><label class="full">Notas<textarea id="jNotes" rows="2" data-draft="job:jNotes">${jobDraftEsc('jNotes')}</textarea></label></div><button data-a="jobAddFull" style="margin-top:8px">Adicionar</button></details>
    <details class="job-taxonomy" data-eid="jobTaxonomy" ${openEdits.has('jobTaxonomy')?'open':''}><summary>Áreas e subáreas</summary>
      <div class="job-tax"><div class="job-tax-head"><b>Áreas</b><span>${jobAreas().length} opç${jobAreas().length===1?'ão':'ões'}</span></div>
        <div class="job-tax-pills">${jobAreas().map(a => `<span class="tag">${esc(a)}<button data-a="jobAreaDel" data-v="${esc(a)}" title="Remover área" aria-label="Remover área ${esc(a)}">${ico('x')}</button></span>`).join('') || '<span class="job-tax-empty">Nenhuma área.</span>'}</div>
        <div class="add"><input id="jobAreaNew" placeholder="Nova área"><button data-a="jobAreaAdd" aria-label="Adicionar área" title="Adicionar área">${ico('plus')}</button></div>
      </div>
      <div class="job-tax"><div class="job-tax-head"><b>Subáreas</b><span>${jobSubareas().length} opç${jobSubareas().length===1?'ão':'ões'}</span></div>
        <div class="job-tax-pills">${jobSubareas().map(a => `<span class="tag">${esc(a)}<button data-a="jobSubareaDel" data-v="${esc(a)}" title="Remover subárea" aria-label="Remover subárea ${esc(a)}">${ico('x')}</button></span>`).join('') || '<span class="job-tax-empty">Nenhuma subárea.</span>'}</div>
        <div class="add"><input id="jobSubareaNew" placeholder="Nova subárea"><button data-a="jobSubareaAdd" aria-label="Adicionar subárea" title="Adicionar subárea">${ico('plus')}</button></div>
      </div>
      <div class="job-tax"><div class="job-tax-head"><b>Plataformas</b><span>${jobPlatforms().length} opç${jobPlatforms().length===1?'ão':'ões'}</span></div>
        <div class="job-tax-pills">${jobPlatforms().map(a => `<span class="tag">${esc(a)}<button data-a="jobPlatformDel" data-v="${esc(a)}" title="Remover plataforma" aria-label="Remover plataforma ${esc(a)}">${ico('x')}</button></span>`).join('') || '<span class="job-tax-empty">Nenhuma plataforma.</span>'}</div>
        <div class="add"><input id="jobPlatformNew" placeholder="Nova plataforma"><button data-a="jobPlatformAdd" aria-label="Adicionar plataforma" title="Adicionar plataforma">${ico('plus')}</button></div>
      </div>
    </details>
    <div class="filter-bar job-filter-bar"><span class="filter-ico" aria-hidden="true">${ico('search')}</span><input id="jobSearch" placeholder="Buscar…" value="${esc(jobFilter.text)}"><select id="jobFilterStage"><option value="active" ${jobFilter.stage==='active'?'selected':''}>Ativas</option><option value="all" ${jobFilter.stage==='all'?'selected':''}>Todas</option>${JOB_STAGES.map(s => `<option value="${s.id}" ${jobFilter.stage===s.id?'selected':''}>${s.n}</option>`).join('')}</select><select id="jobFilterPriority"><option value="all" ${jobFilter.priority!=='high'?'selected':''}>Prioridade</option><option value="high" ${jobFilter.priority==='high'?'selected':''}>Alta</option></select><select id="jobFilterPlatform"><option value="">Plataforma</option>${jobPlatformFilterOptions().map(p => `<option value="${esc(p)}" ${jobFilter.platform===p?'selected':''}>${esc(p)}</option>`).join('')}</select><select id="jobFilterArea"><option value="">Área</option>${jobAreaFilterOptions().map(a => `<option value="${esc(a)}" ${jobFilter.area===a?'selected':''}>${esc(a)}</option>`).join('')}</select></div>
    <h3>Vagas <span class="count">(${filtered.length})</span></h3>
    <div id="jobList">${items.length ? items.map(({a}) => cardJob(a)).join('') : '<div class="msg">Nenhuma vaga.</div>'}</div>`;
}
function cardJob(app) {
  const stage = jobStage(app); const terminal = isJobTerminal(app); const days = daysInJobStage(app); const score = jobScore(app);
  const linkedTask = app.linkedTaskId ? T(app.linkedTaskId) : null; const timeInvested = linkedTask ? taskMinutes(linkedTask) : 0;
  const proj = app.projectId ? S.projects.find(p => p.id === app.projectId) : null;
  const k = f => `applications:${app.id}:${f}`;
  let fuBadge = '';
  if (app.nextFollowUp && !terminal) {const today = iso(new Date()); if (app.nextFollowUp < today) fuBadge = `<span class="badge late">Follow-up ${daysBetween(app.nextFollowUp, today)}d atrás</span>`; else if (app.nextFollowUp === today) fuBadge = '<span class="badge soon">Follow-up hoje</span>'; else fuBadge = `<span class="badge">Follow-up em ${daysBetween(today, app.nextFollowUp)}d</span>`;}
  const prospectCta = app.stage === 'prospect' ? `<div class="prospect-cta"><span style="font-size:12px;color:var(--mu)">Ainda não apliquei.</span><button data-a="jobApply" data-id="${app.id}">${ico('check')} Apliquei</button></div>` : '';
  const projectBadge = proj ? `<span class="tag" style="color:var(--ok);cursor:pointer" data-a="gotoProject" data-id="${proj.id}">${ico('chevron-down','ico--next')} ${esc(proj.n)}</span>` : '';
  const canConvert = !terminal && (app.stage === 'offer' || app.stage === 'accepted') && !app.projectId;
  return `<div class="job-card ${terminal?'terminal':''}" style="--c:${themeColor(stage.color)}"><div class="big" style="margin:0 0 4px"><div class="job-title"><span class="job-client">${esc(app.client)}</span>${app.role && app.role!==app.client ? ' — ' + esc(app.role) : ''}</div><span class="stage-badge" style="--c:${themeColor(stage.color)}">${stage.n}</span></div><div class="meta">${prMark(app.priority)}${PR[app.priority]}${app.platform?`<span class="tag">${esc(app.platform)}</span>`:''}${app.area?`<span class="tag tag-skill" style="--c:${alive(S.skills).find(s=>s.n===app.area)?.color||'var(--mu)'}">${esc(app.area)}</span>`:''}${app.subarea?`<span class="tag">${esc(app.subarea)}</span>`:''}${app.ticket?`<span class="tag">${fmtBRL(app.ticket)}</span>`:''}${!terminal && days>0?`<span class="tag">${days}d na fase</span>`:''}${timeInvested?`<span class="tag">${ico('timer')} ${fmtMin(timeInvested)}</span>`:''}${app.url?`<a class="tag" href="${esc(app.url)}" target="_blank" rel="noopener noreferrer">vaga ↗</a>`:''}${!terminal?`<span class="score-badge ${scoreClass(score)}">${score}</span>`:''}${projectBadge}</div>${app.contactName||app.contactInfo ? `<div class="meta">${app.contactName?`<span class="tag">${ico('user')} ${esc(app.contactName)}</span>`:''}${app.contactInfo?`<span class="tag">${esc(app.contactInfo)}</span>`:''}</div>` : ''}${fuBadge ? `<div class="job-followup-row">${fuBadge}</div>` : ''}${app.notes ? `<div class="tdesc">${esc(app.notes)}</div>` : ''}${prospectCta}<div class="acts"><select class="postpone-sel" data-a="jobStage" data-id="${app.id}"><option value="">${terminal?'Reabrir em…':'→ estágio'}</option>${JOB_STAGES.filter(s => s.id !== app.stage).map(s => `<option value="${s.id}">${s.n}</option>`).join('')}</select>${!terminal && app.nextFollowUp?`<button data-a="jobFollowUp" data-id="${app.id}">Falei hoje</button>`:''}${!terminal && !app.linkedTaskId?`<button data-a="jobCreateTask" data-id="${app.id}">+ Tarefa</button>`:''}${canConvert?`<button data-a="jobConvert" data-id="${app.id}" style="background:var(--ok);color:#000">→ Virou projeto</button>`:''}<button data-a="jobDel" data-id="${app.id}" aria-label="Excluir vaga" title="Excluir vaga">${ico('x')}</button></div><details data-eid="${app.id}" ${openEdits.has(app.id)?'open':''}><summary>Editar</summary><div class="form"><label>Cliente<input data-p="${esc(k('client'))}" value="${esc(app.client)}"></label><label>Vaga<input data-p="${esc(k('role'))}" value="${esc(app.role)}"></label><label class="full">Link<input data-p="${esc(k('url'))}" value="${esc(app.url||'')}"></label><label>Contato<input data-p="${esc(k('contactName'))}" value="${esc(app.contactName||'')}"></label><label>Email<input data-p="${esc(k('contactInfo'))}" value="${esc(app.contactInfo||'')}"></label><label>Plataforma<input data-p="${esc(k('platform'))}" list="jobPlatforms" value="${esc(app.platform||'')}"></label><label>Área<select data-p="${esc(k('area'))}"><option value="">—</option>${jobAreaOptions(app.area).map(a => `<option value="${esc(a)}" ${app.area===a?'selected':''}>${esc(a)}</option>`).join('')}</select></label><label>Subárea<input data-p="${esc(k('subarea'))}" list="jobSubareas" value="${esc(app.subarea||'')}"></label><label>Ticket<input type="number" data-p="${esc(k('ticket'))}" value="${app.ticket||0}"></label><label>Prioridade<select data-p="${esc(k('priority'))}">${selOptions(PR.map((x,i)=>[i,x]), app.priority)}</select></label><label>Follow-up<input type="date" data-p="${esc(k('nextFollowUp'))}" value="${esc(app.nextFollowUp||'')}"></label><label class="full">Notas<textarea data-p="${esc(k('notes'))}" rows="2">${esc(app.notes||'')}</textarea></label></div></details></div>`;
}

function viewProjects() {
  const active = alive(S.projects).filter(p => !p.archived);
  const archived = alive(S.projects).filter(p => p.archived);
  const clients = alive(S.clients);
  return `<div class="card"><div class="form"><label>Nome<input id="pn"></label><label>Área<select id="pa">${getAreas().map(a=>`<option value="${esc(a.id)}">${esc(a.n)}</option>`).join('')}</select></label><label>Cliente<select id="pclient"><option value="">—</option>${clients.map(c => `<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label><label>Prazo<input id="pdu" type="date"></label><label>Recompensa<input id="prw"></label></div><button data-a="padd" style="margin-top:8px">Criar projeto</button></div>
    ${active.map(projectCard).join('')}
    ${archived.length ? `<details><summary>Arquivados (${archived.length})</summary>${archived.map(projectCard).join('')}</details>` : ''}`;
}
function renderProjectGoals(p) {
  const goals = (p.goals || []).slice().sort((a,b) => (a.order||0) - (b.order||0));
  const done = goals.filter(g => g.d).length;
  const total = goals.length;
  const rows = goals.map((g, i) => `<div class="sub">
      <button class="chk s" data-a="pgtog" data-id="${p.id}" data-g="${g.id}" title="${g.d ? 'Marcar como pendente' : 'Marcar como concluída'}">${g.d ? '✓' : ''}</button>
      <span class="sub-txt ${g.d ? 'x' : ''}" contenteditable="true" data-pgedit="${p.id}:${g.id}">${esc(g.t)}</span>
      <button class="btn-sm" data-a="pgup" data-id="${p.id}" data-g="${g.id}" data-i="${i}" title="Subir" aria-label="Subir etapa">${ico('arrow-up')}</button>
      <button class="btn-sm" data-a="pgdown" data-id="${p.id}" data-g="${g.id}" data-i="${i}" title="Descer" aria-label="Descer etapa">${ico('arrow-down')}</button>
      <button class="btn-sm" data-a="pgdel" data-id="${p.id}" data-g="${g.id}" title="Excluir" aria-label="Excluir etapa">${ico('x')}</button>
    </div>`).join('');
  return `<details class="proj-goals" data-eid="pg_${p.id}" ${openEdits.has('pg_' + p.id) ? 'open' : ''}>
    <summary>${ico('flag')} Etapas <span class="badge">${done}/${total}</span></summary>
    ${total ? `<div class="subs">${rows}</div>` : '<div class="msg" style="margin:6px 0">Nenhuma etapa ainda.</div>'}
    <div class="add" style="margin-top:8px">
      <input data-pgadd="${p.id}" placeholder="Nova etapa (Enter)">
      <button data-a="pgadd" data-id="${p.id}" title="Adicionar etapa" aria-label="Adicionar etapa">${ico('plus')}</button>
    </div>
  </details>`;
}
function projectCard(p) {
  const ts = S.tasks.filter(t => t.proj === p.id); const done = ts.filter(t => t.done).length, total = ts.length;
  const pctTasks = total ? Math.round(done/total*100) : 0;
  const estTotal = projEstTotal(p.id), estDone = projEstDone(p.id); const pctTime = estTotal > 0 ? Math.round(estDone/estTotal*100) : 0;
  const mins = projMinutes(p.id); const color = areaColor(p.area); const k = f => `projects:${p.id}:${f}`;
  const earnings = projectEarnings(p);
  const clients = alive(S.clients);
  const isComplete = !!p.completedAt;
  const cur = p.currency || 'BRL';
  const valUnit = p.billingType === 'hourly' ? `${CURRENCIES[cur].sym}/h` : p.billingType === 'minute' ? `${CURRENCIES[cur].sym}/min` : CURRENCIES[cur].sym;
  return `<div class="card" style="--c:${color}">
    <div class="big"><input data-p="${esc(k('n'))}" value="${esc(p.n)}" style="font-weight:600"><button data-a="pdel" data-id="${p.id}" aria-label="Excluir projeto" title="Excluir projeto">${ico('x')}</button></div>
    ${isComplete ? `<div class="msg" style="color:var(--ok)">✓ Concluído em ${fmtDate(iso(new Date(p.completedAt)))}${earnings.total>0?` · ${fmtMoney(earnings.total, cur)}`:''}${earnings.ratePerHour>0?` · ${fmtMoney(earnings.ratePerHour, cur)}/h`:''}</div>` : ''}
    ${estTotal ? `<div class="proj-progress"><div class="pp-row"><span class="pp-label">Tarefas</span><div class="pp-bar"><div style="width:${pctTasks}%;background:${color}"></div></div><span class="pp-val">${pctTasks}%</span></div><div class="pp-row"><span class="pp-label">Tempo</span><div class="pp-bar"><div style="width:${pctTime}%;background:${color}88"></div></div><span class="pp-val">${pctTime}%</span></div></div>` : ''}
    ${renderProjectGoals(p)}
    <div class="form">
      <label>Área<select data-p="${esc(k('area'))}">${selOptions(getAreas().map(a=>[a.id,a.n]), p.area)}</select></label>
      <label>Cliente<select data-p="${esc(k('clientId'))}"><option value="">—</option>${clients.map(c => `<option value="${c.id}" ${p.clientId===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}</select></label>
      <label>Prazo<input type="date" data-p="${esc(k('due'))}" value="${esc(p.due||'')}"></label>
      <label>Cobrança<select data-p="${esc(k('billingType'))}">${selOptions(BILLING_TYPES, p.billingType)}</select></label>
      <label>Moeda<select data-p="${esc(k('currency'))}">${selOptions(Object.keys(CURRENCIES).map(c=>[c,CURRENCIES[c].sym+' '+c]), cur)}</select></label>
      <label>Valor (${valUnit})<input type="number" step="0.01" data-p="${esc(k('billingValue'))}" value="${p.billingValue||0}"></label>
      <label>Valor real (override)<input type="number" step="0.01" data-p="${esc(k('actualValue'))}" value="${p.actualValue ?? ''}"></label>
      <label>Horas manuais (override)<input type="number" step="0.1" data-p="${esc(k('manualHours'))}" value="${p.manualHours ?? ''}"></label>
      <label>Recompensa<input data-p="${esc(k('reward'))}" value="${esc(p.reward||'')}"></label>
    </div>
    <div class="acts">
      ${p.reward && pctTasks===100 ? (p.claimed ? `<span class="badge">${ico('check')} ${esc(p.reward)}</span>` : `<button data-a="claim" data-id="${p.id}" style="background:var(--ac);color:#000">Resgatar</button>`) : (p.reward ? `<span class="badge">${ico('flag')} ${esc(p.reward)}</span>` : '')}
      ${!isComplete && pctTasks === 100 && total > 0 ? `<button data-a="pcomplete" data-id="${p.id}" style="background:var(--ok);color:#000">${ico('check')} Marcar concluído</button>` : ''}
      ${isComplete ? `<button data-a="puncomplete" data-id="${p.id}">Reabrir</button>` : ''}
      <button data-a="parch" data-id="${p.id}">${p.archived?'Restaurar':'Arquivar'}</button>
    </div>
  </div>`;
}

function viewClients() {
  const clients = alive(S.clients);
  return `<div class="add" style="gap:6px"><input id="clientN" placeholder="Nome do cliente"><button data-a="clientAdd" aria-label="Adicionar cliente" title="Adicionar cliente">${ico('plus')}</button></div>
    <div class="msg">Vincule o cliente em cada projeto na aba Projetos.</div>
    ${clients.length ? clients.map(c => {
      const projs = projectsByClient(c.id);
      const completed = projs.filter(p => p.completedAt);
      const totalByCur = {};
      completed.forEach(p => {const e = projectEarnings(p); totalByCur[e.currency] = (totalByCur[e.currency]||0) + e.total;});
      const totalHours = completed.reduce((s,p) => s + projectEarnings(p).hours, 0);
      const brlTotal = Object.entries(totalByCur).reduce((s,[cur,val]) => s + convertTo(val, cur, 'BRL'), 0);
      const avgRate = totalHours > 0 ? brlTotal / totalHours : 0;
      const contactLinks = alive(S.contacts).filter(ct => ct.clientId === c.id);
      return `<div class="client-card card">
        <div class="big"><input data-p="clients:${c.id}:n" value="${esc(c.n)}" style="font-weight:600"><span class="badge">${projs.length} proj · ${completed.length} concluído${completed.length!==1?'s':''}</span><button data-a="clientDel" data-id="${c.id}" aria-label="Excluir cliente" title="Excluir cliente">${ico('x')}</button></div>
        <div class="meta"><span class="tag" style="color:var(--ok)">${fmtBRL(brlTotal)} total</span>${avgRate>0?`<span class="rate-badge">${fmtBRL(avgRate)}/h</span>`:''}<span class="tag">${totalHours.toFixed(1)}h</span>${contactLinks.length?`<span class="tag">${contactLinks.length} contato${contactLinks.length>1?'s':''}</span>`:''}</div>
        ${projs.length ? `<details><summary>Projetos (${projs.length})</summary>${projs.map(p => {const e = projectEarnings(p); return `<div class="proj-row-line"><span>${p.completedAt?ico('check')+' ':(p.archived?'arquivado ':'em andamento ')}${esc(p.n)}</span><span style="color:var(--mu);font-variant-numeric:tabular-nums">${e.total>0?fmtMoney(e.total, e.currency):''}</span></div>`;}).join('')}</details>` : ''}
        <div class="form" style="margin-top:6px"><label class="full">Notas<textarea data-p="clients:${c.id}:notes" rows="2">${esc(c.notes||'')}</textarea></label></div>
      </div>`;
    }).join('') : '<div class="msg">Nenhum cliente registrado ainda. Adicione acima.</div>'}`;
}

function viewEarnings() {
  const completed = alive(S.projects).filter(p => p.completedAt);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
  const inPeriod = p => earningsFilter === 'all' ? true : (p.completedAt >= monthStart);
  const filtered = completed.filter(inPeriod);
  const primary = S.cfg.primaryCurrency || 'BRL';
  const totalPrimary = filtered.reduce((s,p) => {const e = projectEarnings(p); return s + convertTo(e.total, e.currency, primary);}, 0);
  const totalBRL = convertTo(totalPrimary, primary, 'BRL');
  const totalUSD = convertTo(totalPrimary, primary, 'USD');
  const totalEUR = convertTo(totalPrimary, primary, 'EUR');
  const prevTotal = completed.filter(p => p.completedAt >= prevMonthStart && p.completedAt < monthStart).reduce((s,p) => {const e = projectEarnings(p); return s + convertTo(e.total, e.currency, primary);}, 0);
  const totalHours = filtered.reduce((s,p) => s + projectEarnings(p).hours, 0);
  const avgRate = totalHours > 0 ? totalPrimary / totalHours : 0;

  const byClient = {};
  filtered.forEach(p => {
    const key = p.clientId || p.client || '_none';
    if (!byClient[key]) byClient[key] = {name: p.clientId ? (clientById(p.clientId)?.n || 'Cliente') : (p.client || '(sem cliente)'), projects: [], totalPrimary: 0, hours: 0};
    const e = projectEarnings(p);
    byClient[key].projects.push({p, e});
    byClient[key].totalPrimary += convertTo(e.total, e.currency, primary);
    byClient[key].hours += e.hours;
  });
  const topClients = Object.values(byClient).sort((a,b) => b.totalPrimary - a.totalPrimary);

  return `<div class="filter-bar" style="flex-wrap:wrap"><button data-a="earnFilter" data-v="month" class="${earningsFilter==='month'?'on':''}">Mês atual</button><button data-a="earnFilter" data-v="all" class="${earningsFilter==='all'?'on':''}">Tudo</button></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total (${primary})</div><div class="kpi-value" style="font-size:18px">${fmtMoney(totalPrimary, primary)}</div><div class="kpi-sub">R$ ${Math.round(totalBRL).toLocaleString('pt-BR')} · $ ${totalUSD.toFixed(0)} · € ${totalEUR.toFixed(0)}</div></div>
      <div class="kpi"><div class="kpi-label">Projetos</div><div class="kpi-value">${filtered.length}</div><div class="kpi-sub">concluídos</div></div>
      <div class="kpi"><div class="kpi-label">Horas</div><div class="kpi-value">${totalHours.toFixed(1)}h</div><div class="kpi-sub">${avgRate>0?fmtMoney(avgRate, primary)+'/h':'—'}</div></div>
      <div class="kpi"><div class="kpi-label">Mês anterior</div><div class="kpi-value" style="font-size:16px">${fmtMoney(prevTotal, primary)}</div><div class="kpi-sub">${prevTotal>0?(totalPrimary>=prevTotal?'↑':'↓')+' '+(prevTotal>0?Math.round(Math.abs(totalPrimary-prevTotal)/prevTotal*100):0)+'%':''}</div></div>
    </div>
    ${topClients.length ? `<h3>Top clientes (${earningsFilter==='month'?'este mês':'total'})</h3>` : ''}
    ${topClients.slice(0,3).map((c,i) => {
      const avg = c.hours > 0 ? c.totalPrimary / c.hours : 0;
      return `<div class="card"><div class="big"><span style="font-weight:600"><span class="rank-badge">${i+1}º</span> ${esc(c.name)}</span><span class="badge" style="color:var(--ok)">${fmtMoney(c.totalPrimary, primary)}</span></div><div class="meta"><span class="tag">${c.projects.length} projeto${c.projects.length!==1?'s':''}</span><span class="tag">${c.hours.toFixed(1)}h</span>${avg>0?`<span class="rate-badge">${fmtMoney(avg, primary)}/h</span>`:''}</div></div>`;
    }).join('')}
    <h3>Por cliente</h3>
    ${topClients.length ? topClients.map(c => `<div class="card"><div class="big"><span style="font-weight:600">${esc(c.name)}</span><span class="badge" style="color:var(--ok)">${fmtMoney(c.totalPrimary, primary)}</span></div>${c.projects.map(({p, e}) => `<div class="proj-row-line"><div style="flex:1;min-width:0"><div style="font-size:12.5px">${esc(p.n)}</div><div style="font-size:10.5px;color:var(--mu)">${e.hours.toFixed(2)}h${e.ratePerHour>0?' · '+fmtMoney(e.ratePerHour, e.currency)+'/h':''}</div></div><span style="color:var(--tx);font-weight:600;font-variant-numeric:tabular-nums">${e.total>0?fmtMoney(e.total, e.currency):'—'}</span></div>`).join('')}</div>`).join('') : '<div class="msg">Sem projetos concluídos no período. Marque projetos como concluídos em Projetos.</div>'}`;
}

function viewHistory() {
  const done = S.tasks.filter(t => t.done).sort((a,b) => (b.doneAt || 0) - (a.doneAt || 0));
  const now = Date.now();
  const cutoff = historyFilter === '7d' ? now - 7*86400000 : historyFilter === '30d' ? now - 30*86400000 : 0;
  const filtered = done.filter(t => !t.doneAt || t.doneAt >= cutoff);
  const unknown = filtered.filter(t => !t.doneAt);
  const logsByTask = {};
  (S.workLogs || []).forEach(l => { if (l.taskId) (logsByTask[l.taskId] = logsByTask[l.taskId] || []).push(l); });
  const byDay = {};
  filtered.filter(t => t.doneAt).forEach(t => {const d = iso(new Date(t.doneAt)); if (!byDay[d]) byDay[d] = []; byDay[d].push({type:'task', t});});
  // Registros preservados de tarefas removidas (snapshots)
  const taskIds = new Set(S.tasks.map(t => t.id));
  const orphanLogs = (S.workLogs || []).filter(l => l.taskId && !taskIds.has(l.taskId) && (l.ts || 0) >= cutoff).sort((a,b) => (b.ts || 0) - (a.ts || 0));
  orphanLogs.forEach(l => {const d = l.date || iso(new Date(l.ts)); if (!byDay[d]) byDay[d] = []; byDay[d].push({type:'log', l});});
  const days = Object.keys(byDay).sort((a,b) => b.localeCompare(a));
  const totalMin = filtered.reduce((a,t) => a + taskMinutes(t), 0);
  const totalXp = filtered.filter(t => t.xpClaimed && !isPersonalSection(t)).reduce((a,t) => a + taskBaseXp(t), 0);
  const range = reportWeekRange();
  const knownHtml = days.length ? days.map(d => `<div class="history-day"><div class="history-day-header"><b>${d.split('-').reverse().join('/')}</b><span class="msg" style="margin:0">${byDay[d].length} registro${byDay[d].length!==1?'s':''}</span></div>${byDay[d].map(entry => historyEntryHTML(entry, d, logsByTask)).join('')}</div>`).join('') : '';
  const unknownHtml = unknown.length ? `<div class="history-day history-day--unknown"><div class="history-day-header"><b>Data desconhecida</b><span class="msg" style="margin:0">${unknown.length} registro${unknown.length!==1?'s':''} · concluídas sem data registrada</span></div>${unknown.map(t => historyEntryHTML({type:'task', t}, 'unknown', logsByTask)).join('')}</div>` : '';
  return `<div class="history-report-bar">
      <button data-a="reportWeekPrev" title="Semana anterior" aria-label="Semana anterior">${ico('chevron-down','ico--prev')}</button>
      <button data-a="reportWeekToday">Esta semana</button>
      <button data-a="reportWeekNext" title="Próxima semana" aria-label="Próxima semana">${ico('chevron-down','ico--next')}</button>
      <span class="hr-range">${range.start.split('-').reverse().join('/')} – ${range.end.split('-').reverse().join('/')}</span>
      <button data-a="reportOpen" class="hr-generate">Gerar relatório semanal</button>
    </div>
    <div class="filter-bar" style="flex-wrap:wrap"><button data-a="histFilter" data-v="7d" class="${historyFilter==='7d'?'on':''}">7 dias</button><button data-a="histFilter" data-v="30d" class="${historyFilter==='30d'?'on':''}">30 dias</button><button data-a="histFilter" data-v="all" class="${historyFilter==='all'?'on':''}">Tudo</button></div>
    <div class="stats"><span>${filtered.length} tarefa${filtered.length!==1?'s':''}</span><span>Tempo: <b>${fmtMin(totalMin)}</b></span><span>XP: <b>${totalXp}</b></span></div>
    ${knownHtml}
    ${unknownHtml}
    ${!days.length && !unknown.length ? '<div class="msg">Nenhuma tarefa concluída no período.</div>' : ''}`;
}

function historyEntryHTML(entry, dayStr, logsByTask) {
  if (entry.type === 'log') {
    const l = entry.l;
    return `<div class="history-row history-row--log"><div class="history-content"><div class="history-title">${esc(l.taskTitle || '(tarefa removida)')}</div><div class="history-meta">${l.area ? `<span class="tag">${esc(areaLabel(l.area))}</span>` : ''}${l.projName ? `<span class="tag">${esc(l.projName)}</span>` : ''}<span class="tag" style="opacity:.7">${ico('edit')} registro preservado</span></div><div class="history-log">${esc(l.text)}</div></div></div>`;
  }
  const t = entry.t;
  const subs = t.subs || [];
  const subBreakdown = subs.length ? `<details style="margin-top:4px"><summary style="font-size:11px">Fases (${subs.length})</summary>${subs.map(s => {const m = subMinutes(t, s.id); return `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11.5px;color:var(--mu)"><span>${s.d?'✓':'·'} ${esc(s.t)}</span><span style="color:var(--tx);font-variant-numeric:tabular-nums">${m?fmtMin(m):'—'}</span></div>`;}).join('')}</details>` : '';
  const xpAwarded = t.xpClaimed && !isPersonalSection(t) ? taskBaseXp(t) : 0;
  const logs = (logsByTask[t.id] || []).sort((a,b) => (b.ts || 0) - (a.ts || 0));
  const logsHtml = logs.map(l => `<div class="history-log">${ico('edit')} ${esc(l.text)}${l.date && l.date !== dayStr ? ` <span class="history-log-date">· ${fmtDate(l.date)}</span>` : ''}</div>`).join('');
  return `<div class="history-row"><div class="history-content"><div class="history-title">${esc(t.t)}</div><div class="history-meta"><span class="tag">${esc(areaLabel(t.area))}</span>${taskMinutes(t)>0?`<span class="tag">${ico('timer')} ${fmtMin(taskMinutes(t))}</span>`:''}${xpAwarded?`<span class="tag" style="color:var(--ac)">+${xpAwarded} XP</span>`:''}${isPersonalSection(t)?`<span class="tag" style="opacity:.6">sem XP</span>`:''}</div>${logsHtml}${subBreakdown}</div><div class="history-actions"><button data-a="openWorkLog" data-id="${t.id}" title="Registrar/editar resumo" aria-label="Registrar ou editar resumo">${ico('edit')}</button><button data-a="histReopen" data-id="${t.id}" title="Reabrir" aria-label="Reabrir tarefa">${ico('repeat')}</button><button data-a="histCopy" data-id="${t.id}" title="Copiar para hoje" aria-label="Copiar para hoje">${ico('copy')}</button><button data-a="histDel" data-id="${t.id}" title="Excluir" aria-label="Excluir tarefa">${ico('x')}</button></div></div>`;
}

function events() {
  const e = [];
  S.tasks.forEach(t => {if (t.due && !t.done) e.push({d:t.due, t:'Tarefa: '+t.t});});
  alive(S.projects).forEach(p => {if (p.due && !p.archived) e.push({d:p.due, t:'Projeto: '+p.n});});
  alive(S.goals).forEach(g => {if (g.due) e.push({d:g.due, t:'Meta: '+g.t});});
  alive(S.contacts).forEach(c => {if (c.nextContact && !c.archived) e.push({d:c.nextContact, t:'Contato: '+c.n}); if (c.birthday) {const parts = c.birthday.split('-'); if (parts.length >= 2) {const mm = parts[parts.length-2], dd = parts[parts.length-1]; const y = new Date().getFullYear(); e.push({d: `${y}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`, t:'Aniversário: '+c.n}); e.push({d: `${y+1}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`, t:'Aniversário: '+c.n});}}});
  alive(S.applications).forEach(a => {if (a.nextFollowUp && !isJobTerminal(a)) e.push({d:a.nextFollowUp, t:'Vaga: '+(a.role||a.client)});});
  return e.sort((a,b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
}
function viewCalendar() {
  const y = cal.getFullYear(), m = cal.getMonth(); const first = (new Date(y, m, 1).getDay() + 6) % 7; const nDays = new Date(y, m+1, 0).getDate();
  const ev = events(), td = iso(new Date()); let cells = '';
  for (let i=0; i<first; i++) cells += '<div></div>';
  for (let d=1; d<=nDays; d++) {const key = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0'); const evs = ev.filter(e => e.d === key); cells += `<div class="cd ${key===td?'tdy':''}">${d}${evs.length?`<i title="${esc(evs.map(e=>e.t).join(' | '))}">${evs.length}</i>`:''}</div>`;}
  const upcoming = ev.filter(e => e.d >= td).slice(0, 30);
  return `<div class="big"><button data-a="cm" data-i="-1" aria-label="Mês anterior" title="Mês anterior">${ico('chevron-down','ico--prev')}</button><b style="text-transform:capitalize">${cal.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button data-a="cm" data-i="1" aria-label="Próximo mês" title="Próximo mês">${ico('chevron-down','ico--next')}</button></div><div class="grid-cal">${DAYS.map(d => `<div class="h">${d}</div>`).join('')}${cells}</div><h3>Próximos</h3>${upcoming.length ? upcoming.map(e => {const n = daysBetween(td, e.d); return `<div class="card"><div class="big" style="margin:0"><span>${esc(e.t)}</span><span class="badge ${n<0?'late':n<=3?'soon':''}">${n<0?'atrasado '+(-n)+'d':n===0?'hoje':'em '+n+'d'} · ${fmtDate(e.d)}</span></div></div>`;}).join('') : '<div class="msg">Sem prazos.</div>'}`;
}

function viewGoals() {const goals = alive(S.goals); return `<div class="add"><input id="gn" placeholder="Nova meta"><input id="gd" type="date" style="max-width:150px"><button data-a="gadd" aria-label="Adicionar meta" title="Adicionar meta">${ico('plus')}</button></div>${goals.map(g => `<div class="card" style="--c:var(--ac)"><div class="big"><input data-p="goals:${g.id}:t" value="${esc(g.t)}"><button data-a="gdel" data-id="${g.id}" aria-label="Excluir meta" title="Excluir meta">${ico('x')}</button></div>${bar(g.p, g.p+'%', '')}<input type="range" min="0" max="100" step="5" value="${g.p}" data-p="goals:${g.id}:p"><div class="form"><label>Prazo<input type="date" data-p="goals:${g.id}:due" value="${esc(g.due||'')}"></label></div></div>`).join('')}`;}

function viewSkills() {
  const periods = [['all','Tudo'],['30','30d'],['7','7d']]; const days = skillsFilter === 'all' ? null : +skillsFilter;
  const active = alive(S.skills).filter(s => !s.archived).sort((a,b) => (a.order||0)-(b.order||0));
  const periodPills = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${periods.map(([v,l]) => `<button class="${skillsFilter===v?'on':''}" data-a="skillPeriod" data-v="${v}" style="padding:4px 10px;font-size:12px;background:${skillsFilter===v?'var(--ac)':'var(--s1)'};color:${skillsFilter===v?'#000':'var(--mu)'};border:1px solid var(--bd);border-radius:20px">${l}</button>`).join('')}</div>`;
  return `${periodPills}<h3>Habilidades</h3>${active.map(s => {const xp = Math.round(num(s.xp)); const info = levelInfo(xp); const mins = skillMinutes(s.id, days); const tasks = skillTaskCount(s.id); const streak = skillStreak(s.id); return `<div style="background:var(--s1);border:1px solid var(--bd);border-left:3px solid ${themeColor(s.color)};border-radius:12px;padding:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><div style="font-weight:600;color:${themeColor(s.color)}">${esc(s.n)}</div><div style="font-size:12px;color:var(--mu)">Nível ${info.lv} · ${tasks} tarefa${tasks!==1?'s':''} ${streak>=2?`<span class="streak-badge">${ico('bolt')} ${streak}d</span>`:''}</div></div><div style="text-align:right;font-size:12px;color:var(--mu)"><b style="color:var(--tx);font-size:15px">${xp}</b> XP<div style="font-size:10px">faltam ${info.toNext}</div></div></div><div style="height:6px;background:var(--s2);border-radius:3px;overflow:hidden;margin:8px 0 6px"><div style="width:${info.progress*100}%;background:${themeColor(s.color)};height:100%"></div></div><div style="font-size:11.5px;color:var(--mu)">Tempo: <b style="color:var(--tx)">${fmtMin(mins)}</b></div><details data-eid="${s.id}" ${openEdits.has(s.id)?'open':''}><summary>Configurar</summary><div class="form"><label>Nome<input data-p="skills:${s.id}:n" value="${esc(s.n)}"></label><label>Cor<input type="color" data-p="skills:${s.id}:color" value="${esc(s.color)}" style="height:34px;padding:2px"></label></div><div class="acts" style="margin-top:6px"><button data-a="skillArch" data-id="${s.id}">Arquivar</button></div></details></div>`;}).join('')}<details style="margin-top:16px"><summary>${ico('plus')} Nova habilidade</summary><div class="add"><input id="skillN"><input type="color" id="skillC" value="#6f8de0" style="max-width:60px;padding:2px;height:36px"><button data-a="skillAdd" aria-label="Adicionar habilidade" title="Adicionar habilidade">${ico('plus')}</button></div></details>`;
}

function renderHeatmap() {const days = heatmapData(); const activeDays = days.filter(d => d.mins > 0).length; return `<div class="heatmap-wrap"><div class="heatmap">${days.map(d => {let lvl = 0; if (d.mins > 0) lvl = 1; if (d.mins >= 30) lvl = 2; if (d.mins >= 90) lvl = 3; if (d.mins >= 180) lvl = 4; return `<div class="hm-cell lvl-${lvl} ${d.isFuture?'future':''} ${d.isToday?'today':''}" title="${esc(d.isFuture?'':`${d.dStr} · ${d.mins}min · ${d.tasksDone} tarefas`)}"></div>`;}).join('')}</div><div class="hm-legend"><span>${activeDays} ${activeDays===1?'dia ativo':'dias ativos'} nos últimos 90</span><span class="hm-legend-scale">menos<span class="hm-cell lvl-0"></span><span class="hm-cell lvl-1"></span><span class="hm-cell lvl-2"></span><span class="hm-cell lvl-3"></span><span class="hm-cell lvl-4"></span>mais</span></div></div>`;}

function viewStats() {
  const now = new Date(); const td = iso(now);
  const weekAgoStr = iso(new Date(now.getTime() - 6*86400000));
  const xp = xpProgression();
  const allLogs = S.tasks.flatMap(t => (t.logs || []).map(l => ({...l, taskId: t.id})));
  const weekLogs = allLogs.filter(l => l.end && iso(new Date(l.end)) >= weekAgoStr);
  // "Pomodoros hoje": fonte de verdade é S.pomodoros (Fase 4).
  // t.logs mantém note:'pomodoro' apenas como espelho; NÃO há fallback para logs.
  // v102: dedupe na leitura (não apaga histórico) — entradas antigas duplicadas
  // pelo mesmo foco contam uma vez.
  const pomodorosToday = dedupePomodoros(S.pomodoros || []).filter(p => p.date === td).length;
  const weekMin = weekLogs.reduce((a,l) => a + (+l.minutes||0), 0);
  const manualWeekMin = weekLogs.filter(l => l.note === 'manual').reduce((a,l) => a + (+l.minutes||0), 0);
  const todayLogs = allLogs.filter(l => l.end && iso(new Date(l.end)) === td);
  const todayMin = todayLogs.reduce((a,l) => a + (+l.minutes||0), 0);
  const manualTodayMin = todayLogs.filter(l => l.note === 'manual').reduce((a,l) => a + (+l.minutes||0), 0);
  const weekTasksDone = S.tasks.filter(t => t.done && t.doneAt && iso(new Date(t.doneAt)) >= weekAgoStr).length;
  const totalTasks = S.tasks.length; const doneTasks = S.tasks.filter(t => t.done).length;
  const completionRate = totalTasks ? Math.round(doneTasks/totalTasks*100) : 0;
  const avgTaskMin = doneTasks ? Math.round(allLogs.reduce((a,l) => a + (+l.minutes||0), 0) / doneTasks) : 0;
  let streak = 0;
  for (let i=0; i<60; i++) {const d = new Date(); d.setDate(d.getDate()-i); if (S.tasks.some(t => t.done && t.doneAt && iso(new Date(t.doneAt)) === iso(d))) streak++; else if (i === 0) continue; else break;}
  const dayLabels = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const weekDays = [];
  for (let i=6; i>=0; i--) {const d = new Date(); d.setDate(now.getDate()-i); const dStr = iso(d); const mins = allLogs.filter(l => l.end && iso(new Date(l.end)) === dStr).reduce((a,l) => a + (+l.minutes||0), 0); weekDays.push({mins, label: dayLabels[(d.getDay()+6)%7], isToday: dStr===td});}
  const maxWeekMin = Math.max(60, ...weekDays.map(x => x.mins));
  const typeMin = {};
  S.tasks.forEach(t => {const total = taskMinutes(t); if (!total) return; const tp = TASK_TYPES.find(x => x.id === t.type); const key = tp ? tp.id : 'sem-tipo'; typeMin[key] = (typeMin[key]||0) + total;});
  const typeMax = Math.max(1, ...Object.values(typeMin));
  const areaMin = {};
  S.tasks.forEach(t => {const total = taskMinutes(t); if (!total) return; areaMin[t.area] = (areaMin[t.area]||0) + total;});
  const areaMax = Math.max(1, ...Object.values(areaMin));
  const sectionMin = {commitment:0, work:0, personal:0};
  S.tasks.forEach(t => {const total = taskMinutes(t); if (!total) return; sectionMin[taskSection(t)] += total;});
  const sectionMax = Math.max(1, ...Object.values(sectionMin));
  const energyDone = {high:0, med:0, low:0};
  S.tasks.forEach(t => {if (!t.done || !t.doneAt) return; const h = new Date(t.doneAt).getHours(); if (h >= 6 && h < 12) energyDone.high++; else if (h >= 12 && h < 18) energyDone.med++; else energyDone.low++;});
  const energyTotal = energyDone.high + energyDone.med + energyDone.low;
  const projList = alive(S.projects).filter(p => !p.archived).map(p => {const ts = S.tasks.filter(t => t.proj === p.id); const done = ts.filter(t => t.done).length; const total = ts.length; const pctTasks = total ? Math.round(done/total*100) : 0; const estTotal = projEstTotal(p.id), estDone = projEstDone(p.id); const pctTime = estTotal > 0 ? Math.round(estDone/estTotal*100) : null; return {p, pctTasks, pctTime, done, total, mins: projMinutes(p.id), color: areaColor(p.area)};}).filter(x => x.total > 0).sort((a,b) => b.mins - a.mins);
  const calib = calibrationStats();
  const proNet = networkStats('pro');
  const personalNet = networkStats('personal');
  const birthdays = upcomingBirthdays(14);
  const jStats = jobStats();
  const primary = S.cfg.primaryCurrency || 'BRL';
  const earnedPrimary = alive(S.projects).filter(p => p.completedAt).reduce((s,p) => {const e = projectEarnings(p); return s + convertTo(e.total, e.currency, primary);}, 0);

  const xpBlock = `<h3 style="margin-top:0">Progressão</h3><div class="xp-hero"><div><div class="xp-level-label">Nível</div><div class="xp-level">${xp.lv}</div></div><div class="xp-bar-wrap"><div style="font-size:12px;color:var(--mu);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span><b style="color:var(--tx)">${Math.round(xp.inLevel)}</b> / ${xp.forLevel} XP neste nível</span><span>faltam <b style="color:var(--ac)">${xp.toNext}</b></span></div><div class="xp-bar"><div style="width:${(xp.progress*100)}%"></div></div><div class="xp-meta">Total: <b>${Math.round(xp.gxp)}</b> XP · Semana: <b>+${xp.weekXp}</b> · Mês: <b>+${xp.monthXp}</b></div></div></div><h4>Top habilidades por XP</h4>${xp.topSkills.length ? xp.topSkills.map(s => {const skXp = Math.round(num(s.xp)); const info = levelInfo(skXp); return `<div class="skill-xp-row"><div class="sxr-label" style="color:${themeColor(s.color)}">${esc(s.n)}</div><div class="sxr-bar"><div style="width:${(skXp/xp.maxSkillXp*100)}%;background:${themeColor(s.color)}"></div></div><div class="sxr-val"><b>N${info.lv}</b> · ${skXp} XP</div></div>`;}).join('') : '<div class="msg">Sem habilidades ainda.</div>'}`;

  const overviewBlock = `<h3>Visão geral</h3><div class="kpi-grid"><div class="kpi"><div class="kpi-label">Foco (7d)</div><div class="kpi-value">${fmtMin(weekMin)}</div><div class="kpi-sub">${weekLogs.length} sessões · ${fmtMin(manualWeekMin)} manual</div></div><div class="kpi"><div class="kpi-label">Manual (7d)</div><div class="kpi-value">${fmtMin(manualWeekMin)}</div><div class="kpi-sub">sem timer</div></div><div class="kpi"><div class="kpi-label">Tarefas (7d)</div><div class="kpi-value">${weekTasksDone}</div><div class="kpi-sub">concluídas</div></div><div class="kpi"><div class="kpi-label">Pomodoros hoje</div><div class="kpi-value">${pomodorosToday}</div><div class="kpi-sub">timer · 25 min cada</div></div><div class="kpi"><div class="kpi-label">Dias seguidos</div><div class="kpi-value">${streak}</div><div class="kpi-sub">com atividade</div></div><div class="kpi"><div class="kpi-label">Conclusão</div><div class="kpi-value">${completionRate}%</div><div class="kpi-sub">${doneTasks}/${totalTasks}</div></div><div class="kpi"><div class="kpi-label">Tempo médio</div><div class="kpi-value">${avgTaskMin?fmtMin(avgTaskMin):'—'}</div><div class="kpi-sub">por tarefa</div></div><div class="kpi"><div class="kpi-label">Rendimento total</div><div class="kpi-value" style="font-size:16px">${fmtMoney(earnedPrimary, primary)}</div><div class="kpi-sub">projetos concluídos</div></div></div><h3>Consistência</h3>${renderHeatmap()}<h3>Últimos 7 dias</h3><div class="bar-chart">${weekDays.map(x => `<div class="bar-col ${x.isToday?'today':''}"><div class="bar-val">${x.mins?fmtMin(x.mins):''}</div><div class="bar-fill" style="height:${(x.mins/maxWeekMin*100)}%"></div><div class="bar-label">${x.label}</div></div>`).join('')}</div>`;

  // v104: o que saiu do dashboard da Semana (Compromissos/Pessoal + energia)
  // continua visível aqui, sem perda de informação.
  const todayList = dayTasks(todayI()).filter(t => inWeekScope(t));
  const energyToday = getTodayEnergy();
  const eLabel = {high:'alta', med:'média', low:'baixa'};
  const secToday = SECTION_ORDER.map(s => {
    const arr = todayList.filter(t => taskSection(t) === s);
    const p = sectionProgress(arr);
    return `<span>${sectionIcon(s)} ${SECTION_META[s].n}: <b>${p.pct}%</b> <span class="wss-sub">(${arr.filter(t => isDoneThisWeek(t)).length}/${arr.length})</span></span>`;
  }).join(' · ');
  const todayBlock = `<h3>Hoje</h3><div class="card"><div class="big" style="margin-bottom:6px">${fmtDate(td)}</div><div class="msg" style="display:flex;gap:10px;flex-wrap:wrap">${secToday}</div><div class="msg" style="margin-top:6px">Foco hoje: <b>${fmtMin(todayMin)}</b> · manual <b>${fmtMin(manualTodayMin)}</b> · pomodoros <b>${pomodorosToday}</b></div><div class="msg" style="margin-top:6px">Energia: Manhã <b>${esc(eLabel[energyToday.morning] || energyToday.morning)}</b> · Tarde <b>${esc(eLabel[energyToday.afternoon] || energyToday.afternoon)}</b> · Noite <b>${esc(eLabel[energyToday.evening] || energyToday.evening)}</b></div></div>`;

  const calibBlock = calib.insufficient ? `<div class="card"><div class="calib-headline">Calibração de estimativas</div><div class="msg">Conclua ${calib.need - calib.count} tarefa${calib.need-calib.count>1?'s':''} mais com estimativa para ver a calibração.</div></div>` : `<div class="card calib-block"><div class="calib-headline">Nas últimas ${calib.count} tarefas com estimativa, você gasta <b style="color:${Math.abs(calib.pct)>30?'var(--wr)':'var(--ok)'}">${Math.abs(calib.pct)}% ${calib.pct>=0?'acima':'abaixo'}</b> do previsto.</div><div class="msg">${calib.pct > 30 ? 'Multiplique suas estimativas por ~' + ((100+calib.pct)/100).toFixed(1) + 'x.' : calib.pct < -20 ? 'Você tende a superestimar. Pode ser mais ousado.' : 'Boa calibração.'}</div></div>`;

  const timeInvestBlock = `<h3>Onde você investe o tempo</h3>${(sectionMin.work + sectionMin.personal + sectionMin.commitment) > 0 ? `<h4>Por seção</h4><div class="chart">${SECTION_ORDER.filter(s => sectionMin[s] > 0).map(s => {const m = SECTION_META[s]; return `<div class="chart-row"><div class="ch-label" style="color:${m.color}">${sectionIcon(s)} ${m.n}</div><div class="ch-bar"><div style="width:${(sectionMin[s]/sectionMax*100)}%;background:${m.color}"></div></div><div class="ch-val">${fmtMin(sectionMin[s])}</div></div>`;}).join('')}</div>` : ''}${Object.keys(typeMin).length ? `<h4>Por tipo de tarefa</h4><div class="chart">${Object.entries(typeMin).sort((a,b) => b[1]-a[1]).map(([id, m]) => {const tp = TASK_TYPES.find(x => x.id === id); return `<div class="chart-row"><div class="ch-label">${tp ? ico(TASK_TYPE_ICON[tp.id] || 'flag') + ' ' + esc(tp.n) : '—'}</div><div class="ch-bar"><div style="width:${(m/typeMax*100)}%;background:#c9764a"></div></div><div class="ch-val">${fmtMin(m)}</div></div>`;}).join('')}</div>` : ''}${Object.keys(areaMin).length ? `<h4>Por área</h4><div class="chart">${Object.entries(areaMin).sort((a,b) => b[1]-a[1]).map(([a, m]) => `<div class="chart-row"><div class="ch-label" style="color:${areaColor(a)}">${esc(areaLabel(a))}</div><div class="ch-bar"><div style="width:${(m/areaMax*100)}%;background:${areaColor(a)}"></div></div><div class="ch-val">${fmtMin(m)}</div></div>`).join('')}</div>` : ''}${energyTotal > 0 ? `<h4>Por horário do dia</h4><div class="chart"><div class="chart-row"><div class="ch-label">${ico('bolt')} Manhã (6-12)</div><div class="ch-bar"><div style="width:${(energyDone.high/energyTotal*100)}%;background:#c9764a"></div></div><div class="ch-val">${energyDone.high}</div></div><div class="chart-row"><div class="ch-label">${ico('timer')} Tarde (12-18)</div><div class="ch-bar"><div style="width:${(energyDone.med/energyTotal*100)}%;background:var(--wr)"></div></div><div class="ch-val">${energyDone.med}</div></div><div class="chart-row"><div class="ch-label">${ico('clock')} Noite (18-24)</div><div class="ch-bar"><div style="width:${(energyDone.low/energyTotal*100)}%;background:#6a8560"></div></div><div class="ch-val">${energyDone.low}</div></div></div>` : ''}`;

  const projBlock = `<h3>Projetos</h3>${projList.length ? projList.map(({p, pctTasks, pctTime, done, total, mins, color}) => `<div class="card" style="--c:${color}"><div class="big" style="margin-bottom:6px"><span style="font-weight:600">${esc(p.n)}</span><span class="badge">${done}/${total} · ${fmtMin(mins)}</span></div><div class="proj-progress"><div class="pp-row"><span class="pp-label">Tarefas</span><div class="pp-bar"><div style="width:${pctTasks}%;background:${color}"></div></div><span class="pp-val">${pctTasks}%</span></div>${pctTime != null ? `<div class="pp-row"><span class="pp-label">Tempo est.</span><div class="pp-bar"><div style="width:${pctTime}%;background:${color}88"></div></div><span class="pp-val">${pctTime}%</span></div>` : ''}</div></div>`).join('') : '<div class="msg">Sem projetos ativos.</div>'}`;

  const netBlock = (label, ns, isPro) => `<h3>${label}</h3><div class="network-card"><div class="network-kpis"><div class="network-kpi"><div class="nk-label">Contatos</div><div class="nk-value">${ns.total}</div><div class="nk-sub">${ns.active30} ativos (30d)</div></div><div class="network-kpi"><div class="nk-label">Atrasados</div><div class="nk-value ${ns.overdue?'late':''}">${ns.overdue}</div><div class="nk-sub">follow-up</div></div><div class="network-kpi"><div class="nk-label">Aguardando</div><div class="nk-value">${ns.waiting}</div><div class="nk-sub">resposta deles</div></div><div class="network-kpi"><div class="nk-label">${isPro ? 'Taxa resp.' : 'Adiados'}</div><div class="nk-value">${isPro ? (ns.avgRate > 0 ? Math.round(ns.avgRate*100)+'%' : '—') : ns.snoozed}</div><div class="nk-sub">${isPro ? 'média' : 'snoozed'}</div></div></div><h4>Profundidade</h4>${[1,2,3].map(d => {const n = ns.depths[d]; const tot = Math.max(1, ns.total); const lbl = ['', 'Interno', 'Regular', 'Distante'][d]; const clr = ['', 'var(--ac)', 'var(--mu)', '#7a7580'][d]; return `<div class="depth-row"><span class="depth-label">${lbl}</span><div class="depth-bar"><div style="width:${(n/tot*100)}%;background:${clr}"></div></div><span class="depth-val">${n}</span></div>`;}).join('')}<h4>Interações por semana (8 semanas)</h4><div class="week-inter">${ns.weeks.map(w => `<div class="wi-col"><div style="font-size:9px;color:var(--mu)">${w.count||''}</div><div class="wi-bar" style="height:${(w.count/ns.maxWeek*100)}%;min-height:${w.count?3:1}px"></div><div class="wi-label">${w.label}</div></div>`).join('')}</div>${ns.closest.length ? `<h4>Mais próximos</h4>${ns.closest.map(c => {const sc = contactScore(c); return `<div class="contact-mini"><div class="cm-avatar" style="background:color-mix(in srgb,var(--ac) 15%,var(--s2));color:var(--ac)">${initials(c.n)}</div><div class="cm-info"><div class="cm-name">${esc(c.n)}</div><div class="cm-meta">${esc(c.cat)} · ${(c.interactions||[]).length} interações</div></div><span class="cm-score ${scoreClass(sc)}">${sc}</span></div>`;}).join('')}` : ''}${ns.cooling.length ? `<h4 style="color:var(--wr)">Esfriando</h4>${ns.cooling.map(c => {const days = c.lastContact ? daysBetween(c.lastContact, td) : null; return `<div class="contact-mini"><div class="cm-avatar" style="background:#7a758020;color:var(--mu)">${initials(c.n)}</div><div class="cm-info"><div class="cm-name">${esc(c.n)}</div><div class="cm-meta">${days != null ? days + 'd desde o último contato' : 'nunca contatado'}</div></div></div>`;}).join('')}` : ''}${Object.keys(ns.byPlatform).length ? `<h4>Plataformas</h4><div class="chart">${Object.entries(ns.byPlatform).sort((a,b) => b[1]-a[1]).slice(0,5).map(([p, n]) => `<div class="chart-row"><div class="ch-label">${esc(p)}</div><div class="ch-bar"><div style="width:${(n/Math.max(1,...Object.values(ns.byPlatform))*100)}%;background:var(--ac)"></div></div><div class="ch-val">${n}</div></div>`).join('')}</div>` : ''}${!isPro && birthdays.length ? `<h4>Aniversários próximos (14d)</h4>${birthdays.map(b => `<div class="birthday-row"><span class="bd-icon">${ico('star')}</span><span class="bd-name">${esc(b.contact.n)}</span><span class="bd-days">${b.days===0?'hoje':'em '+b.days+'d'} · ${fmtDate(b.date)}</span></div>`).join('')}` : ''}</div>`;

  const jobsBlock = alive(S.applications).length ? `<h3>Vagas</h3><h4>Funil</h4><div class="chart">${JOB_STAGES.filter(s => jStats.byStage[s.id] > 0).map(s => `<div class="chart-row"><div class="ch-label" style="color:${themeColor(s.color)}">${s.n}</div><div class="ch-bar"><div style="width:${(jStats.byStage[s.id]/Math.max(1,...Object.values(jStats.byStage))*100)}%;background:${themeColor(s.color)}"></div></div><div class="ch-val">${jStats.byStage[s.id]}</div></div>`).join('')}</div><div class="msg">Pipeline esperado: <b>${fmtBRL(jStats.pipelineValue)}</b> · ${jStats.applied.length} aplicadas · ${jStats.responded.length} responderam${jStats.medianTime ? ' · mediana '+jStats.medianTime.toFixed(0)+'d' : ''}</div>` : `<h3>Vagas</h3><div class="card"><div class="msg">Nenhuma vaga registrada ainda.</div></div>`;

  return xpBlock + overviewBlock + todayBlock + calibBlock + timeInvestBlock + projBlock + netBlock('Rede profissional', proNet, true) + netBlock('Amizades e vínculos', personalNet, false) + jobsBlock + (!totalTasks ? '<div class="msg center">Sem dados ainda.</div>' : '');
}

function viewReview() {
  const wIso = iso(weekStart());
  S.cfg.reviewChecks = S.cfg.reviewChecks || {};
  const checks = S.cfg.reviewChecks[wIso] || {};
  const today = iso(new Date());
  const oldTasks = S.tasks.filter(t => !t.done && (t.postponedCount >= 2 || (t.createdAt && (Date.now() - t.createdAt) > 7 * 86400000)));
  const overdueContacts = alive(S.contacts).filter(c => !c.archived && !c.snoozedUntil && contactStatus(c).k === 'atrasado');
  const overdueJobs = alive(S.applications).filter(a => !isJobTerminal(a) && a.nextFollowUp && a.nextFollowUp < today);
  const birthdays = upcomingBirthdays(7);
  const priority = S.cfg.weekPriority?.[wIso]?.text || '';
  const totalSteps = 5;
  const doneSteps = Object.keys(checks).filter(k => checks[k]).length;
  return `<h3 style="margin-top:0">Revisão semanal</h3>${bar(Math.round(doneSteps/totalSteps*100), `${doneSteps}/${totalSteps} etapas`, '')}
    <div class="review-section ${checks.oldTasks?'done':''}" style="margin-top:14px"><div class="review-head"><div><div class="review-title">1. Tarefas antigas</div><div class="review-sub">${oldTasks.length} pendente${oldTasks.length!==1?'s':''}</div></div><button data-a="reviewToggle" data-check="oldTasks" class="${checks.oldTasks?'on':''}">${checks.oldTasks?'✓':'marcar'}</button></div>${oldTasks.length ? `<div class="review-body">${oldTasks.slice(0, 8).map(t => `<div class="review-item"><div><div>${esc(t.t)}</div><div class="review-item-meta">${t.day !== null ? DAYS[t.day] : 'Fila'}${t.postponedCount?' · '+t.postponedCount+'x':''}</div></div><div class="review-actions"><button data-a="reviewComplete" data-id="${t.id}">✓</button><button data-a="reviewArchive" data-id="${t.id}">✕</button></div></div>`).join('')}</div>` : '<div class="review-body"><div class="msg">Nada aqui.</div></div>'}</div>
    <div class="review-section ${checks.overdueContacts?'done':''}"><div class="review-head"><div><div class="review-title">2. Contatos atrasados</div><div class="review-sub">${overdueContacts.length} contato${overdueContacts.length!==1?'s':''}</div></div><button data-a="reviewToggle" data-check="overdueContacts" class="${checks.overdueContacts?'on':''}">${checks.overdueContacts?'✓':'marcar'}</button></div>${overdueContacts.length ? `<div class="review-body">${overdueContacts.slice(0, 8).map(c => {const sc = contactScore(c); return `<div class="review-item"><div><div>${esc(c.n)} <span class="contact-score ${scoreClass(sc)}">${sc}</span></div><div class="review-item-meta">${c.cat} · últ: ${c.lastContact?fmtDate(c.lastContact):'nunca'}</div></div><div class="review-actions"><button data-a="contactSend" data-id="${c.id}">Enviei</button><button data-a="contactSnooze" data-id="${c.id}" aria-label="Adiar contato" title="Adiar contato">${ico('pause')}</button></div></div>`;}).join('')}</div>` : '<div class="review-body"><div class="msg">Nada aqui.</div></div>'}</div>
    <div class="review-section ${checks.overdueJobs?'done':''}"><div class="review-head"><div><div class="review-title">3. Vagas com follow-up atrasado</div><div class="review-sub">${overdueJobs.length} vaga${overdueJobs.length!==1?'s':''}</div></div><button data-a="reviewToggle" data-check="overdueJobs" class="${checks.overdueJobs?'on':''}">${checks.overdueJobs?'✓':'marcar'}</button></div>${overdueJobs.length ? `<div class="review-body">${overdueJobs.slice(0, 8).map(a => `<div class="review-item"><div><div>${esc(a.role||a.client)}</div><div class="review-item-meta">${jobStage(a).n}</div></div><div class="review-actions"><button data-a="reviewJobFollowUp" data-id="${a.id}">✓</button><button data-a="reviewJobSnooze" data-id="${a.id}">+7d</button></div></div>`).join('')}</div>` : '<div class="review-body"><div class="msg">Nada aqui.</div></div>'}</div>
    <div class="review-section ${checks.birthdays?'done':''}"><div class="review-head"><div><div class="review-title">4. Aniversários</div><div class="review-sub">${birthdays.length} nos próximos 7 dias</div></div><button data-a="reviewToggle" data-check="birthdays" class="${checks.birthdays?'on':''}">${checks.birthdays?'✓':'marcar'}</button></div>${birthdays.length ? `<div class="review-body">${birthdays.map(b => `<div class="review-item"><div><div>${ico('star')} ${esc(b.contact.n)}</div><div class="review-item-meta">${b.days===0?'hoje':'em '+b.days+'d'}</div></div></div>`).join('')}</div>` : '<div class="review-body"><div class="msg">Nenhum aniversário.</div></div>'}</div>
    <div class="review-section ${priority?'done':''}"><div class="review-head"><div><div class="review-title">5. Prioridade da semana</div></div></div><textarea id="reviewPriority" rows="3" placeholder="Se só uma coisa acontecer…" style="margin-top:8px">${esc(priority)}</textarea><button data-a="reviewSavePriority" style="margin-top:6px">Salvar</button></div>`;
}

function viewContacts(type) {
  const isPro = type === 'pro'; const filt = contactFilterState[type]; const view = contactView[type];
  let all = alive(S.contacts).filter(c => c.type === type); let filtered = all;
  if (filt.status === 'active') filtered = filtered.filter(c => !c.archived && !(c.snoozedUntil && c.snoozedUntil > iso(new Date())));
  else if (filt.status === 'archived') filtered = filtered.filter(c => c.archived);
  else if (filt.status === 'snoozed') filtered = filtered.filter(c => c.snoozedUntil && c.snoozedUntil > iso(new Date()));
  else if (filt.status === 'waiting') filtered = filtered.filter(c => c.waitingFor && !c.archived);
  else if (filt.status === 'overdue') filtered = filtered.filter(c => contactStatus(c).k === 'atrasado');
  else if (filt.status !== 'all') filtered = filtered.filter(c => !c.archived);
  if (filt.cat) filtered = filtered.filter(c => c.cat === filt.cat);
  if (filt.text) {const q = filt.text.toLowerCase(); filtered = filtered.filter(c => (c.n||'').toLowerCase().includes(q) || (c.notes||'').toLowerCase().includes(q) || (c.context||'').toLowerCase().includes(q) || (c.lastConversation||'').toLowerCase().includes(q) || (c.tags||[]).some(t => t.toLowerCase().includes(q)));}
  if (filt.tags.length) filtered = filtered.filter(c => filt.tags.every(t => (c.tags||[]).includes(t)));
  const scored = filtered.map(c => ({c, score: contactScore(c)}));
  if (filt.sort === 'score') scored.sort((a,b) => {if (a.c.archived !== b.c.archived) return a.c.archived ? 1 : -1; return b.score - a.score;});
  else if (filt.sort === 'name') scored.sort((a,b) => (a.c.n||'').localeCompare(b.c.n||''));
  else if (filt.sort === 'last') scored.sort((a,b) => (a.c.lastContact||'0000') > (b.c.lastContact||'0000') ? 1 : -1);
  else if (filt.sort === 'next') scored.sort((a,b) => (a.c.nextContact||'9999') > (b.c.nextContact||'9999') ? 1 : -1);
  const overdue = all.filter(c => !c.archived && contactStatus(c).k === 'atrasado').length;
  const todayCount = all.filter(c => !c.archived && contactStatus(c).k === 'hoje').length;
  const waiting = all.filter(c => !c.archived && c.waitingFor).length;
  const snoozed = all.filter(c => c.snoozedUntil && c.snoozedUntil > iso(new Date())).length;
  const active30 = all.filter(c => !c.archived && c.lastContact && daysBetween(c.lastContact, iso(new Date())) <= 30).length;
  const categories = isPro ? CAT_PRO : CAT_PERSONAL;
  const filterPills = `<div class="filter-bar"><span class="filter-ico" aria-hidden="true">${ico('search')}</span><input id="contactSearch_${type}" placeholder="Buscar…" value="${esc(filt.text)}"><select id="contactCatFilter_${type}"><option value="">Categoria</option>${categories.map(c => `<option value="${esc(c)}" ${filt.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="contactStatusFilter_${type}"><option value="active" ${filt.status==='active'?'selected':''}>Ativos</option><option value="all" ${filt.status==='all'?'selected':''}>Todos</option><option value="overdue" ${filt.status==='overdue'?'selected':''}>Atrasados</option><option value="waiting" ${filt.status==='waiting'?'selected':''}>Aguardando</option><option value="snoozed" ${filt.status==='snoozed'?'selected':''}>Adiados</option><option value="archived" ${filt.status==='archived'?'selected':''}>Arquivados</option></select><select id="contactSortFilter_${type}"><option value="score" ${filt.sort==='score'?'selected':''}>Score</option><option value="name" ${filt.sort==='name'?'selected':''}>Nome</option><option value="last" ${filt.sort==='last'?'selected':''}>Último</option><option value="next" ${filt.sort==='next'?'selected':''}>Próximo</option></select></div>`;
  const allTags = contactAllTags().filter(t => all.some(c => (c.tags||[]).includes(t)));
  const tagFilter = allTags.length ? `<div class="tag-filter">${allTags.map(t => `<button class="tag-pill ${filt.tags.includes(t)?'on':''}" data-a="toggleTagFilter" data-type="${type}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}${filt.tags.length ? `<button class="tag-pill" data-a="clearTagFilter" data-type="${type}" style="color:var(--mu)" aria-label="Limpar filtro de tags" title="Limpar filtro de tags">${ico('x')}</button>` : ''}</div>` : '';
  const viewToggle = `<div class="view-toggle"><button class="${view==='list'?'on':''}" data-a="contactView" data-type="${type}" data-mode="list">${ico('menu')} Lista</button><button class="${view==='orbit'?'on':''}" data-a="contactView" data-type="${type}" data-mode="orbit">${ico('focus')} Órbita</button></div>`;
  const kpis = `<div class="contact-kpis"><div class="kpi"><div class="kpi-label">Contatos</div><div class="kpi-value">${all.filter(c => !c.archived).length}</div><div class="kpi-sub">${active30} ativos (30d)</div></div><div class="kpi"><div class="kpi-label">Atrasados</div><div class="kpi-value ${overdue?'late':''}">${overdue}</div><div class="kpi-sub">${todayCount} hoje</div></div><div class="kpi"><div class="kpi-label">Aguardando</div><div class="kpi-value">${waiting}</div><div class="kpi-sub">resposta deles</div></div><div class="kpi"><div class="kpi-label">Adiados</div><div class="kpi-value">${snoozed}</div><div class="kpi-sub">com motivo</div></div></div>`;
  const dcKey = k => draftGet('contact:' + type + ':' + k);
  const dc = k => esc(dcKey(k));
  const form = `<details class="contact-add" data-eid="contactForm_${type}" ${openEdits.has('contactForm_' + type) ? 'open' : ''}>
    <summary>${ico('plus')} Novo contato</summary>
    <div class="card" style="margin-top:8px"><div class="form"><label>Nome<input id="cN_${type}" data-draft="contact:${type}:cN" value="${dc('cN')}"></label><label>Categoria<select id="cCat_${type}" data-draft="contact:${type}:cCat">${categories.map(c=>`<option ${dcKey('cCat')===c?'selected':''}>${c}</option>`).join('')}</select></label><label>Onde<input id="cWhere_${type}" data-draft="contact:${type}:cWhere" value="${dc('cWhere')}"></label><label>Link<input id="cUrl_${type}" data-draft="contact:${type}:cUrl" value="${dc('cUrl')}"></label><label>Cargo<input id="cRole_${type}" data-draft="contact:${type}:cRole" value="${dc('cRole')}"></label><label>Contexto<input id="cContext_${type}" data-draft="contact:${type}:cContext" value="${dc('cContext')}"></label><label>Cadência<input id="cCadence_${type}" type="number" data-draft="contact:${type}:cCadence" value="${dc('cCadence') || (isPro?30:21)}"></label><label class="full">Última conversa<input id="cLastConv_${type}" data-draft="contact:${type}:cLastConv" value="${dc('cLastConv')}" placeholder="Falou que estava mudando pra Berlim"></label><label class="full">Tags (vírgula)<input id="cTags_${type}" data-draft="contact:${type}:cTags" value="${dc('cTags')}"></label><label class="full">Notas<textarea id="cNotes_${type}" rows="2" data-draft="contact:${type}:cNotes">${dc('cNotes')}</textarea></label></div><button data-a="cAdd" data-type="${type}" style="margin-top:8px">Adicionar</button></div>
  </details>`;
  const cardsHtml = view === 'orbit' ? renderOrbit(type, filtered) : scored.map(({c, score}) => contactCard(c, score, type)).join('');
  return `<h3 style="margin-top:0">${isPro ? 'Rede profissional' : 'Amizades e vínculos'}</h3><div class="msg">${isPro ? 'Score = urgência de retomar contato.' : 'Score gentil: contatos pessoais pesam × 0.75.'}</div>${kpis}${viewToggle}${filterPills}${tagFilter}${form}<h3>Contatos <span class="count">(${filtered.length})</span></h3>${cardsHtml || '<div class="msg">Nenhum contato ainda. Use "Novo contato" acima para adicionar.</div>'}`;
}
function contactCard(c, score, type) {
  const status = contactStatus(c); const scCls = scoreClass(score);
  const days = c.lastContact ? daysBetween(c.lastContact, iso(new Date())) : null;
  const rate = contactResponseRate(c); const rateCls = rate == null ? '' : rate >= 0.6 ? 'good' : rate < 0.2 ? 'bad' : '';
  const depth = connectionDepth(c); const k = f => `contacts:${c.id}:${f}`;
  const isSnoozed = c.snoozedUntil && c.snoozedUntil > iso(new Date());
  const cls = isSnoozed ? 'snoozed' : status.k === 'atrasado' ? 'overdue' : status.k === 'hoje' ? 'due' : c.waitingFor ? 'waiting' : '';
  const depthLabel = ['', '· interno', '· regular', '· distante'][depth];
  const recentInter = (c.interactions || []).slice(0, 3);
  const linkedClient = c.clientId ? clientById(c.clientId) : null;
  const clientBadge = linkedClient ? `<span class="tag" style="color:var(--ok);cursor:pointer" data-a="gotoClient" data-id="${linkedClient.id}">${ico('chevron-down','ico--next')} ${esc(linkedClient.n)}</span>` : '';
  return `<div class="contact-card ${cls}" style="--c:${themeColor(status.color)}"><div class="big" style="margin-bottom:4px"><input data-p="${esc(k('n'))}" value="${esc(c.n)}" style="font-weight:600;flex:1;min-width:0"><span class="contact-score ${scCls}" title="${esc(contactScoreBreakdown(c))}">${score >= 0 ? score : '—'}</span><span class="badge" style="color:${themeColor(status.color)}">${status.label}</span></div><div class="meta"><span class="tag">${esc(c.cat)}</span>${c.where?`<span class="tag">${esc(c.where)}</span>`:''}${c.role?`<span class="tag">${esc(c.role)}</span>`:''}${days != null?`<span class="tag">${days}d atrás</span>`:'<span class="tag">sem contato</span>'}${c.waitingFor?`<span class="waiting-pill">${ico('clock')} ${c.waitingSince ? Math.floor((Date.now()-c.waitingSince)/86400000)+'d' : ''}</span>`:''}${isSnoozed?`<span class="snoozed-pill">${ico('pause')} ${fmtDate(c.snoozedUntil)}</span>`:''}${rate != null?`<span class="response-rate ${rateCls}" title="Taxa de resposta">${ico('repeat')} ${Math.round(rate*100)}%</span>`:''}${depthLabel?`<span class="tag" style="opacity:.7">${depthLabel}</span>`:''}${clientBadge}${c.url?`<a class="tag" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">perfil ↗</a>`:''}</div>${(c.tags||[]).length?`<div class="meta" style="margin-top:2px">${(c.tags||[]).map(t => `<span class="tag" style="background:color-mix(in srgb,var(--ac) 10%,var(--s2))">${esc(t)}</span>`).join('')}</div>`:''}${c.lastConversation?`<div class="contact-last-conv">"${esc(c.lastConversation)}"</div>`:''}${recentInter.length?`<details><summary>Interações (${(c.interactions||[]).length})</summary>${recentInter.map(i => {const it = INTERACTION_TYPES.find(t => t.id === i.type) || INTERACTION_TYPES[0]; return `<div class="interaction-row"><span class="dir ${i.direction}">${i.direction==='out'?ico('arrow-up'):ico('arrow-down')}</span><span style="flex:none">${ico(INTERACTION_ICON[it.id] || 'more')} ${it.n}</span><span class="note">${esc(i.note || '')}</span><span style="color:var(--mu);font-size:10px">${fmtDate(iso(new Date(i.at)))}</span></div>`;}).join('')}</details>`:''}<div class="quick-actions"><button class="primary" data-a="contactSend" data-id="${c.id}">${ico('arrow-up')} Enviei</button><button class="secondary" data-a="contactReceive" data-id="${c.id}">${ico('arrow-down')} Recebi</button><button class="secondary" data-a="contactSnooze" data-id="${c.id}">${ico('pause')} Adiar</button>${!c.clientId?`<button class="secondary" data-a="contactConvert" data-id="${c.id}">→ Virou cliente</button>`:''}</div><details data-eid="${c.id}" ${openEdits.has(c.id)?'open':''}><summary>Editar</summary><div class="form"><label>Categoria<select data-p="${esc(k('cat'))}">${selOptions((type==='pro'?CAT_PRO:CAT_PERSONAL).map(x=>[x,x]), c.cat)}</select></label><label>Prioridade<select data-p="${esc(k('priority'))}">${selOptions(PR.map((x,i)=>[i,x]), c.priority)}</select></label><label>Cadência<input type="number" data-p="${esc(k('cadence'))}" value="${c.cadence||30}"></label><label>Último<input type="date" data-p="${esc(k('lastContact'))}" value="${esc(c.lastContact||'')}"></label><label>Próximo<input type="date" data-p="${esc(k('nextContact'))}" value="${esc(c.nextContact||'')}"></label><label>Aniversário<input type="date" data-p="${esc(k('birthday'))}" value="${esc(c.birthday||'')}"></label><label>Onde<input data-p="${esc(k('where'))}" value="${esc(c.where||'')}"></label><label>Link<input data-p="${esc(k('url'))}" value="${esc(c.url||'')}"></label><label>Cargo<input data-p="${esc(k('role'))}" value="${esc(c.role||'')}"></label><label class="full">Contexto<input data-p="${esc(k('context'))}" value="${esc(c.context||'')}"></label><label class="full">Última conversa<input data-p="${esc(k('lastConversation'))}" value="${esc(c.lastConversation||'')}"></label><label class="full">Tags<input data-p="${esc(k('tagsStr'))}" value="${esc((c.tags||[]).join(', '))}"></label><label class="full">Notas<textarea data-p="${esc(k('notes'))}" rows="3">${esc(c.notes||'')}</textarea></label></div><div class="acts" style="margin-top:8px"><button data-a="contactLog" data-id="${c.id}">${ico('plus')} Log</button>${c.waitingFor?`<button data-a="contactClearWaiting" data-id="${c.id}">Cancelar aguardando</button>`:''}${isSnoozed?`<button data-a="contactUnsnooze" data-id="${c.id}">Cancelar adiamento</button>`:''}<button data-a="cArchive" data-id="${c.id}">${c.archived?'Restaurar':'Arquivar'}</button><button data-a="cDel" data-id="${c.id}" aria-label="Excluir contato" title="Excluir contato">${ico('x')} Excluir</button></div></details></div>`;
}
function renderOrbit(type, contacts) {
  if (!contacts.length) return '<div class="orbit-wrap"><div class="msg">Nenhum contato.</div></div>';
  const W = 360, H = 360, CX = W/2, CY = H/2;
  const rings = {1: 55, 2: 110, 3: 160};
  const byDepth = {1: [], 2: [], 3: []};
  contacts.forEach(c => byDepth[connectionDepth(c)].push(c));
  let nodesSvg = '';
  [1, 2, 3].forEach(depth => {const arr = byDepth[depth]; const r = rings[depth]; arr.forEach((c, i) => {const angle = arr.length === 1 ? 0 : (i / arr.length) * 2 * Math.PI - Math.PI / 2; const x = CX + r * Math.cos(angle); const y = CY + r * Math.sin(angle); const status = contactStatus(c); const size = c.priority === 0 ? 11 : c.priority === 1 ? 8 : 6; const sc = contactScore(c); const opacity = sc >= 60 ? 1 : 0.7; nodesSvg += `<g data-a="contactOrbitClick" data-id="${c.id}" style="cursor:pointer"><title>${esc(c.n)} · score ${sc} · ${status.label}</title><circle cx="${x}" cy="${y}" r="${size}" fill="${status.color}" class="node" opacity="${opacity}"/><text x="${x}" y="${y + size + 10}" class="node-label">${initials(c.n)}</text></g>`;});});
  return `<div class="orbit-wrap"><svg class="orbit-svg" viewBox="0 0 ${W} ${H}"><circle cx="${CX}" cy="${CY}" r="${rings[1]}" class="ring ring-1"/><circle cx="${CX}" cy="${CY}" r="${rings[2]}" class="ring ring-2"/><circle cx="${CX}" cy="${CY}" r="${rings[3]}" class="ring ring-3"/><circle cx="${CX}" cy="${CY}" r="8" class="center"/><text x="${CX}" y="${CY + 20}" class="node-label" style="fill:var(--ac)">você</text><text x="${CX}" y="${CY - rings[1] - 6}" class="orbit-labels" style="text-anchor:middle;fill:var(--ac);opacity:.7">íntimo</text><text x="${CX}" y="${CY - rings[2] - 6}" class="orbit-labels" style="text-anchor:middle">regular</text><text x="${CX}" y="${CY - rings[3] - 6}" class="orbit-labels" style="text-anchor:middle;opacity:.5">distante</text>${nodesSvg}</svg><div class="orbit-legend"><span><i style="background:#e0626a"></i>atrasado</span><span><i style="background:#e0a33b"></i>hoje</span><span><i style="background:#6b3a5e"></i>aguardando</span><span><i style="background:#4fb3a2"></i>em dia</span><span><i style="background:#9a94a3"></i>novo</span></div></div>`;
}

function viewCommands() {
  const cmds = [...S.commands].sort((a,b) => (a.order||0)-(b.order||0));
  return `<h3 style="margin-top:0">Referência rápida</h3>
    <div class="msg">Pressione <kbd>?</kbd> para atalhos. <a href="#" data-a="showShortcuts" style="color:var(--ac);font-weight:700">Ver painel →</a></div>
    <div class="add"><input id="cmdN" placeholder="Nome"><input id="cmdCat" placeholder="Categoria" style="max-width:130px"><button data-a="cmdAdd" aria-label="Adicionar comando" title="Adicionar comando">${ico('plus')}</button></div>
    <details style="margin-bottom:12px"><summary>+ Comando completo</summary><div class="form" style="margin-top:6px"><label>Nome<input id="cmdN2"></label><label>Categoria<input id="cmdCat2"></label><label class="full">Comando<textarea id="cmdCmd" rows="3"></textarea></label><label class="full">Exemplo<input id="cmdEx"></label></div><button data-a="cmdAddFull" style="margin-top:6px">Adicionar</button></details>
    ${cmds.map(c => `<div style="background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:10px;margin-bottom:6px"><div class="big"><div><div style="font-weight:600;color:var(--ac)">${esc(c.n)}</div><div style="font-size:10.5px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em">${esc(c.cat||'')}</div></div><div><button data-a="cmdUp" data-id="${c.id}" aria-label="Subir comando" title="Subir">${ico('arrow-up')}</button><button data-a="cmdDown" data-id="${c.id}" aria-label="Descer comando" title="Descer">${ico('arrow-down')}</button><button data-a="cmdDel" data-id="${c.id}" aria-label="Excluir comando" title="Excluir">${ico('x')}</button></div></div><div style="font-size:13px;white-space:pre-wrap;margin-top:4px">${esc(c.cmd)}</div>${c.example?`<div class="msg" style="margin-top:6px"><code style="background:var(--s2);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:12px">${esc(c.example)}</code></div>`:''}</div>`).join('')}`;
}

function renderThemePreview() {
  return `<div class="theme-preview"><div class="theme-preview-title">Prévia ao vivo</div><div class="theme-preview-row"><span style="color:var(--ac);font-weight:700;font-size:14px">ATELIER</span><span style="color:var(--mu);font-size:12px">·</span><span style="color:var(--mu);font-size:12px">Nível 4 · 380 XP</span></div><div class="theme-preview-row"><span class="type-icon criativa">${ico('sparkle')}</span><span style="font-size:13px;font-weight:500">Editar teaser</span><span class="score-badge hot">78</span><span class="tag" style="color:var(--ac)">Carreira</span></div><div class="theme-preview-bar"><div></div></div></div>`;
}
function renderAreasSection() {
  const areas = getAllAreas();
  return `<div class="section-group"><h3 style="margin-top:0">Áreas</h3>
    <div class="msg">Áreas profissionais ou pessoais para classificar tarefas e projetos.</div>
    ${areas.map((a,i) => `<div class="area-row ${a.archived?'archived':''}">
      <input type="color" data-area-color="${a.id}" value="${esc(a.color)}">
      <input type="text" data-area-name="${a.id}" value="${esc(a.n)}">
      <button data-a="areaArch" data-id="${a.id}" title="${a.archived?'Restaurar':'Arquivar'}" aria-label="${a.archived?'Restaurar área':'Arquivar área'}">${a.archived?ico('repeat'):ico('arrow-down')}</button>
    </div>`).join('')}
    <div class="add" style="margin-top:8px">
      <input id="newAreaName" placeholder="Nova área">
      <input type="color" id="newAreaColor" value="#d4a84b" style="max-width:60px;padding:2px;height:36px">
      <button data-a="areaAdd" aria-label="Adicionar área" title="Adicionar área">${ico('plus')}</button>
    </div>
  </div>`;
}
function renderTrashSection() {
  const items = listAllDeleted();
  return `<div class="section-group"><h3 style="margin-top:0">Lixo (${items.length})</h3>
    <div class="msg">Itens deletados ficam aqui. Recupere ou exclua permanentemente. Mantém até 200 itens. <b>Tarefas no lixo são deste dispositivo</b> (não sincronizam).</div>
    ${items.length ? items.map(it => `<div class="trash-row">
      <span class="trash-info"><div class="trash-title">${esc(it.title)}</div><div class="trash-meta">${ico(TRASH_ICON[it.type] || 'trash')} ${it.label} · ${new Date(it.at).toLocaleDateString('pt-BR')}</div></span>
      <button data-a="trashRestore" data-type="${it.type}" data-id="${it.obj.id}">${ico('repeat')} Restaurar</button>
      <button data-a="trashDelete" data-type="${it.type}" data-id="${it.obj.id}" aria-label="Excluir permanentemente" title="Excluir permanentemente">${ico('x')}</button>
    </div>`).join('') : '<div class="msg">Lixo vazio.</div>'}
    ${items.length ? `<div class="acts" style="margin-top:8px"><button data-a="trashEmpty" style="background:var(--er);color:#fff;border-color:var(--er)">Esvaziar lixo</button></div>` : ''}
  </div>`;
}
function viewConfig() {
  const jsonStr = JSON.stringify(S, null, 1);
  const currentTheme = S.cfg.theme || 'obsidian';
  const customAccent = S.cfg.accentColor;
  const themeCards = Object.entries(THEMES).map(([id, t]) => {
    const axis = `${t.mode === 'light' ? 'CLARO' : 'ESCURO'}${t.look ? ' · ' + t.look.toUpperCase() : ''}`;
    const art = themeArtVars({...t, ac: customAccent && id === currentTheme ? customAccent : t.ac});
    return `<button class="theme-card ${id === currentTheme ? 'on' : ''}" data-a="setTheme" data-id="${id}" style="${art}"><div class="theme-swatch" style="background:${t.bg};border-bottom:1px solid ${t.bd}"><span class="ts-aa" aria-hidden="true">Aa</span><span class="ts-dot" style="background:${customAccent && id === currentTheme ? customAccent : t.ac};color:${customAccent && id === currentTheme ? customAccent : t.ac}"></span><span class="ts-bar" style="background:${themeBarGradient(t)}"></span><span class="ts-dot" style="background:${t.bu};color:${t.bu}"></span></div><div class="theme-info"><div class="theme-name">${esc(t.n)}</div><div class="theme-desc">${esc(t.desc)}</div><div class="theme-axis" style="font-size:8.5px;line-height:1.2;color:var(--mu);margin-top:2px;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(axis)}</div></div></button>`;
  }).join('');
  const customRow = `<div class="custom-accent-row"><span style="font-size:12px;color:var(--mu)">Accent customizado:</span><input type="color" value="${esc(customAccent || THEMES[currentTheme].ac)}" data-a="setCustomAccent"><button data-a="clearCustomAccent" ${customAccent ? '' : 'disabled'}>${customAccent ? 'Remover custom' : 'Usar padrão do tema'}</button>${customAccent ? `<span style="font-size:11px;color:var(--mu)">Ativo: ${esc(customAccent)}</span>` : ''}</div>`;
  // v102 (Etapa 2): paleta por tema — toggle local + amostra dos 9 papéis.
  const palette = THEMES[currentTheme].palette || [];
  const paletteSwatches = palette.length ? `<div style="display:flex;gap:4px;margin:8px 0;flex-wrap:wrap">${palette.map((c, i) => `<span title="${PALETTE_ROLES[i]}" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--bd);background:${c};display:inline-block"></span>`).join('')}</div>` : '';
  const paletteRow = `<label class="full" style="flex-direction:row;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" data-c="themePalette" ${S.cfg.themePalette !== false ? 'checked' : ''} style="width:auto">Usar a paleta do tema em labels, áreas, habilidades e cores de tarefa</label>${paletteSwatches}<div class="msg" style="font-size:11.5px">Desligado = as cores que você escolheu (comportamento anterior). O toggle é local deste dispositivo.</div>`;
  const cur = S.cfg.primaryCurrency || 'BRL';
  const snapCopy = readRestorableCopy('snapshot');
  const prevCopy = readRestorableCopy('prev');
  const corruptRaw = readCorruptContent();
  const fmtCopyDate = ts => (typeof ts === 'number' && isFinite(ts)) ? new Date(ts).toLocaleString('pt-BR') : 'data desconhecida';
  return `
    ${typeof authSection === 'function' ? authSection() : ''}

    ${typeof syncSection === 'function' ? syncSection() : ''}

    <div class="section-group"><h3 style="margin-top:0">Aparência</h3><div class="msg" style="margin-bottom:10px">O tema altera fundo, superfícies e cores de destaque.</div>${renderThemePreview()}<div class="theme-grid">${themeCards}</div>${customRow}${paletteRow}</div>

    <div class="section-group"><h3 style="margin-top:0">Logo</h3><div class="msg">Opcional. PNG, SVG ou WEBP (máx 500KB). O texto "ATELIER" continua aparecendo ao lado, em fonte gótica.</div>${S.cfg.logo ? `<div style="margin:8px 0;display:flex;align-items:center;gap:8px"><img src="${esc(S.cfg.logo)}" alt="Logo" style="max-height:44px;max-width:160px;background:var(--s2);padding:6px;border-radius:8px"><span style="font-family:var(--font-display);font-size:24px;color:var(--ac);font-weight:700">ATELIER</span></div>` : ''}<div class="form"><label class="full">Enviar logo<input type="file" id="logoInput" accept="image/png,image/svg+xml,image/webp"></label></div>${S.cfg.logo ? `<div class="acts" style="margin-top:6px"><button data-a="logoRemove">Remover logo</button></div>` : ''}</div>

    ${renderAreasSection()}

    <div class="section-group"><h3 style="margin-top:0">Timer de foco</h3><div class="msg">Durações rápidas (blocos de foco):</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${(S.cfg.focusDurations||[]).map(m => `<span class="tag" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px">${m}min<button data-a="focusDurRem" data-m="${m}" style="padding:0 4px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px" aria-label="Remover ${m}min">${ico('x')}</button></span>`).join('')}</div><div class="add" style="margin-top:6px"><input type="number" id="focusDurAdd" placeholder="Nova duração (min)" style="max-width:180px"><button data-a="focusDurAdd">${ico('plus')}</button></div><div class="form" style="margin-top:8px"><label>Duração padrão (foco)<select data-c="defaultFocus">${selOptions((S.cfg.focusDurations||[]).map(m => [m, m+'min']), S.cfg.defaultFocus||25)}</select></label><label>Descanso curto (min)<input type="number" data-c="brk" value="${S.cfg.brk||5}"></label><label>Descanso longo (min)<input type="number" data-c="longBrk" value="${S.cfg.longBrk||15}"></label><label class="full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-c="focusNoStop" ${S.cfg.focusNoStop?'checked':''} style="width:auto">Sempre sair do foco sem parar timer</label></div><div class="msg">Ao terminar o foco, o app sugere um descanso (curto ou longo); ele só inicia se você confirmar. O descanso longo é sugerido a cada 4 pomodoros.</div></div>

    <div class="section-group"><h3 style="margin-top:0">Configurações</h3><div class="form"><label>Alerta de foco (min)<input type="number" data-c="focus" value="${S.cfg.focus||50}"></label><label>Capacidade diária<input type="number" data-c="cap" value="${S.cfg.cap||360}"></label><label>Moeda principal<select data-c="primaryCurrency">${selOptions(Object.keys(CURRENCIES).map(c=>[c,CURRENCIES[c].sym+' '+c]), cur)}</select></label><label>Câmbio USD→BRL<input type="number" step="0.01" data-c="usdRate" value="${S.cfg.usdRate||5.2}"></label><label>Câmbio EUR→BRL<input type="number" step="0.01" data-c="eurRate" value="${S.cfg.eurRate||5.6}"></label><label>Densidade tarefas<select data-c="taskDensity">${selOptions([['auto','Auto (mobile: compacto)'],['compact','Sempre compacto'],['full','Sempre completo']], S.cfg.taskDensity||'auto')}</select></label><label class="full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-c="autoPriority" ${S.cfg.autoPriority?'checked':''} style="width:auto">Prioridade automática</label></div></div>

    <div class="section-group"><h3 style="margin-top:0">XP</h3><div class="msg">Curva progressiva (nível 1→2 custa 150 XP, cresce 20% por nível). Repetição da mesma tarefa em 30 dias vale 50%. Tarefas em Compromissos/Pessoal não dão XP.</div><div class="form"><label>XP total<input type="text" readonly value="${Math.round(globalXp())}"></label><label>Nível<input type="text" readonly value="${levelInfo(globalXp()).lv}"></label></div><div class="acts" style="margin-top:8px"><button data-a="resetXp" style="background:var(--er);color:#fff;border-color:var(--er)">${ico('alert')} Resetar XP (corrige valores corrompidos)</button></div></div>

    ${renderTrashSection()}

    <div class="section-group"><h3 style="margin-top:0">Backup</h3><div class="msg">Último backup: ${S.cfg.lastBackupAt ? new Date(S.cfg.lastBackupAt).toLocaleString('pt-BR') : 'nunca'}</div><div class="warn" style="background:color-mix(in srgb,var(--wr) 15%,var(--s1));border:1px solid var(--wr);border-radius:8px;padding:8px 10px;font-size:12px;margin:8px 0"><b style="color:var(--wr)">Dados em localStorage.</b> Faça backups regulares.</div><textarea id="exp" rows="5" readonly>${esc(jsonStr)}</textarea><div class="acts"><button data-a="dl">Baixar JSON</button><button data-a="cpj">Copiar JSON</button></div></div>

    <div class="section-group"><h3 style="margin-top:0">Importar</h3><div class="form"><label class="full">Selecionar arquivo JSON<input type="file" id="importFileInput" accept=".json,application/json"></label></div><textarea id="imp" rows="4" placeholder="Ou cole o JSON do backup aqui" style="margin-top:8px"></textarea><div class="acts"><button data-a="imp">Importar texto colado</button></div><div class="msg">Snapshot do estado atual é salvo antes de substituir.</div></div>

    <div class="section-group"><h3 style="margin-top:0">Restaurar cópias</h3>
      ${snapCopy && !snapCopy.error ? `<div class="msg">Cópia automática de ${fmtCopyDate(snapCopy.ts)}.</div><div class="acts"><button data-a="restoreSnapshot">Restaurar cópia automática</button></div>` : (snapCopy && snapCopy.error ? '<div class="msg">A cópia automática existe, mas está inválida.</div>' : '<div class="msg">Nenhuma cópia automática disponível.</div>')}
      ${prevCopy && !prevCopy.error ? `<div class="msg">Cópia anterior à importação de ${fmtCopyDate(prevCopy.ts)}.</div><div class="acts"><button data-a="restorePrev">Restaurar cópia anterior</button></div>` : (prevCopy && prevCopy.error ? '<div class="msg">A cópia anterior existe, mas está inválida.</div>' : '')}
      ${corruptRaw ? `<div class="warn" style="background:color-mix(in srgb,var(--wr) 15%,var(--s1));border:1px solid var(--wr);border-radius:8px;padding:8px 10px;font-size:12px;margin:8px 0">Conteúdo preservado de uma leitura com problema. <b>Não é um backup válido</b> — use apenas para inspeção.</div><div class="acts"><button data-a="dlCorrupt">Baixar conteúdo preservado</button></div>` : ''}
      <div class="msg">Restaurar substitui os dados atuais; uma cópia do estado atual é guardada antes.</div>
    </div>

    <div class="section-group"><h3 style="margin-top:0">Ajuda</h3><div class="msg">Apresentação inicial, login e escolha de tema.</div><div class="acts"><button data-a="onboardingOpen">Rever apresentação inicial</button></div></div>

    <div class="section-group"><h3 style="margin-top:0">Estatísticas</h3><div class="stats"><span>Tarefas: <b>${S.tasks.length}</b></span><span>Projetos: <b>${alive(S.projects).length}</b></span><span>Clientes: <b>${alive(S.clients).length}</b></span><span>Vagas: <b>${alive(S.applications).length}</b></span><span>Contatos: <b>${alive(S.contacts).length}</b></span><span>Áreas: <b>${getAreas().length}</b></span><span>XP: <b>${Math.round(globalXp())}</b></span></div></div>`;
}

/* --- REGISTRO DE VIEWS (chave = id da aba) --- */
const VIEWS = {
  week: viewWeek, q: viewQueue, jobs: viewJobs, proj: viewProjects,
  clients: viewClients, earn: viewEarnings,
  cal: viewCalendar, goal: viewGoals, skills: viewSkills, stats: viewStats, review: viewReview,
  rede: () => viewContacts('pro'), friends: () => viewContacts('personal'),
  history: viewHistory, cmds: viewCommands, config: viewConfig
};

/* --- MODAIS DE CONTATO --- */
function showSnoozeMenu(contactId) {
  const c = S.contacts.find(x => x.id === contactId); if (!c) return;
  closeSnoozeMenu();
  const el = document.createElement('div');
  el.id = 'snoozeMenu'; el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content" style="max-width:340px"><h3 style="margin-top:0;color:var(--ac)">Adiar contato</h3><div style="font-size:12px;color:var(--mu);margin-bottom:12px">${esc(c.n)}</div><div style="display:flex;flex-direction:column;gap:6px">${SNOOZE_REASONS.map(r => `<button data-a="snoozeApply" data-id="${c.id}" data-reason="${r.id}" data-days="${r.days}" style="text-align:left;padding:10px 12px">${esc(r.n)} <span style="color:var(--mu);font-size:11px">· +${r.days}d</span></button>`).join('')}</div><button data-a="closeSnooze" style="margin-top:12px;width:100%">Cancelar</button></div>`;
  document.body.appendChild(el);
}
function closeSnoozeMenu() {document.getElementById('snoozeMenu')?.remove();}
function openInteractionSheet(contactId) {
  const c = S.contacts.find(x => x.id === contactId); if (!c) return;
  closeInteractionSheet();
  const el = document.createElement('div');
  el.id = 'interactionSheet'; el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content" style="max-width:400px"><h3 style="margin-top:0;color:var(--ac)">Registrar interação</h3><div style="font-size:12px;color:var(--mu);margin-bottom:12px">${esc(c.n)}</div><div class="form"><label>Direção<select id="iaDir"><option value="out">Enviei</option><option value="in">Recebi</option></select></label><label>Tipo<select id="iaType">${INTERACTION_TYPES.map(t => `<option value="${t.id}">${t.n}</option>`).join('')}</select></label><label class="full">Nota<textarea id="iaNote" rows="2"></textarea></label></div><div class="acts" style="margin-top:12px"><button data-a="interactionSave" data-id="${c.id}" style="background:var(--ac);color:#000;border-color:var(--ac);flex:1">Registrar</button><button data-a="closeInteraction">Cancelar</button></div></div>`;
  document.body.appendChild(el);
}
function closeInteractionSheet() {document.getElementById('interactionSheet')?.remove();}

/* --- FOLHA DE REGISTRO DE TRABALHO (resumo por tarefa) --- */
function openWorkLogSheet(taskId) {
  const t = S.tasks.find(x => x.id === taskId); if (!t) return;
  closeWorkLogSheet();
  const today = iso(new Date());
  const existing = (S.workLogs || []).find(l => l.taskId === taskId && l.date === today);
  const el = document.createElement('div');
  el.id = 'workLogSheet'; el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content" style="max-width:440px"><h3 style="margin-top:0;color:var(--ac)">Registro de trabalho</h3><div style="font-size:12px;color:var(--mu);margin-bottom:12px">${esc(t.t)} · ${fmtDate(today)}</div><div class="form"><label class="full">O que você fez?<textarea id="wlText" rows="4" placeholder="Resumo opcional do trabalho realizado…">${esc(existing ? existing.text : '')}</textarea></label></div><div class="acts" style="margin-top:12px"><button data-a="workLogSave" data-id="${t.id}" style="background:var(--ac);color:#000;border-color:var(--ac);flex:1">Salvar</button><button data-a="closeWorkLog">Cancelar</button></div></div>`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById('wlText')?.focus(), 30);
}
function closeWorkLogSheet() {document.getElementById('workLogSheet')?.remove();}

/* --- RELATÓRIO SEMANAL (folha) --- */
function renderWeeklyReportHTML(r) {
  const line = it => {
    const time = it.timeMinutes != null ? ` · <b>${fmtMin(it.timeMinutes)}</b>` : '';
    const summary = it.summary ? `<div class="report-item-summary">${esc(it.summary)}</div>` : '<div class="report-item-summary report-item-summary--empty">Sem resumo registrado.</div>';
    return `<div class="report-item"><div class="report-item-title">${esc(it.title)}${time}${it.kind === 'log' ? ' <span class="tag" style="opacity:.7">tarefa removida</span>' : ''}</div>${summary}</div>`;
  };
  let html = '';
  if (r.projects.length) {
    html += '<h4>Resumo por projeto</h4>';
    r.projects.forEach(g => html += `<div class="report-group"><div class="report-group-name">${ico('briefcase')} ${esc(g.name)}</div>${g.items.map(line).join('')}</div>`);
  }
  if (r.areas.length) {
    html += '<h4>Atividades avulsas por área</h4>';
    r.areas.forEach(g => html += `<div class="report-group"><div class="report-group-name">${esc(g.label)}</div>${g.items.map(line).join('')}</div>`);
  }
  const m = r.metrics;
  html += `<h4>Métricas do período</h4><div class="report-metrics"><span>${m.done} tarefa${m.done !== 1 ? 's' : ''} concluída${m.done !== 1 ? 's' : ''}</span><span>Tempo: <b>${fmtMin(m.timeMinutes)}</b></span>${m.withoutTime ? `<span>${m.withoutTime} sem tempo registrado</span>` : ''}${m.orphanCount ? `<span>${m.orphanCount} registro(s) de tarefas removidas</span>` : ''}</div>`;
  if (!r.projects.length && !r.areas.length && !m.done && !m.orphanCount) html = '<div class="msg">Nada registrado nesta semana.</div>';
  return html;
}
function openReportSheet() {
  const range = reportWeekRange();
  const r = buildWeeklyReport(range.start, range.end);
  closeReportSheet();
  const el = document.createElement('div');
  el.id = 'reportSheet'; el.className = 'shortcuts-modal';
  el.innerHTML = `<div class="shortcuts-content report-content"><div class="big" style="margin:0 0 4px"><b>Relatório semanal</b><button data-a="closeReport" aria-label="Fechar relatório" title="Fechar relatório">${ico('x')}</button></div><div class="msg" style="margin-bottom:10px">${r.startDate.split('-').reverse().join('/')} a ${r.endDate.split('-').reverse().join('/')} · segunda a domingo</div><div id="reportBody">${renderWeeklyReportHTML(r)}</div><div class="acts"><button data-a="reportCopy" style="background:var(--ac);color:#000;border-color:var(--ac);flex:1">Copiar Markdown</button><button data-a="closeReport">Fechar</button></div></div>`;
  document.body.appendChild(el);
}
function closeReportSheet() {document.getElementById('reportSheet')?.remove();}

/* --- TIMER (widget do topo) --- */
function renderTimer() {
  const el = $('#timerWidget'), lbl = $('#tlabel'), time = $('#ttime'), stopBtn = $('#tstop'), bankEl = $('#tbank');
  if (!el) return;
  if (!S.timer) {el.classList.remove('run'); lbl.textContent = 'Pronto'; time.textContent = '00:00'; stopBtn.style.display = 'none'; if (bankEl) {const b = ensureFocusBank(); const inBlock = Math.floor((b.sec || 0) % (25 * 60) / 60); bankEl.textContent = '🍅 ' + (b.count || 0) + ' hoje' + ((b.sec || 0) > 0 ? ' · ' + inBlock + '/25' : '');} return;}
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  el.classList.add('run');
  time.textContent = fmtClock(timerElapsedSec());
  let label = t ? t.t : '—';
  let prefix = '';
  if (S.timer.phase === 'rest') prefix = ico('tomato');
  else if (S.timer.paused) prefix = ico('pause');
  if (S.timer.subId && t) {const sb = t.subs.find(x => x.id === S.timer.subId); if (sb) {label = sb.t; prefix = '';}}
  lbl.innerHTML = (prefix ? prefix + ' ' : '') + esc(label.slice(0, 40));
  if (bankEl) {
    const bank = ensureFocusBank();
    const inBlock = Math.floor((focusBankSec() % (25 * 60)) / 60);
    bankEl.textContent = S.timer.phase === 'rest' ? '🍅 ' + (bank.count || 0) + ' hoje' : '🍅 ' + (bank.count || 0) + ' · ' + inBlock + '/25';
  }
  stopBtn.style.display = '';
}

/* --- MODO FOCO (overlay fullscreen) --- */
function openFocus(taskId) {const t = S.tasks.find(x => x.id === taskId); if (!t || isDone(t)) return toast('Escolha uma tarefa pendente', true); focusTaskId = taskId; renderFocus();}
function closeFocus() {
  if (S.timer && S.timer.taskId === focusTaskId) {
    // Se configurado "nunca parar", mantém o timer rodando e só fecha o overlay
    if (S.cfg.focusNoStop) {
      const t = S.tasks.find(x => x.id === S.timer.taskId);
      const subId = S.timer.subId;
      const sub = subId && t?.subs.find(s => s.id === subId);
      const lbl = sub ? sub.t : t?.t || 'tarefa';
      focusTaskId = null;
      document.getElementById('focusOverlay')?.remove();
      toast('Timer continua em ' + lbl.slice(0,30) + ' · pause no topo para parar');
      return;
    }
    showCloseFocusModal();
    return;
  }
  focusTaskId = null;
  document.getElementById('focusOverlay')?.remove();
}
function showCloseFocusModal() {
  document.getElementById('closeFocusModal')?.remove();
  const t = S.tasks.find(x => x.id === S.timer?.taskId);
  const sub = S.timer?.subId && t?.subs.find(s => s.id === S.timer.subId);
  const lbl = sub ? sub.t : t?.t || 'tarefa';
  const modal = document.createElement('div');
  modal.id = 'closeFocusModal';
  modal.className = 'shortcuts-modal';
  modal.innerHTML = `<div class="shortcuts-content">
    <h3 style="margin-top:0">Sair do foco?</h3>
    <div style="font-size:13px;color:var(--mu);margin:8px 0 14px">Timer continua rodando em "${esc(lbl)}"</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button data-a="closeFocusConfirm" style="background:var(--ac);color:#000;border-color:var(--ac);padding:10px">Sim, continuar timer</button>
      <button data-a="closeFocusStop" style="padding:10px">Parar timer e sair</button>
      <button data-a="closeFocusCancel" style="padding:10px;background:transparent">Cancelar</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}
function showFocusCompleteModal(t) {
  document.getElementById('focusCompleteModal')?.remove();
  // v116: congela o timer enquanto o modal está aberto. Sem isso, o tempo
  // gasto decidindo "Concluir" era contado na tarefa (mais perceptível no mobile).
  try {
    if (S.timer && !S.timer.paused && S.timer.taskId === t.id) {
      pauseTimer();
      window.__focusCompletePausedTimer = true;
    }
  } catch (e) {}
  const modal = document.createElement('div');
  modal.id = 'focusCompleteModal';
  modal.className = 'shortcuts-modal';
  modal.innerHTML = `<div class="shortcuts-content">
    <h3 style="margin-top:0">Concluir tarefa?</h3>
    <div style="font-size:13px;color:var(--mu);margin:8px 0 14px">Todas as subtarefas de "${esc(t.t)}" foram concluídas.</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button type="button" data-a="focusCompleteYes" data-id="${t.id}" style="background:var(--ac);color:#000;border-color:var(--ac);padding:10px">Concluir tarefa</button>
      <button type="button" data-a="focusCompleteNo" style="padding:10px">Continuar sem concluir</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}
function updateFocusTimer() {if (!focusTaskId || !S.timer || S.timer.taskId !== focusTaskId) return; if (S.timer.paused) return; const elapsedSec = timerElapsedSec(); const targetMin = S.timer.targetMin || focusTargetMin; const remainingSec = Math.max(0, targetMin * 60 - elapsedSec); const te = document.getElementById('focusTime'); if (te) te.textContent = fmtClock(remainingSec); const prog = targetMin > 0 ? Math.min(1, (elapsedSec/60) / targetMin) : 0; const circ = 2 * Math.PI * 100; const c = document.querySelector('.focus-progress'); if (c) c.style.strokeDashoffset = circ * (1 - prog); const sp = document.getElementById('focusSpent'); if (sp) {const m = Math.floor(subElapsedSec() / 60); if (sp.dataset.m !== String(m)) {sp.dataset.m = String(m); sp.textContent = fmtMin(m);}}}

function renderFocus() {
  if (!focusTaskId) return;
  const t = S.tasks.find(x => x.id === focusTaskId);
  if (!t || isDone(t)) return closeFocus();
  let el = document.getElementById('focusOverlay');
  if (!el) {el = document.createElement('div'); el.id = 'focusOverlay'; el.className = 'focus-overlay'; document.body.appendChild(el);}

  const timerOnThisTask = S.timer && S.timer.taskId === t.id;
  const timerRunning = S.timer && !S.timer.paused;
  // v97: "Pular" também aparece com o timer PAUSADO (só exige fase de foco com alvo).
  const isPomodoro = !!(S.timer && S.timer.phase === 'focus' && S.timer.targetMin);
  const bankNow = ensureFocusBank();
  const bankCount = bankNow.count || 0;
  const phase = (timerOnThisTask && S.timer.phase) ? S.timer.phase : 'focus';
  const isPaused = timerOnThisTask && S.timer.paused;
  const restPending = timerOnThisTask && phase === 'rest' && isPaused && (S.timer.accumulated || 0) === 0;
  const restDone = timerOnThisTask && phase === 'rest' && isPaused && (S.timer.accumulated || 0) > 0;
  const reviewPending = timerOnThisTask && phase === 'review' && isPaused;
  const hasTarget = timerOnThisTask && S.timer.targetMin && !reviewPending;
  const elapsedSec = timerOnThisTask ? timerElapsedSec() : 0;
  const targetMin = hasTarget ? S.timer.targetMin : focusTargetMin;
  const remainingSec = hasTarget ? Math.max(0, targetMin * 60 - elapsedSec) : targetMin * 60;
  const progress = (hasTarget && !restPending && !restDone) ? Math.min(1, (elapsedSec/60) / targetMin) : 0;
  const circ = 2 * Math.PI * 100;
  const offset = circ * (1 - progress);
  const timeStr = reviewPending ? fmtMin(S.timer.reviewMin || 0) : ((restPending || restDone) ? '✓' : (!timerOnThisTask ? fmtClock(targetMin * 60) : (!hasTarget ? fmtClock(elapsedSec) : fmtClock(remainingSec))));
  const spentMin = timerOnThisTask ? Math.floor(subElapsedSec() / 60) : 0;
  const durations = getFocusDurations();
  const runningSubId = timerOnThisTask ? S.timer.subId : null;
  const runningSub = runningSubId ? t.subs.find(s => s.id === runningSubId) : null;
  const firstPending = (t.subs||[]).filter(s => !s.d && !s.deletedAt).sort((a,b) => (a.order||0)-(b.order||0))[0];
  const switchTasks = S.tasks.filter(x => !x.deletedAt && !isDone(x) && x.id !== t.id).sort((a,b) => (a.day??99)-(b.day??99) || (a.order||0)-(b.order||0)).slice(0, 40);
  const switchHidden = !!S.cfg.focusSwitchHidden;
  const switchHtml = (timerOnThisTask && phase === 'focus' && switchTasks.length && !switchHidden)
    ? `<div class="focus-switch-row"><select class="focus-switch" data-a="focusSwitch" aria-label="Trocar tarefa no modo foco" title="Trocar tarefa (atalhos [ e ])"><option value="">⇄ Trocar tarefa</option>${switchTasks.map(x => `<option value="${esc(x.id)}">${esc(x.t.slice(0, 48))}</option>`).join('')}</select><button type="button" class="focus-switch-hide" data-a="focusSwitchToggle" aria-label="Ocultar troca de tarefa" title="Ocultar troca de tarefa">×</button></div>`
    : '';
  const switchReveal = (timerOnThisTask && phase === 'focus' && switchTasks.length && switchHidden)
    ? `<button type="button" data-a="focusSwitchToggle" class="focus-btn ghost" title="Mostrar troca de tarefa">⇄ Trocar</button>`
    : '';

  const ringColor = !timerOnThisTask ? 'var(--bu)' : (phase === 'rest' ? 'var(--ok)' : (isPaused ? 'var(--wr)' : 'var(--ac)'));
  let eyebrow;
  if (!timerOnThisTask) eyebrow = 'Pronto para focar';
  else if (reviewPending) eyebrow = 'Bloco concluído';
  else if (restDone) eyebrow = 'Descanso concluído';
  else if (restPending) eyebrow = 'Foco concluído';
  else if (runningSub) eyebrow = (isPaused ? 'Pausado · ' : 'Sessão · ') + runningSub.t.slice(0, 30);
  else if (isPaused) eyebrow = 'Pausado';
  else if (phase === 'rest') eyebrow = 'Descanso · ' + bankCount + ' hoje';
  else eyebrow = 'Foco · ' + bankCount + ' hoje';

  let primaryBtn;
  if (!timerOnThisTask) {
    const label = `${ico('play')} Iniciar ${targetMin}min`;
    primaryBtn = `<button data-a="focusStart" class="focus-btn start">${label}</button>`;
  }
  else if (isPaused) primaryBtn = `<button data-a="focusResume" class="focus-btn start">${ico('play')} Retomar</button>`;
  else primaryBtn = `<button data-a="focusPause" class="focus-btn pause">${ico('pause')} Pausar</button>`;

  const skipBtn = (timerOnThisTask && isPomodoro) ? `<button data-a="focusSkip" class="focus-btn ghost">${ico('chevron-down','ico--next')} Pular</button>` : '';
  const durationsHtml = !timerOnThisTask ? `<div class="focus-durations">${durations.map(m => `<button data-a="focusSetTarget" data-m="${m}" class="${focusTargetMin===m?'on':''}">${m}min</button>`).join('')}</div>` : '';
  const cycleDots = bankCount > 0 ? `<div style="font-size:14px;color:var(--mu);margin-top:4px;letter-spacing:2px">${ico('tomato').repeat(Math.min(bankCount, 8))}</div>` : '';

  let phaseSubtitle;
  const bankSec = focusBankSec();
  const bankInBlock = Math.floor((bankSec % (25 * 60)) / 60);
  const bankRemain = Math.max(0, Math.ceil((25 * 60 - (bankSec % (25 * 60))) / 60));
  if (reviewPending) phaseSubtitle = `Bloco concluído · ${S.timer.reviewMin || 0}min · foco ${bankInBlock}/25 · faltam ${bankRemain}min para 1 pomodoro`;
  else if (restPending) {
    const poms = (S.timer.reviewPoms != null) ? S.timer.reviewPoms : 1;
    phaseSubtitle = poms > 0 ? `${poms} pomodoro${poms > 1 ? 's' : ''} · pausa recomendada ${S.timer.restMin || S.cfg.brk || 5}min` : `Pausa escolhida · ${S.timer.restMin || S.cfg.brk || 5}min`;
  }
  else if (restDone) phaseSubtitle = 'Descanso concluído';
  else if (!timerOnThisTask) phaseSubtitle = `Bloco de ${targetMin}min`;
  else if (S.timer.targetMin) phaseSubtitle = `Foco · ${S.timer.targetMin}min · ${bankInBlock}/25`;
  else phaseSubtitle = `Foco livre · ${bankInBlock}/25`;

  const hint = firstPending && !timerOnThisTask ? 'Iniciando na primeira subtarefa pendente' : '';

  const subs = activeSubs(t);
  const subsHtml = `
    <div class="focus-subs">
      <div class="focus-subs-title">Subtarefas (${subs.filter(s=>s.d).length}/${subs.length})</div>
      ${subs.map((s) => {
        const isRun = timerOnThisTask && runningSubId === s.id;
        const origIdx = (t.subs||[]).findIndex(x => x.id === s.id);
        return `<div class="focus-sub${isRun ? ' run' : ''}">
          <input type="checkbox" data-a="focusSub" data-sub="${s.id}" data-i="${origIdx}" ${s.d ? 'checked' : ''} title="${s.d ? 'Marcar como pendente' : 'Concluir subtarefa'}">
          <span class="${s.d ? 'x' : ''}" style="flex:1" contenteditable="true" data-subedit="${t.id}:${s.id}" role="textbox" aria-label="Renomear subtarefa" title="Clique para renomear">${esc(s.t)}</span>
          <button class="focus-del" data-a="sdel" data-id="${t.id}" data-sub="${s.id}" title="Excluir subtarefa" aria-label="Excluir subtarefa">${ico('x')}</button><button class="focus-play" data-a="focusSelectSub" data-sub="${s.id}" title="${isRun ? 'Etapa atual em andamento' : 'Focar nesta subtarefa'}" aria-label="Focar nesta subtarefa" ${(isRun || s.d) ? 'disabled' : ''}>${ico('play')}</button>
        </div>`;
      }).join('')}
      <input data-a="sadd" data-id="${t.id}" placeholder="Nova subtarefa (Enter)" style="margin-top:8px;width:100%">
    </div>`;

  // Quadrado: tempo no segmento atual (congela no descanso, recomeça ao trocar de sub/foco).
  // Com o timer em outra tarefa, mostra "—": o overlay não reflete o timer de A.
  const spentHtml = timerOnThisTask
    ? `<div class="focus-spent" id="focusSpent" data-m="${spentMin}">${fmtMin(spentMin)}</div>`
    : (S.timer ? '<div class="focus-spent">—</div>' : '');

  // Aviso H1: timer em OUTRA tarefa (rodando ou pausado). Tempo sempre no mesmo
  // significado: com targetMin mostra o restante; sem targetMin, o decorrido.
  let elsewhereHtml = '';
  if (S.timer && S.timer.taskId !== t.id) {
    const tt = S.tasks.find(x => x.id === S.timer.taskId);
    const sub = S.timer.subId && tt ? (tt.subs || []).find(s => s.id === S.timer.subId) : null;
    const lbl = (tt && tt.t) || 'outra tarefa';
    const here = String(t.t || '');
    const cut = (v, n) => v.length > n ? v.slice(0, n - 1) + '…' : v;
    const secs = S.timer.targetMin ? Math.max(0, S.timer.targetMin * 60 - timerElapsedSec()) : timerElapsedSec();
    const what = (S.timer.paused ? 'Timer pausado em: ' : 'Timer ativo em: ') + lbl + (sub ? ' · ' + sub.t : '') + ' · ' + fmtClock(secs);
    elsewhereHtml = `<div class="focus-elsewhere" style="margin:2px 0 10px;padding:8px 10px;border:1px solid var(--bd);border-radius:8px;background:var(--s1);font-size:12px;color:var(--tx);text-align:left">
      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(what)}">${esc(what)}</div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
        <button data-a="focusGoToActiveTimer" class="focus-btn ghost">Voltar para ${esc(cut(lbl, 18))}</button>
        <button data-a="focusStopAndStartHere" class="focus-btn ghost">Parar ${esc(cut(lbl, 18))} e iniciar ${esc(cut(here, 18))}</button>
      </div>
    </div>`;
  }

  let restChoiceHtml = '';
  if (reviewPending) {
    const short = S.cfg.brk || 5;
    restChoiceHtml = `<div class="focus-rest-choice">
      <div class="focus-rest-choice-title">Bloco concluído · ${S.timer.reviewMin || 0} min</div>
      <div class="msg" style="font-size:12px;margin:0 0 6px">Foco ${bankInBlock}/25 · faltam ${bankRemain}min para 1 pomodoro. Pausa ainda não é recomendada.</div>
      <button data-a="focusContinue" class="focus-btn start">${ico('play')} Continuar foco</button>
      <button data-a="focusRest" data-min="${short}" class="focus-btn ghost" title="Disponível, mas não recomendada agora">${ico('timer')} Pausa de ${short}min (não recomendada)</button>
      <button data-a="focusStop" class="focus-btn ghost">${ico('stop')} Encerrar</button>
    </div>`;
  } else if (restPending) {
    const poms = (S.timer.reviewPoms != null) ? S.timer.reviewPoms : 1;
    const recommended = S.timer.restMin || S.cfg.brk || 5;
    restChoiceHtml = `<div class="focus-rest-choice">
      <div class="focus-rest-choice-title">${poms > 0 ? poms + ' pomodoro' + (poms > 1 ? 's' : '') + ' batido' + (poms > 1 ? 's' : '') : 'Pausa escolhida'}</div>
      <button data-a="focusRest" data-min="${recommended}" class="focus-btn ${poms > 0 ? 'start' : 'ghost'}">${ico('timer')} ${poms > 0 ? 'Pausa recomendada' : 'Pausa (não recomendada)'} (${recommended}min)</button>
      <button data-a="focusSkip" class="focus-btn ghost">${ico('chevron-down','ico--next')} Continuar sem pausa</button>
      <button data-a="focusStop" class="focus-btn ghost">${ico('stop')} Encerrar</button>
    </div>`;
  } else if (restDone) {
    const choices = getFocusDurations();
    const last = choices.includes(focusTargetMin) ? focusTargetMin : choices[0];
    restChoiceHtml = `<div class="focus-rest-choice">
      <div class="focus-rest-choice-title">Descanso concluído</div>
      <div class="msg" style="font-size:12px;margin:0 0 6px">Escolha o próximo bloco — o banco de foco continua em ${bankInBlock}/25.</div>
      <div class="focus-durations">${choices.map(m => `<button data-a="focusStartFromRest" data-m="${m}" class="${m === last ? 'on' : ''}">${m}min</button>`).join('')}</div>
      <button data-a="focusStartFromRest" data-m="${last}" class="focus-btn start">${ico('play')} Iniciar ${last}min</button>
      <button data-a="focusStop" class="focus-btn ghost">${ico('stop')} Encerrar</button>
    </div>`;
  }

  const actionsHtml = (restPending || restDone || reviewPending)
    ? restChoiceHtml
    : `<div class="focus-actions">
        ${primaryBtn}
        ${skipBtn}
        ${switchReveal}
        <button data-a="log" data-id="${t.id}" data-m="5" class="focus-btn ghost">+5m</button>
        <button data-a="log" data-id="${t.id}" data-m="-5" class="focus-btn ghost">-5m</button>
        <button data-a="closeFocus" class="focus-btn ghost">Sair</button>
      </div>`;

  el.innerHTML = `
    <div class="focus-content" data-phase="${phase}">
      <button class="focus-close" data-a="closeFocus" aria-label="Fechar modo foco" title="Fechar modo foco">${ico('x')}</button>
      <div class="focus-eyebrow" data-phase="${phase}">${esc(eyebrow)}</div>
      ${elsewhereHtml}
      <h1 class="focus-title">${esc(t.t)}</h1>
      ${switchHtml}
      <div class="focus-timer-wrap">
        <svg class="focus-circle" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100" fill="none" stroke="var(--bd)" stroke-width="6"/>
          <circle cx="120" cy="120" r="100" fill="none" stroke="${ringColor}" stroke-width="6" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 120 120)" stroke-linecap="round" class="focus-progress" style="transition:stroke-dashoffset .3s, stroke .3s"/>
        </svg>
        <div class="focus-time" id="focusTime">${timeStr}</div>
      </div>
      <div class="focus-phase-label" data-phase="${phase}">${esc(phaseSubtitle)}</div>
      ${spentHtml}
      ${hint ? `<div class="focus-hint" style="margin-top:6px;opacity:1;color:var(--ac);font-size:11px">${esc(hint)}</div>` : ''}
      ${cycleDots}
      ${durationsHtml}
      ${actionsHtml}
      ${subsHtml}
    </div>`;
}