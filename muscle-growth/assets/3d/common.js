/* Shared Three.js setup for the film's 3D heroes (r147, classic scripts, global THREE).
   Everything is a pure function of the state passed to render(): no clock, no rAF. */
(function () {
  const MG = (window.MG3D = window.MG3D || {});
  const T = THREE;

  MG.LIME = new T.Color("#C6FF3D");
  MG.CYAN = new T.Color("#3DD6FF");
  MG.KEY = new T.Color("#fff1df");

  MG.rng = function (s) { return function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  MG.renderer = function (canvas, w, h) {
    const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    r.setPixelRatio(1); r.setSize(w, h, false);
    r.outputEncoding = T.sRGBEncoding;
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.physicallyCorrectLights = true;
    r.setClearColor(0x000000, 0);
    return r;
  };

  // studio HDRI (Poly Haven, CC0) → PMREM; falls back to RoomEnvironment
  const envCache = new WeakMap();
  MG.env = function (renderer, base) {
    if (envCache.has(renderer)) return envCache.get(renderer);
    const pm = new T.PMREMGenerator(renderer);
    const pr = new Promise((resolve) => {
      const fallback = () => resolve(pm.fromScene(new T.RoomEnvironment(), 0.04).texture);
      if (!T.RGBELoader) return fallback();
      new T.RGBELoader().load((base || "assets/") + "hdri/studio_small_09_1k.hdr", (tex) => { resolve(pm.fromEquirectangular(tex).texture); tex.dispose(); }, undefined, fallback);
    });
    envCache.set(renderer, pr);
    return pr;
  };

  // ---- procedural textures (seeded, deterministic) ----
  MG.canvasTex = function (w, h, draw, repeat) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8; return t;
  };
  MG.noiseTex = function (seed, size, amp) {
    const r = MG.rng(seed);
    return MG.canvasTex(size, size, (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { const v = 128 + (r() - 0.5) * 255 * amp; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
      g.putImageData(img, 0, 0);
    });
  };
  // muscle tissue: fibres along V (length), fine cross-striations along U
  MG.tissueTex = function (seed, base, opts) {
    const r = MG.rng(seed); opts = opts || {};
    return MG.canvasTex(512, 1024, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const x = r() * w, lw = 1 + r() * 3; g.strokeStyle = `rgba(${r() < 0.5 ? "255,190,180" : "40,4,6"},${0.05 + r() * 0.12})`; g.lineWidth = lw;
        g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y / 180 + i) * 3, y); g.stroke(); }
      if (opts.bands) for (let y = 0; y < h; y += opts.bands) { g.fillStyle = opts.soft ? "rgba(20,0,2,.09)" : "rgba(20,0,2,.18)"; g.fillRect(0, y, w, opts.bands * 0.35); g.fillStyle = opts.soft ? "rgba(255,200,190,.03)" : "rgba(255,200,190,.05)"; g.fillRect(0, y + opts.bands * 0.5, w, 2); }
    });
  };
  MG.radialTex = function (inner, outer) {
    return MG.canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  };
  MG.glowSprite = function (color, size, opacity) {
    const m = new T.SpriteMaterial({ map: MG.radialTex("rgba(255,255,255,1)", "rgba(255,255,255,0)"), color, transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending });
    const s = new T.Sprite(m); s.scale.set(size, size, 1); return s;
  };

  MG.lights = function (scene, o) {
    o = o || {};
    const key = new T.DirectionalLight(MG.KEY, o.key ?? 3.2); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new T.DirectionalLight(MG.CYAN, o.rim ?? 2.4); rim.position.set(4, 1.5, -4); scene.add(rim);
    const rim2 = new T.DirectionalLight(0xffffff, o.rim2 ?? 0.6); rim2.position.set(-4, -1, -3); scene.add(rim2);
    const amb = new T.AmbientLight(0x404048, o.amb ?? 0.25); scene.add(amb);
    return { key, rim, rim2, amb };
  };

  MG.composer = function (renderer, scene, camera, w, h, o) {
    o = o || {};
    const c = new T.EffectComposer(renderer); c.setPixelRatio(1); c.setSize(w, h);
    c.addPass(new T.RenderPass(scene, camera));
    let bokeh = null, bloom = null;
    if (o.bokeh) { bokeh = new T.BokehPass(scene, camera, { focus: o.bokeh.focus, aperture: o.bokeh.aperture, maxblur: o.bokeh.maxblur, width: w, height: h }); c.addPass(bokeh); }
    if (o.bloom) { bloom = new T.UnrealBloomPass(new T.Vector2(w, h), o.bloom.strength, o.bloom.radius, o.bloom.threshold); c.addPass(bloom); }
    // composer works in linear space: convert to sRGB at the end so colours match a direct render
    if (T.GammaCorrectionShader) c.addPass(new T.ShaderPass(T.GammaCorrectionShader));
    return { composer: c, bokeh, bloom };
  };
})();
