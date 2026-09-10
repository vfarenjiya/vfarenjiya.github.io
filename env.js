(function (global) {
  'use strict';
  function CliffWalkingEnv(config) {
    config = config || {};
    this.rows = 4; this.cols = 12; this.numStates = 48; this.numActions = 4;
    this.slipProbability = Math.max(0, Math.min(1, Number(config.slipProbability) || 0));
    this.maxSteps = 1000;
    this.state = 36; this.steps = 0; this.terminal = false;
  }
  CliffWalkingEnv.prototype.index = function (r, c) { return r * this.cols + c; };
  CliffWalkingEnv.prototype.rowCol = function (s) { return [Math.floor(s / this.cols), s % this.cols]; };
  CliffWalkingEnv.prototype.inBounds = function (r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; };
  CliffWalkingEnv.prototype.isCliff = function (r, c) { return r === 3 && c >= 1 && c <= 10; };
  CliffWalkingEnv.prototype.isGoal = function (r, c) { return r === 3 && c === 11; };
  CliffWalkingEnv.prototype.reset = function () { this.state = 36; this.steps = 0; this.terminal = false; return this.state; };
  CliffWalkingEnv.prototype.step = function (requested) {
    if (this.terminal) return { nextState: this.state, reward: 0, terminal: true };
    var action = requested;
    if (this.slipProbability > 0 && Math.random() < this.slipProbability) {
      var choices = [0, 1, 2, 3].filter(function (a) { return a !== requested; });
      action = choices[(Math.random() * choices.length) | 0];
    }
    var rc = this.rowCol(this.state), r = rc[0], c = rc[1], nr = r, nc = c;
    if (action === 0) nr--; else if (action === 1) nr++; else if (action === 2) nc--; else if (action === 3) nc++;
    this.steps += 1;
    if (!this.inBounds(nr, nc)) {
      if (this.steps > this.maxSteps) { this.terminal = true; return { nextState: this.state, reward: 0, terminal: true }; }
      return { nextState: this.state, reward: -1, terminal: false };
    }
    var next = this.index(nr, nc);
    if (this.isCliff(nr, nc)) { this.terminal = true; this.state = next; return { nextState: next, reward: -100, terminal: true }; }
    if (this.isGoal(nr, nc)) { this.terminal = true; this.state = next; return { nextState: next, reward: 0, terminal: true }; }
    this.state = next;
    if (this.steps > this.maxSteps) { this.terminal = true; return { nextState: this.state, reward: 0, terminal: true }; }
    return { nextState: this.state, reward: -1, terminal: false };
  };
  global.CliffWalkingEnv = CliffWalkingEnv;
})(globalThis);