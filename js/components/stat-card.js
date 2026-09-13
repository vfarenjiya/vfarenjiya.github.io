import { h } from '../utils/dom.js';
export const statCard = (label, value) =>
  h('div', { class: 'card stat-card' }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-value' }, String(value)));