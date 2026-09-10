'use strict';
/* ================= WORLD GEOMETRY (with UI safe insets) ================= */
function cellCenter(c, r) { return { x: L.ox + (c + 0.5) * L.cell, y: L.oy + (r + 0.5) * L.cell }; }
const anchor = cellCenter;

function layout() {
  const W = innerWidth, H = innerHeight;
  if (!W || !H) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR;
  const topInset = 66, bottomInset = 100;           // HUD pills / dock clearance
  const availH = Math.max(200, H - topInset - bottomInset);
  L.cell = Math.min(W / COLS, availH / ROWS);
  L.ox = (W - L.cell * COLS) / 2;
  L.oy = topInset + Math.max(0, (availH - L.cell * ROWS) / 2);
  L.w = W; L.h = H; L.gy = L.oy + L.cell * ROWS;
  if (!view.ready) { const a = anchor(0, 0); view.x = a.x; view.y = a.y; view.ready = true; }
  view.thrust = 0; view.tilt = 0;
}
addEventListener('resize', layout);
addEventListener('orientationchange', layout);

/* ================= EFFECTS ================= */
function floater(c, r, txt, col) {
  if (txt === '-100') txt = 'CRASH!';
  if (txt === 'GOAL!') txt = 'LANDED!';
  const p = cellCenter(c, r);
  floaters.push({ x: p.x, y: p.y, txt, col, age: 0 });
}
function spawnSplash(c, r) {           // crash explosion
  if (particles.length > 220) return;
  const p = cellCenter(c, r);
  for (let i = 0; i < 34; i++) {
    const an = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 220;
    const smoke = Math.random() < .3;
    particles.push({ x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp,
      life: smoke ? 1.1 : .5 + Math.random() * .5, age: 0,
      size: smoke ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
      col: smoke ? '#5b6472' : ['#fff6c9', '#ff7a2f', '#ff4d4d'][(Math.random() * 3) | 0],
      grav: smoke ? -30 : 140 });
  }
}
function spawnConfetti(c, r) {         // landing celebration
  if (particles.length > 220) return;
  const p = cellCenter(c, r);
  for (let i = 0; i < 30; i++) {
    const an = -Math.PI / 2 + (Math.random() - .5) * 2.4, sp = 80 + Math.random() * 180;
    particles.push({ x: p.x, y: p.y + L.cell * .2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp,
      life: .7 + Math.random() * .6, age: 0, size: 2 + Math.random() * 2.5,
      col: ['#35e0c8', '#ffc857', '#ffffff', '#ff7a2f'][(Math.random() * 4) | 0], grav: 160 });
  }
}
const STARS = Array.from({ length: 110 }, () => ({
  x: Math.random(), y: Math.random() * .8, s: .5 + Math.random() * 1.4,
  ph: Math.random() * 6, sp: .002 + Math.random() * .004 }));

/* ================= HELPERS ================= */
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ================= SPACE BACKGROUND ================= */
function drawSpace(g, t, dt) {
  const sky = g.createLinearGradient(0, 0, 0, L.h);
  sky.addColorStop(0, '#04070f'); sky.addColorStop(.55, '#0a1226'); sky.addColorStop(1, '#141d33');
  g.fillStyle = sky; g.fillRect(0, 0, L.w, L.h);
  for (const s of STARS) {
    s.x += s.sp * dt; if (s.x > 1.02) s.x = -.02;
    s.ph += dt * (1 + s.s);
    g.globalAlpha = .35 + .55 * Math.abs(Math.sin(s.ph));
    g.fillStyle = '#dfe9ff';
    g.beginPath(); g.arc(s.x * L.w, s.y * L.h, s.s, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
  if (Math.random() < dt * .12 && particles.length < 200)
    particles.push({ x: L.w * (.3 + Math.random() * .6), y: L.h * Math.random() * .3,
      vx: -260, vy: 110, life: .55, age: 0, size: 1.8, col: '#ffffff', grav: 0 });
  // Earth
  const ex = L.w * .82, ey = L.h * .10, er = L.cell * .45;
  g.save(); g.shadowColor = 'rgba(110,180,255,.7)'; g.shadowBlur = er * .9;
  const eg = g.createRadialGradient(ex - er * .3, ey - er * .3, er * .1, ex, ey, er);
  eg.addColorStop(0, '#9fd4ff'); eg.addColorStop(.55, '#3f86e0'); eg.addColorStop(1, '#1c4fa0');
  g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = er * .12; g.lineCap = 'round';
  g.beginPath(); g.arc(ex - er * .15, ey - er * .1, er * .55, .4, 1.9); g.stroke();
  g.beginPath(); g.arc(ex + er * .1, ey + er * .25, er * .45, 2.6, 4.1); g.stroke();
  // moon mountains (2 layers)
  const gy = Math.min(L.gy, L.h);
  for (const [seed, col, hgt] of [[11, '#1b2436', 1.5], [29, '#131b2a', 2.3]]) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, gy);
    for (let i = 0; i <= 10; i++) {
      const mx = i / 10 * L.w;
      const my = gy - (hash(i, seed) * .6 + .25) * L.cell * hgt * (i % 2 ? 1 : .55);
      g.lineTo(mx, my);
    }
    g.lineTo(L.w, gy); g.closePath(); g.fill();
  }
  // regolith ground
  if (L.gy < L.h) {
    const gg = g.createLinearGradient(0, L.gy, 0, L.h);
    gg.addColorStop(0, '#39415a'); gg.addColorStop(1, '#232a3c');
    g.fillStyle = gg; g.fillRect(0, L.gy, L.w, L.h - L.gy);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, L.gy, L.w, 2);
    for (let i = 0; i < 7; i++) {
      const cx = hash(i, 5) * L.w, cy = L.gy + 8 + hash(i, 9) * Math.max(4, L.h - L.gy - 16);
      const cr = 4 + hash(i, 3) * 10;
      g.fillStyle = '#262e40'; g.beginPath(); g.ellipse(cx, cy, cr, cr * .45, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(cx, cy - 1, cr, cr * .45, 0, Math.PI, 0); g.stroke();
    }
  }
}

/* ================= LAVA-TUBE CREVASSE (the cliff) ================= */
function drawLavaTube(g, t) {
  const gc = cellCenter(0, 5);
  const gl = g.createRadialGradient(gc.x, gc.y, L.cell, gc.x, gc.y, L.cell * 4);
  gl.addColorStop(0, 'rgba(255,110,40,.16)'); gl.addColorStop(1, 'rgba(255,110,40,0)');
  g.fillStyle = gl; g.fillRect(0, 0, L.w, L.h);
  const cs = L.cell;
  for (let r = 1; r < ROWS - 1; r++) {
    const x = L.ox, y = L.oy + r * cs;
    g.fillStyle = '#150d0a'; rr(g, x + 1, y + 1, cs - 2, cs - 2, cs * .12); g.fill();
    const hot = .7 + .3 * Math.sin(t * 2.2 + r * .8);
    g.save(); g.shadowColor = 'rgba(255,120,40,.8)'; g.shadowBlur = cs * .3;
    const lg = g.createLinearGradient(x, 0, x + cs, 0);
    lg.addColorStop(0, `rgba(214,48,20,${hot})`);
    lg.addColorStop(.5, `rgba(255,140,50,${hot})`);
    lg.addColorStop(1, `rgba(214,48,20,${hot})`);
    rr(g, x + cs * .22, y + 2, cs * .56, cs - 4, cs * .1); g.fillStyle = lg; g.fill(); g.restore();
    g.strokeStyle = `rgba(255,214,120,${.5 * hot})`; g.lineWidth = 1.6; g.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      let cx = x + cs * (.3 + hash(k, r) * .4), cy = y + 3;
      g.moveTo(cx, cy);
      for (let s2 = 0; s2 < 3; s2++) {
        cx += (hash(k * 3 + s2, r + s2) - .5) * cs * .3; cy += cs * .3;
        g.lineTo(cx, cy);
      }
      g.stroke();
    }
  }
  const blink = (t % 1) < .5;
  for (const by of [L.oy + cs * .9, L.oy + (ROWS - 1) * cs - cs * .1]) {
    g.fillStyle = blink ? '#ff4d4d' : 'rgba(255,77,77,.25)';
    g.beginPath(); g.arc(L.ox + cs, by, cs * .06, 0, 7); g.fill();
  }
  if (Math.random() < .08 && particles.length < 200) {
    const r = 1 + ((Math.random() * (ROWS - 2)) | 0);
    const p = cellCenter(0, r);
    particles.push({ x: p.x + (Math.random() - .5) * cs * .4, y: p.y, vx: (Math.random() - .5) * 10,
      vy: -26 - Math.random() * 30, life: 1.3, age: 0, size: 1.6, col: '#ffb703', grav: -10 });
  }
}

/* ================= MARKERS: START GATE & LANDING PAD ================= */
function drawMarkers(g, t) {
  const cs = L.cell;
  { const p = anchor(0, 0);
    g.save(); g.translate(p.x, p.y);
    g.strokeStyle = 'rgba(53,224,200,.7)'; g.lineWidth = 2;
    g.setLineDash([6, 7]); g.lineDashOffset = -t * 20;
    g.beginPath(); g.arc(0, 0, cs * .42, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#cfd6e4'; rr(g, -cs * .3, -cs * .62, cs * .6, cs * .16, cs * .05); g.fill();
    g.fillStyle = '#3f86e0';
    g.fillRect(-cs * .52, -cs * .6, cs * .18, cs * .12); g.fillRect(cs * .34, -cs * .6, cs * .18, cs * .12);
    g.fillStyle = (t % 1) < .5 ? '#35e0c8' : 'rgba(53,224,200,.3)';
    g.beginPath(); g.arc(0, -cs * .68, cs * .045, 0, 7); g.fill();
    g.fillStyle = 'rgba(53,224,200,.9)'; g.font = `700 ${cs * .13}px Orbitron`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('START', 0, cs * .58); g.restore(); }
  { const p = anchor(GOAL.c, GOAL.r);
    const py = p.y + cs * .3, pw = cs * 1.3;
    const gy = Math.max(L.gy, py + cs * .3);
    g.strokeStyle = '#4a5570'; g.lineWidth = cs * .05;
    g.beginPath(); g.moveTo(p.x - pw * .35, py); g.lineTo(p.x - pw * .42, gy);
    g.moveTo(p.x + pw * .35, py); g.lineTo(p.x + pw * .42, gy); g.stroke();
    g.fillStyle = '#3b465c'; rr(g, p.x - pw / 2, py, pw, cs * .12, cs * .04); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, p.x - pw / 2, py, pw, cs * .04, cs * .02); g.fill();
    for (let i = 0; i < 4; i++) {
      const on = ((t * 2 | 0) + i) % 4 === 0;
      g.fillStyle = on ? '#ffc857' : 'rgba(255,200,87,.25)';
      g.beginPath(); g.arc(p.x - pw * .375 + i * pw * .25, py - cs * .02, cs * .04, 0, 7); g.fill();
    }
    const pu = (t % 1.4) / 1.4;
    g.strokeStyle = `rgba(53,224,200,${.6 * (1 - pu)})`; g.lineWidth = 2;
    g.beginPath(); g.ellipse(p.x, py, pw * .5 * pu + 4, cs * .16 * pu + 2, 0, 0, 7); g.stroke();
    g.strokeStyle = '#cfd6e4'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(p.x + pw * .42, py); g.lineTo(p.x + pw * .42, py - cs * .5); g.stroke();
    const wv = Math.sin(t * 5) * cs * .04;
    g.fillStyle = '#35e0c8';
    g.beginPath(); g.moveTo(p.x + pw * .42, py - cs * .5);
    g.lineTo(p.x + pw * .42 + cs * .3, py - cs * .42 + wv);
    g.lineTo(p.x + pw * .42, py - cs * .34); g.closePath(); g.fill(); }
}

/* ================= LANDER SPRITE ================= */
function drawLander(g, x, y, s, tilt, thrust, fa, t) {
  if (thrust > .06) {
    const len = s * (.3 + .45 * thrust) * (1 + .25 * Math.sin(t * 42));
    const ox = x - Math.sin(tilt) * s * .2, oy = y + Math.cos(tilt) * s * .24;
    const dx = Math.sin(fa), dy = -Math.cos(fa);
    const tx = ox + dx * len, ty = oy + dy * len;
    const fg = g.createLinearGradient(ox, oy, tx, ty);
    fg.addColorStop(0, 'rgba(255,255,255,.95)');
    fg.addColorStop(.35, 'rgba(255,170,60,.85)');
    fg.addColorStop(1, 'rgba(255,80,30,0)');
    g.fillStyle = fg;
    const px = -dy * s * .09, py2 = dx * s * .09;
    g.beginPath(); g.moveTo(ox + px, oy + py2); g.lineTo(tx, ty); g.lineTo(ox - px, oy - py2);
    g.closePath(); g.fill();
  }
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.strokeStyle = '#8b93a7'; g.lineWidth = s * .035; g.lineCap = 'round';
  for (const i of [-1, 1]) {
    g.beginPath(); g.moveTo(i * s * .12, s * .1); g.lineTo(i * s * .24, s * .26); g.stroke();
    g.beginPath(); g.moveTo(i * s * .24 - s * .06, s * .27); g.lineTo(i * s * .24 + s * .06, s * .27); g.stroke();
  }
  const bg = g.createLinearGradient(0, -s * .05, 0, s * .2);
  bg.addColorStop(0, '#f0c25c'); bg.addColorStop(1, '#a8781f');
  g.fillStyle = bg;
  g.beginPath(); g.moveTo(-s * .22, -s * .04); g.lineTo(s * .22, -s * .04);
  g.lineTo(s * .15, s * .18); g.lineTo(-s * .15, s * .18); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,60,10,.5)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-s * .18, s * .04); g.lineTo(s * .18, s * .04);
  g.moveTo(-s * .16, s * .11); g.lineTo(s * .16, s * .11); g.stroke();
  g.fillStyle = '#cfd6e4'; rr(g, -s * .12, -s * .2, s * .24, s * .17, s * .04); g.fill();
  const dg = g.createRadialGradient(-s * .03, -s * .26, s * .02, 0, -s * .24, s * .13);
  dg.addColorStop(0, '#d8fbf4'); dg.addColorStop(1, '#189b8a');
  g.fillStyle = dg; g.beginPath(); g.arc(0, -s * .24, s * .11, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -s * .26, s * .035, 0, 7); g.fill();
  g.strokeStyle = '#8b93a7'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(s * .1, -s * .2); g.lineTo(s * .16, -s * .36); g.stroke();
  g.fillStyle = (t % 1) < .5 ? '#ff4d4d' : 'rgba(255,77,77,.3)';
  g.beginPath(); g.arc(s * .16, -s * .37, s * .03, 0, 7); g.fill();
  g.restore();
}

/* ================= MAIN RENDER ================= */
function render(dt, t) {
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, L.w, L.h);
  drawSpace(g, t, dt);
  drawLavaTube(g, t);
  drawMarkers(g, t);
  const cs = L.cell;

  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.setLineDash([3, 8]);
  for (let r = 1; r < ROWS - 1; r++) {
    const y = L.oy + r * cs + cs * .5;
    g.beginPath(); g.moveTo(L.ox + cs, y); g.lineTo(L.ox + COLS * cs, y); g.stroke();
  }
  g.setLineDash([]);

  if (flags.heat) {
    let lo = Infinity, hi = -Infinity;
    for (let s = 0; s < STATES; s++) { const v = maxQ(s); if (v < lo) lo = v; if (v > hi) hi = v; }
    if (hi - lo > 1e-6) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cellType(c, r) === 'cliff') continue;
      const v = (maxQ(idxOf(c, r)) - lo) / (hi - lo);
      g.fillStyle = `rgba(${(40 + 215 * v) | 0},${(120 + 100 * v) | 0},${(200 - 140 * v) | 0},${.10 + .25 * v})`;
      rr(g, L.ox + c * cs + 3, L.oy + r * cs + 3, cs - 6, cs - 6, cs * .15); g.fill();
    }
  }
  // policy arrows — subtle holo chevrons
  if (flags.pol) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (cellType(c, r) === 'cliff') continue;
    const b = idxOf(c, r) * 4;
    let mx = -Infinity, mn = Infinity, me = 0, ai = 0;
    for (let a = 0; a < 4; a++) { const q = Q[b + a]; if (q > mx) { mx = q; ai = a; } if (q < mn) mn = q; me += q; }
    me /= 4; if (mx - mn < 1e-9) continue;
    const p = cellCenter(c, r), conf = Math.min(1, (mx - me) / (mx - mn + 1e-9) + .35);
    g.save(); g.translate(p.x, p.y); g.rotate(ANG[ai]);
    g.strokeStyle = `rgba(53,224,200,${.10 + .35 * conf})`; g.lineWidth = 2; g.lineCap = 'round';
    const k = cs * .12;
    g.beginPath(); g.moveTo(-k * .6, -k * .7); g.lineTo(k * .55, 0); g.lineTo(-k * .6, k * .7); g.stroke();
    g.restore();
  }
  if (flags.trail) { const n = trail.length;
    for (let i = 0; i < n; i++) { const p = cellCenter(trail[i].c, trail[i].r);
      g.fillStyle = `rgba(255,170,80,${(i / n) * .35})`;
      g.beginPath(); g.arc(p.x, p.y, cs * .05 + (i / n) * cs * .05, 0, 7); g.fill(); } }

  // ---- lander glide ----
  const tgt = cellCenter(env.c, env.r);
  const rate = curSps() <= 30 ? 9 : 40, k = 1 - Math.exp(-dt * rate);
  const vx = (tgt.x - view.x) * rate, vy = (tgt.y - view.y) * rate;
  view.x += (tgt.x - view.x) * k; view.y += (tgt.y - view.y) * k;
  const speed = Math.hypot(vx, vy);
  const thT = clamp(speed / (cs * 7), 0, 1);
  view.thrust += (thT - view.thrust) * (1 - Math.exp(-dt * 12));
  view.tilt += (clamp(vx / (cs * 14), -.38, .38) - view.tilt) * (1 - Math.exp(-dt * 10));
  if (view.thrust > .25 && Math.random() < .5 && particles.length < 220) {
    const fa = Math.atan2(-vx, vy);
    particles.push({ x: view.x + Math.sin(fa) * cs * .3, y: view.y + Math.cos(fa) * cs * .3,
      vx: Math.sin(fa) * 60 + (Math.random() - .5) * 20, vy: Math.cos(fa) * 60,
      life: .35, age: 0, size: 1.8, col: 'rgba(255,190,110,.9)', grav: 0 });
  }
  if (!agentHidden) {
    const fa = speed > 1 ? Math.atan2(-vx, vy) : Math.PI;
    const bob = view.thrust < .05 ? Math.sin(t * 3) * 1.5 : 0;
    drawLander(g, view.x, view.y + bob, cs, view.tilt, view.thrust, fa, t);
  }
  for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.age += dt;
    if (q.age >= q.life) { particles.splice(i, 1); continue; }
    q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    g.globalAlpha = 1 - q.age / q.life; g.fillStyle = q.col;
    g.beginPath(); g.arc(q.x, q.y, q.size, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.textAlign = 'center'; g.font = `700 ${Math.max(12, cs * .28)}px Orbitron`;
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.age += dt;
    if (f.age > 1) { floaters.splice(i, 1); continue; }
    g.globalAlpha = 1 - f.age; g.fillStyle = f.col;
    g.fillText(f.txt, f.x, f.y - cs * .4 - f.age * cs * .6); }
  g.globalAlpha = 1;
}

/* ================= CHART (dark theme) ================= */
const YMIN = -160, YMAX = 10;
function drawChart() {
  const W = chartCv.clientWidth, H = chartCv.clientHeight;
  if (!W) return;
  chartCv.width = W * DPR; chartCv.height = H * DPR;
  const g = chartCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pl = 30, pr = 6, pt = 6, pb = 4;
  const y = v => pt + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - pt - pb);
  g.font = '500 8.5px "Space Grotesk"'; g.textBaseline = 'middle';
  for (const gv of [-150, -100, -50]) {
    g.strokeStyle = '#1c2740'; g.beginPath(); g.moveTo(pl, y(gv)); g.lineTo(W - pr, y(gv)); g.stroke();
    g.fillStyle = '#5c7196'; g.textAlign = 'right'; g.fillText(gv, pl - 4, y(gv));
  }
  g.setLineDash([4, 4]); g.strokeStyle = 'rgba(53,224,200,.8)';
  g.beginPath(); g.moveTo(pl, y(-12)); g.lineTo(W - pr, y(-12)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#35e0c8'; g.textAlign = 'right'; g.fillText('optimal −12', W - pr, y(-12) - 5);
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