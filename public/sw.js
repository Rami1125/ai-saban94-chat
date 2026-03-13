const CACHE_NAME = 'saban-full-v2';
const APP_ROUTES = [
  '/',
  '/admin/master',
  '/admin/dispatch',
  '/admin/inventory',
  '/manifest.json'
];

// התקנה - שומר את כל נתיבי האפליקציה בזיכרון
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ROUTES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ניהול בקשות - תומך בכל הנתיבים תחת ה-Root
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || caches.match('/admin/master');
    })
  );
});
