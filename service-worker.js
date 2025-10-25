const CACHE_NAME = "baking-timer-v3";
const ASSETS = [
  "./",
  "./timer.html",
  "./breadroll.png",
  "./logo4.png",
  "./manifest.json",
  "./alarm digital.mp3",
  "./huntrix_golden.mp3",
  "./Soda Pop.mp3",
  "./timer1.mp3",
  "./timer2.mp3",
  "./timer3.mp3",

];

// Activate immediately after install (optional but recommended)
self.skipWaiting();

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});


self.addEventListener("install", (e) => {
  console.log("📦 Service Worker installing...");
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
