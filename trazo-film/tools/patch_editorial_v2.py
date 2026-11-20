"""Editorial v02: motivated transitions (zoom-through, light-disc reveal, foreground-leaf sweep, whip pan with motion blur,
flash cut, fade to black), cut-out rim glow, light sweeps on glass/titles, light rays, finish tweaks."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


# ---------------------------------------------------------------- transitions
a = s.index('  // ------------------------------------------------------------------ composition: scene buffers + blur-zoom transitions')
b = s.index("  window.VH_SCENES = SC.map(")
s = s[:a] + r'''  // ------------------------------------------------------------------ composition: scene buffers + motivated transitions
  // each cut has its own transition: [cut time, type, half-length, extra]
  const CUTS = {
    3.25: ['zoom', .42], 9.75: ['disc', .5, [960, 640]], 18.55: ['leaf', .48, 1], 22.0: ['whip', .3],
    28.8: ['whip', .3], 35.55: ['whip', .3], 41.1: ['whip', .3], 46.4: ['leaf', .48, -1], 60.95: ['disc', .5, [960, 520]],
    68.4: ['flash', .3], 73.3: ['disc', .5, [960, 700]], 81.65: ['leaf', .48, 1], 89.55: ['black', .55],
  };
  const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H), cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d');
  function drawScene(s, t, ctx) { const og = g; g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = s.t0 < 9 ? C.paper : s.t0 > 89 || (s.t0 > 68 && s.t0 < 69) ? '#04060A' : C.navy; g.fillRect(0, 0, W, H);   // no uncovered edge under the camera drift
    const lt = (t - s.t0) / (s.t1 - s.t0), sc = 1.006 + .025 * lt; g.translate(960, 540); g.scale(sc, sc); g.translate(-960 + 4 * Math.sin(t * .5), -540 + 3 * Math.cos(t * .4));
    s.draw(t); g = og; }
  // smear a buffer along a direction (directional motion blur), velocity in px
  function smear(ctx, buf, dx, dy, n = 10) {
    if (Math.hypot(dx, dy) < 1.5) { ctx.drawImage(buf, 0, 0); return; }
    for (let j = 0; j < n; j++) { const f = j / (n - 1) - .5; ctx.globalAlpha = 1 / (j + 1); ctx.drawImage(buf, dx * f, dy * f); }
    ctx.globalAlpha = 1;
  }
  function transition(type, A, B, t, p, ex) {
    const m = main, e = E.io(clamp(p));
    drawScene(A, t, cA); drawScene(B, t, cB);
    m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
    if (type === 'zoom') {               // the camera flies through the first scene into the next
      const zA = 1 + 2.2 * E.in(clamp(p * 1.15)), bA = 26 * E.in(clamp(p));
      m.save(); m.drawImage(bufB, 0, 0); m.translate(960, 560); m.scale(zA, zA); m.translate(-960, -560); m.globalAlpha = 1 - E.in(clamp((p - .35) / .65)); if (bA > .5) m.filter = `blur(${bA.toFixed(1)}px)`; m.drawImage(bufA, 0, 0); m.restore();
    } else if (type === 'disc') {        // a disc of light opens from where the next hero will stand
      const [cx, cy] = ex, R = 2300 * E.io(clamp(p)) + 1;
      m.save(); const zA = 1 + .06 * e; m.translate(960, 540); m.scale(zA, zA); m.translate(-960, -540); m.drawImage(bufA, 0, 0); m.restore();
      m.save(); m.beginPath(); m.arc(cx, cy, R, 0, 7); m.clip(); const zB = 1.08 - .08 * e; m.translate(cx, cy); m.scale(zB, zB); m.translate(-cx, -cy); m.drawImage(bufB, 0, 0); m.restore();
      if (R > 2 && R < 2200) { m.save(); m.lineWidth = 3; const gr = m.createRadialGradient(cx, cy, R - 40, cx, cy, R + 4); gr.addColorStop(0, 'rgba(59,123,255,0)'); gr.addColorStop(1, 'rgba(140,180,255,.85)');
        m.strokeStyle = 'rgba(160,195,255,.9)'; m.beginPath(); m.arc(cx, cy, R, 0, 7); m.stroke(); m.fillStyle = gr; m.beginPath(); m.arc(cx, cy, R, 0, 7); m.fill(); m.restore(); }
    } else if (type === 'leaf') {        // foreground orange-tree branches sweep across the lens and wipe the frame
      const dir = ex, edge = dir > 0 ? lerp(W + 500, -500, e) : lerp(-500, W + 500, e);
      m.save(); m.drawImage(bufB, 0, 0); m.beginPath(); if (dir > 0) m.rect(0, 0, edge, H); else m.rect(edge, 0, W - edge, H); m.clip(); m.drawImage(bufA, 0, 0); m.restore();
      const L = LEAF.front, sc2 = 2.6, v = 1 - Math.abs(e - .5) * 2;
      for (const [oy, rot, k2] of [[-140, .4, 0], [560, -2.6, 1], [1180, .9, 2]]) { m.save(); m.translate(edge + dir * (k2 - 1) * 220, oy); m.rotate(rot + dir * .15 * (e - .5)); m.scale(sc2, sc2); m.globalAlpha = .55 + .45 * v; m.drawImage(L, -L.width / 2, -L.height / 2); m.restore(); }
    } else if (type === 'whip') {        // fast camera pan to the left, carried by motion blur
      const x = -W * e, v = W * (E.io(clamp(p + .03)) - E.io(clamp(p - .03))) / .06 * (1 / 60) * 1.6;
      cC.setTransform(1, 0, 0, 1, 0, 0); cC.globalAlpha = 1; cC.fillStyle = C.navy; cC.fillRect(0, 0, W, H); cC.drawImage(bufA, x, 0); cC.drawImage(bufB, x + W, 0);
      m.save(); smear(m, bufC, -v, 0, 12); m.restore();
    } else if (type === 'flash') {       // hard cut on the hit, with a light flash and a scale punch
      if (p < .5) m.drawImage(bufA, 0, 0); else { const q = (p - .5) * 2, z = 1.06 - .06 * E.out(q); m.save(); m.translate(960, 540); m.scale(z, z); m.translate(-960, -540); m.drawImage(bufB, 0, 0); m.restore(); }
      const f = Math.max(0, 1 - Math.abs(p - .5) * 4); m.fillStyle = `rgba(200,220,255,${(.85 * f).toFixed(3)})`; m.fillRect(0, 0, W, H);
    } else if (type === 'black') {       // the picture breathes out to black, the finale grows out of it
      const fo = E.in(clamp(p * 1.6)), fl = .5 + .5 * Math.sin(t * 90);
      m.save(); m.globalAlpha = 1 - fo; m.filter = `blur(${(10 * fo).toFixed(1)}px)`; m.drawImage(bufA, 0, 0); m.restore();
      m.save(); m.globalAlpha = E.out(clamp((p - .45) / .55)) * (.92 + .08 * fl); m.drawImage(bufB, 0, 0); m.restore();
    }
    m.globalAlpha = 1; m.filter = 'none';
  }
  function frame(t) {
    T = t; const cur = SC.findIndex(s => t >= s.t0 && t < s.t1), i = cur < 0 ? SC.length - 1 : cur, s = SC[i];
    const nxt = SC[i + 1], prv = SC[i - 1];
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none'; main.globalCompositeOperation = 'source-over';
    let done = false;
    for (const [A, B] of [[s, nxt], [prv, s]]) { if (!A || !B || done) continue; const c = CUTS[B.t0]; if (!c) continue; const h = c[1];
      if (t > B.t0 - h && t < B.t0 + h) { transition(c[0], A, B, t, (t - (B.t0 - h)) / (2 * h), c[2]); done = true; } }
    if (!done) drawScene(s, t, main);
    // finish: vignette + grain (+ stronger grain in the black finale)
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1;
    const vg = main.createRadialGradient(960, 540, 520, 960, 540, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,.32)'); main.fillStyle = vg; main.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = main.createPattern(grainTile, 'repeat');
    const fi = Math.floor(t * 30); main.save(); main.globalAlpha = t > 89.5 ? .1 : .045; main.globalCompositeOperation = 'overlay'; main.translate((fi * 37) % 128 - 64, (fi * 53) % 128 - 64); main.fillStyle = grainPat; main.fillRect(-64, -64, W + 128, H + 128); main.restore();
  }

''' + s[b:]

# ---------------------------------------------------------------- foreground leaf sprite for the sweep
rep("LEAF.paper = blurred(branch(11, 'rgba(18,40,90,.92)', '#1D3E86'), 6);",
    "LEAF.paper = blurred(branch(11, 'rgba(18,40,90,.92)', '#1D3E86'), 6); LEAF.front = blurred(branch(37, 'rgba(6,18,46,1)', '#E8501A'), 16);")

# ---------------------------------------------------------------- cut-out rim glow (pre-rendered) + light rays + light sweeps
rep("  function photo(img, cx, by, h, o = {}) {   // cut-out standing on baseline by, centred at cx, height h",
    """  function rimGlow(img) { const pad = 60, c = mk(img.width + pad * 2, img.height + pad * 2), x = c.getContext('2d'); x.filter = 'blur(26px)'; x.drawImage(img, pad, pad); x.filter = 'none';
    x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgba(90,150,255,.9)'; x.fillRect(0, 0, c.width, c.height); return c; }
  function rays(t, a = 1) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .1 * a; g.translate(1650, -120); g.rotate(.62 + .02 * Math.sin(t * .3));
    for (let i = 0; i < 5; i++) { const w = 80 + i * 40, x = (i - 2) * 190 + 30 * Math.sin(t * .4 + i); const gr = g.createLinearGradient(0, 0, 0, 1800); gr.addColorStop(0, 'rgba(150,190,255,.9)'); gr.addColorStop(1, 'rgba(150,190,255,0)'); g.fillStyle = gr; g.fillRect(x - w / 2, 0, w, 1800); }
    g.restore(); }
  function sweep(x, y, w, h, t0, r = 24) { const q = (T - t0) / .9; if (q <= 0 || q >= 1) return; g.save(); rr(x, y, w, h, r); g.clip(); const sx = x - 300 + (w + 600) * E.io(q);
    const gr = g.createLinearGradient(sx - 160, y, sx + 160, y + h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore(); }
  function photo(img, cx, by, h, o = {}) {   // cut-out standing on baseline by, centred at cx, height h""")
rep("    g.drawImage(img, cx - w / 2, by - h, w, h);\n  }",
    "    if (img.glow) { const pad = 60 * s; g.save(); g.globalAlpha *= .55; g.globalCompositeOperation = 'screen'; g.drawImage(img.glow, cx - w / 2 - pad, by - h - pad, w + pad * 2, h + pad * 2); g.restore(); }\n    g.drawImage(img, cx - w / 2, by - h, w, h);\n  }")
rep("IMG.ebikeMono = grade(IMG.ebike, 'mono'); IMG.studentCool = grade(IMG.student, 'cool'); IMG.courierCool = grade(IMG.courier, 'cool'); IMG.cyclistCool = grade(IMG.cyclist, 'cool');",
    "IMG.ebikeMono = grade(IMG.ebike, 'mono'); IMG.studentCool = grade(IMG.student, 'cool'); IMG.courierCool = grade(IMG.courier, 'cool'); IMG.cyclistCool = grade(IMG.cyclist, 'cool');\n    for (const k2 of ['studentCool', 'courierCool', 'cyclistCool']) IMG[k2].glow = rimGlow(IMG[k2]);")
# rays in every navy scene background
rep("    g.save(); g.strokeStyle = 'rgba(140,170,255,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(-300 + 30 * Math.sin(t * .2), 1250, 1150, -1.3, -.35); g.stroke(); g.restore();\n  }",
    "    g.save(); g.strokeStyle = 'rgba(140,170,255,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(-300 + 30 * Math.sin(t * .2), 1250, 1150, -1.3, -.35); g.stroke(); g.restore();\n    rays(t, tone);\n  }")
# light sweeps: glass panels when they land, title boxes, objective numbers
rep("    g.save(); g.globalAlpha = p; const gx = 1080, gy = 300 + (1 - p) * 60; glass(gx, gy, 700, 560, 30);",
    "    g.save(); g.globalAlpha = p; const gx = 1080, gy = 300 + (1 - p) * 60; glass(gx, gy, 700, 560, 30); sweep(gx, gy, 700, 560, 29.9, 30);")
rep("    g.save(); g.globalAlpha = p; const gx = 1060, gy = 260 + (1 - p) * 60; glass(gx, gy, 720, 600, 30);",
    "    g.save(); g.globalAlpha = p; const gx = 1060, gy = 260 + (1 - p) * 60; glass(gx, gy, 720, 600, 30); sweep(gx, gy, 720, 600, 36.6, 30);")
rep("      if (p < 1) g.filter = `blur(${((1 - p) * 10).toFixed(1)}px)`; txt(title, x + 35, 360, { f: SERIF, size: 92, w: 700, ls: 3, col: C.white }); g.filter = 'none';",
    "      if (p < 1) g.filter = `blur(${((1 - p) * 10).toFixed(1)}px)`; txt(title, x + 35, 360, { f: SERIF, size: 92, w: 700, ls: 3, col: C.white }); g.filter = 'none'; sweep(x, 262, w, 128, kt + .9, 6);")
rep("      glass(x, y, 400, 380, 26); icon(ic, x + 40, y + 50, q);", "      glass(x, y, 400, 380, 26); sweep(x, y, 400, 380, a + .4, 26); icon(ic, x + 40, y + 50, q);")
# Gestión: the document stack's base appears with the title (no empty right side)
rep("    const D = [['PEDIDO #0412',",
    "    { const q = k(t, 41.3, .8); if (q > 0) { g.save(); g.globalAlpha = q * .55; g.translate(1450, 520 + (1 - q) * 40); g.rotate(4 * Math.PI / 180); glass(-300, -260, 600, 520, 26); txt('CRM · TRAZO', -260, -200, { size: 15, w: 700, ls: 4, col: C.sky }); g.restore(); } }\n    const D = [['PEDIDO #0412',")
# SMART objectives: punch in from depth with blur, push out upward (not a soft fade)
rep("      g.save(); g.globalAlpha = pin * (1 - pout); const sc = .94 + .06 * pin + .03 * pout; g.translate(960, 540); g.scale(sc, sc); g.translate(-960, -540);",
    "      g.save(); g.globalAlpha = pin * (1 - pout); const sc = .86 + .14 * pin + .18 * pout; g.translate(960, 540 - 120 * pout); g.scale(sc, sc); g.translate(-960, -540); if (pout > 0) g.filter = `blur(${(14 * pout).toFixed(1)}px)`;")
open(p, 'w').write(s)
print('ok')
