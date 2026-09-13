import { h } from '../utils/dom.js';

export function toast(msg, { ms = 2600, actionLabel = null, onAction = null } = {}) {
  const root = document.getElementById('toast-root');
  const el = h('div', { class: 'toast', role: 'status' });
  el.append(document.createTextNode(msg));
  const dismiss = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 220); };
  if (actionLabel) {
    el.append(h('button', { type: 'button', class: 'toast-action', onclick: () => { onAction?.(); dismiss(); } }, actionLabel));
  }
  root.append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(dismiss, ms);
  return dismiss;
}