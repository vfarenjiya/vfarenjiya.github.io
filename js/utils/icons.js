const P = {
  check: '<polyline points="20 6 9 17 4 12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  cap: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  flame: '<path d="M12 3c1 4 6 6.5 6 11a6 6 0 0 1-12 0c0-2.5 1.4-4.4 2.6-6.2C9.8 9.6 11 8 12 3z"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  heart: '<path d="M12 21S4 15.7 4 10a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 5.7-8 11-8 11z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  run: '<circle cx="13" cy="4" r="2"/><path d="M9 21l3-6 3 2 1-6 4 2"/><path d="M13 9l-4 2-2 4"/>'
};
export const ICON_KEYS = Object.keys(P);
export function iconEl(key = 'check', cls = 'ico') {
  const span = document.createElement('span');
  span.className = cls;
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[key] || P.check}</svg>`;
  return span;
}