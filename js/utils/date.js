// Local-time "YYYY-MM-DD" keys: lexicographically sortable, DST-safe via addDays
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
export const startOfWeek = (d) => addDays(d, -d.getDay());
export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const monthShort = (d) => d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
export const fmtLong = (d) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
export const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const hhmm = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const isDayKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);