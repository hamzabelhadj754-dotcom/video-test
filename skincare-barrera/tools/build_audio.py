"""Timing + soundtrack for the "3 cosas que nunca hago" reel.

  python3 tools/build_audio.py
The recorded voice-over (assets/vo-eleven.mp3, or $VO) plays as one continuous take.
With NOVOICE=1 the take only drives the timing and is left out of the mix
(text + music fallback).
Line and word times come from MFCC + DTW against TTS renders of the script
(assets/vo-raw/<id>.wav); line edges are snapped to the recording's pauses.
Writes assets/soundtrack.wav and assets/timing.js.
"""
import json
import os
import re
import numpy as np
import librosa
import soundfile as sf

SR = 44100
A_SR, HOP = 16000, 160
OFFSET = 0.15  # the voice starts this far into the video
lines = [l.rstrip("\n").split("\t") for l in open("tools/lines.tsv", encoding="utf-8")]
rng = np.random.default_rng(12)


# --- alignment --------------------------------------------------------------
def mfcc(y):
    m = librosa.feature.mfcc(y=y, sr=A_SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    return (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)


def prop_words(text, d):
    words, units, spans = text.split(), 0.0, []
    for w in words:
        n = len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 1.2
        spans.append((units, units + n))
        units += n + (5.0 if re.search(r"[,.:;!?]$", w) else 0)
    return [(w, a / units * d, b / units * d) for w, (a, b) in zip(words, spans)]


ref, bounds, rwords, t = [], [], [], 0.0
for k, text in lines:
    y, _ = librosa.load(f"assets/vo-raw/{k}.wav", sr=A_SR)
    y, _ = librosa.effects.trim(y, top_db=35)
    d = len(y) / A_SR
    bounds.append((k, t, t + d))
    rwords.append([(w, t + a, t + b) for w, a, b in prop_words(text, d)])
    ref += [y, np.zeros(int(0.35 * A_SR))]
    t += d + 0.35
ref = np.concatenate(ref)
VO = os.environ.get("VO", "assets/vo-eleven.mp3")
NOVOICE = os.environ.get("NOVOICE") == "1"
rec16, _ = librosa.load(VO, sr=A_SR)
_, wp = librosa.sequence.dtw(X=mfcc(ref), Y=mfcc(rec16), metric="cosine")
wp = wp[::-1]
rf, bf = wp[:, 0] * HOP / A_SR, wp[:, 1] * HOP / A_SR
warp = lambda x: float(bf[min(np.searchsorted(rf, x), len(bf) - 1)])

db = 20 * np.log10(np.array([np.sqrt(np.mean(rec16[i * HOP:(i + 1) * HOP] ** 2)) + 1e-9 for i in range(len(rec16) // HOP)]))
quiet = db < max(db.max() - 38, -50)


def pause_near(t0, span=0.45):
    a, b = max(int((t0 - span) * 100), 0), min(int((t0 + span) * 100), len(quiet))
    best, i = None, a
    while i < b:
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            k = i
            while k > 0 and quiet[k - 1]:
                k -= 1
            if best is None or (j - k) > (best[1] - best[0]):
                best = (k, j)
            i = j
        else:
            i += 1
    return (best[0] / 100, best[1] / 100) if best else (t0, t0)


voiced = np.where(~quiet)[0]
first, last = voiced[0] / 100, (voiced[-1] + 1) / 100
cuts = [pause_near((warp(bounds[i][2]) + warp(bounds[i + 1][1])) / 2) for i in range(len(bounds) - 1)]
starts = [first] + [c[1] for c in cuts]
ends = [c[0] for c in cuts] + [last]

rec, _ = librosa.load(VO, sr=SR)
FPS = 25
out = {}
for (k, _, _), ws, s, e in zip(bounds, rwords, starts, ends):
    wv = [(w, warp(x), warp(y)) for w, x, y in ws]
    w0, w1 = wv[0][1], wv[-1][2]
    sc = lambda x: s + (x - w0) / max(w1 - w0, 1e-6) * (e - s)
    seg = rec[int(s * SR): int(e * SR)]
    hop = SR // FPS
    fr = len(seg) // hop
    ldb = 20 * np.log10(np.array([np.sqrt(np.mean(seg[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(fr)]))
    lo, hi = np.percentile(ldb[ldb > -60], [35, 97])
    v = np.clip((ldb - lo) / (hi - lo), 0, 1) ** 1.3
    v[ldb < -45] = 0
    v = np.convolve(v, [0.2, 0.6, 0.2], mode="same")
    out[k] = {
        "start": round(s + OFFSET, 3), "dur": round(e - s, 3),
        "v": [round(float(x), 2) for x in v],
        "words": [[w, round(sc(x) + OFFSET, 3), round(sc(y) + OFFSET, 3)] for w, x, y in wv],
    }

DUR = round(last + OFFSET + 2.8, 2)
N = int(DUR * SR)
voice = np.zeros(N)
voice[int(OFFSET * SR): int(OFFSET * SR) + len(rec)] = rec[: N - int(OFFSET * SR)]
voice *= 0.9 / np.max(np.abs(voice))  # the voice leads the mix


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


# --- music: minimal, premium pulse (100 bpm) ---------------------------------
music = np.zeros(N)
beat = 60 / 100
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 66]]
t0, bi = 0.0, 0
while t0 < DUR:
    ch = chords[bi % 4]
    n = tt(beat * 4 * 1.1)
    pad = sum(np.sin(2 * np.pi * midi(m) * n) + 0.4 * np.sin(2 * np.pi * midi(m) * 1.004 * n) for m in ch)
    place(music, pad * np.minimum(1, n / 0.5) * np.minimum(1, (n[-1] - n) / 0.6) * 0.013, t0)
    for b in range(4):
        tb = t0 + b * beat
        k = tt(0.2)
        f = 48 + 80 * np.exp(-k * 30)
        place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 15) * 0.24, tb)
        if b in (1, 3):
            c = tt(0.14)
            x = rng.standard_normal(len(c))
            place(music, (x - lowpass(x, 4)) * np.exp(-c * 32) * 0.09, tb)
        for s in (0.5,):
            h = tt(0.06)
            x = rng.standard_normal(len(h))
            place(music, (x - lowpass(x, 3)) * np.exp(-h * 80) * 0.03, tb + s * beat)
        pt = tt(0.35)
        fp = midi(ch[(b * 2) % 4] + 12)
        place(music, (np.sin(2 * np.pi * fp * pt) + 0.3 * np.sin(4 * np.pi * fp * pt)) * np.exp(-pt * 10) * 0.022, tb + 0.75 * beat)
        nb = tt(beat * 0.9)
        place(music, np.sin(2 * np.pi * midi(ch[0] - 24) * nb) * np.exp(-nb * 3) * 0.13, tb)
    t0 += 4 * beat
    bi += 1
g = np.ones(N)
g[: int(0.15 * SR)] = np.linspace(0, 1, int(0.15 * SR))
fo = int((DUR - 1.8) * SR)
g[fo:] = np.linspace(1, 0, N - fo)
music *= g
venv = lowpass(np.abs(voice), int(0.2 * SR))
venv = np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)
music *= 1 - 0.55 * lowpass(venv, int(0.25 * SR))


# --- sfx ----------------------------------------------------------------------
def s_impact():
    t = tt(0.8); f = 32 + 110 * np.exp(-t * 26)
    x = rng.standard_normal(len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.27 + lowpass(x, 5) * np.exp(-t * 20) * 0.11

def s_whoosh():
    t = tt(0.6); x = rng.standard_normal(len(t))
    return (lowpass(x, 14) - lowpass(x, 50)) * np.sin(np.pi * t / 0.6) ** 2 * 0.3

def s_stamp():
    t = tt(0.4); f = 40 + 120 * np.exp(-t * 25)
    x = rng.standard_normal(len(t)) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 0.45 + lowpass(x, 3) * 0.2

def s_pop():
    t = tt(0.12); f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.3

def s_chime():
    t = tt(1.3)
    s = sum(np.sin(2 * np.pi * 1046.5 * r * t) * gg for r, gg in [(1, 1), (1.5, 0.5), (2, 0.3)])
    return s * np.exp(-t * 3.5) * np.minimum(1, t / 0.003) * 0.12

def s_click():
    t = tt(0.07); x = rng.standard_normal(len(t)) * np.exp(-t * 120)
    return (x - lowpass(x, 4)) * 0.45 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 60) * 0.2


W = lambda k, i, o=0.0: out[k]["words"][i][1] + o
A = lambda k, o=0.0: out[k]["start"] + o
SFX = []
for k in ["l02", "l03", "l04", "l05", "l06", "l07", "l08"]:
    SFX.append(("whoosh", A(k, -0.3)))
SFX += [("click", W("l01", 3, 0.0)), ("click", W("l01", 3, 0.25)), ("click", W("l01", 3, 0.5)),
        ("stamp", W("l02", 4, -0.05)), ("pop", W("l02", 5, -0.05))]
for k in ["l03", "l04", "l05", "l06"]:
    SFX += [("pop", W(k, 0, 0.15)), ("pop", W(k, 0, 0.3)), ("pop", W(k, 0, 0.45))]
SFX += [("chime", W("l07", 0, 0.1)), ("impact", W("l08", 4, -0.05)), ("chime", W("l08", 4, 0.1)),
        ("click", W("l08", 4, 0.9)), ("chime", W("l08", 4, 0.95))]
SYN = dict(impact=s_impact, whoosh=s_whoosh, stamp=s_stamp, pop=s_pop, chime=s_chime, click=s_click)
fx = np.zeros(N)
for name, at in SFX:
    place(fx, SYN[name](), at)

fx *= 1 - 0.6 * lowpass(venv, int(0.1 * SR))  # sfx sit under the voice too
if NOVOICE:
    voice[:] = 0
    music *= 1.6  # no voice to duck under: the bed carries the reel
mix = voice + music * 0.9 + fx * 0.45
mix = np.tanh(mix * 1.1) / np.tanh(1.1) * 0.95
act = np.abs(voice) > 0.02
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
print("rms dB  voice", round(db(voice[act]), 1), " music", round(db(music[act] * 0.9), 1), " fx(peak)", round(20 * np.log10(np.abs(fx * 0.45).max()), 1))
sf.write("assets/soundtrack.wav", np.stack([mix, mix], 1), SR, subtype="PCM_16")
with open("assets/timing.js", "w", encoding="utf-8") as fh:
    fh.write("// Generated by tools/build_audio.py\nwindow.T = ")
    json.dump({"fps": FPS, "dur": DUR, "lines": out}, fh, ensure_ascii=False, separators=(",", ":"))
    fh.write(";\n")
print("duration", DUR)
for k, _ in lines:
    print(k, out[k]["start"], out[k]["dur"], " ".join(f"{i}:{w}@{a:.2f}" for i, (w, a, b) in enumerate(out[k]["words"])))
