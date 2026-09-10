// FIX #1: safe storage wrapper — never throws
const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

let game, agent, gameLoop = null, mode = 'human';
let running = false, paused = false;
let worker = null;
let bestScore = parseInt(store.get('snakeBest', '0'), 10);
let gamesPlayed = parseInt(store.get('snakeGames', '0'), 10);
let totalScore = parseInt(store.get('snakeTotal', '0'), 10);
let hapticsOn = true, soundOn = true;
let audioCtx = null;
let deferredPrompt = null;

// FIX #4: surface any error visibly so "blank screen" never happens silently
window.addEventListener('error', (e) => {
    console.error('APP ERROR:', e.message, e.error);
    toast('⚠️ ' + (e.message || 'Unexpected error'));
});

function init() {
    const canvas = document.getElementById('gameCanvas');
    game = new SnakeGame(canvas, 20);
    agent = new QLearningAgent();

    const saved = store.get('snakeQModel', null);
    if (saved) agent.deserialize(saved);

    setupModes();
    setupDpad();
    setupSwipe();
    setupKeyboard();
    setupButtons();
    setupInstall();
    setupOffline();
    updateHUD();

    // FIX #4: crash-proof render loop
    (function renderLoop() {
        try {
            const w = game.canvas.parentElement.getBoundingClientRect().width;
            if (Math.abs(w - game.displaySize) > 1) game.resize();  // auto-fix size
            if (mode !== 'train') game.draw();
        } catch (err) {
            console.error('DRAW ERROR:', err);
        }
        requestAnimationFrame(renderLoop);
    })();
}

// ===== Sound =====
function beep(freq, dur, type) {
    if (!soundOn) return;
    dur = dur || 0.08; type = type || 'square';
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
}

function vibrate(p) {
    try { if (hapticsOn && navigator.vibrate) navigator.vibrate(p); } catch (e) {}
}

// ===== Modes =====
function setupModes() {
    document.querySelectorAll('.modes button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modes button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            stopGame();
            game.reset();
            updateHUD();
            document.getElementById('trainPanel').classList.toggle('show', mode === 'train');
            document.getElementById('dpad').style.display = (mode === 'human') ? 'grid' : 'none';
            vibrate(30);
        });
    });
}

// ===== Input =====
function setupDpad() {
    document.querySelectorAll('#dpad button[data-dir]').forEach(btn => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(btn.dataset.dir); }, { passive: false });
        btn.addEventListener('mousedown', () => handleInput(btn.dataset.dir));
    });
}

function setupSwipe() {
    const wrap = document.getElementById('gameWrap');
    let sx = 0, sy = 0;
    wrap.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    wrap.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) handleInput(dx > 0 ? 'RIGHT' : 'LEFT');
        else handleInput(dy > 0 ? 'DOWN' : 'UP');
    }, { passive: true });
}

function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        const map = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT', w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT' };
        if (map[e.key]) { e.preventDefault(); handleInput(map[e.key]); }
        if (e.key === ' ') togglePause();
    });
}

// FIX #5: first input auto-starts the game instead of moving a "not started" snake
function handleInput(dir) {
    if (mode !== 'human' || paused) return;
    if (game.gameOver) { game.reset(); updateHUD(); }
    if (!running) startGame();
    const reward = game.move(dir);
    if (reward === 10) { beep(600, 0.1); vibrate(30); }
    updateHUD();
    if (game.gameOver) onGameOver();
}

// ===== Buttons =====
function setupButtons() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', () => {
        stopGame(); game.reset(); updateHUD();
        document.getElementById('pauseBtn').textContent = '⏸ Pause';
    });
    document.getElementById('saveBtn').addEventListener('click', () => {
        store.set('snakeQModel', agent.serialize());
        toast('💾 Model saved!');
        vibrate([30, 50, 30]);
    });
}

function startGame() {
    vibrate(20);
    if (mode === 'train') { startTraining(); return; }
    stopGame();
    game.reset();
    updateHUD();
    running = true; paused = false;
    document.getElementById('pauseBtn').textContent = '⏸ Pause';
    gameLoop = setInterval(tick, mode === 'ai' ? 90 : 130);
}

function tick() {
    if (paused) return;
    if (game.gameOver) { onGameOver(); return; }

    if (mode === 'ai') {
        const state = game.getState();
        const all = game.getSafeActions();
        const safe = all.filter(a => a.safe);
        const valid = (safe.length ? safe : all).map(a => a.dir);
        const action = agent.choose(state, valid, false);
        const reward = game.move(action);
        if (reward === 10) { beep(600, 0.1); vibrate(30); }
        updateHUD();
        if (game.gameOver) onGameOver();
    }
}

function stopGame() {
    if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
    running = false;
}

function togglePause() {
    if (!running) return;
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? '▶ Resume' : '⏸ Pause';
}

// FIX #6: auto-restart in Watch mode so the demo keeps running
function onGameOver() {
    stopGame();
    beep(150, 0.3, 'sawtooth');
    vibrate([100, 50, 100]);
    gamesPlayed++;
    totalScore += game.score;
    if (game.score > bestScore) {
        bestScore = game.score;
        store.set('snakeBest', String(bestScore));
        toast('🏆 New Best Score!');
    }
    store.set('snakeGames', String(gamesPlayed));
    store.set('snakeTotal', String(totalScore));
    updateHUD();

    if (mode === 'ai') setTimeout(() => { if (mode === 'ai') startGame(); }, 1200);
}

function updateHUD() {
    if (!game) return;
    document.getElementById('score').textContent = game.score;
    document.getElementById('best').textContent = bestScore;
    document.getElementById('games').textContent = gamesPlayed;
    document.getElementById('avg').textContent = gamesPlayed ? (totalScore / gamesPlayed).toFixed(1) : '0';
    document.getElementById('hudScore').textContent = game.score;
    document.getElementById('hudBest').textContent = bestScore;
}

// ===== Training (Web Worker) =====
function startTraining() {
    if (worker) worker.terminate();
    worker = new Worker('train-worker.js');

    const saved = store.get('snakeQModel', null);
    if (saved) worker.postMessage({ type: 'load', config: { data: saved } });
    worker.postMessage({ type: 'start', config: { episodes: 500, gridSize: 20 } });

    const chartData = [];
    document.getElementById('startBtn').disabled = true;

    worker.onmessage = (e) => {
        const d = e.data;
        if (d.type === 'progress') {
            document.getElementById('episode').textContent = d.episode + '/' + d.totalEpisodes;
            document.getElementById('epsilon').textContent = d.epsilon.toFixed(3);
            document.getElementById('avgReward').textContent = d.avgReward.toFixed(1);
            document.getElementById('progressFill').style.width = (d.episode / d.totalEpisodes * 100) + '%';
            chartData.push(d.avgReward);
            drawChart(chartData);
        }
        if (d.type === 'done') {
            store.set('snakeQModel', d.qData);
            agent.deserialize(d.qData);
            document.getElementById('startBtn').disabled = false;
            toast('✅ Training complete! Model saved.');
            vibrate([50, 50, 50]);
        }
    };
    worker.onerror = (e) => {
        console.error('WORKER ERROR:', e.message);
        toast('⚠️ Training error: ' + e.message);
        document.getElementById('startBtn').disabled = false;
    };
}

function drawChart(data) {
    const canvas = document.getElementById('chart');
    if (!canvas.clientWidth) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (data.length < 2) return;
    const min = Math.min.apply(null, data), max = Math.max.apply(null, data);
    const range = (max - min) || 1;
    ctx.strokeStyle = '#0f9d58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 20) - 10;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// ===== PWA =====
function setupInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'block';
    });
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const r = await deferredPrompt.userChoice;
        if (r.outcome === 'accepted') toast('🎉 App installed!');
        deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    });
}

function setupOffline() {
    const badge = document.getElementById('offlineBadge');
    const update = () => { badge.style.display = navigator.onLine ? 'none' : 'inline-block'; };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}

function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});

// Robust boot: works whether scripts load before or after DOM ready
function boot() {
    try {
        init();
        requestWakeLock();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(e => console.log('SW failed:', e));
        }
    } catch (err) {
        console.error('BOOT ERROR:', err);
        toast('⚠️ Boot error: ' + err.message);
    }
}
if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
else window.addEventListener('load', boot);