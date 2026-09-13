// v1.2 — body scroll lock, Tab focus trap, focus restore on close
import { h, clear } from '../utils/dom.js';

export function openModal({ title, subtitle, content }) {
  const root = document.getElementById('modal-root');
  const prevFocus = document.activeElement;

  const close = () => {
    clear(root);
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey, true);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  };
  function focusables() {
    return [...root.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.getClientRects().length);
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const sheet = h('div', { class: 'modal-sheet', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'modal-head' },
      h('div', {}, h('h2', { class: 'modal-title' }, title), h('p', { class: 'modal-sub' }, subtitle)),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'close', onclick: close },
        h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' }))),
    content);

  root.replaceChildren(h('div', { class: 'modal-overlay', onclick: (e) => { if (e.target.classList.contains('modal-overlay')) close(); } }, sheet));
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onKey, true);
  return { close };
}