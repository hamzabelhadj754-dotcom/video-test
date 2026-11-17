"""v08 (Phase A + B): white cyclorama set, one UI system, device mockups, feature tiles with icons, CRM pipeline.
Reads src/film3.html, writes src/film4.html."""
import re

s = open('src/film3.html').read()


def rep(a, b, count=1):
    global s
    assert a in s, 'MISSING: ' + a[:100]
    s = s.replace(a, b, count)


# ------------------------------------------------------------------ A. cyclorama set
a = s.index('  function drawBG(t, d) {')
b = s.index('  // foreground:')
s = s[:a] + '''  function drawBG(t, d) {
    // infinite white cyclorama: lit wall, soft cove, floor that falls off toward the lens
    const g = bg, W = 1920, H = 1080, P = pal(t), hy = 700 + d.y * .3;
    g.globalCompositeOperation = 'source-over';
    let gr = g.createLinearGradient(0, 0, 0, hy); gr.addColorStop(0, '#EAEAE7'); gr.addColorStop(1, '#F8F8F6');
    g.fillStyle = gr; g.fillRect(0, 0, W, hy + 1);
    gr = g.createLinearGradient(0, hy, 0, H); gr.addColorStop(0, '#F7F7F5'); gr.addColorStop(.55, '#EFEFEC'); gr.addColorStop(1, '#E1E1DD');
    g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
    // the cove: no visible seam, just a soft brighter band where wall turns into floor
    gr = g.createLinearGradient(0, hy - 140, 0, hy + 120); gr.addColorStop(0, 'rgba(250,250,248,0)'); gr.addColorStop(.55, 'rgba(250,250,248,.95)'); gr.addColorStop(1, 'rgba(250,250,248,0)');
    g.fillStyle = gr; g.fillRect(0, hy - 140, W, 260);
    // big softbox key from top-left, slow drift
    const kx = 520 + 160 * Math.sin(t * .05) + d.x * 1.5;
    gr = g.createRadialGradient(kx, -120, 0, kx, -120, 1500); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // fill bounce from the right
    gr = g.createRadialGradient(1760, 360, 0, 1760, 360, 900); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // a whisper of brand warmth on the floor (chapter tint)
    gr = g.createRadialGradient(1240, 1160, 0, 1240, 1160, 820); gr.addColorStop(0, rgba(P.w, .055 * P.s)); gr.addColorStop(1, rgba(P.w, 0));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
''' + s[b:]

# ------------------------------------------------------------------ B. markup: phone, windows, CRM pipeline
rep('<div class="obj" id="o1" style="left:1110px;top:110px">\n          <div class="sc">',
    '<div class="obj" id="o1" style="left:1250px;top:118px">\n          <div class="phone"><div class="island"></div>\n          <div class="sc"><div class="status"><span>10:24</span><span class="sig"><i></i><i></i><i></i><i></i>&nbsp;5G</span></div>')
rep('''            <div class="sheen"></div>
          </div>
          <div class="cursor" id="cur1" style="left:40px;top:640px"></div>''',
    '''            <div class="nxt"><div class="nh"><i></i><b>trazo.vlc</b><small>Patrocinado</small></div><div class="ni"></div></div>
            <div class="sheen"></div>
          </div></div>
          <div class="cshadow" style="left:70px;top:806px;width:310px"></div>
          <div class="cursor" id="cur1" style="left:66px;top:538px"></div>''')

rep('<div class="obj card glass db" id="o3" style="left:1030px;top:180px">',
    '<div class="obj card glass db win" id="o3" style="left:1010px;top:170px">\n          <div class="winbar"><i></i><i></i><i></i><span>TRAZO CRM — Análisis de mercado</span></div>')

a = s.index('        <div class="obj" id="o4"')
b = s.index('      </div>\n    </div>\n  </div></section>', a)
s = s[:a] + '''        <div class="obj card glass win" id="o4" style="left:1010px;top:170px;width:800px">
          <div class="winbar"><i></i><i></i><i></i><span>TRAZO CRM — Pedido #0412</span></div>
          <div class="hdr"><div class="av">LG</div><div><b>Laura G.</b><small>TRAZO City · M &nbsp;+&nbsp; casco y candado</small></div><div class="tot num">1.349 €</div></div>
          <div class="steps2"><div class="rail"><s id="crmrail"></s></div>
            <div class="st2" id="d1"><span class="dot"></span><div><b>Pedido confirmado</b><small>#0412 · registrado en el CRM</small></div><span class="tg">CRM</span></div>
            <div class="st2" id="d2"><span class="dot"></span><div><b>Factura emitida</b><small>F-2026-0412 · base 1.114,88 € + IVA 21 %</small></div><span class="tg">PDF</span></div>
            <div class="st2" id="d3"><span class="dot"></span><div><b>Financiación aprobada</b><small>12 meses · 112,42 €/mes · 0 % TIN</small></div><span class="tg">12 m</span></div>
            <div class="st2" id="d4"><span class="dot"></span><div><b>Garantía activa</b><small>2 años · devolución en 30 días</small></div><span class="tg">2 años</span></div>
          </div>
        </div>
''' + s[b:]

# ------------------------------------------------------------------ B. design-system CSS (appended last so it wins)
css = '''
  /* ================= v08 DESIGN SYSTEM ================= */
  :root { --r: 28px; --hair: 1px solid rgba(0,0,0,.06);
    --sh: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06), 0 40px 80px rgba(0,0,0,.08);
    --sh-sm: 0 1px 2px rgba(0,0,0,.04), 0 6px 18px rgba(0,0,0,.06); --tint: #FFF1EA; }
  .num, .bn, .pts, .v, .tot { font-feature-settings: "tnum" 1; }
  .glass, #pb, .sv, .node, .badge .ring, .loy, .win { box-shadow: var(--sh); }
  .glass, .sv { border-radius: var(--r); border: var(--hair); }
  /* feature tiles (replace bullet lists) */
  .acts { width: 700px; margin-top: 44px; }
  .acts li { display: grid; grid-template-columns: 56px 1fr; gap: 20px; align-items: center; background: #FFFFFF; border: var(--hair); border-radius: 22px;
    padding: 16px 22px; margin-bottom: 14px; box-shadow: var(--sh-sm); font-size: 27px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.2; }
  .acts li b { width: 56px; height: 56px; border-radius: 16px; background: var(--tint); display: grid; place-items: center; }
  .acts li em { font-size: 19px; font-weight: 400; letter-spacing: 0; margin-top: 4px; color: #86868B; }
  .panel .left { top: 186px; }
  /* phone */
  .phone { transform: scale(.86); transform-origin: 50% 0; }
  .phone { position: relative; width: 452px; padding: 14px; border-radius: 72px; background: linear-gradient(150deg, #34353a, #121215 55%, #2a2b2f);
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.08), 0 2px 4px rgba(0,0,0,.08), 0 30px 60px rgba(0,0,0,.18), 0 60px 120px rgba(0,0,0,.12); }
  .phone .island { position: absolute; top: 34px; left: 50%; width: 118px; height: 34px; margin-left: -59px; border-radius: 20px; background: #0a0a0b; z-index: 4; }
  .phone .sc { width: 424px; height: 900px; border-radius: 58px; padding: 74px 20px 20px; box-shadow: none; overflow: hidden; }
  .phone .sc .sheen { border-radius: 58px; }
  .sc .status { position: absolute; top: 34px; left: 46px; right: 40px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 600; color: #1D1D1F; }
  .sc .status .sig { display: flex; align-items: flex-end; gap: 3px; font-size: 14px; }
  .sc .status .sig i { width: 4px; background: #1D1D1F; border-radius: 1px; display: block; }
  .sc .status .sig i:nth-child(1) { height: 5px; } .sc .status .sig i:nth-child(2) { height: 8px; } .sc .status .sig i:nth-child(3) { height: 11px; } .sc .status .sig i:nth-child(4) { height: 14px; }
  .sc .head { font-size: 19px; }
  .sc .post { height: 440px; margin-top: 16px; border-radius: 18px; }
  .sc .post .ph { left: 26px; top: 28px; }
  .sc .post .ph .ser { font-size: 34px; font-weight: 300; }
  .sc .post .ph .big { font-size: 62px; }
  .sc .post .pill { font-size: 12px; top: 30px; right: 18px; padding: 8px 12px; }
  .sc .post svg.pb { left: 24px; top: 210px; width: 372px; height: 220px; }
  .sc .bar { margin-top: 18px; } .sc .bar svg { width: 30px; height: 30px; }
  .sc .likes { font-size: 19px; } .sc .capt { font-size: 18px; line-height: 1.35; }
  .sc .nxt { margin-top: 22px; } .sc .nxt .nh { display: flex; align-items: center; gap: 10px; font-size: 17px; } .sc .nxt .nh i { width: 34px; height: 34px; border-radius: 50%; background: #1D1D1F; display: block; } .sc .nxt .nh small { color: #86868B; margin-left: 6px; }
  .sc .nxt .ni { margin-top: 12px; height: 220px; border-radius: 16px; background: linear-gradient(160deg, #EDEDEA, #DADAD5); }
  .cshadow { position: absolute; height: 54px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.22), rgba(0,0,0,0)); filter: blur(6px); }
  /* app window chrome */
  .win { border-radius: 22px; overflow: hidden; background: #FFFFFF; border: var(--hair); }
  .winbar { display: flex; align-items: center; gap: 8px; height: 50px; padding: 0 18px; background: linear-gradient(180deg, #FBFBFA, #F3F3F1); border-bottom: 1px solid #E8E8E5; position: relative; }
  .winbar i { width: 12px; height: 12px; border-radius: 50%; background: #E0E0DC; display: block; }
  .winbar i:nth-child(1) { background: #FF5F57; } .winbar i:nth-child(2) { background: #FEBC2E; } .winbar i:nth-child(3) { background: #28C840; }
  .winbar span { position: absolute; left: 0; right: 0; text-align: center; font-size: 15px; font-weight: 600; color: #6E6E73; letter-spacing: -0.005em; }
  .db.win { padding: 0; width: 800px; height: auto; }
  .db.win .row, .db.win .zones { margin: 22px 26px 0; }
  .db.win .zones { margin-bottom: 26px; }
  /* CRM order pipeline */
  #o4 .hdr { display: grid; grid-template-columns: 64px 1fr auto; gap: 18px; align-items: center; padding: 26px 30px; border-bottom: 1px solid #EFEFEC; }
  #o4 .hdr .av { width: 64px; height: 64px; border-radius: 50%; background: var(--signal); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 22px; }
  #o4 .hdr b { font-size: 26px; letter-spacing: -0.02em; display: block; } #o4 .hdr small { font-size: 17px; color: #86868B; }
  #o4 .hdr .tot { font-family: var(--display); font-weight: 700; font-size: 40px; letter-spacing: -0.03em; }
  .steps2 { position: relative; padding: 18px 30px 26px; }
  .steps2 .rail { position: absolute; left: 57px; top: 50px; bottom: 60px; width: 3px; background: #ECECEA; border-radius: 2px; }
  .steps2 .rail s { position: absolute; inset: 0; background: var(--signal); transform-origin: 50% 0; text-decoration: none; border-radius: 2px; }
  .st2 { position: relative; display: grid; grid-template-columns: 56px 1fr auto; gap: 18px; align-items: center; padding: 16px 0; }
  .st2 .dot { width: 56px; height: 56px; border-radius: 50%; background: #FFFFFF; border: 2px solid #E3E3E0; display: grid; place-items: center; position: relative; z-index: 2; }
  .st2 b { font-size: 25px; letter-spacing: -0.02em; display: block; } .st2 small { font-size: 17px; color: #86868B; }
  .st2 .tg { font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #6E6E73; background: #F2F2F0; padding: 7px 12px; border-radius: 999px; }
  /* icon chips used across scenes */
  .ic { width: 56px; height: 56px; border-radius: 16px; background: var(--tint); display: grid; place-items: center; margin-bottom: 18px; }
  .sv { height: 600px; top: 270px !important; }
  .fx .ic { margin-bottom: 14px; }
'''
rep('</style>', css + '</style>')

# ------------------------------------------------------------------ JS: icons into tiles / cards, CRM motion
rep("  const para = $('#para');", """  // icons (one family) into feature tiles, supervision cards and factor blocks
  const ICO = { 1: ['campus', 'social', 'handshake'], 2: ['wrench', 'calendar', 'app'], 3: ['survey', 'chart', 'pin'], 4: ['receipt', 'card', 'shield'] };
  Object.entries(ICO).forEach(([n, names]) => $$(`#f${n} .acts li b`).forEach((b, i) => { b.innerHTML = KIT.icon(names[i], '#FF5A1F', 28); }));
  $$('#s9 .sv').forEach((el, i) => el.insertAdjacentHTML('afterbegin', `<div class="ic">${KIT.icon(['calendar', 'kpi', 'oneone'][i], '#FF5A1F', 28)}</div>`));
  ['#fx1', '#fx2', '#fx3', '#fx4'].forEach((sel, i) => $(sel).insertAdjacentHTML('afterbegin', `<div class="ic">${KIT.icon(['people', 'box', 'customer', 'pin'][i], '#FF5A1F', 28)}</div>`));
  $$('#o4 .st2 .dot').forEach(d => { d.innerHTML = KIT.icon('check', '#FFFFFF', 24, 2.4); });
  const para = $('#para');""")

# icon draw-on when each tile appears
rep("    items.forEach((ti, k) => tl.fromTo(`#f${n} .acts li:nth-child(${k + 1})`, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: .7 }, ti - .15));",
    """    items.forEach((ti, k) => { tl.fromTo(`#f${n} .acts li:nth-child(${k + 1})`, { opacity: 0, y: 30, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .8 }, ti - .15)
      .fromTo(`#f${n} .acts li:nth-child(${k + 1}) .ico > *`, { attr: { 'stroke-dasharray': 70, 'stroke-dashoffset': 70 } }, { attr: { 'stroke-dashoffset': 0 }, duration: .9, ease: 'tz-cam' }, ti); });""")

# Gestión: CRM pipeline lights up step by step on the voice
rep("""  tl.fromTo('#d1', { x: 400, rotationZ: 8, opacity: 0 }, { x: 0, rotationZ: -3, opacity: 1, duration: .9 }, V(39.42))
    .fromTo('#d2', { x: 400, rotationZ: 8, opacity: 0 }, { x: 0, rotationZ: 2, opacity: 1, duration: .9 }, V(40.18))
    .fromTo('#d3', { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, V(40.94))
    .fromTo('#stamp', { scale: 2.4, rotationZ: -30, opacity: 0 }, { scale: 1, rotationZ: -12, opacity: 1, duration: .45, ease: 'power4.in' }, V(41.9) - .2)
    .fromTo('#o4', { x: 0 }, { keyframes: [{ x: -10, y: 6, duration: .05 }, { x: 6, y: -4, duration: .05 }, { x: 0, y: 0, duration: .08 }] }, V(41.9) + .25);""",
    """  tl.fromTo('#o4', { rotationY: 32, rotationX: 10, z: -420, opacity: 0 }, { rotationY: 11, rotationX: 4, z: 0, opacity: 1, duration: 1.2 }, V(37.82))
    .to('#o4', { rotationY: 4, duration: 5, ease: 'none' }, V(37.82) + 1.2)
    .fromTo('#o4 .hdr > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6, stagger: .08 }, V(37.82) + .5)
    .fromTo('#o4 .st2', { opacity: .28 }, { opacity: .28, duration: .01 }, V(37.82))
    .fromTo('#crmrail', { scaleY: 0 }, { scaleY: 0, duration: .01 }, V(37.82));
  [V(39.42), V(40.18), V(40.94), V(41.9)].forEach((at, i) => {
    tl.to(`#d${i + 1}`, { opacity: 1, duration: .4 }, at - .1)
      .fromTo(`#d${i + 1} .dot`, { backgroundColor: '#FFFFFF', borderColor: '#E3E3E0', scale: .7 }, { backgroundColor: '#FF5A1F', borderColor: '#FF5A1F', scale: 1, duration: .55, ease: 'back.out(2.4)' }, at - .1)
      .to('#crmrail', { scaleY: (i + 1) / 4, duration: .6, ease: 'tz-cam' }, at - .2); });""")

s = s.replace('<div class="obj card loy" id="loy" style="left:1380px;top:740px">', '<div class="obj card loy" id="loy" style="left:1250px;top:770px">')
open('src/film4.html', 'w').write(s)
print('wrote src/film4.html')
