"""Builds compositions/captions.html and captions.srt from assets/audio/words.json.

Captions are burned in only where the on-screen type is not already the VO
(scenes 2, 3, 4 and 6). The .srt covers every line for accessibility.
"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
words = json.load(open(os.path.join(ROOT, "assets/audio/words.json")))
BURN = {2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17}
SPLIT = {8: 4}  # line 8 has 8 words: break into two groups of 4

lines = {}
for w in words: lines.setdefault(w["line"], []).append(w)

groups = []
for ln in sorted(lines):
    ws = lines[ln]
    if ln in SPLIT:
        k = SPLIT[ln]; groups += [(ln, ws[:k]), (ln, ws[k:])]
    else:
        groups.append((ln, ws))

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;")

# timing per group
timed = []
for i, (ln, ws) in enumerate(groups):
    s = max(0, ws[0]["start"] - 0.12)
    e = ws[-1]["end"] + 0.5
    if i + 1 < len(groups):
        nxt = groups[i + 1][1][0]["start"] - 0.14
        e = min(e, nxt) if nxt > s + 0.3 else e
    timed.append((ln, ws, round(s, 3), round(e, 3)))

# ---- SRT (all lines) ----
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
srt = []
for n, (ln, ws, s, e) in enumerate(timed, 1):
    srt.append(f"{n}\n{ts(s)} --> {ts(e)}\n{' '.join(w['text'] for w in ws)}\n")
open(os.path.join(ROOT, "captions.srt"), "w").write("\n".join(srt))

# ---- burned-in caption composition ----
html = []; js = []
for gi, (ln, ws, s, e) in enumerate(timed):
    if ln not in BURN: continue
    gid = f"cap-g{gi}"
    spans = " ".join(f'<span class="cap-w" id="{gid}-w{j}">{esc(w["text"])}</span>' for j, w in enumerate(ws))
    html.append(f'    <div class="clip cap" id="{gid}" data-start="{s}" data-duration="{round(e - s, 3)}" data-track-index="0"><div class="cap-in" id="{gid}-in">{spans}</div></div>')
    js.append(f'      grp("{gid}", {s}, {e}, {json.dumps([[w["start"] for w in ws]])[1:-1]});')

out = f'''<template>
  <style>
    @font-face {{ font-family: "Inter"; src: url("assets/fonts/Inter-Variable.woff2") format("woff2"); font-weight: 100 900; }}
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .cap {{ position: absolute; left: 64px; right: 64px; top: 1306px; height: 170px; }}
    .cap-in {{ position: absolute; isolation: isolate; left: 0; right: 0; top: 0; text-align: center; font: 600 64px/1.18 "Inter", sans-serif; letter-spacing: -0.012em; color: #EDEDED; }}
    .cap-in::before {{ content: ""; position: absolute; left: -64px; right: -64px; top: -70px; bottom: -80px;
      background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(7,7,10,.72), rgba(7,7,10,0) 100%); }}
    .cap-w {{ position: relative; display: inline-block; opacity: .7; }}
    @media (orientation: landscape) {{
      .cap {{ left: 240px; right: 240px; top: 918px; height: 140px; }}
      .cap-in {{ font-size: 52px; }}
    }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920" data-layout-allow-caption-zone>
{chr(10).join(html)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      function grp(id, s, e, starts) {{
        tl.fromTo("#" + id + "-in", {{ opacity: 0, y: 18, filter: "blur(8px)" }}, {{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.34, ease: "expo.out" }}, s);
        tl.to("#" + id + "-in", {{ opacity: 0, y: -10, duration: 0.22, ease: "power3.in" }}, e - 0.24);
        starts.forEach((t, j) => {{
          const w = "#" + id + "-w" + j, until = j + 1 < starts.length ? starts[j + 1] : e;
          tl.fromTo(w, {{ color: "#EDEDED", opacity: 0.7 }}, {{ color: "#D4A64A", opacity: 1, duration: 0.08, ease: "none", immediateRender: false }}, Math.max(s, t - 0.02));
          tl.to(w, {{ color: "#EDEDED", opacity: 0.7, duration: 0.12, ease: "none" }}, Math.max(t + 0.1, until - 0.04));
        }});
      }}
{chr(10).join(js)}
      tl.set({{}}, {{}}, 69);
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
'''
open(os.path.join(ROOT, "compositions/captions.html"), "w").write(out)
print(len(timed), "groups;", sum(1 for t in timed if t[0] in BURN), "burned")
