(function (global) {
  'use strict';
  var COLS = 12, ROWS = 4;
  function rowOf(s) { return Math.floor(s / COLS); }
  function colOf(s) { return s % COLS; }
  function isTerminal(s) { var r = rowOf(s), c = colOf(s); return r === 3 && c >= 1; }

  function PlaybackController(opts) {
    this.getQ = opts.getQ; this.toast = opts.toast || function () {}; this.el = opts.elements;
    this.history = [36]; this.actions = []; this.index = 0; this.playing = false; this.timer = null;
    var self = this;
    function bind(node, ev, fn) { if (node) node.addEventListener(ev, fn); }
    bind(this.el.first, 'click', function () { self.first(); });
    bind(this.el.back, 'click', function () { self.stepBack(); });
    bind(this.el.play, 'click', function () { self.togglePlay(); });
    bind(this.el.forward, 'click', function () { self.stepForward(); });
    bind(this.el.speed, 'input', function () { if (self.el.speedLabel) self.el.speedLabel.textContent = 'Playback ' + self.speedValue() + '/s'; });
    this.update();
  }
  PlaybackController.prototype.speedValue = function () { return Math.max(1, Number(this.el.speed && this.el.speed.value) || 5); };
  PlaybackController.prototype.transition = function (s, a) { var r = rowOf(s), c = colOf(s), nr = r, nc = c; if (a === 0) nr--; else if (a === 1) nr++; else if (a === 2) nc--; else if (a === 3) nc++; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return s; return nr * COLS + nc; };
  PlaybackController.prototype.chooseGreedy = function (q, s) { var b = s * 4, best = -Infinity, acts = []; for (var a = 0; a < 4; a++) { var v = q[b + a]; if (v > best + 1e-6) { best = v; acts = [a]; } else if (Math.abs(v - best) <= 1e-6) acts.push(a); } return acts[(Math.random() * acts.length) | 0]; };
  PlaybackController.prototype.reset = function () { this.stop(); this.history = [36]; this.actions = []; this.index = 0; this.update(); };
  PlaybackController.prototype.first = function () { this.index = 0; this.update(); };
  PlaybackController.prototype.stepBack = function () { if (this.index > 0) this.index--; this.update(); };
  PlaybackController.prototype.stepForward = function () {
    var q = this.getQ(); if (!q) { this.toast('Train an agent first'); return; }
    if (this.index < this.history.length - 1) { this.index++; this.update(); return; }
    var s = this.history[this.index];
    if (isTerminal(s) || this.history.length >= 1000) { this.stop(); this.update(); return; }
    var a = this.chooseGreedy(q, s), next = this.transition(s, a);
    this.actions.push(a); this.history.push(next); this.index++; this.update();
    if (isTerminal(next)) this.stop();
  };
  PlaybackController.prototype.togglePlay = function () { if (this.playing) this.stop(); else this.play(); };
  PlaybackController.prototype.play = function () {
    var q = this.getQ(); if (!q) { this.toast('Train an agent first'); return; }
    if (isTerminal(this.history[this.index])) this.reset();
    this.playing = true; if (this.el.play) this.el.play.textContent = '⏸'; this.scheduleNext();
  };
  PlaybackController.prototype.scheduleNext = function () {
    var self = this; clearTimeout(this.timer);
    this.timer = setTimeout(function () {
      if (!self.playing) return;
      self.stepForward();
      if (self.playing) { if (isTerminal(self.history[self.index])) self.stop(); else self.scheduleNext(); }
    }, 1000 / this.speedValue());
  };
  PlaybackController.prototype.stop = function () { this.playing = false; clearTimeout(this.timer); if (this.el.play) this.el.play.textContent = '▶'; };
  PlaybackController.prototype.update = function () {
    var q = this.getQ(); if (!q || q.length < 192) return;
    var s = this.history[this.index] || 0, vals = [0, 1, 2, 3].map(function (a) { return q[s * 4 + a]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = (max - min) || 1;
    var taken = this.index < this.actions.length ? this.actions[this.index] : null;
    for (var a = 0; a < 4; a++) {
      var bar = this.el.bars[a], val = this.el.vals[a];
      if (bar) { var w = (max === min) ? 100 : ((vals[a] - min) / span) * 100; bar.style.width = w.toFixed(1) + '%'; bar.classList.toggle('argmax', Math.abs(vals[a] - max) <= 1e-6); bar.classList.toggle('taken', taken === a); }
      if (val) val.textContent = vals[a].toFixed(2);
    }
  };
  global.PlaybackController = PlaybackController;
})(globalThis);