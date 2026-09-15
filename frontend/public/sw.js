const CACHE_NAME = 'couple-meeting-v3';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.add('/index.html').catch(() => {}))
            .catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .catch(() => {})
            .then(() => self.clients.claim())
    );
});

function isAsset(url) {
    return /\/assets\/[^/]+\.(js|css|png|jpg|svg|woff2?)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.includes('/api/') || url.pathname.includes('/socket.io/')) return;
    if (event.request.method !== 'GET') return;

    // Hash'li dosyalar degismez: cache-first
    if (isAsset(url)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
                    }
                    return response;
                }).catch(() => caches.match(event.request));
            })
        );
        return;
    }

    // Navigasyon + index.html: network-first, duserse cache'teki app shell
    if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put('/index.html', clone).catch(() => {});
                    }).catch(() => {});
                }
                return response;
            }).catch(() =>
                caches.match('/index.html').then((cached) => {
                    if (cached) return cached;
                    return new Response(
                        '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Couple Meeting</title><style>body{background:#0a0118;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style></head><body><div style="text-align:center"><div style="font-size:40px">📡</div><p>Bağlantı kurulamadı.</p><button onclick="location.reload()" style="padding:10px 24px;border-radius:10px;border:none;background:#7c3aed;color:#fff;font-size:15px">Tekrar Dene</button></div></body></html>',
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                })
            )
        );
        return;
    }

    // Diger GET istekleri: cache-first, yoksa network
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
    );
});
