(function (global) {
  'use strict';

  const ROWS = 4;
  const COLS = 12;
  const ACTIONS = 4;
  const Q_LENGTH = ROWS * COLS * ACTIONS;
  const START = 3 * COLS + 0;

  function rowCol(state) {
    return [Math.floor(state / COLS), state % COLS];
  }

  function bind(el, eventName, fn) {
    if (el) el.addEventListener(eventName, fn);
  }

  class PlaybackController {
    constructor(options) {
      this.getQ = options.getQ || function () { return null; };
      this.toast = options.toast || function () {};

      this.elements = options.elements || {};

      this.history = [START];
      this.actions = [];
      this.index = 0;

      this.playing = false;
      this.timer = null;

      bind(this.elements.first, 'click', () => this.first());
      bind(this.elements.back, 'click', () => this.stepBack());
      bind(this.elements.play, 'click', () => this.togglePlay());
      bind(this.elements.forward, 'click', () => this.stepForward());

      bind(this.elements.speed, 'input', () => {
        this.updateSpeedLabel();
      });

      this.updateSpeedLabel();
      this.update();
    }

    speedValue() {
      const value = Number(this.elements.speed && this.elements.speed.value);
      return Math.max(1, Number.isFinite(value) ? value : 5);
    }

    updateSpeedLabel() {
      if (this.elements.speedLabel) {
        this.elements.speedLabel.textContent = `Playback ${this.speedValue()}/s`;
      }
    }

    isTerminal(state) {
      const [row, col] = rowCol(state);
      return row === 3 && col >= 1;
    }

    transition(state, action) {
      let [row, col] = rowCol(state);
      let nextRow = row;
      let nextCol = col;

      if (action === 0) nextRow -= 1;
      else if (action === 1) nextRow += 1;
      else if (action === 2) nextCol -= 1;
      else if (action === 3) nextCol += 1;

      if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
        return state;
      }

      return nextRow * COLS + nextCol;
    }

    chooseGreedyAction(q, state) {
      const base = state * ACTIONS;
      let best = -Infinity;
      let bestActions = [];

      for (let a = 0; a < ACTIONS; a++) {
        const value = q[base + a];

        if (value > best + 1e-6) {
          best = value;
          bestActions = [a];
        } else if (Math.abs(value - best) <= 1e-6) {
          bestActions.push(a);
        }
      }

      return bestActions[(Math.random() * bestActions.length) | 0];
    }

    reset() {
      this.stop();
      this.history = [START];
      this.actions = [];
      this.index = 0;
      this.update();
    }

    first() {
      this.index = 0;
      this.update();
    }

    stepBack() {
      if (this.index > 0) this.index -= 1;
      this.update();
    }

    stepForward() {
      const q = this.getQ();

      if (!q || q.length !== Q_LENGTH) {
        this.toast('Train an agent first.');
        this.stop();
        return;
      }

      if (this.history.length >= 1000) {
        this.stop();
        this.update();
        return;
      }

      if (this.index < this.history.length - 1) {
        this.index += 1;
        this.update();
        return;
      }

      const current = this.history[this.index];

      if (this.isTerminal(current)) {
        this.stop();
        this.update();
        return;
      }

      const action = this.chooseGreedyAction(q, current);
      const next = this.transition(current, action);

      this.actions.push(action);
      this.history.push(next);
      this.index += 1;

      this.update();

      if (this.isTerminal(next)) {
        this.stop();
      }
    }

    togglePlay() {
      if (this.playing) {
        this.stop();
      } else {
        this.play();
      }
    }

    play() {
      const q = this.getQ();

      if (!q || q.length !== Q_LENGTH) {
        this.toast('Train an agent first.');
        return;
      }

      if (this.isTerminal(this.history[this.index])) {
        this.reset();
      }

      this.playing = true;
      this.updatePlayButton();
      this.scheduleNext();
    }

    scheduleNext() {
      clearTimeout(this.timer);

      const delay = 1000 / this.speedValue();

      this.timer = setTimeout(() => {
        if (!this.playing) return;

        this.stepForward();

        if (this.playing && !this.isTerminal(this.history[this.index])) {
          this.scheduleNext();
        } else {
          this.stop();
        }
      }, delay);
    }

    stop() {
      this.playing = false;
      clearTimeout(this.timer);
      this.updatePlayButton();
    }

    updatePlayButton() {
      if (this.elements.play) {
        this.elements.play.textContent = this.playing ? '⏸' : '▶';
      }
    }

    update() {
      const q = this.getQ();
      if (!q || q.length !== Q_LENGTH) return;

      const state = this.history[this.index] || START;
      const base = state * ACTIONS;

      const values = [];
      for (let a = 0; a < ACTIONS; a++) {
        values.push(q[base + a]);
      }

      const min = Math.min.apply(null, values);
      const max = Math.max.apply(null, values);
      const span = (max - min) || 1;

      const takenAction = this.index < this.actions.length
        ? this.actions[this.index]
        : null;

      for (let a = 0; a < ACTIONS; a++) {
        const bar = this.elements.bars && this.elements.bars[a];
        const val = this.elements.vals && this.elements.vals[a];

        if (bar) {
          const width = max === min
            ? 100
            : ((values[a] - min) / span) * 100;

          bar.style.width = width.toFixed(1) + '%';
          bar.classList.toggle('argmax', Math.abs(values[a] - max) <= 1e-6);
          bar.classList.toggle('taken', takenAction === a);
        }

        if (val) {
          val.textContent = values[a].toFixed(2);
        }
      }
    }
  }

  global.PlaybackController = PlaybackController;
})(globalThis);