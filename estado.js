// =========================================================
// ESTADO.JS — Memória do app
// Constantes, variáveis de estado, modelos de dados,
// persistência (salvar/carregar/backup) e lixeira.
// =========================================================

/* --- VERSÃO E CHAVES DE ARMAZENAMENTO --- */
const VERSION = 14.2;
const LS_KEY = 'atelier';
const LS_BACKUP = 'atelier_backup_prev';
const LEVEL_XP = 150;

/* --- CONSTANTES DE DOMÍNIO (dados fixos do app) --- */
const AREAS_DEFAULT = [
  {id:'Carreira', n:'Carreira', color:'#d4a84b'},
  {id:'Autoral', n:'Autoral', color:'#c2456e'},
  {id:'Negócio', n:'Negócio', color:'#4fb3a2'},
  {id:'Ponte', n:'Ponte', color:'#6f8de0'},
  {id:'Trabalho', n:'Trabalho', color:'#e08a4f'},
  {id:'Pessoal', n:'Pessoal', color:'#a08fc0'}
];
const CURRENCIES = {BRL:{sym:'R$',n:'Real'}, USD:{sym:'$',n:'Dólar'}, EUR:{sym:'€',n:'Euro'}};
const THEMES = {
  obsidian:  {n:'Obsidiana',  desc:'Dourado frio · clássico', ac:'#d4a84b', bu:'#9c3355', bg:'#0e0d11', s1:'#17151c', s2:'#1f1c26', s3:'#26222f', bd:'#2c2835'},
  vampire:   {n:'Vampiro',    desc:'Sangue',                 ac:'#b8324a', bu:'#5c1228', bg:'#100609', s1:'#1a0d11', s2:'#221216', s3:'#2a181c', bd:'#33191f'},
  occult:    {n:'Oculto',     desc:'Violeta profundo',       ac:'#a374d4', bu:'#5a2a8a', bg:'#0c0912', s1:'#15111e', s2:'#1d1828', s3:'#252032', bd:'#2e283d'},
  noir:      {n:'Noir',       desc:'Prata fria',             ac:'#c5c5c9', bu:'#7a7580', bg:'#0c0c0e', s1:'#151517', s2:'#1d1d20', s3:'#26262a', bd:'#303035'},
  cyanotic:  {n:'Cianótico',  desc:'Ciano gelado',           ac:'#4fb3d4', bu:'#2a5a7a', bg:'#080d12', s1:'#101820', s2:'#182530', s3:'#1f303d', bd:'#263a4a'},
  toxic:     {n:'Tóxico',     desc:'Verde ácido',            ac:'#7ab876', bu:'#3a6b3a', bg:'#080f0a', s1:'#101a12', s2:'#17261a', s3:'#1e3023', bd:'#253a2b'},
  ember:     {n:'Brasa',      desc:'Laranja queimado',       ac:'#e08a4f', bu:'#8b2942', bg:'#110c09', s1:'#1a1410', s2:'#231c16', s3:'#2b241d', bd:'#362d24'},
  moonlight: {n:'Luar',       desc:'Azul pálido',            ac:'#a8bedb', bu:'#5a6b8a', bg:'#0a0d12', s1:'#121820', s2:'#1a222c', s3:'#222c38', bd:'#2c3642'},
  rose:      {n:'Rosa Morta', desc:'Rosa pálido',            ac:'#d4a0b8', bu:'#7a4a5e', bg:'#100c0e', s1:'#191317', s2:'#221a1e', s3:'#2a2226', bd:'#342b30'},
  abyss:     {n:'Abismo',     desc:'Azul-marinho',           ac:'#7a9fd4', bu:'#4a5e8a', bg:'#080a12', s1:'#10141e', s2:'#181e2c', s3:'#1f2638', bd:'#272e42'},
  bone:      {n:'Osso',       desc:'Bege frio',              ac:'#c9b394', bu:'#7a6a55', bg:'#0e0d0b', s1:'#171613', s2:'#1f1e1a', s3:'#27261f', bd:'#31302a'}
};
const PR = ['Alta','Média','Baixa'];
const PRC = ['#e0626a','#e0a33b','#6f8de0'];
const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const DEF_SKILLS = [
  {n:'Edição de vídeo',color:'#6f8de0'},{n:'Ilustração',color:'#c2456e'},
  {n:'Animação 2D',color:'#e08a4f'},{n:'Animação 3D',color:'#a08fc0'},
  {n:'Motion design',color:'#4fb3a2'},{n:'Storytelling',color:'#d4a84b'},
  {n:'Prospecção',color:'#9c3355'},{n:'Networking',color:'#e0626a'},
  {n:'Portfólio',color:'#4fb3a2'},{n:'Gestão profissional',color:'#9a94a3'}
];
const COLOR_PALETTE = [
  {n:'Sangue',c:'#8b2942'},{n:'Ouro',c:'#d4a84b'},{n:'Brasa',c:'#c9764a'},
  {n:'Ameixa',c:'#6b3a5e'},{n:'Névoa',c:'#b8a9c4'},{n:'Bruma',c:'#8fa5b8'},
  {n:'Musgo',c:'#6a8560'},{n:'Areia',c:'#c9b394'},{n:'Fumaça',c:'#7a7580'},
  {n:'Vinho',c:'#5c1e2a'},{n:'Abismo',c:'#3d2f4d'},{n:'Cinza',c:'#4a4652'}
];
const TASK_TYPES = [
  {id:'criativa',n:'Criativa',icon:'✧',energy:'high'},
  {id:'profunda',n:'Foco profundo',icon:'◈',energy:'high'},
  {id:'admin',n:'Administrativa',icon:'▦',energy:'low'},
  {id:'comunicacao',n:'Comunicação',icon:'✉',energy:'med'},
  {id:'aprendizado',n:'Aprendizado',icon:'✦',energy:'med'},
  {id:'manutencao',n:'Manutenção',icon:'↻',energy:'low'}
];
const ENERGY_LEVELS = [{id:'low',n:'Baixa',icon:'☾'},{id:'med',n:'Média',icon:'◐'},{id:'high',n:'Alta',icon:'☀'}];
const CAT_PRO = ['Prospect','Cliente','Mentor','Colega','Parceiro','Indicação'];
const CAT_PERSONAL = ['Amigo próximo','Date','Amigo casual','Conhecido'];
const CADENCE_DEFAULT = {'pro':30,'Amigo próximo':7,'Date':5,'Amigo casual':21,'Conhecido':45};
const POMODORO_OPTIONS = [5,15,25,45,50,60];
const BILLING_TYPES = [['none','—'],['fixed','Fixo (projeto)'],['hourly','Por hora'],['minute','Por minuto']];
const JOB_STAGES = [
  {id:'prospect',n:'Prospecto',color:'#9a94a3',cadence:2},
  {id:'applied',n:'Aplicado',color:'#8fa5b8',cadence:7},
  {id:'screening',n:'Triagem',color:'#d4a84b',cadence:3},
  {id:'interview',n:'Entrevista',color:'#c9764a',cadence:2},
  {id:'challenge',n:'Teste',color:'#9d6bb5',cadence:5},
  {id:'offer',n:'Oferta',color:'#4fb3a2',cadence:2},
  {id:'negotiation',n:'Negociação',color:'#4fb3a2',cadence:1},
  {id:'accepted',n:'Aceito',color:'#6a8560',cadence:0,terminal:true},
  {id:'rejected',n:'Rejeitado',color:'#7a7580',cadence:0,terminal:true},
  {id:'ghosted',n:'Sem resposta',color:'#7a7580',cadence:0,terminal:true},
  {id:'withdrawn',n:'Desisti',color:'#7a7580',cadence:0,terminal:true}
];
const JOB_STAGE_PROB = {prospect:0.05,applied:0.10,screening:0.20,interview:0.35,challenge:0.50,offer:0.75,negotiation:0.90,accepted:1.00};
const JOB_SUBAREAS = ['long form','shorts','documentary','motion','commercial','music video','series','feature','outro'];
const JOB_PLATFORMS = ['LinkedIn','Gupy','Indeed','Catho','Trabalha Brasil','Discord','Twitter/X','Instagram','Website','E-mail','Indicação','Outro'];
const JOB_TERMINAL = ['accepted','rejected','ghosted','withdrawn'];
const INTERACTION_TYPES = [{id:'msg',n:'Mensagem',icon:'💬'},{id:'call',n:'Ligação',icon:'☎'},{id:'email',n:'E-mail',icon:'✉'},{id:'meet',n:'Encontro',icon:'☕'},{id:'other',n:'Outro',icon:'·'}];
const SNOOZE_REASONS = [{id:'not-a-good-moment',n:'Não é um bom momento',days:7},{id:'waiting-on-them',n:'Aguardando eles',days:10},{id:'personal',n:'Questão pessoal',days:14},{id:'other',n:'Outro',days:30}];
const SECTION_META = {
  commitment: {n:'Compromissos', icon:'📍', color:'#e0a33b'},
  work:       {n:'Trabalho',     icon:'▦',  color:'#d4a84b'},
  personal:   {n:'Pessoal',      icon:'☾',  color:'#a08fc0'}
};
const SECTION_ORDER = ['commitment','work','personal'];

/* --- UTILITÁRIOS GERAIS (atalhos muito usados) --- */
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2,10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayI = () => (new Date().getDay()+6)%7;
const dv = v => (v === '' || v == null) ? null : +v;
const num = v => {const n = Number(v); return isFinite(n) ? n : 0;};
const fmtMin = m => {m = Math.round(m || 0); if (m < 60) return m + 'min'; const h = Math.floor(m/60), mm = m%60; return h + 'h' + (mm ? String(mm).padStart(2,'0') : '');};
const fmtClock = sec => {sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60; return (h ? h+':' : '') + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');};
const fmtDate = d => d ? d.slice(5).split('-').reverse().join('/') : '';
const fmtBRL = n => 'R$ ' + Math.round(n || 0).toLocaleString('pt-BR');
const fmtUSD = n => '$ ' + (n || 0).toFixed(2).replace('.', ',');
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
const initials = n => {if (!n) return '?'; const parts = n.trim().split(/\s+/); if (parts.length === 1) return parts[0].slice(0,2).toUpperCase(); return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();};
function weekStart(d = new Date()) {const wd = (d.getDay() + 6) % 7; const monday = new Date(d); monday.setDate(monday.getDate() - wd); monday.setHours(0,0,0,0); return monday;}

/* --- HELPERS DE "VIVO" / ÁREAS / MOEDA --- */
function alive(arr) {return (arr || []).filter(x => !x.deletedAt);}
function touch(obj) {if (obj) obj.updatedAt = Date.now();}
function getAreas() {return (S.areas || []).filter(a => !a.archived).sort((a,b) => (a.order||0)-(b.order||0));}
function getAllAreas() {return (S.areas || []).slice().sort((a,b) => (a.order||0)-(b.order||0));}
function areaColor(name) {const a = (S.areas || []).find(x => x.id === name || x.n === name); return a ? a.color : '#888';}
function areaLabel(id) {const a = (S.areas || []).find(x => x.id === id); return a ? a.n : (id || '—');}
function convertTo(amount, from, to) {
  if (!from || !to || from === to) return amount;
  const usd = S.cfg.usdRate || 5.2, eur = S.cfg.eurRate || 5.6;
  let brl = amount;
  if (from === 'USD') brl = amount * usd;
  else if (from === 'EUR') brl = amount * eur;
  if (to === 'BRL') return brl;
  if (to === 'USD') return brl / usd;
  if (to === 'EUR') return brl / eur;
  return brl;
}
function fmtMoney(amount, cur) {const s = CURRENCIES[cur]?.sym || (cur || 'R$'); return s + ' ' + Math.round(amount || 0).toLocaleString('pt-BR');}

/* --- VARIÁVEIS DE ESTADO GLOBAL --- */
let S = null;
let tab = 'week';
let day = todayI();
let cal = new Date();
let dbDoc = null;
let dirty = false;
let saveTmr = null;
let skillsFilter = 'all';
let earningsFilter = 'month';
let historyFilter = '30d';
let toastTmr = null;
let filterState = {text:'', type:'', area:'', proj:'', labels:[], showLabels:false};
let jobFilter = {stage:'active', area:'', text:''};
let contactFilterState = {pro: {text:'', cat:'', status:'all', tags:[], sort:'score'}, personal: {text:'', cat:'', status:'all', tags:[], sort:'score'}};
let contactView = {pro:'list', personal:'list'};
let lastSlot = null;
let undoStack = [];
let focusTaskId = null;
let focusTargetMin = 25;
let searchQuery = '';
let expandedTasks = new Set();
let expandedSubs = new Set();
let subsCollapsed = new Set();
let forcedCompact = null;
let selectedTaskId = null;
let mobileFiltersOpen = false;
let showQuickAdd = false;
let showFilters = false;
const openEdits = new Set();

/* --- APLICAR TEMA (usa THEMES) --- */
function applyTheme() {
  if (!S) return;
  const themeId = S.cfg.theme || 'obsidian';
  const t = THEMES[themeId] || THEMES.obsidian;
  const custom = S.cfg.accentColor;
  const root = document.documentElement.style;
  root.setProperty('--ac', custom || t.ac);
  root.setProperty('--bu', t.bu);
  root.setProperty('--bg', t.bg);
  root.setProperty('--s1', t.s1);
  root.setProperty('--s2', t.s2);
  root.setProperty('--s3', t.s3);
  root.setProperty('--bd', t.bd);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.bg);
}

/* --- MODELOS (fábricas de objetos) --- */
function mkTask(t, o={}) {return {id: uid(), t, desc:'', pr:1, est:0, spent:0, day:null, order:0, next:false, done:false, doneAt:null, area:'Carreira', skills:[], proj:'', due:'', time:'', section:'', subs:[], logs:[], xpClaimed:false, type:'', color:'', labels:[], createdAt: Date.now(), updatedAt: Date.now(), postponedCount: 0, lastPostponedAt: null, ...o};}
function mkSkill(n, color) {return {id: uid(), n, color: color || '#9a94a3', archived:false, xp:0, order:0, deletedAt: null, createdAt: Date.now(), updatedAt: Date.now()};}
function mkContact(o={}) {return {id: uid(), n:'', type:'pro', cat:'Prospect', where:'', url:'', role:'', context:'', interests:'', notes:'', priority:1, lastContact:'', nextContact:'', nextAction:'', cadence:30, archived:false, lastConversation:'', waitingFor:false, waitingSince:null, tags:[], birthday:'', importantDates:[], snoozedUntil:'', snoozeReason:'', interactions:[], sentCount:0, receivedCount:0, clientId:null, deletedAt:null, createdAt:Date.now(), updatedAt:Date.now(), ...o};}
function mkCommand(n, cat, cmd, example='') {return {id: uid(), n, cat, cmd, example, order:0, updatedAt: Date.now()};}
function mkJob(o={}) {return {id: uid(), client:'', role:'', url:'', contactName:'', contactInfo:'', platform:'', area:'', subarea:'', ticket:0, priority:1, notes:'', stage:'prospect', stageHistory:[{stage:'prospect', at: Date.now()}], foundAt: Date.now(), appliedAt: null, firstResponseAt: null, nextFollowUp:'', lastInteractionAt: null, linkedTaskId: null, projectId: null, interactions: [], deletedAt: null, createdAt: Date.now(), updatedAt: Date.now(), ...o};}
function mkClient(o={}) {return {id: uid(), n:'', notes:'', createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null, ...o};}
function mkProject(o={}) {return {id: uid(), n:'', area:'Carreira', due:'', reward:'', claimed:false, archived:false, clientId:'', client:'', billingType:'none', billingValue:0, actualValue:null, completedAt:null, manualHours:null, currency:'BRL', deletedAt:null, createdAt:Date.now(), updatedAt:Date.now(), ...o};}
function mkGoal(o={}) {return {id: uid(), t:'', p:0, due:'', deletedAt:null, createdAt:Date.now(), updatedAt:Date.now(), ...o};}
function defaultLabels() {return [{id:'l_easy',n:'fácil',color:'#6a8560',order:0},{id:'l_quick',n:'rápida',color:'#8fa5b8',order:1},{id:'l_creative',n:'criativa',color:'#c9764a',order:2},{id:'l_admin',n:'burocrática',color:'#7a7580',order:3},{id:'l_deep',n:'profunda',color:'#9d6bb5',order:4},{id:'l_comm',n:'comunicação',color:'#d4a84b',order:5},{id:'l_learn',n:'aprendizado',color:'#b8a9c4',order:6},{id:'l_maint',n:'manutenção',color:'#8b2942',order:7}];}
function defaultCommands() {
  return [
    mkCommand('Atalhos de teclado','Ritual','Ctrl+Z desfaz · Ctrl+K busca · N nova tarefa · F modo foco · Esc sair · Espaço inicia/pausa · ? este painel',''),
    mkCommand('Criar tarefa','Tarefas','Digite no campo. Tokens: ~30 (min), !a (alta), #projeto','Editar teaser ~45 !a'),
    mkCommand('Buscar global','Sistema','Ctrl+K abre busca em tudo (tarefas, projetos, contatos, vagas…)',''),
    mkCommand('Adicionar contato','Rede/Amizades','Aba Rede ou Amizades. Campos: nome, categoria, última conversa, tags',''),
    mkCommand('Log de interação','Rede/Amizades','Botões "Enviei" (saída) e "Recebi" (resposta). Atualizam score',''),
    mkCommand('Contato virou cliente','Rede','Botão "→ Virou cliente" no card cria/vincula cliente e agrupa histórico',''),
    mkCommand('Snooze com motivo','Rede/Amizades','"⏸ Adiar": não é bom momento, aguardando, pessoal, outro',''),
    mkCommand('Registrar vaga','Vagas','Cliente - Vaga ~ticket !prioridade @plataforma #área','Estúdio Noir - Ilustrador ~3500 !a @discord #ilustracao'),
    mkCommand('Avançar estágio','Vagas','Dropdown "→ estágio". Atualiza follow-up automaticamente',''),
    mkCommand('Vaga virou projeto','Vagas','Botão "→ Virou projeto" disponível a partir de oferta',''),
    mkCommand('Cliente','Clientes','Cadastro de clientes. Vincule em Projetos para agrupar rendimento',''),
    mkCommand('Cobrança em projeto','Projetos','Tipo: fixo, por hora ou por minuto. Suporta BRL, USD, EUR',''),
    mkCommand('Rendimento','Rendimento','Total em moeda principal, por cliente, rate/hora por projeto',''),
    mkCommand('Áreas customizáveis','Config','Config → Áreas: crie, renomeie, mude cor, arquive',''),
    mkCommand('Histórico','Histórico','Tarefas concluídas por dia. Reabrir, copiar, excluir',''),
    mkCommand('Lixo','Config','Config → Lixo: recuperar itens deletados de qualquer entidade',''),
    mkCommand('Backup','Config','Baixar/copiar/importar JSON',''),
    mkCommand('Seções','Semana','Tarefas se dividem em Compromissos (hora), Trabalho e Pessoal. Clique no header para colapsar.','')
  ].map((c,i) => ({...c, order:i}));
}

/* --- SEED E MIGRATE --- */
function seed() {
  const skills = DEF_SKILLS.map((d,i) => {const s = mkSkill(d.n, d.color); s.order = i; return s;});
  const sid = n => skills.find(s => s.n === n)?.id || '';
  const p1 = mkProject({id:'p1', n:'Prospecção internacional', area:'Carreira', reward:'Jantar fora'});
  return {
    v: VERSION,
    cfg: {focus:50, brk:10, cap:360, logo:null, notif:false, autoPriority:true, reviewChecks:{}, weekPriority:{}, theme:'obsidian', accentColor:null, focusDurations:[5,15,25,45,50,60], defaultFocus:25, usdRate:5.2, eurRate:5.6, currency:'BRL', primaryCurrency:'BRL', lastBackupAt:null, backupReminderDismissedAt:0, focusNoStop:false, taskDensity:'auto', sectionsCollapsed:{commitment:false, work:false, personal:false}},
    areas: AREAS_DEFAULT.map((a,i) => ({id:a.id, n:a.n, color:a.color, archived:false, order:i, updatedAt:Date.now()})),
    projects: [p1], skills, labels: defaultLabels(),
    tasks: [mkTask('Bloco A: prospecção ativa', {pr:0, est:45, proj:'p1', skills:[sid('Prospecção')], order:0, type:'comunicacao', labels:['l_comm'], section:'work'})],
    goals: [mkGoal({id:'g1', t:'2-3 clientes recorrentes'})],
    contacts: [], commands: defaultCommands(), applications: [], clients: [], trash: [], energy: {}, xpPool: 0, timer: null,
    lastModified: Date.now()
  };
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const s = JSON.parse(JSON.stringify(raw));
  s.tasks = s.tasks || []; s.projects = s.projects || []; s.goals = s.goals || [];
  s.skills = s.skills || []; s.contacts = s.contacts || [];
  s.applications = Array.isArray(s.applications) ? s.applications : [];
  s.clients = Array.isArray(s.clients) ? s.clients : [];
  s.commands = s.commands || defaultCommands();
  s.labels = Array.isArray(s.labels) && s.labels.length ? s.labels : defaultLabels();
  s.energy = s.energy && typeof s.energy === 'object' ? s.energy : {};
  s.xpPool = num(s.xpPool);
  s.cfg = s.cfg || {};
  s.cfg.focus = s.cfg.focus ?? 50; s.cfg.brk = s.cfg.brk ?? 10; s.cfg.cap = s.cfg.cap ?? 360;
  s.cfg.logo = s.cfg.logo ?? null; s.cfg.notif = s.cfg.notif ?? false;
  s.cfg.autoPriority = s.cfg.autoPriority ?? true;
  s.cfg.reviewChecks = s.cfg.reviewChecks || {}; s.cfg.weekPriority = s.cfg.weekPriority || {};
  s.cfg.theme = s.cfg.theme || 'obsidian';
  s.cfg.accentColor = s.cfg.accentColor ?? null;
  s.cfg.focusDurations = Array.isArray(s.cfg.focusDurations) && s.cfg.focusDurations.length ? s.cfg.focusDurations : [5,15,25,45,50,60];
  s.cfg.defaultFocus = s.cfg.defaultFocus || 25;
  s.cfg.usdRate = s.cfg.usdRate || 5.2;
  s.cfg.currency = s.cfg.currency || 'BRL';
  s.cfg.sectionsCollapsed = s.cfg.sectionsCollapsed || {commitment:false, work:false, personal:false};
  s.timer = s.timer || null;

  const isV1 = !s.v || s.v < 2, isV2 = !s.v || s.v < 3, isV3 = !s.v || s.v < 4;
  const isV4 = !s.v || s.v < 5, isV5 = !s.v || s.v < 6;

  if (isV1) {
    DEF_SKILLS.forEach(d => {if (!s.skills.find(x => x.n === d.n)) s.skills.push(mkSkill(d.n, d.color));});
    s.skills.forEach((sk, i) => {if (sk.order == null) sk.order = i; if (sk.xp == null) sk.xp = 0; if (sk.archived == null) sk.archived = false;});
    s.tasks.forEach((t, idx) => {
      t.desc = t.desc ?? ''; t.order = t.order ?? idx; t.next = t.next ?? false;
      t.skills = Array.isArray(t.skills) ? t.skills : []; t.logs = Array.isArray(t.logs) ? t.logs : []; t.subs = Array.isArray(t.subs) ? t.subs : [];
      if (t.sub && t.skills.length === 0) {let sk = s.skills.find(x => x.n.toLowerCase() === String(t.sub).toLowerCase()); if (!sk) {sk = mkSkill(t.sub, '#9a94a3'); s.skills.push(sk);} t.skills = [sk.id];}
      delete t.sub;
      if (typeof t.spent === 'number' && t.spent > 0 && t.logs.length === 0) t.logs.push({id: uid(), minutes: t.spent, start: null, end: null, subId: null, note: 'v1', migrated: true});
      t.subs = t.subs.map((sb, si) => {if (typeof sb === 'string') sb = {t: sb, d: false}; return {id: sb.id || uid(), t: sb.t || '', d: !!sb.d, xpClaimed: !!sb.d, est: +sb.est || 0, order: sb.order ?? si, logs: Array.isArray(sb.logs) ? sb.logs : []};});
      t.xpClaimed = !!t.done; delete t.spent;
    });
    if (Array.isArray(s.people)) {
      s.people.forEach(p => {
        const personal = ['Amigo','Amiga','Date','Amigo casual','Conhecido'].includes(p.rel);
        const cat = personal ? (CAT_PERSONAL.includes(p.rel) ? p.rel : 'Conhecido') : (CAT_PRO.includes(p.rel) ? p.rel : 'Prospect');
        s.contacts.push(mkContact({id: p.id || uid(), n: p.n || '', type: personal ? 'personal' : 'pro', cat, where: p.where || '', notes: p.note || '', lastContact: p.last || '', nextContact: p.next || '', cadence: CADENCE_DEFAULT[cat] ?? (personal ? 21 : 30)}));
      });
      delete s.people;
    }
    s.v = 2;
  }
  if (isV2) {
    s.tasks.forEach(t => {t.labels = Array.isArray(t.labels) ? t.labels : []; t.type = typeof t.type === 'string' ? t.type : ''; t.color = typeof t.color === 'string' ? t.color : ''; t.doneAt = t.doneAt ?? (t.done ? (t.logs?.slice(-1)[0]?.end || null) : null);});
    s.labels = s.labels.length ? s.labels : defaultLabels(); s.v = 3;
  }
  if (isV3) {
    s.tasks.forEach(t => {if (t.createdAt == null) t.createdAt = Date.now(); if (t.postponedCount == null) t.postponedCount = 0; if (t.lastPostponedAt == null) t.lastPostponedAt = null;});
    s.cfg.reviewChecks = s.cfg.reviewChecks || {}; s.cfg.weekPriority = s.cfg.weekPriority || {}; s.v = 4;
  }
  if (isV4) {
    s.applications = s.applications.map(a => ({id: a.id || uid(), client: a.client || '', role: a.role || '', url: a.url || '', contactName: a.contactName || '', contactInfo: a.contactInfo || '', platform: a.platform || '', area: a.area || '', subarea: a.subarea || '', ticket: +a.ticket || 0, priority: a.priority ?? 1, notes: a.notes || '', stage: JOB_STAGES.find(st => st.id === a.stage)?.id || 'prospect', stageHistory: Array.isArray(a.stageHistory) ? a.stageHistory : [{stage: a.stage || 'prospect', at: Date.now()}], foundAt: a.foundAt || Date.now(), appliedAt: a.appliedAt || null, firstResponseAt: a.firstResponseAt || null, nextFollowUp: a.nextFollowUp || '', lastInteractionAt: a.lastInteractionAt || null, linkedTaskId: a.linkedTaskId || null, interactions: Array.isArray(a.interactions) ? a.interactions : []}));
    s.v = 5;
  }
  if (isV5) {
    s.contacts = s.contacts.map(c => {
      const nc = {...mkContact(), ...c, interactions: Array.isArray(c.interactions) ? c.interactions : [], tags: Array.isArray(c.tags) ? c.tags : [], importantDates: Array.isArray(c.importantDates) ? c.importantDates : []};
      if (Array.isArray(c.history) && c.history.length) {
        c.history.forEach(h => nc.interactions.push({at: h.date ? new Date(h.date).getTime() : Date.now(), type: 'msg', direction: 'out', outcome: 'unknown', note: h.note || ''}));
        delete nc.history;
      }
      nc.sentCount = nc.interactions.filter(i => i.direction === 'out').length;
      nc.receivedCount = nc.interactions.filter(i => i.direction === 'in').length;
      return nc;
    });
    s.v = 6;
  }

  const latestCmds = defaultCommands();
  const existingNames = new Set(s.commands.map(c => c.n));
  latestCmds.forEach(c => {if (!existingNames.has(c.n)) s.commands.push({...c, id: uid(), order: s.commands.length, updatedAt: Date.now()});});

  s.projects = s.projects.map(p => ({
    ...p,
    clientId: p.clientId ?? '',
    client: p.client ?? '',
    billingType: p.billingType ?? 'none',
    billingValue: +p.billingValue || 0,
    actualValue: (p.actualValue != null && p.actualValue !== '') ? +p.actualValue : null,
    completedAt: p.completedAt ?? null,
    manualHours: (p.manualHours != null && p.manualHours !== '') ? +p.manualHours : null
  }));
  s.projects.forEach(p => {
    if (!p.completedAt && !p.archived) {
      const ts = s.tasks.filter(t => t.proj === p.id);
      if (ts.length > 0 && ts.every(t => t.done)) {
        const maxDone = Math.max(...ts.map(t => t.doneAt || 0));
        if (maxDone > 0) p.completedAt = maxDone;
      }
    }
  });

  if (s.timer) {
    s.timer = {
      taskId: s.timer.taskId,
      subId: s.timer.subId || null,
      startedAt: s.timer.startedAt || null,
      accumulated: s.timer.accumulated || 0,
      paused: s.timer.paused || false,
      targetMin: s.timer.targetMin || null,
      phase: s.timer.phase || null,
      focusMin: s.timer.focusMin || s.timer.targetMin || null,
      restMin: s.timer.restMin || s.cfg.brk || 10,
      cycleCount: s.timer.cycleCount || 0
    };
  }

  if (!Array.isArray(s.areas) || !s.areas.length) {
    s.areas = AREAS_DEFAULT.map((a,i) => ({id:a.id, n:a.n, color:a.color, archived:false, order:i, updatedAt:Date.now()}));
  }
  s.cfg.primaryCurrency = s.cfg.primaryCurrency || 'BRL';
  s.cfg.eurRate = s.cfg.eurRate || 5.6;
  s.cfg.lastBackupAt = s.cfg.lastBackupAt ?? null;
  s.cfg.backupReminderDismissedAt = s.cfg.backupReminderDismissedAt ?? 0;
  s.cfg.focusNoStop = s.cfg.focusNoStop ?? false;
  s.cfg.taskDensity = s.cfg.taskDensity ?? 'auto';
  ['projects','clients','contacts','applications','skills','goals'].forEach(k => {
    (s[k]||[]).forEach(o => {if (o.deletedAt === undefined) o.deletedAt = null;});
  });
  ['tasks','projects','clients','contacts','applications','skills','goals','labels','commands'].forEach(k => {
    (s[k]||[]).forEach(o => {if (o.updatedAt === undefined) o.updatedAt = o.createdAt || Date.now();});
  });
  s.projects.forEach(p => {if (!p.currency) p.currency = 'BRL';});
  s.contacts.forEach(c => {if (c.clientId === undefined) c.clientId = null;});
  s.applications.forEach(a => {if (a.projectId === undefined) a.projectId = null;});

  s.cfg.sectionsCollapsed = s.cfg.sectionsCollapsed || {commitment:false, work:false, personal:false};
  s.tasks.forEach(t => {
    if (t.time === undefined) t.time = '';
    if (t.section === undefined) t.section = '';
  });
  s.xpPool = num(s.xpPool);
  (s.skills || []).forEach(sk => {sk.xp = num(sk.xp);});
  s.tasks.forEach(t => {
    if (!Array.isArray(t.logs)) t.logs = [];
    if (!Array.isArray(t.labels)) t.labels = [];
    t.spent = t.logs.reduce((a,l) => a + (+l.minutes || 0), 0);
    t.subs.forEach(sb => {if (!Array.isArray(sb.logs)) sb.logs = []; if (sb.xpClaimed == null) sb.xpClaimed = !!sb.d;});
  });

  s.v = VERSION;
  s.lastModified = s.lastModified || Date.now();
  return s;
}

/* --- PERSISTÊNCIA --- */
function save() {
  dirty = true;
  S.lastModified = Date.now();
  try {localStorage.setItem(LS_KEY, JSON.stringify(S));} catch(e) {toast('Erro ao salvar', true);}
  clearTimeout(saveTmr);
  saveTmr = setTimeout(() => {if (!dbDoc) return; dbDoc.set({json: JSON.stringify(S)}).catch(err => console.warn('Sync offline:', err));}, 1500);
}
function backupLocal() {try {localStorage.setItem(LS_BACKUP, JSON.stringify(S));} catch(e) {}}
function snapshot() {undoStack.push(JSON.stringify(S)); if (undoStack.length > 30) undoStack.shift();}
function undo() {if (!undoStack.length) return toast('Nada para desfazer'); try {S = JSON.parse(undoStack.pop()); applyTheme(); save(); render(); toast('Desfeito');} catch(e) {toast('Erro', true);}}

/* --- LIXEIRA --- */
function softDelete(collection, id) {
  const arr = S[collection]; if (!Array.isArray(arr)) return false;
  const obj = arr.find(x => x.id === id); if (!obj) return false;
  obj.deletedAt = Date.now(); obj.updatedAt = Date.now();
  return true;
}
function hardDelete(collection, id) {
  const arr = S[collection]; if (!Array.isArray(arr)) return false;
  S[collection] = arr.filter(x => x.id !== id);
  return true;
}
function restoreItem(collection, id) {
  const arr = S[collection]; if (!Array.isArray(arr)) return false;
  const obj = arr.find(x => x.id === id); if (!obj) return false;
  obj.deletedAt = null; obj.updatedAt = Date.now();
  return true;
}
function listAllDeleted() {
  const out = [];
  const types = [
    {key:'projects', label:'Projeto', icon:'▦'},
    {key:'clients', label:'Cliente', icon:'◈'},
    {key:'contacts', label:'Contato', icon:'☰'},
    {key:'applications', label:'Vaga', icon:'✉'},
    {key:'skills', label:'Habilidade', icon:'✧'},
    {key:'goals', label:'Meta', icon:'◇'}
  ];
  types.forEach(t => {
    (S[t.key]||[]).forEach(o => {
      if (o.deletedAt) out.push({type:t.key, label:t.label, icon:t.icon, obj:o, at:o.deletedAt, title:o.n || o.t || o.client || '(sem nome)'});
    });
  });
  (S.trash||[]).forEach(tr => {
    if (tr.task) out.push({type:'trash', label:'Tarefa', icon:'●', obj:tr.task, at:tr.deletedAt, title:tr.task.t || '(sem nome)', trashId:tr.id});
  });
  return out.sort((a,b) => (b.at||0) - (a.at||0)).slice(0, 200);
}