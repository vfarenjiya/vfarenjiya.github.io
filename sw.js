const CACHE_NAME = 'math-app-v1';

// List of all files the app needs to work offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './study.html',
  './manifest.json',
  './data/modules.json',
  './css/global.css',
  './css/study.css',
  './js/api.js',
  './js/render.js',
  './js/pwa-register.js',
  './js/math-config.js',
  './js/index-main.js',
  './js/study-main.js'
];

// Install event: Caches the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch event: Serves cached files if offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return the cached version if found, otherwise fetch from the network
      return response || fetch(event.request);
    })
  );
});
