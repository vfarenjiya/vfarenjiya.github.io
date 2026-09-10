'use strict';
/* ================= EPISODES & PHYSICS ================= */
function beginEpisode() {
  env.x = 50 + (Math.random() * 8 - 4); env.y = 160;
  env.vx = (Math.random() - .5) * 1.2; env.vy = 0;
  env.steps = 0; env.ret = 0; env.mainOn = false; env.lat = 0;
  env.a = algo === 'sarsa' ? chooseAction(stateOf(env), curEps()) : 0;
  trail.length = 0; agentHidden = false;
}
function doStep(greedy) {
  const s = stateOf(env), eps = greedy ? 0 : curEps();
  const a = (algo === 'sarsa' && !greedy) ? env.a : chooseAction(s, eps);
  const p0 = phi(env);
  let ax = 0, ay = 0; env.mainOn = false; env.lat = 0;
  if (a === 0) { ax = -WORLD.aLat; env.lat = -1; }        // RCS left
  else if (a === 1) { ax = WORLD.aLat; env.lat = 1; }     // RCS right
  else if (a === 2) { ay = WORLD.aMain; env.mainOn = true; } // main engine
  env.vx += ax * WORLD.dt;
  env.vy += (ay - WORLD.g) * WORLD.dt;                    // Moon gravity
  env.x += env.vx * WORLD.dt;
  env.y += env.vy * WORLD.dt;
  env.steps++;
  let reward = WORLD.rStep + WORLD.shapeK * (params.gamma * phi(env) - p0); // potential-based shaping
  let result = '';
  if (env.y <= 0) {
    env.y = 0;
    const onPad = env.x >= WORLD.padX0 && env.x <= WORLD.padX1;
    const soft = (-env.vy) <= WORLD.softVy && Math.abs(env.vx) <= WORLD.softVx;
    result = (onPad && soft) ? 'goal' : 'cliff';
    reward += result === 'goal' ? WORLD.rWin : WORLD.rCrash;
  } else if (env.x < -2 || env.x > WORLD.w + 2) { result = 'cliff'; reward += WORLD.rCrash; }
  else if (env.steps >= WORLD.maxSteps) { result = 'timeout'; reward += WORLD.rCrash; }
  const terminal = !!result, ns = stateOf(env);
  /* TD update — Q-learning: r + γ max Q(s′,·)   |   SARSA: r + γ Q(s′,a′) */
  let target;
  if (terminal) target = reward;
  else if (algo === 'qlearn' || greedy) target = reward + params.gamma * maxQ(ns);
  else { const na = chooseAction(ns, eps); target = reward + params.gamma * Q[ns * 4 + na]; env.a = na; }
  Q[s * 4 + a] += params.alpha * (target - Q[s * 4 + a]);

  trail.push({ x: env.x, y: env.y }); if (trail.length > 140) trail.shift();
  env.ret += reward;
  if (curSps() <= 30) sTick();
  if (result === 'cliff') { spawnCrash(env.x, Math.max(env.y, 0)); floater(env.x, Math.max(env.y, 8), 'CRASH', '#ff5a4d'); sSplash(); endEpisode('cliff', greedy); }
  else if (result === 'goal') { spawnDust(env.x, 0); floater(env.x, 10, 'TOUCHDOWN', '#7dffa8'); sWin(); endEpisode('goal', greedy); }
  else if (result === 'timeout') { floater(env.x, env.y, 'FUEL OUT', '#ffb703'); sSplash(); endEpisode('timeout', greedy); }
}
function endEpisode(result, greedy) {
  if (!greedy) {
    returns.push(env.ret); if (returns.length > 900) returns.splice(0, returns.length - 600);
    episodes++;
    okHist.push(result === 'goal'); if (okHist.length > 25) okHist.shift();
    if (returns.length >= 20) {
      const a = avg(returns.slice(-30));
      if (bestAvg == null || a > bestAvg) bestAvg = a;
      if (!congrat && a >= 80) { congrat = true; toast('CONSISTENT SOFT LANDINGS!'); }
    }
    chartDirty = true;
    if (episodes % 25 === 0) saveBrain();
  } else {
    playRuns++; playLast = result === 'goal' ? 'LANDED ✓' : 'CRASH ✗';
    playHint.textContent = episodes === 0
      ? 'Falls like a brick? The brain is untrained — switch to TRAIN first.'
      : 'Brain trained on ' + episodes + ' episodes (' + (algo === 'qlearn' ? 'Q-learning' : 'SARSA') + ').';
  }
  respawnT = greedy ? 0.9 : (curSps() <= 30 ? 0.5 : 0.02);
  agentHidden = result === 'cliff';
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

/* ================= PERSISTENCE ================= */
const KEY = 'lunar-lander-v1';
function saveBrain(manual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 1, algo, params: { ...params }, episodes,
      returns: returns.slice(-300), bestAvg, Q: Array.from(Q), flags, soundOn }));
    if (manual) toast('BRAIN SAVED');
  } catch (e) {}
}
function loadBrain() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || d.v !== 1 || !Array.isArray(d.Q) || d.Q.length !== STATES * 4) return false;
    Q = Float64Array.from(d.Q); algo = d.algo || 'qlearn';
    Object.assign(params, d.params || {});
    episodes = d.episodes | 0; returns = d.returns || [];
    bestAvg = (d.bestAvg == null ? null : d.bestAvg);
    Object.assign(flags, d.flags || {}); soundOn = !!d.soundOn;
    return true;
  } catch (e) { return false; }
}
function resetBrain() {
  Q.fill(0); episodes = 0; returns.length = 0; okHist.length = 0;
  bestAvg = null; congrat = false; playRuns = 0; playLast = '—';
  try { localStorage.removeItem(KEY); } catch (e) {}
  beginEpisode(); chartDirty = true; toast('BRAIN WIPED');
}