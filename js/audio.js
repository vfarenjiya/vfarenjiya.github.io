'use strict';
/* ================= AUDIO (tiny synth) ================= */
let actx = null;
function S() {
  if (!soundOn) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  return actx;
}
function tone(f0, f1, dur, type, g) {
  const a = S(); if (!a) return;
  const o = a.createOscillator(), v = a.createGain(), t = a.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  v.gain.setValueAtTime(g, t);
  v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(v); v.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const sTick   = () => tone(320, 300, 0.045, 'square',   0.04);
const sSplash = () => tone(190, 42,  0.38,  'sawtooth', 0.22);
const sWin    = () => {
  tone(660, 660, 0.12, 'triangle', 0.16);
  setTimeout(() => tone(920, 920, 0.2, 'triangle', 0.16), 110);
};