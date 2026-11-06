"""Builds compositions/texture.html: seeded film grain, vignette and a light leak that
breathe with the score (assets/audio/env.json, 10 Hz)."""
import json, os, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = json.load(open(os.path.join(ROOT, "assets/audio/env.json")))
r = random.Random(2027)
DUR = 69.0
jumps = [[round(i / 12, 3), r.randint(0, 299), r.randint(0, 299)] for i in range(int(DUR * 12))]
html = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; overflow: hidden; }}
    #tx-grain {{ position: absolute; inset: -60px; opacity: .05; mix-blend-mode: screen;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }}
    #tx-grain2 {{ position: absolute; inset: -60px; opacity: .035; mix-blend-mode: multiply;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' seed='19' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }}
    #tx-vig {{ position: absolute; inset: 0; background: radial-gradient(ellipse 78% 62% at 50% 46%, transparent 48%, rgba(0,0,0,.34) 100%); }}
    #tx-leak {{ position: absolute; right: -380px; top: -420px; width: 1100px; height: 1100px; border-radius: 50%; mix-blend-mode: screen;
      background: radial-gradient(circle, rgba(212,166,74,.55) 0%, rgba(212,120,60,.18) 35%, transparent 65%); opacity: .03; }}
  </style>
  <div id="root" data-composition-id="texture" data-width="1080" data-height="1920">
    <div id="tx-leak"></div>
    <div id="tx-vig"></div>
    <div id="tx-grain"></div>
    <div id="tx-grain2"></div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      const J = {json.dumps(jumps, separators=(",", ":"))};
      const E = {json.dumps(env, separators=(",", ":"))};
      // grain: a seeded jump of the noise tile 12× a second (film-like, identical every render)
      J.forEach(([t, x, y]) => {{ tl.set("#tx-grain", {{ backgroundPosition: x + "px " + y + "px" }}, t); tl.set("#tx-grain2", {{ backgroundPosition: (299 - y) + "px " + x + "px" }}, t); }});
      // audio-reactive: grain intensity and the light leak breathe with the score
      for (let i = 1; i < E.length; i++) {{
        const t = (i - 1) / 10;
        tl.to("#tx-grain", {{ opacity: 0.04 + 0.03 * E[i], duration: 0.1, ease: "none" }}, t);
        tl.to("#tx-leak", {{ opacity: 0.015 + 0.06 * E[i], duration: 0.1, ease: "none" }}, t);
      }}
      tl.fromTo("#tx-leak", {{ x: 0, y: 0 }}, {{ x: -160, y: 120, duration: {DUR}, ease: "sine.inOut" }}, 0);
      window.__timelines["texture"] = tl;
    }})();
  </script>
</template>
'''
open(os.path.join(ROOT, "compositions/texture.html"), "w").write(html)
print("texture ok", len(env))
