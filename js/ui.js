'use strict';
let hudT = 0, polT = 0, timeScale = 1, pd = null;
function updateHud() {
  epVal.textContent = episodes;
  const e = mode === 'train' ? curEps() : 0;
  epsVal.textContent = e.toFixed(2);
  epsVal.style.color = e > .3 ? 'var(--lava)' : 'var(--teal)';
  lastVal.textContent = returns.length ? Math.round(returns[returns.length - 1]) : '—';
  bestVal.textContent = bestAvg == null ? '—' : bestAvg.toFixed(0);
  lenVal.textContent = env.snake.length;
  foodVal.textContent = env.foods;
  stepVal.textContent = env.steps;
  updVal.textContent = updates + '·' + env.foods;
  const mEl = $('#medals');
  if (mEl) mEl.textContent = 'MEDALS ' + (bestLen >= 10 ? '🥉' : '·') + ' ' +
    (bestLen >= 20 ? '🥈' : '·') + ' ' + (bestLen >= 50 ? '🥇' : '·') + ' ' + (bestLen >= 100 ? '🏆' : '·');
  if (mode === 'play' || mode === 'you') {
    runsVal.textContent = mode === 'you' ? youRuns : playRuns;
    playLastEl.textContent = mode === 'you' ? ('best ' + youBest) : playLast;
    playLastEl.style.color = 'var(--teal)';
  }
  brainInfo();
}
function brainInfo() {
  const el = $('#brainInfo'); if (!el) return;
  el.textContent =
    'TABULAR Q  72 states × 3 actions = 216 values · visited ' + visitedN + '/72\n' +
    'updates ' + updates + ' · |δ| ' + tdErr.toFixed(3) + ' · best len ' + bestLen + '\n' +
    'shield overrides ' + shieldCount + ' · YOU best ' + youBest + ' food\n' +
    'ε     ' + curEps().toFixed(3) + '  =  ' + params.epsEnd + ' + ' + params.epsStart + '·e^(−ep/' + params.halfLife + ')\n' +
    'Q(s,a) ← Q + α·[ r + γ·max Q(s′,·) − Q ]   α=' + (params.alpha || 0.5) + ' γ=' + params.gamma;
}
let lastT = performance.now();
function frame(now) {
  let dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
  dt *= timeScale;
  if (running) {
    if (respawnT > 0) { respawnT -= dt; if (respawnT <= 0) beginEpisode(); }
    else {
      acc += dt * curSps();
      let n = Math.min(acc | 0, 3000); acc -= n;
      let i = 0;
      while (i++ < n) {
        try { doStep(mode); } catch (e) { console.error('step:', e); break; }   // HARDENING: never freeze the loop
        if (respawnT > 0) break;
      }
    }
  }
  try { render(dt, now / 1000); } catch (e) { console.error('render:', e); }
  if (chartDirty) { drawChart(); chartDirty = false; }
  hudT += dt;
  if (hudT > .12) { hudT = 0; updateHud(); }
  if (sheet.classList.contains('open')) {
    polT += dt;
    if (polT > .3) { polT = 0; drawPolicyMap(); }
  }
  requestAnimationFrame(frame);
}
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}
function setSeg(el, i) {
  el.querySelector('.thumb').style.transform = `translateX(${i * 100}%)`;
  [...el.querySelectorAll('button')].forEach((b, j) => b.classList.toggle('on', j === i));
}
function updateTransport() {
  btnStart.textContent = running ? '⏸' : '▶';
  btnStart.classList.toggle('running', running);
}
const sheet = $('#sheet'), scrim = $('#scrim');
function openSheet(o) {
  sheet.classList.toggle('open', o); scrim.classList.toggle('show', o);
  if (o) { chartDirty = true; drawPolicyMap(); }
}
function setMode(m) {
  if (m === mode) return;
  saveBrain(); mode = m;
  setSeg($('#segMode'), m === 'train' ? 0 : m === 'play' ? 1 : 2);
  $('#trainBody').hidden = m !== 'train';
  $('#playBody').hidden = m === 'train';
  if (m === 'you')
    playHint.textContent = 'Swipe on the board (or use arrow keys) to steer. The AI safety shield is OFF for you — and every run you play teaches the table.';
  else if (m === 'play')
    playHint.textContent = episodes === 0
      ? 'Spinning in circles? The brain is untrained — switch to TRAIN first.'
      : 'Greedy exhibition (shield ON). Runs still count as on-policy experience.';
  if (m !== 'train') running = true;
  acc = 0; respawnT = 0; youAct = null; beginEpisode(); updateTransport(); updateHud();
}
/* input: slow-mo hold (train/play) + swipe steering (YOU) */
cv.addEventListener('pointerdown', e => {
  if (mode === 'you') pd = { x: e.clientX, y: e.clientY };
  else if (running && curSps() <= 30) timeScale = .35;
});
cv.addEventListener('pointermove', e => {
  if (mode === 'you' && pd) {
    const dx = e.clientX - pd.x, dy = e.clientY - pd.y;
    if (Math.hypot(dx, dy) > 24) { youAct = dirToRel(dx, dy); pd = { x: e.clientX, y: e.clientY }; }
  }
});
addEventListener('pointerup', () => { pd = null; timeScale = 1; });
addEventListener('pointercancel', () => { pd = null; timeScale = 1; });
addEventListener('keydown', e => {
  if (mode !== 'you') return;
  const k = e.key;
  if (k === 'ArrowUp') youAct = dirToRel(0, -1);
  else if (k === 'ArrowDown') youAct = dirToRel(0, 1);
  else if (k === 'ArrowLeft') youAct = dirToRel(-1, 0);
  else if (k === 'ArrowRight') youAct = dirToRel(1, 0);
});
function dirToRel(dx, dy) {
  let ad;
  if (Math.abs(dx) > Math.abs(dy)) ad = dx > 0 ? 1 : 3;
  else ad = dy > 0 ? 2 : 0;
  const diff = (ad - env.dir + 4) % 4;
  return diff === 0 ? 0 : diff === 3 ? 1 : diff === 1 ? 2 : 0;   // reverse → ignore
}
cv.addEventListener('contextmenu', e => e.preventDefault());
$('#segMode').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });
btnStart.addEventListener('click', () => {
  S(); running = !running;
  if (!running && mode === 'train') saveBrain(true);
  updateTransport();
});
$('#btnGear').addEventListener('click', () => openSheet(!sheet.classList.contains('open')));
$('#handle').addEventListener('click', () => openSheet(false));
scrim.addEventListener('click', () => openSheet(false));
$('#btnReset').addEventListener('click', resetBrain);
$('#speed').addEventListener('input', e => {
  speedIdx = +e.target.value;
  $('#spdVal').textContent = SPEEDS[speedIdx] <= 30 ? SPEEDS[speedIdx] + ' st/s' : 'TURBO ×' + SPEEDS[speedIdx];
});
const SLIDERS = [
  ['alpha',    'α · LEARNING RATE',        0.05, 1, 0.05, v => v.toFixed(2)],
  ['gamma',    'γ · DISCOUNT',             0.80, 1, 0.01, v => v.toFixed(2)],
  ['epsStart', 'ε · EXPLORE START',        0, 1, 0.01, v => v.toFixed(2)],
  ['epsEnd',   'ε · EXPLORE FLOOR',        0, 0.5, 0.01, v => v.toFixed(2)],
  ['halfLife', 'ε · HALF-LIFE (EPISODES)', 5, 400, 1, v => v | 0, true],
];
{
  const grid = $('#paramGrid');
  for (const [key, label, min, max, step, fmt, full] of SLIDERS) {
    const d = document.createElement('div');
    d.className = 'pm' + (full ? ' full' : '');
    d.innerHTML = `<div class="cap"><span>${label}</span><b id="pv_${key}"></b></div>
      <input type="range" id="pr_${key}" min="${min}" max="${max}" step="${step}">`;
    grid.appendChild(d);
    const inp = d.querySelector('input'), out = d.querySelector('b');
    inp.value = params[key]; out.textContent = fmt(params[key]);
    inp.addEventListener('input', () => { params[key] = +inp.value; out.textContent = fmt(params[key]); });
  }
}
for (const [id, key] of [['tglGrid', 'grid'], ['tglGlow', 'glow'], ['tglSense', 'sense']]) {
  const b = document.getElementById(id);
  b.classList.toggle('on', flags[key]);
  b.addEventListener('click', () => { flags[key] = !flags[key]; b.classList.toggle('on', flags[key]); });
}
$('#btnSound').addEventListener('click', function () {
  soundOn = !soundOn; this.classList.toggle('on', soundOn); S();
});
$('#btnFS').addEventListener('click', async () => {
  try { await document.documentElement.requestFullscreen(); await screen.orientation.lock('portrait'); } catch (e) {}
});
let deferredPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#btnInstall').hidden = false; });
$('#btnInstall').addEventListener('click', async () => {
  if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice;
  deferredPrompt = null; $('#btnInstall').hidden = true;
});
function checkOri() {
  document.body.classList.toggle('blocked',
    matchMedia('(orientation:landscape)').matches && innerHeight < 560 && ('ontouchstart' in window));
}
addEventListener('resize', checkOri);
addEventListener('orientationchange', checkOri);
addEventListener('pagehide', () => saveBrain());
document.addEventListener('visibilitychange', () => { if (document.hidden) saveBrain(); });
const splash = $('#splash'), coach = $('#coach');
splash.addEventListener('pointerdown', () => {
  splash.classList.add('gone'); S();
  setTimeout(() => splash.remove(), 600);
  setTimeout(() => {
    try { if (!localStorage.getItem('snake-coach')) coach.classList.add('show'); } catch (e) {}
  }, 650);
}, { once: true });
coach.addEventListener('pointerdown', () => {
  coach.classList.remove('show');
  try { localStorage.setItem('snake-coach', '1'); } catch (e) {}
}, { once: true });

const hadSave = loadBrain();
setSeg($('#segMode'), 0);
$('#btnSound').classList.toggle('on', soundOn);
for (const [key] of SLIDERS) {
  const i = $('#pr_' + key);
  if (i) { i.value = params[key]; $('#pv_' + key).textContent = (+params[key]).toFixed(key === 'halfLife' ? 0 : 2); }
}
if (hadSave && episodes > 0) toast('SAVED BRAIN LOADED · EP ' + episodes);
layout(); beginEpisode(); updateTransport(); updateHud(); checkOri(); brainInfo();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator)
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));