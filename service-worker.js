const CACHE_VERSION = 'atelier-2026-10-32'; // Data nova forçada
const SHELL_CACHE = 'shell-' + CACHE_VERSION;
const RUNTIME_CACHE = 'runtime-' + CACHE_VERSION;

// Removi os ícones daqui para garantir que não dê erro 404
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo SW a assumir imediatamente
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      // Tenta adicionar um por um. Se um falhar, ele ignora e continua.
      return Promise.all(
        SHELL_ASSETS.map(url => cache.add(url).catch(err => console.warn('Falha ao cachear:', url, err)))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req)) || caches.match('./index.html');
      }
    })());
    return;
  }

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

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});