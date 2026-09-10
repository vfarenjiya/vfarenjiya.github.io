(function (global) {
  'use strict';

  class TabularAgent {
    constructor(numStates = 48, numActions = 4, config = {}) {
      this.numStates = numStates;
      this.numActions = numActions;
      this.q = new Float64Array(numStates * numActions);

      this.algorithm = config.algorithm === 'sarsa' ? 'sarsa' : 'q';

      this.alpha = Number(config.alpha) || 0.2;
      this.gamma = Number.isFinite(Number(config.gamma)) ? Number(config.gamma) : 0.99;

      this.epsilonStart = Number.isFinite(Number(config.epsilonStart))
        ? Number(config.epsilonStart)
        : 1.0;

      this.epsilonDecay = Number.isFinite(Number(config.epsilonDecay))
        ? Number(config.epsilonDecay)
        : 0.995;

      this.epsilonMin = Number.isFinite(Number(config.epsilonMin))
        ? Number(config.epsilonMin)
        : 0.01;

      this.epsilon = this.epsilonStart;
    }

    resetQ() {
      this.q.fill(0);
      this.epsilon = this.epsilonStart;
    }

    chooseAction(state, greedy = false) {
      if (!greedy && Math.random() < this.epsilon) {
        return (Math.random() * this.numActions) | 0;
      }

      const base = state * this.numActions;
      let bestValue = -Infinity;
      let bestActions = [];

      for (let a = 0; a < this.numActions; a++) {
        const value = this.q[base + a];

        if (value > bestValue + 1e-12) {
          bestValue = value;
          bestActions = [a];
        } else if (Math.abs(value - bestValue) <= 1e-12) {
          bestActions.push(a);
        }
      }

      return bestActions[(Math.random() * bestActions.length) | 0];
    }

    maxQ(state) {
      const base = state * this.numActions;
      let best = -Infinity;

      for (let a = 0; a < this.numActions; a++) {
        const value = this.q[base + a];
        if (value > best) best = value;
      }

      return best;
    }

    updateQ(state, action, reward, nextState, terminal, nextAction = 0) {
      const idx = state * this.numActions + action;
      let target;

      if (terminal) {
        target = reward;
      } else if (this.algorithm === 'q') {
        target = reward + this.gamma * this.maxQ(nextState);
      } else {
        const a2 = Number.isFinite(nextAction) ? nextAction : 0;
        target = reward + this.gamma * this.q[nextState * this.numActions + a2];
      }

      this.q[idx] += this.alpha * (target - this.q[idx]);
    }

    decayEpsilon() {
      this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    }
  }

  global.TabularAgent = TabularAgent;
})(globalThis);