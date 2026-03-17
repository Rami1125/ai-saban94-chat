const CACHE_NAME = 'saban-full-v3';
const APP_ROUTES = [
  '/',
  '/admin/master',
  '/admin/dispatch',
  '/admin/inventory',
  '/manifest.json',
  '/placeholder.svg'
];

// התקנה - שמירת נכסי הליבה ב-Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ROUTES);
    })
  );
  self.skipWaiting();
});

// אקטיבציה - ניקוי גרסאות Cache ישנות
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

// ניהול בקשות (Fetch)
self.addEventListener('fetch', (event) => {
  // התעלמות מבקשות שאינן GET או בקשות של תוספי דפדפן
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // אם התגובה תקינה, נחזיר אותה כפי שהיא
        return response;
      })
      .catch(async () => {
        // במידה ואין חיבור רשת (Offline)
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // טיפול בנתיבי ניווט (דפי HTML) - החזרת עמוד הניהול כ-Fallback
        if (event.request.mode === 'navigate') {
          return (await caches.match('/admin/master')) || (await caches.match('/'));
        }

        // טיפול בתמונות שנכשלו - החזרת פלייסחולדר במקום שגיאה
        if (event.request.destination === 'image') {
          return (await caches.match('/placeholder.svg')) || new Response('', { status: 404 });
        }

        // במקרה של שגיאה גנרית, נחזיר Response ריק עם סטטוס שגיאה תקין
        return new Response('Network Error', { 
          status: 408, 
          statusText: 'Network Error',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
