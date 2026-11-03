<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/lib/gsap.min.js"></script>
    <script type="importmap">
      {
        "imports": {
          "three": "./assets/lib/three.module.js",
          "three/addons/": "./assets/lib/addons/"
        }
      }
    </script>
    <style>
      @font-face {
        font-family: "Geist";
        src: url("assets/fonts/geist-var.woff2") format("woff2");
        font-weight: 100 900;
      }
      @font-face {
        font-family: "Geist Mono";
        src: url("assets/fonts/geist-mono-var.woff2") format("woff2");
        font-weight: 100 900;
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
        background: #050505;
      }
      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #050505;
        font-family: "Geist", sans-serif;
        color: #f2f2f2;
      }
      .layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
      }
      .glow {
        position: absolute;
        left: -300px;
        top: 0;
        width: 1680px;
        height: 1680px;
        border-radius: 50%;
      }
      .el {
        position: absolute;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
      }
      .el img {
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
        display: block;
      }
      .fade-b {
        -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 96%);
        mask-image: linear-gradient(180deg, #000 55%, transparent 96%);
      }
      .fade-r {
        -webkit-mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%);
        mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%);
      }
      /* ---------- text (the approved M1 move) ---------- */
      .line {
        position: absolute;
        left: 0;
        top: 1200px;
        height: 80px;
        white-space: nowrap;
        font-size: 58px;
        line-height: 80px;
        font-weight: 500;
        letter-spacing: -0.01em;
        text-shadow: 0 4px 30px rgba(0, 0, 0, 0.9);
      }
      .u {
        display: inline-block;
        white-space: pre;
        opacity: 0;
      }
      .solo,
      .key {
        position: absolute;
        left: 0;
        width: 1080px;
        top: 1180px;
        height: 120px;
        text-align: center;
        font-size: 88px;
        line-height: 120px;
        font-weight: 700;
        letter-spacing: -0.02em;
        opacity: 0;
        text-shadow: 0 4px 30px rgba(0, 0, 0, 0.9);
      }
      /* ---------- hook panel ---------- */
      #hookL {
        z-index: 3;
        perspective: 1400px;
        perspective-origin: 540px 1200px;
      }
      .panel {
        position: absolute;
        left: 160px;
        top: 170px;
        width: 760px;
        height: 880px;
        border-radius: 48px;
        overflow: hidden;
        background: linear-gradient(170deg, #1c1c20, #0c0c0e 70%);
        border: 1.5px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 60px 140px rgba(0, 0, 0, 0.85), 0 0 120px rgba(255, 90, 74, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.16);
      }
      #strip {
        z-index: 4;
        opacity: 0;
      }
      .scene {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
      }
      .cam {
        transform-origin: 540px 900px;
      }
      #world {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
      }
      #halftone {
        z-index: 6;
        opacity: 0;
        background-image: radial-gradient(circle, var(--hc, #ff9a3c) 0 3.4px, transparent 4px);
        background-size: 26px 26px;
        -webkit-mask-image: radial-gradient(circle at 50% 33%, #000 0%, rgba(0, 0, 0, 0.5) 24%, transparent 52%);
        mask-image: radial-gradient(circle at 50% 33%, #000 0%, rgba(0, 0, 0, 0.5) 24%, transparent 52%);
        transform-origin: 540px 640px;
      }
      #flash {
        z-index: 7;
        opacity: 0;
        mix-blend-mode: screen;
      }
      #outro {
        z-index: 8;
      }
      #glitch {
        opacity: 0;
        background: #f2f2f2;
      }
      #glitch div {
        position: absolute;
        left: 0;
        width: 1080px;
        top: 1180px;
        text-align: center;
        font-size: 88px;
        line-height: 120px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #2fe3b4;
      }
      #logoW {
        opacity: 0;
        background: #050505;
      }
      #logo {
        position: absolute;
        left: 0;
        width: 1080px;
        top: 880px;
        text-align: center;
        font-size: 84px;
        line-height: 120px;
        font-weight: 700;
        letter-spacing: 0.32em;
        padding-left: 0.32em;
        text-shadow: 0 0 34px rgba(255, 255, 255, 0.55), 0 0 90px rgba(255, 255, 255, 0.25);
      }
      #tag {
        position: absolute;
        left: 0;
        width: 1080px;
        top: 1010px;
        text-align: center;
        font-family: "Geist Mono", monospace;
        font-size: 28px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #8a8a8f;
        opacity: 0;
      }
      #vig {
        z-index: 9;
        background: radial-gradient(120% 75% at 50% 45%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.72) 100%);
      }
      #grain {
        z-index: 10;
        opacity: 0.06;
        mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="17.3" data-width="1080" data-height="1920">
      <svg width="0" height="0" style="position: absolute">
        <filter id="hb-s1" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur id="hbg-s1" stdDeviation="0 0" /></filter>
        <filter id="hb-s2" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur id="hbg-s2" stdDeviation="0 0" /></filter>
        <filter id="hb-s3" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur id="hbg-s3" stdDeviation="0 0" /></filter>
        <filter id="hb-s4" x="-60%" y="-20%" width="220%" height="140%"><feGaussianBlur id="hbg-s4" stdDeviation="0 0" /></filter>
        <filter id="whipb" x="-10%" y="-2%" width="120%" height="104%"><feGaussianBlur id="whipg" stdDeviation="0 0" /></filter>
        <filter id="vb" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur id="vbg" stdDeviation="0 0" /></filter>
        <filter id="vb2" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur id="vbg2" stdDeviation="0 0" /></filter>
        <filter id="vbl" x="-5%" y="-200%" width="110%" height="500%"><feGaussianBlur id="vbgl" stdDeviation="0 0" /></filter>
      </svg>

      <!-- SCENE 1 (coral): the panel rises from the floor and settles flat (reference 1, 0-1.4 s) -->
      <div id="hookL" class="layer" data-layout-allow-overlap>
        <div class="glow" style="top: 0; background: radial-gradient(circle, rgba(255, 90, 74, 0.26), rgba(150, 20, 30, 0.08) 38%, rgba(0, 0, 0, 0) 64%)"></div>
        <div id="hookRig" class="layer">
          <div id="pg2" class="panel" style="opacity: 0"></div>
          <div id="pg1" class="panel" style="opacity: 0"></div>
          <div id="panel" class="panel">
            <img id="hookStat" class="fade-b" src="assets/elements/statue-back.png" style="position: absolute; left: 20px; top: 70px; width: 720px; filter: brightness(0.85) drop-shadow(0 0 40px rgba(255, 90, 74, 0.6))" />
            <div style="position: absolute; left: 0; top: 0; width: 760px; height: 880px; background: radial-gradient(90% 60% at 50% 30%, rgba(255, 90, 74, 0.18), rgba(0, 0, 0, 0) 70%)"></div>
          </div>
        </div>
        <div id="s1-tx" class="layer">
          <div id="s1-line" class="line"></div>
          <div id="s1-solo" class="solo"></div>
          <div id="s1-key" class="key"></div>
        </div>
      </div>

      <!-- SCENES 2-4 on one strip: the camera drifts and whips between them (reference 3) -->
      <div id="strip" class="layer" data-layout-allow-overlap>
        <div id="sc-s2" class="scene">
          <div class="cam layer" id="cam-s2">
            <div class="glow" style="background: radial-gradient(circle, rgba(255, 154, 60, 0.26), rgba(255, 110, 20, 0.08) 38%, rgba(0, 0, 0, 0) 64%)"></div>
            <div class="el" data-par="0.55" style="left: 280px; top: 470px"><div class="in"><img id="s2-plate" src="assets/elements/plate.png" style="width: 520px; filter: blur(5px) brightness(0.6) drop-shadow(0 0 30px rgba(255, 154, 60, 0.5))" /></div></div>
            <canvas id="world" width="1080" height="1920"></canvas>
            <div class="el" data-par="1.6" style="left: 900px; top: 330px"><div class="in"><img src="assets/elements/chrome-swirl.png" style="width: 290px; filter: blur(3px) drop-shadow(0 0 24px rgba(255, 154, 60, 0.55))" /></div></div>
            <div id="s2-tx" class="layer">
              <div id="s2-line" class="line"></div>
              <div id="s2-solo" class="solo"></div>
              <div id="s2-key" class="key"></div>
            </div>
          </div>
        </div>
        <div id="sc-s3" class="scene">
          <div class="cam layer" id="cam-s3">
            <div class="glow" style="top: -200px; background: radial-gradient(circle, rgba(76, 125, 255, 0.3), rgba(138, 92, 255, 0.1) 40%, rgba(0, 0, 0, 0) 64%)"></div>
            <div class="el" data-par="0.5" style="left: 560px; top: 360px"><div class="in" id="s3-moon"><img src="assets/elements/moon.png" style="width: 440px; filter: brightness(0.95) drop-shadow(0 0 50px rgba(120, 160, 255, 0.75)) drop-shadow(0 0 140px rgba(76, 125, 255, 0.5))" /></div></div>
            <div class="el" data-par="0.85" style="left: 540px; top: 900px"><div class="in"><img class="fade-r" src="assets/elements/statue-head.png" style="width: 660px; filter: brightness(0.42) drop-shadow(0 0 40px rgba(76, 125, 255, 0.4))" /></div></div>
            <div class="el" data-par="1.7" style="left: 170px; top: 300px"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 230px; filter: blur(2.5px) drop-shadow(0 0 24px rgba(76, 125, 255, 0.7))" /></div></div>
            <div id="s3-tx" class="layer">
              <div id="s3-line" class="line"></div>
              <div id="s3-solo" class="solo"></div>
              <div id="s3-key" class="key"></div>
            </div>
          </div>
        </div>
        <div id="sc-s4" class="scene">
          <div class="cam layer" id="cam-s4">
            <div class="glow" style="background: radial-gradient(circle, rgba(47, 227, 180, 0.22), rgba(20, 140, 160, 0.08) 38%, rgba(0, 0, 0, 0) 64%)"></div>
            <div class="el" data-par="0.55" style="left: 210px; top: 330px"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 260px; filter: blur(5px) brightness(0.8) drop-shadow(0 0 24px rgba(47, 227, 180, 0.6))" /></div></div>
            <div class="el" data-par="1" style="left: 540px; top: 640px"><div class="in" id="s4-drop"><img id="s4-plate" src="assets/elements/plate.png" style="width: 560px; filter: brightness(1) drop-shadow(0 30px 60px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 40px rgba(47, 227, 180, 0.45))" /></div></div>
            <div class="el" data-par="1.6" style="left: 900px; top: 980px"><div class="in"><img src="assets/elements/chrome-blob.png" style="width: 270px; filter: blur(3px) drop-shadow(0 0 24px rgba(47, 227, 180, 0.6))" /></div></div>
            <div id="s4-tx" class="layer">
              <div id="s4-line" class="line"></div>
              <div id="s4-solo" class="solo"></div>
              <div id="s4-key" class="key"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="halftone" class="layer" data-layout-ignore></div>
      <div id="flash" class="layer" data-layout-ignore></div>

      <div id="outro" class="layer" data-layout-allow-overlap>
        <div id="glitch" class="layer"><div>earn it.</div></div>
        <div id="logoW" class="layer">
          <div id="logo">GAINS DOM</div>
          <div id="tag">Dark fitness truth · daily</div>
        </div>
      </div>
      <div id="vig" class="layer" data-layout-ignore></div>
      <div id="grain" class="layer" data-layout-ignore></div>
    </div>

    <script type="module">
      import * as THREE from "three";

      const CFG = /*CFG*/;
      const W = 1080;
      const H = 1920;
      const FPS = 30;
      const DUR = CFG.dur;
      const $ = (id) => document.getElementById(id);
      const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
      const lerp = (a, b, k) => a + (b - a) * k;
      function proxy(init, onSet) {
        const o = {};
        for (const k of Object.keys(init)) {
          let v = init[k];
          Object.defineProperty(o, k, {
            get() {
              return v;
            },
            set(x) {
              v = x;
              onSet(o, k);
            },
            enumerable: true,
          });
        }
        return o;
      }
      const tl = gsap.timeline({ paused: true });
      const NI = { immediateRender: false };

      // ===================== TEXT CYCLE (approved move M1) =====================
      // Frame offsets measured on reference 3 at 30 fps; see build.py cycle().
      const TRACK = 22;
      function textCycle(sc) {
        const T = (f) => sc.rel0 + f / FPS;
        const line = $(sc.id + "-line");
        const units = [];
        [...sc.letters].forEach((c) => units.push({ t: c, kind: "l" }));
        sc.words.forEach((w) => units.push({ t: " " + w, kind: "w" }));
        units.forEach((u) => {
          const s = document.createElement("span");
          s.className = "u";
          s.textContent = u.t;
          line.appendChild(s);
          u.el = s;
          u.w = 0;
        });
        const TR = { k: 1 };
        function layout() {
          if (!units[0].w) units.forEach((u) => (u.w = u.el.getBoundingClientRect().width));
          let x = 0;
          const nL = sc.letters.length;
          units.forEach((u, i) => {
            const e = clamp(u.p.e, 0, 1);
            let dx = 0;
            let dy = 0;
            let s = 1;
            if (u.kind === "l") {
              dx = i * TRACK * TR.k + (1 - e) * 16;
              u.el.style.filter = e > 0.99 ? "none" : `blur(${((1 - e) * 7).toFixed(2)}px)`;
            } else {
              dx = nL * TRACK * TR.k + (1 - e) * 46;
              dy = (1 - e) * 26;
              s = 0.78 + 0.22 * e;
              u.el.style.filter = e > 0.99 ? "none" : `blur(${((1 - e) * 9).toFixed(2)}px)`;
            }
            u.el.style.opacity = e.toFixed(3);
            u.el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${s.toFixed(3)})`;
            x += u.w * (u.kind === "l" ? 1 : e);
          });
          const spread = (nL - 1) * TRACK * TR.k;
          line.style.left = (540 - (x + spread) / 2).toFixed(2) + "px";
        }
        units.forEach((u) => (u.p = proxy({ e: 0 }, layout)));
        const TRp = proxy({ k: 1 }, (o) => {
          TR.k = o.k;
          layout();
        });
        const c = {};
        const n = sc.letters.length;
        c.lettersEnd = (n - 1) * 0.85 + 6;
        c.wordsEnd = c.lettersEnd + (sc.words.length - 1) * 2.5 + 8;
        c.sm = c.wordsEnd + sc.hold1;
        units.forEach((u, i) => {
          if (u.kind === "l") tl.fromTo(u.p, { e: 0 }, { e: 1, duration: 6 / FPS, ease: "power2.out", ...NI }, Math.max(0, T(i * 0.85)) - (T(i * 0.85) < 0 ? 0 : 0));
        });
        // letters already "past" at t=0 (the hook) start fully or partly built
        units.forEach((u, i) => {
          if (u.kind !== "l") return;
          const st = T(i * 0.85);
          if (st < 0) {
            const done = clamp(-st / (6 / FPS), 0, 1);
            tl.set(u.p, { e: done < 1 ? 1 - Math.pow(1 - done, 2) : 1 }, 0);
          }
        });
        const trStart = T(0);
        if (trStart < 0) {
          const done = clamp(-trStart / (14 / FPS), 0, 1);
          tl.set(TRp, { k: 1 - (1 - Math.pow(2, -10 * done)) }, 0);
          tl.to(TRp, { k: 0, duration: Math.max(0.05, 14 / FPS + trStart), ease: "expo.out" }, 0);
        } else tl.fromTo(TRp, { k: 1 }, { k: 0, duration: 14 / FPS, ease: "expo.out", ...NI }, trStart);
        sc.words.forEach((w, j) => {
          const u = units[n + j];
          tl.fromTo(u.p, { e: 0 }, { e: 1, duration: 8 / FPS, ease: "expo.out", ...NI }, T(c.lettersEnd + j * 2.5));
        });
        tl.to(line, { x: -10, duration: (sc.hold1 - 2) / FPS, ease: "none" }, T(c.wordsEnd));
        // smear out to the left
        const hbg = $("hbg-" + sc.id);
        const HB = proxy({ s: 0 }, (o) => {
          hbg.setAttribute("stdDeviation", `${o.s.toFixed(1)} 0`);
          line.style.filter = o.s > 0.3 ? `url(#hb-${sc.id})` : "none";
        });
        tl.to(line, { x: -520, duration: 14 / FPS, ease: "power2.in" }, T(c.sm));
        tl.to(HB, { s: 28, duration: 6 / FPS, ease: "power1.in" }, T(c.sm));
        tl.to(line, { opacity: 0, duration: 8 / FPS, ease: "power1.in" }, T(c.sm + 6));
        // solo word from the right
        const solo = $(sc.id + "-solo");
        solo.textContent = sc.solo;
        tl.fromTo(solo, { opacity: 0, x: 300, filter: "blur(16px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 8 / FPS, ease: "expo.out", ...NI }, T(c.sm + 4));
        // scramble into the key word, accent from 40 %
        const CH = "abcdefghijklmnopqrstuvwxyz";
        const SC = proxy({ k: 0 }, (o) => {
          const fr = Math.round(30 * o.k);
          const len = Math.round(sc.solo.length + (sc.key.length - sc.solo.length) * o.k);
          let s = "";
          for (let i = 0; i < len; i++) {
            const ch = sc.key[i] || " ";
            const settled = o.k >= 1 || i < Math.floor(o.k * sc.key.length * 0.6) || ch === " ";
            s += settled ? ch : CH[(i * 7 + fr * 13 + 3) % 26];
          }
          solo.textContent = o.k <= 0 ? sc.solo : s;
          solo.style.color = o.k >= 0.4 ? sc.color : "#f2f2f2";
        });
        tl.fromTo(SC, { k: 0 }, { k: 1, duration: 8 / FPS, ease: "none", ...NI }, T(c.sm + 26));
        const key = $(sc.id + "-key");
        key.textContent = sc.key;
        key.style.color = sc.color;
        key.style.textShadow = `0 0 40px ${sc.color}88, 0 4px 30px rgba(0,0,0,0.9)`;
        tl.set(solo, { opacity: 0 }, T(c.sm + 34));
        tl.set(key, { opacity: 1 }, T(c.sm + 34));
        tl.fromTo(key, { scale: 1.03 }, { scale: 1, duration: 24 / FPS, ease: "power1.out", ...NI }, T(c.sm + 34));
        return { key: T(c.sm + 34), end: T(c.sm + 60), keyEl: key };
      }
      const cyc = {};
      CFG.scenes.forEach((sc) => (cyc[sc.id] = textCycle(sc)));

      // ===================== SCENE 1: tilt-up reveal (reference 1) =====================
      // Frame 0 of the video = reference frame 9: the panel is low and steeply tilted.
      tl.fromTo("#hookRig", { rotationX: 34, y: 160, scale: 0.92, transformOrigin: "540px 1150px" }, { rotationX: 0, y: 0, scale: 1, duration: 26 / FPS, ease: "expo.out", ...NI }, 0);
      tl.to("#hookRig", { scale: 1.05, duration: CFG.tunnel - 0.9, ease: "sine.inOut" }, 26 / FPS);
      tl.fromTo("#hookStat", { opacity: 0.8, filter: "brightness(0.7) drop-shadow(0 0 20px rgba(255, 90, 74, 0.35))" }, { opacity: 1, filter: "brightness(0.85) drop-shadow(0 0 40px rgba(255, 90, 74, 0.6))", duration: 18 / FPS, ease: "power2.out", ...NI }, 0);
      // zoom tunnel out of the panel (reference 1, frames 41-43)
      const TU = CFG.tunnel;
      tl.to("#hookRig", { scale: 3.4, duration: 0.3, ease: "power3.in" }, TU - 0.1);
      [["#pg1", 1.15, 0.4], ["#pg2", 1.32, 0.25]].forEach(([g, s, o]) => tl.fromTo(g, { opacity: 0, scale: 1 }, { opacity: o, scale: s, duration: 0.18, ease: "power2.in", ...NI }, TU - 0.04));
      tl.to("#hookL", { opacity: 0, duration: 0.1, ease: "none" }, TU + 0.12);

      // ===================== STRIP: drift + whip camera (reference 3) =====================
      const S2 = CFG.marks.s2;
      const STRIP0 = TU + 0.2;
      tl.set("#strip", { opacity: 1 }, STRIP0);
      tl.fromTo("#strip", { scale: 1.25, filter: "blur(10px)" }, { scale: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out", ...NI }, STRIP0);
      const D = 1180;
      const TAU = 2.28 / FPS; // 10-90 % of the travel in 5 frames, as measured
      const DRIFT = 60; // px/s slow constant drift
      const scenesOnStrip = ["s2", "s3", "s4"];
      const mid = { s2: (STRIP0 + CFG.whips[0]) / 2, s3: (CFG.whips[0] + CFG.whips[1]) / 2, s4: (CFG.whips[1] + CFG.outro) / 2 };
      const POS = {};
      scenesOnStrip.forEach((id, k) => (POS[id] = D * k + DRIFT * (mid[id] - STRIP0)));
      const camX = (t) => CFG.whips.reduce((a, w) => a + D * 0.5 * (1 + Math.tanh((t - w) / TAU)), 0) + DRIFT * (t - STRIP0);
      const whipg = $("whipg");
      const strip = $("strip");
      const pars = scenesOnStrip.map((id) => [...$("sc-" + id).querySelectorAll(".el")].map((e) => ({ e, f: +e.dataset.par, x0: parseFloat(e.style.left), y0: parseFloat(e.style.top) })));
      function renderStrip(t) {
        const X = camX(t);
        const v = Math.abs(X - camX(t - 1 / FPS));
        scenesOnStrip.forEach((id, k) => {
          const off = POS[id] - X;
          const el = $("sc-" + id);
          const vis = Math.abs(off) < 1300;
          el.style.visibility = vis ? "visible" : "hidden";
          el.style.transform = `translateX(${off.toFixed(2)}px)`;
          pars[k].forEach((p) => (p.e.style.transform = `translateX(${(off * (p.f - 1)).toFixed(2)}px)`));
        });
        const b = clamp(v * 0.32, 0, 42);
        whipg.setAttribute("stdDeviation", `${b.toFixed(1)} 0`);
        strip.style.filter = b > 0.5 ? "url(#whipb)" : "none";
        return { X, v };
      }
      // slow push-in on every scene while it holds
      [["s2", STRIP0, CFG.whips[0]], ["s3", CFG.whips[0], CFG.whips[1]], ["s4", CFG.whips[1], CFG.outro]].forEach(([id, a, b]) => {
        tl.fromTo("#cam-" + id, { scale: 1 }, { scale: 1.045, duration: b - a + 0.3, ease: "sine.inOut", ...NI }, a - 0.15);
      });

      // ===================== SCENE 2: the 3D dumbbell drops (reference 1, 4.5-5.3 s) =====================
      const canvas = $("world");
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(1);
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
      camera.position.set(0, 0, 10);
      const UPP = (2 * 10 * Math.tan((30 * Math.PI) / 360)) / H;
      const envScene = new THREE.Scene();
      const strip3 = (w, h, pos, c) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
        m.position.set(pos[0], pos[1], pos[2]);
        m.lookAt(0, 0, 0);
        envScene.add(m);
      };
      strip3(1.4, 9, [-6, 1, 3], new THREE.Color(6, 6, 6));
      strip3(1.2, 9, [6, 0.5, 1], new THREE.Color(5, 2.6, 0.9));
      strip3(9, 2.5, [0, 7, 0], new THREE.Color(2.2, 2.2, 2.2));
      strip3(4, 7, [2, 1, -7], new THREE.Color(4, 2, 0.6));
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(envScene, 0.02).texture;
      const key3 = new THREE.DirectionalLight(0xffffff, 1.4);
      key3.position.set(-3, 5, 6);
      scene.add(key3);
      const rim = new THREE.DirectionalLight(0xff9a3c, 2.6);
      rim.position.set(4, 3, -5);
      scene.add(rim);
      const V2 = (x, y) => new THREE.Vector2(x, y);
      function arc(pts, cx, cy, rad, a0, a1, n) {
        for (let i = 0; i <= n; i++) {
          const a = a0 + ((a1 - a0) * i) / n;
          pts.push(V2(cx + rad * Math.cos(a), cy + rad * Math.sin(a)));
        }
      }
      function roundCyl(r, len, b) {
        const h = len / 2;
        const p = [V2(0, -h)];
        arc(p, r - b, -h + b, b, -Math.PI / 2, 0, 8);
        arc(p, r - b, h - b, b, 0, Math.PI / 2, 8);
        p.push(V2(0, h));
        return new THREE.LatheGeometry(p, 96);
      }
      function plateGeo(Rr, Th, r0) {
        const h = Th / 2;
        const b = 0.045;
        const p = [V2(r0, -h + 0.012), V2(Rr - 0.13, -h + 0.012), V2(Rr - 0.11, -h)];
        arc(p, Rr - b, -h + b, b, -Math.PI / 2, 0, 10);
        arc(p, Rr - b, h - b, b, 0, Math.PI / 2, 10);
        p.push(V2(Rr - 0.11, h), V2(Rr - 0.13, h - 0.012), V2(r0, h - 0.012), V2(r0, -h + 0.012));
        return new THREE.LatheGeometry(p, 128);
      }
      function knurlGeo(r, len) {
        const p = [];
        for (let i = 0; i <= 46; i++) p.push(V2(i % 2 ? r * 0.955 : r, -len / 2 + (len * i) / 46));
        return new THREE.LatheGeometry(p, 64);
      }
      const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0c0c0d, roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07, side: THREE.DoubleSide });
      const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.16, side: THREE.DoubleSide });
      const db = new THREE.Group();
      db.add(new THREE.Mesh(knurlGeo(0.1, 1.16), chrome));
      for (const s of [-1, 1]) {
        const c1 = new THREE.Mesh(roundCyl(0.17, 0.1, 0.02), chrome);
        c1.position.y = s * 0.63;
        const p1 = new THREE.Mesh(plateGeo(0.64, 0.2, 0.1), lacquer);
        p1.position.y = s * 0.79;
        const p2 = new THREE.Mesh(plateGeo(0.53, 0.15, 0.1), lacquer);
        p2.position.y = s * 0.97;
        const c2 = new THREE.Mesh(roundCyl(0.16, 0.12, 0.03), chrome);
        c2.position.y = s * 1.11;
        db.add(c1, p1, p2, c2);
      }
      db.rotation.z = Math.PI / 2;
      const spinG = new THREE.Group();
      spinG.add(db);
      const tiltG = new THREE.Group();
      tiltG.add(spinG);
      tiltG.rotation.set(0.32, 0, -0.2);
      const posG = new THREE.Group();
      posG.add(tiltG);
      scene.add(posG);
      const vbg = $("vbg");
      const DROP0 = STRIP0 + 0.18;
      const DROP1 = DROP0 + 0.42;
      const DB_Y = 620;
      function dropY(t) {
        if (t < DROP0) return -900;
        if (t < DROP1) {
          const u = (t - DROP0) / (DROP1 - DROP0);
          return lerp(-900, DB_Y, u * u);
        }
        const u = t - DROP1;
        return DB_Y - 30 * Math.exp(-u * 7) * Math.sin(u * 22);
      }
      let dbVis = true;
      function renderDumbbell(t) {
        const on = t > DROP0 - 0.02 && t < CFG.whips[0] + 0.25;
        if (!on) {
          if (dbVis) {
            renderer.clear();
            dbVis = false;
          }
          canvas.style.filter = "none";
          return;
        }
        dbVis = true;
        const y = dropY(t);
        const squash = t > DROP1 ? 1 + 0.08 * Math.exp(-(t - DROP1) * 9) : 1;
        posG.position.set(0, (960 - y) * UPP, 0);
        posG.scale.set(0.7 * squash, 0.7 / squash, 0.7);
        spinG.rotation.y = 0.45 * Math.sin((t - 4) * 0.7) - 0.3;
        const vs = t > DROP0 && t < DROP1 ? clamp((dropY(t) - dropY(t - 1 / FPS)) * 0.35, 0, 30) : 0;
        if (vs > 0.4) {
          vbg.setAttribute("stdDeviation", `0 ${vs.toFixed(1)}`);
          canvas.style.filter = "url(#vb)";
        } else canvas.style.filter = "none";
        renderer.render(scene, camera);
      }
      const halftone = (at, col) => {
        tl.set("#halftone", { "--hc": col }, at - 0.01);
        tl.to("#halftone", { keyframes: [{ opacity: 0.6, scale: 1, duration: 0.14, ease: "power2.out" }, { opacity: 0, scale: 1.6, duration: 0.55, ease: "power2.in" }] }, at);
      };
      halftone(DROP1, "#ff9a3c");
      tl.to("#s2-plate", { rotation: 120, duration: CFG.whips[0] - STRIP0 + 0.5, ease: "none" }, STRIP0);

      // ===================== SCENE 3: the moon rises =====================
      tl.fromTo("#s3-moon", { y: 60 }, { y: -20, duration: CFG.whips[1] - CFG.whips[0] + 0.4, ease: "sine.out", ...NI }, CFG.whips[0] - 0.2);

      // ===================== SCENE 4: the plate slams down =====================
      const P0 = CFG.whips[1] + 0.12;
      const P1 = P0 + 0.36;
      const VB2 = proxy({ s: 0 }, (o) => {
        $("vbg2").setAttribute("stdDeviation", `0 ${o.s.toFixed(1)}`);
        $("s4-drop").style.filter = o.s > 0.3 ? "url(#vb2)" : "none";
      });
      tl.fromTo("#s4-drop", { y: -1100 }, { y: 0, duration: P1 - P0, ease: "power2.in", ...NI }, P0);
      tl.fromTo(VB2, { s: 0 }, { s: 26, duration: (P1 - P0) * 0.8, ease: "power2.in", ...NI }, P0);
      tl.set(VB2, { s: 0 }, P1);
      tl.to("#s4-drop", { keyframes: [{ y: -26, duration: 0.09, ease: "power2.out" }, { y: 0, duration: 0.14, ease: "power2.in" }, { y: -6, duration: 0.07 }, { y: 0, duration: 0.07 }] }, P1);
      tl.to("#s4-plate", { rotation: 95, duration: CFG.outro - P1, ease: "power1.out" }, P1);
      halftone(P1, "#2fe3b4");

      // ===================== OUTRO: glitch frames + logo drop (move M1 ending) =====================
      const O = CFG.outro;
      tl.set("#glitch", { opacity: 1 }, O);
      tl.set("#glitch div", { opacity: 0 }, O + 1 / FPS);
      tl.set("#glitch", { backgroundColor: "#8a8a8a" }, O + 2 / FPS);
      tl.set("#glitch", { opacity: 0 }, O + 3 / FPS);
      tl.set("#logoW", { opacity: 1 }, O + 3 / FPS);
      tl.set("#strip", { opacity: 0 }, O + 3 / FPS);
      const VBL = proxy({ s: 0 }, (o) => {
        $("vbgl").setAttribute("stdDeviation", `0 ${o.s.toFixed(1)}`);
        $("logo").style.filter = o.s > 0.3 ? "url(#vbl)" : "none";
      });
      tl.fromTo("#logo", { y: -150 }, { y: 0, duration: 12 / FPS, ease: "expo.out", ...NI }, O + 4 / FPS);
      tl.fromTo(VBL, { s: 22 }, { s: 0, duration: 9 / FPS, ease: "power2.out", ...NI }, O + 4 / FPS);
      tl.fromTo("#logo", { textShadow: "0 0 60px rgba(255,255,255,0.9), 0 0 140px rgba(255,255,255,0.5)" }, { textShadow: "0 0 34px rgba(255,255,255,0.55), 0 0 90px rgba(255,255,255,0.25)", duration: 14 / FPS, ease: "power2.out", ...NI }, O + 5 / FPS);
      tl.fromTo("#tag", { opacity: 0, y: 10, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out", ...NI }, O + 0.6);

      // ===================== world clock =====================
      const DR = proxy({ t: 0 }, (o) => {
        if (o.t >= STRIP0 - 0.05) renderStrip(o.t);
        renderDumbbell(o.t);
      });
      tl.fromTo(DR, { t: 0 }, { t: DUR, duration: DUR, ease: "none", ...NI }, 0);
      renderStrip(STRIP0);
      renderDumbbell(0);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
