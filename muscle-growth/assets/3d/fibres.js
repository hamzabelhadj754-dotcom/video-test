/* Inside the muscle: a bundle of striated muscle fibres running up the frame. Some carry microtears;
   lime repair strands knit across the gaps; depth of field and bloom on the repair zone only.
   state: { t (s, for drift), tear: 0..1, repair: 0..1, thick: 0..1, camZ, camY, camX, lookY, focus, aperture } */
(function () {
  const MG = window.MG3D, T = THREE;
  MG.fibres = function (canvas, w, h, base) {
    const renderer = MG.renderer(canvas, w, h);
    const scene = new T.Scene(); scene.background = new T.Color("#08090B");
    scene.fog = new T.FogExp2("#0a0608", 0.085);
    const camera = new T.PerspectiveCamera(s0fov(), w / h, 0.05, 200); function s0fov() { return 46; }
    const L = MG.lights(scene, { key: 2.6, rim: 0.9, rim2: 0.3, amb: 0.03 });
    const warm = new T.PointLight("#ff8a70", 3, 12, 2); warm.position.set(-1.5, 0.5, 2.5); scene.add(warm);
    [L.key, L.rim, L.rim2, L.amb, warm].forEach((l) => l.layers.enableAll());

    const tex = MG.tissueTex(3, "#5a1c1f", { bands: 12, soft: true }); tex.repeat.set(1, 9);
    const btex = MG.tissueTex(4, "#7f7f7f", { bands: 12, soft: true }); btex.repeat.set(1, 9);
    const mat = new T.MeshPhysicalMaterial({ color: "#a2504d", map: tex, bumpMap: btex, bumpScale: 0.02, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35,
      sheen: 0.5, sheenColor: new T.Color("#ff9d8f"), sheenRoughness: 0.5, envMapIntensity: 0.25 });
    const frayMat = new T.MeshPhysicalMaterial({ color: "#8a3c3a", roughness: 0.5, clearcoat: 0.3, envMapIntensity: 0.2 });

    const R = 0.36, LEN = 30, r = MG.rng(41);
    // hex-packed bundle, axis = Y
    const centres = [];
    for (let q = -3; q <= 3; q++) for (let s = -3; s <= 3; s++) {
      const x = (q + s * 0.5) * R * 2.08, z = s * R * 1.8;
      if (Math.hypot(x, z) < R * 6.6) centres.push([x + (r() - 0.5) * 0.05, z + (r() - 0.5) * 0.05]);
    }
    const tearIdx = new Set(); centres.forEach((c, i) => { if (c[1] > 1.2 && Math.abs(c[0]) < 1.3 && r() < 0.8) tearIdx.add(i); });
    const group = new T.Group(); scene.add(group);
    const fibres = [], repairs = [];
    const geoFull = new T.CylinderGeometry(R, R, LEN, 56, 1, true);
    centres.forEach((c, i) => {
      const tear = tearIdx.has(i);
      const gy = (r() - 0.5) * 1.6, gh = 0.9 + r() * 0.6;   // gap centre, gap height
      if (!tear) { const m = new T.Mesh(geoFull, mat); m.position.set(c[0], 0, c[1]); group.add(m); fibres.push({ m, c, tear }); return; }
      const lo = new T.Mesh(new T.CylinderGeometry(R, R, LEN / 2 + gy - gh / 2, 56, 1, true), mat), hi = new T.Mesh(new T.CylinderGeometry(R, R, LEN / 2 - gy - gh / 2, 56, 1, true), mat);
      lo.position.set(c[0], -LEN / 4 + (gy - gh / 2) / 2, c[1]); hi.position.set(c[0], LEN / 4 + (gy + gh / 2) / 2, c[1]);
      group.add(lo, hi);
      // frayed fibrils at both torn ends
      const fray = new T.Group(); fray.position.set(c[0], 0, c[1]); group.add(fray);
      for (let k = 0; k < 22; k++) { const a = r() * Math.PI * 2, rr = r() * R * 0.85, l = 0.08 + r() * 0.22, up = k % 2 ? 1 : -1;
        const f = new T.Mesh(new T.CylinderGeometry(0.008, 0.016, l, 5), frayMat);
        f.position.set(Math.cos(a) * rr, gy + up * (gh / 2 - l / 2 + 0.02), Math.sin(a) * rr); f.rotation.set((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4); fray.add(f); }
      // repair strands across the gap (lime, additive) + halo + glow sprites
      const strands = [];
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + r(), rr = R * (0.25 + r() * 0.55);
        const p0 = new T.Vector3(Math.cos(a) * rr, gy - gh / 2 - 0.05, Math.sin(a) * rr), p2 = new T.Vector3(Math.cos(a + 0.4) * rr, gy + gh / 2 + 0.05, Math.sin(a + 0.4) * rr);
        const mid = [0.33, 0.66].map((k2) => p0.clone().lerp(p2, k2).add(new T.Vector3((r() - 0.5) * 0.1, 0, (r() - 0.5) * 0.1)));
        const curve = new T.CatmullRomCurve3([p0, ...mid, p2]);
        const core = new T.Mesh(new T.TubeGeometry(curve, 48, 0.009, 6, false), new T.MeshBasicMaterial({ color: "#d9ff7a", transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
        const halo = new T.Mesh(new T.TubeGeometry(curve, 48, 0.045, 10, false), new T.MeshBasicMaterial({ color: MG.LIME, transparent: true, opacity: 0.24, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
        core.position.set(c[0], 0, c[1]); halo.position.copy(core.position); group.add(core, halo); strands.push({ core, halo }); }
      const glow = MG.glowSprite(MG.LIME, gh * 1.5, 0); glow.material.toneMapped = false; glow.position.set(c[0], gy, c[1]); group.add(glow);
      repairs.push({ strands, glow, lo, hi, fray });
      fibres.push({ m: null, c, tear });
    });
    // floating debris / amino-acid motes (seeded, drift is a function of t)
    const N = 220, pp = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) seeds.push([(r() - 0.5) * 7, (r() - 0.5) * 14, (r() - 0.5) * 7, r()]);
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ size: 0.035, color: "#ffd9cf", transparent: true, opacity: 0.55, map: MG.radialTex("rgba(255,255,255,1)", "rgba(255,255,255,0)"), depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(pts);

    const ready = MG.env(renderer, base).then((env) => { scene.environment = env; });

    function render(s) {
      s = s || {};
      const t = s.t ?? 0, tear = s.tear ?? 1, rep = s.repair ?? 0.6, th = 1 + (s.thick ?? 0) * 0.12;
      group.children.forEach((o) => { if (o.geometry && o.geometry.type === "CylinderGeometry" && o.geometry.parameters.radiusTop === R) o.scale.set(th, 1, th); });
      repairs.forEach((q, i) => {
        q.fray.scale.setScalar(0.4 + 0.6 * tear); q.fray.visible = tear > 0.02;
        q.strands.forEach((st, k) => { const n = st.core.geometry.index.count; const grow = Math.max(0, Math.min(1, rep * 1.25 - k * 0.04));
          st.core.geometry.setDrawRange(0, Math.floor(grow * n / 6) * 6); st.halo.geometry.setDrawRange(0, Math.floor(grow * st.halo.geometry.index.count / 6) * 6); st.core.visible = st.halo.visible = grow > 0.01; });
        q.glow.material.opacity = 0.22 * Math.min(1, rep * 1.4) * tear;
      });
      for (let i = 0; i < N; i++) { const sd = seeds[i]; pp[i * 3] = sd[0] + Math.sin(t * 0.3 + sd[3] * 6) * 0.15; pp[i * 3 + 1] = ((sd[1] + t * (0.12 + sd[3] * 0.2) + 7) % 14) - 7; pp[i * 3 + 2] = sd[2] + Math.cos(t * 0.25 + sd[3] * 5) * 0.15; }
      pg.attributes.position.needsUpdate = true;
      group.rotation.set(s.rx ?? 1.05, s.ry ?? 0, s.rz ?? 0.5);
      camera.position.set(s.camX ?? 0.6, s.camY ?? -3.4, s.camZ ?? 4.6); camera.lookAt(s.lookX ?? 0.2, s.lookY ?? 0.6, s.lookZ ?? 0.6);
      const out = s.layers;
      if (!out) { camera.layers.enableAll(); renderer.render(scene, camera); return; }
      // depth bands for real depth of field: near / focus / far, each composited (and blurred) in the DOM
      const f = s.focus ?? camera.position.distanceTo(new T.Vector3(s.lookX ?? 0.2, s.lookY ?? 0.6, s.lookZ ?? 0.6));
      const band = (o) => { const d = o.getWorldPosition(new T.Vector3()).distanceTo(camera.position) - f; return d < -(s.nearBand ?? 1.4) ? 0 : d > (s.farBand ?? 1.6) ? 2 : 1; };
      group.children.forEach((o) => { o.layers.set(band(o)); }); pts.layers.set(0);
      const keepBg = scene.background;
      ["near", "mid", "far"].forEach((k, i) => { const li = [0, 1, 2][i]; camera.layers.set(li);
        scene.background = k === "far" ? keepBg : null; renderer.setClearColor(0x000000, 0); renderer.clear();
        renderer.render(scene, camera); const c = out[k]; if (c) { const g2 = c.getContext("2d"); g2.clearRect(0, 0, c.width, c.height); g2.drawImage(renderer.domElement, 0, 0, c.width, c.height); } });
      scene.background = keepBg;
    }
    return { ready, render, renderer };
  };
})();
