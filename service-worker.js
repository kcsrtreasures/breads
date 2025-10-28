const CACHE_VERSION = "v4";
const CACHE_NAME = `baking-timer-${CACHE_VERSION}`;

const urlsToCache = [
  '/breads/timer.html',
  '/breads/styles.css',
  '/breads/scripts.js',
  '/breads/manifest.json',
  '/breads/breadroll.png',
  // Cache all sounds permanently
  '/breads/sounds/alarmdigital.mp3',
  '/breads/sounds/huntrix_golden.mp3',
  '/breads/sounds/SodaPop.mp3',
  '/breads/sounds/timer1.mp3',
  '/breads/sounds/timer2.mp3',
  '/breads/sounds/timer3.mp3'
];

// ✅ INSTALL
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('📦 Caching Baking Timer assets...');
      await cache.addAll(urlsToCache);
      console.log('✅ All assets cached successfully.');
    }).catch(err => console.warn('⚠️ Caching failed:', err))
  );
  self.skipWaiting();
});

// ✅ ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ✅ FETCH
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response; // Serve from cache first

      return fetch(event.request)
        .then(async res => {
          // Cache new files fetched online
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => {
          // ⚠️ Offline fallback — let the page continue working
          console.log('📴 Offline: Resource not cached:', event.request.url);
          return new Response('', { status: 200 });
        });
    })
  );
});
