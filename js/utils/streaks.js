import { addDays, fromKey, dayKey } from './date.js';

export function currentStreak(habit, isScheduled, isComplete) {
  let cur = new Date();
  let key = dayKey(cur);
  if (key < habit.createdAt) return 0;
  if (isScheduled(habit, key) && !isComplete(habit, key)) cur = addDays(cur, -1); // today still "open"
  let n = 0;
  for (let i = 0; i < 3650; i++) {
    key = dayKey(cur);
    if (key < habit.createdAt) break;
    if (!isScheduled(habit, key)) { cur = addDays(cur, -1); continue; }  // off-days don't break
    if (!isComplete(habit, key)) break;
    n++; cur = addDays(cur, -1);
  }
  return n;
}

export function longestStreak(habit, isScheduled, isComplete) {
  let cur = fromKey(habit.createdAt);
  const today = new Date();
  let best = 0, run = 0;
  while (cur <= today) {
    const key = dayKey(cur);
    if (isScheduled(habit, key)) {
      if (isComplete(habit, key)) { run++; best = Math.max(best, run); } else run = 0;
    }
    cur = addDays(cur, 1);
  }
  return best;
}