(function (global) {
  'use strict';
  var COLS = 12, ROWS = 4;
  function rowOf(s) { return Math.floor(s / COLS); }
  function colOf(s) { return s % COLS; }
  function isCliff(s) { var r = rowOf(s), c = colOf(s); return r === 3 && c >= 1 && c <= 10; }
  function isGoal(s) { return s === 47; }
  function isStart(s) { return s === 36; }
  function isTerminal(s) { return isCliff(s) || isGoal(s); }

  function HeatmapRenderer(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.q = new Float64Array(192);
    this.showHeatmap = true; this.showArrows = true; this.liveState = null;
    this._bw = 0; this._bh = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  HeatmapRenderer.prototype.setQ = function (q) { this.q = (q && q.length === 192) ? q : new Float64Array(192); };

  // THE fix: measure clientWidth (CSS-driven, stable). NEVER write style.width.
  HeatmapRenderer.prototype.syncSize = function () {
    var c = this.canvas, cssW = c.clientWidth;
    if (!cssW) { var p = c.parentElement; cssW = (p && p.clientWidth) || 360; }
    var cssH = Math.round(cssW / COLS * ROWS), dpr = global.devicePixelRatio || 1;
    var bw = Math.max(1, Math.round(cssW * dpr)), bh = Math.max(1, Math.round(cssH * dpr));
    if (c.style.height !== cssH + 'px') c.style.height = cssH + 'px';   // height only
    if (bw !== this._bw || bh !== this._bh) { c.width = bw; c.height = bh; this._bw = bw; this._bh = bh; }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: cssW, h: cssH, cell: cssW / COLS };
  };
  HeatmapRenderer.prototype.maxQ = function (s) { var m = -Infinity, b = s * 4; for (var a = 0; a < 4; a++) if (this.q[b + a] > m) m = this.q[b + a]; return m; };
  HeatmapRenderer.prototype.bestActions = function (s) {
    var b = s * 4, best = -Infinity, acts = [];
    for (var a = 0; a < 4; a++) { var v = this.q[b + a]; if (v > best + 1e-6) { best = v; acts = [a]; } else if (Math.abs(v - best) <= 1e-6) acts.push(a); }
    return acts;
  };
  HeatmapRenderer.prototype.glyph = function (t, x, y, cell, color, scale) {
    var ctx = this.ctx; ctx.font = Math.floor(cell * (scale || 0.45)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (color) ctx.fillStyle = color; ctx.fillText(t, x + cell / 2, y + cell / 2);
  };
  HeatmapRenderer.prototype.arrow = function (cx, cy, dir, sz) {
    var ctx = this.ctx; ctx.beginPath();
    if (dir === 0) { ctx.moveTo(cx, cy - sz); ctx.lineTo(cx - sz, cy + sz); ctx.lineTo(cx + sz, cy + sz); }
    if (dir === 1) { ctx.moveTo(cx, cy + sz); ctx.lineTo(cx - sz, cy - sz); ctx.lineTo(cx + sz, cy - sz); }
    if (dir === 2) { ctx.moveTo(cx - sz, cy); ctx.lineTo(cx + sz, cy - sz); ctx.lineTo(cx + sz, cy + sz); }
    if (dir === 3) { ctx.moveTo(cx + sz, cy); ctx.lineTo(cx - sz, cy - sz); ctx.lineTo(cx - sz, cy + sz); }
    ctx.closePath(); ctx.fill();
  };
  HeatmapRenderer.prototype.draw = function () {
    var ctx = this.ctx; if (!ctx) return;
    var size = this.syncSize(), cell = size.cell, s, a;
    ctx.clearRect(0, 0, size.w, size.h);
    var vMin = Infinity, vMax = -Infinity;
    for (s = 0; s < 48; s++) { if (isTerminal(s)) continue; var v = this.maxQ(s); if (v < vMin) vMin = v; if (v > vMax) vMax = v; }
    if (!isFinite(vMin)) { vMin = 0; vMax = 0; }
    for (s = 0; s < 48; s++) {
      var x = colOf(s) * cell, y = rowOf(s) * cell;
      if (isCliff(s)) { ctx.fillStyle = '#111'; ctx.fillRect(x, y, cell, cell); this.glyph('☠', x, y, cell, '#ddd'); }
      else if (isGoal(s)) { ctx.fillStyle = '#FFD700'; ctx.fillRect(x, y, cell, cell); this.glyph('★', x, y, cell, '#111'); }
      else {
        if (this.showHeatmap) { var t = (this.maxQ(s) - vMin) / (vMax - vMin + 1e-9); ctx.fillStyle = 'hsl(' + Math.round(t * 120) + ',70%,45%)'; }
        else ctx.fillStyle = '#202033';
        ctx.fillRect(x, y, cell, cell);
        if (isStart(s)) { ctx.lineWidth = Math.max(2, cell * 0.06); ctx.strokeStyle = '#fff'; ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4); this.glyph('🚩', x, y, cell, null, 0.3); }
        if (this.showArrows) {
          var acts = this.bestActions(s); ctx.fillStyle = 'rgba(255,255,255,0.9)';
          if (acts.length === 1) this.arrow(x + cell / 2, y + cell / 2, acts[0], cell * 0.16);
          else { var off = { 0: [0, -0.22], 1: [0, 0.22], 2: [-0.22, 0], 3: [0.22, 0] }; for (a = 0; a < acts.length; a++) this.arrow(x + cell / 2 + off[acts[a]][0] * cell, y + cell / 2 + off[acts[a]][1] * cell, acts[a], cell * 0.09); }
        }
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
    }
    if (this.liveState != null && this.liveState >= 0 && this.liveState < 48) {
      var lx = colOf(this.liveState) * cell + cell / 2, ly = rowOf(this.liveState) * cell + cell / 2;
      ctx.beginPath(); ctx.arc(lx, ly, cell * 0.13, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
    }
  };
  HeatmapRenderer.prototype.loop = function () { try { this.draw(); } catch (e) { if (global.console) console.error(e); } finally { requestAnimationFrame(this.loop); } };
  global.HeatmapRenderer = HeatmapRenderer;
})(globalThis);