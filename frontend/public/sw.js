// Service Worker - Arka plan çalma ve önbellek yönetimi
const CACHE_NAME = 'couple-meeting-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// Arka planda ses ve API isteklerini engellemeden canlı akıt
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Müzik ses akışlarını, API çağrılarını ve oda bağlantılarını Service Worker'dan muaf tut
  if (
    event.request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    url.searchParams.has('room') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.webm') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('youtube.com') ||
    event.request.headers.get('range')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return new Response('Ağ bağlantısı kurulamadı', { status: 408 });
      });
    })
  );
});

// Push notification desteği
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Couple Meeting', body: 'Yeni bir mesaj var!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/3076/3076753.png',
      vibrate: [200, 100, 200],
      tag: 'couple-meeting-notification',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('couple-meeting') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});