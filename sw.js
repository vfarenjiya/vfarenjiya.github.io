const VERSION = '1.7.2';                 // bump on every release
const CACHE = `habits-${VERSION}`;
const APP_SHELL = [
  './', './index.html', './manifest.json', './icons/icon.svg',
  './css/base.css', './css/components.css', './css/views.css',
  './js/main.js', './js/router.js', './js/store.js', './js/stats.js',
  './js/utils/dom.js', './js/utils/date.js', './js/utils/streaks.js', './js/utils/icons.js',
  './js/utils/bytes.js',
  './js/components/bottom-nav.js', './js/components/modal.js', './js/components/toast.js',
  './js/components/dismiss.js', './js/components/day-strip.js', './js/components/heatmap.js',
  './js/components/sparkline.js', './js/components/stat-card.js',
  './js/features/habit-form.js', './js/features/reminders.js', './js/features/install.js',
  './js/features/coach.js', './js/features/updater.js', './js/features/badge.js',
  './js/features/theme.js', './js/features/diagnostics.js',
  './js/views/habits-view.js', './js/views/insights-view.js',
  './js/views/coach-view.js', './js/views/profile-view.js'
];
/* Optional (exist only if CI generated them). Absence must never break install/offline. */
const OPTIONAL = ['./icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // v1.7.2: per-URL fetch with cache:'no-cache' instead of addAll().
    // addAll() can silently store STALE browser-HTTP-cache copies (Pages sends max-age=600);
    // explicit fetches revalidate (ETag → 304) so each cache version starts from server truth.
    caches.open(CACHE).then((c) =>
      Promise.all(APP_SHELL.map((u) =>
        fetch(u, { cache: 'no-cache' }).then((res) => {
          if (!res.ok) throw new Error('precache failed: ' + u);
          return c.put(u, res);
        })
      ))
    )
    .then(() => caches.open(CACHE).then((c) =>
      Promise.allSettled(OPTIONAL.map((u) =>
        fetch(u, { cache: 'no-cache' }).then((res) => { if (res.ok) return c.put(u, res); })
      ))))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
  );
});
