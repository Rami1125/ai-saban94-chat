// --- 1. מאזין הודעות (חובה בשורה הראשונה - JS נקי) ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  console.log("📩 [SW] Message Received:", event.data);
});

// --- 2. הגדרות Cache ונתיבים ---
const CACHE_NAME = 'saban-full-v5'; 
const APP_ROUTES = [
  '/',
  '/admin/master',
  '/admin/dispatch',
  '/admin/inventory',
  '/manifest.json',
  '/placeholder.svg'
];

// --- 3. התקנה ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📥 [SW] Caching Core Routes...");
      return cache.addAll(APP_ROUTES);
    })
  );
  self.skipWaiting();
});

// --- 4. אקטיבציה ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
  console.log("✅ [SW] Activated and Ready.");
});

// --- 5. ניהול בקשות (Fetch) ---
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' || 
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('onesignal')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate') {
          return (await caches.match('/admin/master')) || (await caches.match('/'));
        }

        if (event.request.destination === 'image') {
          return (await caches.match('/placeholder.svg')) || new Response('', { status: 404 });
        }

        return new Response('Network Offline - SabanOS', { 
          status: 408, 
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
