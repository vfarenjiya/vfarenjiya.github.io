(function () {
  'use strict';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var toastTimer = null;
  function showToast(message) { var el = document.getElementById('toast'); if (!el) return; el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 3500); }
  globalThis.showToast = showToast;
  window.addEventListener('error', function (e) { showToast('Error: ' + (e.message || 'unknown')); });

  var Q_LENGTH = 192;
  var qTables = { q: new Float64Array(Q_LENGTH), sarsa: new Float64Array(Q_LENGTH) };
  var returns = { q: [], sarsa: [] };
  var liveStates = { q: null, sarsa: null };
  var lastStats = { q: null, sarsa: null };
  var progressState = { q: { episode: 0, epsilon: 1 }, sarsa: { episode: 0, epsilon: 1 } };
  var workers = { q: null, sarsa: null }, activeWorkers = { q: false, sarsa: false };
  var mode = 'q', viewAlg = 'q', trainingActive = false, episodes = 500;
  var renderer = null, chart = null, playback = null, deferredInstall = null, wakeLock = null, stopFallback = null;

  function $(id) { return document.getElementById(id); }

  function restore() {
    var cfgRaw = store.get('cw_config', null);
    if (cfgRaw) {
      try {
        var cfg = JSON.parse(cfgRaw);
        if (cfg && typeof cfg === 'object') {
          if (cfg.alpha !== undefined) $('alpha').value = String(cfg.alpha);
          if (cfg.gamma !== undefined) $('gamma').value = String(cfg.gamma);
          if (cfg.watchSpeed !== undefined) $('watchSpeed').value = String(cfg.watchSpeed);
          if (cfg.heatmap !== undefined) $('toggleHeatmap').checked = !!cfg.heatmap;
          if (cfg.arrows !== undefined) $('toggleArrows').checked = !!cfg.arrows;
          episodes = Number(cfg.episodes) || 500;
          mode = (cfg.mode === 'sarsa' || cfg.mode === 'both') ? cfg.mode : 'q';
          viewAlg = (cfg.viewAlg === 'sarsa') ? 'sarsa' : 'q';
          if (mode !== 'both') viewAlg = mode;
        }
      } catch (e) {}
    }
    var raw = { q: store.get('cw_q_qlearning', ''), sarsa: store.get('cw_q_sarsa', '') };
    ['q', 'sarsa'].forEach(function (alg) {
      var r = raw[alg]; if (!r) return;
      var nums = r.split(',').map(Number);
      if (nums.length === Q_LENGTH && nums.every(Number.isFinite)) qTables[alg] = Float64Array.from(nums);
    });
    var stRaw = store.get('cw_stats', null);
    if (stRaw) {
      try {
        var st = JSON.parse(stRaw);
        if (st && st.returns) { if (Array.isArray(st.returns.q)) returns.q = st.returns.q; if (Array.isArray(st.returns.sarsa)) returns.sarsa = st.returns.sarsa; }
        if (st && st.lastStats) { lastStats.q = st.lastStats.q || null; lastStats.sarsa = st.lastStats.sarsa || null; }
        if (st && st.progressState) { if (st.progressState.q) progressState.q = st.progressState.q; if (st.progressState.sarsa) progressState.sarsa = st.progressState.sarsa; }
      } catch (e) {}
    }
  }

  function saveQ(alg) { store.set(alg === 'q' ? 'cw_q_qlearning' : 'cw_q_sarsa', Array.from(qTables[alg]).join(',')); }
  function saveStats() { store.set('cw_stats', JSON.stringify({ returns: returns, lastStats: lastStats, progressState: progressState })); }
  function saveConfig() { store.set('cw_config', JSON.stringify({ alpha: $('alpha').value, gamma: $('gamma').value, episodes: episodes, watchSpeed: $('watchSpeed').value, heatmap: $('toggleHeatmap').checked, arrows: $('toggleArrows').checked, mode: mode, viewAlg: viewAlg })); }

  function updateLabels() {
    $('alphaLabel').textContent = 'α ' + Number($('alpha').value).toFixed(2);
    $('gammaLabel').textContent = 'γ ' + Number($('gamma').value).toFixed(2);
    var w = Number($('watchSpeed').value);
    $('speedLabel').textContent = w === 0 ? 'Speed 0/turbo' : 'Speed ' + w + '/s';
    $('pbSpeedLabel').textContent = 'Playback ' + Math.max(1, Number($('pbSpeed').value) || 5) + '/s';
  }
  function updateTabStyles() { document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === mode); }); }
  function updateEpisodeButtons() { document.querySelectorAll('.episodes-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.episodes === String(episodes)); }); }

  function updateStats() {
    var ps = progressState[viewAlg] || { episode: 0, epsilon: 1 };
    $('statEpisode').textContent = String(ps.episode || 0);
    $('statEpsilon').textContent = Number(typeof ps.epsilon === 'number' ? ps.epsilon : 1).toFixed(3);
    var avg = '—', st = lastStats[viewAlg];
    if (st && Number.isFinite(st.avgReturnLast50)) avg = st.avgReturnLast50.toFixed(1);
    else if (returns[viewAlg].length) { var sl = returns[viewAlg].slice(-50), sum = 0; for (var i = 0; i < sl.length; i++) sum += Number(sl[i].y) || 0; avg = (sum / sl.length).toFixed(1); }
    $('statAvg').textContent = avg;
  }

  function setMode(m) {
    mode = m; if (m !== 'both') viewAlg = m;
    if (chart) chart.mode = (m === 'both') ? 'both' : m;
    if (renderer) { renderer.setQ(qTables[viewAlg]); renderer.liveState = (trainingActive && Number($('watchSpeed').value) > 0) ? liveStates[viewAlg] : null; }
    if (playback) playback.reset();
    updateTabStyles(); updateStats(); saveConfig();
  }

  function terminateWorker(alg) { if (workers[alg]) { try { workers[alg].terminate(); } catch (e) {} workers[alg] = null; } activeWorkers[alg] = false; }
  function ensureWorker(alg) {
    if (workers[alg]) return workers[alg];
    if (typeof Worker === 'undefined') { showToast('Web Workers unavailable'); return null; }
    try {
      var w = new Worker('./trainer-worker.js');
      w.onmessage = function (e) { handleWorkerMessage(alg, e.data); };
      w.onerror = function (e) { showToast('Worker error: ' + (e.message || 'unknown')); };
      workers[alg] = w; return w;
    } catch (err) { showToast('Worker error: ' + (err.message || err)); return null; }
  }

  function resetAlgorithmData(alg) {
    qTables[alg] = new Float64Array(Q_LENGTH); returns[alg] = []; liveStates[alg] = null; lastStats[alg] = null;
    progressState[alg] = { episode: 0, epsilon: 1 };
    if (chart) chart.data[alg] = returns[alg];
    if (renderer && viewAlg === alg) renderer.setQ(qTables[alg]);
  }

  function handleWorkerMessage(alg, msg) {
    if (!msg || !msg.type) return;
    try {
      if (msg.type === 'progress') {
        if (typeof msg.state === 'number') { liveStates[alg] = msg.state; if (viewAlg === alg && renderer && trainingActive && Number($('watchSpeed').value) > 0) renderer.liveState = msg.state; }
        else { progressState[alg].episode = msg.episode || 0; if (typeof msg.epsilon === 'number') progressState[alg].epsilon = msg.epsilon; if (chart) chart.addPoint(alg, msg.episode || 0, msg.episodeReturn || 0); updateStats(); }
      } else if (msg.type === 'qsnapshot') {
        if (msg.qBuffer) { qTables[alg] = new Float64Array(msg.qBuffer); if (renderer && viewAlg === alg) renderer.setQ(qTables[alg]); }
      } else if (msg.type === 'done') {
        if (msg.qBuffer) { qTables[alg] = new Float64Array(msg.qBuffer); if (renderer && viewAlg === alg) renderer.setQ(qTables[alg]); saveQ(alg); }
        if (msg.stats) lastStats[alg] = msg.stats;
        activeWorkers[alg] = false; updateStats(); checkAllDone();
      } else if (msg.type === 'error') { showToast(msg.message || 'Worker error'); activeWorkers[alg] = false; checkAllDone(); }
    } catch (err) { console.error(err); showToast('Message error: ' + (err.message || err)); }
  }

  function finalizeTraining() {
    if (stopFallback) { clearTimeout(stopFallback); stopFallback = null; }
    if (!trainingActive) return;
    trainingActive = false; $('trainBtn').disabled = false; $('stopBtn').disabled = true;
    if (renderer) renderer.liveState = null;
    saveStats();
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
    releaseWakeLock(); showToast('Training complete');
  }
  function checkAllDone() { if (activeWorkers.q || activeWorkers.sarsa) return; finalizeTraining(); }

  function startTraining() {
    if (trainingActive) { showToast('Training already running'); return; }
    var algs = (mode === 'both') ? ['q', 'sarsa'] : [(mode === 'sarsa') ? 'sarsa' : 'q'];
    var cfg = { episodes: episodes, alpha: Number($('alpha').value), gamma: Number($('gamma').value), slipProbability: 0, watchSpeed: Number($('watchSpeed').value) || 0 };
    if (!isFinite(cfg.alpha)) cfg.alpha = 0.2; if (!isFinite(cfg.gamma)) cfg.gamma = 0.99;
    var started = false;
    algs.forEach(function (alg) { terminateWorker(alg); resetAlgorithmData(alg); var w = ensureWorker(alg); if (!w) return; activeWorkers[alg] = true; w.postMessage({ type: 'start', config: Object.assign({}, cfg, { algorithm: alg === 'q' ? 'q' : 'sarsa' }) }); started = true; });
    if (!started) return;
    trainingActive = true; $('trainBtn').disabled = true; $('stopBtn').disabled = false;
    if (renderer) renderer.liveState = null;
    requestWakeLock(); saveConfig();
  }
  function stopTraining() {
    if (!trainingActive) return;
    ['q', 'sarsa'].forEach(function (alg) { if (activeWorkers[alg] && workers[alg]) { try { workers[alg].postMessage({ type: 'stop' }); } catch (e) {} } });
    stopFallback = setTimeout(function () { if (trainingActive) { ['q', 'sarsa'].forEach(function (alg) { if (activeWorkers[alg]) terminateWorker(alg); }); finalizeTraining(); } }, 3000);
  }
  function resetAll() {
    if (stopFallback) { clearTimeout(stopFallback); stopFallback = null; }
    trainingActive = false;
    ['q', 'sarsa'].forEach(function (alg) { terminateWorker(alg); qTables[alg] = new Float64Array(Q_LENGTH); returns[alg] = []; liveStates[alg] = null; lastStats[alg] = null; progressState[alg] = { episode: 0, epsilon: 1 }; if (chart) chart.data[alg] = returns[alg]; saveQ(alg); });
    if (renderer) { renderer.setQ(qTables[viewAlg]); renderer.liveState = null; }
    if (playback) playback.reset();
    $('trainBtn').disabled = false; $('stopBtn').disabled = true;
    updateStats(); saveStats(); saveConfig(); showToast('Reset complete');
  }

  async function requestWakeLock() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { wakeLock = null; } }
  function releaseWakeLock() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }

  function updateOffline() { var offline = navigator.onLine === false; $('offlineBadge').hidden = !offline; }

  function initPwa() {
    updateOffline(); window.addEventListener('online', updateOffline); window.addEventListener('offline', updateOffline);
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; $('installBtn').hidden = false; });
    $('installBtn').addEventListener('click', async function () { if (!deferredInstall) return; deferredInstall.prompt(); var choice = await deferredInstall.userChoice; if (choice.outcome === 'accepted') $('installBtn').hidden = true; deferredInstall = null; });
    window.addEventListener('appinstalled', function () { $('installBtn').hidden = true; });
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) $('installBtn').hidden = true;
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(function () {}); }
  }

  function initUI() {
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
    document.querySelectorAll('.episodes-btn').forEach(function (b) { b.addEventListener('click', function () { episodes = Number(b.dataset.episodes) || 500; updateEpisodeButtons(); saveConfig(); }); });
    $('trainBtn').addEventListener('click', startTraining);
    $('stopBtn').addEventListener('click', stopTraining);
    $('resetBtn').addEventListener('click', resetAll);
    $('watchSpeed').addEventListener('input', function () { updateLabels(); if (Number(this.value) === 0 && renderer) renderer.liveState = null; saveConfig(); });
    $('alpha').addEventListener('input', function () { updateLabels(); saveConfig(); });
    $('gamma').addEventListener('input', function () { updateLabels(); saveConfig(); });
    $('toggleHeatmap').addEventListener('change', function () { if (renderer) renderer.showHeatmap = this.checked; saveConfig(); });
    $('toggleArrows').addEventListener('change', function () { if (renderer) renderer.showArrows = this.checked; saveConfig(); });
    updateTabStyles(); updateEpisodeButtons(); updateLabels();
  }

  function boot() {
    try {
      restore(); initUI();
      renderer = new HeatmapRenderer($('heatmap'));
      chart = new ReturnChart($('chart'));
      chart.data.q = returns.q; chart.data.sarsa = returns.sarsa; chart.mode = (mode === 'both') ? 'both' : mode;
      renderer.showHeatmap = $('toggleHeatmap').checked; renderer.showArrows = $('toggleArrows').checked;
      renderer.setQ(qTables[viewAlg]);
      playback = new PlaybackController({
        getQ: function () { return qTables[viewAlg]; }, toast: showToast,
        elements: { first: $('pbFirst'), back: $('pbBack'), play: $('pbPlay'), forward: $('pbForward'), speed: $('pbSpeed'), speedLabel: $('pbSpeedLabel'), bars: [$('qbar-0'), $('qbar-1'), $('qbar-2'), $('qbar-3')], vals: [$('qval-0'), $('qval-1'), $('qval-2'), $('qval-3')] }
      });
      initPwa(); updateStats();
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && trainingActive) requestWakeLock(); });
    } catch (err) { console.error(err); showToast('Boot error: ' + (err.message || err)); }
  }

  if (document.readyState === 'interactive' || document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();