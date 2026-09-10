let game, agent, gameLoop = null, mode = 'human';
let running = false, paused = false;
let worker = null;
let bestScore = parseInt(localStorage.getItem('snakeBest') || '0');
let gamesPlayed = parseInt(localStorage.getItem('snakeGames') || '0');
let totalScore = parseInt(localStorage.getItem('snakeTotal') || '0');
let soundOn = true, hapticsOn = true;
let audioCtx = null;
let deferredPrompt = null;

// ===== Init =====
function init() {
    const canvas = document.getElementById('gameCanvas');
    game = new SnakeGame(canvas, 20);
    agent = new QLearningAgent();

    const saved = localStorage.getItem('snakeQModel');
    if (saved) agent.deserialize(saved);

    setupModes();
    setupDpad();
    setupSwipe();
    setupKeyboard();
    setupButtons();
    setupInstall();
    setupOffline();
    updateHUD();
    game.draw();
    requestAnimationFrame(renderLoop);
}

function renderLoop() {
    if (mode !== 'train') game.draw();
    requestAnimationFrame(renderLoop);
}

// ===== Sound (Web Audio, no files) =====
function beep(freq, dur = 0.08, type = 'square') {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch(e) {}
}

function vibrate(pattern) {
    if (hapticsOn && navigator.vibrate) navigator.vibrate(pattern);
}

// ===== Mode switching =====
function setupModes() {
    document.querySelectorAll('.modes button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modes button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            stopGame();
            document.getElementById('trainPanel').classList.toggle('show', mode === 'train');
            document.getElementById('dpad').style.display = mode === 'human' ? 'grid' : 'none';
            vibrate(30);
        });
    });
}

// ===== Controls =====
function setupDpad() {
    document.querySelectorAll('#dpad button[data-dir]').forEach(btn => {
        btn.addEventListener('touchstart', e => { e.preventDefault(); handleInput(btn.dataset.dir); });
        btn.addEventListener('mousedown', () => handleInput(btn.dataset.dir));
    });
}

function setupSwipe() {
    const wrap = document.getElementById('gameWrap');
    let sx = 0, sy = 0;
    wrap.addEventListener('touchstart', e => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    wrap.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) handleInput(dx > 0 ? 'RIGHT' : 'LEFT');
        else handleInput(dy > 0 ? 'DOWN' : 'UP');
    }, { passive: true });
}

function setupKeyboard() {
    document.addEventListener('keydown', e => {
        const map = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT',
                      w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT' };
        if (map[e.key]) { e.preventDefault(); handleInput(map[e.key]); }
        if (e.key === ' ') togglePause();
    });
}

function handleInput(dir) {
    if (mode !== 'human' || paused || game.gameOver) return;
    const reward = game.move(dir);
    if (reward === 10) { beep(600, 0.1); vibrate(30); updateHUD(); }
    if (game.gameOver) onGameOver();
}

// ===== Buttons =====
function setupButtons() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resetBtn').addEventListener('click', () => { stopGame(); game.reset(); updateHUD(); });
    document.getElementById('saveBtn').addEventListener('click', () => {
        localStorage.setItem('snakeQModel', agent.serialize());
        toast('💾 Model saved!');
        vibrate([30, 50, 30]);
    });
}

function startGame() {
    vibrate(20);
    if (mode === 'train') { startTraining(); return; }
    stopGame();
    game.reset();
    running = true; paused = false;
    const speed = mode === 'ai' ? 90 : 130;
    gameLoop = setInterval(tick, speed);
}

function tick() {
    if (paused) return;
    if (game.gameOver) { onGameOver(); return; }

    if (mode === 'ai') {
        const state = game.getState();
        const safeActions = game.getSafeActions();
        const safe = safeActions.filter(a => a.safe);
        const valid = safe.length ? safe.map(a => a.dir) : safeActions.map(a => a.dir);
        const action = agent.choose(state, valid, false);
        const reward = game.move(action);
        if (reward === 10) { beep(600, 0.1); vibrate(30); updateHUD(); }
    }

    if (game.gameOver) onGameOver();
}

function stopGame() {
    if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
    running = false;
}

function togglePause() {
    if (!running && mode !== 'train') return;
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? '▶ Resume' : '⏸ Pause';
}

function onGameOver() {
    stopGame();
    beep(150, 0.3, 'sawtooth');
    vibrate([100, 50, 100]);
    gamesPlayed++;
    totalScore += game.score;
    if (game.score > bestScore) {
        bestScore = game.score;
        localStorage.setItem('snakeBest', bestScore);
        toast('🏆 New Best Score!');
    }
    localStorage.setItem('snakeGames', gamesPlayed);
    localStorage.setItem('snakeTotal', totalScore);
    updateHUD();
}

function updateHUD() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('best').textContent = bestScore;
    document.getElementById('games').textContent = gamesPlayed;
    document.getElementById('avg').textContent = gamesPlayed ? (totalScore/gamesPlayed).toFixed(1) : 0;
    document.getElementById('hudScore').textContent = game.score;
    document.getElementById('hudBest').textContent = bestScore;
}

// ===== Training via Web Worker =====
function startTraining() {
    if (worker) { worker.terminate(); }
    worker = new Worker('train-worker.js');

    const saved = localStorage.getItem('snakeQModel');
    if (saved) worker.postMessage({ type: 'load', config: { data: saved } });

    worker.postMessage({ type: 'start', config: { episodes: 500, gridSize: 20 } });

    const chartData = [];
    document.getElementById('startBtn').disabled = true;

    worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
            const { episode, totalEpisodes, epsilon, avgReward } = e.data;
            document.getElementById('episode').textContent = `${episode}/${totalEpisodes}`;
            document.getElementById('epsilon').textContent = epsilon.toFixed(3);
            document.getElementById('avgReward').textContent = avgReward.toFixed(1);
            document.getElementById('progressFill').style.width = `${(episode/totalEpisodes)*100}%`;
            chartData.push(avgReward);
            drawChart(chartData);
        }
        if (e.data.type === 'done') {
            localStorage.setItem('snakeQModel', e.data.qData);
            agent.deserialize(e.data.qData);
            document.getElementById('startBtn').disabled = false;
            toast('✅ Training complete! Model saved.');
            vibrate([50, 50, 50]);
        }
    };
}

function drawChart(data) {
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;

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

// ===== PWA Install =====
function setupInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'block';
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') toast('🎉 App installed!');
        deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    });

    window.addEventListener('appinstalled', () => toast('✅ Installed successfully'));
}

// ===== Offline indicator =====
function setupOffline() {
    const badge = document.getElementById('offlineBadge');
    const update = () => badge.style.display = navigator.onLine ? 'none' : 'inline-block';
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}

// ===== Toast =====
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== Wake Lock (keep screen on) =====
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) await navigator.wakeLock.request('screen');
    } catch(e) {}
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});

window.addEventListener('load', () => {
    init();
    requestWakeLock();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registered'))
            .catch(e => console.log('SW failed', e));
    }
});