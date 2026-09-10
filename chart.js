(function (global) {
  'use strict';

  class ReturnChart {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.mode = 'q';
      this.data = {
        q: [],
        sarsa: []
      };

      this.colors = {
        q: '#0f9d58',
        sarsa: '#e94560'
      };

      this.loop = this.loop.bind(this);
      this.loop();
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

    addPoint(algorithm, episode, episodeReturn) {
      if (!this.data[algorithm]) this.data[algorithm] = [];
      this.data[algorithm].push({ x: episode, y: episodeReturn });
    }

    ensureSize() {
      const parent = this.canvas.parentElement || document.body;
      const rect = parent.getBoundingClientRect();

      let cssWidth = rect.width;
      if (!cssWidth || cssWidth <= 0) cssWidth = parent.clientWidth || 360;
      if (!cssWidth || cssWidth <= 0) cssWidth = 360;

      let cssHeight = this.canvas.clientHeight;
      if (!cssHeight || cssHeight <= 0) cssHeight = 180;

      const dpr = global.devicePixelRatio || 1;
      const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
      const backingHeight = Math.max(1, Math.round(cssHeight * dpr));

      if (this.canvas.width !== backingWidth || this.canvas.height !== backingHeight) {
        this.canvas.width = backingWidth;
        this.canvas.height = backingHeight;
      }

      this.canvas.style.width = cssWidth + 'px';
      this.canvas.style.height = cssHeight + 'px';

      return { cssWidth, cssHeight, dpr };
    }

    movingAverage(points) {
      const out = [];
      const windowSize = 20;

      for (let i = 0; i < points.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        let sum = 0;
        let count = 0;

        for (let j = start; j <= i; j++) {
          sum += points[j].y;
          count += 1;
        }

        out.push({ x: points[i].x, y: sum / count });
      }

      return out;
    }

    visibleKeys() {
      if (this.mode === 'both') return ['q', 'sarsa'];
      if (this.mode === 'sarsa') return ['sarsa'];
      return ['q'];
    }

    draw() {
      if (!this.canvas || !this.ctx) return;

      const size = this.ensureSize();
      const ctx = this.ctx;

      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.cssWidth, size.cssHeight);

      const keys = this.visibleKeys();
      let hasData = false;

      let xMax = 1;
      let yMin = Infinity;
      let yMax = -Infinity;

      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const points = this.data[key] || [];

        if (points.length) hasData = true;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          if (p.x > xMax) xMax = p.x;
          if (p.y < yMin) yMin = p.y;
          if (p.y > yMax) yMax = p.y;
        }
      }

      if (!hasData) {
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Train to see returns', size.cssWidth / 2, size.cssHeight / 2);
        return;
      }

      if (!Number.isFinite(yMin)) yMin = -100;
      if (!Number.isFinite(yMax)) yMax = 0;

      const rangeY = (yMax - yMin) || 1;
      yMin -= rangeY * 0.05;
      yMax += rangeY * 0.05;

      const left = 44;
      const right = 10;
      const top = 8;
      const bottom = 26;

      const plotW = size.cssWidth - left - right;
      const plotH = size.cssHeight - top - bottom;

      const xToPx = (x) => left + (x / xMax) * plotW;
      const yToPx = (y) => top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, top + plotH);
      ctx.lineTo(left + plotW, top + plotH);
      ctx.stroke();

      // Y ticks
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 4; i++) {
        const value = yMin + ((yMax - yMin) * i) / 4;
        const y = yToPx(value);
        ctx.fillText(value.toFixed(0), left - 6, y);
      }

      // X ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0', xToPx(0), top + plotH + 6);
      ctx.fillText(String(Math.round(xMax / 2)), xToPx(xMax / 2), top + plotH + 6);
      ctx.fillText(String(Math.round(xMax)), xToPx(xMax), top + plotH + 6);

      // Axis labels
      ctx.fillText('episode', left + plotW / 2, size.cssHeight - 12);

      ctx.save();
      ctx.translate(12, top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('return', 0, 0);
      ctx.restore();

      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const points = this.data[key] || [];
        if (!points.length) continue;

        const color = this.colors[key] || '#ffffff';

        // Raw faint curve
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let i = 0; i < points.length; i++) {
          const x = xToPx(points[i].x);
          const y = yToPx(points[i].y);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
        ctx.restore();

        // Moving average bold
        const ma = this.movingAverage(points);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < ma.length; i++) {
          const x = xToPx(ma[i].x);
          const y = yToPx(ma[i].y);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    }
  }

  global.ReturnChart = ReturnChart;
})(globalThis);