import { h } from '../utils/dom.js';
import { navigate } from '../router.js';

const ICONS = {
  '/habits': '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10"/>',
  '/insights': '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>',
  '/coach': '<rect x="5" y="9" width="14" height="10" rx="2"/><path d="M12 9V5"/><circle cx="12" cy="4" r="1.4"/><circle cx="9.5" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13.5" r="1" fill="currentColor" stroke="none"/>',
  '/profile': '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.6-4 5-6 8-6s6.4 2 8 6"/>'
};
const LABELS = { '/habits': 'habits', '/insights': 'insights', '/coach': 'coach', '/profile': 'profile' };

export function mountBottomNav(active) {
  const nav = document.getElementById('bottom-nav');
  nav.replaceChildren(...Object.keys(ICONS).map((route) =>
    h('button', {
      type: 'button',
      class: 'nav-btn' + (route === active ? ' active' : ''),
      'aria-label': LABELS[route],
      'aria-current': route === active ? 'page' : false,
      onclick: () => navigate(route)
    }, h('span', { class: 'nav-ico', html:
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[route]}</svg>` }))
  ));
}