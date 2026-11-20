"""Editorial v04 (part B): company scene uses a real brand photo window with spec callouts; Supervisión cards get photo strips."""
p = 'videohub/trazo-editorial/film.js'
s = open(p).read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:90])
    s = s.replace(a, b)

R("""    // grid card wipes down, the bike resolves from its ghost inside it
    const gp = k(t, 4.75, .8, E.io);
    if (gp > 0) { g.save(); g.beginPath(); g.rect(630, 352, 660, 500 * gp); g.clip(); g.fillStyle = 'rgba(11,26,51,.03)'; g.fillRect(630, 352, 660, 500); g.strokeStyle = 'rgba(11,26,51,.12)'; g.lineWidth = 1; g.beginPath();
      for (let x = 630; x <= 1290; x += 33) { g.moveTo(x, 352); g.lineTo(x, 852); } for (let y = 352; y <= 852; y += 33) { g.moveTo(630, y); g.lineTo(1290, y); } g.stroke(); g.restore(); }
    g.save(); const s = 1 + .035 * k(t, 5.2, 4.5, E.soft); g.translate(960, 830); g.scale(s, s); g.translate(-960, -830); ghost(IMG.ebikeMono, 960, 862, 500, 5.2, { dx: 60 }); g.restore();
""", """    // the company photo: a rounded window wipes open (pale), the click brings it into focus, spec callouts spring out of the bike
    const gp = k(t, 4.75, .8, E.io);
    if (gp > 0) { const b = k(t, 5.2, 1.0, E.out), zoom = (1.1 - .1 * b) * (1 - .05 * k(t, 5.2, 4.5, E.soft)), P = brandAt(zoom);
      g.save(); g.shadowColor = 'rgba(11,26,51,.22)'; g.shadowBlur = 50; g.shadowOffsetY = 24; rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.fillStyle = '#DDE3EC'; g.fill(); g.restore();
      g.save(); rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.clip();
      if (b < 1) { g.globalAlpha = .85; P.draw(IMG.brandPale); }
      if (b > 0) { g.globalAlpha = b; if (b < 1) g.filter = `blur(${(12 * (1 - b)).toFixed(1)}px)`; P.draw(IMG.brandCol); g.filter = 'none'; }
      g.restore(); sweep(BW.x, BW.y, BW.w, BW.h, 6.0, 26);
      g.save(); g.globalAlpha = gp; rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.lineWidth = 1.5; g.strokeStyle = 'rgba(11,26,51,.25)'; g.stroke(); g.restore();
      pillBar(BW.x + 22, BW.y + 22, 5.55, 'NUEVA TRAZO CITY', { size: 14, fill: 'rgba(244,246,250,.92)', col: C.ink });
      // callouts: anchor dot on the bike → elbow line → tag
      [[[528, 716], 'MOTOR 250 W', 5.9], [[862, 575], 'AUTONOMÍA 80 KM', 6.15], [[1062, 722], 'DESDE 1.349 €', 6.4]].forEach(([src, lab, a], i) => { const [ax, ay] = P.pt(src[0], src[1]), ty = 640 + i * 74;
        if (t < a - .4) return; const ds = Math.max(0, spring(a - .4, 1.6, 7)); ev('pop', a - .4);
        g.save(); g.fillStyle = '#fff'; g.strokeStyle = C.blue; g.lineWidth = 3; g.beginPath(); g.arc(ax, ay, 9 * ds, 0, 7); g.fill(); g.stroke();
        g.globalAlpha = .45 * (1 - ((t - a) % 1.6) / 1.6) * clamp(t - a + 1); g.beginPath(); g.arc(ax, ay, 9 + 22 * (((t - a) % 1.6 + 1.6) % 1.6) / 1.6, 0, 7); g.stroke(); g.restore();
        drawLine([[ax, ay], [ax + (1318 - ax) * .55, ty + 17], [1330, ty + 17]], a - .38, .38, 'rgba(29,91,216,.85)', 2);
        pillBar(1336, ty, a, lab, { size: 15, fill: C.ink, col: C.white }); });
    }
""")
R("""  // 01 · la empresa — paper; a cursor builds the page piece by piece""",
  """  // brand photo window (company scene): source point (775,580) of the photo sits at the window centre
  const BW = { x: 620, y: 350, w: 680, h: 500 };
  function brandAt(zoom) { const im = IMG.brandCol, f = im.width / 1600, sc = BW.w / 1100 * zoom, cx = BW.x + BW.w / 2, cy = BW.y + BW.h / 2;   // photo coords in 1600-wide units
    return { pt: (sx, sy) => [cx + (sx - 775) * sc, cy + (sy - 580) * sc], draw: img => g.drawImage(img, cx - 775 * sc, cy - 580 * sc, im.width / f * sc, im.height / f * sc) }; }
  // 01 · la empresa — paper; a cursor builds the page piece by piece""")

# Supervisión: photo strip on each card, small icon badge, checkbox on a dark backing
R("""      glass(x, y, 400, 380, 26); sweep(x, y, 400, 380, a + .4, 26); icon(ic, x + 40, y + 50, k(t, a, .8));
      txt(kk, x + 40, y + 190, { size: 15, w: 700, ls: 3, col: C.blue2 }); typeOn(h, x + 40, y + 250, a + .1, { f: SERIF, size: 44, w: 700, col: C.white, cps: 30, caret: false });
      paraWipe(s, x + 40, y + 300, 330, a + .5, { size: 18, col: C.sky, lh: 24 });""",
  """      glass(x, y, 400, 380, 26);
      { const pq = k(t, a - .05, .8, E.out), im = IMG[['supMeeting', 'supKpi', 'supOne'][i]], zz = (1.18 - .18 * pq) * (1 + .04 * k(t, a, 6, E.soft)), iw = 372 * zz, ih = iw * im.height / im.width;
        g.save(); rr(x + 14, y + 14, 372, 152, 18); g.clip(); g.globalAlpha *= pq; g.drawImage(im, x + 200 - iw / 2, y + 90 - ih / 2, iw, ih);
        const gr = g.createLinearGradient(0, y + 60, 0, y + 166); gr.addColorStop(0, 'rgba(6,16,31,0)'); gr.addColorStop(1, 'rgba(6,16,31,.75)'); g.fillStyle = gr; g.fillRect(x + 14, y + 14, 372, 152); g.restore(); }
      sweep(x, y, 400, 380, a + .4, 26);
      g.save(); g.translate(x + 28, y + 132); g.scale(.62, .62); icon(ic, 0, 0, k(t, a, .8)); g.restore();
      txt(kk, x + 40, y + 222, { size: 15, w: 700, ls: 3, col: C.blue2 }); typeOn(h, x + 40, y + 272, a + .1, { f: SERIF, size: 44, w: 700, col: C.white, cps: 30, caret: false });
      paraWipe(s, x + 40, y + 312, 330, a + .5, { size: 18, col: C.sky, lh: 24 });""")
R("""      const cx = x + 340, cy = y + 62, ck = k(t, a + .62, .35, E.out); g.lineWidth = 2.5;""",
  """      const cx = x + 340, cy = y + 62, ck = k(t, a + .62, .35, E.out); g.fillStyle = 'rgba(6,16,31,.6)'; g.beginPath(); g.arc(cx, cy, 23, 0, 7); g.fill(); g.lineWidth = 2.5;""")

# assets
R("""loadImage('valencia', 'assets/photos/valencia.jpg')]);""",
  """loadImage('valencia', 'assets/photos/valencia.jpg'),
      loadImage('brand', 'assets/photos/brand.jpg'), loadImage('supMeeting0', 'assets/photos/sup_meeting.jpg'), loadImage('supKpi0', 'assets/photos/sup_kpi.jpg'), loadImage('supOne0', 'assets/photos/sup_one.jpg')]);""")
R("""    IMG.card = buildCard(); IMG.cardBack = buildCardBack();""",
  """    IMG.card = buildCard(); IMG.cardBack = buildCardBack();
    { const v = IMG.brand, mkc = f => { const c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = f; x.drawImage(v, 0, 0); return c; };
      IMG.brandCol = mkc('contrast(1.08) saturate(.9) brightness(1.03)'); { const x = IMG.brandCol.getContext('2d'); x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(40,90,200,.28)'; x.fillRect(0, 0, v.width, v.height); }
      IMG.brandPale = mkc('grayscale(1) brightness(1.45) contrast(.5) blur(8px)'); }
    for (const k2 of ['supMeeting', 'supKpi', 'supOne']) { const v = IMG[k2 + '0'], c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.55) contrast(1.08) brightness(.9)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.5)'; x.fillRect(0, 0, c.width, c.height); IMG[k2] = c; }""")
open(p, 'w').write(s)
print('ok')
