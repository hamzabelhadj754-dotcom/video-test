// TRAZO · editorial film for VideoHub — one 1920x1080 canvas, window.renderOut(t) is a pure function of t.
// Look: light paper opener → deep navy with blue glows → black grain finale; classical serif caps + heavy sans;
// photo cut-outs with a light disc behind; tilted social card; glass panels; pills; Valencian orange-tree leaves.
(function () {
  'use strict';
  const W = 1920, H = 1080, DUR = 96.4;
  const cv = document.getElementById('c'), main = cv.getContext('2d');
  const C = { paper: '#EDF0F5', ink: '#0B1A33', navy: '#06101F', blue: '#1D5BD8', blue2: '#3B7BFF', sky: '#A9C4FF', white: '#F4F6FA', mute: '#8A93A6', orange: '#FF5A1F' };
  const SERIF = '"CG"', SANS = '"IT"';

  // ------------------------------------------------------------------ math / easing (deterministic)
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const bez = (x1, y1, x2, y2) => t => { let u = t; for (let i = 0; i < 8; i++) { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx; const x = ((ax * u + bx) * u + cx) * u - t; const d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(d) < 1e-6) break; u -= x / d; } const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; return ((ay * u + by) * u + cy) * u; };
  const E = { out: bez(.16, 1, .3, 1), in: bez(.64, 0, .78, 0), io: bez(.65, 0, .35, 1), soft: bez(.33, 0, .2, 1), back: t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } };
  const k = (t, a, d = .8, e = E.out) => e(clamp((t - a) / d));          // eased progress of a tween starting at a
  const lerp = (a, b, x) => a + (b - a) * x;
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  let g = main;

  // ------------------------------------------------------------------ assets
  const IMG = {};
  const loadImage = (key, src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[key] = i; ok(); }; i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // graded cut-outs: 'mono' = blue-grey duotone (paper scenes), 'cool' = cooled colour (navy scenes)
  function grade(img, mode) {
    const c = mk(img.width, img.height), x = c.getContext('2d');
    x.filter = mode === 'mono' ? 'grayscale(1) contrast(1.15) brightness(1.02)' : 'saturate(.55) contrast(1.1) brightness(.92)';
    x.drawImage(img, 0, 0); x.filter = 'none';
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = mode === 'mono' ? 'rgba(40,70,130,.42)' : 'rgba(30,80,200,.28)'; x.globalCompositeOperation = mode === 'mono' ? 'color' : 'soft-light'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-atop'; const gr = x.createLinearGradient(0, 0, c.width, 0); gr.addColorStop(0, 'rgba(120,170,255,.0)'); gr.addColorStop(1, mode === 'mono' ? 'rgba(255,255,255,.08)' : 'rgba(120,170,255,.22)');
    x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);   // keep the cut-out's own alpha
    x.globalCompositeOperation = 'source-over';
    return c;
  }
  const blurred = (src, px, pad = 0) => { const c = mk(src.width + pad * 2, src.height + pad * 2), x = c.getContext('2d'); x.filter = `blur(${px}px)`; x.drawImage(src, pad, pad); return c; };

  // Valencian orange-tree branch silhouettes (seeded), pre-blurred for depth
  function branch(seed, col, fruit) {
    const r = rng(seed), c = mk(1000, 1000), x = c.getContext('2d'); x.fillStyle = col; x.strokeStyle = col;
    let px = 40, py = 980, ang = -1.05 + r() * .25; x.lineWidth = 10; x.lineCap = 'round';
    const pts = []; for (let i = 0; i < 14; i++) { const nx = px + Math.cos(ang) * 62, ny = py + Math.sin(ang) * 62; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke(); x.lineWidth *= .93; pts.push([nx, ny, ang]); px = nx; py = ny; ang += (r() - .45) * .22; }
    pts.forEach(([lx, ly, a], i) => { for (const side of [-1, 1]) { if (r() < .25) continue; const L = 130 + r() * 90, Wd = L * (.36 + r() * .08), la = a + side * (.8 + r() * .5);
      x.save(); x.translate(lx, ly); x.rotate(la); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(L * .3, -Wd * .62, L * .78, -Wd * .5, L, 0); x.bezierCurveTo(L * .78, Wd * .5, L * .3, Wd * .62, 0, 0); x.fill(); x.restore(); } });
    if (fruit) { const fr = rng(seed + 9); for (let i = 0; i < 2; i++) { const p = pts[5 + i * 4]; x.fillStyle = fruit; x.beginPath(); x.arc(p[0] + 40 + fr() * 30, p[1] + 50, 46 + fr() * 10, 0, 7); x.fill(); } }
    return c;
  }
  const LEAF = {};
  // grain tile
  const grainTile = mk(256, 256); { const gg = grainTile.getContext('2d'), im = gg.createImageData(256, 256), r = rng(4242); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - .5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gg.putImageData(im, 0, 0); }
  let grainPat = null;

  // ------------------------------------------------------------------ type + UI kit
  function font(fam, size, w = 400, it = false) { g.font = `${it ? 'italic ' : ''}${w} ${size}px ${fam}`; }
  function txt(s, x, y, o = {}) {
    font(o.f || SANS, o.size || 24, o.w || 500, o.it); g.letterSpacing = (o.ls || 0) + 'px'; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
    g.fillStyle = o.col || C.white; g.fillText(s, x, y); const m = g.measureText(s).width; g.letterSpacing = '0px'; return m;
  }
  const measure = (s, o) => { font(o.f || SANS, o.size || 24, o.w || 500, o.it); g.letterSpacing = (o.ls || 0) + 'px'; const m = g.measureText(s).width; g.letterSpacing = '0px'; return m; };
  // words revealed one by one (blur → sharp, rise), each at its own time; returns total width
  function words(list, x, y, o, times, gap) {
    const sp = gap != null ? gap : measure(' ', o);
    const ws = list.map(w => typeof w === 'string' ? { s: w } : w), widths = ws.map(w => measure(w.s, Object.assign({}, o, w)));
    const total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    ws.forEach((w, i) => { const t0 = Array.isArray(times) ? times[Math.min(i, times.length - 1)] : times + i * (o.stagger || .07), p = k(T, t0, o.dur || .55);
      if (p > 0) { g.save(); g.globalAlpha *= p; const b = (1 - p) * (o.blur != null ? o.blur : 10); if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`;
        txt(w.s, cx, y + (1 - p) * (o.rise != null ? o.rise : 22), Object.assign({}, o, w, { align: 'left' })); g.restore(); }
      cx += widths[i] + sp; });
    return total;
  }
  function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function pill(x, y, s, o = {}) {      // x,y = left/top; returns width
    const size = o.size || 22, padX = o.padX || 26, h = o.h || size * 2.1, w = measure(s, Object.assign({ f: SANS, w: 700, ls: 1.5 }, o)) + padX * 2;
    const X = o.align === 'center' ? x - w / 2 : x;
    rr(X, y, w, h, o.rad != null ? o.rad : h / 2);
    if (o.fill) { g.fillStyle = o.fill; g.fill(); }
    if (o.stroke) { g.lineWidth = o.lw || 2; g.strokeStyle = o.stroke; if (o.dash) g.setLineDash(o.dash); g.stroke(); g.setLineDash([]); }
    txt(s, X + w / 2, y + h / 2 + size * .36, Object.assign({ f: SANS, w: 700, ls: 1.5, align: 'center', col: o.col || C.white, size }, o));
    return w;
  }
  function glass(x, y, w, h, r = 28, a = 1) {
    g.save(); g.globalAlpha *= a;
    rr(x, y, w, h, r); const gr = g.createLinearGradient(x, y, x + w * .6, y + h); gr.addColorStop(0, 'rgba(160,190,255,.16)'); gr.addColorStop(1, 'rgba(60,100,200,.05)'); g.fillStyle = gr; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(190,210,255,.28)'; g.stroke();
    rr(x + 1, y + 1, w - 2, h * .45, r); const sh = g.createLinearGradient(x, y, x, y + h * .45); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fill();
    g.restore();
  }
  function cursor(x, y, s = 1, col = C.ink) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, 0); g.lineTo(36, 14); g.lineTo(20, 20); g.lineTo(14, 36); g.closePath(); g.fillStyle = col; g.fill(); g.restore(); }
  function barcode(x, y, w, h, col) { const r = rng(77); g.fillStyle = col; let cx = x; while (cx < x + w) { const bw = [1, 1, 2, 3][Math.floor(r() * 4)]; if (r() > .35) g.fillRect(cx, y, bw, h); cx += bw + 1 + Math.floor(r() * 2); } }
  function brackets(x, y, w, h, col, len = 26, a = 1) { g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
    g.moveTo(x, y + len); g.lineTo(x, y); g.lineTo(x + len, y); g.moveTo(x + w - len, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - len); g.stroke(); g.restore(); }
  function para(s, x, y, w, o) { font(o.f || SANS, o.size || 16, o.w || 400); const lines = []; let line = ''; for (const wd of s.split(' ')) { const tryL = line ? line + ' ' + wd : wd; if (g.measureText(tryL).width > w && line) { lines.push(line); line = wd; } else line = tryL; } lines.push(line);
    lines.forEach((l, i) => txt(l, o.align === 'center' ? x + w / 2 : x, y + i * (o.lh || 22), Object.assign({}, o))); return lines.length; }
  function photo(img, cx, by, h, o = {}) {   // cut-out standing on baseline by, centred at cx, height h
    const s = h / img.height, w = img.width * s;
    if (o.shadow !== false) { g.save(); g.globalAlpha *= .45; const gr = g.createRadialGradient(cx, by, 0, cx, by, w * .55); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.scale(1, .12); g.fillRect(cx - w, by / .12 - w * .55, w * 2, w * 1.1); g.restore(); }
    g.drawImage(img, cx - w / 2, by - h, w, h);
  }
  function disc(cx, cy, r, a = 1) { g.save(); g.globalAlpha *= a; const gr = g.createRadialGradient(cx - r * .25, cy - r * .3, r * .1, cx, cy, r); gr.addColorStop(0, '#2C6BE8'); gr.addColorStop(.7, '#174AA8'); gr.addColorStop(1, 'rgba(23,74,168,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.restore(); }

  // ------------------------------------------------------------------ backgrounds
  function bgPaper(t) {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const cx = 960 + 20 * Math.sin(t * .2), cy = 520;
    g.save(); g.strokeStyle = 'rgba(11,26,51,.07)'; g.lineWidth = 1; g.beginPath();
    for (let x = cx - 900; x <= cx + 900; x += 46) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = cy - 600; y <= cy + 600; y += 46) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
    const m = g.createRadialGradient(cx, cy, 200, cx, cy, 900); m.addColorStop(0, 'rgba(237,240,245,0)'); m.addColorStop(1, 'rgba(237,240,245,1)'); g.fillStyle = m; g.fillRect(0, 0, W, H); g.restore();
    // thin arcs
    g.save(); g.strokeStyle = 'rgba(11,26,51,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(-200, 1300, 1300 + 6 * Math.sin(t * .3), -1.25, -.45); g.stroke(); g.beginPath(); g.arc(2300, -400, 980, 1.9, 2.75); g.stroke(); g.restore();
  }
  function bgNavy(t, glow = [1300, 380], tone = 1) {
    g.fillStyle = C.navy; g.fillRect(0, 0, W, H);
    const gx = glow[0] + 60 * Math.sin(t * .17), gy = glow[1] + 40 * Math.cos(t * .21);
    let gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1100); gr.addColorStop(0, `rgba(25,82,190,${.75 * tone})`); gr.addColorStop(.45, `rgba(14,48,120,${.45 * tone})`); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(200, 1100, 0, 200, 1100, 800); gr.addColorStop(0, 'rgba(20,60,150,.35)'); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.strokeStyle = 'rgba(140,170,255,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(-300 + 30 * Math.sin(t * .2), 1250, 1150, -1.3, -.35); g.stroke(); g.restore();
  }
  function bgBlack(t) {
    g.fillStyle = '#04060A'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(300, 900, 0, 300, 900, 1200); gr.addColorStop(0, 'rgba(20,60,140,.45)'); gr.addColorStop(1, 'rgba(4,6,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function leaves(t, mode, which) {     // foreground branches drifting in the corners (depth)
    const L = LEAF[mode]; const sway = a => Math.sin(t * .6 + a) * .03;
    const spots = { tl: [-260, -330, 2.6, .9, 1], br: [W - 640, H - 560, -.35, 1, 2], tr: [W - 520, -380, 3.6, .75, 3], bl: [-300, H - 520, -1.2, .8, 4] };
    for (const key of which) { const [x, y, r, s, ph] = spots[key]; g.save(); g.translate(x + 500 * s, y + 500 * s); g.rotate(r + sway(ph)); g.scale(s, s); g.drawImage(L, -L.width / 2, -L.height / 2); g.restore(); }
  }
  function sideTexts(col, a = 1) {
    g.save(); g.globalAlpha *= a; font(SANS, 13, 600); g.letterSpacing = '3px'; g.fillStyle = col;
    g.save(); g.translate(48, 540); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('TRAZO · MOVILIDAD ELÉCTRICA · VALENCIA', 0, 0); g.restore();
    g.save(); g.translate(W - 48, 540); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillText('PRÁCTICA FINAL · RA3 · DEPARTAMENTO DE VENTAS', 0, 0); g.restore();
    g.letterSpacing = '0px'; g.restore();
  }
  function stamp(col, a = 1) { g.save(); g.globalAlpha *= a; barcode(W - 300, 64, 170, 30, col); txt('20 · NOV · 2026', W - 130, 116, { size: 14, w: 600, ls: 2, col, align: 'right' }); g.restore(); }

  // ------------------------------------------------------------------ scenes (t0, t1 in film seconds; T = global time)
  let T = 0;
  const SC = [];
  const scene = (name, t0, t1, draw) => SC.push({ name, t0, t1, draw });

  // 00 · presentado por (paper)
  scene('Presentado por', 0, 3.25, (t) => {
    bgPaper(t); leaves(t, 'paper', ['tl', 'br']);
    stamp(C.ink, k(t, .3)); sideTexts('rgba(11,26,51,.5)', k(t, .5));
    words([{ s: 'presentado', it: true }, { s: 'por', it: true }], 960, 400, { f: SERIF, size: 58, w: 600, col: '#4A5872', align: 'center' }, .35);
    words(['YASSER'], 960, 600, { f: SERIF, size: 230, w: 700, col: C.ink, align: 'center', ls: -2, blur: 18 }, .7);
    const p = k(t, 1.3, .7); if (p > 0) { g.save(); g.globalAlpha = p; pill(960, 652 + (1 - p) * 14, 'PRÁCTICA FINAL · RA3 · DEPARTAMENTO DE VENTAS', { align: 'center', size: 17, fill: C.ink, col: C.white, rad: 4 }); g.restore(); }
    const c = k(t, 1.6, 1.1, E.io); if (c > 0) cursor(lerp(1500, 1290, c), lerp(820, 700, c), 1.2);
  });
  // 01 · la empresa (paper, bike as the statue)
  scene('01 La empresa', 3.25, 9.75, (t) => {
    bgPaper(t); leaves(t, 'paper', ['tl', 'br']); stamp(C.ink); sideTexts('rgba(11,26,51,.5)');
    const pb = k(t, 3.5, 1.2);
    g.save(); g.globalAlpha = pb; const s = 1 + .03 * k(t, 3.5, 6, E.soft); g.translate(960, 830); g.scale(s, s); g.translate(-960, -830);
    if (pb < 1) g.filter = `blur(${((1 - pb) * 14).toFixed(1)}px)`; photo(IMG.ebikeMono, 960, 860, 520); g.restore();
    words(['la'], 650, 168, { f: SANS, size: 26, w: 700, col: C.ink }, 4.0);
    words(['TRAZO'], 960, 290, { f: SERIF, size: 170, w: 700, col: C.ink, align: 'center', ls: 2, blur: 16 }, 4.06);
    words(['empresa'], 1255, 318, { f: SANS, size: 24, w: 700, col: C.ink }, 4.4);
    words([{ s: 'movilidad', it: true }, { s: 'eléctrica', it: true }, { s: 'en', it: true }, { s: 'Valencia', it: true, col: C.blue }], 960, 960, { f: SERIF, size: 52, w: 600, col: '#4A5872', align: 'center' }, [6.28, 6.36, 6.44, 6.52]);
    const pp = k(t, 5.04, .6); if (pp > 0) { g.save(); g.globalAlpha = pp; pill(960, 990 + (1 - pp) * 12, 'EMPRESA COMERCIAL', { align: 'center', size: 18, fill: C.ink, rad: 4 }); g.restore(); }
    const chips = [['BICIS ELÉCTRICAS', 7.16], ['PATINETES', 8.02], ['ACCESORIOS', 8.3], ['TRAZO CARE', 8.5]];
    chips.forEach(([s, a], i) => { const q = k(t, a, .55); if (q <= 0) return; g.save(); g.globalAlpha = q; const x = 300, y = 430 + i * 72; pill(x, y + (1 - q) * 16, s, { size: 17, stroke: C.ink, col: C.ink, dash: [6, 5] }); g.restore(); });
    para('Compramos a fabricantes y vendemos a quien se mueve por la ciudad: estudiantes, trabajadores y empresas de reparto.', 1380, 470, 380, { size: 18, col: '#4A5872', lh: 26 });
    const c = k(t, 7.4, 1.2, E.io); if (c > 0) cursor(lerp(1700, 1180, c), lerp(820, 600, c), 1.2);
    brackets(1360, 440, 420, 120, C.ink, 22, k(t, 7, .6));
  });
  // 02 · dos tipos de clientes (navy, cut-outs with a light disc)
  scene('02 Público objetivo', 9.75, 18.55, (t) => {
    bgNavy(t, [1250, 420]); leaves(t, 'navy', ['tr', 'bl']); sideTexts('rgba(169,196,255,.45)'); stamp('rgba(169,196,255,.7)');
    words([{ s: 'Tenemos', it: true }, { s: 'dos', it: true }, { s: 'tipos', it: true }, { s: 'de', it: true }], 960, 150, { f: SERIF, size: 46, w: 600, col: C.sky, align: 'center' }, [9.66, 10.04, 10.36, 10.66]);
    words(['CLIENTES'], 960, 250, { f: SANS, size: 92, w: 800, col: C.white, align: 'center', ls: 4 }, 10.86);
    // A · student
    const a = k(t, 11.6, 1.0), aOut = k(t, 15.4, .5, E.in), ax = 960 - 900 * aOut;
    if (a > 0 && aOut < 1) { g.save(); g.globalAlpha = a * (1 - aOut); disc(ax, 640, 300 * (.8 + .2 * a)); g.translate(0, (1 - a) * 60); if (a < 1) g.filter = `blur(${((1 - a) * 12).toFixed(1)}px)`; photo(IMG.studentCool, ax, 1000, 700); g.filter = 'none';
      const p = k(t, 12.36, .6); g.globalAlpha = a * (1 - aOut) * p; pill(ax, 860, 'PARTICULARES · 18–40 AÑOS', { align: 'center', size: 26, stroke: C.white, col: C.white, lw: 2.5, fill: 'rgba(6,16,31,.55)' });
      g.globalAlpha = a * (1 - aOut) * k(t, 13.8, .6); para('Estudiantes y trabajadores que se mueven por la ciudad.', ax - 300, 950, 600, { size: 18, col: C.sky, align: 'center', lh: 24 }); g.restore(); }
    // B · courier
    const b = k(t, 15.55, .9);
    if (b > 0) { const bx = 960 + 900 * (1 - b); g.save(); g.globalAlpha = b; disc(bx, 640, 300); if (b < 1) g.filter = `blur(${((1 - b) * 12).toFixed(1)}px)`; photo(IMG.courierCool, bx, 960, 600); g.filter = 'none';
      const p = k(t, 16.2, .6); g.globalAlpha = b * p; pill(bx, 860, 'EMPRESAS DE REPARTO · FLOTAS DE 5 A 50', { align: 'center', size: 26, stroke: C.white, col: C.white, lw: 2.5, fill: 'rgba(6,16,31,.55)' });
      g.globalAlpha = b * k(t, 17.0, .5); para('Necesitan flotas de bicis fiables, todos los días.', bx - 300, 950, 600, { size: 18, col: C.sky, align: 'center', lh: 24 }); g.restore(); }
  });
  // 03 · cuatro funciones
  scene('03 Funciones', 18.55, 22.0, (t) => {
    bgNavy(t, [960, 500], .9); leaves(t, 'navy', ['tl', 'br']); sideTexts('rgba(169,196,255,.45)');
    words([{ s: 'nuestro', it: true }, { s: 'departamento', it: true }, { s: 'de', it: true }, { s: 'ventas', it: true }, { s: 'tiene', it: true }], 960, 360, { f: SERIF, size: 54, w: 600, col: C.sky, align: 'center' }, [18.6, 19.0, 19.58, 19.78, 20.14]);
    words([{ s: '4', col: C.blue2 }, 'FUNCIONES'], 960, 560, { f: SANS, size: 170, w: 800, col: C.white, align: 'center', ls: 2, blur: 20 }, [20.44, 20.82]);
    ['CAPTACIÓN', 'FIDELIZACIÓN', 'ANÁLISIS', 'GESTIÓN'].forEach((s, i) => { const q = k(t, 20.9 + i * .1, .5); if (q <= 0) return; g.save(); g.globalAlpha = q; pill(960 + (i - 1.5) * 300, 640 + (1 - q) * 14, s, { align: 'center', size: 20, stroke: 'rgba(169,196,255,.7)', col: C.sky, dash: [6, 5] }); g.restore(); });
  });
  // function title block (serif caps in a dashed box + number + italic kicker + action pills)
  function fnTitle(t, x, num, kicker, title, kt, items) {
    words(kicker.split(' ').map(s => ({ s, it: true })), x, 230, { f: SERIF, size: 40, w: 600, col: C.sky }, kt);
    const p = k(t, kt + .15, .7); if (p > 0) { g.save(); g.globalAlpha = p; const w = measure(title, { f: SERIF, size: 92, w: 700, ls: 3 }) + 70;
      g.setLineDash([8, 7]); g.strokeStyle = 'rgba(244,246,250,.85)'; g.lineWidth = 2; rr(x, 262, w * (.6 + .4 * p), 128, 6); g.stroke(); g.setLineDash([]);
      if (p < 1) g.filter = `blur(${((1 - p) * 10).toFixed(1)}px)`; txt(title, x + 35, 360, { f: SERIF, size: 92, w: 700, ls: 3, col: C.white }); g.filter = 'none';
      txt(num, x + w + 18, 292, { f: SANS, size: 24, w: 800, col: C.blue2 }); g.restore(); }
    items.forEach(([s, a, sub], i) => { const q = k(t, a - .1, .55); if (q <= 0) return; g.save(); g.globalAlpha = q; const y = 450 + i * 120;
      pill(x, y + (1 - q) * 16, s, { size: 20, fill: 'rgba(6,16,31,.5)', stroke: 'rgba(244,246,250,.8)', col: C.white, lw: 2 });
      txt(sub, x + 4, y + 76 + (1 - q) * 16, { size: 18, w: 400, col: C.sky }); g.restore(); });
  }
  // 04 · captación — tilted social card
  scene('04 Captación', 22.0, 28.8, (t) => {
    bgNavy(t, [1350, 420]); leaves(t, 'navy', ['tr', 'bl']); sideTexts('rgba(169,196,255,.45)'); stamp('rgba(169,196,255,.7)');
    fnTitle(t, 150, '01', 'Primero, conseguir clientes:', 'CAPTACIÓN', 22.04, [['PRUEBAS GRATIS EN LOS CAMPUS', 23.18, 'UPV · UV · Florida Universitària'], ['CAMPAÑAS EN REDES SOCIALES', 24.92, 'Instagram y TikTok con rutas reales'], ['ACUERDOS CON EMPRESAS DE REPARTO', 26.58, 'Flotas de 5 a 50 bicicletas']]);
    const p = k(t, 22.3, 1.3); if (p <= 0) return;
    const rot = lerp(-.95, -.38, p) + .06 * Math.sin(t * .5), cx = 1380, cy = 560 + (1 - p) * 120 + 8 * Math.sin(t * .8);
    disc(cx, cy, 380, .8 * p);
    g.save(); g.globalAlpha = p; tiltCard(IMG.card, cx, cy, rot, .95); g.restore();
    // like click
    const c = k(t, 25.4, .9, E.io); if (c > 0 && t < 28.6) { cursor(lerp(1700, 1222, c), lerp(980, 830, c), 1.3, C.white); }
  });
  // 05 · fidelización — glass panel, reviews stacking
  scene('05 Fidelización', 28.8, 35.55, (t) => {
    bgNavy(t, [1300, 520]); leaves(t, 'navy', ['tl', 'br']); sideTexts('rgba(169,196,255,.45)');
    fnTitle(t, 150, '02', 'Después, que vuelvan:', 'FIDELIZACIÓN', 28.86, [['PLAN DE MANTENIMIENTO TRAZO CARE', 30.3, 'Puesta a punto y seguro antirrobo'], ['REVISIÓN GRATIS A LOS 6 MESES', 32.0, 'Cita directa desde la app'], ['APP CON PUNTOS POR KILÓMETRO', 33.98, 'Canjeables en accesorios']]);
    const p = k(t, 29.2, 1.0); if (p <= 0) return;
    g.save(); g.globalAlpha = p; const gx = 1080, gy = 300 + (1 - p) * 60; glass(gx, gy, 700, 560, 30);
    txt('Opiniones de clientes', gx + 40, gy + 64, { f: SERIF, size: 34, w: 600, it: true, col: C.white });
    const R = [['LG', '#FF5A1F', 'Laura G.', 'Estudiante, 21', 'La revisión de los 6 meses fue gratis y en 20 minutos.', 32.2], ['JM', '#2C9A6B', 'Javier M.', 'Trabaja en el centro', 'Con los puntos de la app me llevé el casco gratis.', 34.3], ['MR', '#3D6BD1', 'Marcos R.', 'Repartidor', 'Con TRAZO Care la flota no ha parado ni un día.', 30.6]];
    R.sort((a, b) => a[5] - b[5]).forEach((r, i) => { const q = k(t, r[5], .6, E.back); if (q <= 0) return; const y = gy + 110 + i * 140 + (1 - q) * 40;
      g.save(); g.globalAlpha *= clamp(q); rr(gx + 30, y, 640, 116, 20); g.fillStyle = 'rgba(236,240,248,.94)'; g.fill();
      g.beginPath(); g.arc(gx + 82, y + 58, 30, 0, 7); g.fillStyle = r[1]; g.fill(); txt(r[0], gx + 82, y + 66, { size: 20, w: 700, col: '#fff', align: 'center' });
      const nw = txt(r[2], gx + 130, y + 46, { size: 21, w: 700, col: '#111' }); txt(r[3], gx + 140 + nw, y + 46, { size: 16, w: 400, col: '#7A7F8C' });
      txt(r[4], gx + 130, y + 82, { size: 19, w: 400, col: '#2A2D35' }); g.restore(); });
    g.restore();
  });
  // 06 · análisis — glass dashboard
  scene('06 Análisis', 35.55, 41.1, (t) => {
    bgNavy(t, [1250, 380]); leaves(t, 'navy', ['tr', 'bl']); sideTexts('rgba(169,196,255,.45)'); stamp('rgba(169,196,255,.7)');
    fnTitle(t, 150, '03', 'Para decidir con datos:', 'ANÁLISIS', 35.64, [['ENCUESTAS POST-VENTA', 37.16, 'Después de cada compra'], ['ESTUDIO DE LA COMPETENCIA', 38.18, 'Precios, cuotas y servicio'], ['VENTAS POR ZONA EN EL CRM', 39.76, 'Qué barrio compra qué']]);
    const p = k(t, 35.9, 1.0); if (p <= 0) return;
    g.save(); g.globalAlpha = p; const gx = 1060, gy = 260 + (1 - p) * 60; glass(gx, gy, 720, 600, 30);
    txt('MERCADO', gx + 40, gy + 60, { size: 16, w: 700, ls: 3, col: C.sky });
    // satisfaction
    const s1 = k(t, 37.16, .8); txt('Satisfacción', gx + 40, gy + 120, { size: 20, w: 500, col: C.sky });
    g.save(); g.globalAlpha *= s1; txt('4,6', gx + 40, gy + 210, { size: 96, w: 800, col: C.white }); txt('/5', gx + 190, gy + 210, { size: 40, w: 500, col: C.mute });
    for (let i = 0; i < 5; i++) { const q = k(t, 37.4 + i * .12, .4); g.fillStyle = i < 4 || q < .6 ? (q > .5 ? C.blue2 : 'rgba(169,196,255,.25)') : C.blue2; star(gx + 300 + i * 46, gy + 178, 17 * (.6 + .4 * q)); }
    g.restore();
    // competitors
    const s2 = k(t, 38.18, .9); txt('Cuota de mercado', gx + 40, gy + 290, { size: 20, w: 500, col: C.sky });
    [['TRAZO', 18, C.blue2], ['Competidor A', 34, 'rgba(169,196,255,.4)'], ['Competidor B', 22, 'rgba(169,196,255,.4)']].forEach(([n, v, col], i) => { const y = gy + 330 + i * 46; txt(n, gx + 40, y + 18, { size: 18, w: 500, col: C.white });
      rr(gx + 220, y, 380 * v / 34 * s2, 22, 11); g.fillStyle = col; g.fill(); txt(v + ' %', gx + 630, y + 18, { size: 18, w: 700, col: C.white }); });
    // zones
    const s3 = k(t, 39.76, .9); txt('Ventas por zona', gx + 40, gy + 500, { size: 20, w: 500, col: C.sky });
    [['Ruzafa', 38], ['Benimaclet', 29], ['Centro', 21], ['Campanar', 16], ['Online', 32]].forEach(([n, v], i) => { const x = gx + 260 + i * 88, h = v * 2.2 * k(t, 39.76 + i * .08, .7);
      rr(x, gy + 560 - h, 54, h, 6); g.fillStyle = i === 0 ? C.blue2 : 'rgba(169,196,255,.45)'; g.fill(); txt(n, x + 27, gy + 584, { size: 13, w: 500, col: C.sky, align: 'center' }); });
    g.restore();
  });
  function star(cx, cy, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
  // 07 · gestión — stacked glass documents
  scene('07 Gestión', 41.1, 46.4, (t) => {
    bgNavy(t, [1300, 480]); leaves(t, 'navy', ['tl', 'br']); sideTexts('rgba(169,196,255,.45)');
    fnTitle(t, 150, '04', 'Y que todo funcione:', 'GESTIÓN', 41.16, [['PEDIDOS Y FACTURAS EN EL CRM', 42.82, 'Del pedido a la factura, sin papel'], ['FINANCIACIÓN', 44.34, 'Hasta 12 meses sin intereses'], ['GARANTÍAS Y DEVOLUCIONES', 45.3, '2 años de garantía']]);
    const D = [['PEDIDO #0412', 'TRAZO City · M', '1.349 €', 42.82, -6], ['FACTURA F-2026-0412', 'Base 1.114,88 € + IVA 21 %', '1.349 €', 43.58, 3], ['FINANCIACIÓN', '12 meses · 0 % TIN', '112,42 €/mes', 44.34, -2]];
    D.forEach(([h, s, v, a, rot], i) => { const q = k(t, a - .1, .8, E.back); if (q <= 0) return; g.save(); g.globalAlpha = clamp(q); g.translate(1420 + i * 30, 380 + i * 150 + (1 - q) * 80); g.rotate(rot * Math.PI / 180);
      glass(-300, -80, 600, 170, 24); txt(h, -260, -26, { size: 16, w: 700, ls: 3, col: C.sky }); txt(s, -260, 14, { size: 24, w: 600, col: C.white }); txt(v, 260, 60, { size: 40, w: 800, col: C.white, align: 'right' }); g.restore(); });
    const st = k(t, 45.2, .45, E.in); if (st > 0) { g.save(); g.translate(1640, 800); g.rotate(-.2); g.scale(lerp(2.2, 1, st), lerp(2.2, 1, st)); g.globalAlpha = st;
      g.beginPath(); g.arc(0, 0, 100, 0, 7); g.lineWidth = 6; g.strokeStyle = C.blue2; g.stroke(); txt('2', 0, 22, { size: 84, w: 800, col: C.blue2, align: 'center' }); txt('AÑOS DE GARANTÍA', 0, 56, { size: 13, w: 800, ls: 2, col: C.blue2, align: 'center' }); g.restore(); }
  });
  // 08 · SMART
  scene('08 Objetivos SMART', 46.4, 60.95, (t) => {
    bgNavy(t, [960, 520], 1.05); leaves(t, 'navy', ['tr', 'bl']); sideTexts('rgba(169,196,255,.45)'); stamp('rgba(169,196,255,.7)');
    const head = 1 - k(t, 48.9, .5, E.in);
    if (head > 0) { g.save(); g.globalAlpha = head; words([{ s: 'Nos', it: true }, { s: 'marcamos', it: true }, { s: 'tres', it: true }], 960, 400, { f: SERIF, size: 60, w: 600, col: C.sky, align: 'center' }, [46.48, 46.78, 47.26]);
      words(['OBJETIVOS', { s: 'SMART', col: C.blue2 }], 960, 560, { f: SANS, size: 140, w: 800, col: C.white, align: 'center', ls: 2, blur: 18 }, [47.56, 48.16]);
      ['S · Específico', 'M · Medible', 'A · Alcanzable', 'R · Relevante', 'T · Temporal'].forEach((s, i) => { const q = k(t, 47.8 + i * .08, .5); g.save(); g.globalAlpha *= q; txt(s, 960 + (i - 2) * 250, 660, { f: SERIF, size: 30, w: 600, it: true, col: C.sky, align: 'center' }); g.restore(); }); g.restore(); }
    const OB = [['01', '+20 %', 'DE VENTAS ONLINE', 'ANTES DEL 31/12/2027', 49.24, 53.8], ['02', '15', 'NUEVOS CLIENTES EMPRESA', 'ANTES DEL 30/06/2027', 54.22, 57.3], ['03', '4,6/5', 'DE SATISFACCIÓN', 'DURANTE 2027', 57.54, 61.2]];
    OB.forEach(([n, big, lab, when, a, b]) => { const pin = k(t, a, .8), pout = k(t, b - .35, .4, E.in); if (pin <= 0 || pout >= 1) return;
      g.save(); g.globalAlpha = pin * (1 - pout); const sc = .94 + .06 * pin + .03 * pout; g.translate(960, 540); g.scale(sc, sc); g.translate(-960, -540);
      txt('OBJETIVO ' + n, 960, 300, { size: 20, w: 700, ls: 6, col: C.sky, align: 'center' });
      g.save(); g.filter = 'blur(40px)'; g.globalAlpha *= .6; txt(big, 960, 600, { size: 260, w: 800, col: C.blue2, align: 'center', ls: -4 }); g.restore();
      if (pin < 1) g.filter = `blur(${((1 - pin) * 16).toFixed(1)}px)`; txt(big, 960, 600 + (1 - pin) * 30, { size: 260, w: 800, col: C.white, align: 'center', ls: -4 }); g.filter = 'none';
      txt(lab, 960, 690, { f: SERIF, size: 54, w: 700, ls: 4, col: C.white, align: 'center' });
      const q = k(t, a + .5, .6); g.globalAlpha *= q; pill(960, 730, when, { align: 'center', size: 20, stroke: C.sky, col: C.sky, dash: [6, 5] }); g.restore(); });
  });
  // 09 · supervisión
  scene('09 Supervisión', 60.95, 68.4, (t) => {
    bgNavy(t, [1000, 380]); leaves(t, 'navy', ['tl', 'br']); sideTexts('rgba(169,196,255,.45)');
    const up = k(t, 62.3, .8, E.io);
    g.save(); g.translate(0, -230 * up); const sc = 1 - .35 * up; g.translate(960, 470); g.scale(sc, sc); g.translate(-960, -470);
    words([{ s: '¿Cómo', it: true }, { s: 'lo', it: true }], 960, 380, { f: SERIF, size: 70, w: 600, col: C.sky, align: 'center' }, [61.02, 61.32]);
    words(['CONTROLAMOS?'], 960, 540, { f: SANS, size: 150, w: 800, col: C.white, align: 'center', ls: 2, blur: 18 }, 61.48); g.restore();
    const CARDS = [['CADA LUNES', 'Reunión semanal', '15 minutos · objetivos de la semana', 62.58, 'cal'], ['EN TIEMPO REAL', 'Panel de KPIs', 'CRM · ventas, conversión, ticket medio', 64.16, 'kpi'], ['UNA VEZ AL MES', 'Revisión individual', 'Jefe/a de ventas + vendedor', 66.24, 'one']];
    CARDS.forEach(([kk, h, s, a, ic], i) => { const q = k(t, a - .1, .8, E.back); if (q <= 0) return; const x = 270 + i * 470, y = 420 + (1 - q) * 90;
      g.save(); g.globalAlpha = clamp(q); const rot = (i - 1) * 2.2 * Math.PI / 180; g.translate(x + 200, y + 190); g.rotate(rot); g.translate(-x - 200, -y - 190);
      glass(x, y, 400, 380, 26); icon(ic, x + 40, y + 50, q); txt(kk, x + 40, y + 190, { size: 15, w: 700, ls: 3, col: C.blue2 }); txt(h, x + 40, y + 250, { f: SERIF, size: 44, w: 700, col: C.white }); para(s, x + 40, y + 300, 330, { size: 18, col: C.sky, lh: 24 }); g.restore(); });
  });
  function icon(kind, x, y, p) { g.save(); g.strokeStyle = C.white; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.arc(x + 44, y + 44, 44, 0, 7); g.fillStyle = 'rgba(59,123,255,.25)'; g.fill();
    g.setLineDash([200, 200]); g.lineDashOffset = 200 * (1 - p); g.beginPath();
    if (kind === 'cal') { g.rect(x + 22, y + 26, 44, 40); g.moveTo(x + 22, y + 38); g.lineTo(x + 66, y + 38); g.moveTo(x + 32, y + 20); g.lineTo(x + 32, y + 30); g.moveTo(x + 56, y + 20); g.lineTo(x + 56, y + 30); }
    if (kind === 'kpi') { g.moveTo(x + 20, y + 62); g.lineTo(x + 36, y + 44); g.lineTo(x + 48, y + 54); g.lineTo(x + 68, y + 28); g.moveTo(x + 56, y + 28); g.lineTo(x + 68, y + 28); g.lineTo(x + 68, y + 40); }
    if (kind === 'one') { g.arc(x + 32, y + 36, 9, 0, 7); g.moveTo(x + 65, y + 36); g.arc(x + 56, y + 36, 9, 0, 7); g.moveTo(x + 18, y + 66); g.quadraticCurveTo(x + 32, y + 48, x + 46, y + 66); g.moveTo(x + 42, y + 66); g.quadraticCurveTo(x + 56, y + 48, x + 70, y + 66); }
    g.stroke(); g.setLineDash([]); g.restore(); }
  // 10 · motivación (black, cyclist in a disc, big pills)
  scene('10 Motivación', 68.4, 73.3, (t) => {
    bgBlack(t); leaves(t, 'navy', ['tr']); sideTexts('rgba(169,196,255,.35)');
    words([{ s: 'Y', it: true }, { s: 'para', it: true }], 960, 190, { f: SERIF, size: 54, w: 600, col: C.sky, align: 'center' }, [68.5, 68.7]);
    words(['MOTIVAR', 'AL', 'EQUIPO'], 960, 300, { f: SANS, size: 104, w: 800, col: C.white, align: 'center', ls: 2 }, [68.92, 69.36, 69.5]);
    const p = k(t, 69.0, 1.0); if (p > 0) { g.save(); g.globalAlpha = p; disc(960, 700, 290 * (.85 + .15 * p)); if (p < 1) g.filter = `blur(${((1 - p) * 12).toFixed(1)}px)`; photo(IMG.cyclistCool, 960 + (1 - p) * 140, 960, 420); g.restore(); }
    [['COMISIÓN DEL 3 %', 70.14, -560], ['BONUS TRIMESTRAL', 71.24, 0], ['VENDEDOR DEL MES', 72.02, 560]].forEach(([s, a, dx]) => { const q = k(t, a - .05, .55, E.back); if (q <= 0) return; g.save(); g.globalAlpha = clamp(q); pill(960 + dx, 990 - (q) * 10, s, { align: 'center', size: 28, fill: C.white, col: C.ink, lw: 0 }); g.restore(); });
  });
  // 11 · factores (Valencia photo in a tall arch card)
  scene('11 Factores', 73.3, 81.65, (t) => {
    bgNavy(t, [960, 480]); leaves(t, 'navy', ['tl', 'br']); sideTexts('rgba(169,196,255,.45)'); stamp('rgba(169,196,255,.7)');
    const p = k(t, 73.5, 1.2); if (p > 0) { g.save(); g.globalAlpha = p; const w = 520, h = 700, x = 960 - w / 2, y = 230 + (1 - p) * 60;
      g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.save(); g.clip();
      const s = 1.08 - .06 * k(t, 73.5, 8, E.soft), iw = IMG.valenciaCool.width, ih = IMG.valenciaCool.height, sc = Math.max(w / iw, h / ih) * s; g.drawImage(IMG.valenciaCool, 960 - iw * sc / 2, y + h / 2 - ih * sc / 2, iw * sc, ih * sc); g.restore();
      g.lineWidth = 2; g.strokeStyle = 'rgba(190,210,255,.5)'; g.stroke(); g.restore();
      const q = k(t, 79.62, .6); g.save(); g.globalAlpha = q; pill(960, 870, 'VALENCIA · CIUDAD PERFECTA PARA LA BICI', { align: 'center', size: 20, fill: C.white, col: C.ink }); g.restore(); }
    words(['INTERNOS'], 420, 260, { f: SERIF, size: 64, w: 700, col: C.white, align: 'center', ls: 3 }, 73.45);
    words(['EXTERNOS'], 1500, 260, { f: SERIF, size: 64, w: 700, col: C.blue2, align: 'center', ls: 3 }, 76.9);
    const F = [[420, 74.02, 'EMPRESA PEQUEÑA', '12 personas en total'], [420, 75.4, 'PRODUCTO QUE HAY QUE PROBAR', 'la demostración vende'], [1500, 77.86, 'PARTICULARES Y EMPRESAS', 'dos formas de comprar'], [1500, 79.62, 'UBICACIÓN: VALENCIA', 'llana y con carril bici']];
    let li = 0, ri = 0;
    F.forEach(([x, a, h, s]) => { const i = x < 960 ? li++ : ri++; const q = k(t, a - .1, .6); if (q <= 0) return; g.save(); g.globalAlpha = q; const y = 360 + i * 200 + (1 - q) * 20;
      glass(x - 230, y, 460, 150, 22); txt(h, x, y + 66, { size: 22, w: 800, ls: 1, col: C.white, align: 'center' }); txt(s, x, y + 106, { f: SERIF, size: 28, w: 600, it: true, col: C.sky, align: 'center' }); g.restore(); });
  });
  // 12 · organigrama (glass nodes, drawing lines)
  scene('12 Organigrama', 81.65, 89.55, (t) => {
    bgNavy(t, [960, 300]); leaves(t, 'navy', ['tr', 'bl']); sideTexts('rgba(169,196,255,.45)');
    words([{ s: 'Por', it: true }, { s: 'eso', it: true }, { s: 'elegimos', it: true }, { s: 'una', it: true }], 960, 140, { f: SERIF, size: 44, w: 600, col: C.sky, align: 'center' }, [81.72, 81.98, 82.2, 82.72]);
    words(['ESTRUCTURA', { s: 'MIXTA', col: C.blue2 }], 960, 240, { f: SANS, size: 92, w: 800, col: C.white, align: 'center', ls: 3 }, [83.0, 83.5]);
    [['POR CLIENTE', 84.16, -170], ['POR CANAL', 85.12, 170]].forEach(([s, a, dx]) => { const q = k(t, a, .5); if (q <= 0) return; g.save(); g.globalAlpha = q; pill(960 + dx, 280, s, { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] }); g.restore(); });
    const node = (x, y, h, s, a, top) => { const q = k(t, a, .6, E.back); if (q <= 0) return; g.save(); g.globalAlpha = clamp(q); const w = Math.max(measure(h, { size: 26, w: 700 }), measure(s, { size: 16, w: 500 })) + 70, Y = y + (1 - q) * 20;
      if (top) { rr(x - w / 2, Y - 46, w, 92, 18); g.fillStyle = C.white; g.fill(); txt(h, x, Y + 2, { size: 26, w: 800, col: C.ink, align: 'center' }); txt(s, x, Y + 30, { size: 15, w: 600, ls: 2, col: '#4A5872', align: 'center' }); }
      else { glass(x - w / 2, Y - 46, w, 92, 18); txt(h, x, Y + 2, { size: 26, w: 700, col: C.white, align: 'center' }); txt(s, x, Y + 30, { size: 15, w: 600, ls: 2, col: C.sky, align: 'center' }); } g.restore(); };
    const line = (pts, a, d) => { const q = k(t, a, d, E.io); if (q <= 0) return; let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      g.save(); g.strokeStyle = 'rgba(169,196,255,.7)'; g.lineWidth = 3; g.setLineDash([L, L]); g.lineDashOffset = L * (1 - q); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore(); };
    line([[960, 450], [960, 520], [420, 520], [420, 590]], 85.9, .8); line([[960, 520], [960, 590]], 87.3, .5); line([[960, 520], [1500, 520], [1500, 590]], 88.4, .6);
    line([[420, 682], [420, 720], [270, 720], [270, 770]], 86.6, .6); line([[420, 720], [580, 720], [580, 770]], 86.7, .6); line([[960, 682], [960, 770]], 87.9, .5);
    node(960, 405, 'Dirección Comercial', '1 DIRECTOR/A', 85.3, true);
    node(420, 636, 'Ventas Particulares', 'CLIENTE · PARTICULAR', 86.08); node(960, 636, 'Ventas Empresas', 'CLIENTE · EMPRESA', 87.48); node(1500, 636, 'Administración', 'Y ANÁLISIS · 2', 88.64);
    node(270, 816, 'Tienda Ruzafa', 'CANAL · TIENDA ×3', 86.9); node(580, 816, 'Venta online', 'CANAL · ONLINE ×2', 87.0); node(960, 816, 'Cuentas clave', 'CANAL · B2B ×2', 88.1);
  });
  // 13 · final (black + grain, giant type)
  scene('Final', 89.55, DUR, (t) => {
    bgBlack(t);
    const dust = rng(1000 + Math.floor(t * 12)); g.save(); g.fillStyle = 'rgba(200,215,255,.35)'; for (let i = 0; i < 40; i++) { g.globalAlpha = .2 + dust() * .5; g.fillRect(dust() * W, dust() * H, 1 + dust() * 2, 1 + dust() * 2); } g.restore();
    const p = k(t, 89.94, 1.1);
    if (p > 0) { g.save(); const sc = 1.25 - .25 * p + .02 * k(t, 91, 6, E.soft); g.translate(960, 560); g.scale(sc, sc); g.globalAlpha = p; if (p < 1) g.filter = `blur(${((1 - p) * 24).toFixed(1)}px)`;
      txt('TRAZO', -40, 80, { size: 300, w: 800, col: C.white, align: 'center', ls: 6 }); g.filter = 'none'; g.beginPath(); g.arc(468, 62, 30, 0, 7); g.fillStyle = C.orange; g.globalAlpha = p * k(t, 90.5, .5); g.fill(); g.restore(); }
    words([{ s: 'movilidad', it: true }, { s: 'eléctrica', it: true }, { s: 'para', it: true }, { s: 'Valencia', it: true }], 960, 760, { f: SERIF, size: 50, w: 600, col: C.sky, align: 'center' }, [90.82, 91.44, 91.96, 92.2]);
    words(['GRACIAS'], 960, 900, { f: SERIF, size: 64, w: 700, col: C.white, align: 'center', ls: 12 }, 93.24);
    const q = k(t, 91.2, 1); g.save(); g.globalAlpha = q;
    txt('Presentado por Yasser', 140, 120, { f: SERIF, size: 26, w: 600, it: true, col: C.sky }); txt('Departamento de ventas', W - 140, 120, { f: SERIF, size: 26, w: 600, it: true, col: C.sky, align: 'right' });
    txt('Práctica final · RA3', 140, H - 90, { f: SERIF, size: 26, w: 600, it: true, col: C.sky }); txt('Valencia · 2026', W - 140, H - 90, { f: SERIF, size: 26, w: 600, it: true, col: C.sky, align: 'right' }); g.restore();
  });

  // ------------------------------------------------------------------ tilted social card (perspective by vertical strips)
  function buildCard() {
    const w = 540, h = 760, c = mk(w, h), x = c.getContext('2d'); const og = g; g = x;
    rr(0, 0, w, h, 30); x.fillStyle = '#F7F8FB'; x.fill(); x.save(); rr(0, 0, w, h, 30); x.clip();
    x.beginPath(); x.arc(46, 46, 22, 0, 7); x.fillStyle = C.ink; x.fill(); x.beginPath(); x.arc(46, 46, 7, 0, 7); x.fillStyle = C.orange; x.fill();
    txt('trazo.vlc', 80, 54, { size: 21, w: 700, col: '#111' }); txt('· Seguir', 178, 54, { size: 19, w: 600, col: '#2F6FD6' });
    const im = IMG.cyclistPhoto, ih = 440, iw = w - 40, s = Math.max(iw / im.width, ih / im.height); x.save(); rr(20, 86, iw, ih, 16); x.clip(); x.filter = 'saturate(.8) contrast(1.05)'; x.drawImage(im, 20 + iw / 2 - im.width * s / 2, 86 + ih / 2 - im.height * s / 2, im.width * s, im.height * s); x.filter = 'none';
    const gr = x.createLinearGradient(0, 86, 0, 300); gr.addColorStop(0, 'rgba(6,16,31,.65)'); gr.addColorStop(1, 'rgba(6,16,31,0)'); x.fillStyle = gr; x.fillRect(20, 86, iw, 240); x.restore();
    txt('este jueves,', 46, 140, { f: SERIF, size: 34, w: 600, it: true, col: '#fff' }); txt('PRUÉBALA GRATIS', 46, 190, { size: 40, w: 800, col: '#fff' });
    rr(w - 170, 108, 130, 34, 8); x.fillStyle = C.orange; x.fill(); txt('CAMPUS UPV', w - 105, 131, { size: 14, w: 800, ls: 1.5, col: '#fff', align: 'center' });
    x.fillStyle = '#FF3B4E'; x.beginPath(); x.moveTo(40, 572); x.bezierCurveTo(40, 552, 64, 552, 64, 566); x.bezierCurveTo(64, 552, 88, 552, 88, 572); x.bezierCurveTo(88, 588, 64, 598, 64, 606); x.bezierCurveTo(64, 598, 40, 588, 40, 572); x.fill();
    x.strokeStyle = '#111'; x.lineWidth = 3; x.beginPath(); x.arc(126, 576, 16, 0, 7); x.stroke(); x.beginPath(); x.moveTo(166, 562); x.lineTo(200, 576); x.lineTo(166, 592); x.closePath(); x.stroke();
    txt('2.418 Me gusta', 40, 646, { size: 22, w: 700, col: '#111' }); txt('Ven a probarla al campus →', 40, 684, { size: 20, w: 400, col: '#333' }); txt('#TrazoVLC #MuéveteEléctrico', 40, 716, { size: 20, w: 500, col: '#2F6FD6' });
    x.restore(); g = og; return c;
  }
  function tiltCard(img, cx, cy, rot, scale) {
    const w = img.width * scale, h = img.height * scale, f = 1800, N = 90, cs = Math.cos(rot), sn = Math.sin(rot);
    // side thickness
    g.save(); g.fillStyle = '#B9C3D6';
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, X0 = (u0 - .5) * w, X1 = (u1 - .5) * w;
      const z0 = X0 * sn, z1 = X1 * sn, p0 = f / (f + z0), p1 = f / (f + z1), sx0 = cx + X0 * cs * p0, sx1 = cx + X1 * cs * p1;
      g.drawImage(img, u0 * img.width, 0, img.width / N + .6, img.height, sx0, cy - h / 2 * p0, Math.max(.6, sx1 - sx0 + .6), h * p0); }
    g.restore();
    // sheen
    g.save(); g.globalCompositeOperation = 'soft-light'; const gr = g.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(cx - w * .5, cy - h * .5, w, h); g.restore();
  }

  // ------------------------------------------------------------------ composition: scene buffers + blur-zoom transitions
  const XF = .38;     // half transition length
  const bufA = mk(W, H), bufB = mk(W, H);
  function drawScene(s, t, ctx) { const og = g; g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    // slow camera push per scene, never static
    const lt = (t - s.t0) / (s.t1 - s.t0), sc = 1 + .025 * lt; g.translate(960, 540); g.scale(sc, sc); g.translate(-960 + 4 * Math.sin(t * .5), -540 + 3 * Math.cos(t * .4));
    s.draw(t); g = og; }
  function frame(t) {
    T = t; const cur = SC.findIndex(s => t >= s.t0 && t < s.t1), i = cur < 0 ? SC.length - 1 : cur, s = SC[i];
    const nxt = SC[i + 1], prv = SC[i - 1];
    let A = s, B = null, p = 0;
    if (nxt && t > s.t1 - XF) { B = nxt; p = (t - (s.t1 - XF)) / (2 * XF); } else if (prv && t < s.t0 + XF) { A = prv; B = s; p = (t - (s.t0 - XF)) / (2 * XF); }
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none';
    if (!B) { drawScene(A, t, main); }
    else {
      const e = E.io(clamp(p));
      drawScene(A, t, bufA.getContext('2d')); drawScene(B, t, bufB.getContext('2d'));
      main.fillStyle = '#000'; main.fillRect(0, 0, W, H);
      const blurA = 22 * e, blurB = 22 * (1 - e);
      main.save(); main.translate(960, 540); main.scale(1 + .12 * e, 1 + .12 * e); main.translate(-960, -540); main.globalAlpha = 1; if (blurA > .5) main.filter = `blur(${blurA.toFixed(1)}px)`; main.drawImage(bufA, 0, 0); main.restore();
      main.save(); main.translate(960, 540); main.scale(.9 + .1 * e, .9 + .1 * e); main.translate(-960, -540); main.globalAlpha = e; if (blurB > .5) main.filter = `blur(${blurB.toFixed(1)}px)`; main.drawImage(bufB, 0, 0); main.restore();
      main.filter = 'none';
    }
    // finish: vignette + grain (+ stronger grain in the black finale)
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1;
    const vg = main.createRadialGradient(960, 540, 500, 960, 540, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); main.fillStyle = vg; main.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = main.createPattern(grainTile, 'repeat');
    const fi = Math.floor(t * 30); main.save(); main.globalAlpha = t > 89.5 ? .1 : .05; main.globalCompositeOperation = 'overlay'; main.translate((fi * 37) % 128 - 64, (fi * 53) % 128 - 64); main.fillStyle = grainPat; main.fillRect(-64, -64, W + 128, H + 128); main.restore();
  }

  window.VH_SCENES = SC.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 }));
  window.renderOut = function (t) { frame(clamp(+t || 0, 0, DUR)); };

  (async () => {
    const faces = [
      ['IT', 'intertight-latin.woff2', '100 900', 'normal', 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212'], ['IT', 'intertight-ext.woff2', '100 900', 'normal', 'U+0100-024F, U+1E00-1EFF'],
      ...['600', '700'].flatMap(w => ['normal', 'italic'].flatMap(st => [['CG', `cormorant-garamond-latin-${w}-${st}.woff2`, w, st, 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212'], ['CG', `cormorant-garamond-latin-ext-${w}-${st}.woff2`, w, st, 'U+0100-024F, U+1E00-1EFF']]))];
    for (const [fam, file, weight, style, ur] of faces) { const f = new FontFace(fam, `url(fonts/${file})`, { weight, style, unicodeRange: ur }); document.fonts.add(f); await f.load(); }
    await Promise.all([loadImage('ebike', 'assets/cut/ebike.png'), loadImage('courier', 'assets/cut/courier.png'), loadImage('student', 'assets/cut/student.png'), loadImage('cyclist', 'assets/cut/cyclist.png'),
      loadImage('cyclistPhoto', 'assets/photos/cyclist.jpg'), loadImage('valencia', 'assets/photos/valencia.jpg')]);
    await document.fonts.ready;
    IMG.ebikeMono = grade(IMG.ebike, 'mono'); IMG.studentCool = grade(IMG.student, 'cool'); IMG.courierCool = grade(IMG.courier, 'cool'); IMG.cyclistCool = grade(IMG.cyclist, 'cool');
    { const v = IMG.valencia, c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.5) contrast(1.1) brightness(.85)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.55)'; x.fillRect(0, 0, c.width, c.height); IMG.valenciaCool = c; }
    LEAF.paper = blurred(branch(11, 'rgba(18,40,90,.92)', '#1D3E86'), 6); LEAF.navy = blurred(branch(23, 'rgba(14,44,110,.95)', '#FF5A1F'), 10);
    IMG.card = buildCard();
    window.renderOut(0);
    window.READY = true;
  })();
})();
