// =========================================================
// SUPABASE — configuração do cliente (Fase 2: autenticação)
// =========================================================
// Preencha com os dados do SEU projeto Supabase.
// Use SOMENTE a chave publishable/anon (ela é pública por design).
// NUNCA coloque a chave service_role neste arquivo nem no frontend.
//
// Onde encontrar:
//   Supabase → Project Settings → API → Project URL / anon public key.
//
// redirectTo (opcional): URL para onde o Magic Link volta.
//   Se vazio, o app usa a URL atual (origin + pathname).
//   Essa URL precisa estar em Authentication → URL Configuration →
//   Redirect URLs (ex.: https://seu-usuario.github.io/atelier/).
window.ATELIER_SUPABASE = {
  url: 'https://bbhuetsvvqpglzmmoape.supabase.co',
  anonKey: 'sb_publishable_tX1EorV9DQKGU7A3m_f-ew_NUAQw5lf',
  redirectTo: 'https://capiel123.github.io/atelier/'
};
