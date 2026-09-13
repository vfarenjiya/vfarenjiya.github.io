// v1.8 — menu item closures now bind to the menu element they live in (fixes ReferenceError)
import { h } from '../utils/dom.js';
import { getState, deleteHabit, restoreHabit, moveHabit, addHabit } from '../store.js';
import { habitStats, weekProgress } from '../stats.js';
import { dayStrip } from '../components/day-strip.js';
import { openHabitForm } from '../features/habit-form.js';
import { requestNotificationPermission } from '../features/reminders.js';
import { iconEl } from '../utils/icons.js';
import { monthShort } from '../utils/date.js';
import { toast } from '../components/toast.js';

let hinted = false;

function closeAllMenus() {
  document.querySelectorAll('.menu:not([hidden])').forEach((m) => { m.hidden = true; });
}

function menuFor(habit, index, total) {
  const menu = h('div', { class: 'menu', hidden: true, role: 'menu' });   // element FIRST…
  const items = [];
  if (index > 0) items.push(['move up', () => moveHabit(habit.id, -1), '']);
  if (index < total - 1) items.push(['move down', () => moveHabit(habit.id, +1), '']);
  items.push(['duplicate', () => {
    addHabit({
      name: habit.name + ' copy', icon: habit.icon, timesPerDay: habit.timesPerDay,
      reminders: [...habit.reminders], schedule: JSON.parse(JSON.stringify(habit.schedule))
    });
    toast('habit duplicated');
  }, '']);
  items.push(['edit', () => openHabitForm(habit), '']);
  items.push(['delete', () => {
    const snap = deleteHabit(habit.id);
    toast(`deleted "${habit.name}"`, { ms: 6000, actionLabel: 'undo', onAction: () => restoreHabit(snap) });
  }, 'danger']);
  for (const [label, fn, cls] of items) {
    menu.append(h('button', {
      type: 'button', role: 'menuitem', class: cls,
      onclick: () => { closeAllMenus(); fn(); }        // …closures reference a real binding
    }, label));
  }
  return menu;
}

function habitCard(habit, index, total) {
  const st = habitStats(getState(), habit);
  const wp = weekProgress(getState(), habit);
  const menu = menuFor(habit, index, total);
  const toggle = h('button', {
    type: 'button', class: 'icon-btn', 'aria-label': `menu for ${habit.name}`,
    'aria-haspopup': 'menu', 'aria-expanded': 'false',
    onclick: () => {
      const willOpen = menu.hidden;
      closeAllMenus();
      menu.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', String(!menu.hidden));
    }
  }, h('span', { html: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>' }));

  return h('section', { class: 'habit-card' },
    h('div', { class: 'habit-head' },
      iconEl(habit.icon, 'ico habit-icon'),
      h('div', { class: 'habit-titles' },
        h('h2', { class: 'habit-name' }, habit.name),
        st.current > 0 ? h('p', { class: 'streak' }, `🔥 ${st.current} day streak`) : null,
        wp ? h('p', { class: 'week-progress' }, `${wp.sum}/${wp.goal} this week`) : null),
      h('div', { class: 'menu-wrap' }, toggle, menu)),
    h('p', { class: 'month-label' }, monthShort(new Date())),
    dayStrip(habit));
}

export function renderHabits(root) {
  const state = getState();
  root.append(
    h('header', { class: 'view-head' },
      h('h1', { class: 'view-title' }, 'habits'),
      h('div', { class: 'head-actions' },
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'enable reminders', onclick: () => requestNotificationPermission() },
          h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10v4l4 1 9 5V4L7 9l-4 1z"/><path d="M7 15v4"/></svg>' })),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'new habit (n)', onclick: () => openHabitForm() },
          h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>' })))),
    state.habits.length
      ? h('div', { class: 'habit-list' }, ...state.habits.map((hb, i) => habitCard(hb, i, state.habits.length)))
      : h('div', { class: 'card empty-state' },
          h('p', {}, 'no habits yet'),
          h('p', { class: 'muted' }, 'tap + (or press n) to create your first habit'),
          h('button', { type: 'button', class: 'btn-primary', onclick: () => openHabitForm() }, 'create habit')));

  const neverLogged = !Object.values(state.completions).some((c) => Object.keys(c).length);
  if (!hinted && state.habits.length && neverLogged) {
    hinted = true;
    toast('tap a day circle to log a completion');
  }
}