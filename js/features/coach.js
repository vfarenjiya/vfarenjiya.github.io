// v1.5 — coach returns a MODEL: { summary, pulses, tips }; the view only renders it.
import { dayKey, addDays, fromKey, WEEKDAY_NAMES } from '../utils/date.js';
import { isScheduled, isDayComplete, habitStats, completionRate, totalCompletions } from '../stats.js';

export const percent = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);

export function buildCoachModel(state) {
  const today = new Date();
  const key = (i) => dayKey(addDays(today, -i));

  const summary = {
    thisWeek: completionRate(state, 0, 7),
    lastWeek: completionRate(state, 7, 14),
    total: totalCompletions(state),
    habits: state.habits.length
  };
  summary.delta = (summary.thisWeek != null && summary.lastWeek != null)
    ? summary.thisWeek - summary.lastWeek : null;

  const pulses = state.habits.map((habit) => {
    const st = habitStats(state, habit);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const k = key(6 - i);
      if (!isScheduled(habit, k)) return null;
      return isDayComplete(state, habit, k) ? 1 : 0;
    });
    const dueToday = isScheduled(habit, key(0)) && !isDayComplete(state, habit, key(0));
    return { habit, streak: st.current, longest: st.longest, last7, dueToday };
  });

  const tips = [];
  if (!state.habits.length) {
    tips.push({ icon: '🌱', title: 'start small', body: 'Create one tiny habit (2 minutes or less). Consistency beats intensity.', score: 100, action: { type: 'new-habit', label: 'create habit' } });
  }
  for (const p of pulses) {
    const id = p.habit.id;
    const missedYesterday = isScheduled(p.habit, key(1)) && !isDayComplete(state, p.habit, key(1));
    const deadWeek = p.habit.createdAt <= key(6) && p.last7.every((v) => v !== 1);
    if (deadWeek) tips.push({ icon: '📉', title: `"${p.habit.name}" had zero reps in 7 days`, body: 'An invisible habit is a gone habit. Shrink it to 2 minutes or move it to your strongest day.', score: 85, action: { type: 'log-today', label: 'log today', habitId: id } });
    if (missedYesterday) tips.push({ icon: '↩️', title: `"${p.habit.name}" missed yesterday`, body: 'One miss is an accident; two is a new pattern. You can still log yesterday to keep the chain.', score: 90, action: { type: 'makeup', label: 'log yesterday', habitId: id } });
    if (p.dueToday) tips.push({ icon: '🎯', title: `"${p.habit.name}" is due today`, body: 'Do it before the next context switch — completion beats perfection.', score: 60, action: { type: 'log-today', label: 'log today', habitId: id } });
    if (!(p.habit.reminders || []).length) tips.push({ icon: '⏰', title: `no reminder on "${p.habit.name}"`, body: 'Habits without cues rely on willpower. Attach a time-of-day cue.', score: 40, action: { type: 'edit', label: 'add reminder', habitId: id } });
    if (p.streak >= 3) tips.push({ icon: '🔥', title: `${p.streak}-day streak on "${p.habit.name}"`, body: 'Protect it: same place, same time, same trigger.', score: 30 });
  }
  const acc = Array.from({ length: 7 }, () => [0, 0]);
  for (let i = 0; i < 28; i++) {
    const k = key(i);
    for (const hb of state.habits) if (isScheduled(hb, k)) {
      acc[fromKey(k).getDay()][0] += isDayComplete(state, hb, k) ? 1 : 0;
      acc[fromKey(k).getDay()][1]++;
    }
  }
  let best = -1, bi = -1;
  acc.forEach(([d, t], i) => { if (t && d / t > best) { best = d / t; bi = i; } });
  if (bi >= 0 && best < 1) tips.push({ icon: '📊', title: `your strongest day is ${WEEKDAY_NAMES[bi]}`, body: `Completion ${Math.round(best * 100)}% on ${WEEKDAY_NAMES[bi]}s. Stack new habits onto that day.`, score: 20 });
  if (summary.habits && summary.thisWeek === 1) tips.push({ icon: '🏆', title: 'perfect week', body: 'Seven days, zero misses. Raise the bar slightly — or bank the rest.', score: 50 });
  if (summary.delta != null && summary.delta < -0.15) tips.push({ icon: '📉', title: 'trend down', body: `This week ${percent(summary.thisWeek)} vs last ${percent(summary.lastWeek)}. Shrink the habit until it's easy again.`, score: 70 });
  if (summary.delta != null && summary.delta > 0.15) tips.push({ icon: '📈', title: 'trend up', body: `This week ${percent(summary.thisWeek)} vs last ${percent(summary.lastWeek)}. Keep the routine shape identical.`, score: 25 });

  tips.sort((a, b) => b.score - a.score);
  return { summary, pulses, tips: tips.slice(0, 6) };
}