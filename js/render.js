'use strict';
/* ================= EFFECTS ================= */
function cellCenter(c, r) { return { x: L.ox + (c + 0.5) * L.cell, y: L.oy + (r + 0.5) * L.cell }; }

function spawnSplash(c, r) {
  if (particles.length > 220) return;
  const p = cellCenter(c, r);
  for (let i = 0; i < 26; i++) {
    const an = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 150;
    particles.push({
      x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 90,
      life: 0.6 + Math.random() * 0.5, age: 0,
      size: 2 + Math.random() * 3, col: Math.random() < 0.5 ? '#ff7a2f' : '#ffc857', grav: 260
    });
  }
}
function spawnConfetti(c, r) {
  if (particles.length > 220) return;
  const p = cellCenter(c, r);
  for (let i = 0; i < 30; i++) {
    const an = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 170;
    particles.push({
      x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60,
      life: 0.7 + Math.random() * 0.6, age: 0,
      size: 2 + Math.random() * 3,
      col: ['#35e0c8', '#ffc857', '#e9f0fa'][(Math.random() * 3) | 0], grav: 180
    });
  }
}
function floater(c, r, txt, col) {
  const p = cellCenter(c, r);
  floaters.push({ x: p.x, y: p.y, txt, col, age: 0 });
}
const embers = Array.from({ length: 24 }, () => ({
  x: Math.random(), y: Math.random(), sp: 0.02 + Math.random() * 0.05,
  ph: Math.random() * 6, sz: 1 + Math.random() * 2
}));

/* ================= LAYOUT ================= */
function layout() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = w * DPR; cv.height = h * DPR;
  L.cell = Math.min((w - 22) / COLS, (h - 22) / ROWS);
  L.ox = (w - L.cell * COLS) / 2;
  L.oy = (h - L.cell * ROWS) / 2;
  L.w = w; L.h = h;
  if (!view.ready) {
    const p = cellCenter(0, 0);
    view.x = p.x; view.y = p.y; view.ready = true;
  }
}
new ResizeObserver(layout).observe(stage);

/* ================= RENDER HELPERS ================= */
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ================= MAIN RENDER ================= */
function render(dt, t) {
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, L.w, L.h);

  // ambient embers
  for (const e of embers) {
    e.y -= e.sp * dt; e.ph += dt;
    if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); }
    g.globalAlpha = 0.06 + 0.05 * (1 + Math.sin(e.ph));
    g.fillStyle = '#ff9a4d';
    g.beginPath(); g.arc(e.x * L.w, e.y * L.h, e.sz, 0, 7); g.fill();
  }
  g.globalAlpha = 1;

  // lava glow behind cliff column
  const gc = cellCenter(0, 5.5);
  const gl = g.createRadialGradient(gc.x, gc.y, L.cell, gc.x, gc.y, L.cell * 4.2);
  gl.addColorStop(0, 'rgba(255,110,40,.14)');
  gl.addColorStop(1, 'rgba(255,110,40,0)');
  g.fillStyle = gl; g.fillRect(0, 0, L.w, L.h);

  const cs = L.cell, pad = Math.max(1, cs * 0.045);

  // cells
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = L.ox + c * cs, y = L.oy + r * cs, ty = cellType(c, r);
    if (ty === 'cliff') {
      rr(g, x + pad, y + pad, cs - 2 * pad, cs - 2 * pad, cs * 0.14);
      const lg = g.createLinearGradient(0, y, 0, y + cs);
      lg.addColorStop(0, '#2a0a06'); lg.addColorStop(1, '#1a0503');
      g.fillStyle = lg; g.fill();
      const inset = cs * 0.14, wob = Math.sin(t * 2.1 + c * 3 + r * 1.7) * cs * 0.03;
      const pool = g.createLinearGradient(0, y + inset, 0, y + cs - inset);
      const hot = 0.72 + 0.28 * Math.sin(t * 2.4 + r * 0.9);
      pool.addColorStop(0, `rgba(255,196,62,${0.95 * hot})`);
      pool.addColorStop(0.55, `rgba(255,110,42,${0.95 * hot})`);
      pool.addColorStop(1, `rgba(214,48,20,${0.95 * hot})`);
      g.save(); g.shadowColor = 'rgba(255,120,40,.8)'; g.shadowBlur = cs * 0.28;
      rr(g, x + inset, y + inset + wob * 0.3, cs - 2 * inset, cs - 2 * inset, cs * 0.12);
      g.fillStyle = pool; g.fill(); g.restore();
      const nb = 1 + ((cs / 26) | 0);
      for (let b = 0; b < nb; b++) {
        const h1 = hash(c * 7 + b, r * 13 + 3), h2 = hash(c * 3 + 1, r * 17 + b);
        const bxp = x + inset + h1 * (cs - 2 * inset);
        const cyc = ((t * (0.25 + h2 * 0.35)) + h1) % 1;
        const byp = y + cs - inset - cyc * (cs - 2 * inset);
        g.fillStyle = `rgba(255,230,150,${(1 - cyc) * 0.65 * hot})`;
        g.beginPath(); g.arc(bxp, byp, cs * 0.045 * (1 - cyc * 0.4) + 0.6, 0, 7); g.fill();
      }
    } else {
      rr(g, x + pad, y + pad, cs - 2 * pad, cs - 2 * pad, cs * 0.14);
      g.fillStyle = (c + r) % 2 ? '#182136' : '#1a2440'; g.fill();
      g.strokeStyle = '#26314f'; g.lineWidth = 1; g.stroke();
    }
  }

  // heatmap overlay
  if (flags.heat) {
    let lo = Infinity, hi = -Infinity;
    for (let s = 0; s < STATES; s++) { const v = maxQ(s); if (v < lo) lo = v; if (v > hi) hi = v; }
    if (hi - lo > 1e-6) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cellType(c, r) === 'cliff') continue;
      const v = (maxQ(idxOf(c, r)) - lo) / (hi - lo);
      g.fillStyle = `rgba(${(60 + 195 * v) | 0},${(90 + 110 * v) | 0},${(160 - 20 * v) | 0},${0.14 + 0.3 * v})`;
      rr(g, L.ox + c * cs + pad, L.oy + r * cs + pad, cs - 2 * pad, cs - 2 * pad, cs * 0.14);
      g.fill();
    }
  }

  // start mark
  { const p = cellCenter(0, 0);
    g.strokeStyle = 'rgba(53,224,200,.85)'; g.lineWidth = 2;
    g.setLineDash([4, 4]); g.beginPath(); g.arc(p.x, p.y, cs * 0.3, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(53,224,200,.85)';
    g.font = `700 ${Math.max(8, cs * 0.17)}px "Space Grotesk"`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('START', p.x, p.y + cs * 0.52); }

  // goal mark
  { const p = cellCenter(GOAL.c, GOAL.r);
    g.save(); g.shadowColor = 'rgba(255,200,87,.9)';
    g.shadowBlur = cs * 0.3 * (1 + 0.3 * Math.sin(t * 3));
    g.strokeStyle = '#ffc857'; g.lineWidth = 2.5;
    g.setLineDash([6, 6]); g.lineDashOffset = -t * 24;
    g.beginPath(); g.arc(p.x, p.y, cs * 0.32, 0, 7); g.stroke(); g.restore(); g.setLineDash([]);
    g.fillStyle = '#ffc857';
    g.beginPath(); g.arc(p.x, p.y, cs * 0.1 * (1 + 0.15 * Math.sin(t * 3)), 0, 7); g.fill(); }

  // policy arrows
  if (flags.pol) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cellType(c, r) === 'cliff') continue;
      const s = idxOf(c, r), b = s * 4;
      let mx = -Infinity, mn = Infinity, me = 0, ai = 0;
      for (let a = 0; a < 4; a++) {
        const q = Q[b + a];
        if (q > mx) { mx = q; ai = a; } if (q < mn) mn = q; me += q;
      }
      me /= 4; if (mx - mn < 1e-9) continue;
      const p = cellCenter(c, r), conf = Math.min(1, (mx - me) / (mx - mn + 1e-9) + 0.35);
      g.save(); g.translate(p.x, p.y); g.rotate(ANG[ai]);
      g.strokeStyle = `rgba(53,224,200,${0.15 + 0.55 * conf})`;
      g.lineWidth = 2; g.lineCap = 'round';
      const k = cs * 0.2;
      g.beginPath(); g.moveTo(-k * 0.6, -k * 0.7); g.lineTo(k * 0.55, 0); g.lineTo(-k * 0.6, k * 0.7); g.stroke();
      g.restore();
    }
  }

  // trail
  if (flags.trail) {
    const n = trail.length;
    for (let i = 0; i < n; i++) {
      const p = cellCenter(trail[i].c, trail[i].r);
      g.fillStyle = `rgba(53,224,200,${(i / n) * 0.3})`;
      g.beginPath(); g.arc(p.x, p.y, cs * 0.09, 0, 7); g.fill();
    }
  }

  // agent
  const tgt = cellCenter(env.c, env.r);
  const rate = curSps() <= 30 ? 14 : 40, k = 1 - Math.exp(-dt * rate);
  view.x += (tgt.x - view.x) * k; view.y += (tgt.y - view.y) * k;
  if (!agentHidden) {
    const R = cs * 0.33, vx = tgt.x - view.x, vy = tgt.y - view.y;
    const moving = Math.hypot(vx, vy) > 1.5;
    const bob = moving ? Math.sin(t * 11) * cs * 0.04 : 0;
    const ax = view.x, ay = view.y + bob;
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.ellipse(ax, view.y + R * 0.95, R * 0.8, R * 0.28, 0, 0, 7); g.fill();
    g.strokeStyle = '#35e0c8'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(ax, ay - R); g.lineTo(ax, ay - R * 1.45); g.stroke();
    g.fillStyle = '#ffc857';
    g.beginPath(); g.arc(ax, ay - R * 1.45, 2.2, 0, 7); g.fill();
    const bg2 = g.createRadialGradient(ax - R * 0.35, ay - R * 0.35, R * 0.15, ax, ay, R);
    bg2.addColorStop(0, '#8ff5e2'); bg2.addColorStop(1, '#14b3a0');
    g.fillStyle = bg2; g.strokeStyle = '#083f38'; g.lineWidth = 2;
    g.beginPath(); g.arc(ax, ay, R, 0, 7); g.fill(); g.stroke();
    let dx = 0, dy = 1;
    if (moving) { const m = Math.hypot(vx, vy) || 1; dx = vx / m; dy = vy / m; }
    else { dx = DC[lastDir]; dy = DR[lastDir]; }
    for (const s2 of [-1, 1]) {
      const ex = ax + dx * R * 0.3 - dy * s2 * R * 0.34;
      const ey = ay + dy * R * 0.3 + dx * s2 * R * 0.34;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, R * 0.2, 0, 7); g.fill();
      g.fillStyle = '#0a2a26'; g.beginPath(); g.arc(ex + dx * R * 0.07, ey + dy * R * 0.07, R * 0.1, 0, 7); g.fill();
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.age += dt;
    if (p.age >= p.life) { particles.splice(i, 1); continue; }
    p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    g.globalAlpha = 1 - p.age / p.life; g.fillStyle = p.col;
    g.beginPath(); g.arc(p.x, p.y, p.size, 0, 7); g.fill();
  }
  g.globalAlpha = 1;

  // floating labels
  g.textAlign = 'center';
  g.font = `${Math.max(11, cs * 0.3)}px Bungee`;
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.age += dt;
    if (f.age > 1) { floaters.splice(i, 1); continue; }
    g.globalAlpha = 1 - f.age; g.fillStyle = f.col;
    g.fillText(f.txt, f.x, f.y - cs * 0.5 - f.age * cs * 0.6);
  }
  g.globalAlpha = 1;
}

/* ================= CHART ================= */
const YMIN = -160, YMAX = 10;
function drawChart() {
  const W = chartCv.clientWidth, H = chartCv.clientHeight;
  if (!W) return;
  chartCv.width = W * DPR; chartCv.height = H * DPR;
  const g = chartCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pl = 30, pr = 6, pt = 6, pb = 4;
  const y = v => pt + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - pt - pb);
  g.font = '8.5px "Space Grotesk"'; g.textBaseline = 'middle';
  for (const gv of [-150, -100, -50]) {
    g.strokeStyle = 'rgba(120,140,180,.13)';
    g.beginPath(); g.moveTo(pl, y(gv)); g.lineTo(W - pr, y(gv)); g.stroke();
    g.fillStyle = '#5c7196'; g.textAlign = 'right'; g.fillText(gv, pl - 4, y(gv));
  }
  g.setLineDash([4, 4]); g.strokeStyle = 'rgba(53,224,200,.8)';
  g.beginPath(); g.moveTo(pl, y(-12)); g.lineTo(W - pr, y(-12)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#35e0c8'; g.textAlign = 'right'; g.fillText('optimal −12', W - pr, y(-12) - 5);
  const N = Math.min(returns.length, 400);
  if (N < 2) {
    g.fillStyle = '#5c7196'; g.textAlign = 'center'; g.font = '10px "Space Grotesk"';
    g.fillText('no episodes yet — press ▶ TRAIN', W / 2, H / 2); return;
  }
  const data = returns.slice(-N), x = i => pl + i / (N - 1) * (W - pl - pr);
  const cy = v => Math.max(pt, Math.min(H - pb, y(Math.max(YMIN + 2, Math.min(YMAX - 2, v)))));
  g.strokeStyle = 'rgba(108,139,212,.5)'; g.lineWidth = 1; g.beginPath();
  data.forEach((v, i) => i ? g.lineTo(x(i), cy(v)) : g.moveTo(x(i), cy(v)));
  g.stroke();
  const pre = [0]; for (const v of data) pre.push(pre[pre.length - 1] + v);
  g.strokeStyle = '#ffc857'; g.lineWidth = 2; g.beginPath(); g.moveTo(x(0), cy(data[0]));
  for (let i = 1; i < N; i++) {
    const w = Math.min(i + 1, 30);
    g.lineTo(x(i), cy((pre[i + 1] - pre[i + 1 - w]) / w));
  }
  g.stroke();
}