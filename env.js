(function (global) {
  'use strict';

  class CliffWalkingEnv {
    constructor(config = {}) {
      this.rows = 4;
      this.cols = 12;
      this.numStates = this.rows * this.cols;
      this.numActions = 4;
      this.maxSteps = 1000;

      const slip = Number(config.slipProbability);
      this.slipProbability = Number.isFinite(slip)
        ? Math.max(0, Math.min(1, slip))
        : 0;

      this.state = this.index(3, 0);
      this.steps = 0;
      this.terminal = false;
    }

    index(row, col) {
      return row * this.cols + col;
    }

    rowCol(state) {
      const row = Math.floor(state / this.cols);
      const col = state % this.cols;
      return [row, col];
    }

    reset() {
      this.state = this.index(3, 0);
      this.steps = 0;
      this.terminal = false;
      return this.state;
    }

    inBounds(row, col) {
      return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    isCliff(row, col) {
      return row === 3 && col >= 1 && col <= 10;
    }

    isGoal(row, col) {
      return row === 3 && col === 11;
    }

    maybeSlip(requestedAction) {
      if (this.slipProbability <= 0) return requestedAction;
      if (Math.random() >= this.slipProbability) return requestedAction;

      const others = [];
      for (let a = 0; a < 4; a++) {
        if (a !== requestedAction) others.push(a);
      }
      return others[(Math.random() * others.length) | 0];
    }

    step(requestedAction) {
      if (this.terminal) {
        return { nextState: this.state, reward: 0, terminal: true };
      }

      const action = this.maybeSlip(requestedAction);
      let [row, col] = this.rowCol(this.state);

      let nextRow = row;
      let nextCol = col;

      if (action === 0) nextRow -= 1;       // UP
      else if (action === 1) nextRow += 1;  // DOWN
      else if (action === 2) nextCol -= 1;  // LEFT
      else if (action === 3) nextCol += 1;  // RIGHT

      this.steps += 1;

      // Wall: stays in place.
      if (!this.inBounds(nextRow, nextCol)) {
        if (this.steps > this.maxSteps) {
          this.terminal = true;
          return { nextState: this.state, reward: 0, terminal: true };
        }
        return { nextState: this.state, reward: -1, terminal: false };
      }

      const nextState = this.index(nextRow, nextCol);

      if (this.isCliff(nextRow, nextCol)) {
        this.state = nextState;
        this.terminal = true;
        return { nextState, reward: -100, terminal: true };
      }

      if (this.isGoal(nextRow, nextCol)) {
        this.state = nextState;
        this.terminal = true;
        return { nextState, reward: 0, terminal: true };
      }

      this.state = nextState;

      if (this.steps > this.maxSteps) {
        this.terminal = true;
        return { nextState: this.state, reward: 0, terminal: true };
      }

      return { nextState: this.state, reward: -1, terminal: false };
    }
  }

  global.CliffWalkingEnv = CliffWalkingEnv;
})(globalThis);