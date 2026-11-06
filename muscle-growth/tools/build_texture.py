"""compositions/texture.html: seeded grain (3–4 %, breathing with the score) + vignette, over everything."""
import json, os, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = json.load(open(os.path.join(ROOT, "assets/audio/env.json")))
r = random.Random(62); DUR = 62.0
jumps = [[round(i / 12, 3), r.randint(0, 299), r.randint(0, 299)] for i in range(int(DUR * 12))]
html = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; overflow: hidden; }}
    #tx-grain {{ position: absolute; inset: -60px; opacity: .035; mix-blend-mode: screen;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }}
    #tx-vig {{ position: absolute; inset: 0; background: radial-gradient(ellipse 80% 62% at 50% 45%, transparent 52%, rgba(5,5,7,.5) 100%); }}
  </style>
  <div id="root" data-composition-id="texture" data-width="1080" data-height="1920">
    <div id="tx-vig"></div>
    <div id="tx-grain"></div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      const J = {json.dumps(jumps, separators=(",", ":"))};
      const E = {json.dumps(env, separators=(",", ":"))};
      J.forEach(([t, x, y]) => tl.set("#tx-grain", {{ backgroundPosition: x + "px " + y + "px" }}, t));
      for (let i = 1; i < E.length; i++) tl.to("#tx-grain", {{ opacity: 0.03 + 0.012 * E[i], duration: 0.1, ease: "none" }}, (i - 1) / 10);
      window.__timelines["texture"] = tl;
    }})();
  </script>
</template>
'''
open(os.path.join(ROOT, "compositions/texture.html"), "w").write(html)
print("texture ok")
