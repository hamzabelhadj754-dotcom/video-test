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
      :root {
        --bg: #050505;
        --ink: #f2f2f2;
        --mute: #8a8a8f;
        --coral: #ff5a4a;
        --amber: #ff9a3c;
        --teal: #2fe3b4;
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
        background: var(--bg);
      }
      #root {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: var(--bg);
        font-family: "Geist", sans-serif;
        color: var(--ink);
      }
      .layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
      }
      .mono {
        font-family: "Geist Mono", monospace;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .lbl {
        font-size: 26px;
        color: var(--mute);
      }
      .ch {
        display: inline-block;
        white-space: pre;
      }
      .amb {
        position: absolute;
        left: -260px;
        top: 200px;
        width: 1600px;
        height: 1600px;
        border-radius: 50%;
        opacity: 0;
      }
      #hookL {
        z-index: 3;
        perspective: 1400px;
        perspective-origin: 540px 900px;
      }
      #hookStat {
        position: absolute;
        left: 120px;
        top: 260px;
        width: 840px;
        -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 96%);
        mask-image: linear-gradient(180deg, #000 55%, transparent 96%);
        filter: brightness(0.75) drop-shadow(0 0 40px rgba(255, 90, 74, 0.5));
        opacity: 0.85;
      }
      .hc {
        position: absolute;
        left: 130px;
        top: 640px;
        width: 820px;
        height: 500px;
        border-radius: 40px;
        background: linear-gradient(165deg, rgba(40, 40, 44, 0.92), rgba(14, 14, 16, 0.94));
        border: 1.5px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 50px 120px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 90, 74, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.14);
      }
      .hcPct {
        position: absolute;
        left: 60px;
        top: 96px;
        font-size: 190px;
        line-height: 190px;
        font-weight: 600;
        letter-spacing: -0.05em;
        color: var(--coral);
        text-shadow: 0 0 60px rgba(255, 90, 74, 0.65);
        transform-origin: 0 100%;
      }
      #morphL {
        z-index: 4;
      }
      .mfill {
        clip-path: inset(50% 50% 50% 50%);
      }
      #mEdge {
        background: rgba(255, 255, 255, 0.14);
      }
      #mFill {
        background: linear-gradient(170deg, #1a1a1d, #0e0e10 60%, #121215);
      }
      #pEdge {
        background: rgba(255, 90, 74, 0.7);
      }
      #pFill {
        background: linear-gradient(160deg, #2a2a2f, #141416);
      }
      #dotGlow {
        position: absolute;
        left: 450px;
        top: 120px;
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 140, 120, 0.95), rgba(255, 90, 74, 0.4) 30%, rgba(0, 0, 0, 0) 70%);
        opacity: 0;
      }
      #pLbl {
        position: absolute;
        left: 340px;
        top: 168px;
        width: 400px;
        height: 84px;
        line-height: 84px;
        text-align: center;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.06em;
        opacity: 0;
      }
      #stageWrap {
        z-index: 5;
        transform-origin: 540px 960px;
        opacity: 0;
      }
      #persp {
        perspective: 1800px;
        perspective-origin: 540px 960px;
      }
      #cyl {
        transform-style: preserve-3d;
        transform-origin: 540px 960px;
      }
      .scr {
        position: absolute;
        left: 60px;
        top: 120px;
        width: 960px;
        height: 1680px;
        border-radius: 56px;
        overflow: hidden;
        background: linear-gradient(170deg, #1a1a1d, #0e0e10 60%, #121215);
        border: 1.5px solid rgba(255, 255, 255, 0.14);
        backface-visibility: hidden;
      }
      .scr .glow {
        position: absolute;
        left: -200px;
        top: -260px;
        width: 1360px;
        height: 1200px;
        border-radius: 50%;
      }
      .spill {
        position: absolute;
        left: 280px;
        top: 48px;
        width: 400px;
        height: 84px;
        border-radius: 42px;
        line-height: 84px;
        text-align: center;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.06em;
        background: linear-gradient(160deg, #2a2a2f, #141416);
        box-shadow: 0 0 0 1.5px var(--pc), 0 0 40px color-mix(in srgb, var(--pc) 35%, transparent);
      }
      .spill .n {
        font-family: "Geist Mono", monospace;
        color: var(--pc);
        margin-right: 16px;
      }
      .panel {
        position: absolute;
        border-radius: 32px;
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
        border: 1.5px solid rgba(255, 255, 255, 0.1);
      }
      .row {
        position: absolute;
        left: 0;
        width: 760px;
        height: 96px;
        display: flex;
        align-items: center;
        padding: 0 40px;
      }
      .row + .row {
        border-top: 1px solid rgba(255, 255, 255, 0.07);
      }
      .row .val {
        margin-left: auto;
        font-family: "Geist Mono", monospace;
        font-size: 44px;
        font-weight: 500;
      }
      .chip {
        position: absolute;
        padding: 0 20px;
        height: 50px;
        line-height: 50px;
        border-radius: 25px;
        font-family: "Geist Mono", monospace;
        font-size: 26px;
        letter-spacing: 0.06em;
        opacity: 0;
      }
      .wb {
        position: absolute;
        width: 196px;
        height: 96px;
        border-radius: 48px;
        background: linear-gradient(160deg, #2c2c31, #151517);
        box-shadow: 0 0 0 1.5px rgba(255, 154, 60, 0.75), 0 0 30px rgba(255, 154, 60, 0.3);
        opacity: 0;
      }
      .wb .k {
        position: absolute;
        left: 0;
        width: 196px;
        top: 12px;
        text-align: center;
        font-family: "Geist Mono", monospace;
        font-size: 22px;
        letter-spacing: 0.1em;
        color: var(--amber);
      }
      .wb .v {
        position: absolute;
        left: 0;
        width: 196px;
        top: 40px;
        text-align: center;
        font-family: "Geist Mono", monospace;
        font-size: 36px;
        font-weight: 500;
      }
      #world {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
        z-index: 6;
      }
      #halftone {
        z-index: 7;
        opacity: 0;
        background-image: radial-gradient(circle, var(--hc, #ff5a4a) 0 3.4px, transparent 4px);
        background-size: 26px 26px;
        -webkit-mask-image: radial-gradient(circle at 50% 30%, #000 0%, rgba(0, 0, 0, 0.5) 26%, transparent 55%);
        mask-image: radial-gradient(circle at 50% 30%, #000 0%, rgba(0, 0, 0, 0.5) 26%, transparent 55%);
        transform-origin: 540px 560px;
      }
      .capl {
        z-index: 9;
      }
      .capline {
        position: absolute;
        left: 90px;
        width: 900px;
        top: 1330px;
        text-align: center;
        font-size: 46px;
        line-height: 58px;
        font-weight: 600;
        letter-spacing: -0.01em;
        text-shadow: 0 4px 24px rgba(0, 0, 0, 0.85);
      }
      .cw {
        display: inline-block;
        opacity: 0;
      }
      .cw.on {
        opacity: 1;
      }
      #flash {
        z-index: 10;
        opacity: 0;
        mix-blend-mode: screen;
      }
      #vig {
        z-index: 11;
        background: radial-gradient(120% 75% at 50% 45%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.7) 100%);
      }
      #grain {
        z-index: 12;
        opacity: 0.06;
        mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="46" data-width="1080" data-height="1920">
      <svg width="0" height="0" style="position: absolute">
        <filter id="hblur" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur id="hbg" stdDeviation="0 0" /></filter>
        <filter id="vblur" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur id="vbg" stdDeviation="0 0" /></filter>
      </svg>
      <div id="bgL" class="layer">
        <div id="ambH" class="amb" style="background: radial-gradient(circle, rgba(255, 90, 74, 0.2), rgba(255, 90, 74, 0.06) 35%, rgba(0, 0, 0, 0) 65%)"></div>
        <div id="ambE" class="amb" style="background: radial-gradient(circle, rgba(255, 70, 60, 0.18), rgba(160, 20, 40, 0.06) 38%, rgba(0, 0, 0, 0) 66%)"></div>
        <div id="ambO" class="amb" style="background: radial-gradient(circle, rgba(255, 154, 60, 0.18), rgba(255, 110, 20, 0.06) 38%, rgba(0, 0, 0, 0) 66%)"></div>
      </div>

      <div id="hookL" class="layer" data-layout-allow-overlap>
        <div id="hookRig" class="layer">
          <img id="hookStat" src="assets/elements/statue-back.png" />
          <div id="hcG3" class="hc" style="opacity: 0"></div>
          <div id="hcG2" class="hc" style="opacity: 0"></div>
          <div id="hcG1" class="hc" style="opacity: 0"></div>
          <div id="hc" class="hc">
            <div class="mono lbl" style="position: absolute; left: 60px; top: 50px">Body change</div>
            <div class="mono lbl" style="position: absolute; right: 60px; top: 50px">12 weeks</div>
            <div id="hcPct" class="hcPct">0%</div>
            <svg width="700" height="120" viewBox="0 0 700 120" style="position: absolute; left: 60px; top: 330px">
              <line x1="0" y1="20" x2="700" y2="20" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
              <line x1="0" y1="70" x2="700" y2="70" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
              <path id="hcLine" opacity="0" pathLength="1" d="M 0 90 L 70 88 L 140 91 L 210 89 L 280 90 L 350 88 L 420 91 L 490 89 L 560 90 L 630 89 L 690 90" fill="none" stroke="#f2f2f2" stroke-width="5" stroke-linecap="butt" stroke-linejoin="round" style="stroke-dasharray: 1; stroke-dashoffset: 1" />
              <circle id="hcDot" cx="690" cy="90" r="11" fill="#ff5a4a" opacity="0" style="filter: drop-shadow(0 0 10px #ff5a4a)" />
            </svg>
          </div>
        </div>
      </div>

      <div id="morphL" class="layer" data-layout-allow-overlap>
        <div id="mEdge" class="layer mfill"></div>
        <div id="mFill" class="layer mfill"></div>
        <div id="dotGlow"></div>
        <div id="pEdge" class="layer mfill"></div>
        <div id="pFill" class="layer mfill"></div>
        <div id="pLbl"><span class="mono" style="color: var(--coral); margin-right: 16px; letter-spacing: 0.06em">01</span><span id="pLblT">EGO</span></div>
      </div>

      <div id="stageWrap" class="layer" data-layout-allow-overlap>
        <div id="persp" class="layer">
          <div id="cyl" class="layer">
            <div class="scr" id="s0">
              <div class="glow" style="background: radial-gradient(circle, rgba(255, 90, 74, 0.22), rgba(0, 0, 0, 0) 60%)"></div>
              <div class="mono lbl" style="position: absolute; left: 80px; top: 640px">Body change</div>
              <div style="position: absolute; left: 80px; top: 700px; font-size: 220px; line-height: 220px; font-weight: 600; letter-spacing: -0.05em; color: var(--coral)">0%</div>
            </div>
            <div class="scr" id="s1" style="--pc: var(--coral)">
              <div class="glow" style="background: radial-gradient(circle, rgba(255, 90, 74, 0.26), rgba(120, 20, 30, 0.08) 40%, rgba(0, 0, 0, 0) 64%)"></div>
              <div class="spill"><span class="n">01</span>EGO</div>
              <div class="panel" id="p1" style="left: 100px; top: 760px; width: 760px; height: 288px; opacity: 0">
                <div id="r1" class="row" style="top: 0">
                  <span class="mono lbl">Weight</span>
                  <div id="chip20" class="chip" style="left: 330px; top: 23px; background: rgba(255, 90, 74, 0.16); border: 1.5px solid rgba(255, 90, 74, 0.6); color: var(--coral)">−20%</div>
                  <span class="val"><span id="wkg">40</span><span style="color: var(--mute); font-size: 30px"> kg</span></span>
                </div>
                <div id="r2" class="row" style="top: 96px; opacity: 0.25">
                  <span class="mono lbl">Range</span>
                  <svg style="margin-left: auto; margin-right: 24px" width="120" height="64" viewBox="0 0 120 64">
                    <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="8" stroke-linecap="round" />
                    <path id="gArc" opacity="0" pathLength="1" d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="#ff5a4a" stroke-width="8" stroke-linecap="butt" style="stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 6px #ff5a4a)" />
                  </svg>
                  <span class="val" style="margin-left: 0; font-size: 34px">FULL</span>
                </div>
                <div id="r3" class="row" style="top: 192px; opacity: 0.25">
                  <span class="mono lbl">Tempo</span>
                  <div style="position: relative; margin-left: auto; margin-right: 24px; width: 240px; height: 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.12); overflow: hidden">
                    <div id="tFill" style="position: absolute; left: 0; top: 0; width: 240px; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #ff3d3d, #ff8a5a); transform-origin: 0 50%"></div>
                  </div>
                  <span class="val" style="margin-left: 0; font-size: 34px">3s ↓</span>
                </div>
              </div>
            </div>
            <div class="scr" id="s2" style="--pc: var(--amber)">
              <div class="glow" style="background: radial-gradient(circle, rgba(255, 154, 60, 0.24), rgba(255, 110, 20, 0.07) 40%, rgba(0, 0, 0, 0) 64%)"></div>
              <div class="spill"><span class="n">02</span>OVERLOAD</div>
              <div id="pgL" class="mono lbl" style="position: absolute; left: 0; width: 960px; top: 360px; text-align: center; opacity: 0">Progress</div>
              <div id="pgV" style="position: absolute; left: 0; width: 960px; top: 400px; text-align: center; font-size: 150px; line-height: 160px; font-weight: 600; letter-spacing: -0.04em; opacity: 0">+0%</div>
              <svg width="960" height="1680" viewBox="0 0 960 1680" style="position: absolute; left: 0; top: 0">
                <path id="tree" opacity="0" pathLength="1" d="M 480 590 L 480 690 M 480 690 L 135 690 L 135 770 M 480 690 L 365 690 L 365 770 M 480 690 L 595 690 L 595 770 M 480 690 L 825 690 L 825 770" fill="none" stroke="#ff9a3c" stroke-width="3.5" stroke-linecap="butt" stroke-linejoin="round" style="stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 8px rgba(255,154,60,0.9))" />
              </svg>
              <div class="wb" id="wb0" style="left: 37px; top: 780px"><div class="k">W1</div><div class="v" id="wv0">0</div></div>
              <div class="wb" id="wb1" style="left: 267px; top: 780px"><div class="k">W2</div><div class="v" id="wv1">60</div></div>
              <div class="wb" id="wb2" style="left: 497px; top: 780px"><div class="k">W3</div><div class="v" id="wv2">62.5</div></div>
              <div class="wb" id="wb3" style="left: 727px; top: 780px"><div class="k">W4</div><div class="v" id="wv3">65</div></div>
              <div id="chRep" class="chip" style="left: 230px; top: 940px; background: rgba(255, 154, 60, 0.14); border: 1.5px solid rgba(255, 154, 60, 0.6); color: var(--amber)">+1 REP</div>
              <div id="chKg" class="chip" style="left: 500px; top: 940px; background: rgba(255, 154, 60, 0.14); border: 1.5px solid rgba(255, 154, 60, 0.6); color: var(--amber)">+2.5 KG</div>
            </div>
            <div class="scr" id="s3" style="--pc: var(--teal)">
              <div class="glow" style="background: radial-gradient(circle, rgba(47, 227, 180, 0.2), rgba(0, 0, 0, 0) 60%)"></div>
              <div class="spill"><span class="n">03</span>PROTEIN</div>
              <img src="assets/elements/egg.png" style="position: absolute; left: 330px; top: 300px; width: 300px" />
              <div style="position: absolute; left: 0; width: 960px; top: 700px; text-align: center; font-size: 240px; font-weight: 600; letter-spacing: -0.05em; color: var(--teal)">1.6</div>
            </div>
          </div>
        </div>
      </div>
      <canvas id="world" width="1080" height="1920"></canvas>
      <div id="halftone" class="layer" data-layout-ignore></div>

      /*CAPTION_HTML*/

      <div id="flash" class="layer" data-layout-ignore></div>
      <div id="vig" class="layer" data-layout-ignore></div>
      <div id="grain" class="layer" data-layout-ignore></div>
    </div>

    <script type="module">
      import * as THREE from "three";

      const W = 1080;
      const H = 1920;
      const DUR = 46;
      const WT = /*WT*/;
      const $ = (id) => document.getElementById(id);
      const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
      const lerp = (a, b, k) => a + (b - a) * k;
      const cubicIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
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
      function splitChars(el) {
        const txt = el.textContent;
        el.textContent = "";
        return [...txt].map((c) => {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = c;
          el.appendChild(s);
          return s;
        });
      }

      // ===================== CURVED WALL =====================
      const R = 1400;
      const P = 1800;
      const STEP = 2 * Math.asin(540 / R);
      document.querySelectorAll(".scr").forEach((el, i) => {
        el.style.transform = `rotateY(${((i * STEP * 180) / Math.PI).toFixed(3)}deg) translateZ(${R}px)`;
      });
      const WHIPS = [[14.08, 0.7, 1, 2]];
      function wallPos(t) {
        let p = 1;
        let zoom = 1;
        for (const [at, d, from, to] of WHIPS) {
          if (t >= at + d) p = to;
          else if (t > at) {
            const u = (t - at) / d;
            p = lerp(from, to, cubicIO(u));
            zoom = 1 - 0.17 * Math.sin(Math.PI * u);
          }
        }
        return { p, zoom };
      }
      const cyl = $("cyl");
      const stageWrap = $("stageWrap");
      const hbg = $("hbg");
      const PUSH = proxy({ k: 1 }, () => {});
      function renderWall(t) {
        const a = wallPos(t);
        const b = wallPos(t - 1 / 30);
        const A = a.p * STEP;
        cyl.style.transform = `translateZ(${-R}px) rotateY(${((-A * 180) / Math.PI).toFixed(3)}deg)`;
        const k = a.zoom * PUSH.k;
        stageWrap.style.transform = `scale(${k.toFixed(4)})`;
        const speed = Math.abs(a.p - b.p) * STEP * R;
        const blur = clamp(speed * 0.42, 0, 46);
        hbg.setAttribute("stdDeviation", `${blur.toFixed(1)} 0`);
        stageWrap.style.filter = blur > 0.4 ? "url(#hblur)" : "none";
        return { A, k, blur };
      }
      function projOn(i, dx, dy, A, k) {
        const phi = i * STEP - A;
        const X = R * Math.sin(phi) + dx * Math.cos(phi);
        const Z = R * Math.cos(phi) - R - dx * Math.sin(phi);
        const s = P / (P - Z);
        return { x: 540 + X * s * k, y: 960 + dy * s * k, s: s * k };
      }

      // ===================== MORPH SHAPES =====================
      function inset(cx, cy, w, h, r, g) {
        const t = cy - h / 2 - g;
        const l = cx - w / 2 - g;
        const b = H - (cy + h / 2) - g;
        const ri = W - (cx + w / 2) - g;
        const rr = Math.max(0, Math.min(r + g, (w + 2 * g) / 2, (h + 2 * g) / 2));
        return `inset(${t.toFixed(2)}px ${ri.toFixed(2)}px ${b.toFixed(2)}px ${l.toFixed(2)}px round ${rr.toFixed(2)}px)`;
      }
      const shape = (fillId, edgeId, init) =>
        proxy(init, (o) => {
          const f = $(fillId);
          const e = $(edgeId);
          if (o.w < 0.5 || o.h < 0.5) {
            f.style.clipPath = e.style.clipPath = "inset(50% 50% 50% 50%)";
            return;
          }
          f.style.clipPath = inset(o.cx, o.cy, o.w, o.h, o.r, 0);
          e.style.clipPath = inset(o.cx, o.cy, o.w, o.h, o.r, 1.5);
        });
      const PILL = shape("pFill", "pEdge", { cx: 540, cy: 210, w: 0, h: 0, r: 0 });
      const CARD = shape("mFill", "mEdge", { cx: 540, cy: 210, w: 0, h: 0, r: 0 });

      // ===================== 3D DUMBBELL =====================
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
      const strip = (w, h, pos, c) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
        m.position.set(pos[0], pos[1], pos[2]);
        m.lookAt(0, 0, 0);
        envScene.add(m);
      };
      strip(1.4, 9, [-6, 1, 3], new THREE.Color(6, 6, 6));
      strip(1.2, 9, [6, 0.5, 1], new THREE.Color(4.5, 1.6, 1.2));
      strip(9, 2.5, [0, 7, 0], new THREE.Color(2.2, 2.2, 2.2));
      strip(4, 7, [2, 1, -7], new THREE.Color(3.6, 1.1, 0.9));
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(envScene, 0.02).texture;
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(-3, 5, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xff5a4a, 2.2);
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
      function plateGeo(Rr, T, r0) {
        const h = T / 2;
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
      const DROP0 = 5.86;
      const DROP1 = 6.3;
      function dropY(t) {
        if (t < DROP0) return -1700;
        if (t < DROP1) {
          const u = (t - DROP0) / (DROP1 - DROP0);
          return lerp(-1700, -420, u * u);
        }
        const u = t - DROP1;
        return -420 - 34 * Math.exp(-u * 7) * Math.sin(u * 22);
      }
      let lastVis = true;
      function renderDumbbell(t, wall) {
        const on = t > DROP0 - 0.02 && t < 14.9;
        if (!on) {
          if (lastVis) {
            renderer.clear();
            lastVis = false;
          }
          canvas.style.filter = "none";
          return;
        }
        lastVis = true;
        const dy = dropY(t);
        const p = projOn(1, 0, dy, wall.A, wall.k);
        const squash = t > DROP1 ? 1 + 0.08 * Math.exp(-(t - DROP1) * 9) : 1;
        posG.position.set((p.x - 540) * UPP, (960 - p.y) * UPP, 0);
        posG.scale.set(0.82 * p.s * squash, (0.82 * p.s) / squash, 0.82 * p.s);
        spinG.rotation.y = 0.5 * Math.sin((t - 6) * 0.6) - 0.35 - (wall.A - STEP) * 1.4;
        rim.intensity = 2.2 + 2.4 * bump(t, WT[25], WT[31] + 0.2);
        const vs = t > DROP0 && t < DROP1 ? clamp((dropY(t) - dropY(t - 1 / 30)) * 0.35, 0, 30) : 0;
        if (vs > 0.4) {
          vbg.setAttribute("stdDeviation", `0 ${vs.toFixed(1)}`);
          canvas.style.filter = "url(#vblur)";
        } else canvas.style.filter = wall.blur > 0.4 ? "url(#hblur)" : "none";
        renderer.render(scene, camera);
      }

      // ===================== TIMELINE =====================
      const tl = gsap.timeline({ paused: true });
      const NI = { immediateRender: false };
      function wordIn(id, at) {
        tl.fromTo("#" + id, { opacity: 0, y: 12, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.34, ease: "power3.out", ...NI }, at);
      }
      function capOut(id, at) {
        tl.to("#" + id + " .capline", { opacity: 0, x: -40, filter: "blur(10px)", duration: 0.24, ease: "power2.in" }, at);
      }
      const charsIn = (chars, at, st = 0.03, d = 0.5) =>
        chars.forEach((c, i) =>
          tl.fromTo(c, { opacity: 0, y: 26, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: d, ease: "expo.out", ...NI }, at + i * st),
        );
      const FLASH = {
        coral: "radial-gradient(70% 45% at 50% 40%, rgba(255,170,150,0.9), rgba(255,90,74,0.35) 45%, rgba(0,0,0,0) 75%)",
        amber: "radial-gradient(70% 45% at 50% 40%, rgba(255,210,150,0.9), rgba(255,154,60,0.35) 45%, rgba(0,0,0,0) 75%)",
      };
      const flashAt = (at, col, peak = 0.3) => {
        tl.set("#flash", { backgroundImage: FLASH[col] }, at - 0.01);
        tl.to("#flash", { opacity: peak, duration: 0.1, ease: "power2.out" }, at);
        tl.to("#flash", { opacity: 0, duration: 0.45, ease: "power2.in" }, at + 0.1);
      };
      const halftone = (at, col) => {
        tl.set("#halftone", { "--hc": col }, at - 0.01);
        tl.to("#halftone", { keyframes: [{ opacity: 0.6, scale: 1, duration: 0.14, ease: "power2.out" }, { opacity: 0, scale: 1.6, duration: 0.55, ease: "power2.in" }] }, at);
      };
      tl.set(["#tFill"], { scaleX: 0 }, 0);

      tl.set("#ambH", { opacity: 1 }, 0);
      tl.to("#ambH", { opacity: 0, duration: 0.4 }, 4.3);
      tl.to("#ambE", { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 4.8);
      tl.to("#ambE", { opacity: 0, duration: 0.6 }, 14.1);
      tl.to("#ambO", { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 14.4);

      // ---- HOOK: the card rises out of the floor and settles flat ----
      tl.fromTo("#hookRig", { rotationX: 38, y: 150, scale: 0.9, transformOrigin: "540px 1300px" }, { rotationX: 0, y: 0, scale: 1, duration: 1.5, ease: "expo.out", ...NI }, 0);
      tl.to("#hookRig", { scale: 1.06, duration: 2.6, ease: "sine.inOut" }, 1.5);
      tl.fromTo("#hcPct", { skewX: -22, scaleX: 1.3, filter: "blur(6px)" }, { skewX: 0, scaleX: 1, filter: "blur(0px)", duration: 1.1, ease: "expo.out", ...NI }, 0.15);
      tl.set("#hcLine", { opacity: 1 }, 0.9);
      tl.fromTo("#hcLine", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.7, ease: "power1.inOut", ...NI }, 0.9);
      tl.fromTo("#hcDot", { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)", ...NI }, 2.55);
      for (const [o, at] of [[0.2, WT[6]], [1, WT[6] + 0.07], [0.3, WT[7]], [1, WT[7] + 0.09], [0.25, WT[7] + 0.3], [1, WT[7] + 0.38]]) tl.set("#hcPct", { opacity: o }, at);
      tl.to("#hc", { keyframes: [{ x: 12, duration: 0.05 }, { x: -10, duration: 0.05 }, { x: 6, duration: 0.05 }, { x: 0, duration: 0.06 }] }, WT[8]);
      // zoom-blur tunnel out of the hook on "why"
      const TUN = 4.24;
      tl.to("#hookRig", { scale: 3.2, duration: 0.36, ease: "power3.in" }, TUN);
      tl.to("#hookRig", { opacity: 0, duration: 0.14, ease: "none" }, TUN + 0.24);
      [["#hcG1", 1.12, 0.35], ["#hcG2", 1.26, 0.25], ["#hcG3", 1.42, 0.16]].forEach(([g, sc, op]) => {
        tl.fromTo(g, { opacity: 0, scale: 1 }, { opacity: op, scale: sc, duration: 0.2, ease: "power2.in", ...NI }, TUN + 0.04);
      });
      flashAt(TUN + 0.3, "coral", 0.4);

      // ---- dot -> pill -> card (01) ----
      tl.fromTo("#dotGlow", { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", ...NI }, 4.6);
      tl.fromTo(PILL, { w: 0, h: 0, r: 0 }, { w: 22, h: 22, r: 11, duration: 0.25, ease: "back.out(3)", ...NI }, 4.62);
      tl.to(PILL, { w: 400, h: 84, r: 42, duration: 0.55, ease: "expo.out" }, 4.95);
      tl.to("#dotGlow", { opacity: 0, scale: 2.2, duration: 0.5, ease: "power2.out" }, 4.98);
      tl.set("#pLbl", { opacity: 1 }, 5.08);
      charsIn(splitChars($("pLblT")), 5.12, 0.05, 0.45);
      tl.fromTo(CARD, { cx: 540, cy: 210, w: 400, h: 84, r: 42 }, { cx: 540, cy: 960, w: 960, h: 1680, r: 56, duration: 0.8, ease: "expo.inOut", ...NI }, 5.5);
      tl.set("#stageWrap", { opacity: 1 }, 6.3);
      tl.set("#morphL", { opacity: 0 }, 6.32);
      tl.to(PUSH, { k: 1.025, duration: 7.5, ease: "sine.inOut" }, 6.3);
      halftone(DROP1, "#ff5a4a");

      // ---- 01 content ----
      tl.fromTo("#p1", { opacity: 0, y: 60, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", ...NI }, 6.55);
      const WK = proxy({ v: 40 }, (o) => ($("wkg").textContent = String(Math.round(o.v))));
      tl.to(WK, { v: 32, duration: 0.5, ease: "power1.inOut" }, WT[16]);
      tl.fromTo("#chip20", { opacity: 0, x: 20, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "back.out(2)", ...NI }, WT[17]);
      tl.to("#r2", { opacity: 1, duration: 0.3 }, WT[18] - 0.05);
      tl.set("#gArc", { opacity: 1 }, WT[18]);
      tl.fromTo("#gArc", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", ...NI }, WT[18]);
      tl.to("#r3", { opacity: 1, duration: 0.3 }, WT[20] - 0.05);
      tl.fromTo("#tFill", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "none", ...NI }, WT[20]);

      // ---- whip pan to 02 ----
      tl.to(PUSH, { k: 1, duration: 0.3, ease: "power2.inOut" }, 13.8);
      tl.to(PUSH, { k: 1.025, duration: 8, ease: "sine.inOut" }, 14.8);

      // ---- 02: the progress tree builds out of one badge ----
      const wv = [0, 1, 2, 3].map((i) => $("wv" + i));
      const WV = [60, 62.5, 65, 67.5];
      const xs = [37, 267, 497, 727];
      const wbT = [WT[33], WT[36], WT[37], WT[38]];
      wbT.forEach((at, i) => {
        if (i === 0) tl.fromTo("#wb0", { opacity: 0, scaleX: 0.2, scaleY: 0.6 }, { opacity: 1, scaleX: 1, scaleY: 1, duration: 0.5, ease: "back.out(1.8)", ...NI }, at);
        else tl.fromTo("#wb" + i, { opacity: 1, x: xs[i - 1] - xs[i] }, { x: 0, duration: 0.55, ease: "expo.out", ...NI }, at);
        const C = proxy({ v: i ? WV[i - 1] : 0 }, (o) => (wv[i].textContent = (Math.round(o.v * 2) / 2).toString()));
        tl.to(C, { v: WV[i], duration: 0.5, ease: "power2.out" }, at + 0.05);
      });
      tl.set("#tree", { opacity: 1 }, WT[40] - 0.15);
      tl.fromTo("#tree", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut", ...NI }, WT[40] - 0.15);
      const pgChars = splitChars($("pgL"));
      tl.set("#pgL", { opacity: 1 }, WT[40] + 0.2);
      charsIn(pgChars, WT[40] + 0.2, 0.04, 0.45);
      tl.fromTo("#pgV", { opacity: 0, y: 30, filter: "blur(14px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "expo.out", ...NI }, WT[40] + 0.3);
      const PG = proxy({ v: 0 }, (o) => ($("pgV").innerHTML = "+" + o.v.toFixed(1) + '%<span style="font-size:70px;color:#ff9a3c;vertical-align:top;margin-left:10px">▲</span>'));
      tl.to(PG, { v: 12.5, duration: 1.2, ease: "power2.out" }, WT[40] + 0.35);
      tl.to("#pgV", { color: "#ff9a3c", textShadow: "0 0 60px rgba(255,154,60,0.6)", duration: 0.4 }, WT[40] + 1.4);
      tl.fromTo("#chRep", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)", ...NI }, WT[40]);
      tl.fromTo("#chKg", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)", ...NI }, WT[44]);

      // ---- captions (generated from the voiceover) ----
      /*CAPTION_JS*/

      const DR = proxy({ t: 0 }, (o) => {
        const wall = renderWall(o.t);
        renderDumbbell(o.t, wall);
      });
      tl.fromTo(DR, { t: 0 }, { t: DUR, duration: DUR, ease: "none", ...NI }, 0);

      renderDumbbell(0, renderWall(0));
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
