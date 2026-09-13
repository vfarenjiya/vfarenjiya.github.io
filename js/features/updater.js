import { toast } from '../components/toast.js';

export function initUpdater() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => {
          // installed AND we have a controller ⇒ this is an update, not first install
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('update downloaded', { ms: 10000, actionLabel: 'reload', onAction: () => location.reload() });
          }
        });
      });
    } catch (e) {
      console.warn('SW registration failed — serve over http(s) or localhost', e);
    }
  });
}
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) { toast('service workers unsupported here'); return; }
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) { toast('service worker not registered yet'); return; }
  toast('checking for updates…');
  await reg.update();
}