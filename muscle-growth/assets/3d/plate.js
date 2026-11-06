/* Olympic bumper plate: rubber body, steel hub, raised lettering, chalk burst on impact.
   state: { drop: 0..1 (1 = in the air, 0 = landed), spin: rad, impact: seconds since impact (or <0), camZ, camY, yaw } */
(function () {
  const MG = window.MG3D, T = THREE;
  MG.plate = function (canvas, w, h, base) {
    const renderer = MG.renderer(canvas, w, h);
    const scene = new T.Scene(); scene.background = new T.Color("#08090B");
    const camera = new T.PerspectiveCamera(26, w / h, 0.1, 100);
    const L = MG.lights(scene, { key: 2.4, rim: 2.2, rim2: 0.5, amb: 0.08 });

    // ---- plate geometry: lathe profiles (axis = Y, then turned to face the camera) ----
    const rubberProfile = [
      [0.235, -0.150], [0.300, -0.150], [0.320, -0.142], [0.860, -0.142], [0.900, -0.165], [0.965, -0.172], [0.995, -0.155], [1.000, -0.120],
      [1.000, 0.120], [0.995, 0.155], [0.965, 0.172], [0.900, 0.165], [0.860, 0.142], [0.320, 0.142], [0.300, 0.150], [0.235, 0.150],
    ].map(([r, y]) => new T.Vector2(r, y));
    const hubProfile = [[0.112, -0.185], [0.150, -0.185], [0.240, -0.168], [0.240, 0.168], [0.150, 0.185], [0.112, 0.185], [0.112, -0.185]].map(([r, y]) => new T.Vector2(r, y));
    const rubberGeo = new T.LatheGeometry(rubberProfile, 160);
    const hubGeo = new T.LatheGeometry(hubProfile, 128);
    const bump = MG.noiseTex(11, 256, 0.9); bump.repeat.set(6, 3);
    const rubber = new T.MeshStandardMaterial({ color: "#0d0e11", roughness: 0.72, metalness: 0, bumpMap: bump, bumpScale: 0.0015, envMapIntensity: 0.18 });
    const steel = new T.MeshStandardMaterial({ color: "#c9ccd2", roughness: 0.38, metalness: 1, envMapIntensity: 0.55 });
    const plate = new T.Group();
    const body = new T.Mesh(rubberGeo, rubber), hub = new T.Mesh(hubGeo, steel);
    body.rotation.x = hub.rotation.x = Math.PI / 2;
    plate.add(body, hub);
    // raised face lettering (both faces), painted off-white like real bumpers
    const face = MG.canvasTex(1024, 1024, (g, W, H) => {
      g.clearRect(0, 0, W, H); g.translate(W / 2, H / 2);
      g.fillStyle = "rgba(214,216,221,.85)"; g.font = "700 150px Anton, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("20", 0, -300); g.font = "700 56px 'JetBrains Mono', monospace"; g.fillText("K G", 0, 318);
      g.strokeStyle = "rgba(226,228,233,.35)"; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 420, 0, Math.PI * 2); g.stroke();
      g.font = "600 30px 'JetBrains Mono', monospace"; g.fillStyle = "rgba(226,228,233,.45)";
      const s = "OLYMPIC · BUMPER · 450 MM · ", n = s.length * 2; for (let i = 0; i < n; i++) { g.save(); g.rotate((i / n) * Math.PI * 2); g.fillText(s[i % s.length], 0, -455); g.restore(); }
    }); face.wrapS = face.wrapT = T.ClampToEdgeWrapping;
    const decalMat = new T.MeshStandardMaterial({ map: face, transparent: true, roughness: 0.6, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const d1 = new T.Mesh(new T.CircleGeometry(1.0, 96), decalMat); d1.position.z = 0.1425; plate.add(d1);
    scene.add(plate);

    // contact shadow + floor sheen
    const shadow = new T.Mesh(new T.PlaneGeometry(3.4, 1.0), new T.MeshBasicMaterial({ map: MG.radialTex("rgba(0,0,0,.95)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.0; scene.add(shadow);
    const floor = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshStandardMaterial({ color: "#0a0b0e", roughness: 0.42, metalness: 0.0, envMapIntensity: 0.12, transparent: true, alphaMap: MG.radialTex("rgba(255,255,255,1)", "rgba(0,0,0,1)"), depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.002; scene.add(floor);

    // chalk burst: seeded particles, positions are a pure function of time since impact
    const N = 160, r = MG.rng(77), seeds = [];
    const pg = new T.BufferGeometry(); const pos = new Float32Array(N * 3); pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    for (let i = 0; i < N; i++) { const a = r() * Math.PI * 2, sp = 0.6 + r() * 2.2; seeds.push({ x: (r() - 0.5) * 1.6, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.6, vy: 0.4 + r() * 1.6, s: r() }); }
    const pm = new T.PointsMaterial({ size: 0.045, color: "#e9e6df", transparent: true, opacity: 0.0, depthWrite: false, map: MG.radialTex("rgba(255,255,255,1)", "rgba(255,255,255,0)"), blending: T.AdditiveBlending, sizeAttenuation: true });
    const pts = new T.Points(pg, pm); scene.add(pts);

    let ready = MG.env(renderer, base).then((env) => { scene.environment = env; });

    function render(s) {
      s = s || {};
      const drop = s.drop ?? 0, spin = s.spin ?? 0, imp = s.impact ?? -1;
      plate.position.y = drop * 5.5;
      plate.rotation.set(s.tilt ?? 0.0, s.yaw ?? -0.42, spin);
      // squash on impact (rubber), decays in 0.25 s
      const sq = imp >= 0 ? Math.exp(-imp * 18) * Math.sin(imp * 60) * 0.03 : 0;
      plate.scale.set(1 + sq, 1 - sq, 1);
      shadow.material.opacity = 0.9 * Math.max(0, 1 - drop * 1.4); shadow.scale.set(1 + drop * 1.5, 1, 1);
      // chalk
      if (imp >= 0) { for (let i = 0; i < N; i++) { const q = seeds[i], t = Math.min(imp, 3);
        pos[i * 3] = q.x + q.vx * (1 - Math.exp(-t * 2.2)) * 0.9; pos[i * 3 + 1] = -0.98 + q.vy * t * Math.exp(-t * 1.4) * 0.9; pos[i * 3 + 2] = 0.3 + q.vz * (1 - Math.exp(-t * 2.2)) * 0.9; }
        pg.attributes.position.needsUpdate = true; pm.opacity = Math.max(0, 0.9 * Math.exp(-imp * 0.8)); }
      else pm.opacity = 0;
      camera.position.set(s.camX ?? 0, s.camY ?? 0.15, s.camZ ?? 7.2); camera.lookAt(0, s.lookY ?? 0.1, 0);
      L.key.intensity = 2.2 + (imp >= 0 ? 5 * Math.exp(-imp * 12) : 0);
      renderer.render(scene, camera);
    }
    return { ready, render, renderer };
  };
})();
