(function (global) {
  'use strict';

  const ROWS = 4;
  const COLS = 12;
  const ACTIONS = 4;
  const Q_LENGTH = ROWS * COLS * ACTIONS;

  const ARROW_OFFSETS = {
    0: [0, -0.22], // UP
    1: [0, 0.22],  // DOWN
    2: [-0.22, 0], // LEFT
    3: [0.22, 0]   // RIGHT
  };

  function rowCol(state) {
    return [Math.floor(state / COLS), state % COLS];
  }

  function isCliffCell(row, col) {
    return row === 3 && col >= 1 && col <= 10;
  }

  function isGoalCell(row, col) {
    return row === 3 && col === 11;
  }

  function isTerminalState(state) {
    const [row, col] = rowCol(state);
    return isCliffCell(row, col) || isGoalCell(row, col);
  }

  class HeatmapRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.q = new Float64Array(Q_LENGTH);

      this.showHeatmap = true;
      this.showArrows = true;
      this.liveState = null;

      this.loop = this.loop.bind(this);
      this.loop();
    }

    setQ(q) {
      if (q && q.length === Q_LENGTH) {
        this.q = q;
      } else {
        this.q = new Float64Array(Q_LENGTH);
      }
    }

    loop() {
      try {
        this.draw();
      } catch (err) {
        if (global.console) console.error(err);
      } finally {
        if (global.requestAnimationFrame) {
          requestAnimationFrame(this.loop);
        }
      }
    }

    ensureSize() {
      const parent = this.canvas.parentElement || document.body;
      const rect = parent.getBoundingClientRect();

      let cssWidth = rect.width;
      if (!cssWidth || cssWidth <= 0) cssWidth = parent.clientWidth || 360;
      if (!cssWidth || cssWidth <= 0) cssWidth = 360;

      const cell = cssWidth / COLS;
      const cssHeight = cell * ROWS;
      const dpr = global.devicePixelRatio || 1;

      const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
      const backingHeight = Math.max(1, Math.round(cssHeight * dpr));

      if (this.canvas.width !== backingWidth || this.canvas.height !== backingHeight) {
        this.canvas.width = backingWidth;
        this.canvas.height = backingHeight;
      }

      this.canvas.style.width = cssWidth + 'px';
      this.canvas.style.height = cssHeight + 'px';

      return { cssWidth, cssHeight, cell, dpr };
    }

    maxQ(state) {
      const base = state * ACTIONS;
      let best = -Infinity;

      for (let a = 0; a < ACTIONS; a++) {
        const value = this.q[base + a];
        if (value > best) best = value;
      }

      return best;
    }

    bestActions(state) {
      const base = state * ACTIONS;
      let best = -Infinity;
      let actions = [];

      for (let a = 0; a < ACTIONS; a++) {
        const value = this.q[base + a];

        if (value > best + 1e-6) {
          best = value;
          actions = [a];
        } else if (Math.abs(value - best) <= 1e-6) {
          actions.push(a);
        }
      }

      return actions;
    }

    draw() {
      if (!this.canvas || !this.ctx) return;

      const size = this.ensureSize();
      const ctx = this.ctx;
      const cell = size.cell;

      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.cssWidth, size.cssHeight);

      if (!this.q || this.q.length !== Q_LENGTH) {
        this.q = new Float64Array(Q_LENGTH);
      }

      let vMin = Infinity;
      let vMax = -Infinity;

      for (let s = 0; s < ROWS * COLS; s++) {
        if (isTerminalState(s)) continue;

        const value = this.maxQ(s);
        if (value < vMin) vMin = value;
        if (value > vMax) vMax = value;
      }

      if (!Number.isFinite(vMin)) {
        vMin = 0;
        vMax = 0;
      }

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const state = row * COLS + col;
          const x = col * cell;
          const y = row * cell;

          if (isCliffCell(row, col)) {
            ctx.fillStyle = '#111';
            ctx.fillRect(x, y, cell, cell);
            this.drawGlyph('☠', x, y, cell, 0, 0, '#ddd');
          } else if (isGoalCell(row, col)) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x, y, cell, cell);
            this.drawGlyph('★', x, y, cell, 0, 0, '#111');
          } else {
            if (this.showHeatmap) {
              const value = this.maxQ(state);
              const t = (value - vMin) / (vMax - vMin + 1e-9);
              const hue = Math.round(t * 120);
              ctx.fillStyle = `hsl(${hue}, 70%, 45%)`;
            } else {
              ctx.fillStyle = '#202033';
            }

            ctx.fillRect(x, y, cell, cell);

            if (row === 3 && col === 0) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
              this.drawGlyph('🚩', x, y, cell * 0.72, -cell * 0.22, -cell * 0.22, null);
            }

            if (this.showArrows) {
              this.drawPolicyArrows(state, x, y, cell);
            }
          }

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }

      this.drawLiveAgent(cell);
    }

    drawGlyph(text, x, y, cell, offsetX = 0, offsetY = 0, color = null) {
      const ctx = this.ctx;

      ctx.save();
      ctx.font = `${Math.floor(cell * 0.45)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (color) ctx.fillStyle = color;

      ctx.fillText(
        text,
        x + cell / 2 + offsetX,
        y + cell / 2 + offsetY
      );

      ctx.restore();
    }

    drawPolicyArrows(state, x, y, cell) {
      const actions = this.bestActions(state);
      if (!actions.length) return;

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';

      if (actions.length === 1) {
        this.drawArrow(x + cell / 2, y + cell / 2, actions[0], cell * 0.16);
        return;
      }

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const offset = ARROW_OFFSETS[action] || [0, 0];
        this.drawArrow(
          x + cell / 2 + offset[0] * cell,
          y + cell / 2 + offset[1] * cell,
          action,
          cell * 0.09
        );
      }
    }

    drawArrow(cx, cy, action, size) {
      const ctx = this.ctx;

      ctx.beginPath();

      if (action === 0) {
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx - size, cy + size);
        ctx.lineTo(cx + size, cy + size);
      } else if (action === 1) {
        ctx.moveTo(cx, cy + size);
        ctx.lineTo(cx - size, cy - size);
        ctx.lineTo(cx + size, cy - size);
      } else if (action === 2) {
        ctx.moveTo(cx - size, cy);
        ctx.lineTo(cx + size, cy - size);
        ctx.lineTo(cx + size, cy + size);
      } else if (action === 3) {
        ctx.moveTo(cx + size, cy);
        ctx.lineTo(cx - size, cy - size);
        ctx.lineTo(cx - size, cy + size);
      }

      ctx.closePath();
      ctx.fill();
    }

    drawLiveAgent(cell) {
      if (this.liveState === null || this.liveState === undefined) return;
      if (this.liveState < 0 || this.liveState >= ROWS * COLS) return;

      const [row, col] = rowCol(this.liveState);
      const x = col * cell;
      const y = row * cell;
      const ctx = this.ctx;

      ctx.beginPath();
      ctx.arc(x + cell / 2, y + cell / 2, cell * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
  }

  global.HeatmapRenderer = HeatmapRenderer;
})(globalThis);