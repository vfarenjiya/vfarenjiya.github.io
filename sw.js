var CACHE_NAME = 'cliff-rl-v1';
var ASSETS = ['./', './index.html', './styles.css', './env.js', './agent.js', './trainer-worker.js', './renderer.js', './chart.js', './playback.js', './app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-192-maskable.png', './icons/icon-512-maskable.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return Promise.all(ASSETS.map(function (a) { return cache.add(a).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
    var fetched = fetch(event.request).then(function (res) {
      if (res && res.status === 200) { caches.open(CACHE_NAME).then(function (c) { c.put(event.request, res.clone()); }); }
      return res;
    }).catch(function () { return cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined); });
    return cached || fetched;
  }));
});