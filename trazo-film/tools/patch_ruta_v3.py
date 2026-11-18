"""La Ruta v03: cinematic camera (holds + van Wijk-Nuij zoom moves), rider sync, supersampled canvas,
constant line weights, unified motion language, station exits, clean board."""
import re
p = 'src/film6.html'
s = open(p).read()


def rep(a, b, n=1):
    global s
    assert a in s, 'MISSING: ' + a[:100]
    s = s.replace(a, b, n)


# ---------------------------------------------------------------- 1. camera: holds + smooth-zoom moves
a = s.index('  // camera keys: [time, x, y, scale, rotationDeg]')
b = s.index('  // rider keys: [time, L]')
s = s[:a] + r'''  // shot list: holds [t0, t1, x0, y0, s0, x1, y1, s1, rotDeg]; the camera never stops inside a hold (slow dolly + drift)
  const HOLDS = [
    [0, 2.7, -1700, 60, 1.18, -1690, 60, 1.13, 0],
    [4.3, 9.0, -140, 40, .78, -60, 40, .765, 0],
    [10.5, V(12.34) - 1.1, 2120, -380, .9, 2150, -350, .92, -1.2],
    [V(12.34) + .2, V(14.6), 2120, 860, .9, 2150, 850, .92, 1.2],
    [V(15.2) - .3, V(18.64) - 1.0, 5650, -260, .43, 5700, -255, .44, 0],
  ];
  FT.forEach((f, i) => HOLDS.push([f[0] - .05, FT[i + 1] ? FT[i + 1][0] - .9 : 45.1, STOPX[i], -122, .8, STOPX[i] + 34, -122, .82, 0]));
  HOLDS.push(
    [46.1, 48.9, 9300, -60, .9, 9330, -60, .92, 0],
    [50.0, 51.2, 10500, -420, .74, 10560, -420, .75, 0],
    [V(45.84) + .2, V(50.82) - .9, 10900, -230, .9, 10950, -232, .92, -1.6],
    [V(50.82) + .2, V(54.14) - .9, 12110, -470, .9, 12160, -472, .92, -2],
    [V(54.14) + .2, 61.9, 13300, -800, .88, 13330, -800, .9, -2.4],
    [62.9, 63.5, 11850, -400, .47, 11900, -410, .475, 0],
    [64.5, V(64.8), 14330, -440, .55, 14370, -440, .565, 0],
    [V(65.1) + .6, 75.3, 16120, -760, .82, 16190, -760, .84, 0],
    [76.4, 83.9, 17900, -860, .8, 17930, -860, .82, 0],
    [85.0, 91.4, 20400, -500, .6, 20460, -500, .615, 0],
    [93.4, 99, 9900, -2242, .074, 9900, -2242, .0725, 0]);
  HOLDS.sort((a, b) => a[0] - b[0]);
  // van Wijk & Nuij optimal pan+zoom path (same maths as d3.interpolateZoom); views are [cx, cy, worldWidthVisible]
  const RHO = 1.35, R2 = RHO * RHO, R4 = R2 * R2;
  const zoomPath = (p0, p1) => { const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1, dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-6) { const S = Math.log(w1 / w0) / RHO; return t => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(RHO * t * S)]; }
    const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + R4 * d2) / (2 * w0 * R2 * d1), b1 = (w1 * w1 - w0 * w0 - R4 * d2) / (2 * w1 * R2 * d1),
      r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), S = (r1 - r0) / RHO;
    return t => { const sv = t * S, c0 = Math.cosh(r0), u = w0 / (R2 * d1) * (c0 * Math.tanh(RHO * sv + r0) - Math.sinh(r0)); return [ux0 + u * dx, uy0 + u * dy, w0 * c0 / Math.cosh(RHO * sv + r0)]; }; };
  const MOVES = [];
  for (let i = 0; i < HOLDS.length - 1; i++) { const A0 = HOLDS[i], B0 = HOLDS[i + 1];
    MOVES.push({ t0: A0[1], t1: B0[0], r0: A0[8], r1: B0[8], f: zoomPath([A0[5], A0[6], 1920 / A0[7]], [B0[2], B0[3], 1920 / B0[4]]), dist: Math.hypot(B0[2] - A0[5], B0[3] - A0[6]) }); }
  window.MOVES = MOVES.map(m => [m.t0, m.t1, m.dist]);
  window.HOLDS = HOLDS.map(h => [h[0], h[1]]);
  const camAt = t => {
    for (const h of HOLDS) if (t >= h[0] && t <= h[1]) { const k = (t - h[0]) / Math.max(1e-6, h[1] - h[0]);
      return { x: h[2] + (h[5] - h[2]) * k, y: h[3] + (h[6] - h[3]) * k, s: Math.exp(Math.log(h[4]) + (Math.log(h[7]) - Math.log(h[4])) * k), r: h[8] }; }
    for (const m of MOVES) if (t > m.t0 && t < m.t1) { const k = E.cam((t - m.t0) / (m.t1 - m.t0)), [x, y, w] = m.f(k); return { x, y, s: 1920 / w, r: m.r0 + (m.r1 - m.r0) * k }; }
    const h = HOLDS[HOLDS.length - 1]; return { x: h[5], y: h[6], s: h[7], r: h[8] }; };
''' + s[b:]

# ---------------------------------------------------------------- 2. rider: one straight travel to each station, arrivals synced with the camera
rep("const RK = [[0, 0], [2.7, 0], [4.6, Lat(-300, 300)], [9.1, Lat(-300, 300)], [10.9, Lat(2100, -100)], [V(14.6), Lat(2100, -100)], [V(16.2), Lat(3000, 300)]];",
    "const RK = [[0, 0], [2.7, 0], [4.3, Lat(-300, 300)], [9.0, Lat(-300, 300)], [10.5, Lat(2100, -100)], [V(14.6), Lat(2100, -100)]];")
rep("const riderL = t => { let i = 0; while (i < RK.length - 2 && t >= RK[i + 1][0]) i++; const a = RK[i], b = RK[i + 1]; const k = b[0] === a[0] ? 1 : E.cam(clamp((t - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * k; };",
    "const riderL = t => { let i = 0; while (i < RK.length - 2 && t >= RK[i + 1][0]) i++; const a = RK[i], b = RK[i + 1]; const k = b[0] === a[0] ? 1 : E.cam(clamp((t - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * k; };\n"
    "  const ARRIVE = []; for (let i = 1; i < RK.length; i++) if (RK[i][1] !== RK[i - 1][1] && (!RK[i + 1] || Math.abs(RK[i + 1][1] - RK[i][1]) < 1)) ARRIVE.push(RK[i][0]);")

# ---------------------------------------------------------------- 3. supersampled canvas + 4. constant line weights + cleaner city
CS = "const CSS_ = Number(new URLSearchParams(location.search).get('cs') || 2);"
rep('<canvas id="bgc" width="1920" height="1080" style="position:absolute;left:0;top:0"></canvas>',
    '<canvas id="bgc" width="3840" height="2160" style="position:absolute;left:0;top:0;width:1920px;height:1080px"></canvas>')
rep("  const bg = $('#bgc').getContext('2d');", "  " + CS + "\n  $('#bgc').width = 1920 * CSS_; $('#bgc').height = 1080 * CSS_;\n  const bg = $('#bgc').getContext('2d');\n  let curS = 1, riderX = -1e9;")
rep("const g = bg; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#F7F6F2'; g.fillRect(0, 0, 1920, 1080);",
    "const g = bg; curS = S; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#F7F6F2'; g.fillRect(0, 0, 1920 * CSS_, 1080 * CSS_);")
rep("g.setTransform(co, si, -si, co, ox, oy); g.translate(-c.x, -c.y);", "g.setTransform(co * CSS_, si * CSS_, -si * CSS_, co * CSS_, ox * CSS_, oy * CSS_); g.translate(-c.x, -c.y);")
rep("g.strokeStyle = '#E8EBE2'; g.lineWidth = 420;", "g.strokeStyle = '#EAECE4'; g.lineWidth = 420;")
rep("grid(280, 5, '#EFEEE9', 140); grid(560, 10, '#ECEBE5', 140);", "grid(560, Math.max(6, 1.6 / S), '#EEEDE8', 140);")
rep("g.strokeStyle = '#EFEEE9'; g.lineWidth = 6; g.beginPath();", "g.strokeStyle = '#F0EFEA'; g.lineWidth = Math.max(5, 1.2 / S); g.beginPath();")
# screen-consistent weights: world width w -> screen w*0.8*(S/0.8)^0.25
rep("  function paint(el) {", "  const W_ = w => w * .8 * Math.pow(curS / .8, .25) / curS;\n  function paint(el) {")
rep("else { const r = +A_(n, 'r', 0); if (r <= 0.01) continue; path = new Path2D(); path.arc(+n.getAttribute('cx'), +n.getAttribute('cy'), r, 0, Math.PI * 2); }",
    "else { const r = +A_(n, 'r', 0); if (r <= 0.01) continue; path = new Path2D(); path.arc(+n.getAttribute('cx'), +n.getAttribute('cy'), W_(r), 0, Math.PI * 2); }")
rep("if (fill !== 'none') { bg.fillStyle = fill.startsWith('url(') ? hatchP : fill; bg.fill(path); }",
    "if (fill !== 'none') { if (fill.startsWith('url(')) { const gr = bg.createLinearGradient(0, -450, 0, 300); gr.addColorStop(0, 'rgba(255,90,31,.10)'); gr.addColorStop(1, 'rgba(255,90,31,0)');\n          bg.save(); bg.beginPath(); bg.rect(-1e5, -1e5, riderX + 1e5, 2e5); bg.clip(); bg.fillStyle = gr; bg.fill(path); bg.restore(); } else { bg.fillStyle = fill; bg.fill(path); } }")
rep("bg.strokeStyle = stroke; bg.lineWidth = +A_(n, 'stroke-width', A_(parent, 'stroke-width', 1));",
    "bg.strokeStyle = stroke; const lw0 = +A_(n, 'stroke-width', A_(parent, 'stroke-width', 1)); bg.lineWidth = tag === 'circle' || lw0 < 30 ? W_(lw0) : lw0;")
rep("        bg.stroke(path); bg.setLineDash([]);",
    "        bg.stroke(path);\n        if (n.id === 'run' || n.id === 'lowerRun') { bg.strokeStyle = 'rgba(255,255,255,.22)'; bg.lineWidth = W_(lw0) * .28; bg.stroke(path); }\n        bg.setLineDash([]);")
s = s.replace('stroke="#D9D8D2"', 'stroke="#DEDDD7"')

# ---------------------------------------------------------------- rider halo: arrival ring instead of constant pulse
rep('<circle id="rHalo" r="46" fill="#FF5A1F" opacity=".16"/>', '<circle id="rRing" r="40" fill="none" stroke="#FF5A1F" stroke-width="4" opacity="0"/>\n      <circle id="rHalo" r="40" fill="#FF5A1F" opacity=".14"/>')
rep("""    const pulse = 1 + .12 * Math.sin(t * 5);
    $('#rHalo').setAttribute('cx', p.x); $('#rHalo').setAttribute('cy', p.y); $('#rHalo').setAttribute('r', 46 * pulse);
    $('#rDot').style.visibility = $('#rHalo').style.visibility = t < 92.3 ? 'visible' : 'hidden';""",
    """    riderX = p.x;
    $('#rHalo').setAttribute('cx', p.x); $('#rHalo').setAttribute('cy', p.y);
    { let last = -9; for (const a of ARRIVE) if (a <= t) last = a; const u = clamp((t - last) / .9);
      $('#rRing').setAttribute('cx', p.x); $('#rRing').setAttribute('cy', p.y); $('#rRing').setAttribute('r', 40 + 70 * E.out(u)); $('#rRing').setAttribute('opacity', u < 1 ? .45 * (1 - u) : 0); }
    $('#rDot').style.visibility = $('#rHalo').style.visibility = $('#rRing').style.visibility = t < 92.3 ? 'visible' : 'hidden';""")
# tripod-dolly drift
rep("dx = 6 * Math.sin(t * .6) + 2 * Math.sin(t * 1.7), dy = 4 * Math.sin(t * .8 + 1), ds = 1 + .006 * Math.sin(t * .35);",
    "dx = 3 * Math.sin(t * .6) + 1 * Math.sin(t * 1.7), dy = 2 * Math.sin(t * .8 + 1), ds = 1 + .003 * Math.sin(t * .35);")

# ---------------------------------------------------------------- 5. one motion language
rep("  const pop = (sel, at, st = .06) => tl.fromTo(sel, { attr: { r: 0 } }, { attr: { r: (i, el) => +el.dataset.r }, duration: .55, ease: 'back.out(2.4)', stagger: st }, at);",
    "  const pop = (sel, at, st = .08) => tl.fromTo(sel, { attr: { r: 0 } }, { attr: { r: (i, el) => +el.dataset.r }, duration: .7, ease: 'tz-out', stagger: st }, at);\n"
    "  const leave = (sel, at) => tl.to(sel, { opacity: 0, y: -20, duration: .45, ease: 'tz-in' }, at);")
s = re.sub(r"ease: 'back\.out\([0-9.]+\)'", "ease: 'tz-out'", s)
s = s.replace("{ opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .45, stagger: .05, ease: 'tz-out' }", "{ opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .6, stagger: .04, ease: 'tz-out' }")
s = s.replace("{ opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .7, ease: 'tz-out' }", "{ opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, ease: 'tz-out' }")
s = s.replace("{ scale: 0 }, { scale: 1, duration: .7, ease: 'tz-out' }", "{ scale: .82, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: 'tz-out' }")
s = s.replace("tl.fromTo('#hubl', { opacity: 0, scale: .7 }, { opacity: 1, scale: 1, duration: .8, ease: 'tz-out' }, 84.9);", "tl.fromTo('#hubl', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .8, ease: 'tz-out' }, 84.9);")

# board: mask reveal + 12 Hz flaps settling left to right
rep("  fade('#board', 45.75, .8, 0, 40);", "  tl.fromTo('#board', { clipPath: 'inset(0 0 100% 0 round 26px)', y: 24 }, { clipPath: 'inset(0 0 0% 0 round 26px)', y: 0, duration: .9 }, 45.7);")
rep("  FLAPS.forEach((f, k) => { f.t = 46.3 + f.i * .32 + (k % 45) * .012; });",
    "  { const col = {}; FLAPS.forEach(f => { col[f.i] = (col[f.i] || 0) + 1; f.t = 46.25 + f.i * .26 + col[f.i] * .022; }); }")
rep("if (t > 45.5 && t < 50) { const f = Math.floor(t * 30);", "if (t > 45.5 && t < 50) { const f = Math.floor(t * 12);")

# station exits: each idea leaves as the camera leaves it
rep("  // end card", """  // station exits
  leave(['#w0'], 2.55);
  leave(['#w1', '#herobike', '#w1specs', '#w1p'], 8.9);
  leave(['#w2a'], V(12.34) - 1.2);
  leave(['#w2b', '#w2t'], V(14.6) - .1);
  FT.forEach((f, i) => leave([`#fp${i}`], FT[i + 1] ? FT[i + 1][0] - 1.0 : 45.0));
  leave(['#board'], 48.8);
  leave(['#w5t', '#sv1', '#sv2', '#sv3'], V(64.8) - .1);
  leave(['#w5m', '#md1', '#md2', '#md3'], 75.2);
  leave(['#w6l', '#w6r', '#fx1', '#fx2', '#fx3', '#fx4'], 83.8);
  // end card""")
open(p, 'w').write(s)
print('ok')
