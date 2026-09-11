'use strict';
let shake = 0;
const rings = [];
function shakeIt(m) { if (curSps() > 60) return; shake = Math.max(shake, m); }
function ring(cx, cy, col) { if (curSps() > 60) return; rings.push({ x: cx, y: cy, col, age: 0 }); }

function layout() {
  const W = innerWidth, H = innerHeight;
  if (!W || !H) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR;
  const top = 66, bottom = 104;
  const availH = Math.max(200, H - top - bottom);
  L.cell = Math.min((W - 16) / GW, availH / GH);
  L.ox = (W - L.cell * GW) / 2;
  L.oy = top + Math.max(0, (availH - L.cell * GH) / 2);
  L.w = W; L.h = H;
}
addEventListener('resize', layout);
addEventListener('orientationchange', layout);

function burst(cx, cy, col) {
  if (curSps() > 60) return;
  if (particles.length > 200) return;
  const px = L.ox + (cx + .5) * L.cell, py = L.oy + (cy + .5) * L.cell;
  for (let i = 0; i < 18; i++) {
    const an = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 120;
    particles.push({ x: px, y: py, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp,
      life: .4 + Math.random() * .4, age: 0, size: 1.5 + Math.random() * 2.5, col, grav: 60 });
  }
}
const STARS = Array.from({ length: 90 }, () => ({
  x: Math.random(), y: Math.random(), s: .4 + Math.random() * 1.2,
  a: .2 + Math.random() * .6, ph: Math.random() * 6 }));

function render(dt, t) {
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, L.w, L.h);
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 2.2);
    g.translate((Math.random() - .5) * 9 * shake, (Math.random() - .5) * 9 * shake);
  }
  g.fillStyle = '#04060c'; g.fillRect(-20, -20, L.w + 40, L.h + 40);
  for (const s of STARS) {
    g.globalAlpha = s.a * (.8 + .2 * Math.sin(t * 1.2 + s.ph));
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x * L.w, s.y * L.h, s.s, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  const cs = L.cell;
  g.strokeStyle = 'rgba(53,224,200,.35)'; g.lineWidth = 2;
  g.strokeRect(L.ox - 3, L.oy - 3, cs * GW + 6, cs * GH + 6);
  if (flags.grid) {
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (let x = 1; x < GW; x++) { g.beginPath(); g.moveTo(L.ox + x * cs, L.oy); g.lineTo(L.ox + x * cs, L.oy + GH * cs); g.stroke(); }
    for (let y = 1; y < GH; y++) { g.beginPath(); g.moveTo(L.ox, L.oy + y * cs); g.lineTo(L.ox + GW * cs, L.oy + y * cs); g.stroke(); }
  }
  if (flags.sense) {
    const h = env.snake[0];
    g.strokeStyle = 'rgba(255,209,102,.3)'; g.lineWidth = 1.5; g.setLineDash([5, 6]);
    g.beginPath();
    g.moveTo(L.ox + (h.x + .5) * cs, L.oy + (h.y + .5) * cs);
    g.lineTo(L.ox + (env.food.x + .5) * cs, L.oy + (env.food.y + .5) * cs);
    g.stroke(); g.setLineDash([]);
  }
  { const fx = L.ox + (env.food.x + .5) * cs, fy = L.oy + (env.food.y + .5) * cs;
    const pu = 1 + .18 * Math.sin(t * 5);
    g.save(); g.shadowColor = '#ffd166'; g.shadowBlur = cs * .8;
    const fg = g.createRadialGradient(fx, fy, 1, fx, fy, cs * .38 * pu);
    fg.addColorStop(0, '#fff6c9'); fg.addColorStop(1, '#ffb703');
    g.fillStyle = fg; g.beginPath(); g.arc(fx, fy, cs * .3 * pu, 0, 7); g.fill(); g.restore(); }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.age += dt;
    if (r.age > .6) { rings.splice(i, 1); continue; }
    g.globalAlpha = 1 - r.age / .6;
    g.strokeStyle = r.col; g.lineWidth = 2;
    g.beginPath(); g.arc(L.ox + (r.x + .5) * cs, L.oy + (r.y + .5) * cs, r.age * cs * 3, 0, 7); g.stroke();
  }
  g.globalAlpha = 1;
  const sps = curSps();
  const frac = sps <= 30 ? Math.min(1, (performance.now() - env.stepAt) / (1000 / sps)) : 1;
  const pos = i => {
    const c = env.snake[i], p = env.prev[Math.min(i, env.prev.length - 1)] || c;
    return { x: p.x + (c.x - p.x) * frac, y: p.y + (c.y - p.y) * frac };
  };
  if (flags.glow) { g.save(); g.shadowColor = '#35e0c8'; g.shadowBlur = cs * .6; }
  const n = env.snake.length;
  for (let i = n - 1; i >= 0; i--) {
    const p = pos(i);
    const px = L.ox + (p.x + .5) * cs, py = L.oy + (p.y + .5) * cs;
    const k = 1 - i / Math.max(8, n);
    const rad = cs * (i === 0 ? .42 : Math.max(.16, .36 - .2 * (i / n)));
    g.fillStyle = i === 0 ? '#8ff5e2' : `rgb(${(20 + 30 * k) | 0},${(150 + 80 * k) | 0},${(140 + 60 * k) | 0})`;
    g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill();
    if (i === 0) {
      const d = DIRS[env.dir];
      g.fillStyle = '#04211d';
      for (const s2 of [-1, 1]) {
        g.beginPath();
        g.arc(px + d[0] * rad * .35 - d[1] * s2 * rad * .35, py + d[1] * rad * .35 + d[0] * s2 * rad * .35, rad * .16, 0, 7);
        g.fill();
      }
    }
  }
  if (flags.glow) g.restore();
  for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.age += dt;
    if (q.age >= q.life) { particles.splice(i, 1); continue; }
    q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    g.globalAlpha = 1 - q.age / q.life; g.fillStyle = q.col;
    g.beginPath(); g.arc(q.x, q.y, q.size, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}

/* ================= POLICY MAP: the whole table, live ================= */
function drawPolicyMap() {
  const c = $('#polCv'); if (!c || !c.clientWidth) return;
  const W = c.clientWidth, H = c.clientHeight;
  c.width = W * DPR; c.height = H * DPR;
  const g = c.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, W, H);
  const cols = 9, rows = 8, cw = W / cols, ch = H / rows;
  const cur = stateIdx(env.snake, env.food, env.dir);
  const COL = ['#35e0c8', '#ffb703', '#c792ea'];   // straight / left / right
  for (let d = 0; d < 8; d++) for (let f = 0; f < 9; f++) {
    const s = d * 9 + f, b = s * 3;
    let ai = 0, mx = -Infinity, mn = Infinity;
    for (let a = 0; a < 3; a++) { const q = Q[b + a]; if (q > mx) { mx = q; ai = a; } if (q < mn) mn = q; }
    const conf = Math.min(1, (mx - mn) / 20);
    const seen = visitedSt[s];
    g.globalAlpha = seen ? 0.25 + 0.65 * conf : 0.12;
    g.fillStyle = seen ? COL[ai] : '#3a4664';
    g.fillRect(f * cw + 1, d * ch + 1, cw - 2, ch - 2);
    if (s === cur) {
      g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.strokeRect(f * cw + 1, d * ch + 1, cw - 2, ch - 2);
    }
  }
  g.globalAlpha = 1;
}

/* ================= CHART ================= */
function drawChart() {
  const W = chartCv.clientWidth, H = chartCv.clientHeight;
  if (!W) return;
  chartCv.width = W * DPR; chartCv.height = H * DPR;
  const g = chartCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pl = 26, pr = 6, pt = 6, pb = 4;
  const N = Math.min(returns.length, 400);
  let mn = -12, mx = 20;
  for (let i = Math.max(0, returns.length - N); i < returns.length; i++) {
    if (returns[i] < mn) mn = returns[i]; if (returns[i] > mx) mx = returns[i];
  }
  mn -= 3; mx += 6;
  const y = v => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
  g.font = '500 8.5px "Space Grotesk"'; g.textBaseline = 'middle'; g.textAlign = 'right';
  for (const gv of [mn + 3, 0, mx - 6]) {
    g.strokeStyle = '#1c2740'; g.beginPath(); g.moveTo(pl, y(gv)); g.lineTo(W - pr, y(gv)); g.stroke();
    g.fillStyle = '#5c7196'; g.fillText(Math.round(gv), pl - 4, y(gv));
  }
  if (N < 2) {
    g.fillStyle = '#5c7196'; g.textAlign = 'center'; g.font = '500 10px "Space Grotesk"';
    g.fillText('no episodes yet — press ▶', W / 2, H / 2); return;
  }
  const data = returns.slice(-N), x = i => pl + i / (N - 1) * (W - pl - pr);
  g.strokeStyle = 'rgba(140,160,200,.4)'; g.lineWidth = 1; g.beginPath();
  data.forEach((v, i) => i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v)));
  g.stroke();
  const pre = [0]; for (const v of data) pre.push(pre[pre.length - 1] + v);
  g.strokeStyle = '#ff7a2f'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x(0), y(data[0]));
  for (let i = 1; i < N; i++) { const w = Math.min(i + 1, 30);
    g.lineTo(x(i), y((pre[i + 1] - pre[i + 1 - w]) / w)); }
  g.stroke();
}