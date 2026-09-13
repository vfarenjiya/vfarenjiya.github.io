// v1.5 — honest storage card: app data / on-disk / 300 MB budget / capped quota; import pre-flight
import { h } from '../utils/dom.js';
import { getState, replaceAll, clearAll } from '../store.js';
import { promptInstall } from '../features/install.js';
import { checkForUpdates } from '../features/updater.js';
import { requestNotificationPermission } from '../features/reminders.js';
import { getTheme, setTheme } from '../features/theme.js';
import { STORAGE_BUDGET, fmtBytes, cappedQuota, byteLength } from '../utils/bytes.js';
import { toast } from '../components/toast.js';

function exportData() {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importData(file) {
  if (file.size > STORAGE_BUDGET) { toast(`backup exceeds the ${fmtBytes(STORAGE_BUDGET)} app budget`); return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !Array.isArray(data.habits)) throw new Error('bad shape');
      replaceAll(data);
      toast('backup restored');
    } catch (e) { toast('invalid backup file'); }
  };
  reader.readAsText(file);
}

export function renderProfile(root) {
  const cur = getTheme();
  const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none',
    onchange: (e) => e.target.files[0] && importData(e.target.files[0]) });

  /* ---- storage card (v1.5 layout + budget) ---- */
  const appBytes = byteLength(JSON.stringify(getState()));
  const line1 = h('p', { class: 'muted' }, `app data: ${fmtBytes(appBytes)} · measuring on-disk footprint…`);
  const line2 = h('p', { class: 'muted' }, `app budget: ${fmtBytes(STORAGE_BUDGET)}`);
  navigator.storage?.estimate?.()
    .then((e) => {
      line1.textContent = `app data: ${fmtBytes(appBytes)} · on disk incl. cache: ${fmtBytes(e.usage || 0)}`;
      const real = Number.isFinite(e.quota) ? e.quota : null;
      const capped = cappedQuota(real);
      line2.textContent = `app budget: ${fmtBytes(STORAGE_BUDGET)} · quota shown: ${fmtBytes(capped)}` +
        (real !== null && real > STORAGE_BUDGET ? ' (cap applied — browser offers more)' : '');
    })
    .catch(() => { line1.textContent = `app data: ${fmtBytes(appBytes)}`; });

  const persistVal = h('span', { class: 'metric-sm' }, '…');
  navigator.storage?.persisted?.().then((p) => { persistVal.textContent = p ? 'yes' : 'no'; })
    .catch(() => { persistVal.textContent = 'n/a'; });

  root.append(
    h('h1', { class: 'view-title' }, 'profile'),
    h('div', { class: 'card profile-row' },
      h('div', {},
        h('h3', {}, 'app'),
        h('p', { class: 'muted' }, `v1.5.0 · ${navigator.onLine ? 'online' : 'offline'} · data stays on this device`),
        h('p', { class: 'muted' }, 'shortcuts: n = new habit · 1–4 = switch tabs')),
      h('button', { type: 'button', class: 'btn-primary', onclick: async () => {
          if (await promptInstall()) toast('installed ✓');
          else toast('use browser menu → "install app" if no prompt appears');
        } }, 'install app')),

    h('div', { class: 'card profile-row' },
      h('div', {},
        h('h3', {}, 'appearance'),
        h('p', { class: 'muted' }, 'black or white — applies instantly, persists across restarts')),
      h('div', { class: 'seg theme-seg', role: 'group', 'aria-label': 'theme' },
        h('button', { type: 'button', class: 'seg-btn' + (cur === 'black' ? ' active' : ''),
          'aria-pressed': cur === 'black', onclick: () => setTheme('black') }, 'black'),
        h('button', { type: 'button', class: 'seg-btn' + (cur === 'white' ? ' active' : ''),
          'aria-pressed': cur === 'white', onclick: () => setTheme('white') }, 'white'))),

    /* v1.5: stacked, unambiguous storage card */
    h('div', { class: 'card storage-card' },
      h('h3', {}, 'storage'),
      line1,
      line2,
      h('p', { class: 'muted' }, 'persisted: ', persistVal),
      h('div', { class: 'row-gap' },
        h('button', { type: 'button', class: 'btn-ghost', onclick: async () => {
            const ok = await navigator.storage?.persist?.();
            toast(ok ? 'storage persisted ✓' : 'browser declined persistence');
            persistVal.textContent = ok ? 'yes' : 'no';
          } }, 'request persistence'))),

    h('div', { class: 'card profile-row' },
      h('div', {}, h('h3', {}, 'updates'), h('p', { class: 'muted' }, 'new versions toast a reload button when downloaded')),
      h('button', { type: 'button', class: 'btn-ghost', onclick: () => checkForUpdates() }, 'check now')),
    h('div', { class: 'card profile-row' },
      h('div', {}, h('h3', {}, 'notifications'), h('p', { class: 'muted' }, 'reminders fire while the app is open')),
      h('button', { type: 'button', class: 'btn-ghost', onclick: () => requestNotificationPermission() }, 'enable')),
    h('div', { class: 'card profile-row' },
      h('div', {}, h('h3', {}, 'backup'), h('p', { class: 'muted' }, 'export / import your data as JSON')),
      h('div', { class: 'row-gap' },
        h('button', { type: 'button', class: 'btn-ghost', onclick: exportData }, 'export'),
        h('button', { type: 'button', class: 'btn-ghost', onclick: () => file.click() }, 'import'), file)),
    h('div', { class: 'card profile-row' },
      h('div', {}, h('h3', {}, 'danger zone'), h('p', { class: 'muted' }, 'erase habits and history on this device')),
      h('button', { type: 'button', class: 'btn-ghost danger', onclick: () => { if (confirm('erase ALL data?')) clearAll(); } }, 'clear all')));
}