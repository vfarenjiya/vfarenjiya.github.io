(function () {
  'use strict';

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : v;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    }
  };

  const Q_LENGTH = 48 * 4;

  const qTables = {
    q: new Float64Array(Q_LENGTH),
    sarsa: new Float64Array(Q_LENGTH)
  };

  const returns = {
    q: [],
    sarsa: []
  };

  const liveStates = {
    q: null,
    sarsa: null
  };

  const lastStats = {
    q: null,
    sarsa: null
  };

  const progressState = {
    q: { episode: 0, epsilon: 1 },
    sarsa: { episode: 0, epsilon: 1 }
  };

  const trained = {
    q: false,
    sarsa: false
  };

  const workers = {
    q: null,
    sarsa: null
  };

  const activeWorkers = {
    q: false,
    sarsa: false
  };

  let mode = 'q';
  let viewAlg = 'q';
  let episodes = 500;
  let trainingActive = false;

  let renderer = null;
  let chart = null;
  let playback = null;

  let deferredInstallPrompt = null;
  let wakeLock = null;
  let stopFallbackTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  let toastTimer = null;

  function showToast(message) {
    const el = $('toast');
    if (!el) return;

    el.textContent = String(message);
    el.hidden = false;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 3500);
  }

  globalThis.showToast = showToast;

  window.addEventListener('error', function (event) {
    showToast('Error: ' + (event.message || 'unknown'));
  });

  function boot() {
    try {
      restore();
      initUI();

      renderer = new HeatmapRenderer($('heatmap'));
      chart = new ReturnChart($('chart'));

      chart.data.q = returns.q;
      chart.data.sarsa = returns.sarsa;
      chart.mode = mode === 'both' ? 'both' : mode;

      renderer.showHeatmap = $('toggleHeatmap').checked;
      renderer.showArrows = $('toggleArrows').checked;
      renderer.setQ(qTables[viewAlg]);

      playback = new PlaybackController({
        getQ: function () {
          return qTables[viewAlg];
        },
        toast: showToast,
        elements: {
          first: $('pbFirst'),
          back: $('pbBack'),
          play: $('pbPlay'),
          forward: $('pbForward'),
          speed: $('pbSpeed'),
          speedLabel: $('pbSpeedLabel'),
          bars: [
            $('qbar-0'),
            $('qbar-1'),
            $('qbar-2'),
            $('qbar-3')
          ],
          vals: [
            $('qval-0'),
            $('qval-1'),
            $('qval-2'),
            $('qval-3')
          ]
        }
      });

      initPWA();
      updateOfflineBadge();
      updateTabStyles();
      updateEpisodeButtons();
      updateLabels();
      updateStats();
    } catch (err) {
      if (globalThis.console) console.error(err);
      showToast('Boot error: ' + ((err && err.message) || err));
    }
  }

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot);
  }

  function restore() {
    const configRaw = store.get('cw_config', null);

    if (configRaw) {
      try {
        const cfg = JSON.parse(configRaw);

        if (cfg && typeof cfg === 'object') {
          if (cfg.alpha !== undefined) $('alpha').value = String(cfg.alpha);
          if (cfg.gamma !== undefined) $('gamma').value = String(cfg.gamma);
          if (cfg.watchSpeed !== undefined) $('watchSpeed').value = String(cfg.watchSpeed);
          if (cfg.heatmap !== undefined) $('toggleHeatmap').checked = !!cfg.heatmap;
          if (cfg.arrows !== undefined) $('toggleArrows').checked = !!cfg.arrows;

          episodes = Number(cfg.episodes) || 500;

          if (cfg.mode === 'sarsa' || cfg.mode === 'both') {
            mode = cfg.mode;
          } else {
            mode = 'q';
          }

          if (cfg.viewAlg === 'sarsa') {
            viewAlg = 'sarsa';
          } else {
            viewAlg = 'q';
          }

          if (mode !== 'both') {
            viewAlg = mode;
          }
        }
      } catch (e) {
        // Ignore corrupt config.
      }
    }

    const qRaw = {
      q: store.get('cw_q_qlearning', ''),
      sarsa: store.get('cw_q_sarsa', '')
    };

    ['q', 'sarsa'].forEach(function (alg) {
      const raw = qRaw[alg];
      if (!raw) return;

      const nums = raw.split(',').map(Number);

      if (nums.length === Q_LENGTH && nums.every(Number.isFinite)) {
        qTables[alg] = Float64Array.from(nums);
        trained[alg] = qTables[alg].some(function (v) {
          return v !== 0;
        });
      }
    });

    const statsRaw = store.get('cw_stats', null);

    if (statsRaw) {
      try {
        const saved = JSON.parse(statsRaw);

        if (saved && saved.returns) {
          if (Array.isArray(saved.returns.q)) returns.q = saved.returns.q;
          if (Array.isArray(saved.returns.sarsa)) returns.sarsa = saved.returns.sarsa;
        }

        if (saved && saved.lastStats) {
          lastStats.q = saved.lastStats.q || null;
          lastStats.sarsa = saved.lastStats.sarsa || null;
        }

        if (saved && saved.progressState) {
          if (saved.progressState.q) progressState.q = saved.progressState.q;
          if (saved.progressState.sarsa) progressState.sarsa = saved.progressState.sarsa;
        }
      } catch (e) {
        // Ignore corrupt stats.
      }
    }
  }

  function initUI() {
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.dataset.mode);
      });
    });

    document.querySelectorAll('.episodes-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        episodes = Number(btn.dataset.episodes) || 500;
        updateEpisodeButtons();
        saveConfig();
      });
    });

    $('trainBtn').addEventListener('click', startTraining);
    $('stopBtn').addEventListener('click', stopTraining);
    $('resetBtn').addEventListener('click', resetAll);

    $('watchSpeed').addEventListener('input', function () {
      updateLabels();

      if (Number($('watchSpeed').value) === 0 && renderer) {
        renderer.liveState = null;
      }

      saveConfig();
    });

    $('alpha').addEventListener('input', function () {
      updateLabels();
      saveConfig();
    });

    $('gamma').addEventListener('input', function () {
      updateLabels();
      saveConfig();
    });

    $('toggleHeatmap').addEventListener('change', function () {
      if (renderer) renderer.showHeatmap = this.checked;
      saveConfig();
    });

    $('toggleArrows').addEventListener('change', function () {
      if (renderer) renderer.showArrows = this.checked;
      saveConfig();
    });
  }

  function setMode(nextMode) {
    mode = nextMode;

    if (mode !== 'both') {
      viewAlg = mode;
    }

    if (chart) {
      chart.mode = mode === 'both' ? 'both' : mode;
    }

    if (renderer) {
      renderer.setQ(qTables[viewAlg]);
      renderer.liveState =
        trainingActive && Number($('watchSpeed').value) > 0
          ? liveStates[viewAlg]
          : null;
    }

    if (playback) playback.reset();

    updateTabStyles();
    updateStats();
    saveConfig();
  }

  function updateTabStyles() {
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function updateEpisodeButtons() {
    document.querySelectorAll('.episodes-btn').forEach(function (btn) {
      btn.classList.toggle(
        'active',
        Number(btn.dataset.episodes) === episodes
      );
    });
  }

  function updateLabels() {
    const alpha = Number($('alpha').value);
    const gamma = Number($('gamma').value);
    const speed = Number($('watchSpeed').value);

    $('alphaLabel').textContent = `α ${alpha.toFixed(2)}`;
    $('gammaLabel').textContent = `γ ${gamma.toFixed(2)}`;
    $('speedLabel').textContent =
      speed === 0 ? 'Speed 0/turbo' : `Speed ${speed}/s`;

    const pbSpeed = Number($('pbSpeed').value);
    $('pbSpeedLabel').textContent = `Playback ${pbSpeed}/s`;
  }

  function currentConfig() {
    return {
      episodes,
      alpha: Number($('alpha').value),
      gamma: Number($('gamma').value),
      slipProbability: 0,
      watchSpeed: Number($('watchSpeed').value) || 0
    };
  }

  function startTraining() {
    if (trainingActive) {
      showToast('Training already running.');
      return;
    }

    const algs = mode === 'both'
      ? ['q', 'sarsa']
      : [mode === 'sarsa' ? 'sarsa' : 'q'];

    const cfg = currentConfig();
    let started = false;

    algs.forEach(function (alg) {
      terminateWorker(alg);
      resetAlgorithmData(alg);

      const worker = ensureWorker(alg);
      if (!worker) return;

      activeWorkers[alg] = true;

      worker.postMessage({
        type: 'start',
        config: {
          episodes: cfg.episodes,
          alpha: cfg.alpha,
          gamma: cfg.gamma,
          algorithm: alg === 'q' ? 'q' : 'sarsa',
          slipProbability: cfg.slipProbability,
          watchSpeed: cfg.watchSpeed
        }
      });

      started = true;
    });

    if (!started) {
      showToast('Could not start training.');
      return;
    }

    trainingActive = true;
    $('trainBtn').disabled = true;
    $('stopBtn').disabled = false;

    requestWakeLock();
    saveConfig();
  }

  function stopTraining() {
    if (!trainingActive) return;

    ['q', 'sarsa'].forEach(function (alg) {
      if (activeWorkers[alg] && workers[alg]) {
        try {
          workers[alg].postMessage({ type: 'stop' });
        } catch (e) {
          // Ignore worker post errors.
        }
      }
    });

    clearTimeout(stopFallbackTimer);
    stopFallbackTimer = setTimeout(function () {
      if (!trainingActive) return;

      ['q', 'sarsa'].forEach(function (alg) {
        if (activeWorkers[alg]) terminateWorker(alg);
      });

      finalizeTraining();
    }, 3000);
  }

  function resetAll() {
    trainingActive = false;
    clearTimeout(stopFallbackTimer);

    ['q', 'sarsa'].forEach(function (alg) {
      terminateWorker(alg);

      qTables[alg] = new Float64Array(Q_LENGTH);
      returns[alg] = [];
      liveStates[alg] = null;
      lastStats[alg] = null;
      progressState[alg] = { episode: 0, epsilon: 1 };
      trained[alg] = false;

      if (chart) chart.data[alg] = returns[alg];

      saveQ(alg);
    });

    if (renderer) {
      renderer.setQ(qTables[viewAlg]);
      renderer.liveState = null;
    }

    if (playback) playback.reset();

    $('trainBtn').disabled = false;
    $('stopBtn').disabled = true;

    updateStats();
    saveStats();
    saveConfig();

    showToast('Reset complete.');
  }

  function resetAlgorithmData(alg) {
    qTables[alg] = new Float64Array(Q_LENGTH);
    returns[alg] = [];
    liveStates[alg] = null;
    lastStats[alg] = null;
    progressState[alg] = { episode: 0, epsilon: 1 };
    trained[alg] = false;

    if (chart) chart.data[alg] = returns[alg];

    if (renderer && viewAlg === alg) {
      renderer.setQ(qTables[alg]);
      renderer.liveState = null;
    }
  }

  function ensureWorker(alg) {
    if (workers[alg]) return workers[alg];

    if (typeof Worker === 'undefined') {
      showToast('Web Workers unavailable.');
      return null;
    }

    try {
      const worker = new Worker('./trainer-worker.js');

      worker.onmessage = function (event) {
        handleWorkerMessage(alg, event.data);
      };

      worker.onerror = function (event) {
        showToast('Worker error: ' + (event.message || 'unknown'));
      };

      workers[alg] = worker;
      return worker;
    } catch (err) {
      showToast('Worker error: ' + ((err && err.message) || err));
      return null;
    }
  }

  function terminateWorker(alg) {
    if (workers[alg]) {
      try {
        workers[alg].terminate();
      } catch (e) {
        // Ignore termination errors.
      }
      workers[alg] = null;
    }

    activeWorkers[alg] = false;
  }

  function handleWorkerMessage(alg, msg) {
    if (!msg || !msg.type) return;

    try {
      if (msg.type === 'progress') {
        if (typeof msg.state === 'number') {
          liveStates[alg] = msg.state;

          if (
            renderer &&
            viewAlg === alg &&
            trainingActive &&
            Number($('watchSpeed').value) > 0
          ) {
            renderer.liveState = msg.state;
          }
        } else {
          progressState[alg].episode = msg.episode || 0;

          if (typeof msg.epsilon === 'number') {
            progressState[alg].epsilon = msg.epsilon;
          }

          if (chart) {
            chart.addPoint(alg, msg.episode || 0, msg.episodeReturn || 0);
          }

          updateStats();
        }
      } else if (msg.type === 'qsnapshot') {
        if (msg.qBuffer) {
          const q = new Float64Array(msg.qBuffer);
          qTables[alg] = q;
          trained[alg] = true;

          if (renderer && viewAlg === alg) {
            renderer.setQ(q);
          }
        }
      } else if (msg.type === 'done') {
        if (msg.qBuffer) {
          const q = new Float64Array(msg.qBuffer);
          qTables[alg] = q;
          trained[alg] = true;

          if (renderer && viewAlg === alg) {
            renderer.setQ(q);
          }

          saveQ(alg);
        }

        if (msg.stats) {
          lastStats[alg] = msg.stats;
        }

        activeWorkers[alg] = false;
        updateStats();
        checkAllDone();
      } else if (msg.type === 'error') {
        showToast(msg.message || 'Worker error.');
        activeWorkers[alg] = false;
        checkAllDone();
      }
    } catch (err) {
      if (globalThis.console) console.error(err);
      showToast('Message error: ' + ((err && err.message) || err));
    }
  }

  function checkAllDone() {
    if (activeWorkers.q || activeWorkers.sarsa) return;
    finalizeTraining();
  }

  function finalizeTraining() {
    if (!trainingActive) return;

    trainingActive = false;

    clearTimeout(stopFallbackTimer);
    stopFallbackTimer = null;

    $('trainBtn').disabled = false;
    $('stopBtn').disabled = true;

    if (renderer) renderer.liveState = null;

    saveStats();
    releaseWakeLock();

    if (navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // Ignore vibration errors.
      }
    }

    showToast('Training complete.');
  }

  function updateStats() {
    const prog = progressState[viewAlg] || { episode: 0, epsilon: 1 };

    $('statEpisode').textContent = String(prog.episode || 0);

    const epsilon = typeof prog.epsilon === 'number'
      ? prog.epsilon
      : 1;

    $('statEpsilon').textContent = epsilon.toFixed(3);

    let avg = '—';

    const stats = lastStats[viewAlg];

    if (stats && Number.isFinite(stats.avgReturnLast50)) {
      avg = stats.avgReturnLast50.toFixed(1);
    } else if (returns[viewAlg].length) {
      const slice = returns[viewAlg].slice(-50);
      let sum = 0;

      for (let i = 0; i < slice.length; i++) {
        sum += Number(slice[i].y) || 0;
      }

      avg = (sum / slice.length).toFixed(1);
    }

    $('statAvg').textContent = avg;
  }

  function saveQ(alg) {
    const key = alg === 'q' ? 'cw_q_qlearning' : 'cw_q_sarsa';
    store.set(key, Array.from(qTables[alg]).join(','));
  }

  function saveStats() {
    store.set('cw_stats', JSON.stringify({
      returns,
      lastStats,
      progressState
    }));
  }

  function saveConfig() {
    store.set('cw_config', JSON.stringify({
      alpha: $('alpha').value,
      gamma: $('gamma').value,
      episodes,
      watchSpeed: $('watchSpeed').value,
      heatmap: $('toggleHeatmap').checked,
      arrows: $('toggleArrows').checked,
      mode,
      viewAlg
    }));
  }

  function initPWA() {
    window.addEventListener('online', updateOfflineBadge);
    window.addEventListener('offline', updateOfflineBadge);

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      $('installBtn').hidden = false;
    });

    $('installBtn').addEventListener('click', async function () {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();

      try {
        await deferredInstallPrompt.userChoice;
      } catch (e) {
        // Ignore prompt errors.
      }

      deferredInstallPrompt = null;
      $('installBtn').hidden = true;
    });

    window.addEventListener('appinstalled', function () {
      $('installBtn').hidden = true;
      showToast('Installed.');
    });

    if (
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      $('installBtn').hidden = true;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {
        // Service worker is progressive enhancement.
      });
    }
  }

  function updateOfflineBadge() {
    const offline = navigator.onLine === false;
    $('offlineBadge').hidden = !offline;
  }

  async function requestWakeLock() {
    try {
      if (navigator.wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (e) {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    try {
      if (wakeLock) wakeLock.release();
    } catch (e) {
      // Ignore wake lock errors.
    }
    wakeLock = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && trainingActive) {
      requestWakeLock();
    }
  });
})();