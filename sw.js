const CACHE_NAME = 'tracker-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './data.js',
  './app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
