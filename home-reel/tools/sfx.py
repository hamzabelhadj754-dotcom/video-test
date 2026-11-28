"""Sound design for the home-workout reel. All synthesised; no music, no stock.
Shutter on every hard cut, air as the frame closes/opens, a film-gate tick per gallery
photo, and a warm room-tone bed. Output: public/sfx_pre.wav (master with loudnorm after).
Cut frames are read from the same timeline as the picture (src/Reel.tsx)."""
import re
import numpy as np
import soundfile as sf
from scipy import signal

SR, FPS = 48000, 30
src = open("src/Reel.tsx").read()
def arr(name):
    body = re.search(rf"const {name}: \[number, number\]\[\] = \[(.*?)\];", src, re.S).group(1)
    return [(int(a), int(b)) for a, b in re.findall(r"\[(\d+),\s*(\d+)\]", body)]
num = lambda name: int(re.search(rf"const {name} = (\d+);", src).group(1))
OPEN, CLOSE = arr("OPEN"), arr("CLOSE")
SLOT, G0 = num("SLOT"), num("G0")
SHRINK = (48, 64)
EXPAND = (G0 + SLOT * 5, G0 + SLOT * 5 + 16)
TOTAL = EXPAND[1] + sum(d for _, d in CLOSE)
N = int(SR * TOTAL / FPS)
rng = np.random.default_rng(3)

def t_(d): return np.arange(int(SR * d)) / SR
def noise(d): return rng.standard_normal(int(SR * d))
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f): return signal.sosfilt(signal.butter(2, f, "lowpass", fs=SR, output="sos"), x)
def norm(x): return x / (np.max(np.abs(x)) or 1)
def db(g): return 10 ** (g / 20)

def click(d, lo, hi, tau):
    t = t_(d)
    return bp(noise(d), lo, hi) * np.exp(-t / tau)

def shutter(var=0.0):
    """mirror slap + curtain: two mechanical clicks with a tiny body thump"""
    d = 0.11; x = np.zeros(int(SR * d))
    a = click(0.02, 1800 + 600 * var, 7000, 0.0016) + 0.6 * click(0.02, 400, 1600, 0.004)
    x[: len(a)] += a
    o = int(SR * (0.038 + 0.01 * var))
    b = 0.7 * click(0.03, 2200, 8000, 0.0013) + 0.4 * click(0.03, 300, 1200, 0.005)
    x[o:o + len(b)] += b
    t = t_(d)
    x += 0.35 * np.sin(2 * np.pi * (140 + 40 * var) * t) * np.exp(-t / 0.012)
    return norm(x)

def air(d, f0, f1, peak):
    t = t_(d); u = t / d
    env = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.4)
    x = np.zeros(len(t)); low = band = 0.0
    nz = noise(d)
    for i in range(len(t)):
        fc = f0 * (f1 / f0) ** u[i]
        f = 2 * np.sin(np.pi * fc / SR)
        high = nz[i] - low - band / 0.9
        band += f * high; low += f * band
        x[i] = band
    return norm(x * env)

def thud(d=0.5):
    t = t_(d)
    x = np.sin(2 * np.pi * np.cumsum(70 * (0.6) ** (t / d)) / SR) * np.exp(-t / 0.12) * np.minimum(1, t / 0.004)
    x += 0.4 * np.sin(2 * np.pi * np.cumsum(150 * (0.6) ** (t / d)) / SR) * np.exp(-t / 0.05)
    return norm(x)

def gate_tick():
    t = t_(0.06)
    x = click(0.06, 2500, 9000, 0.002) + 0.5 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.01)
    return norm(x)

bus = np.zeros((N, 2))
def put(sig, frame, gain, pan=0.0):
    i = int(frame / FPS * SR)
    j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * db(gain)
    bus[i:j, 0] += s * np.sqrt((1 - pan) / 2) * np.sqrt(2)
    bus[i:j, 1] += s * np.sqrt((1 + pan) / 2) * np.sqrt(2)

# warm room tone: brown noise, gently breathing
room = lp(np.cumsum(rng.standard_normal(N)) * 0.02, 220)
room = norm(room - np.mean(room)) * (0.85 + 0.15 * np.sin(2 * np.pi * np.arange(N) / SR / 5))
bus += np.stack([room, np.roll(room, 777)], 1) * db(-36)

# shutters on every hard cut (opening and closing flicker), accelerating = getting lighter
f = 0
for k, (_, d) in enumerate(OPEN):
    put(shutter(rng.random()), f, -9 - k * 0.5, pan=(rng.random() - 0.5) * 0.5); f += d
put(shutter(0.3), f, -10)  # photo 4 lands
f = EXPAND[1]
for k, (_, d) in enumerate(CLOSE):
    put(shutter(rng.random()), f, -12 + k * 0.4, pan=(rng.random() - 0.5) * 0.5); f += d

# the frame closes: air falls, soft thud as it settles
put(air(0.6, 3500, 300, 0.75), SHRINK[0] - 4, -14)
put(thud(), SHRINK[1] - 2, -10)
# gallery: a film-gate tick + low breath on each new photo
for i in range(1, 5):
    put(gate_tick(), G0 + SLOT * i + 1, -17, pan=0.15 * (-1) ** i)
    put(air(0.45, 250, 900, 0.3), G0 + SLOT * i, -26)
# the frame opens: air rises into the closing cuts
put(air(0.55, 300, 4000, 0.92), EXPAND[0] - 2, -13)

bus = np.tanh(bus * 1.1) / 1.1
sf.write("public/sfx_pre.wav", bus.astype(np.float32), SR, subtype="FLOAT")
print("frames", TOTAL, "peak dB", round(20 * np.log10(np.abs(bus).max()), 1))
