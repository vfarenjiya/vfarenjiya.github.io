(function (global) {
  'use strict';

  function drawIcon(size, maskable) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');

    // Maskable icons must keep content inside the central 80% safe zone.
    var pad = maskable ? size * 0.1 : 0;
    var inner = size - pad * 2;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    // A 12x4 mini cliff grid as the glyph
    var cols = 12, rows = 4;
    var cell = inner / cols;
    var ox = pad, oy = pad + (inner - cell * rows) / 2;

    for (var r = 0; r < rows; r++) {
      for (var col = 0; col < cols; col++) {
        var x = ox + col * cell, y = oy + r * cell;
        var isCliff = (r === 3 && col >= 1 && col <= 10);
        var isGoal = (r === 3 && col === 11);
        var isStart = (r === 3 && col === 0);
        if (isCliff) ctx.fillStyle = '#111';
        else if (isGoal) ctx.fillStyle = '#FFD700';
        else ctx.fillStyle = '#0f9d58';
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        if (isStart) { ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, cell * 0.12); ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2); }
      }
    }
    return c;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, 'image/png');
    });
  }

  // Build + inject a manifest whose icon srcs are runtime blob URLs.
  global.installGeneratedManifest = async function () {
    try {
      var specs = [
        { size: 192, maskable: false, purpose: 'any' },
        { size: 512, maskable: false, purpose: 'any' },
        { size: 192, maskable: true, purpose: 'maskable' },
        { size: 512, maskable: true, purpose: 'maskable' }
      ];
      var icons = [];
      for (var i = 0; i < specs.length; i++) {
        var s = specs[i];
        var blob = await canvasToBlob(drawIcon(s.size, s.maskable));
        if (!blob) continue;
        icons.push({ src: URL.createObjectURL(blob), sizes: s.size + 'x' + s.size, type: 'image/png', purpose: s.purpose });
      }
      var manifest = {
        name: 'Cliff Walking RL Visualizer',
        short_name: 'Cliff RL',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        icons: icons
      };
      var url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));

      // Replace any static manifest link (or add one).
      var existing = document.querySelector('link[rel="manifest"]');
      if (existing) existing.remove();
      var link = document.createElement('link');
      link.rel = 'manifest';
      link.href = url;
      document.head.appendChild(link);
    } catch (e) {
      if (global.console) console.warn('Manifest generation failed:', e);
    }
  };
})(globalThis);