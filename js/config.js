'use strict';
/* ================================================================
   ENVIRONMENT — portrait Cliff Walking (Sutton & Barto, rotated)
   Grid 6×11. Start=(0,0) top-left, Goal=(0,10) bottom-left.
   Cliff = column 0, rows 1..9. Rewards: step −1, cliff −100, goal 0.
   Optimal route: right, 10×down, left → 12 steps → return −12.
   ================================================================ */
const COLS = 6, ROWS = 11, STATES = COLS * ROWS;
const GOAL = { c: 0, r: ROWS - 1 }, MAX_STEPS = 60;
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1]; // up,right,down,left
const cellType = (c, r) =>
  (c === 0 && r > 0 && r < ROWS - 1) ? 'cliff' :
  (c === GOAL.c && r === GOAL.r) ? 'goal' : 'floor';
const idxOf = (c, r) => r * COLS + c;

/* ================= BRAIN STATE ================= */
let Q = new Float64Array(STATES * 4);
let algo = 'qlearn';
const params = { alpha: 0.5, gamma: 0.95, epsStart: 1.0, epsEnd: 0.02, halfLife: 80 };
let episodes = 0, returns = [], okHist = [], bestAvg = null, congrat = false;

const curEps = () =>
  params.epsEnd + (params.epsStart - params.epsEnd) * Math.exp(-episodes / params.halfLife);

function maxQ(s) {
  const b = s * 4;
  return Math.max(Q[b], Q[b + 1], Q[b + 2], Q[b + 3]);
}

function chooseAction(s, eps) { // ε-greedy, ties broken randomly
  if (Math.random() < eps) return (Math.random() * 4) | 0;
  const b = s * 4;
  let best = -Infinity, picks = [];
  for (let a = 0; a < 4; a++) {
    const q = Q[b + a];
    if (q > best + 1e-9) { best = q; picks = [a]; }
    else if (Math.abs(q - best) <= 1e-9) picks.push(a);
  }
  return picks[(Math.random() * picks.length) | 0];
}

/* ================= RUNTIME STATE ================= */
let mode = 'train', running = false;
const env = { c: 0, r: 0, steps: 0, ret: 0, a: 0 };
let respawnT = 0, acc = 0, agentHidden = false, lastDir = 2, trail = [];
const view = { x: 0, y: 0, ready: false };
let playRuns = 0, playLast = '—';
const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 150, 400, 1200];
let speedIdx = 4;
const curSps = () => mode === 'play' ? 5 : SPEEDS[speedIdx];
const flags = { pol: true, heat: false, trail: true };
let soundOn = false, particles = [], floaters = [], chartDirty = true;

/* ================= DOM REFS ================= */
const $ = s => document.querySelector(s);
const stage = $('#stage'), cv = $('#cv'), chartCv = $('#chartCv');
const epVal = $('#epVal'), epsVal = $('#epsVal'), lastVal = $('#lastVal'), okVal = $('#okVal');
const bestVal = $('#bestVal'), runsVal = $('#runsVal'), playLastEl = $('#playLast'), playHint = $('#playHint');
const btnStart = $('#btnStart'), toastEl = $('#toast');
let DPR = 1, L = { cell: 10, ox: 0, oy: 0, w: 0, h: 0 };