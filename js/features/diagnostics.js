export async function collectDiagnostics() {
  const d = {
    secure: window.isSecureContext,
    host: location.protocol + '//' + location.host,
    swSupported: 'serviceWorker' in navigator,
    swState: null,
    manifestOk: null,
    missingIcons: [],
    storagePersisted: null
  };
  if (d.swSupported) {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    d.swState = reg ? (reg.active ? 'active' : reg.waiting ? 'waiting' : reg.installing ? 'installing' : 'redundant') : 'none';
  }
  try {
    const res = await fetch('./manifest.json', { cache: 'no-store' });
    d.manifestOk = res.ok;
    if (res.ok) {
      const man = await res.json();
      for (const ic of man.icons || []) {
        const r = await fetch(ic.src, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
        if (!r || !r.ok) d.missingIcons.push(ic.src);
      }
    }
  } catch (e) { d.manifestOk = false; }
  try { d.storagePersisted = (await navigator.storage?.persisted?.()) ?? null; } catch (e) {}
  return d;
}

export function verdicts(d) {
  const v = [];
  v.push(d.secure
    ? { level: 'ok', text: `secure context (${d.host})` }
    : { level: 'bad', text: `INSECURE context (${d.host}) — service workers & install require HTTPS or localhost` });
  v.push(d.swSupported
    ? { level: 'ok', text: 'browser supports service workers' }
    : { level: 'bad', text: 'browser lacks service worker support' });
  v.push({ level: d.swState === 'active' ? 'ok' : (d.swState === 'waiting' || d.swState === 'installing') ? 'warn' : 'bad',
    text: `service worker: ${d.swState || 'none'}` });
  v.push(d.manifestOk ? { level: 'ok', text: 'manifest reachable' } : { level: 'bad', text: 'manifest NOT reachable' });
  v.push(d.missingIcons.length
    ? { level: 'warn', text: `missing icon files: ${d.missingIcons.join(', ')}` }
    : { level: 'ok', text: 'manifest icons present' });
  v.push({ level: 'ok', text: `storage persisted: ${d.storagePersisted === null ? 'n/a' : d.storagePersisted ? 'yes' : 'no'}` });
  return v;
}

export function fixHints(d) {
  const hints = [];
  if (!d.secure) {
    hints.push('On the hosting machine, open http://localhost:8000 — localhost is always secure.');
    hints.push('Phone testing: `adb reverse tcp:8000 tcp:8000` then http://localhost:8000 on the phone, or an HTTPS tunnel (localtunnel/cloudflared).');
    hints.push('Dev-only: chrome://flags → "Insecure origins treated as secure" → add your origin.');
  }
  if (d.secure && d.swSupported && (d.swState === 'none' || d.swState === 'redundant')) {
    hints.push('Registration failed earlier — tap "retry registration" in Updates, then watch DevTools → Console.');
  }
  if (d.missingIcons.length) {
    hints.push('Icons are optional (SVG-only installs fine). For PNG/iOS polish, deploy via the GitHub Actions workflow.');
  }
  if (!d.manifestOk) hints.push('Ensure manifest.json sits next to index.html and returns 200.');
  return hints;
}
