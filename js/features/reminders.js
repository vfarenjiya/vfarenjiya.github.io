import { getState } from '../store.js';
import { isScheduled, isDayComplete } from '../stats.js';
import { dayKey, hhmm } from '../utils/date.js';
import { toast } from '../components/toast.js';

const fired = new Set();

export async function requestNotificationPermission() {
  if (!('Notification' in window)) { toast('notifications unsupported on this device'); return false; }
  const res = await Notification.requestPermission();
  toast(res === 'granted' ? 'reminders on' : 'permission not granted');
  return res === 'granted';
}
function fire(habit) {
  const msg = `time for "${habit.name}"`;
  if ('Notification' in window && Notification.permission === 'granted') new Notification('Habits', { body: msg });
  else toast('⏰ ' + msg);
}
export function startReminders() {
  const check = () => {
    const state = getState();
    const now = hhmm(); const key = dayKey();
    for (const habit of state.habits) {
      if (!isScheduled(habit, key) || isDayComplete(state, habit, key)) continue;
      for (const t of habit.reminders || []) {
        const id = `${habit.id}|${key}|${t}`;
        if (t === now && !fired.has(id)) { fired.add(id); fire(habit); }
      }
    }
  };
  check();
  setInterval(check, 30_000);
}