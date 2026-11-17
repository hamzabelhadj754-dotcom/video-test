"""La Ruta fix 3: radius-based pops for SVG dots, bigger function panels, better stop framing."""
import re
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


# dots remember their radius; pop animates r instead of a transform (no drift)
rep('const dot = (x, y, r = 24, cls = \'\') => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"',
    'const dot = (x, y, r = 24, cls = \'\') => `<circle class="${cls}" data-r="${r}" cx="${x}" cy="${y}" r="${r}"')
rep('<circle class="os os${o.id}" cx="${s[0]}" cy="${s[1]}" r="24"', '<circle class="os os${o.id}" data-r="24" cx="${s[0]}" cy="${s[1]}" r="24"')
rep("  const pop = (sel, at, st = .06) => tl.fromTo(sel, { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, { scale: 1, duration: .55, ease: 'back.out(2.4)', stagger: st }, at);",
    "  const pop = (sel, at, st = .06) => tl.fromTo(sel, { attr: { r: 0 } }, { attr: { r: (i, el) => +el.dataset.r }, duration: .55, ease: 'back.out(2.4)', stagger: st }, at);")

# bigger function panels
rep('<div class="lite" style="font-size:44px" id="fk${i}">', '<div class="lite" style="font-size:54px" id="fk${i}">')
rep('<span class="plate" style="font-size:${f[1].length > 14 ? 54 : 64}px;padding:16px 34px 16px 18px" id="fpl${i}"><span class="bul" style="width:64px;height:64px;font-size:26px">',
    '<span class="plate" style="font-size:${f[1].length > 14 ? 68 : 80}px;padding:18px 40px 18px 20px;border-radius:20px" id="fpl${i}"><span class="bul" style="width:78px;height:78px;font-size:30px">')
rep('top:-700px;width:1120px">', 'top:-735px;width:1240px">')
rep('<div class="w fp" id="fp${i}" style="left:${STOPX[i] - 560}px;', '<div class="w fp" id="fp${i}" style="left:${STOPX[i] - 620}px;')
rep("${f[3].map(r => `<div class=\"row\"><div class=\"ic\">${KIT.icon(r[0], '#FF5A1F', 30, 1.9)}</div><div><b>${r[1]}</b><small>${r[2]}</small></div></div>`).join('')}",
    "${f[3].map(r => `<div class=\"row fr\"><div class=\"ic\">${KIT.icon(r[0], '#FF5A1F', 36, 1.9)}</div><div><b>${r[1]}</b><small>${r[2]}</small></div></div>`).join('')}")
rep("  .row:last-child { border-bottom: 1.5px solid #E6E5E0; }",
    "  .row:last-child { border-bottom: 1.5px solid #E6E5E0; }\n  .row.fr { grid-template-columns: 78px 1fr; gap: 24px; padding: 16px 0; }\n  .row.fr .ic { width: 78px; height: 78px; }\n  .row.fr b { font-size: 40px; } .row.fr small { font-size: 25px; }")
rep("CK.push([f[0] - .05, STOPX[i], -125, .8, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -125, .8, 0]);",
    "CK.push([f[0] - .05, STOPX[i], -150, .8, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -150, .8, 0]);")
open(p, 'w').write(s)
print('ok')
