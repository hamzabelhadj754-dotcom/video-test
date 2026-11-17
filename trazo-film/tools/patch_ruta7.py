"""La Ruta fix 7: hide units until their number rises; SMART title only in wide shots."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep('<div class="lite" style="font-size:44px;padding-bottom:22px">años</div>', '<div class="lite unitA" style="font-size:44px;padding-bottom:22px">años</div>')
rep('<div class="lite" style="font-size:44px;padding-bottom:22px">bicis por flota</div>', '<div class="lite unitB" style="font-size:44px;padding-bottom:22px">bicis por flota</div>')
rep("  rise('#age .m > *', V(8.96) - .2, .9);", "  rise('#age .m > *', V(8.96) - .2, .9);\n  fade('.unitA', V(8.96) + .2, .6, 0, 12);")
rep("  rise('#fleetn .m > *', V(12.34) + .4, .9);", "  rise('#fleetn .m > *', V(12.34) + .4, .9);\n  fade('.unitB', V(12.34) + .8, .6, 0, 12);")
rep("  fade('#acr > span', V(44.16), .6, .07, 16);",
    "  fade('#acr > span', V(44.16), .6, .07, 16);\n  tl.to('#w4t', { opacity: 0, duration: .5, ease: 'tz-in' }, V(45.84) - .6).to('#w4t', { opacity: 1, duration: .8 }, V(56.4) + .4);")
open(p, 'w').write(s)
print('ok')
