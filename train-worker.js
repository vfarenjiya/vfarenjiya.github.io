'use strict';

importScripts('env.js', 'agent.js');

let env = null;
let agent = null;
let cfg = null;

let running = false;
let doneSent = true;
let episode = 0;
let returns = [];
let timer = null;

self.onmessage = function (event) {
  const msg = event.data || {};

  if (msg.type === 'start') {
    try {
      start(msg.config || {});
    } catch (err) {
      postError(err);
    }
  } else if (msg.type === 'stop') {
    stop();
  } else if (msg.type === 'reset') {
    reset();
  }
};

self.addEventListener('error', function (event) {
  postMessage({
    type: 'error',
    message: event.message || 'Worker error'
  });
});

function start(config) {
  clearTimeout(timer);

  cfg = {
    episodes: Number(config.episodes) || 500,
    alpha: Number(config.alpha) || 0.2,
    gamma: Number.isFinite(Number(config.gamma)) ? Number(config.gamma) : 0.99,
    algorithm: config.algorithm === 'sarsa' ? 'sarsa' : 'q',
    slipProbability: Number(config.slipProbability) || 0,
    watchSpeed: Number(config.watchSpeed) || 0
  };

  env = new CliffWalkingEnv({ slipProbability: cfg.slipProbability });
  agent = new TabularAgent(48, 4, {
    algorithm: cfg.algorithm,
    alpha: cfg.alpha,
    gamma: cfg.gamma
  });

  episode = 0;
  returns = [];
  running = true;
  doneSent = false;

  if (cfg.watchSpeed > 0) {
    runWatchEpisode();
  } else {
    timer = setTimeout(runTurbo, 0);
  }
}

function stop() {
  if (doneSent) return;

  if (running) {
    running = false;
    clearTimeout(timer);
    finalize();
  } else if (agent) {
    finalize();
  }
}

function reset() {
  running = false;
  doneSent = true;
  clearTimeout(timer);

  env = null;
  agent = null;
  cfg = null;
  episode = 0;
  returns = [];
}

function runTurbo() {
  if (!running) return;

  try {
    const batch = Math.min(5, cfg.episodes - episode);

    for (let i = 0; i < batch; i++) {
      if (!running) break;

      episode += 1;

      const episodeReturn = runEpisodeSync();
      agent.decayEpsilon();

      returns.push(episodeReturn);

      self.postMessage({
        type: 'progress',
        episode,
        episodeReturn,
        epsilon: agent.epsilon
      });

      if (episode % 5 === 0 || episode === cfg.episodes) {
        sendQSnapshot(episode);
      }
    }

    if (!running) return;

    if (episode >= cfg.episodes) {
      finalize();
    } else {
      timer = setTimeout(runTurbo, 0);
    }
  } catch (err) {
    postError(err);
    running = false;
  }
}

function runWatchEpisode() {
  if (!running) return;

  episode += 1;

  let current = env.reset();
  let episodeReturn = 0;
  let sarsaAction = agent.algorithm === 'sarsa'
    ? agent.chooseAction(current)
    : null;

  function step() {
    if (!running) return;

    try {
      const action = agent.algorithm === 'sarsa'
        ? sarsaAction
        : agent.chooseAction(current);

      const result = env.step(action);
      episodeReturn += result.reward;

      if (agent.algorithm === 'q') {
        agent.updateQ(current, action, result.reward, result.nextState, result.terminal);
      } else {
        const nextAction = result.terminal ? 0 : agent.chooseAction(result.nextState);
        agent.updateQ(
          current,
          action,
          result.reward,
          result.nextState,
          result.terminal,
          nextAction
        );
        if (!result.terminal) sarsaAction = nextAction;
      }

      current = result.nextState;

      self.postMessage({
        type: 'progress',
        episode,
        episodeReturn,
        epsilon: agent.epsilon,
        state: current
      });

      if (result.terminal) {
        agent.decayEpsilon();
        endWatchEpisode(episodeReturn);
      } else {
        const delay = Math.max(1000 / Math.max(1, cfg.watchSpeed), 16);
        timer = setTimeout(step, delay);
      }
    } catch (err) {
      postError(err);
      running = false;
    }
  }

  step();
}

function endWatchEpisode(episodeReturn) {
  if (!running) return;

  returns.push(episodeReturn);

  self.postMessage({
    type: 'progress',
    episode,
    episodeReturn,
    epsilon: agent.epsilon
  });

  sendQSnapshot(episode);

  if (episode >= cfg.episodes) {
    finalize();
  } else {
    timer = setTimeout(runWatchEpisode, 50);
  }
}

function runEpisodeSync() {
  let current = env.reset();
  let episodeReturn = 0;
  let terminal = false;

  let sarsaAction = agent.algorithm === 'sarsa'
    ? agent.chooseAction(current)
    : null;

  while (!terminal) {
    const action = agent.algorithm === 'sarsa'
      ? sarsaAction
      : agent.chooseAction(current);

    const result = env.step(action);
    episodeReturn += result.reward;

    if (agent.algorithm === 'q') {
      agent.updateQ(current, action, result.reward, result.nextState, result.terminal);
    } else {
      const nextAction = result.terminal ? 0 : agent.chooseAction(result.nextState);
      agent.updateQ(
        current,
        action,
        result.reward,
        result.nextState,
        result.terminal,
        nextAction
      );
      if (!result.terminal) sarsaAction = nextAction;
    }

    current = result.nextState;
    terminal = result.terminal;
  }

  return episodeReturn;
}

function sendQSnapshot(ep) {
  if (!agent) return;

  const qCopy = agent.q.slice();
  self.postMessage(
    {
      type: 'qsnapshot',
      episode: ep,
      qBuffer: qCopy.buffer
    },
    [qCopy.buffer]
  );
}

function finalize() {
  if (doneSent || !agent) return;

  doneSent = true;
  running = false;
  clearTimeout(timer);

  try {
    const stats = makeStats();
    const qCopy = agent.q.slice();

    self.postMessage(
      {
        type: 'done',
        qBuffer: qCopy.buffer,
        stats
      },
      [qCopy.buffer]
    );
  } catch (err) {
    postError(err);
  }
}

function makeStats() {
  const last = returns.slice(-50);
  let sum = 0;

  for (let i = 0; i < last.length; i++) {
    sum += last[i];
  }

  const avgReturnLast50 = last.length ? sum / last.length : 0;

  let bestReturn = 0;
  if (returns.length) {
    bestReturn = returns.reduce(function (acc, x) {
      return Math.max(acc, x);
    }, -Infinity);
  }

  return {
    avgReturnLast50,
    bestReturn,
    bestPath: computeBestPath()
  };
}

function computeBestPath() {
  if (!agent) return [];

  const tempEnv = new CliffWalkingEnv({ slipProbability: 0 });
  let state = tempEnv.reset();
  const path = [state];

  for (let i = 0; i < 1000 && !tempEnv.terminal; i++) {
    const action = agent.chooseAction(state, true);
    const result = tempEnv.step(action);
    state = result.nextState;
    path.push(state);
    if (result.terminal) break;
  }

  return path;
}

function postError(err) {
  self.postMessage({
    type: 'error',
    message: String((err && err.message) || err)
  });
}