'use strict';
/* ================= WORLD GEOMETRY ================= */
const SLAB = () => L.cell * 0.34;
const slabTop = r => L.oy + (r + 1) * L.cell - SLAB();
function cellCenter(c, r) { return { x: L.ox + (c + 0.5) * L.cell, y: L.oy + (r + 0.5) * L.cell }; }
function anchor(c, r) { return { x: L.ox + (c + 0.5) * L.cell, y: slabTop(r) }; }

function layout() {
  const W = innerWidth, H = innerHeight;
  if (!W || !H) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR;
  L.cell = Math.min(W / COLS, H / ROWS);
  L.ox = (W - L.cell * COLS) / 2;
  L.oy = (H - L.cell * ROWS) / 2;
  L.w = W; L.h = H; L.gy = L.oy + L.cell * ROWS;
  if (!av.init) { const a = anchor(0, 0); av.px = a.x; av.py = a.y; av.init = true; }
}
addEventListener('resize', layout);
addEventListener('orientationchange', layout);

/* ================= AGENT ANIMATION STATE ================= */
const av = { init: false, fc: 0, fr: 0, tc: 0, tr: 0, t: 1, dur: 0, px: 0, py: 0,
             face: 1, pose: 'idle', phase: 0 };

/* ================= EFFECTS ================= */
function spawnSplash(c, r) {
  if (particles.length > 220) return;
  const p = cellCenter(c, r);
  for (let i = 0; i < 26; i++) {
    const an = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 150;
    particles.push({ x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 90,
      life: .6 + Math.random() * .5, age: 0, size: 2 + Math.random() * 3,
      col: Math.random() < .5 ? '#ff7a2f' : '#ffd166', grav: 260 });
  }
}
function spawnConfetti(c, r) {
  if (particles.length > 220) return;
  const p = anchor(c, r);
  for (let i = 0; i < 30; i++) {
    const an = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 170;
    particles.push({ x: p.x, y: p.y - L.cell * .3, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 80,
      life: .7 + Math.random() * .6, age: 0, size: 2 + Math.random() * 3,
      col: ['#0fbfa8', '#ffb703', '#e63946', '#ffffff'][(Math.random() * 4) | 0], grav: 200 });
  }
}
function floater(c, r, txt, col) {
  const p = cellCenter(c, r);
  floaters.push({ x: p.x, y: p.y, txt, col, age: 0 });
}
const CLOUDS = [
  { x: .12, y: .10, s: 1.1, sp: .010 }, { x: .55, y: .05, s: .8, sp: .016 },
  { x: .85, y: .16, s: 1.3, sp: .007 }, { x: .30, y: .22, s: .7, sp: .020 }
];
const BIRDS = [{ x: .2, y: .14, ph: 0 }, { x: .7, y: .09, ph: 2 }];

/* ================= HELPERS ================= */
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ================= SKY / BACKGROUND ================= */
function drawSky(g, t, dt) {
  const gy = Math.min(L.gy, L.h);
  const sky = g.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#5fb9ec'); sky.addColorStop(.65, '#a8dcf5'); sky.addColorStop(1, '#ffe9c4');
  g.fillStyle = sky; g.fillRect(0, 0, L.w, gy);
  // sun
  const sx = L.w * .84, sy = L.h * .12;
  g.save(); g.translate(sx, sy); g.rotate(t * .1);
  g.strokeStyle = 'rgba(255,214,90,.55)'; g.lineWidth = 3;
  for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6);
    g.beginPath(); g.moveTo(L.cell * .55, 0); g.lineTo(L.cell * .8, 0); g.stroke(); }
  g.restore();
  const sg = g.createRadialGradient(sx, sy, 2, sx, sy, L.cell * .55);
  sg.addColorStop(0, '#fff6c9'); sg.addColorStop(1, '#ffd166');
  g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, L.cell * .42, 0, 7); g.fill();
  // clouds
  for (const c of CLOUDS) {
    c.x += c.sp * dt; if (c.x > 1.25) c.x = -.25;
    const cx = c.x * L.w, cy = c.y * L.h, s = c.s * L.cell;
    g.fillStyle = 'rgba(255,255,255,.92)';
    g.beginPath();
    g.arc(cx, cy, s * .42, 0, 7); g.arc(cx + s * .5, cy + s * .12, s * .32, 0, 7);
    g.arc(cx - s * .52, cy + s * .14, s * .28, 0, 7); g.fill();
  }
  // birds
  for (const b of BIRDS) {
    b.x += .025 * dt; b.ph += dt * 6; if (b.x > 1.1) b.x = -.1;
    const bx = b.x * L.w, by = b.y * L.h + Math.sin(b.ph * .5) * 6, w = L.cell * .12;
    g.strokeStyle = 'rgba(23,35,59,.5)'; g.lineWidth = 2; g.lineCap = 'round';
    const f = Math.sin(b.ph) * w * .5;
    g.beginPath(); g.moveTo(bx - w, by - f); g.quadraticCurveTo(bx - w * .4, by + w * .5, bx, by);
    g.quadraticCurveTo(bx + w * .4, by + w * .5, bx + w, by - f); g.stroke();
  }
  // hills + ground field
  if (L.gy < L.h) {
    g.fillStyle = '#79b95c';
    g.beginPath(); g.ellipse(L.w * .2, L.gy + 10, L.w * .5, L.cell * 1.1, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(L.w * .85, L.gy + 12, L.w * .55, L.cell * 1.4, 0, Math.PI, 0); g.fill();
    const gg = g.createLinearGradient(0, L.gy, 0, L.h);
    gg.addColorStop(0, '#7ec850'); gg.addColorStop(.18, '#5aa63c'); gg.addColorStop(1, '#8a5a33');
    g.fillStyle = gg; g.fillRect(0, L.gy, L.w, L.h - L.gy);
    for (let i = 0; i < 14; i++) {
      const fx = hash(i, 3) * L.w, fy = L.gy + 8 + hash(i, 7) * Math.max(4, L.h - L.gy - 14);
      g.fillStyle = ['#fff', '#ffd166', '#ff8fa3'][i % 3];
      g.beginPath(); g.arc(fx, fy, 2.2, 0, 7); g.fill();
    }
  }
}

/* ================= TILES ================= */
function drawLavaColumn(g, t) {
  const gc = cellCenter(0, 5);
  const gl = g.createRadialGradient(gc.x, gc.y, L.cell, gc.x, gc.y, L.cell * 4);
  gl.addColorStop(0, 'rgba(255,110,40,.20)'); gl.addColorStop(1, 'rgba(255,110,40,0)');
  g.fillStyle = gl; g.fillRect(0, 0, L.w, L.h);
  for (let r = 1; r < ROWS - 1; r++) {
    const x = L.ox, y = L.oy + r * L.cell, cs = L.cell;
    const hot = .75 + .25 * Math.sin(t * 2.4 + r * .9);
    g.save(); g.shadowColor = 'rgba(255,120,40,.75)'; g.shadowBlur = cs * .3;
    const lg = g.createLinearGradient(0, y, 0, y + cs);
    lg.addColorStop(0, `rgba(255,170,60,${hot})`);
    lg.addColorStop(.5, `rgba(255,106,43,${hot})`);
    lg.addColorStop(1, `rgba(214,48,20,${hot})`);
    rr(g, x + 1, y + 1, cs - 2, cs - 2, cs * .1); g.fillStyle = lg; g.fill(); g.restore();
    // wobbly bright surface
    g.strokeStyle = `rgba(255,230,150,${.8 * hot})`; g.lineWidth = cs * .07; g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i <= 4; i++) {
      const wx = x + cs * .15 + i * cs * .7 / 4;
      const wy = y + cs * .16 + Math.sin(t * 3 + i * 1.7 + r) * cs * .04;
      i ? g.lineTo(wx, wy) : g.moveTo(wx, wy);
    }
    g.stroke();
    // bubbles
    for (let b = 0; b < 2; b++) {
      const h1 = hash(b * 5 + 1, r * 13), cyc = ((t * (.3 + h1 * .3)) + h1) % 1;
      g.fillStyle = `rgba(255,236,170,${(1 - cyc) * .7})`;
      g.beginPath();
      g.arc(x + cs * (.3 + h1 * .4), y + cs * .9 - cyc * cs * .7, cs * .05 * (1 - cyc * .4) + .8, 0, 7);
      g.fill();
    }
    g.fillStyle = 'rgba(120,20,5,.25)'; g.fillRect(x + 1, y + cs - 2, cs - 2, 2);
  }
  if (Math.random() < .08 && particles.length < 200) {
    const r = 1 + ((Math.random() * (ROWS - 2)) | 0);
    const p = cellCenter(0, r);
    particles.push({ x: p.x + (Math.random() - .5) * L.cell * .5, y: p.y, vx: (Math.random() - .5) * 12,
      vy: -30 - Math.random() * 30, life: 1.2, age: 0, size: 1.6, col: '#ffb703', grav: -12 });
  }
}
function drawPlatforms(g, t) {
  const cs = L.cell, sh = SLAB();
  for (let r = 0; r < ROWS; r++) {
    const c0 = (r === 0 || r === ROWS - 1) ? 0 : 1, c1 = COLS - 1;
    const x = L.ox + c0 * cs, w = (c1 - c0 + 1) * cs, y = slabTop(r);
    // dirt body
    g.fillStyle = '#9c6b3f'; rr(g, x, y + sh * .3, w, sh * .7 + cs * .06, cs * .07); g.fill();
    g.fillStyle = 'rgba(90,50,20,.35)';
    for (let i = 0; i < w / cs * 3; i++) {
      const dx = x + hash(i, r) * w, dy = y + sh * .45 + hash(i * 3, r + 9) * sh * .5;
      g.beginPath(); g.arc(dx, dy, cs * .03, 0, 7); g.fill();
    }
    // grass top with lip
    g.fillStyle = '#6fcf4f'; rr(g, x - 2, y, w + 4, sh * .38, cs * .08); g.fill();
    g.fillStyle = '#a5e88b'; rr(g, x - 2, y, w + 4, sh * .13, cs * .06); g.fill();
    // tufts at ends
    for (const ex of [x, x + w]) {
      g.strokeStyle = '#6fcf4f'; g.lineWidth = 2; g.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        g.beginPath(); g.moveTo(ex + k * 3, y);
        g.lineTo(ex + k * 4 + Math.sin(t * 2 + k) * 1.5, y - cs * .08); g.stroke();
      }
    }
  }
}
function drawMarkers(g, t) {
  const cs = L.cell;
  // start sign
  { const p = anchor(0, 0);
    g.save(); g.translate(p.x, p.y); g.rotate(Math.sin(t * 1.4) * .03);
    g.fillStyle = '#8a5a33'; g.fillRect(-cs * .035, -cs * .5, cs * .07, cs * .5);
    g.fillStyle = '#c98a4b'; rr(g, -cs * .42, -cs * .78, cs * .84, cs * .32, cs * .07); g.fill();
    g.strokeStyle = '#8a5a33'; g.lineWidth = 2; rr(g, -cs * .42, -cs * .78, cs * .84, cs * .32, cs * .07); g.stroke();
    g.fillStyle = '#fff'; g.font = `${cs * .15}px Bungee`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('START', 0, -cs * .61); g.restore(); }
  // goal flag
  { const p = anchor(GOAL.c, GOAL.r);
    const ph = cs * 2.0;
    g.fillStyle = '#e8e8e8'; g.fillRect(p.x - 1.5, p.y - ph, 3, ph);
    g.fillStyle = '#ffb703'; g.beginPath(); g.arc(p.x, p.y - ph, cs * .07, 0, 7); g.fill();
    const wv = Math.sin(t * 5) * cs * .06;
    g.fillStyle = '#0fbfa8';
    g.beginPath(); g.moveTo(p.x + 2, p.y - ph + cs * .06);
    g.quadraticCurveTo(p.x + cs * .35, p.y - ph + cs * .1 + wv, p.x + cs * .62, p.y - ph + cs * .2 + wv);
    g.lineTo(p.x + 2, p.y - ph + cs * .42); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.font = `${cs * .14}px Bungee`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('★', p.x + cs * .24, p.y - ph + cs * .24 + wv * .5);
    if (Math.random() < .05 && particles.length < 200)
      particles.push({ x: p.x + (Math.random() - .5) * cs, y: p.y - Math.random() * ph,
        vx: 0, vy: -14, life: 1, age: 0, size: 1.6, col: '#ffd166', grav: -6 }); }
}

/* ================= AGENT SPRITE ================= */
function drawAgent(g, x, y, s, pose, phase, face, t) {
  g.save(); g.translate(x, y); g.scale(face, 1);
  const legH = s * .15, bodyH = s * .24, headR = s * .155;
  const swing = pose === 'walk' ? Math.sin(phase) * .55
    : pose === 'jump' ? .8 : pose === 'fall' ? .35 : Math.sin(t * 2) * .06;
  // legs
  for (const i of [-1, 1]) {
    const ang = swing * i * (pose === 'jump' ? .9 : 1);
    const hx = i * s * .075, hy = -legH;
    const fx = hx + Math.sin(ang) * legH, fy = hy + Math.cos(ang) * legH * (pose === 'jump' ? .6 : 1);
    g.strokeStyle = '#2456c9'; g.lineWidth = s * .09; g.lineCap = 'round';
    g.beginPath(); g.moveTo(hx, hy); g.lineTo(fx, fy); g.stroke();
    g.fillStyle = '#6b3f1d'; g.beginPath(); g.ellipse(fx + s * .02, fy, s * .075, s * .05, 0, 0, 7); g.fill();
  }
  const bodyTop = -legH - bodyH;
  // arms
  for (const dir of [-1, 1]) {
    const aAng = -swing * .8 * dir + (pose === 'jump' ? -2.1 * dir : pose === 'fall' ? -1.6 * dir : 0);
    const sx = dir * s * .13, sy = bodyTop + bodyH * .25;
    const ex = sx + Math.sin(aAng) * s * .14, ey = sy + Math.cos(aAng) * s * .14;
    g.strokeStyle = '#e33d2e'; g.lineWidth = s * .075; g.lineCap = 'round';
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
    g.fillStyle = '#ffcf9f'; g.beginPath(); g.arc(ex, ey, s * .045, 0, 7); g.fill();
  }
  // overalls
  g.fillStyle = '#2456c9'; rr(g, -s * .15, bodyTop, s * .3, bodyH + legH * .4, s * .08); g.fill();
  g.fillStyle = '#ffd166';
  g.beginPath(); g.arc(-s * .07, bodyTop + bodyH * .3, s * .028, 0, 7);
  g.arc(s * .07, bodyTop + bodyH * .3, s * .028, 0, 7); g.fill();
  // head
  const hy2 = bodyTop - headR * .85;
  g.fillStyle = '#ffcf9f'; g.beginPath(); g.arc(0, hy2, headR, 0, 7); g.fill();
  g.fillStyle = '#6b3f1d';
  g.beginPath(); g.ellipse(headR * .45, hy2 + headR * .35, headR * .42, headR * .18, .2, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(headR * .42, hy2 - headR * .12, headR * .26, 0, 7); g.fill();
  if ((t % 3.4) < .12) {
    g.strokeStyle = '#17233b'; g.lineWidth = s * .02;
    g.beginPath(); g.moveTo(headR * .28, hy2 - headR * .12); g.lineTo(headR * .58, hy2 - headR * .12); g.stroke();
  } else {
    g.fillStyle = '#17233b'; g.beginPath(); g.arc(headR * .5, hy2 - headR * .12, headR * .12, 0, 7); g.fill();
  }
  // cap
  g.fillStyle = '#e33d2e'; g.beginPath(); g.arc(0, hy2 - headR * .25, headR * .95, Math.PI, 0); g.fill();
  g.fillStyle = '#c22b1d'; rr(g, headR * .1, hy2 - headR * .42, headR * 1.15, headR * .22, headR * .11); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(0, hy2 - headR * .62, headR * .2, 0, 7); g.fill();
  g.restore();
}

/* ================= MAIN RENDER ================= */
function render(dt, t) {
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, L.w, L.h);
  drawSky(g, t, dt);
  drawLavaColumn(g, t);
  drawPlatforms(g, t);

  const cs = L.cell;
  // heatmap on slabs
  if (flags.heat) {
    let lo = Infinity, hi = -Infinity;
    for (let s = 0; s < STATES; s++) { const v = maxQ(s); if (v < lo) lo = v; if (v > hi) hi = v; }
    if (hi - lo > 1e-6) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cellType(c, r) === 'cliff') continue;
      const v = (maxQ(idxOf(c, r)) - lo) / (hi - lo);
      g.fillStyle = `rgba(${(20 + 235 * v) | 0},${(80 + 100 * v) | 0},${(200 - 160 * v) | 0},${.15 + .3 * v})`;
      rr(g, L.ox + c * cs + 2, slabTop(r), cs - 4, SLAB() * .38, cs * .08); g.fill();
    }
  }
  // policy arrows
  if (flags.pol) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (cellType(c, r) === 'cliff') continue;
    const b = idxOf(c, r) * 4;
    let mx = -Infinity, mn = Infinity, me = 0, ai = 0;
    for (let a = 0; a < 4; a++) { const q = Q[b + a]; if (q > mx) { mx = q; ai = a; } if (q < mn) mn = q; me += q; }
    me /= 4; if (mx - mn < 1e-9) continue;
    const p = cellCenter(c, r), conf = Math.min(1, (mx - me) / (mx - mn + 1e-9) + .35);
    g.save(); g.translate(p.x, p.y - cs * .1); g.rotate(ANG[ai]);
    g.strokeStyle = `rgba(255,255,255,${.25 + .5 * conf})`; g.lineWidth = 2.5; g.lineCap = 'round';
    const k = cs * .16;
    g.beginPath(); g.moveTo(-k * .6, -k * .7); g.lineTo(k * .55, 0); g.lineTo(-k * .6, k * .7); g.stroke();
    g.restore();
  }
  drawMarkers(g, t);
  // trail dust
  if (flags.trail) { const n = trail.length;
    for (let i = 0; i < n; i++) { const p = anchor(trail[i].c, trail[i].r);
      g.fillStyle = `rgba(255,255,255,${(i / n) * .4})`;
      g.beginPath(); g.arc(p.x, p.y - 2, cs * .06, 0, 7); g.fill(); } }

  // ---- agent hop animation ----
  if (env.c !== av.tc || env.r !== av.tr) {
    av.fc = av.tc; av.fr = av.tr; av.tc = env.c; av.tr = env.r; av.t = 0;
    const dx = av.tc - av.fc, dy = av.tr - av.fr;
    if (dx) av.face = dx > 0 ? 1 : -1;
    av.pose = dy < 0 ? 'jump' : dy > 0 ? 'fall' : 'walk';
    av.dur = curSps() <= 30 ? Math.min(.22, Math.max(.09, .9 / curSps())) : 0;
    if (av.dur === 0) { const a = anchor(av.tc, av.tr); av.px = a.x; av.py = a.y; av.pose = 'idle'; }
  }
  av.t += dt;
  if (av.pose === 'walk') av.phase += dt * 11;
  const p = av.dur > 0 ? Math.min(1, av.t / av.dur) : 1;
  const A = anchor(av.fc, av.fr), B = anchor(av.tc, av.tr);
  av.px = A.x + (B.x - A.x) * p;
  av.py = A.y + (B.y - A.y) * p - Math.sin(Math.PI * p) * cs * (av.pose === 'fall' ? .1 : .3);
  if (p >= 1 && av.pose !== 'idle') av.pose = 'idle';

  if (!agentHidden) {
    const air = Math.max(0, slabTop(av.tr) - av.py);
    const k = Math.max(.35, 1 - air / cs);
    g.fillStyle = `rgba(23,35,59,${.22 * k})`;
    g.beginPath(); g.ellipse(av.px, slabTop(av.tr), cs * .2 * k, cs * .06 * k, 0, 0, 7); g.fill();
    drawAgent(g, av.px, av.py, cs, av.pose, av.phase, av.face, t);
  }
  // particles
  for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.age += dt;
    if (q.age >= q.life) { particles.splice(i, 1); continue; }
    q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    g.globalAlpha = 1 - q.age / q.life; g.fillStyle = q.col;
    g.beginPath(); g.arc(q.x, q.y, q.size, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // floaters
  g.textAlign = 'center'; g.font = `${Math.max(12, cs * .3)}px Bungee`;
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.age += dt;
    if (f.age > 1) { floaters.splice(i, 1); continue; }
    g.globalAlpha = 1 - f.age; g.fillStyle = f.col;
    g.fillText(f.txt, f.x, f.y - cs * .4 - f.age * cs * .6); }
  g.globalAlpha = 1;
}

/* ================= CHART (light theme) ================= */
const YMIN = -160, YMAX = 10;
function drawChart() {
  const W = chartCv.clientWidth, H = chartCv.clientHeight;
  if (!W) return;
  chartCv.width = W * DPR; chartCv.height = H * DPR;
  const g = chartCv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pl = 30, pr = 6, pt = 6, pb = 4;
  const y = v => pt + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - pt - pb);
  g.font = '700 8.5px "Baloo 2"'; g.textBaseline = 'middle';
  for (const gv of [-150, -100, -50]) {
    g.strokeStyle = '#dfe8f4'; g.beginPath(); g.moveTo(pl, y(gv)); g.lineTo(W - pr, y(gv)); g.stroke();
    g.fillStyle = '#9aabc4'; g.textAlign = 'right'; g.fillText(gv, pl - 4, y(gv));
  }
  g.setLineDash([4, 4]); g.strokeStyle = '#0fbfa8';
  g.beginPath(); g.moveTo(pl, y(-12)); g.lineTo(W - pr, y(-12)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#0fbfa8'; g.textAlign = 'right'; g.fillText('optimal −12', W - pr, y(-12) - 5);
  const N = Math.min(returns.length, 400);
  if (N < 2) {
    g.fillStyle = '#9aabc4'; g.textAlign = 'center'; g.font = '700 10px "Baloo 2"';
    g.fillText('no episodes yet — press ▶', W / 2, H / 2); return;
  }
  const data = returns.slice(-N), x = i => pl + i / (N - 1) * (W - pl - pr);
  const cy = v => Math.max(pt, Math.min(H - pb, y(Math.max(YMIN + 2, Math.min(YMAX - 2, v)))));
  g.strokeStyle = 'rgba(23,35,59,.25)'; g.lineWidth = 1; g.beginPath();
  data.forEach((v, i) => i ? g.lineTo(x(i), cy(v)) : g.moveTo(x(i), cy(v)));
  g.stroke();
  const pre = [0]; for (const v of data) pre.push(pre[pre.length - 1] + v);
  g.strokeStyle = '#ff6a2b'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x(0), cy(data[0]));
  for (let i = 1; i < N; i++) { const w = Math.min(i + 1, 30);
    g.lineTo(x(i), cy((pre[i + 1] - pre[i + 1 - w]) / w)); }
  g.stroke();
}