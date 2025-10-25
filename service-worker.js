const CACHE_NAME = 'baking-timer-v3';
const FILES_TO_CACHE = [
  '/',
  '/timer.html',
  '/styles.css',
  '/scripts.js',
  '/breadroll.png',
  '/logo4.png',
  '/sounds/alarm digital.mp3',
  '/sounds/huntrix_golden.mp3',
  '/sounds/Soda Pop.mp3',
  '/sounds/timer1.mp3',
  '/sounds/timer2.mp3',
  '/sounds/timer3.mp3'
];

// Activate immediately after install (optional but recommended)
self.skipWaiting();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});