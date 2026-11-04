"""Original sound design for ATTENTION STACKS (pure synthesis, no samples).

The bed is literally the idea: one tiny loop per open tab, each at its own pitch and tick rate.
41 loops run from frame 0, and six more join on the frames the new tabs open (41 -> 47),
so the hum gets denser as the counter climbs. Cues match index.html:
  0.05 / 0.13 / 0.22 / 0.33 / 0.47 s  glass passes the lens (air + shimmer, panned with the pane)
  0.32 ... 1.62 s                    a tab opens: a soft pop and a small rising blip
  1.05 / 1.30 s                      the headline lines resolve: low air
  1.62 s                             the counter locks on 47: a clean sub touch
Usage: python3 sound.py assets/audio/bed.wav [duration]
"""

import sys
import wave

import numpy as np

SR = 48000
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(47)
L = np.zeros(N)
R = np.zeros(N)


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
    L[i:j] += gain * (1 - max(0.0, pan)) * sig[: j - i]
    R[i:j] += gain * (1 + min(0.0, pan)) * sig[: j - i]


# --- the 47 loops: each a soft sine blip repeating at its own rate, panned across the field
OPEN = [0.32, 0.58, 0.84, 1.1, 1.36, 1.62]
starts = [0.0] * 41 + OPEN
for k, st in enumerate(starts):
    f0 = 220 * 2 ** (rng.uniform(0, 2.2))
    rate = rng.uniform(1.6, 5.5)  # ticks per second
    pan = rng.uniform(-0.8, 0.8)
    ph = rng.uniform(0, 1)
    gate = ((t * rate + ph) % 1) < 0.08
    env = np.convolve(gate.astype(float), np.ones(240) / 240, "same")
    s = np.sin(2 * np.pi * f0 * t) * env * 0.012
    s[t < st] = 0
    fade = np.clip((t - st) / 0.08, 0, 1)
    L += s * fade * (1 - max(0, pan))
    R += s * fade * (1 + min(0, pan))

# --- a sub floor under everything
sub = np.sin(2 * np.pi * 46 * t) * 0.05 + bandnoise(N, 40, 300) * 0.02
L += sub
R += sub

# --- glass passing the lens
for i, at in enumerate([0.05, 0.13, 0.22, 0.33, 0.47]):
    n = int(SR * 0.32)
    tt = np.arange(n) / SR
    air = bandnoise(n, 700, 7000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.2
    shimmer = bandnoise(n, 5000, 12000) * np.sin(np.pi * tt / tt[-1]) ** 6 * 0.08
    place(air + shimmer, max(0, at - 0.14), pan=0.7 if i % 2 else -0.7)

# --- new tabs opening
for k, at in enumerate(OPEN):
    n = int(SR * 0.14)
    tt = np.arange(n) / SR
    pop = bandnoise(int(SR * 0.006), 1500, 8000) * 0.35
    blip = np.sin(2 * np.pi * (900 + 1400 * tt / tt[-1]) * tt) * env_exp(n, 0.035) * 0.16
    place(pop, at, pan=-0.5 + 0.2 * k)
    place(blip, at + 0.004, pan=-0.5 + 0.2 * k)

# --- the headline resolves out of blur
for at in [1.05, 1.3]:
    n = int(SR * 0.7)
    tt = np.arange(n) / SR
    place(bandnoise(n, 150, 1600) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.1, at - 0.1)

# --- the counter locks on 47
n = int(SR * 1.2)
tt = np.arange(n) / SR
place(np.sin(2 * np.pi * (70 - 25 * (1 - np.exp(-tt * 6))) * tt) * env_exp(n, 0.35) * np.minimum(1, tt / 0.004) * 0.5, 1.62)

st = np.stack([L, R], axis=1)
st = np.tanh(st * 1.4) / np.tanh(1.4)
st = st / (np.abs(st).max() + 1e-9) * 0.88
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], DUR, "s")
