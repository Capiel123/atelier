/* ATELIER v14.1 */
const VERSION = 14.1;
const LS_KEY = 'atelier';
const LS_BACKUP = 'atelier_backup_prev';
const LEVEL_XP = 150;

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

/* ===== HELPERS GERAIS ===== */
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

/* ===== ESTADO DE UI (session-only) ===== */
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
let subsCollapsed = new Set();        // sessão: subtarefas explicitamente recolhidas
let forcedCompact = null;              // null = automático, true = compacto, false = expandido
let selectedTaskId = null;
let mobileFiltersOpen = false;
const openEdits = new Set();

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

/* ═══ SECTION: MODELS ═══ */
/* ===== MODELOS ===== */
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

/* ===== SEED ===== */
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

/* ═══ SECTION: PERSISTENCE ═══ */
/* ===== MIGRAÇÃO ===== */
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

  /* ---- V11 → V12 ---- */
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

  /* ---- V12 → V13 ---- */
  s.cfg.sectionsCollapsed = s.cfg.sectionsCollapsed || {commitment:false, work:false, personal:false};
  s.tasks.forEach(t => {
    if (t.time === undefined) t.time = '';
    if (t.section === undefined) t.section = '';
  });
  // Sanitização de XP (corrige valores corrompidos)
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

/* ===== PERSISTÊNCIA ===== */
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

/* ===== SOFT DELETE ===== */
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

/* ===== XP (V13 — curva progressiva + repetição + contenção) ===== */
/* ═══ SECTION: XP ═══ */
function xpToNextLevel(level) {
  // Curva progressiva: 150, 180, 210, ... (cresce 20% do base por nível)
  return Math.round(LEVEL_XP * (1 + (level - 1) * 0.2));
}
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
function globalXp() {
  return (num(S.xpPool)) + S.skills.reduce((a,s) => a + num(s.xp), 0);
}
function taskBaseXp(t) {
  const base = [30, 20, 10][t.pr] + Math.round((t.est || 0) / 10);
  // Desconto por repetição: mesma tarefa concluída nos últimos 30 dias
  const cutoff = Date.now() - 30 * 86400000;
  const norm = (t.t || '').toLowerCase().trim();
  const repeated = S.tasks.some(other =>
    other.id !== t.id && other.done && other.doneAt && other.doneAt >= cutoff &&
    (other.t || '').toLowerCase().trim() === norm
  );
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
  if (subs.length > 0) {
    // XP distribuído pelas subs — cada sub já entrega uma fração
    subs.forEach(sb => awardSubXp(t, sb, true));
    return true;
  }
  // Sem subs: XP direto
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

/* ===== SEÇÕES (Modelo 4) ===== */
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
  const inProgressWeight = tasks.filter(t => !t.done).reduce((a,t) => {
    const w = taskWeight(t);
    const spent = taskMinutes(t);
    return a + Math.min(w, spent);
  }, 0);
  const pct = totalWeight > 0 ? Math.round(((doneWeight + inProgressWeight) / totalWeight) * 100) : 0;
  return {pct, totalWeight, doneWeight, inProgressWeight};
}

/* ===== RENDIMENTO / MOEDA ===== */
function projectEarnings(p) {
  const ts = S.tasks.filter(t => t.proj === p.id);
  const estMin = ts.reduce((a,t) => a + (t.est || 0), 0);
  const actualMin = ts.reduce((a,t) => a + taskMinutes(t), 0);
  const hours = (p.manualHours != null && p.manualHours > 0) ? p.manualHours
    : (actualMin > 0 ? actualMin / 60 : (estMin > 0 ? estMin / 60 : 0));
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

/* ===== ENERGIA / SCORE ===== */
function currentEnergySlot() {const h = new Date().getHours(); if (h >= 6 && h < 12) return 'morning'; if (h >= 12 && h < 18) return 'afternoon'; return 'evening';}
function defaultEnergyForSlot(slot) {return slot === 'morning' ? 'high' : slot === 'afternoon' ? 'med' : 'low';}
function getTodayEnergy() {const today = iso(new Date()); const dayE = S.energy[today] || {}; return {morning: dayE.morning || defaultEnergyForSlot('morning'), afternoon: dayE.afternoon || defaultEnergyForSlot('afternoon'), evening: dayE.evening || defaultEnergyForSlot('evening')};}
function currentEnergy() {return getTodayEnergy()[currentEnergySlot()];}
function setEnergy(slot, level) {const today = iso(new Date()); if (!S.energy[today]) S.energy[today] = {}; S.energy[today][slot] = level;}

/* ═══ SECTION: SCORING ═══ */
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
  // Postergação acumulada
  score += Math.min(36, (t.postponedCount || 0) * 12);
  // Estagnação por idade
  const ageDays = (Date.now() - (t.createdAt || Date.now())) / 86400000;
  if (ageDays > 7) score += Math.min(30, Math.round((ageDays - 7) * 3));
  // Herança de prazo do projeto
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

/* ===== VAGAS ===== */
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

/* ===== CONTATOS ===== */
function contactStatus(c) {const today = iso(new Date()); if (c.archived) return {k:'arquivado', label:'Arquivado', color:'#666'}; if (c.snoozedUntil && c.snoozedUntil > today) return {k:'snoozed', label:'Adiado até ' + fmtDate(c.snoozedUntil), color:'#7a7580'}; if (c.waitingFor && c.waitingSince) {const waitDays = (Date.now() - c.waitingSince) / 86400000; if (waitDays >= 10) return {k:'atrasado', label:'Aguardando há ' + Math.round(waitDays) + 'd', color:'#e0626a'}; if (waitDays >= 5) return {k:'aguardando', label:'Aguardando', color:'#6b3a5e'}; return {k:'aguardando', label:'Aguardando (recente)', color:'#6b3a5e'};} if (!c.lastContact && !c.nextContact) return {k:'novo', label:'Novo contato', color:'#9a94a3'}; if (c.nextContact && c.nextContact < today) return {k:'atrasado', label:'Follow-up atrasado', color:'#e0626a'}; if (c.nextContact && c.nextContact === today) return {k:'hoje', label:'Follow-up hoje', color:'#e0a33b'}; if (c.nextContact) return {k:'agendado', label:'Em dia', color:'#4fb3a2'}; if (c.lastContact) return {k:'interagido', label:'Sem próximo passo', color:'#9a94a3'}; return {k:'novo', label:'Novo contato', color:'#9a94a3'};}
function contactScore(c) {if (c.archived || c.deletedAt) return -1000; const today = iso(new Date()); if (c.snoozedUntil && c.snoozedUntil > today) return -500; const last = c.lastContact ? new Date(c.lastContact) : null; const days = last ? (Date.now() - last.getTime()) / 86400000 : 999; const cadence = c.cadence || 30; const ratio = days / cadence; let score = 0; if (ratio >= 2) score += 60; else if (ratio >= 1.5) score += 45; else if (ratio >= 1) score += 28; else if (ratio >= 0.7) score += 12; score += [15, 8, 0][c.priority] ?? 0; if (c.waitingFor && c.waitingSince) {const waitDays = (Date.now() - c.waitingSince) / 86400000; if (waitDays < 5) score *= 0.3; else if (waitDays >= 10) score += 12;} if ((c.sentCount || 0) >= 3) {const rate = (c.receivedCount || 0) / c.sentCount; if (rate >= 0.6) score += 10; else if (rate < 0.2) score -= 15;} if (c.type === 'personal') score *= 0.75; return Math.max(0, Math.round(score));}
function contactScoreBreakdown(c) {if (c.archived) return 'Arquivado'; const today = iso(new Date()); if (c.snoozedUntil && c.snoozedUntil > today) return 'Adiado até ' + fmtDate(c.snoozedUntil); const parts = []; const last = c.lastContact ? new Date(c.lastContact) : null; const days = last ? (Date.now() - last.getTime()) / 86400000 : 999; const cadence = c.cadence || 30; const ratio = days / cadence; if (ratio >= 2) parts.push('atrasado ' + (Math.round(ratio * 10) / 10) + 'x cadência'); else if (ratio >= 1) parts.push('cadência vencida'); else if (ratio >= 0.7) parts.push('em dia'); else parts.push('recente'); parts.push('prioridade ' + PR[c.priority].toLowerCase()); if (c.waitingFor) parts.push('aguardando'); if ((c.sentCount || 0) >= 3) {const rate = (c.receivedCount || 0) / c.sentCount; if (rate >= 0.6) parts.push('responde bem'); else if (rate < 0.2) parts.push('raramente responde');} if (c.type === 'personal') parts.push('pessoal × 0.75'); return parts.join(' · ');}
function connectionDepth(c) {const days = c.lastContact ? (Date.now() - new Date(c.lastContact).getTime()) / 86400000 : 999; const int90 = (c.interactions || []).filter(i => i.at > Date.now() - 90 * 86400000).length; if (days < 14 && int90 >= 3) return 1; if (days < 60 || int90 >= 2) return 2; return 3;}
function logInteraction(c, direction, type = 'msg', note = '') {const d = new Date(); c.lastContact = iso(d); const nd = new Date(d); nd.setDate(nd.getDate() + (c.cadence || 30)); c.nextContact = iso(nd); c.interactions = c.interactions || []; c.interactions.unshift({at: Date.now(), type, direction, outcome: direction === 'out' ? 'sent' : 'responded', note}); if (c.interactions.length > 100) c.interactions = c.interactions.slice(0, 100); if (direction === 'out') {c.waitingFor = true; c.waitingSince = Date.now(); c.sentCount = (c.sentCount || 0) + 1;} else {c.waitingFor = false; c.waitingSince = null; c.receivedCount = (c.receivedCount || 0) + 1;} touch(c);}
function snoozeContact(c, days, reason) {const d = new Date(); d.setDate(d.getDate() + days); c.snoozedUntil = iso(d); c.snoozeReason = reason; c.waitingFor = false; c.waitingSince = null; touch(c);}
function contactAllTags() {const set = new Set(); alive(S.contacts).forEach(c => (c.tags || []).forEach(t => set.add(t))); return [...set].sort();}
function contactResponseRate(c) {if (!c.sentCount) return null; return c.receivedCount / c.sentCount;}
function upcomingBirthdays(withinDays = 14) {const out = []; const today = new Date(); const todayIso = iso(today); alive(S.contacts).forEach(c => {if (!c.birthday || c.archived) return; const parts = c.birthday.split('-'); if (parts.length < 2) return; const mm = +parts[parts.length - 2], dd = +parts[parts.length - 1]; if (!mm || !dd) return; const y = today.getFullYear(); let next = new Date(y, mm - 1, dd); if (iso(next) < todayIso) next = new Date(y + 1, mm - 1, dd); const days = Math.round((next - today) / 86400000); if (days <= withinDays) out.push({contact: c, days, date: iso(next)});}); return out.sort((a,b) => a.days - b.days);}

/* ═══ SECTION: TIMER ═══ */
/* ===== TIMER ===== */
function timerElapsedSec() {if (!S.timer) return 0; const acc = S.timer.accumulated || 0; const run = S.timer.startedAt ? (Date.now() - S.timer.startedAt) / 1000 : 0; return acc + run;}
function startTimer(taskId, subId, targetMin) {if (S.timer) {toast('Timer já rodando', true); return;} S.timer = {taskId, subId: subId || null, startedAt: Date.now(), accumulated: 0, paused: false, targetMin: targetMin || null, phase: targetMin ? 'focus' : null, focusMin: targetMin || null, restMin: S.cfg.brk || 10, cycleCount: 0}; save(); renderTimer(); render(); if (targetMin) toast('▶ Bloco de ' + targetMin + 'min iniciado'); else toast('Timer iniciado');}
function pauseTimer() {if (!S.timer || S.timer.paused) return; S.timer.accumulated = timerElapsedSec(); S.timer.startedAt = null; S.timer.paused = true; save(); renderTimer(); if (focusTaskId) renderFocus(); toast('⏸ Pausado');}
function resumeTimer() {if (!S.timer || !S.timer.paused) return; S.timer.startedAt = Date.now(); S.timer.paused = false; save(); renderTimer(); if (focusTaskId) renderFocus(); toast('▶ Retomado');}
function advancePhase() {
  if (!S.timer) return;
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  if (S.timer.phase === 'focus') {
    const el = Math.round(timerElapsedSec() / 60);
    if (t && el > 0) {const now = Date.now(); t.logs.push({id: uid(), minutes: el, start: now - el*60000, end: now, subId: S.timer.subId || null, note: 'pomodoro'}); t.spent = taskMinutes(t); touch(t); toast('+' + el + 'min de foco registrados');}
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
  save(); renderTimer();
  if (focusTaskId) {renderFocus(); const overlay = document.getElementById('focusOverlay'); if (overlay) {overlay.classList.remove('flash'); void overlay.offsetWidth; overlay.classList.add('flash'); setTimeout(() => overlay.classList.remove('flash'), 1250);}}
}
function stopTimer(override) {
  if (!S.timer) return;
  const elapsed = override != null ? override : Math.round(timerElapsedSec() / 60);
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  if (t && elapsed > 0) {t.logs.push({id: uid(), minutes: elapsed, start: Date.now() - elapsed*60000, end: Date.now(), subId: S.timer.subId || null, note: ''}); t.spent = taskMinutes(t); touch(t); toast('+' + elapsed + 'min');}
  S.timer = null; save(); renderTimer();
  if (['week','skills','proj','stats'].includes(tab)) render();
}
function renderTimer() {
  const el = $('#timerWidget'), lbl = $('#tlabel'), time = $('#ttime'), stopBtn = $('#tstop');
  if (!el) return;
  if (!S.timer) {el.classList.remove('run'); lbl.textContent = 'Pronto'; time.textContent = '00:00'; stopBtn.style.display = 'none'; return;}
  const t = S.tasks.find(x => x.id === S.timer.taskId);
  el.classList.add('run');
  time.textContent = fmtClock(timerElapsedSec());
  let label = t ? t.t : '—';
  if (S.timer.phase === 'rest') label = '☕ ' + label;
  else if (S.timer.paused) label = '⏸ ' + label;
  if (S.timer.subId && t) {const sb = t.subs.find(x => x.id === S.timer.subId); if (sb) label = sb.t;}
  lbl.textContent = label.slice(0, 40);
  stopBtn.style.display = '';
}
setInterval(() => {if (S.timer) renderTimer();}, 500);
setInterval(() => {const slot = currentEnergySlot(); if (slot !== lastSlot) {lastSlot = slot; if (S && S.cfg.autoPriority && tab === 'week') refreshTaskList();}}, 60000);
setInterval(() => {if (!S.timer || S.timer.paused || !S.timer.targetMin) return; if (timerElapsedSec() / 60 >= S.timer.targetMin) advancePhase();}, 800);
function beep() {try {const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 720; g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5); o.start(); o.stop(a.currentTime + 0.5);} catch(e) {}}

/* ===== FOCO ===== */
/* ═══ SECTION: FOCUS ═══ */
function openFocus(taskId) {const t = S.tasks.find(x => x.id === taskId); if (!t || t.done) return toast('Escolha uma tarefa pendente', true); focusTaskId = taskId; renderFocus();}
function closeFocus() {
  if (S.timer && S.timer.taskId === focusTaskId) {
    if (S.cfg.focusNoStop) {
      const t = S.tasks.find(x => x.id === S.timer.taskId);
      const subId = S.timer.subId;
      const sub = subId && t?.subs.find(s => s.id === subId);
      const lbl = sub ? sub.t : t?.t || 'tarefa';
      focusTaskId = null;
      document.getElementById('focusOverlay')?.remove();
      toast('Timer continua em ' + lbl.slice(0,30) + ' · ⏸ no topo para parar');
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
function updateFocusTimer() {if (!focusTaskId || !S.timer || S.timer.taskId !== focusTaskId) return; if (S.timer.paused) return; const elapsedSec = timerElapsedSec(); const targetMin = S.timer.targetMin || focusTargetMin; const remainingSec = Math.max(0, targetMin * 60 - elapsedSec); const te = document.getElementById('focusTime'); if (te) te.textContent = fmtClock(remainingSec); const prog = targetMin > 0 ? Math.min(1, (elapsedSec/60) / targetMin) : 0; const circ = 2 * Math.PI * 100; const c = document.querySelector('.focus-progress'); if (c) c.style.strokeDashoffset = circ * (1 - prog);}
setInterval(() => {if (focusTaskId) updateFocusTimer();}, 500);

function renderFocus() {
  if (!focusTaskId) return;
  const t = S.tasks.find(x => x.id === focusTaskId);
  if (!t || t.done) return closeFocus();
  let el = document.getElementById('focusOverlay');
  if (!el) {el = document.createElement('div'); el.id = 'focusOverlay'; el.className = 'focus-overlay'; document.body.appendChild(el);}

  const running = S.timer && S.timer.taskId === t.id;
  const isPomodoro = running && S.timer.phase && S.timer.targetMin;
  const phase = (running && S.timer.phase) ? S.timer.phase : 'focus';
  const isPaused = running && S.timer.paused;
  const hasTarget = running && S.timer.targetMin;
  const elapsedSec = running ? timerElapsedSec() : 0;
  const targetMin = hasTarget ? S.timer.targetMin : focusTargetMin;
  const remainingSec = hasTarget ? Math.max(0, targetMin * 60 - elapsedSec) : targetMin * 60;
  const progress = hasTarget ? Math.min(1, (elapsedSec/60) / targetMin) : 0;
  const circ = 2 * Math.PI * 100;
  const offset = circ * (1 - progress);
  const timeStr = running && !hasTarget ? fmtClock(elapsedSec) : fmtClock(running ? remainingSec : targetMin * 60);
  const cycleCount = (running && S.timer.cycleCount) || 0;
  const durations = getFocusDurations();
  const runningSubId = running ? S.timer.subId : null;
  const runningSub = runningSubId ? t.subs.find(s => s.id === runningSubId) : null;
  const firstPending = (t.subs||[]).filter(s => !s.d).sort((a,b) => (a.order||0)-(b.order||0))[0];

  const ringColor = !running ? 'var(--bu)' : (phase === 'rest' ? 'var(--ok)' : (isPaused ? 'var(--wr)' : 'var(--ac)'));
  let eyebrow;
  if (!running) eyebrow = 'Pronto para focar';
  else if (runningSub) eyebrow = (isPaused ? 'Pausado · ' : 'Sessão · ') + runningSub.t.slice(0, 30);
  else if (isPaused) eyebrow = 'Pausado';
  else if (phase === 'rest') eyebrow = 'Descanso · ciclo ' + cycleCount;
  else eyebrow = 'Foco · ciclo ' + (cycleCount + 1);

  let primaryBtn;
  if (!running) {
    const label = firstPending ? `▶ Iniciar ${targetMin}min · ${firstPending.t.slice(0,20)}` : `▶ Iniciar ${targetMin}min`;
    primaryBtn = `<button data-a="focusStart" class="focus-btn start">${label}</button>`;
  }
  else if (isPaused) primaryBtn = `<button data-a="focusResume" class="focus-btn start">▶ Retomar</button>`;
  else primaryBtn = `<button data-a="focusPause" class="focus-btn pause">⏸ Pausar</button>`;

  const skipBtn = (running && isPomodoro) ? `<button data-a="focusSkip" class="focus-btn ghost">⏭ Pular</button>` : '';
  const durationsHtml = !running ? `<div class="focus-durations">${durations.map(m => `<button data-a="focusSetTarget" data-m="${m}" class="${focusTargetMin===m?'on':''}">${m}min</button>`).join('')}</div>` : '';
  const cycleDots = isPomodoro && cycleCount > 0 ? `<div style="font-size:14px;color:var(--mu);margin-top:4px;letter-spacing:2px">${'🍅'.repeat(Math.min(cycleCount, 8))}</div>` : '';
  const phaseSubtitle = isPomodoro
    ? (phase === 'rest' ? `Descanso · ${targetMin}min` : `Foco · ${targetMin}min${firstPending && !running ? ' · inicia em: '+firstPending.t.slice(0,20) : ''}`)
    : (running ? 'Sessão livre' : `Bloco de ${targetMin}min`);
  const hint = firstPending && !running ? 'Iniciando na primeira subtarefa pendente' : '';

  el.innerHTML = `
    <div class="focus-content" data-phase="${phase}">
      <button class="focus-close" data-a="closeFocus">✕</button>
      <div class="focus-eyebrow" data-phase="${phase}">${esc(eyebrow)}</div>
      <h1 class="focus-title">${esc(t.t)}</h1>
      <div class="focus-timer-wrap">
        <svg class="focus-circle" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100" fill="none" stroke="var(--bd)" stroke-width="6"/>
          <circle cx="120" cy="120" r="100" fill="none" stroke="${ringColor}" stroke-width="6" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 120 120)" stroke-linecap="round" class="focus-progress" style="transition:stroke-dashoffset .3s, stroke .3s"/>
        </svg>
        <div class="focus-time" id="focusTime">${timeStr}</div>
      </div>
      <div class="focus-phase-label" data-phase="${phase}">${esc(phaseSubtitle)}</div>
      ${hint ? `<div class="focus-hint" style="margin-top:6px;opacity:1;color:var(--ac);font-size:11px">${esc(hint)}</div>` : ''}
      ${cycleDots}
      ${durationsHtml}
      <div class="focus-actions">
        ${primaryBtn}
        ${skipBtn}
        <button data-a="closeFocus" class="focus-btn ghost">Sair</button>
      </div>
      ${(t.subs||[]).length ? `<div class="focus-subs"><div class="focus-subs-title">Subtarefas</div>${t.subs.map((s, i) => `<label class="focus-sub ${runningSub && runningSub.id === s.id ? 'run' : ''}"><input type="checkbox" data-a="focusSub" data-i="${i}" ${s.d?'checked':''}><span class="${s.d?'x':''}">${runningSub && runningSub.id === s.id ? '▶ ' : ''}${esc(s.t)}</span></label>`).join('')}</div>` : ''}
      <div class="focus-hint">Esc sai · Espaço ${isPaused ? 'retoma' : (running ? 'pausa' : 'inicia')}</div>
    </div>`;
}

/* ===== TOAST / COPY / DOWNLOAD ===== */
function toast(m, isErr) {const t = $('#toast'); t.textContent = m; t.className = 'toast on' + (isErr ? ' err' : ''); clearTimeout(toastTmr); toastTmr = setTimeout(() => t.classList.remove('on'), 2600);}
function copyTxt(s) {const fb = () => {const a = document.createElement('textarea'); a.value = s; document.body.appendChild(a); a.select(); try {document.execCommand('copy');} catch(e) {} a.remove();}; try {if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(() => toast('Copiado')).catch(() => {fb(); toast('Copiado');}); else {fb(); toast('Copiado');}} catch {fb(); toast('Copiado');}}
function downloadJSON(fn, content) {try {const blob = new Blob([content], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => {URL.revokeObjectURL(url); a.remove();}, 200); return true;} catch(e) {return false;}}

/* ===== HELPERS ===== */
const T = id => S.tasks.find(t => t.id === id);
const dayTasks = d => S.tasks.filter(t => t.day === d).sort((a,b) => (a.order||0) - (b.order||0));
const V = id => (document.getElementById(id) || {}).value ?? '';
const selOptions = (arr, cur) => arr.map(([v,l]) => `<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('');
const inp = (p, v, ty='text', ph='') => `<input data-p="${esc(p)}" type="${ty}" value="${esc(v??'')}" placeholder="${esc(ph)}">`;
function parseQuickLine(s, d) {let pr = 1, est = 0, proj = '', time = ''; s = s.replace(/!(a|m|b)\b/i, (_,x) => {pr = {a:0,m:1,b:2}[x.toLowerCase()]; return '';}); s = s.replace(/~(\d+)/, (_,n) => {est = +n; return '';}); s = s.replace(/#(\S+)/, (_,n) => {const p = alive(S.projects).find(p => p.n.toLowerCase().startsWith(n.toLowerCase())); if (p) proj = p.id; return p ? '' : '#' + n;}); s = s.replace(/@(\d{1,2}:\d{2})/, (_,t) => {time = t.padStart(5,'0'); return '';}); const title = s.trim(); if (!title) return null; return mkTask(title, {pr, est, proj, time, day: d, area: S.projects.find(p => p.id === proj)?.area || 'Carreira', order: d != null ? dayTasks(d).length : 0});}
function addQuick(d, text) {const t = parseQuickLine(text, d); if (t) S.tasks.push(t);}
function addBulk(d, text) {text.split('\n').map(x => x.trim()).filter(Boolean).forEach(l => {const t = parseQuickLine(l, d); if (t) S.tasks.push(t);});}
function postponeTask(t, offset) {if (!t) return; const oldDay = t.day; let newDay; if (offset === 'queue') newDay = null; else if (oldDay === null) newDay = (todayI() + (+offset)) % 7; else newDay = (oldDay + (+offset)) % 7; t.day = newDay; t.postponedCount = (t.postponedCount || 0) + 1; t.lastPostponedAt = Date.now(); touch(t); if (newDay !== null) t.order = dayTasks(newDay).length; toast((newDay === null ? 'Fila' : DAYS[newDay]) + ' · adiada ' + t.postponedCount + 'x'); save(); render();}

/* ===== SHORTCUTS HELP ===== */
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

/* ===== BUSCA GLOBAL ===== */
function openSearch() {
  const el = document.createElement('div');
  el.id = 'searchModal';
  el.className = 'search-modal';
  el.innerHTML = '<div class="search-content"><input id="searchInput" placeholder="Buscar em tudo…" value="" autofocus><div id="searchResults"></div><div class="msg" style="margin-top:8px;font-size:11px">Esc fecha · Enter no primeiro resultado</div></div>';
  document.body.appendChild(el);
  setTimeout(() => document.getElementById('searchInput')?.focus(), 30);
  renderSearchResults('');
}
function closeSearch() {document.getElementById('searchModal')?.remove(); searchQuery = '';}
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
    ['tasks','Tarefas','●','var(--ac)', t => ({title: t.t, sub: `${areaLabel(t.area)} · ${t.est?t.est+'min':'sem est.'}`, tab:'week', target:`[data-p="tasks:${t.id}:t"]`})],
    ['projects','Projetos','▦','#4fb3a2', p => ({title: p.n, sub: areaLabel(p.area), tab:'proj', target:`[data-p="projects:${p.id}:n"]`})],
    ['clients','Clientes','◈','var(--ok)', c => ({title: c.n, sub: '', tab:'clients', target:`[data-p="clients:${c.id}:n"]`})],
    ['contacts','Contatos','☰','#e0626a', c => ({title: c.n, sub: `${c.cat} · ${c.type==='pro'?'Rede':'Amizade'}`, tab: c.type==='pro'?'rede':'friends', target:`[data-p="contacts:${c.id}:n"]`})],
    ['applications','Vagas','✉','#c9764a', a => ({title: `${a.client} — ${a.role||''}`, sub: jobStage(a).n, tab:'jobs', target:`[data-p="applications:${a.id}:client"]`})],
    ['skills','Habilidades','✧','#a374d4', s => ({title: s.n, sub: '', tab:'skills', target:`[data-p="skills:${s.id}:n"]`})],
    ['goals','Metas','◇','#b8a9c4', g => ({title: g.t, sub: '', tab:'goal', target:`[data-p="goals:${g.id}:t"]`})]
  ];
  let html = '<div class="search-counter">' + groups.filter(([k]) => r[k].length).map(([k,l]) => `${r[k].length} ${l.toLowerCase()}`).join(' · ') + '</div>';
  let first = true;
  groups.forEach(([k, label, icon, color, fmt]) => {
    if (!r[k].length) return;
    html += `<div class="search-group"><div class="search-group-label">${label}</div>`;
    r[k].forEach(item => {
      const info = fmt(item);
      html += `<div class="search-result" data-a="searchGo" data-tab="${info.tab}" data-target="${esc(info.target)}" data-first="${first?'1':'0'}">
        <span class="search-icon" style="color:${color}">${icon}</span>
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
  setTimeout(() => {
    const el = document.querySelector(target)?.closest('.card, .client-card, .contact-card, .job-card');
    if (el) {
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2100);
    }
  }, 120);
}

/* ===== BACKUP REMINDER ===== */
function shouldShowBackupReminder() {
  const now = Date.now();
  if (S.cfg.backupReminderDismissedAt && now - S.cfg.backupReminderDismissedAt < 24 * 3600000) return false;
  if (!S.cfg.lastBackupAt) return S.tasks.length > 5;
  return now - S.cfg.lastBackupAt > 7 * 86400000;
}
function renderBackupBanner() {
  const el = document.getElementById('backupBanner');
  if (!el) return;
  if (!shouldShowBackupReminder()) {el.innerHTML = ''; return;}
  const never = !S.cfg.lastBackupAt;
  const days = never ? 0 : Math.floor((Date.now() - S.cfg.lastBackupAt) / 86400000);
  const text = never ? 'Você ainda não fez backup. Seus dados vivem só neste navegador.' : `Último backup: ${days} dia${days!==1?'s':''} atrás.`;
  el.innerHTML = `<div class="backup-banner"><span>${text}</span><button data-a="dl">Baixar JSON</button><button data-a="dismissBackup" title="Ocultar por 24h">✕</button></div>`;
}

/* ===== BOTTOM NAV / MORE ===== */
function showMoreSheet() {
  const el = document.getElementById('moreSheet');
  if (!el) return;
  el.innerHTML = `<div class="more-sheet-panel"><div class="big" style="margin-bottom:8px"><b>Menu</b><button data-a="closeMore">✕</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">${TABS.map(t => `<button data-a="tab" data-t="${t[0]}" class="${t[0]===tab?'on':''}" style="padding:12px 8px;font-size:12px;background:var(--s2);border:1px solid var(--bd)">${t[1]}</button>`).join('')}</div></div>`;
  el.classList.add('open');
}
function hideMoreSheet() {document.getElementById('moreSheet')?.classList.remove('open');}

const TABS = [
  ['week','Semana'],['q','Fila'],['jobs','Vagas'],['proj','Projetos'],
  ['clients','Clientes'],['earn','Rendimento'],
  ['cal','Prazos'],['goal','Metas'],['skills','Habilidades'],['stats','Stats'],
  ['review','Revisão'],['rede','Rede'],['friends','Amizades'],
  ['history','Histórico'],['cmds','Comandos'],['config','Config']
];
const BOTTOM_TABS = ['week','q','jobs','stats','more'];
const BOTTOM_LABELS = {week:'Semana',q:'Fila',jobs:'Vagas',stats:'Stats',more:'Mais'};
const BOTTOM_ICONS = {week:'☰',q:'☷',jobs:'✉',stats:'◔',more:'⋯'};

function renderBottomNav() {
  const el = document.getElementById('bottomNav');
  if (!el) return;
  const primary = BOTTOM_TABS.slice(0,-1);
  el.innerHTML = BOTTOM_TABS.map(k => {
    const active = k === 'more' ? !primary.includes(tab) : tab === k;
    return `<button data-a="${k==='more'?'moreOpen':'tab'}" data-t="${k}" class="${active?'on':''}"><span class="bn-icon">${BOTTOM_ICONS[k]}</span><span>${BOTTOM_LABELS[k]}</span></button>`;
  }).join('');
}

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
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {fav = document.createElement('link'); fav.rel = 'icon'; document.head.appendChild(fav);}
    fav.href = S.cfg.logo;
  }
}

function bar(p, label, msg) {return `<div class="bar"><div class="fill" style="width:${Math.min(100,p)}%"></div>${[25,50,75].map(x => `<i class="${p>=x?'lit':''}" style="left:${x}%"></i>`).join('')}<span>${p}% · ${label}</span></div>${msg ? `<div class="msg">${msg}</div>` : ''}`;}

/* ═══ SECTION: VIEWS ═══ */
/* ===== VIEW: SEMANA ===== */
function viewWeek() {
  const ts = dayTasks(day); const today = iso(new Date());
  const total = ts.length; const done = ts.filter(t => t.done).length;
  const workTasks = ts.filter(t => taskSection(t) === 'work');
  const personalTasks = ts.filter(t => taskSection(t) === 'personal');
  const commitmentTasks = ts.filter(t => taskSection(t) === 'commitment');
  const workProg = sectionProgress(workTasks);
  const personalProg = sectionProgress(personalTasks);
  const commitmentProg = sectionProgress(commitmentTasks);
  const workSpent = workTasks.reduce((a,t) => a + taskMinutes(t), 0);
  const cap = S.cfg.cap || 360;
  const full = workProg.totalWeight > cap;
  const nextTask = S.tasks.find(t => t.next && !t.done);
  const slot = currentEnergySlot(); const currentE = getTodayEnergy()[slot];
  const slotLabel = {morning:'Manhã', afternoon:'Tarde', evening:'Noite'}[slot];
  const wIso = iso(weekStart());
  const reviewDone = S.cfg.reviewChecks?.[wIso] && Object.keys(S.cfg.reviewChecks[wIso]||{}).filter(k => S.cfg.reviewChecks[wIso][k]).length >= 4 && S.cfg.weekPriority?.[wIso]?.text;
  const isReviewDay = [0, 6].includes(todayI());
  const showReviewHint = isReviewDay && !reviewDone;
  const nextCard = nextTask ? `<div class="next-card"><div><div class="nc-label">⭐ Próxima</div><div class="nc-title">${esc(nextTask.t)}</div><div class="nc-meta">${PR[nextTask.pr]} · ${esc(areaLabel(nextTask.area))}${nextTask.est?' · '+fmtMin(nextTask.est):''}</div></div><div class="nc-actions"><button class="go" data-a="focusMode" data-id="${nextTask.id}">⛶ Focar</button><button data-a="setnext" data-id="${nextTask.id}">✕</button></div></div>` : '';
  const isMobile = window.innerWidth <= 640;
  const compact = getTaskCompactMode();
  return `<div class="today-hero"><div><div class="th-day">${DAYS_FULL[day]}</div><div class="th-date">${today.split('-').reverse().join('/')}</div></div><div class="th-stats"><span>Feitas <b>${done}</b>/${total}</span><span>Est. trab. <b class="${full?'wr':''}">${fmtMin(workProg.totalWeight)}</b>/${fmtMin(cap)}</span><span>Gasto trab. <b>${fmtMin(workSpent)}</b></span></div></div>
    ${showReviewHint ? `<div class="warn" style="border:1px solid var(--ac);background:color-mix(in srgb,var(--ac) 10%,var(--s1));padding:8px 10px;border-radius:8px;font-size:12px;margin-bottom:8px"><b style="color:var(--ac)">É dia de revisão semanal.</b> <a href="#" data-a="tab" data-t="review" style="color:var(--ac);font-weight:700">Abrir →</a></div>` : ''}
    <div class="days">${DAYS.map((d,i) => {const a = dayTasks(i); return `<button class="${i===day?'on':''}" data-a="day" data-i="${i}">${d}${i===todayI()?'<i></i>':''}<small>${a.filter(t=>t.done).length}/${a.length}</small></button>`;}).join('')}</div>
    <div class="energy-row"><span class="energy-label">${slotLabel}:</span><div class="energy-pills">${ENERGY_LEVELS.map(e => `<button data-a="setEnergy" data-e="${e.id}" class="${currentE===e.id?'active':''}">${e.icon} ${e.n}</button>`).join('')}</div></div>
    ${nextCard}${bar(workProg.pct, total ? `${workTasks.filter(t=>t.done).length}/${workTasks.length} trab · ${fmtMin(workProg.doneWeight + workProg.inProgressWeight)}/${fmtMin(workProg.totalWeight)}` : 'sem tarefas', workProg.pct>=100 ? 'Trabalho fechado.' : workProg.pct>=50 ? 'Embalou.' : workProg.pct>0 ? 'Primeira vitória.' : 'Comece pequeno.')}
    ${(commitmentTasks.length || personalTasks.length) ? `<div style="display:flex;gap:16px;font-size:11.5px;color:var(--mu);margin:4px 2px 10px;flex-wrap:wrap">
      ${commitmentTasks.length ? `<span>${SECTION_META.commitment.icon} Compromissos: <b style="color:var(--tx)">${commitmentProg.pct}%</b> <span style="opacity:.7">(${commitmentTasks.filter(t=>t.done).length}/${commitmentTasks.length})</span></span>` : ''}
      ${personalTasks.length ? `<span>${SECTION_META.personal.icon} Pessoal: <b style="color:var(--tx)">${personalProg.pct}%</b> <span style="opacity:.7">(${personalTasks.filter(t=>t.done).length}/${personalTasks.length})</span></span>` : ''}
    </div>` : ''}
    ${adder(day)}${filterBar()}
    <div class="tasks-header"><h3 style="margin:0">Tarefas <span class="count" id="taskCount"></span></h3><div class="tasks-header-actions">
      ${isMobile ? `<button data-a="toggleFilters" style="padding:4px 8px;font-size:11px">${mobileFiltersOpen?'Fechar filtros':'Filtros'}</button>` : ''}
      ${compact ? `<button data-a="expandAll" style="padding:4px 8px;font-size:11px">Expandir todos</button>` : `<button data-a="collapseAll" style="padding:4px 8px;font-size:11px">Recolher todos</button>`}
      <label class="auto-prio-label"><input type="checkbox" id="autoPriorityToggle" ${S.cfg.autoPriority?'checked':''}><span>⭐ Auto</span></label>
    </div></div>
    <div id="taskList">${renderFilteredTasks()}</div>`;
}
function adder(d) {
  const dd = d ?? '';
  return `<div style="margin-bottom:12px">
    <div class="add">
      <input id="qa" data-d="${dd}" placeholder="Nova tarefa rápida… (ex: ~30 !a #proj @14:30)">
      <button data-a="qa" data-d="${dd}">+</button>
    </div>
    <details><summary style="font-size:11px;opacity:0.8">💡 Dica: atalhos de captura e múltiplas tarefas</summary>
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
  const hasFilters = filterState.text || filterState.type || filterState.area || filterState.proj || hasLabels;
  const areaOpts = getAreas().map(a => [a.id, a.n]);
  const isMobile = window.innerWidth <= 640;
  if (isMobile && !mobileFiltersOpen && !hasFilters) {
    return '<div style="margin-bottom:8px"></div>';
  }
  return `<div class="filter-bar">
    <input id="filterText" placeholder="🔍 Filtrar…" value="${esc(filterState.text)}">
    <select id="filterType"><option value="">Tipo</option>${TASK_TYPES.map(tt => `<option value="${tt.id}" ${filterState.type===tt.id?'selected':''}>${tt.icon} ${tt.n}</option>`).join('')}</select>
    <select id="filterArea"><option value="">Área</option>${areaOpts.map(a => `<option value="${esc(a[0])}" ${filterState.area===a[0]?'selected':''}>${esc(a[1])}</option>`).join('')}</select>
    <select id="filterProj"><option value="">Projeto</option>${alive(S.projects).filter(p=>!p.archived).map(p => `<option value="${p.id}" ${filterState.proj===p.id?'selected':''}>${esc(p.n)}</option>`).join('')}</select>
    <button data-a="toggleLabelsFilter" class="${hasLabels?'on':''}">Labels${hasLabels?' · '+filterState.labels.length:''}</button>
    ${hasFilters ? '<button data-a="clearFilters">✕</button>' : ''}
  </div>
  ${filterState.showLabels ? `<div class="labels-filter">${S.labels.map(l => `<button class="label-pill ${filterState.labels.includes(l.id)?'on':''}" style="--lc:${l.color}" data-a="toggleLabelFilter" data-id="${l.id}">${esc(l.n)}</button>`).join('')}</div>` : ''}`;
}
function getTaskCompactMode() {
  if (forcedCompact !== null) return forcedCompact;
  const d = S.cfg.taskDensity || 'auto';
  if (d === 'compact') return true;
  if (d === 'full') return false;
  return window.innerWidth <= 640;
}
function renderFilteredTasks() {
  const ctx = buildCtx();
  let list = dayTasks(day);
  if (filterState.text) {const q = filterState.text.toLowerCase(); list = list.filter(t => t.t.toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q));}
  if (filterState.type) list = list.filter(t => t.type === filterState.type);
  if (filterState.area) list = list.filter(t => t.area === filterState.area);
  if (filterState.proj) list = list.filter(t => t.proj === filterState.proj);
  if (filterState.labels.length) list = list.filter(t => filterState.labels.every(lid => (t.labels||[]).includes(lid)));

  setTimeout(() => {
    const el = document.getElementById('taskCount');
    if (el) el.textContent = `(${list.filter(t=>!t.done).length} pend · ${list.filter(t=>t.done).length} feitas)`;
  }, 0);

  if (!list.length) return list.length ? '<div class="msg">Nada com esses filtros.</div>' : '<div class="msg">Nada ainda.</div>';

  const grouped = {commitment: [], work: [], personal: []};
  list.forEach(t => grouped[taskSection(t)].push(t));
  const compact = getTaskCompactMode();
  const sectionsCollapsed = S.cfg.sectionsCollapsed || {};

  return SECTION_ORDER.map(section => {
    const items = grouped[section];
    if (!items.length) return '';
    const meta = sectionMeta(section);
    const collapsed = !!sectionsCollapsed[section];
    let ordered;
    if (S.cfg.autoPriority) {
      ordered = items.map(t => ({t, score: computeTaskScore(t, ctx)}))
        .sort((a,b) => {if (a.t.done !== b.t.done) return a.t.done ? 1 : -1; return b.score - a.score || (a.t.order||0) - (b.t.order||0);});
    } else {
      ordered = items.map(t => ({t, score: null})).sort((a,b) => {if (a.t.done !== b.t.done) return a.t.done ? 1 : -1; return (a.t.order||0) - (b.t.order||0);});
    }
    const pend = items.filter(t => !t.done).length;
    const prog = sectionProgress(items);
    const headerHtml = `<div class="section-header" data-a="toggleSection" data-section="${section}">
      <div class="section-header-title">
        <span style="color:${meta.color};font-size:14px">${meta.icon}</span>
        <b style="color:${meta.color}">${meta.n}</b>
        <span class="section-header-meta">${pend} pend · ${items.length} total</span>
      </div>
      <div class="section-header-right">
        <div class="section-progress"><div style="width:${prog.pct}%;background:${meta.color}"></div></div>
        <span class="section-pct">${prog.pct}%</span>
        <span class="chev">${collapsed ? '▸' : '▾'}</span>
      </div>
    </div>`;
    if (collapsed) return headerHtml;
    const cardsHtml = ordered.map(({t, score}) => compact && !expandedTasks.has(t.id) ? cardTaskCompact(t, score) : cardTask(t, score)).join('');
    return headerHtml + cardsHtml;
  }).join('') || '<div class="msg">Nada com esses filtros.</div>';
}
function refreshTaskList() {const el = document.getElementById('taskList'); if (el) el.innerHTML = renderFilteredTasks();}

function cardTaskCompact(t, score) {
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id)).filter(Boolean);
  const borderColor = t.color || (skillObjs[0]?.color) || areaColor(t.area);
  const spent = taskMinutes(t);
  const isQuick = t.est && t.est <= 10;
  const runningThis = S.timer && S.timer.taskId === t.id;
  const subsTotal = (t.subs||[]).length;
  const subsDone = (t.subs||[]).filter(s => s.d).length;
  const isSelected = selectedTaskId === t.id;
  return `<div class="card compact ${t.done?'done':''} ${t.next?'next-card-in':''} ${isSelected?'selected':''}" style="--c:${borderColor}" data-a="expandTask" data-id="${t.id}">
    <div class="row">
      <button class="chk" data-a="tog" data-id="${t.id}">${t.done?'✓':''}</button>
      <div class="ti">
        <div class="compact-tt">${t.time?`<span style="color:var(--wr)">⏰ ${esc(t.time)} </span>`:''}${esc(t.t)}</div>
        <div class="compact-meta">
          <i class="dot" style="background:${PRC[t.pr]}"></i>
          <span>${fmtMin(spent)}${t.est?'/'+fmtMin(t.est):''}</span>
          ${subsTotal?`<span>· ${subsDone}/${subsTotal} sub</span>`:''}
          ${isQuick?'<span style="color:#8fa5b8">⚡</span>':''}
          ${t.next?'<span style="color:var(--ac)">⭐</span>':''}
          ${runningThis?'<span style="color:var(--bu)">▶</span>':''}
        </div>
      </div>
      <span class="chev">▸</span>
    </div>
  </div>`;
}

function cardTask(t, score) {
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id)).filter(Boolean);
  const borderColor = t.color || (skillObjs[0]?.color) || areaColor(t.area);
  const type = TASK_TYPES.find(x => x.id === t.type); const proj = S.projects.find(p => p.id === t.proj);
  const spent = taskMinutes(t); const pctT = t.est ? Math.min(100, Math.round(spent / t.est * 100)) : 0;
  const subsDone = (t.subs || []).filter(s => s.d).length; const subsTotal = (t.subs || []).length;
  const subPct = subsTotal ? Math.round(subsDone / subsTotal * 100) : 0;
  const runningThis = S.timer && S.timer.taskId === t.id && !S.timer.subId;
  const isQuick = t.est && t.est <= 10;
  const labels = (t.labels||[]).map(lid => S.labels.find(l => l.id === lid)).filter(Boolean);
  const stuck = isStuck(t); const urgentStuck = isUrgentStuck(t); const over = isOverEstimate(t);
  const subsExpanded = subsCollapsed.has(t.id) ? false
                    : (expandedSubs.has(t.id) ? true : !getTaskCompactMode());
  const k = f => `tasks:${t.id}:${f}`;
  const isSelected = selectedTaskId === t.id;
  const scoreTip = score != null ? scoreBreakdown(t, buildCtx()) : '';
  return `<div class="card ${t.done?'done':''} ${t.next?'next-card-in':''} ${isSelected?'selected':''}" style="--c:${borderColor}"><div class="row"><button class="chk" data-a="tog" data-id="${t.id}">${t.done?'✓':''}</button><div class="ti"><div class="tt">${type ? `<span class="type-icon ${type.id}">${type.icon}</span>` : ''}<span data-a="selectTask" data-id="${t.id}" style="cursor:pointer">${esc(t.t)}</span>${isQuick ? '<span class="quick-ind">⚡</span>' : ''}${t.time ? `<span class="tag" style="color:var(--wr)">⏰ ${esc(t.time)}</span>` : ''}</div>${t.desc ? `<div class="tdesc">${esc(t.desc)}</div>` : ''}<div class="meta"><i class="dot" style="background:${PRC[t.pr]}"></i>${PR[t.pr]}<span class="tag" style="color:${areaColor(t.area)}">${esc(areaLabel(t.area))}</span>${skillObjs.map(s => `<span class="tag" style="color:${s.color}">${esc(s.n)}</span>`).join('')}${proj ? `<span class="tag">${esc(proj.n)}</span>` : ''}${t.due ? `<span class="tag">prazo ${fmtDate(t.due)}</span>` : ''}${t.next ? '<span class="tag" style="color:var(--ac)">⭐</span>' : ''}${labels.slice(0,4).map(l => `<span class="label-pill" style="--lc:${l.color}">${esc(l.n)}</span>`).join('')}${labels.length>4 ? `<span class="label-pill">+${labels.length-4}</span>` : ''}${stuck ? `<span class="postpone-badge ${urgentStuck?'urgent':'stuck'}">⟳ ${t.postponedCount}x</span>` : ''}${over ? '<span class="parkinson-badge">⏱ 2×</span>' : ''}${score != null ? `<span class="score-badge ${scoreClass(score)}" title="${esc(scoreTip)}">${score}</span>` : ''}</div></div><div class="tm"><b>${fmtMin(spent)}</b>${t.est?' / '+fmtMin(t.est):''}<div class="mini"><div style="width:${pctT}%"></div></div>${subsTotal?`<div style="font-size:10px;margin-top:2px">${subsDone}/${subsTotal}</div>`:''}</div></div>
  ${subsTotal ? (subsExpanded ? renderSubs(t) : `<div class="subs-badge" data-a="expandSubs" data-id="${t.id}"><span>${subsDone}/${subsTotal} subs · ${subPct}%</span><span class="chev">▾</span></div>`) : ''}
  <div class="acts">${runningThis ? `<button data-a="stopTimer" style="background:var(--bu)">⏸</button>` : `<button data-a="startTimer" data-id="${t.id}" ${S.timer?'disabled':''}>▶</button>`}<button data-a="log" data-id="${t.id}" data-m="25">+25m</button><button data-a="setnext" data-id="${t.id}">${t.next?'⭐':'☆'}</button><button data-a="moveUp" data-id="${t.id}" title="Subir">↑</button><button data-a="moveDown" data-id="${t.id}" title="Descer">↓</button><button data-a="focusMode" data-id="${t.id}">⛶</button><select class="postpone-sel" data-a="postpone" data-id="${t.id}"><option value="">→ adiar</option><option value="1">amanhã</option><option value="7">+7d</option><option value="queue">fila</option></select><button data-a="del" data-id="${t.id}">✕</button></div>
  <details data-eid="${t.id}" ${openEdits.has(t.id)?'open':''}><summary>Editar</summary><div class="form"><label class="full">Título${inp(k('t'), t.t)}</label><label class="full">Descrição<textarea data-p="${esc(k('desc'))}" rows="2">${esc(t.desc||'')}</textarea></label><label>Prioridade<select data-p="${esc(k('pr'))}">${selOptions(PR.map((x,i)=>[i,x]), t.pr)}</select></label><label>Tipo<select data-p="${esc(k('type'))}">${selOptions([['','—'],...TASK_TYPES.map(x=>[x.id,x.n])], t.type)}</select></label><label>Área<select data-p="${esc(k('area'))}">${selOptions(taskAreaOptions(t), t.area)}</select></label><label>Projeto<select data-p="${esc(k('proj'))}">${selOptions([['','—'],...alive(S.projects).map(p=>[p.id,p.n])], t.proj)}</select></label><label>Estimativa<input type="number" data-p="${esc(k('est'))}" value="${t.est||0}"></label><label>Hora (compromisso)<input type="time" data-p="${esc(k('time'))}" value="${esc(t.time||'')}"></label><label>Seção<select data-p="${esc(k('section'))}">${selOptions([['','Auto'],['work','Trabalho'],['commitment','Compromisso'],['personal','Pessoal']], t.section||'')}</select></label><label>Dia<select data-p="${esc(k('day'))}">${selOptions([['','Fila'],...DAYS.map((d,i)=>[i,d])], t.day??'')}</select></label><label>Prazo<input type="date" data-p="${esc(k('due'))}" value="${esc(t.due||'')}"></label><label class="full">Habilidades<div class="skills-box">${alive(S.skills).filter(s=>!s.archived).map(s => `<label><input type="checkbox" data-skill-task="${t.id}" data-skill-id="${s.id}" ${(t.skills||[]).includes(s.id)?'checked':''}><span style="color:${s.color}">${esc(s.n)}</span></label>`).join('')}</div></label><label class="full">Labels<div class="skills-box">${S.labels.map(l => `<label><input type="checkbox" data-label-task="${t.id}" data-label-id="${l.id}" ${(t.labels||[]).includes(l.id)?'checked':''}><span style="color:${l.color}">${esc(l.n)}</span></label>`).join('')}</div></label><label class="full">Cor<div class="color-picker-row"><div class="color-dot ${!t.color?'selected':''}" style="background:transparent;border:1px dashed var(--bd)" data-a="setTaskColor" data-id="${t.id}" data-color="">⊘</div>${COLOR_PALETTE.map(p => `<div class="color-dot ${t.color===p.c?'selected':''}" style="background:${p.c}" title="${p.n}" data-a="setTaskColor" data-id="${t.id}" data-color="${p.c}"></div>`).join('')}</div></label><label class="full">Nova subtarefa<input data-a="sadd" data-id="${t.id}" placeholder="Enter"></label></div>
  <div class="acts" style="margin-top:10px"><button data-a="log" data-id="${t.id}" data-m="10">+10m</button><button data-a="log" data-id="${t.id}" data-m="50">+50m</button></div>
  <div class="acts" style="margin-top:4px">${DAYS.map((d,i) => `<button data-a="cp" data-id="${t.id}" data-i="${i}">${d}</button>`).join('')}<button data-a="cp" data-id="${t.id}" data-i="q">Fila</button></div></details></div>`;
}
function taskAreaOptions(t) {
  const active = getAreas();
  const activeIds = active.map(a => a.id);
  const opts = active.map(a => [a.id, a.n]);
  if (t.area && !activeIds.includes(t.area)) {
    const all = (S.areas||[]).find(a => a.id === t.area);
    opts.push([t.area, (all?.n || t.area) + ' (arquivada)']);
  }
  return opts;
}
function renderSubs(t) {
  const runningSub = S.timer && S.timer.taskId === t.id ? S.timer.subId : null;
  const subsDone = (t.subs||[]).filter(s => s.d).length;
  const subsTotal = (t.subs||[]).length;
  const subPct = subsTotal ? Math.round(subsDone / subsTotal * 100) : 0;
  return `<div class="subs">
    <div class="subs-badge" data-a="collapseSubs" data-id="${t.id}" style="margin-bottom:4px">
      <span>Fases (${subsDone}/${subsTotal} · ${subPct}%)</span>
      <span class="chev">▴</span>
    </div>
    ${(t.subs||[]).sort((a,b)=>(a.order||0)-(b.order||0)).map((s,i) => {
      const mins = subMinutes(t, s.id); const isRunning = runningSub === s.id;
      return `<div class="sub ${isRunning?'run':''}"><button class="chk s" data-a="stog" data-id="${t.id}" data-i="${i}">${s.d?'✓':''}</button><span class="sub-txt ${s.d?'x':''}" contenteditable="true" data-subedit="${t.id}:${s.id}">${isRunning?'▶ ':''}${esc(s.t)}</span><span class="sub-time">${mins?fmtMin(mins):''}</span>${isRunning ? `<button class="btn-sm run" data-a="stopTimer">⏸</button>` : `<button class="btn-sm" data-a="startSubTimer" data-id="${t.id}" data-sub="${s.id}" ${S.timer?'disabled':''}>▶</button>`}<button class="btn-sm" data-a="subUp" data-id="${t.id}" data-i="${i}">↑</button><button class="btn-sm" data-a="sdel" data-id="${t.id}" data-i="${i}">✕</button></div>`;
    }).join('')}</div>`;
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
  const skillObjs = (t.skills || []).map(id => S.skills.find(s => s.id === id)).filter(Boolean);
  const borderColor = t.color || (skillObjs[0]?.color) || areaColor(t.area);
  const subsTotal = (t.subs||[]).length;
  const subsDone = (t.subs||[]).filter(s => s.d).length;

  let html = `<div class="card ${isExpanded?'':'compact'} queue-card ${isSelected?'selected':''}" style="--c:${borderColor}">
    <div class="row" style="align-items:center;cursor:pointer" data-a="toggleQueueCard" data-id="${t.id}">
      <div class="ti" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <i class="dot" style="background:${PRC[t.pr]}"></i>
        <span class="tt" style="font-size:14px;font-weight:500">${esc(t.t)}</span>
        ${t.time ? `<span class="tag" style="color:var(--wr)">⏰ ${esc(t.time)}</span>` : ''}
        ${t.est ? `<span class="tag">⏱ ${fmtMin(t.est)}</span>` : ''}
        ${subsTotal ? `<span class="tag">${subsDone}/${subsTotal} sub</span>` : ''}
      </div>
      <span class="chev" style="flex:none;margin-left:auto">${isExpanded ? '▴' : '▾'}</span>
    </div>`;

  if (isExpanded) {
    html += `<div style="margin-top:12px;border-top:1px solid var(--bd);padding-top:12px">
      <textarea data-p="${esc(k('desc'))}" placeholder="Descrição e notas da tarefa..." rows="2" style="margin-bottom:8px">${esc(t.desc||'')}</textarea>
      ${subsTotal ? renderSubs(t) : ''}
      <input data-a="sadd" data-id="${t.id}" placeholder="Nova subtarefa (Enter)" style="margin-top:6px">
      
      <div class="acts" style="margin-top:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--mu);margin-right:2px">Agendar para:</span>
        ${DAYS.map((d,i) => `<button data-a="moveToDay" data-id="${t.id}" data-i="${i}">${d}</button>`).join('')}
        <button data-a="del" data-id="${t.id}" style="margin-left:auto;background:transparent;border:1px solid var(--bd)">✕ Excluir</button>
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
          <label class="full">Habilidades<div class="skills-box">${alive(S.skills).filter(s=>!s.archived).map(s => `<label><input type="checkbox" data-skill-task="${t.id}" data-skill-id="${s.id}" ${(t.skills||[]).includes(s.id)?'checked':''}><span style="color:${s.color}">${esc(s.n)}</span></label>`).join('')}</div></label>
          <label class="full">Labels<div class="skills-box">${S.labels.map(l => `<label><input type="checkbox" data-label-task="${t.id}" data-label-id="${l.id}" ${(t.labels||[]).includes(l.id)?'checked':''}><span style="color:${l.color}">${esc(l.n)}</span></label>`).join('')}</div></label>
        </div>
      </details>
    </div>`;
  }
  html += `</div>`;
  return html;
}

/* ===== VIEW: VAGAS ===== */
function viewJobs() {
  let filtered = alive(S.applications);
  if (jobFilter.stage === 'active') filtered = filtered.filter(a => !isJobTerminal(a));
  else if (jobFilter.stage !== 'all') filtered = filtered.filter(a => a.stage === jobFilter.stage);
  if (jobFilter.area) filtered = filtered.filter(a => a.area === jobFilter.area);
  if (jobFilter.text) {const q = jobFilter.text.toLowerCase(); filtered = filtered.filter(a => (a.client||'').toLowerCase().includes(q) || (a.role||'').toLowerCase().includes(q));}
  const items = filtered.map(a => ({a, score: jobScore(a)})).sort((x,y) => {const xa = isJobTerminal(x.a), ya = isJobTerminal(y.a); if (xa !== ya) return xa ? 1 : -1; return y.score - x.score;});
  const stats = jobStats();
  const overdue = alive(S.applications).filter(a => !isJobTerminal(a) && a.nextFollowUp && a.nextFollowUp < iso(new Date())).length;
  return `<datalist id="jobPlatforms">${JOB_PLATFORMS.map(p => `<option value="${esc(p)}">`).join('')}</datalist><datalist id="jobSubareas">${JOB_SUBAREAS.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="job-kpis"><div class="kpi"><div class="kpi-label">Ativas</div><div class="kpi-value">${stats.active.length}</div><div class="kpi-sub">${overdue?`<span class="late">${overdue} atrasada${overdue>1?'s':''}</span>`:'em dia'}</div></div><div class="kpi"><div class="kpi-label">Taxa resp.</div><div class="kpi-value">${stats.applied.length?Math.round(stats.responseRate*100)+'%':'—'}</div><div class="kpi-sub">${stats.responded.length}/${stats.applied.length}</div></div><div class="kpi"><div class="kpi-label">Pipeline</div><div class="kpi-value" style="font-size:16px">${fmtBRL(stats.pipelineValue)}</div><div class="kpi-sub">ponderado</div></div><div class="kpi"><div class="kpi-label">1ª resp.</div><div class="kpi-value">${stats.medianTime?stats.medianTime.toFixed(0)+'d':'—'}</div><div class="kpi-sub">mediana</div></div></div>
    <div class="add"><input id="qaJob" placeholder="Cliente - Vaga ~2500 !a @linkedin #ilustracao"><button data-a="qaJob">+</button></div>
    <details><summary>+ detalhes</summary><div class="form"><label>Cliente<input id="jClient"></label><label>Vaga<input id="jRole"></label><label class="full">Link<input id="jUrl"></label><label>Plataforma<input id="jPlatform" list="jobPlatforms"></label><label>Área<select id="jArea"><option value="">—</option>${alive(S.skills).filter(s=>!s.archived).map(s=>`<option>${esc(s.n)}</option>`).join('')}</select></label><label>Subárea<input id="jSubarea" list="jobSubareas"></label><label>Ticket<input id="jTicket" type="number"></label><label>Prioridade<select id="jPriority">${PR.map((x,i)=>`<option value="${i}" ${i===1?'selected':''}>${x}</option>`).join('')}</select></label><label>Contato<input id="jContact"></label><label>Email/handle<input id="jContactInfo"></label><label class="full">Notas<textarea id="jNotes" rows="2"></textarea></label></div><button data-a="jobAddFull" style="margin-top:8px">Adicionar</button></details>
    <div class="filter-bar"><input id="jobSearch" placeholder="🔍 Buscar…" value="${esc(jobFilter.text)}"><select id="jobFilterStage"><option value="active" ${jobFilter.stage==='active'?'selected':''}>Ativas</option><option value="all" ${jobFilter.stage==='all'?'selected':''}>Todas</option>${JOB_STAGES.map(s => `<option value="${s.id}" ${jobFilter.stage===s.id?'selected':''}>${s.n}</option>`).join('')}</select><select id="jobFilterArea"><option value="">Área</option>${alive(S.skills).filter(s=>!s.archived).map(s => `<option value="${esc(s.n)}" ${jobFilter.area===s.n?'selected':''}>${esc(s.n)}</option>`).join('')}</select></div>
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
  const prospectCta = app.stage === 'prospect' ? `<div class="prospect-cta"><span style="font-size:12px;color:var(--mu)">Ainda não apliquei.</span><button data-a="jobApply" data-id="${app.id}">✓ Apliquei</button></div>` : '';
  const projectBadge = proj ? `<span class="tag" style="color:var(--ok);cursor:pointer" data-a="gotoProject" data-id="${proj.id}">→ ${esc(proj.n)}</span>` : '';
  const canConvert = !terminal && (app.stage === 'offer' || app.stage === 'accepted') && !app.projectId;
  return `<div class="job-card ${terminal?'terminal':''}" style="--c:${stage.color}"><div class="big" style="margin:0 0 4px"><div class="job-title"><span class="job-client">${esc(app.client)}</span>${app.role && app.role!==app.client ? ' — ' + esc(app.role) : ''}</div><span class="stage-badge" style="--c:${stage.color}">${stage.n}</span></div><div class="meta"><i class="dot" style="background:${PRC[app.priority]}"></i>${PR[app.priority]}${app.platform?`<span class="tag">${esc(app.platform)}</span>`:''}${app.area?`<span class="tag" style="color:${alive(S.skills).find(s=>s.n===app.area)?.color||'var(--mu)'}">${esc(app.area)}</span>`:''}${app.subarea?`<span class="tag">${esc(app.subarea)}</span>`:''}${app.ticket?`<span class="tag">${fmtBRL(app.ticket)}</span>`:''}${!terminal && days>0?`<span class="tag">${days}d na fase</span>`:''}${timeInvested?`<span class="tag">⏱ ${fmtMin(timeInvested)}</span>`:''}${app.url?`<a class="tag" href="${esc(app.url)}" target="_blank" rel="noopener noreferrer">vaga ↗</a>`:''}${!terminal?`<span class="score-badge ${scoreClass(score)}">${score}</span>`:''}${projectBadge}</div>${app.contactName||app.contactInfo ? `<div class="meta">${app.contactName?`<span class="tag">👤 ${esc(app.contactName)}</span>`:''}${app.contactInfo?`<span class="tag">${esc(app.contactInfo)}</span>`:''}</div>` : ''}${fuBadge ? `<div class="job-followup-row">${fuBadge}</div>` : ''}${app.notes ? `<div class="tdesc">${esc(app.notes)}</div>` : ''}${prospectCta}<div class="acts">${!terminal?`<select class="postpone-sel" data-a="jobStage" data-id="${app.id}"><option value="">→ estágio</option>${JOB_STAGES.filter(s => s.id !== app.stage).map(s => `<option value="${s.id}">${s.n}</option>`).join('')}</select>`:''}${!terminal && app.nextFollowUp?`<button data-a="jobFollowUp" data-id="${app.id}">Falei hoje</button>`:''}${!terminal && !app.linkedTaskId?`<button data-a="jobCreateTask" data-id="${app.id}">+ Tarefa</button>`:''}${canConvert?`<button data-a="jobConvert" data-id="${app.id}" style="background:var(--ok);color:#000">→ Virou projeto</button>`:''}<button data-a="jobDel" data-id="${app.id}">✕</button></div><details data-eid="${app.id}" ${openEdits.has(app.id)?'open':''}><summary>Editar</summary><div class="form"><label>Cliente<input data-p="${esc(k('client'))}" value="${esc(app.client)}"></label><label>Vaga<input data-p="${esc(k('role'))}" value="${esc(app.role)}"></label><label class="full">Link<input data-p="${esc(k('url'))}" value="${esc(app.url||'')}"></label><label>Contato<input data-p="${esc(k('contactName'))}" value="${esc(app.contactName||'')}"></label><label>Email<input data-p="${esc(k('contactInfo'))}" value="${esc(app.contactInfo||'')}"></label><label>Plataforma<input data-p="${esc(k('platform'))}" list="jobPlatforms" value="${esc(app.platform||'')}"></label><label>Área<select data-p="${esc(k('area'))}"><option value="">—</option>${alive(S.skills).filter(s=>!s.archived).map(s => `<option value="${esc(s.n)}" ${app.area===s.n?'selected':''}>${esc(s.n)}</option>`).join('')}</select></label><label>Subárea<input data-p="${esc(k('subarea'))}" list="jobSubareas" value="${esc(app.subarea||'')}"></label><label>Ticket<input type="number" data-p="${esc(k('ticket'))}" value="${app.ticket||0}"></label><label>Prioridade<select data-p="${esc(k('priority'))}">${selOptions(PR.map((x,i)=>[i,x]), app.priority)}</select></label><label>Follow-up<input type="date" data-p="${esc(k('nextFollowUp'))}" value="${esc(app.nextFollowUp||'')}"></label><label class="full">Notas<textarea data-p="${esc(k('notes'))}" rows="2">${esc(app.notes||'')}</textarea></label></div></details></div>`;
}

/* ===== VIEW: PROJETOS ===== */
function viewProjects() {
  const active = alive(S.projects).filter(p => !p.archived);
  const archived = alive(S.projects).filter(p => p.archived);
  const clients = alive(S.clients);
  return `<div class="card"><div class="form"><label>Nome<input id="pn"></label><label>Área<select id="pa">${getAreas().map(a=>`<option value="${esc(a.id)}">${esc(a.n)}</option>`).join('')}</select></label><label>Cliente<select id="pclient"><option value="">—</option>${clients.map(c => `<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label><label>Prazo<input id="pdu" type="date"></label><label>Recompensa<input id="prw"></label></div><button data-a="padd" style="margin-top:8px">Criar projeto</button></div>
    ${active.map(projectCard).join('')}
    ${archived.length ? `<details><summary>Arquivados (${archived.length})</summary>${archived.map(projectCard).join('')}</details>` : ''}`;
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
    <div class="big"><input data-p="${esc(k('n'))}" value="${esc(p.n)}" style="font-weight:600"><button data-a="pdel" data-id="${p.id}">✕</button></div>
    ${bar(pctTasks, `${done}/${total} tarefas`, `Tempo: ${fmtMin(mins)}${estTotal?' · '+fmtMin(estDone)+'/'+fmtMin(estTotal):''}`)}
    ${isComplete ? `<div class="msg" style="color:var(--ok)">✓ Concluído em ${fmtDate(iso(new Date(p.completedAt)))}${earnings.total>0?` · ${fmtMoney(earnings.total, cur)}`:''}${earnings.ratePerHour>0?` · ${fmtMoney(earnings.ratePerHour, cur)}/h`:''}</div>` : ''}
    ${estTotal ? `<div class="proj-progress"><div class="pp-row"><span class="pp-label">Tarefas</span><div class="pp-bar"><div style="width:${pctTasks}%;background:${color}"></div></div><span class="pp-val">${pctTasks}%</span></div><div class="pp-row"><span class="pp-label">Tempo</span><div class="pp-bar"><div style="width:${pctTime}%;background:${color}88"></div></div><span class="pp-val">${pctTime}%</span></div></div>` : ''}
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
      ${p.reward && pctTasks===100 ? (p.claimed ? `<span class="badge">✓ ${esc(p.reward)}</span>` : `<button data-a="claim" data-id="${p.id}" style="background:var(--ac);color:#000">Resgatar</button>`) : (p.reward ? `<span class="badge">🔒 ${esc(p.reward)}</span>` : '')}
      ${!isComplete && pctTasks === 100 && total > 0 ? `<button data-a="pcomplete" data-id="${p.id}" style="background:var(--ok);color:#000">✓ Marcar concluído</button>` : ''}
      ${isComplete ? `<button data-a="puncomplete" data-id="${p.id}">Reabrir</button>` : ''}
      <button data-a="parch" data-id="${p.id}">${p.archived?'Restaurar':'Arquivar'}</button>
    </div>
  </div>`;
}

/* ===== VIEW: CLIENTES ===== */
function viewClients() {
  const clients = alive(S.clients);
  return `<div class="add" style="gap:6px"><input id="clientN" placeholder="Nome do cliente"><button data-a="clientAdd">+</button></div>
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
        <div class="big"><input data-p="clients:${c.id}:n" value="${esc(c.n)}" style="font-weight:600"><span class="badge">${projs.length} proj · ${completed.length} concluído${completed.length!==1?'s':''}</span><button data-a="clientDel" data-id="${c.id}">✕</button></div>
        <div class="meta"><span class="tag" style="color:var(--ok)">${fmtBRL(brlTotal)} total</span>${avgRate>0?`<span class="rate-badge">${fmtBRL(avgRate)}/h</span>`:''}<span class="tag">${totalHours.toFixed(1)}h</span>${contactLinks.length?`<span class="tag">${contactLinks.length} contato${contactLinks.length>1?'s':''}</span>`:''}</div>
        ${projs.length ? `<details><summary>Projetos (${projs.length})</summary>${projs.map(p => {const e = projectEarnings(p); return `<div class="proj-row-line"><span>${p.completedAt?'✓':(p.archived?'arquivado':'em andamento')} ${esc(p.n)}</span><span style="color:var(--mu);font-variant-numeric:tabular-nums">${e.total>0?fmtMoney(e.total, e.currency):''}</span></div>`;}).join('')}</details>` : ''}
        <div class="form" style="margin-top:6px"><label class="full">Notas<textarea data-p="clients:${c.id}:notes" rows="2">${esc(c.notes||'')}</textarea></label></div>
      </div>`;
    }).join('') : '<div class="msg">Nenhum cliente registrado ainda. Adicione acima.</div>'}`;
}

/* ===== VIEW: RENDIMENTO ===== */
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
  const sym = CURRENCIES[primary].sym;

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
      return `<div class="card"><div class="big"><span style="font-weight:600">${['🥇','🥈','🥉'][i]||''} ${esc(c.name)}</span><span class="badge" style="color:var(--ok)">${fmtMoney(c.totalPrimary, primary)}</span></div><div class="meta"><span class="tag">${c.projects.length} projeto${c.projects.length!==1?'s':''}</span><span class="tag">${c.hours.toFixed(1)}h</span>${avg>0?`<span class="rate-badge">${fmtMoney(avg, primary)}/h</span>`:''}</div></div>`;
    }).join('')}
    <h3>Por cliente</h3>
    ${topClients.length ? topClients.map(c => `<div class="card"><div class="big"><span style="font-weight:600">${esc(c.name)}</span><span class="badge" style="color:var(--ok)">${fmtMoney(c.totalPrimary, primary)}</span></div>${c.projects.map(({p, e}) => `<div class="proj-row-line"><div style="flex:1;min-width:0"><div style="font-size:12.5px">${esc(p.n)}</div><div style="font-size:10.5px;color:var(--mu)">${e.hours.toFixed(2)}h${e.ratePerHour>0?' · '+fmtMoney(e.ratePerHour, e.currency)+'/h':''}</div></div><span style="color:var(--tx);font-weight:600;font-variant-numeric:tabular-nums">${e.total>0?fmtMoney(e.total, e.currency):'—'}</span></div>`).join('')}</div>`).join('') : '<div class="msg">Sem projetos concluídos no período. Marque projetos como concluídos em Projetos.</div>'}`;
}

/* ===== VIEW: HISTÓRICO ===== */
function viewHistory() {
  const done = S.tasks.filter(t => t.done && t.doneAt).sort((a,b) => b.doneAt - a.doneAt);
  const now = Date.now();
  const cutoff = historyFilter === '7d' ? now - 7*86400000 : historyFilter === '30d' ? now - 30*86400000 : 0;
  const filtered = done.filter(t => t.doneAt >= cutoff);
  const byDay = {};
  filtered.forEach(t => {const d = iso(new Date(t.doneAt)); if (!byDay[d]) byDay[d] = []; byDay[d].push(t);});
  const days = Object.keys(byDay).sort((a,b) => b.localeCompare(a));
  const totalMin = filtered.reduce((a,t) => a + taskMinutes(t), 0);
  const totalXp = filtered.filter(t => t.xpClaimed && !isPersonalSection(t)).reduce((a,t) => a + taskBaseXp(t), 0);
  return `<div class="filter-bar" style="flex-wrap:wrap"><button data-a="histFilter" data-v="7d" class="${historyFilter==='7d'?'on':''}">7 dias</button><button data-a="histFilter" data-v="30d" class="${historyFilter==='30d'?'on':''}">30 dias</button><button data-a="histFilter" data-v="all" class="${historyFilter==='all'?'on':''}">Tudo</button></div>
    <div class="stats"><span>${filtered.length} tarefa${filtered.length!==1?'s':''}</span><span>Tempo: <b>${fmtMin(totalMin)}</b></span><span>XP: <b>${totalXp}</b></span></div>
    ${days.length ? days.map(d => `<div class="history-day"><div class="history-day-header"><b>${d.split('-').reverse().join('/')}</b><span class="msg" style="margin:0">${byDay[d].length} tarefa${byDay[d].length!==1?'s':''}</span></div>${byDay[d].map(t => {
      const subs = t.subs || [];
      const subBreakdown = subs.length ? `<details style="margin-top:4px"><summary style="font-size:11px">Fases (${subs.length})</summary>${subs.map(s => {const m = subMinutes(t, s.id); return `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11.5px;color:var(--mu)"><span>${s.d?'✓':'·'} ${esc(s.t)}</span><span style="color:var(--tx);font-variant-numeric:tabular-nums">${m?fmtMin(m):'—'}</span></div>`;}).join('')}</details>` : '';
      const xpAwarded = t.xpClaimed && !isPersonalSection(t) ? taskBaseXp(t) : 0;
      return `<div class="history-row"><div class="history-content"><div class="history-title">${esc(t.t)}</div><div class="history-meta"><span class="tag">${esc(areaLabel(t.area))}</span>${taskMinutes(t)>0?`<span class="tag">⏱ ${fmtMin(taskMinutes(t))}</span>`:''}${xpAwarded?`<span class="tag" style="color:var(--ac)">+${xpAwarded} XP</span>`:''}${isPersonalSection(t)?`<span class="tag" style="opacity:.6">sem XP</span>`:''}</div>${subBreakdown}</div><div class="history-actions"><button data-a="histReopen" data-id="${t.id}" title="Reabrir">↩</button><button data-a="histCopy" data-id="${t.id}" title="Copiar para hoje">⧉</button><button data-a="histDel" data-id="${t.id}" title="Excluir">✕</button></div></div>`;
    }).join('')}</div>`).join('') : '<div class="msg">Nenhuma tarefa concluída no período.</div>'}`;
}

/* ===== VIEW: PRAZOS ===== */
function events() {
  const e = [];
  S.tasks.forEach(t => {if (t.due && !t.done) e.push({d:t.due, t:'Tarefa: '+t.t});});
  alive(S.projects).forEach(p => {if (p.due && !p.archived) e.push({d:p.due, t:'Projeto: '+p.n});});
  alive(S.goals).forEach(g => {if (g.due) e.push({d:g.due, t:'Meta: '+g.t});});
  alive(S.contacts).forEach(c => {if (c.nextContact && !c.archived) e.push({d:c.nextContact, t:'Contato: '+c.n}); if (c.birthday) {const parts = c.birthday.split('-'); if (parts.length >= 2) {const mm = parts[parts.length-2], dd = parts[parts.length-1]; const y = new Date().getFullYear(); e.push({d: `${y}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`, t:'🎂 '+c.n}); e.push({d: `${y+1}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`, t:'🎂 '+c.n});}}});
  alive(S.applications).forEach(a => {if (a.nextFollowUp && !isJobTerminal(a)) e.push({d:a.nextFollowUp, t:'Vaga: '+(a.role||a.client)});});
  return e.sort((a,b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
}
function viewCalendar() {
  const y = cal.getFullYear(), m = cal.getMonth(); const first = (new Date(y, m, 1).getDay() + 6) % 7; const nDays = new Date(y, m+1, 0).getDate();
  const ev = events(), td = iso(new Date()); let cells = '';
  for (let i=0; i<first; i++) cells += '<div></div>';
  for (let d=1; d<=nDays; d++) {const key = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0'); const evs = ev.filter(e => e.d === key); cells += `<div class="cd ${key===td?'tdy':''}">${d}${evs.length?`<i title="${esc(evs.map(e=>e.t).join(' | '))}">${evs.length}</i>`:''}</div>`;}
  const upcoming = ev.filter(e => e.d >= td).slice(0, 30);
  return `<div class="big"><button data-a="cm" data-i="-1">◀</button><b style="text-transform:capitalize">${cal.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button data-a="cm" data-i="1">▶</button></div><div class="grid-cal">${DAYS.map(d => `<div class="h">${d}</div>`).join('')}${cells}</div><h3>Próximos</h3>${upcoming.length ? upcoming.map(e => {const n = daysBetween(td, e.d); return `<div class="card"><div class="big" style="margin:0"><span>${esc(e.t)}</span><span class="badge ${n<0?'late':n<=3?'soon':''}">${n<0?'atrasado '+(-n)+'d':n===0?'hoje':'em '+n+'d'} · ${fmtDate(e.d)}</span></div></div>`;}).join('') : '<div class="msg">Sem prazos.</div>'}`;
}

/* ===== VIEW: METAS ===== */
function viewGoals() {const goals = alive(S.goals); return `<div class="add"><input id="gn" placeholder="Nova meta"><input id="gd" type="date" style="max-width:150px"><button data-a="gadd">+</button></div>${goals.map(g => `<div class="card" style="--c:var(--ac)"><div class="big"><input data-p="goals:${g.id}:t" value="${esc(g.t)}"><button data-a="gdel" data-id="${g.id}">✕</button></div>${bar(g.p, g.p+'%', '')}<input type="range" min="0" max="100" step="5" value="${g.p}" data-p="goals:${g.id}:p"><div class="form"><label>Prazo<input type="date" data-p="goals:${g.id}:due" value="${esc(g.due||'')}"></label></div></div>`).join('')}`;}

/* ===== VIEW: HABILIDADES ===== */
function viewSkills() {
  const periods = [['all','Tudo'],['30','30d'],['7','7d']]; const days = skillsFilter === 'all' ? null : +skillsFilter;
  const active = alive(S.skills).filter(s => !s.archived).sort((a,b) => (a.order||0)-(b.order||0));
  const periodPills = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${periods.map(([v,l]) => `<button class="${skillsFilter===v?'on':''}" data-a="skillPeriod" data-v="${v}" style="padding:4px 10px;font-size:12px;background:${skillsFilter===v?'var(--ac)':'var(--s1)'};color:${skillsFilter===v?'#000':'var(--mu)'};border:1px solid var(--bd);border-radius:20px">${l}</button>`).join('')}</div>`;
  return `${periodPills}<h3>Habilidades</h3>${active.map(s => {const xp = Math.round(num(s.xp)); const info = levelInfo(xp); const mins = skillMinutes(s.id, days); const tasks = skillTaskCount(s.id); const streak = skillStreak(s.id); return `<div style="background:var(--s1);border:1px solid var(--bd);border-left:3px solid ${s.color};border-radius:12px;padding:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><div><div style="font-weight:600;color:${s.color}">${esc(s.n)}</div><div style="font-size:12px;color:var(--mu)">Nível ${info.lv} · ${tasks} tarefa${tasks!==1?'s':''} ${streak>=2?`<span class="streak-badge">🔥 ${streak}d</span>`:''}</div></div><div style="text-align:right;font-size:12px;color:var(--mu)"><b style="color:var(--tx);font-size:15px">${xp}</b> XP<div style="font-size:10px">faltam ${info.toNext}</div></div></div><div style="height:6px;background:var(--s2);border-radius:3px;overflow:hidden;margin:8px 0 6px"><div style="width:${info.progress*100}%;background:${s.color};height:100%"></div></div><div style="font-size:11.5px;color:var(--mu)">Tempo: <b style="color:var(--tx)">${fmtMin(mins)}</b></div><details data-eid="${s.id}" ${openEdits.has(s.id)?'open':''}><summary>Configurar</summary><div class="form"><label>Nome<input data-p="skills:${s.id}:n" value="${esc(s.n)}"></label><label>Cor<input type="color" data-p="skills:${s.id}:color" value="${esc(s.color)}" style="height:34px;padding:2px"></label></div><div class="acts" style="margin-top:6px"><button data-a="skillArch" data-id="${s.id}">Arquivar</button></div></details></div>`;}).join('')}<details style="margin-top:16px"><summary>+ Nova habilidade</summary><div class="add"><input id="skillN"><input type="color" id="skillC" value="#6f8de0" style="max-width:60px;padding:2px;height:36px"><button data-a="skillAdd">+</button></div></details>`;
}

/* ===== VIEW: STATS ===== */
function calibrationStats() {const candidates = S.tasks.filter(t => t.done && t.est > 0 && taskMinutes(t) > 0 && t.doneAt && !isPersonalSection(t)).sort((a,b) => b.doneAt - a.doneAt); const sample = candidates.slice(0, 12); if (sample.length < 5) return {insufficient: true, count: sample.length, need: 5}; const ratios = sample.map(t => taskMinutes(t) / t.est).sort((a,b) => a-b); const median = ratios[Math.floor(ratios.length/2)]; const pct = Math.round((median - 1) * 100); return {insufficient: false, count: sample.length, median, pct};}
function heatmapData() {const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - 12 * 7 - ((start.getDay() + 6) % 7)); const days = []; for (let i = 0; i < 91; i++) {const d = new Date(start); d.setDate(d.getDate() + i); const dStr = iso(d); const mins = S.tasks.flatMap(t => (t.logs||[]).filter(l => l.end && iso(new Date(l.end)) === dStr)).reduce((a,l) => a + (+l.minutes || 0), 0); const tasksDone = S.tasks.filter(t => t.done && t.doneAt && iso(new Date(t.doneAt)) === dStr).length; days.push({d, dStr, mins, tasksDone, isFuture: d > today, isToday: dStr === iso(today)});} return days;}
function renderHeatmap() {const days = heatmapData(); const activeDays = days.filter(d => d.mins > 0).length; return `<div class="heatmap-wrap"><div class="heatmap">${days.map(d => {let lvl = 0; if (d.mins > 0) lvl = 1; if (d.mins >= 30) lvl = 2; if (d.mins >= 90) lvl = 3; if (d.mins >= 180) lvl = 4; return `<div class="hm-cell lvl-${lvl} ${d.isFuture?'future':''} ${d.isToday?'today':''}" title="${esc(d.isFuture?'':`${d.dStr} · ${d.mins}min · ${d.tasksDone} tarefas`)}"></div>`;}).join('')}</div><div class="hm-legend"><span>${activeDays} ${activeDays===1?'dia ativo':'dias ativos'} nos últimos 90</span><span class="hm-legend-scale">menos<span class="hm-cell lvl-0"></span><span class="hm-cell lvl-1"></span><span class="hm-cell lvl-2"></span><span class="hm-cell lvl-3"></span><span class="hm-cell lvl-4"></span>mais</span></div></div>`;}

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
function viewStats() {
  const now = new Date(); const td = iso(now);
  const weekAgoStr = iso(new Date(now.getTime() - 6*86400000));
  const xp = xpProgression();
  const allLogs = S.tasks.flatMap(t => (t.logs || []).map(l => ({...l, taskId: t.id})));
  const weekLogs = allLogs.filter(l => l.end && iso(new Date(l.end)) >= weekAgoStr);
  const weekMin = weekLogs.reduce((a,l) => a + (+l.minutes||0), 0);
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

  const xpBlock = `<h3 style="margin-top:0">Progressão</h3><div class="xp-hero"><div><div class="xp-level-label">Nível</div><div class="xp-level">${xp.lv}</div></div><div class="xp-bar-wrap"><div style="font-size:12px;color:var(--mu);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span><b style="color:var(--tx)">${Math.round(xp.inLevel)}</b> / ${xp.forLevel} XP neste nível</span><span>faltam <b style="color:var(--ac)">${xp.toNext}</b></span></div><div class="xp-bar"><div style="width:${(xp.progress*100)}%"></div></div><div class="xp-meta">Total: <b>${Math.round(xp.gxp)}</b> XP · Semana: <b>+${xp.weekXp}</b> · Mês: <b>+${xp.monthXp}</b></div></div></div><h4>Top habilidades por XP</h4>${xp.topSkills.length ? xp.topSkills.map(s => {const skXp = Math.round(num(s.xp)); const info = levelInfo(skXp); return `<div class="skill-xp-row"><div class="sxr-label" style="color:${s.color}">${esc(s.n)}</div><div class="sxr-bar"><div style="width:${(skXp/xp.maxSkillXp*100)}%;background:${s.color}"></div></div><div class="sxr-val"><b>N${info.lv}</b> · ${skXp} XP</div></div>`;}).join('') : '<div class="msg">Sem habilidades ainda.</div>'}`;

  const overviewBlock = `<h3>Visão geral</h3><div class="kpi-grid"><div class="kpi"><div class="kpi-label">Horas (7d)</div><div class="kpi-value">${fmtMin(weekMin)}</div><div class="kpi-sub">${weekLogs.length} sessões</div></div><div class="kpi"><div class="kpi-label">Tarefas (7d)</div><div class="kpi-value">${weekTasksDone}</div><div class="kpi-sub">concluídas</div></div><div class="kpi"><div class="kpi-label">Dias seguidos</div><div class="kpi-value">${streak}</div><div class="kpi-sub">com atividade</div></div><div class="kpi"><div class="kpi-label">Conclusão</div><div class="kpi-value">${completionRate}%</div><div class="kpi-sub">${doneTasks}/${totalTasks}</div></div><div class="kpi"><div class="kpi-label">Tempo médio</div><div class="kpi-value">${avgTaskMin?fmtMin(avgTaskMin):'—'}</div><div class="kpi-sub">por tarefa</div></div><div class="kpi"><div class="kpi-label">Rendimento total</div><div class="kpi-value" style="font-size:16px">${fmtMoney(earnedPrimary, primary)}</div><div class="kpi-sub">projetos concluídos</div></div></div><h3>Consistência</h3>${renderHeatmap()}<h3>Últimos 7 dias</h3><div class="bar-chart">${weekDays.map(x => `<div class="bar-col ${x.isToday?'today':''}"><div class="bar-val">${x.mins?fmtMin(x.mins):''}</div><div class="bar-fill" style="height:${(x.mins/maxWeekMin*100)}%"></div><div class="bar-label">${x.label}</div></div>`).join('')}</div>`;

  const calibBlock = calib.insufficient ? `<div class="card"><div class="calib-headline">Calibração de estimativas</div><div class="msg">Conclua ${calib.need - calib.count} tarefa${calib.need-calib.count>1?'s':''} mais com estimativa para ver a calibração.</div></div>` : `<div class="card calib-block"><div class="calib-headline">Nas últimas ${calib.count} tarefas com estimativa, você gasta <b style="color:${Math.abs(calib.pct)>30?'var(--wr)':'var(--ok)'}">${Math.abs(calib.pct)}% ${calib.pct>=0?'acima':'abaixo'}</b> do previsto.</div><div class="msg">${calib.pct > 30 ? 'Multiplique suas estimativas por ~' + ((100+calib.pct)/100).toFixed(1) + 'x.' : calib.pct < -20 ? 'Você tende a superestimar. Pode ser mais ousado.' : 'Boa calibração.'}</div></div>`;

  const timeInvestBlock = `<h3>Onde você investe o tempo</h3>${(sectionMin.work + sectionMin.personal + sectionMin.commitment) > 0 ? `<h4>Por seção</h4><div class="chart">${SECTION_ORDER.filter(s => sectionMin[s] > 0).map(s => {const m = SECTION_META[s]; return `<div class="chart-row"><div class="ch-label" style="color:${m.color}">${m.icon} ${m.n}</div><div class="ch-bar"><div style="width:${(sectionMin[s]/sectionMax*100)}%;background:${m.color}"></div></div><div class="ch-val">${fmtMin(sectionMin[s])}</div></div>`;}).join('')}</div>` : ''}${Object.keys(typeMin).length ? `<h4>Por tipo de tarefa</h4><div class="chart">${Object.entries(typeMin).sort((a,b) => b[1]-a[1]).map(([id, m]) => {const tp = TASK_TYPES.find(x => x.id === id); return `<div class="chart-row"><div class="ch-label">${tp ? tp.icon + ' ' + esc(tp.n) : '—'}</div><div class="ch-bar"><div style="width:${(m/typeMax*100)}%;background:#c9764a"></div></div><div class="ch-val">${fmtMin(m)}</div></div>`;}).join('')}</div>` : ''}${Object.keys(areaMin).length ? `<h4>Por área</h4><div class="chart">${Object.entries(areaMin).sort((a,b) => b[1]-a[1]).map(([a, m]) => `<div class="chart-row"><div class="ch-label" style="color:${areaColor(a)}">${esc(areaLabel(a))}</div><div class="ch-bar"><div style="width:${(m/areaMax*100)}%;background:${areaColor(a)}"></div></div><div class="ch-val">${fmtMin(m)}</div></div>`).join('')}</div>` : ''}${energyTotal > 0 ? `<h4>Por horário do dia</h4><div class="chart"><div class="chart-row"><div class="ch-label">☀ Manhã (6-12)</div><div class="ch-bar"><div style="width:${(energyDone.high/energyTotal*100)}%;background:#c9764a"></div></div><div class="ch-val">${energyDone.high}</div></div><div class="chart-row"><div class="ch-label">◐ Tarde (12-18)</div><div class="ch-bar"><div style="width:${(energyDone.med/energyTotal*100)}%;background:var(--wr)"></div></div><div class="ch-val">${energyDone.med}</div></div><div class="chart-row"><div class="ch-label">☾ Noite (18-24)</div><div class="ch-bar"><div style="width:${(energyDone.low/energyTotal*100)}%;background:#6a8560"></div></div><div class="ch-val">${energyDone.low}</div></div></div>` : ''}`;

  const projBlock = `<h3>Projetos</h3>${projList.length ? projList.map(({p, pctTasks, pctTime, done, total, mins, color}) => `<div class="card" style="--c:${color}"><div class="big" style="margin-bottom:6px"><span style="font-weight:600">${esc(p.n)}</span><span class="badge">${done}/${total} · ${fmtMin(mins)}</span></div><div class="proj-progress"><div class="pp-row"><span class="pp-label">Tarefas</span><div class="pp-bar"><div style="width:${pctTasks}%;background:${color}"></div></div><span class="pp-val">${pctTasks}%</span></div>${pctTime != null ? `<div class="pp-row"><span class="pp-label">Tempo est.</span><div class="pp-bar"><div style="width:${pctTime}%;background:${color}88"></div></div><span class="pp-val">${pctTime}%</span></div>` : ''}</div></div>`).join('') : '<div class="msg">Sem projetos ativos.</div>'}`;

  const netBlock = (label, ns, isPro) => `<h3>${label}</h3><div class="network-card"><div class="network-kpis"><div class="network-kpi"><div class="nk-label">Contatos</div><div class="nk-value">${ns.total}</div><div class="nk-sub">${ns.active30} ativos (30d)</div></div><div class="network-kpi"><div class="nk-label">Atrasados</div><div class="nk-value ${ns.overdue?'late':''}">${ns.overdue}</div><div class="nk-sub">follow-up</div></div><div class="network-kpi"><div class="nk-label">Aguardando</div><div class="nk-value">${ns.waiting}</div><div class="nk-sub">resposta deles</div></div><div class="network-kpi"><div class="nk-label">${isPro ? 'Taxa resp.' : 'Adiados'}</div><div class="nk-value">${isPro ? (ns.avgRate > 0 ? Math.round(ns.avgRate*100)+'%' : '—') : ns.snoozed}</div><div class="nk-sub">${isPro ? 'média' : 'snoozed'}</div></div></div><h4>Profundidade</h4>${[1,2,3].map(d => {const n = ns.depths[d]; const tot = Math.max(1, ns.total); const lbl = ['', 'Interno', 'Regular', 'Distante'][d]; const clr = ['', 'var(--ac)', 'var(--mu)', '#7a7580'][d]; return `<div class="depth-row"><span class="depth-label">${lbl}</span><div class="depth-bar"><div style="width:${(n/tot*100)}%;background:${clr}"></div></div><span class="depth-val">${n}</span></div>`;}).join('')}<h4>Interações por semana (8 semanas)</h4><div class="week-inter">${ns.weeks.map(w => `<div class="wi-col"><div style="font-size:9px;color:var(--mu)">${w.count||''}</div><div class="wi-bar" style="height:${(w.count/ns.maxWeek*100)}%;min-height:${w.count?3:1}px"></div><div class="wi-label">${w.label}</div></div>`).join('')}</div>${ns.closest.length ? `<h4>Mais próximos</h4>${ns.closest.map(c => {const sc = contactScore(c); return `<div class="contact-mini"><div class="cm-avatar" style="background:color-mix(in srgb,var(--ac) 15%,var(--s2));color:var(--ac)">${initials(c.n)}</div><div class="cm-info"><div class="cm-name">${esc(c.n)}</div><div class="cm-meta">${esc(c.cat)} · ${(c.interactions||[]).length} interações</div></div><span class="cm-score ${scoreClass(sc)}">${sc}</span></div>`;}).join('')}` : ''}${ns.cooling.length ? `<h4 style="color:var(--wr)">Esfriando</h4>${ns.cooling.map(c => {const days = c.lastContact ? daysBetween(c.lastContact, td) : null; return `<div class="contact-mini"><div class="cm-avatar" style="background:#7a758020;color:var(--mu)">${initials(c.n)}</div><div class="cm-info"><div class="cm-name">${esc(c.n)}</div><div class="cm-meta">${days != null ? days + 'd desde o último contato' : 'nunca contatado'}</div></div></div>`;}).join('')}` : ''}${Object.keys(ns.byPlatform).length ? `<h4>Plataformas</h4><div class="chart">${Object.entries(ns.byPlatform).sort((a,b) => b[1]-a[1]).slice(0,5).map(([p, n]) => `<div class="chart-row"><div class="ch-label">${esc(p)}</div><div class="ch-bar"><div style="width:${(n/Math.max(1,...Object.values(ns.byPlatform))*100)}%;background:var(--ac)"></div></div><div class="ch-val">${n}</div></div>`).join('')}</div>` : ''}${!isPro && birthdays.length ? `<h4>Aniversários próximos (14d)</h4>${birthdays.map(b => `<div class="birthday-row"><span class="bd-icon">🎂</span><span class="bd-name">${esc(b.contact.n)}</span><span class="bd-days">${b.days===0?'hoje':'em '+b.days+'d'} · ${fmtDate(b.date)}</span></div>`).join('')}` : ''}</div>`;

  const jobsBlock = alive(S.applications).length ? `<h3>Vagas</h3><h4>Funil</h4><div class="chart">${JOB_STAGES.filter(s => jStats.byStage[s.id] > 0).map(s => `<div class="chart-row"><div class="ch-label" style="color:${s.color}">${s.n}</div><div class="ch-bar"><div style="width:${(jStats.byStage[s.id]/Math.max(1,...Object.values(jStats.byStage))*100)}%;background:${s.color}"></div></div><div class="ch-val">${jStats.byStage[s.id]}</div></div>`).join('')}</div><div class="msg">Pipeline esperado: <b>${fmtBRL(jStats.pipelineValue)}</b> · ${jStats.applied.length} aplicadas · ${jStats.responded.length} responderam${jStats.medianTime ? ' · mediana '+jStats.medianTime.toFixed(0)+'d' : ''}</div>` : `<h3>Vagas</h3><div class="card"><div class="msg">Nenhuma vaga registrada ainda.</div></div>`;

  return xpBlock + overviewBlock + calibBlock + timeInvestBlock + projBlock + netBlock('Rede profissional', proNet, true) + netBlock('Amizades e vínculos', personalNet, false) + jobsBlock + (!totalTasks ? '<div class="msg center">Sem dados ainda.</div>' : '');
}

/* ===== VIEW: REVISÃO ===== */
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
    <div class="review-section ${checks.overdueContacts?'done':''}"><div class="review-head"><div><div class="review-title">2. Contatos atrasados</div><div class="review-sub">${overdueContacts.length} contato${overdueContacts.length!==1?'s':''}</div></div><button data-a="reviewToggle" data-check="overdueContacts" class="${checks.overdueContacts?'on':''}">${checks.overdueContacts?'✓':'marcar'}</button></div>${overdueContacts.length ? `<div class="review-body">${overdueContacts.slice(0, 8).map(c => {const sc = contactScore(c); return `<div class="review-item"><div><div>${esc(c.n)} <span class="contact-score ${scoreClass(sc)}">${sc}</span></div><div class="review-item-meta">${c.cat} · últ: ${c.lastContact?fmtDate(c.lastContact):'nunca'}</div></div><div class="review-actions"><button data-a="contactSend" data-id="${c.id}">Enviei</button><button data-a="contactSnooze" data-id="${c.id}">⏸</button></div></div>`;}).join('')}</div>` : '<div class="review-body"><div class="msg">Nada aqui.</div></div>'}</div>
    <div class="review-section ${checks.overdueJobs?'done':''}"><div class="review-head"><div><div class="review-title">3. Vagas com follow-up atrasado</div><div class="review-sub">${overdueJobs.length} vaga${overdueJobs.length!==1?'s':''}</div></div><button data-a="reviewToggle" data-check="overdueJobs" class="${checks.overdueJobs?'on':''}">${checks.overdueJobs?'✓':'marcar'}</button></div>${overdueJobs.length ? `<div class="review-body">${overdueJobs.slice(0, 8).map(a => `<div class="review-item"><div><div>${esc(a.role||a.client)}</div><div class="review-item-meta">${jobStage(a).n}</div></div><div class="review-actions"><button data-a="reviewJobFollowUp" data-id="${a.id}">✓</button><button data-a="reviewJobSnooze" data-id="${a.id}">+7d</button></div></div>`).join('')}</div>` : '<div class="review-body"><div class="msg">Nada aqui.</div></div>'}</div>
    <div class="review-section ${checks.birthdays?'done':''}"><div class="review-head"><div><div class="review-title">4. Aniversários</div><div class="review-sub">${birthdays.length} nos próximos 7 dias</div></div><button data-a="reviewToggle" data-check="birthdays" class="${checks.birthdays?'on':''}">${checks.birthdays?'✓':'marcar'}</button></div>${birthdays.length ? `<div class="review-body">${birthdays.map(b => `<div class="review-item"><div><div>🎂 ${esc(b.contact.n)}</div><div class="review-item-meta">${b.days===0?'hoje':'em '+b.days+'d'}</div></div></div>`).join('')}</div>` : '<div class="review-body"><div class="msg">Nenhum aniversário.</div></div>'}</div>
    <div class="review-section ${priority?'done':''}"><div class="review-head"><div><div class="review-title">5. Prioridade da semana</div></div></div><textarea id="reviewPriority" rows="3" placeholder="Se só uma coisa acontecer…" style="margin-top:8px">${esc(priority)}</textarea><button data-a="reviewSavePriority" style="margin-top:6px">Salvar</button></div>`;
}

/* ===== VIEW: REDE / AMIZADES ===== */
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
  const filterPills = `<div class="filter-bar"><input id="contactSearch_${type}" placeholder="🔍 Buscar…" value="${esc(filt.text)}"><select id="contactCatFilter_${type}"><option value="">Categoria</option>${categories.map(c => `<option value="${esc(c)}" ${filt.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="contactStatusFilter_${type}"><option value="active" ${filt.status==='active'?'selected':''}>Ativos</option><option value="all" ${filt.status==='all'?'selected':''}>Todos</option><option value="overdue" ${filt.status==='overdue'?'selected':''}>Atrasados</option><option value="waiting" ${filt.status==='waiting'?'selected':''}>Aguardando</option><option value="snoozed" ${filt.status==='snoozed'?'selected':''}>Adiados</option><option value="archived" ${filt.status==='archived'?'selected':''}>Arquivados</option></select><select id="contactSortFilter_${type}"><option value="score" ${filt.sort==='score'?'selected':''}>Score</option><option value="name" ${filt.sort==='name'?'selected':''}>Nome</option><option value="last" ${filt.sort==='last'?'selected':''}>Último</option><option value="next" ${filt.sort==='next'?'selected':''}>Próximo</option></select></div>`;
  const allTags = contactAllTags().filter(t => all.some(c => (c.tags||[]).includes(t)));
  const tagFilter = allTags.length ? `<div class="tag-filter">${allTags.map(t => `<button class="tag-pill ${filt.tags.includes(t)?'on':''}" data-a="toggleTagFilter" data-type="${type}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}${filt.tags.length ? `<button class="tag-pill" data-a="clearTagFilter" data-type="${type}" style="color:var(--mu)">✕</button>` : ''}</div>` : '';
  const viewToggle = `<div class="view-toggle"><button class="${view==='list'?'on':''}" data-a="contactView" data-type="${type}" data-mode="list">☰ Lista</button><button class="${view==='orbit'?'on':''}" data-a="contactView" data-type="${type}" data-mode="orbit">◎ Órbita</button></div>`;
  const kpis = `<div class="contact-kpis"><div class="kpi"><div class="kpi-label">Contatos</div><div class="kpi-value">${all.filter(c => !c.archived).length}</div><div class="kpi-sub">${active30} ativos (30d)</div></div><div class="kpi"><div class="kpi-label">Atrasados</div><div class="kpi-value ${overdue?'late':''}">${overdue}</div><div class="kpi-sub">${todayCount} hoje</div></div><div class="kpi"><div class="kpi-label">Aguardando</div><div class="kpi-value">${waiting}</div><div class="kpi-sub">resposta deles</div></div><div class="kpi"><div class="kpi-label">Adiados</div><div class="kpi-value">${snoozed}</div><div class="kpi-sub">com motivo</div></div></div>`;
  const form = `<div class="card"><div class="form"><label>Nome<input id="cN_${type}"></label><label>Categoria<select id="cCat_${type}">${categories.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Onde<input id="cWhere_${type}"></label><label>Link<input id="cUrl_${type}"></label><label>Cargo<input id="cRole_${type}"></label><label>Contexto<input id="cContext_${type}"></label><label>Cadência<input id="cCadence_${type}" type="number" value="${isPro?30:21}"></label><label class="full">Última conversa<input id="cLastConv_${type}" placeholder="Falou que estava mudando pra Berlim"></label><label class="full">Tags (vírgula)<input id="cTags_${type}"></label><label class="full">Notas<textarea id="cNotes_${type}" rows="2"></textarea></label></div><button data-a="cAdd" data-type="${type}" style="margin-top:8px">Adicionar</button></div>`;
  const cardsHtml = view === 'orbit' ? renderOrbit(type, filtered) : scored.map(({c, score}) => contactCard(c, score, type)).join('');
  return `<h3 style="margin-top:0">${isPro ? 'Rede profissional' : 'Amizades e vínculos'}</h3><div class="msg">${isPro ? 'Score = urgência de retomar contato.' : 'Score gentil: contatos pessoais pesam × 0.75.'}</div>${kpis}${viewToggle}${filterPills}${tagFilter}${form}<h3>Contatos <span class="count">(${filtered.length})</span></h3>${cardsHtml || '<div class="msg">Nenhum contato.</div>'}`;
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
  const clientBadge = linkedClient ? `<span class="tag" style="color:var(--ok);cursor:pointer" data-a="gotoClient" data-id="${linkedClient.id}">→ ${esc(linkedClient.n)}</span>` : '';
  return `<div class="contact-card ${cls}" style="--c:${status.color}"><div class="big" style="margin-bottom:4px"><input data-p="${esc(k('n'))}" value="${esc(c.n)}" style="font-weight:600;flex:1;min-width:0"><span class="contact-score ${scCls}" title="${esc(contactScoreBreakdown(c))}">${score >= 0 ? score : '—'}</span><span class="badge" style="color:${status.color}">${status.label}</span></div><div class="meta"><span class="tag">${esc(c.cat)}</span>${c.where?`<span class="tag">${esc(c.where)}</span>`:''}${c.role?`<span class="tag">${esc(c.role)}</span>`:''}${days != null?`<span class="tag">${days}d atrás</span>`:'<span class="tag">sem contato</span>'}${c.waitingFor?`<span class="waiting-pill">⏳ ${c.waitingSince ? Math.floor((Date.now()-c.waitingSince)/86400000)+'d' : ''}</span>`:''}${isSnoozed?`<span class="snoozed-pill">⏸ ${fmtDate(c.snoozedUntil)}</span>`:''}${rate != null?`<span class="response-rate ${rateCls}" title="Taxa de resposta">↩ ${Math.round(rate*100)}%</span>`:''}${depthLabel?`<span class="tag" style="opacity:.7">${depthLabel}</span>`:''}${clientBadge}${c.url?`<a class="tag" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">perfil ↗</a>`:''}</div>${(c.tags||[]).length?`<div class="meta" style="margin-top:2px">${(c.tags||[]).map(t => `<span class="tag" style="background:color-mix(in srgb,var(--ac) 10%,var(--s2))">${esc(t)}</span>`).join('')}</div>`:''}${c.lastConversation?`<div class="contact-last-conv">"${esc(c.lastConversation)}"</div>`:''}${recentInter.length?`<details><summary>Interações (${(c.interactions||[]).length})</summary>${recentInter.map(i => {const it = INTERACTION_TYPES.find(t => t.id === i.type) || INTERACTION_TYPES[0]; return `<div class="interaction-row"><span class="dir ${i.direction}">${i.direction==='out'?'↑':'↓'}</span><span style="flex:none">${it.icon} ${it.n}</span><span class="note">${esc(i.note || '')}</span><span style="color:var(--mu);font-size:10px">${fmtDate(iso(new Date(i.at)))}</span></div>`;}).join('')}</details>`:''}<div class="quick-actions"><button class="primary" data-a="contactSend" data-id="${c.id}">↑ Enviei</button><button class="secondary" data-a="contactReceive" data-id="${c.id}">↓ Recebi</button><button class="secondary" data-a="contactSnooze" data-id="${c.id}">⏸ Adiar</button>${!c.clientId?`<button class="secondary" data-a="contactConvert" data-id="${c.id}">→ Virou cliente</button>`:''}</div><details data-eid="${c.id}" ${openEdits.has(c.id)?'open':''}><summary>Editar</summary><div class="form"><label>Categoria<select data-p="${esc(k('cat'))}">${selOptions((type==='pro'?CAT_PRO:CAT_PERSONAL).map(x=>[x,x]), c.cat)}</select></label><label>Prioridade<select data-p="${esc(k('priority'))}">${selOptions(PR.map((x,i)=>[i,x]), c.priority)}</select></label><label>Cadência<input type="number" data-p="${esc(k('cadence'))}" value="${c.cadence||30}"></label><label>Último<input type="date" data-p="${esc(k('lastContact'))}" value="${esc(c.lastContact||'')}"></label><label>Próximo<input type="date" data-p="${esc(k('nextContact'))}" value="${esc(c.nextContact||'')}"></label><label>Aniversário<input type="date" data-p="${esc(k('birthday'))}" value="${esc(c.birthday||'')}"></label><label>Onde<input data-p="${esc(k('where'))}" value="${esc(c.where||'')}"></label><label>Link<input data-p="${esc(k('url'))}" value="${esc(c.url||'')}"></label><label>Cargo<input data-p="${esc(k('role'))}" value="${esc(c.role||'')}"></label><label class="full">Contexto<input data-p="${esc(k('context'))}" value="${esc(c.context||'')}"></label><label class="full">Última conversa<input data-p="${esc(k('lastConversation'))}" value="${esc(c.lastConversation||'')}"></label><label class="full">Tags<input data-p="${esc(k('tagsStr'))}" value="${esc((c.tags||[]).join(', '))}"></label><label class="full">Notas<textarea data-p="${esc(k('notes'))}" rows="3">${esc(c.notes||'')}</textarea></label></div><div class="acts" style="margin-top:8px"><button data-a="contactLog" data-id="${c.id}">+ Log</button>${c.waitingFor?`<button data-a="contactClearWaiting" data-id="${c.id}">Cancelar aguardando</button>`:''}${isSnoozed?`<button data-a="contactUnsnooze" data-id="${c.id}">Cancelar adiamento</button>`:''}<button data-a="cArchive" data-id="${c.id}">${c.archived?'Restaurar':'Arquivar'}</button><button data-a="cDel" data-id="${c.id}">✕ Excluir</button></div></details></div>`;
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

/* ===== VIEW: COMANDOS ===== */
function viewCommands() {
  const cmds = [...S.commands].sort((a,b) => (a.order||0)-(b.order||0));
  return `<h3 style="margin-top:0">Referência rápida</h3>
    <div class="msg">Pressione <kbd>?</kbd> para atalhos. <a href="#" data-a="showShortcuts" style="color:var(--ac);font-weight:700">Ver painel →</a></div>
    <div class="add"><input id="cmdN" placeholder="Nome"><input id="cmdCat" placeholder="Categoria" style="max-width:130px"><button data-a="cmdAdd">+</button></div>
    <details style="margin-bottom:12px"><summary>+ Comando completo</summary><div class="form" style="margin-top:6px"><label>Nome<input id="cmdN2"></label><label>Categoria<input id="cmdCat2"></label><label class="full">Comando<textarea id="cmdCmd" rows="3"></textarea></label><label class="full">Exemplo<input id="cmdEx"></label></div><button data-a="cmdAddFull" style="margin-top:6px">Adicionar</button></details>
    ${cmds.map(c => `<div style="background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:10px;margin-bottom:6px"><div class="big"><div><div style="font-weight:600;color:var(--ac)">${esc(c.n)}</div><div style="font-size:10.5px;color:var(--mu);text-transform:uppercase;letter-spacing:.06em">${esc(c.cat||'')}</div></div><div><button data-a="cmdUp" data-id="${c.id}">↑</button><button data-a="cmdDown" data-id="${c.id}">↓</button><button data-a="cmdDel" data-id="${c.id}">✕</button></div></div><div style="font-size:13px;white-space:pre-wrap;margin-top:4px">${esc(c.cmd)}</div>${c.example?`<div class="msg" style="margin-top:6px"><code style="background:var(--s2);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:12px">${esc(c.example)}</code></div>`:''}</div>`).join('')}`;
}

/* ===== VIEW: CONFIG ===== */
function renderThemePreview() {
  return `<div class="theme-preview"><div class="theme-preview-title">Prévia ao vivo</div><div class="theme-preview-row"><span style="color:var(--ac);font-weight:700;font-size:14px">ATELIER</span><span style="color:var(--mu);font-size:12px">·</span><span style="color:var(--mu);font-size:12px">Nível 4 · 380 XP</span></div><div class="theme-preview-row"><span class="type-icon criativa">✧</span><span style="font-size:13px;font-weight:500">Editar teaser</span><span class="score-badge hot">78</span><span class="tag" style="color:var(--ac)">Carreira</span></div><div class="theme-preview-bar"><div></div></div></div>`;
}
function renderAreasSection() {
  const areas = getAllAreas();
  return `<div class="section-group"><h3 style="margin-top:0">Áreas</h3>
    <div class="msg">Áreas profissionais ou pessoais para classificar tarefas e projetos.</div>
    ${areas.map((a,i) => `<div class="area-row ${a.archived?'archived':''}">
      <input type="color" data-area-color="${a.id}" value="${esc(a.color)}">
      <input type="text" data-area-name="${a.id}" value="${esc(a.n)}">
      <button data-a="areaArch" data-id="${a.id}" title="${a.archived?'Restaurar':'Arquivar'}">${a.archived?'↻':'↓'}</button>
    </div>`).join('')}
    <div class="add" style="margin-top:8px">
      <input id="newAreaName" placeholder="Nova área">
      <input type="color" id="newAreaColor" value="#d4a84b" style="max-width:60px;padding:2px;height:36px">
      <button data-a="areaAdd">+</button>
    </div>
  </div>`;
}
function renderTrashSection() {
  const items = listAllDeleted();
  return `<div class="section-group"><h3 style="margin-top:0">Lixo (${items.length})</h3>
    <div class="msg">Itens deletados ficam aqui. Recupere ou exclua permanentemente. Mantém até 200 itens.</div>
    ${items.length ? items.map(it => `<div class="trash-row">
      <span class="trash-info"><div class="trash-title">${esc(it.title)}</div><div class="trash-meta">${it.icon} ${it.label} · ${new Date(it.at).toLocaleDateString('pt-BR')}</div></span>
      <button data-a="trashRestore" data-type="${it.type}" data-id="${it.obj.id}">↩ Restaurar</button>
      <button data-a="trashDelete" data-type="${it.type}" data-id="${it.obj.id}">✕</button>
    </div>`).join('') : '<div class="msg">Lixo vazio.</div>'}
    ${items.length ? `<div class="acts" style="margin-top:8px"><button data-a="trashEmpty" style="background:var(--er);color:#fff;border-color:var(--er)">Esvaziar lixo</button></div>` : ''}
  </div>`;
}
function viewConfig() {
  const jsonStr = JSON.stringify(S, null, 1);
  const currentTheme = S.cfg.theme || 'obsidian';
  const customAccent = S.cfg.accentColor;
  const themeCards = Object.entries(THEMES).map(([id, t]) => `<button class="theme-card ${id === currentTheme ? 'on' : ''}" data-a="setTheme" data-id="${id}"><div class="theme-swatch" style="background:${t.bg};border-bottom:1px solid ${t.bd}"><span class="ts-dot" style="background:${customAccent && id === currentTheme ? customAccent : t.ac};color:${customAccent && id === currentTheme ? customAccent : t.ac}"></span><span class="ts-bar" style="background:linear-gradient(90deg,${t.bu},${t.ac})"></span><span class="ts-dot" style="background:${t.bu};color:${t.bu}"></span></div><div class="theme-info"><div class="theme-name">${esc(t.n)}</div><div class="theme-desc">${esc(t.desc)}</div></div></button>`).join('');
  const customRow = `<div class="custom-accent-row"><span style="font-size:12px;color:var(--mu)">Accent customizado:</span><input type="color" value="${esc(customAccent || THEMES[currentTheme].ac)}" data-a="setCustomAccent"><button data-a="clearCustomAccent" ${customAccent ? '' : 'disabled'}>${customAccent ? 'Remover custom' : 'Usar padrão do tema'}</button>${customAccent ? `<span style="font-size:11px;color:var(--mu)">Ativo: ${esc(customAccent)}</span>` : ''}</div>`;
  const cur = S.cfg.primaryCurrency || 'BRL';
  return `
    <div class="section-group"><h3 style="margin-top:0">Aparência</h3><div class="msg" style="margin-bottom:10px">O tema altera fundo, superfícies e cores de destaque.</div>${renderThemePreview()}<div class="theme-grid">${themeCards}</div>${customRow}</div>

    <div class="section-group"><h3 style="margin-top:0">Logo</h3><div class="msg">Opcional. PNG, SVG ou WEBP (máx 500KB). O texto "ATELIER" continua aparecendo ao lado, em fonte gótica.</div>${S.cfg.logo ? `<div style="margin:8px 0;display:flex;align-items:center;gap:8px"><img src="${esc(S.cfg.logo)}" alt="Logo" style="max-height:44px;max-width:160px;background:var(--s2);padding:6px;border-radius:8px"><span style="font-family:'Grenze Gotisch',serif;font-size:24px;color:var(--ac);font-weight:700">ATELIER</span></div>` : ''}<div class="form"><label class="full">Enviar logo<input type="file" id="logoInput" accept="image/png,image/svg+xml,image/webp"></label></div>${S.cfg.logo ? `<div class="acts" style="margin-top:6px"><button data-a="logoRemove">Remover logo</button></div>` : ''}</div>

    ${renderAreasSection()}

    <div class="section-group"><h3 style="margin-top:0">Timer de foco</h3><div class="msg">Durações rápidas (blocos de foco):</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${(S.cfg.focusDurations||[]).map(m => `<span class="tag" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px">${m}min<button data-a="focusDurRem" data-m="${m}" style="padding:0 4px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:11px">✕</button></span>`).join('')}</div><div class="add" style="margin-top:6px"><input type="number" id="focusDurAdd" placeholder="Nova duração (min)" style="max-width:180px"><button data-a="focusDurAdd">+</button></div><div class="form" style="margin-top:8px"><label>Duração padrão (foco)<select data-c="defaultFocus">${selOptions((S.cfg.focusDurations||[]).map(m => [m, m+'min']), S.cfg.defaultFocus||25)}</select></label><label>Descanso (min)<input type="number" data-c="brk" value="${S.cfg.brk||10}"></label><label class="full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-c="focusNoStop" ${S.cfg.focusNoStop?'checked':''} style="width:auto">Sempre sair do foco sem parar timer</label></div><div class="msg">Ao terminar cada bloco, o app entra em descanso automaticamente e avisa com flash e som.</div></div>

    <div class="section-group"><h3 style="margin-top:0">Configurações</h3><div class="form"><label>Alerta de foco (min)<input type="number" data-c="focus" value="${S.cfg.focus||50}"></label><label>Capacidade diária<input type="number" data-c="cap" value="${S.cfg.cap||360}"></label><label>Moeda principal<select data-c="primaryCurrency">${selOptions(Object.keys(CURRENCIES).map(c=>[c,CURRENCIES[c].sym+' '+c]), cur)}</select></label><label>Câmbio USD→BRL<input type="number" step="0.01" data-c="usdRate" value="${S.cfg.usdRate||5.2}"></label><label>Câmbio EUR→BRL<input type="number" step="0.01" data-c="eurRate" value="${S.cfg.eurRate||5.6}"></label><label>Densidade tarefas<select data-c="taskDensity">${selOptions([['auto','Auto (mobile: compacto)'],['compact','Sempre compacto'],['full','Sempre completo']], S.cfg.taskDensity||'auto')}</select></label><label class="full" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-c="autoPriority" ${S.cfg.autoPriority?'checked':''} style="width:auto">Prioridade automática</label></div></div>

    <div class="section-group"><h3 style="margin-top:0">XP</h3><div class="msg">Curva progressiva (nível 1→2 custa 150 XP, cresce 20% por nível). Repetição da mesma tarefa em 30 dias vale 50%. Tarefas em Compromissos/Pessoal não dão XP.</div><div class="form"><label>XP total<input type="text" readonly value="${Math.round(globalXp())}"></label><label>Nível<input type="text" readonly value="${levelInfo(globalXp()).lv}"></label></div><div class="acts" style="margin-top:8px"><button data-a="resetXp" style="background:var(--er);color:#fff;border-color:var(--er)">⚠ Resetar XP (corrige valores corrompidos)</button></div></div>

    ${renderTrashSection()}

    <div class="section-group"><h3 style="margin-top:0">Backup</h3><div class="msg">Último backup: ${S.cfg.lastBackupAt ? new Date(S.cfg.lastBackupAt).toLocaleString('pt-BR') : 'nunca'}</div><div class="warn" style="background:color-mix(in srgb,var(--wr) 15%,var(--s1));border:1px solid var(--wr);border-radius:8px;padding:8px 10px;font-size:12px;margin:8px 0"><b style="color:var(--wr)">Dados em localStorage.</b> Faça backups regulares.</div><textarea id="exp" rows="5" readonly>${esc(jsonStr)}</textarea><div class="acts"><button data-a="dl">Baixar JSON</button><button data-a="cpj">Copiar JSON</button></div></div>

    <div class="section-group"><h3 style="margin-top:0">Importar</h3><div class="form"><label class="full">Selecionar arquivo JSON<input type="file" id="importFileInput" accept=".json,application/json"></label></div><textarea id="imp" rows="4" placeholder="Ou cole o JSON do backup aqui" style="margin-top:8px"></textarea><div class="acts"><button data-a="imp">Importar texto colado</button></div><div class="msg">Snapshot do estado atual é salvo antes de substituir.</div></div>

    <div class="section-group"><h3 style="margin-top:0">Estatísticas</h3><div class="stats"><span>Tarefas: <b>${S.tasks.length}</b></span><span>Projetos: <b>${alive(S.projects).length}</b></span><span>Clientes: <b>${alive(S.clients).length}</b></span><span>Vagas: <b>${alive(S.applications).length}</b></span><span>Contatos: <b>${alive(S.contacts).length}</b></span><span>Áreas: <b>${getAreas().length}</b></span><span>XP: <b>${Math.round(globalXp())}</b></span></div></div>`;
}

const VIEWS = {
  week: viewWeek, q: viewQueue, jobs: viewJobs, proj: viewProjects,
  clients: viewClients, earn: viewEarnings,
  cal: viewCalendar, goal: viewGoals, skills: viewSkills, stats: viewStats, review: viewReview,
  rede: () => viewContacts('pro'), friends: () => viewContacts('personal'),
  history: viewHistory, cmds: viewCommands, config: viewConfig
};

/* ============================================================
   CLICK HANDLER
   ============================================================ */
const MUTATING_ACTIONS = new Set(['tog','stog','log','del','sdel','subUp','cp','padd','pdel','gadd','gdel','skillAdd','skillArch','skillRestore','cAdd','cDel','cArchive','cmdAdd','cmdAddFull','cmdDel','cmdUp','cmdDown','setTaskColor','setnext','moveUp','moveDown','setEnergy','postpone','moveToDay','qaJob','jobAddFull','jobStage','jobApply','jobFollowUp','jobCreateTask','jobDel','reviewJobFollowUp','reviewJobSnooze','reviewComplete','reviewArchive','reviewArchiveProj','reviewContactDone','reviewContactSnooze','reviewSavePriority','contactSend','contactReceive','contactSnooze','contactUnsnooze','contactClearWaiting','contactLog','snoozeApply','toggleTagFilter','clearTagFilter','setTheme','clearCustomAccent','logoRemove','focusDurAdd','focusDurRem','clientAdd','clientDel','pcomplete','puncomplete','histReopen','histCopy','histDel','areaAdd','areaArch','trashRestore','trashDelete','trashEmpty','contactConvert','jobConvert','closeFocusStop','closeFocusConfirm','toggleSection','resetXp']);
/* ═══ SECTION: EVENTS ═══ */
/* PRESERVA ESTADO DOS MENUS DETAILS (Fix edição fechando) */
document.addEventListener('toggle', ev => {
  if (ev.target.tagName === 'DETAILS' && ev.target.dataset.eid) {
    if (ev.target.open) openEdits.add(ev.target.dataset.eid);
    else openEdits.delete(ev.target.dataset.eid);
  }
}, true);

document.addEventListener('click', ev => {
  if (ev.target.classList.contains('shortcuts-modal')) {ev.target.remove(); return;}
  if (ev.target.classList.contains('more-sheet')) {hideMoreSheet(); return;}
  const btn = ev.target.closest('[data-a]');
  if (!btn || btn.tagName === 'INPUT' || btn.tagName === 'SELECT') return;
  const a = btn.dataset.a; const id = btn.dataset.id; const i = btn.dataset.i;
  const t = id && T(id); const c = id && S.contacts.find(x => x.id === id);
  if (MUTATING_ACTIONS.has(a)) snapshot();
  switch (a) {
    case 'tab': tab = btn.dataset.t; selectedTaskId = null; hideMoreSheet(); break;
    case 'day': day = +i; break;
    case 'showShortcuts': showShortcutsHelp(); return;
    case 'closeShortcuts': document.getElementById('shortcutsModal')?.remove(); return;
    case 'moreOpen': showMoreSheet(); return;
    case 'closeMore': hideMoreSheet(); return;
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
    case 'openSearch': openSearch(); return;
    case 'searchGo': goToSearchResult(btn.dataset.tab, btn.dataset.target); return;
    case 'toggleQueueCard': {
      if (!id) break;
      selectedTaskId = id;
      if (expandedTasks.has(id)) expandedTasks.delete(id);
      else expandedTasks.add(id);
      
      // Verifica em qual aba estamos para atualizar a lista correta
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
      selectedTaskId = id;
      expandedTasks.add(id);
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
    case 'expandAll': {
      forcedCompact = false;
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
    case 'toggleFilters': mobileFiltersOpen = !mobileFiltersOpen; render(); return;
    case 'gotoClient': {tab = 'clients'; render(); setTimeout(() => {const el = document.querySelector(`[data-p="clients:${id}:n"]`)?.closest('.client-card'); if (el) {el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight'); setTimeout(() => el.classList.remove('highlight'), 2100);}}, 100); return;}
    case 'gotoProject': {tab = 'proj'; render(); setTimeout(() => {const el = document.querySelector(`[data-p="projects:${id}:n"]`)?.closest('.card'); if (el) {el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight'); setTimeout(() => el.classList.remove('highlight'), 2100);}}, 100); return;}
    case 'clientAdd': {const n = V('clientN'); if (!n) return; S.clients.push(mkClient({n})); break;}
    case 'clientDel': if (!confirm('Excluir cliente? Ele vai para o lixo. Projetos vinculados ficam sem cliente.')) return; softDelete('clients', id); alive(S.projects).forEach(p => {if (p.clientId === id) {p.clientId = ''; touch(p);}}); alive(S.contacts).forEach(ct => {if (ct.clientId === id) {ct.clientId = null; touch(ct);}}); break;
    case 'pcomplete': {const p = S.projects.find(x => x.id === id); if (p && !p.completedAt) {p.completedAt = Date.now(); touch(p); toast('Projeto concluído');} break;}
    case 'puncomplete': {const p = S.projects.find(x => x.id === id); if (p) {p.completedAt = null; touch(p); toast('Reaberto');} break;}
    case 'histReopen': {const tt = T(id); if (tt && tt.done) {tt.done = false; tt.doneAt = null; touch(tt); toast('Tarefa reaberta');} break;}
    case 'histCopy': {const tt = T(id); if (!tt) return; const copy = {...tt, id: uid(), done: false, doneAt: null, xpClaimed: false, next: false, order: 0, spent: 0, logs: [], subs: (tt.subs||[]).map(sb => ({...sb, id: uid(), d:false, xpClaimed:false, logs:[]})), day: todayI(), createdAt: Date.now(), updatedAt: Date.now(), postponedCount: 0}; S.tasks.push(copy); toast('Copiada para hoje'); break;}
    case 'histDel': if (!confirm('Excluir tarefa permanentemente do histórico?')) return; S.tasks = S.tasks.filter(x => x.id !== id); break;
    case 'earnFilter': earningsFilter = btn.dataset.v; render(); return;
    case 'histFilter': historyFilter = btn.dataset.v; render(); return;
    case 'tog': if (!t) break; if (!t.done) {t.done = true; t.doneAt = Date.now(); touch(t); if (!isPersonalSection(t)) {const xp = taskBaseXp(t); toast('+' + xp + ' XP');} else {toast('Concluída (sem XP)');} awardTaskXp(t); if (t.next) t.next = false; if (focusTaskId === t.id) closeFocus();} else {t.done = false; t.doneAt = null; touch(t);} break;
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

/* CHANGE */
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
  if (el.dataset.a === 'focusSub') {const t = S.tasks.find(x => x.id === focusTaskId); if (t) {const sb = t.subs[+el.dataset.i]; if (sb) {sb.d = el.checked; if (sb.d) awardSubXp(t, sb); touch(t); save(); renderFocus();}} return;}
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
  
  snapshot(); // <- ADICIONADO: Salva o estado para o Ctrl+Z funcionar nas edições internas!
  
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

/* INPUT */
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

/* ENTER */
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
});

/* KEYBOARD */
document.addEventListener('keydown', ev => {
  const tag = document.activeElement.tagName;
  const isTyping = ['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement.isContentEditable;
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {ev.preventDefault(); openSearch(); return;}
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {if (isTyping) return; ev.preventDefault(); undo(); return;}
  if (isTyping) return;
  if (ev.key === 'n' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {ev.preventDefault(); const qa = document.getElementById('qa') || document.getElementById('qaJob'); if (qa) qa.focus(); return;}
  if (ev.key === 'f' && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {ev.preventDefault(); const nt = S.tasks.find(t => t.next && !t.done) || S.tasks.find(t => !t.done && t.day === day); if (nt) openFocus(nt.id); else toast('Sem tarefa pendente'); return;}
  if (ev.key === 'Escape') {
    if (document.getElementById('searchModal')) {closeSearch(); return;}
    if (document.getElementById('closeFocusModal')) {document.getElementById('closeFocusModal').remove(); return;}
    if (focusTaskId) {closeFocus(); return;}
    const sc = document.getElementById('shortcutsModal'); if (sc) {sc.remove(); return;}
    closeSnoozeMenu(); closeInteractionSheet(); hideMoreSheet();
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

/* BLUR SUBTASK */
document.addEventListener('blur', ev => {
  const el = ev.target;
  if (!el.dataset || !el.dataset.subedit) return;
  const [tid, sid] = el.dataset.subedit.split(':');
  const t = T(tid); if (!t) return;
  const sb = t.subs.find(x => x.id === sid); if (!sb) return;
  const newText = el.textContent.trim().replace(/^▶\s*/, '');
  if (newText && newText !== sb.t) {sb.t = newText; touch(t); save();}
}, true);

/* SNOOZE / INTERACTION SHEETS */
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
  el.innerHTML = `<div class="shortcuts-content" style="max-width:400px"><h3 style="margin-top:0;color:var(--ac)">Registrar interação</h3><div style="font-size:12px;color:var(--mu);margin-bottom:12px">${esc(c.n)}</div><div class="form"><label>Direção<select id="iaDir"><option value="out">Enviei</option><option value="in">Recebi</option></select></label><label>Tipo<select id="iaType">${INTERACTION_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.n}</option>`).join('')}</select></label><label class="full">Nota<textarea id="iaNote" rows="2"></textarea></label></div><div class="acts" style="margin-top:12px"><button data-a="interactionSave" data-id="${c.id}" style="background:var(--ac);color:#000;border-color:var(--ac);flex:1">Registrar</button><button data-a="closeInteraction">Cancelar</button></div></div>`;
  document.body.appendChild(el);
}
function closeInteractionSheet() {document.getElementById('interactionSheet')?.remove();}
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

function reorderTask(t, delta) {
  const list = dayTasks(t.day);
  const idx = list.findIndex(x => x.id === t.id);
  const nidx = idx + delta;
  if (idx < 0 || nidx < 0 || nidx >= list.length) return;
  [list[idx], list[nidx]] = [list[nidx], list[idx]];
  list.forEach((x, ix) => x.order = ix);
  save(); render();
}
function doImport(text) {
  try {
    if (!text || !text.trim()) {toast('Nada', true); return;}
    const parsed = JSON.parse(text);
    if (!parsed.tasks || !parsed.projects) throw new Error('Estrutura inválida');
    backupLocal();
    const migrated = migrate(parsed);
    S = migrated; applyTheme(); save(); render();
    toast('Importado. Snapshot anterior em ' + LS_BACKUP);
  } catch(e) {toast('JSON inválido: ' + e.message, true);}
}

/* ═══ SECTION: INIT ═══ */
/* INIT */
(function init() {
  try {const raw = localStorage.getItem(LS_KEY); if (raw) S = JSON.parse(raw);} catch(e) {}
  if (!S || !S.tasks) {S = seed(); save();} else {S = migrate(S); save();}
  applyTheme();
  lastSlot = currentEnergySlot();
  focusTargetMin = S.cfg.defaultFocus || 25;
  applyLogo();
  render();
  if (S.timer) {const elapsed = Math.round(timerElapsedSec() / 60); toast('Timer retomado: ' + elapsed + 'min'); renderTimer();}
  (async () => {
    try {const c = window.claude; if (!c) return; const [u, d] = await Promise.all([c.use('user'), c.use('db')]); if (!u || !d) return; const id = await u.id(); if (!id) return; dbDoc = d.collection('data/users/' + id).doc('app'); const snap = await dbDoc.get(); if (snap.exists && snap.data().json && !dirty) {const remote = migrate(JSON.parse(snap.data().json)); if (remote) {S = remote; applyTheme(); save(); render();}}} catch(e) {}
  })();
  setTimeout(() => {dirty = false;}, 500);
})();

window.__atelier = {get S(){return S}, save, render, migrate, seed, undo, contactScore, connectionDepth, xpProgression, applyTheme, THEMES, projectEarnings, clientById, timerElapsedSec, getAreas, areaColor, softDelete, restoreItem, listAllDeleted, levelInfo, taskSection, sectionProgress, taskBaseXp, isPersonalSection};

/* ===== V14.1 UX: botão flutuante "+" (mobile) ===== */
(function () {
  const f = document.createElement('button');
  f.className = 'fab'; f.id = 'fab'; f.hidden = true; f.textContent = '+';
  f.setAttribute('aria-label', 'Nova tarefa');
  document.body.appendChild(f);
  const find = () => document.getElementById('qa') || document.getElementById('qaJob');
  const sync = () => { f.hidden = !find(); };
  f.addEventListener('click', () => { const q = find(); if (!q) return; q.scrollIntoView({block: 'center', behavior: 'smooth'}); setTimeout(() => q.focus(), 250); });
  document.addEventListener('focusin', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) f.style.display = 'none'; });
  document.addEventListener('focusout', () => { f.style.display = ''; });
  const app = document.getElementById('app');
  if (app) new MutationObserver(sync).observe(app, {childList: true});
  sync();
})();

/* ═══ PWA — sync pill + banner de update (append no final) ═══ */
(function initPWA() {
  const isHttp = location.protocol === 'http:' || location.protocol === 'https:';

  // ── 1. Pill de status abaixo do header
  const header = document.querySelector('.wrap > header');
  if (header) {
    const pill = document.createElement('div');
    pill.id = 'syncPill';
    pill.className = 'sync-pill';
    pill.dataset.state = 'saved';
    pill.innerHTML = '<span class="sp-dot"></span><span class="sp-text">Salvo</span>';
    header.insertAdjacentElement('afterend', pill);
  }

  function setSyncState(state) {
    const p = document.getElementById('syncPill');
    if (!p) return;
    p.dataset.state = state;
    const labels = { saving: 'Salvando…', saved: 'Salvo', error: 'Erro — faça backup', offline: 'Offline' };
    p.querySelector('.sp-text').textContent = labels[state] || state;
  }

  // ── 2. Intercepta save() para refletir estado
  if (typeof save === 'function') {
    const _orig = save;
    save = function () {
      setSyncState('saving');
      try {
        _orig.apply(this, arguments);
        setSyncState('saved');
      } catch (e) {
        setSyncState('error');
        throw e;
      }
    };
  }

  // ── 3. Listeners de rede
  window.addEventListener('online', () => setSyncState('saved'));
  window.addEventListener('offline', () => setSyncState('offline'));
  setTimeout(() => setSyncState(navigator.onLine ? 'saved' : 'offline'), 400);

  // ── 4. Registro do Service Worker + detecção de update
  if (!isHttp || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        // Checa update ao abrir
        reg.update().catch(() => {});
        // Checa update a cada 60 min (para quem deixa o app aberto)
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

        // Detecta nova versão instalada
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
    const pill = document.getElementById('syncPill');
    (pill || header)?.insertAdjacentElement('afterend', banner);

    banner.addEventListener('click', (ev) => {
      const act = ev.target.dataset.pwa;
      if (act === 'update') {
        if (reg.waiting) {
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