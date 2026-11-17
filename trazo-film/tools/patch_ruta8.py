"""La Ruta fix 8: rasterise the map SVG onto the canvas every frame (the SVG stays as the animated model, hidden)."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep('<svg id="map" width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0">',
    '<svg id="map" width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0;opacity:0;pointer-events:none">')
rep("    $('#map').style.opacity = (Math.round(t * 600) % 2) ? '0.9999' : '1';   // force a full re-raster of the map layer every frame (no stale tiles)\n", "")
rep("  // ------------------------------------------------------------------ seek", """  // ------------------------------------------------------------------ map renderer: walks the (hidden) SVG model and paints it on the canvas
  const P2D = new WeakMap();
  const hatchC = document.createElement('canvas'); hatchC.width = hatchC.height = 22;
  { const h = hatchC.getContext('2d'); h.strokeStyle = '#E5E4DE'; h.lineWidth = 6; h.beginPath(); for (let k = -22; k <= 44; k += 22) { h.moveTo(k, 22); h.lineTo(k + 22, 0); } h.stroke(); }
  const hatchP = bg.createPattern(hatchC, 'repeat');
  const A_ = (el, n, d) => { const v = el.getAttribute(n); return v == null ? d : v; };
  function paint(el) {
    for (const n of el.children) {
      if (n.style && (n.style.visibility === 'hidden' || n.style.display === 'none')) continue;
      const op = +A_(n, 'opacity', 1); if (op <= 0) continue;
      const tag = n.tagName.toLowerCase();
      if (tag === 'g') { paint(n); continue; }
      if (tag !== 'path' && tag !== 'circle') continue;
      let path;
      if (tag === 'path') { const d = n.getAttribute('d'); if (!d) continue; let c = P2D.get(n); if (!c || c.d !== d) { c = { d, p: new Path2D(d) }; P2D.set(n, c); } path = c.p; }
      else { const r = +A_(n, 'r', 0); if (r <= 0.01) continue; path = new Path2D(); path.arc(+n.getAttribute('cx'), +n.getAttribute('cy'), r, 0, Math.PI * 2); }
      bg.globalAlpha = op;
      const parent = n.parentNode;
      const fill = A_(n, 'fill', tag === 'circle' ? '#000' : 'none'), stroke = A_(n, 'stroke', A_(parent, 'stroke', 'none'));
      if (fill !== 'none') { bg.fillStyle = fill.startsWith('url(') ? hatchP : fill; bg.fill(path); }
      if (stroke !== 'none') {
        bg.strokeStyle = stroke; bg.lineWidth = +A_(n, 'stroke-width', A_(parent, 'stroke-width', 1));
        bg.lineCap = A_(n, 'stroke-linecap', A_(parent, 'stroke-linecap', 'butt')); bg.lineJoin = A_(n, 'stroke-linejoin', A_(parent, 'stroke-linejoin', 'miter'));
        const da = n.getAttribute('stroke-dasharray');
        if (da) { bg.setLineDash(da.split(/[ ,]+/).map(Number)); bg.lineDashOffset = +A_(n, 'stroke-dashoffset', 0); } else bg.setLineDash([]);
        bg.stroke(path); bg.setLineDash([]);
      }
      bg.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------ seek""")
# after the city, paint the map with the same camera transform
rep("    g.strokeStyle = '#EFEEE9'; g.lineWidth = 6; g.beginPath();\n    for (let k = Math.floor((x0 - y1) / 2240) * 2240; k <= x1 - y0; k += 2240) { g.moveTo(k + y0, y0); g.lineTo(k + y1, y1); } g.stroke();\n  }",
    "    g.strokeStyle = '#EFEEE9'; g.lineWidth = 6; g.beginPath();\n    for (let k = Math.floor((x0 - y1) / 2240) * 2240; k <= x1 - y0; k += 2240) { g.moveTo(k + y0, y0); g.lineTo(k + y1, y1); } g.stroke();\n    paint($('#camg'));\n  }")
# the city drawing must happen after the timeline/rider updates of this frame: move drawCity to the end of seek
rep("    drawCity(c, S, ox, oy);\n", "")
rep("    hud(t);\n    const g = Math.floor(t * 30);", "    drawCity(c, S, ox, oy);\n    hud(t);\n    const g = Math.floor(t * 30);")
open(p, 'w').write(s)
print('ok')
