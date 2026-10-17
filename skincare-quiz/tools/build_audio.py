"""Re-time the recorded voice-over for the quiz and build the soundtrack.

  python3 tools/build_audio.py
Cuts assets/vo-source.mp3 into the script lines (bounds found by tools/align.py
and snapped to the recording's pauses), inserts an answer countdown after every
question, then writes assets/soundtrack.wav and assets/timing.js.
"""
import json
import re
import numpy as np
import librosa
import soundfile as sf

SR = 44100
COUNT = 2.7  # seconds viewers get to answer

# line bounds in the source recording (seconds), snapped to its pauses
BOUNDS = {
    "hook": (1.91, 4.78), "intro": (5.24, 10.02),
    "q1": (10.56, 13.56), "a1": (14.03, 19.69),
    "q2": (20.13, 22.74), "a2": (23.04, 28.40),
    "q3": (28.81, 31.26), "a3": (31.57, 37.17),
    "q4": (37.58, 39.38), "a4": (39.68, 44.98),
    "outro": (45.40, 51.50),
}
GAP_AFTER = {"hook": 0.3, "intro": 0.45, "a1": 0.5, "a2": 0.5, "a3": 0.5, "a4": 0.5}
ALIGN = json.load(open("assets/align.json", encoding="utf-8"))
TEXT = dict(l.rstrip("\n").split("\t", 1) for l in open("tools/lines.tsv", encoding="utf-8"))

src, _ = librosa.load("assets/vo-source.mp3", sr=SR, mono=True)
# gentle loudness match: speech RMS to about -20 dBFS
act = src[np.abs(src) > 0.01]
src = src * (10 ** (-20 / 20) / (np.sqrt(np.mean(act ** 2)) + 1e-9))

rng = np.random.default_rng(9)


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


def lowpass(x, k):
    if k <= 1:
        return x
    c = np.cumsum(np.concatenate([[0], x]))
    y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.zeros(len(x) - len(y))])


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def word_timings(y, text):
    hop = int(0.01 * SR)
    n = len(y) // hop
    db = 20 * np.log10(np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-10) for i in range(n)]))
    loud = db > (db.max() - 30)
    idx = np.where(loud)[0]
    s0, s1 = idx[0], idx[-1] + 1
    pauses, i = [], s0
    while i < s1:
        if not loud[i]:
            j = i
            while j < s1 and not loud[j]:
                j += 1
            if j - i >= 7:
                pauses.append((i, j))
            i = j
        else:
            i += 1
    words = text.split()
    breaks = [k for k, w in enumerate(words[:-1]) if re.search(r"[,.:;!?]$", w)]
    pauses = sorted(sorted(pauses, key=lambda p: p[0] - p[1])[: len(breaks)])
    segs, cur = [], s0
    for p in pauses:
        segs.append((cur, p[0]))
        cur = p[1]
    segs.append((cur, s1))
    groups, start = [], 0
    for b in breaks[: len(pauses)]:
        groups.append(words[start: b + 1])
        start = b + 1
    groups.append(words[start:])
    out = []
    for (a, b), ws in zip(segs, groups):
        wts = np.array([len(re.sub(r"[^\wáéíóúñü]", "", w.replace("90%", "noventaporciento"), flags=re.I)) + 1.5 for w in ws])
        e = a + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * (b - a)
        out += [[w, e[k] * 0.01, e[k + 1] * 0.01] for k, w in enumerate(ws)]
    return out


# --- schedule -------------------------------------------------------------
t = 0.30
lines, counts = {}, []
clips = {}
for k, (a, b) in BOUNDS.items():
    i0, i1 = int((a - 0.04) * SR), int((b + 0.10) * SR)
    y = src[i0:i1].copy()
    fade = int(0.01 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    clips[k] = y
    d = len(y) / SR
    lines[k] = {"start": round(t, 3), "dur": round(d, 3)}
    t += d
    if k.startswith("q"):
        counts.append({"q": k, "start": round(t + 0.15, 3), "end": round(t + 0.15 + COUNT, 3)})
        t += 0.15 + COUNT + 0.25
    else:
        t += GAP_AFTER.get(k, 0.4)
DUR = round(t + 1.4, 2)
N = int(DUR * SR)

voice = np.zeros(N)
FPS = 25
for k, y in clips.items():
    at = lines[k]["start"]
    place(voice, y, at)
    hop = SR // FPS
    fr = len(y) // hop
    db = 20 * np.log10(np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(fr)]))
    lo, hi = np.percentile(db[db > -60], [35, 97])
    v = np.clip((db - lo) / (hi - lo), 0, 1) ** 1.3
    v[db < -45] = 0
    v = np.convolve(v, [0.2, 0.6, 0.2], mode="same")
    lines[k]["v"] = [round(float(x), 2) for x in v]
    # word times: DTW estimates (tools/align.py), rescaled into this line's speech window
    ws = ALIGN[k]["words"]
    a0, a1 = ws[0][1], ws[-1][2]
    s0, s1 = BOUNDS[k]
    sc = lambda x: s0 + (x - a0) / max(a1 - a0, 1e-6) * (s1 - s0)
    lines[k]["words"] = [[w, round(at + 0.04 + sc(a) - s0, 3), round(at + 0.04 + sc(b) - s0, 3)] for w, a, b in ws]

# --- music: light, clean groove (112 bpm) ----------------------------------
music = np.zeros(N)
beat = 60 / 112
chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]
t0, bar = 0.0, 0
while t0 < DUR:
    ch = chords[bar % 4]
    pad_t = tt(beat * 4 * 1.1)
    pad = sum(np.sin(2 * np.pi * midi(m) * pad_t) + 0.4 * np.sin(2 * np.pi * midi(m) * 1.004 * pad_t) for m in ch)
    env = np.minimum(1, pad_t / 0.4) * np.minimum(1, (pad_t[-1] - pad_t) / 0.5)
    place(music, pad * env * 0.012, t0)
    for b in range(4):
        tb = t0 + b * beat
        k_ = tt(0.2)
        f = 50 + 70 * np.exp(-k_ * 30)
        place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k_ * 16) * 0.22, tb)
        if b in (1, 3):
            c = tt(0.12)
            x = rng.standard_normal(len(c))
            place(music, (x - lowpass(x, 4)) * np.exp(-c * 35) * 0.07, tb)
        h = tt(0.05)
        x = rng.standard_normal(len(h))
        place(music, (x - lowpass(x, 3)) * np.exp(-h * 90) * 0.025, tb + beat / 2)
        # pluck arp
        for s, idx in ((0, 0), (0.5, 2), (0.75, 1)):
            pt = tt(0.4)
            fpl = midi(ch[(idx + b) % 4] + 12)
            pl = (np.sin(2 * np.pi * fpl * pt) + 0.3 * np.sin(4 * np.pi * fpl * pt)) * np.exp(-pt * 9) * np.minimum(1, pt / 0.003)
            place(music, pl * 0.02, tb + s * beat)
        nb = tt(beat * 0.9)
        place(music, np.sin(2 * np.pi * midi(ch[0] - 24) * nb) * np.exp(-nb * 3) * 0.12, tb)
    t0 += 4 * beat
    bar += 1
g = np.ones(N)
g[: int(0.25 * SR)] = np.linspace(0, 1, int(0.25 * SR))
fo = int((DUR - 1.6) * SR)
g[fo:] = np.linspace(1, 0, N - fo)
music *= g
venv = lowpass(np.abs(voice), int(0.2 * SR))
venv = np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)
venv = lowpass(venv, int(0.25 * SR))
music *= 1 - 0.55 * venv


# --- sfx ------------------------------------------------------------------
def s_whoosh(d=0.55):
    x = rng.standard_normal(int(d * SR)); t = tt(d)
    return (lowpass(x, 16) - lowpass(x, 60)) * np.sin(np.pi * t / d) ** 2 * 1.3

def s_tick(f=1600):
    t = tt(0.09)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 55) * 0.18

def s_reveal(good):
    t = tt(1.1)
    notes = [72, 76, 79] if good else [67, 63, 60]
    out = np.zeros(len(t))
    for i, m in enumerate(notes):
        tn = tt(0.9)
        s = (np.sin(2 * np.pi * midi(m) * tn) + 0.3 * np.sin(4 * np.pi * midi(m) * tn)) * np.exp(-tn * 5) * np.minimum(1, tn / 0.004)
        place(out, s * 0.12, i * 0.07)
    return out

def s_pop():
    t = tt(0.1); f = 600 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.2

fx = np.zeros(N)
L = lines
place(fx, s_pop(), L["hook"]["start"] + 0.05)
for c in counts:
    for i in range(3):
        place(fx, s_tick(1500 if i < 2 else 1900), c["start"] + 0.1 + i * (COUNT / 3))
for k, good in (("a1", False), ("a2", True), ("a3", False), ("a4", True)):
    place(fx, s_reveal(good), L[k]["start"])
for k in ("q1", "q2", "q3", "q4", "outro"):
    place(fx, s_whoosh(), L[k]["start"] - 0.55)
place(fx, s_pop(), L["outro"]["start"] + 3.6)

mix = voice + music * 0.7 + fx * 0.8
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.5) / np.tanh(1.5) * 0.9
sf.write("assets/soundtrack.wav", np.stack([mix, mix], 1), SR, subtype="PCM_16")
with open("assets/timing.js", "w", encoding="utf-8") as fh:
    fh.write("// Generated by tools/build_audio.py\nwindow.QUIZ = ")
    json.dump({"fps": FPS, "dur": DUR, "count": COUNT, "lines": lines, "counts": counts}, fh, ensure_ascii=False, separators=(",", ":"))
    fh.write(";\n")
print("duration", DUR)
for k, v in lines.items():
    print(f"{k:6s} {v['start']:6.2f} +{v['dur']:.2f}  " + " ".join(f"{w}@{a:.2f}" for w, a, b in v["words"]))
print(counts)
