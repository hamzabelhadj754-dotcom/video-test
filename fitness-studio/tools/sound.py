"""Sound design for the studio reel (all synthesized). Frames follow src/Film.tsx at 30fps."""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR, FPS, DUR = 48000, 30, 20.0
N = int(SR * DUR)
rng = np.random.default_rng(5)
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
    if i >= N: return
    x = x[: N - i] * g
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * l; R[i:i + len(x)] += x * r; WL[i:i + len(x)] += x * l * wet; WR[i:i + len(x)] += x * r * wet
def pluck(m, d=0.9, bright=1.0):
    t = tt(d); f = hz(m); x = np.zeros_like(t)
    for k, a in enumerate([1, 0.5, 0.25, 0.12], 1): x += a * bright ** (k - 1) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (4 + 2.5 * k))
    return fade(x, 0.002, 0.05)
def pop(f0=900, d=0.09):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (1 + 1.5 * np.exp(-t * 60))) / SR
    return fade(np.sin(ph) * np.exp(-t * 38), 0.001, 0.01)
def tick(tone=3500, d=0.025):
    t = tt(d); return fade(band(rng.standard_normal(len(t)), tone * 0.7, tone * 1.4) * np.exp(-t * 200), 0.0005, 0.005)
def sub(d=0.8, f0=90, f1=42, k=3.0):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 12)) / SR
    return fade(np.sin(ph) * np.exp(-t * k), 0.001, 0.05)
def whoosh(d, f0, f1, peak=0.7):
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); B = 2048; win = np.hanning(B)
    for s in range(0, n - B, B // 4):
        c = f0 * (f1 / f0) ** (s / n)
        out[s:s + B] += signal.sosfilt(signal.butter(2, [c * 0.6, min(c * 1.7, SR / 2 - 100)], btype="band", fs=SR, output="sos"), x[s:s + B]) * win
    p = np.arange(n) / n
    return out * np.where(p < peak, (p / peak) ** 2.2, ((1 - p) / (1 - peak)) ** 1.6) * 0.5
def pad(notes, d, cut=1600):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        for det in (-0.05, 0.05): x += sum(np.sin(2 * np.pi * hz(m + det) * k * t + k) / k for k in range(1, 5))
    return lp(x, cut) / len(notes) * 0.35

# light, airy bed at 100 bpm: plucked arpeggio over a soft pad (silent during the dark beat)
BEAT = 0.6
prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]
t = 0.0; k = 0
while t < DUR - 0.8:
    fq = t * FPS
    if not (300 <= fq < 352):
        ch = prog[int(t / (BEAT * 4)) % 4]
        m = ch[k % 4] + (12 if k % 8 >= 4 else 0)
        add(pluck(m, 0.8, 0.9), t, 0.07, 0.4 * np.sin(k), 0.6)
    t += BEAT / 2; k += 1
for bar in range(int(DUR / (BEAT * 4)) + 1):
    t0 = bar * BEAT * 4
    if t0 * FPS < 296 or t0 * FPS >= 350:
        add(fade(pad(prog[bar % 4], BEAT * 4 + 0.3), 0.2, 0.4), t0, 0.22, 0, 0.5)

# hook
add(whoosh(0.7, 300, 2600, 0.8), fr(-2) if False else 0, 0.3, -0.5, 0.3)
add(whoosh(0.7, 280, 2400, 0.8), fr(4), 0.3, 0.5, 0.3)
add(pop(520), fr(22), 0.25, -0.4, 0.2); add(pop(380), fr(27), 0.25, 0.4, 0.2)
add(sub(0.5, 110, 55, 6), fr(37), 0.45, 0, 0.1)
add(pluck(76, 1.2, 1.2), fr(38), 0.12, 0, 0.8)
add(whoosh(0.9, 400, 3800, 0.6), fr(80), 0.42, 0, 0.4)        # accent line sweep
add(whoosh(0.5, 3000, 600, 0.3), fr(136), 0.35, -0.6, 0.4)     # text slides away
# light set
for i, at in enumerate([182, 236, 264]): add(pop(700 + i * 120), fr(at), 0.3, 0.1, 0.3)
reps = [178 + (i - 1) * 3.9 if i <= 22 else 264 + (i - 23) * 10 for i in range(1, 26)]
for i, r in enumerate(reps): add(tick(2600 + i * 60), fr(r), 0.12 + (0.12 if i >= 22 else 0), 0.25, 0.1)
for r in reps[22:]: add(sub(0.3, 100, 55, 8), fr(r), 0.3, 0, 0.1)
# dark beat
add(whoosh(0.6, 2000, 200, 0.4), fr(294), 0.35, 0, 0.5)
add(sub(1.6, 70, 34, 2.0), fr(318), 0.8, 0, 0.4)
add(pad([45, 52], 1.8, 600) * np.hanning(int(1.8 * SR)), fr(300), 0.4, 0, 0.6)
add(whoosh(0.6, 300, 3000, 0.85), fr(338), 0.35, 0, 0.5)
# compare
add(whoosh(0.5, 300, 1800, 0.6), fr(352), 0.25, -0.4, 0.3); add(whoosh(0.5, 300, 1800, 0.6), fr(356), 0.25, 0.4, 0.3)
for at, pn in [(378, -0.5), (381, 0.5), (384, -0.5), (387, 0.5)]: add(pop(820), fr(at), 0.22, pn, 0.2)
add(whoosh(0.6, 500, 2500, 0.8), fr(410), 0.3, 0, 0.4)
add(pop(620), fr(430), 0.35, 0, 0.3); add(pluck(79, 1.4, 1.1), fr(431), 0.12, 0, 0.9)
# rule
for i in range(4): add(pop(700 + i * 110, 0.08), fr(494 + i * 5), 0.25, -0.3 + 0.2 * i, 0.3)
# end
add(sub(1.0, 90, 45, 3), fr(556), 0.4, 0, 0.3)
for i, m in enumerate([72, 76, 79, 84]): add(pluck(m, 1.6, 1.1), fr(560) + i * 0.08, 0.08, -0.3 + 0.2 * i, 0.9)

ir_n = int(2.0 * SR); ir_t = np.arange(ir_n) / SR
def ir(): return lp(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t * 3.2) * (ir_t > 0.012)
L += signal.fftconvolve(WL, ir())[:N] * 0.035; R += signal.fftconvolve(WR, ir())[:N] * 0.035
mix = hp(np.stack([L, R]), 30).T
t_all = np.arange(N) / SR
mix *= np.clip((DUR - 0.05 - t_all) / 0.6, 0, 1)[:, None]
mix = np.tanh(mix * 1.4) / 1.4
mix /= np.abs(mix).max() / 0.89
wavfile.write(sys.argv[1], SR, (mix * 32767).astype(np.int16))
print("ok")
