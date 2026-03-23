// --- 1. מאזין הודעות (חובה בשורה הראשונה למניעת שגיאת evaluation) ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }
  // לוג פנימי למלשינון הקונסולה
  console.log("📩 [SW] Message Received:", event.data);
});

// --- 2. הגדרות Cache ונתיבים ---
const CACHE_NAME = 'saban-full-v4'; // שדרוג גרסה לניקוי כפילויות
const APP_ROUTES = [
  '/',
  '/admin/master',
  '/admin/dispatch',
  '/admin/inventory',
  '/manifest.json',
  '/placeholder.svg'
];

// --- 3. התקנה - שמירת נכסי הליבה ---
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📥 [SW] Caching Core Routes...");
      return cache.addAll(APP_ROUTES);
    })
  );
  (self as any).skipWaiting();
});

// --- 4. אקטיבציה - ניקוי גרסאות ישנות ---
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  (self as any).clients.claim();
  console.log("✅ [SW] Activated and Ready.");
});

// --- 5. ניהול בקשות (Fetch) - אסטרטגיית Network First ---
self.addEventListener('fetch', (event: any) => {
  // התעלמות מבקשות שאינן GET או בקשות חיצוניות/תוספים
  if (
    event.request.method !== 'GET' || 
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('onesignal') // תן ל-OneSignal לנהל את עצמו
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // אם הצלחנו להביא מהרשת, נחזיר
        return response;
      })
      .catch(async () => {
        // אם אין רשת (Offline) - נחפש ב-Cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // Fallback לנתיבי ניווט (דפי HTML)
        if (event.request.mode === 'navigate') {
          return (await caches.match('/admin/master')) || (await caches.match('/'));
        }

        // Fallback לתמונות
        if (event.request.destination === 'image') {
          return (await caches.match('/placeholder.svg')) || new Response('', { status: 404 });
        }

        // שגיאת רשת גנרית
        return new Response('Network Offline - SabanOS', { 
          status: 408, 
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// --- 6. תמיכה ב-OneSignal (אופציונלי - אם הקובץ משמש כ-Root SW) ---
// @ts-ignore
if (typeof importScripts === 'function') {
    // importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
}
