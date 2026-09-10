'use strict';
const S_BUF = new Uint8Array(REPLAY * IN), S2_BUF = new Uint8Array(REPLAY * IN);
const A_BUF = new Uint8Array(REPLAY), R_BUF = new Float32Array(REPLAY), D_BUF = new Uint8Array(REPLAY);
let repLen = 0, repHead = 0;
const tmpF = new Float32Array(IN);
const S_TMP = new Uint8Array(IN), S2_TMP = new Uint8Array(IN);
const tmpGrid = new Uint8Array(CELLS);
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const phi = () => -PHI_K * manhattan(env.snake[0], env.food);

/* Egocentric encode: board rotated so head sits at (EX,EY) facing "up".
   ch0 body · ch1 head · ch2 food · ch3 wall.  fw = cells AHEAD, rc = cells RIGHT. */
function encode(out, sn, food) {
  out.fill(0); tmpGrid.fill(0);
  for (let i = 0; i < sn.length; i++) tmpGrid[sn[i].y * GW + sn[i].x] = 1;
  const h = sn[0], f = DIRS[env.dir], r0 = -f[1], r1 = f[0];
  for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
    const fw = EY - cy;                 // >0 means this ego cell is AHEAD of the head
    const rc = cx - EX;                 // >0 means RIGHT of the head
    const wx = h.x + f[0] * fw + r0 * rc;
    const wy = h.y + f[1] * fw + r1 * rc;
    const o = (cy * GW + cx) * CH;
    if (wx < 0 || wx >= GW || wy < 0 || wy >= GH) { out[o + 3] = 1; continue; }
    if (wx === h.x && wy === h.y) { out[o + 1] = 1; continue; }
    if (tmpGrid[wy * GW + wx]) { out[o] = 1; continue; }
    if (wx === food.x && wy === food.y) out[o + 2] = 1;
  }
}
function placeFood() {
  do { env.food = { x: (Math.random() * GW) | 0, y: (Math.random() * GH) | 0 }; }
  while (env.snake.some(s => s.x === env.food.x && s.y === env.food.y));
}
function beginEpisode() {
  env.snake = [{ x: 6, y: 12 }, { x: 6, y: 13 }, { x: 6, y: 14 }];
  env.prev = env.snake.map(s => ({ ...s }));
  env.dir = 0; env.steps = 0; env.noEat = 0; env.ret = 0; env.done = false; env.foods = 0;
  placeFood(); env.stepAt = performance.now();
}
function stepEnv(greedy) {
  const s = S_TMP; encode(s, env.snake, env.food);
  const eps = greedy ? 0 : curEps();
  let act;
  if (Math.random() < eps) act = (Math.random() * NA) | 0;
  else { const q = online.qValues(s); let b = -Infinity; act = 0;
    for (let i = 0; i < NA; i++) if (q[i] > b) { b = q[i]; act = i; } }
  const nd = act === 0 ? env.dir : act === 1 ? (env.dir + 3) % 4 : (env.dir + 1) % 4;
  env.dir = nd;
  const h = env.snake[0];
  const nh = { x: h.x + DIRS[nd][0], y: h.y + DIRS[nd][1] };
  const p0 = phi();
  let reward = 0, done = false;
  const wall = nh.x < 0 || nh.x >= GW || nh.y < 0 || nh.y >= GH;
  const self = env.snake.some((p, i) => i < env.snake.length - 1 && p.x === nh.x && p.y === nh.y);
  env.prev = env.snake.map(p => ({ ...p }));
  if (wall || self) {
    done = true; reward = R_DIE;
    burst(nh.x, nh.y, '#ff5a4d'); ring(nh.x, nh.y, '#ff5a4d'); shakeIt(1);
    if (curSps() <= 30) sSplash();
  } else {
    env.snake.unshift(nh);
    if (nh.x === env.food.x && nh.y === env.food.y) {
      reward += R_EAT; env.foods++; env.noEat = 0;
      burst(nh.x, nh.y, '#ffd166'); ring(nh.x, nh.y, '#ffd166'); shakeIt(.25);
      if (curSps() <= 30) sWin();
      placeFood();
    } else { env.snake.pop(); env.noEat++; }
    if (env.noEat > NO_EAT_LIMIT) { done = true; reward += R_TIMEOUT; }
    if (!done) reward += params.gamma * phi() - p0;
  }
  env.steps++; env.ret += reward; env.done = done; env.stepAt = performance.now();
  const s2 = S2_TMP; encode(s2, env.snake, env.food);
  pushReplay(s, act, reward, s2, done);
  return done;
}
function pushReplay(s, a, r, s2, d) {
  const i = repHead;
  S_BUF.set(s, i * IN); S2_BUF.set(s2, i * IN);
  A_BUF[i] = a; R_BUF[i] = r; D_BUF[i] = d ? 1 : 0;
  repHead = (repHead + 1) % REPLAY;
  if (repLen < REPLAY) repLen++;
}
function trainFromReplay() {
  if (repLen < WARM) return;
  let loss = 0;
  for (let k = 0; k < BATCH; k++) {
    const idx = (Math.random() * repLen) | 0;
    const o = idx * IN;
    const x = tmpF; for (let i = 0; i < IN; i++) x[i] = S_BUF[o + i];
    const x2 = new Float32Array(IN); for (let i = 0; i < IN; i++) x2[i] = S2_BUF[o + i];
    const cache = online.forward(x, {});
    const q = cache.q.slice();
    let tgt;
    if (D_BUF[idx]) tgt = R_BUF[idx];
    else { const qt = target.qValues(x2); tgt = R_BUF[idx] + params.gamma * Math.max(qt[0], qt[1], qt[2]); }
    const err = tgt - q[A_BUF[idx]];
    loss += err * err;
    const dq = new Float64Array(NA); dq[A_BUF[idx]] = err;
    online.backward(cache, dq);
  }
  online.adam(params.lr);
  lastLoss = loss / BATCH;
  lossHist.push(lastLoss); if (lossHist.length > 400) lossHist.shift();
  updates++;
  if (updates % TARGET_EVERY === 0) target.copyFrom(online);
  chartDirty = true;
}
function doStep(greedy) {
  const done = stepEnv(greedy);
  if (done) endEpisode(greedy);
}
function endEpisode(greedy) {
  const len = env.snake.length;
  if (len > bestLen) bestLen = len;
  for (const [m, txt] of [[10, '🥉 LEN-10 CLUB'], [20, '🥈 LEN-20 CLUB'], [50, '🥇 LEN-50 CLUB']])
    if (len === m) { toast(txt); ring(env.snake[0].x, env.snake[0].y, '#ffd166'); }
  if (!greedy) {
    returns.push(env.ret); if (returns.length > 900) returns.splice(0, returns.length - 600);
    episodes++;
    if (returns.length >= 20) {
      const a = avg(returns.slice(-30));
      if (bestAvg == null || a > bestAvg) bestAvg = a;
      if (!congrat && a >= 40) { congrat = true; toast('IT KNOWS HOW TO HUNT!'); }
    }
    chartDirty = true;
    if (episodes % 20 === 0) saveBrain();
  } else {
    playRuns++; playLast = env.foods + ' food';
    playHint.textContent = episodes === 0
      ? 'Spinning in circles? The net is untrained — switch to TRAIN first.'
      : 'DQN trained on ' + episodes + ' episodes · ' + updates + ' updates · best len ' + bestLen + '.';
  }
  respawnT = curSps() <= 30 ? 0.45 : 0.02;
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

const KEY = 'snake-dqn-v4';
function saveBrain(manual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 4, params: { ...params }, episodes, returns: returns.slice(-300), bestAvg,
      updates, bestLen, net: online.serialize() }));
    if (manual) toast('BRAIN SAVED');
  } catch (e) {}
}
function loadBrain() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || d.v !== 4 || !d.net) return false;
    online.load(d.net); target.copyFrom(online);
    Object.assign(params, d.params || {});
    episodes = d.episodes | 0; returns = d.returns || [];
    bestAvg = (d.bestAvg == null ? null : d.bestAvg);
    updates = d.updates | 0; bestLen = d.bestLen | 0;
    return true;
  } catch (e) { return false; }
}
function resetBrain() {
  online.l1 = layer(IN, H1); online.l2 = layer(H1, H2); online.l3 = layer(H2, NA); online.t = 0;
  target.copyFrom(online);
  episodes = 0; returns.length = 0; bestAvg = null; congrat = false;
  updates = 0; lastLoss = 0; bestLen = 0; lossHist.length = 0;
  repLen = 0; repHead = 0; playRuns = 0; playLast = '—';
  try { localStorage.removeItem(KEY); } catch (e) {}
  beginEpisode(); chartDirty = true; toast('BRAIN WIPED');
}