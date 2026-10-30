// =========================================================
// ONBOARDING.JS — primeira utilização (Fase 2.5)
// Login opcional (Magic Link) → apresentação → escolha de tema.
// Local-first: nunca bloqueia o app; pode ser pulado a qualquer momento.
// =========================================================
(function () {
  'use strict';

  var KEY = 'atelier_onboarding_v1';
  var STEPS = ['login', 'intro', 'theme'];
  var state = { step: 0, overlay: null, force: false, loginStatus: '', selectedTheme: null, busy: false };

  function readStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeStore(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function authState() {
    try { return (window.__auth && window.__auth.getState) ? window.__auth.getState() : null; } catch (e) { return null; }
  }
  function accountId() {
    var a = authState();
    return (a && a.user && a.user.id) ? a.user.id : 'local';
  }
  function isDone() { return !!readStore().done; }
  function markDone(extra) {
    writeStore(Object.assign({ done: true, at: Date.now(), account: accountId() }, extra || {}));
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function shouldShow() { return !isDone(); }

  function startStep() {
    var a = authState();
    if (a && a.status === 'signed_in') return 1; // já logado: pula login
    if (!a || !a.configured) return 1;           // sem auth configurada: pula login
    return 0;                                    // deslogado e configurado: mostra login
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function themeGrid(selected) {
    var themes = (typeof THEMES !== 'undefined') ? THEMES : {};
    return Object.keys(themes).map(function (id) {
      var t = themes[id];
      var axis = (t.mode === 'light' ? 'CLARO' : 'ESCURO') + (t.look ? ' · ' + t.look.toUpperCase() : '');
      return '<button type="button" class="theme-card ' + (id === selected ? 'on' : '') + '" data-ob-theme="' + esc(id) + '">' +
        '<div class="theme-swatch" style="background:' + esc(t.bg) + ';border-bottom:1px solid ' + esc(t.bd) + '">' +
        '<span class="ts-dot" style="background:' + esc(t.ac) + ';color:' + esc(t.ac) + '"></span>' +
        '<span class="ts-bar" style="background:linear-gradient(90deg,' + esc(t.bu) + ',' + esc(t.ac) + ')"></span>' +
        '<span class="ts-dot" style="background:' + esc(t.bu) + ';color:' + esc(t.bu) + '"></span></div>' +
        '<div class="theme-info"><div class="theme-name">' + esc(t.n) + '</div><div class="theme-desc">' + esc(t.desc) + '</div>' +
        '<div class="theme-axis" style="font-size:8.5px;line-height:1.2;color:var(--mu);margin-top:2px;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(axis) + '</div></div>' +
        '</button>';
    }).join('');
  }

  function stepHTML(step, ctx) {
    ctx = ctx || {};
    if (step === 'login') {
      return '<div class="ob-step"><h2>Entrar no Ateliê</h2>' +
        '<p class="msg">Entre com um link enviado por e-mail. Você também pode continuar sem conta e usar o app localmente.</p>' +
        '<div class="form" style="margin-top:10px"><label class="full">E-mail<input id="obEmail" type="email" autocomplete="email" placeholder="seu@email.com"></label></div>' +
        (ctx.loginStatus ? '<div class="msg">' + esc(ctx.loginStatus) + '</div>' : '') +
        '<div class="acts"><button type="button" data-ob="send">Enviar link de acesso</button>' +
        '<button type="button" data-ob="check">Já entrei</button>' +
        '<button type="button" data-ob="skip-login">Continuar sem conta</button></div></div>';
    }
    if (step === 'intro') {
      return '<div class="ob-step ob-intro"><img src="./icon-192.png" alt="Ateliê" class="ob-logo">' +
        '<h2>Bem-vindo ao Ateliê</h2>' +
        '<p class="msg">Um espaço para organizar sua vida criativa:</p>' +
        '<ul class="ob-list"><li>Tarefas e projetos</li><li>Planejamento diário</li><li>Foco com Pomodoro</li></ul>' +
        '<div class="acts"><button type="button" data-ob="next">Vamos começar</button>' +
        '<button type="button" data-ob="skip-intro">Pular</button></div></div>';
    }
    return '<div class="ob-step"><h2>Escolha seu tema</h2>' +
      '<p class="msg">Aplique agora e mude quando quiser em Configurações.</p>' +
      '<div class="theme-grid">' + themeGrid(ctx.selectedTheme) + '</div>' +
      '<div class="acts"><button type="button" data-ob="finish">Concluir</button>' +
      '<button type="button" data-ob="skip-theme">Pular</button></div></div>';
  }

  function render() {
    if (!state.overlay) return;
    state.overlay.innerHTML = '<div class="ob-card" role="dialog" aria-modal="true" aria-label="Apresentação do Ateliê">' +
      '<button type="button" class="ob-close" data-ob="skip-all" aria-label="Fechar">✕</button>' +
      stepHTML(STEPS[state.step], state) + '</div>';
  }

  function open(opts) {
    if (state.overlay) return;
    state.force = !!(opts && opts.force);
    state.step = state.force ? startStep() : startStep();
    state.loginStatus = '';
    state.selectedTheme = (typeof S !== 'undefined' && S.cfg) ? (S.cfg.theme || 'obsidian') : 'obsidian';
    var el = document.createElement('div');
    el.className = 'ob-overlay';
    el.addEventListener('click', onClick);
    document.body.appendChild(el);
    state.overlay = el;
    render();
  }

  function close() {
    if (!state.overlay) return;
    try { state.overlay.remove(); } catch (e) {}
    state.overlay = null;
  }

  function finish(extra) {
    markDone(extra);
    close();
    try {
      if (typeof tab === 'string' && tab === 'config' && typeof render === 'function') render();
    } catch (e) {}
  }

  function applyThemeChoice(id) {
    if (typeof S !== 'undefined' && S.cfg && S.cfg.theme !== id) {
      S.cfg.theme = id;
      if (typeof save === 'function') save();
      if (typeof applyTheme === 'function') applyTheme();
    }
    state.selectedTheme = id;
    render();
  }

  function sendLink() {
    var input = state.overlay ? state.overlay.querySelector('#obEmail') : null;
    var email = input ? String(input.value || '').trim() : '';
    if (!email) { state.loginStatus = 'Informe seu e-mail.'; render(); return; }
    if (typeof authSendMagicLink !== 'function') { state.loginStatus = 'Autenticação indisponível.'; render(); return; }
    state.loginStatus = 'Enviando link…'; render();
    Promise.resolve(authSendMagicLink(email)).then(function () {
      var a = authState();
      state.loginStatus = (a && a.status === 'sent')
        ? 'Link enviado. Abra o e-mail e clique no link para entrar.'
        : ((a && a.message) || 'Não foi possível enviar agora. Tente novamente.');
      render();
    }).catch(function () {
      state.loginStatus = 'Falha ao enviar. Tente novamente.';
      render();
    });
  }

  function onClick(ev) {
    var themeBtn = ev.target.closest ? ev.target.closest('[data-ob-theme]') : null;
    if (themeBtn) { applyThemeChoice(themeBtn.dataset.obTheme); return; }
    var btn = ev.target.closest ? ev.target.closest('[data-ob]') : null;
    if (!btn) return;
    var act = btn.dataset.ob;
    if (act === 'skip-all') { finish({ skipped: true }); return; }
    if (act === 'send') { sendLink(); return; }
    if (act === 'check') {
      var a = authState();
      if (a && a.status === 'signed_in') { state.step = 1; render(); }
      else { state.loginStatus = 'Ainda não identifiquei o login. Abra o link do e-mail e tente novamente.'; render(); }
      return;
    }
    if (act === 'skip-login') { state.step = 1; render(); return; }
    if (act === 'next' || act === 'skip-intro') { state.step = 2; render(); return; }
    if (act === 'finish') { finish({ theme: state.selectedTheme }); return; }
    if (act === 'skip-theme') { finish({ skippedTheme: true }); return; }
  }

  function whenAuthReady(cb) {
    var tries = 0;
    (function tick() {
      var a = authState();
      if (!a || (a.status !== 'loading' && a.status !== 'idle') || tries++ > 20) return cb();
      setTimeout(tick, 200);
    })();
  }

  window.__onboarding = {
    shouldShow: shouldShow,
    open: open,
    reset: reset,
    markDone: markDone,
    _html: stepHTML,
    getState: function () { return { step: state.step, selectedTheme: state.selectedTheme, loginStatus: state.loginStatus }; }
  };
  window.openOnboarding = function (opts) { open(opts || { force: true }); };
  window.resetOnboarding = reset;

  if (typeof document !== 'undefined') {
    var start = function () {
      if (!shouldShow()) return;
      whenAuthReady(function () {
        if (shouldShow()) setTimeout(function () { open(); }, 300);
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})();
