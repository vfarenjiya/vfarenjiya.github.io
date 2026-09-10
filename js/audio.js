'use strict';
let actx = null, noiseBuf = null, eng = null;
function S() {
  if (!soundOn) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
  return actx;
}
function noise() {
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
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
function burst(dur, g, fc) {
  const a = S(); if (!a) return;
  const src = a.createBufferSource(); src.buffer = noise();
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fc;
  const v = a.createGain(); const t = a.currentTime;
  v.gain.setValueAtTime(g, t);
  v.gain.exponentialRampToValueAtTime(.001, t + dur);
  src.connect(f); f.connect(v); v.connect(a.destination);
  src.start(t); src.stop(t + dur);
}
/* looping engine rumble while main engine burns */
function engineSet(on) {
  const a = S();
  if (!a) { on = false; }
  if (on && !eng && a) {
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 48;
    const o2 = a.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 97;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
    const g = a.createGain(); g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination);
    o.start(); o2.start();
    g.gain.linearRampToValueAtTime(.13, a.currentTime + .08);
    eng = { o, o2, g };
  } else if (!on && eng) {
    const t = a ? a.currentTime : 0;
    eng.g.gain.cancelScheduledValues(t);
    eng.g.gain.setTargetAtTime(0, t, .06);
    const e = eng;
    setTimeout(() => { try { e.o.stop(); e.o2.stop(); } catch (err) {} }, 300);
    eng = null;
  }
}
const sTick = () => tone(320, 300, .045, 'square', .03);
const sRcs = () => burst(.12, .05, 1800);
const sSplash = () => {
  tone(120, 28, .5, 'sine', .3); burst(.4, .25, 900);
  if (navigator.vibrate) navigator.vibrate(90);
};
const sWin = () => {
  tone(660, 660, .12, 'triangle', .16);
  setTimeout(() => tone(880, 880, .14, 'triangle', .16), 110);
  setTimeout(() => tone(1320, 1320, .22, 'triangle', .14), 220);
  if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
};