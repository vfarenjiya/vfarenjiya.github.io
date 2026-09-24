const CACHE   = 'gate-quest-ig-v9';
const RUNTIME = 'gate-quest-runtime-v9';

const PRECACHE = [
  './', './index.html', './insta.css', './data.js', './app.js',
  './mock.js', './feed.js', './manifest.json', './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // 1) Navigation → network-first, offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2) CDN (KaTeX + webfonts) → stale-while-revalidate
  const cdn = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
  if (cdn.includes(url.origin)) {
    e.respondWith(
      caches.open(RUNTIME).then(cache =>
        cache.match(request).then(hit => {
          const network = fetch(request).then(res => {
            if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
            return res;
          }).catch(() => hit);
          return hit || network;
        })
      )
    );
    return;
  }

  // 3) Same-origin assets → cache-first + background refresh
  e.respondWith(
    caches.match(request).then(hit => {
      const network = fetch(request).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(RUNTIME).then(c => c.put(request, cp)); }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});