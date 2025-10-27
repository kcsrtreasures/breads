const CACHE_NAME = 'baking-timer-v2';
const urlsToCache = [
  '/',
  '/breads/index.html',
  '/breads/styles.css',
  '/breads/scripts.js',
  '/breads/manifest.json',
  '/breads/breadroll.png',
  // Cache all your sounds
  '/breads/sounds/alarm digital.mp3',
  '/breads/sounds/huntrix_golden.mp3',
  '/breads/sounds/Soda Pop.mp3',
  '/breads/sounds/timer1.mp3',
  '/breads/sounds/timer2.mp3',
  '/breads/sounds/timer3.mp3'
];

// Activate immediately after install (optional but recommended)
self.skipWaiting();

// Install and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching app shell & sounds');
      return cache.addAll(urlsToCache);
    })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((res) => {
          // Optionally cache new requests
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, res.clone());
            return res;
          });
        })
      );
    })
  );
});

// Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});
