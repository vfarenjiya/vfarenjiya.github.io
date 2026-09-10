'use strict';

const CACHE_NAME = 'cliff-rl-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './env.js',
  './agent.js',
  './trainer-worker.js',
  './renderer.js',
  './chart.js',
  './playback.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return Promise.all(
          ASSETS.map(function (asset) {
            return cache.add(asset).catch(function () {
              // Ignore missing optional assets, e.g. icons not added yet.
            });
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(function (cachedResponse) {
        if (cachedResponse) {
          refreshCache(event.request);
          return cachedResponse;
        }

        return fetchAndCache(event.request);
      })
  );
});

function refreshCache(request) {
  fetchAndCache(request).catch(function () {
    // Offline refresh failures are expected.
  });
}

function fetchAndCache(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200) {
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, response.clone());
      });
    }

    return response;
  }).catch(function () {
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }

    return Response.error();
  });
}