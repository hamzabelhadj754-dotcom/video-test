"""Original sound design for BUILT IN THE DARK. (pure synthesis, no samples).

14.0 s, 48 kHz stereo, loop-safe: the 40 Hz sub runs 560 whole cycles, and the film starts and ends
in silence-black. Every cue sits on a visible light event in index.html:
  0.03 / 0.10 s  ignition: two relay clacks plus a filament buzz swell
  3.20-3.55 s    whip pan air
  6.80 s         the key light cuts: one relay clack, then silence until 7.2
  7.20 s         the red rim hum swells in
  8.45-9.60 s    the dolly-zoom tension rise, cut dead into
  9.60 s         THE SLAM: a deep impact with a hall tail
  12.88-13.72 s  DARK. dies letter by letter: five relay clicks
Usage: python3 sound.py assets/audio/bed.wav
"""

import sys
import wave

import numpy as np

SR = 48000
DUR = 14.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N)
Rch = np.zeros(N)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    X[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if j <= i:
        return
    L[i:j] += gain * (1 - max(0, pan)) * sig[: j - i]
    Rch[i:j] += gain * (1 + min(0, pan)) * sig[: j - i]


def relay(level=0.5):
    """A heavy mechanical relay: a sharp transient, a body knock and a short metal buzz."""
    n = int(SR * 0.09)
    a = bandnoise(n, 1500, 9000) * env_exp(n, 0.004)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 180 * tt) * env_exp(n, 0.012) * 0.6
    return (a + body) * level


def boom(f0=70, f1=28, dur=2.6, level=1.0):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, dur / 5)
    s *= np.minimum(1, tt / 0.003)
    return s * level


def hall(sig, rt=2.2, mix=0.35):
    n = int(SR * rt)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (rt / 6.9 * SR))
    ir = np.convolve(ir, np.ones(24) / 24, "same")  # darken the tail
    wet = np.fft.irfft(np.fft.rfft(sig, len(sig) + n) * np.fft.rfft(ir, len(sig) + n))[: len(sig) + n]
    wet = wet / (np.abs(wet).max() + 1e-9) * np.abs(sig).max()
    out = np.zeros(len(sig) + n)
    out[: len(sig)] += sig
    return out + wet * mix


def window(a, b, fade=0.04):
    g = np.zeros(N)
    g[(t >= a) & (t < b)] = 1
    k = int(SR * fade)
    ia, ib = int(a * SR), int(b * SR)
    if ia > 0:
        g[ia : ia + k] *= np.linspace(0, 1, k)
    g[max(0, ib - k) : ib] *= np.linspace(1, 0, min(k, ib))
    return g


# --- bed: a 40 Hz sub plus the room. On with the light, out during the 6.8-7.2 blackout, out at the end.
bed_gate = window(0.03, 6.8, 0.03) + window(7.2, 13.9, 0.3)
sub = 0.7 * np.sin(2 * np.pi * 40 * t) + 0.2 * np.sin(2 * np.pi * 80 * t)
room = bandnoise(N, 60, 900) * 0.25
bed = (sub * 0.06 + room * 0.05) * bed_gate
L += bed
Rch += np.roll(bed, 31)

# --- ignition
place(relay(0.55), 1 / 30)
place(relay(0.3), 3 / 30)
n = int(SR * 2.4)
tt = np.arange(n) / SR
buzz = (np.sin(2 * np.pi * 100 * tt) + 0.5 * np.sin(2 * np.pi * 200 * tt) + 0.25 * np.sign(np.sin(2 * np.pi * 100 * tt))) * 0.05
buzz *= np.minimum(1, tt / 0.05) * np.exp(-tt / 1.0)
place(buzz, 3 / 30)

# --- the glide: a slow low swell along the letters
n = int(SR * 3.0)
tt = np.arange(n) / SR
place(bandnoise(n, 80, 600) * np.sin(np.pi * tt / 3.0) ** 2 * 0.08, 0.2)

# --- whip pan air (3.2-3.55), panned left to right with the move
n = int(SR * 0.45)
tt = np.arange(n) / SR
whoosh = bandnoise(n, 500, 5000) * np.sin(np.pi * tt / tt[-1]) ** 3 * 0.22
place(whoosh * np.linspace(1.0, 0.3, n), 3.15, pan=-0.6)
place(whoosh * np.linspace(0.3, 1.0, n), 3.15, pan=0.6)
place(boom(90, 45, 0.5, 0.25), 3.55)

# --- the crane: the light orbits; a faint rising air
n = int(SR * 3.0)
tt = np.arange(n) / SR
place(bandnoise(n, 300, 2500) * (tt / tt[-1]) * 0.05, 3.7)

# --- 6.8: the key cuts out
place(relay(0.5), 6.8)

# --- 7.2: the red rim hum
n = int(SR * 6.6)
tt = np.arange(n) / SR
hum = (np.sin(2 * np.pi * 55 * tt) + 0.4 * np.sin(2 * np.pi * 110 * tt) + 0.15 * np.sin(2 * np.pi * 165 * tt)) * 0.045
hum *= np.minimum(1, tt / 0.6) * np.minimum(1, np.maximum(0, (6.6 - tt) / 0.25))
place(hum, 7.2)

# --- 8.45-9.6: the dolly-zoom rise, cut dead at the slam
a, b = 8.3, 9.6
n = int(SR * (b - a))
tt = np.arange(n) / SR
f = 70 * (420 / 70) ** ((tt / (b - a)) ** 1.5)
rise = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + bandnoise(n, 400, 6000) * 0.5
rise *= (tt / (b - a)) ** 2.4 * 0.2
rise[-int(SR * 0.004):] = 0
place(rise, a)

# --- 9.6: THE SLAM
slam = hall(boom(75, 26, 2.4, 1.0) + np.pad(bandnoise(int(SR * 0.06), 800, 9000) * env_exp(int(SR * 0.06), 0.01) * 0.5, (0, int(SR * 2.34))), rt=2.4, mix=0.4)
place(slam, 9.6, 0.9)
place(relay(0.6), 9.6)

# --- 10.9: the tagline, one low clean tone
n = int(SR * 2.2)
tt = np.arange(n) / SR
place(np.sin(2 * np.pi * 220 * tt) * env_exp(n, 0.5) * np.minimum(1, tt / 0.15) * 0.04, 10.9)

# --- DARK. dies: five relay clicks (one frame before each letter's death is its flicker)
for i, d in enumerate([12.95, 13.15, 13.35, 13.55, 13.72]):
    place(relay(0.38 + 0.03 * i), d - 2 / 30, pan=-0.4 + 0.2 * i)
    place(relay(0.18), d, pan=-0.4 + 0.2 * i)

st = np.stack([L, Rch], axis=1)
st = np.tanh(st * 1.2) / np.tanh(1.2)
st = st / (np.abs(st).max() + 1e-9) * 0.9
st[-int(SR * 0.02):] *= np.linspace(1, 0, int(SR * 0.02))[:, None]
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], round(N / SR, 2), "s")
