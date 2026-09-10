'use strict';
const GW = 12, GH = 18, CELLS = GW * GH;
const CH = 4, IN = CELLS * CH;             // body / head / food / wall  (egocentric frame)
const H1 = 80, H2 = 40, NA = 3;
const REPLAY = 20000, WARM = 400, BATCH = 2, TRAIN_EVERY = 1, TARGET_EVERY = 300;
const R_EAT = 10, R_DIE = -10, R_TIMEOUT = -5, NO_EAT_LIMIT = 150;
const PHI_K = 0.1;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const EX = 6, EY = 12;                     // fixed head position inside the egocentric window

const params = { lr: 0.0015, gamma: 0.95, epsStart: 1.0, epsEnd: 0.06, halfLife: 120 };
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