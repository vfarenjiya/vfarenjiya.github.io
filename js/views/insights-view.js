import { h } from '../utils/dom.js';
import { getState } from '../store.js';
import { todaySummary, monthCompletedDays, overallLongestStreak, habitStats, lastNDays } from '../stats.js';
import { heatmap } from '../components/heatmap.js';
import { statCard } from '../components/stat-card.js';
import { sparkline } from '../components/sparkline.js';
import { fmtLong, fromKey } from '../utils/date.js';

export function renderInsights(root) {
  const state = getState();
  const today = todaySummary(state);
  root.append(
    h('h1', { class: 'view-title' }, 'insights'),
    h('h2', { class: 'section-title' }, 'overall completion'),
    heatmap(state, 10),
    h('div', { class: 'legend' }, h('span', {}, 'Less'),
      ...[0, 1, 2, 3, 4].map((l) => h('span', { class: `swatch l${l}` })), h('span', {}, 'More')),
    h('div', { class: 'stat-grid' },
      statCard('total habits', state.habits.length),
      statCard('longest streak', overallLongestStreak(state)),
      statCard('today', `${today.done}/${today.total}`),
      statCard('this month', monthCompletedDays(state))),
    h('h2', { class: 'section-title' }, 'habit breakdown'),
    ...state.habits.map((hb) => {
      const st = habitStats(state, hb);
      return h('div', { class: 'card breakdown' },
        h('h3', { class: 'breakdown-name' }, hb.name),
        h('div', { class: 'metrics' },
          h('div', {}, h('span', { class: 'stat-label' }, 'longest streak'), h('span', { class: 'metric' }, `${st.longest} days`)),
          h('div', {}, h('span', { class: 'stat-label' }, 'total'), h('span', { class: 'metric' }, String(st.total))),
          h('div', {}, h('span', { class: 'stat-label' }, 'started'), h('span', { class: 'metric' }, fmtLong(fromKey(st.started))))),
        sparkline(lastNDays(state, hb, 14)));
    }));
}