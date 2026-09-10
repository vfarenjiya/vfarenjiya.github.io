'use strict';
function layout() {
  const W = innerWidth, H = innerHeight;
  if (!W || !H) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR;
  const top = 66, bottom = 104;
  const availH = Math.max(220, H - top - bottom);
  L.s = Math.min(W / WORLD.w, availH / WORLD.h);
  L.ox = (W - WORLD.w * L.s) / 2;
  L.gy = top + Math.max(0, (availH - WORLD.h * L.s) / 2) + WORLD.h * L.s;
  L.w = W; L.h = H; L.oy = L.gy - WORLD.h * L.s;
  terrKey = '';                       // force terrain rebuild
  if (!view.ready) { view.x = env.x; view.y = env.y; view.ready = true; }
}
addEventListener('resize', layout);
addEventListener('orientationchange', layout);

/* ================= EFFECTS (world coords) ================= */
let shake = 0, bannerT = 0, bannerTxt = '', bannerCol = '', bannerSub = '';
function floater(x, y, txt, col) { floaters.push({ x, y, txt, col, age: 0 }); }
function spawnCrash(x, y) {
  shake = 1; bannerT = 1.5; bannerTxt = 'CRASH ✗'; bannerCol = '#ff5a4d';
  bannerSub = 'every fireball updates the Q-table';
  if (particles.length > 240) return;
  for (let i = 0; i < 40; i++) {
    const an = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 16;
    particles.push({ x, y: y + 1, vx: Math.cos(an) * sp, vy: Math.abs(Math.sin(an)) * sp,
      life: .6 + Math.random() * .9, age: 0, size: 1.5 + Math.random() * 3,
      col: ['#fff6c9', '#ff7a2f', '#d8a53a', '#8b93a7'][(Math.random() * 4) | 0], grav: -WORLD.g });
  }
  particles.push({ x, y: y + 2, vx: 0, vy: 0, life: .18, age: 0, size: 40, col: '#ffffff', grav: 0, flash: true });
}
function spawnDust(x, y) {
  shake = .35; bannerT = 1.5; bannerTxt = 'TOUCHDOWN ✓'; bannerCol = '#7dffa8';
  bannerSub = 'textbook soft landing';
  if (particles.length > 240) return;
  for (let i = 0; i < 34; i++) {
    const d = Math.random() < .5 ? -1 : 1, sp = 3 + Math.random() * 9;
    particles.push({ x: x + d * Math.random() * 2, y: y + .3, vx: d * sp, vy: 1 + Math.random() * 3,
      life: .8 + Math.random() * .8, age: 0, size: 1.5 + Math.random() * 2.5,
      col: ['#b9bcc2', '#9aa0a8', '#82868d'][(Math.random() * 3) | 0], grav: -WORLD.g });
  }
}
const STARS = Array.from({ length: 150 }, () => ({
  x: Math.random(), y: Math.random() * .75, s: .4 + Math.random() * 1.3,
  a: .25 + Math.random() * .7, ph: Math.random() * 6 }));
const ROCKS = Array.from({ length: 9 }, (_, i) => ({
  x: 3 + hash(i, 11) * 94, r: .8 + hash(i, 5) * 2.2 }));
const CRATERS = Array.from({ length: 5 }, (_, i) => ({
  x: 5 + hash(i, 21) * 90, r: 3 + hash(i, 17) * 6 }));

/* ================= MAIN RENDER ================= */
function render(dt, t) {
  const g = cv.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, L.w, L.h);
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.6);
    g.translate((Math.random() - .5) * 10 * shake, (Math.random() - .5) * 10 * shake);
  }
  drawSpace(g, t, dt);
  drawTerrain(g, t);
  drawOverlays(g);
  const s = L.s;
  // engine glow on regolith
  if (view.thrust > .25) {
    const px = sx(view.x), py = sy(view.y);
    const lg = g.createRadialGradient(px, py + s * 2, 1, px, py + s * 2, s * 16);
    lg.addColorStop(0, `rgba(190,220,255,${.22 * view.thrust})`);
    lg.addColorStop(1, 'rgba(190,220,255,0)');
    g.fillStyle = lg; g.fillRect(px - s * 16, py - s * 6, s * 32, s * 24);
  }
  // ground shadow
  if (!agentHidden) {
    const gh = groundH(view.x), alt = Math.max(0, view.y - gh);
    const k = clamp(1 - alt / 130, .12, 1);
    g.fillStyle = `rgba(0,0,0,${.35 * k})`;
    g.beginPath(); g.ellipse(sx(view.x), sy(gh) + 2, s * 2.4 * k, s * .5 * k, 0, 0, 7); g.fill();
  }
  if (flags.trail) { const n = trail.length;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgba(255,170,80,${(i / n) * .35})`;
      g.beginPath(); g.arc(sx(trail[i].x), sy(trail[i].y), 1 + (i / n) * 2, 0, 7); g.fill(); } }
  const rate = curSps() <= 30 ? 9 : 40, k = 1 - Math.exp(-dt * rate);
  view.x += (env.x - view.x) * k; view.y += (env.y - view.y) * k;
  const tT = clamp(env.lat * .14 + env.vx * .03, -.35, .35);
  view.tilt += (tT - view.tilt) * (1 - Math.exp(-dt * 10));
  view.thrust += ((env.mainOn ? 1 : 0) - view.thrust) * (1 - Math.exp(-dt * 14));
  if (!agentHidden)
    drawLM(g, sx(view.x), sy(view.y), s, view.tilt, view.thrust > .4, env.lat, t);
  for (let i = particles.length - 1; i >= 0; i--) { const q = particles[i]; q.age += dt;
    if (q.age >= q.life) { particles.splice(i, 1); continue; }
    q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    g.globalAlpha = 1 - q.age / q.life; g.fillStyle = q.col;
    if (q.flash) g.fillRect(0, 0, L.w, L.h);
    else { g.beginPath(); g.arc(sx(q.x), sy(q.y), q.size, 0, 7); g.fill(); } }
  g.globalAlpha = 1;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${Math.max(12, s * 4)}px "Space Grotesk"`;
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.age += dt;
    if (f.age > 1.1) { floaters.splice(i, 1); continue; }
    g.globalAlpha = 1 - f.age / 1.1; g.fillStyle = f.col;
    g.fillText(f.txt, sx(f.x), sy(f.y) - f.age * 40); }
  g.globalAlpha = 1;
  // result banner
  if (bannerT > 0) {
    bannerT -= dt;
    const a = clamp(Math.min((1.5 - bannerT) * 4, bannerT * 1.6), 0, 1);
    g.globalAlpha = a;
    g.font = `${s * 6.5}px Bungee`; g.fillStyle = bannerCol;
    g.fillText(bannerTxt, L.w / 2, L.h * .38);
    g.font = `600 ${Math.max(11, s * 2.6)}px "Space Grotesk"`;
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.fillText(bannerSub, L.w / 2, L.h * .38 + s * 6);
    g.globalAlpha = 1;
  }
  drawTape(g);
  if (typeof timeScale !== 'undefined' && timeScale < 1) {
    g.font = `10px Bungee`; g.fillStyle = 'rgba(53,224,200,.9)';
    g.textAlign = 'center';
    g.fillText('· SLOW-MO ·', L.w / 2, 58);
  }
}
function spawnMedal(x, y) {
  if (particles.length > 240) return;
  for (let i = 0; i < 50; i++) {
    const an = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 14;
    particles.push({ x, y: y + 1, vx: Math.cos(an) * sp, vy: Math.abs(Math.sin(an)) * sp + 4,
      life: 1 + Math.random() * .8, age: 0, size: 1.5 + Math.random() * 2.5,
      col: ['#ffd166', '#fff6c9', '#ffb703', '#ffffff'][(Math.random() * 4) | 0], grav: -WORLD.g });
  }
}