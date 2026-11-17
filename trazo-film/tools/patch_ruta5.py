"""La Ruta fix 5: compositor safety (pins as own layers, display:none offscreen), '4 funciones' exits before the avenue."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep("  .pin { position: absolute; left: 0; top: 0; transform-origin: 0 0; }",
    "  .pin { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }")
rep("      P.pin.style.visibility = vis ? 'visible' : 'hidden';",
    "      P.pin.style.display = vis ? 'block' : 'none';")
# "4 funciones" title lifts away as the camera travels to the first function
rep("  const FT = [[V(18.64)", "  tl.to('#w3t', { opacity: 0, y: -120, duration: .7, ease: 'tz-in' }, V(18.64) - 1.0);\n  const FT = [[V(18.64)")
open(p, 'w').write(s)
print('ok')
