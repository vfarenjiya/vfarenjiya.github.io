'use strict';
let hudT = 0, timeScale = 1;
function updateHud() {
  epVal.textContent = episodes;
  const e = mode === 'play' ? 0 : curEps();
  epsVal.textContent = e.toFixed(2);
  epsVal.style.color = e > .3 ? 'var(--lava)' : 'var(--teal)';
  lastVal.textContent = returns.length ? Math.round(returns[returns.length - 1]) : '—';
  bestVal.textContent = bestAvg == null ? 'BEST —' : 'BEST ' + bestAvg.toFixed(0);
  lenVal.textContent = env.snake.length;
  foodVal.textContent = env.foods;
  stepVal.textContent = env.steps;
  if (mode === 'play') {
    runsVal.textContent = playRuns; playLastEl.textContent = playLast;
    playLastEl.style.color = 'var(--teal)';
  }
  brainInfo();
}
function brainInfo() {
  const el = $('#brainInfo'); if (!el) return;
  el.textContent =
    'DQN  648→80→40→3 · ~55k params · replay ' + repLen + '/' + REPLAY + '\n' +
    'updates ' + updates + ' · TD-loss ' + lastLoss.toFixed(3) + ' · target sync every ' + TARGET_EVERY + '\n' +
    'ε     ' + curEps().toFixed(3) + '  =  ' + params.epsEnd + ' + ' + params.epsStart + '·e^(−ep/' + params.halfLife + ')\n' +
    'Q(s,a) ← Q + α_adam·[ r + γ·max Q_target(s′,·) − Q ]   γ=' + params.gamma;
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
        doStep(mode === 'play');
        if (!mode_play_greedy() && env.steps % TRAIN_EVERY === 0) trainFromReplay();
        if (respawnT > 0) break;
      }
    }
  }
  try { render(dt, now / 1000); } catch (e) { console.error('render:', e); }
  if (chartDirty) { drawChart(); chartDirty = false; }
  hudT += dt; if (hudT > .12) { hudT = 0; updateHud(); }
  requestAnimationFrame(frame);
}
const mode_play_greedy = () => mode === 'play';
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
  if (o) chartDirty = true;
}
function setMode(m) {
  if (m === mode) return;
  saveBrain(); mode = m;
  setSeg($('#segMode'), m === 'train' ? 0 : 1);
  $('#trainBody').hidden = m !== 'train'; $('#playBody').hidden = m !== 'play';
  if (m === 'play') running = true;
  acc = 0; respawnT = 0; beginEpisode(); updateTransport(); updateHud();
}
cv.addEventListener('pointerdown', () => { if (running && curSps() <= 30) timeScale = .35; });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => addEventListener(ev, () => { timeScale = 1; }));
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
  ['lr',       'LR · ADAM STEP',           0.0002, 0.005, 0.0002, v => v.toFixed(4)],
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
for (const [id, key] of [['tglGrid', 'grid'], ['tglGlow', 'glow']]) {
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
  try { if (!localStorage.getItem('snake-coach')) coach.classList.add('show'); } catch (e) {}
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
  if (i) { i.value = params[key]; $('#pv_' + key).textContent = (+params[key]).toFixed(key === 'halfLife' ? 0 : key === 'lr' ? 4 : 2); }
}
if (hadSave && episodes > 0) toast('SAVED DQN LOADED · EP ' + episodes);
layout(); beginEpisode(); updateTransport(); updateHud(); checkOri(); brainInfo();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator)
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));