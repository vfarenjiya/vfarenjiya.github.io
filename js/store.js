// v1.4 — budget-enforced persist(), de-duped reminders in sanitizer
import { dayKey, isDayKey } from './utils/date.js';
import { byteLength, withinBudget } from './utils/bytes.js';

const KEY = 'habits-pwa:v1';
const STATE_VERSION = 1;
export const STORAGE_FULL = 'habits:storage-full';
const listeners = new Set();

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2);
}
const blank = () => ({ v: STATE_VERSION, habits: [], completions: {}, settings: {} });

function sanitizeHabit(x, i) {
  const hb = {
    id: typeof x?.id === 'string' && x.id ? x.id : uid(),
    name: String(x?.name || `habit ${i + 1}`).slice(0, 80),
    icon: typeof x?.icon === 'string' ? x.icon : 'check',
    timesPerDay: Math.min(9, Math.max(1, parseInt(x?.timesPerDay, 10) || 1)),
    reminders: Array.isArray(x?.reminders)
      ? [...new Set(x.reminders.filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort()
      : [],
    createdAt: isDayKey(x?.createdAt) ? x.createdAt : dayKey(),
    schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] }
  };
  const sch = x?.schedule;
  if (sch?.type === 'weekly') hb.schedule = { type: 'weekly', goal: Math.min(7, Math.max(1, parseInt(sch.goal, 10) || 3)) };
  else if (Array.isArray(sch?.days)) hb.schedule = { type: 'daily', days: [...new Set(sch.days.map(Number).filter((d) => d >= 0 && d <= 6))] };
  return hb;
}
function sanitizeState(raw) {
  const base = blank();
  if (!raw || typeof raw !== 'object') return base;
  base.habits = Array.isArray(raw.habits) ? raw.habits.map(sanitizeHabit) : [];
  base.completions = {};
  for (const hb of base.habits) {
    const bucket = raw.completions?.[hb.id];
    const clean = {};
    if (bucket && typeof bucket === 'object') {
      for (const [k, v] of Object.entries(bucket)) {
        if (isDayKey(k) && Number.isFinite(v)) clean[k] = Math.max(0, Math.round(v));
      }
    }
    base.completions[hb.id] = clean;
  }
  base.settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  return base;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return sanitizeState(JSON.parse(raw)); }
  catch (e) { console.warn('store: corrupted save, starting fresh', e); }
  return blank();
}
let state = load();

function persist() {                                   // v1.4: single policy choke-point
  const json = JSON.stringify(state);
  const size = byteLength(json);
  if (!withinBudget(size)) {
    console.error(`store: refusing write, ${size} bytes exceeds app budget`);
    window.dispatchEvent(new Event(STORAGE_FULL));
    return;
  }
  try { localStorage.setItem(KEY, json); }
  catch (e) { console.error('store: persist failed', e); window.dispatchEvent(new Event(STORAGE_FULL)); }
}

export const getState = () => state;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function mutate(fn) {
  fn(state);
  persist();
  listeners.forEach((f) => f(state));
}

export function addHabit(data) {
  const habit = sanitizeHabit({ ...data, id: uid(), createdAt: data.createdAt || dayKey() }, 0);
  mutate((s) => { s.habits.push(habit); s.completions[habit.id] = {}; });
  return habit;
}
export function updateHabit(id, data) {
  mutate((s) => {
    const i = s.habits.findIndex((x) => x.id === id);
    if (i < 0) return;
    const merged = sanitizeHabit({ ...s.habits[i], ...data, id }, i);
    merged.createdAt = s.habits[i].createdAt;
    s.habits[i] = merged;
  });
}
export function deleteHabit(id) {
  const s = getState();
  const habit = s.habits.find((x) => x.id === id);
  const snapshot = habit ? {
    habit: JSON.parse(JSON.stringify(habit)),
    completions: JSON.parse(JSON.stringify(s.completions[id] || {}))
  } : null;
  mutate((st) => { st.habits = st.habits.filter((x) => x.id !== id); delete st.completions[id]; });
  return snapshot;
}
export function restoreHabit(snapshot) {
  if (!snapshot) return;
  mutate((s) => { s.habits.push(snapshot.habit); s.completions[snapshot.habit.id] = snapshot.completions; });
}
export function moveHabit(id, delta) {
  mutate((s) => {
    const i = s.habits.findIndex((x) => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= s.habits.length) return;
    [s.habits[i], s.habits[j]] = [s.habits[j], s.habits[i]];
  });
}
export function cycleCompletion(habitId, key) {
  mutate((s) => {
    const habit = s.habits.find((x) => x.id === habitId); if (!habit) return;
    const bucket = (s.completions[habitId] ||= {});
    const max = habit.schedule.type === 'weekly' ? 1 : habit.timesPerDay;
    const next = ((bucket[key] || 0) + 1) % (max + 1);
    if (next === 0) delete bucket[key]; else bucket[key] = next;
  });
}
export function replaceAll(next) { mutate((s) => { Object.assign(s, sanitizeState(next)); }); }
export function clearAll() { localStorage.removeItem(KEY); mutate((s) => { Object.assign(s, blank()); }); }