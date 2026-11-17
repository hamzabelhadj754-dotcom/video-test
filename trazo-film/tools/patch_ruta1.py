"""La Ruta fix 1: per-frame SVG camera + pinned panels (no giant composited layer), layout fixes."""
p = 'src/film5.html'
s = open(p).read()


def rep(a, b):
    global s
    assert a in s, 'MISSING: ' + a[:90]
    s = s.replace(a, b, 1)


rep("  #world { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }\n  #world > * { position: absolute; }",
    "  #world { position: absolute; inset: 0; }\n  .pin { position: absolute; left: 0; top: 0; transform-origin: 0 0; }\n  .hud .chap { display: none; }")
rep('<svg id="map" width="1" height="1" style="overflow:visible;left:0;top:0">',
    '<svg id="map" width="1920" height="1080" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0"><g id="camg">')
rep('      <g id="stops"></g>\n    </svg>',
    '      <g id="stops"></g>\n      <circle id="rHalo" r="46" fill="#FF5A1F" opacity=".16"/>\n      <circle id="rDot" r="20" fill="#FF5A1F" stroke="#FFFFFF" stroke-width="8"/>\n    </g></svg>')
rep('''    <svg id="riderSvg" width="1" height="1" style="overflow:visible;left:0;top:0">
      <circle id="rHalo" r="46" fill="#FF5A1F" opacity=".16"/>
      <circle id="rDot" r="20" fill="#FF5A1F" stroke="#FFFFFF" stroke-width="8"/>
    </svg>
''', '')
rep("$('#riderSvg').style.visibility = t < 92.3 ? 'visible' : 'hidden';",
    "$('#rDot').style.visibility = $('#rHalo').style.visibility = t < 92.3 ? 'visible' : 'hidden';")

# layout fixes
rep('<div class="w" id="w1" style="left:-1380px;top:-330px;width:1100px">', '<div class="w" id="w1" style="left:-1250px;top:-330px;width:1100px">')
rep('<div class="w" id="w1specs" style="left:-1380px;top:380px;', '<div class="w" id="w1specs" style="left:-1250px;top:380px;')
rep('<div class="w" id="w1p" style="left:-1380px;top:520px;', '<div class="w" id="w1p" style="left:-1250px;top:520px;')
rep('<div class="w" id="w3t" style="left:3400px;top:-1330px;width:4800px">', '<div class="w" id="w3t" style="left:3820px;top:-1300px;width:4400px">')
rep('top:-760px;width:1120px">', 'top:-700px;width:1120px">')
rep("  .row { display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: center; padding: 18px 0;",
    "  .row { display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: center; padding: 14px 0;")
rep('<div style="margin-top:34px" id="fr${i}">', '<div style="margin-top:26px" id="fr${i}">')
rep("FT.forEach((f, i) => { CK.push([f[0] - .05, STOPX[i], -230, .9, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -230, .9, 0]); });",
    "FT.forEach((f, i) => { CK.push([f[0] - .05, STOPX[i], -125, .8, 0]); CK.push([(FT[i + 1] ? FT[i + 1][0] - .9 : 45.1), STOPX[i] + 30, -125, .8, 0]); });")

# pins: each world element gets a wrapper positioned per frame
rep("  // ------------------------------------------------------------------ timeline (content reveals)", """  const PINS = [];
  $$('#world > .w, #world > .medal, #world > .sp, #world > .hub, #fpanels > .w, #orgStations > *').forEach(el => {
    const x = parseFloat(el.style.left), y = parseFloat(el.style.top), pin = document.createElement('div'); pin.className = 'pin';
    el.parentNode.insertBefore(pin, el); pin.appendChild(el); el.style.left = '0px'; el.style.top = '0px'; PINS.push({ pin, x, y }); });

  // ------------------------------------------------------------------ timeline (content reveals)""")
rep("""    world.style.transform = `translate(${960 + dx}px, ${540 + dy}px) rotate(${c.r}deg) scale(${c.s * ds}) translate(${-c.x}px, ${-c.y}px)`;""",
    """    const S = c.s * ds, ox = 960 + dx, oy = 540 + dy;
    $('#camg').setAttribute('transform', `translate(${ox} ${oy}) rotate(${c.r}) scale(${S}) translate(${-c.x} ${-c.y})`);
    for (const P of PINS) { const sx = (P.x - c.x) * S + ox, sy = (P.y - c.y) * S + oy;
      const vis = sx < 2300 && sx + 5000 * S > -300 && sy < 1500 && sy + 2200 * S > -300;
      P.pin.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) P.pin.style.transform = `translate(${ox}px, ${oy}px) rotate(${c.r}deg) scale(${S}) translate(${P.x - c.x}px, ${P.y - c.y}px)`; }""")
open(p, 'w').write(s)
print('ok')
