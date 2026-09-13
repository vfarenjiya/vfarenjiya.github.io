import { ROUTES, initRouter, currentRoute, navigate } from './router.js';
import { subscribe, STORAGE_FULL } from './store.js';
import { mountBottomNav } from './components/bottom-nav.js';
import { installDismissers } from './components/dismiss.js';
import { renderHabits } from './views/habits-view.js';
import { renderInsights } from './views/insights-view.js';
import { renderCoach } from './views/coach-view.js';
import { renderProfile } from './views/profile-view.js';
import { openHabitForm } from './features/habit-form.js';
import { startReminders } from './features/reminders.js';
import { initInstall } from './features/install.js';
import { initUpdater } from './features/updater.js';
import { updateBadge } from './features/badge.js';
import { syncThemeChrome, THEME_EVENT } from './features/theme.js';
import { clear } from './utils/dom.js';
import { toast } from './components/toast.js';

const VIEWS = { '/habits': renderHabits, '/insights': renderInsights, '/coach': renderCoach, '/profile': renderProfile };
const viewRoot = document.getElementById('view');

let lastRoute = null;
function render(route) {
  const routeChanged = route !== lastRoute;
  lastRoute = route;
  clear(viewRoot);
  VIEWS[route](viewRoot);
  mountBottomNav(route);
  if (routeChanged) window.scrollTo(0, 0);
}

subscribe(() => render(currentRoute()));
subscribe(updateBadge);
updateBadge();
syncThemeChrome();                                   // v1.3: meta theme-color in sync at boot
window.addEventListener(THEME_EVENT, () => render(currentRoute()));   // refresh seg state everywhere

initRouter(render);
installDismissers();
initInstall();
initUpdater();
startReminders();

window.addEventListener('online', () => toast('back online'));
window.addEventListener('offline', () => toast('offline — everything still works'));
window.addEventListener(STORAGE_FULL, () =>
  toast('storage full — export a backup, then clear old data', { ms: 6000 }));

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (document.querySelector('.modal-overlay')) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); navigate('/habits'); openHabitForm(); return; }
  const i = ['1', '2', '3', '4'].indexOf(e.key);
  if (i > -1) { e.preventDefault(); navigate(ROUTES[i]); }
});

if (location.hash.includes('new=1')) {
  history.replaceState(null, '', location.pathname + location.search + '#/habits');
  openHabitForm();
}