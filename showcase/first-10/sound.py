"""Original industrial sound bed for FIRST 10 SECONDS (pure synthesis, no samples).

11.0 s, 48 kHz stereo, loops cleanly: the drone has a whole number of cycles in 11 s
and every tail has decayed before 10.8 s. Cue times match index.html.
Usage: python3 sound.py assets/audio/bed.wav
"""

import sys
import wave

import numpy as np

SR = 48000
DUR = 11.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(10)
out = np.zeros(N)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def place(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    out[i:j] += gain * sig[: j - i]


def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    X[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def click(level=0.5, lo=2500, hi=9000, ms=6):
    n = int(SR * ms / 1000)
    return bandnoise(n, lo, hi) * env_exp(n, ms / 4000) * level


def thump(f0=110, f1=38, dur=0.45, level=0.9):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_exp(n, dur / 4) * level


# --- sub drone: 41 Hz -> 451 whole cycles in 11 s, so the loop point is seamless ---
drone = 0.6 * np.sin(2 * np.pi * 41 * t) + 0.18 * np.sin(2 * np.pi * 82 * t)
saw = 2 * ((t * 41) % 1) - 1
drone += 0.05 * saw
out += drone * 0.09

# --- act 1: dry mechanical clicks on the reveals, the clock ticks, the cursor ---
for at, lv in [(0.13, 0.32), (0.33, 0.28), (1.0, 0.22), (2.0, 0.22), (1.2, 0.12), (1.53, 0.12), (1.8, 0.12)]:
    place(click(lv), at)

# --- seam 1 air flick, then the NEGOTIATING impact at 2.50 ---
place(bandnoise(int(SR * 0.16), 1200, 7000) * np.linspace(0, 1, int(SR * 0.16)) ** 2 * 0.12, 2.04)
place(thump(110, 38, 0.5, 0.85), 2.5)
place(click(0.5, 1500, 7000, 9), 2.5)

# --- indecision steps: a click every 8 frames ---
for k in range(9):
    place(click(0.2 + 0.02 * (k % 3), 3000, 10000, 5), 2.667 + k * 8 / 30)

# --- seam 2 + tension riser through the overload, cut dead at 7.60 ---
place(bandnoise(int(SR * 0.16), 1200, 7000) * np.linspace(0, 1, int(SR * 0.16)) ** 2 * 0.12, 5.0)
a, b = 5.0, 7.6
n = int(SR * (b - a))
tt = np.arange(n) / SR
f = 180 * (720 / 180) ** (tt / (b - a))
riser = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + bandnoise(n, 900, 6000) * 0.35
riser *= (tt / (b - a)) ** 2 * 0.22
place(riser, a)
for at in [5.1, 5.55, 5.95, 6.3, 6.62, 6.85, 7.05, 7.22, 7.36, 7.48]:
    place(click(0.34, 1800, 8000, 7), at)
    place(thump(160, 70, 0.12, 0.25), at)

# --- breakthrough: suck-in, slash, metallic hit at 8.53 ---
n = int(SR * 0.2)
place(bandnoise(n, 400, 4000) * np.linspace(1, 0, n) ** 0.5 * np.linspace(0, 1, n) * 0.25, 8.0)
n = int(SR * 0.12)
place(bandnoise(n, 3000, 14000) * env_exp(n, 0.04) * 0.3, 8.2)
n = int(SR * 1.5)
tt = np.arange(n) / SR
metal = sum(a * np.sin(2 * np.pi * fr * tt) * np.exp(-tt * d) for fr, a, d in
            [(523, 1.0, 2.6), (1187, 0.7, 3.1), (1873, 0.5, 3.8), (2659, 0.35, 4.6), (3417, 0.25, 5.5)])
metal = metal / np.abs(metal).max() * 0.42
place(metal, 8.53)
place(thump(95, 34, 0.7, 0.9), 8.53)
place(click(0.5, 2000, 12000, 8), 8.53)

# --- loop: seam 3 flick + the restart click ---
place(bandnoise(int(SR * 0.16), 1200, 7000) * np.linspace(0, 1, int(SR * 0.16)) ** 2 * 0.1, 10.4)
place(click(0.28), 10.6)

out = np.tanh(out * 1.4) / np.tanh(1.4)
out = out / (np.abs(out).max() + 1e-9) * 0.89
st = np.stack([out, np.roll(out, 24) * 0.98], axis=1)
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], round(N / SR, 2), "s")
