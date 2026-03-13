const CACHE_NAME = 'saban-os-v1';
const ASSETS_TO_CACHE = [
  '/admin/master',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // הוסף כאן נתיבים לקבצי CSS/JS מרכזיים אם יש
];

// התקנה: שמירת קבצים בסיסיים
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// הפעלה: ניקוי קבצים ישנים
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// אסטרטגיה: "Network First, fallback to Cache"
// מנסה להביא מידע טרי, אם אין אינטרנט - לוקח מהזיכרון
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
