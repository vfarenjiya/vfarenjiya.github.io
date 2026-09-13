// Theme lives in its OWN localStorage key (not the store) so the pre-paint inline
// script in index.html can read it with zero imports → no flash of wrong theme.
const KEY = 'habits-pwa:theme';
export const THEMES = ['black', 'white'];
export const THEME_EVENT = 'habits:theme';

const metaColor = (t) => (t === 'white' ? '#f2f2f0' : '#151716');

export function getTheme() {
  try { return localStorage.getItem(KEY) === 'white' ? 'white' : 'black'; }
  catch (e) { return 'black'; }
}
export function syncThemeChrome() {          // apply attribute + meta without events (boot path)
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', metaColor(t));
  return t;
}
export function setTheme(t) {
  const theme = THEMES.includes(t) ? t : 'black';
  try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode: session-only theme */ }
  syncThemeChrome();
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  return theme;
}