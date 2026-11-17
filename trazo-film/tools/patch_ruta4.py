"""La Ruta fix 4: framing of functions avenue, title, board; hide duplicate chapter label."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep("  .hud .chap { display: none; }", "  .hud .chap { display: none !important; }")
rep('top:-735px;width:1240px">', 'top:-560px;width:1240px">')
rep("CK.push([f[0] - .05, STOPX[i], -150, .8, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -150, .8, 0]);",
    "CK.push([f[0] - .05, STOPX[i], -122, .8, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -122, .8, 0]);")
rep('<div class="w" id="w3t" style="left:3820px;top:-1300px;width:4400px">', '<div class="w" id="w3t" style="left:3820px;top:-1020px;width:4400px">')
rep('<div class="w board" id="board" style="left:8460px;top:-680px;width:1680px">', '<div class="w board" id="board" style="left:8460px;top:-500px;width:1680px">')
rep("CK.push([46.1, 9300, -170, .97, 0], [48.9, 9300, -170, .95, 0],", "CK.push([46.1, 9300, -60, .9, 0], [48.9, 9300, -60, .88, 0],")
open(p, 'w').write(s)
print('ok')
