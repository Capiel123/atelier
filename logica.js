// =========================================================
// LOGICA.JS — Regras de negócio
// XP, scores, contatos, projetos, vagas, timer, filtros.
// Nada aqui gera HTML — apenas cálculos e mutações em S.
// =========================================================

/* --- XP E NÍVEIS --- */
function xpToNextLevel(level) { return Math.round(LEVEL_XP * (1 + (level - 1) * 0.2)); }
function levelInfo(xp) {
  xp = num(xp);
  let acc = 0, lvl = 1;
  while (acc + xpToNextLevel(lvl) <= xp && lvl < 1000) {acc += xpToNextLevel(lvl); lvl++;}
  const inLevel = xp - acc;
  const forLevel = xpToNextLevel(lvl);
  return {lv: lvl, inLevel, forLevel, toNext: Math.round(forLevel - inLevel), progress: Math.min(1, inLevel / forLevel)};
}
function levelOf(xp) {return levelInfo(xp).lv;}
function levelProgress(xp) {return levelInfo(xp).progress;}
function globalXp() { return (num(S.xpPool)) + S.skills.reduce((a,s) => a + num(s.xp), 0); }
function taskBaseXp(t) {
  const base = [30, 20, 10][t.pr] + Math.round((t.est || 0) / 10);
  const cutoff = Date.now() - 30 * 86400000;
  const norm = (t.t || '').toLowerCase().trim();
  const repeated = S.tasks.some(other => other.id !== t.id && other.done && other.doneAt && other.doneAt >= cutoff && (other.t || '').toLowerCase().trim() === norm);
  return Math.round(base * (repeated ? 0.5 : 1));
}
function subXp(sb, task) {
  if (!task) return 5 + Math.min(10, Math.round((sb.est || 0) / 10));
  const subsCount = Math.max(1, (task.subs || []).length);
  return Math.round(taskBaseXp(task) / subsCount);
}
function isPersonalSection(t) {
  const s = t.section || (t.time ? 'commitment' : (t.area === 'Pessoal' ? 'personal' : 'work'));
  return s === 'personal' || s === 'commitment';
}
function awardTaskXp(t) {
  if (t.xpClaimed) return false;
  t.xpClaimed = true;
  if (isPersonalSection(t)) return false;
  const subs = t.subs || [];
  if (subs.length > 0) { subs.forEach(sb => awardSubXp(t, sb, true)); return true; }
  const xp = taskBaseXp(t);
  const valid = (t.skills || []).map(id => S.skills.find(x => x.id === id && !x.deletedAt)).filter(Boolean);
  if (valid.length) valid.forEach(sk => {sk.xp = num(sk.xp) + xp / valid.length; touch(sk);});
  else S.xpPool = num(S.xpPool) + xp;
  return true;
}
function awardSubXp(t, sb, silent) {
  if (sb.xpClaimed) return false;
  sb.xpClaimed = true;
  if (isPersonalSection(t)) return false;
  const totalXp = taskBaseXp(t);
  const subsCount = Math.max(1, (t.subs || []).length);
  const xp = totalXp / subsCount;
  const valid = (t.skills || []).map(id => S.skills.find(x => x.id === id && !x.deletedAt)).filter(Boolean);
  if (valid.length) valid.forEach(sk => {sk.xp = num(sk.xp) + xp / valid.length; touch(sk);});
  else S.xpPool = num(S.xpPool) + xp;
  return true;
}

/* --- MÉTRICAS DE TAREFA / HABILIDADE / PROJETO --- */
function taskMinutes(t) {return (t.logs || []).reduce((a,l) => a + (+l.minutes || 0), 0);}
function subMinutes(t, subId) {return (t.logs || []).filter(l => l.subId === subId).reduce((a,l) => a + (+l.minutes || 0), 0);}
function skillMinutes(sid, days) {let m = 0; S.tasks.forEach(t => {if (!t.skills || !t.skills.includes(sid)) return; const total = taskMinutes(t); if (!total) return; if (days) {const cutoff = Date.now() - days * 86400000; const inPeriod = (t.logs || []).filter(l => (l.start && l.start >= cutoff) || (l.end && l.end >= cutoff) || (!l.start && !l.end)).reduce((a,l) => a + (+l.minutes || 0), 0); if (!inPeriod) return; m += inPeriod / t.skills.length;} else m += total / t.skills.length;}); return Math.round(m);}
function skillTaskCount(sid) {return S.tasks.filter(t => t.done && (t.skills||[]).includes(sid)).length;}
function skillProjectCount(sid) {const pids = new Set(); S.tasks.forEach(t => {if (t.proj && (t.skills||[]).includes(sid)) pids.add(t.proj);}); return pids.size;}
function skillStreak(sid) {const today = new Date(); const todayStr = iso(today); const yStr = iso(new Date(today.getTime() - 86400000)); const active = dStr => S.tasks.some(t => t.done && t.doneAt && (t.skills||[]).includes(sid) && iso(new Date(t.doneAt)) === dStr); let startOffset = 0; if (!active(todayStr)) {if (!active(yStr)) return 0; startOffset = 1;} let streak = 0; for (let i = startOffset; i < 90; i++) {const d = new Date(today.getTime() - i * 86400000); if (active(iso(d))) streak++; else break;} return streak;}
function projMinutes(pId) {return S.tasks.filter(t => t.proj === pId).reduce((a,t) => a + taskMinutes(t), 0);}
function projEstTotal(pId) {return S.tasks.filter(t => t.proj === pId).reduce((a,t) => a + (t.est || 0), 0);}
function projEstDone(pId) {return S.tasks.filter(t => t.proj === pId && t.done).reduce((a,t) => a + (t.est || 0), 0);}
function projTaskCount(pId) {return S.tasks.filter(t => t.proj === pId).length;}
function projDoneCount(pId) {return S.tasks.filter(t => t.proj === pId && t.done).length;}
function projGoalsTotal(p) {return (p.goals || []).length;}
function projGoalsDone(p) {return (p.goals || []).filter(g => g.d).length;}

/* --- SEÇÕES E PESOS --- */
function taskSection(t) {
  if (t.section) return t.section;
  if (t.time) return 'commitment';
  if (t.area === 'Pessoal') return 'personal';
  return 'work';
}
function sectionMeta(s) {return SECTION_META[s] || SECTION_META.work;}
function taskWeight(t) {
  if (t.est > 0) return t.est;
  if ((t.subs||[]).length) return t.subs.length * 15;
  return 15;
}
function sectionProgress(tasks) {
  const totalWeight = tasks.reduce((a,t) => a + taskWeight(t), 0);
  const doneWeight = tasks.filter(t => t.done).reduce((a,t) => a + taskWeight(t), 0);
  const inProgressWeight = tasks.filter(t => !t.done).reduce((a,t) => { const w = taskWeight(t); const spent = taskMinutes(t); return a + Math.min(w, spent); }, 0);
  const pct = totalWeight > 0 ? Math.round(((doneWeight + inProgressWeight) / totalWeight) * 100) : 0;
  return {pct, totalWeight, doneWeight, inProgressWeight};
}

/* --- PROJETOS E CLIENTES --- */
function projectEarnings(p) {
  const ts = S.tasks.filter(t => t.proj === p.id);
  const estMin = ts.reduce((a,t) => a + (t.est || 0), 0);
  const actualMin = ts.reduce((a,t) => a + taskMinutes(t), 0);
  const hours = (p.manualHours != null && p.manualHours > 0) ? p.manualHours : (actualMin > 0 ? actualMin / 60 : (estMin > 0 ? estMin / 60 : 0));
  let total = 0;
  const v = +p.billingValue || 0;
  const cur = p.currency || 'BRL';
  if (p.billingType === 'fixed') total = p.actualValue != null ? +p.actualValue : v;
  else if (p.billingType === 'hourly') total = p.actualValue != null ? +p.actualValue : v * hours;
  else if (p.billingType === 'minute') total = p.actualValue != null ? +p.actualValue : v * hours * 60;
  const ratePerHour = hours > 0 ? total / hours : 0;
  return {total, currency: cur, hours, ratePerHour, estMin, actualMin, taskCount: ts.length, doneCount: ts.filter(t => t.done).length};
}
function clientById(id) {const c = (S.clients||[]).find(c => c.id === id && !c.deletedAt); return c;}
function projectsByClient(cid) {return alive(S.projects).filter(p => p.clientId === cid);}
function clientName(p) {if (p.clientId) {const c = clientById(p.clientId); if (c) return c.n;} return p.client || '(sem cliente)';}
function getFocusDurations() {return (S.cfg.focusDurations && S.cfg.focusDurations.length) ? S.cfg.focusDurations : POMODORO_OPTIONS;}

/* --- ENERGIA POR SLOT --- */
function currentEnergySlot() {const h = new Date().getHours(); if (h >= 6 && h < 12) return 'morning'; if (h >= 12 && h < 18) return 'afternoon'; return 'evening';}
function defaultEnergyForSlot(slot) {return slot === 'morning' ? 'high' : slot === 'afternoon' ? 'med' : 'low';}
function getTodayEnergy() {const today = iso(new Date()); const dayE = S.energy[today] || {}; return {morning: dayE.morning || defaultEnergyForSlot('morning'), afternoon: dayE.afternoon || defaultEnergyForSlot('afternoon'), evening: dayE.evening || defaultEnergyForSlot('evening')};}
function currentEnergy() {return getTodayEnergy()[currentEnergySlot()];}
function setEnergy(slot, level) {const today = iso(new Date()); if (!S.energy[today]) S.energy[today] = {}; S.energy[today][slot] = level;}

/* --- SCORE DE TAREFA --- */
function computeTaskScore(t, ctx) {
  if (t.done) return -1000;
  if (t.next) return 10000;
  let score = 0;
  score += [40, 25, 12][t.pr] ?? 15;
  if (t.due) {const days = Math.ceil((new Date(t.due) - new Date(ctx.today)) / 86400000); if (days < 0) score += 80; else if (days === 0) score += 55; else if (days === 1) score += 40; else if (days <= 3) score += 25; else if (days <= 7) score += 12; else score += 4;}
  const type = TASK_TYPES.find(x => x.id === t.type);
  if (type) {const rank = {low:1, med:2, high:3}; const diff = Math.abs((rank[type.energy]||2) - (rank[ctx.energy]||2)); if (diff === 0) score += 25; else if (diff === 1) score += 5; else score -= 20;}
  const isQuick = t.est && t.est <= 10;
  const lbls = t.labels || [];
  if (isQuick) score += 8;
  if (lbls.includes('l_easy')) score += 6;
  if (lbls.includes('l_quick')) score += 6;
  if (isQuick && ctx.remainingMin < 45) score += 12;
  if (t.est && ctx.remainingMin < t.est) score -= 15;
  score += Math.min(36, (t.postponedCount || 0) * 12);
  const ageDays = (Date.now() - (t.createdAt || Date.now())) / 86400000;
  if (ageDays > 7) score += Math.min(30, Math.round((ageDays - 7) * 3));
  if (t.proj) {const proj = S.projects.find(p => p.id === t.proj); if (proj?.due) {const days = Math.ceil((new Date(proj.due) - new Date(ctx.today)) / 86400000); if (days >= 0) {if (days <= 3) score += 30; else if (days <= 7) score += 15;}}}
  return Math.round(score);
}
function scoreBreakdown(t, ctx) {
  if (t.done) return 'concluída';
  if (t.next) return '⭐ marcada como próxima';
  const parts = [];
  parts.push('prioridade ' + PR[t.pr].toLowerCase() + ' +' + [40,25,12][t.pr]);
  if (t.due) {const days = Math.ceil((new Date(t.due) - new Date(ctx.today)) / 86400000); const bonus = days < 0 ? 80 : days === 0 ? 55 : days === 1 ? 40 : days <= 3 ? 25 : days <= 7 ? 12 : 4; parts.push('prazo ' + (days < 0 ? 'vencido' : days === 0 ? 'hoje' : 'em '+days+'d') + ' +' + bonus);}
  if (t.postponedCount >= 2) parts.push('adiada ' + t.postponedCount + 'x +' + Math.min(36, t.postponedCount * 12));
  const ageDays = Math.floor((Date.now() - (t.createdAt || Date.now())) / 86400000);
  if (ageDays > 7) parts.push('parada ' + ageDays + 'd +' + Math.min(30, Math.round((ageDays - 7) * 3)));
  parts.push('total ' + computeTaskScore(t, ctx));
  return parts.join(' · ');
}
function scoreClass(score) {if (score >= 75) return 'hot'; if (score >= 50) return 'warm'; if (score < 25) return 'cold'; return '';}
function buildCtx() {
  const cap = S.cfg.cap || 360;
  const spent = dayTasks(day).filter(t => taskSection(t) === 'work').reduce((a,t) => a + taskMinutes(t), 0);
  return {today: iso(new Date()), energy: currentEnergy(), cap, remainingMin: Math.max(0, cap - spent)};
}
function isStuck(t) {if (t.done) return false; const p = t.postponedCount || 0; if (p >= 3) return true; if (p >= 2 && t.due) {const d = Math.ceil((new Date(t.due) - new Date()) / 86400000); if (d <= 3) return true;} return false;}
function isUrgentStuck(t) {if (!isStuck(t) || !t.due) return false; const d = Math.ceil((new Date(t.due) - new Date()) / 86400000); return d <= 3;}
function isOverEstimate(t) {return t.est > 0 && taskMinutes(t) > t.est * 2 && !t.done;}

/* --- VAGAS --- */
function daysInJobStage(app) {const last = app.stageHistory?.slice(-1)[0]; if (!last) return 0; return Math.floor((Date.now() - last.at) / 86400000);}
function jobStage(app) {return JOB_STAGES.find(s => s.id === app.stage) || JOB_STAGES[0];}
function isJobTerminal(app) {return JOB_TERMINAL.includes(app.stage);}
function jobScore(app) {const base = {prospect:20,applied:35,screening:55,interview:70,challenge:65,offer:90,negotiation:95}[app.stage]; if (base == null) return -1000; let score = base; if (app.nextFollowUp) {const today = iso(new Date()); if (app.nextFollowUp < today) score += 30; else if (app.nextFollowUp === today) score += 20; else {const d = Math.ceil((new Date(app.nextFollowUp) - new Date(today)) / 86400000); if (d <= 3) score += 10;}} const tk = app.ticket || 0; if (tk >= 5000) score += 15; else if (tk >= 2000) score += 10; else if (tk >= 500) score += 5; score += [15, 5, 0][app.priority] ?? 0; const days = daysInJobStage(app); if (days >= 21) score -= 10; else if (days >= 14) score -= 5; return Math.round(score);}
function updateJobNextFollowUp(app) {const st = jobStage(app); if (!st.cadence) {app.nextFollowUp = ''; return;} const base = app.lastInteractionAt || app.stageHistory?.slice(-1)[0]?.at || Date.now(); const d = new Date(base); d.setDate(d.getDate() + st.cadence); app.nextFollowUp = iso(d);}
function changeJobStage(app, newStage) {if (app.stage === newStage) return; app.stageHistory = app.stageHistory || []; app.stageHistory.push({stage: newStage, at: Date.now()}); app.stage = newStage; app.lastInteractionAt = Date.now(); if (newStage === 'applied' && !app.appliedAt) app.appliedAt = Date.now(); if (!app.firstResponseAt && ['screening','interview','challenge','offer','negotiation','accepted','rejected'].includes(newStage)) app.firstResponseAt = Date.now(); updateJobNextFollowUp(app); touch(app); toast('Estágio: ' + jobStage(app).n);}
function recordJobInteraction(app) {app.lastInteractionAt = Date.now(); app.interactions = app.interactions || []; app.interactions.unshift({at: Date.now(), note: 'Interação'}); updateJobNextFollowUp(app); touch(app); toast('Follow-up atualizado');}
function parseJobLine(s) {if (!s || !s.trim()) return null; let ticket = 0, priority = 1, platform = '', area = ''; s = s.replace(/~(\d+)/, (_,n) => {ticket = +n; return '';}); s = s.replace(/!(a|m|b)\b/i, (_,x) => {priority = {a:0,m:1,b:2}[x.toLowerCase()]; return '';}); s = s.replace(/@(\S+)/, (_,p) => {const f = JOB_PLATFORMS.find(x => x.toLowerCase().startsWith(p.toLowerCase())); if (f) platform = f; return '';}); s = s.replace(/#(\S+)/, (_,a) => {const sk = S.skills.find(x => x.n.toLowerCase().startsWith(a.toLowerCase()) && !x.deletedAt); if (sk) area = sk.n; return '';}); const parts = s.split(' - ').map(x => x.trim()).filter(Boolean); if (!parts.length) return null; return mkJob({client: parts[0], role: parts[1] || '', ticket, priority, platform, area});}
function createFollowUpTask(app) {const d = app.nextFollowUp ? (new Date(app.nextFollowUp).getDay() + 6) % 7 : todayI(); const skillId = app.area ? (S.skills.find(s => s.n === app.area)?.id || '') : ''; const t = mkTask(`Follow-up: ${app.role || app.client} @ ${app.client}`, {pr: app.priority, est: 15, area: 'Carreira', skills: skillId ? [skillId] : [], type: 'comunicacao', day: d, due: app.nextFollowUp || '', order: dayTasks(d).length, section:'work'}); S.tasks.push(t); app.linkedTaskId = t.id; touch(app); toast('Tarefa criada'); return t;}
function jobStats() {const active = alive(S.applications).filter(a => !isJobTerminal(a)); const applied = alive(S.applications).filter(a => a.appliedAt); const responded = applied.filter(a => a.firstResponseAt); const responseRate = applied.length ? responded.length / applied.length : 0; const timeToResponse = responded.map(a => (a.firstResponseAt - a.appliedAt) / 86400000).filter(x => x >= 0).sort((a,b) => a-b); const medianTime = timeToResponse.length ? timeToResponse[Math.floor(timeToResponse.length/2)] : 0; const pipelineValue = active.reduce((sum, a) => sum + (a.ticket || 0) * (JOB_STAGE_PROB[a.stage] || 0), 0); const byStage = {}; JOB_STAGES.forEach(s => byStage[s.id] = 0); alive(S.applications).forEach(a => byStage[a.stage] = (byStage[a.stage] || 0) + 1); const byPlatform = {}; alive(S.applications).forEach(a => {if (!a.platform) return; if (!byPlatform[a.platform]) byPlatform[a.platform] = {applied:0, responded:0}; if (a.appliedAt) byPlatform[a.platform].applied++; if (a.firstResponseAt) byPlatform[a.platform].responded++;}); const byArea = {}; alive(S.applications).forEach(a => {if (!a.area) return; if (!byArea[a.area]) byArea[a.area] = {count:0, ticket:0}; byArea[a.area].count++; byArea[a.area].ticket += a.ticket || 0;}); return {active, applied, responded, responseRate, medianTime, pipelineValue, byStage, byPlatform, byArea};}

/* --- CONTATOS --- */
function contactStatus(c) {const today = iso(new Date()); if (c.archived) return {k:'arquivado', label:'Arquivado', color:'#666'}; if (c.snoozedUntil && c.snoozedUntil > today) return {k:'snoozed', label:'Adiado até ' + fmtDate(c.snoozedUntil), color:'#7a7580'}; if (c.waitingFor && c.waitingSince) {const waitDays = (Date.now() - c.waitingSince) / 86400000; if (waitDays >= 10) return {k:'atrasado', label:'Aguardando há ' + Math.round(waitDays) + 'd', color:'#e0626a'}; if (waitDays >= 5) return {k:'aguardando', label:'Aguardando', color:'#6b3a5e'}; return {k:'aguardando', label:'Aguardando (recente)', color:'#6b3a5e'};} if (!c.lastContact && !c.nextContact) return {k:'novo', label:'Novo contato', color:'#9a94a3'}; if (c.nextContact && c.nextContact < today) return {k:'atrasado', label:'Follow-up atrasado', color:'#e0626a'}; if (c.nextContact && c.nextContact === today) return {k:'hoje', label:'Follow-up hoje', color:'#e0a33b'}; if (c.nextContact) return {k:'agendado', label:'Em dia', color:'#4fb3a2'}; if (c.lastContact) return {k:'interagido', label:'Sem próximo passo', color:'#9a94a3'}; return {k:'novo', label:'Novo contato', color:'#9a94a3'};}
function contactScore(c) {if (c.archived || c.deletedAt) return -1000; const today = iso(new Date()); if (c.snoozedUntil && c.snoozedUntil > today) return -500; const last = c.lastContact ? new Date(c.lastContact) : null; const days = last ? (Date.now() - last.getTime()) / 86400000 : 999; const cadence = c.cadence || 30; const ratio = days / cadence; let score = 0; if (ratio >= 2) score += 60; else if (ratio >= 1.5) score += 45; else if (ratio >= 1) score += 28; else if (ratio >= 0.7) score += 12; score += [15, 8, 0][c.priority] ?? 0; if (c.waitingFor && c.waitingSince) {const waitDays = (Date.now() - c.waitingSince) / 86400000; if (waitDays < 5) score *= 0.3; else if (waitDays >= 10) score += 12;} if ((c.sentCount || 0) >= 3) {const rate = (c.receivedCount || 0) / c.sentCount; if (rate >= 0.6) score += 10; else if (rate < 0.2) score -= 15;} if (c.type === 'personal') score *= 0.75; return Math.max(0, Math.round(score));}
function contactScoreBreakdown(c) {if (c.archived) return 'Arquivado'; const today = iso(new Date()); if (c.snoozedUntil && c.snoozedUntil > today) return 'Adiado até ' + fmtDate(c.snoozedUntil); const parts = []; const last = c.lastContact ? new Date(c.lastContact) : null; const days = last ? (Date.now() - last.getTime()) / 86400000 : 999; const cadence = c.cadence || 30; const ratio = days / cadence; if (ratio >= 2) parts.push('atrasado ' + (Math.round(ratio * 10) / 10) + 'x cadência'); else if (ratio >= 1) parts.push('cadência vencida'); else if (ratio >= 0.7) parts.push('em dia'); else parts.push('recente'); parts.push('prioridade ' + PR[c.priority].toLowerCase()); if (c.waitingFor) parts.push('aguardando'); if ((c.sentCount || 0) >= 3) {const rate = (c.receivedCount || 0) / c.sentCount; if (rate >= 0.6) parts.push('responde bem'); else if (rate < 0.2) parts.push('raramente responde');} if (c.type === 'personal') parts.push('pessoal × 0.75'); return parts.join(' · ');}
function connectionDepth(c) {const days = c.lastContact ? (Date.now() - new Date(c.lastContact).getTime()) / 86400000 : 999; const int90 = (c.interactions || []).filter(i => i.at > Date.now() - 90 * 86400000).length; if (days < 14 && int90 >= 3) return 1; if (days < 60 || int90 >= 2) return 2; return 3;}
function logInteraction(c, direction, type = 'msg', note = '') {const d = new Date(); c.lastContact = iso(d); const nd = new Date(d); nd.setDate(nd.getDate() + (c.cadence || 30)); c.nextContact = iso(nd); c.interactions = c.interactions || []; c.interactions.unshift({at: Date.now(), type, direction, outcome: direction === 'out' ? 'sent' : 'responded', note}); if (c.interactions.length > 100) c.interactions = c.interactions.slice(0, 100); if (direction === 'out') {c.waitingFor = true; c.waitingSince = Date.now(); c.sentCount = (c.sentCount || 0) + 1;} else {c.waitingFor = false; c.waitingSince = null; c.receivedCount = (c.receivedCount || 0) + 1;} touch(c);}
function snoozeContact(c, days, reason) {const d = new Date(); d.setDate(d.getDate() + days); c.snoozedUntil = iso(d); c.snoozeReason = reason; c.waitingFor = false; c.waitingSince = null; touch(c);}
function contactAllTags() {const set = new Set(); alive(S.contacts).forEach(c => (c.tags || []).forEach(t => set.add(t))); return [...set].sort();}
function contactResponseRate(c) {if (!c.sentCount) return null; return c.receivedCount / c.sentCount;}
function upcomingBirthdays(withinDays = 14) {const out = []; const today = new Date(); const todayIso = iso(today); alive(S.contacts).forEach(c => {if (!c.birthday || c.archived) return; const parts = c.birthday.split('-'); if (parts.length < 2) return; const mm = +parts[parts.length - 2], dd = +parts[parts.length - 1]; if (!mm || !dd) return; const y = today.getFullYear(); let next = new Date(y, mm - 1, dd); if (iso(next) < todayIso) next = new Date(y + 1, mm - 1, dd); const days = Math.round((next - today) / 86400000); if (days <= withinDays) out.push({contact: c, days, date: iso(next)});}); return out.sort((a,b) => a.days - b.days);}

/* --- TIMER --- */
function tfnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h.toString(36); }
// Identidade determinística de um bloco de timer (idempotência dos logs entre
// dispositivos e em repetições). Usa campos absolutos que sincronizam: a fase
// começou em (startedAt - accumulated*1000) e o ciclo diferencia blocos do Pomodoro.
function timerBlockId(timer, taskId, subId) {
  var phaseStart = Math.round(((timer && timer.startedAt) || Date.now()) - (((timer && timer.accumulated) || 0) * 1000));
  return 'tmr_' + tfnv(String(taskId || '') + '|' + String(subId || '') + '|' + phaseStart + '|' + ((timer && timer.cycleCount) || 0));
}
// Divide [startMs, endMs) nas fronteiras de meia-noite local (datas corretas).
function splitByLocalDay(startMs, endMs) {
  var out = []; var cur = startMs;
  while (cur < endMs) {
    var d = new Date(cur); d.setHours(0, 0, 0, 0);
    var b = new Date(d); b.setDate(d.getDate() + 1);
    var segEnd = Math.min(endMs, b.getTime());
    out.push({ start: cur, end: segEnd });
    cur = segEnd;
  }
  return out.length ? out : [{ start: startMs, end: endMs }];
}
// Registra minutos em t.logs com id determinístico, dedupe por id e quebra por dia local.
function recordTimerMinutes(t, minutes, subId, note, timer) {
  if (!t || !(minutes > 0)) return;
  var end = Date.now();
  var start = end - Math.round(minutes * 60000);
  var parts = splitByLocalDay(start, end);
  var baseId = timerBlockId(timer, t.id, subId);
  var rest = minutes;
  parts.forEach(function (p, idx) {
    var dur = Math.round((p.end - p.start) / 60000);
    if (idx === parts.length - 1) dur = rest; // último segmento fecha o total exato
    if (dur <= 0) return;
    rest -= dur;
    var id = baseId + (parts.length > 1 ? '_' + idx : '');
    if (t.logs.some(function (l) { return l.id === id; })) return; // idempotência
    t.logs.push({ id: id, minutes: dur, start: p.start, end: p.end, subId: subId || null, note: note });
  });
  t.spent = taskMinutes(t);
  touch(t);
}
function timerElapsedSec() {if (!S.timer) return 0; const acc = S.timer.accumulated || 0; const run = S.timer.startedAt ? (Date.now() - S.timer.startedAt) / 1000 : 0; return acc + run;}
function startTimer(taskId, subId, targetMin) {if (S.timer) {toast('Timer já rodando', true); return;} S.timer = {taskId, subId: subId || null, startedAt: Date.now(), accumulated: 0, paused: false, targetMin: targetMin || null, phase: targetMin ? 'focus' : null, focusMin: targetMin || null, restMin: S.cfg.brk || 10, cycleCount: 0, updatedAt: Date.now()}; save(); renderTimer(); render(); if (targetMin) toast('▶ Bloco de ' + targetMin + 'min iniciado'); else toast('Timer iniciado');}
function pauseTimer() {if (!S.timer || S.timer.paused) return; S.timer.accumulated = timerElapsedSec(); S.timer.startedAt = null; S.timer.paused = true; S.timer.updatedAt = Date.now(); save(); renderTimer(); if (focusTaskId) renderFocus(); toast('⏸ Pausado');}
function resumeTimer() {if (!S.timer || !S.timer.paused) return; S.timer.startedAt = Date.now(); S.timer.paused = false; S.timer.updatedAt = Date.now(); save(); renderTimer(); if (focusTaskId) renderFocus(); toast('▶ Retomado');}
function advancePhase() {
  if (!S.timer) return;
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  if (S.timer.phase === 'focus') {
    const el = Math.round(timerElapsedSec() / 60);
    if (t && el > 0) { recordTimerMinutes(t, el, S.timer.subId, 'pomodoro', S.timer); toast('+' + el + 'min de foco registrados'); }
    S.timer.phase = 'rest'; S.timer.targetMin = S.timer.restMin || 10;
    S.timer.accumulated = 0; S.timer.startedAt = Date.now(); S.timer.paused = false;
    S.timer.cycleCount = (S.timer.cycleCount || 0) + 1;
    beep(); setTimeout(beep, 220);
    toast('✓ Foco concluído · descanso de ' + S.timer.targetMin + 'min');
  } else {
    S.timer.phase = 'focus'; S.timer.targetMin = S.timer.focusMin || focusTargetMin;
    S.timer.accumulated = 0; S.timer.startedAt = Date.now(); S.timer.paused = false;
    beep();
    toast('☀ Descanso acabou · de volta ao foco');
  }
  S.timer.updatedAt = Date.now();
  save(); renderTimer();
  if (focusTaskId) {renderFocus(); const overlay = document.getElementById('focusOverlay'); if (overlay) {overlay.classList.remove('flash'); void overlay.offsetWidth; overlay.classList.add('flash'); setTimeout(() => overlay.classList.remove('flash'), 1250);}}
}
function stopTimer(override) {
  if (!S.timer) return;
  const elapsed = override != null ? override : Math.round(timerElapsedSec() / 60);
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  if (t && elapsed > 0) { recordTimerMinutes(t, elapsed, S.timer.subId, '', S.timer); toast('+' + elapsed + 'min'); }
  S.timerStoppedAt = Date.now();
  S.timer = null; save(); renderTimer();
  if (['week','skills','proj','stats'].includes(tab)) render();
}
function beep() {try {const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 720; g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5); o.start(); o.stop(a.currentTime + 0.5);} catch(e) {}}

/* --- HELPERS DE TAREFA --- */
const T = id => S.tasks.find(t => t.id === id);
const dayTasks = d => S.tasks.filter(t => t.day === d).sort((a,b) => (a.order||0) - (b.order||0));
const V = id => (document.getElementById(id) || {}).value ?? '';
const selOptions = (arr, cur) => arr.map(([v,l]) => `<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
const inp = (p, v, ty='text', ph='') => `<input data-p="${esc(p)}" type="${ty}" value="${esc(v??'')}" placeholder="${esc(ph)}">`;
function parseQuickLine(s, d) {let pr = 1, est = 0, proj = '', time = ''; s = s.replace(/!(a|m|b)\b/i, (_,x) => {pr = {a:0,m:1,b:2}[x.toLowerCase()]; return '';}); s = s.replace(/~(\d+)/, (_,n) => {est = +n; return '';}); s = s.replace(/#(\S+)/, (_,n) => {const p = alive(S.projects).find(p => p.n.toLowerCase().startsWith(n.toLowerCase())); if (p) proj = p.id; return p ? '' : '#' + n;}); s = s.replace(/@(\d{1,2}:\d{2})/, (_,t) => {time = t.padStart(5,'0'); return '';}); const title = s.trim(); if (!title) return null; return mkTask(title, {pr, est, proj, time, day: d, area: S.projects.find(p => p.id === proj)?.area || 'Carreira', order: d != null ? dayTasks(d).length : 0});}
function addQuick(d, text) {const t = parseQuickLine(text, d); if (t) S.tasks.push(t);}
function addBulk(d, text) {text.split('\n').map(x => x.trim()).filter(Boolean).forEach(l => {const t = parseQuickLine(l, d); if (t) S.tasks.push(t);});}
function postponeTask(t, offset) {if (!t) return; const oldDay = t.day; let newDay; if (offset === 'queue') newDay = null; else if (oldDay === null) newDay = (todayI() + (+offset)) % 7; else newDay = (oldDay + (+offset)) % 7; t.day = newDay; t.postponedCount = (t.postponedCount || 0) + 1; t.lastPostponedAt = Date.now(); touch(t); if (newDay !== null) t.order = dayTasks(newDay).length; toast((newDay === null ? 'Fila' : DAYS[newDay]) + ' · adiada ' + t.postponedCount + 'x'); save(); render();}
function reorderTask(t, delta) {
  const list = dayTasks(t.day);
  const idx = list.findIndex(x => x.id === t.id);
  const nidx = idx + delta;
  if (idx < 0 || nidx < 0 || nidx >= list.length) return;
  [list[idx], list[nidx]] = [list[nidx], list[idx]];
  list.forEach((x, ix) => x.order = ix);
  save(); render();
}

/* --- BUSCA --- */
function normalize(s) {return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function globalSearch(q) {
  const nq = normalize(q);
  if (!nq) return null;
  const match = s => normalize(s).includes(nq);
  const out = {tasks:[],projects:[],clients:[],contacts:[],applications:[],skills:[],goals:[]};
  alive(S.tasks).forEach(t => {if (match(t.t) || match(t.desc)) out.tasks.push(t);});
  alive(S.projects).forEach(p => {if (match(p.n)) out.projects.push(p);});
  alive(S.clients).forEach(c => {if (match(c.n)) out.clients.push(c);});
  alive(S.contacts).forEach(c => {if (match(c.n) || match(c.notes) || match(c.lastConversation)) out.contacts.push(c);});
  alive(S.applications).forEach(a => {if (match(a.client) || match(a.role) || match(a.notes)) out.applications.push(a);});
  alive(S.skills).forEach(s => {if (match(s.n)) out.skills.push(s);});
  alive(S.goals).forEach(g => {if (match(g.t)) out.goals.push(g);});
  Object.keys(out).forEach(k => out[k] = out[k].slice(0, 5));
  return out;
}

/* --- BACKUP REMINDER --- */
function shouldShowBackupReminder() {
  const now = Date.now();
  if (S.cfg.backupReminderDismissedAt && now - S.cfg.backupReminderDismissedAt < 24 * 3600000) return false;
  if (!S.cfg.lastBackupAt) return S.tasks.length > 5;
  return now - S.cfg.lastBackupAt > 7 * 86400000;
}

/* --- CALIBRAÇÃO / HEATMAP / NETWORK --- */
function calibrationStats() {const candidates = S.tasks.filter(t => t.done && t.est > 0 && taskMinutes(t) > 0 && t.doneAt && !isPersonalSection(t)).sort((a,b) => b.doneAt - a.doneAt); const sample = candidates.slice(0, 12); if (sample.length < 5) return {insufficient: true, count: sample.length, need: 5}; const ratios = sample.map(t => taskMinutes(t) / t.est).sort((a,b) => a-b); const median = ratios[Math.floor(ratios.length/2)]; const pct = Math.round((median - 1) * 100); return {insufficient: false, count: sample.length, median, pct};}
function heatmapData() {const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - 12 * 7 - ((start.getDay() + 6) % 7)); const days = []; for (let i = 0; i < 91; i++) {const d = new Date(start); d.setDate(d.getDate() + i); const dStr = iso(d); const mins = S.tasks.flatMap(t => (t.logs||[]).filter(l => l.end && iso(new Date(l.end)) === dStr)).reduce((a,l) => a + (+l.minutes || 0), 0); const tasksDone = S.tasks.filter(t => t.done && t.doneAt && iso(new Date(t.doneAt)) === dStr).length; days.push({d, dStr, mins, tasksDone, isFuture: d > today, isToday: dStr === iso(today)});} return days;}
function networkStats(type) {
  const contacts = alive(S.contacts).filter(c => c.type === type && !c.archived);
  const td = iso(new Date());
  const total = contacts.length;
  const overdue = contacts.filter(c => contactStatus(c).k === 'atrasado').length;
  const waiting = contacts.filter(c => c.waitingFor).length;
  const snoozed = contacts.filter(c => c.snoozedUntil && c.snoozedUntil > td).length;
  const active30 = contacts.filter(c => c.lastContact && daysBetween(c.lastContact, td) <= 30).length;
  const depths = {1:0, 2:0, 3:0};
  contacts.forEach(c => depths[connectionDepth(c)]++);
  const withSent = contacts.filter(c => c.sentCount > 0);
  const avgRate = withSent.length ? withSent.reduce((a,c) => a + (c.receivedCount / c.sentCount), 0) / withSent.length : 0;
  const weeks = [];
  for (let i = 7; i >= 0; i--) {const end = new Date(); end.setDate(end.getDate() - i*7); end.setHours(0,0,0,0); const start = new Date(end); start.setDate(start.getDate() - 7); const count = contacts.reduce((a,c) => a + (c.interactions||[]).filter(it => it.at >= start.getTime() && it.at < end.getTime()).length, 0); weeks.push({count, label: iso(start).slice(5)});}
  const maxWeek = Math.max(1, ...weeks.map(w => w.count));
  const byPlatform = {};
  contacts.forEach(c => {if (c.where) byPlatform[c.where] = (byPlatform[c.where]||0) + 1;});
  const closest = contacts.filter(c => connectionDepth(c) === 1).sort((a,b) => (b.interactions||[]).length - (a.interactions||[]).length).slice(0, 5);
  const cooling = contacts.filter(c => connectionDepth(c) === 3 && (c.sentCount + c.receivedCount) >= 3).sort((a,b) => (a.lastContact||'0') < (b.lastContact||'0') ? -1 : 1).slice(0, 5);
  return {total, overdue, waiting, snoozed, active30, depths, avgRate, weeks, maxWeek, byPlatform, closest, cooling};
}
function xpProgression() {
  const gxp = globalXp();
  const info = levelInfo(gxp);
  const now = Date.now();
  const weekXp = S.tasks.filter(t => t.done && t.doneAt && (now - t.doneAt) <= 7*86400000 && !isPersonalSection(t)).reduce((a,t) => a + taskBaseXp(t), 0);
  const monthXp = S.tasks.filter(t => t.done && t.doneAt && (now - t.doneAt) <= 30*86400000 && !isPersonalSection(t)).reduce((a,t) => a + taskBaseXp(t), 0);
  const activeSkills = alive(S.skills).filter(s => !s.archived);
  const topSkills = [...activeSkills].sort((a,b) => num(b.xp) - num(a.xp)).slice(0, 6);
  const maxSkillXp = Math.max(1, ...topSkills.map(s => num(s.xp)));
  return {gxp, lv: info.lv, inLevel: info.inLevel, toNext: info.toNext, forLevel: info.forLevel, progress: info.progress, weekXp, monthXp, topSkills, maxSkillXp};
}

/* --- REGISTROS DE TRABALHO (resumos por tarefa/data) --- */
function workLogsForTask(taskId) {
  return (S.workLogs || []).filter(l => l.taskId === taskId).sort((a,b) => (b.ts || 0) - (a.ts || 0));
}
function saveWorkLog(taskId, text) {
  const today = iso(new Date());
  const trimmed = String(text || '').trim();
  if (!S.workLogs) S.workLogs = [];
  const idx = S.workLogs.findIndex(l => l.taskId === taskId && l.date === today);
  // Resumo vazio remove o registro do dia — nunca cria registro vazio acidental
  if (!trimmed) {
    if (idx >= 0) S.workLogs.splice(idx, 1);
    return null;
  }
  // Editar no mesmo dia atualiza o registro existente e PRESERVA os snapshots históricos
  if (idx >= 0) {
    const log = S.workLogs[idx];
    log.text = trimmed;
    log.ts = Date.now();
    return log;
  }
  const t = S.tasks.find(x => x.id === taskId);
  const proj = t && t.proj ? S.projects.find(p => p.id === t.proj) : null;
  const log = mkWorkLog({
    date: today,
    ts: Date.now(),
    taskId,
    taskTitle: t ? t.t : '',
    projId: t && t.proj ? t.proj : '',
    projName: proj ? proj.n : '',
    area: t ? t.area : '',
    text: trimmed
  });
  S.workLogs.push(log);
  return log;
}

/* --- RELATÓRIO SEMANAL --- */
function projectNameById(projId) {
  if (!projId) return '';
  const p = S.projects.find(x => x.id === projId);
  return p ? p.n : '';
}
function reportWeekRange() {
  const monday = weekStart(new Date());
  monday.setDate(monday.getDate() + (reportWeekOffset || 0) * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return {start: iso(monday), end: iso(sunday)};
}
function buildWeeklyReport(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59.999');
  const done = S.tasks.filter(t => t.done && t.doneAt && t.doneAt >= start.getTime() && t.doneAt <= end.getTime());
  const unknownTasks = S.tasks.filter(t => t.done && !t.doneAt);

  const logsByTask = {};
  (S.workLogs || []).forEach(l => { if (l.taskId) (logsByTask[l.taskId] = logsByTask[l.taskId] || []).push(l); });
  const summaryFor = t => {
    const logs = (logsByTask[t.id] || []).sort((a,b) => (b.ts || 0) - (a.ts || 0));
    const inWeek = logs.filter(l => l.date >= startDate && l.date <= endDate);
    return (inWeek.length ? inWeek[0] : logs[0]) || null;
  };

  const items = done.map(t => {
    const summary = summaryFor(t);
    const projName = t.proj ? (projectNameById(t.proj) || (summary && summary.projName) || '') : '';
    return {
      kind: 'task', title: t.t, summary: summary ? summary.text : '',
      summaryDate: summary ? summary.date : '',
      projId: t.proj || '', projName, area: t.area || '', timeMinutes: taskMinutes(t)
    };
  });

  // Registros preservados de tarefas removidas (snapshots), dentro da semana
  const taskIds = new Set(S.tasks.map(t => t.id));
  const orphans = (S.workLogs || []).filter(l => {
    if (!l.taskId || taskIds.has(l.taskId)) return false;
    const d = l.date || iso(new Date(l.ts || 0));
    return d >= startDate && d <= endDate;
  });
  orphans.forEach(l => items.push({
    kind: 'log', title: l.taskTitle || '(tarefa removida)', summary: l.text || '',
    summaryDate: l.date || iso(new Date(l.ts || 0)), projId: l.projId || '', projName: l.projName || projectNameById(l.projId), area: l.area || '', timeMinutes: null
  }));

  const byProject = {}, byArea = {};
  items.forEach(it => {
    if (it.projId || it.projName) {
      const key = it.projId || ('snapshot:' + it.projName);
      if (!byProject[key]) byProject[key] = {projId: it.projId || '', name: it.projName || projectNameById(it.projId) || '(sem nome)', items: []};
      byProject[key].items.push(it);
    } else {
      const area = it.area || '—';
      if (!byArea[area]) byArea[area] = {area, label: areaLabel(area), items: []};
      byArea[area].items.push(it);
    }
  });
  const projects = Object.values(byProject).sort((a,b) => a.name.localeCompare(b.name));
  const areas = Object.values(byArea).sort((a,b) => a.label.localeCompare(b.label));

  const doneTasks = items.filter(it => it.kind === 'task');
  const timeMinutes = doneTasks.reduce((a,it) => a + (it.timeMinutes || 0), 0);
  const withTime = doneTasks.filter(it => (it.timeMinutes || 0) > 0).length;
  const withoutTime = doneTasks.length - withTime;
  // Concluídas sem data registrada: listadas à parte, nunca atribuídas a uma semana
  const unknown = unknownTasks.map(t => ({id: t.id, kind: 'task', title: t.t, summary: (summaryFor(t) || {}).text || '', area: t.area || '', timeMinutes: taskMinutes(t)}));

  return {startDate, endDate, projects, areas, unknown, metrics: {done: doneTasks.length, timeMinutes, withTime, withoutTime, orphanCount: orphans.length, unknownCount: unknown.length}};
}
function weeklyReportMarkdown(r) {
  const L = [];
  const range = r.startDate.split('-').reverse().join('/') + ' a ' + r.endDate.split('-').reverse().join('/');
  L.push('# Relatório semanal · ' + range);
  L.push('');
  const line = it => {
    const time = it.timeMinutes != null ? ' · ' + fmtMin(it.timeMinutes) : '';
    const summary = it.summary ? ' — ' + it.summary : ' — _Sem resumo registrado._';
    return '- **' + it.title + '**' + time + summary;
  };
  if (r.projects.length) {
    L.push('## Resumo por projeto');
    L.push('');
    r.projects.forEach(g => {
      L.push('### ' + g.name);
      L.push('');
      g.items.forEach(it => L.push(line(it)));
      L.push('');
    });
  }
  if (r.areas.length) {
    L.push('## Atividades avulsas por área');
    L.push('');
    r.areas.forEach(g => {
      L.push('### ' + g.label);
      L.push('');
      g.items.forEach(it => L.push(line(it)));
      L.push('');
    });
  }
  if (r.unknown && r.unknown.length) {
    L.push('## Concluídas sem data registrada');
    L.push('');
    L.push('_(Concluídas antes de o app registrar a data; não atribuídas a uma semana.)_');
    L.push('');
    r.unknown.forEach(it => L.push(line(it)));
    L.push('');
  }
  L.push('## Métricas do período');
  L.push('');
  L.push('- Tarefas concluídas: ' + r.metrics.done);
  L.push('- Tempo registrado: ' + fmtMin(r.metrics.timeMinutes));
  if (r.metrics.withoutTime) L.push('- ' + r.metrics.withoutTime + ' tarefa(s) concluída(s) sem tempo registrado.');
  if (r.metrics.orphanCount) L.push('- ' + r.metrics.orphanCount + ' registro(s) de tarefas removidas (preservados).');
  if (r.metrics.unknownCount) L.push('- ' + r.metrics.unknownCount + ' tarefa(s) concluída(s) sem data registrada (fora do período).');
  L.push('');
  return L.join('\n');
}