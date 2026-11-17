"""La Ruta fix 6: supervision label layout, org title framing, clean metro-map overview for the end card."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep('<div class="w" id="sv1" style="left:14260px;top:-1240px;width:680px;text-align:center">',
    '<div class="w" id="sv1" style="left:14680px;top:-1080px;width:760px">')
rep('<div class="w" id="sv2" style="left:13300px;top:100px;width:760px;text-align:right">',
    '<div class="w" id="sv2" style="left:13230px;top:20px;width:780px;text-align:right">')
rep('<div class="w" id="sv3" style="left:14280px;top:230px;width:680px;text-align:center">',
    '<div class="w" id="sv3" style="left:14680px;top:130px;width:760px">')
rep("[64.3, 14280, -480, .66, 0], [V(64.8), 14300, -480, .66, 0],", "[64.3, 14330, -440, .55, 0], [V(64.8), 14350, -440, .55, 0],")
# previous chapter's objectives lift away when supervision starts
rep("  // 05 supervisión", "  tl.to(['#ob1', '#ob2', '#ob3', '#w4t'], { opacity: 0, duration: .6, ease: 'tz-in' }, 63.3);\n  // 05 supervisión")
# org title inside frame
rep('<div class="w" id="w7t" style="left:18960px;top:-1500px;width:2200px">', '<div class="w" id="w7t" style="left:18960px;top:-1260px;width:2200px">')
rep("[85.0, 20400, -470, .6, 0], [91.4, 20450, -470, .6, 0],", "[85.0, 20400, -500, .6, 0], [91.4, 20450, -500, .6, 0],")
# end: text labels fade, camera pulls back to the whole journey as a clean metro map
rep("[92.6, 9800, -150, .074, 0], [99, 9800, -150, .072, 0]);", "[93.4, 9900, -2242, .074, 0], [99, 9900, -2242, .072, 0]);")
rep("  // end card", "  tl.to('.pin', { opacity: 0, duration: .6, ease: 'tz-in' }, 91.6);\n  // end card")
rep("  #endc .logo { position: absolute; left: 0; right: 0; top: 230px;", "  #endc .logo { position: absolute; left: 0; right: 0; top: 210px;")
rep("  #endc .tag { position: absolute; left: 0; right: 0; top: 470px;", "  #endc .tag { position: absolute; left: 0; right: 0; top: 448px;")
rep("  #endc .thx { position: absolute; left: 0; right: 0; bottom: 150px;", "  #endc .thx { position: absolute; left: 0; right: 0; bottom: 136px;")
open(p, 'w').write(s)
print('ok')
