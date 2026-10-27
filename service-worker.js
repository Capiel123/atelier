// =========================================================
// SERVICE WORKER — Atelier
// Guarda os arquivos do app para funcionar offline e
// gerencia a atualização quando você publica uma versão nova.
// =========================================================

// ⚠️ IMPORTANTE: sempre que alterar QUALQUER arquivo do app
// (CSS, JS, HTML), mude esta versão. É o "carimbo" que avisa
// o navegador de que existe algo novo para baixar.
// 💡 Regra prática: use a data de hoje + um sufixo se publicar
// mais de uma vez no mesmo dia.
const CACHE_VERSION = 'atelier-2026-10-27-v33';

// Dois caches separados:
// - SHELL: arquivos fixos do app (HTML, CSS, JS) baixados na instalação
// - RUNTIME: reservado para uso futuro (ex: cachear dados de API)
const SHELL_CACHE = 'shell-' + CACHE_VERSION;
const RUNTIME_CACHE = 'runtime-' + CACHE_VERSION;

// Lista de arquivos baixados no primeiro acesso.
// 💡 Adicione aqui qualquer arquivo novo essencial para offline.
// ⚠️ ORDEM NÃO IMPORTA AQUI (o precache é paralelo), mas mantenha
//    todos os JS na lista — se faltar um, o app quebra offline.
const SHELL_ASSETS = [
  './',
  './index.html',
  './base.css',
  './layout.css',
  './componentes.css',
  './paginas.css',
  './responsivo.css',
  './estado.js',
  './logica.js',
  './interface.js',
  './app.js',
  './supabase-config.js',
  './auth.js',
  './onboarding.js',
  './import-data.js',
  './merge.js',
  './sync.js',
  './manifest.json'
];

// ---------------------------------------------------------
// INSTALAÇÃO — baixa os arquivos para o cache
// ---------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Assume o controle imediatamente (sem esperar fechar abas)
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      // Baixa um por um: se um arquivo falhar (ex: 404), os outros continuam.
      // 💡 Isso evita que UM arquivo com nome errado quebre a instalação inteira.
      return Promise.all(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('Falha ao cachear:', url, err))
        )
      );
    })
  );
});

// ---------------------------------------------------------
// ATIVAÇÃO — limpa caches antigos e toma controle das abas
// ---------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      // Deleta qualquer cache que NÃO seja o shell/runtime atuais.
      // 💡 É isso que faz a "versão velha" sumir do celular do usuário.
      keys
        .filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ---------------------------------------------------------
// FETCH — estratégia de download
// - Navegação (abrir o app): network-first, cai pro cache offline
// - Arquivos estáticos (CSS/JS/imagens): cache-first (usa o precache)
// ---------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignora qualquer coisa que não seja GET (POST, PUT, etc.)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignora CDNs externas (Google Fonts, etc.) — só trata o próprio site
  if (url.origin !== self.location.origin) return;

  // ---- 1) NAVEGAÇÃO: network-first ----------------------------------
  // Tenta a versão mais nova; se offline, serve o index do cache.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req, fresh.clone()); // fire-and-forget: atualiza em background
        return fresh;
      } catch {
        // Offline: usa o cache. Se não achar, cai pro index.html (SPA).
        return (await caches.match(req)) || caches.match('./index.html');
      }
    })());
    return; // ⬅️ IMPORTANTE: sem isso, o handler abaixo também rodaria
  }

  // ---- 2) ESTÁTICOS: cache-first ------------------------------------
  // CSS, JS, ícones, manifest: serve do precache (rápido + offline).
  // Se não estiver em cache (arquivo novo ou 404), tenta rede e guarda.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

// ---------------------------------------------------------
// MENSAGENS — permite forçar ativação pelo app, se quiser
// ---------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});