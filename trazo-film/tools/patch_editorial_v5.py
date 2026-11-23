"""Editorial v05 (final polish): sub-frame sampled motion blur on push transitions (no stepped copies), longer pushes,
no warm leak over navy (cool leaks only), calmer springs/pills/typing, shorter natural shutter on element motion blur."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:100])
    s = s.replace(a, b)

# push: equal-weight samples across a 180° shutter, spacing <= 1.5 px
R("""      const [dx, dy, sA] = ex, L = dx ? W : H, off = e * L, vel = L * (E.io(clamp(p + .03)) - E.io(clamp(p - .03))) / .06 / (2 * hl * 60) * 1.4;
      cC.setTransform(1, 0, 0, 1, 0, 0); cC.globalAlpha = 1; cC.fillStyle = '#03050A'; cC.fillRect(0, 0, W, H);
      cC.save(); cC.translate(dx * off, dy * off); const s = lerp(1, sA, e); cC.translate(960, 540); cC.scale(s, s); cC.translate(-960, -540); cC.drawImage(bufA, 0, 0); cC.restore();
      cC.drawImage(bufB, dx * (off - L), dy * (off - L));
      smear(m, bufC, dx * vel, dy * vel, 12);""",
"""      const [dx, dy, sA] = ex, L = dx ? W : H, dp = (.5 / 60) / (2 * hl), pa = clamp(p - dp / 2), pb = clamp(p + dp / 2);
      const travel = Math.abs(E.io(pb) - E.io(pa)) * L, n = Math.max(1, Math.min(48, Math.ceil(travel / 1.5)));
      const comp = (ctx, q, a) => { const e2 = E.io(q), off = e2 * L, s2 = lerp(1, sA, e2); ctx.globalAlpha = a;
        if (sA < 1) { ctx.fillStyle = '#03050A'; ctx.fillRect(0, 0, W, H); }
        ctx.save(); ctx.translate(dx * off, dy * off); ctx.translate(960, 540); ctx.scale(s2, s2); ctx.translate(-960, -540); ctx.drawImage(bufA, 0, 0); ctx.restore();
        ctx.drawImage(bufB, dx * (off - L), dy * (off - L)); };
      // A and B tile the frame, so each sample is an opaque full frame: running average with alpha 1/(j+1) is exact
      for (let j = 0; j < n; j++) comp(m, n === 1 ? p : lerp(pa, pb, j / (n - 1)), 1 / (j + 1));
      m.globalAlpha = 1;""")
R("""  // smear a buffer along a direction (directional motion blur), velocity in px
  function smear(ctx, buf, dx, dy, n = 10) {
    if (Math.hypot(dx, dy) < 1.5) { ctx.drawImage(buf, 0, 0); return; }
    for (let j = 0; j < n; j++) { const f = j / (n - 1) - .5; ctx.globalAlpha = 1 / (j + 1); ctx.drawImage(buf, dx * f, dy * f); }
    ctx.globalAlpha = 1;
  }
""", "")
# longer, gentler pushes
R("3.25: ['push', .38, [0, -1, 1]], 9.75: ['push', .38, [0, -1, 1]]", "3.25: ['push', .5, [0, -1, 1]], 9.75: ['push', .5, [0, -1, 1]]")
R("35.55: ['push', .4, [0, -1, .86]], 41.1: ['push', .32, [-1, 0, 1]]", "35.55: ['push', .5, [0, -1, .86]], 41.1: ['push', .42, [-1, 0, 1]]")
R("60.95: ['push', .38, [0, 1, 1]]", "60.95: ['push', .5, [0, 1, 1]]")
# leaks: drop the one over the navy push, cool light instead of warm
R("const LEAKS = [[1.15, 1.5, 1], [9.45, 1.3, -1], [89.9, 1.8, 1]];", "const LEAKS = [[1.15, 1.5, 1], [89.9, 1.8, 1]];")
R("gr.addColorStop(0, `rgba(255,196,150,${(.32 * a).toFixed(3)})`); gr.addColorStop(.5, `rgba(255,140,90,${(.12 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,60,0)');",
  "gr.addColorStop(0, `rgba(205,225,255,${(.26 * a).toFixed(3)})`); gr.addColorStop(.5, `rgba(120,165,255,${(.1 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(90,140,255,0)');")
R("gr.addColorStop(0, 'rgba(255,220,190,0)'); gr.addColorStop(.5, `rgba(255,220,190,${(.1 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,190,0)');",
  "gr.addColorStop(0, 'rgba(215,230,255,0)'); gr.addColorStop(.5, `rgba(215,230,255,${(.08 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(215,230,255,0)');")
# calmer motion everywhere
R("const spring = (t0, f = 1.5, d = 6.5) => { const x = T - t0; return x <= 0 ? 0 : 1 - Math.exp(-x * d) * Math.cos(x * 2 * Math.PI * f); };",
  "const spring = (t0, f = 1.5, d = 6.5) => { const x = T - t0; return x <= 0 ? 0 : 1 - Math.exp(-x * d * 1.22) * Math.cos(x * 2 * Math.PI * f); };")
R("function motion(fn, n = 5, sh = .03) {", "function motion(fn, n = 8, sh = .012) {")
for _ in range(0):
    pass
s = s.replace("(s, '.motion')", "")
# every explicit motion(draw, 5, .03x) call → natural shutter
import re
s, nm = re.subn(r"motion\((\w+), 5, \.0\d+\)", r"motion(\1)", s)
print('motion calls normalised:', nm)
R("let st = 0; while (st < n && T - (t0 + st / cps) >= .16) st++;", "let st = 0; while (st < n && T - (t0 + st / cps) >= .2) st++;")
R("const p = clamp((T - (t0 + i / cps)) / .16), cx = X + measure(s.slice(0, i), fo), cw = measure(ch, fo);", "const p = clamp((T - (t0 + i / cps)) / .2), cx = X + measure(s.slice(0, i), fo), cw = measure(ch, fo);")
R("const sc = 1 + .4 * (1 - E.out(p)), py = y - size * .35;", "const sc = 1 + .18 * (1 - E.out(p)), py = y - size * .35;")
R("if (p < 1) g.filter = `blur(${(5 * (1 - p)).toFixed(1)}px)`; txt(ch, cx, y, fo); g.restore(); }", "if (p < 1) g.filter = `blur(${(3 * (1 - p)).toFixed(1)}px)`; txt(ch, cx, y, fo); g.restore(); }")
R("const E = { out:", "const backS = t => { const c1 = .9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };\n  const E = { backS: t => backS(t), out:")
R("const ww = h + (w - h) * Math.max(0, E.back(p)), X =", "const ww = h + (w - h) * Math.max(0, E.backS(p)), X =")
R("q = i < 0 ? 1 : E.back(clamp((T - list[i][1]) / .5));", "q = i < 0 ? 1 : E.backS(clamp((T - list[i][1]) / .5));")
R("let ww = lerp(wOf(i - 1), wOf(i), q); ww = h + (ww - h) * Math.max(0, E.back(p));", "let ww = lerp(wOf(i - 1), wOf(i), q); ww = h + (ww - h) * Math.max(0, E.backS(p));")
R("const x = x0 + 26 * Math.sin(t * sp + ph), y = y0 + 20 * Math.cos(t * sp * .8 + ph);", "const x = x0 + 24 * Math.sin(t * sp * .6 + ph), y = y0 + 18 * Math.cos(t * sp * .5 + ph);")
open(p, 'w').write(s)
print('ok')
