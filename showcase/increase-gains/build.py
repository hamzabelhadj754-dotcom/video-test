"""Generates index.html for Gains Dom #009 "How to increase your gains".

Everything is timed to the owner's voiceover: sfx/words.json holds the word
timeline (faster-whisper). Captions are generated from it; scene beats use
the word times below. Run: python3 build.py
"""

import json
import random
from pathlib import Path

HERE = Path(__file__).parent
W = json.loads((HERE / "sfx/words.json").read_text())
DUR = 46.0

# Caption groups: (first word, last word, accent words).
GROUPS = [
    (0, 2, []), (3, 7, ["changing."]), (8, 9, ["why."]),
    (11, 15, ["ego."]), (16, 19, []), (20, 24, ["down."]), (25, 31, ["every", "rep."]),
    (33, 37, ["every", "week."]), (38, 40, []), (41, 45, []), (46, 51, []), (52, 56, ["mirror."]),
    (58, 60, ["protein."]), (61, 65, ["1.6"]), (66, 71, ["every", "single", "day."]),
    (73, 73, ["Sleep."]), (74, 77, []), (78, 83, []), (84, 88, ["recover."]),
]


def t(i):
    return W[i][0]


def captions():
    html, js = [], []
    for g, (a, b, acc) in enumerate(GROUPS):
        start = max(0.0, t(a) - 0.06)
        nxt = GROUPS[g + 1][0] if g + 1 < len(GROUPS) else None
        end = min(t(nxt) - 0.04, W[b][1] + 0.9) if nxt is not None else W[b][1] + 0.9
        if a == 0:
            start = 0.0
        spans = []
        for i in range(a, b + 1):
            w = W[i][2]
            cls = "cw acc" if w in acc else "cw"
            col = ["#ff5a4a"] * 7 + ["#ff9a3c"] * 5 + ["#2fe3b4"] * 3 + ["#7d9bff"] * 4
            sty = (f' style="color:{col[g]};text-shadow:0 0 26px {col[g]}88,0 4px 24px rgba(0,0,0,0.85)"' if w in acc else "")
            if a == 0:
                cls += " on"  # the hook line is on screen from frame 0
            spans.append(f'<span class="{cls}" id="w{i}"{sty}>{w}</span>')
        html.append(
            f'<div id="cap{g}" class="clip layer capl" data-start="{start:.2f}" '
            f'data-duration="{end - start:.2f}" data-track-index="20">'
            f'<div class="capline">{" ".join(spans)}</div></div>'
        )
        for i in range(a, b + 1):
            if a == 0:
                continue
            js.append(f'wordIn("w{i}",{t(i):.2f});')
        js.append(f'capOut("cap{g}",{end - 0.22:.2f});')
    return "\n".join(html), "\n".join(js)


def dust():
    rng = random.Random(9)
    out = []
    for i in range(46):
        x = rng.uniform(-900, 900)
        y = rng.uniform(-1300, 1300)
        z = rng.uniform(-2600, 300)
        s = rng.uniform(3, 9)
        warm = rng.random() < 0.7
        out.append({"x": round(x), "y": round(y), "z": round(z), "s": round(s, 1), "w": warm})
    return out


TEMPLATE = (HERE / "template.tpl").read_text()
cap_html, cap_js = captions()
html = (
    TEMPLATE.replace("/*CAPTION_HTML*/", cap_html)
    .replace("/*CAPTION_JS*/", cap_js)
    .replace("/*WT*/", json.dumps([round(w[0], 2) for w in W]))
)
(HERE / "index.html").write_text(html)
print("wrote index.html", len(html), "bytes")
