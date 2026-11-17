"""v07 polish: keynote-style word reveals, clean function titles, solid chips, end-logo light sweep."""
p = 'src/film3.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING ' + a[:90]
    s = s.replace(a, b, 1)


rep("  const para = $('#para');", r"""  // split headlines into words, each word rises from its own mask (keynote-style)
  const splitWords = sel => $$(sel).forEach(root => { const walk = n => { [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) { const parts = c.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach(w => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else { const o = document.createElement('span'); o.className = 'wd'; const i = document.createElement('i'); i.textContent = w; o.appendChild(i); frag.appendChild(o); } });
        c.replaceWith(frag); } else if (c.nodeType === 1 && !c.classList.contains('wd')) walk(c); }); }; walk(root); });
  ['#s2 .title', '#s3 .pre', '#s3 .fun', '#st .h2', '#smt', '#q', '#motiv .mtitle', '#s10 .colh', '#s11 .head', '#s12 .tag', '#s12 .thanks', '#s1f .top .ser', '.panel .kick', '.panel .word .big', '#s0 .pres'].forEach(splitWords);
  const para = $('#para');""")

rep("  /* ================= WHITE STUDIO THEME", """  .wd { display: inline-block; overflow: hidden; vertical-align: bottom; padding: 0 .02em .1em; margin: 0 -.02em -.1em; }
  .wd > i { display: inline-block; font-style: inherit; }
  .m { overflow: visible; }
  /* ================= WHITE STUDIO THEME""")

for sel in ["#s0 .pres", "#s1f .top", "#s2 .title", "#s3 .pre", "#s3 .fun", "#st .h2", "#q", "#motiv .mtitle",
            "#s10 .colh", "#s11 .head", "#s12 .tag", "#s12 .thanks", "#smt"]:
    s = s.replace(f"rise('{sel} .m > *',", f"rise('{sel} .wd > i',")

rep("""    rise(`#f${n} .kick .m > *`, at - .05, .8);
    tl.fromTo(`#f${n} .word`, { opacity: 0, y: 40, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .8 }, at);""",
    """    rise(`#f${n} .kick .wd > i`, at - .05, .8, .04);
    rise(`#f${n} .word .wd > i`, at + .05, .95, .07);""")

rep("  #s2 { z-index: 4; }", """  #s2 { z-index: 4; }
  .panel .word .dashed { border: 0; padding: 0; }
  .panel .word .big { font-size: 150px; letter-spacing: -0.05em; }
  .panel .kick { font-size: 52px; color: #86868B; }
  .tagz span, #s11 .chip2 .dashed { border-style: solid; }
  #s12 .logo .ch { background: linear-gradient(100deg, #1D1D1F 40%, #A1A1A6 50%, #1D1D1F 60%); background-size: 320% 100%; background-position: 100% 0; -webkit-background-clip: text; color: transparent; }""")

s = s.replace('<span class="big" style="font-size:118px">Análisis de mercado</span>', '<span class="big" style="font-size:124px">Análisis de mercado</span>')
s = s.replace('<span class="big" style="font-size:118px">Gestión administrativa</span>', '<span class="big" style="font-size:124px">Gestión administrativa</span>')

rep("  rise('#s12 .tag .wd > i',", "  tl.fromTo('#elogo .ch', { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.8, ease: 'tz-cam', stagger: .05 }, V(88.04));\n  rise('#s12 .tag .wd > i',")

open(p, 'w').write(s)
print('ok')
