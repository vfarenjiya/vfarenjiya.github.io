// v1.5 — renders the coach model: summary + pulse rows + actionable suggestions
import { h } from '../utils/dom.js';
import { getState, cycleCompletion } from '../store.js';
import { buildCoachModel, percent } from '../features/coach.js';
import { isDayComplete } from '../stats.js';
import { openHabitForm } from '../features/habit-form.js';
import { iconEl } from '../utils/icons.js';
import { dayKey, addDays } from '../utils/date.js';
import { toast } from '../components/toast.js';

function logToday(state, habitId) {
  const habit = state.habits.find((x) => x.id === habitId);
  if (!habit) return;
  if (isDayComplete(state, habit, dayKey())) return toast('already done today ✓');
  cycleCompletion(habitId, dayKey());
  toast('logged ✓');
}
function logYesterday(state, habitId) {
  const habit = state.habits.find((x) => x.id === habitId);
  if (!habit) return;
  const y = dayKey(addDays(new Date(), -1));
  if (isDayComplete(state, habit, y)) return toast('yesterday already complete ✓');
  cycleCompletion(habitId, y);
  toast('yesterday logged ✓');
}
function actionButton(action, state) {
  if (!action) return null;
  return h('button', {
    type: 'button', class: 'btn-ghost',
    onclick: () => {
      if (action.type === 'new-habit') openHabitForm();
      else if (action.type === 'edit') { const hb = state.habits.find((x) => x.id === action.habitId); if (hb) openHabitForm(hb); }
      else if (action.type === 'log-today') logToday(state, action.habitId);
      else if (action.type === 'makeup') logYesterday(state, action.habitId);
    }
  }, action.label);
}

export function renderCoach(root) {
  const state = getState();
  const m = buildCoachModel(state);

  root.append(
    h('h1', { class: 'view-title' }, 'coach'),
    h('p', { class: 'muted coach-intro' }, 'offline, rule-based guidance computed from your own data.'),
    h('div', { class: 'card coach-summary' },
      h('span', { class: 'stat-label' }, 'last 7 days'),
      h('span', { class: 'coach-big' }, percent(m.summary.thisWeek)),
      h('div', { class: 'bar', role: 'img', 'aria-label': `completion ${percent(m.summary.thisWeek)}` },
        h('i', { style: `width:${Math.round((m.summary.thisWeek || 0) * 100)}%` })),
      h('p', { class: 'muted' },
        `vs last week: ${m.summary.delta == null ? '—' : (m.summary.delta >= 0 ? '↑ +' : '↓ ') + Math.round(m.summary.delta * 100) + ' pts'}` +
        ` · ${m.summary.total} completions all-time · ${m.summary.habits} habit${m.summary.habits === 1 ? '' : 's'}`)));

  if (m.pulses.length) {
    root.append(h('h2', { class: 'section-title' }, 'habit pulse'),
      ...m.pulses.map((p) => h('div', { class: 'card pulse-card' },
        h('div', { class: 'pulse-id' },
          iconEl(p.habit.icon, 'ico habit-icon'),
          h('div', {},
            h('p', { class: 'pulse-name' }, p.habit.name),
            h('p', { class: 'pulse-streak' }, p.streak > 0 ? `🔥 ${p.streak} day streak` : `best streak ${p.longest}`))),
        h('div', { class: 'pulse-dots', 'aria-label': 'last 7 days' },
          ...p.last7.map((v, i) => h('span', {
            class: 'pdot' + (v === 1 ? ' done' : v === null ? ' na' : ''),
            title: `${6 - i} day${6 - i === 1 ? '' : 's'} ago`
          }))),
        p.dueToday
          ? h('button', { type: 'button', class: 'btn-ghost', onclick: () => logToday(state, p.habit.id) }, 'log today')
          : null)));
  }

  root.append(h('h2', { class: 'section-title' }, 'suggestions'),
    ...(m.tips.length
      ? m.tips.map((t) => h('div', { class: 'card tip-card' },
          h('span', { class: 'tip-icon', 'aria-hidden': 'true' }, t.icon),
          h('div', { class: 'tip-body' },
            h('h3', {}, t.title),
            h('p', { class: 'muted' }, t.body),
            actionButton(t.action, state))))
      : [h('div', { class: 'card' }, h('p', { class: 'muted' }, 'nothing to fix — system healthy.'))]));
}