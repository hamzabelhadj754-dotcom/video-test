"""Editorial v05: rebuild the 1:09 carry (Supervisión tick → Motivación disc) as ONE screen-space overlay drawn above the
cut, mapped through each scene's own camera, so there is no double disc, no camera jump, no hard ring; smoother exit."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:100])
    s = s.replace(a, b)

# the carry: anticipation pulse on the tick, then one continuous flight + growth (screen space, both cameras), soft halo only
R("""  function carryDisc() { const c = k(T, 67.95, .6, E.io); if (T < 67.95) return; ev('carry', 67.95);
    const draw = () => { const q = k(T, 67.95, .6, E.io), x = lerp(TICK0[0], 960, q), y = lerp(TICK0[1], 690, q) - 140 * Math.sin(Math.PI * q), r = lerp(20, 270, q);
      g.save(); g.globalAlpha *= 1 - q; g.fillStyle = C.blue2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); disc(x, y, r, q);
      if (q < .4) { g.save(); g.globalAlpha *= 1 - q / .4; g.strokeStyle = '#fff'; g.lineWidth = 4 * r / 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 9 * r / 20, y); g.lineTo(x - 2 * r / 20, y + 8 * r / 20); g.lineTo(x + 10 * r / 20, y - 8 * r / 20); g.stroke(); g.restore(); }
      const b = Math.sin(Math.PI * q); if (b > .01) { g.save(); g.globalAlpha *= .7 * b; g.strokeStyle = 'rgba(170,200,255,.9)'; g.lineWidth = 3; g.shadowColor = 'rgba(90,150,255,1)'; g.shadowBlur = 40; g.beginPath(); g.arc(x, y, r * 1.08, 0, 7); g.stroke(); g.restore(); } };
    c < 1 ? motion(draw) : draw(); }""",
"""  const CARRY = [67.75, 68.8];                       // overlay window: tick lifts at 67.75, lands as the stage at 68.8
  const camPt = (name, t, x, y) => { const sc0 = SC.find(q => q.name === name), lt = (t - sc0.t0) / (sc0.t1 - sc0.t0), sc = 1.006 + .025 * lt;
    return [960 + sc * (x - 960 + 4 * Math.sin(t * .5)), 540 + sc * (y - 540 + 3 * Math.cos(t * .4)), sc]; };
  const discR = t => 270 * (1 + .015 * Math.sin(t * 2));
  function carryOverlay(t) { if (t < CARRY[0] || t >= CARRY[1]) return; ev('carry', CARRY[0]); const og = g; g = main;
    const draw = () => { const q = k(T, CARRY[0] + .1, CARRY[1] - CARRY[0] - .1, E.io), pre = Math.max(0, spring(CARRY[0], 1.8, 7)) * (1 - q);
      const A = camPt('09 Supervisión', T, TICK0[0], TICK0[1]), B = camPt('10 Motivación', T, 960, 690), u = E.soft(q);
      const x = lerp(A[0], B[0], q), y = lerp(A[1], B[1], q) - 120 * Math.sin(Math.PI * q), r = lerp(20 * A[2] * (1 + .25 * Math.sin(Math.PI * clamp((T - CARRY[0]) / .25))), discR(T) * B[2], u);
      const halo = Math.sin(Math.PI * q); if (halo > .01) { g.save(); const gr = g.createRadialGradient(x, y, r * .8, x, y, r * 1.6); gr.addColorStop(0, `rgba(80,140,255,${(.35 * halo).toFixed(3)})`); gr.addColorStop(1, 'rgba(80,140,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.6, 0, 7); g.fill(); g.restore(); }
      g.save(); g.globalAlpha *= 1 - u; g.fillStyle = C.blue2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); disc(x, y, r, u);
      if (q < .35) { const z = r / 20; g.save(); g.globalAlpha *= 1 - q / .35; g.strokeStyle = '#fff'; g.lineWidth = 4 * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - 9 * z, y); g.lineTo(x - 2 * z, y + 8 * z); g.lineTo(x + 10 * z, y - 8 * z); g.stroke(); g.restore(); }
      void pre; };
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; motion(draw); g = og; }""")

# Supervisión: calmer, longer exit; leaves fade with it; the tick is handed to the overlay; no in-scene carry
R("    const ex = k(t, 67.85, .5, E.in);", "    const ex = k(t, 67.7, .8, E.io);")
R("    leaves(t, 'navy', ['tl', 'br'], 61.0); navyChrome(t, 61.0, 1 - ex);", "    g.save(); g.globalAlpha = 1 - ex; leaves(t, 'navy', ['tl', 'br'], 61.0); g.restore(); navyChrome(t, 61.0, 1 - ex);")
R("if (ck > 0 && !(i === 2 && t >= 67.95))", "if (ck > 0 && !(i === 2 && t >= CARRY[0]))")
R("""    carryDisc();
  });""", """  });""")
# Motivación: no disc until the overlay lands on it; cyclist resolves right after
R("""    if (t < 68.55) carryDisc(); else disc(960, 690, 270 * (1 + .015 * Math.sin(t * 2)));
    ghost(IMG.cyclistCool, 960, 905, 400, 68.62, { dx: -60 });""",
  """    if (t >= CARRY[1]) disc(960, 690, discR(t));
    ghost(IMG.cyclistCool, 960, 905, 400, CARRY[1] - .02, { dx: -60 });""")
R("68.4: ['match', .1]", "68.4: ['match', .2]")
# overlay drawn above whatever is on screen (scene or transition)
R("""    if (!done) drawScene(s, t, main);""", """    if (!done) drawScene(s, t, main);
    carryOverlay(t);""")
open(p, 'w').write(s)
print('ok')
