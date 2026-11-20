"""Editorial v04 (part A): frosted glass, 1:09 tick→disc carry, light leaks, slam bloom, finale dot, earlier card tumble."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:90])
    s = s.replace(a, b)

# --- real frosted glass: blur what is behind the panel (only its own screen box)
R("""  function glass(x, y, w, h, r = 28, a = 1) {
    g.save(); g.globalAlpha *= a;
""", """  function glass(x, y, w, h, r = 28, a = 1) {
    g.save(); g.globalAlpha *= a;
    if (g.canvas.width === W && a > .02) { const m = g.getTransform(), P = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
      const x0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[0])) - 80)), y0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[1])) - 80)), x1 = Math.min(W, Math.ceil(Math.max(...P.map(q => q[0])) + 80)), y1 = Math.min(H, Math.ceil(Math.max(...P.map(q => q[1])) + 80));
      if (x1 - x0 > 4 && y1 - y0 > 4) { g.save(); rr(x, y, w, h, r); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(22px) saturate(1.35) brightness(1.06)'; g.drawImage(g.canvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); g.restore(); } }
""")

# --- slams get a soft blue bloom
R("""txt(s, 0, 0, Object.assign({ align: 'center' }, o)); g.restore(); }""",
  """g.shadowColor = 'rgba(110,160,255,.55)'; g.shadowBlur = 70; txt(s, 0, 0, Object.assign({ align: 'center' }, o)); g.restore(); }""")

# --- Captación: card starts tumbling right after the carried title box lands
R("const p = k(t, 22.35, 1.3, E.out), ex = k(t, 28.3, .5, E.in);", "const p = k(t, 22.1, 1.3, E.out), ex = k(t, 28.3, .5, E.in);")
R("ev('tumble', 22.35);", "ev('tumble', 22.1);")

# --- 1:09: Supervisión exits, the third tick grows into the Motivación disc (carried across a match cut)
R("""  scene('09 Supervisión', 60.95, 68.4, C.navy, (t) => {
    bgNavy(t, [1000, 380]); leaves(t, 'navy', ['tl', 'br'], 61.0); navyChrome(t, 61.0);
    const up = k(t, 62.3, .8, E.io); ev('shrink', 62.3);
    g.save(); g.translate(0, -230 * up);""",
"""  // the blue tick of the last card becomes the stage of the next scene
  const TICK0 = (() => { const a = 2.2 * Math.PI / 180, cx = 1410, cy = 610, dx = 1550 - cx, dy = 482 - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; })();
  function carryDisc() { const c = k(T, 67.95, .6, E.io); if (T < 67.95) return; ev('carry', 67.95);
    const draw = () => { const q = k(T, 67.95, .6, E.io), x = lerp(TICK0[0], 960, q), y = lerp(TICK0[1], 690, q) - 140 * Math.sin(Math.PI * q), r = lerp(20, 270, q);
      g.save(); g.globalAlpha *= 1 - q; g.fillStyle = C.blue2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); disc(x, y, r, q);
      if (q < .4) { g.save(); g.globalAlpha *= 1 - q / .4; g.strokeStyle = '#fff'; g.lineWidth = 4 * r / 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 9 * r / 20, y); g.lineTo(x - 2 * r / 20, y + 8 * r / 20); g.lineTo(x + 10 * r / 20, y - 8 * r / 20); g.stroke(); g.restore(); }
      const b = Math.sin(Math.PI * q); if (b > .01) { g.save(); g.globalAlpha *= .7 * b; g.strokeStyle = 'rgba(170,200,255,.9)'; g.lineWidth = 3; g.shadowColor = 'rgba(90,150,255,1)'; g.shadowBlur = 40; g.beginPath(); g.arc(x, y, r * 1.08, 0, 7); g.stroke(); g.restore(); } };
    c < 1 ? motion(draw, 5, .03) : draw(); }
  scene('09 Supervisión', 60.95, 68.4, C.navy, (t) => {
    const ex = k(t, 67.85, .5, E.in);
    bgNavy(t, [1000, 380]); if (ex > 0) { g.fillStyle = `rgba(4,6,10,${(.98 * ex).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }
    leaves(t, 'navy', ['tl', 'br'], 61.0); navyChrome(t, 61.0, 1 - ex);
    const up = k(t, 62.3, .8, E.io); ev('shrink', 62.3);
    g.save(); g.globalAlpha *= 1 - ex; g.translate(0, -230 * up - 140 * ex);""")
R("""      g.save(); g.globalAlpha = clamp((t - a + .15) / .2); const rot = ((i - 1) * 2.2 + 9 * (1 - sp)) * Math.PI / 180; g.translate(x + 200, y + 190); g.rotate(rot); g.translate(-x - 200, -y - 190);""",
  """      g.save(); g.globalAlpha = clamp((t - a + .15) / .2) * (1 - ex); if (ex > 0) g.filter = `blur(${(12 * ex).toFixed(1)}px)`; const rot = ((i - 1) * 2.2 + 9 * (1 - sp) + (i - 1) * 14 * ex) * Math.PI / 180; g.translate(x + 200, y + 190 + 380 * ex * ex); g.scale(1 - .15 * ex, 1 - .15 * ex); g.rotate(rot); g.translate(-x - 200, -y - 190);""")
R("""      if (ck > 0) { g.fillStyle = C.blue2;""", """      if (ck > 0 && !(i === 2 && t >= 67.95)) { g.fillStyle = C.blue2;""")
R("""    cursorPath([[62.85, 1500, 1060], [63.2, 610, 482, 1], [64.78, 1080, 482, 1], [66.86, 1550, 482, 1], [67.7, 1720, 1050]], C.white, C.ink);
  });""", """    cursorPath([[62.85, 1500, 1060], [63.2, 610, 482, 1], [64.78, 1080, 482, 1], [66.86, 1550, 482, 1], [67.7, 1720, 1050]], C.white, C.ink);
    carryDisc();
  });""")
R("""    const dp = k(t, 68.9, .9, E.out); if (dp > 0) disc(960, 690 + 420 * (1 - dp), 270);
    ghost(IMG.cyclistCool, 960, 905, 400, 69.1, { dx: -60 });""",
  """    if (t < 68.55) carryDisc(); else disc(960, 690, 270 * (1 + .015 * Math.sin(t * 2)));
    ghost(IMG.cyclistCool, 960, 905, 400, 68.62, { dx: -60 });""")
R("68.4: ['leaf', .48, 1]", "68.4: ['match', .1]")

# --- finale: the org chart's centre dot stays, pulses, and TRAZO. slams out of it (shockwave + grain flash)
R("""    const p = clamp((t - 89.94) / .3);
    if (p > 0) { ev('slam', 89.94);""", """    if (t < 90.1) { const pr = 18 + 4 * Math.sin((t - 89.55) * 22), fo = 1 - clamp((t - 89.94) / .16); g.save(); g.globalAlpha = fo; g.fillStyle = '#fff'; g.shadowColor = 'rgba(140,180,255,1)'; g.shadowBlur = 50; g.beginPath(); g.arc(960, 560, pr, 0, 7); g.fill(); g.restore(); }
    { const d = t - 89.94; if (d > 0 && d < .7) { const q = E.out(d / .7); g.save(); g.globalAlpha = 1 - d / .7; g.strokeStyle = 'rgba(170,200,255,.9)'; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.arc(960, 560, 30 + 1100 * q, 0, 7); g.stroke(); g.restore(); }
      if (d > 0 && d < .25) { g.save(); g.fillStyle = `rgba(210,225,255,${(.45 * (1 - d / .25)).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); g.restore(); } }
    const p = clamp((t - 89.94) / .3);
    if (p > 0) { ev('slam', 89.94);""")
R("""      txt('TRAZO', -40, 80, { size: 300, w: 800, col: C.white, align: 'center', ls: 6 }); g.filter = 'none';""",
  """      g.shadowColor = 'rgba(110,160,255,.5)'; g.shadowBlur = 80; txt('TRAZO', -40, 80, { size: 300, w: 800, col: C.white, align: 'center', ls: 6 }); g.filter = 'none'; g.shadowColor = 'transparent';""")
R("89.55: ['flash', .25]", "89.55: ['match', .06]")
R("""      if (c > 0) { g.save(); g.fillStyle = '#fff'; g.shadowColor = 'rgba(140,180,255,1)'; g.shadowBlur = 40; g.beginPath(); g.arc(960, 560, 4 + 14 * c, 0, 7); g.fill(); g.restore(); }""",
  """      if (c > 0) { g.save(); g.fillStyle = '#fff'; g.shadowColor = 'rgba(140,180,255,1)'; g.shadowBlur = 50; g.beginPath(); g.arc(960, 560, 4 + 14 * c, 0, 7); g.fill(); g.restore(); }
      if (c > 0) { g.save(); g.fillStyle = `rgba(4,6,10,${(.98 * c).toFixed(3)})`; g.globalCompositeOperation = 'destination-over'; g.restore(); }""") if False else None

# Org: background crushes to black during the collapse, so the dot hands over to the black finale cleanly
R("""  scene('12 Organigrama', 81.65, 89.55, C.navy, (t) => {
    bgNavy(t, [960, 300]); leaves(t, 'navy', ['tr', 'bl'], 81.7); navyChrome(t, 81.8);
    const c = k(t, 89.05, .5, E.in);""", """  scene('12 Organigrama', 81.65, 89.55, C.navy, (t) => {
    const c = k(t, 89.05, .5, E.in);
    bgNavy(t, [960, 300]); leaves(t, 'navy', ['tr', 'bl'], 81.7); navyChrome(t, 81.8, 1 - c); if (c > 0) { g.fillStyle = `rgba(4,6,10,${c.toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }""")

# --- light leaks on the three big moments (drawn over the picture, before vignette/grain)
R("""    if (!done) drawScene(s, t, main);""", """    if (!done) drawScene(s, t, main);
    for (const [t0, dur, dir] of LEAKS) { const q = (t - t0) / dur; if (q <= 0 || q >= 1) continue; const a = Math.sin(Math.PI * q) ** 1.5, x = dir > 0 ? lerp(-300, W + 300, q) : lerp(W + 300, -300, q);
      main.save(); main.globalCompositeOperation = 'screen'; let gr = main.createRadialGradient(x, 300, 0, x, 300, 900); gr.addColorStop(0, `rgba(255,196,150,${(.32 * a).toFixed(3)})`); gr.addColorStop(.5, `rgba(255,140,90,${(.12 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,60,0)');
      main.fillStyle = gr; main.fillRect(0, 0, W, H); gr = main.createLinearGradient(x - 500, 0, x + 500, H); gr.addColorStop(0, 'rgba(255,220,190,0)'); gr.addColorStop(.5, `rgba(255,220,190,${(.1 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,190,0)'); main.fillStyle = gr; main.fillRect(0, 0, W, H); main.restore(); }""")
R("""  window.VH_CUTS = CUTS;""", """  window.VH_CUTS = CUTS;
  const LEAKS = [[1.15, 1.5, 1], [9.45, 1.3, -1], [89.9, 1.8, 1]];""")
open(p, 'w').write(s)
print('ok')
