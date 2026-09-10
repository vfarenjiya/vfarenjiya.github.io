(function (global) {
  'use strict';
  function ReturnChart(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.data = { q: [], sarsa: [] }; this.mode = 'q';
    this.colors = { q: '#0f9d58', sarsa: '#e94560' };
    this._bw = 0; this._bh = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  ReturnChart.prototype.addPoint = function (alg, x, y) { if (!this.data[alg]) this.data[alg] = []; this.data[alg].push({ x: x, y: y }); };
  ReturnChart.prototype.reset = function () { this.data = { q: [], sarsa: [] }; };
  ReturnChart.prototype.syncSize = function () {
    var c = this.canvas, cssW = c.clientWidth || (c.parentElement && c.parentElement.clientWidth) || 360, cssH = c.clientHeight || 180;
    var dpr = global.devicePixelRatio || 1, bw = Math.max(1, Math.round(cssW * dpr)), bh = Math.max(1, Math.round(cssH * dpr));
    if (bw !== this._bw || bh !== this._bh) { c.width = bw; c.height = bh; this._bw = bw; this._bh = bh; }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: cssW, h: cssH };
  };
  ReturnChart.prototype.ma = function (pts) {
    var out = []; for (var i = 0; i < pts.length; i++) { var s = 0, n = 0; for (var j = Math.max(0, i - 19); j <= i; j++) { s += pts[j].y; n++; } out.push({ x: pts[i].x, y: s / n }); } return out;
  };
  ReturnChart.prototype.draw = function () {
    var ctx = this.ctx; if (!ctx) return;
    var size = this.syncSize(), W = size.w, H = size.h;
    ctx.clearRect(0, 0, W, H);
    var keys = this.mode === 'both' ? ['q', 'sarsa'] : [this.mode];
    var xMax = 1, yMin = Infinity, yMax = -Infinity, any = false, k, p, i;
    for (k = 0; k < keys.length; k++) { var arr = this.data[keys[k]] || []; for (i = 0; i < arr.length; i++) { p = arr[i]; if (p.x > xMax) xMax = p.x; if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y; any = true; } }
    if (!any) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '14px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Train to see returns', W / 2, H / 2); return; }
    yMin = Math.min(yMin, -100); yMax = Math.max(yMax, 0); var pad = (yMax - yMin) * 0.05 || 1; yMin -= pad; yMax += pad;
    var L = 42, R = 8, T = 8, B = 24, pw = W - L - R, ph = H - T - B;
    function X(x) { return L + (x / xMax) * pw; }
    function Y(y) { return T + (1 - (y - yMin) / (yMax - yMin)) * ph; }
    ctx.strokeStyle = '#556'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
    ctx.fillStyle = '#aab'; ctx.font = '10px system-ui'; ctx.textBaseline = 'middle';
    for (i = 0; i <= 4; i++) { var yv = yMin + (i / 4) * (yMax - yMin); ctx.textAlign = 'right'; ctx.fillText(yv.toFixed(0), L - 4, Y(yv)); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('0', X(0), T + ph + 4); ctx.fillText(String(Math.round(xMax / 2)), X(xMax / 2), T + ph + 4); ctx.fillText(String(Math.round(xMax)), X(xMax), T + ph + 4);
    ctx.fillText('episode', L + pw / 2, T + ph + 12);
    ctx.save(); ctx.translate(10, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText('return', 0, 0); ctx.restore();
    for (k = 0; k < keys.length; k++) {
      var pts = this.data[keys[k]] || []; if (!pts.length) continue; var col = this.colors[keys[k]];
      ctx.globalAlpha = 0.25; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
      for (i = 0; i < pts.length; i++) { var px = X(pts[i].x), py = Y(pts[i].y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
      ctx.globalAlpha = 1; var m = this.ma(pts); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (i = 0; i < m.length; i++) { var mx = X(m[i].x), my = Y(m[i].y); if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my); } ctx.stroke();
    }
  };
  ReturnChart.prototype.loop = function () { try { this.draw(); } catch (e) { if (global.console) console.error(e); } finally { requestAnimationFrame(this.loop); } };
  global.ReturnChart = ReturnChart;
})(globalThis);