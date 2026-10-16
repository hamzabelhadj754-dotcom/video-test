"""Build the soundtrack and the lip-sync/timing data for the composition.

  python3 tools/build_audio.py video
Writes video/assets/soundtrack.wav and video/assets/timing.js.

Everything is deterministic: a synthesized music bed (ducked under the voice),
synthesized sound effects at authored times, and the voice-over clips placed at
the starts below. timing.js exposes the same starts plus a mouth-openness
envelope so the doctor's mouth follows her own voice.
"""
import json
import sys
import numpy as np
import soundfile as sf

PROJ = sys.argv[1]
SR = 44100
DUR = 59.0
N = int(SR * DUR)

# Voice-over placement (seconds). Visual beats in index.html key off these.
STARTS = {
    "l01": 1.20, "l02": 5.10,
    "l03": 9.80, "l04": 13.90, "l05": 15.70, "l06": 18.40, "l07": 21.40,
    "l08": 25.20, "l09": 26.90,
    "l10": 32.30, "l11": 34.20,
    "l12": 39.00, "l13": 42.00, "l14": 46.60,
    "l15": 51.20, "l16": 54.50,
}

# Sound effects (seconds). Kept in sync with the matching beats in index.html.
SFX = [
    ("sparkle", 0.25), ("pop", 1.05),
    ("whoosh", 5.25), ("pop", 7.55), ("pop", 7.85), ("pop", 8.15),
    ("whoosh", 9.35), ("pop", 12.35),
    ("rise", 13.95), ("ding", 15.75), ("ding", 18.45), ("ding", 21.45),
    ("whoosh", 24.45), ("chime", 25.2), ("pop", 26.0), ("bubbles", 27.0),
    ("pop", 28.15), ("pop", 28.75), ("pop", 29.75), ("pop", 30.25), ("pop", 30.75),
    ("whoosh", 31.75), ("chime", 32.3), ("drop", 35.0), ("drop", 35.35), ("click", 35.9),
    ("pop", 36.6), ("pop", 36.8), ("pop", 37.0), ("pop", 37.2),
    ("whoosh", 38.45), ("chime", 39.0), ("stamp", 40.45), ("whoosh", 41.6),
    ("rise", 42.4), ("tick", 43.85), ("tick", 44.05), ("tick", 44.25), ("tick", 44.45),
    ("tick", 44.65), ("tick", 44.85), ("tick", 45.05), ("whoosh", 45.3),
    ("whoosh", 46.5), ("rise", 47.7), ("ding", 49.5),
    ("whoosh", 50.9), ("pop", 52.15), ("pop", 52.85), ("pop", 53.6),
    ("sparkle", 54.6), ("chime", 56.95),
]

rng = np.random.default_rng(11)
t_all = np.arange(N) / SR


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


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


# --- music bed ---------------------------------------------------------------
music = np.zeros(N)
bpm = 96
beat = 60 / bpm
bar = beat * 4
chords = [  # Cmaj7, Am9, Fmaj7, G6
    [48, 55, 59, 64], [45, 52, 59, 60], [41, 48, 57, 64], [43, 50, 59, 64],
]
for k in range(int(DUR / bar) + 1):
    t0 = k * bar
    ch = chords[k % 4]
    n = int(bar * SR * 1.15)
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * midi(m + 12) * tt + d) + 0.5 * np.sin(2 * np.pi * midi(m + 12) * 1.003 * tt)
              for m, d in zip(ch, [0, 1, 2, 3]))
    place(music, pad * env_adsr(n, 0.6, 0.9) * 0.018, t0)
    # bass
    nb = int(beat * 2 * SR)
    tb = np.arange(nb) / SR
    for half in (0, 2):
        bass = np.sin(2 * np.pi * midi(ch[0] - 12) * tb) * np.exp(-tb * 2.2)
        place(music, bass * 0.11, t0 + half * beat)
    # pluck arpeggio, eighth notes
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    for e in range(8):
        m = ch[pattern[e]] + 24
        np_ = int(0.6 * SR)
        tp = np.arange(np_) / SR
        f = midi(m)
        pl = (np.sin(2 * np.pi * f * tp) + 0.35 * np.sin(4 * np.pi * f * tp) + 0.12 * np.sin(6 * np.pi * f * tp))
        pl *= np.exp(-tp * 7) * np.minimum(1, tp / 0.004)
        place(music, pl * 0.035, t0 + e * beat / 2)
    # soft kick + shaker
    for b in range(4):
        nk = int(0.18 * SR)
        tk = np.arange(nk) / SR
        f = 50 + 70 * np.exp(-tk * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tk * 18)
        if b in (0, 2):
            place(music, kick * 0.16, t0 + b * beat)
        ns = int(0.05 * SR)
        sh = rng.standard_normal(ns)
        sh = sh - lowpass(sh, 6)
        place(music, sh * np.exp(-np.arange(ns) / SR * 70) * 0.03, t0 + b * beat + beat / 2)

# fade in / out
fade = np.ones(N)
fade[: int(1.2 * SR)] = np.linspace(0, 1, int(1.2 * SR))
fo0 = int(56.8 * SR)
fade[fo0:] = np.linspace(1, 0, N - fo0)
music *= fade

# --- voice-over --------------------------------------------------------------
voice = np.zeros(N)
lips = {}
FPS_LIP = 25
for lid, at in STARTS.items():
    y, sr = sf.read(f"{PROJ}/assets/vo/{lid}.wav")
    if y.ndim > 1:
        y = y.mean(axis=1)
    if sr != SR:
        idx = np.arange(0, len(y), sr / SR)
        y = np.interp(idx, np.arange(len(y)), y)
    place(voice, y, at)
    # mouth envelope
    hop = SR // FPS_LIP
    frames = len(y) // hop
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(frames)])
    db = 20 * np.log10(rms)
    lo, hi = np.percentile(db[db > -60], [35, 97]) if np.any(db > -60) else (-60, -20)
    v = np.clip((db - lo) / (hi - lo), 0, 1) ** 1.3
    v[db < -45] = 0
    v = np.convolve(v, [0.2, 0.6, 0.2], mode="same")
    lips[lid] = {"start": at, "dur": round(len(y) / SR, 3), "v": [round(float(x), 2) for x in v]}

# duck music under the voice
venv = lowpass(np.abs(voice), int(0.25 * SR))
venv = np.clip(venv / (venv.max() + 1e-9) * 4, 0, 1)
venv = lowpass(venv, int(0.3 * SR))
music *= 1 - 0.55 * venv


# --- sound effects -----------------------------------------------------------
def s_pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.35


def s_whoosh():
    n = int(0.7 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    a = lowpass(x, 18) - lowpass(x, 60)
    e = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 2
    return a * e * 1.6


def s_chime(base=1046.5):
    n = int(1.6 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * base * r * t) * g for r, g in [(1, 1), (1.5, 0.5), (2, 0.35), (3, 0.12)])
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.003) * 0.12


def s_ding():
    return s_chime(1318.5) * 0.9


def s_sparkle():
    out = np.zeros(int(1.2 * SR))
    for i in range(9):
        f = midi(84 + [0, 4, 7, 11, 12, 16, 19, 23, 24][i])
        n = int(0.5 * SR); t = np.arange(n) / SR
        blip = np.sin(2 * np.pi * f * t) * np.exp(-t * 12) * 0.06
        place(out, blip, i * 0.07)
    return out


def s_rise():
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = 300 * 2 ** (t / 0.9 * 1.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.9) * 0.08


def s_drop():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 1400 * np.exp(-t * 9) + 400
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * 0.25


def s_click():
    n = int(0.08 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-t * 120)
    return (x - lowpass(x, 4)) * 0.5 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 60) * 0.2


def s_tick():
    n = int(0.1 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 50) * 0.16


def s_stamp():
    n = int(0.4 * SR); t = np.arange(n) / SR
    f = 40 + 120 * np.exp(-t * 25)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    x = rng.standard_normal(n) * np.exp(-t * 40)
    return thump * 0.45 + lowpass(x, 3) * 0.2


def s_bubbles():
    out = np.zeros(int(2.4 * SR))
    for i in range(14):
        at = i * 0.16 + rng.uniform(0, 0.06)
        n = int(0.09 * SR); t = np.arange(n) / SR
        f0 = rng.uniform(700, 1300)
        f = f0 * (1 + 2.5 * t / 0.09)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.12
        place(out, b, at)
    return out


SYNTH = {"pop": s_pop, "whoosh": s_whoosh, "chime": s_chime, "ding": s_ding, "sparkle": s_sparkle,
         "rise": s_rise, "drop": s_drop, "click": s_click, "tick": s_tick, "stamp": s_stamp,
         "bubbles": s_bubbles}
fx = np.zeros(N)
for name, at in SFX:
    place(fx, SYNTH[name](), at)

mix = voice * 1.0 + music * 1.0 + fx * 0.7
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89
stereo = np.stack([mix, mix], axis=1)
sf.write(f"{PROJ}/assets/soundtrack.wav", stereo, SR, subtype="PCM_16")

with open(f"{PROJ}/assets/timing.js", "w") as fh:
    fh.write("// Generated by tools/build_audio.py: voice-over starts and mouth envelopes (25 fps).\n")
    fh.write("window.DOC_TIMING = ")
    json.dump({"fps": FPS_LIP, "lines": lips}, fh, separators=(",", ":"))
    fh.write(";\n")
print("peak", round(float(peak), 3), "voice end", max(v["start"] + v["dur"] for v in lips.values()))
