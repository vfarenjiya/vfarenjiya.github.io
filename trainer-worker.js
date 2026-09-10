'use strict';
try { importScripts('env.js', 'agent.js'); } catch (e) { self.postMessage({ type: 'error', message: 'importScripts failed: ' + e.message }); }

var env = null, agent = null, cfg = null, running = false, doneSent = false, episode = 0, returns = [], timer = null;

function postError(err) { self.postMessage({ type: 'error', message: String((err && err.message) || err) }); }

self.onmessage = function (e) {
  var msg = e.data || {};
  if (msg.type === 'start') { try { start(msg.config || {}); } catch (err) { postError(err); } }
  else if (msg.type === 'stop') stop();
  else if (msg.type === 'reset') reset();
};
self.addEventListener('error', function (e) { self.postMessage({ type: 'error', message: e.message || 'Worker error' }); });

function start(config) {
  clearTimeout(timer);
  cfg = { episodes: Number(config.episodes) || 500, alpha: Number(config.alpha) || 0.2, gamma: (config.gamma === undefined ? 0.99 : Number(config.gamma)), algorithm: config.algorithm === 'sarsa' ? 'sarsa' : 'q', slipProbability: Number(config.slipProbability) || 0, watchSpeed: Number(config.watchSpeed) || 0 };
  env = new CliffWalkingEnv({ slipProbability: cfg.slipProbability });
  agent = new TabularAgent(48, 4, { algorithm: cfg.algorithm, alpha: cfg.alpha, gamma: cfg.gamma });
  episode = 0; returns = []; running = true; doneSent = false;
  if (cfg.watchSpeed > 0) runWatchEpisode(); else timer = setTimeout(runTurbo, 0);
}
function stop() { if (doneSent) return; if (running) { running = false; clearTimeout(timer); finalize(); } else if (agent) finalize(); }
function reset() { running = false; clearTimeout(timer); env = null; agent = null; episode = 0; returns = []; doneSent = true; }

function runEpisodeSync() {
  var current = env.reset(), ret = 0, terminal = false, a = agent.algorithm === 'sarsa' ? agent.chooseAction(current) : null;
  while (!terminal) {
    var action = agent.algorithm === 'sarsa' ? a : agent.chooseAction(current);
    var res = env.step(action); ret += res.reward;
    if (agent.algorithm === 'q') agent.updateQ(current, action, res.reward, res.nextState, res.terminal);
    else { var nextA = res.terminal ? 0 : agent.chooseAction(res.nextState); agent.updateQ(current, action, res.reward, res.nextState, res.terminal, nextA); if (!res.terminal) a = nextA; }
    current = res.nextState; terminal = res.terminal;
  }
  return ret;
}
function runTurbo() {
  if (!running) return;
  try {
    var batch = Math.min(5, cfg.episodes - episode);
    for (var i = 0; i < batch; i++) {
      if (!running) break;
      episode++; var ret = runEpisodeSync(); agent.decayEpsilon(); returns.push(ret);
      self.postMessage({ type: 'progress', episode: episode, episodeReturn: ret, epsilon: agent.epsilon });
      if (episode % 5 === 0 || episode === cfg.episodes) sendQSnapshot(episode);
    }
    if (!running) return;
    if (episode >= cfg.episodes) finalize(); else timer = setTimeout(runTurbo, 0);
  } catch (err) { postError(err); running = false; }
}
function runWatchEpisode() {
  if (!running) return;
  episode++; var current = env.reset(), epReturn = 0, a = agent.algorithm === 'sarsa' ? agent.chooseAction(current) : null;
  function step() {
    if (!running) return;
    try {
      var action = agent.algorithm === 'sarsa' ? a : agent.chooseAction(current);
      var res = env.step(action); epReturn += res.reward;
      if (agent.algorithm === 'q') agent.updateQ(current, action, res.reward, res.nextState, res.terminal);
      else { var nextA = res.terminal ? 0 : agent.chooseAction(res.nextState); agent.updateQ(current, action, res.reward, res.nextState, res.terminal, nextA); if (!res.terminal) a = nextA; }
      current = res.nextState;
      self.postMessage({ type: 'progress', episode: episode, episodeReturn: epReturn, epsilon: agent.epsilon, state: current });
      if (res.terminal) { agent.decayEpsilon(); endWatchEpisode(epReturn); }
      else { var delay = Math.max(1000 / Math.max(1, cfg.watchSpeed), 16); timer = setTimeout(step, delay); }
    } catch (err) { postError(err); running = false; }
  }
  step();
}
function endWatchEpisode(ret) {
  if (!running) return;
  returns.push(ret);
  self.postMessage({ type: 'progress', episode: episode, episodeReturn: ret, epsilon: agent.epsilon });
  sendQSnapshot(episode);
  if (episode >= cfg.episodes) finalize(); else timer = setTimeout(runWatchEpisode, 50);
}
function sendQSnapshot(ep) { if (!agent) return; var copy = agent.q.slice(); self.postMessage({ type: 'qsnapshot', episode: ep, qBuffer: copy.buffer }, [copy.buffer]); }
function computeBestPath() {
  if (!agent) return []; var te = new CliffWalkingEnv({ slipProbability: 0 }), s = te.reset(), path = [s];
  for (var i = 0; i < 1000 && !te.terminal; i++) { var a = agent.chooseAction(s, true), res = te.step(a); s = res.nextState; path.push(s); if (res.terminal) break; }
  return path;
}
function makeStats() {
  var last = returns.slice(-50), sum = 0, i; for (i = 0; i < last.length; i++) sum += last[i]; var avg = last.length ? sum / last.length : 0;
  var best = returns.length ? returns.reduce(function (m, r) { return Math.max(m, r); }, -Infinity) : 0;
  return { avgReturnLast50: avg, bestReturn: best, bestPath: computeBestPath() };
}
function finalize() {
  if (doneSent || !agent) return; doneSent = true; running = false; clearTimeout(timer);
  try { var stats = makeStats(), copy = agent.q.slice(); self.postMessage({ type: 'done', qBuffer: copy.buffer, stats: stats }, [copy.buffer]); } catch (err) { postError(err); }
}