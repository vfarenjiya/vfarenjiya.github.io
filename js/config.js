'use strict';
/* ============ LUNAR LANDING MDP (learnable build) ============
   Dense reference-tracking reward + guided exploration make the
   +100 reachable, so tabular Q-learning has a signal from episode 1. */
const WORLD = { w: 100, h: 170, g: 0.9, dt: 0.2,
  padX0: 35, padX1: 65, softVy: 3.5, softVx: 3.0,
  aMain: 2.4, aLat: 1.0,
  rCrash: -100, rWin: 100, maxSteps: 400 };
const A_NET = WORLD.aMain - WORLD.g;              // net deceleration while burning
const GUIDED = 0.5;                               // fraction of actions from autopilot demo
const desiredVy = y => -Math.min(8, Math.sqrt(2 * A_NET * Math.max(0, y)) * 0.6);

const ACTIONS = 4;
const XB = [0, 20, 40, 50, 60, 80, 100];
const YB = [0, 6, 15, 30, 55, 85, 120, 160, 171];
const VX = [-99, -2, 2, 99];
const VY = [-99, -7, -3.5, -1.5, 0.5, 99];
const STATES = 6 * 8 * 3 * 5;                     // 720
const bucket = (v, B) => { for (let i = 1; i < B.length - 1; i++) if (v < B[i]) return i - 1; return B.length - 2; };
const stateOf = e => ((bucket(e.x, XB) * 8 + bucket(e.y, YB)) * 3 + bucket(e.vx, VX)) * 3 + bucket(e.vy, VY);

let Q = new Float64Array(STATES * 4);
let algo = 'qlearn';
const params = { alpha: 0.4, gamma: 0.99, epsStart: 0.9, epsEnd: 0.01, halfLife: 60 };
let episodes = 0, returns = [], okHist = [], bestAvg = null, congrat = false;
const curEps = () => params.epsEnd + (params.epsStart - params.epsEnd) * Math.exp(-episodes / params.halfLife);
function maxQ(s) { const b = s * 4; return Math.max(Q[b], Q[b + 1], Q[b + 2], Q[b + 3]); }
function chooseAction(s, eps) {
  if (Math.random() < eps) return (Math.random() * 4) | 0;
  const b = s * 4; let best = -Infinity, picks = [];
  for (let a = 0; a < 4; a++) { const q = Q[b + a];
    if (q > best + 1e-9) { best = q; picks = [a]; }
    else if (Math.abs(q - best) <= 1e-9) picks.push(a); }
  return picks[(Math.random() * picks.length) | 0];
}

let mode = 'train', running = false;
const env = { x: 50, y: 140, vx: 0, vy: 0, steps: 0, ret: 0, a: 0, mainOn: false, lat: 0 };
let respawnT = 0, acc = 0, agentHidden = false, trail = [];
const view = { x: 50, y: 140, ready: false, thrust: 0, tilt: 0 };
let playRuns = 0, playLast = '—';
const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 150, 400, 1200];
let speedIdx = 4;
const curSps = () => mode === 'play' ? 5 : SPEEDS[speedIdx];
const flags = { pol: false, heat: false, trail: true };
let soundOn = false, particles = [], floaters = [], chartDirty = true;

const $ = s => document.querySelector(s);
const cv = $('#cv'), chartCv = $('#chartCv');
const epVal = $('#epVal'), epsVal = $('#epsVal'), lastVal = $('#lastVal'), okVal = $('#okVal');
const bestVal = $('#bestVal'), runsVal = $('#runsVal'), playLastEl = $('#playLast'), playHint = $('#playHint');
const altVal = $('#altVal'), vsVal = $('#vsVal'), hsVal = $('#hsVal');
const btnStart = $('#btnStart'), toastEl = $('#toast');
let DPR = 1, L = { s: 2, ox: 0, oy: 0, w: 0, h: 0, gy: 0 };