/* OBELCHA — 20s launch ad renderer.
 * Pure function of time: window.seek(t) draws the exact frame for t (seconds).
 * Every timing comes from timeline.json; this file only owns layout + drawing.
 * Deterministic: seeded PRNG only, no clocks (the preview Play button is the
 * single exception and is never used by the renderer). */
(() => {
  'use strict';

  // ---------- params ----------
  const Q = new URLSearchParams(location.search);
  const CFG = window.__AD_CONFIG__ || {}; // HyperFrames compositions pin format/lang here
  const FORMAT = CFG.format || Q.get('format') || '9x16';
  const LANG = CFG.lang || Q.get('lang') || 'es';
  const RENDER = CFG.render ?? Q.get('render') === '1';
  const GRAIN = CFG.grain ?? (Q.has('grain') ? Q.get('grain') === '1' : !RENDER); // Playwright path: grain added by ffmpeg
  const SAFE_OVERLAY = Q.get('safe') === '1';
  if (RENDER) document.body.classList.add('render');

  let TL, W, H, U, L, COPY, canvas, ctx;
  const IMG = { logo: null, product: null };

  // ---------- math / easing ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 8; i++) { const e = sx(u) - x; const d = dx(u); if (Math.abs(e) < 1e-6 || !d) break; u -= e / d; }
      u = clamp(u);
      return sy(u);
    };
  }
  let EASE; // brand curve, set from timeline
  const EASES = {
    out: (k) => EASE(k),
    in: (k) => k * k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    linear: (k) => k,
  };
  const E = (t, a, b) => EASE(seg(t, a, b));
  const smooth = (k) => k * k * (3 - 2 * k);

  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const P = { black: '#0B0B0B', gold: '#C9A24A', champagne: '#E8D9B5', offwhite: '#F5F1EA' };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  // ---------- layout (positions only; no timings here) ----------
  // Bottle: {x, y (base), h}. Text: {x, y (block centre), size, align, maxW}
  const LAYOUTS = {
    '9x16': {
      hook: { text: { x: 520, y: 540, size: 210, align: 'center', maxW: 860 }, dropStart: [530, 900], dropLand: [530, 1250] },
      tension: { text: { x: 520, y: 640, size: 170, align: 'center', maxW: 860 }, drop: [800, 1210], drop2: [610, 1130] },
      reveal: { bottle: { x: 540, y: 1720, h: 960 }, eyebrow: { x: 520, y: 335, size: 64, align: 'center' }, title: { x: 520, y: 530, size: 158, align: 'center', maxW: 860 } },
      benefits: { bottle: { x: 540, y: 1850, h: 600 }, card: { x: 100, y: 560, w: 840, h: 440 }, textSize: 104 },
      cta: { bottle: { x: 520, y: 905, h: 610 }, wordmark: { x: 510, y: 1140, size: 140 }, url: { x: 510, y: 1330, size: 96 }, offer: { x: 510, y: 1440, size: 64 }, maxW: 820 },
    },
    '1x1': {
      hook: { text: { x: 540, y: 255, size: 172, align: 'center', maxW: 920 }, dropStart: [540, 700], dropLand: [540, 830] },
      tension: { text: { x: 540, y: 400, size: 150, align: 'center', maxW: 920 }, drop: [820, 820], drop2: [650, 760] },
      reveal: { bottle: { x: 540, y: 1010, h: 610 }, eyebrow: { x: 540, y: 100, size: 54, align: 'center' }, title: { x: 540, y: 255, size: 112, align: 'center', maxW: 920 } },
      benefits: { bottle: { x: 245, y: 990, h: 600 }, card: { x: 440, y: 330, w: 590, h: 420 }, textSize: 84 },
      cta: { bottle: { x: 540, y: 455, h: 380 }, wordmark: { x: 540, y: 640, size: 128 }, url: { x: 540, y: 800, size: 74 }, offer: { x: 540, y: 885, size: 54 }, maxW: 920 },
    },
    '16x9': {
      hook: { text: { x: 960, y: 250, size: 170, align: 'center', maxW: 1500 }, dropStart: [960, 690], dropLand: [960, 820] },
      tension: { text: { x: 960, y: 390, size: 150, align: 'center', maxW: 1500 }, drop: [1460, 800], drop2: [1300, 740] },
      reveal: { bottle: { x: 1390, y: 1010, h: 860 }, eyebrow: { x: 236, y: 340, size: 58, align: 'left' }, title: { x: 230, y: 540, size: 160, align: 'left', maxW: 860 } },
      benefits: { bottle: { x: 1460, y: 1010, h: 820 }, card: { x: 200, y: 320, w: 860, h: 440 }, textSize: 112 },
      cta: { bottle: { x: 1500, y: 960, h: 720 }, wordmark: { x: 700, y: 450, size: 156 }, url: { x: 700, y: 630, size: 90 }, offer: { x: 700, y: 725, size: 60 }, maxW: 960 },
    },
  };

  function anchor(name) {
    const [sc, key] = name.split('.');
    const l = L;
    if (sc === 'reveal' && key === 'liquid') { const b = l.reveal.bottle; return [b.x, b.y - 0.27 * b.h]; }
    if (sc === 'reveal' && key === 'neck') { const b = l.reveal.bottle; return [b.x, b.y - 0.56 * b.h]; }
    if (sc === 'card' && key === 'bullet') { const c = l.benefits.card; return [c.x + 78, c.y + 96]; }
    if (sc === 'cta' && key === 'dropLand') return [l.cta.wordmark.x, ctaLine() - 0.28 * dropR() * 0.9];
    if (sc === 'cta' && key === 'dropHigh') return [l.cta.wordmark.x, l.cta.wordmark.y - l.cta.wordmark.size * 1.25];
    return l[sc][key];
  }
  const dropR = () => 0.1 * Math.min(W, H);
  const ctaLine = () => L.cta.wordmark.y + L.cta.wordmark.size * 0.72;

  // generic keyframe track: keys [{t, ...vals, ease}] -> interpolated object at t
  function track(keys, t, fields, resolve) {
    if (t <= keys[0].t) return resolve(keys[0], keys[0], 0, fields);
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t <= b.t) {
        const k = (EASES[b.ease || 'out'])(seg(t, a.t, b.t));
        return resolve(a, b, k, fields);
      }
    }
    const z = keys[keys.length - 1];
    return resolve(z, z, 0, fields);
  }
  const resolveAnchored = (a, b, k, fields) => {
    const pa = anchor(a.at), pb = anchor(b.at);
    const o = { x: lerp(pa.x ?? pa[0], pb.x ?? pb[0], k), y: lerp(pa.y ?? pa[1], pb.y ?? pb[1], k) };
    if (pa.h) o.h = lerp(pa.h, pb.h, k);
    for (const f of fields) o[f] = lerp(a[f] ?? 0, b[f] ?? 0, k);
    return o;
  };

  // ---------- text ----------
  const FONTS = {
    hook: { family: 'Cormorant Garamond', weight: 600, style: 'normal', color: P.offwhite, lh: 0.92, tracking: -0.01 },
    headline: { family: 'Cormorant Garamond', weight: 500, style: 'italic', color: P.offwhite, lh: 0.95, tracking: -0.005 },
    eyebrow: { family: 'Jost', weight: 500, style: 'normal', color: P.gold, lh: 1, tracking: 0.38, upper: true },
    title: { family: 'Cormorant Garamond', weight: 600, style: 'normal', color: P.offwhite, lh: 0.95, tracking: -0.005 },
    card: { family: 'Cormorant Garamond', weight: 600, style: 'normal', color: P.offwhite, lh: 1.0, tracking: 0 },
    index: { family: 'Jost', weight: 500, style: 'normal', color: P.gold, lh: 1, tracking: 0.25 },
    wordmark: { family: 'Cormorant Garamond', weight: 600, style: 'normal', color: P.offwhite, lh: 1, tracking: 0.24 },
    url: { family: 'Jost', weight: 400, style: 'normal', color: P.champagne, lh: 1, tracking: 0.03 },
    offer: { family: 'Jost', weight: 500, style: 'normal', color: P.gold, lh: 1.15, tracking: 0.08, upper: true },
  };
  const fontStr = (f, size) => `${f.style} ${f.weight} ${size}px '${f.family}'`;
  function measure(str, f, size, extraTrack = 0) {
    ctx.font = fontStr(f, size);
    ctx.letterSpacing = `${(f.tracking + extraTrack) * size}px`;
    const w = ctx.measureText(str).width;
    return w - (f.tracking + extraTrack) * size; // trailing tracking not counted
  }
  // Fit: shrink to maxW down to minSize; if still too wide, re-wrap to 2 lines.
  function fitLines(text, f, size, maxW, minSize) {
    let lines = text.split('\n').map((s) => (f.upper ? s.toUpperCase() : s));
    const widest = (ls, s) => Math.max(...ls.map((l) => measure(l, f, s)));
    let s = size;
    while (s > minSize && widest(lines, s) > maxW) s -= 2;
    if (widest(lines, s) > maxW && lines.length === 1) {
      const words = lines[0].split(' ');
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const ls = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
        const w = widest(ls, s);
        if (!best || w < best.w) best = { ls, w };
      }
      if (best) lines = best.ls;
      s = size;
      while (s > minSize && widest(lines, s) > maxW) s -= 2;
    }
    return { lines, size: s };
  }
  const MIN_TEXT = () => (FORMAT === '9x16' ? 64 : 52);

  // Draw a text block with the brand entrance/exit. Gold punctuation for the hook.
  function textBlock(id, styleKey, box, tin, tout, t, opts = {}) {
    if (t < tin - 0.01 || t > tout + 0.5) return;
    const f = FONTS[styleKey];
    const str = opts.text ?? COPY[id];
    const { lines, size } = fitLines(str, f, box.size, box.maxW || W - 160, Math.min(box.size, MIN_TEXT()));
    const lh = size * f.lh;
    const blockH = lh * (lines.length - 1);
    const y0 = box.y - blockH / 2;
    const dIn = opts.dIn ?? TL.motion.textIn, dOut = opts.dOut ?? TL.motion.textOut;
    lines.forEach((line, i) => {
      const st = tin + i * (opts.stagger ?? TL.motion.lineStagger);
      const pin = E(t, st, st + dIn);
      const pout = smooth(seg(t, tout - dOut, tout));
      const a = pin * (1 - pout);
      if (a <= 0.002) return;
      const dy = (1 - pin) * size * 0.32 - pout * size * 0.22;
      const blur = (1 - pin) * size * 0.06 + pout * size * 0.05;
      const extra = (1 - pin) * 0.08;
      ctx.save();
      ctx.globalAlpha = a;
      if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(2)}px)`;
      ctx.font = fontStr(f, size);
      ctx.letterSpacing = `${(f.tracking + extra) * size}px`;
      ctx.textBaseline = 'middle';
      const w = measure(line, f, size, extra);
      let x = box.x;
      if (box.align === 'center' || !box.align) x -= w / 2;
      const y = y0 + i * lh + dy;
      // per-char colouring of punctuation (gold) for hook
      ctx.font = fontStr(f, size);
      ctx.letterSpacing = `${(f.tracking + extra) * size}px`;
      ctx.textAlign = 'left';
      if (opts.goldPunct) {
        let cx = x;
        for (const ch of line) {
          ctx.fillStyle = /[¿?¡!]/.test(ch) ? P.gold : (opts.color || f.color);
          ctx.fillText(ch, cx, y);
          cx += ctx.measureText(ch).width;
        }
      } else {
        ctx.fillStyle = opts.color || f.color;
        if (opts.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.35; }
        ctx.fillText(line, x, y);
      }
      ctx.restore();
    });
    return { lines, size, y0, lh };
  }

  // ---------- background ----------
  let grainTiles = [];
  function buildGrain(seed) {
    const r = mulberry32(seed);
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'); const im = g.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); grainTiles.push(c);
    }
  }

  function vignette(strength = 0.6) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function glow(x, y, r, color, a) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.45, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Glass surface the hook droplet lands on
  function drawSurface(t, alpha) {
    if (alpha <= 0) return;
    const [lx, ly] = anchor('hook.dropLand');
    const hy = ly + dropR() * 0.92;
    ctx.save(); ctx.globalAlpha = alpha;
    // spotlight cone from above
    const sg = ctx.createRadialGradient(lx, hy - H * 0.05, 0, lx, hy - H * 0.05, Math.max(W, H) * 0.55);
    sg.addColorStop(0, rgba(P.champagne, 0.10)); sg.addColorStop(1, rgba(P.champagne, 0));
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    // horizon sheen
    const hg = ctx.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, rgba(P.champagne, 0)); hg.addColorStop(0.5, rgba(P.champagne, 0.28)); hg.addColorStop(1, rgba(P.champagne, 0));
    ctx.fillStyle = hg; ctx.fillRect(0, hy - 1, W, 2);
    // warm light pool cast by the drop (grows as it approaches)
    const dd = dropletState(t);
    if (t < 2.5) {
      const near = 1 - clamp((hy - dd.y) / (H * 0.35));
      const pg = ctx.createRadialGradient(lx, hy, 0, lx, hy, dropR() * 4.5);
      pg.addColorStop(0, rgba(P.gold, 0.32 * near)); pg.addColorStop(1, rgba(P.gold, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(lx, hy, dropR() * 4.5, dropR() * 1.1, 0, 0, 6.283); ctx.fill();
    }
    // glossy floor fade
    const fg = ctx.createLinearGradient(0, hy, 0, H);
    fg.addColorStop(0, 'rgba(30,26,20,0.55)'); fg.addColorStop(1, 'rgba(11,11,11,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, hy, W, H - hy);
    ctx.restore();
  }

  function ripples(t, t0, x, y, maxR, alpha = 1) {
    const dt = t - t0; if (dt < 0 || dt > 2.2) return;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const d = dt - i * 0.16; if (d <= 0) continue;
      const k = EASE(clamp(d / 1.8));
      const r = maxR * k;
      const a = (1 - k) * 0.65 * alpha;
      ctx.strokeStyle = rgba(i === 0 ? P.gold : P.champagne, a);
      ctx.lineWidth = Math.max(1, U * (2.4 - i * 0.6));
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // Elegant macro "skin" field: warm low-light surface with stylised pores.
  let skin = null;
  function buildSkin(seed) {
    const r = mulberry32(seed + 7);
    const pores = [], fine = [];
    const sp = 74 * U;
    for (let y = -sp; y < H + sp * 2; y += sp * 0.87) {
      for (let x = -sp, row = 0; x < W + sp * 2; x += sp, row++) {
        const ox = ((Math.round(y / (sp * 0.87)) % 2) * sp) / 2;
        pores.push({ x: x + ox + (r() - 0.5) * sp * 0.55, y: y + (r() - 0.5) * sp * 0.5, r: (2.2 + r() * 2.6) * U, clog: r() < 0.16, d: r() });
      }
    }
    for (let i = 0; i < 2600 * (W * H) / (1080 * 1920); i++) fine.push({ x: r() * W, y: r() * H, a: 0.03 + r() * 0.05, r: (0.6 + r() * 1.2) * U });
    skin = { pores, fine };
  }
  let skinBuf;
  function drawSkin(t, reveal, fadeOut) {
    if (reveal <= 0 || fadeOut >= 1) return;
    if (!skin.tex) paintSkinTexture();
    if (!skinBuf) { skinBuf = document.createElement('canvas'); skinBuf.width = W; skinBuf.height = H; }
    const g = skinBuf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    // slow dolly
    const k = seg(t, TL.transitions[0].start, TL.transitions[1].end);
    const sc = 1.0 + 0.07 * k + 0.12 * smooth(fadeOut);
    g.save();
    g.translate(W / 2, H * 0.55); g.scale(sc, sc); g.translate(-W / 2, -H * 0.55 - k * 40 * U);
    if (fadeOut > 0) g.filter = `blur(${(fadeOut * 14 * U).toFixed(1)}px)`;
    g.drawImage(skin.tex, -W * 0.15, -H * 0.15);
    g.restore();
    const [cx, cy] = anchor('hook.dropLand');
    const hy = cy + dropR() * 0.92;
    const e = EASE(reveal);
    const R = Math.hypot(W, H) * 1.1 * e;
    const squ = lerp(0.25, 1, smooth(reveal));
    if (reveal < 1) {
      // feathered elliptical mask: soft wavefront instead of a hard disc edge
      g.globalCompositeOperation = 'destination-in';
      g.save(); g.translate(cx, hy); g.scale(1, squ);
      const mg = g.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, R));
      mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(0.62, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = mg; g.fillRect(-W * 3, -H * 3, W * 6, H * 6);
      g.restore();
      g.globalCompositeOperation = 'source-over';
    }
    ctx.save(); ctx.globalAlpha = 1 - fadeOut; ctx.drawImage(skinBuf, 0, 0); ctx.restore();
    // champagne wavefront riding the edge of the wipe
    if (reveal > 0 && reveal < 1) {
      ctx.save();
      ctx.strokeStyle = rgba(P.champagne, 0.35 * (1 - reveal));
      ctx.lineWidth = 3 * U; ctx.filter = `blur(${(2 * U).toFixed(1)}px)`;
      ctx.beginPath(); ctx.ellipse(cx, hy, R * 0.8, R * 0.8 * squ, 0, 0, 6.283); ctx.stroke();
      ctx.restore();
    }
  }
  function paintSkinTexture() {
    const c = document.createElement('canvas'); c.width = Math.round(W * 1.3); c.height = Math.round(H * 1.3);
    const g = c.getContext('2d');
    g.translate(W * 0.15, H * 0.15);
    // warm base light
    const bg = g.createRadialGradient(W * 0.55, H * 0.6, 0, W * 0.55, H * 0.6, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#3e2e20'); bg.addColorStop(0.5, '#22190f'); bg.addColorStop(1, '#0B0B0B');
    g.fillStyle = bg; g.fillRect(-W * 0.15, -H * 0.15, W * 1.3, H * 1.3);
    // fine micro-texture, softened like a shallow-DOF macro
    const fc = document.createElement('canvas'); fc.width = c.width; fc.height = c.height;
    const fg = fc.getContext('2d'); fg.translate(W * 0.15, H * 0.15);
    for (const p of skin.fine) { fg.fillStyle = `rgba(232,217,181,${p.a * 1.4})`; fg.beginPath(); fg.arc(p.x, p.y, p.r * 1.3, 0, 6.283); fg.fill(); }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${(1.2 * U).toFixed(1)}px)`; g.drawImage(fc, 0, 0); g.restore();
    // pores: soft radial cups lit from top-left
    for (const p of skin.pores) {
      const rr = p.clog ? p.r * 2.1 : p.r * 1.15;
      const hl = g.createRadialGradient(p.x + rr * 0.45, p.y + rr * 0.5, 0, p.x + rr * 0.45, p.y + rr * 0.5, rr * 1.6);
      hl.addColorStop(0, 'rgba(240,222,180,0.16)'); hl.addColorStop(1, 'rgba(240,222,180,0)');
      g.fillStyle = hl; g.fillRect(p.x - rr * 2, p.y - rr * 2, rr * 4, rr * 4);
      const dg = g.createRadialGradient(p.x - rr * 0.15, p.y - rr * 0.15, 0, p.x, p.y, rr * 1.1);
      dg.addColorStop(0, p.clog ? 'rgba(4,3,2,0.95)' : 'rgba(10,7,4,0.6)'); dg.addColorStop(0.7, p.clog ? 'rgba(8,6,4,0.7)' : 'rgba(10,7,4,0.25)'); dg.addColorStop(1, 'rgba(10,7,4,0)');
      g.fillStyle = dg; g.beginPath(); g.arc(p.x, p.y, rr * 1.1, 0, 6.283); g.fill();
    }
    // oily diagonal sheen — the "dull" skin still reads as skin, not a dot pattern
    g.save(); g.globalCompositeOperation = 'screen';
    g.translate(W * 0.3, H * 0.2); g.rotate(-0.5);
    const sg = g.createLinearGradient(0, -H * 0.12, 0, H * 0.12);
    sg.addColorStop(0, 'rgba(232,217,181,0)'); sg.addColorStop(0.5, 'rgba(232,217,181,0.07)'); sg.addColorStop(1, 'rgba(232,217,181,0)');
    g.fillStyle = sg; g.fillRect(-W, -H * 0.12, W * 3, H * 0.24);
    g.restore();
    skin.tex = c;
  }

  // ---------- droplet (the spine) ----------
  function drawDroplet(x, y, r, tip, angle, squash, alpha) {
    if (alpha <= 0.002 || r <= 0.5) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    // halo
    glow(x, y, r * 3.2, P.gold, 0.16);
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.scale(1 + squash * 0.6, 1 - squash);
    // teardrop path: circle + tip extending upward (local -y)
    const tl = r * (1 + 1.25 * tip);
    ctx.beginPath();
    ctx.moveTo(0, -tl);
    ctx.bezierCurveTo(r * 0.552 * (1 - tip) + r * 0.22 * tip, -tl, r, -r * 0.552 * (1 - tip) - r * 0.7 * tip, r, 0);
    ctx.arc(0, 0, r, 0, Math.PI, false);
    ctx.bezierCurveTo(-r, -r * 0.552 * (1 - tip) - r * 0.7 * tip, -r * 0.552 * (1 - tip) - r * 0.22 * tip, -tl, 0, -tl);
    ctx.closePath();
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.35, r * 0.1, 0, 0, r * 1.25);
    g.addColorStop(0, '#F3DE9F'); g.addColorStop(0.35, '#D9B35A'); g.addColorStop(0.75, '#A27C2C'); g.addColorStop(1, '#4E3A10');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // refracted caustic at the bottom
    const c = ctx.createRadialGradient(r * 0.1, r * 0.62, 0, r * 0.1, r * 0.62, r * 0.7);
    c.addColorStop(0, 'rgba(255,244,214,0.85)'); c.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = c; ctx.fillRect(-r, -tl, r * 2, tl + r);
    // dark rim
    ctx.strokeStyle = 'rgba(40,28,6,0.55)'; ctx.lineWidth = r * 0.12; ctx.stroke();
    ctx.restore();
    // specular
    ctx.fillStyle = 'rgba(255,252,244,0.92)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.12, -0.7, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,252,244,0.5)';
    ctx.beginPath(); ctx.ellipse(r * 0.48, r * 0.3, r * 0.06, r * 0.035, -0.8, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function dropletState(t) {
    const D = TL.droplet;
    const s = track(D.keys, t, ['s', 'tip'], resolveAnchored);
    // velocity for orientation
    const s2 = track(D.keys, t + 1 / 60, ['s', 'tip'], resolveAnchored);
    const vx = s2.x - s.x, vy = s2.y - s.y;
    const speed = Math.hypot(vx, vy);
    let angle = 0;
    if (speed > 0.5 * U && s.tip > 0.05) angle = Math.atan2(vx, -vy) + Math.PI; // tip trails motion
    if (Math.abs(angle) > Math.PI) angle -= Math.sign(angle) * 2 * Math.PI;
    if (vy > 0 && Math.abs(vx) < speed * 0.4) angle = 0; // falling: tip up
    let alpha = 1;
    for (const [a, b] of D.hidden) {
      if (t > a - 0.3 && t < a) alpha = Math.min(alpha, 1 - smooth(seg(t, a - 0.3, a)));
      if (t >= a && t <= b) alpha = 0;
      if (t > b && t < b + 0.25) alpha = Math.min(alpha, smooth(seg(t, b, b + 0.25)));
    }
    let squash = 0, appear = 1;
    for (const im of D.impacts) {
      const d = t - im.t;
      if (d > 0 && d < 1.5 && im.kind !== 'bloom') squash += Math.exp(-d * 5.5) * Math.sin(d * 24) * 0.28;
    }
    // hover float in tension
    let fy = 0;
    const [h0, h1] = TL.fx.dropHover;
    if (t > h0 && t < h1) fy = Math.sin((t - h0) * 2.1) * 10 * U * seg(t, h0, h0 + 0.5) * (1 - seg(t, h1 - 0.4, h1));
    // card bullet pulse
    let pulse = 0;
    for (const c of TL.text.filter((x) => x.style === 'card')) { const d = t - c.in; if (d > 0 && d < 0.6) pulse += Math.sin(d / 0.6 * Math.PI) * 0.18; }
    return { x: s.x, y: s.y + fy, r: dropR() * s.s * (1 + pulse) * appear, tip: s.tip, angle, squash, alpha };
  }

  // ---------- bottle ----------
  let bufA, bufB, gA, gB;
  function ensureBuffers(size) {
    if (!bufA || bufA.width < size) {
      bufA = document.createElement('canvas'); bufA.width = bufA.height = size; gA = bufA.getContext('2d');
      bufB = document.createElement('canvas'); bufB.width = bufB.height = size; gB = bufB.getContext('2d');
    }
  }
  function bodyPath(g, h, inset = 0) {
    const bw = 0.25 * h - inset, br = 0.05 * h, top = -0.6 * h + inset, nh = 0.085 * h - inset * 0.6, sh = 0.12 * h, bot = -inset;
    g.beginPath();
    g.moveTo(-bw + br, bot);
    g.lineTo(bw - br, bot); g.quadraticCurveTo(bw, bot, bw, bot - br);
    g.lineTo(bw, top + sh);
    g.bezierCurveTo(bw, top + sh * 0.25, nh + 0.05 * h, top + 0.005 * h, nh, top - 0.004 * h);
    g.lineTo(nh, -0.648 * h);
    g.lineTo(-nh, -0.648 * h);
    g.lineTo(-nh, top - 0.004 * h);
    g.bezierCurveTo(-nh - 0.05 * h, top + 0.005 * h, -bw, top + sh * 0.25, -bw, top + sh);
    g.lineTo(-bw, bot - br); g.quadraticCurveTo(-bw, bot, -bw + br, bot);
    g.closePath();
  }
  function capPath(g, h) {
    // collar + rubber bulb silhouette (for sweep clipping)
    g.rect(-0.112 * h, -0.73 * h, 0.224 * h, 0.085 * h);
    g.moveTo(-0.078 * h, -0.728 * h);
    g.lineTo(-0.068 * h, -0.93 * h);
    g.arc(0, -0.93 * h, 0.068 * h, Math.PI, 0);
    g.lineTo(0.078 * h, -0.728 * h);
    g.closePath();
  }

  // Draw the procedural bottle into g with base centre at (0,0) already translated.
  function paintBottle(g, h, o) {
    const { theta, build, liquidReveal, sweepK, capIn } = o;
    const glassA = clamp(build * 1.6);
    // --- glass body fill
    g.save();
    g.globalAlpha = glassA;
    bodyPath(g, h);
    const gb = g.createLinearGradient(-0.25 * h, 0, 0.25 * h, 0);
    gb.addColorStop(0, 'rgba(232,217,181,0.16)'); gb.addColorStop(0.18, 'rgba(232,217,181,0.05)');
    gb.addColorStop(0.6, 'rgba(232,217,181,0.03)'); gb.addColorStop(1, 'rgba(232,217,181,0.14)');
    g.fillStyle = gb; g.fill();
    g.restore();

    // --- liquid
    if (liquidReveal > 0) {
      g.save();
      bodyPath(g, h, 0.017 * h); g.clip();
      const level = -0.47 * h;
      const lc = [0, -0.27 * h];
      g.beginPath();
      g.arc(lc[0], lc[1], 0.75 * h * EASE(liquidReveal), 0, 6.283); g.clip();
      g.beginPath(); g.rect(-0.3 * h, level, 0.6 * h, 0.5 * h); g.clip();
      const lg = g.createLinearGradient(-0.235 * h, 0, 0.235 * h, 0);
      lg.addColorStop(0, '#4a360d'); lg.addColorStop(0.16, '#A9832F'); lg.addColorStop(0.34, '#E7C56C');
      lg.addColorStop(0.55, '#C9A24A'); lg.addColorStop(0.85, '#7a5a1c'); lg.addColorStop(1, '#3b2a09');
      g.fillStyle = lg; g.fillRect(-0.3 * h, level, 0.6 * h, 0.5 * h);
      const vg = g.createLinearGradient(0, level, 0, 0);
      vg.addColorStop(0, 'rgba(255,240,200,0.18)'); vg.addColorStop(0.6, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,12,0,0.45)');
      g.fillStyle = vg; g.fillRect(-0.3 * h, level, 0.6 * h, 0.5 * h);
      // caustic band that drifts with rotation
      const cx = Math.sin(theta * 1.3) * 0.08 * h;
      const cg = g.createRadialGradient(cx, -0.06 * h, 0, cx, -0.06 * h, 0.2 * h);
      cg.addColorStop(0, 'rgba(255,236,170,0.55)'); cg.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = cg; g.fillRect(-0.3 * h, -0.3 * h, 0.6 * h, 0.3 * h);
      // suspended micro-bubbles rotate with the bottle
      const rb = mulberry32(99);
      for (let i = 0; i < 16; i++) {
        const a = rb() * 6.283, yy = lerp(-0.44 * h, -0.05 * h, rb()), rr = (0.004 + rb() * 0.007) * h;
        const ph = a + theta; const c = Math.cos(ph); const xx = Math.sin(ph) * 0.2 * h;
        g.globalAlpha = c > 0 ? 0.55 * c + 0.1 : 0.12;
        g.strokeStyle = 'rgba(255,246,220,0.9)'; g.lineWidth = Math.max(1, 0.0015 * h);
        g.beginPath(); g.arc(xx, yy, rr, 0, 6.283); g.stroke();
      }
      g.globalAlpha = 1;
      // meniscus
      g.fillStyle = 'rgba(240,214,140,0.75)';
      g.beginPath(); g.ellipse(0, level, 0.235 * h, 0.02 * h, 0, 0, 6.283); g.fill();
      g.restore();
    }

    // --- printed wordmark wraps around the cylinder (rotation cue)
    if (glassA > 0) {
      g.save();
      g.globalAlpha = glassA * clamp(liquidReveal * 1.4);
      const R = 0.25 * h, fs = 0.058 * h, yb = -0.29 * h;
      bodyPath(g, h); g.clip();
      const word = 'OBELCHA';
      g.font = `600 ${fs}px 'Cormorant Garamond'`; g.letterSpacing = '0px'; g.textBaseline = 'middle'; g.textAlign = 'center';
      const trk = fs * 0.22;
      const widths = [...word].map((ch) => g.measureText(ch).width + trk);
      const total = widths.reduce((a, b) => a + b, 0) - trk;
      let acc = -total / 2;
      for (let i = 0; i < word.length; i++) {
        const mid = acc + (widths[i] - trk) / 2; acc += widths[i];
        const ph = mid / R + theta;
        const c = Math.cos(ph); if (c < 0.06) continue;
        const x = Math.sin(ph) * R, y = yb + 0.012 * h * c;
        g.save(); g.translate(x, y); g.scale(c, 1);
        g.globalAlpha = glassA * clamp(liquidReveal * 1.4) * smooth(clamp((c - 0.06) / 0.4));
        g.fillStyle = '#0B0B0B'; g.fillText(word[i], 0, 0); g.restore();
      }
      // print rules (perspective arcs)
      for (const [yy, w] of [[-0.345 * h, 0.9], [-0.235 * h, 0.9]]) {
        g.globalAlpha = glassA * clamp(liquidReveal * 1.4) * 0.8;
        g.strokeStyle = '#0B0B0B'; g.lineWidth = Math.max(1, 0.0025 * h);
        const span = (total * 0.62) / R;
        g.beginPath();
        let first = true;
        for (let k = 0; k <= 24; k++) {
          const ph = -span + (2 * span * k) / 24 + theta;
          if (Math.cos(ph) < 0.05) { first = true; continue; }
          const x = Math.sin(ph) * R, y = yy + 0.012 * h * Math.cos(ph);
          if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    }

    // --- static speculars + edges
    g.save();
    g.globalAlpha = glassA;
    bodyPath(g, h); g.save(); g.clip();
    const sp = (x0, w, a) => {
      const sg = g.createLinearGradient(x0 - w, 0, x0 + w, 0);
      sg.addColorStop(0, 'rgba(255,252,244,0)'); sg.addColorStop(0.5, `rgba(255,252,244,${a})`); sg.addColorStop(1, 'rgba(255,252,244,0)');
      g.fillStyle = sg; g.fillRect(x0 - w, -0.58 * h, w * 2, 0.54 * h);
    };
    sp(-0.17 * h, 0.03 * h, 0.42); sp(-0.207 * h, 0.006 * h, 0.7); sp(0.218 * h, 0.012 * h, 0.35); sp(0.09 * h, 0.05 * h, 0.06);
    // thick glass bottom caustic
    const bg2 = g.createRadialGradient(0, -0.02 * h, 0, 0, -0.02 * h, 0.24 * h);
    bg2.addColorStop(0, `rgba(240,205,120,${0.5 * liquidReveal})`); bg2.addColorStop(1, 'rgba(240,205,120,0)');
    g.fillStyle = bg2; g.beginPath(); g.ellipse(0, -0.025 * h, 0.235 * h, 0.03 * h, 0, 0, 6.283); g.fill();
    // light sweep
    if (sweepK > 0 && sweepK < 1) paintSweep(g, h, sweepK);
    g.restore();
    g.strokeStyle = 'rgba(245,241,234,0.42)'; g.lineWidth = Math.max(1.2, 0.002 * h); bodyPath(g, h); g.stroke();
    g.restore();

    // --- collar + bulb (descend in during build)
    const cy = -(1 - EASE(capIn)) * 0.18 * h;
    g.save();
    g.globalAlpha = clamp(capIn * 1.5);
    g.translate(0, cy);
    // pipette inside the glass
    g.strokeStyle = 'rgba(245,241,234,0.22)'; g.lineWidth = Math.max(1, 0.002 * h);
    g.strokeRect(-0.017 * h, -0.645 * h, 0.034 * h, 0.55 * h);
    // collar
    const cg = g.createLinearGradient(-0.112 * h, 0, 0.112 * h, 0);
    cg.addColorStop(0, '#3a2a0c'); cg.addColorStop(0.18, '#9c7a30'); cg.addColorStop(0.32, '#F3E2B0');
    cg.addColorStop(0.45, '#C9A24A'); cg.addColorStop(0.75, '#7a5a1c'); cg.addColorStop(1, '#2e2108');
    g.fillStyle = cg; g.fillRect(-0.112 * h, -0.73 * h, 0.224 * h, 0.085 * h);
    g.fillStyle = 'rgba(30,20,4,0.28)';
    for (let k = 0; k < 6; k++) g.fillRect(-0.112 * h, -0.72 * h + k * 0.013 * h, 0.224 * h, Math.max(1, 0.0022 * h));
    // bulb
    g.beginPath();
    g.moveTo(-0.078 * h, -0.728 * h); g.lineTo(-0.068 * h, -0.93 * h); g.arc(0, -0.93 * h, 0.068 * h, Math.PI, 0); g.lineTo(0.078 * h, -0.728 * h); g.closePath();
    const kg = g.createLinearGradient(-0.078 * h, 0, 0.078 * h, 0);
    kg.addColorStop(0, '#050505'); kg.addColorStop(0.25, '#2c2a27'); kg.addColorStop(0.38, '#4a4640'); kg.addColorStop(0.55, '#141414'); kg.addColorStop(1, '#000');
    g.fillStyle = kg; g.fill();
    g.strokeStyle = 'rgba(232,217,181,0.18)'; g.lineWidth = Math.max(1, 0.0016 * h); g.stroke();
    if (sweepK > 0 && sweepK < 1) { g.save(); capPath(g, h); g.clip(); paintSweep(g, h, sweepK); g.restore(); }
    // gold hairline at bulb base
    g.fillStyle = P.gold; g.fillRect(-0.078 * h, -0.737 * h, 0.156 * h, Math.max(1.5, 0.003 * h));
    g.restore();
  }
  function paintSweep(g, h, k) {
    const x = lerp(-0.55 * h, 0.55 * h, smooth(k));
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(x, -0.5 * h); g.rotate(0.38);
    const sg = g.createLinearGradient(-0.07 * h, 0, 0.07 * h, 0);
    sg.addColorStop(0, 'rgba(255,248,230,0)'); sg.addColorStop(0.5, 'rgba(255,248,230,0.42)'); sg.addColorStop(1, 'rgba(255,248,230,0)');
    g.fillStyle = sg; g.fillRect(-0.07 * h, -0.8 * h, 0.14 * h, 1.6 * h);
    g.restore();
  }

  function bottleState(t) {
    const B = TL.bottle;
    const pos = track(B.keys, t, ['s'], resolveAnchored);
    const rot = track(B.rotation, t, ['theta'], (a, b, k) => ({ theta: lerp(a.theta, b.theta, k) }));
    let sweepK = 0;
    for (const s of B.sweeps) if (t >= s.t && t <= s.t + s.dur) sweepK = (t - s.t) / s.dur;
    const build = seg(t, B.build.start, B.build.end);
    return {
      x: pos.x, y: pos.y, h: pos.h * pos.s, theta: rot.theta, sweepK,
      build: E(t, B.build.start, B.build.start + 0.7),
      liquidReveal: seg(t, B.build.start + 0.2, B.build.end - 0.05),
      capIn: seg(t, B.build.start + 0.35, B.build.end + 0.1),
      visible: t >= B.build.start, rawBuild: build,
    };
  }

  function drawBottle(t) {
    const b = bottleState(t);
    if (!b.visible) return b;
    const h = b.h;
    const size = Math.ceil(h * 1.15);
    ensureBuffers(size);
    gA.setTransform(1, 0, 0, 1, 0, 0); gA.clearRect(0, 0, bufA.width, bufA.height);
    gA.translate(size / 2, size * 0.98);
    if (IMG.product) {
      const im = IMG.product, ih = h * 0.98, iw = (im.width / im.height) * ih;
      gA.globalAlpha = b.build; gA.drawImage(im, -iw / 2, -ih, iw, ih); gA.globalAlpha = 1;
      if (b.sweepK > 0 && b.sweepK < 1) { gA.globalCompositeOperation = 'source-atop'; paintSweep(gA, h, b.sweepK); gA.globalCompositeOperation = 'source-over'; }
    } else {
      paintBottle(gA, h, b);
    }
    // halo behind
    glow(b.x, b.y - 0.45 * h, h * 0.75, P.gold, 0.11 * b.build);
    // floor contact + reflection
    ctx.save();
    const fl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, h * 0.45);
    fl.addColorStop(0, `rgba(201,162,74,${0.16 * b.build})`); fl.addColorStop(1, 'rgba(201,162,74,0)');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(b.x, b.y, h * 0.45, h * 0.05, 0, 0, 6.283); ctx.fill();
    gB.setTransform(1, 0, 0, 1, 0, 0); gB.clearRect(0, 0, bufB.width, bufB.height);
    gB.save(); gB.translate(0, size * 0.98 * 2 - size * 0.02); gB.scale(1, -1); gB.drawImage(bufA, 0, 0); gB.restore();
    gB.globalCompositeOperation = 'destination-in';
    const rg = gB.createLinearGradient(0, size * 0.98, 0, size * 0.98 + h * 0.3);
    rg.addColorStop(0, 'rgba(0,0,0,0.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    gB.fillStyle = rg; gB.fillRect(0, 0, size, bufB.height);
    gB.globalCompositeOperation = 'source-over';
    ctx.drawImage(bufB, 0, 0, size, size, b.x - size / 2, b.y - size * 0.98 + size * 0.0, size, size);
    ctx.drawImage(bufA, 0, 0, size, size, b.x - size / 2, b.y - size * 0.98, size, size);
    ctx.restore();
    return b;
  }

  // ---------- cards ----------
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function drawCards(t) {
    const C = L.benefits.card;
    const cards = TL.text.filter((x) => x.style === 'card');
    for (const c of cards) {
      if (t < c.in - 0.01 || t > c.out + 0.01) continue;
      const pin = E(t, c.in, c.in + TL.motion.cardIn);
      const pout = smooth(seg(t, c.out - TL.motion.cardOut, c.out));
      const a = pin * (1 - pout);
      if (a <= 0.002) continue;
      const dy = (1 - pin) * 70 * U - pout * 60 * U;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, dy);
      // frame
      const fg = ctx.createLinearGradient(C.x, C.y, C.x + C.w, C.y + C.h);
      fg.addColorStop(0, 'rgba(232,217,181,0.075)'); fg.addColorStop(1, 'rgba(232,217,181,0.02)');
      roundRect(ctx, C.x, C.y, C.w, C.h, 30 * U); ctx.fillStyle = fg; ctx.fill();
      const sg = ctx.createLinearGradient(C.x, C.y, C.x + C.w, C.y + C.h);
      sg.addColorStop(0, rgba(P.gold, 0.85)); sg.addColorStop(0.5, rgba(P.gold, 0.25)); sg.addColorStop(1, rgba(P.gold, 0.55));
      ctx.strokeStyle = sg; ctx.lineWidth = Math.max(1.5, 2 * U); ctx.stroke();
      // index
      const fi = FONTS.index;
      ctx.font = fontStr(fi, 64 * (FORMAT === '9x16' ? 1 : 0.85)); ctx.letterSpacing = `${fi.tracking * 64}px`;
      ctx.fillStyle = P.gold; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(c.index, C.x + 150, C.y + 98);
      // rule
      ctx.fillStyle = rgba(P.gold, 0.5); ctx.fillRect(C.x + 150 + 120 * U, C.y + 97, (C.w - 300 * U) * EASE(seg(t, c.in + 0.1, c.in + 0.8)), Math.max(1.5, 2 * U));
      ctx.restore();
      // text (own entrance for stagger)
      const f = FONTS.card;
      const { lines, size } = fitLines(COPY[c.id], f, L.benefits.textSize, C.w - 110, Math.min(L.benefits.textSize, MIN_TEXT()));
      const lh = size * f.lh;
      const top = C.y + 175 + (C.h - 175 - lines.length * lh) / 2 + lh / 2;
      lines.forEach((line, i) => {
        const st = c.in + 0.08 + i * 0.08;
        const p = E(t, st, st + 0.6);
        const aa = p * (1 - pout);
        if (aa <= 0.002) return;
        ctx.save(); ctx.globalAlpha = aa;
        if (p < 0.98) ctx.filter = `blur(${((1 - p) * 6).toFixed(2)}px)`;
        ctx.font = fontStr(f, size); ctx.letterSpacing = '0px'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillStyle = P.offwhite;
        ctx.fillText(line, C.x + 60, top + i * lh + dy + (1 - p) * 40 * U);
        ctx.restore();
      });
    }
  }

  // ---------- CTA ----------
  function drawCTA(t) {
    const C = L.cta;
    const wmItem = TL.text.find((x) => x.id === 'wordmark');
    if (t < wmItem.in) return;
    const wm = C.wordmark;
    const f = FONTS.wordmark;
    // logo (real asset if present, else typographic placeholder)
    const p = E(t, wmItem.in, wmItem.in + TL.motion.wordmarkIn);
    const buf = bufWM();
    const g = buf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, buf.width, buf.height);
    let ww;
    if (IMG.logo) {
      const ih = wm.size * 0.8, iw = (IMG.logo.width / IMG.logo.height) * ih;
      g.drawImage(IMG.logo, buf.width / 2 - iw / 2, buf.height / 2 - ih / 2, iw, ih); ww = iw;
    } else {
      const extra = (1 - p) * 0.1;
      g.font = fontStr(f, wm.size); g.letterSpacing = `${(f.tracking + extra) * wm.size}px`;
      g.textBaseline = 'middle'; g.textAlign = 'left';
      ww = g.measureText(COPY.wordmark).width - (f.tracking + extra) * wm.size;
      g.fillStyle = P.offwhite; g.fillText(COPY.wordmark, buf.width / 2 - ww / 2, buf.height / 2 + wm.size * 0.04);
    }
    // sheen across the logo
    const sh = seg(t, ...TL.fx.logoSheen);
    if (sh > 0 && sh < 1) {
      g.globalCompositeOperation = 'source-atop';
      const x = lerp(buf.width / 2 - ww * 0.7, buf.width / 2 + ww * 0.7, smooth(sh));
      const sg = g.createLinearGradient(x - wm.size * 0.6, 0, x + wm.size * 0.6, 0);
      sg.addColorStop(0, 'rgba(201,162,74,0)'); sg.addColorStop(0.5, 'rgba(232,200,120,0.95)'); sg.addColorStop(1, 'rgba(201,162,74,0)');
      g.fillStyle = sg; g.fillRect(0, 0, buf.width, buf.height);
      g.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.globalAlpha = p;
    if (p < 0.98) ctx.filter = `blur(${((1 - p) * 10 * U).toFixed(2)}px)`;
    ctx.drawImage(buf, wm.x - buf.width / 2, wm.y - buf.height / 2 + (1 - p) * 30 * U);
    ctx.restore();
    // underline drawn from the droplet's landing point
    const lk = E(t, TL.droplet.impacts[2].t, TL.droplet.impacts[2].t + TL.motion.underlineDraw);
    if (lk > 0) {
      const half = (ww * 0.42) * lk;
      const lg = ctx.createLinearGradient(wm.x - half, 0, wm.x + half, 0);
      lg.addColorStop(0, rgba(P.gold, 0)); lg.addColorStop(0.2, rgba(P.gold, 0.9)); lg.addColorStop(0.8, rgba(P.gold, 0.9)); lg.addColorStop(1, rgba(P.gold, 0));
      ctx.fillStyle = lg; ctx.fillRect(wm.x - half, ctaLine() - 1.5 * U, half * 2, Math.max(2, 3 * U));
    }
    const urlItem = TL.text.find((x) => x.id === 'url');
    const offItem = TL.text.find((x) => x.id === 'offer');
    textBlock('url', 'url', { ...C.url, align: 'center', maxW: C.maxW }, urlItem.in, urlItem.out, t, { dIn: TL.motion.ctaLineIn });
    textBlock('offer', 'offer', { ...C.offer, align: 'center', maxW: C.maxW }, offItem.in, offItem.out, t, { dIn: TL.motion.ctaLineIn });
  }
  let _wm;
  function bufWM() { if (!_wm) { _wm = document.createElement('canvas'); _wm.width = Math.round(W * 1.0); _wm.height = Math.round(L.cta.wordmark.size * 1.6); } return _wm; }

  // ---------- frame ----------
  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = P.black; ctx.fillRect(0, 0, W, H);

    const T = Object.fromEntries(TL.transitions.map((x) => [x.id, x]));
    // scene 1 surface fades as the ripple wipe takes over
    drawSurface(t, 1 - E(t, T.T1.start + 0.2, T.T1.end));
    // scene 2 skin: revealed by ripple wipe (T1), dissolved by the droplet swell (T2)
    drawSkin(t, seg(t, T.T1.start, T.T1.end + 0.3), seg(t, T.T2.start + 0.2, T.T2.start + 1.1));
    const [lx, ly] = anchor('hook.dropLand');
    ripples(t, TL.droplet.impacts[0].t, lx, ly + dropR() * 0.92, Math.max(W, H) * 0.5);

    // hero product (scenes 3–5)
    const bs = drawBottle(t);

    // droplet reflection on the hook surface
    const d = dropletState(t);
    if (t < T.T1.start + 0.4) {
      const hy = ly + dropR() * 0.92;
      const near = 1 - clamp((hy - (d.y + d.r)) / (dropR() * 0.8));
      ctx.save(); ctx.globalAlpha = 0.12 * near * near * (1 - seg(t, T.T1.start, T.T1.start + 0.4));
      ctx.translate(0, hy); ctx.scale(1, -0.45); ctx.translate(0, -hy);
      drawDroplet(d.x, d.y, d.r, d.tip, d.angle, 0, d.alpha);
      ctx.restore();
    }
    // bloom when the droplet condenses into the serum
    const bl = TL.droplet.impacts[1];
    if (t > bl.t - 0.2 && t < bl.t + 1.2) {
      const k = t < bl.t ? smooth(seg(t, bl.t - 0.2, bl.t)) : Math.exp(-(t - bl.t) * TL.fx.bloomDecay);
      const [bx, by] = anchor('reveal.liquid');
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(bx, by, Math.min(W, H) * 0.75, P.champagne, 0.28 * k);
      ctx.restore();
    }
    const dropOnTop = t > TL.fx.dropOnTopAfter;
    if (!dropOnTop) drawDroplet(d.x, d.y, d.r, d.tip, d.angle, d.squash, d.alpha);
    // ring when droplet lands on logo line
    const li = TL.droplet.impacts[2];
    if (t > li.t && t < li.t + 1.2) ripples(t, li.t, d.x, ctaLine(), Math.min(W, H) * 0.35, 0.6);

    // ---------- type ----------
    const tx = Object.fromEntries(TL.text.map((x) => [x.id, x]));
    textBlock('hook', 'hook', L.hook.text, tx.hook.in, tx.hook.out, t, { goldPunct: true, stagger: 0.07 });
    textBlock('pores', 'headline', L.tension.text, tx.pores.in, tx.pores.out, t, { shadow: true });
    textBlock('dull', 'headline', L.tension.text, tx.dull.in, tx.dull.out, t, { shadow: true });
    textBlock('newEyebrow', 'eyebrow', { ...L.reveal.eyebrow, maxW: 900 }, tx.newEyebrow.in, tx.newEyebrow.out, t);
    textBlock('product', 'title', L.reveal.title, tx.product.in, tx.product.out, t);
    drawCards(t);
    // droplet as card bullet sits above the card
    drawCTA(t);
    if (dropOnTop) drawDroplet(d.x, d.y, d.r, d.tip, d.angle, d.squash, d.alpha);

    vignette(0.55);
    if (GRAIN && grainTiles.length) {
      const fi = Math.floor(t * TL.meta.fps / 2) % 4;
      ctx.save(); ctx.globalAlpha = TL.meta.grain.canvasPreviewAlpha; ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = ctx.createPattern(grainTiles[fi], 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    if (SAFE_OVERLAY) {
      const s = TL.formats[FORMAT].safe;
      ctx.save(); ctx.fillStyle = 'rgba(255,0,60,0.18)';
      ctx.fillRect(0, 0, W, s.top); ctx.fillRect(0, H - s.bottom, W, s.bottom); ctx.fillRect(W - s.right, 0, s.right, H); ctx.fillRect(0, 0, s.left, H);
      ctx.restore();
    }
  }

  // ---------- boot ----------
  function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  async function boot() {
    TL = window.__TIMELINE__ || (await (await fetch('../timeline.json')).json());
    EASE = bezier(...TL.meta.easing);
    const F = TL.formats[FORMAT];
    W = F.w; H = F.h; U = Math.min(W, H) / 1080; L = LAYOUTS[FORMAT];
    COPY = TL.copy[LANG];
    canvas = document.getElementById('stage'); canvas.width = W; canvas.height = H;
    if (CFG.render) { canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
    ctx = canvas.getContext('2d');
    const A = window.__ASSETS__ || {};
    for (const k of ['logo', 'product']) {
      const cands = A[k] ? [A[k]] : (RENDER ? [] : [`../assets/${k}.svg`, `../assets/${k}.png`]);
      for (const c of cands) { const im = await loadImg(c); if (im) { IMG[k] = im; break; } }
    }
    await document.fonts.ready;
    for (const f of Object.values(FONTS)) await document.fonts.load(fontStr(f, 40), 'ÁÉ¿?ñ');
    buildGrain(TL.meta.seed); buildSkin(TL.meta.seed); paintSkinTexture(); // heavy one-time paint before any seek
    window.DURATION = TL.meta.duration; window.FPS = TL.meta.fps;
    window.seek = (t) => { render(t); return true; };
    render(window.__PENDING_T__ ?? 0);
    if (!RENDER) previewUI();
    window.__READY__ = true;
  }

  function previewUI() {
    const scrub = document.getElementById('scrub'), tc = document.getElementById('tc'), btn = document.getElementById('play');
    scrub.max = TL.meta.duration;
    const go = (t) => { render(t); tc.textContent = t.toFixed(2) + 's'; scrub.value = t; };
    scrub.oninput = () => go(+scrub.value);
    let playing = false, t0 = 0, s0 = 0;
    btn.onclick = () => { playing = !playing; btn.textContent = playing ? '❚❚ Pause' : '▶︎ Play'; t0 = performance.now(); s0 = +scrub.value; if (playing) requestAnimationFrame(loop); };
    function loop(now) { if (!playing) return; let t = s0 + (now - t0) / 1000; if (t > TL.meta.duration) { t0 = now; s0 = 0; t = 0; } go(t); requestAnimationFrame(loop); }
  }

  boot();
})();
