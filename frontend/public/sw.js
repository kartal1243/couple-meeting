// Service Worker - Arka plan çalma desteği
const CACHE_NAME = 'couple-meeting-v1';
const urlsToCache = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Arka planda ses çalarken sayfayı canlı tut
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push notification desteği (ileride kullanılabilir)
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
