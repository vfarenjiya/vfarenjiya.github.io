// Badges API: installed app icon shows today's remaining completions (offline-safe, no-op if unsupported)
import { getState } from '../store.js';
import { todaySummary } from '../stats.js';

export function updateBadge() {
  if (!navigator.setAppBadge) return;
  const { done, total } = todaySummary(getState());
  const remaining = Math.max(0, total - done);
  const p = remaining > 0 ? navigator.setAppBadge(remaining) : navigator.clearAppBadge();
  if (p && p.catch) p.catch(() => {});
}