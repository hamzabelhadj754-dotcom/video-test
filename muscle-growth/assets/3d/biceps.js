/* Biceps brachii: two heads (long + short) that merge into one distal tendon, built from bent lathe
   profiles with a tissue texture (fibre striations), wet clearcoat, warm key + cyan rim.
   state: { yaw, pitch, camZ, camY, lookY, glow: 0..1 (lime signal along the long head), signal: 0..1 (position), thick: 0..1 } */
(function () {
  const MG = window.MG3D, T = THREE;

  function spindle(len, rMax, rTop, rBot, peakAt, segs) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs; // 0 bottom → 1 top
      let r;
      if (u < peakAt) { const k = u / peakAt; r = rBot + (rMax - rBot) * Math.sin(k * Math.PI / 2) ** 1.4; }
      else { const k = (u - peakAt) / (1 - peakAt); r = rTop + (rMax - rTop) * Math.cos(k * Math.PI / 2) ** 1.2; }
      pts.push(new T.Vector2(Math.max(0.001, r), u * len - len / 2));
    }
    return pts;
  }
  // bend a lathe geometry along an arc in the X/Y plane and flatten its depth
  function shape(geo, bend, flatZ, len, conv) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), u = Math.min(1, Math.max(0, (y + len / 2) / len));
      p.setX(i, p.getX(i) + bend * Math.sin(u * Math.PI) + (conv || 0) * Math.pow(1 - u, 2.2));
      p.setZ(i, p.getZ(i) * flatZ);
    }
    geo.computeVertexNormals(); return geo;
  }

  MG.biceps = function (canvas, w, h, base) {
    const renderer = MG.renderer(canvas, w, h);
    const scene = new T.Scene(); scene.background = new T.Color("#08090B");
    const camera = new T.PerspectiveCamera(28, w / h, 0.1, 100);
    const L = MG.lights(scene, { key: 2.0, rim: 2.4, rim2: 0.5, amb: 0.05 });

    const tissue = MG.tissueTex(5, "#6a2326", { bands: 0 }); tissue.repeat.set(3, 1.5);
    const tissueB = MG.tissueTex(6, "#808080", { bands: 0 }); tissueB.repeat.set(3, 1.5);
    const mus = new T.MeshPhysicalMaterial({ color: "#a8484a", map: tissue, bumpMap: tissueB, bumpScale: 0.01, roughness: 0.46, metalness: 0,
      clearcoat: 0.5, clearcoatRoughness: 0.4, sheen: 0.35, sheenColor: new T.Color("#e07f74"), sheenRoughness: 0.6, envMapIntensity: 0.22 });
    const tendonTex = MG.tissueTex(9, "#d8cfc0", {}); tendonTex.repeat.set(2, 1);
    const tendon = new T.MeshPhysicalMaterial({ color: "#a89f90", map: tendonTex, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.35, envMapIntensity: 0.2 });
    const bone = new T.MeshStandardMaterial({ color: "#3a3631", roughness: 0.6, envMapIntensity: 0.2 });

    const g = new T.Group();
    // long head (lateral) and short head (medial)
    const LEN = 3.2;
    const longHead = new T.Mesh(shape(new T.LatheGeometry(spindle(LEN, 0.50, 0.06, 0.05, 0.44, 120), 96), 0.30, 0.82, LEN, -0.2), mus);
    longHead.position.set(0.22, 0.05, 0.02);
    const shortHead = new T.Mesh(shape(new T.LatheGeometry(spindle(LEN * 0.93, 0.44, 0.07, 0.05, 0.42, 120), 96), 0.18, 0.80, LEN * 0.93, 0.22), mus);
    shortHead.position.set(-0.24, -0.02, 0.10);
    g.add(longHead, shortHead);
    // tendons: two proximal (up to the shoulder), one distal (down to the forearm)
    const tube = (pts, r) => { const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))), 64, r, 20, false), tendon); m.scale.z = 0.6; return m; };
    g.add(tube([[0.22, 1.5, 0.0], [0.30, 2.1, -0.05], [0.42, 2.7, -0.15]], 0.04));
    g.add(tube([[-0.24, 1.4, 0.08], [-0.34, 2.0, 0.06], [-0.50, 2.5, 0.0]], 0.05));
    g.add(tube([[0.0, -1.5, 0.06], [0.04, -1.95, 0.05], [0.10, -2.45, 0.0]], 0.07));
    // aponeurosis fan at the elbow
    const apo = new T.Mesh(new T.ConeGeometry(0.22, 0.6, 24, 1, true), tendon); apo.position.set(0.0, -1.42, 0.08); apo.rotation.z = Math.PI; apo.scale.set(1, 1, 0.5); g.add(apo);
    // humerus behind, barely lit (context, not a subject)
    
    scene.add(g);

    // the training "signal": a lime filament running along the long head's surface
    const sigCurve = new T.CatmullRomCurve3([[0.30, -1.35, 0.32], [0.48, -0.6, 0.45], [0.55, 0.1, 0.44], [0.48, 0.8, 0.36], [0.30, 1.45, 0.2]].map((p) => new T.Vector3(...p)));
    const sigGeo = new T.TubeGeometry(sigCurve, 200, 0.012, 8, false);
    const sigMat = new T.MeshBasicMaterial({ color: new T.Color("#e4ff9a"), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
    const sig = new T.Mesh(sigGeo, sigMat); g.add(sig);
    const haloMat = new T.MeshBasicMaterial({ color: MG.LIME, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
    const halo = new T.Mesh(new T.TubeGeometry(sigCurve, 200, 0.05, 12, false), haloMat); g.add(halo);
    const sigGlow = MG.glowSprite(MG.LIME, 0.28, 0); g.add(sigGlow); const sigGlow2 = MG.glowSprite(MG.LIME, 0.9, 0); g.add(sigGlow2);

    const ready = MG.env(renderer, base).then((env) => { scene.environment = env; });

    function render(s) {
      s = s || {};
      const th = 1 + (s.thick ?? 0) * 0.08;
      longHead.scale.set(th, 1, th); shortHead.scale.set(th, 1, th);
      g.rotation.set(s.pitch ?? 0.05, s.yaw ?? -0.35, s.roll ?? -0.08);
      const gl = s.glow ?? 0, sp = s.signal ?? 0.5;
      sigMat.opacity = 0.95 * gl; haloMat.opacity = 0.16 * gl;
      const n = sigGeo.index ? sigGeo.index.count : sigGeo.attributes.position.count;
      // draw only a travelling segment of the filament
      const segLen = 0.35, a = Math.max(0, sp - segLen), b = Math.min(1, sp);
      sigGeo.setDrawRange(Math.floor(a * n / 6) * 6, Math.max(0, Math.floor((b - a) * n / 6) * 6)); halo.geometry.setDrawRange(Math.floor(a * halo.geometry.index.count / 6) * 6, Math.max(0, Math.floor((b - a) * halo.geometry.index.count / 6) * 6));
      const hp = sigCurve.getPoint(Math.min(1, Math.max(0, sp))); sigGlow.position.copy(hp); sigGlow.material.opacity = 0.9 * gl; sigGlow2.position.copy(hp); sigGlow2.material.opacity = 0.35 * gl;
      camera.position.set(s.camX ?? 0, s.camY ?? 0.2, s.camZ ?? 9.5); camera.lookAt(s.lookX ?? 0, s.lookY ?? 0.1, s.lookZ ?? 0);
      renderer.render(scene, camera);
    }
    const _v = new T.Vector3();
    function screen(x, y, z, local) { _v.set(x, y, z); if (local) { g.updateMatrixWorld(true); _v.applyMatrix4(g.matrixWorld); } _v.project(camera); return [(_v.x + 1) / 2 * w, (1 - _v.y) / 2 * h]; }
    return { ready, render, renderer, camera, screen };
  };
})();
