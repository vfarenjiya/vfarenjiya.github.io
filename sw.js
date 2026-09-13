const VERSION = '1.5.0';                 // bump on every release
const CACHE = `habits-${VERSION}`;
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './icons/icon.svg',
  './css/base.css', './css/components.css', './css/views.css',
  './js/main.js', './js/router.js', './js/store.js', './js/stats.js',
  './js/utils/dom.js', './js/utils/date.js', './js/utils/streaks.js', './js/utils/icons.js',
  './js/utils/bytes.js',
  './js/components/bottom-nav.js', './js/components/modal.js', './js/components/toast.js',
  './js/components/dismiss.js', './js/components/day-strip.js', './js/components/heatmap.js',
  './js/components/sparkline.js', './js/components/stat-card.js',
  './js/features/habit-form.js', './js/features/reminders.js', './js/features/install.js',
  './js/features/coach.js', './js/features/updater.js', './js/features/badge.js',
  './js/features/theme.js',
  './js/views/habits-view.js', './js/views/insights-view.js',
  './js/views/coach-view.js', './js/views/profile-view.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
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
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
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