"""Editorial v06: no double images (single-image reveals, no time-sample trails), push blur by directional resampling
(no 8-bit accumulation → no brightness steps), one continuous global camera (no scale jump at match cuts), calmer pops,
slower background sway, softer caret, slightly larger captions."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:110])
    s = s.replace(a, b)

# 1. single-image reveal (no pale offset copy)
R("""  function ghost(img, cx, by, h, t0, o = {}) { const a = k(T, t0, .35), b = k(T, t0 + .3, 1.0, E.out); if (a <= 0) return; ev('ghost', t0);
    const dx = (o.dx != null ? o.dx : 50) * (1 - b), s = h / img.height, w = img.width * s;
    if (b < 1) { g.save(); g.globalAlpha *= .6 * a * (1 - b); g.drawImage(img.pale, cx - w / 2 + dx * 1.8, by - h, w, h); g.restore(); }
    if (b > 0) { g.save(); g.globalAlpha *= b; if (b < 1) g.filter = `blur(${(12 * (1 - b)).toFixed(1)}px)`; photo(img, cx + dx, by, h, o); g.restore(); } }""",
"""  function ghost(img, cx, by, h, t0, o = {}) { const a = k(T, t0, 1.0, E.out); if (a <= 0) return; ev('ghost', t0);
    const sc = 1.04 - .04 * a, py = by - h / 2; g.save(); g.globalAlpha *= clamp(a * 1.6); g.translate(cx, py); g.scale(sc, sc); g.translate(-cx, -py);
    if (a < 1) g.filter = `blur(${(10 * (1 - a)).toFixed(1)}px)`; photo(img, cx, by, h, o); g.restore(); }""")

# 2. no time-sample trails on elements
R("function motion(fn, n = 8, sh = .012) { const T0 = T, a0 = g.globalAlpha; for (let j = 0; j < n; j++) { T = T0 - sh * j / (n - 1); g.globalAlpha = a0 / (j + 1); fn(); } T = T0; g.globalAlpha = a0; }",
  "function motion(fn) { fn(); }   // v06: single draw (multi-sample trails read as a lagging double image)")

# student → courier: one continuous carousel move on io, blur peaks mid-move
R("""    const sIn = k(t, 11.6, .9, E.out), sOut = k(t, 15.45, .5, E.in);
    if (sIn > 0 && sOut < 1) { const draw = () => { const a = k(T, 11.6, .9, E.out), o = k(T, 15.45, .5, E.in); g.save(); g.globalAlpha *= clamp(a * 2) * (1 - o); const b = 10 * (1 - a) + 8 * o; if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; photo(IMG.studentCool, 960 + 620 * (1 - a) - 780 * o, 830, 560); g.restore(); };""",
"""    const sIn = k(t, 11.6, 1.0, E.out), sOut = k(t, 15.4, .75, E.io);
    if (sIn > 0 && sOut < 1) { const draw = () => { const a = k(T, 11.6, 1.0, E.out), o = k(T, 15.4, .75, E.io); g.save(); g.globalAlpha *= clamp(a * 2) * (1 - clamp((o - .45) / .55)); const b = 10 * (1 - a) + 9 * Math.sin(Math.PI * o); if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; photo(IMG.studentCool, 960 + 620 * (1 - a) - 820 * o, 830, 560); g.restore(); };""")
R("""    const cIn = k(t, 15.62, .85, E.out);""", """    const cIn = k(t, 15.4, .75, E.io);""")
s_old_courier = None
import re
m = re.search(r"if \(cIn > 0\) \{ const draw = \(\) => \{ const a = k\(T, 15\.62, \.85, E\.out\);[^\n]*\n", s)
assert m, 'courier draw not found'
s = s[:m.start()] + """if (cIn > 0) { const draw = () => { const a = k(T, 15.4, .75, E.io); g.save(); g.globalAlpha *= clamp((a - .1) / .45); const b = 9 * Math.sin(Math.PI * a); if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; photo(IMG.courierCool, 960 + 820 * (1 - a), 830, 530); g.restore(); };
      draw(); }
""" + s[m.end():]
# the line after the courier draw used to be the motion() selector — remove it if present
s = s.replace("      cIn < .85 ? motion(draw) : draw(); }\n", "", 1)

# 3. push: composite once, then directional resample blur (squash along motion, stretch back)
R("""      // A and B tile the frame, so each sample is an opaque full frame: running average with alpha 1/(j+1) is exact
      for (let j = 0; j < n; j++) comp(m, n === 1 ? p : lerp(pa, pb, j / (n - 1)), 1 / (j + 1));
      m.globalAlpha = 1;""",
"""      cC.setTransform(1, 0, 0, 1, 0, 0); cC.fillStyle = '#03050A'; cC.fillRect(0, 0, W, H); comp(cC, p, 1); cC.globalAlpha = 1; void n;
      const f = Math.min(40, travel / 1.2);
      if (f < 1.5) m.drawImage(bufC, 0, 0);
      else { const tw = dx ? Math.max(16, Math.round(W / f)) : W, th = dy ? Math.max(16, Math.round(H / f)) : H;
        cD.setTransform(1, 0, 0, 1, 0, 0); cD.imageSmoothingEnabled = true; cD.imageSmoothingQuality = 'high'; cD.clearRect(0, 0, W, H); cD.drawImage(bufC, 0, 0, tw, th);
        m.imageSmoothingEnabled = true; m.imageSmoothingQuality = 'high'; m.drawImage(bufD, 0, 0, tw, th, 0, 0, W, H); }
      m.globalAlpha = 1;""")
R("const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H), cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d');",
  "const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H), bufD = mk(W, H), cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d'), cD = bufD.getContext('2d');")

# 4. one continuous camera for the whole film (no scale reset at cuts → match cuts line up exactly)
R("    const lt = (t - s.t0) / (s.t1 - s.t0), sc = 1.006 + .025 * lt; g.translate(960, 540); g.scale(sc, sc);",
  "    const sc = CAM(t); g.translate(960, 540); g.scale(sc, sc);")
R("  window.VH_CUTS = CUTS;", "  window.VH_CUTS = CUTS;\n  const CAM = t => 1.02 + .012 * Math.sin(t * .21);   // slow global breathing zoom, continuous across every cut")
R("const camPt = (name, t, x, y) => { const sc0 = SC.find(q => q.name === name), lt = (t - sc0.t0) / (sc0.t1 - sc0.t0), sc = 1.006 + .025 * lt;",
  "const camPt = (name, t, x, y) => { const sc = CAM(t);")

# 5. calmer pops: fade + rise + slight scale instead of springing from zero
R("""  function popText(s, x, y, t0, o = {}) { if (T < t0) return; ev('pop', t0); const sp = Math.max(0, spring(t0, 1.6, 7)), m = measure(s, o), cx = o.align === 'center' ? x : o.align === 'right' ? x - m / 2 : x + m / 2, cy = y - (o.size || 24) * .35;
    g.save(); g.globalAlpha *= clamp((T - t0) / .12); g.translate(cx, cy); g.scale(sp, sp); g.translate(-cx, -cy); txt(s, x, y, o); g.restore(); }""",
"""  function popText(s, x, y, t0, o = {}) { if (T < t0) return; ev('pop', t0); const q = k(T, t0, .5, E.out), sp = .9 + .1 * q, m = measure(s, o), cx = o.align === 'center' ? x : o.align === 'right' ? x - m / 2 : x + m / 2, cy = y - (o.size || 24) * .35;
    g.save(); g.globalAlpha *= q; g.translate(cx, cy + 10 * (1 - q)); g.scale(sp, sp); g.translate(-cx, -cy); txt(s, x, y, o); g.restore(); }""")
R("""      const sp = spring(a - .05, 1.5, 7); if (sp <= 0) return; ev('card', a - .05); g.save(); g.globalAlpha *= clamp((t - a + .05) / .15); g.translate(x, y); g.scale(Math.max(0, sp), Math.max(0, sp)); g.translate(-x, -y);""",
  """      const q = k(t, a - .05, .55, E.out); if (q <= 0) return; ev('card', a - .05); const sp = .9 + .1 * q; g.save(); g.globalAlpha *= q; g.translate(x, y + 14 * (1 - q)); g.scale(sp, sp); g.translate(-x, -y);""")

# 6. slower background sway
R("sway = Math.sin(t * .7 + ph) * .05 + Math.sin(t * 1.9 + ph * 2) * .012;", "sway = Math.sin(t * .45 + ph) * .045 + Math.sin(t * 1.1 + ph * 2) * .008;")

# 7. caret: steady while typing, then fades (no hard blink-off)
R("""    if (o.caret !== false && T < tEnd + hold && (T < tEnd + .05 || Math.floor((T - tEnd) * 5) % 2 === 0)) {
      g.fillStyle = o.caretCol || fo.col || C.white; g.fillRect(X + measure(s.slice(0, n), fo) + 4, y - size * .76, Math.max(2, size * .045), size * .9); }""",
"""    if (o.caret !== false && T < tEnd + hold) { g.save(); g.globalAlpha *= 1 - clamp((T - tEnd - hold + .25) / .25);
      g.fillStyle = o.caretCol || fo.col || C.white; g.fillRect(X + measure(s.slice(0, n), fo) + 4, y - size * .76, Math.max(2, size * .045), size * .9); g.restore(); }""")

# 8. readability: function sub-captions 18 → 20, brighter
R("typeOn(sub, x + 4, y + 76, a + .3, { size: 18, w: 400, col: C.sky, cps: 60, caret: false });",
  "typeOn(sub, x + 4, y + 78, a + .3, { size: 20, w: 500, col: '#C4D6FF', cps: 60, caret: false });")
open(p, 'w').write(s)
print('ok')
