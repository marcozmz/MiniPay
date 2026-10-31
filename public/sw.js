// Only this public, data-free page may enter Cache Storage. Never cache the app,
// API, authentication, CSV, requests with mutations, or user-specific responses.
const OFFLINE_CACHE = 'minimercado-offline-v1';
const OFFLINE_URL = '/offline.html';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE_URL, { cache: 'reload', credentials: 'omit' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Offline page unavailable');
    const cache = await caches.open(OFFLINE_CACHE);
    await cache.put(OFFLINE_URL, response);
  })());
  // No skipWaiting: an update waits until all previous app windows are closed.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('minimercado-offline-') && name !== OFFLINE_CACHE).map(name => caches.delete(name)));
  })());
  // No clients.claim or reload messages; open forms stay untouched.
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname === '/api' || url.pathname.startsWith('/api/') || request.mode !== 'navigate') return;
  event.respondWith((async () => {
    try { return await fetch(request, { cache: 'no-store' }); }
    catch {
      const cache = await caches.open(OFFLINE_CACHE);
      return await cache.match(OFFLINE_URL) || new Response('Sem conexão. Operações indisponíveis. Reconecte-se para continuar.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
  })());
});
