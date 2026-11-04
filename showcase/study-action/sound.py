"""Original sound bed for "STUDY is not an action" (pure synthesis, no samples).

20.0 s, 48 kHz stereo, loops cleanly. The 40 Hz drone runs exactly 800 cycles in 20 s, and
the 72 BPM pulse lands 24 whole beats in 20 s. Every tail decays before 19.9 s.
The sound is quiet and mechanical on purpose: no lasers, no whooshes, no metal hits.
Cue times match template.html.
Usage: python3 sound.py assets/audio/bed.wav
"""

import sys
import wave

import numpy as np

SR = 48000
DUR = 20.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(42)
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


def click(level=0.3, lo=2500, hi=9000, ms=6):
    n = int(SR * ms / 1000)
    return bandnoise(n, lo, hi) * env_exp(n, ms / 4000) * level


def thump(f0=110, f1=38, dur=0.45, level=0.9):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    a = np.minimum(1, tt / 0.002)  # 2 ms attack: no click at the start of the sine
    return np.sin(ph) * env_exp(n, dur / 4) * a * level


def gate(a, b, fade=0.05):
    """1 everywhere except the silence window [a, b), with short fades."""
    g = np.ones(N)
    g[(t >= a) & (t < b)] = 0
    k = int(SR * fade)
    ia, ib = int(a * SR), int(b * SR)
    g[ia - k : ia] = np.linspace(1, 0, k)
    g[ib : ib + k] = np.linspace(0, 1, k)
    return g


# --- the bed: a low drone plus a quiet mechanical pulse, both silent 7.0-7.4 (stillness) ---
drone = 0.6 * np.sin(2 * np.pi * 40 * t) + 0.15 * np.sin(2 * np.pi * 80 * t)
out += drone * 0.07 * gate(7.0, 7.45, 0.08)
BEAT = 60 / 72
for k in range(24):
    at = k * BEAT
    if 6.95 <= at < 7.45:
        continue
    lv = 0.16 if 3.3 <= at < 7.0 else 0.12  # the pulse leans in during the friction
    place(thump(72, 44, 0.16, lv), at)
    place(click(0.05, 1800, 5000, 4), at)

# --- 3.0: anticipation shudder ---
place(click(0.22, 1500, 6000, 8), 3.0)

# --- 3.3-7.0: tension rise (filtered noise + a slow rising tone, never loud) ---
a, b = 3.3, 7.0
n = int(SR * (b - a))
tt = np.arange(n) / SR
f = 110 * (330 / 110) ** (tt / (b - a))
rise = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bandnoise(n, 600, 3500) * 0.4
rise *= (tt / (b - a)) ** 2 * 0.16
rise[-int(SR * 0.03):] *= np.linspace(1, 0, int(SR * 0.03))
place(rise, a)
# headline lines and one click per prompt tag
for at, lv in [(3.3, 0.2), (3.5, 0.18), (3.9, 0.26), (4.4, 0.26), (4.9, 0.26)]:
    place(click(lv, 2000, 8000, 6), at)
place(click(0.18, 3000, 9000, 5), 4.2)  # FRICTION / HIGH

# --- 7.4-8.0: suck-in (reverse-swelling low noise, cut dead at the push-through end) ---
n = int(SR * 0.58)
tt = np.arange(n) / SR
place(bandnoise(n, 200, 2500) * (tt / tt[-1]) ** 2.5 * 0.2, 7.42)

# --- 8.2: clean bass impact on NEXT ACTION / FOUND + the first lock ---
place(thump(90, 36, 0.9, 0.95), 8.2)
place(click(0.32, 1200, 6000, 9), 8.2)

# --- card locks: a soft mechanical click per card (each locks 0.3 s after its wipe starts) ---
for at in [8.5, 9.7, 10.9]:
    place(click(0.3, 1500, 7000, 7), at)
    place(thump(150, 80, 0.08, 0.18), at)
    place(click(0.12, 4000, 11000, 4), at + 4 / 30)  # the tick mark

# --- 13.0: the cards clear left ---
place(click(0.14, 2000, 8000, 5), 13.0)

# --- 13.7 click on START THE, 14.4 low hit when FIRST MOVE. locks ---
place(click(0.24, 2000, 8000, 6), 13.2)
place(click(0.28, 1800, 7000, 7), 13.7)
place(thump(70, 34, 0.7, 0.7), 14.4)
place(click(0.26, 1200, 5000, 8), 14.4)

# --- act 5: line clicks, the final subtle click on OPEN THE BOOK, the cursor blink ---
for at in [17.2, 17.35, 17.5]:
    place(click(0.14, 2500, 9000, 5), at)
place(click(0.3, 2500, 10000, 6), 17.6)
place(click(0.12, 4000, 12000, 3), 18.6)
place(click(0.16, 2000, 8000, 5), 19.45)  # the card returns

out = np.tanh(out * 1.3) / np.tanh(1.3)
out = out / (np.abs(out).max() + 1e-9) * 0.85
st = np.stack([out, np.roll(out, 24) * 0.98], axis=1)
pcm = (st * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], round(N / SR, 2), "s")
