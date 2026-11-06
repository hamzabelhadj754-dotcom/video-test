/* Text-animation library (the brief's named effects) + 3D wiring helpers.
   Every effect is a set of GSAP tweens placed on a paused timeline at an absolute time:
   seekable, deterministic, transforms/opacity/filter/stroke-dashoffset only. */
(function () {
  const FX = (window.FX = {});
  FX.rng = (s) => function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const $ = (s) => (typeof s === "string" ? document.querySelector(s) : s);

  FX.chars = function (el) {
    el = $(el); if (el.dataset.split) return [...el.querySelectorAll(".fx-ch")];
    const txt = el.textContent; el.dataset.split = 1; el.textContent = "";
    [...txt].forEach((c) => { const s = document.createElement("span"); s.className = "fx-ch"; s.style.display = "inline-block"; s.style.whiteSpace = "pre"; s.textContent = c; el.appendChild(s); });
    return [...el.querySelectorAll(".fx-ch")];
  };
  FX.words = function (el, masked) {
    el = $(el); if (el.dataset.splitw) return [...el.querySelectorAll(".fx-w")];
    const parts = el.textContent.split(" "); el.dataset.splitw = 1; el.textContent = "";
    parts.forEach((w, i) => { const m = document.createElement("span"); m.style.display = "inline-block"; if (masked) { m.style.overflow = "hidden"; m.style.verticalAlign = "top"; m.style.paddingBottom = ".08em"; }
      const s = document.createElement("span"); s.className = "fx-w"; s.style.display = "inline-block"; s.textContent = w; m.appendChild(s); el.appendChild(m); if (i < parts.length - 1) el.appendChild(document.createTextNode(" ")); });
    return [...el.querySelectorAll(".fx-w")];
  };

  // 1 Slam-in: scale 1.6→1, expo.out 0.35 s, vertical smear on the first frames
  FX.slam = function (tl, el, t, o = {}) {
    tl.fromTo(el, { opacity: 0, scale: o.from || 1.6, scaleY: (o.from || 1.6) * 1.5, filter: "blur(10px)" },
      { opacity: 1, scale: 1, scaleY: 1, filter: "blur(0px)", duration: o.d || 0.35, ease: "expo.out" }, t);
  };
  // 3 Char cascade 3D: rotateX(-90→0) from the baseline, 0.03 s stagger
  FX.cascade = function (tl, el, t, o = {}) {
    const cs = FX.chars(el);
    tl.fromTo(cs, { rotationX: -90, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 600 },
      { rotationX: 0, opacity: 1, duration: o.d || 0.6, ease: "power4.out", stagger: o.stagger || 0.03 }, t);
  };
  // 4 Mask rise: words rise from behind a clip line
  FX.maskRise = function (tl, el, t, o = {}) {
    const ws = FX.words(el, true);
    tl.fromTo(ws, { yPercent: 110 }, { yPercent: 0, duration: o.d || 0.6, ease: "expo.out", stagger: o.stagger || 0.05 }, t);
    return ws;
  };
  // per-word timing (driven by VO word times)
  FX.maskRiseAt = function (tl, el, times, o = {}) {
    const ws = FX.words(el, true);
    ws.forEach((w, i) => tl.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: o.d || 0.55, ease: "expo.out" }, times[Math.min(i, times.length - 1)]));
    return ws;
  };
  // 5 Tracking collapse: wide spacing → tight, done with per-glyph x so it stays sub-pixel smooth
  FX.tracking = function (tl, el, t, o = {}) {
    const cs = FX.chars(el), c0 = (cs.length - 1) / 2, spread = o.spread || 34;
    cs.forEach((c, i) => tl.fromTo(c, { x: (i - c0) * spread, opacity: 0, filter: "blur(10px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: o.d || 0.9, ease: "expo.out" }, t));
  };
  // 6 Outline → fill: SVG text stroke draws, then the fill wipes in left→right
  FX.outlineFill = function (tl, strokeEl, fillClipRect, t, o = {}) {
    strokeEl = $(strokeEl); const len = o.len || 3000;
    tl.fromTo(strokeEl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: o.draw || 0.7, ease: "power2.inOut" }, t);
    tl.fromTo(fillClipRect, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: o.fill || 0.5, ease: "power3.inOut" }, t + (o.draw || 0.7) * 0.75);
  };
  // 8 Word swap morph: old slides up and blurs out, new slides up from below in the same slot
  FX.swap = function (tl, oldEl, newEl, t) {
    tl.to(oldEl, { yPercent: -60, opacity: 0, filter: "blur(10px)", duration: 0.35, ease: "power3.in" }, t);
    tl.fromTo(newEl, { yPercent: 70, opacity: 0, filter: "blur(10px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, t + 0.18);
  };
  // 9 Highlight sweep: a marker scales in behind a word
  FX.highlight = function (tl, bar, t, d) { tl.fromTo(bar, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: d || 0.45, ease: "power3.inOut" }, t); };
  // 10 Scramble decode: seeded glyphs resolve left→right
  FX.scramble = function (tl, el, t, o = {}) {
    el = $(el); const final = o.text || el.textContent, r = FX.rng(o.seed || 7), G = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789";
    const noise = []; for (let i = 0; i < 64; i++) noise.push([...final].map(() => G[Math.floor(r() * G.length)]));
    const p = { v: 0 }; const d = o.d || 0.45;
    tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: "none", onUpdate: () => {
      const n = Math.floor(p.v * final.length * 1.0001), f = Math.floor(p.v * 63);
      el.textContent = [...final].map((c, i) => (i < n || c === " " ? c : noise[f][i])).join("");
    } }, t);
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, t);
  };
  // 2 Split-flap counter: every digit is a rolling column; values change at given times
  FX.flap = function (tl, el, values, times, o = {}) {
    el = $(el); const width = Math.max(...values.map((v) => String(v).length));
    el.innerHTML = ""; el.style.display = "inline-flex";
    const lh = o.lh || 1.0, cols = [];
    for (let i = 0; i < width; i++) {
      const win = document.createElement("span"); win.style.cssText = `display:inline-block;overflow:hidden;height:${lh}em;line-height:${lh}em;vertical-align:top`;
      const col = document.createElement("span"); col.style.cssText = "display:block"; col.className = "fx-flapcol";
      const glyphs = "0123456789. "; [...glyphs].forEach((g) => { const s = document.createElement("span"); s.style.cssText = `display:block;height:${lh}em`; s.textContent = g === " " ? " " : g; col.appendChild(s); });
      win.appendChild(col); el.appendChild(win); cols.push(col);
    }
    const glyphs = "0123456789. ";
    const idxOf = (v) => String(v).padStart(width, " ").split("").map((c) => glyphs.indexOf(c));
    const first = idxOf(values[0]);
    cols.forEach((c, i) => tl.set(c, { yPercent: -first[i] * (100 / glyphs.length) }, 0));
    values.slice(1).forEach((v, k) => { const ix = idxOf(v);
      cols.forEach((c, i) => tl.to(c, { yPercent: -ix[i] * (100 / glyphs.length), duration: 0.32, ease: "back.out(1.4)" }, times[k] + (width - 1 - i) * 0.04)); });
  };
  // camera shake on a wrapper (frames at 30 fps)
  FX.shake = function (tl, el, t, amt, seed, frames) {
    const r = FX.rng(seed || 1); let tt = t; const n = frames || 3;
    for (let i = 0; i < n; i++) { const k = 1 - i / n; tl.to(el, { x: (r() - 0.5) * amt * k, y: (r() - 0.5) * amt * k, duration: 1 / 30, ease: "none" }, tt); tt += 1 / 30; }
    tl.to(el, { x: 0, y: 0, duration: 0.08, ease: "power2.out" }, tt);
  };
  // FG dust (out of focus, seeded) + parallax drift on its wrapper
  FX.dust = function (el, seed, n, zone) {
    el = $(el); const r = FX.rng(seed); const [x0, y0, x1, y1] = zone || [0, 0, 1080, 1920];
    for (let i = 0; i < n; i++) { const d = document.createElement("i"), s = 4 + r() * 16; d.style.cssText = `position:absolute;display:block;border-radius:50%;background:rgba(240,236,228,.6);width:${s}px;height:${s}px;left:${x0 + r() * (x1 - x0)}px;top:${y0 + r() * (y1 - y0)}px;opacity:${(0.15 + r() * 0.5).toFixed(2)}`; el.appendChild(d); }
  };

  // ---- 3D wiring: render from a pure function of local time ----
  FX.wire3D = function (tl, key, model, stateAt, START, DUR) {
    const drv = { t: 0 };
    tl.fromTo(drv, { t: 0 }, { t: DUR, duration: DUR, ease: "none", onUpdate: () => model.render(stateAt(drv.t)) }, 0);
    window.addEventListener("hf-seek", (e) => { const d = e && e.detail; if (!d || typeof d.time !== "number") return; const lt = d.time - START; if (lt >= -0.001 && lt <= DUR + 0.001) model.render(stateAt(Math.max(0, Math.min(DUR, lt)))); });
    window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
    window.__hf.buildReady[key] = model.ready.then(() => model.render(stateAt(0)));
  };
  // piecewise keyframe interpolation for camera/state paths: keys = [[t, {..}], ...], ease per segment
  FX.path = function (keys, ease) {
    const E = { io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), lin: (x) => x, out: (x) => 1 - Math.pow(1 - x, 3), in: (x) => x * x * x, sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2 };
    return function (t) {
      if (t <= keys[0][0]) return { ...keys[0][1] };
      for (let i = 0; i < keys.length - 1; i++) { const [a, A, ea] = keys[i], [b, B] = keys[i + 1];
        if (t <= b) { const k = (E[ea || ease || "io"])((t - a) / (b - a)); const o = {}; for (const p in B) o[p] = (A[p] ?? B[p]) + (B[p] - (A[p] ?? B[p])) * k; for (const p in A) if (!(p in o)) o[p] = A[p]; return o; } }
      return { ...keys[keys.length - 1][1] };
    };
  };
})();
