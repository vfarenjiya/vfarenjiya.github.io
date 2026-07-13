const CACHE_NAME = 'tracker-cache-v1';
const ASSETS = [
  './',
  './index.html',
  // Add paths to your CSS, JS, or fonts here if separated
];

// Install stage: cache files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Fetch stage: serve from cache if offline
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});