const CACHE_NAME = 'tracker-cache-v4';
const ASSETS = [
  './', './index.html', './styles.css', './data.js', './app.js',
  './manifest.json', './icon.svg',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/fonts/KaTeX_Main-Regular.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.log('Precache partial:', err))  // FIXED: one 404 no longer kills install
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => {
        const cp = res.clone();
        if (res.ok || res.type === 'opaque') caches.open(CACHE_NAME).then(c => c.put(e.request, cp));
        return res;
      }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)
      // FIXED: offline navigation falls back to index.html
    )
  );
});
