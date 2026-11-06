"""compositions/captions.html + captions.srt from assets/audio/words.json.
Burned in only in scenes 2–5; scenes 1, 6, 7 carry the words as hero type. Max 2 lines × 5 words."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
words = json.load(open(os.path.join(ROOT, "assets/audio/words.json")))
FIX = {"fibers": "fibres,", "1.6": "1.6"}
for w in words:
    w["text"] = FIX.get(w["text"], w["text"])
# line 11 is "Respect it, and every session compounds." (ASR heard "in")
for w in words:
    if w["line"] == 11 and w["text"] == "in": w["text"] = "and"
    if w["line"] == 11 and w["text"] == "it": w["text"] = "it,"
BURN = set(range(2, 12))
lines = {}
for w in words: lines.setdefault(w["line"], []).append(w)
def cap(ws):
    ws = [dict(x) for x in ws]; ws[0]["text"] = ws[0]["text"][0].upper() + ws[0]["text"][1:]; return ws
groups = []
import math
for ln in sorted(lines):
    ws = cap(lines[ln]); n = len(ws); k = math.ceil(n / 5)
    if k == 1: groups.append((ln, ws)); continue
    cuts, start = [], 0
    for g in range(1, k):
        target = round(n * g / k); best = target
        ok = [c for c in range(start + 2, n - 1) if c - start <= 5 and n - c <= 5 * (k - g) and re.search(r"[,.]$", ws[c - 1]["text"])]
        if ok: best = min(ok, key=lambda c: abs(c - target))   # prefer a break right after punctuation
        cuts.append(best); start = best
    b = [0] + cuts + [n]
    for i in range(len(b) - 1): groups.append((ln, ws[b[i]:b[i + 1]]))
timed = []
for i, (ln, ws) in enumerate(groups):
    s = max(0, ws[0]["start"] - 0.1); e = ws[-1]["end"] + 0.45
    if i + 1 < len(groups): nxt = groups[i + 1][1][0]["start"] - 0.12; e = min(e, nxt) if nxt > s + 0.3 else e
    timed.append((ln, ws, round(s, 3), round(e, 3)))
def ts(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round((t-int(t))*1000)):03d}"
open(os.path.join(ROOT, "captions.srt"), "w").write("\n".join(f"{n}\n{ts(s)} --> {ts(e)}\n{' '.join(w['text'] for w in ws)}\n" for n, (ln, ws, s, e) in enumerate(timed, 1)))
html, js = [], []
for gi, (ln, ws, s, e) in enumerate(timed):
    if ln not in BURN: continue
    gid = f"cg{gi}"
    spans = " ".join(f'<span class="cw" id="{gid}-w{j}">{w["text"]}</span>' for j, w in enumerate(ws))
    html.append(f'    <div class="clip cap" id="{gid}" data-start="{s}" data-duration="{round(e - s, 3)}" data-track-index="0"><div class="cin" id="{gid}-in">{spans}</div></div>')
    js.append(f'      grp("{gid}", {s}, {e}, {json.dumps([w["start"] for w in ws])});')
out = f'''<template>
  <style>
    @font-face {{ font-family: "Inter"; src: url("assets/fonts/Inter-Variable.woff2") format("woff2"); font-weight: 100 900; }}
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .cap {{ position: absolute; left: 64px; right: 64px; top: 1336px; height: 150px; }}
    .cin {{ position: absolute; isolation: isolate; left: 0; right: 0; top: 0; text-align: center; font: 700 58px/1.16 "Inter", sans-serif; letter-spacing: -0.015em; color: #F2F3F5; }}
    .cin::before {{ content: ""; position: absolute; left: -64px; right: -64px; top: -60px; bottom: -70px; background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(8,9,11,.7), rgba(8,9,11,0) 100%); }}
    .cw {{ position: relative; display: inline-block; opacity: .75; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920" data-layout-allow-caption-zone>
{chr(10).join(html)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      function grp(id, s, e, starts) {{
        tl.fromTo("#" + id + "-in", {{ opacity: 0, y: 16, filter: "blur(8px)" }}, {{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "expo.out" }}, s);
        tl.to("#" + id + "-in", {{ opacity: 0, y: -8, duration: 0.2, ease: "power3.in" }}, e - 0.22);
        starts.forEach((t, j) => {{
          const w = "#" + id + "-w" + j, until = j + 1 < starts.length ? starts[j + 1] : e;
          tl.fromTo(w, {{ color: "#F2F3F5", opacity: 0.75 }}, {{ color: "#C6FF3D", opacity: 1, duration: 0.06, ease: "none", immediateRender: false }}, Math.max(s, t - 0.02));
          if (j + 1 < starts.length) tl.to(w, {{ color: "#F2F3F5", opacity: 0.75, duration: 0.1, ease: "none" }}, Math.max(t + 0.08, until - 0.03));
        }});
      }}
{chr(10).join(js)}
      tl.set({{}}, {{}}, 62);
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
'''
open(os.path.join(ROOT, "compositions/captions.html"), "w").write(out)
for ln, ws, s, e in timed: print(ln, s, e, " ".join(w["text"] for w in ws))
