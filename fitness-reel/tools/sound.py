"""Original sound design for the Same Muscle reel (all synthesized). Frame numbers follow src/timeline.ts (30fps)."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR, FPS, DUR = 48000, 30, 20.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N); WL = np.zeros(N); WR = np.zeros(N)
def fr(f): return f / FPS
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, fc): return signal.sosfilt(signal.butter(2, fc, btype="low", fs=SR, output="sos"), x)
def hp(x, fc): return signal.sosfilt(signal.butter(2, fc, btype="high", fs=SR, output="sos"), x)
def band(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def fade(x, a=0.003, r=0.02):
    n = len(x); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr); return x * e
def add(x, t, g=1.0, pan=0.0, wet=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[: N - i] * g
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * l; R[i:i + len(x)] += x * r; WL[i:i + len(x)] += x * l * wet; WR[i:i + len(x)] += x * r * wet
def sub(d=0.8, f0=90, f1=40, k=3.0):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 14)) / SR
    return fade(np.sin(ph) * np.exp(-t * k), 0.001, 0.05)
def click(tone=3000, d=0.03, body=0.4, low=160):
    t = tt(d); x = band(rng.standard_normal(len(t)), tone * 0.7, min(tone * 1.5, 20000)) * np.exp(-t * 180)
    return fade(x + body * np.sin(2 * np.pi * low * t) * np.exp(-t * 80), 0.0005, 0.005)
def whoosh(d, f0, f1, peak=0.7):
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); B = 2048; win = np.hanning(B)
    for s in range(0, n - B, B // 4):
        c = f0 * (f1 / f0) ** (s / n)
        out[s:s + B] += signal.sosfilt(signal.butter(2, [c * 0.6, min(c * 1.7, SR / 2 - 100)], btype="band", fs=SR, output="sos"), x[s:s + B]) * win
    p = np.arange(n) / n
    return out * np.where(p < peak, (p / peak) ** 2.2, ((1 - p) / (1 - peak)) ** 1.6) * 0.5
def crackle(d, density=300):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(int(density * d)):
        i = rng.integers(0, n - 200); x[i:i + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 12) * rng.uniform(0.2, 1)
    return hp(x, 2500) * np.linspace(1, 0.2, n)
def pad(notes, d, cut=900):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        for det in (-0.06, 0.05):
            x += sum(np.sin(2 * np.pi * hz(m + det) * k * t + k) / k for k in range(1, 6))
    return lp(x, cut) / len(notes) * 0.4
def bell(m, d=1.4):
    t = tt(d); f = hz(m)
    return fade(np.sin(2 * np.pi * f * t) * np.exp(-t * 4) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8), 0.002, 0.05)

# rep schedules (mirror src/timeline.ts)
light = [150 + (i - 1) * 8.6 if i <= 12 else 252 + (i - 13) * 7.4 for i in range(1, 26)]
cmpL = [384 + k * (452 - 384) / 24 for k in range(25)]
cmpH = [384 + k * (452 - 384) / 7 for k in range(8)]

t_all = np.arange(N) / SR
# ---- 01 hook ----
add(sub(1.6, 70, 34, 2.0), fr(0), 0.9, 0, 0.2)                 # ignition
add(whoosh(1.2, 300, 5200, 0.8), fr(0), 0.45, 0.2, 0.5)        # the wave races out
add(sub(0.6, 120, 50, 6), fr(14), 0.7, 0, 0.1)                   # "build muscle." lands
add(click(1800, 0.05, 1.0, 90), fr(14), 0.35, 0, 0.2)
add(crackle(1.6, 260), fr(30), 0.18, 0.3, 0.3)
drone = pad([33, 40], 3.2, 500) * np.hanning(int(3.2 * SR))
add(drone, 0, 0.6, 0, 0.3)
# ---- power down ----
add(whoosh(0.9, 3000, 160, 0.3), fr(68), 0.4, -0.2, 0.4)
add(sub(0.8, 60, 30, 4), fr(88), 0.45, 0, 0.1)
# ---- dial ----
for k in range(12):
    add(click(4200 + k * 120, 0.02, 0.0), fr(100 + k * 2.2), 0.11, 0.3, 0.1)
add(whoosh(0.8, 500, 2400, 0.6), fr(124), 0.3, 0, 0.4)
# ---- reps: heartbeat thump, harder as the set heats up ----
for i, f in enumerate(light):
    h = max(0, (i + 1 - 14) / 11)
    add(sub(0.35, 95 + 40 * h, 48, 7), fr(f), 0.42 + 0.4 * h, 0, 0.1)
    add(click(2400 + 1500 * h, 0.03, 0.2), fr(f), 0.14 + 0.16 * h, 0.15, 0.2)
riser = whoosh(fr(341 - 240), 120, 4200, 0.98)
add(riser, fr(240), 0.42, 0, 0.5)
tension = pad([45, 52, 57], fr(345 - 200), 1400) * np.linspace(0, 1, int(fr(345 - 200) * SR)) ** 2
add(tension, fr(200), 0.5, 0, 0.5)
add(sub(1.6, 130, 32, 2.2), fr(341), 1.0, 0, 0.3)               # rep 25: failure
add(crackle(1.2, 500), fr(341), 0.3, -0.2, 0.4)
add(hp(rng.standard_normal(int(1.2 * SR)), 4000) * np.exp(-tt(1.2) * 3) * 0.25, fr(341), 1, 0, 0.8)
# ---- dive into the light ----
add(whoosh(0.85, 250, 9000, 0.95), fr(347), 0.55, 0, 0.5)
add(hp(rng.standard_normal(int(1.0 * SR)), 3000) * np.exp(-tt(1.0) * 4) * 0.2, fr(372), 1, 0, 0.9)
# ---- compare ----
for f in cmpL: add(click(3600, 0.025, 0.3, 220), fr(f), 0.13, -0.5, 0.15)
for f in cmpH: add(sub(0.4, 110, 45, 6), fr(f), 0.5, 0.45, 0.1); add(click(1500, 0.04, 0.6, 100), fr(f), 0.2, 0.45, 0.1)
add(pad([45, 52, 57, 64], fr(456 - 384), 1200) * np.hanning(int(fr(456 - 384) * SR)), fr(384), 0.35, 0, 0.5)
add(sub(0.9, 100, 40, 3), fr(452), 0.6, 0, 0.2)                 # both reach failure
# ---- merge into the rule ----
add(whoosh(0.9, 400, 3000, 0.75), fr(456), 0.38, 0, 0.5)
add(sub(1.4, 80, 36, 2.4), fr(482), 0.8, 0, 0.2)
for i, m in enumerate([57, 64, 69]): add(bell(m + 12, 2.2), fr(484) + i * 0.07, 0.07, -0.3 + 0.3 * i, 1.0)
add(pad([45, 52, 57, 64], 4.0, 1600) * np.hanning(int(4.0 * SR)), fr(482), 0.35, 0, 0.6)
# ---- end ----
add(sub(1.4, 70, 33, 2.4), fr(540), 0.6, 0, 0.3)
add(bell(81, 2.4), fr(560), 0.08, 0.2, 1.0)

ir_n = int(2.4 * SR); ir_t = np.arange(ir_n) / SR
def ir(): return lp(rng.standard_normal(ir_n), 5000) * np.exp(-ir_t * 2.8) * (ir_t > 0.015)
L += signal.fftconvolve(WL, ir())[:N] * 0.03; R += signal.fftconvolve(WR, ir())[:N] * 0.03
mix = hp(np.stack([L, R]), 25).T
mix *= np.clip((DUR - 0.05 - t_all) / 0.5, 0, 1)[:, None]
mix = np.tanh(mix * 1.5) / 1.5
mix /= np.abs(mix).max() / 0.89
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print("ok")
