(function (global) {
  'use strict';
  function TabularAgent(numStates, numActions, config) {
    config = config || {};
    this.numStates = numStates || 48;
    this.numActions = numActions || 4;
    this.q = new Float64Array(this.numStates * this.numActions);
    this.alpha = Number(config.alpha); if (!isFinite(this.alpha) || this.alpha <= 0) this.alpha = 0.2;
    this.gamma = (config.gamma === undefined) ? 0.99 : Number(config.gamma);
    this.epsilonStart = (config.epsilonStart === undefined) ? 1 : Number(config.epsilonStart);
    this.epsilonDecay = (config.epsilonDecay === undefined) ? 0.995 : Number(config.epsilonDecay);
    this.epsilonMin = (config.epsilonMin === undefined) ? 0.01 : Number(config.epsilonMin);
    this.epsilon = this.epsilonStart;
    this.algorithm = (config.algorithm === 'sarsa') ? 'sarsa' : 'q';
  }
  TabularAgent.prototype.resetQ = function () { this.q.fill(0); this.epsilon = this.epsilonStart; };
  TabularAgent.prototype.maxQ = function (state) {
    var b = state * this.numActions, m = -Infinity;
    for (var a = 0; a < this.numActions; a++) if (this.q[b + a] > m) m = this.q[b + a];
    return m;
  };
  TabularAgent.prototype.chooseAction = function (state, greedy) {
    var b = state * this.numActions;
    if (!greedy && Math.random() < this.epsilon) return (Math.random() * this.numActions) | 0;
    var best = -Infinity, acts = [];
    for (var a = 0; a < this.numActions; a++) {
      var v = this.q[b + a];
      if (v > best + 1e-12) { best = v; acts = [a]; }
      else if (Math.abs(v - best) <= 1e-12) acts.push(a);
    }
    return acts[(Math.random() * acts.length) | 0];
  };
  TabularAgent.prototype.updateQ = function (s, a, r, next, terminal, nextAction) {
    var idx = s * this.numActions + a, target;
    if (terminal) target = r;
    else if (this.algorithm === 'q') target = r + this.gamma * this.maxQ(next);
    else { var na = isFinite(nextAction) ? nextAction : 0; target = r + this.gamma * this.q[next * this.numActions + na]; }
    this.q[idx] += this.alpha * (target - this.q[idx]);
  };
  TabularAgent.prototype.decayEpsilon = function () { this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay); };
  global.TabularAgent = TabularAgent;
})(globalThis);