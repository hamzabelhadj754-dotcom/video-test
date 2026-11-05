<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/lib/gsap.min.js"></script>
    <script type="importmap">
      { "imports": { "three": "./assets/lib/three.module.js", "three/addons/": "./assets/lib/addons/" } }
    </script>
    <style>
      @font-face {
        font-family: "Big Shoulders";
        src: url("assets/fonts/big-shoulders.woff2") format("woff2");
        font-weight: 700 900;
      }
      @font-face {
        font-family: "Manrope";
        src: url("assets/fonts/manrope.woff2") format("woff2");
        font-weight: 500 800;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #050405;
      }
      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #050405;
        color: #f3efe8;
      }
      canvas#gl {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
      }
      .copy {
        position: absolute;
        left: 120px;
        width: 700px;
        visibility: hidden;
      }
      .kick {
        display: block;
        font: 700 28px/1 "Manrope", sans-serif;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: rgba(243, 239, 232, 0.6);
        margin-bottom: 22px;
      }
      .kick b {
        color: #ff3a2a;
        font-weight: 800;
      }
      .big {
        display: block;
        font: 900 124px/0.88 "Big Shoulders", sans-serif;
        letter-spacing: -0.005em;
        text-transform: uppercase;
        text-shadow: 0 10px 50px rgba(0, 0, 0, 0.7);
      }
      .red {
        color: #ff3a2a;
        text-shadow:
          0 0 30px rgba(255, 58, 42, 0.55),
          0 10px 50px rgba(0, 0, 0, 0.7);
      }
      .num {
        display: block;
        font: 900 360px/0.8 "Big Shoulders", sans-serif;
        color: transparent;
        -webkit-text-stroke: 3px rgba(255, 58, 42, 0.85);
        letter-spacing: -0.02em;
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="3" data-width="1080" data-height="1920" data-layout-allow-overlap>
      <canvas id="gl" width="1080" height="1920" data-layout-ignore></canvas>
      <div class="copy" id="c1" style="top: 300px">
        <span class="kick"><b>47</b> unfinished tasks</span>
        <span class="big">You’re not tired.</span>
        <span class="big red">You’re tied down.</span>
      </div>
      <div class="copy" id="c2" style="top: 300px">
        <span class="kick">47 → <b>16</b> left</span>
        <span class="big">Finish one.</span>
        <span class="big red">Cut it loose.</span>
      </div>
      <div class="copy" id="c3" style="top: 300px">
        <span class="kick"><b>0</b> holding you back</span>
        <span class="big">Cut one rope</span>
        <span class="big red">at a time.</span>
      </div>
      <svg width="1080" height="1920" data-layout-ignore style="position: absolute; left: 0; top: 0; opacity: 0.09; mix-blend-mode: overlay"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter><rect width="1080" height="1920" filter="url(#gr)" /></svg>
      <div data-layout-ignore style="position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; background: radial-gradient(115% 70% at 50% 58%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.75) 100%)"></div>
    </div>

    <script type="module">
      import * as THREE from "three";
      import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
      import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
      import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
      import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
      import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
      import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

      await Promise.all([document.fonts.load('900 150px "Big Shoulders"'), document.fonts.load('700 28px "Manrope"')]);
      const loadImg = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const [IMG_SET, IMG_SPRINT, IMG_BG] = await Promise.all([loadImg("assets/img/athlete-set.png"), loadImg("assets/img/athlete-sprint.png"), loadImg("assets/img/stands.jpg")]);

      const W = 1080;
      const H = 1920;
      const V = THREE.Vector3;
      function mulberry(a) {
        return () => {
          a |= 0;
          a = (a + 0x6d2b79f5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }

      const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(W, H, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050405);
      scene.fog = new THREE.FogExp2(0x050405, 0.035);
      const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200);
      camera.position.set(0.15, 0.2, 14);
      camera.lookAt(0, -0.6, 0);
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.25;

      // light: warm key from top-left, hard red rim from behind
      scene.add(new THREE.HemisphereLight(0x302a28, 0x050405, 0.5));
      const key = new THREE.DirectionalLight(0xffe7cf, 2.6);
      key.position.set(-6, 9, 8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xff3a2a, 5.5);
      rim.position.set(4, 2, -9);
      scene.add(rim);
      const rim2 = new THREE.PointLight(0xff3a2a, 60, 18, 2);
      rim2.position.set(0, -1, -3);
      scene.add(rim2);

      // ---------- graded image planes ----------
      function graded(img, { contrast = 1.25, bright = 1.0, blur = 0, sat = 0 } = {}) {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext("2d");
        g.filter = `grayscale(${1 - sat}) contrast(${contrast}) brightness(${bright})${blur ? ` blur(${blur}px)` : ""}`;
        g.drawImage(img, 0, 0);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      }
      function silhouetteGlow(img, blur, color) {
        const c = document.createElement("canvas");
        const pad = blur * 3;
        c.width = img.width + pad * 2;
        c.height = img.height + pad * 2;
        const g = c.getContext("2d");
        g.filter = `blur(${blur}px)`;
        g.drawImage(img, pad, pad);
        g.globalCompositeOperation = "source-in";
        g.filter = "none";
        g.fillStyle = color;
        g.fillRect(0, 0, c.width, c.height);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return { t, pad };
      }
      function athlete(group, img, h, pos, rotZ = 0, opts = {}) {
        const w = h * (img.width / img.height);
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: graded(img, opts), alphaTest: 0.5, toneMapped: true }));
        // red rim: the silhouette, blurred, glowing just behind the body
        const gl = silhouetteGlow(img, 14, "#ff2a1a");
        const sw = w * (gl.t.image.width / img.width);
        const sh = h * (gl.t.image.height / img.height);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: gl.t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(1.6, 1.6, 1.6), opacity: opts.glow ?? 0.55 }));
        glow.position.set(0.04, 0.02, -0.08);
        g.add(glow, body);
        g.position.copy(pos);
        g.rotation.z = rotZ;
        group.add(g);
        // body-point mapper: image px -> world (on the athlete plane)
        return (px, py, dz = 0.12) => new V((px / img.width - 0.5) * w, (0.5 - py / img.height) * h, dz).applyMatrix4(g.matrixWorld.clone().compose(g.position, g.quaternion, g.scale));
      }
      function backdrop(group, opts) {
        const t = graded(IMG_BG, opts);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(46, 46 * (IMG_BG.height / IMG_BG.width)), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.55, 0.5, 0.5), fog: false }));
        m.position.set(0, 2.5, -22);
        group.add(m);
      }

      // ---------- rope: braided tube, taut with a little sag ----------
      const braid = (() => {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 256;
        const g = c.getContext("2d");
        for (let y = -64; y < 320; y += 16) {
          const grd = g.createLinearGradient(0, y, 64, y + 32);
          grd.addColorStop(0, "#1a0606");
          grd.addColorStop(0.5, "#b0362a");
          grd.addColorStop(1, "#1a0606");
          g.fillStyle = grd;
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(64, y + 32);
          g.lineTo(64, y + 44);
          g.lineTo(0, y + 12);
          g.fill();
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      function rope(group, A, B, r = 0.045, sag = 0.18, tint = 0x9a2a20) {
        const mid = new V().addVectors(A, B).multiplyScalar(0.5);
        mid.y -= sag * A.distanceTo(B) * 0.06;
        const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
        const tex = braid.clone();
        tex.needsUpdate = true;
        tex.repeat.set(1, A.distanceTo(B) * 2.2);
        const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, r, 10, false), new THREE.MeshStandardMaterial({ map: tex, color: tint, roughness: 0.75, metalness: 0.05, bumpMap: tex, bumpScale: 0.6 }));
        group.add(m);
        return curve;
      }
      // ---------- task tag on a rope ----------
      function tag(group, text, P, s = 0.42) {
        const c = document.createElement("canvas");
        c.width = 700;
        c.height = 150;
        const g = c.getContext("2d");
        g.font = '800 64px "Manrope"';
        const tw = Math.min(640, g.measureText(text).width + 70);
        g.fillStyle = "rgba(12,10,10,0.92)";
        g.strokeStyle = "#ff3a2a";
        g.lineWidth = 5;
        g.beginPath();
        g.roundRect((700 - tw) / 2, 22, tw, 106, 18);
        g.fill();
        g.stroke();
        g.fillStyle = "#f3efe8";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(text, 350, 77);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 4.67, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }));
        m.renderOrder = 10;
        m.position.copy(P);
        m.lookAt(camera.position);
        group.add(m);
      }
      // ---------- sparks ----------
      function sparks(group, P, n, rnd, spread = 1) {
        const pos = [];
        const col = [];
        for (let i = 0; i < n; i++) {
          const d = new V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
          const r0 = rnd() * 0.15 * spread;
          const r1 = r0 + (0.15 + rnd() * 0.9) * spread;
          const a = P.clone().addScaledVector(d, r0);
          const b = P.clone().addScaledVector(d, r1);
          b.y -= rnd() * 0.25 * spread;
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          const k = 2 + rnd() * 4;
          col.push(k, k * 0.75, k * 0.4, k, k * 0.22, k * 0.08);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
        group.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
        const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * spread, 1.6 * spread), new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `, fragmentShader: `varying vec2 vUv; void main(){ float r=length(vUv-0.5)*2.0; float g=exp(-r*r*7.0); gl_FragColor=vec4(vec3(3.0,1.1,0.4)*g,1.0);} `, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
        fl.position.copy(P);
        fl.lookAt(camera.position);
        group.add(fl);
      }

      // body points on the set-position photo (image px)
      const PTS = { head: [580, 470], shL: [400, 520], shR: [745, 530], back: [580, 640], hip: [560, 780], elL: [300, 860], elR: [860, 880], hdL: [190, 1190], hdR: [1010, 1210], knee: [660, 930], foot: [705, 1150] };
      const KEYS = Object.keys(PTS);
      const TASKS = ["the email", "diet starts monday", "call back", "that project", "taxes", "the course", "reply later", "fix the car", "the essay", "gym plan", "book dentist", "pay rent"];
      function tieRopes(group, map, count, seed, withTags) {
        const rnd = mulberry(seed);
        let ti = 0;
        const ends = [];
        for (let i = 0; i < count; i++) {
          const k = KEYS[i % KEYS.length];
          const P = map(PTS[k][0] + (rnd() - 0.5) * 40, PTS[k][1] + (rnd() - 0.5) * 40, 0.1 + rnd() * 0.15);
          // anchors all around: behind, beside, and a few right past the lens
          const a = rnd() * Math.PI * 2;
          const toward = i % 6 === 0;
          const A = toward ? new V(Math.cos(a) * (2.2 + rnd() * 1.5), Math.sin(a) * 3 - 0.5, 9 + rnd() * 3) : new V(Math.cos(a) * (8 + rnd() * 7), Math.sin(a) * (7 + rnd() * 6) - 1, -4 - rnd() * 14);
          const curve = rope(group, P, A, 0.035 + rnd() * 0.025, 0.4 + rnd());
          ends.push(curve);
          if (withTags && !toward && ti < TASKS.length && i % 3 === 0) tag(group, TASKS[ti++], curve.getPoint(0.22 + rnd() * 0.12), 0.34);
        }
        return ends;
      }

      // ================= FRAME 1: tied down by 47 =================
      const F1 = new THREE.Group();
      {
        backdrop(F1, { contrast: 1.1, bright: 0.45, blur: 6 });
        const map = athlete(F1, IMG_SET, 6.3, new V(0, -2.2, 0));
        F1.updateMatrixWorld(true);
        tieRopes(F1, map, 47, 11, true);
      }
      // ================= FRAME 2: a rope snaps, she starts to rise =================
      const F2 = new THREE.Group();
      {
        backdrop(F2, { contrast: 1.1, bright: 0.42, blur: 6 });
        const map = athlete(F2, IMG_SET, 6.3, new V(0.1, -1.95, 0), 0.05);
        F2.updateMatrixWorld(true);
        tieRopes(F2, map, 16, 23, true);
        // the cut: a rope from the right shoulder, split, both halves recoiling
        const rnd = mulberry(5);
        const P = map(PTS.shR[0], PTS.shR[1], 0.2);
        const A = new V(7.5, 6.5, -6);
        const cut = P.clone().lerp(A, 0.18);
        const fray1 = cut.clone().add(new V(-0.35, -0.55, 0.3));
        rope(F2, P, fray1, 0.05, 2.0); // the slack end still on her, falling away
        rope(F2, cut.clone().add(new V(0.7, 0.9, -0.4)), A, 0.05, 0.6); // the far end whipping back
        sparks(F2, cut.clone().add(new V(0.25, 0.25, 0)), 140, rnd, 1.1);
      }
      // ================= FRAME 3: free, exploding into the sprint =================
      const F3 = new THREE.Group();
      {
        backdrop(F3, { contrast: 1.15, bright: 0.38, blur: 14 });
        const map = athlete(F3, IMG_SPRINT, 6.6, new V(0.45, -2.35, 1.2), -0.04, { glow: 0.6 });
        F3.updateMatrixWorld(true);
        const rnd = mulberry(31);
        // speed streaks behind the athlete
        for (let i = 0; i < 26; i++) {
          const y = -5 + rnd() * 8;
          const z = -3 - rnd() * 6;
          const len = 4 + rnd() * 9;
          const g = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.02 + rnd() * 0.05), new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? new THREE.Color(2.2, 0.35, 0.25) : new THREE.Color(0.6, 0.55, 0.55), transparent: true, opacity: 0.35 + rnd() * 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
          g.position.set(-len / 2 - 1 + rnd() * 2, y, z);
          F3.add(g);
        }
        // cut rope ends torn off and left behind
        [["shL", -7, 1.5], ["hip", -8, -1.5], ["foot", -7.5, -4]].forEach(([k, x, y], i) => {
          const p = PTS[k];
          const P = new V(-3.2 - i * 0.6, y * 0.4 - 0.6, 0.4);
          rope(F3, P, new V(x, y, -6 - i * 2), 0.04, 0.5);
          sparks(F3, P, 50, rnd, 0.55);
        });
      }
      scene.add(F1, F2, F3);

      // ---------- post: real depth of field, bloom, tone map ----------
      const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }));
      composer.setPixelRatio(1);
      composer.setSize(W, H);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new BokehPass(scene, camera, { focus: 13.8, aperture: 0.0026, maxblur: 0.012 }));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.7, 0.5, 0.8));
      composer.addPass(new OutputPass());

      const copies = ["c1", "c2", "c3"].map((id) => document.getElementById(id));
      function render(t) {
        const k = t < 1 ? 0 : t < 2 ? 1 : 2;
        [F1, F2, F3].forEach((g, i) => (g.visible = i === k));
        copies.forEach((c, i) => (c.style.visibility = i === k ? "visible" : "hidden"));
        composer.render();
      }
      const tl = gsap.timeline({ paused: true });
      const DR = { _t: 0 };
      Object.defineProperty(DR, "t", {
        get() {
          return this._t;
        },
        set(v) {
          this._t = v;
          render(v);
        },
      });
      tl.fromTo(DR, { t: 0 }, { t: 3, duration: 3, ease: "none", immediateRender: false }, 0);
      render(0);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
