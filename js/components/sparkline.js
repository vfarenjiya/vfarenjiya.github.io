// v1.3 — colors moved to CSS classes (.spark-line/.spark-area/.spark-dot) so charts follow the theme
import { svgEl } from '../utils/dom.js';

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}
export function sparkline(values, w = 560, ht = 96) {
  const idx = values.findIndex((v) => v != null);
  let vals = (idx === -1 ? [] : values.slice(idx)).filter((v) => v != null);
  if (vals.length === 0) vals = [0, 0];
  if (vals.length === 1) vals = [vals[0], vals[0]];

  const max = Math.max(1, ...vals);
  const pts = vals.map((v, i) => [
    4 + (i / (vals.length - 1)) * (w - 8),
    ht - 8 - (v / max) * (ht - 28)
  ]);
  const line = smooth(pts);
  const area = `${line} L ${pts[pts.length - 1][0]},${ht - 6} L ${pts[0][0]},${ht - 6} Z`;
  return svgEl('svg', { viewBox: `0 0 ${w} ${ht}`, class: 'spark', role: 'img', 'aria-label': 'recent completions' },
    svgEl('path', { d: area, class: 'spark-area' }),
    svgEl('path', { d: line, class: 'spark-line' }),
    ...pts.map(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 3.4, class: 'spark-dot' })));
}