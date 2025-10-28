const CACHE_VERSION = "v6";
const CACHE_NAME = `baking-timer-${CACHE_VERSION}`;

const urlsToCache = [
  '/breads/timer.html',
  '/breads/styles.css',
  '/breads/scripts.js',
  '/breads/manifest.json',
  '/breads/breadroll.png',
  // Sounds — always kept
  '/breads/sounds/alarmdigital.mp3',
  '/breads/sounds/huntrix_golden.mp3',
  '/breads/sounds/SodaPop.mp3',
  '/breads/sounds/timer1.mp3',
  '/breads/sounds/timer2.mp3',
  '/breads/sounds/timer3.mp3'
];

// INSTALL — Precache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets...');
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// ACTIVATE — Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('🧹 Removing old cache:', key);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// FETCH — Offline-first for all sound files
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);

  // Always serve sounds from cache first
  if (requestURL.pathname.startsWith('/breads/sounds/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return resp;
        }).catch(() => {
          console.warn('⚠️ Sound file missing offline:', event.request.url);
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Normal requests — cache-first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
