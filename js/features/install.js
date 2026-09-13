let deferred = null;
export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    window.dispatchEvent(new Event('install-available'));
  });
  window.addEventListener('appinstalled', () => { deferred = null; });
}
export const installAvailable = () => !!deferred;
export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  return choice.outcome === 'accepted';
}
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export function installReason() {
  if (deferred) return null;
  if (!window.isSecureContext) return `install needs HTTPS or localhost — you're on ${location.protocol}//${location.host}`;
  if (!('serviceWorker' in navigator)) return 'install needs service worker support';
  return null;
}
