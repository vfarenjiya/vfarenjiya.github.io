'use strict';
/* ============ REALISTIC LUNAR LANDING MDP ============
   Units: meters, m/s, s. y = altitude above pad plane (up +).
   Moon g = 1.62 m/s². Actions: 0 RCS-LEFT, 1 RCS-RIGHT, 2 MAIN, 3 COAST.
   Tabular Q-learning over discretized state: 6x * 8y * 3vx * 3vy = 432 states. */
const WORLD = { w: 100, h: 170, g: 1.62, dt: 0.2,
  padX0: 40, padX1: 60, softVy: 2.0, softVx: 1.5,
  aMain: 3.4, aLat: 1.2, rStep: -0.1, rCrash: -100, rWin: 100,
  maxSteps: 400, shapeK: 1.0 };
const ACTIONS = 4;
const XB = [0, 20, 40, 50, 60, 80, 100];
const YB = [0, 10, 25, 45, 70, 100, 130, 160, 171];
const VX = [-99, -2, 2, 99];
const VY = [-99, -4, -1, 99];
const STATES = 6 * 8 * 3 * 3;
const bucket = (v, B) => { for (let i = 1; i < B.length - 1; i++) if (v < B[i]) return i - 1; return B.length - 2; };
const stateOf = e => ((bucket(e.x, XB) * 8 + bucket(e.y, YB)) * 3 + bucket(e.vx, VX)) * 3 + bucket(e.vy, VY);
const phi = e => -(0.5 * e.y + 0.25 * Math.abs(e.x - 50)) / 100;   // shaping potential

let Q = new Float64Array(STATES * 4);
let algo = 'qlearn';
const params = { alpha: 0.3, gamma: 0.99, epsStart: 1.0, epsEnd: 0.02, halfLife: 150 };
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
const env = { x: 50, y: 160, vx: 0, vy: 0, steps: 0, ret: 0, a: 0, mainOn: false, lat: 0 };
let respawnT = 0, acc = 0, agentHidden = false, trail = [];
const view = { x: 50, y: 160, ready: false, thrust: 0, tilt: 0 };
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