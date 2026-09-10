'use strict';
/* world(m) → screen(px) */
const sx = x => L.ox + x * L.s;
const sy = y => L.gy - y * L.s;

/* ================= HELPERS (before any use) ================= */
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const groundH = x => (x >= WORLD.padX0 - 2 && x <= WORLD.padX1 + 2) ? 0
  : 2 + 5 * hash(Math.floor(x / 6), 3) + Math.sin(x * .9) * 1.2;

/* ================= SKY ================= */
let shoot = null, shootTimer = 5;
function drawSpace(g, t, dt) {
  g.fillStyle = '#000'; g.fillRect(0, 0, L.w, L.h);
  const hg = g.createLinearGradient(0, L.oy, 0, L.h);
  hg.addColorStop(0, '#000'); hg.addColorStop(1, '#07090d');
  g.fillStyle = hg; g.fillRect(0, 0, L.w, L.h);
  for (const s of STARS) {
    g.globalAlpha = s.a * (.8 + .2 * Math.sin(t * 1.3 + s.ph));
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x * L.w, s.y * L.h, s.s, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  shootTimer -= dt;
  if (!shoot && shootTimer <= 0) {
    shoot = { x: L.w * (.2 + Math.random() * .6), y: L.h * Math.random() * .25,
      vx: (Math.random() < .5 ? -1 : 1) * (300 + Math.random() * 200), vy: 120 + Math.random() * 80,
      age: 0, life: .8 };
    shootTimer = 6 + Math.random() * 9;
  }
  if (shoot) {
    shoot.age += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt;
    if (shoot.age > shoot.life) shoot = null;
    else {
      const a = 1 - shoot.age / shoot.life;
      const lg = g.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * .12, shoot.y - shoot.vy * .12);
      lg.addColorStop(0, `rgba(255,255,255,${.9 * a})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = lg; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(shoot.x, shoot.y);
      g.lineTo(shoot.x - shoot.vx * .12, shoot.y - shoot.vy * .12); g.stroke();
    }
  }
  // Earth
  const ex = L.w * .18, ey = L.h * .10, er = Math.min(L.w, L.h) * .055;
  g.save(); g.shadowColor = 'rgba(120,180,255,.55)'; g.shadowBlur = er;
  const eg = g.createRadialGradient(ex - er * .3, ey - er * .3, er * .1, ex, ey, er);
  eg.addColorStop(0, '#cfe6ff'); eg.addColorStop(.5, '#4d8fdc'); eg.addColorStop(1, '#173f7d');
  g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.5)';
  g.beginPath(); g.ellipse(ex - er * .2, ey - er * .1, er * .5, er * .18, -.4, 0, 7); g.fill();
  g.beginPath(); g.ellipse(ex + er * .25, ey + er * .3, er * .35, er * .14, .3, 0, 7); g.fill();
  // Sun
  const snx = L.w * .86, sny = L.h * .07;
  g.save(); g.shadowColor = '#fff'; g.shadowBlur = 26;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(snx, sny, 9, 0, 7); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(snx - 34, sny); g.lineTo(snx + 34, sny);
  g.moveTo(snx, sny - 22); g.lineTo(snx, sny + 22); g.stroke();
  // parallax mountain ridge
  const shift = -(view.x - 50) * .12 * L.s;
  g.fillStyle = '#0d1119';
  g.beginPath(); g.moveTo(-60, L.gy);
  for (let x = -60; x <= L.w + 60; x += 46)
    g.lineTo(x + (shift % 46), L.gy - (L.h * .03 + hash(Math.floor((x + shift) / 46), 31) * L.h * .09));
  g.lineTo(L.w + 60, L.gy); g.closePath(); g.fill();
}

/* ================= TERRAIN (pre-rendered offscreen) ================= */
let terr = null, terrKey = '';
function ensureTerrain() {
  const key = `${L.w}x${L.h}x${DPR}x${L.s.toFixed(3)}`;
  if (terr && terrKey === key) return;
  terrKey = key;
  terr = document.createElement('canvas');
  terr.width = L.w * DPR; terr.height = L.h * DPR;
  const g = terr.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const s = L.s;
  g.beginPath(); g.moveTo(sx(-20), sy(0) + 40);
  for (let x = -20; x <= 120; x += 2) g.lineTo(sx(x), sy(groundH(x)));
  g.lineTo(sx(120), sy(0) + 40); g.closePath();
  const tg = g.createLinearGradient(0, L.gy - 8 * s, 0, L.h);
  tg.addColorStop(0, '#9aa0a8'); tg.addColorStop(.35, '#6e727a'); tg.addColorStop(1, '#3a3e46');
  g.fillStyle = tg; g.fill();
  g.strokeStyle = '#cfd3d8'; g.lineWidth = 1.4;
  g.beginPath();
  for (let x = -20; x <= 120; x += 2) { const px = sx(x), py = sy(groundH(x)); x === -20 ? g.moveTo(px, py) : g.lineTo(px, py); }
  g.stroke();
  for (const c of CRATERS) {
    if (c.x > WORLD.padX0 - 4 && c.x < WORLD.padX1 + 4) continue;
    g.fillStyle = '#565b63';
    g.beginPath(); g.ellipse(sx(c.x), sy(groundH(c.x)) + 2, c.r * s, c.r * s * .32, 0, 0, 7); g.fill();
    g.fillStyle = '#2e3239';
    g.beginPath(); g.ellipse(sx(c.x) - c.r * s * .18, sy(groundH(c.x)) + 2, c.r * s * .8, c.r * s * .24, 0, Math.PI, 0); g.fill();
  }
  for (const r of ROCKS) {
    if (r.x > WORLD.padX0 - 3 && r.x < WORLD.padX1 + 3) continue;
    const py = sy(groundH(r.x));
    g.fillStyle = '#7d8189';
    g.beginPath(); g.ellipse(sx(r.x), py - r.r * s * .3, r.r * s, r.r * s * .7, 0, 0, 7); g.fill();
    g.fillStyle = '#23262b';
    g.beginPath(); g.ellipse(sx(r.x) - r.r * s * 1.1, py - r.r * s * .1, r.r * s * .9, r.r * s * .3, 0, Math.PI, 0); g.fill();
  }
  const p0 = sx(WORLD.padX0), p1 = sx(WORLD.padX1), py = sy(0);
  g.fillStyle = '#b7bcc4'; g.fillRect(p0, py - 2, p1 - p0, 4);
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 5; i++) g.fillRect(p0 + (p1 - p0) * (i / 5) + 2, py - 2, (p1 - p0) / 10 - 4, 4);
  g.fillStyle = 'rgba(30,34,40,.8)'; g.font = `700 ${Math.max(9, s * 2.2)}px "Space Grotesk"`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  g.fillText('L P - 0 1', (p0 + p1) / 2, py + 6);
  for (const bx of [p0, p1]) {
    g.fillStyle = '#3a3e46'; g.fillRect(bx - 1.5, py - s * 2.4, 3, s * 2.4);
  }
}
function drawTerrain(g, t) {
  ensureTerrain();
  g.drawImage(terr, 0, 0, L.w, L.h);
  const s = L.s, py = sy(0);
  for (const bx of [sx(WORLD.padX0), sx(WORLD.padX1)]) {   // blinking beacons
    g.fillStyle = (t % 1) < .5 ? '#ffb703' : 'rgba(255,183,3,.25)';
    g.beginPath(); g.arc(bx, py - s * 2.5, 3, 0, 7); g.fill();
  }
  const chase = (t * 3 | 0) % 4;                            // approach lights
  for (let i = 0; i < 4; i++) {
    const lx = WORLD.padX0 - 8 - i * 7; if (lx < 2) continue;
    const on = chase === (3 - i);
    g.save();
    if (on) { g.shadowColor = '#fff'; g.shadowBlur = 8; }
    g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.15)';
    g.beginPath(); g.arc(sx(lx), sy(groundH(lx)) - 3, 2, 0, 7); g.fill();
    g.restore();
  }
}

/* ================= APOLLO-STYLE LM ================= */
function drawLM(g, px, py, s, tilt, mainOn, lat, t) {
  if (mainOn) {
    const len = (9 + 2.5 * Math.sin(t * 42)) * s;
    const pg = g.createLinearGradient(px, py, px, py + len);
    pg.addColorStop(0, 'rgba(255,255,255,.55)');
    pg.addColorStop(.3, 'rgba(160,200,255,.28)');
    pg.addColorStop(1, 'rgba(120,160,255,0)');
    g.fillStyle = pg;
    g.beginPath(); g.moveTo(px - s * .5, py - s * .8);
    g.lineTo(px + s * .5, py - s * .8);
    g.lineTo(px + s * 1.6, py + len); g.lineTo(px - s * 1.6, py + len);
    g.closePath(); g.fill();
  }
  if (lat) {
    const d = -lat, jx = px + d * s * 1.7, jy = py - s * 2.6;
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.moveTo(jx, jy - s * .25); g.lineTo(jx, jy + s * .25);
    g.lineTo(jx + d * s * 2.6, jy); g.closePath(); g.fill();
  }
  g.save(); g.translate(px, py); g.rotate(tilt);
  g.lineCap = 'round';
  for (const i of [-1, 1]) {
    g.strokeStyle = '#23262b'; g.lineWidth = Math.max(1.5, s * .16);
    g.beginPath(); g.moveTo(i * s * 1.2, -s * .6); g.lineTo(i * s * 2.1, 0); g.stroke();
    g.strokeStyle = '#b8860b'; g.lineWidth = Math.max(2, s * .26);
    g.beginPath(); g.moveTo(i * s * 1.45, -s * .45); g.lineTo(i * s * 1.8, -s * .25); g.stroke();
    g.fillStyle = '#1c1f24';
    g.beginPath(); g.ellipse(i * s * 2.1, 0, s * .55, s * .16, 0, 0, 7); g.fill();
  }
  const dg = g.createLinearGradient(0, -s * 2.1, 0, 0);
  dg.addColorStop(0, '#e8c05a'); dg.addColorStop(.6, '#c09130'); dg.addColorStop(1, '#7a5c1a');
  g.fillStyle = dg;
  g.beginPath();
  g.moveTo(-s * 2, -s * .5); g.lineTo(-s * 1.6, -s * 2.1); g.lineTo(s * 1.6, -s * 2.1);
  g.lineTo(s * 2, -s * .5); g.lineTo(s * 1.4, -s * .1); g.lineTo(-s * 1.4, -s * .1);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(70,48,5,.4)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-s * 1.2, -s * 2); g.lineTo(-s * .6, -s * .2);
  g.moveTo(s * .3, -s * 2.05); g.lineTo(s * .9, -s * .2);
  g.moveTo(-s * 1.8, -s * 1.2); g.lineTo(s * 1.8, -s * 1.2); g.stroke();
  g.strokeStyle = 'rgba(255,240,190,.55)';
  g.beginPath(); g.moveTo(-s * 1.6, -s * 2.1); g.lineTo(s * 1.6, -s * 2.1); g.stroke();
  g.fillStyle = '#2b2e33';
  g.beginPath(); g.moveTo(-s * .5, -s * .1); g.lineTo(s * .5, -s * .1);
  g.lineTo(s * .8, s * .02); g.lineTo(-s * .8, s * .02); g.closePath(); g.fill();
  const ag = g.createLinearGradient(0, -s * 3.7, 0, -s * 2.1);
  ag.addColorStop(0, '#d9cfa8'); ag.addColorStop(1, '#a89464');
  g.fillStyle = ag; rr(g, -s * 1.3, -s * 3.7, s * 2.6, s * 1.6, s * .3); g.fill();
  g.fillStyle = '#14171c';
  g.beginPath(); g.moveTo(-s * .95, -s * 2.7); g.lineTo(-s * .35, -s * 2.7); g.lineTo(-s * .65, -s * 3.3); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(s * .35, -s * 2.7); g.lineTo(s * .95, -s * 2.7); g.lineTo(s * .65, -s * 3.3); g.closePath(); g.fill();
  g.fillStyle = '#23262b'; g.beginPath(); g.arc(0, -s * 2.45, s * .4, 0, 7); g.fill();
  g.fillStyle = '#8b93a7';
  g.fillRect(-s * 1.55, -s * 2.9, s * .3, s * .6); g.fillRect(s * 1.25, -s * 2.9, s * .3, s * .6);
  g.strokeStyle = '#cfd6e4'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(-s * .6, -s * 3.7); g.lineTo(-s * .8, -s * 4.2); g.stroke();
  g.fillStyle = '#dfe3e8';
  g.beginPath(); g.ellipse(-s * .9, -s * 4.3, s * .7, s * .25, -.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(s * .8, -s * 3.7); g.lineTo(s * 1.1, -s * 4.8); g.stroke();
  g.fillStyle = (t % 1) < .5 ? '#ff4d4d' : 'rgba(255,77,77,.3)';
  g.beginPath(); g.arc(s * 1.1, -s * 4.85, s * .09, 0, 7); g.fill();
  g.restore();
}

/* ================= OVERLAYS (policy / value) ================= */
function drawActionGlyph(g, x, y, a, col, k) {
  g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round';
  if (a === 0 || a === 1) { const d = a === 0 ? -1 : 1;
    g.beginPath(); g.moveTo(x - d * k * .5, y - k * .6); g.lineTo(x + d * k * .5, y); g.lineTo(x - d * k * .5, y + k * .6); g.stroke(); }
  else if (a === 2) { g.beginPath(); g.moveTo(x - k * .6, y + k * .4); g.lineTo(x, y - k * .5); g.lineTo(x + k * .6, y + k * .4); g.stroke(); }
  else { g.beginPath(); g.arc(x, y, k * .35, 0, 7); g.stroke(); }
}
function drawOverlays(g) {
  if (!flags.heat && !flags.pol) return;
  let lo = Infinity, hi = -Infinity; const V = [];
  for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 8; by++) {
    let m = -Infinity;
    for (let u = 0; u < 9; u++) m = Math.max(m, maxQ(((bx * 8 + by) * 3 + (u / 3 | 0)) * 3 + (u % 3)));
    V[bx * 8 + by] = m; if (m < lo) lo = m; if (m > hi) hi = m;
  }
  if (hi - lo < 1e-6) return;
  for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 8; by++) {
    const rx = sx(XB[bx]), rw = (XB[bx + 1] - XB[bx]) * L.s;
    const ry = sy(YB[by + 1]), rh = (YB[by + 1] - YB[by]) * L.s;
    const v = (V[bx * 8 + by] - lo) / (hi - lo);
    if (flags.heat) {
      g.fillStyle = `rgba(${(40 + 215 * v) | 0},${(120 + 100 * v) | 0},${(200 - 140 * v) | 0},${.08 + .22 * v})`;
      g.fillRect(rx + 1, ry + 1, rw - 2, rh - 2);
    }
    if (flags.pol) {
      const sum = [0, 0, 0, 0];
      for (let u = 0; u < 9; u++) {
        const st = ((bx * 8 + by) * 3 + (u / 3 | 0)) * 3 + (u % 3);
        for (let a = 0; a < 4; a++) sum[a] += Q[st * 4 + a];
      }
      let ai = 0, mx = -Infinity, mn = Infinity;
      for (let a = 0; a < 4; a++) { sum[a] /= 9; if (sum[a] > mx) { mx = sum[a]; ai = a; } if (sum[a] < mn) mn = sum[a]; }
      if (mx - mn > 1e-6)
        drawActionGlyph(g, rx + rw / 2, ry + rh / 2, ai, `rgba(53,224,200,${.15 + .4 * Math.min(1, (mx - mn) / 40 + .3)})`, L.s * 2);
    }
  }
}

/* ================= ALTITUDE TAPE ================= */
function drawTape(g) {
  const x = L.w - 16, y0 = sy(WORLD.h), y1 = sy(0);
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
  g.font = '500 8px "Space Grotesk"'; g.fillStyle = 'rgba(255,255,255,.45)';
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let m = 0; m <= 160; m += 40) {
    const yy = sy(m);
    g.beginPath(); g.moveTo(x - 4, yy); g.lineTo(x, yy); g.stroke();
    g.fillText(m, x - 6, yy);
  }
  const my = sy(clamp(view.y, 0, WORLD.h));
  g.fillStyle = '#35e0c8';
  g.beginPath(); g.moveTo(x - 5, my); g.lineTo(x + 3, my - 4); g.lineTo(x + 3, my + 4); g.closePath(); g.fill();
}

/* ================= CHART ================= */
const YMIN = -160, YMAX = 120;
function drawChart() {
  const W = chartCv.clientWidth, H = chartCv.clientHeight;
  if (!W) return;
  chartCv.width = W * DPR; chartCv.height = H * DPR;
  const g = chartCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pl = 32, pr = 6, pt = 6, pb = 4;
  const y = v => pt + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - pt - pb);
  g.font = '500 8.5px "Space Grotesk"'; g.textBaseline = 'middle';
  for (const gv of [-100, 0, 100]) {
    g.strokeStyle = '#1c2740'; g.beginPath(); g.moveTo(pl, y(gv)); g.lineTo(W - pr, y(gv)); g.stroke();
    g.fillStyle = '#5c7196'; g.textAlign = 'right'; g.fillText(gv, pl - 4, y(gv));
  }
  g.setLineDash([4, 4]); g.strokeStyle = 'rgba(53,224,200,.8)';
  g.beginPath(); g.moveTo(pl, y(80)); g.lineTo(W - pr, y(80)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#35e0c8'; g.textAlign = 'right'; g.fillText('soft landings ≈ +80…100', W - pr, y(80) - 5);
  const N = Math.min(returns.length, 400);
  if (N < 2) {
    g.fillStyle = '#5c7196'; g.textAlign = 'center'; g.font = '500 10px "Space Grotesk"';
    g.fillText('no episodes yet — press ▶', W / 2, H / 2); return;
  }
  const data = returns.slice(-N), x = i => pl + i / (N - 1) * (W - pl - pr);
  const cy = v => Math.max(pt, Math.min(H - pb, y(Math.max(YMIN + 2, Math.min(YMAX - 2, v)))));
  g.strokeStyle = 'rgba(140,160,200,.4)'; g.lineWidth = 1; g.beginPath();
  data.forEach((v, i) => i ? g.lineTo(x(i), cy(v)) : g.moveTo(x(i), cy(v)));
  g.stroke();
  const pre = [0]; for (const v of data) pre.push(pre[pre.length - 1] + v);
  g.strokeStyle = '#ff7a2f'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x(0), cy(data[0]));
  for (let i = 1; i < N; i++) { const w = Math.min(i + 1, 30);
    g.lineTo(x(i), cy((pre[i + 1] - pre[i + 1 - w]) / w)); }
  g.stroke();
}