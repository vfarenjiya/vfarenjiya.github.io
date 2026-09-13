// The browser OWNS navigator.storage.estimate().quota — a page can neither raise nor lower it.
// What an app CAN do is cap itself. This module is that policy.
export const STORAGE_BUDGET = 300 * 1024 * 1024;          // 300 MB app-side cap

const enc = new TextEncoder();
export const byteLength = (str) => enc.encode(str).length; // UTF-8 bytes, not UTF-16 code units
export const withinBudget = (bytes) => bytes <= STORAGE_BUDGET;
export const cappedQuota = (quota) =>
  Math.min(Number.isFinite(quota) ? quota : STORAGE_BUDGET, STORAGE_BUDGET);

export function fmtBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}