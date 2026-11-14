"""Original sound design and music for "Someday". Every sound is synthesized here, so nothing is licensed.
Frame numbers match the film timeline (30fps)."""
import json, subprocess, sys
import numpy as np
from scipy import signal

SR, FPS, DUR = 48000, 30, 22.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)       # dry bus
WL = np.zeros(N); WR = np.zeros(N)     # reverb send

def fr(f): return f / FPS
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def add(x, t, gain=1.0, pan=0.0, wet=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * l; R[i:i + len(x)] += x * r
    WL[i:i + len(x)] += x * l * wet; WR[i:i + len(x)] += x * r * wet

def tt(d): return np.arange(int(d * SR)) / SR
def band(x, lo, hi):
    return signal.sosfilt(signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, fc): return signal.sosfilt(signal.butter(2, fc, btype="low", fs=SR, output="sos"), x)
def hp(x, fc): return signal.sosfilt(signal.butter(2, fc, btype="high", fs=SR, output="sos"), x)
def fade(x, a=0.005, r=0.02):
    n = len(x); e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na); e[n - nr:] = np.linspace(1, 0, nr)
    return x * e

def keys(m, d=2.5, bright=1.0):
    """Soft felt-piano style note."""
    t = tt(d); f = hz(m); x = np.zeros_like(t)
    for k, a in enumerate([1, 0.42, 0.2, 0.09, 0.04], 1):
        x += a * bright ** (k - 1) * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (1.6 + 0.9 * k))
    return fade(x, 0.004, 0.1)

def bell(m, d=1.6):
    t = tt(d); f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
    return fade(x, 0.002, 0.05)

def click(low=180, tone=2600, d=0.05, body=0.6):
    t = tt(d)
    x = band(rng.standard_normal(len(t)), tone * 0.7, tone * 1.5) * np.exp(-t * 160)
    x += body * np.sin(2 * np.pi * low * t) * np.exp(-t * 70)
    return fade(x, 0.0005, 0.01)

def whoosh(d, f0, f1, peak=0.7):
    """Airy noise sweep, centre frequency f0 -> f1, loudest at `peak` of its length."""
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n); B = 2048
    win = np.hanning(B)
    for s in range(0, n - B, B // 4):
        c = f0 * (f1 / f0) ** (s / n)
        seg = signal.sosfilt(signal.butter(2, [c * 0.6, min(c * 1.7, SR / 2 - 100)], btype="band", fs=SR, output="sos"), x[s:s + B])
        out[s:s + B] += seg * win
    p = np.arange(n) / n
    env = np.where(p < peak, (p / peak) ** 2.2, ((1 - p) / (1 - peak)) ** 1.6)
    return out * env * 0.5

def sub(d=1.0, f0=62, f1=38):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 9)) / SR
    return fade(np.sin(ph) * np.exp(-t * 3.2), 0.002, 0.1)

def pad(notes, d, cutoff=1400):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        for det in (-0.07, 0.06):
            f = hz(m + det)
            x += sum(np.sin(2 * np.pi * f * k * t + k) / k for k in range(1, 7))
    return lp(x, cutoff) / len(notes) * 0.4

def typed_frames():
    s = "Make it feel like her."; f = 166; out = []
    for k, ch in enumerate(s):
        out.append((f, ch)); f += 2 + (1 if ch == " " else 0) + (1 if k in (6, 14) else 0)
    return out

# ---------- 1. paper world (0 to 150) ----------
room = lp(rng.standard_normal(N), 420) * 0.012
env = np.ones(N); t_all = np.arange(N) / SR
env *= np.clip(1 - (t_all - fr(120)) / 1.0, 0, 1) + np.clip((t_all - fr(450)) / 0.3, 0, 1) * np.clip(1 - (t_all - fr(522)) / 0.6, 0, 1)
add(room * env, 0)
# the "someday" motif: an unresolved, lonely suspended chord
for i, m in enumerate([57, 62, 64]):
    add(keys(m, 4.0, 0.8), fr(0) + i * 0.06, 0.27, pan=-0.2 + 0.2 * i, wet=0.9)
add(keys(69, 3.0, 0.7), fr(34), 0.15, 0.2, wet=0.9)
add(click(140, 1800, 0.06), fr(92), 0.42, 0.1, wet=0.15)                 # mouse down
add(band(rng.standard_normal(int(0.6 * SR)), 900, 2600) * np.hanning(int(0.6 * SR)) * 0.07, fr(94), 1, 0.1)  # drag
add(click(200, 3200, 0.04), fr(114), 0.32, 0.25, wet=0.15)               # mouse up
add(whoosh(1.15, 220, 2600, 0.8), fr(117), 0.55, 0, wet=0.35)            # the line lifts
add(sub(0.7, 70, 46), fr(152), 0.35, 0, wet=0.1)                         # lands in the prompt
add(click(110, 900, 0.09, 1.0), fr(152), 0.2, 0, wet=0.3)
add(whoosh(0.9, 200, 1400, 0.5), fr(150), 0.22, 0, wet=0.5)                # the highlight grows into the box

# ---------- 2. prompt world (150 to 240) ----------
drone = pad([38, 45], 3.4, 380) * np.hanning(int(3.4 * SR)) * 0.5
add(drone, fr(146), 0.5, 0, wet=0.4)
for f, ch in typed_frames():
    sp = ch == " "
    add(click(120 if sp else 190 + rng.uniform(-25, 25), 1500 if sp else 2700 + rng.uniform(-500, 500), 0.045, 0.9 if sp else 0.5),
        fr(f), (0.42 if sp else 0.34) * rng.uniform(0.8, 1.1), rng.uniform(-0.25, 0.25), wet=0.12)
add(whoosh(1.0, 300, 5200, 0.97), fr(210), 0.42, 0, wet=0.4)             # riser into send
add(whoosh(1.15, 1800, 380, 0.4), fr(240), 0.34, -0.3, wet=0.5)           # camera pulls back into the editor
add(click(150, 2400, 0.05), fr(230), 0.3, 0.35, wet=0.2)                 # send click

# ---------- 3. the build: music at 120bpm (240 to 450) ----------
BEAT = 0.5; T0 = fr(240)
add(sub(1.3, 90, 41), T0, 0.95, 0, wet=0.12)                             # the hit on the cut
add(hp(rng.standard_normal(int(1.2 * SR)), 5000) * np.exp(-tt(1.2) * 4) * 0.12, T0, 1, 0, wet=0.6)
CH = [[50, 57, 62, 66, 69], [47, 54, 62, 66, 71], [43, 55, 62, 66, 71], [45, 57, 61, 64, 69],
      [50, 57, 62, 66, 69], [47, 54, 62, 66, 71], [43, 55, 62, 67, 71]]
duck = np.ones(N)
for b in range(14):
    tb = T0 + b * BEAT
    if b > 0:
        add(sub(0.32, 110, 48), tb, 0.5, 0)                               # soft kick
    i = int(tb * SR); n = int(0.28 * SR)
    duck[i:i + n] = np.minimum(duck[i:i + n], 0.45 + 0.55 * np.linspace(0, 1, n) ** 0.7)
    add(hp(rng.standard_normal(int(0.05 * SR)), 7500) * np.exp(-tt(0.05) * 90), tb + BEAT / 2, 0.07, 0.3)  # hat
music = np.zeros(N)
for c, notes in enumerate(CH):
    tc = T0 + c * 2 * BEAT; d = 2 * BEAT + 0.25
    seg = fade(pad(notes[1:], d, 1500 + 250 * c), 0.05, 0.25)
    i = int(tc * SR); music[i:i + len(seg)] += seg * 0.34
    bass = fade(np.sin(2 * np.pi * hz(notes[0] - 12) * tt(d)) + 0.3 * np.sin(2 * np.pi * hz(notes[0]) * tt(d)), 0.01, 0.2)
    music[i:i + len(bass)] += bass * 0.3
    for k in range(4):                                                     # pluck arpeggio, 8th notes
        m = notes[1:][(k * 2 + c) % 4] + 12
        add(keys(m, 0.9, 1.25), tc + k * BEAT / 2, 0.085, pan=0.5 * np.sin(k + c), wet=0.7)
        add(keys(m, 0.9, 1.0), tc + k * BEAT / 2 + 0.375, 0.03, pan=-0.5 * np.sin(k + c), wet=0.7)  # echo
music *= duck * 0.78
L += music; R += music; WL += music * 0.25; WR += music * 0.25
for f0, f1 in ((297, 304), (342, 349), (387, 396)):                       # snap zooms
    add(whoosh(0.42, 500, 3800, 0.6), fr(f0 - 3), 0.36, 0, wet=0.3)
for f, m in ((318, 81), (368, 83), (412, 86)):                            # the three clicks rise in pitch
    add(click(170, 2500, 0.045), fr(f), 0.26, 0.15, wet=0.15)
    add(bell(m, 0.7), fr(f) + 0.02, 0.07, 0.2, wet=0.8)
for i, m in enumerate((90, 93, 98)):                                      # "You're booked"
    add(bell(m, 1.5), fr(416) + i * 0.085, 0.11, 0.3, wet=0.9)
add(whoosh(0.75, 260, 7000, 0.96), fr(430), 0.62, 0, wet=0.5)             # scale-through into the card

# ---------- 4. today (450 to 540) ----------
add(whoosh(0.7, 5200, 300, 0.12), fr(450), 0.4, 0, wet=0.6)              # pulling back out of the check
add(hp(rng.standard_normal(int(0.9 * SR)), 3500) * np.exp(-tt(0.9) * 5) * 0.1, fr(450), 1, 0, wet=0.9)  # air after the cut
n = int(fr(24) * SR); stroke = band(rng.standard_normal(n), 1400, 5200) * np.hanning(n) ** 0.6
stroke *= 0.75 + 0.25 * np.sin(2 * np.pi * 9 * tt(fr(24)))
add(stroke, fr(461), 0.16, -0.15, wet=0.2)                               # the marker stroke
add(whoosh(0.7, 350, 1800, 0.55), fr(492), 0.2, 0, wet=0.4)               # the word swap
for i, m in enumerate([50, 57, 62, 66, 69]):                              # "Today": the chord resolves
    add(keys(m, 4.5, 0.95), fr(505) + i * 0.035, 0.26, pan=-0.3 + 0.15 * i, wet=0.9)
add(bell(93, 1.2), fr(470), 0.09, -0.3, wet=0.9)                          # the tick lands
add(sub(0.5, 85, 50), fr(470), 0.3, -0.2, wet=0.2)
add(whoosh(0.72, 180, 4200, 0.97), fr(519), 0.6, 0, wet=0.5)              # the glow floods

# ---------- 5. end card (540 to 660) ----------
add(sub(1.6, 80, 37), fr(540), 0.9, 0, wet=0.15)
fin = fade(pad([50, 57, 62, 66, 69, 73, 76], 3.9, 2400), 0.02, 2.6)
add(fin, fr(540), 0.5, 0, wet=0.7)
for f in (556, 563):                                                      # a heartbeat for the heart mark
    add(sub(0.3, 95, 52), fr(f), 0.42 if f == 556 else 0.32, 0, wet=0.2)
for i, (f, m) in enumerate(((566, 81), (576, 86), (586, 90))):
    add(bell(m, 2.2), fr(f), 0.07, -0.3 + 0.3 * i, wet=1.0)

# ---------- reverb, master ----------
ir_n = int(2.2 * SR); ir_t = np.arange(ir_n) / SR
def ir(): return lp(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t * 3.2) * (ir_t > 0.012)
L += signal.fftconvolve(WL, ir())[:N] * 0.035
R += signal.fftconvolve(WR, ir())[:N] * 0.035
mix = np.stack([L, R], 1)
mix = hp(mix.T, 28).T
end = np.clip((DUR - 0.05 - t_all) / 0.6, 0, 1)[:, None]
mix *= end
mix = np.tanh(mix * 1.4) / 1.4
mix /= max(1e-9, np.abs(mix).max()) / 0.89
out = sys.argv[1] if len(sys.argv) > 1 else "public/audio/raw.wav"
from scipy.io import wavfile
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
open("tools/beats.txt", "w").write("\n".join(f"{T0 + b * BEAT:.4f}" for b in range(15)) + f"\n{fr(540):.4f}\n")
print("wrote", out)
