const VERSION = 'snake-v12';
const FONTS = 'cliff-walker-fonts-v1';
const CORE = ['./', './index.html', './style.css',
  './js/config.js', './js/audio.js', './js/net.js', './js/rl.js', './js/render.js', './js/ui.js',
  './manifest.json', './icon.svg', './icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit =>
      hit || fetch(req).then(res => {
        const cp = res.clone();
        caches.open(VERSION).then(c => c.put(req, cp));
        return res;
      }).catch(() => caches.match('./index.html'))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(c =>
      c.match(req).then(hit => hit || fetch(req, { mode: 'cors' }).then(res => {
        if (res.ok) c.put(req, res.clone());
        return res;
      }))));
  }
});