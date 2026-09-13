// v1.5 — smaller circle, number centred INSIDE, weekday letter OUTSIDE below, high contrast
import { h } from '../utils/dom.js';
import { dayKey, addDays, startOfMonth, WEEKDAY_LETTERS } from '../utils/date.js';
import { getState, cycleCompletion } from '../store.js';
import { isScheduled, progressOf } from '../stats.js';

const scrollMemory = new Map();
let popMark = null;

export function dayStrip(habit) {
  const state = getState();
  const today = new Date(); const todayKey = dayKey(today);
  const strip = h('div', { class: 'day-strip', onscroll: () => scrollMemory.set(habit.id, strip.scrollLeft) });

  for (let d = new Date(startOfMonth(today)); d <= today; d = addDays(d, 1)) {
    const key = dayKey(d);
    const sched = isScheduled(habit, key);
    const max = habit.schedule.type === 'weekly' ? 1 : habit.timesPerDay;
    const prog = Math.min(progressOf(state, habit.id, key), max);

    const circle = h('span', { class: 'day-circle' },
      h('span', { class: 'day-num' }, String(d.getDate())));
    const cell = h('button', {
      type: 'button',
      class: 'day' + (!sched ? ' dim' : '') + (key === todayKey ? ' today' : '') + (sched && prog >= max ? ' done' : ''),
      'aria-label': `${habit.name}, ${key}, ${prog} of ${max}`,
      'aria-pressed': sched && prog >= max,
      onclick: () => {
        if (!sched || key > todayKey) return;
        const next = (prog + 1) % (max + 1);
        if (next === max) popMark = { id: habit.id, key, ts: Date.now() };
        cycleCompletion(habit.id, key);
      }
    },
      circle,
      h('span', { class: 'day-dow' }, WEEKDAY_LETTERS[d.getDay()]));

    if (sched && prog > 0 && prog < max) {
      circle.style.background = `conic-gradient(var(--fill) ${Math.round((prog / max) * 360)}deg, var(--circle) 0)`;
    }
    if (popMark && popMark.id === habit.id && popMark.key === key && Date.now() - popMark.ts < 600) {
      cell.classList.add('pop');
    }
    strip.append(cell);
  }

  const prev = scrollMemory.get(habit.id);
  requestAnimationFrame(() => { strip.scrollLeft = prev ?? strip.scrollWidth; });
  return strip;
}