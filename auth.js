// =========================================================
// AUTH.JS — autenticação por Magic Link (Supabase) — Fase 2
// Independente da sincronização: NÃO envia/recebe dados do app.
// O app continua local-only; a conta será usada na futura sync.
// =========================================================
(function () {
  'use strict';

  var CFG = (typeof window !== 'undefined' && window.ATELIER_SUPABASE) ? window.ATELIER_SUPABASE : null;
  var state = {
    configured: !!(CFG && CFG.url && CFG.anonKey),
    client: null,
    user: null,
    status: 'idle', // idle | disabled | loading | signed_out | signed_in | sending | sent | offline | error
    message: '',
    subscribed: false
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function currentTab() {
    try { return (typeof tab === 'string') ? tab : null; } catch (e) { return null; }
  }

  function setState(patch) {
    Object.assign(state, patch);
    if (currentTab() === 'config' && typeof render === 'function') render();
  }

  function isOnline() {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }

  function redirectUrl() {
    if (CFG && CFG.redirectTo) return CFG.redirectTo;
    try { return location.origin + location.pathname; } catch (e) { return undefined; }
  }

  async function ensureClient() {
    if (state.client) return state.client;
    if (!state.configured) { setState({ status: 'disabled' }); return null; }
    if (!isOnline()) {
      setState({ status: 'offline', message: 'Sem conexão. O app continua funcionando offline.' });
      return null;
    }
    try {
      // Cliente oficial supabase-js v2 via ESM (sem build/bundler).
      var mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      var createClient = mod.createClient || (mod.default && mod.default.createClient);
      if (typeof createClient !== 'function') throw new Error('createClient indisponível');
      state.client = createClient(CFG.url, CFG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      return state.client;
    } catch (e) {
      setState({ status: 'error', message: 'Não foi possível carregar o serviço de login. O app continua funcionando.' });
      return null;
    }
  }

  function applySession(session) {
    var user = session && session.user ? session.user : null;
    if (user) {
      setState({ user: user, status: 'signed_in', message: '' });
      // Remove tokens da URL/histórico após o Magic Link (higiene de segurança).
      try {
        if (location.hash && location.hash.indexOf('access_token=') >= 0 && typeof history !== 'undefined' && history.replaceState) {
          history.replaceState(null, '', location.pathname + location.search);
        }
      } catch (e) {}
    } else {
      setState({ user: null, status: 'signed_out', message: '' });
    }
    if (typeof window !== 'undefined' && window.__sync && window.__sync.onAuth) window.__sync.onAuth();
  }

  async function init() {
    if (!state.configured) { setState({ status: 'disabled' }); return; }
    var client = await ensureClient();
    if (!client) return;
    try {
      var res = await client.auth.getSession();
      applySession(res && res.data ? res.data.session : null);
      if (!state.subscribed) {
        state.subscribed = true;
        client.auth.onAuthStateChange(function (event, session) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') applySession(session);
          else if (event === 'SIGNED_OUT') applySession(null);
        });
      }
    } catch (e) {
      setState({ status: 'error', message: 'Não foi possível verificar a sessão. O app continua funcionando.' });
    }
  }

  function friendlyError(err) {
    var m = String((err && err.message) || err || '').toLowerCase();
    if (m.indexOf('signups not allowed') >= 0 || m.indexOf('user not found') >= 0) {
      return 'Esta conta não está autorizada. Use o e-mail da conta principal.';
    }
    if (m.indexOf('rate limit') >= 0 || m.indexOf('too many') >= 0) {
      return 'Muitas tentativas. Aguarde alguns minutos.';
    }
    if (m.indexOf('invalid') >= 0) return 'E-mail inválido.';
    return 'Não foi possível enviar o link agora. Tente novamente.';
  }

  async function sendMagicLink(email) {
    email = String(email == null ? '' : email).trim();
    if (!email) { setState({ status: 'error', message: 'Informe seu e-mail.' }); return; }
    if (!isOnline()) { setState({ status: 'offline', message: 'Sem conexão. Tente novamente quando estiver online.' }); return; }
    setState({ status: 'sending', message: 'Enviando link…' });
    var client = await ensureClient();
    if (!client) return;
    try {
      var res = await client.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectUrl() }
      });
      if (res && res.error) { setState({ status: 'error', message: friendlyError(res.error) }); return; }
      setState({ status: 'sent', message: 'Link enviado. Abra seu e-mail e clique no link para entrar.' });
    } catch (e) {
      setState({ status: 'error', message: 'Falha de rede ao enviar o link. Tente novamente.' });
    }
  }

  async function logout() {
    var client = state.client || await ensureClient();
    if (client) { try { await client.auth.signOut(); } catch (e) {} }
    setState({ user: null, status: 'signed_out', message: 'Sessão encerrada. Seus dados locais foram mantidos.' });
  }

  function section(inner) {
    return '<div class="section-group"><h3 style="margin-top:0">Conta</h3>' + inner + '</div>';
  }

  function authSectionHTML(s) {
    if (!s.configured) {
      return section('<div class="msg">Autenticação ainda não configurada neste dispositivo. Preencha <b>supabase-config.js</b> com a URL e a chave publishable do projeto.</div>');
    }
    if (s.status === 'signed_in' && s.user) {
      var email = esc(s.user.email || '');
      return section(
        '<div class="msg">Conectado como <b>' + email + '</b>.</div>' +
        '<div class="acts" style="margin-top:6px"><button data-a="authLogout">Sair</button></div>' +
        '<div class="msg">Sair encerra apenas a sessão. Suas tarefas, projetos e configurações locais permanecem.</div>'
      );
    }
    var message = s.message
      ? '<div class="msg"' + (s.status === 'error' ? ' style="color:var(--er)"' : '') + '>' + esc(s.message) + '</div>'
      : '';
    var sending = s.status === 'sending' || s.status === 'loading';
    return section(
      '<div class="msg">Entre com um link enviado por e-mail. O acesso é restrito à sua conta.</div>' +
      message +
      '<div class="form" style="margin-top:8px"><label class="full">E-mail<input id="authEmail" type="email" autocomplete="email" placeholder="seu@email.com"></label></div>' +
      '<div class="acts" style="margin-top:6px"><button data-a="authSendLink"' + (sending ? ' disabled' : '') + '>Enviar link de acesso</button></div>' +
      '<div class="msg">Você pode continuar usando o Ateliê offline e sem login; a conta será usada na futura sincronização.</div>'
    );
  }

  function authSection() { return authSectionHTML(state); }

  window.authSection = authSection;
  window.authSendMagicLink = sendMagicLink;
  window.authLogout = logout;
  window.__auth = {
    getState: function () { return Object.assign({}, state, { client: undefined }); },
    getClient: function () { return ensureClient(); },
    sendMagicLink: sendMagicLink,
    logout: logout,
    init: init,
    _html: authSectionHTML
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', function () { if (state.configured) init(); });
    window.addEventListener('offline', function () { if (!state.user) setState({ status: 'offline', message: 'Sem conexão. O app continua funcionando offline.' }); });
  }
})();
