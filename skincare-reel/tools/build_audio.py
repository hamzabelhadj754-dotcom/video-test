"""Soundtrack + timing data for the vertical reel.

  python3 tools/build_audio.py .
Writes assets/soundtrack.wav and assets/timing.js (voice starts, mouth
envelope, and estimated per-word timings for the karaoke captions).
"""
import json
import re
import sys
import numpy as np
import soundfile as sf

PROJ = sys.argv[1]
SR = 44100
DUR = 42.5
N = int(SR * DUR)

STARTS = {
    "h1": 0.35, "h2": 3.15,
    "a1": 7.10, "a2": 10.55,
    "b1": 15.55, "b2": 18.30,
    "c1": 23.00, "c2": 26.05, "c3": 28.80,
    "d1": 34.20, "d2": 37.90,
}
TEXT = {}
for row in open(f"{PROJ}/tools/lines.tsv", encoding="utf-8"):
    k, v = row.rstrip("\n").split("\t", 1)
    TEXT[k] = v

SFX = [
    ("impact", 0.36), ("scratch", 0.30), ("pop", 0.62), ("pop", 0.95), ("pop", 1.55), ("pop", 1.72),
    ("swoosh", 2.85), ("whoosh", 3.0), ("pop", 3.55), ("pop", 4.9), ("pop", 5.2), ("sticker", 5.62),
    ("swoosh", 6.85), ("pop", 7.15), ("rise", 8.3), ("buzz", 9.84),
    ("pop", 11.0), ("pop", 11.12), ("pop", 11.24), ("crack", 12.98), ("pop", 13.43),
    ("swoosh", 13.9), ("ding", 14.49),
    ("swoosh", 15.3), ("tick", 16.1), ("tick", 16.25), ("tick", 16.4), ("tick", 16.55),
    ("tick", 16.7), ("tick", 16.85), ("tick", 17.0), ("buzz", 17.85),
    ("crack", 18.6), ("crack", 19.04), ("swoosh", 20.01), ("pop", 20.8), ("ding", 20.86),
    ("swoosh", 22.75), ("riser", 22.95), ("sticker", 23.65), ("impact", 24.02),
    ("impact", 26.05), ("pop", 26.3), ("buzz", 28.36),
    ("whoosh", 28.85), ("rise", 29.32), ("pop", 30.42), ("crack", 31.2), ("crack", 31.35),
    ("swoosh", 32.22), ("ding", 32.87),
    ("swoosh", 33.85), ("pop", 34.7), ("pop", 34.95), ("pop", 35.2), ("type", 36.27),
    ("swoosh", 37.6), ("impact", 38.42), ("sparkle", 38.8), ("pop", 39.4), ("tap", 40.0), ("ding", 40.08),
]

rng = np.random.default_rng(5)


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


def tt(sec):
    return np.arange(int(sec * SR)) / SR


# --- music: bright house groove, 118 bpm ------------------------------------
music = np.zeros(N)
bpm = 118
beat = 60 / bpm
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
t0 = 0.35
bar_i = 0
while t0 < DUR:
    ch = chords[bar_i % 4]
    for b in range(4):
        t = t0 + b * beat
        # kick
        k = tt(0.22)
        f = 48 + 90 * np.exp(-k * 32)
        place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 13) * 0.42, t)
        # clap on 2 and 4
        if b in (1, 3):
            c = tt(0.18)
            x = rng.standard_normal(len(c))
            x = x - lowpass(x, 5)
            env = np.exp(-c * 28) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * c) > 0))
            place(music, x * env * 0.16, t)
        # offbeat open hat
        h = tt(0.12)
        x = rng.standard_normal(len(h))
        x = x - lowpass(x, 3)
        place(music, x * np.exp(-h * 30) * 0.07, t + beat / 2)
        # closed hats on 16ths
        for s in (0.25, 0.75):
            hc = tt(0.04)
            xx = rng.standard_normal(len(hc))
            place(music, (xx - lowpass(xx, 3)) * np.exp(-hc * 120) * 0.035, t + beat * s)
        # offbeat bass
        bb = tt(beat * 0.45)
        fb = midi(ch[0] - 24)
        bass = (np.sin(2 * np.pi * fb * bb) + 0.3 * np.sin(4 * np.pi * fb * bb)) * np.minimum(1, bb / 0.005) * np.exp(-bb * 4)
        place(music, bass * 0.22, t + beat / 2)
    # chord stabs: syncopated
    for pos in (0.5, 1.75, 2.5, 3.5):
        st = tt(0.32)
        stab = sum(np.sin(2 * np.pi * midi(m + 12) * st) + 0.4 * np.sin(2 * np.pi * midi(m + 12) * 2.003 * st) for m in ch)
        stab *= np.exp(-st * 9) * np.minimum(1, st / 0.004)
        place(music, stab * 0.03, t0 + pos * beat)
    t0 += 4 * beat
    bar_i += 1

# arrangement: soft first bar, tension drop before error #3, outro tail
g = np.ones(N)
def ramp(a, b, v0, v1):
    i, j = int(a * SR), int(b * SR)
    g[i:j] = np.linspace(v0, v1, j - i)
g[: int(0.3 * SR)] = 0
ramp(0.3, 3.0, 0.35, 0.35)
ramp(3.0, 3.2, 0.35, 1.0)
ramp(22.85, 23.1, 1.0, 0.25)       # pull back under "y el error número tres"
ramp(23.1, 25.75, 0.25, 0.25)
ramp(25.75, 26.05, 0.0, 0.0)       # silence before the hit
ramp(41.0, 42.5, 1.0, 0.0)
music *= g

# --- voice + timing --------------------------------------------------------
voice = np.zeros(N)
lines = {}
FPS_LIP = 25


def word_timings(y, sr, text):
    hop = int(0.01 * sr)
    n = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-10) for i in range(n)])
    db = 20 * np.log10(rms)
    loud = db > (db.max() - 32)
    idx = np.where(loud)[0]
    s0, s1 = idx[0], idx[-1] + 1
    # internal pauses
    pauses = []
    i = s0
    while i < s1:
        if not loud[i]:
            j = i
            while j < s1 and not loud[j]:
                j += 1
            if j - i >= 9:
                pauses.append((i, j))
            i = j
        else:
            i += 1
    words = text.split()
    # phrase breaks after punctuation
    breaks = [k for k, w in enumerate(words[:-1]) if re.search(r"[,.:;!?]$", w)]
    pauses = sorted(sorted(pauses, key=lambda p: p[0] - p[1])[: len(breaks)])
    segs = []
    cur = s0
    bpos = breaks[: len(pauses)]
    for p in pauses:
        segs.append((cur, p[0]))
        cur = p[1]
    segs.append((cur, s1))
    groups = []
    start = 0
    for b in bpos:
        groups.append(words[start: b + 1])
        start = b + 1
    groups.append(words[start:])
    out = []
    for (a, b), ws in zip(segs, groups):
        weights = np.array([len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 1.5 for w in ws], float)
        edges = a + np.concatenate([[0], np.cumsum(weights)]) / weights.sum() * (b - a)
        for k, w in enumerate(ws):
            out.append([w, round(edges[k] * 0.01, 3), round(edges[k + 1] * 0.01, 3)])
    return out


for lid, at in STARTS.items():
    y, sr = sf.read(f"{PROJ}/assets/vo/{lid}.wav")
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SR:
        idx = np.arange(0, len(y), sr / SR)
        y = np.interp(idx, np.arange(len(y)), y)
    place(voice, y, at)
    hop = SR // FPS_LIP
    fr = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(fr)])
    db = 20 * np.log10(rms)
    lo, hi = np.percentile(db[db > -60], [35, 97])
    v = np.clip((db - lo) / (hi - lo), 0, 1) ** 1.3
    v[db < -45] = 0
    v = np.convolve(v, [0.2, 0.6, 0.2], mode="same")
    lines[lid] = {
        "start": at,
        "dur": round(len(y) / SR, 3),
        "v": [round(float(x), 2) for x in v],
        "words": [[w, round(at + a, 3), round(at + b, 3)] for w, a, b in word_timings(y, SR, TEXT[lid])],
    }

venv = lowpass(np.abs(voice), int(0.2 * SR))
venv = np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)
venv = lowpass(venv, int(0.25 * SR))
music *= 1 - 0.6 * venv


# --- sfx -------------------------------------------------------------------
def s_pop():
    t = tt(0.12); f = 500 + 1000 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.32

def s_whoosh(d=0.6):
    t = tt(d); x = rng.standard_normal(len(t))
    return (lowpass(x, 14) - lowpass(x, 50)) * np.sin(np.pi * t / d) ** 2 * 1.7

def s_swoosh():
    t = tt(0.35); x = rng.standard_normal(len(t))
    a = lowpass(x, 6) - lowpass(x, 24)
    return a * np.sin(np.pi * t / 0.35) ** 3 * 1.4

def s_chime(base=1318.5):
    t = tt(1.4)
    s = sum(np.sin(2 * np.pi * base * r * t) * gg for r, gg in [(1, 1), (1.5, 0.5), (2, 0.3)])
    return s * np.exp(-t * 4) * np.minimum(1, t / 0.003) * 0.13

def s_ding():
    a = s_chime(1046.5)
    b = np.zeros(len(a)); place(b, s_chime(1568.0), 0.09)
    return a + b

def s_buzz():
    t = tt(0.42)
    sq = np.sign(np.sin(2 * np.pi * 110 * t)) + 0.6 * np.sign(np.sin(2 * np.pi * 116 * t))
    return lowpass(sq, 4) * np.minimum(1, t / 0.01) * np.minimum(1, (0.42 - t) / 0.05) * 0.11

def s_impact():
    t = tt(0.9); f = 35 + 140 * np.exp(-t * 20)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    x = rng.standard_normal(len(t))
    return boom * 0.75 + lowpass(x, 5) * np.exp(-t * 18) * 0.35

def s_scratch():
    t = tt(0.45); x = rng.standard_normal(len(t))
    f = 1 + 0.8 * np.sin(2 * np.pi * 9 * t)
    a = lowpass(x, 3) - lowpass(x, 12)
    return a * f * np.exp(-t * 4) * 0.5

def s_rise():
    t = tt(0.8); f = 400 * 2 ** (t / 0.8 * 1.6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.8) * 0.08

def s_riser():
    t = tt(3.0); x = rng.standard_normal(len(t))
    noise = (x - lowpass(x, 3 + 0 * x.size)) * (t / 3.0) ** 2 * 0.18
    f = 180 * 2 ** (t / 3.0 * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / 3.0) ** 1.5 * 0.08
    return noise + tone

def s_crack():
    t = tt(0.2); x = rng.standard_normal(len(t))
    return (x - lowpass(x, 2)) * np.exp(-t * 40) * 0.5 + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) * 0.3

def s_tick():
    t = tt(0.08)
    return np.sin(2 * np.pi * 2000 * t) * np.exp(-t * 60) * 0.15

def s_sticker():
    t = tt(0.25); f = 900 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.25

def s_type():
    out = np.zeros(int(1.2 * SR))
    for i in range(9):
        place(out, s_tick() * 0.8, i * 0.11 + rng.uniform(0, 0.03))
    return out

def s_sparkle():
    out = np.zeros(int(1.2 * SR))
    for i, m in enumerate([84, 88, 91, 95, 96, 100, 103]):
        t = tt(0.5)
        place(out, np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 12) * 0.07, i * 0.06)
    return out

def s_tap():
    t = tt(0.06)
    return np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 90) * 0.3

SYN = {"pop": s_pop, "whoosh": s_whoosh, "swoosh": s_swoosh, "ding": s_ding, "buzz": s_buzz,
       "impact": s_impact, "scratch": s_scratch, "rise": s_rise, "riser": s_riser, "crack": s_crack,
       "tick": s_tick, "sticker": s_sticker, "type": s_type, "sparkle": s_sparkle, "tap": s_tap}
fx = np.zeros(N)
for name, at in SFX:
    place(fx, SYN[name](), at)

mix = voice * 1.05 + music * 0.75 + fx * 0.8
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.9) / np.tanh(1.9) * 0.9
sf.write(f"{PROJ}/assets/soundtrack.wav", np.stack([mix, mix], 1), SR, subtype="PCM_16")
with open(f"{PROJ}/assets/timing.js", "w", encoding="utf-8") as fh:
    fh.write("// Generated by tools/build_audio.py\nwindow.REEL_TIMING = ")
    json.dump({"fps": FPS_LIP, "lines": lines}, fh, ensure_ascii=False, separators=(",", ":"))
    fh.write(";\n")
for k, l in lines.items():
    print(k, l["start"], l["dur"], " ".join(f"{w}@{a:.2f}" for w, a, b in l["words"]))
