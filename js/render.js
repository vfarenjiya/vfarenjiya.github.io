const STARS = Array.from({ length: 150 }, () => ({
  x: Math.random(), y: Math.random() * .75, s: .4 + Math.random() * 1.3,
  a: .25 + Math.random() * .7, ph: Math.random() * 6 }));
const ROCKS = Array.from({ length: 9 }, (_, i) => ({
  x: 3 + hash(i, 11) * 94, r: .8 + hash(i, 5) * 2.2 }));
const CRATERS = Array.from({ length: 5 }, (_, i) => ({
  x: 5 + hash(i, 21) * 90, r: 3 + hash(i, 17) * 6 }));

const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}