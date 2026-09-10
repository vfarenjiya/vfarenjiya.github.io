'use strict';
/* ================= EPISODES & LEARNING ================= */
function beginEpisode() {
  env.c = 0; env.r = 0; env.steps = 0; env.ret = 0;
  env.a = algo === 'sarsa' ? chooseAction(0, curEps()) : 0;
  trail.length = 0; agentHidden = false;
}

function doStep(greedy) {
  const s = idxOf(env.c, env.r);
  const eps = greedy ? 0 : curEps();
  const a = (algo === 'sarsa' && !greedy) ? env.a : chooseAction(s, eps);
  let nc = env.c + DC[a], nr = env.r + DR[a];
  if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) { nc = env.c; nr = env.r; }
  let reward = -1;
  const t = cellType(nc, nr);
  if (t === 'cliff') reward = -100;
  else if (t === 'goal') reward = 0;
  const terminal = t === 'cliff' || t === 'goal';
  const ns = idxOf(nc, nr);
  /* ---- TD update ----
     Q-learning (off-policy): target = r + γ·max_a′ Q(s′,a′)
     SARSA      (on-policy) : target = r + γ·Q(s′,a′), a′ actually chosen */
  let target;
  if (terminal) target = reward;
  else if (algo === 'qlearn' || greedy) target = reward + params.gamma * maxQ(ns);
  else {
    const na = chooseAction(ns, eps);
    target = reward + params.gamma * Q[ns * 4 + na];
    env.a = na;
  }
  Q[s * 4 + a] += params.alpha * (target - Q[s * 4 + a]);

  if (nc !== env.c || nr !== env.r) {
    trail.push({ c: env.c, r: env.r });
    if (trail.length > 110) trail.shift();
  }
  env.c = nc; env.r = nr; env.steps++; env.ret += reward; lastDir = a;
  if (curSps() <= 30) sTick();

  if (t === 'cliff')      { spawnSplash(nc, nr); floater(nc, nr, '-100', '#ff6a3a'); sSplash(); endEpisode('cliff', greedy); }
  else if (t === 'goal')  { spawnConfetti(nc, nr); floater(nc, nr, 'GOAL!', '#ffc857'); sWin(); endEpisode('goal', greedy); }
  else if (env.steps >= MAX_STEPS) endEpisode('timeout', greedy);
}

function endEpisode(result, greedy) {
  if (!greedy) {
    returns.push(env.ret);
    if (returns.length > 900) returns.splice(0, returns.length - 600);
    episodes++;
    okHist.push(result === 'goal');
    if (okHist.length > 25) okHist.shift();
    if (returns.length >= 20) {
      const a = avg(returns.slice(-30));
      if (bestAvg == null || a > bestAvg) bestAvg = a;
      if (!congrat && a >= -14) { congrat = true; toast('≈ OPTIMAL POLICY! BEST IS −12'); }
    }
    chartDirty = true;
    if (episodes % 25 === 0) saveBrain();
  } else {
    playRuns++;
    playLast = result === 'goal' ? 'GOAL ✓' : 'CLIFF ✗';
    playHint.textContent = episodes === 0
      ? 'Wanders randomly? The brain is untrained — switch to TRAIN first.'
      : 'Brain trained on ' + episodes + ' episodes (' + (algo === 'qlearn' ? 'Q-learning' : 'SARSA') + ').';
  }
  respawnT = greedy ? 0.85 : (curSps() <= 30 ? 0.45 : 0.02);
  agentHidden = result === 'cliff';
}

const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

/* ================= PERSISTENCE ================= */
const KEY = 'cliff-walker-v1';
function saveBrain(manual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 1, algo, params: { ...params }, episodes,
      returns: returns.slice(-300), bestAvg, Q: Array.from(Q), flags, soundOn
    }));
    if (manual) toast('BRAIN SAVED');
  } catch (e) {}
}
function loadBrain() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || d.v !== 1 || !Array.isArray(d.Q) || d.Q.length !== STATES * 4) return false;
    Q = Float64Array.from(d.Q);
    algo = d.algo || 'qlearn';
    Object.assign(params, d.params || {});
    episodes = d.episodes | 0;
    returns = d.returns || [];
    bestAvg = (d.bestAvg == null ? null : d.bestAvg);
    Object.assign(flags, d.flags || {});
    soundOn = !!d.soundOn;
    return true;
  } catch (e) { return false; }
}
function resetBrain() {
  Q.fill(0); episodes = 0; returns.length = 0; okHist.length = 0;
  bestAvg = null; congrat = false; playRuns = 0; playLast = '—';
  try { localStorage.removeItem(KEY); } catch (e) {}
  beginEpisode(); chartDirty = true; toast('BRAIN WIPED');
}