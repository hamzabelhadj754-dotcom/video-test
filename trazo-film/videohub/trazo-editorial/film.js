// TRAZO · "Un solo trazo" (v08) for VideoHub — one 1920x1080 canvas, window.renderOut(t) is a pure function of t.
// The idea: TRAZO means "stroke". One orange line draws the whole film — it is born from the dot of YASSER., draws the
// e-bike that becomes the photo, carries the camera from scene to scene, draws the charts, ticks and org chart, and
// finally writes TRAZO and becomes the logo's dot. World: paper → navy → black; serif caps + Bricolage Grotesque.
(function () {
  'use strict';
  const W = 1920, H = 1080, DUR = 96.4;
  const cv = document.getElementById('c'), main = cv.getContext('2d');
  const C = { paper: '#EDF0F5', ink: '#0B1A33', navy: '#06101F', blue: '#1D5BD8', blue2: '#3B7BFF', sky: '#A9C4FF', white: '#F4F6FA', mute: '#8A93A6', orange: '#FF5A1F' };
  const SERIF = '"CG"', SANS = '"IT"', DISP = '"BG"', OR = '#FF5A1F';

  // ------------------------------------------------------------------ math / easing (deterministic)
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const bez = (x1, y1, x2, y2) => t => { let u = t; for (let i = 0; i < 8; i++) { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx; const x = ((ax * u + bx) * u + cx) * u - t; const d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(d) < 1e-6) break; u -= x / d; } const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; return ((ay * u + by) * u + cy) * u; };
  const backS = t => { const c1 = .9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const E = { backS: t => backS(t), out: bez(.16, 1, .3, 1), in: bez(.64, 0, .78, 0), io: bez(.65, 0, .35, 1), soft: bez(.33, 0, .2, 1), pen: bez(.42, .1, .28, 1), back: t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } };
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
    x.filter = mode === 'mono' ? 'grayscale(1) contrast(1.15) brightness(1.02)' : mode === 'soft' ? 'saturate(.95) contrast(1.06) brightness(1.02)' : 'saturate(.55) contrast(1.1) brightness(.92)';
    x.drawImage(img, 0, 0); x.filter = 'none';
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = mode === 'mono' ? 'rgba(40,70,130,.42)' : mode === 'soft' ? 'rgba(30,80,200,.1)' : 'rgba(30,80,200,.28)'; x.globalCompositeOperation = mode === 'mono' ? 'color' : 'soft-light'; x.fillRect(0, 0, c.width, c.height);
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
    if (g.canvas.width === W && a > .02) { const m = g.getTransform(), P = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
      const x0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[0])) - 80)), y0 = Math.max(0, Math.floor(Math.min(...P.map(q => q[1])) - 80)), x1 = Math.min(W, Math.ceil(Math.max(...P.map(q => q[0])) + 80)), y1 = Math.min(H, Math.ceil(Math.max(...P.map(q => q[1])) + 80));
      if (x1 - x0 > 4 && y1 - y0 > 4) { g.save(); rr(x, y, w, h, r); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(22px) saturate(1.35) brightness(1.06)'; g.drawImage(g.canvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); g.restore(); } }
    rr(x, y, w, h, r); const gr = g.createLinearGradient(x, y, x + w * .6, y + h); gr.addColorStop(0, 'rgba(160,190,255,.16)'); gr.addColorStop(1, 'rgba(60,100,200,.05)'); g.fillStyle = gr; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(190,210,255,.28)'; g.stroke();
    rr(x + 1, y + 1, w - 2, h * .45, r); const sh = g.createLinearGradient(x, y, x, y + h * .45); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fill();
    g.restore();
  }
  function cursor(x, y, s = 1, col = C.ink, edge) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, 0); g.lineTo(36, 14); g.lineTo(20, 20); g.lineTo(14, 36); g.closePath(); g.fillStyle = col; g.fill(); if (edge) { g.shadowColor = 'transparent'; g.lineWidth = 2; g.lineJoin = 'round'; g.strokeStyle = edge; g.stroke(); } g.restore(); }
  function barcode(x, y, w, h, col) { const r = rng(77); g.fillStyle = col; let cx = x; while (cx < x + w) { const bw = [1, 1, 2, 3][Math.floor(r() * 4)]; if (r() > .35) g.fillRect(cx, y, bw, h); cx += bw + 1 + Math.floor(r() * 2); } }
  function brackets(x, y, w, h, col, len = 26, a = 1) { g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
    g.moveTo(x, y + len); g.lineTo(x, y); g.lineTo(x + len, y); g.moveTo(x + w - len, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - len); g.stroke(); g.restore(); }
  function para(s, x, y, w, o) { font(o.f || SANS, o.size || 16, o.w || 400); const lines = []; let line = ''; for (const wd of s.split(' ')) { const tryL = line ? line + ' ' + wd : wd; if (g.measureText(tryL).width > w && line) { lines.push(line); line = wd; } else line = tryL; } lines.push(line);
    lines.forEach((l, i) => txt(l, o.align === 'center' ? x + w / 2 : x, y + i * (o.lh || 22), Object.assign({}, o))); return lines.length; }
  function rimGlow(img) { const pad = 60, c = mk(img.width + pad * 2, img.height + pad * 2), x = c.getContext('2d'); x.filter = 'blur(26px)'; x.drawImage(img, pad, pad); x.filter = 'none';
    x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgba(90,150,255,.9)'; x.fillRect(0, 0, c.width, c.height); return c; }
  function rays(t, a = 1) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = .05 * a; g.translate(1650, -120); g.rotate(.62 + .02 * Math.sin(t * .3));
    for (let i = 0; i < 5; i++) { const w = 160 + i * 60, x = (i - 2) * 190 + 30 * Math.sin(t * .4 + i); const gr = g.createLinearGradient(0, 0, 0, 1800); gr.addColorStop(0, 'rgba(150,190,255,.9)'); gr.addColorStop(1, 'rgba(150,190,255,0)'); g.fillStyle = gr; g.fillRect(x - w / 2, 0, w, 1800); }
    g.restore(); }
  function sweep(x, y, w, h, t0, r = 24) { const q = (T - t0) / .9; if (q <= 0 || q >= 1) return; g.save(); rr(x, y, w, h, r); g.clip(); const sx = x - 300 + (w + 600) * E.io(q);
    const gr = g.createLinearGradient(sx - 160, y, sx + 160, y + h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore(); }
  function photo(img, cx, by, h, o = {}) {   // cut-out standing on baseline by, centred at cx, height h
    const s = h / img.height, w = img.width * s;
    if (o.shadow !== false) { g.save(); g.globalAlpha *= .45; const gr = g.createRadialGradient(cx, by, 0, cx, by, w * .55); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.scale(1, .12); g.fillRect(cx - w, by / .12 - w * .55, w * 2, w * 1.1); g.restore(); }
    if (img.glow) { const pad = 60 * s; g.save(); g.globalAlpha *= .55; g.globalCompositeOperation = 'screen'; g.drawImage(img.glow, cx - w / 2 - pad, by - h - pad, w + pad * 2, h + pad * 2); g.restore(); }
    g.drawImage(img, cx - w / 2, by - h, w, h);
  }
  function disc(cx, cy, r, a = 1) { g.save(); g.globalAlpha *= a; const gr = g.createRadialGradient(cx - r * .25, cy - r * .3, r * .1, cx, cy, r); gr.addColorStop(0, '#2C6BE8'); gr.addColorStop(.7, '#174AA8'); gr.addColorStop(1, 'rgba(23,74,168,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.restore(); }

  // ------------------------------------------------------------------ motion kit (v03): every element is built on screen
  const EVS = window.VH_EVENTS = {};                                     // sound-design log: what happens when (read by tools)
  const ev = (type, t, x) => { const key = type + ':' + t.toFixed(3); if (!EVS[key]) EVS[key] = Object.assign({ type, t: +t.toFixed(3) }, x || {}); };
  // damped spring: 0 → 1 with one overshoot and a small settle
  const spring = (t0, f = 1.5, d = 6.5) => { const x = T - t0; return x <= 0 ? 0 : 1 - Math.exp(-x * d * 1.22) * Math.cos(x * 2 * Math.PI * f); };
  const shakeAt = (t0, amp = 10, dur = .5) => { const x = T - t0; if (x < 0 || x > dur) return [0, 0]; const a = amp * Math.exp(-x * 8); return [a * Math.sin(x * 97), a * Math.cos(x * 71)]; };
  // true motion blur for fast moves: re-draw the element at earlier instants, the current one solid, the trail fading
  function motion(fn) { fn(); }   // v06: single draw (multi-sample trails read as a lagging double image)
  // letter-by-letter typing: each new glyph pops (scale + blur), blinking caret, settled text drawn kerned
  function typeOn(s, x, y, t0, o = {}) {
    const cps = o.cps || 22, fo = Object.assign({ f: SANS, size: 24, w: 600 }, o, { align: 'left' }), size = fo.size;
    const full = measure(s, fo), X = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
    if (T < t0) return full; ev('type', t0, { n: s.replace(/ /g, '').length, cps });
    const n = Math.min(s.length, Math.floor((T - t0) * cps) + 1);
    let st = 0; while (st < n && T - (t0 + st / cps) >= .2) st++;
    if (st) txt(s.slice(0, st), X, y, fo);
    for (let i = st; i < n; i++) { const ch = s[i]; if (ch === ' ') continue; const p = clamp((T - (t0 + i / cps)) / .2), cx = X + measure(s.slice(0, i), fo), cw = measure(ch, fo);
      g.save(); g.globalAlpha *= p; if (o.pop !== false) { const sc = 1 + .18 * (1 - E.out(p)), py = y - size * .35; g.translate(cx + cw / 2, py); g.scale(sc, sc); g.translate(-(cx + cw / 2), -py); }
      if (p < 1) g.filter = `blur(${(3 * (1 - p)).toFixed(1)}px)`; txt(ch, cx, y, fo); g.restore(); }
    const tEnd = t0 + (s.length - 1) / cps, hold = o.caretHold != null ? o.caretHold : .45;
    if (o.caret !== false && T < tEnd + hold) { g.save(); g.globalAlpha *= 1 - clamp((T - tEnd - hold + .25) / .25);
      g.fillStyle = o.caretCol || fo.col || C.white; g.fillRect(X + measure(s.slice(0, n), fo) + 4, y - size * .76, Math.max(2, size * .045), size * .9); g.restore(); }
    return full;
  }
  // design-tool selection box: dashed, marching, with corner handles; grows in from the left
  function selBox(x, y, w, h, t0, col, hcol, a = 1) { const p = t0 < -50 ? 1 : k(T, t0, .5, E.out); if (p <= 0) return; ev('box', t0 < -50 ? 0 : t0);
    g.save(); g.globalAlpha *= p * a; g.strokeStyle = col; g.lineWidth = 2; g.setLineDash([9, 7]); g.lineDashOffset = -T * 18; const ww = w * (.25 + .75 * p);
    rr(x, y, ww, h, 4); g.stroke(); g.setLineDash([]);
    for (const [hx, hy] of [[x, y], [x + ww, y], [x, y + h], [x + ww, y + h]]) { g.fillStyle = hcol; g.fillRect(hx - 6, hy - 6, 12, 12); g.lineWidth = 2; g.strokeRect(hx - 6, hy - 6, 12, 12); }
    g.restore(); }
  // a pill that arrives as an empty bar sliding in from the left, then its label types in
  function pillBar(x, y, t0, text, o = {}) {
    const size = o.size || 20, padX = o.padX || 26, h = o.h || size * 2.1, fo = { f: SANS, w: 700, ls: 1.5, size, col: o.col || C.white };
    const w = measure(text, fo) + padX * 2, p = clamp((T - t0) / .55); if (p <= 0) return w; ev('bar', t0);
    const out = o.out ? k(T, o.out, .4, E.in) : 0; if (out >= 1) return w;
    const ww = h + (w - h) * Math.max(0, E.backS(p)), X = (o.align === 'center' ? x - w / 2 : x) - 70 * (1 - E.out(p)) - 60 * out;
    g.save(); g.globalAlpha *= clamp(p * 3) * (1 - out); if (out > 0) g.filter = `blur(${(8 * out).toFixed(1)}px)`;
    rr(X, y, ww, h, o.rad != null ? o.rad : h / 2); if (o.fill) { g.fillStyle = o.fill; g.fill(); }
    if (o.stroke) { g.lineWidth = o.lw || 2; g.strokeStyle = o.stroke; if (o.dash) g.setLineDash(o.dash); g.stroke(); g.setLineDash([]); }
    rr(X, y, ww, h, h / 2); g.clip(); typeOn(text, X + padX, y + h / 2 + size * .36, o.tText != null ? o.tText : t0 + .22, Object.assign({}, fo, { cps: o.cps || 34, caret: false }));
    g.restore(); return w;
  }
  // one pill whose label is replaced in place: old text pushes up and blurs away, new text types, the bar springs to fit
  function pillSwap(cx, y, list, t0, o = {}) {
    const size = o.size || 22, padX = o.padX || 30, h = size * 2.1, fo = { f: SANS, w: 700, ls: 1.5, size, col: o.col || C.white };
    const p = clamp((T - t0) / .55); if (p <= 0) return; ev('bar', t0);
    let i = -1; list.forEach((L, j) => { if (T >= L[1]) i = j; });
    const wOf = j => j < 0 ? h * 2.4 : measure(list[j][0], fo) + padX * 2, q = i < 0 ? 1 : E.backS(clamp((T - list[i][1]) / .5));
    let ww = lerp(wOf(i - 1), wOf(i), q); ww = h + (ww - h) * Math.max(0, E.backS(p));
    const X = cx - ww / 2 - 60 * (1 - E.out(p)), out = o.out ? k(T, o.out, .4, E.in) : 0;
    g.save(); g.globalAlpha *= clamp(p * 3) * (1 - out);
    rr(X, y, ww, h, h / 2); if (o.fill) { g.fillStyle = o.fill; g.fill(); } if (o.stroke) { g.lineWidth = o.lw || 2; g.strokeStyle = o.stroke; g.stroke(); }
    rr(X, y, ww, h, h / 2); g.clip(); const by = y + h / 2 + size * .36;
    if (i >= 0) { ev('swap', list[i][1]); const qo = k(T, list[i][1], .3, E.in);
      if (i > 0 && qo < 1) { g.save(); g.globalAlpha *= 1 - qo; g.filter = `blur(${(6 * qo).toFixed(1)}px)`; txt(list[i - 1][0], cx, by - h * .8 * qo, Object.assign({}, fo, { align: 'center' })); g.restore(); }
      typeOn(list[i][0], cx, by, list[i][1] + .06, Object.assign({}, fo, { align: 'center', cps: 32, caret: false })); }
    g.restore();
  }
  // image resolving from a pale blurred "ghost" into the solid photo
  function ghost(img, cx, by, h, t0, o = {}) { const a = k(T, t0, 1.0, E.out); if (a <= 0) return; ev('ghost', t0);
    const sc = 1.04 - .04 * a, py = by - h / 2; g.save(); g.globalAlpha *= clamp(a * 1.6); g.translate(cx, py); g.scale(sc, sc); g.translate(-cx, -py);
    if (a < 1) g.filter = `blur(${(10 * (1 - a)).toFixed(1)}px)`; photo(img, cx, by, h, o); g.restore(); }
  // keyframed cursor: glides on a slight arc, presses on clicks (ring), fades in/out
  function cursorPath(keys, col = C.ink, edge = '#fff', s = 1.15) {
    const t0 = keys[0][0], t1 = keys[keys.length - 1][0]; if (T < t0 - .35 || T > t1 + .45) return;
    let x = keys[0][1], y = keys[0][2];
    if (T >= t1) { x = keys[keys.length - 1][1]; y = keys[keys.length - 1][2]; }
    else if (T > t0) { let j = 0; while (keys[j + 1][0] <= T) j++; const A = keys[j], B = keys[j + 1], u = E.io((T - A[0]) / (B[0] - A[0])), bend = Math.sin(Math.PI * u) * 30, dx = B[1] - A[1], dy = B[2] - A[2], L = Math.hypot(dx, dy) || 1;
      x = lerp(A[1], B[1], u) - dy / L * bend; y = lerp(A[2], B[2], u) + dx / L * bend; }
    const al = clamp((T - (t0 - .35)) / .3) * (1 - clamp((T - t1 - .1) / .35)); let press = 1;
    for (const K of keys) if (K[3]) { ev('click', K[0]); const d = T - K[0];
      if (d >= 0 && d < .5) { g.save(); g.globalAlpha = al * (1 - d / .5) * .85; g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(K[1], K[2], 10 + 44 * E.out(d / .5), 0, 7); g.stroke(); g.restore(); }
      if (d >= 0 && d < .2) press = Math.min(press, 1 - .2 * Math.sin(Math.PI * d / .2)); }
    g.save(); g.globalAlpha *= al; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 5; cursor(x, y, s * press, col, edge); g.restore();
  }
  // small word that springs in (superscripts, numbers)
  function popText(s, x, y, t0, o = {}) { if (T < t0) return; ev('pop', t0); const q = k(T, t0, .5, E.out), sp = .9 + .1 * q, m = measure(s, o), cx = o.align === 'center' ? x : o.align === 'right' ? x - m / 2 : x + m / 2, cy = y - (o.size || 24) * .35;
    g.save(); g.globalAlpha *= q; g.translate(cx, cy + 10 * (1 - q)); g.scale(sp, sp); g.translate(-cx, -cy); txt(s, x, y, o); g.restore(); }
  // odometer: digits roll up into place, other glyphs rise in
  function roll(str, x, y, t0, o) { const fo = Object.assign({ f: SANS, w: 800, size: 200, col: C.white }, o, { align: 'left' }), sz = fo.size, lh = sz * 1.0;
    const full = measure(str, fo), X = o.align === 'center' ? x - full / 2 : x; if (T < t0) return; ev('roll', t0, { n: str.length });
    for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch === ' ') continue; const cx = X + measure(str.slice(0, i), fo), cw = measure(ch, fo), p = k(T, t0 + i * .07, 1.0, E.out); if (p <= 0) continue;
      g.save(); g.beginPath(); g.rect(cx - 6, y - sz * .86, cw + 12, sz * 1.08); g.clip(); if (o.glow) { g.shadowColor = 'rgba(59,123,255,.8)'; g.shadowBlur = 50; }
      if (/\d/.test(ch)) { const steps = o.steps != null ? o.steps : 7 + i * 3, pos = p * steps, c0 = Math.floor(pos), fr = pos - c0, d0 = ((+ch - steps + c0) % 10 + 10) % 10;
        if (p < 1) g.filter = `blur(${(3 * (1 - p)).toFixed(1)}px)`; txt(String(d0), cx, y - fr * lh, fo); if (fr > 0) txt(String((d0 + 1) % 10), cx, y + (1 - fr) * lh, fo); }
      else { g.globalAlpha *= p; txt(ch, cx, y + (1 - p) * lh * .6, fo); }
      g.restore(); } }
  // paragraph whose lines wipe in left → right
  function paraWipe(s, x, y, w, t0, o) { font(o.f || SANS, o.size || 16, o.w || 400); const lines = []; let line = ''; for (const wd of s.split(' ')) { const tl = line ? line + ' ' + wd : wd; if (g.measureText(tl).width > w && line) { lines.push(line); line = wd; } else line = tl; } lines.push(line);
    lines.forEach((l, i) => { const q = k(T, t0 + i * .14, .7, E.out); if (q <= 0) return; g.save(); g.beginPath(); g.rect(x - 4, y - 40 + i * (o.lh || 22), (w + 30) * q, 60); g.clip(); g.globalAlpha *= q; txt(l, x, y + i * (o.lh || 22), o); g.restore(); }); }
  // line that draws itself, with a bright dot riding its head
  function drawLine(pts, t0, d, col, lw = 3, head = true) { const q = k(T, t0, d, E.io); if (q <= 0) return; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.setLineDash([L, L]); g.lineDashOffset = L * (1 - q); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]);
    if (head && q < 1) { let r = L * q, i = 0; while (i < seg.length - 1 && r > seg[i]) { r -= seg[i]; i++; } const u = seg[i] ? r / seg[i] : 0, hx = lerp(pts[i][0], pts[i + 1][0], u), hy = lerp(pts[i][1], pts[i + 1][1], u);
      g.fillStyle = '#fff'; g.shadowColor = 'rgba(120,170,255,.9)'; g.shadowBlur = 18; g.beginPath(); g.arc(hx, hy, 6, 0, 7); g.fill(); }
    g.restore(); }
  // floating blue dots (seeded), springing in, drifting forever
  function dots(t, seed, n, t0, area = [180, 140, 1740, 940]) { const r = rng(seed); for (let i = 0; i < n; i++) { const x0 = lerp(area[0], area[2], r()), y0 = lerp(area[1], area[3], r()), rad = 6 + r() * 20, ph = r() * 6, sp = .3 + r() * .4;
      const s = Math.max(0, spring(t0 + i * .08, 1.4, 6)); if (s <= 0) continue; const x = x0 + 24 * Math.sin(t * sp * .6 + ph), y = y0 + 18 * Math.cos(t * sp * .5 + ph);
      const gr = g.createRadialGradient(x - rad * .35, y - rad * .35, rad * .1, x, y, rad); gr.addColorStop(0, '#5B90F5'); gr.addColorStop(1, '#1A4AA6'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * s, 0, 7); g.fill(); } }
  function dust(t, n = 40) { const r = rng(1000 + Math.floor(t * 12)); g.save(); g.fillStyle = 'rgba(200,215,255,.35)'; for (let i = 0; i < n; i++) { g.globalAlpha = .2 + r() * .5; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); } g.restore(); }
  function heartPath(x, y, s) { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x, y - s * .2, x - s * .9, y - s * .2, x - s * .5, y + s * .35); g.lineTo(x, y + s * .9); g.lineTo(x + s * .5, y + s * .35); g.bezierCurveTo(x + s * .9, y - s * .2, x, y - s * .2, x, y + s * .3); g.closePath(); }
  function hearts(x, y, t0) { const d = T - t0; if (d < 0 || d > 1.1) return; ev('likes', t0); const r = rng(55); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, v = 120 + r() * 140, q = E.out(clamp(d / 1.1));
      g.save(); g.globalAlpha = (1 - clamp(d / 1.1)) * .95; g.fillStyle = i % 3 ? '#FF3B4E' : '#FF7A8A'; heartPath(x + Math.cos(a) * v * q, y + Math.sin(a) * v * q - 40 * q, 14 + r() * 12); g.fill(); g.restore(); } }
  function slam(s, x, y, t0, o, xs = 1) { const p = clamp((T - t0) / .3); if (p <= 0) return; ev('slam', t0); const sc = (1 + .75 * (1 - E.out(p))) * (1 + .02 * k(T, t0 + .3, 3, E.soft)) * xs;
    g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha *= clamp(p * 4); if (p < 1) g.filter = `blur(${(20 * (1 - p)).toFixed(1)}px)`; g.shadowColor = 'rgba(110,160,255,.55)'; g.shadowBlur = 70; txt(s, 0, 0, Object.assign({ align: 'center' }, o)); g.restore(); }


  // ------------------------------------------------------------------ backgrounds
  function bgPaper(t, ga = 1) {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const cx = 960 + 20 * Math.sin(t * .2), cy = 520;
    g.save(); g.globalAlpha = ga; g.strokeStyle = 'rgba(11,26,51,.07)'; g.lineWidth = 1; g.beginPath();
    for (let x = cx - 900; x <= cx + 900; x += 46) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = cy - 600; y <= cy + 600; y += 46) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); g.globalAlpha = 1;
    const m = g.createRadialGradient(cx, cy, 200, cx, cy, 900); m.addColorStop(0, 'rgba(237,240,245,0)'); m.addColorStop(1, 'rgba(237,240,245,1)'); g.fillStyle = m; g.fillRect(0, 0, W, H); g.restore();
  }
  function bgNavy(t, glow = [1300, 380], tone = 1) {
    g.fillStyle = C.navy; g.fillRect(0, 0, W, H);
    const gx = glow[0] + 60 * Math.sin(t * .17), gy = glow[1] + 40 * Math.cos(t * .21);
    let gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1100); gr.addColorStop(0, `rgba(25,82,190,${.75 * tone})`); gr.addColorStop(.45, `rgba(14,48,120,${.45 * tone})`); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(200, 1100, 0, 200, 1100, 800); gr.addColorStop(0, 'rgba(20,60,150,.35)'); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    rays(t, tone);
  }
  function bgBlack(t) {
    g.fillStyle = '#04060A'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(300, 900, 0, 300, 900, 1200); gr.addColorStop(0, 'rgba(20,60,140,.45)'); gr.addColorStop(1, 'rgba(4,6,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  // corner branches: swing in from outside the frame, then keep swaying
  function leaves(t, mode, which, t0) {
    const L = LEAF[mode]; const spots = { tl: [-260, -330, 2.6, .9, 1], br: [W - 640, H - 560, -.35, 1, 2], tr: [W - 520, -380, 3.6, .75, 3], bl: [-300, H - 520, -1.2, .8, 4] };
    which.forEach((key, j) => { const [x, y, r, s, ph] = spots[key]; const q = t0 == null ? 1 : k(t, t0 + j * .14, 1.4, E.out);
      const sx = key[1] === 'l' ? -1 : 1, sy = key[0] === 't' ? -1 : 1, sway = Math.sin(t * .45 + ph) * .045 + Math.sin(t * 1.1 + ph * 2) * .008;
      g.save(); g.translate(x + 500 * s + sx * 420 * (1 - q), y + 500 * s + sy * 320 * (1 - q)); g.rotate(r + sway + sx * sy * .9 * (1 - q)); g.scale(s, s); g.drawImage(L, -L.width / 2, -L.height / 2); g.restore(); });
  }
  function sideTexts(col, a = 1) {
    g.save(); g.globalAlpha *= a; font(SANS, 13, 600); g.letterSpacing = '3px'; g.fillStyle = col;
    g.save(); g.translate(48, 540); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('TRAZO · MOVILIDAD ELÉCTRICA · VALENCIA', 0, 0); g.restore();
    g.save(); g.translate(W - 48, 540); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillText('PRÁCTICA FINAL · RA3 · DEPARTAMENTO DE VENTAS', 0, 0); g.restore();
    g.letterSpacing = '0px'; g.restore();
  }
  const NAVY_SIDE = 'rgba(169,196,255,.45)';
  const navyChrome = (t, t0, a = 1) => sideTexts(NAVY_SIDE, a * k(t, t0, .6));

  // ------------------------------------------------------------------ THE TRAZO: one orange line draws the whole film
  // paths are sampled once into arc-length tables; pen() draws a path progressively (persistent stroke, or a "comet"
  // transit with a limited tail); the look: orange core, warm glow, a hot tail and a white-hot tip while it moves
  function sampleCmds(cmds) {   // ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y] ['E',cx,cy,rx,ry,a0,a1]
    const X = [], Y = []; let cx = 0, cy = 0; const push = (x, y) => { X.push(x); Y.push(y); };
    for (const c of cmds) {
      if (c[0] === 'M') { cx = c[1]; cy = c[2]; push(cx, cy); }
      else if (c[0] === 'L') { const n = Math.max(1, Math.ceil(Math.hypot(c[1] - cx, c[2] - cy) / 3)); for (let i = 1; i <= n; i++) push(lerp(cx, c[1], i / n), lerp(cy, c[2], i / n)); cx = c[1]; cy = c[2]; }
      else if (c[0] === 'C') { const [, x1, y1, x2, y2, x, y] = c, est = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2), n = Math.max(2, Math.ceil(est / 3));
        for (let i = 1; i <= n; i++) { const u = i / n, v = 1 - u; push(v * v * v * cx + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x, v * v * v * cy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y); } cx = x; cy = y; }
      else if (c[0] === 'E') { const [, ex, ey, rx, ry, a0, a1] = c, n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 3));
        for (let i = X.length ? 1 : 0; i <= n; i++) { const a = lerp(a0, a1, i / n); push(ex + rx * Math.cos(a), ey + ry * Math.sin(a)); } cx = X[X.length - 1]; cy = Y[Y.length - 1]; }
    }
    const cum = [0]; for (let i = 1; i < X.length; i++) cum.push(cum[i - 1] + Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]));
    return { X, Y, cum, len: cum[cum.length - 1] };
  }
  const polyPath = pts => sampleCmds(pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]));
  function idxAt(P, s) { const n = P.cum.length - 1; if (s <= 0) return [0, 0]; if (s >= P.len) return [Math.max(0, n - 1), 1];
    let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P.cum[m] <= s) lo = m; else hi = m; } return [lo, (s - P.cum[lo]) / ((P.cum[hi] - P.cum[lo]) || 1)]; }
  function ptAt(P, s) { const [i, u] = idxAt(P, s), j = Math.min(i + 1, P.X.length - 1); return [lerp(P.X[i], P.X[j], u), lerp(P.Y[i], P.Y[j], u)]; }
  function tracePath(P, s0, s1) { const [i0] = idxAt(P, s0), [i1] = idxAt(P, s1), a = ptAt(P, s0), b = ptAt(P, s1); g.beginPath(); g.moveTo(a[0], a[1]); for (let i = i0 + 1; i <= i1; i++) g.lineTo(P.X[i], P.Y[i]); g.lineTo(b[0], b[1]); }
  function inkStroke(P, s0, s1, o = {}) {
    if (s1 - s0 < .5) return; const lw = o.lw || 4.5; g.save(); g.globalAlpha *= (o.a != null ? o.a : 1); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!o.paper) { tracePath(P, s0, s1); g.strokeStyle = 'rgba(255,90,31,.30)'; g.lineWidth = lw * 3; g.shadowColor = 'rgba(255,80,20,.85)'; g.shadowBlur = 20; g.stroke(); g.shadowColor = 'transparent'; }
    tracePath(P, s0, s1); g.strokeStyle = o.paper ? '#EC4B12' : OR; g.lineWidth = lw; g.stroke();
    if (o.hot !== false && !o.paper) { tracePath(P, Math.max(s0, s1 - 130), s1); g.strokeStyle = 'rgba(255,214,190,.9)'; g.lineWidth = lw * .5; g.stroke(); }
    g.restore(); }
  function penTip(x, y, o = {}) { const r = o.paper ? 13 : 19; g.save(); g.globalAlpha *= (o.a != null ? o.a : 1); const gr = g.createRadialGradient(x, y, 0, x, y, r * 1.7);
    gr.addColorStop(0, 'rgba(255,246,240,1)'); gr.addColorStop(.22, 'rgba(255,160,100,.95)'); gr.addColorStop(.55, 'rgba(255,90,31,.38)'); gr.addColorStop(1, 'rgba(255,90,31,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.7, 0, 7); g.fill(); g.fillStyle = '#FFF6F0'; g.beginPath(); g.arc(x, y, o.paper ? 3.4 : 4.4, 0, 7); g.fill(); g.restore(); }
  // progressive stroke: t0..t0+dur by arc length. o.tail = comet (only the last o.tail px stay; the tail catches up at the end);
  // o.retract = [t, dur, upTo] erases from the start; o.tip = false hides the moving tip
  function pen(P, t0, dur, o = {}) {
    if (!P || T < t0) return 0; const q = clamp((T - t0) / dur), s1 = P.len * (o.ease || E.pen)(q);
    let s0 = o.tail ? Math.max(0, s1 - o.tail) : 0;
    if (o.tail && q >= 1) s0 = Math.max(s0, lerp(Math.max(0, P.len - o.tail), P.len, k(T, t0 + dur, .3, E.in)));
    if (o.retract) s0 = Math.max(s0, (o.retract[2] != null ? o.retract[2] : P.len) * k(T, o.retract[0], o.retract[1], E.io));
    ev('pen', t0, { len: Math.round(P.len), dur: +dur.toFixed(2) });
    inkStroke(P, s0, s1, o);
    if (q > 0 && q < 1 && o.tip !== false) { const p = ptAt(P, s1); penTip(p[0], p[1], o); }
    return q;
  }
  const penPts = (pts, t0, dur, o) => pen(polyPath(pts), t0, dur, o);
  const node = (x, y, t0, r = 8) => { if (T < t0) return; ev('node', t0); const s = Math.max(0, spring(t0, 1.7, 7)); g.save(); g.fillStyle = OR; g.shadowColor = 'rgba(255,90,31,.8)'; g.shadowBlur = 14; g.beginPath(); g.arc(x, y, r * s, 0, 7); g.fill(); g.restore(); };
  const PATH = {};   // built once fonts and images are ready (they depend on measured type)
  const YO = { f: DISP, size: 230, w: 800, ls: -5, col: C.white }, TZ = { f: DISP, size: 150, w: 800, ls: -4, col: C.ink };
  const FNBIG = { f: DISP, size: 150, w: 800, ls: -3, col: C.white }, SMBIG = { f: DISP, size: 140, w: 800, ls: -3, col: C.white }, SUPBIG = { f: DISP, size: 150, w: 800, ls: -3, col: C.white };
  const MOTBIG = { f: DISP, size: 108, w: 800, ls: -2, col: C.white }, ORGBIG = { f: DISP, size: 96, w: 800, ls: -2, col: C.white }, FINAL = { f: DISP, size: 300, w: 800, ls: -6, col: C.white, align: 'center' };
  const FN = ['CAPTACIÓN', 'FIDELIZACIÓN', 'ANÁLISIS', 'GESTIÓN'];

  // ------------------------------------------------------------------ scenes (t0, t1 in film seconds; T = global time)
  let T = 0;
  const SC = [];
  const scene = (name, t0, t1, base, draw) => SC.push({ name, t0, t1, base, draw });

  // the one-line e-bike: launched from the dot of YASSER., drawn at 1.5x, then the camera eases back to the real size of
  // the photo it becomes (the path is traced from the brand photo's bike, so drawing and photo line up exactly)
  const bikeScale = t => lerp(1.5, 1, E.io(clamp((t - 3.0) / .75)));
  const photoZoom = t => 1 - .05 * k(t, 5.2, 4.5, E.soft);
  function bikeArt(t, o = {}) {
    if (t < 1.62) return; const s = bikeScale(t) * photoZoom(t) / 1.5, a = 1 - k(t, 5.75, .7, E.io); if (a <= 0) return;
    g.save(); g.translate(960, 600); g.scale(s, s); g.translate(-960, -600);
    pen(PATH.bike, 1.62, 1.58, { paper: o.paper, lw: 4.5 / s, a, retract: [2.4, .55, PATH.bikeLaunch] });
    if (t >= 3.2 && t < 4.55) { const p = ptAt(PATH.bike, PATH.bike.len), pu = .75 + .25 * Math.sin((t - 3.2) * 6); penTip(p[0], p[1], { paper: o.paper, a: pu }); }
    g.restore();
  }
  const bikeEnd = t => { const s = bikeScale(t) * photoZoom(t) / 1.5, p = ptAt(PATH.bike, PATH.bike.len); return [960 + (p[0] - 960) * s, 600 + (p[1] - 600) * s]; };

  // 00 · presentado por — black title card; the name slams in, its orange dot becomes the pen and draws the e-bike
  scene('Presentado por', 0, 3.25, '#04060A', (t) => {
    const [sx, sy] = shakeAt(1.25, 10); g.translate(sx, sy);
    bgBlack(t); dust(t, 30); leaves(t, 'navy', ['tl', 'br'], .05);
    sideTexts('rgba(169,196,255,.35)', k(t, .4));
    const up = k(t, 1.62, .75, E.io);
    g.save(); g.globalAlpha *= 1 - up; if (up > .01) g.filter = `blur(${(8 * up).toFixed(1)}px)`;
    typeOn('PRÁCTICA FINAL · RA3 · TEMA 2', 960, 330 - 140 * up, .2, { size: 17, w: 600, ls: 6, col: C.sky, align: 'center', cps: 44, caret: false });
    typeOn('presentado por', 960, 470 - 140 * up, .5, { f: SERIF, size: 66, w: 600, it: true, col: C.sky, align: 'center', cps: 24 });
    g.restore();
    slam('YASSER', 960, lerp(690, 212, up), 1.25, YO, lerp(1, .42, up));
    if (t >= 1.45 && t < 1.66) { const sd = Math.max(0, spring(1.45, 1.8, 7)); ev('pop', 1.45); g.save(); g.fillStyle = OR; g.beginPath(); g.arc(PATH.dot[0], PATH.dot[1], 22 * sd, 0, 7); g.fill(); g.restore(); }
    bikeArt(t);
  });

  // brand photo window: source point (775,580) of the photo sits at the window centre
  const BW = { x: 620, y: 350, w: 680, h: 500 };
  function brandAt(zoom) { const im = IMG.brandCol, f = im.width / 1600, sc = BW.w / 1100 * zoom, cx = BW.x + BW.w / 2, cy = BW.y + BW.h / 2;
    return { pt: (sx, sy) => [cx + (sx - 775) * sc, cy + (sy - 580) * sc], draw: img => g.drawImage(img, cx - 775 * sc, cy - 580 * sc, im.width / f * sc, im.height / f * sc) }; }
  // 01 · la empresa — paper; the drawing becomes the real photo; a cursor builds the rest of the page
  scene('01 La empresa', 3.25, 9.75, C.paper, (t) => {
    bgPaper(t, k(t, 3.3, .9)); leaves(t, 'paper', ['tl', 'br'], 3.3);
    sideTexts('rgba(11,26,51,.5)', k(t, 3.6));
    typeOn('PRESENTADO POR YASSER', 120, 104, 3.55, { size: 14, w: 700, ls: 4, col: 'rgba(11,26,51,.6)', cps: 40, caret: false });
    // the wordmark, typed in a design-tool box; its dot lands when the typing ends
    const tw = measure('TRAZO', TZ), x0 = 960 - tw / 2 - 18;
    selBox(x0 - 40, 140, tw + 120, 186, 3.92, 'rgba(11,26,51,.55)', C.paper);
    typeOn('TRAZO', x0, 290, 4.06, Object.assign({ cps: 11, caretCol: OR }, TZ));
    if (t >= 4.5) { const sd = Math.max(0, spring(4.5, 1.7, 7)); ev('pop', 4.5); g.save(); g.fillStyle = OR; g.beginPath(); g.arc(x0 + tw + 22, 274, 17 * sd, 0, 7); g.fill(); g.restore(); }
    popText('la', x0 - 18, 180, 4.0, { size: 30, w: 700, col: C.ink, align: 'right' });
    popText('empresa', x0 + tw + 52, 318, 4.62, { size: 26, w: 700, col: C.blue });
    // window: the trazo draws its frame, the card fills, the click brings the real photo in under the drawing
    const fill = k(t, 5.0, .3), b = k(t, 5.2, 1.0, E.out), P = brandAt(photoZoom(t));
    if (fill > 0) { g.save(); g.globalAlpha = fill; g.shadowColor = 'rgba(11,26,51,.22)'; g.shadowBlur = 50; g.shadowOffsetY = 24; rr(BW.x, BW.y, BW.w, BW.h, 26); g.fillStyle = '#DDE3EC'; g.fill(); g.restore(); }
    if (b > 0) { g.save(); rr(BW.x, BW.y, BW.w, BW.h, 26); g.clip(); g.globalAlpha = b; if (b < 1) g.filter = `blur(${(12 * (1 - b)).toFixed(1)}px)`; P.draw(IMG.brandCol); g.restore(); sweep(BW.x, BW.y, BW.w, BW.h, 6.0, 26); }
    if (t > 6.0) { g.save(); g.globalAlpha = k(t, 6.0, .6); rr(BW.x, BW.y, BW.w, BW.h, 26); g.lineWidth = 1.5; g.strokeStyle = 'rgba(11,26,51,.25)'; g.stroke(); g.restore(); }
    pen(PATH.frame, 4.48, .68, { paper: true, a: 1 - k(t, 6.0, .6, E.io) });
    bikeArt(t, { paper: true });
    pillBar(BW.x + 22, BW.y + 22, 5.6, 'NUEVA TRAZO CITY · 1.349 €', { size: 14, fill: 'rgba(244,246,250,.92)', col: C.ink });
    // callouts drawn by the trazo: anchor on the bike → elbow → tag
    [[[862, 575], 'BATERÍA · 80 KM', 5.95], [[1062, 722], 'RUEDAS 20" FAT', 6.2], [[528, 716], 'MOTOR 250 W', 6.45]].forEach(([src, lab, a], i) => { const [ax, ay] = P.pt(src[0], src[1]), ty = 640 + i * 74;
      if (t < a - .42) return; node(ax, ay, a - .42, 7);
      penPts([[ax, ay], [ax, ty + 17], [1330, ty + 17]], a - .42, .42, { paper: true, lw: 3 });
      pillBar(1336, ty, a, lab, { size: 15, fill: C.ink, col: C.white }); });
    // label + serif line
    { const lab = 'EMPRESA COMERCIAL · VALENCIA', lo = { size: 17, w: 700, ls: 3, col: C.white }, lw = measure(lab, lo) + 48, q = k(t, 5.0, .5, E.io);
      if (q > 0) { g.save(); g.fillStyle = C.ink; g.fillRect(960 - lw / 2, 880, lw * q, 42); g.beginPath(); g.rect(960 - lw / 2, 880, lw * q, 42); g.clip(); typeOn(lab, 960 - lw / 2 + 24, 907, 5.25, Object.assign({ cps: 52, caret: false }, lo)); g.restore(); } }
    typeOn('movilidad eléctrica en Valencia', 960, 990, 6.28, { f: SERIF, size: 50, w: 600, it: true, col: '#4A5872', align: 'center', cps: 30 });
    // catalogue chips, each clicked into place
    typeOn('CATÁLOGO', 300, 398, 6.9, { size: 14, w: 700, ls: 4, col: 'rgba(11,26,51,.55)', cps: 30, caret: false });
    [['BICIS ELÉCTRICAS', 7.16], ['PATINETES', 8.02], ['ACCESORIOS', 8.3], ['TRAZO CARE', 8.5]].forEach(([s2, a], i) => pillBar(300, 420 + i * 76, a - .08, s2, { size: 17, stroke: C.ink, col: C.ink, dash: [6, 5], tText: a + .04 }));
    cursorPath([[3.55, 1560, 920], [3.98, 1080, 250, 1], [4.85, 1180, 640], [5.2, 1120, 600, 1], [6.6, 760, 640], [7.08, 330, 440, 1], [7.94, 330, 516, 1], [8.22, 330, 592, 1], [8.42, 330, 668, 1], [9.0, 1450, 560], [9.4, 1720, 760]], C.ink, '#fff');
  });

  // 02 · dos tipos de clientes — the trazo draws the stage (a circle) that fills blue; subject and pill change inside it
  scene('02 Público objetivo', 9.75, 18.55, C.navy, (t) => {
    bgNavy(t, [1250, 420], .85); leaves(t, 'navy', ['tr', 'bl'], 9.8); navyChrome(t, 9.9);
    typeOn('Tenemos dos tipos de', 960, 135, 9.9, { f: SERIF, size: 46, w: 600, it: true, col: C.sky, align: 'center', cps: 32 });
    typeOn('CLIENTES', 960, 240, 10.86, { f: DISP, size: 108, w: 800, ls: -2, col: C.white, align: 'center', cps: 18 });
    const fd = k(t, 10.95, .8, E.out), pulse = 1 + .05 * Math.sin(clamp((t - 15.55) / .6) * Math.PI);
    if (fd > 0) disc(960, 590, 310 * (.9 + .1 * fd) * pulse, fd);
    const thin = k(t, 12.0, .9, E.io); pen(PATH.ring, 10.5, .8, { lw: lerp(4.5, 2.2, thin), a: lerp(1, .55, thin), hot: thin < .5 });
    typeOn('TIPO', 440, 470, 11.5, { size: 14, w: 700, ls: 4, col: C.sky, cps: 30, caret: false });
    if (t < 15.6) roll('01', 440, 556, 11.62, { f: DISP, size: 80, w: 800, col: C.white, steps: 1 }); else roll('02', 440, 556, 15.62, { f: DISP, size: 80, w: 800, col: C.blue2, steps: 1 });
    pillSwap(1480, 445, [['18–40 AÑOS', 12.36], ['FLOTAS DE 5 A 50', 16.2]], 12.1, { size: 18, fill: 'rgba(6,16,31,.55)', stroke: 'rgba(169,196,255,.8)', col: C.sky });
    const sIn = k(t, 11.6, 1.0, E.out), sOut = k(t, 15.4, .75, E.io);
    if (sIn > 0 && sOut < 1) { g.save(); g.globalAlpha *= clamp(sIn * 2) * (1 - clamp(sOut / .5)); const bl = 10 * (1 - sIn) + 9 * Math.sin(Math.PI * sOut); if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`; photo(IMG.studentCool, 960 + 620 * (1 - sIn) - 820 * sOut, 830, 560); g.restore(); }
    const cIn = k(t, 15.4, .75, E.io);
    if (cIn > 0) { g.save(); g.globalAlpha *= clamp((cIn - .3) / .45); const bl = 9 * Math.sin(Math.PI * cIn); if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`; photo(IMG.courierCool, 960 + 820 * (1 - cIn), 830, 530); g.restore(); }
    pillSwap(960, 852, [['ESTUDIANTES Y TRABAJADORES', 12.36], ['EMPRESAS DE REPARTO', 15.9]], 12.05, { size: 24, fill: 'rgba(6,16,31,.65)', stroke: C.white, lw: 2.5 });
  });

  // 03 · cuatro funciones — the trazo underlines the line, writes the 4, and becomes a rail with four stations
  scene('03 Funciones', 18.55, 22.0, C.navy, (t) => {
    bgNavy(t, [960, 500], .9); leaves(t, 'navy', ['tl', 'br'], 18.6); navyChrome(t, 18.7);
    typeOn('nuestro departamento de ventas tiene', 960, 330, 18.62, { f: SERIF, size: 54, w: 600, it: true, col: C.sky, align: 'center', cps: 32 });
    pen(PATH.fnUnder, 19.5, .8); pen(PATH.fnConn1, 20.3, .14, { tail: 240 });
    pen(PATH.four, 20.44, .36, { lw: 13 }); pen(PATH.fnConn2, 20.8, .14, { tail: 240 });
    typeOn('FUNCIONES', PATH.fnX, 530, 20.82, Object.assign({ cps: 28 }, FNBIG));
    pen(PATH.rail, 20.94, .62, { ease: x => x });
    FN.forEach((s, i) => { const x = 390 + i * 380, tp = 20.94 + .62 * PATH.railAt[i]; node(x, 650, tp, 9);
      pillBar(x, 684, tp + .02, s, { align: 'center', size: 20, stroke: 'rgba(169,196,255,.7)', col: C.sky, dash: [6, 5] }); });
  });

  // function scene: kicker, the title the giant word landed in, a vertical trazo with one node per item (on the voice)
  const TITLE = { f: SERIF, size: 92, w: 700, ls: 3, col: C.white };
  function fnTitle(t, c, num, kicker, title, items) {
    const land = c + 1.0, x = 150, bw = measure(title, TITLE) + 70;
    typeOn(kicker, x, 230, land - .12, { f: SERIF, size: 40, w: 600, it: true, col: C.sky, cps: 40, caret: false });
    selBox(x, 262, bw, 128, land - .06, 'rgba(244,246,250,.85)', C.navy);
    if (t >= land) txt(title, x + 35, 360, TITLE);
    popText(num, x + bw + 22, 292, land + .15, { f: DISP, size: 26, w: 800, col: C.blue2 });
    let y0 = 400; items.forEach(([s, a], i) => { const y = 475 + i * 120; pen(polyPath([[x + 20, y0], [x + 20, y]]), a - .4, .32, { lw: 3.5 }); node(x + 20, y, a - .08, 8);
      pillBar(x + 50, y - 21, a - .06, s, { size: 20, fill: 'rgba(6,16,31,.5)', stroke: 'rgba(244,246,250,.8)', col: C.white, lw: 2 }); y0 = y; });
  }

  // 04 · captación — the social card tumbles in in 3D and gets liked
  function cardXf(t) { const p = k(t, 22.55, 1.3, E.out);
    return { p, rot: lerp(-2.75, -.38, p) + .05 * Math.sin(t * .5) * p, cx: lerp(700, 1380, p), cy: lerp(1300, 560, p) + 8 * Math.sin(t * .8), zr: lerp(-.7, 0, p) + .025 * Math.sin(t * .6), sc: lerp(.5, .95, p) }; }
  function cardPoint(t, lx, ly) { const X = cardXf(t), w = IMG.card.width, h = IMG.card.height, Xl = (lx - w / 2) * X.sc, Yl = (ly - h / 2) * X.sc, pz = 1800 / (1800 + Xl * Math.sin(X.rot));
    const x = Xl * Math.cos(X.rot) * pz, y = Yl * pz; return [X.cx + x * Math.cos(X.zr) - y * Math.sin(X.zr), X.cy + x * Math.sin(X.zr) + y * Math.cos(X.zr)]; }
  scene('04 Captación', 22.0, 28.8, C.navy, (t) => {
    bgNavy(t, [1350, 420]); leaves(t, 'navy', ['tr', 'bl'], 22.0); navyChrome(t, 22.1);
    fnTitle(t, 22.0, '01', 'Primero, conseguir clientes:', 'CAPTACIÓN', [['PRUEBAS GRATIS EN LOS CAMPUS', 23.18], ['CAMPAÑAS EN REDES SOCIALES', 24.92], ['ACUERDOS CON EMPRESAS DE REPARTO', 26.58]]);
    const X = cardXf(t); if (X.p <= 0) return; ev('tumble', 22.55);
    disc(1380, 560, 380, .8 * E.out(k(t, 23.0, .8)));
    g.save(); g.globalAlpha *= clamp(X.p * 3); g.translate(X.cx, X.cy); g.rotate(X.zr); tiltCard(IMG.card, 0, 0, X.rot, X.sc); g.restore();
    const hp = cardPoint(26.3, 64, 578); hearts(hp[0], hp[1], 26.32);
    cursorPath([[25.3, 1760, 1010], [26.3, hp[0] + 2, hp[1] + 6, 1], [27.3, 1820, 1000]], C.white, C.ink, 1.3);
  });

  // 05 · fidelización — reviews stack and shuffle; at the end the trazo draws the loop that brings customers back
  scene('05 Fidelización', 28.8, 35.55, C.navy, (t) => {
    bgNavy(t, [1300, 520]); leaves(t, 'navy', ['tl', 'br'], 28.85); navyChrome(t, 28.9);
    fnTitle(t, 28.8, '02', 'Después, que vuelvan:', 'FIDELIZACIÓN', [['PLAN DE MANTENIMIENTO TRAZO CARE', 30.3], ['REVISIÓN GRATIS A LOS 6 MESES', 32.0], ['APP CON PUNTOS POR KILÓMETRO', 33.98]]);
    const f = k(t, 29.35, .7, E.out); if (f <= 0) return;
    const gx = 1080, gy = 300 + 6 * Math.sin(t * .7) + 60 * (1 - f);
    g.save(); g.globalAlpha *= f; if (f < 1) g.filter = `blur(${(10 * (1 - f)).toFixed(1)}px)`;
    glass(gx, gy, 700, 560, 30); g.filter = 'none'; sweep(gx, gy, 700, 560, 29.9, 30);
    typeOn('Opiniones de clientes', gx + 40, gy + 66, 29.6, { f: SERIF, size: 34, w: 600, it: true, col: C.white, cps: 36 });
    for (let i = 0; i < 5; i++) { const q = Math.max(0, spring(29.9 + i * .08, 1.6, 7)); g.fillStyle = i < 4 ? C.blue2 : 'rgba(59,123,255,.45)'; star(gx + 520 + i * 32, gy + 56, 11 * q); }
    const R = [['MR', '#3D6BD1', 'Marcos R.', 'Repartidor', 'Con TRAZO Care la flota no ha parado ni un día.', 30.6], ['LG', '#1D5BD8', 'Laura G.', 'Estudiante, 21', 'La revisión de los 6 meses fue gratis y en 20 minutos.', 32.2], ['JM', '#2C9A6B', 'Javier M.', 'Trabaja en el centro', 'Con los puntos de la app me llevé el casco gratis.', 34.3]];
    const depth = j => R.reduce((d, r, m) => m > j ? d + k(t, r[5], .5, E.out) : d, 0);
    R.map((r, j) => [r, depth(j)]).filter(([r]) => t >= r[5] - .05).sort((a, b) => b[1] - a[1]).forEach(([r, d]) => {
      ev('card', r[5]); const q = Math.max(0, spring(r[5] - .05, 1.3, 6.5)), sc = 1 - .07 * d, y = gy + 300 - 36 * d + 140 * (1 - q), cx = gx + 350;
      g.save(); g.globalAlpha *= clamp((t - r[5] + .05) / .2) * Math.max(0, 1 - .3 * d); if (d > .05) g.filter = `blur(${(2.5 * d).toFixed(1)}px)`;
      g.translate(cx, y + 65); g.scale(sc, sc); g.translate(-cx, -(y + 65));
      rr(gx + 40, y, 620, 130, 22); g.fillStyle = 'rgba(236,240,248,.96)'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fill(); g.shadowColor = 'transparent';
      g.beginPath(); g.arc(gx + 96, y + 65, 30, 0, 7); g.fillStyle = r[1]; g.fill(); txt(r[0], gx + 96, y + 73, { size: 20, w: 700, col: '#fff', align: 'center' });
      const nw = txt(r[2], gx + 144, y + 50, { size: 21, w: 700, col: '#111' }); txt(r[3], gx + 154 + nw, y + 50, { size: 16, w: 400, col: '#7A7F8C' });
      txt(r[4], gx + 144, y + 90, { size: 19, w: 400, col: '#2A2D35' }); g.restore(); });
    g.restore();
    pen(PATH.loop, 34.5, .75, { lw: 4.5 });
  });

  // 06 · análisis — the dashboard builds; on "ventas por zona" the trazo becomes the trend line over the bars
  function star(cx, cy, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
  const BARS = [['Ruzafa', 38], ['Benimaclet', 29], ['Centro', 21], ['Campanar', 16], ['Online', 32]];
  scene('06 Análisis', 35.55, 41.1, C.navy, (t) => {
    bgNavy(t, [1250, 380]); leaves(t, 'navy', ['tr', 'bl']); navyChrome(t, 35.3);
    fnTitle(t, 35.55, '03', 'Para decidir con datos:', 'ANÁLISIS', [['ENCUESTAS POST-VENTA', 37.16], ['ESTUDIO DE LA COMPETENCIA', 38.18], ['VENTAS POR ZONA EN EL CRM', 39.76]]);
    const f = k(t, 36.1, .7, E.out); if (f <= 0) return;
    const gx = 1060, gy = 260 + 6 * Math.sin(t * .6) + 60 * (1 - f);
    g.save(); g.globalAlpha *= f; if (f < 1) g.filter = `blur(${(10 * (1 - f)).toFixed(1)}px)`;
    glass(gx, gy, 720, 600, 30); g.filter = 'none'; sweep(gx, gy, 720, 600, 36.6, 30);
    typeOn('MERCADO', gx + 40, gy + 60, 36.3, { size: 16, w: 700, ls: 3, col: C.sky, cps: 30, caret: false });
    typeOn('Satisfacción', gx + 40, gy + 120, 36.9, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    roll('4,6', gx + 40, gy + 210, 37.16, { f: DISP, size: 100, w: 800, col: C.white, glow: true }); if (t > 37.5) txt('/5', gx + 56 + measure('4,6', { f: DISP, size: 100, w: 800 }), gy + 210, { f: DISP, size: 40, w: 500, col: C.mute });
    for (let i = 0; i < 5; i++) { const q = Math.max(0, spring(37.4 + i * .1, 1.6, 7)); g.fillStyle = i < 4 ? C.blue2 : 'rgba(59,123,255,.45)'; star(gx + 320 + i * 46, gy + 178, 17 * q); }
    typeOn('Cuota de mercado', gx + 40, gy + 290, 38.0, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    [['TRAZO', 18, C.blue2], ['Competidor A', 34, 'rgba(169,196,255,.4)'], ['Competidor B', 22, 'rgba(169,196,255,.4)']].forEach(([n, v, col], i) => { const a = 38.18 + i * .12, s = Math.max(0, spring(a, 1.2, 6)); if (t < a) return; const y = gy + 330 + i * 46;
      txt(n, gx + 40, y + 18, { size: 18, w: 500, col: C.white }); rr(gx + 220, y, Math.max(1, 380 * v / 34 * s), 22, 11); g.fillStyle = col; g.fill(); roll(v + ' %', gx + 630, y + 18, a, { size: 18, w: 700, col: C.white }); });
    typeOn('Ventas por zona', gx + 40, gy + 500, 39.6, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    BARS.forEach(([n, v], i) => { const x = gx + 260 + i * 88, h = v * 2.2 * Math.max(0, spring(39.76 + i * .08, 1.2, 6)); if (h <= 0) return;
      rr(x, gy + 560 - h, 54, h, 6); g.fillStyle = i === 0 ? C.blue2 : 'rgba(169,196,255,.45)'; g.fill(); txt(n, x + 27, gy + 584, { size: 13, w: 500, col: C.sky, align: 'center' }); });
    // the trazo: through the bar tops, then a rising tail (the trend)
    { const pts = BARS.map(([, v], i) => [gx + 287 + i * 88, gy + 560 - v * 2.2 - 16]); pts.unshift([gx + 230, gy + 540]); pts.push([gx + 690, gy + 430]); penPts(pts, 40.05, .55, { lw: 3.5 }); }
    g.restore();
    pillBar(gx + 322, gy + 452 - 70, 40.62, 'RUZAFA · 38 VENTAS', { size: 14, fill: C.white, col: C.ink });
  });

  // 07 · gestión — documents fan out of one stack; the trazo runs to the corner and draws the warranty stamp's ring
  scene('07 Gestión', 41.1, 46.4, C.navy, (t) => {
    const [sx, sy] = shakeAt(45.84, 12); g.translate(sx, sy);
    bgNavy(t, [1300, 480]); leaves(t, 'navy', ['tl', 'br']); navyChrome(t, 40.9);
    fnTitle(t, 41.1, '04', 'Y que todo funcione:', 'GESTIÓN', [['PEDIDOS Y FACTURAS EN EL CRM', 42.82], ['FINANCIACIÓN', 44.34], ['GARANTÍAS Y DEVOLUCIONES', 45.3]]);
    { const q = k(t, 41.8, .8); g.save(); g.globalAlpha = q * .55; g.translate(1450, 540 + (1 - q) * 40); g.rotate(4 * Math.PI / 180); glass(-300, -260, 600, 520, 26); txt('CRM · TRAZO', -260, -200, { size: 15, w: 700, ls: 4, col: C.sky }); g.restore(); }
    pillSwap(1450, 196, [['PEDIDO RECIBIDO', 42.82], ['FACTURA EMITIDA', 43.58], ['FINANCIACIÓN 0 %', 44.34], ['GARANTÍA 2 AÑOS', 45.3]], 42.55, { size: 18, fill: 'rgba(59,123,255,.25)', stroke: C.blue2, col: C.white });
    const D = [['PEDIDO #0412', 'TRAZO City · M', '1.349 €', 42.82, -6], ['FACTURA F-2026-0412', 'Base 1.114,88 € + IVA 21 %', '1.349 €', 43.58, 3], ['FINANCIACIÓN', '12 meses · 0 % TIN', '112,42 €/mes', 44.34, -2]];
    D.forEach(([h, s, v, a, rot], i) => { const sp = spring(a - .1, 1.3, 6.5); if (sp <= 0) return; ev('card', a - .1);
      g.save(); g.globalAlpha = clamp((t - a + .1) / .2); g.translate(lerp(1480, 1420 + i * 30, sp), lerp(720, 380 + i * 150, sp) + 4 * Math.sin(t * .8 + i)); g.rotate(lerp(14, rot, sp) * Math.PI / 180);
      glass(-300, -80, 600, 170, 24); txt(h, -260, -26, { size: 16, w: 700, ls: 3, col: C.sky }); txt(s, -260, 14, { size: 24, w: 600, col: C.white }); txt(v, 260, 60, { f: DISP, size: 42, w: 800, col: C.white, align: 'right' }); g.restore(); });
    pen(PATH.toStamp, 45.22, .22, { tail: 420 });
    pen(PATH.stampRing, 45.42, .3, { lw: 5 });
    const st = clamp((t - 45.72) / .16); if (st > 0) { ev('slam', 45.72); g.save(); g.translate(1730, 890); g.rotate(-.2); const z = lerp(2.6, 1, E.in(st)); g.scale(z, z); g.globalAlpha = st;
      txt('2', 0, 24, { f: DISP, size: 92, w: 800, col: C.white, align: 'center' }); txt('AÑOS DE GARANTÍA', 0, 58, { size: 13, w: 800, ls: 2, col: C.sky, align: 'center' }); g.restore(); }
  });

  // 08 · SMART — the trazo underlines the headline, the headline shrinks to the top; each objective gets a line-drawn sign
  const OB = [['01', '+20 %', 'DE VENTAS ONLINE', 'ANTES DEL 31/12/2027', 49.24], ['02', '15', 'NUEVOS CLIENTES EMPRESA', 'ANTES DEL 30/06/2027', 54.22], ['03', '4,6/5', 'DE SATISFACCIÓN', 'DURANTE 2027', 57.54]];
  scene('08 Objetivos SMART', 46.4, 60.95, C.navy, (t) => {
    bgNavy(t, [960, 520], 1.05); leaves(t, 'navy', ['tr', 'bl'], 46.45); navyChrome(t, 46.5);
    const q = k(t, 48.9, .75, E.io); ev('shrink', 48.9);
    g.save(); g.translate(0, -310 * q); g.translate(960, 470); g.scale(1 - .5 * q, 1 - .5 * q); g.translate(-960, -470);
    typeOn('Nos marcamos tres', 960, 400, 46.48, { f: SERIF, size: 60, w: 600, it: true, col: C.sky, align: 'center', cps: 30 });
    typeOn('OBJETIVOS', PATH.smX, 560, 47.56, Object.assign({ cps: 26, caret: false }, SMBIG)); typeOn('SMART', PATH.smX + measure('OBJETIVOS ', SMBIG), 560, 48.16, Object.assign({}, SMBIG, { col: C.blue2, cps: 16 }));
    pen(PATH.smUnder, 47.5, .95, { lw: 5 / (1 - .5 * q) });
    g.globalAlpha *= 1 - k(t, 48.85, .35, E.in);
    ['S · Específico', 'M · Medible', 'A · Alcanzable', 'R · Relevante', 'T · Temporal'].forEach((s, i) => popText(s, 960 + (i - 2) * 250, 668, 48.3 + i * .08, { f: SERIF, size: 30, w: 600, it: true, col: C.sky, align: 'center' }));
    g.restore();
    OB.forEach(([n, big, lab, when, a], i) => { const inT = a - .3, outT = OB[i + 1] ? OB[i + 1][4] - .3 : 99; if (t < inT || t > outT + .5) return; ev('card', inT);
      const sp = spring(inT, 1.1, 6.5), o = k(t, outT, .45, E.in), cx = 960 + 1400 * (1 - sp) - 1400 * o;
      g.save(); g.globalAlpha *= clamp((t - inT) / .15) * (1 - o * .7); const bl = 14 * o + 10 * clamp(1 - (t - inT) / .45); if (bl > .4) g.filter = `blur(${bl.toFixed(1)}px)`;
      glass(cx - 560, 290, 1120, 510, 32); g.filter = bl > .4 ? `blur(${bl.toFixed(1)}px)` : 'none'; sweep(cx - 560, 290, 1120, 510, a + .2, 32);
      // the sign, drawn by the trazo inside the card
      g.save(); g.translate(cx - 960, 0);
      if (i === 0) pen(PATH.smCurve, a + .05, .7, { lw: 4 });
      if (i === 1) { pen(PATH.smTicks, a + .1, .9, { lw: 3.5 }); }
      if (i === 2) { pen(PATH.smStar, a + .55, .7, { lw: 3.5 }); const fq = k(t, a + 1.2, .6, E.out); if (fq > 0) { g.save(); g.beginPath(); g.rect(1385 - 64, 470 - 62, 128 * .92 * fq, 130); g.clip(); g.fillStyle = 'rgba(255,90,31,.85)'; star(1385, 470, 56); g.restore(); } }
      g.restore();
      typeOn('OBJETIVO ' + n, cx, 352, a - .1, { size: 18, w: 700, ls: 6, col: C.sky, align: 'center', cps: 40, caret: false });
      roll(big, cx, 585, a, { f: DISP, size: 210, w: 800, col: C.white, align: 'center', glow: true });
      typeOn(lab, cx, 680, a + .45, { f: SERIF, size: 50, w: 700, ls: 4, col: C.white, align: 'center', cps: 30 });
      pillBar(cx, 712, a + .9, when, { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] }); g.restore(); });
    const act = t < 54.0 ? 0 : t < 57.3 ? 1 : 2, dq = k(t, 48.95, .5);
    if (dq > 0) { g.save(); g.globalAlpha = dq; let x = 960 - 60; for (let i = 0; i < 3; i++) { const on = i === act ? 1 : 0, w = 14 + 30 * on; rr(x, 838, w, 14, 7); g.fillStyle = on ? C.blue2 : 'rgba(169,196,255,.35)'; g.fill(); x += w + 14; } g.restore(); }
  });

  // 09 · supervisión — underline, three cards drop in, the trazo ticks each one; the last tick becomes the next stage
  const TICK0 = (() => { const a = 2.2 * Math.PI / 180, cx = 1410, cy = 610, dx = 1550 - cx, dy = 482 - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; })();
  const CARRY = [67.75, 68.6];
  const camPt = (name, t, x, y) => { const sc = CAM(t); return [960 + sc * (x - 960 + 4 * Math.sin(t * .5)), 540 + sc * (y - 540 + 3 * Math.cos(t * .4)), sc]; };
  const discR = t => 270 * (1 + .015 * Math.sin(t * 2));
  function carryOverlay(t) { if (t < CARRY[0] || t >= CARRY[1]) return; ev('carry', CARRY[0]); const og = g; g = main;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    const q = k(T, CARRY[0] + .1, CARRY[1] - CARRY[0] - .1, E.io), A = camPt('', T, TICK0[0], TICK0[1]), B = camPt('', T, 960, 690), u = E.soft(q);
    const x = lerp(A[0], B[0], q), y = lerp(A[1], B[1], q) - 120 * Math.sin(Math.PI * q), r = lerp(20 * A[2] * (1 + .25 * Math.sin(Math.PI * clamp((T - CARRY[0]) / .25))), discR(T) * B[2], u);
    const halo = Math.sin(Math.PI * q); if (halo > .01) { g.save(); const gr = g.createRadialGradient(x, y, r * .9, x, y, r * 1.35); gr.addColorStop(0, `rgba(80,140,255,${(.16 * halo).toFixed(3)})`); gr.addColorStop(1, 'rgba(80,140,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.6, 0, 7); g.fill(); g.restore(); }
    g.save(); g.globalAlpha *= 1 - u; g.fillStyle = C.blue2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); disc(x, y, r, u);
    if (q < .35) { const z = r / 20; g.save(); g.globalAlpha *= 1 - q / .35; g.strokeStyle = OR; g.lineWidth = 4 * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - 9 * z, y); g.lineTo(x - 2 * z, y + 8 * z); g.lineTo(x + 10 * z, y - 8 * z); g.stroke(); g.restore(); }
    g = og; }
  scene('09 Supervisión', 60.95, 68.4, C.navy, (t) => {
    const ex = k(t, 67.7, .8, E.io);
    bgNavy(t, [1000, 380]); if (ex > 0) { g.fillStyle = `rgba(4,6,10,${(.98 * ex).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }
    g.save(); g.globalAlpha = 1 - ex; leaves(t, 'navy', ['tl', 'br'], 61.0); g.restore(); navyChrome(t, 61.0, 1 - ex);
    const up = k(t, 62.3, .8, E.io); ev('shrink', 62.3);
    g.save(); g.globalAlpha *= 1 - ex; g.translate(0, -230 * up - 140 * ex); const sc = 1 - .35 * up; g.translate(960, 470); g.scale(sc, sc); g.translate(-960, -470);
    typeOn('¿Cómo lo', 960, 380, 61.02, { f: SERIF, size: 70, w: 600, it: true, col: C.sky, align: 'center', cps: 22 });
    typeOn('CONTROLAMOS?', 960, 540, 61.48, Object.assign({ align: 'center', cps: 24 }, SUPBIG));
    pen(PATH.supUnder, 61.75, .5, { lw: 5 / sc }); g.restore();
    const CARDS = [['CADA LUNES', 'Reunión semanal', 62.58, 'cal'], ['EN TIEMPO REAL', 'Panel de KPIs', 64.16, 'kpi'], ['UNA VEZ AL MES', 'Revisión individual', 66.24, 'one']];
    CARDS.forEach(([kk, h, a, ic], i) => { const sp = spring(a - .15, 1.2, 6); if (sp <= 0) return; ev('card', a - .15); const x = 270 + i * 470, y = 420 - 300 * (1 - sp) + 5 * Math.sin(t * .8 + i);
      g.save(); g.globalAlpha = clamp((t - a + .15) / .2) * (1 - ex); if (ex > 0) g.filter = `blur(${(12 * ex).toFixed(1)}px)`; const rot = ((i - 1) * 2.2 + 9 * (1 - sp) + (i - 1) * 14 * ex) * Math.PI / 180; g.translate(x + 200, y + 190 + 380 * ex * ex); g.scale(1 - .15 * ex, 1 - .15 * ex); g.rotate(rot); g.translate(-x - 200, -y - 190);
      glass(x, y, 400, 380, 26);
      { const pq = k(t, a - .05, .8, E.out), im = IMG[['supMeeting', 'supKpi', 'supOne'][i]], zz = (1.18 - .18 * pq) * (1 + .04 * k(t, a, 6, E.soft)), iw = 372 * zz, ih = iw * im.height / im.width;
        g.save(); rr(x + 14, y + 14, 372, 170, 18); g.clip(); g.globalAlpha *= pq; g.drawImage(im, x + 200 - iw / 2, y + 99 - ih / 2, iw, ih);
        const gr = g.createLinearGradient(0, y + 70, 0, y + 184); gr.addColorStop(0, 'rgba(6,16,31,0)'); gr.addColorStop(1, 'rgba(6,16,31,.75)'); g.fillStyle = gr; g.fillRect(x + 14, y + 14, 372, 170); g.restore(); }
      sweep(x, y, 400, 380, a + .4, 26);
      g.save(); g.translate(x + 28, y + 150); g.scale(.62, .62); icon(ic, 0, 0, k(t, a, .8)); g.restore();
      txt(kk, x + 40, y + 252, { size: 15, w: 700, ls: 3, col: C.blue2 }); typeOn(h, x + 40, y + 312, a + .1, { f: SERIF, size: 46, w: 700, col: C.white, cps: 30, caret: false });
      const cx = x + 340, cy = y + 62, ck = t >= a + .62; g.fillStyle = 'rgba(6,16,31,.6)'; g.beginPath(); g.arc(cx, cy, 23, 0, 7); g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(169,196,255,.6)'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.stroke();
      if (ck && !(i === 2 && t >= CARRY[0])) { g.fillStyle = C.blue2; g.beginPath(); g.arc(cx, cy, 20 * Math.max(0, spring(a + .62, 1.6, 7)), 0, 7); g.fill(); penPts([[cx - 9, cy], [cx - 2, cy + 8], [cx + 10, cy - 8]], a + .62, .28, { lw: 4, hot: false }); }
      g.restore(); });
    cursorPath([[62.85, 1500, 1060], [63.2, 610, 482, 1], [64.78, 1080, 482, 1], [66.86, 1550, 482, 1], [67.7, 1720, 1050]], C.white, C.ink);
  });
  function icon(kind, x, y, p) { g.save(); g.strokeStyle = C.white; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.arc(x + 44, y + 44, 44 * (.6 + .4 * p), 0, 7); g.fillStyle = 'rgba(59,123,255,.25)'; g.fill();
    g.setLineDash([200, 200]); g.lineDashOffset = 200 * (1 - p); g.beginPath();
    if (kind === 'cal') { g.rect(x + 22, y + 26, 44, 40); g.moveTo(x + 22, y + 38); g.lineTo(x + 66, y + 38); g.moveTo(x + 32, y + 20); g.lineTo(x + 32, y + 30); g.moveTo(x + 56, y + 20); g.lineTo(x + 56, y + 30); }
    if (kind === 'kpi') { g.moveTo(x + 20, y + 62); g.lineTo(x + 36, y + 44); g.lineTo(x + 48, y + 54); g.lineTo(x + 68, y + 28); g.moveTo(x + 56, y + 28); g.lineTo(x + 68, y + 28); g.lineTo(x + 68, y + 40); }
    if (kind === 'one') { g.arc(x + 32, y + 36, 9, 0, 7); g.moveTo(x + 65, y + 36); g.arc(x + 56, y + 36, 9, 0, 7); g.moveTo(x + 18, y + 66); g.quadraticCurveTo(x + 32, y + 48, x + 46, y + 66); g.moveTo(x + 42, y + 66); g.quadraticCurveTo(x + 56, y + 48, x + 70, y + 66); }
    g.stroke(); g.setLineDash([]); g.restore(); }

  // 10 · motivación — black; the cyclist rides on a ground line drawn by the trazo; ONE pill swaps the incentives
  scene('10 Motivación', 68.4, 73.3, '#04060A', (t) => {
    bgBlack(t); dust(t, 24); leaves(t, 'navy', ['tr'], 68.5); sideTexts('rgba(169,196,255,.35)', k(t, 68.6));
    typeOn('Y para', 960, 190, 68.5, { f: SERIF, size: 54, w: 600, it: true, col: C.sky, align: 'center', cps: 20 });
    typeOn('MOTIVAR AL EQUIPO', 960, 300, 68.92, Object.assign({ align: 'center', cps: 26 }, MOTBIG));
    if (t >= CARRY[1]) disc(960, 690, discR(t));
    penPts([[700, 905], [1220, 905]], 68.62, .45, { lw: 4 });
    ghost(IMG.cyclistCool, 960, 905, 400, CARRY[1] - .02, { dx: -60 });
    typeOn('INCENTIVO', 470, 640, 69.9, { size: 14, w: 700, ls: 4, col: C.sky, cps: 30, caret: false });
    roll(t < 71.24 ? '01' : t < 72.02 ? '02' : '03', 470, 724, t < 71.24 ? 70.14 : t < 72.02 ? 71.24 : 72.02, { f: DISP, size: 80, w: 800, col: C.white, steps: 1 });
    pillSwap(960, 940, [['COMISIÓN DEL 3 %', 70.14], ['BONUS TRIMESTRAL', 71.24], ['VENDEDOR DEL MES', 72.02]], 69.85, { size: 28, fill: C.white, col: C.ink });
  });

  // 11 · factores — the trazo draws an arch; Valencia fills it; internal vs external cards slide in from their own side
  const nodeW = (h, s) => Math.max(measure(h, { size: 26, w: 800 }), measure(s, { size: 15, w: 600, ls: 2 })) + 70;
  scene('11 Factores', 73.3, 81.65, C.navy, (t) => {
    bgNavy(t, [960, 480]); leaves(t, 'navy', ['tl', 'br'], 73.35); navyChrome(t, 73.4);
    const m = k(t, 81.0, .65, E.io), ex = k(t, 81.0, .45, E.in);
    { const p = k(t, 74.45, .9, E.out), nw = nodeW('Dirección Comercial', '1 DIRECTOR/A');
      const x = lerp(700, 960 - nw / 2, m), y = lerp(230, 359, m), w = lerp(520, nw, m), h = lerp(700, 92, m), rt = lerp(260, 18, m), rb = lerp(0, 18, m);
      if (p > 0) { g.save(); g.globalAlpha = p; g.beginPath(); g.roundRect(x, y, w, h, [rt, rt, rb, rb]); g.save(); g.clip(); if (p < 1) g.filter = `blur(${(10 * (1 - p)).toFixed(1)}px)`;
        const s = (1.12 - .08 * k(t, 74.45, 7, E.soft)) * (1 + .3 * m), iw = IMG.valenciaCool.width, ih = IMG.valenciaCool.height, sc = Math.max(w / iw, h / ih) * s; g.drawImage(IMG.valenciaCool, x + w / 2 - iw * sc / 2, y + h / 2 - ih * sc / 2, iw * sc, ih * sc); g.filter = 'none';
        if (m > 0) { g.fillStyle = `rgba(244,246,250,${m.toFixed(3)})`; g.fillRect(x, y, w, h); } g.restore();
        g.globalAlpha = p * k(t, 75.6, .6); g.lineWidth = 2; g.strokeStyle = 'rgba(190,210,255,.5)'; g.stroke(); g.restore(); } }
    pen(PATH.arch, 73.95, .8, { a: 1 - k(t, 75.6, .6, E.io) });
    g.save(); g.globalAlpha *= 1 - ex; if (ex > 0) g.filter = `blur(${(10 * ex).toFixed(1)}px)`;
    pillBar(960, 860, 79.5, 'VALENCIA · CIUDAD PERFECTA PARA LA BICI', { align: 'center', size: 20, fill: C.white, col: C.ink });
    typeOn('INTERNOS', 420, 260, 73.45, { f: SERIF, size: 64, w: 700, col: C.white, align: 'center', ls: 3, cps: 16 });
    typeOn('EXTERNOS', 1500, 260, 76.9, { f: SERIF, size: 64, w: 700, col: C.blue2, align: 'center', ls: 3, cps: 16 });
    const F = [[420, 74.02, 'EMPRESA PEQUEÑA', '12 personas en total'], [420, 75.4, 'PRODUCTO QUE HAY QUE PROBAR', 'la demostración vende'], [1500, 77.86, 'PARTICULARES Y EMPRESAS', 'dos formas de comprar'], [1500, 79.62, 'UBICACIÓN: VALENCIA', 'llana y con carril bici']];
    let li = 0, ri = 0;
    F.forEach(([x, a, h, s]) => { const i = x < 960 ? li++ : ri++, dir = x < 960 ? -1 : 1; if (t < a - .15) return; ev('card', a - .15);
      const sp = spring(a - .15, 1.2, 6.5), y = 360 + i * 200 + 5 * Math.sin(t * .8 + i + x); g.save(); g.globalAlpha *= clamp((t - a + .15) / .2); g.translate(dir * 640 * (1 - sp), 0);
      glass(x - 230, y, 460, 150, 22); typeOn(h, x, y + 66, a, { size: 22, w: 800, ls: 1, col: C.white, align: 'center', cps: 40, caret: false }); typeOn(s, x, y + 106, a + .3, { f: SERIF, size: 28, w: 600, it: true, col: C.sky, align: 'center', cps: 40, caret: false }); g.restore(); });
    g.restore();
  });

  // 12 · organigrama — the Valencia arch has become the top node; the trazo draws every connector
  scene('12 Organigrama', 81.65, 89.55, C.navy, (t) => {
    const c = k(t, 89.0, .3, E.in);
    bgNavy(t, [960, 300]); leaves(t, 'navy', ['tr', 'bl'], 81.7); navyChrome(t, 81.8, 1 - c); if (c > 0) { g.fillStyle = `rgba(4,6,10,${c.toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }
    g.save(); g.translate(960, 560); g.scale(1 - .96 * c, 1 - .96 * c); g.translate(-960, -560); g.globalAlpha *= 1 - c * .6; if (c > 0) g.filter = `blur(${(14 * c).toFixed(1)}px)`;
    typeOn('Por eso elegimos una', 960, 140, 81.72, { f: SERIF, size: 44, w: 600, it: true, col: C.sky, align: 'center', cps: 30 });
    typeOn('ESTRUCTURA', PATH.orgX, 240, 83.0, Object.assign({ cps: 26, caret: false }, ORGBIG)); typeOn('MIXTA', PATH.orgX + measure('ESTRUCTURA ', ORGBIG), 240, 83.5, Object.assign({}, ORGBIG, { col: C.blue2, cps: 18 }));
    pillBar(790, 276, 84.1, 'POR CLIENTE', { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] }); pillBar(1130, 276, 85.05, 'POR CANAL', { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] });
    const o = { lw: 3.5 };
    penPts([[960, 451], [960, 520], [420, 520], [420, 590]], 85.6, .5, o); penPts([[960, 520], [960, 590]], 87.05, .4, o); penPts([[960, 520], [1500, 520], [1500, 590]], 88.1, .5, o);
    penPts([[420, 682], [420, 720], [270, 720], [270, 770]], 86.35, .5, o); penPts([[420, 720], [580, 720], [580, 770]], 86.45, .5, o); penPts([[960, 682], [960, 770]], 87.65, .4, o);
    const nodeBox = (x, y, h, s, a, top) => { const w = nodeW(h, s);
      if (top) { rr(x - w / 2, y - 46, w, 92, 18); g.fillStyle = C.white; g.fill(); typeOn(h, x, y + 2, a, { size: 26, w: 800, col: C.ink, align: 'center', cps: 34, caret: false }); typeOn(s, x, y + 30, a + .4, { size: 15, w: 600, ls: 2, col: '#4A5872', align: 'center', cps: 40, caret: false }); return; }
      const q = k(t, a - .05, .55, E.out); if (q <= 0) return; ev('card', a - .05); const sp = .9 + .1 * q; g.save(); g.globalAlpha *= q; g.translate(x, y + 14 * (1 - q)); g.scale(sp, sp); g.translate(-x, -y);
      glass(x - w / 2, y - 46, w, 92, 18); typeOn(h, x, y + 2, a + .08, { size: 26, w: 700, col: C.white, align: 'center', cps: 36, caret: false }); typeOn(s, x, y + 30, a + .35, { size: 15, w: 600, ls: 2, col: C.sky, align: 'center', cps: 44, caret: false }); g.restore(); };
    nodeBox(960, 405, 'Dirección Comercial', '1 DIRECTOR/A', 81.95, true);
    nodeBox(420, 636, 'Ventas Particulares', 'CLIENTE · PARTICULAR', 86.08); nodeBox(960, 636, 'Ventas Empresas', 'CLIENTE · EMPRESA', 87.48); nodeBox(1500, 636, 'Administración', 'Y ANÁLISIS · 2', 88.64);
    nodeBox(270, 816, 'Tienda Ruzafa', 'CANAL · TIENDA ×3', 86.9); nodeBox(580, 816, 'Venta online', 'CANAL · ONLINE ×2', 87.0); nodeBox(960, 816, 'Cuentas clave', 'CANAL · B2B ×2', 88.1);
    g.restore();
    finalPen(t);
  });

  // the finale's pen: the org chart collapses into an orange point, which writes TRAZO in one stroke and ends as its dot
  function finalPen(t) {
    if (t < 89.15) return;
    const a = 1 - k(t, 89.98, .25, E.io);
    if (t < 89.3) { const r = 14 * k(t, 89.15, .15, E.out); penTip(960, 560, {}); g.save(); g.fillStyle = OR; g.beginPath(); g.arc(960, 560, r * .6, 0, 7); g.fill(); g.restore(); return; }
    if (a > 0) pen(PATH.mono, 89.3, .6, { lw: 7, a, ease: E.io });
  }
  // 13 · final — TRAZO slams onto its own stroke; the line types; GRACIAS types letter by letter
  scene('Final', 89.55, DUR, '#04060A', (t) => {
    const [sx, sy] = shakeAt(89.98, 12); g.translate(sx, sy);
    bgBlack(t); dust(t, 40); leaves(t, 'navy', ['tl', 'br'], 90.6);
    { const d = t - 89.94; if (d > 0 && d < .7) { const q = E.out(d / .7); g.save(); g.globalAlpha = 1 - d / .7; g.strokeStyle = 'rgba(255,190,160,.85)'; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.arc(PATH.fdot[0], PATH.fdot[1], 30 + 1100 * q, 0, 7); g.stroke(); g.restore(); }
      if (d > 0 && d < .25) { g.save(); g.fillStyle = `rgba(255,236,226,${(.42 * (1 - d / .25)).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); g.restore(); } }
    finalPen(t);
    const p = clamp((t - 89.94) / .3);
    const shrink = k(t, 90.55, .8, E.io), sc = (1 + .8 * (1 - E.out(p))) * lerp(1, .78, shrink) * (1 + .015 * k(t, 91, 5, E.soft)), y = lerp(560, 470, shrink);
    if (p > 0) { ev('slam', 89.94); g.save(); g.translate(960, y); g.scale(sc, sc); g.globalAlpha = clamp(p * 4); if (p < 1) g.filter = `blur(${((1 - p) * 22).toFixed(1)}px)`;
      g.shadowColor = 'rgba(110,160,255,.45)'; g.shadowBlur = 80; txt('TRAZO', PATH.monoX0, 80, FINAL); g.restore(); }
    // the dot: the pen tip rests on it; once the word has landed it travels with the word
    if (t >= 89.88) { ev('pop', 89.88); const ds = Math.max(0, spring(89.88, 1.6, 7)), lx = PATH.fdot[0] - 960, ly = PATH.fdot[1] - 560;
      const X = t < 90.24 ? PATH.fdot[0] : 960 + lx * sc, Y = t < 90.24 ? PATH.fdot[1] : y + ly * sc, R = 30 * (t < 90.24 ? 1 : sc);
      g.save(); g.fillStyle = OR; g.shadowColor = 'rgba(255,90,31,.7)'; g.shadowBlur = 30 * (1 - k(t, 90.3, .8)); g.beginPath(); g.arc(X, Y, R * ds, 0, 7); g.fill(); g.restore(); }
    typeOn('movilidad eléctrica para Valencia', 960, 700, 90.82, { f: SERIF, size: 50, w: 600, it: true, col: C.sky, align: 'center', cps: 24 });
    typeOn('GRACIAS', 960, 880, 93.24, { f: DISP, size: 110, w: 800, ls: 14, col: C.white, align: 'center', cps: 12 });
    const cr = { f: SERIF, size: 26, w: 600, it: true, col: C.sky, cps: 40, caret: false };
    typeOn('Presentado por Yasser', 140, 120, 91.3, cr); typeOn('Departamento de ventas', W - 140, 120, 91.5, Object.assign({ align: 'right' }, cr));
    typeOn('Práctica final · RA3', 140, H - 90, 91.7, cr); typeOn('Valencia · 2026', W - 140, H - 90, 91.9, Object.assign({ align: 'right' }, cr));
  });

  // ------------------------------------------------------------------ social card (front + back) and its 3D projection
  function buildCard() {
    const w = 540, h = 760, c = mk(w, h), x = c.getContext('2d'); const og = g; g = x;
    rr(0, 0, w, h, 30); x.fillStyle = '#F7F8FB'; x.fill(); x.save(); rr(0, 0, w, h, 30); x.clip();
    x.beginPath(); x.arc(46, 46, 22, 0, 7); x.fillStyle = C.ink; x.fill(); x.beginPath(); x.arc(46, 46, 7, 0, 7); x.fillStyle = OR; x.fill();
    txt('trazo.vlc', 80, 54, { size: 21, w: 700, col: '#111' }); txt('· Seguir', 178, 54, { size: 19, w: 600, col: '#2F6FD6' });
    const im = IMG.cyclistPhoto, ih = 440, iw = w - 40, s = Math.max(iw / im.width, ih / im.height); x.save(); rr(20, 86, iw, ih, 16); x.clip(); x.filter = 'saturate(.8) contrast(1.05)'; x.drawImage(im, 20 + iw / 2 - im.width * s / 2, 86 + ih / 2 - im.height * s / 2, im.width * s, im.height * s); x.filter = 'none';
    const gr = x.createLinearGradient(0, 86, 0, 300); gr.addColorStop(0, 'rgba(6,16,31,.65)'); gr.addColorStop(1, 'rgba(6,16,31,0)'); x.fillStyle = gr; x.fillRect(20, 86, iw, 240); x.restore();
    txt('este jueves,', 46, 140, { f: SERIF, size: 34, w: 600, it: true, col: '#fff' }); txt('PRUÉBALA GRATIS', 46, 190, { f: DISP, size: 42, w: 800, col: '#fff' });
    rr(w - 170, 108, 130, 34, 8); x.fillStyle = C.blue; x.fill(); txt('CAMPUS UPV', w - 105, 131, { size: 14, w: 800, ls: 1.5, col: '#fff', align: 'center' });
    x.fillStyle = '#FF3B4E'; x.beginPath(); x.moveTo(40, 572); x.bezierCurveTo(40, 552, 64, 552, 64, 566); x.bezierCurveTo(64, 552, 88, 552, 88, 572); x.bezierCurveTo(88, 588, 64, 598, 64, 606); x.bezierCurveTo(64, 598, 40, 588, 40, 572); x.fill();
    x.strokeStyle = '#111'; x.lineWidth = 3; x.beginPath(); x.arc(126, 576, 16, 0, 7); x.stroke(); x.beginPath(); x.moveTo(166, 562); x.lineTo(200, 576); x.lineTo(166, 592); x.closePath(); x.stroke();
    txt('2.418 Me gusta', 40, 646, { size: 22, w: 700, col: '#111' }); txt('Ven a probarla al campus →', 40, 684, { size: 20, w: 400, col: '#333' }); txt('#TrazoVLC #MuéveteEléctrico', 40, 716, { size: 20, w: 500, col: '#2F6FD6' });
    x.restore(); g = og; return c;
  }
  function buildCardBack() {
    const w = 540, h = 760, c = mk(w, h), x = c.getContext('2d'); const og = g; g = x;
    rr(0, 0, w, h, 30); const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2C6BE8'); gr.addColorStop(1, '#0B1A33'); x.fillStyle = gr; x.fill();
    const tw = measure('TRAZO', { f: DISP, size: 96, w: 800, ls: -2 }); txt('TRAZO', w / 2 - 12, h / 2 + 30, { f: DISP, size: 96, w: 800, ls: -2, col: '#fff', align: 'center' }); x.beginPath(); x.arc(w / 2 - 12 + tw / 2 + 14, h / 2 + 20, 11, 0, 7); x.fillStyle = OR; x.fill();
    g = og; return c;
  }
  function tiltCard(img0, cx, cy, rot, scale) {
    const cs = Math.cos(rot), sn = Math.sin(rot), img = cs < 0 ? IMG.cardBack : img0, w = img.width * scale, h = img.height * scale, f = 1800, N = 90;
    const at = u => { const X = (u - .5) * w, p = f / (f + X * sn); return [cx + X * cs * p, h * p]; };
    g.save();
    for (let i = 0; i < N; i++) { const [sx0, h0] = at(i / N), [sx1] = at((i + 1) / N), a = Math.min(sx0, sx1), wd = Math.abs(sx1 - sx0) + .6;
      g.drawImage(img, i / N * img.width, 0, img.width / N + .6, img.height, a, cy - h0 / 2, wd, h0); }
    g.restore();
    if (Math.abs(cs) < .2) { g.save(); g.globalAlpha *= 1 - Math.abs(cs) / .2; g.fillStyle = '#DCE4F2'; const [ex, eh] = at(.5); g.fillRect(ex - 3, cy - eh / 2 + 16, 6, eh - 32); g.restore(); }
    const [lx, lh] = at(0), [rx, rh] = at(1);
    g.save(); g.beginPath(); g.moveTo(lx, cy - lh / 2); g.lineTo(rx, cy - rh / 2); g.lineTo(rx, cy + rh / 2); g.lineTo(lx, cy + lh / 2); g.closePath(); g.clip();
    g.globalCompositeOperation = 'soft-light'; const gr = g.createLinearGradient(Math.min(lx, rx), cy - h / 2, Math.max(lx, rx), cy + h / 2); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(Math.min(lx, rx), cy - h / 2, Math.abs(rx - lx), h); g.restore();
  }

  // ------------------------------------------------------------------ paths (built once type and images are ready)
  function buildPaths() {
    const m15 = (x, y) => [960 + (x - 775) * BW.w / 1100 * 1.5, 600 + (y - 580) * BW.w / 1100 * 1.5], R15 = r => r * BW.w / 1100 * 1.5;
    const m1 = (x, y) => [960 + (x - 775) * BW.w / 1100, 600 + (y - 580) * BW.w / 1100];
    // the YASSER dot (where the pen is born)
    const yw = measure('YASSER', YO); PATH.dot = [960 + yw / 2 + 30, 668];
    // the bike in one stroke (photo coordinates of the brand photo → screen at 1.5x), preceded by the launch from the dot
    const P = (x, y) => m15(x, y), A = (cx, cy, r, a0, a1) => { const c = P(cx, cy); return ['E', c[0], c[1], R15(r), R15(r), a0, a1]; };
    const wheelTop = P(519, 586), d = PATH.dot, TAU = Math.PI * 2, H2 = Math.PI / 2;
    const launch = [['M', d[0], d[1]], ['C', d[0] + 120, d[1] + 170, wheelTop[0] + 200, wheelTop[1] + 110, wheelTop[0], wheelTop[1]]];
    const bike = [A(519, 708, 122, -H2, -H2 - TAU), ['L', ...P(520, 708)], ['L', ...P(742, 700)], ['L', ...P(702, 700)], A(742, 700, 40, Math.PI, Math.PI + TAU),
      ['L', ...P(712, 668)], ['L', ...P(620, 500)], ['L', ...P(568, 492)], ['C', ...P(556, 488), ...P(558, 458), ...P(586, 450)], ['L', ...P(700, 452)], ['C', ...P(716, 454), ...P(720, 476), ...P(708, 488)], ['L', ...P(650, 497)],
      ['C', ...P(690, 560), ...P(720, 640), ...P(768, 660)], ['L', ...P(925, 508)], ['L', ...P(932, 400)], ['L', ...P(920, 338)], ['C', ...P(905, 322), ...P(882, 305), ...P(866, 300)], ['C', ...P(884, 314), ...P(915, 322), ...P(942, 318)],
      ['L', ...P(948, 520)], ['L', ...P(1042, 700)], ['L', ...P(1050, 835)], A(1050, 707, 128, H2, H2 - TAU), ['C', ...P(1100, 842), ...P(1150, 846), ...P(1192, 845)]];
    PATH.bikeLaunch = sampleCmds(launch).len; PATH.bike = sampleCmds(launch.concat(bike));
    // the window frame, from the end of the bike (drawn at 1x by then) around the photo card
    const e1 = m1(1192, 845), { x, y, w, h } = BW, r = 26;
    PATH.frame = sampleCmds([['M', e1[0], e1[1]], ['L', x + w, e1[1]], ['L', x + w, y + r], ['E', x + w - r, y + r, r, r, 0, -H2], ['L', x + r, y], ['E', x + r, y + r, r, r, -H2, -Math.PI],
      ['L', x, y + h - r], ['E', x + r, y + h - r, r, r, Math.PI, H2], ['L', x + w - r, y + h], ['E', x + w - r, y + h - r, r, r, H2, 0], ['L', x + w, e1[1]]]);
    // clientes: the stage circle, started where the comet lands
    PATH.ring = sampleCmds([['E', 960, 590, 310, 310, Math.PI / 3, Math.PI / 3 + TAU]]);
    // funciones: underline of the kicker, the 4 in one stroke, the rail with four stations
    const kw = measure('nuestro departamento de ventas tiene', { f: SERIF, size: 54, w: 600, it: true }), ux0 = 960 - kw / 2, ux1 = 960 + kw / 2;
    PATH.fnUnder = polyPath([[ux0, 352], [ux1, 352]]); PATH.fnU0 = [ux0, 352];
    const wf = measure('FUNCIONES', FNBIG), w4 = 96, gap = 44, fx0 = 960 - (w4 + gap + wf) / 2; PATH.fnX = fx0 + w4 + gap;
    const top = 530 - 108, bar = 530 - 36;
    PATH.four = polyPath([[fx0 + w4, bar], [fx0, bar], [fx0 + 64, top], [fx0 + 64, 530]]);
    PATH.fnConn1 = sampleCmds([['M', ux1, 352], ['C', ux1 + 60, 420, fx0 + 260, bar - 40, fx0 + w4, bar]]);
    PATH.fnConn2 = sampleCmds([['M', fx0 + 64, 530], ['C', fx0 + 64, 600, 230, 600, 200, 650]]);
    PATH.rail = polyPath([[200, 650], [1720, 650]]); PATH.railAt = [0, 1, 2, 3].map(i => (390 + i * 380 - 200) / 1520);
    // fidelización: the loop around the reviews, ending in an arrowhead
    const lc = [1430, 585], lr = [430, 345], aEnd = 200 * Math.PI / 180 + 1.85 * Math.PI, ex = lc[0] + lr[0] * Math.cos(aEnd), ey = lc[1] + lr[1] * Math.sin(aEnd);
    const tx = -lr[0] * Math.sin(aEnd), ty = lr[1] * Math.cos(aEnd), tl = Math.hypot(tx, ty), ux = tx / tl, uy = ty / tl;
    PATH.loop = sampleCmds([['E', lc[0], lc[1], lr[0], lr[1], 200 * Math.PI / 180, aEnd], ['L', ex - ux * 34 - uy * 22, ey - uy * 34 + ux * 22], ['L', ex, ey], ['L', ex - ux * 34 + uy * 22, ey - uy * 34 - ux * 22]]);
    // gestión: from the last list node to the stamp, then the stamp ring (from the bottom)
    PATH.toStamp = sampleCmds([['M', 170, 715], ['C', 420, 1000, 1350, 1040, 1730, 990]]);
    PATH.stampRing = sampleCmds([['E', 1730, 890, 100, 100, H2, H2 + TAU]]);
    // smart: underline under OBJETIVOS SMART, and the three signs
    const smw = measure('OBJETIVOS SMART', SMBIG); PATH.smX = 960 - smw / 2; PATH.smUnder = polyPath([[PATH.smX, 588], [PATH.smX + smw, 588]]);
    PATH.smCurve = sampleCmds([['M', 1272, 730], ['C', 1352, 722, 1410, 640, 1462, 410], ['L', 1438, 448], ['L', 1462, 410], ['L', 1480, 450]]);
    { const pts = [['M', 700, 770]]; for (let i = 0; i < 15; i++) { const xx = 700 + i * 37; pts.push(['L', xx, 770], ['L', xx, 744], ['L', xx, 770]); } pts.push(['L', 1220, 770]); PATH.smTicks = sampleCmds(pts); }
    { const pts = []; for (let i = 0; i <= 10; i++) { const a = -H2 + i * Math.PI / 5, rr2 = i % 2 ? 56 * .45 : 56; pts.push([i ? 'L' : 'M', 1385 + Math.cos(a) * rr2, 470 + Math.sin(a) * rr2]); } PATH.smStar = sampleCmds(pts); }
    // supervisión: underline under CONTROLAMOS?
    const cw = measure('CONTROLAMOS?', SUPBIG); PATH.supUnder = polyPath([[960 - cw / 2, 566], [960 + cw / 2, 566]]);
    // factores: the arch (from the bottom right, up, over, down, back along the bottom)
    PATH.arch = sampleCmds([['M', 1220, 930], ['L', 1220, 490], ['E', 960, 490, 260, 260, 0, -Math.PI], ['L', 700, 930], ['L', 1220, 930]]);
    // organigrama headline position
    PATH.orgX = 960 - measure('ESTRUCTURA MIXTA', ORGBIG) / 2;
    // finale: TRAZO written in one monoline stroke over the wordmark's skeleton, ending on the logo's dot
    { const tw2 = measure('TRAZO', FINAL), left = -tw2 / 2, base = 640; PATH.monoX0 = 0; font(DISP, FINAL.size, FINAL.w); const cap = g.measureText('T').actualBoundingBoxAscent;
      const gx = [...'TRAZO'].map((ch, i) => [960 + left + measure('TRAZO'.slice(0, i), FINAL), measure(ch, Object.assign({}, FINAL, { ls: 0 }))]);
      const L = (i, u, v) => [gx[i][0] + gx[i][1] * u, base - cap * v];
      const p = [['M', ...L(0, .06, 1)], ['L', ...L(0, .94, 1)], ['L', ...L(0, .5, 1)], ['L', ...L(0, .5, 0)],
        ['L', ...L(1, .14, 0)], ['L', ...L(1, .14, 1)], ['L', ...L(1, .55, 1)], ['C', ...L(1, .9, 1), ...L(1, .9, .52), ...L(1, .55, .52)], ['L', ...L(1, .14, .52)], ['L', ...L(1, .88, 0)],
        ['L', ...L(2, .05, 0)], ['L', ...L(2, .5, 1)], ['L', ...L(2, .95, 0)], ['L', ...L(2, .78, .33)], ['L', ...L(2, .22, .33)], ['L', ...L(2, .78, .33)], ['L', ...L(2, .95, 0)],
        ['L', ...L(3, .93, 0)], ['L', ...L(3, .07, 0)], ['L', ...L(3, .93, 1)], ['L', ...L(3, .07, 1)]];
      const oc = L(4, .5, .5), orx = gx[4][1] * .42, ory = cap * .52; p.push(['L', oc[0], oc[1] - ory], ['E', oc[0], oc[1], orx, ory, -H2, -H2 - TAU]);
      const dx = 960 + left + tw2 + 16 + 30, dy = base - 30; PATH.fdot = [dx, dy];
      p.push(['C', oc[0] + orx * 1.1, oc[1] - ory * 1.1, dx - 10, dy - 160, dx, dy]); PATH.mono = sampleCmds(p); }
    // comets (transits across travel cuts): lead in scene A coords, out in scene B coords
    const fnU = PATH.fnU0, smU = [PATH.smX, 588], spU = [960 - cw / 2, 566];
    COMETS.length = 0;
    COMETS.push({ cut: 9.75, hl: .5, dir: 'x', lead: [['M', 1330, 805], ['C', 1360, 900, 1450, 960, 1560, 960]], leadT: [8.95, 9.25], out: [['M', 1560, 960], ['C', 1400, 960, 1235, 790, 960 + 310 * Math.cos(Math.PI / 3), 590 + 310 * Math.sin(Math.PI / 3)]], outT: [10.25, 10.5] });
    COMETS.push({ cut: 18.55, hl: .5, dir: 'y', lead: [['M', 960, 900], ['L', 960, 1000]], leadT: [17.75, 18.05], out: [['M', 960, 1000], ['C', 900, 700, 420, 360, fnU[0], fnU[1]]], outT: [19.05, 19.5] });
    COMETS.push({ cut: 46.4, hl: .5, dir: 'y', lead: [['M', 1730, 990], ['L', 1730, 1040]], leadT: [45.75, 45.9], out: [['M', 1730, 1040], ['C', 1500, 800, 300, 720, smU[0], smU[1]]], outT: [46.9, 47.5] });
    COMETS.push({ cut: 60.95, hl: .5, dir: 'x', lead: [['M', 1385, 414], ['C', 1480, 430, 1560, 700, 1560, 860]], leadT: [60.15, 60.45], out: [['M', 1560, 860], ['C', 1300, 860, 300, 700, spU[0], spU[1]]], outT: [61.45, 61.75] });
    COMETS.push({ cut: 73.3, hl: .5, dir: 'x', lead: [['M', 1220, 905], ['L', 1500, 905]], leadT: [72.5, 72.8], out: [['M', 1500, 905], ['C', 1400, 930, 1300, 935, 1220, 930]], outT: [73.8, 73.95] });
    for (const c of COMETS) { const Ln = c.dir === 'x' ? W : H, lead = sampleCmds(c.lead), lock = [lead.X[lead.X.length - 1], lead.Y[lead.Y.length - 1]], sh = c.dir === 'x' ? [Ln, 0] : [0, Ln];
      const outW = c.out.map(cmd => cmd[0] === 'M' ? null : [cmd[0], ...cmd.slice(1).map((v, i) => v + sh[i % 2])]).filter(Boolean);
      c.P = sampleCmds(c.lead.concat([['L', lock[0] + sh[0], lock[1] + sh[1]]], outW)); c.sLead = lead.len; c.L = Ln; c.sOut = c.P.len - lead.len - Ln; }
  }

  // ------------------------------------------------------------------ overlays drawn over the composite (camera-aware)
  const CAM = t => 1.02 + .012 * Math.sin(t * .21);   // slow global breathing zoom, continuous across every cut
  const camSet = (ctx, t) => { const sc = CAM(t); ctx.setTransform(sc, 0, 0, sc, 960 - sc * (960 - 4 * Math.sin(t * .5)), 540 - sc * (540 - 3 * Math.cos(t * .4))); };
  const COMETS = [];
  const travelOff = (c, t) => t <= c.cut - c.hl ? 0 : t >= c.cut + c.hl ? c.L : E.io((t - (c.cut - c.hl)) / (2 * c.hl)) * c.L;
  function comets(t) {
    for (const c of COMETS) { if (t < c.leadT[0] || t > c.outT[1] + .35) continue; ev('comet', c.cut);
      let s; if (t < c.leadT[1]) s = c.sLead * E.pen(clamp((t - c.leadT[0]) / (c.leadT[1] - c.leadT[0]))); else if (t < c.cut + c.hl) s = c.sLead + travelOff(c, t); else s = c.sLead + c.L + c.sOut * E.pen(clamp((t - c.outT[0]) / (c.outT[1] - c.outT[0])));
      const tail = 620, s0 = t > c.outT[1] ? lerp(Math.max(0, s - tail), s, k(t, c.outT[1], .3, E.in)) : Math.max(0, s - tail), off = travelOff(c, t);
      const og = g; g = main; const sc = CAM(t), sAend = c.sLead + c.L, ax = c.dir === 'x' ? 1 : 0;
      const setT = extra => { camSet(g, t); const m = g.getTransform(); g.setTransform(m.a, 0, 0, m.d, m.e + ax * (extra - off), m.f + (1 - ax) * (extra - off)); };
      if (s0 < sAend) { setT(0); inkStroke(c.P, s0, Math.min(s, sAend), {}); }
      if (s > sAend - 40) { setT((1 - sc) * c.L); inkStroke(c.P, Math.max(s0, sAend - 40), s, {}); }
      if (t < c.outT[1]) { const p = ptAt(c.P, s); setT(s > sAend ? (1 - sc) * c.L : 0); penTip(p[0], p[1]); }
      g = og; }
  }
  // giant-word cut: the function's name slams in full-frame on the voice, holds, then shrinks into the scene's title box
  const WORDS = [[22.0, 'CAPTACIÓN'], [28.8, 'FIDELIZACIÓN'], [35.55, 'ANÁLISIS'], [41.1, 'GESTIÓN']];
  function giantWords(t) {
    for (const [c, word] of WORDS) { if (t < c - .16 || t >= c + 1.0) continue; ev('word', c);
      const og = g; g = main; camSet(g, t);
      const wash = Math.min(clamp((t - (c - .16)) / .1), 1 - clamp((t - (c + .4)) / .35)) * .9;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(6,16,31,${wash.toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore();
      const w92 = measure(word, TITLE), Gs = (W * 1.06) / w92, inP = E.out(clamp((t - (c - .16)) / .24)), sh = E.io(clamp((t - (c + .4)) / .6));
      const Sg = Gs * (1 + .28 * (1 - inP)) * (1 + .03 * clamp((t - c) / .4)), S = lerp(Sg, 1, sh), lx = lerp(960 - w92 * Sg / 2, 185, sh), by = lerp(540 + 30 * Sg, 360, sh), lx0 = 0;
      g.save(); g.globalAlpha = clamp((t - (c - .16)) / .08); const bl = 14 * (1 - inP); if (bl > .3) g.filter = `blur(${bl.toFixed(1)}px)`;
      g.translate(lx, by); g.scale(S, S); txt(word, 0, 0, TITLE); g.restore(); void lx0; g = og; }
  }
  const LEAKS = [[1.15, 1.5, 1], [89.9, 1.8, 1]];
  function leaks(t) { for (const [t0, dur, dir] of LEAKS) { const q = (t - t0) / dur; if (q <= 0 || q >= 1) continue; const a = Math.sin(Math.PI * q) ** 1.5, x = dir > 0 ? lerp(-300, W + 300, q) : lerp(W + 300, -300, q);
      main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalCompositeOperation = 'screen'; let gr = main.createRadialGradient(x, 300, 0, x, 300, 900); gr.addColorStop(0, `rgba(205,225,255,${(.24 * a).toFixed(3)})`); gr.addColorStop(.5, `rgba(120,165,255,${(.09 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(90,140,255,0)');
      main.fillStyle = gr; main.fillRect(0, 0, W, H); main.restore(); } }

  // ------------------------------------------------------------------ composition
  // travel = the camera follows the pen into the next scene (directional resample blur + foreground branches at 2x);
  // iris = paper floods out of the pen tip; match = continuity cut. Word cuts are hard cuts hidden under the giant word.
  const CUTS = {
    3.25: ['iris', .45], 9.75: ['travel', .5, [-1, 0]], 18.55: ['travel', .5, [0, -1]], 46.4: ['travel', .5, [0, -1]], 60.95: ['travel', .5, [-1, 0]],
    68.4: ['match', .2], 73.3: ['travel', .5, [-1, 0]], 81.65: ['match', .1], 89.55: ['match', .06],
  };
  window.VH_CUTS = CUTS; window.VH_WORDS = WORDS;
  const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H), bufD = mk(W, H), cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d'), cD = bufD.getContext('2d');
  function drawScene(s, t, ctx) { const og = g; g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = s.base; g.fillRect(0, 0, W, H); camSet(g, t); s.draw(t); g = og; }
  function transition(type, A, B, t, p, ex, hl) {
    const m = main, e = E.io(clamp(p));
    drawScene(A, t, cA); drawScene(B, t, cB);
    m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
    if (type === 'travel') {
      const [dx, dy] = ex, L = dx ? W : H, dp = (.5 / 60) / (2 * hl), travel = Math.abs(E.io(clamp(p + dp / 2)) - E.io(clamp(p - dp / 2))) * L, off = e * L;
      cC.setTransform(1, 0, 0, 1, 0, 0); cC.globalAlpha = 1; cC.drawImage(bufA, dx * off, dy * off); cC.drawImage(bufB, dx * (off - L), dy * (off - L));
      const f = Math.min(40, travel / 1.2);
      if (f < 1.5) m.drawImage(bufC, 0, 0);
      else { const fd = Math.min(12, f), tw = dx ? Math.round(W / fd) : W, th = dy ? Math.round(H / fd) : H;   // squash along the motion, stretch back, soften the steps
        cD.setTransform(1, 0, 0, 1, 0, 0); cD.imageSmoothingEnabled = true; cD.imageSmoothingQuality = 'high'; cD.clearRect(0, 0, W, H); cD.drawImage(bufC, 0, 0, tw, th);
        m.imageSmoothingEnabled = true; m.imageSmoothingQuality = 'high'; const sb = Math.max(0, (f - 3) * .3); if (sb > .4) m.filter = `blur(${sb.toFixed(1)}px)`; m.drawImage(bufD, 0, 0, tw, th, 0, 0, W, H); m.filter = 'none'; }
      // out-of-focus orange-tree branches pass the lens faster than the world (depth)
      const Lf = LEAF.front; if (A.base !== C.paper) for (const [k2, rot] of [[0, .5], [1, -2.4]]) { const along = L * 1.3 + k2 * 700 - off * 2.3, across = k2 ? (dx ? H + 40 : W + 40) : -60;
        m.save(); m.globalAlpha = .62; m.translate(dx ? along : across, dx ? across : along); m.rotate(rot); m.scale(2.4, 2.4); m.drawImage(Lf, -Lf.width / 2, -Lf.height / 2); m.restore(); }
    } else if (type === 'iris') {
      const c = bikeEnd(t), pc = camPt('', t, c[0], c[1]), R = 2400 * E.io(clamp(p)) + 1;
      m.drawImage(bufA, 0, 0); m.save(); m.beginPath(); m.arc(pc[0], pc[1], R, 0, 7); m.clip(); m.drawImage(bufB, 0, 0); m.restore();
      if (R > 2 && R < 2300) { m.save(); m.globalAlpha = 1 - clamp(p); m.strokeStyle = 'rgba(255,120,60,.9)'; m.lineWidth = 3; m.shadowColor = 'rgba(255,90,31,.9)'; m.shadowBlur = 24; m.beginPath(); m.arc(pc[0], pc[1], R, 0, 7); m.stroke(); m.restore(); }
    } else if (type === 'match') { m.drawImage(bufA, 0, 0); m.globalAlpha = e; m.drawImage(bufB, 0, 0); }
    m.globalAlpha = 1; m.filter = 'none';
  }
  function picture(t) {
    T = t; const cur = SC.findIndex(s => t >= s.t0 && t < s.t1), i = cur < 0 ? SC.length - 1 : cur, s = SC[i];
    const nxt = SC[i + 1], prv = SC[i - 1];
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none'; main.globalCompositeOperation = 'source-over';
    let done = false;
    for (const [A, B] of [[s, nxt], [prv, s]]) { if (!A || !B || done) continue; const c = CUTS[B.t0]; if (!c) continue; const h = c[1];
      if (t > B.t0 - h && t < B.t0 + h) { transition(c[0], A, B, t, (t - (B.t0 - h)) / (2 * h), c[2], h); done = true; } }
    if (!done) drawScene(s, t, main);
    carryOverlay(t); comets(t); giantWords(t); leaks(t);
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none'; main.globalCompositeOperation = 'source-over';
  }
  // finish: soft bloom (by world: none on paper), vignette, grain — applied once per frame, after motion blur
  const blC = mk(320, 180), blX = blC.getContext('2d');
  function finish(t) {
    const base = (SC.find(s => t >= s.t0 && t < s.t1) || SC[SC.length - 1]).base, amt = base === C.paper ? 0 : base === C.navy ? .16 : .22;
    if (amt > 0) { blX.globalCompositeOperation = 'source-over'; blX.filter = 'brightness(.85) contrast(2.6) saturate(1.25)'; blX.imageSmoothingQuality = 'high'; blX.drawImage(main.canvas, 0, 0, 320, 180); blX.filter = 'blur(5px)'; blX.drawImage(blC, 0, 0); blX.filter = 'none';
      main.save(); main.globalCompositeOperation = 'screen'; main.globalAlpha = amt; main.imageSmoothingQuality = 'high'; main.drawImage(blC, 0, 0, W, H); main.restore(); }
    const vg = main.createRadialGradient(960, 540, 520, 960, 540, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,.32)'); main.fillStyle = vg; main.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = main.createPattern(grainTile, 'repeat');
    const fi = Math.floor(t * 30); main.save(); main.globalAlpha = t > 89.5 || t < 3.2 ? .1 : .045; main.globalCompositeOperation = 'overlay'; main.translate((fi * 37) % 128 - 64, (fi * 53) % 128 - 64); main.fillStyle = grainPat; main.fillRect(-64, -64, W + 128, H + 128); main.restore();
  }
  // true motion blur on the fast moments: 5 sub-frames over a 180° shutter, averaged in float (no 8-bit stepping)
  const MBW = [[1.2, 1.62], [15.4, 16.2], [21.84, 23.02], [22.55, 23.9], [28.64, 29.82], [35.39, 36.57], [40.94, 42.12], [45.7, 46.0], [67.75, 68.62], [89.9, 90.35]];
  const MB9 = WORDS.map(([c]) => [c + .3, c + 1.02]);
  let ACC = null;
  function frame(t) {
    if (!MBW.some(([a, b]) => t >= a && t < b)) picture(t);
    else { const N = MB9.some(([a, b]) => t >= a && t < b) ? 9 : 5, sh = 1 / 120; if (!ACC) ACC = new Float32Array(W * H * 4); ACC.fill(0);
      for (let j = 0; j < N; j++) { picture(clamp(t + sh * (j / (N - 1) - .5), 0, DUR)); const d = main.getImageData(0, 0, W, H).data; for (let i = 0; i < d.length; i++) ACC[i] += d[i]; }
      const out = main.createImageData(W, H), od = out.data; for (let i = 0; i < od.length; i++) od[i] = ACC[i] / N; main.putImageData(out, 0, 0); }
    T = t; finish(t);
  }

  window.VH_SCENES = SC.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 }));
  window.renderOut = function (t) { frame(clamp(+t || 0, 0, DUR)); };

  (async () => {
    const LAT = 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212', EXT = 'U+0100-024F, U+1E00-1EFF';
    const faces = [
      ['IT', 'intertight-latin.woff2', '100 900', 'normal', LAT], ['IT', 'intertight-ext.woff2', '100 900', 'normal', EXT],
      ['BG', 'bricolage-latin-opsz.woff2', '200 800', 'normal', LAT], ['BG', 'bricolage-latin-ext-opsz.woff2', '200 800', 'normal', EXT],
      ...['600', '700'].flatMap(w => ['normal', 'italic'].flatMap(st => [['CG', `cormorant-garamond-latin-${w}-${st}.woff2`, w, st, LAT], ['CG', `cormorant-garamond-latin-ext-${w}-${st}.woff2`, w, st, EXT]]))];
    for (const [fam, file, weight, style, ur] of faces) { const f = new FontFace(fam, `url(fonts/${file})`, { weight, style, unicodeRange: ur }); document.fonts.add(f); await f.load(); }
    await Promise.all([loadImage('ebike', 'assets/cut/ebike.png'), loadImage('courier', 'assets/cut/courier3.png'), loadImage('student', 'assets/cut/student.png'), loadImage('cyclist', 'assets/cut/cyclist.png'),
      loadImage('cyclistPhoto', 'assets/photos/cyclist.jpg'), loadImage('valencia', 'assets/photos/valencia.jpg'),
      loadImage('brand', 'assets/photos/brand.jpg'), loadImage('supMeeting0', 'assets/photos/sup_meeting.jpg'), loadImage('supKpi0', 'assets/photos/sup_kpi.jpg'), loadImage('supOne0', 'assets/photos/sup_one.jpg')]);
    await document.fonts.ready;
    IMG.studentCool = grade(IMG.student, 'cool'); IMG.courierCool = grade(IMG.courier, 'soft'); IMG.cyclistCool = grade(IMG.cyclist, 'cool');
    for (const k2 of ['studentCool', 'courierCool', 'cyclistCool']) IMG[k2].glow = rimGlow(IMG[k2]);
    { const v = IMG.valencia, c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.5) contrast(1.1) brightness(.85)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.55)'; x.fillRect(0, 0, c.width, c.height); IMG.valenciaCool = c; }
    LEAF.paper = blurred(branch(11, 'rgba(18,40,90,.92)', '#1D3E86'), 6); LEAF.front = blurred(branch(37, 'rgba(5,14,36,1)', null), 18); LEAF.navy = blurred(branch(23, 'rgba(14,44,110,.95)', '#2C6BE8'), 10);
    IMG.card = buildCard(); IMG.cardBack = buildCardBack();
    { const v = IMG.brand, mkc = f => { const c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = f; x.drawImage(v, 0, 0); return c; };
      IMG.brandCol = mkc('contrast(1.08) saturate(.9) brightness(1.03)'); { const x = IMG.brandCol.getContext('2d'); x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(40,90,200,.28)'; x.fillRect(0, 0, v.width, v.height); } }
    for (const k2 of ['supMeeting', 'supKpi', 'supOne']) { const v = IMG[k2 + '0'], c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.55) contrast(1.08) brightness(.9)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.5)'; x.fillRect(0, 0, c.width, c.height); IMG[k2] = c; }
    buildPaths();
    window.renderOut(0);
    window.READY = true;
  })();
})();
