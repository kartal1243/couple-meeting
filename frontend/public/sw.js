self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/stream/')) {
    e.respondWith(fetch(e.request));
  }
});
