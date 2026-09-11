'use strict';
/* ============ TABULAR Q-LEARNING SNAKE + SAFETY SHIELD ============ */
const NST = 72;
let Q = new Float64Array(NST * 3);
const visitedSt = new Uint8Array(NST);
let visitedN = 0, tdErr = 0;
let shieldCount = 0, youRuns = 0, youBest = 0, youAct = null;
const repLen = REPLAY;
const tmpGrid = new Uint8Array(CELLS);          // FIX 1: occupancy grid (was missing)
const freeSeen = new Uint8Array(CELLS);
const floodStack = new Int32Array(CELLS);
const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function buildGrid(sn) {                        // FIX 2: tail excluded (it vacates)
  tmpGrid.fill(0);
  for (let i = 0; i < sn.length - 1; i++) tmpGrid[sn[i].y * GW + sn[i].x] = 1;
}
function blockedCell(sn, x, y) {
  if (x < 0 || x >= GW || y < 0 || y >= GH) return true;
  for (let i = 0; i < sn.length - 1; i++) if (sn[i].x === x && sn[i].y === y) return true;
  return false;
}
function stateIdx(sn, food, dir) {
  const h = sn[0], f = DIRS[dir];
  const r0 = -f[1], r1 = f[0], l0 = -r0, l1 = -r1;
  const d = (blockedCell(sn, h.x + f[0], h.y + f[1]) ? 4 : 0)
          + (blockedCell(sn, h.x + l0, h.y + l1) ? 2 : 0)
          + (blockedCell(sn, h.x + r0, h.y + r1) ? 1 : 0);
  const dfx = food.x - h.x, dfy = food.y - h.y;
  const df = dfx * f[0] + dfy * f[1];
  const dr = dfx * r0 + dfy * r1;
  const lf = df > 0 ? 2 : (df < 0 ? 1 : 0);
  const lr = dr > 0 ? 2 : (dr < 0 ? 1 : 0);
  return d * 9 + lf * 3 + lr;
}
function freeSpace(x, y) {
  if (x < 0 || x >= GW || y < 0 || y >= GH) return -1;
  const start = y * GW + x;
  if (tmpGrid[start]) return -1;
  freeSeen.fill(0);
  let count = 0, head = 0, tail = 0;
  floodStack[tail++] = start; freeSeen[start] = 1;
  const cap = env.snake.length + 6;
  while (head < tail && count < cap) {
    const c = floodStack[head++]; count++;
    const cx = c % GW, cy = (c / GW) | 0;
    for (let k = 0; k < 4; k++) {
      const nx = cx + DIRS[k][0], ny = cy + DIRS[k][1];
      if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (freeSeen[ni] || tmpGrid[ni]) continue;
      freeSeen[ni] = 1; floodStack[tail++] = ni;
    }
  }
  return count;
}
function shield(s, act) {
  const h = env.snake[0], need = env.snake.length;
  const spaces = [-2, -2, -2];
  for (let a = 0; a < 3; a++) {
    const nd = a === 0 ? env.dir : a === 1 ? (env.dir + 3) % 4 : (env.dir + 1) % 4;
    spaces[a] = freeSpace(h.x + DIRS[nd][0], h.y + DIRS[nd][1]);
  }
  let ok = [];
  for (let a = 0; a < 3; a++) if (spaces[a] >= need) ok.push(a);
  if (!ok.length) for (let a = 0; a < 3; a++) if (spaces[a] >= 0) ok.push(a);
  if (!ok.length) return act;
  if (ok.indexOf(act) >= 0) return act;
  shieldCount++;
  let b = -Infinity, ba = ok[0];
  for (const a of ok) { const q = Q[s * 3 + a]; if (q > b) { b = q; ba = a; } }
  return ba;
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
function stepEnv(greedy, forced, isYou) {
  const s = stateIdx(env.snake, env.food, env.dir);
  buildGrid(env.snake);                          // FIX 1: grid exists before shield uses it
  let act;
  if (forced != null) act = forced;
  else {
    const eps = greedy ? 0 : curEps();
    if (Math.random() < eps) act = (Math.random() * 3) | 0;
    else {
      const b = s * 3; let best = -Infinity, picks = [];
      for (let a = 0; a < 3; a++) {
        const q = Q[b + a];
        if (q > best + 1e-9) { best = q; picks = [a]; }
        else if (Math.abs(q - best) <= 1e-9) picks.push(a);
      }
      act = picks[(Math.random() * picks.length) | 0];
    }
    act = shield(s, act);
  }
  const nd = act === 0 ? env.dir : act === 1 ? (env.dir + 3) % 4 : (env.dir + 1) % 4;
  env.dir = nd;
  const h = env.snake[0];
  const nh = { x: h.x + DIRS[nd][0], y: h.y + DIRS[nd][1] };
  const dPrev = manhattan(h, env.food);
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
    const dNow = manhattan(env.snake[0], env.food);
    reward += (dPrev - dNow) * PHI_K;
  }
  env.steps++; env.ret += reward; env.done = done; env.stepAt = performance.now();
  const ns = stateIdx(env.snake, env.food, env.dir);
  let target;
  if (done) target = reward;
  else target = reward + params.gamma * Math.max(Q[ns * 3], Q[ns * 3 + 1], Q[ns * 3 + 2]);
  const delta = target - Q[s * 3 + act];
  tdErr = Math.abs(delta); lastLoss = tdErr;
  Q[s * 3 + act] += (params.alpha || 0.5) * delta;
  if (!visitedSt[s]) { visitedSt[s] = 1; visitedN++; }
  updates++;
  return done;
}
function trainFromReplay() { /* tabular learns online inside stepEnv */ }
function doStep(kind) {
  const forced = kind === 'you' ? (youAct == null ? 0 : youAct) : null;
  youAct = null;
  const done = stepEnv(kind === 'play', forced, kind === 'you');
  if (done) endEpisode(kind === 'play', kind === 'you');
}
function endEpisode(greedy, isYou) {
  const len = env.snake.length;
  if (len > bestLen) bestLen = len;
  for (const [m, txt] of [[10, '🥉 LEN-10 CLUB'], [20, '🥈 LEN-20 CLUB'], [50, '🥇 LEN-50 CLUB'], [100, '🏆 CENTURY CLUB']])
    if (len === m) { toast(txt); ring(env.snake[0].x, env.snake[0].y, '#ffd166'); }
  if (isYou) {
    youRuns++;
    if (env.foods > youBest) { youBest = env.foods; toast('🎮 NEW PERSONAL BEST · ' + youBest + ' FOOD'); }
    playLast = env.foods + ' food';
    respawnT = 0.6;
    return;
  }
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
      ? 'Spinning in circles? The brain is untrained — switch to TRAIN first.'
      : 'Table trained on ' + episodes + ' episodes · ' + updates + ' updates · best len ' + bestLen + '.';
  }
  respawnT = curSps() <= 30 ? 0.45 : 0.02;
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

const KEY = 'snake-tab-v1';
function saveBrain(manual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 1, params: { ...params }, episodes, returns: returns.slice(-300), bestAvg,
      updates, bestLen, visitedN, shieldCount, youBest, Q: Array.from(Q) }));
    if (manual) toast('BRAIN SAVED');
  } catch (e) {}
}
function loadBrain() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || d.v !== 1 || !Array.isArray(d.Q) || d.Q.length !== NST * 3) return false;
    Q = Float64Array.from(d.Q);
    Object.assign(params, d.params || {});
    episodes = d.episodes | 0; returns = d.returns || [];
    bestAvg = (d.bestAvg == null ? null : d.bestAvg);
    updates = d.updates | 0; bestLen = d.bestLen | 0; visitedN = d.visitedN | 0;
    shieldCount = d.shieldCount | 0; youBest = d.youBest | 0;
    return true;
  } catch (e) { return false; }
}
function resetBrain() {
  Q.fill(0); visitedSt.fill(0); visitedN = 0; tdErr = 0;
  episodes = 0; returns.length = 0; bestAvg = null; congrat = false;
  updates = 0; lastLoss = 0; bestLen = 0; lossHist.length = 0;
  playRuns = 0; playLast = '—'; shieldCount = 0; youRuns = 0; youBest = 0;
  try { localStorage.removeItem(KEY); } catch (e) {}
  beginEpisode(); chartDirty = true; toast('BRAIN WIPED');
}