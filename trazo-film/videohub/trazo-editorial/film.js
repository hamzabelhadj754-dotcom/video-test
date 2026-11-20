// TRAZO · editorial film v03 for VideoHub — one 1920x1080 canvas, window.renderOut(t) is a pure function of t.
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
  const spring = (t0, f = 1.5, d = 6.5) => { const x = T - t0; return x <= 0 ? 0 : 1 - Math.exp(-x * d) * Math.cos(x * 2 * Math.PI * f); };
  const shakeAt = (t0, amp = 10, dur = .5) => { const x = T - t0; if (x < 0 || x > dur) return [0, 0]; const a = amp * Math.exp(-x * 8); return [a * Math.sin(x * 97), a * Math.cos(x * 71)]; };
  // true motion blur for fast moves: re-draw the element at earlier instants, the current one solid, the trail fading
  function motion(fn, n = 5, sh = .03) { const T0 = T, a0 = g.globalAlpha; for (let j = 0; j < n; j++) { T = T0 - sh * j / (n - 1); g.globalAlpha = a0 / (j + 1); fn(); } T = T0; g.globalAlpha = a0; }
  // letter-by-letter typing: each new glyph pops (scale + blur), blinking caret, settled text drawn kerned
  function typeOn(s, x, y, t0, o = {}) {
    const cps = o.cps || 22, fo = Object.assign({ f: SANS, size: 24, w: 600 }, o, { align: 'left' }), size = fo.size;
    const full = measure(s, fo), X = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
    if (T < t0) return full; ev('type', t0, { n: s.replace(/ /g, '').length, cps });
    const n = Math.min(s.length, Math.floor((T - t0) * cps) + 1);
    let st = 0; while (st < n && T - (t0 + st / cps) >= .16) st++;
    if (st) txt(s.slice(0, st), X, y, fo);
    for (let i = st; i < n; i++) { const ch = s[i]; if (ch === ' ') continue; const p = clamp((T - (t0 + i / cps)) / .16), cx = X + measure(s.slice(0, i), fo), cw = measure(ch, fo);
      g.save(); g.globalAlpha *= p; if (o.pop !== false) { const sc = 1 + .4 * (1 - E.out(p)), py = y - size * .35; g.translate(cx + cw / 2, py); g.scale(sc, sc); g.translate(-(cx + cw / 2), -py); }
      if (p < 1) g.filter = `blur(${(5 * (1 - p)).toFixed(1)}px)`; txt(ch, cx, y, fo); g.restore(); }
    const tEnd = t0 + (s.length - 1) / cps, hold = o.caretHold != null ? o.caretHold : .45;
    if (o.caret !== false && T < tEnd + hold && (T < tEnd + .05 || Math.floor((T - tEnd) * 5) % 2 === 0)) {
      g.fillStyle = o.caretCol || fo.col || C.white; g.fillRect(X + measure(s.slice(0, n), fo) + 4, y - size * .76, Math.max(2, size * .045), size * .9); }
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
    const ww = h + (w - h) * Math.max(0, E.back(p)), X = (o.align === 'center' ? x - w / 2 : x) - 70 * (1 - E.out(p)) - 60 * out;
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
    const wOf = j => j < 0 ? h * 2.4 : measure(list[j][0], fo) + padX * 2, q = i < 0 ? 1 : E.back(clamp((T - list[i][1]) / .5));
    let ww = lerp(wOf(i - 1), wOf(i), q); ww = h + (ww - h) * Math.max(0, E.back(p));
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
  function ghost(img, cx, by, h, t0, o = {}) { const a = k(T, t0, .35), b = k(T, t0 + .3, 1.0, E.out); if (a <= 0) return; ev('ghost', t0);
    const dx = (o.dx != null ? o.dx : 50) * (1 - b), s = h / img.height, w = img.width * s;
    if (b < 1) { g.save(); g.globalAlpha *= .6 * a * (1 - b); g.drawImage(img.pale, cx - w / 2 + dx * 1.8, by - h, w, h); g.restore(); }
    if (b > 0) { g.save(); g.globalAlpha *= b; if (b < 1) g.filter = `blur(${(12 * (1 - b)).toFixed(1)}px)`; photo(img, cx + dx, by, h, o); g.restore(); } }
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
  function popText(s, x, y, t0, o = {}) { if (T < t0) return; ev('pop', t0); const sp = Math.max(0, spring(t0, 1.6, 7)), m = measure(s, o), cx = o.align === 'center' ? x : o.align === 'right' ? x - m / 2 : x + m / 2, cy = y - (o.size || 24) * .35;
    g.save(); g.globalAlpha *= clamp((T - t0) / .12); g.translate(cx, cy); g.scale(sp, sp); g.translate(-cx, -cy); txt(s, x, y, o); g.restore(); }
  // odometer: digits roll up into place, other glyphs rise in
  function roll(str, x, y, t0, o) { const fo = Object.assign({ f: SANS, w: 800, size: 200, col: C.white }, o, { align: 'left' }), sz = fo.size, lh = sz * 1.0;
    const full = measure(str, fo), X = o.align === 'center' ? x - full / 2 : x; if (T < t0) return; ev('roll', t0, { n: str.length });
    for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch === ' ') continue; const cx = X + measure(str.slice(0, i), fo), cw = measure(ch, fo), p = k(T, t0 + i * .07, 1.0, E.out); if (p <= 0) continue;
      g.save(); g.beginPath(); g.rect(cx - 6, y - sz * .86, cw + 12, sz * 1.08); g.clip(); if (o.glow) { g.shadowColor = 'rgba(59,123,255,.8)'; g.shadowBlur = 50; }
      if (/\d/.test(ch)) { const steps = 7 + i * 3, pos = p * steps, c0 = Math.floor(pos), fr = pos - c0, d0 = ((+ch - steps + c0) % 10 + 10) % 10;
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
      const s = Math.max(0, spring(t0 + i * .08, 1.4, 6)); if (s <= 0) continue; const x = x0 + 26 * Math.sin(t * sp + ph), y = y0 + 20 * Math.cos(t * sp * .8 + ph);
      const gr = g.createRadialGradient(x - rad * .35, y - rad * .35, rad * .1, x, y, rad); gr.addColorStop(0, '#5B90F5'); gr.addColorStop(1, '#1A4AA6'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * s, 0, 7); g.fill(); } }
  function dust(t, n = 40) { const r = rng(1000 + Math.floor(t * 12)); g.save(); g.fillStyle = 'rgba(200,215,255,.35)'; for (let i = 0; i < n; i++) { g.globalAlpha = .2 + r() * .5; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); } g.restore(); }
  function heartPath(x, y, s) { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x, y - s * .2, x - s * .9, y - s * .2, x - s * .5, y + s * .35); g.lineTo(x, y + s * .9); g.lineTo(x + s * .5, y + s * .35); g.bezierCurveTo(x + s * .9, y - s * .2, x, y - s * .2, x, y + s * .3); g.closePath(); }
  function hearts(x, y, t0) { const d = T - t0; if (d < 0 || d > 1.1) return; ev('likes', t0); const r = rng(55); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (r() - .5) * 2.2, v = 120 + r() * 140, q = E.out(clamp(d / 1.1));
      g.save(); g.globalAlpha = (1 - clamp(d / 1.1)) * .95; g.fillStyle = i % 3 ? '#FF3B4E' : '#FF7A8A'; heartPath(x + Math.cos(a) * v * q, y + Math.sin(a) * v * q - 40 * q, 14 + r() * 12); g.fill(); g.restore(); } }
  function slam(s, x, y, t0, o) { const p = clamp((T - t0) / .3); if (p <= 0) return; ev('slam', t0); const sc = (1 + .75 * (1 - E.out(p))) * (1 + .02 * k(T, t0 + .3, 3, E.soft));
    g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha *= clamp(p * 4); if (p < 1) g.filter = `blur(${(20 * (1 - p)).toFixed(1)}px)`; g.shadowColor = 'rgba(110,160,255,.55)'; g.shadowBlur = 70; txt(s, 0, 0, Object.assign({ align: 'center' }, o)); g.restore(); }

  // ------------------------------------------------------------------ backgrounds
  function bgPaper(t, ga = 1) {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const cx = 960 + 20 * Math.sin(t * .2), cy = 520;
    g.save(); g.globalAlpha = ga; g.strokeStyle = 'rgba(11,26,51,.07)'; g.lineWidth = 1; g.beginPath();
    for (let x = cx - 900; x <= cx + 900; x += 46) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = cy - 600; y <= cy + 600; y += 46) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); g.globalAlpha = 1;
    const m = g.createRadialGradient(cx, cy, 200, cx, cy, 900); m.addColorStop(0, 'rgba(237,240,245,0)'); m.addColorStop(1, 'rgba(237,240,245,1)'); g.fillStyle = m; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.strokeStyle = 'rgba(11,26,51,.35)'; g.lineWidth = 1.5; g.globalAlpha = ga; g.beginPath(); g.arc(-200, 1300, 1300 + 6 * Math.sin(t * .3), -1.25, -.45); g.stroke(); g.beginPath(); g.arc(2300, -400, 980, 1.9, 2.75); g.stroke(); g.restore();
  }
  function bgNavy(t, glow = [1300, 380], tone = 1) {
    g.fillStyle = C.navy; g.fillRect(0, 0, W, H);
    const gx = glow[0] + 60 * Math.sin(t * .17), gy = glow[1] + 40 * Math.cos(t * .21);
    let gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1100); gr.addColorStop(0, `rgba(25,82,190,${.75 * tone})`); gr.addColorStop(.45, `rgba(14,48,120,${.45 * tone})`); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(200, 1100, 0, 200, 1100, 800); gr.addColorStop(0, 'rgba(20,60,150,.35)'); gr.addColorStop(1, 'rgba(6,16,31,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.strokeStyle = 'rgba(140,170,255,.18)'; g.lineWidth = 2; g.beginPath(); g.arc(-300 + 30 * Math.sin(t * .2), 1250, 1150, -1.3, -.35); g.stroke(); g.restore();
    rays(t, tone);
  }
  function bgBlack(t) {
    g.fillStyle = '#04060A'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(300, 900, 0, 300, 900, 1200); gr.addColorStop(0, 'rgba(20,60,140,.45)'); gr.addColorStop(1, 'rgba(4,6,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  // corner branches: swing in from outside the frame, then keep swaying
  function leaves(t, mode, which, t0) {
    const L = LEAF[mode]; const spots = { tl: [-260, -330, 2.6, .9, 1], br: [W - 640, H - 560, -.35, 1, 2], tr: [W - 520, -380, 3.6, .75, 3], bl: [-300, H - 520, -1.2, .8, 4] };
    which.forEach((key, j) => { const [x, y, r, s, ph] = spots[key]; const q = t0 == null ? 1 : k(t, t0 + j * .14, 1.4, E.out); if (q < 1 && t0 != null) ev('leaves', t0);
      const sx = key[1] === 'l' ? -1 : 1, sy = key[0] === 't' ? -1 : 1, sway = Math.sin(t * .7 + ph) * .05 + Math.sin(t * 1.9 + ph * 2) * .012;
      g.save(); g.translate(x + 500 * s + sx * 420 * (1 - q), y + 500 * s + sy * 320 * (1 - q)); g.rotate(r + sway + sx * sy * .9 * (1 - q)); g.scale(s, s); g.drawImage(L, -L.width / 2, -L.height / 2); g.restore(); });
  }
  function sideTexts(col, a = 1) {
    g.save(); g.globalAlpha *= a; font(SANS, 13, 600); g.letterSpacing = '3px'; g.fillStyle = col;
    g.save(); g.translate(48, 540); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('TRAZO · MOVILIDAD ELÉCTRICA · VALENCIA', 0, 0); g.restore();
    g.save(); g.translate(W - 48, 540); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillText('PRÁCTICA FINAL · RA3 · DEPARTAMENTO DE VENTAS', 0, 0); g.restore();
    g.letterSpacing = '0px'; g.restore();
  }
  function stamp(col, a = 1) { g.save(); g.globalAlpha *= a; barcode(W - 300, 64, 170, 30, col); txt('20 · NOV · 2026', W - 130, 116, { size: 14, w: 600, ls: 2, col, align: 'right' }); g.restore(); }
  const NAVY_SIDE = 'rgba(169,196,255,.45)', NAVY_STAMP = 'rgba(169,196,255,.7)';
  function navyChrome(t, t0, a = 1) { sideTexts(NAVY_SIDE, a * k(t, t0, .6)); stamp(NAVY_STAMP, a * k(t, t0 + .1, .6)); }

  // ------------------------------------------------------------------ scenes (t0, t1 in film seconds; T = global time)
  let T = 0;
  const SC = [];
  const scene = (name, t0, t1, base, draw) => SC.push({ name, t0, t1, base, draw });

  // 00 · presentado por — black title card, built letter by letter, the name slams in
  scene('Presentado por', 0, 3.25, '#04060A', (t) => {
    const [sx, sy] = shakeAt(1.25, 10); g.translate(sx, sy);
    bgBlack(t); dust(t, 30); leaves(t, 'navy', ['tl', 'br'], .05);
    sideTexts('rgba(169,196,255,.35)', k(t, .4)); stamp(NAVY_STAMP, k(t, .5));
    typeOn('PRÁCTICA FINAL · RA3 · TEMA 2', 960, 330, .2, { size: 17, w: 600, ls: 6, col: C.sky, align: 'center', cps: 44, caret: false });
    typeOn('presentado por', 960, 470, .5, { f: SERIF, size: 66, w: 600, it: true, col: C.sky, align: 'center', cps: 24 });
    const yo = { f: SANS, size: 230, w: 800, ls: 6, col: C.white }, yw = measure('YASSER', yo);
    slam('YASSER', 960, 690, 1.25, yo);
    if (t > 1.62) { const sd = Math.max(0, spring(1.62, 1.8, 7)); g.save(); g.fillStyle = C.orange; g.beginPath(); g.arc(960 + yw / 2 + 14, 672, 22 * sd, 0, 7); g.fill(); g.restore(); ev('pop', 1.62); }
    const lp = k(t, 1.45, .8, E.io); if (lp > 0) { g.save(); g.strokeStyle = 'rgba(169,196,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(960 - 440 * lp, 752); g.lineTo(960 + 440 * lp, 752); g.stroke(); g.restore(); }
    pillBar(960, 790, 1.75, 'DEPARTAMENTO DE VENTAS', { align: 'center', size: 18, stroke: 'rgba(169,196,255,.8)', col: C.sky, dash: [6, 5] });
  });

  // brand photo window (company scene): source point (775,580) of the photo sits at the window centre
  const BW = { x: 620, y: 350, w: 680, h: 500 };
  function brandAt(zoom) { const im = IMG.brandCol, f = im.width / 1600, sc = BW.w / 1100 * zoom, cx = BW.x + BW.w / 2, cy = BW.y + BW.h / 2;   // photo coords in 1600-wide units
    return { pt: (sx, sy) => [cx + (sx - 775) * sc, cy + (sy - 580) * sc], draw: img => g.drawImage(img, cx - 775 * sc, cy - 580 * sc, im.width / f * sc, im.height / f * sc) }; }
  // 01 · la empresa — paper; a cursor builds the page piece by piece
  const TZ = { f: SERIF, size: 170, w: 700, ls: 2, col: C.ink };
  scene('01 La empresa', 3.25, 9.75, C.paper, (t) => {
    bgPaper(t, k(t, 3.3, .9)); leaves(t, 'paper', ['tl', 'br'], 3.3);
    stamp(C.ink, k(t, 3.5)); sideTexts('rgba(11,26,51,.5)', k(t, 3.6));
    typeOn('PRESENTADO POR YASSER', 120, 104, 3.55, { size: 14, w: 700, ls: 4, col: 'rgba(11,26,51,.6)', cps: 40, caret: false });
    // title: TRAZO typed inside a selection box, small words spring in around it
    const tw = measure('TRAZO', TZ), x0 = 960 - tw / 2;
    selBox(x0 - 44, 140, tw + 88, 190, 3.92, 'rgba(11,26,51,.55)', C.paper);
    typeOn('TRAZO', 960, 290, 4.06, Object.assign({ align: 'center', cps: 11, caretCol: C.blue }, TZ));
    popText('la', x0 - 62, 186, 4.0, { size: 30, w: 700, col: C.ink, align: 'right' });
    popText('empresa', x0 + tw + 14, 318, 4.62, { size: 26, w: 700, col: C.blue });
    // the company photo: a rounded window wipes open (pale), the click brings it into focus, spec callouts spring out of the bike
    const gp = k(t, 4.75, .8, E.io);
    if (gp > 0) { const b = k(t, 5.2, 1.0, E.out), zoom = (1.1 - .1 * b) * (1 - .05 * k(t, 5.2, 4.5, E.soft)), P = brandAt(zoom);
      g.save(); g.shadowColor = 'rgba(11,26,51,.22)'; g.shadowBlur = 50; g.shadowOffsetY = 24; rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.fillStyle = '#DDE3EC'; g.fill(); g.restore();
      g.save(); rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.clip();
      if (b < 1) { g.globalAlpha = .85; P.draw(IMG.brandPale); }
      if (b > 0) { g.globalAlpha = b; if (b < 1) g.filter = `blur(${(12 * (1 - b)).toFixed(1)}px)`; P.draw(IMG.brandCol); g.filter = 'none'; }
      g.restore(); sweep(BW.x, BW.y, BW.w, BW.h, 6.0, 26);
      g.save(); g.globalAlpha = gp; rr(BW.x, BW.y, BW.w, BW.h * gp, 26); g.lineWidth = 1.5; g.strokeStyle = 'rgba(11,26,51,.25)'; g.stroke(); g.restore();
      pillBar(BW.x + 22, BW.y + 22, 5.55, 'NUEVA TRAZO CITY · 1.349 €', { size: 14, fill: 'rgba(244,246,250,.92)', col: C.ink });
      // callouts: anchor dot on the bike → elbow line → tag
      [[[862, 575], 'BATERÍA · 80 KM', 5.9], [[1062, 722], 'RUEDAS 20" FAT', 6.15], [[528, 716], 'MOTOR 250 W', 6.4]].forEach(([src, lab, a], i) => { const [ax, ay] = P.pt(src[0], src[1]), ty = 640 + i * 74;
        if (t < a - .4) return; const ds = Math.max(0, spring(a - .4, 1.6, 7)); ev('pop', a - .4);
        g.save(); g.fillStyle = '#fff'; g.strokeStyle = C.blue; g.lineWidth = 3; g.beginPath(); g.arc(ax, ay, 9 * ds, 0, 7); g.fill(); g.stroke();
        g.globalAlpha = .45 * (1 - ((t - a) % 1.6) / 1.6) * clamp(t - a + 1); g.beginPath(); g.arc(ax, ay, 9 + 22 * (((t - a) % 1.6 + 1.6) % 1.6) / 1.6, 0, 7); g.stroke(); g.restore();
        drawLine([[ax, ay], [ax, ty + 17], [1330, ty + 17]], a - .4, .4, 'rgba(29,91,216,.85)', 2);
        pillBar(1336, ty, a, lab, { size: 15, fill: C.ink, col: C.white }); });
    }
    // thin line drawn across the page
    { const q = k(t, 5.6, 1.4, E.io); if (q > 0) { const P = [[-60, 760], [520, 990], [1300, 330], [1990, 470]]; g.save(); g.strokeStyle = 'rgba(11,26,51,.4)'; g.lineWidth = 1.6; g.setLineDash([2600, 2600]); g.lineDashOffset = 2600 * (1 - q);
      g.beginPath(); g.moveTo(P[0][0], P[0][1]); g.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); g.stroke(); g.restore(); } }
    // navy label wipes in, serif line types
    { const lab = 'EMPRESA COMERCIAL · VALENCIA', lo = { size: 17, w: 700, ls: 3, col: C.white }, lw = measure(lab, lo) + 48, q = k(t, 5.0, .5, E.io);
      if (q > 0) { g.save(); g.fillStyle = C.ink; g.fillRect(960 - lw / 2, 880, lw * q, 42); g.beginPath(); g.rect(960 - lw / 2, 880, lw * q, 42); g.clip(); typeOn(lab, 960 - lw / 2 + 24, 907, 5.25, Object.assign({ cps: 52, caret: false }, lo)); g.restore(); } }
    typeOn('movilidad eléctrica en Valencia', 960, 990, 6.28, { f: SERIF, size: 50, w: 600, it: true, col: '#4A5872', align: 'center', cps: 30 });
    // catalogue chips, each one clicked into place
    typeOn('CATÁLOGO', 300, 398, 6.9, { size: 14, w: 700, ls: 4, col: 'rgba(11,26,51,.55)', cps: 30, caret: false });
    const chips = [['BICIS ELÉCTRICAS', 7.16], ['PATINETES', 8.02], ['ACCESORIOS', 8.3], ['TRAZO CARE', 8.5]];
    chips.forEach(([s2, a], i) => pillBar(300, 420 + i * 76, a - .08, s2, { size: 17, stroke: C.ink, col: C.ink, dash: [6, 5], tText: a + .04 }));
    brackets(1360, 440, 420, 128, C.ink, 22, k(t, 8.5, .5));
    paraWipe('Compramos a fabricantes y vendemos a quien se mueve por la ciudad: estudiantes, trabajadores y empresas de reparto.', 1380, 474, 380, 8.62, { size: 18, col: '#4A5872', lh: 26 });
    cursorPath([[3.55, 1560, 920], [3.98, 1080, 250, 1], [4.85, 1180, 640], [5.2, 1120, 600, 1], [6.6, 760, 640], [7.08, 330, 440, 1], [7.94, 330, 516, 1], [8.22, 330, 592, 1], [8.42, 330, 668, 1], [9.0, 1450, 560], [9.5, 1720, 900]], C.ink, '#fff');
  });

  // 02 · dos tipos de clientes — one persistent layout; the subject and the pill change inside it
  scene('02 Público objetivo', 9.75, 18.55, C.navy, (t) => {
    bgNavy(t, [1250, 420], .85); leaves(t, 'navy', ['tr', 'bl'], 9.8); navyChrome(t, 9.9);
    dots(t, 5, 9, 10.3);
    typeOn('Tenemos dos tipos de', 960, 135, 9.9, { f: SERIF, size: 46, w: 600, it: true, col: C.sky, align: 'center', cps: 32 });
    typeOn('CLIENTES', 960, 238, 10.86, { size: 96, w: 800, ls: 6, col: C.white, align: 'center', cps: 18 });
    const dp = k(t, 9.75, 1.0, E.out), pulse = 1 + .07 * Math.sin(clamp((t - 15.55) / .6) * Math.PI); disc(lerp(-520, 960, dp), 590, 310 * pulse);
    // type counter (left) and profile chip (right)
    typeOn('TIPO', 440, 470, 11.5, { size: 14, w: 700, ls: 4, col: C.sky, cps: 30, caret: false });
    if (t < 15.6) roll('01', 440, 556, 11.62, { size: 76, w: 800, col: C.white }); else roll('02', 440, 556, 15.62, { size: 76, w: 800, col: C.blue2 });
    pillSwap(1480, 445, [['18–40 AÑOS', 12.36], ['FLOTAS DE 5 A 50', 16.2]], 12.1, { size: 18, fill: 'rgba(6,16,31,.55)', stroke: 'rgba(169,196,255,.8)', col: C.sky });
    // A · student slides in from the right, leaves to the left
    const sIn = k(t, 11.6, .9, E.out), sOut = k(t, 15.45, .5, E.in);
    if (sIn > 0 && sOut < 1) { const draw = () => { const a = k(T, 11.6, .9, E.out), o = k(T, 15.45, .5, E.in); g.save(); g.globalAlpha *= clamp(a * 2) * (1 - o); const b = 10 * (1 - a) + 8 * o; if (b > .3) g.filter = `blur(${b.toFixed(1)}px)`; photo(IMG.studentCool, 960 + 620 * (1 - a) - 780 * o, 830, 560); g.restore(); };
      (sIn < .85 || sOut > 0) ? motion(draw, 5, .035) : draw(); }
    // B · courier
    const cIn = k(t, 15.62, .85, E.out);
    if (cIn > 0) { const draw = () => { const a = k(T, 15.62, .85, E.out); g.save(); g.globalAlpha *= clamp(a * 2); if (a < 1) g.filter = `blur(${(10 * (1 - a)).toFixed(1)}px)`; photo(IMG.courierCool, 960 + 780 * (1 - a), 830, 530); g.restore(); };
      cIn < .85 ? motion(draw, 5, .035) : draw(); }
    pillSwap(960, 852, [['ESTUDIANTES Y TRABAJADORES', 12.36], ['EMPRESAS DE REPARTO', 15.9]], 12.05, { size: 24, fill: 'rgba(6,16,31,.65)', stroke: C.white, lw: 2.5 });
    { const o = k(t, 15.4, .3, E.in); if (o < 1) { g.save(); g.globalAlpha *= 1 - o; typeOn('Estudiantes y trabajadores que se mueven por la ciudad.', 960, 958, 13.6, { size: 19, w: 400, col: C.sky, align: 'center', cps: 70, caret: false }); g.restore(); } }
    typeOn('Necesitan flotas de bicis fiables, todos los días.', 960, 958, 16.9, { size: 19, w: 400, col: C.sky, align: 'center', cps: 70, caret: false });
  });

  // 03 · cuatro funciones — the cursor picks the first one and carries it into the next scene
  const FN = ['CAPTACIÓN', 'FIDELIZACIÓN', 'ANÁLISIS', 'GESTIÓN'], FNP = { size: 20 }, TITLE = { f: SERIF, size: 92, w: 700, ls: 3, col: C.white };
  const pillW = s => measure(s, { f: SANS, w: 700, ls: 1.5, size: 20 }) + 52;
  scene('03 Funciones', 18.55, 22.0, C.navy, (t) => {
    bgNavy(t, [960, 500], .9); leaves(t, 'navy', ['tl', 'br'], 18.6); navyChrome(t, 18.7); dots(t, 9, 6, 18.9);
    const ex = k(t, 21.6, .35, E.in);
    g.save(); g.globalAlpha *= 1 - ex; if (ex > 0) g.filter = `blur(${(10 * ex).toFixed(1)}px)`; g.translate(0, -50 * ex);
    typeOn('nuestro departamento de ventas tiene', 960, 330, 18.62, { f: SERIF, size: 54, w: 600, it: true, col: C.sky, align: 'center', cps: 32 });
    const big = { size: 150, w: 800, ls: 2, col: C.white }, w4 = measure('4', big), wf = measure('FUNCIONES', big), x0 = 960 - (w4 + 40 + wf) / 2;
    if (t >= 20.44) { ev('pop', 20.44); const s4 = Math.max(0, spring(20.44, 1.6, 6.5)); g.save(); g.translate(x0 + w4 / 2, 478); g.scale(s4, s4); txt('4', 0, 52, Object.assign({}, big, { col: C.blue2, align: 'center' })); g.restore(); }
    typeOn('FUNCIONES', x0 + w4 + 40, 530, 20.82, Object.assign({ cps: 28 }, big));
    g.restore();
    FN.forEach((s, i) => { const cx = 960 + (i - 1.5) * 310, y = 610;
      if (i === 0) {
        const c = k(t, 21.62, .38, E.io);
        const drawCarry = () => { const c2 = k(T, 21.62, .38, E.io), pw = pillW(s), bw = measure(s, TITLE) + 70;
          const x = lerp(cx - pw / 2, 150, c2), y2 = lerp(y, 262, c2), w2 = lerp(pw, bw, c2), h2 = lerp(42, 128, c2), r = lerp(21, 4, c2);
          g.save(); if (T > 21.5) { rr(x, y2, w2, h2, r); g.fillStyle = `rgba(59,123,255,${(.35 * (1 - c2)).toFixed(3)})`; g.fill(); }
          rr(x, y2, w2, h2, r); g.lineWidth = 2; g.strokeStyle = c2 > 0 ? 'rgba(244,246,250,.85)' : 'rgba(169,196,255,.7)'; g.setLineDash([lerp(6, 9, c2), lerp(5, 7, c2)]); g.stroke(); g.setLineDash([]);
          g.globalAlpha *= 1 - clamp(c2 * 2.5); txt(s, x + w2 / 2, y2 + h2 / 2 + 7, { size: 20, w: 700, ls: 1.5, col: C.sky, align: 'center' }); g.restore(); };
        if (c <= 0) pillBar(cx, y, 19.3, s, { align: 'center', size: 20, stroke: 'rgba(169,196,255,.7)', col: C.sky, dash: [6, 5], tText: 20.9 });
        else motion(drawCarry, 5, .03);
      } else { const q = k(t, 21.62 + i * .03, .36, E.in); g.save(); g.globalAlpha *= 1 - q; if (q > 0) g.filter = `blur(${(12 * q).toFixed(1)}px)`; g.translate(220 * q * i, 140 * q);
        pillBar(cx, y, 19.3 + i * .12, s, { align: 'center', size: 20, stroke: 'rgba(169,196,255,.7)', col: C.sky, dash: [6, 5], tText: 20.9 + i * .1 }); g.restore(); }
    });
    cursorPath([[20.95, 1450, 990], [21.5, 960 - 465 + 30, 634, 1]], C.white, C.ink);
  });

  // function title block: italic kicker types, dashed box (carried in, or drawn), serif caps type, action pills slide + type
  function fnTitle(t, x, num, kicker, title, kt, items, o = {}) {
    const bw = measure(title, TITLE) + 70, ex = o.out ? k(T, o.out, .4, E.in) : 0; if (ex >= 1) return;
    g.save(); g.globalAlpha *= 1 - ex; if (ex > 0) { g.filter = `blur(${(10 * ex).toFixed(1)}px)`; g.translate(-140 * ex, 0); }
    typeOn(kicker, x, 230, kt, { f: SERIF, size: 40, w: 600, it: true, col: C.sky, cps: 34, caret: false });
    selBox(x, 262, bw, 128, o.carried ? -99 : kt + .05, 'rgba(244,246,250,.85)', C.navy);
    typeOn(title, x + 35, 360, kt + .2, Object.assign({ cps: 18 }, TITLE));
    popText(num, x + bw + 22, 292, kt + .6, { size: 24, w: 800, col: C.blue2 });
    items.forEach(([s, a, sub], i) => { const y = 450 + i * 120; pillBar(x, y, a - .12, s, { size: 20, fill: 'rgba(6,16,31,.5)', stroke: 'rgba(244,246,250,.8)', col: C.white, lw: 2 });
      typeOn(sub, x + 4, y + 76, a + .3, { size: 18, w: 400, col: C.sky, cps: 60, caret: false }); });
    g.restore();
  }

  // 04 · captación — the social card tumbles in in 3D, gets liked, leaves edge-on
  function cardXf(t) { const p = k(t, 22.1, 1.3, E.out), ex = k(t, 28.3, .5, E.in);
    return { p, ex, rot: lerp(-2.75, -.38, p) + .05 * Math.sin(t * .5) * p - (Math.PI / 2 - .38) * ex, cx: lerp(700, 1380, p) + 50 * ex, cy: lerp(1300, 560, p) + 8 * Math.sin(t * .8), zr: lerp(-.7, 0, p) + .025 * Math.sin(t * .6), sc: lerp(.5, .95, p) }; }
  function cardPoint(t, lx, ly) { const X = cardXf(t), w = IMG.card.width, h = IMG.card.height, Xl = (lx - w / 2) * X.sc, Yl = (ly - h / 2) * X.sc, pz = 1800 / (1800 + Xl * Math.sin(X.rot));
    const x = Xl * Math.cos(X.rot) * pz, y = Yl * pz; return [X.cx + x * Math.cos(X.zr) - y * Math.sin(X.zr), X.cy + x * Math.sin(X.zr) + y * Math.cos(X.zr)]; }
  scene('04 Captación', 22.0, 28.8, C.navy, (t) => {
    bgNavy(t, [1350, 420]); leaves(t, 'navy', ['tr', 'bl'], 22.0); navyChrome(t, 22.1); dots(t, 13, 6, 22.6, [1000, 160, 1780, 940]);
    fnTitle(t, 150, '01', 'Primero, conseguir clientes:', 'CAPTACIÓN', 22.04, [['PRUEBAS GRATIS EN LOS CAMPUS', 23.18, 'UPV · UV · Florida Universitària'], ['CAMPAÑAS EN REDES SOCIALES', 24.92, 'Instagram y TikTok con rutas reales'], ['ACUERDOS CON EMPRESAS DE REPARTO', 26.58, 'Flotas de 5 a 50 bicicletas']], { carried: true, out: 28.4 });
    const X = cardXf(t); if (X.p <= 0) return; ev('tumble', 22.1);
    disc(1380, 560, 380, .8 * E.out(k(t, 22.7, .8)) * (1 - X.ex));
    const draw = () => { const Y = cardXf(T); g.save(); g.globalAlpha *= clamp(Y.p * 3); g.translate(Y.cx, Y.cy); g.rotate(Y.zr); tiltCard(IMG.card, 0, 0, Y.rot, Y.sc); g.restore(); };
    (X.p < .92 || (X.ex > 0 && X.ex < 1)) ? motion(draw, 5, .028) : draw();
    const hp = cardPoint(26.3, 64, 578); hearts(hp[0], hp[1], 26.32);
    cursorPath([[25.3, 1760, 1010], [26.3, hp[0] + 2, hp[1] + 6, 1], [27.3, 1820, 1000]], C.white, C.ink, 1.3);
  });

  // 05 · fidelización — the glass panel flips in from the card's edge; reviews stack and shuffle
  scene('05 Fidelización', 28.8, 35.55, C.navy, (t) => {
    bgNavy(t, [1300, 520]); leaves(t, 'navy', ['tl', 'br'], 28.85); navyChrome(t, 28.9); dots(t, 17, 5, 29.4, [160, 760, 900, 960]);
    fnTitle(t, 150, '02', 'Después, que vuelvan:', 'FIDELIZACIÓN', 28.86, [['PLAN DE MANTENIMIENTO TRAZO CARE', 30.3, 'Puesta a punto y seguro antirrobo'], ['REVISIÓN GRATIS A LOS 6 MESES', 32.0, 'Cita directa desde la app'], ['APP CON PUNTOS POR KILÓMETRO', 33.98, 'Canjeables en accesorios']]);
    const f = k(t, 28.8, .75, E.out); if (f <= 0) return; ev('flip', 28.8);
    const gx = 1080, gy = 300 + 6 * Math.sin(t * .7);
    g.save(); g.translate(gx + 350, gy + 280); g.transform(Math.max(.01, f), -(1 - f) * .22, 0, 1, 0, 0); g.translate(-gx - 350, -gy - 280);
    glass(gx, gy, 700, 560, 30); sweep(gx, gy, 700, 560, 29.5, 30);
    typeOn('Opiniones de clientes', gx + 40, gy + 66, 29.3, { f: SERIF, size: 34, w: 600, it: true, col: C.white, cps: 36 });
    for (let i = 0; i < 5; i++) { const q = Math.max(0, spring(29.7 + i * .08, 1.6, 7)); g.fillStyle = i < 4 ? C.blue2 : 'rgba(59,123,255,.45)'; star(gx + 520 + i * 32, gy + 56, 11 * q); }
    const R = [['MR', '#3D6BD1', 'Marcos R.', 'Repartidor', 'Con TRAZO Care la flota no ha parado ni un día.', 30.6], ['LG', '#FF5A1F', 'Laura G.', 'Estudiante, 21', 'La revisión de los 6 meses fue gratis y en 20 minutos.', 32.2], ['JM', '#2C9A6B', 'Javier M.', 'Trabaja en el centro', 'Con los puntos de la app me llevé el casco gratis.', 34.3]];
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
  });

  // 06 · análisis — glass dashboard rises (carried by the push), numbers roll, bars spring, the cursor inspects
  function star(cx, cy, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
  scene('06 Análisis', 35.55, 41.1, C.navy, (t) => {
    bgNavy(t, [1250, 380]); leaves(t, 'navy', ['tr', 'bl']); navyChrome(t, 35.3);
    fnTitle(t, 150, '03', 'Para decidir con datos:', 'ANÁLISIS', 35.64, [['ENCUESTAS POST-VENTA', 37.16, 'Después de cada compra'], ['ESTUDIO DE LA COMPETENCIA', 38.18, 'Precios, cuotas y servicio'], ['VENTAS POR ZONA EN EL CRM', 39.76, 'Qué barrio compra qué']]);
    const gx = 1060, gy = 260 + 6 * Math.sin(t * .6);
    glass(gx, gy, 720, 600, 30); sweep(gx, gy, 720, 600, 36.4, 30);
    typeOn('MERCADO', gx + 40, gy + 60, 35.9, { size: 16, w: 700, ls: 3, col: C.sky, cps: 30, caret: false });
    typeOn('Satisfacción', gx + 40, gy + 120, 36.9, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    roll('4,6', gx + 40, gy + 210, 37.16, { size: 96, w: 800, col: C.white, glow: true }); if (t > 37.5) txt('/5', gx + 52 + measure('4,6', { size: 96, w: 800 }), gy + 210, { size: 40, w: 500, col: C.mute });
    for (let i = 0; i < 5; i++) { const q = Math.max(0, spring(37.4 + i * .1, 1.6, 7)); g.fillStyle = i < 4 ? C.blue2 : 'rgba(59,123,255,.45)'; star(gx + 300 + i * 46, gy + 178, 17 * q); }
    typeOn('Cuota de mercado', gx + 40, gy + 290, 38.0, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    [['TRAZO', 18, C.blue2], ['Competidor A', 34, 'rgba(169,196,255,.4)'], ['Competidor B', 22, 'rgba(169,196,255,.4)']].forEach(([n, v, col], i) => { const a = 38.18 + i * .12, s = Math.max(0, spring(a, 1.2, 6)); if (t < a) return; const y = gy + 330 + i * 46;
      txt(n, gx + 40, y + 18, { size: 18, w: 500, col: C.white }); rr(gx + 220, y, Math.max(1, 380 * v / 34 * s), 22, 11); g.fillStyle = col; g.fill(); roll(v + ' %', gx + 630, y + 18, a, { size: 18, w: 700, col: C.white }); });
    typeOn('Ventas por zona', gx + 40, gy + 500, 39.6, { size: 20, w: 500, col: C.sky, cps: 40, caret: false });
    [['Ruzafa', 38], ['Benimaclet', 29], ['Centro', 21], ['Campanar', 16], ['Online', 32]].forEach(([n, v], i) => { const x = gx + 260 + i * 88, h = v * 2.2 * Math.max(0, spring(39.76 + i * .08, 1.2, 6)); if (h <= 0) return;
      rr(x, gy + 560 - h, 54, h, 6); g.fillStyle = i === 0 ? C.blue2 : 'rgba(169,196,255,.45)'; g.fill(); txt(n, x + 27, gy + 584, { size: 13, w: 500, col: C.sky, align: 'center' }); });
    pillBar(gx + 322, gy + 452, 40.5, 'RUZAFA · 38 VENTAS', { size: 14, fill: C.white, col: C.ink });
    cursorPath([[39.95, 1760, 1000], [40.42, gx + 300, gy + 500, 1], [41.4, 1800, 1000]], C.white, C.ink);
  });

  // 07 · gestión — documents fan out of one stack, a status pill swaps, the warranty stamp slams (and shakes the frame)
  scene('07 Gestión', 41.1, 46.4, C.navy, (t) => {
    const [sx, sy] = shakeAt(45.75, 12); g.translate(sx, sy);
    bgNavy(t, [1300, 480]); leaves(t, 'navy', ['tl', 'br']); navyChrome(t, 40.9);
    fnTitle(t, 150, '04', 'Y que todo funcione:', 'GESTIÓN', 41.16, [['PEDIDOS Y FACTURAS EN EL CRM', 42.82, 'Del pedido a la factura, sin papel'], ['FINANCIACIÓN', 44.34, 'Hasta 12 meses sin intereses'], ['GARANTÍAS Y DEVOLUCIONES', 45.3, '2 años de garantía']]);
    { const q = k(t, 41.2, .8); g.save(); g.globalAlpha = q * .55; g.translate(1450, 540 + (1 - q) * 40); g.rotate(4 * Math.PI / 180); glass(-300, -260, 600, 520, 26); txt('CRM · TRAZO', -260, -200, { size: 15, w: 700, ls: 4, col: C.sky }); g.restore(); }
    pillSwap(1450, 196, [['PEDIDO RECIBIDO', 42.82], ['FACTURA EMITIDA', 43.58], ['FINANCIACIÓN 0 %', 44.34], ['GARANTÍA 2 AÑOS', 45.3]], 42.55, { size: 18, fill: 'rgba(59,123,255,.25)', stroke: C.blue2, col: C.white });
    const D = [['PEDIDO #0412', 'TRAZO City · M', '1.349 €', 42.82, -6], ['FACTURA F-2026-0412', 'Base 1.114,88 € + IVA 21 %', '1.349 €', 43.58, 3], ['FINANCIACIÓN', '12 meses · 0 % TIN', '112,42 €/mes', 44.34, -2]];
    D.forEach(([h, s, v, a, rot], i) => { const sp = spring(a - .1, 1.3, 6.5); if (sp <= 0) return; ev('card', a - .1);
      g.save(); g.globalAlpha = clamp((t - a + .1) / .2); g.translate(lerp(1480, 1420 + i * 30, sp), lerp(720, 380 + i * 150, sp) + 4 * Math.sin(t * .8 + i)); g.rotate(lerp(14, rot, sp) * Math.PI / 180);
      glass(-300, -80, 600, 170, 24); txt(h, -260, -26, { size: 16, w: 700, ls: 3, col: C.sky }); txt(s, -260, 14, { size: 24, w: 600, col: C.white }); txt(v, 260, 60, { size: 40, w: 800, col: C.white, align: 'right' }); g.restore(); });
    const st = clamp((t - 45.55) / .2); if (st > 0) { ev('slam', 45.55); g.save(); g.translate(1730, 890); g.rotate(-.2); const z = lerp(2.6, 1, E.in(st)); g.scale(z, z); g.globalAlpha = st;
      g.beginPath(); g.arc(0, 0, 100, 0, 7); g.lineWidth = 6; g.strokeStyle = C.blue2; g.stroke(); txt('2', 0, 22, { size: 84, w: 800, col: C.blue2, align: 'center' }); txt('AÑOS DE GARANTÍA', 0, 56, { size: 13, w: 800, ls: 2, col: C.blue2, align: 'center' }); g.restore(); }
  });

  // 08 · SMART — headline builds, then shrinks to the top; the three objectives slide through one glass card slot
  const OB = [['01', '+20 %', 'DE VENTAS ONLINE', 'ANTES DEL 31/12/2027', 49.24], ['02', '15', 'NUEVOS CLIENTES EMPRESA', 'ANTES DEL 30/06/2027', 54.22], ['03', '4,6/5', 'DE SATISFACCIÓN', 'DURANTE 2027', 57.54]];
  scene('08 Objetivos SMART', 46.4, 60.95, C.navy, (t) => {
    bgNavy(t, [960, 520], 1.05); leaves(t, 'navy', ['tr', 'bl'], 46.45); navyChrome(t, 46.5); dots(t, 29, 7, 46.9);
    const q = k(t, 48.9, .75, E.io); ev('shrink', 48.9);
    g.save(); g.translate(0, -310 * q); g.translate(960, 470); g.scale(1 - .5 * q, 1 - .5 * q); g.translate(-960, -470);
    typeOn('Nos marcamos tres', 960, 400, 46.48, { f: SERIF, size: 60, w: 600, it: true, col: C.sky, align: 'center', cps: 30 });
    const ho = { size: 140, w: 800, ls: 2, col: C.white }, tot = measure('OBJETIVOS SMART', ho), x0 = 960 - tot / 2;
    typeOn('OBJETIVOS', x0, 560, 47.56, Object.assign({ cps: 26, caret: false }, ho)); typeOn('SMART', x0 + measure('OBJETIVOS ', ho), 560, 48.16, Object.assign({}, ho, { col: C.blue2, cps: 16 }));
    g.globalAlpha *= 1 - k(t, 48.85, .35, E.in);
    ['S · Específico', 'M · Medible', 'A · Alcanzable', 'R · Relevante', 'T · Temporal'].forEach((s, i) => popText(s, 960 + (i - 2) * 250, 660, 48.3 + i * .08, { f: SERIF, size: 30, w: 600, it: true, col: C.sky, align: 'center' }));
    g.restore();
    OB.forEach(([n, big, lab, when, a], i) => { const inT = a - .3, outT = OB[i + 1] ? OB[i + 1][4] - .3 : 99; if (t < inT || t > outT + .5) return; ev('card', inT);
      const draw = () => { const sp = spring(inT, 1.1, 6.5), o = k(T, outT, .45, E.in), cx = 960 + 1400 * (1 - sp) - 1400 * o;
        g.save(); g.globalAlpha *= clamp((T - inT) / .15) * (1 - o * .7); const bl = 14 * o + 10 * clamp(1 - (T - inT) / .45); if (bl > .4) g.filter = `blur(${bl.toFixed(1)}px)`;
        glass(cx - 560, 300, 1120, 470, 32); sweep(cx - 560, 300, 1120, 470, a + .2, 32);
        typeOn('OBJETIVO ' + n, cx, 362, a - .1, { size: 18, w: 700, ls: 6, col: C.sky, align: 'center', cps: 40, caret: false });
        roll(big, cx, 575, a, { size: 200, w: 800, col: C.white, align: 'center', glow: true });
        typeOn(lab, cx, 668, a + .45, { f: SERIF, size: 50, w: 700, ls: 4, col: C.white, align: 'center', cps: 30 });
        pillBar(cx, 696, a + .9, when, { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] }); g.restore(); };
      draw(); });
    // progress dots
    const act = t < 54.0 ? 0 : t < 57.3 ? 1 : 2, dq = k(t, 48.95, .5);
    if (dq > 0) { g.save(); g.globalAlpha = dq; let x = 960 - 60; for (let i = 0; i < 3; i++) { const on = i === act ? 1 : 0, w = 14 + 30 * on; rr(x, 812, w, 14, 7); g.fillStyle = on ? C.blue2 : 'rgba(169,196,255,.35)'; g.fill(); x += w + 14; } g.restore(); }
  });

  // 09 · supervisión — headline lifts away, three glass cards drop in, the cursor ticks each one
  // the blue tick of the last card becomes the stage of the next scene
  const TICK0 = (() => { const a = 2.2 * Math.PI / 180, cx = 1410, cy = 610, dx = 1550 - cx, dy = 482 - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; })();
  function carryDisc() { const c = k(T, 67.95, .6, E.io); if (T < 67.95) return; ev('carry', 67.95);
    const draw = () => { const q = k(T, 67.95, .6, E.io), x = lerp(TICK0[0], 960, q), y = lerp(TICK0[1], 690, q) - 140 * Math.sin(Math.PI * q), r = lerp(20, 270, q);
      g.save(); g.globalAlpha *= 1 - q; g.fillStyle = C.blue2; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); disc(x, y, r, q);
      if (q < .4) { g.save(); g.globalAlpha *= 1 - q / .4; g.strokeStyle = '#fff'; g.lineWidth = 4 * r / 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 9 * r / 20, y); g.lineTo(x - 2 * r / 20, y + 8 * r / 20); g.lineTo(x + 10 * r / 20, y - 8 * r / 20); g.stroke(); g.restore(); }
      const b = Math.sin(Math.PI * q); if (b > .01) { g.save(); g.globalAlpha *= .7 * b; g.strokeStyle = 'rgba(170,200,255,.9)'; g.lineWidth = 3; g.shadowColor = 'rgba(90,150,255,1)'; g.shadowBlur = 40; g.beginPath(); g.arc(x, y, r * 1.08, 0, 7); g.stroke(); g.restore(); } };
    c < 1 ? motion(draw, 5, .03) : draw(); }
  scene('09 Supervisión', 60.95, 68.4, C.navy, (t) => {
    const ex = k(t, 67.85, .5, E.in);
    bgNavy(t, [1000, 380]); if (ex > 0) { g.fillStyle = `rgba(4,6,10,${(.98 * ex).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }
    leaves(t, 'navy', ['tl', 'br'], 61.0); navyChrome(t, 61.0, 1 - ex);
    const up = k(t, 62.3, .8, E.io); ev('shrink', 62.3);
    g.save(); g.globalAlpha *= 1 - ex; g.translate(0, -230 * up - 140 * ex); const sc = 1 - .35 * up; g.translate(960, 470); g.scale(sc, sc); g.translate(-960, -470);
    typeOn('¿Cómo lo', 960, 380, 61.02, { f: SERIF, size: 70, w: 600, it: true, col: C.sky, align: 'center', cps: 22 });
    typeOn('CONTROLAMOS?', 960, 540, 61.48, { size: 150, w: 800, ls: 2, col: C.white, align: 'center', cps: 24 }); g.restore();
    const CARDS = [['CADA LUNES', 'Reunión semanal', '15 minutos · objetivos de la semana', 62.58, 'cal'], ['EN TIEMPO REAL', 'Panel de KPIs', 'CRM · ventas, conversión, ticket medio', 64.16, 'kpi'], ['UNA VEZ AL MES', 'Revisión individual', 'Jefe/a de ventas + vendedor', 66.24, 'one']];
    CARDS.forEach(([kk, h, s, a, ic], i) => { const sp = spring(a - .15, 1.2, 6); if (sp <= 0) return; ev('card', a - .15); const x = 270 + i * 470, y = 420 - 300 * (1 - sp) + 5 * Math.sin(t * .8 + i);
      g.save(); g.globalAlpha = clamp((t - a + .15) / .2) * (1 - ex); if (ex > 0) g.filter = `blur(${(12 * ex).toFixed(1)}px)`; const rot = ((i - 1) * 2.2 + 9 * (1 - sp) + (i - 1) * 14 * ex) * Math.PI / 180; g.translate(x + 200, y + 190 + 380 * ex * ex); g.scale(1 - .15 * ex, 1 - .15 * ex); g.rotate(rot); g.translate(-x - 200, -y - 190);
      glass(x, y, 400, 380, 26);
      { const pq = k(t, a - .05, .8, E.out), im = IMG[['supMeeting', 'supKpi', 'supOne'][i]], zz = (1.18 - .18 * pq) * (1 + .04 * k(t, a, 6, E.soft)), iw = 372 * zz, ih = iw * im.height / im.width;
        g.save(); rr(x + 14, y + 14, 372, 152, 18); g.clip(); g.globalAlpha *= pq; g.drawImage(im, x + 200 - iw / 2, y + 90 - ih / 2, iw, ih);
        const gr = g.createLinearGradient(0, y + 60, 0, y + 166); gr.addColorStop(0, 'rgba(6,16,31,0)'); gr.addColorStop(1, 'rgba(6,16,31,.75)'); g.fillStyle = gr; g.fillRect(x + 14, y + 14, 372, 152); g.restore(); }
      sweep(x, y, 400, 380, a + .4, 26);
      g.save(); g.translate(x + 28, y + 132); g.scale(.62, .62); icon(ic, 0, 0, k(t, a, .8)); g.restore();
      txt(kk, x + 40, y + 222, { size: 15, w: 700, ls: 3, col: C.blue2 }); typeOn(h, x + 40, y + 272, a + .1, { f: SERIF, size: 44, w: 700, col: C.white, cps: 30, caret: false });
      paraWipe(s, x + 40, y + 312, 330, a + .5, { size: 18, col: C.sky, lh: 24 });
      // checkbox, ticked by the cursor
      const cx = x + 340, cy = y + 62, ck = k(t, a + .62, .35, E.out); g.fillStyle = 'rgba(6,16,31,.6)'; g.beginPath(); g.arc(cx, cy, 23, 0, 7); g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(169,196,255,.6)'; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.stroke();
      if (ck > 0 && !(i === 2 && t >= 67.95)) { g.fillStyle = C.blue2; g.beginPath(); g.arc(cx, cy, 20 * Math.max(0, spring(a + .62, 1.6, 7)), 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.setLineDash([40, 40]); g.lineDashOffset = 40 * (1 - ck);
        g.beginPath(); g.moveTo(cx - 9, cy); g.lineTo(cx - 2, cy + 8); g.lineTo(cx + 10, cy - 8); g.stroke(); g.setLineDash([]); }
      g.restore(); });
    cursorPath([[62.85, 1500, 1060], [63.2, 610, 482, 1], [64.78, 1080, 482, 1], [66.86, 1550, 482, 1], [67.7, 1720, 1050]], C.white, C.ink);
    carryDisc();
  });
  function icon(kind, x, y, p) { g.save(); g.strokeStyle = C.white; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.arc(x + 44, y + 44, 44 * (.6 + .4 * p), 0, 7); g.fillStyle = 'rgba(59,123,255,.25)'; g.fill();
    g.setLineDash([200, 200]); g.lineDashOffset = 200 * (1 - p); g.beginPath();
    if (kind === 'cal') { g.rect(x + 22, y + 26, 44, 40); g.moveTo(x + 22, y + 38); g.lineTo(x + 66, y + 38); g.moveTo(x + 32, y + 20); g.lineTo(x + 32, y + 30); g.moveTo(x + 56, y + 20); g.lineTo(x + 56, y + 30); }
    if (kind === 'kpi') { g.moveTo(x + 20, y + 62); g.lineTo(x + 36, y + 44); g.lineTo(x + 48, y + 54); g.lineTo(x + 68, y + 28); g.moveTo(x + 56, y + 28); g.lineTo(x + 68, y + 28); g.lineTo(x + 68, y + 40); }
    if (kind === 'one') { g.arc(x + 32, y + 36, 9, 0, 7); g.moveTo(x + 65, y + 36); g.arc(x + 56, y + 36, 9, 0, 7); g.moveTo(x + 18, y + 66); g.quadraticCurveTo(x + 32, y + 48, x + 46, y + 66); g.moveTo(x + 42, y + 66); g.quadraticCurveTo(x + 56, y + 48, x + 70, y + 66); }
    g.stroke(); g.setLineDash([]); g.restore(); }

  // 10 · motivación — black; the cyclist resolves on a rising disc; ONE pill swaps through the three incentives
  scene('10 Motivación', 68.4, 73.3, '#04060A', (t) => {
    bgBlack(t); dust(t, 24); leaves(t, 'navy', ['tr'], 68.5); sideTexts('rgba(169,196,255,.35)', k(t, 68.6)); dots(t, 21, 7, 69.3);
    typeOn('Y para', 960, 190, 68.5, { f: SERIF, size: 54, w: 600, it: true, col: C.sky, align: 'center', cps: 20 });
    typeOn('MOTIVAR AL EQUIPO', 960, 300, 68.92, { size: 104, w: 800, ls: 2, col: C.white, align: 'center', cps: 26 });
    if (t < 68.55) carryDisc(); else disc(960, 690, 270 * (1 + .015 * Math.sin(t * 2)));
    ghost(IMG.cyclistCool, 960, 905, 400, 68.62, { dx: -60 });
    typeOn('INCENTIVO', 470, 640, 69.9, { size: 14, w: 700, ls: 4, col: C.sky, cps: 30, caret: false });
    roll(t < 71.24 ? '01' : t < 72.02 ? '02' : '03', 470, 724, t < 71.24 ? 70.14 : t < 72.02 ? 71.24 : 72.02, { size: 76, w: 800, col: C.white });
    pillSwap(960, 935, [['COMISIÓN DEL 3 %', 70.14], ['BONUS TRIMESTRAL', 71.24], ['VENDEDOR DEL MES', 72.02]], 69.85, { size: 28, fill: C.white, col: C.ink });
  });

  // 11 · factores — Valencia in an arch; internal vs external cards slide in from their own side
  const nodeW = (h, s) => Math.max(measure(h, { size: 26, w: 800 }), measure(s, { size: 15, w: 600, ls: 2 })) + 70;
  scene('11 Factores', 73.3, 81.65, C.navy, (t) => {
    bgNavy(t, [960, 480]); leaves(t, 'navy', ['tl', 'br'], 73.35); navyChrome(t, 73.4);
    const m = k(t, 81.0, .65, E.io), ex = k(t, 81.0, .45, E.in);
    { const p = k(t, 73.3, 1.1), nw = nodeW('Dirección Comercial', '1 DIRECTOR/A');
      const x = lerp(700, 960 - nw / 2, m), y = lerp(230 + (1 - p) * 60, 359, m), w = lerp(520, nw, m), h = lerp(700, 92, m), rt = lerp(260, 18, m), rb = lerp(0, 18, m);
      g.save(); g.globalAlpha = p; g.beginPath(); g.roundRect(x, y, w, h, [rt, rt, rb, rb]); g.save(); g.clip();
      const s = (1.12 - .08 * k(t, 73.3, 8, E.soft)) * (1 + .3 * m), iw = IMG.valenciaCool.width, ih = IMG.valenciaCool.height, sc = Math.max(w / iw, h / ih) * s; g.drawImage(IMG.valenciaCool, x + w / 2 - iw * sc / 2, y + h / 2 - ih * sc / 2, iw * sc, ih * sc);
      if (m > 0) { g.fillStyle = `rgba(244,246,250,${m.toFixed(3)})`; g.fillRect(x, y, w, h); } g.restore();
      g.lineWidth = 2; g.strokeStyle = 'rgba(190,210,255,.5)'; g.stroke(); g.restore(); }
    g.save(); g.globalAlpha *= 1 - ex; if (ex > 0) g.filter = `blur(${(10 * ex).toFixed(1)}px)`;
    pillBar(960, 860, 79.5, 'VALENCIA · CIUDAD PERFECTA PARA LA BICI', { align: 'center', size: 20, fill: C.white, col: C.ink });
    typeOn('INTERNOS', 420, 260, 73.45, { f: SERIF, size: 64, w: 700, col: C.white, align: 'center', ls: 3, cps: 16 });
    typeOn('EXTERNOS', 1500, 260, 76.9, { f: SERIF, size: 64, w: 700, col: C.blue2, align: 'center', ls: 3, cps: 16 });
    const F = [[420, 74.02, 'EMPRESA PEQUEÑA', '12 personas en total'], [420, 75.4, 'PRODUCTO QUE HAY QUE PROBAR', 'la demostración vende'], [1500, 77.86, 'PARTICULARES Y EMPRESAS', 'dos formas de comprar'], [1500, 79.62, 'UBICACIÓN: VALENCIA', 'llana y con carril bici']];
    let li = 0, ri = 0;
    F.forEach(([x, a, h, s]) => { const i = x < 960 ? li++ : ri++, dir = x < 960 ? -1 : 1; if (t < a - .15) return; ev('card', a - .15);
      const draw = () => { const sp = spring(a - .15, 1.2, 6.5), y = 360 + i * 200 + 5 * Math.sin(T * .8 + i + x); g.save(); g.globalAlpha *= clamp((T - a + .15) / .2); g.translate(dir * 640 * (1 - sp), 0);
        glass(x - 230, y, 460, 150, 22); typeOn(h, x, y + 66, a, { size: 22, w: 800, ls: 1, col: C.white, align: 'center', cps: 40, caret: false }); typeOn(s, x, y + 106, a + .3, { f: SERIF, size: 28, w: 600, it: true, col: C.sky, align: 'center', cps: 40, caret: false }); g.restore(); };
      t < a + .35 ? motion(draw, 5, .03) : draw(); });
    g.restore();
  });

  // 12 · organigrama — the Valencia arch has become the top node; titles type, lines draw with a riding light
  scene('12 Organigrama', 81.65, 89.55, C.navy, (t) => {
    const c = k(t, 89.05, .5, E.in);
    bgNavy(t, [960, 300]); leaves(t, 'navy', ['tr', 'bl'], 81.7); navyChrome(t, 81.8, 1 - c); if (c > 0) { g.fillStyle = `rgba(4,6,10,${c.toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); }
    g.save(); g.translate(960, 560); g.scale(1 - .96 * c, 1 - .96 * c); g.translate(-960, -560); g.globalAlpha *= 1 - c * .6; if (c > 0) g.filter = `blur(${(14 * c).toFixed(1)}px)`;
    typeOn('Por eso elegimos una', 960, 140, 81.72, { f: SERIF, size: 44, w: 600, it: true, col: C.sky, align: 'center', cps: 30 });
    const ho = { size: 92, w: 800, ls: 3, col: C.white }, tw = measure('ESTRUCTURA MIXTA', ho), x0 = 960 - tw / 2;
    typeOn('ESTRUCTURA', x0, 240, 83.0, Object.assign({ cps: 26, caret: false }, ho)); typeOn('MIXTA', x0 + measure('ESTRUCTURA ', ho), 240, 83.5, Object.assign({}, ho, { col: C.blue2, cps: 18 }));
    pillBar(790, 276, 84.1, 'POR CLIENTE', { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] }); pillBar(1130, 276, 85.05, 'POR CANAL', { align: 'center', size: 18, stroke: C.sky, col: C.sky, dash: [6, 5] });
    const L = 'rgba(169,196,255,.7)';
    drawLine([[960, 451], [960, 520], [420, 520], [420, 590]], 85.9, .8, L); drawLine([[960, 520], [960, 590]], 87.3, .5, L); drawLine([[960, 520], [1500, 520], [1500, 590]], 88.4, .6, L);
    drawLine([[420, 682], [420, 720], [270, 720], [270, 770]], 86.6, .6, L); drawLine([[420, 720], [580, 720], [580, 770]], 86.7, .6, L); drawLine([[960, 682], [960, 770]], 87.9, .5, L);
    const node = (x, y, h, s, a, top) => { const w = nodeW(h, s);
      if (top) { rr(x - w / 2, y - 46, w, 92, 18); g.fillStyle = C.white; g.fill(); typeOn(h, x, y + 2, a, { size: 26, w: 800, col: C.ink, align: 'center', cps: 34, caret: false }); typeOn(s, x, y + 30, a + .4, { size: 15, w: 600, ls: 2, col: '#4A5872', align: 'center', cps: 40, caret: false }); return; }
      const sp = spring(a - .05, 1.5, 7); if (sp <= 0) return; ev('card', a - .05); g.save(); g.globalAlpha *= clamp((t - a + .05) / .15); g.translate(x, y); g.scale(Math.max(0, sp), Math.max(0, sp)); g.translate(-x, -y);
      glass(x - w / 2, y - 46, w, 92, 18); typeOn(h, x, y + 2, a + .08, { size: 26, w: 700, col: C.white, align: 'center', cps: 36, caret: false }); typeOn(s, x, y + 30, a + .35, { size: 15, w: 600, ls: 2, col: C.sky, align: 'center', cps: 44, caret: false }); g.restore(); };
    node(960, 405, 'Dirección Comercial', '1 DIRECTOR/A', 81.95, true);
    node(420, 636, 'Ventas Particulares', 'CLIENTE · PARTICULAR', 86.08); node(960, 636, 'Ventas Empresas', 'CLIENTE · EMPRESA', 87.48); node(1500, 636, 'Administración', 'Y ANÁLISIS · 2', 88.64);
    node(270, 816, 'Tienda Ruzafa', 'CANAL · TIENDA ×3', 86.9); node(580, 816, 'Venta online', 'CANAL · ONLINE ×2', 87.0); node(960, 816, 'Cuentas clave', 'CANAL · B2B ×2', 88.1);
    g.restore();
    if (c > 0) { g.save(); g.fillStyle = '#fff'; g.shadowColor = 'rgba(140,180,255,1)'; g.shadowBlur = 40; g.beginPath(); g.arc(960, 560, 4 + 14 * c, 0, 7); g.fill(); g.restore(); }
  });

  // 13 · final — grain flash, TRAZO. slams in and settles up, the line types, GRACIAS types letter by letter
  scene('Final', 89.55, DUR, '#04060A', (t) => {
    const [sx, sy] = shakeAt(90.2, 12); g.translate(sx, sy);
    bgBlack(t); dust(t, 40); leaves(t, 'navy', ['tl', 'br'], 90.6);
    if (t < 90.1) { const pr = 18 + 4 * Math.sin((t - 89.55) * 22), fo = 1 - clamp((t - 89.94) / .16); g.save(); g.globalAlpha = fo; g.fillStyle = '#fff'; g.shadowColor = 'rgba(140,180,255,1)'; g.shadowBlur = 50; g.beginPath(); g.arc(960, 560, pr, 0, 7); g.fill(); g.restore(); }
    { const d = t - 89.94; if (d > 0 && d < .7) { const q = E.out(d / .7); g.save(); g.globalAlpha = 1 - d / .7; g.strokeStyle = 'rgba(170,200,255,.9)'; g.lineWidth = 6 * (1 - q) + 1; g.beginPath(); g.arc(960, 560, 30 + 1100 * q, 0, 7); g.stroke(); g.restore(); }
      if (d > 0 && d < .25) { g.save(); g.fillStyle = `rgba(210,225,255,${(.45 * (1 - d / .25)).toFixed(3)})`; g.fillRect(-50, -50, W + 100, H + 100); g.restore(); } }
    const p = clamp((t - 89.94) / .3);
    if (p > 0) { ev('slam', 89.94); const shrink = k(t, 90.55, .8, E.io), sc = (1 + .8 * (1 - E.out(p))) * lerp(1, .78, shrink) * (1 + .015 * k(t, 91, 5, E.soft)), y = lerp(560, 470, shrink);
      g.save(); g.translate(960, y); g.scale(sc, sc); g.globalAlpha = clamp(p * 4); if (p < 1) g.filter = `blur(${((1 - p) * 22).toFixed(1)}px)`;
      g.shadowColor = 'rgba(110,160,255,.5)'; g.shadowBlur = 80; txt('TRAZO', -40, 80, { size: 300, w: 800, col: C.white, align: 'center', ls: 6 }); g.filter = 'none'; g.shadowColor = 'transparent';
      const sd = Math.max(0, spring(90.6, 1.7, 7)); if (sd > 0) { ev('pop', 90.6); g.beginPath(); g.arc(468, 62, 30 * sd, 0, 7); g.fillStyle = C.orange; g.fill(); } g.restore(); }
    typeOn('movilidad eléctrica para Valencia', 960, 700, 90.82, { f: SERIF, size: 50, w: 600, it: true, col: C.sky, align: 'center', cps: 24 });
    typeOn('GRACIAS', 960, 880, 93.24, { size: 110, w: 800, ls: 18, col: C.white, align: 'center', cps: 12 });
    const cr = { f: SERIF, size: 26, w: 600, it: true, col: C.sky, cps: 40, caret: false };
    typeOn('Presentado por Yasser', 140, 120, 91.3, cr); typeOn('Departamento de ventas', W - 140, 120, 91.5, Object.assign({ align: 'right' }, cr));
    typeOn('Práctica final · RA3', 140, H - 90, 91.7, cr); typeOn('Valencia · 2026', W - 140, H - 90, 91.9, Object.assign({ align: 'right' }, cr));
  });

  // ------------------------------------------------------------------ social card (front + back) and its 3D projection
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
  function buildCardBack() {
    const w = 540, h = 760, c = mk(w, h), x = c.getContext('2d'); const og = g; g = x;
    rr(0, 0, w, h, 30); const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2C6BE8'); gr.addColorStop(1, '#0B1A33'); x.fillStyle = gr; x.fill();
    txt('TRAZO', w / 2 - 14, h / 2 + 30, { size: 96, w: 800, col: '#fff', align: 'center', ls: 2 }); x.beginPath(); x.arc(w / 2 + 158, h / 2 + 22, 11, 0, 7); x.fillStyle = C.orange; x.fill();
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
    // sheen, clipped to the projected card
    const [lx, lh] = at(0), [rx, rh] = at(1);
    g.save(); g.beginPath(); g.moveTo(lx, cy - lh / 2); g.lineTo(rx, cy - rh / 2); g.lineTo(rx, cy + rh / 2); g.lineTo(lx, cy + lh / 2); g.closePath(); g.clip();
    g.globalCompositeOperation = 'soft-light'; const gr = g.createLinearGradient(Math.min(lx, rx), cy - h / 2, Math.max(lx, rx), cy + h / 2); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(Math.min(lx, rx), cy - h / 2, Math.abs(rx - lx), h); g.restore();
  }

  // ------------------------------------------------------------------ composition: scene buffers + carried transitions
  // [type, half-length, extra]: push = the layout physically moves (direction, scale of the outgoing frame) with motion
  // blur; match = the next scene starts with the carried element exactly where the last one left it; disc = the hero's
  // disc grows into the next scene; flash = grain flash cut; leaf = foreground branches wipe the lens
  const CUTS = {
    3.25: ['push', .38, [0, -1, 1]], 9.75: ['push', .38, [0, -1, 1]], 18.55: ['disc', .5, [960, 590]], 22.0: ['match', .08],
    28.8: ['match', .1], 35.55: ['push', .4, [0, -1, .86]], 41.1: ['push', .32, [-1, 0, 1]], 46.4: ['flash', .22], 60.95: ['push', .38, [0, 1, 1]],
    68.4: ['match', .1], 73.3: ['disc', .5, [960, 690]], 81.65: ['match', .1], 89.55: ['match', .06],
  };
  window.VH_CUTS = CUTS;
  const LEAKS = [[1.15, 1.5, 1], [9.45, 1.3, -1], [89.9, 1.8, 1]];
  const bufA = mk(W, H), bufB = mk(W, H), bufC = mk(W, H), cA = bufA.getContext('2d'), cB = bufB.getContext('2d'), cC = bufC.getContext('2d');
  function drawScene(s, t, ctx) { const og = g; g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = s.base; g.fillRect(0, 0, W, H);   // no uncovered edge under the camera drift
    const lt = (t - s.t0) / (s.t1 - s.t0), sc = 1.006 + .025 * lt; g.translate(960, 540); g.scale(sc, sc); g.translate(-960 + 4 * Math.sin(t * .5), -540 + 3 * Math.cos(t * .4));
    s.draw(t); g = og; }
  // smear a buffer along a direction (directional motion blur), velocity in px
  function smear(ctx, buf, dx, dy, n = 10) {
    if (Math.hypot(dx, dy) < 1.5) { ctx.drawImage(buf, 0, 0); return; }
    for (let j = 0; j < n; j++) { const f = j / (n - 1) - .5; ctx.globalAlpha = 1 / (j + 1); ctx.drawImage(buf, dx * f, dy * f); }
    ctx.globalAlpha = 1;
  }
  function transition(type, A, B, t, p, ex, hl) {
    const m = main, e = E.io(clamp(p));
    drawScene(A, t, cA); drawScene(B, t, cB);
    m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
    if (type === 'push') {               // the whole layout slides off, the next one follows it in (motion blurred)
      const [dx, dy, sA] = ex, L = dx ? W : H, off = e * L, vel = L * (E.io(clamp(p + .03)) - E.io(clamp(p - .03))) / .06 / (2 * hl * 60) * 1.4;
      cC.setTransform(1, 0, 0, 1, 0, 0); cC.globalAlpha = 1; cC.fillStyle = '#03050A'; cC.fillRect(0, 0, W, H);
      cC.save(); cC.translate(dx * off, dy * off); const s = lerp(1, sA, e); cC.translate(960, 540); cC.scale(s, s); cC.translate(-960, -540); cC.drawImage(bufA, 0, 0); cC.restore();
      cC.drawImage(bufB, dx * (off - L), dy * (off - L));
      smear(m, bufC, dx * vel, dy * vel, 12);
    } else if (type === 'match') {       // continuity cut: the carried element is in the same place on both sides
      m.drawImage(bufA, 0, 0); m.globalAlpha = e; m.drawImage(bufB, 0, 0);
    } else if (type === 'disc') {        // the disc behind the hero grows and opens the next scene
      const [cx, cy] = ex, R = 2300 * E.io(clamp(p)) + 1;
      m.save(); const zA = 1 + .06 * e; m.translate(960, 540); m.scale(zA, zA); m.translate(-960, -540); m.drawImage(bufA, 0, 0); m.restore();
      m.save(); m.beginPath(); m.arc(cx, cy, R, 0, 7); m.clip(); const zB = 1.08 - .08 * e; m.translate(cx, cy); m.scale(zB, zB); m.translate(-cx, -cy); m.drawImage(bufB, 0, 0); m.restore();
      if (R > 2 && R < 2200) { m.save(); m.lineWidth = 3; const gr = m.createRadialGradient(cx, cy, Math.max(0, R - 40), cx, cy, R + 4); gr.addColorStop(0, 'rgba(59,123,255,0)'); gr.addColorStop(1, 'rgba(140,180,255,.85)');
        m.strokeStyle = 'rgba(160,195,255,.9)'; m.beginPath(); m.arc(cx, cy, R, 0, 7); m.stroke(); m.fillStyle = gr; m.beginPath(); m.arc(cx, cy, R, 0, 7); m.fill(); m.restore(); }
    } else if (type === 'leaf') {        // foreground orange-tree branches sweep across the lens and wipe the frame
      const dir = ex, edge = dir > 0 ? lerp(W + 500, -500, e) : lerp(-500, W + 500, e);
      m.save(); m.drawImage(bufB, 0, 0); m.beginPath(); if (dir > 0) m.rect(0, 0, edge, H); else m.rect(edge, 0, W - edge, H); m.clip(); m.drawImage(bufA, 0, 0); m.restore();
      const L = LEAF.front, sc2 = 2.6, v = 1 - Math.abs(e - .5) * 2;
      for (const [oy, rot, k2] of [[-140, .4, 0], [560, -2.6, 1], [1180, .9, 2]]) { m.save(); m.translate(edge + dir * (k2 - 1) * 220, oy); m.rotate(rot + dir * .15 * (e - .5)); m.scale(sc2, sc2); m.globalAlpha = .55 + .45 * v; m.drawImage(L, -L.width / 2, -L.height / 2); m.restore(); }
    } else if (type === 'flash') {       // hard cut inside a burst of light and film grain, with a scale punch
      if (p < .5) { const z = 1 + .05 * E.in(p * 2); m.save(); m.translate(960, 540); m.scale(z, z); m.translate(-960, -540); m.drawImage(bufA, 0, 0); m.restore(); }
      else { const q = (p - .5) * 2, z = 1.08 - .08 * E.out(q); m.save(); m.translate(960, 540); m.scale(z, z); m.translate(-960, -540); m.drawImage(bufB, 0, 0); m.restore(); }
      const f = Math.max(0, 1 - Math.abs(p - .5) * 4.5);
      m.fillStyle = `rgba(190,210,255,${(.55 * f).toFixed(3)})`; m.fillRect(0, 0, W, H);
      if (!grainPat) grainPat = m.createPattern(grainTile, 'repeat');
      m.save(); m.globalAlpha = .6 * f; m.globalCompositeOperation = 'overlay'; m.translate((Math.floor(t * 60) * 41) % 128 - 64, (Math.floor(t * 60) * 67) % 128 - 64); m.scale(2, 2); m.fillStyle = grainPat; m.fillRect(-64, -64, W, H); m.restore();
    }
    m.globalAlpha = 1; m.filter = 'none';
  }
  function frame(t) {
    T = t; const cur = SC.findIndex(s => t >= s.t0 && t < s.t1), i = cur < 0 ? SC.length - 1 : cur, s = SC[i];
    const nxt = SC[i + 1], prv = SC[i - 1];
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.filter = 'none'; main.globalCompositeOperation = 'source-over';
    let done = false;
    for (const [A, B] of [[s, nxt], [prv, s]]) { if (!A || !B || done) continue; const c = CUTS[B.t0]; if (!c) continue; const h = c[1];
      if (t > B.t0 - h && t < B.t0 + h) { transition(c[0], A, B, t, (t - (B.t0 - h)) / (2 * h), c[2], h); done = true; } }
    if (!done) drawScene(s, t, main);
    for (const [t0, dur, dir] of LEAKS) { const q = (t - t0) / dur; if (q <= 0 || q >= 1) continue; const a = Math.sin(Math.PI * q) ** 1.5, x = dir > 0 ? lerp(-300, W + 300, q) : lerp(W + 300, -300, q);
      main.save(); main.globalCompositeOperation = 'screen'; let gr = main.createRadialGradient(x, 300, 0, x, 300, 900); gr.addColorStop(0, `rgba(255,196,150,${(.32 * a).toFixed(3)})`); gr.addColorStop(.5, `rgba(255,140,90,${(.12 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,60,0)');
      main.fillStyle = gr; main.fillRect(0, 0, W, H); gr = main.createLinearGradient(x - 500, 0, x + 500, H); gr.addColorStop(0, 'rgba(255,220,190,0)'); gr.addColorStop(.5, `rgba(255,220,190,${(.1 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,190,0)'); main.fillStyle = gr; main.fillRect(0, 0, W, H); main.restore(); }
    // finish: vignette + grain (+ stronger grain on the black title cards)
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1;
    const vg = main.createRadialGradient(960, 540, 520, 960, 540, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,.32)'); main.fillStyle = vg; main.fillRect(0, 0, W, H);
    if (!grainPat) grainPat = main.createPattern(grainTile, 'repeat');
    const fi = Math.floor(t * 30); main.save(); main.globalAlpha = t > 89.5 || t < 3.2 ? .1 : .045; main.globalCompositeOperation = 'overlay'; main.translate((fi * 37) % 128 - 64, (fi * 53) % 128 - 64); main.fillStyle = grainPat; main.fillRect(-64, -64, W + 128, H + 128); main.restore();
  }

  window.VH_SCENES = SC.map(s => ({ name: s.name, t0: s.t0, t1: s.t1 }));
  window.renderOut = function (t) { frame(clamp(+t || 0, 0, DUR)); };

  (async () => {
    const faces = [
      ['IT', 'intertight-latin.woff2', '100 900', 'normal', 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212'], ['IT', 'intertight-ext.woff2', '100 900', 'normal', 'U+0100-024F, U+1E00-1EFF'],
      ...['600', '700'].flatMap(w => ['normal', 'italic'].flatMap(st => [['CG', `cormorant-garamond-latin-${w}-${st}.woff2`, w, st, 'U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2212'], ['CG', `cormorant-garamond-latin-ext-${w}-${st}.woff2`, w, st, 'U+0100-024F, U+1E00-1EFF']]))];
    for (const [fam, file, weight, style, ur] of faces) { const f = new FontFace(fam, `url(fonts/${file})`, { weight, style, unicodeRange: ur }); document.fonts.add(f); await f.load(); }
    await Promise.all([loadImage('ebike', 'assets/cut/ebike.png'), loadImage('courier', 'assets/cut/courier.png'), loadImage('student', 'assets/cut/student.png'), loadImage('cyclist', 'assets/cut/cyclist.png'),
      loadImage('cyclistPhoto', 'assets/photos/cyclist.jpg'), loadImage('valencia', 'assets/photos/valencia.jpg'),
      loadImage('brand', 'assets/photos/brand.jpg'), loadImage('supMeeting0', 'assets/photos/sup_meeting.jpg'), loadImage('supKpi0', 'assets/photos/sup_kpi.jpg'), loadImage('supOne0', 'assets/photos/sup_one.jpg')]);
    await document.fonts.ready;
    IMG.ebikeMono = grade(IMG.ebike, 'mono'); IMG.studentCool = grade(IMG.student, 'cool'); IMG.courierCool = grade(IMG.courier, 'cool'); IMG.cyclistCool = grade(IMG.cyclist, 'cool');
    for (const k2 of ['studentCool', 'courierCool', 'cyclistCool']) IMG[k2].glow = rimGlow(IMG[k2]);
    for (const k2 of ['ebikeMono', 'cyclistCool']) { const s = IMG[k2], c = mk(s.width, s.height), x = c.getContext('2d'); x.filter = k2 === 'ebikeMono' ? 'grayscale(1) brightness(1.45) contrast(.55) blur(5px)' : 'grayscale(.6) brightness(1.7) contrast(.6) blur(5px)'; x.drawImage(s, 0, 0); s.pale = c; }
    { const v = IMG.valencia, c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.5) contrast(1.1) brightness(.85)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.55)'; x.fillRect(0, 0, c.width, c.height); IMG.valenciaCool = c; }
    LEAF.paper = blurred(branch(11, 'rgba(18,40,90,.92)', '#1D3E86'), 6); LEAF.front = blurred(branch(37, 'rgba(5,14,36,1)', null), 18); LEAF.navy = blurred(branch(23, 'rgba(14,44,110,.95)', '#FF5A1F'), 10);
    IMG.card = buildCard(); IMG.cardBack = buildCardBack();
    { const v = IMG.brand, mkc = f => { const c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = f; x.drawImage(v, 0, 0); return c; };
      IMG.brandCol = mkc('contrast(1.08) saturate(.9) brightness(1.03)'); { const x = IMG.brandCol.getContext('2d'); x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(40,90,200,.28)'; x.fillRect(0, 0, v.width, v.height); }
      IMG.brandPale = mkc('grayscale(1) brightness(1.45) contrast(.5) blur(8px)'); }
    for (const k2 of ['supMeeting', 'supKpi', 'supOne']) { const v = IMG[k2 + '0'], c = mk(v.width, v.height), x = c.getContext('2d'); x.filter = 'saturate(.55) contrast(1.08) brightness(.9)'; x.drawImage(v, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(30,80,200,.5)'; x.fillRect(0, 0, c.width, c.height); IMG[k2] = c; }
    window.renderOut(0);
    window.READY = true;
  })();
})();
