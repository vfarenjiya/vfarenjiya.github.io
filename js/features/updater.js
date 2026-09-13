import { toast } from '../components/toast.js';

const watched = new WeakSet();
function watch(reg) {
  if (watched.has(reg)) return;
  watched.add(reg);
  reg.addEventListener('updatefound', () => {
    const nw = reg.installing; if (!nw) return;
    nw.addEventListener('statechange', () => {
      if (nw.state === 'installed' && navigator.serviceWorker.controller) {
        toast('update downloaded', { ms: 10000, actionLabel: 'reload', onAction: () => location.reload() });
      }
    });
  });
}
function register() {
  return navigator.serviceWorker.register('./sw.js')
    .then((reg) => { watch(reg); return reg; })
    .catch((e) => { console.warn('SW registration failed:', e); return null; });
}
export function initUpdater() { if ('serviceWorker' in navigator) register(); }
export function reasonNoSw() {
  if (!('serviceWorker' in navigator)) return 'this browser has no service worker support';
  if (!window.isSecureContext) return `service workers need HTTPS or localhost — you're on ${location.protocol}//${location.host}`;
  return 'registration failed — see DevTools → Console/Network for sw.js errors';
}
export async function retryRegistration() {
  if (!('serviceWorker' in navigator)) { toast(reasonNoSw(), { ms: 7000 }); return false; }
  const reg = await register();
  toast(reg ? 'service worker registered ✓' : reasonNoSw(), { ms: 7000 });
  return !!reg;
}
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) { toast(reasonNoSw(), { ms: 7000 }); return; }
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || (!reg.active && !reg.waiting && !reg.installing)) {
    toast(reasonNoSw() + ' — try "retry registration"', { ms: 7000 });
    return;
  }
  toast('checking for updates…');
  await reg.update();
}
