import { fromKey, dayKey, addDays, startOfWeek } from './utils/date.js';
import { currentStreak, longestStreak } from './utils/streaks.js';

export function isScheduled(habit, key) {
  if (key < habit.createdAt) return false;
  if (habit.schedule.type === 'weekly') return true;
  return habit.schedule.days.includes(fromKey(key).getDay());
}
export const progressOf = (state, habitId, key) => (state.completions[habitId] || {})[key] || 0;
export function isDayComplete(state, habit, key) {
  const p = progressOf(state, habit.id, key);
  return habit.schedule.type === 'weekly' ? p > 0 : p >= habit.timesPerDay;
}
export function dayRatio(state, key) {
  const sched = state.habits.filter((hb) => isScheduled(hb, key));
  if (!sched.length) return 0;
  return sched.filter((hb) => isDayComplete(state, hb, key)).length / sched.length;
}
export function todaySummary(state) {
  const key = dayKey();
  const sched = state.habits.filter((hb) => isScheduled(hb, key));
  return { done: sched.filter((hb) => isDayComplete(state, hb, key)).length, total: sched.length };
}
export function monthCompletedDays(state) {
  const now = new Date();
  let n = 0;
  for (let d = new Date(now.getFullYear(), now.getMonth(), 1); d <= now; d = addDays(d, 1)) {
    const key = dayKey(d);
    for (const hb of state.habits) if (isDayComplete(state, hb, key)) n++;
  }
  return n;
}
export function overallLongestStreak(state) {
  return state.habits.reduce((m, hb) =>
    Math.max(m, longestStreak(hb, isScheduled, (h, k) => isDayComplete(state, h, k))), 0);
}
export function habitStats(state, habit) {
  const done = (h, k) => isDayComplete(state, h, k);
  let total = 0;
  const today = new Date();
  for (let cur = fromKey(habit.createdAt); cur <= today; cur = addDays(cur, 1)) {
    if (done(habit, dayKey(cur))) total++;
  }
  return { total, longest: longestStreak(habit, isScheduled, done), current: currentStreak(habit, isScheduled, done), started: habit.createdAt };
}
export function lastNDays(state, habit, n = 14) {
  const out = []; const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const key = dayKey(addDays(today, -i));
    out.push(key < habit.createdAt ? null : progressOf(state, habit.id, key));
  }
  return out;
}
export function weekProgress(state, habit) {
  if (habit.schedule.type !== 'weekly') return null;
  const today = new Date();
  let sum = 0;
  for (let d = startOfWeek(today); d <= today; d = addDays(d, 1)) {
    sum += progressOf(state, habit.id, dayKey(d));
  }
  return { sum, goal: habit.schedule.goal };
}
/* v1.5 — completion rate over a window of past days: fromAgo..toAgo (exclusive), 0 = today */
export function completionRate(state, fromAgo, toAgo) {
  const today = new Date();
  let s = 0, n = 0;
  for (let i = fromAgo; i < toAgo; i++) {
    const k = dayKey(addDays(today, -i));
    for (const hb of state.habits) if (isScheduled(hb, k)) { n++; if (isDayComplete(state, hb, k)) s++; }
  }
  return n ? s / n : null;
}
/* v1.5 — all-time completed habit-days */
export function totalCompletions(state) {
  let t = 0;
  for (const hb of state.habits) {
    for (const k of Object.keys(state.completions[hb.id] || {})) if (isDayComplete(state, hb, k)) t++;
  }
  return t;
}
export function heatmapColumns(state, weeks = 10) {
  const today = new Date();
  const thisSunday = startOfWeek(today);
  const cols = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const sun = addDays(thisSunday, -7 * w);
    const month = sun.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const col = { month, label: (!cols.length || cols[cols.length - 1].month !== month) ? month : '', days: [] };
    for (let d = 0; d < 7; d++) {
      const date = addDays(sun, d);
      if (date > today) { col.days.push(null); continue; }
      const key = dayKey(date);
      const r = dayRatio(state, key);
      col.days.push({ key, level: r === 0 ? 0 : r < 0.34 ? 1 : r < 0.67 ? 2 : r < 1 ? 3 : 4 });
    }
    cols.push(col);
  }
  return cols;
}