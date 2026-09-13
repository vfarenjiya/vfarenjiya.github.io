import { h } from '../utils/dom.js';
import { WEEKDAY_LETTERS } from '../utils/date.js';
import { heatmapColumns } from '../stats.js';

export function heatmap(state, weeks = 10) {
  const letters = h('div', { class: 'hm-letters', 'aria-hidden': 'true' },
    ...WEEKDAY_LETTERS.map((l) => h('span', { class: 'hm-letter' }, l)));
  const cols = heatmapColumns(state, weeks).map((col) =>
    h('div', { class: 'hm-col' },
      h('span', { class: 'hm-label' }, col.label),
      ...col.days.map((cell) => cell
        ? h('div', { class: `hm-cell l${cell.level}`, title: cell.key })
        : h('div', { class: 'hm-cell empty' }))));
  return h('div', { class: 'heatmap', role: 'img', 'aria-label': 'overall completion calendar' }, letters, ...cols);
}