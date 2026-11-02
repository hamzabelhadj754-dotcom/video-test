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
        --blue: #4c7dff;
        --violet: #8a5cff;
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
      /* ---------- background colour fields + light streaks (screen space) ---------- */
      #bgPar {
        position: absolute;
        left: -300px;
        top: -300px;
        width: 1680px;
        height: 2520px;
      }
      .blob {
        position: absolute;
        border-radius: 50%;
        opacity: 0;
      }
      .streak {
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
      }
      #halftone {
        z-index: 4;
        opacity: 0;
        background-image: radial-gradient(circle, var(--hc, #ff5a4a) 0 3.2px, transparent 3.8px);
        background-size: 26px 26px;
        -webkit-mask-image: radial-gradient(circle at 50% 42%, #000 0%, rgba(0, 0, 0, 0.5) 28%, transparent 58%);
        mask-image: radial-gradient(circle at 50% 42%, #000 0%, rgba(0, 0, 0, 0.5) 28%, transparent 58%);
        transform-origin: 540px 800px;
      }
      /* ---------- 3D world ---------- */
      #w3 {
        z-index: 5;
      }
      .w3 {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 0 0;
      }
      .in {
        position: relative;
      }
      .dec .in {
        opacity: 1;
      }
      .ct .in {
        opacity: 0;
      }
      .el img {
        display: block;
      }
      .gnum {
        font-size: 820px;
        line-height: 820px;
        font-weight: 700;
        letter-spacing: -0.06em;
        color: transparent;
      }
      .dust {
        position: absolute;
        left: 0;
        top: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      #world {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
        z-index: 6;
      }
      /* glass */
      .glass {
        position: relative;
        border-radius: 36px;
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
        border: 1.5px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18);
      }
      .chip {
        position: absolute;
        padding: 0 20px;
        height: 48px;
        line-height: 48px;
        border-radius: 24px;
        font-family: "Geist Mono", monospace;
        font-size: 24px;
        letter-spacing: 0.08em;
        opacity: 0;
      }
      /* hook */
      #hcPct {
        position: absolute;
        left: 56px;
        top: 86px;
        font-size: 168px;
        line-height: 168px;
        font-weight: 600;
        letter-spacing: -0.04em;
        color: var(--coral);
        text-shadow: 0 0 60px rgba(255, 90, 74, 0.6);
      }
      /* 01 panel rows */
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
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      .row .val {
        margin-left: auto;
        font-family: "Geist Mono", monospace;
        font-size: 44px;
        font-weight: 500;
      }
      .row.dim {
        opacity: 0.28;
      }
      /* 02 chart */
      .node {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
      }
      .node .dot {
        position: absolute;
        left: -13px;
        top: -13px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--ink);
        box-shadow: 0 0 0 5px rgba(255, 154, 60, 0.45), 0 0 26px rgba(255, 154, 60, 0.75);
      }
      .node .v {
        position: absolute;
        left: -90px;
        width: 180px;
        top: -66px;
        text-align: center;
        font-family: "Geist Mono", monospace;
        font-size: 30px;
        font-weight: 500;
      }
      .node .w {
        position: absolute;
        left: -90px;
        width: 180px;
        top: 26px;
        text-align: center;
        font-size: 24px;
      }
      #mirSw {
        position: absolute;
        left: -300px;
        top: -100px;
        width: 160px;
        height: 900px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
      }
      /* 03 */
      .day {
        position: relative;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.24);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Geist Mono", monospace;
        font-size: 24px;
        color: var(--mute);
      }
      .day .f {
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: var(--teal);
        box-shadow: 0 0 26px rgba(47, 227, 180, 0.75);
        opacity: 0;
      }
      .day span {
        position: relative;
      }
      /* outro */
      .ks {
        width: 1080px;
        text-align: center;
        font-size: 96px;
        line-height: 110px;
        font-weight: 600;
        letter-spacing: -0.03em;
        opacity: 0;
      }
      /* ---------- HUD ---------- */
      #hud {
        z-index: 8;
      }
      .pill {
        position: absolute;
        left: 340px;
        top: 250px;
        width: 400px;
        height: 84px;
        border-radius: 42px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18px;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.06em;
        opacity: 0;
        background: linear-gradient(160deg, rgba(44, 44, 50, 0.92), rgba(14, 14, 16, 0.92));
        border: 1.5px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.14);
      }
      .pill .n {
        font-family: "Geist Mono", monospace;
        font-weight: 500;
      }
      .pill .sw {
        position: absolute;
        left: -160px;
        top: 0;
        width: 140px;
        height: 84px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
      }
      .capl {
        z-index: 9;
      }
      #b1w,
      #b2w,
      #b3w,
      #b4w {
        z-index: 8;
      }
      .capline {
        position: absolute;
        left: 90px;
        width: 900px;
        top: 1256px;
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
        background: radial-gradient(120% 75% at 50% 42%, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.72) 100%);
      }
      #grain {
        z-index: 12;
        opacity: 0.07;
        mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>");
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="46"
      data-width="1080"
      data-height="1920"
      data-motion-blur="on"
      data-motion-blur-shutter="240"
      data-motion-blur-events="on"
    >
      <!-- colour fields: one per section, they crossfade and drift against the camera -->
      <div id="bg" class="layer">
        <div id="bgPar">
          <div id="bl-h" class="blob" style="left: 240px; top: 620px; width: 1200px; height: 1200px; background: radial-gradient(circle, rgba(255, 90, 74, 0.28), rgba(255, 90, 74, 0.08) 35%, rgba(0, 0, 0, 0) 65%)"></div>
          <div id="bl-e" class="blob" style="left: 140px; top: 420px; width: 1400px; height: 1400px; background: radial-gradient(circle, rgba(255, 70, 60, 0.3), rgba(160, 20, 40, 0.1) 38%, rgba(0, 0, 0, 0) 66%)"></div>
          <div id="bl-o" class="blob" style="left: 300px; top: 500px; width: 1400px; height: 1400px; background: radial-gradient(circle, rgba(255, 154, 60, 0.3), rgba(255, 110, 20, 0.09) 38%, rgba(0, 0, 0, 0) 66%)"></div>
          <div id="bl-p" class="blob" style="left: 160px; top: 480px; width: 1400px; height: 1400px; background: radial-gradient(circle, rgba(47, 227, 180, 0.24), rgba(20, 140, 160, 0.09) 38%, rgba(0, 0, 0, 0) 66%)"></div>
          <div id="bl-s" class="blob" style="left: 200px; top: 300px; width: 1400px; height: 1400px; background: radial-gradient(circle, rgba(76, 125, 255, 0.3), rgba(138, 92, 255, 0.12) 40%, rgba(0, 0, 0, 0) 66%)"></div>
          <div id="bl-x" class="blob" style="left: 240px; top: 600px; width: 1300px; height: 1300px; background: radial-gradient(circle, rgba(255, 154, 60, 0.22), rgba(255, 90, 74, 0.07) 38%, rgba(0, 0, 0, 0) 66%)"></div>
        </div>
      </div>
      <div id="halftone" class="layer" data-layout-ignore></div>

      <!-- ===================== 3D WORLD ===================== -->
      <div id="w3" class="layer" data-layout-allow-overlap data-layout-allow-overflow>
        <!-- HOOK -->
        <div class="w3 el dec" data-sec="h" data-lx="0" data-ly="-120" data-lz="-760" data-blur="1"><div class="in"><img src="assets/elements/statue-back.png" style="width: 940px; -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 96%); mask-image: linear-gradient(180deg, #000 55%, transparent 96%); filter: brightness(0.8) drop-shadow(0 0 40px rgba(255, 90, 74, 0.55))" /></div></div>
        <div class="w3 el dec" data-sec="h" data-lx="400" data-ly="-560" data-lz="-260"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 230px; filter: drop-shadow(0 0 24px rgba(255, 90, 74, 0.6))" /></div></div>
        <div class="w3" id="hcW" data-sec="h" data-lx="0" data-ly="60" data-lz="0" data-face="1">
          <div class="in" id="hcIn" style="opacity: 1">
            <div class="glass" id="hc" style="width: 760px; height: 460px">
              <div class="mono lbl" style="position: absolute; left: 56px; top: 44px">Body change</div>
              <div class="mono lbl" style="position: absolute; right: 56px; top: 44px">12 weeks</div>
              <div id="hcPct">0%</div>
              <svg width="648" height="160" viewBox="0 0 648 160" style="position: absolute; left: 56px; top: 258px">
                <line x1="0" y1="20" x2="648" y2="20" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
                <line x1="0" y1="70" x2="648" y2="70" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
                <line x1="0" y1="120" x2="648" y2="120" stroke="rgba(255,255,255,0.07)" stroke-width="2" />
                <path id="hcLine" opacity="0" pathLength="1" d="M 0 120 L 54 118 L 108 121 L 162 119 L 216 120 L 270 118 L 324 121 L 378 119 L 432 120 L 486 119 L 540 121 L 594 119 L 640 120" fill="none" stroke="#f2f2f2" stroke-width="5" stroke-linecap="butt" stroke-linejoin="round" style="stroke-dasharray: 1; stroke-dashoffset: 1" />
                <circle id="hcDot" cx="640" cy="120" r="11" fill="#ff5a4a" opacity="0" style="filter: drop-shadow(0 0 10px #ff5a4a)" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 01 EGO (coral) -->
        <div class="w3 el dec" data-sec="e" data-lx="-360" data-ly="-430" data-lz="-1000" data-blur="2"><div class="in"><img id="ePlate" src="assets/elements/plate.png" style="width: 520px; filter: brightness(0.9) drop-shadow(0 0 30px rgba(255, 90, 74, 0.5))" /></div></div>
        <div class="w3 el dec" data-sec="e" data-lx="380" data-ly="-470" data-lz="-380"><div class="in"><img src="assets/elements/chrome-swirl.png" style="width: 250px; filter: drop-shadow(0 0 22px rgba(255, 90, 74, 0.55))" /></div></div>
        <div class="w3 ct" id="eGlowW" data-sec="e" data-lx="0" data-ly="-150" data-lz="-260"><div class="in" id="eGlow"><div style="width: 1000px; height: 1000px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 90, 74, 0.5), rgba(255, 60, 50, 0.14) 38%, rgba(0, 0, 0, 0) 66%)"></div></div></div>
        <div class="w3 ct" id="p1W" data-sec="e" data-lx="0" data-ly="250" data-lz="40" data-face="1">
          <div class="in" id="p1">
            <div class="glass" style="width: 760px; height: 288px">
              <div id="r1" class="row" style="top: 0">
                <span class="mono lbl">Weight</span>
                <div id="chip20" class="chip" style="left: 330px; top: 24px; background: rgba(255, 90, 74, 0.16); border: 1.5px solid rgba(255, 90, 74, 0.6); color: var(--coral); box-shadow: 0 0 30px rgba(255, 90, 74, 0.35)">−20%</div>
                <span class="val"><span id="wkg">40</span><span style="color: var(--mute); font-size: 30px"> kg</span></span>
              </div>
              <div id="r2" class="row dim" style="top: 96px">
                <span class="mono lbl">Range</span>
                <svg style="margin-left: auto; margin-right: 24px" width="120" height="64" viewBox="0 0 120 64">
                  <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="8" stroke-linecap="round" />
                  <path id="gArc" opacity="0" pathLength="1" d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="#ff5a4a" stroke-width="8" stroke-linecap="butt" style="stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 6px #ff5a4a)" />
                </svg>
                <span class="val" style="margin-left: 0; font-size: 34px">FULL</span>
              </div>
              <div id="r3" class="row dim" style="top: 192px">
                <span class="mono lbl">Tempo</span>
                <div style="position: relative; margin-left: auto; margin-right: 24px; width: 240px; height: 12px; border-radius: 6px; background: rgba(255, 255, 255, 0.12); overflow: hidden">
                  <div id="tFill" style="position: absolute; left: 0; top: 0; width: 240px; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #ff3d3d, #ff8a5a); transform-origin: 0 50%"></div>
                </div>
                <span class="val" style="margin-left: 0; font-size: 34px">3s ↓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 02 OVERLOAD (amber) -->
        <div class="w3 el dec" data-sec="o" data-lx="430" data-ly="-560" data-lz="-1100" data-blur="2"><div class="in"><img id="oPlate" src="assets/elements/plate.png" style="width: 600px; filter: brightness(0.95) drop-shadow(0 0 34px rgba(255, 154, 60, 0.55))" /></div></div>
        <div class="w3 el dec" data-sec="o" data-lx="-560" data-ly="900" data-lz="-480"><div class="in"><img src="assets/elements/chrome-blob.png" style="width: 300px; filter: drop-shadow(0 0 24px rgba(255, 154, 60, 0.6))" /></div></div>
        <div class="w3 ct" id="pgW" data-sec="o" data-lx="0" data-ly="-330" data-lz="60" data-face="1">
          <div class="in" id="pg" style="width: 900px; text-align: center">
            <div class="mono lbl">Progress</div>
            <div id="pgV" style="font-size: 120px; line-height: 130px; font-weight: 600; letter-spacing: -0.03em">+0%</div>
          </div>
        </div>
        <div class="w3 ct" id="p2W" data-sec="o" data-lx="0" data-ly="160" data-lz="0" data-face="1">
          <div class="in" id="p2">
            <div class="glass" style="width: 840px; height: 470px">
              <svg width="840" height="470" viewBox="0 0 840 470" style="position: absolute; left: 0; top: 0">
                <path id="upLine" opacity="0" pathLength="1" d="M 130 380 L 330 310 L 530 240 L 730 170" fill="none" stroke="#ff9a3c" stroke-width="5" stroke-linecap="butt" stroke-linejoin="round" style="stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 10px rgba(255,154,60,0.9))" />
                <path id="flatLine" d="M 130 380 L 730 380" fill="none" stroke="rgba(242,242,242,0.55)" stroke-width="4" stroke-dasharray="12 12" style="opacity: 0" />
              </svg>
              <div id="n0" class="node" style="left: 130px; top: 380px"><div class="v">60</div><div class="dot"></div><div class="w mono lbl">W1</div></div>
              <div id="n1" class="node" style="left: 330px; top: 310px"><div class="v">62.5</div><div class="dot"></div><div class="w mono lbl">W2</div></div>
              <div id="n2" class="node" style="left: 530px; top: 240px"><div class="v">65</div><div class="dot"></div><div class="w mono lbl">W3</div></div>
              <div id="n3" class="node" style="left: 730px; top: 170px"><div class="v">67.5</div><div class="dot"></div><div class="w mono lbl">W4</div></div>
              <div id="chRep" class="chip" style="left: 48px; top: 40px; background: rgba(255, 154, 60, 0.14); border: 1.5px solid rgba(255, 154, 60, 0.6); color: var(--amber); box-shadow: 0 0 30px rgba(255, 154, 60, 0.35)">+1 REP</div>
              <div id="chKg" class="chip" style="left: 48px; top: 104px; background: rgba(255, 154, 60, 0.14); border: 1.5px solid rgba(255, 154, 60, 0.6); color: var(--amber); box-shadow: 0 0 30px rgba(255, 154, 60, 0.35)">+2.5 KG</div>
            </div>
          </div>
        </div>
        <div class="w3 ct" id="mirW" data-sec="o" data-lx="0" data-ly="10" data-lz="420" data-face="1">
          <div class="in" id="mir">
            <div class="glass" style="width: 340px; height: 480px; overflow: hidden; background: linear-gradient(170deg, rgba(58, 58, 64, 0.96), rgba(16, 16, 18, 0.96) 55%, rgba(34, 34, 38, 0.96))">
              <img src="assets/elements/statue-head.png" style="position: absolute; left: 15px; top: 86px; width: 310px; -webkit-mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%); mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%); opacity: 0.85; filter: grayscale(1) brightness(0.85)" />
              <div id="mirSw"></div>
              <div class="mono lbl" style="position: absolute; left: 0; width: 340px; top: 34px; text-align: center">Mirror</div>
              <div id="mirNo" class="mono" style="position: absolute; left: 0; width: 340px; top: 418px; text-align: center; font-size: 26px; color: var(--amber); text-shadow: 0 0 24px rgba(255, 154, 60, 0.6); opacity: 0">No change</div>
            </div>
          </div>
        </div>

        <!-- 03 PROTEIN (teal) -->
        <div class="w3 el ct" id="eggW" data-sec="p" data-lx="-290" data-ly="-390" data-lz="120"><div class="in" id="egg"><img src="assets/elements/egg.png" style="width: 270px; filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 30px rgba(47, 227, 180, 0.35))" /></div></div>
        <div class="w3 el ct" id="steakW" data-sec="p" data-lx="320" data-ly="-470" data-lz="-340" data-blur="1"><div class="in" id="steak"><img src="assets/elements/steak.png" style="width: 480px; filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 30px rgba(47, 227, 180, 0.3))" /></div></div>
        <div class="w3 el ct" id="shakerW" data-sec="p" data-lx="330" data-ly="110" data-lz="160"><div class="in" id="shaker"><img src="assets/elements/shaker.png" style="width: 210px; filter: drop-shadow(0 0 30px rgba(47, 227, 180, 0.5))" /></div></div>
        <div class="w3 el dec" data-sec="p" data-lx="-470" data-ly="250" data-lz="-460"><div class="in"><img src="assets/elements/chrome-blob.png" style="width: 260px; filter: drop-shadow(0 0 22px rgba(47, 227, 180, 0.6))" /></div></div>
        <div class="w3 ct" id="protW" data-sec="p" data-lx="0" data-ly="-70" data-lz="0" data-face="1">
          <div class="in" id="protG" style="width: 900px; text-align: center">
            <div id="prot" style="font-size: 250px; line-height: 250px; font-weight: 600; letter-spacing: -0.05em">0.0</div>
            <div class="mono lbl" style="margin-top: 6px">g per kg · body weight</div>
          </div>
        </div>
        <div class="w3 ct" id="daysW" data-sec="p" data-lx="0" data-ly="320" data-lz="80" data-face="1">
          <div class="in" id="days" style="display: flex; gap: 22px">
            <div class="day"><div class="f"></div><span>M</span></div>
            <div class="day"><div class="f"></div><span>T</span></div>
            <div class="day"><div class="f"></div><span>W</span></div>
            <div class="day"><div class="f"></div><span>T</span></div>
            <div class="day"><div class="f"></div><span>F</span></div>
            <div class="day"><div class="f"></div><span>S</span></div>
            <div class="day"><div class="f"></div><span>S</span></div>
          </div>
        </div>

        <!-- 04 SLEEP (blue) -->
        <div class="w3 el ct" id="moonW" data-sec="s" data-lx="40" data-ly="-400" data-lz="-900"><div class="in" id="moon"><img src="assets/elements/moon.png" style="width: 560px; filter: brightness(0.95) drop-shadow(0 0 50px rgba(120, 160, 255, 0.75)) drop-shadow(0 0 140px rgba(76, 125, 255, 0.5))" /></div></div>
        <div class="w3 el dec" data-sec="s" data-lx="-420" data-ly="-520" data-lz="-320"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 230px; filter: drop-shadow(0 0 24px rgba(76, 125, 255, 0.7))" /></div></div>
        <div class="w3 ct" id="ringW" data-sec="s" data-lx="0" data-ly="40" data-lz="0" data-face="1">
          <div class="in" id="ringIn" style="width: 440px; height: 440px">
            <svg width="440" height="440" viewBox="0 0 440 440" style="position: absolute; left: 0; top: 0">
              <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c7dff" /><stop offset="1" stop-color="#8a5cff" /></linearGradient></defs>
              <circle cx="220" cy="220" r="190" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="14" />
              <circle id="ringP" opacity="0" cx="220" cy="220" r="190" fill="none" stroke="url(#rg)" stroke-width="14" stroke-linecap="butt" pathLength="1" transform="rotate(-90 220 220)" style="stroke-dasharray: 1; stroke-dashoffset: 1; filter: drop-shadow(0 0 12px rgba(76,125,255,0.9))" />
            </svg>
            <div id="sleepH" style="position: absolute; left: 0; width: 440px; top: 150px; text-align: center; font-size: 104px; line-height: 110px; font-weight: 600; letter-spacing: -0.03em">0h</div>
            <div class="mono lbl" style="position: absolute; left: 0; width: 440px; top: 262px; text-align: center">per night</div>
          </div>
        </div>
        <div class="w3 ct" id="recW" data-sec="s" data-lx="0" data-ly="300" data-lz="90" data-face="1">
          <div class="in" id="rec" style="width: 760px; height: 110px">
            <div class="mono lbl" style="position: absolute; left: 0; top: 14px">Recovery</div>
            <div id="recV" class="mono" style="position: absolute; right: 0; top: 8px; font-size: 32px">0%</div>
            <div style="position: absolute; left: 0; top: 64px; width: 760px; height: 22px; border-radius: 11px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); overflow: hidden">
              <div id="recFill" style="position: absolute; left: 0; top: 0; width: 760px; height: 22px; border-radius: 11px; background: linear-gradient(90deg, #4c7dff, #8a5cff); box-shadow: 0 0 30px rgba(76, 125, 255, 0.8); transform-origin: 0 50%"></div>
            </div>
          </div>
        </div>

        <!-- OUTRO -->
        <div class="w3 el ct" id="xStatW" data-sec="x" data-lx="0" data-ly="-170" data-lz="-900" data-blur="1"><div class="in" id="xStat"><img src="assets/elements/statue-head.png" style="width: 1020px; -webkit-mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%); mask-image: radial-gradient(ellipse 48% 50% at 50% 46%, #000 52%, transparent 100%); filter: brightness(0.62) drop-shadow(0 0 50px rgba(255, 154, 60, 0.45))" /></div></div>
        <div class="w3 ct" id="ksW" data-sec="x" data-lx="0" data-ly="40" data-lz="0" data-face="1">
          <div class="in" id="ks" style="opacity: 1">
            <div id="k0" class="ks">Train with intent.</div>
            <div id="k1" class="ks">Eat.</div>
            <div id="k2" class="ks">Sleep.</div>
            <div id="k3" class="ks" style="color: var(--amber); text-shadow: 0 0 50px rgba(255, 154, 60, 0.6)">Repeat.</div>
          </div>
        </div>
        <div class="w3 ct" id="mpW" data-sec="x" data-lx="0" data-ly="40" data-lz="140" data-face="1">
          <div class="in" id="mpIn" style="opacity: 1; width: 1080px; text-align: center">
            <div id="mpw" style="font-size: 82px; line-height: 96px; font-weight: 600; letter-spacing: -0.03em; opacity: 0">Most people won't.</div>
            <div id="mpn" style="margin-top: 22px; font-size: 36px; line-height: 52px; color: var(--mute)"><span class="cw" id="m0">That's</span> <span class="cw" id="m1">why</span> <span class="cw" id="m2">most</span> <span class="cw" id="m3">people</span> <span class="cw" id="m4">never</span> <span class="cw" id="m5">change.</span></div>
          </div>
        </div>
        <div class="w3 ct" id="logoW" data-sec="x" data-lx="0" data-ly="140" data-lz="0" data-face="1">
          <div class="in" id="logoIn" style="opacity: 1; width: 1080px; height: 220px">
            <div id="logo" style="position: absolute; left: 0; width: 1080px; top: 20px; text-align: center; font-size: 76px; line-height: 84px; font-weight: 600; letter-spacing: 0.42em; padding-left: 0.42em; text-shadow: 0 0 40px rgba(255, 154, 60, 0.35); clip-path: inset(100% 0% 0% 0%)">GAINS DOM</div>
            <div id="ll" style="position: absolute; left: 110px; top: 118px; width: 860px; height: 3px; background: linear-gradient(90deg, rgba(255, 90, 74, 0), #ff5a4a 12%, #ff9a3c 35%, #ffffff 50%, #2fe3b4 66%, #4c7dff 88%, rgba(76, 125, 255, 0)); box-shadow: 0 0 24px rgba(255, 154, 60, 0.8)"></div>
            <div id="tag" class="mono" style="position: absolute; left: 0; width: 1080px; top: 150px; text-align: center; font-size: 22px; color: var(--mute); opacity: 0">Dark fitness truth · daily</div>
          </div>
        </div>

        <!-- travel elements: big chrome shapes the camera flies past between scenes -->
        <div class="w3 el dec" data-sec="w" data-wx="260" data-wy="-320" data-wz="-2100"><div class="in"><img src="assets/elements/chrome-swirl.png" style="width: 360px" /></div></div>
        <div class="w3 el dec" data-sec="w" data-wx="-330" data-wy="420" data-wz="-2700"><div class="in"><img src="assets/elements/chrome-blob.png" style="width: 340px" /></div></div>
        <div class="w3 el dec" data-sec="w" data-wx="1500" data-wy="-380" data-wz="-4500"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 320px" /></div></div>
        <div class="w3 el dec" data-sec="w" data-wx="3300" data-wy="-1300" data-wz="-6600"><div class="in"><img src="assets/elements/chrome-swirl.png" style="width: 380px" /></div></div>
        <div class="w3 el dec" data-sec="w" data-wx="1700" data-wy="-2500" data-wz="-9300"><div class="in"><img src="assets/elements/chrome-blob.png" style="width: 340px" /></div></div>
        <div class="w3 el dec" data-sec="w" data-wx="-760" data-wy="-3500" data-wz="-12500"><div class="in"><img src="assets/elements/chrome-star.png" style="width: 300px" /></div></div>
        <div id="dustBox"></div>
      </div>
      <canvas id="world" width="1080" height="1920"></canvas>

      <!-- ===================== HUD ===================== -->
      <div id="b1w" class="clip layer" data-start="5.0" data-duration="9.2" data-track-index="7"><div id="b1" class="pill"><div class="sw" data-layout-ignore></div><span class="n" style="color: var(--coral)">01</span><span>EGO</span></div></div>
      <div id="b2w" class="clip layer" data-start="14.05" data-duration="9.4" data-track-index="7"><div id="b2" class="pill"><div class="sw" data-layout-ignore></div><span class="n" style="color: var(--amber)">02</span><span>OVERLOAD</span></div></div>
      <div id="b3w" class="clip layer" data-start="23.55" data-duration="7.15" data-track-index="7"><div id="b3" class="pill"><div class="sw" data-layout-ignore></div><span class="n" style="color: var(--teal)">03</span><span>PROTEIN</span></div></div>
      <div id="b4w" class="clip layer" data-start="30.7" data-duration="6.6" data-track-index="7"><div id="b4" class="pill"><div class="sw" data-layout-ignore></div><span class="n" style="color: var(--blue)">04</span><span>SLEEP</span></div></div>

      /*CAPTION_HTML*/

      <div id="fx" class="layer" data-layout-ignore style="z-index: 7">
      </div>
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
      const backOut = (x, s = 1.4) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
      const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
      const E = {
        none: (x) => x,
        sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
        cubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
        outCubic: (x) => 1 - Math.pow(1 - x, 3),
        outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
        expo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
        inQuad: (x) => x * x,
      };
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

      // ===================== CAMERA =====================
      const F = 1400; // focal length: things at this depth are drawn at their native size
      const SEC = {
        h: { c: [0, 0, 0], yaw: 0 },
        e: { c: [0, 0, -4200], yaw: 0 },
        o: { c: [3000, 0, -5600], yaw: 0.5 },
        p: { c: [3000, -2800, -8200], yaw: 0.5 },
        s: { c: [200, -2800, -10700], yaw: -0.35 },
        x: { c: [200, -2800, -14300], yaw: 0 },
      };
      const fwd = (y) => [Math.sin(y), 0, -Math.cos(y)];
      const rgt = (y) => [Math.cos(y), 0, Math.sin(y)];
      function worldPos(sec, lx, ly, lz) {
        const S = SEC[sec];
        const f = fwd(S.yaw);
        const r = rgt(S.yaw);
        return [S.c[0] + r[0] * lx - f[0] * lz, S.c[1] + ly, S.c[2] + r[2] * lx - f[2] * lz];
      }
      // A camera pose relative to a section: orbit (dyaw) around its centre, dolly toward it.
      function pose(sec, dolly = 0, dyaw = 0, dx = 0, dy = 0, focusOff = 0) {
        const S = SEC[sec];
        const yaw = S.yaw + dyaw;
        const f = fwd(yaw);
        const r = rgt(yaw);
        const dist = F - dolly;
        return { x: S.c[0] - f[0] * dist + r[0] * dx, y: S.c[1] + dy, z: S.c[2] - f[2] * dist + r[2] * dx, yaw, focus: dist - focusOff };
      }
      // Camera keyframes: [time, pose, ease used to reach this key from the previous one]
      const K = [
        [0.0, pose("h", -520, -0.1, 0, 30), "none"],
        [3.6, pose("h", 120, 0.04), "cubic"],
        [3.98, pose("h", 260, 0.05), "inQuad"],
        [4.9, pose("e", -520, 0.12), "expo"], // fly forward through the card
        [6.0, pose("e", 0, 0.03), "outCubic"],
        [13.6, pose("e", 170, -0.07), "sine"],
        [14.5, pose("o", -320, -0.16), "expo"], // swing right
        [15.4, pose("o", 0, -0.03), "outCubic"],
        [21.3, pose("o", 110, 0.05), "sine"],
        [22.2, pose("o", 100, 0.02, 0, 0, 420), "cubic"], // push to the mirror, focus on it
        [23.0, pose("o", 140, 0.02, 0, 0, 420), "sine"],
        [23.8, pose("p", -320, 0.0, 0, 120), "expo"], // crane up
        [24.7, pose("p", 0, -0.04), "outCubic"],
        [30.3, pose("p", 180, 0.06), "sine"],
        [31.1, pose("s", -320, 0.18), "expo"], // swing left
        [32.0, pose("s", 0, 0.04), "outCubic"],
        [36.85, pose("s", 200, -0.05), "sine"],
        [37.6, pose("x", -640, 0), "expo"], // dolly into the finale
        [38.4, pose("x", -120, 0.02), "outCubic"],
        [41.2, pose("x", 60, -0.02), "sine"],
        [41.9, pose("x", 120, 0), "outExpo"],
        [44.6, pose("x", 170, 0.01), "sine"],
        [45.3, pose("x", 110, 0), "outCubic"],
        [46.0, pose("x", 150, 0), "sine"],
      ];
      // Smooth camera: monotone cubic spline through every key, so speed is continuous
      // across transitions (no frame where the camera lurches or stops dead).
      const KT = K.map((k) => k[0]);
      const COMP = ["x", "y", "z", "yaw", "focus"];
      const TAN = {};
      for (const c of COMP) {
        const v = K.map((k) => k[1][c]);
        const n = v.length;
        const d = [];
        for (let i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / (KT[i + 1] - KT[i]));
        const m = new Array(n).fill(0);
        m[0] = d[0];
        m[n - 1] = d[n - 2];
        for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
        for (let i = 0; i < n - 1; i++) {
          if (d[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
          }
          const a1 = m[i] / d[i];
          const b1 = m[i + 1] / d[i];
          const h = Math.hypot(a1, b1);
          if (h > 3) {
            m[i] = (3 * a1 * d[i]) / h;
            m[i + 1] = (3 * b1 * d[i]) / h;
          }
        }
        TAN[c] = { v, m };
      }
      function camAt(t) {
        t = clamp(t, KT[0], KT[KT.length - 1]);
        let i = 0;
        while (i < KT.length - 2 && t >= KT[i + 1]) i++;
        const h = KT[i + 1] - KT[i];
        const u = (t - KT[i]) / h;
        const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
        const h10 = u ** 3 - 2 * u ** 2 + u;
        const h01 = -2 * u ** 3 + 3 * u ** 2;
        const h11 = u ** 3 - u ** 2;
        const o = {};
        for (const c of COMP) {
          const { v, m } = TAN[c];
          o[c] = h00 * v[i] + h10 * h * m[i] + h01 * v[i + 1] + h11 * h * m[i + 1];
        }
        return o;
      }
      function project(cam, P) {
        const d = [P[0] - cam.x, P[1] - cam.y, P[2] - cam.z];
        const f = fwd(cam.yaw);
        const r = rgt(cam.yaw);
        const depth = d[0] * f[0] + d[2] * f[2];
        const xs = d[0] * r[0] + d[2] * r[2];
        const s = F / Math.max(depth, 1);
        return { X: 540 + xs * s, Y: 760 + d[1] * s, s, depth };
      }

      // ===================== WORLD ELEMENTS =====================
      const els = [...document.querySelectorAll(".w3")].map((el) => {
        const sec = el.dataset.sec;
        const P = sec === "w" ? [+el.dataset.wx, +el.dataset.wy, +el.dataset.wz] : worldPos(sec, +el.dataset.lx, +el.dataset.ly, +el.dataset.lz);
        return { el, P, face: el.dataset.face === "1", sec, blur: +(el.dataset.blur || 0), w: 0, h: 0 };
      });
      // dust spread along the whole flight path
      const dustBox = $("dustBox");
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const dust = [];
      for (let i = 0; i < 150; i++) {
        const e = document.createElement("div");
        e.className = "dust";
        const warm = rnd();
        const col = warm < 0.45 ? "255,170,110" : warm < 0.7 ? "255,255,255" : warm < 0.85 ? "120,170,255" : "90,240,200";
        const sz = 3 + rnd() * 6;
        e.style.width = e.style.height = sz + "px";
        e.style.background = `rgba(${col},0.95)`;
        e.style.boxShadow = `0 0 ${sz * 2}px rgba(${col},0.8)`;
        dustBox.appendChild(e);
        dust.push({ e, P: [-1200 + rnd() * 5600, -4200 + rnd() * 5400, 1200 - rnd() * 16500] });
      }
      const bgPar = $("bgPar");
      function renderWorld(cam) {
        for (const o of els) {
          const p = project(cam, o.P);
          const vis = p.depth > 140 && p.depth < 9000;
          o.el.style.visibility = vis ? "visible" : "hidden";
          if (!vis) continue;
          if (!o.h) {
            o.w = o.el.offsetWidth;
            o.h = o.el.offsetHeight;
          }
          const near = clamp((p.depth - 140) / 380, 0, 1);
          const far = clamp((9000 - p.depth) / 2500, 0, 1);
          const dof = clamp(Math.abs(p.depth - cam.focus) / 300, 0, 10) + o.blur;
          let tr = `translate(${p.X.toFixed(1)}px, ${p.Y.toFixed(1)}px) scale(${p.s.toFixed(4)}) translate(${(-o.w / 2).toFixed(1)}px, ${(-o.h / 2).toFixed(1)}px)`;
          if (o.face) tr += ` perspective(1400px) rotateY(${((-(cam.yaw - SEC[o.sec].yaw) * 180) / Math.PI).toFixed(2)}deg)`;
          o.el.style.transform = tr;
          o.el.style.opacity = (near * far).toFixed(3);
          o.el.style.filter = dof > 0.3 ? `blur(${dof.toFixed(1)}px)` : "none";
          o.el.style.zIndex = String(Math.round(100000 / p.depth));
        }
        for (const d of dust) {
          const p = project(cam, d.P);
          const vis = p.depth > 60 && p.depth < 7000;
          d.e.style.visibility = vis ? "visible" : "hidden";
          if (!vis) continue;
          const sc = clamp(p.s, 0.05, 6);
          d.e.style.transform = `translate(${p.X.toFixed(1)}px, ${p.Y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
          d.e.style.opacity = (clamp((p.depth - 60) / 300, 0, 1) * clamp((7000 - p.depth) / 2000, 0, 1) * 0.8).toFixed(3);
          d.e.style.zIndex = String(Math.round(100000 / p.depth));
        }
        // colour fields drift against the camera for a sense of travel
        bgPar.style.transform = `translate(${(-cam.yaw * 520 - ((cam.x * 0.03) % 200)).toFixed(1)}px, ${(-(cam.y * 0.04)).toFixed(1)}px)`;
      }

      // ===================== 3D DUMBBELL (01) =====================
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
      function plateGeo(R, T, r0) {
        const h = T / 2;
        const b = 0.045;
        const p = [V2(r0, -h + 0.012), V2(R - 0.13, -h + 0.012), V2(R - 0.11, -h)];
        arc(p, R - b, -h + b, b, -Math.PI / 2, 0, 10);
        arc(p, R - b, h - b, b, 0, Math.PI / 2, 10);
        p.push(V2(R - 0.11, h), V2(R - 0.13, h - 0.012), V2(r0, h - 0.012), V2(r0, -h + 0.012));
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
      const DB_P = worldPos("e", 0, -150, 0);
      let lastVis = true;
      function renderDumbbell(t, cam) {
        const on = t > 3.9 && t < 14.6;
        const p = project(cam, DB_P);
        if (!on || p.depth < 200) {
          if (lastVis) {
            renderer.clear();
            lastVis = false;
          }
          return;
        }
        lastVis = true;
        const g = clamp((t - (WT[10] - 0.9)) / 1.1, 0, 1);
        const s = backOut(g, 1.2);
        posG.position.set((p.X - 540) * UPP, (960 - p.Y) * UPP, 0);
        posG.scale.setScalar(Math.max(0.0001, s * 0.8 * p.s));
        spinG.rotation.y = 0.55 * Math.sin((t - 5) * 0.55) - 0.35 + cam.yaw * 1.2 - 2.2 * Math.pow(1 - g, 3);
        rim.intensity = 2.2 + 2.4 * bump(t, WT[25], WT[31] + 0.2);
        canvas.style.filter = `blur(${clamp(Math.abs(p.depth - cam.focus) / 300, 0, 8).toFixed(1)}px)`;
        renderer.render(scene, camera);
      }

      // ===================== TIMELINE =====================
      const tl = gsap.timeline({ paused: true });
      const NI = { immediateRender: false };
      const inBlur = (sel, at, d = 0.6, y = 22, extra = {}) =>
        tl.fromTo(sel, { opacity: 0, y, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: d, ease: "expo.out", ...NI, ...extra }, at);
      const outBlur = (sel, at, d = 0.3) => tl.to(sel, { opacity: 0, filter: "blur(10px)", duration: d, ease: "power3.in" }, at);
      function wordIn(id, at) {
        tl.fromTo("#" + id, { opacity: 0, y: 10, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.32, ease: "power3.out", ...NI }, at);
      }
      function capOut(id, at) {
        tl.to("#" + id + " .capline", { opacity: 0, y: -10, filter: "blur(8px)", duration: 0.22, ease: "power2.in" }, at);
      }
      const FLASH = {
        coral: "radial-gradient(70% 45% at 50% 42%, rgba(255,170,150,0.9), rgba(255,90,74,0.35) 45%, rgba(0,0,0,0) 75%)",
        amber: "radial-gradient(70% 45% at 50% 42%, rgba(255,210,150,0.9), rgba(255,154,60,0.35) 45%, rgba(0,0,0,0) 75%)",
        teal: "radial-gradient(70% 45% at 50% 42%, rgba(190,255,235,0.85), rgba(47,227,180,0.3) 45%, rgba(0,0,0,0) 75%)",
        blue: "radial-gradient(70% 45% at 50% 42%, rgba(190,210,255,0.9), rgba(76,125,255,0.35) 45%, rgba(0,0,0,0) 75%)",
      };
      const flashAt = (at, col, peak = 0.3) => {
        tl.set("#flash", { backgroundImage: FLASH[col] }, at - 0.01);
        tl.to("#flash", { opacity: peak, duration: 0.12, ease: "power2.out" }, at);
        tl.to("#flash", { opacity: 0, duration: 0.5, ease: "power2.in" }, at + 0.12);
      };
      const halftone = (at, col) => {
        tl.set("#halftone", { "--hc": col }, at - 0.01);
        tl.to("#halftone", { keyframes: [{ opacity: 0.55, scale: 1.0, duration: 0.18, ease: "power2.out" }, { opacity: 0, scale: 1.5, duration: 0.6, ease: "power2.in" }] }, at);
      };
      const field = (id, at, on = true) => tl.to("#" + id, { opacity: on ? 1 : 0, duration: 0.9, ease: "power2.inOut" }, at);
      const streak = (id, at, end) => {
        tl.fromTo("#" + id, { opacity: 0, x: -120 }, { opacity: 0.85, x: 0, duration: 1.0, ease: "power2.out", ...NI }, at);
        tl.to("#" + id, { x: 160, duration: end - at - 1.0, ease: "none" }, at + 1.0);
        tl.to("#" + id, { opacity: 0, duration: 0.5, ease: "power2.in" }, end - 0.3);
      };
      const badge = (id, at, end) => {
        tl.fromTo("#" + id, { opacity: 0, y: -16, scale: 0.92, filter: "blur(10px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out", ...NI }, at);
        tl.fromTo("#" + id + " .sw", { x: 0 }, { x: 720, duration: 0.9, ease: "power2.inOut", ...NI }, at + 0.15);
        tl.to("#" + id, { opacity: 0, y: -14, filter: "blur(10px)", duration: 0.3, ease: "power2.in" }, end);
      };
      tl.set(["#tFill", "#recFill", "#ll"], { scaleX: 0 }, 0);

      // ---- colour fields per section ----
      tl.set("#bl-h", { opacity: 1 }, 0);
      field("bl-h", 4.1, false);
      field("bl-e", 4.1);
      field("bl-e", 13.7, false);
      field("bl-o", 13.7);
      field("bl-o", 23.0, false);
      field("bl-p", 23.0);
      field("bl-p", 30.3, false);
      field("bl-s", 30.3);
      field("bl-s", 36.9, false);
      field("bl-x", 36.9);

      // ---- HOOK ----
      tl.set("#hcLine", { opacity: 1 }, 0.15);
      tl.fromTo("#hcLine", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: "none", ...NI }, 0.15);
      tl.fromTo("#hcDot", { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)", ...NI }, 2.5);
      for (const [o, at] of [[0.25, WT[6]], [1, WT[6] + 0.08], [0.35, WT[7]], [1, WT[7] + 0.1], [0.3, WT[7] + 0.32], [1, WT[7] + 0.4]]) tl.set("#hcPct", { opacity: o }, at);
      tl.to("#hc", { keyframes: [{ x: 10, duration: 0.05 }, { x: -9, duration: 0.06 }, { x: 5, duration: 0.05 }, { x: 0, duration: 0.06 }] }, WT[8]);
      flashAt(4.5, "coral", 0.34);
      halftone(4.85, "#ff5a4a");

      // ---- 01 EGO ----
      badge("b1", WT[10], 13.72);
      tl.fromTo("#eGlow", { opacity: 0, scale: 0.8 }, { opacity: 0.85, scale: 1, duration: 1.0, ease: "power2.out", ...NI }, WT[10] - 0.3);
      tl.to("#eGlow", { keyframes: [{ opacity: 1, scale: 1.2, duration: 0.5, ease: "power2.out" }, { opacity: 0.8, scale: 1.04, duration: 0.9, ease: "power2.inOut" }] }, WT[29] - 0.2);
      tl.to("#ePlate", { rotation: 140, duration: 9.5, ease: "none" }, 4.4);
      inBlur("#p1", WT[11] - 0.1, 0.7, 60);
      const WK = proxy({ v: 40 }, (o) => ($("wkg").textContent = String(Math.round(o.v))));
      tl.to(WK, { v: 32, duration: 0.5, ease: "power1.inOut" }, WT[16]);
      tl.fromTo("#chip20", { opacity: 0, x: 20, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "back.out(2)", ...NI }, WT[17]);
      tl.to("#r2", { opacity: 1, duration: 0.3 }, WT[18] - 0.05);
      tl.set("#gArc", { opacity: 1 }, WT[18]);
      tl.fromTo("#gArc", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", ...NI }, WT[18]);
      tl.to("#r3", { opacity: 1, duration: 0.3 }, WT[20] - 0.05);
      tl.fromTo("#tFill", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "none", ...NI }, WT[20]);
      outBlur(["#p1", "#eGlow"], 13.72);
      flashAt(14.05, "amber");

      // ---- 02 OVERLOAD ----
      badge("b2", WT[32], 23.05);
      inBlur("#pg", WT[32] + 0.2);
      inBlur("#p2", WT[32] + 0.3, 0.7, 60);
      tl.to("#oPlate", { rotation: -160, duration: 9.5, ease: "none" }, 13.8);
      const PG = proxy({ v: 0 }, (o) => ($("pgV").textContent = "+" + o.v.toFixed(o.v < 0.05 ? 0 : 1) + "%"));
      const nodeT = [WT[33], WT[36], WT[37], WT[38]];
      const pct = [0, 4.2, 8.3, 12.5];
      nodeT.forEach((at, i) => {
        tl.fromTo("#n" + i, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)", ...NI }, at);
        if (i === 1) tl.set("#upLine", { opacity: 1 }, at - 0.12);
        if (i > 0) tl.to("#upLine", { strokeDashoffset: 1 - i / 3, duration: 0.4, ease: "power2.out" }, at - 0.12);
        tl.to(PG, { v: pct[i], duration: 0.4, ease: "power2.out" }, at);
      });
      tl.to("#pgV", { color: "#ff9a3c", textShadow: "0 0 50px rgba(255,154,60,0.6)", duration: 0.3 }, nodeT[3]);
      tl.fromTo("#chRep", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)", ...NI }, WT[40]);
      tl.fromTo("#chKg", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)", ...NI }, WT[44]);
      tl.to(["#chRep", "#chKg"], { opacity: 0, duration: 0.25 }, WT[46]);
      tl.to("#upLine", { opacity: 0, duration: 0.35 }, WT[46] + 0.05);
      tl.fromTo("#flatLine", { opacity: 0 }, { opacity: 1, duration: 0.35, ...NI }, WT[46] + 0.2);
      [0, 70, 140, 210].forEach((dy, i) => tl.to("#n" + i, { y: dy, duration: 0.7, ease: "power2.inOut" }, WT[46] + 0.1));
      tl.to(PG, { v: 0, duration: 0.9, ease: "power2.inOut" }, WT[46] + 0.1);
      tl.to("#pgV", { color: "#8a8a8f", textShadow: "0 0 0px rgba(0,0,0,0)", duration: 0.4 }, WT[46] + 0.1);
      for (let i = 1; i < 4; i++) tl.set(`#n${i} .v`, { textContent: "60" }, WT[48]);
      tl.to(["#pg", "#p2"], { opacity: 0.22, duration: 0.6, ease: "power2.inOut" }, WT[52] - 0.1);
      tl.fromTo("#mir", { opacity: 0, x: 260, rotationY: -34, transformPerspective: 1400 }, { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "expo.out", ...NI }, WT[52]);
      tl.fromTo("#mirSw", { x: 0, rotation: 18 }, { x: 820, rotation: 18, duration: 1.0, ease: "power2.inOut", ...NI }, WT[53]);
      tl.fromTo("#mirNo", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", ...NI }, WT[56]);
      outBlur(["#pg", "#p2", "#mir"], 23.05);
      flashAt(23.42, "teal");
      halftone(23.75, "#2fe3b4");

      // ---- 03 PROTEIN ----
      badge("b3", WT[57], 30.3);
      [["#egg", 0], ["#steak", 0.12], ["#shaker", 0.24]].forEach(([sel, d], i) => {
        tl.fromTo(sel, { opacity: 0, scale: 0.6, rotation: i % 2 ? 12 : -12, filter: "blur(14px)" }, { opacity: 1, scale: 1, rotation: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", ...NI }, WT[58] + d);
        tl.to(sel, { y: i % 2 ? -30 : 30, rotation: i % 2 ? -6 : 6, duration: 5.2, ease: "sine.inOut" }, WT[58] + 0.9);
      });
      inBlur("#protG", WT[59] - 0.1, 0.6, 30);
      const PR = proxy({ v: 0 }, (o) => ($("prot").textContent = o.v.toFixed(1)));
      tl.to(PR, { v: 1.6, duration: 0.8, ease: "power2.out" }, WT[62]);
      tl.to("#prot", { color: "#2fe3b4", textShadow: "0 0 70px rgba(47,227,180,0.6)", duration: 0.4 }, WT[62] + 0.6);
      inBlur("#days", WT[68] - 0.1, 0.5, 16);
      for (let i = 0; i < 7; i++) {
        const at = WT[69] + i * 0.2;
        tl.fromTo(`#days .day:nth-child(${i + 1}) .f`, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", ...NI }, at);
        tl.to(`#days .day:nth-child(${i + 1}) span`, { color: "#050505", duration: 0.2 }, at);
      }
      outBlur(["#protG", "#days", "#egg", "#steak", "#shaker"], 30.32);
      flashAt(30.62, "blue");

      // ---- 04 SLEEP ----
      badge("b4", WT[72], 36.86);
      tl.fromTo("#moon", { opacity: 0, scale: 0.7, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.0, ease: "expo.out", ...NI }, WT[73] - 0.4);
      tl.to("#moon", { rotation: 14, duration: 6, ease: "none" }, WT[73]);
      inBlur("#ringIn", WT[73], 0.7, 30);
      const SH = proxy({ v: 0 }, (o) => ($("sleepH").textContent = Math.round(o.v) + "h"));
      tl.to(SH, { v: 7, duration: 0.5, ease: "power2.out" }, WT[74]);
      tl.set("#sleepH", { textContent: "7–9h" }, WT[76]);
      tl.to("#sleepH", { color: "#7d9bff", textShadow: "0 0 60px rgba(76,125,255,0.7)", duration: 0.3 }, WT[76]);
      tl.set("#ringP", { opacity: 1 }, WT[74]);
      tl.fromTo("#ringP", { strokeDashoffset: 1 }, { strokeDashoffset: 0.08, duration: 1.1, ease: "power2.inOut", ...NI }, WT[74]);
      tl.to("#ringIn", { opacity: 0.5, scale: 0.94, duration: 0.6, ease: "power2.inOut" }, WT[78]);
      inBlur("#rec", WT[80], 0.6, 20);
      const RV = proxy({ v: 0 }, (o) => ($("recV").textContent = Math.round(o.v) + "%"));
      tl.fromTo("#recFill", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut", ...NI }, WT[84]);
      tl.to(RV, { v: 100, duration: 1.2, ease: "power2.inOut" }, WT[84]);
      tl.to("#recV", { color: "#7d9bff", duration: 0.3 }, WT[88]);
      tl.to("#ringIn", { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, WT[88]);
      outBlur(["#moon", "#ringIn", "#rec"], 36.88);
      flashAt(37.2, "amber");

      // ---- OUTRO ----
      tl.fromTo("#xStat", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out", ...NI }, 37.1);
      inBlur("#k0", WT[89] - 0.04, 0.5, 24);
      inBlur("#k1", WT[92] - 0.04, 0.5, 24);
      inBlur("#k2", WT[93] - 0.04, 0.5, 24);
      inBlur("#k3", WT[94] - 0.04, 0.55, 24);
      outBlur(["#k0", "#k1", "#k2", "#k3"], 40.95);
      tl.fromTo("#mpw", { opacity: 0, scale: 1.12, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out", ...NI }, WT[95] - 0.04);
      [98, 99, 100, 101, 102, 103].forEach((wi, i) => wordIn("m" + i, WT[wi]));
      outBlur(["#mpw", "#mpn"], WT[103] + 0.42);
      tl.to("#xStat", { opacity: 0.45, duration: 0.8, ease: "power2.inOut" }, 44.6);
      tl.fromTo("#ll", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out", ...NI }, 44.85);
      tl.fromTo("#logo", { clipPath: "inset(100% 0% 0% 0%)", y: 30 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, ease: "expo.out", ...NI }, 45.05);
      tl.to("#ll", { scaleX: 0.4, opacity: 0.7, duration: 0.5, ease: "power2.inOut" }, 45.5);
      tl.fromTo("#tag", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", ...NI }, 45.35);

      // ---- captions (generated from the voiceover) ----
      /*CAPTION_JS*/

      // ---- world clock: camera, 3D world and dumbbell all derive from time ----
      const DR = proxy({ t: 0 }, (o) => {
        const cam = camAt(o.t);
        renderWorld(cam);
        renderDumbbell(o.t, cam);
      });
      tl.fromTo(DR, { t: 0 }, { t: DUR, duration: DUR, ease: "none", ...NI }, 0);

      const c0 = camAt(0);
      renderWorld(c0);
      renderDumbbell(0, c0);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
