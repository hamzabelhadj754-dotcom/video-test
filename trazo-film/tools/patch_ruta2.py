"""La Ruta fix 2: streets + Turia drawn on a per-frame canvas (no giant SVG pattern)."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep('      <rect x="-6000" y="-4000" width="34000" height="9000" fill="url(#streets)"/>\n      <path id="turia" fill="none" stroke="#E8EBE2" stroke-width="420" stroke-linecap="round"/>\n', '')
rep("  $('#turia').setAttribute('d', 'M -4000 1500 C 2000 1300, 6000 1900, 10000 1350 S 18000 700, 26000 1200');\n", '')
rep('  <div id="world">', '  <canvas id="bgc" width="1920" height="1080" style="position:absolute;left:0;top:0"></canvas>\n  <div id="world">')
rep("  // ------------------------------------------------------------------ seek", """  // ------------------------------------------------------------------ city texture (canvas, only what the camera sees)
  const bg = $('#bgc').getContext('2d');
  const TURIA = new Path2D('M -4000 1500 C 2000 1300, 6000 1900, 10000 1350 S 18000 700, 26000 1200');
  function drawCity(c, S, ox, oy) {
    const g = bg; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#F7F6F2'; g.fillRect(0, 0, 1920, 1080);
    const a = c.r * Math.PI / 180, co = Math.cos(a) * S, si = Math.sin(a) * S;
    g.setTransform(co, si, -si, co, ox, oy); g.translate(-c.x, -c.y);
    const hw = 1300 / S, hh = 900 / S, x0 = c.x - hw, x1 = c.x + hw, y0 = c.y - hh, y1 = c.y + hh;
    g.strokeStyle = '#E8EBE2'; g.lineWidth = 420; g.lineCap = 'round'; g.stroke(TURIA);
    const grid = (step, w, col, off = 0) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath();
      for (let x = Math.floor((x0 - off) / step) * step + off; x <= x1; x += step) { g.moveTo(x, y0); g.lineTo(x, y1); }
      for (let y = Math.floor((y0 - off) / step) * step + off; y <= y1; y += step) { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke(); };
    grid(280, 5, '#EFEEE9', 140); grid(560, 10, '#ECEBE5', 140);
    g.strokeStyle = '#EFEEE9'; g.lineWidth = 6; g.beginPath();
    for (let k = Math.floor((x0 - y1) / 2240) * 2240; k <= x1 - y0; k += 2240) { g.moveTo(k + y0, y0); g.lineTo(k + y1, y1); } g.stroke();
  }

  // ------------------------------------------------------------------ seek""")
rep("    $('#camg').setAttribute('transform',", "    drawCity(c, S, ox, oy);\n    $('#camg').setAttribute('transform',")
open(p, 'w').write(s)
print('ok')
