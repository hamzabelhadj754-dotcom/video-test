"""Soundtrack + timing for the vertical Spanish explainer.

  python3 tools/build_audio.py
Places the voice lines (assets/vo/<id>.wav) on a schedule, estimates word
times, synthesizes a soft music bed and sound effects anchored to lines/words,
and writes assets/soundtrack.wav + assets/timing.js.
"""
import json
import re
import numpy as np
import soundfile as sf

SR = 44100
TEXT = dict(l.rstrip("\n").split("\t", 1) for l in open("tools/lines.tsv", encoding="utf-8"))
ORDER = list(TEXT)
# word times for a recorded voice-over (written by tools/align_voice.py)
try:
    REC_WORDS = json.load(open("assets/words.json", encoding="utf-8"))
except FileNotFoundError:
    REC_WORDS = None
# extra breathing room before these lines (camera travels to a new station)
SECTION = {"l03": 0.85, "l08": 0.9, "l10": 0.9, "l12": 0.9, "l15": 1.0, "l16": 0.5}
rng = np.random.default_rng(3)


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


def load(path):
    y, sr = sf.read(path)
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SR:
        idx = np.arange(0, len(y), sr / SR)
        y = np.interp(idx, np.arange(len(y)), y)
    return y


def word_timings(y, text):
    """Spread words over the voiced span by letter count; punctuation adds a pause.
    Kokoro speaks at an even pace, so this tracks the audio closely."""
    hop = int(0.01 * SR)
    n = len(y) // hop
    db = 20 * np.log10(np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-10) for i in range(n)]))
    idx = np.where(db > (db.max() - 32))[0]
    s0, s1 = idx[0] * 0.01, (idx[-1] + 1) * 0.01
    words = text.split()
    units, spans = 0.0, []
    for w in words:
        letters = len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 1.2
        spans.append((units, units + letters))
        units += letters + (5.0 if re.search(r"[,.:;!?]$", w) else 0)
    total = spans[-1][1]
    return [[w, s0 + a / total * (s1 - s0), s0 + b / total * (s1 - s0)] for w, (a, b) in zip(words, spans)]


# --- schedule voice ---------------------------------------------------------
t = 0.25
lines, clips = {}, {}
for k in ORDER:
    t += SECTION.get(k, 0.32) if k != "l01" else 0
    y = load(f"assets/vo/{k}.wav")
    clips[k] = y
    lines[k] = {"start": round(t, 3), "dur": round(len(y) / SR, 3)}
    t += len(y) / SR
DUR = round(t + 2.0, 2)
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
    wt = REC_WORDS[k] if REC_WORDS else word_timings(y, TEXT[k])
    lines[k]["words"] = [[w, round(at + a, 3), round(at + b, 3)] for w, a, b in wt]


def A(k, off=0.0):
    return lines[k]["start"] + off


def W(k, i, off=0.0):
    return lines[k]["words"][i][1] + off


def E(k, off=0.0):
    return lines[k]["start"] + lines[k]["dur"] + off


# --- music: gentle plucks + soft groove (96 bpm) ----------------------------
music = np.zeros(N)
beat = 60 / 96
bar = beat * 4
chords = [[48, 55, 59, 64], [45, 52, 59, 60], [41, 48, 57, 64], [43, 50, 59, 64]]
k_ = 0
t0 = 0.0
while t0 < DUR:
    ch = chords[k_ % 4]
    n = tt(bar * 1.15)
    pad = sum(np.sin(2 * np.pi * midi(m + 12) * n) + 0.5 * np.sin(2 * np.pi * midi(m + 12) * 1.003 * n) for m in ch)
    env = np.minimum(1, n / 0.6) * np.minimum(1, (n[-1] - n) / 0.9)
    place(music, pad * env * 0.016, t0)
    for half in (0, 2):
        b = tt(beat * 2)
        place(music, np.sin(2 * np.pi * midi(ch[0] - 12) * b) * np.exp(-b * 2.2) * 0.1, t0 + half * beat)
    for e, idx in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
        p = tt(0.6)
        f = midi(ch[idx] + 24)
        pl = (np.sin(2 * np.pi * f * p) + 0.35 * np.sin(4 * np.pi * f * p)) * np.exp(-p * 7) * np.minimum(1, p / 0.004)
        place(music, pl * 0.032, t0 + e * beat / 2)
    for b in range(4):
        kk = tt(0.18)
        f = 50 + 70 * np.exp(-kk * 30)
        if b in (0, 2):
            place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kk * 18) * 0.15, t0 + b * beat)
        s = tt(0.05)
        x = rng.standard_normal(len(s))
        place(music, (x - lowpass(x, 6)) * np.exp(-s * 70) * 0.028, t0 + b * beat + beat / 2)
    t0 += bar
    k_ += 1
g = np.ones(N)
g[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
fo = int((DUR - 2.0) * SR)
g[fo:] = np.linspace(1, 0, N - fo)
music *= g
venv = lowpass(np.abs(voice), int(0.25 * SR))
venv = np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)
venv = lowpass(venv, int(0.3 * SR))
music *= 1 - 0.55 * venv


# --- sfx --------------------------------------------------------------------
def s_pop():
    t = tt(0.12); f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.32

def s_whoosh():
    t = tt(0.7); x = rng.standard_normal(len(t))
    return (lowpass(x, 18) - lowpass(x, 60)) * np.sin(np.pi * t / 0.7) ** 2 * 1.6

def s_chime(base=1046.5):
    t = tt(1.5)
    s = sum(np.sin(2 * np.pi * base * r * t) * gg for r, gg in [(1, 1), (1.5, 0.5), (2, 0.35), (3, 0.12)])
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.003) * 0.12

def s_ding():
    return s_chime(1318.5) * 0.9

def s_sparkle():
    out = np.zeros(int(1.2 * SR))
    for i, m in enumerate([84, 88, 91, 95, 96, 100, 103, 107]):
        t = tt(0.5)
        place(out, np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 12) * 0.06, i * 0.07)
    return out

def s_rise():
    t = tt(0.9); f = 300 * 2 ** (t / 0.9 * 1.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.9) * 0.08

def s_drop():
    t = tt(0.25); f = 1400 * np.exp(-t * 9) + 400
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * 0.25

def s_click():
    t = tt(0.08); x = rng.standard_normal(len(t)) * np.exp(-t * 120)
    return (x - lowpass(x, 4)) * 0.5 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 60) * 0.2

def s_tick():
    t = tt(0.1)
    return np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 50) * 0.16

def s_stamp():
    t = tt(0.4); f = 40 + 120 * np.exp(-t * 25)
    x = rng.standard_normal(len(t)) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 0.45 + lowpass(x, 3) * 0.2

def s_bubbles():
    out = np.zeros(int(2.2 * SR))
    for i in range(13):
        t = tt(0.09); f0 = rng.uniform(700, 1300); f = f0 * (1 + 2.5 * t / 0.09)
        place(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.12, i * 0.16)
    return out

SYN = dict(pop=s_pop, whoosh=s_whoosh, chime=s_chime, ding=s_ding, sparkle=s_sparkle, rise=s_rise,
           drop=s_drop, click=s_click, tick=s_tick, stamp=s_stamp, bubbles=s_bubbles)
SFX = [
    ("sparkle", 0.05), ("pop", W("l01", 6)), ("pop", W("l01", 6, 0.25)), ("pop", W("l01", 6, 0.5)),
    ("whoosh", A("l03", -0.75)), ("pop", W("l03", 9)), ("rise", A("l04")),
    ("whoosh", A("l05", -0.55)), ("ding", A("l05", 0.05)),
    ("whoosh", A("l06", -0.5)), ("ding", A("l06", 0.05)),
    ("whoosh", A("l07", -0.5)), ("ding", A("l07", 0.05)),
    ("whoosh", A("l08", -0.8)), ("chime", A("l08")), ("pop", E("l08", 0.0)), ("bubbles", E("l08", 0.05)),
    ("pop", W("l09", 5)), ("pop", W("l09", 7)), ("pop", W("l09", 11)), ("pop", W("l09", 13)), ("pop", W("l09", 16)),
    ("ding", E("l09", -0.2)),
    ("whoosh", A("l10", -0.8)), ("chime", A("l10")), ("pop", E("l10", 0.1)),
    ("drop", W("l11", 4)), ("drop", W("l11", 4, 0.3)), ("click", W("l11", 6)),
    ("pop", W("l11", 8)), ("pop", W("l11", 8, 0.2)), ("pop", W("l11", 8, 0.4)), ("pop", W("l11", 10)),
    ("whoosh", A("l12", -0.8)), ("chime", A("l12")), ("stamp", W("l12", 4)), ("whoosh", W("l12", 5, -0.1)),
    ("rise", W("l13", 1)), ("whoosh", W("l13", 8, -0.2)),
] + [("tick", W("l13", 4) + i * 0.15) for i in range(7)] + [
    ("rise", W("l14", 6)), ("ding", W("l14", 6, 1.7)),
    ("whoosh", A("l15", -0.95)), ("pop", W("l15", 1)), ("pop", W("l15", 2)), ("pop", W("l15", 4)),
    ("sparkle", A("l16")), ("click", W("l16", 6, 0.55)), ("chime", W("l16", 6, 0.6)),
]
fx = np.zeros(N)
for name, at in SFX:
    place(fx, SYN[name](), at)

mix = voice + music * 0.9 + fx * 0.7
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.9
sf.write("assets/soundtrack.wav", np.stack([mix, mix], 1), SR, subtype="PCM_16")
with open("assets/timing.js", "w", encoding="utf-8") as fh:
    fh.write("// Generated by tools/build_audio.py\nwindow.T = ")
    json.dump({"fps": FPS, "dur": DUR, "lines": lines}, fh, ensure_ascii=False, separators=(",", ":"))
    fh.write(";\n")
print("duration", DUR)
for k in ORDER:
    print(k, lines[k]["start"], " ".join(f"{i}:{w}@{a:.2f}" for i, (w, a, b) in enumerate(lines[k]["words"])))
