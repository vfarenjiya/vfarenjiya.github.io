'use strict';
/* ---- behavior policy: 50% tiny autopilot demo + 50% ε-greedy ----
   Q-learning is OFF-policy: it may learn from any covering behavior. */
function autopilot() {
  const vdes = desiredVy(env.y);
  if (env.vy < vdes - 0.3) return 2;                       // sinking too fast → burn
  if (env.y < 60 && Math.abs(env.vx) > 1.0) return env.x > 50 ? 0 : 1;
  if (env.y < 60 && Math.abs(env.x - 50) > 6) return env.x > 50 ? 0 : 1;
  return 3;                                                // coast on profile
}
function behaviorAction(s, eps) {
  if (Math.random() < GUIDED) return autopilot();
  return chooseAction(s, eps);
}

function beginEpisode() {
  env.x = 50 + (Math.random() * 8 - 4); env.y = 140;
  env.vx = (Math.random() - .5) * 1.2; env.vy = 0;
  env.steps = 0; env.ret = 0; env.mainOn = false; env.lat = 0;
  env.a = algo === 'sarsa' ? behaviorAction(stateOf(env), curEps()) : 0;
  trail.length = 0; agentHidden = false;
}
function doStep(greedy) {
  const s = stateOf(env), eps = greedy ? 0 : curEps();
  const a = greedy ? chooseAction(s, 0)
        : (algo === 'sarsa' ? env.a : behaviorAction(s, eps));
  let ax = 0, ay = 0; env.mainOn = false; env.lat = 0;
  if (a === 0) { ax = -WORLD.aLat; env.lat = -1; }
  else if (a === 1) { ax = WORLD.aLat; env.lat = 1; }
  else if (a === 2) { ay = WORLD.aMain; env.mainOn = true; }
  env.vx += ax * WORLD.dt;
  env.vy += (ay - WORLD.g) * WORLD.dt;
  env.x += env.vx * WORLD.dt;
  env.y += env.vy * WORLD.dt;
  env.steps++;
  /* dense reference-tracking reward: correct action = best IMMEDIATE reward */
  const errV = Math.min(Math.abs(env.vy - desiredVy(env.y)), 4);
  const errX = Math.min(Math.abs(env.x - 50) * 0.12 + (env.y < 40 ? Math.abs(env.vx) : 0) * 0.5, 3);
  let reward = -0.06 * (errV / 4) - 0.03 * (errX / 3) - 0.02;
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
  let target;
  if (terminal) target = reward;
  else if (algo === 'qlearn' || greedy) target = reward + params.gamma * maxQ(ns);
  else { const na = behaviorAction(ns, eps); target = reward + params.gamma * Q[ns * 4 + na]; env.a = na; }
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

const KEY = 'lunar-lander-v3';
function saveBrain(manual) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 3, algo, params: { ...params }, episodes,
      returns: returns.slice(-300), bestAvg, Q: Array.from(Q), flags, soundOn }));
    if (manual) toast('BRAIN SAVED');
  } catch (e) {}
}
function loadBrain() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d || d.v !== 3 || !Array.isArray(d.Q) || d.Q.length !== STATES * 4) return false;
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