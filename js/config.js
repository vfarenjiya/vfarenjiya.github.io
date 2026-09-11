'use strict';
const GW = 12, GH = 18, CELLS = GW * GH;
const IN = 12, H1 = 32, H2 = 16, NA = 3;      // legacy DQN dims (unused by tabular rl.js)
const REPLAY = 20000, WARM = 300, BATCH = 4, TRAIN_EVERY = 1, TARGET_EVERY = 200;
const R_EAT = 10, R_DIE = -10, R_TIMEOUT = -2, NO_EAT_LIMIT = 200;
const PHI_K = 0.25;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const params = { alpha: 0.5, lr: 0.003, gamma: 0.9, epsStart: 1.0, epsEnd: 0.01, halfLife: 40 };
let episodes = 0, returns = [], bestAvg = null, congrat = false;
let updates = 0, lastLoss = 0, bestLen = 0;
const lossHist = [];
const curEps = () => params.epsEnd + (params.epsStart - params.epsEnd) * Math.exp(-episodes / params.halfLife);

let mode = 'train', running = false;
const env = { snake: [], prev: [], dir: 0, food: { x: 3, y: 3 }, steps: 0, noEat: 0, ret: 0, done: false, stepAt: 0, foods: 0 };
let respawnT = 0, acc = 0;
let playRuns = 0, playLast = '—';
const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 120, 240, 480];
let speedIdx = 4;
const curSps = () => mode === 'play' ? 6 : SPEEDS[speedIdx];
const flags = { grid: true, glow: true, sense: false };
let soundOn = false, particles = [], chartDirty = true;

const $ = s => document.querySelector(s);
const cv = $('#cv'), chartCv = $('#chartCv');
const epVal = $('#epVal'), epsVal = $('#epsVal'), lastVal = $('#lastVal'), bestVal = $('#bestVal');
const lenVal = $('#lenVal'), foodVal = $('#foodVal'), stepVal = $('#stepVal'), updVal = $('#updVal');
const runsVal = $('#runsVal'), playLastEl = $('#playLast'), playHint = $('#playHint');
const btnStart = $('#btnStart'), toastEl = $('#toast');
let DPR = 1, L = { cell: 10, ox: 0, oy: 0, w: 0, h: 0 };