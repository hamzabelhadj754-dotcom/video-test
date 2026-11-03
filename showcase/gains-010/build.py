"""Gains Dom #010: dark motivational, built from frame-matched reference moves.

Every scene runs the approved M1 text cycle (reference 3, 17.35-21.75 s): letters
build with tightening tracking, words slide in from the lower right, the line
smears left, a solo word lands, scrambles into the accent key word. Timings are
in reference frames at 30 fps, relative to each scene's start (rel0).
The same maths drives index.html (via /*CFG*/) and mix.py (sound cues).
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
FPS = 30

SCENES = [
    {"id": "s1", "rel0": -0.5, "letters": "Nobody is coming", "words": ["to", "save", "you."],
     "solo": "Save", "key": "yourself.", "color": "#ff5a4a", "hold1": 24},
    {"id": "s2", "rel0": 3.76, "letters": "The weight", "words": ["doesn't", "care"],
     "solo": "how you", "key": "feel.", "color": "#ff9a3c", "hold1": 22},
    {"id": "s3", "rel0": 7.42, "letters": "5 a.m.", "words": ["nobody's", "watching."],
     "solo": "do it", "key": "anyway.", "color": "#7d9bff", "hold1": 22},
    {"id": "s4", "rel0": 10.97, "letters": "Everyone wants", "words": ["the", "result."],
     "solo": "few", "key": "earn it.", "color": "#2fe3b4", "hold1": 22},
]
DUR = 17.3


def cycle(sc):
    """Reference-frame marks of one text cycle (relative frames)."""
    n = len(sc["letters"])
    letters_end = (n - 1) * 0.85 + 6
    words_start = letters_end
    words_end = words_start + (len(sc["words"]) - 1) * 2.5 + 8
    sm = words_end + sc["hold1"]
    solo = sm + 4
    scramble = sm + 26
    key = sm + 34
    key_end = key + 26
    return {"lettersEnd": letters_end, "wordsStart": words_start, "wordsEnd": words_end,
            "smear": sm, "solo": solo, "scramble": scramble, "key": key, "keyEnd": key_end}


def abs_t(sc, f):
    return sc["rel0"] + f / FPS


def marks():
    out = {}
    for sc in SCENES:
        c = cycle(sc)
        out[sc["id"]] = {k: round(abs_t(sc, v), 3) for k, v in c.items()}
    return out


M = marks()
TUNNEL = M["s1"]["keyEnd"]
WHIPS = [M["s2"]["keyEnd"], M["s3"]["keyEnd"]]
OUTRO = M["s4"]["keyEnd"]

if __name__ == "__main__":
    cfg = {"scenes": SCENES, "marks": M, "tunnel": TUNNEL, "whips": WHIPS, "outro": OUTRO, "dur": DUR}
    tpl = (HERE / "template.tpl").read_text()
    (HERE / "index.html").write_text(tpl.replace("/*CFG*/", json.dumps(cfg)))
    print(json.dumps({"tunnel": TUNNEL, "whips": WHIPS, "outro": OUTRO}, indent=1))
    for k, v in M.items():
        print(k, v)
