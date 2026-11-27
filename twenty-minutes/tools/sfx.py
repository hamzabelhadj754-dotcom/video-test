"""Bespoke sound design for TWENTY MINUTES. Every sound is synthesised here,
no libraries or stock packs. Events are locked to the same frames as the
picture (parsed from src/timeline.ts).

usage: python3 tools/sfx.py  -> public/sfx.wav, public/mix.wav (pre-master)
"""
import re
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
FPS = 30
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(20)

# ── timeline (single source of truth = src/timeline.ts) ─────────────────────
ts = open("src/timeline.ts").read()
def obj(name):
    body = re.search(rf"export const {name} = \{{(.*?)\}};", ts, re.S).group(1)
    return {k: int(v) for k, v in re.findall(r"(\w+):\s*(\d+)", body)}
B, Wd = obj("B"), obj("Wd")
fr = lambda f: f / FPS

# ── DSP helpers ─────────────────────────────────────────────────────────────
def t_(d): return np.arange(int(SR * d)) / SR
def env_exp(d, tau, attack=0.002):
    t = t_(d); a = np.clip(t / attack, 0, 1); return a * np.exp(-t / tau)
def noise(d): return rng.standard_normal(int(SR * d))
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)
def norm(x, peak=1.0): m = np.max(np.abs(x)) or 1; return x / m * peak
def db(g): return 10 ** (g / 20)

def svf(x, fc, q):
    """time-varying state-variable band-pass (fc, q arrays or scalars)"""
    fc = np.broadcast_to(fc, x.shape); q = np.broadcast_to(q, x.shape)
    low = band = 0.0; out = np.empty_like(x)
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        high = x[i] - low - band / q[i]
        band += f * high; low += f * band
        out[i] = band
    return out

def sweep_sine(d, f0, f1, curve="exp"):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == "exp" else np.linspace(f0, f1, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ── the sound palette ───────────────────────────────────────────────────────
def sub_hit(d=1.1, f0=92, f1=36):
    body = sweep_sine(d, f0, f1) * env_exp(d, 0.26, 0.003)
    body += 0.25 * sweep_sine(d, f0 * 2, f1 * 2) * env_exp(d, 0.09)
    body += 0.45 * sweep_sine(d, 165, 95) * env_exp(d, 0.055, 0.002)  # knock: translates on phone speakers
    click = hp(noise(0.012), 1800) * env_exp(0.012, 0.002, 0.0005) * 0.5
    x = np.zeros(int(SR * d)); x[: len(click)] += click; x += body
    return np.tanh(x * 1.6) / np.tanh(1.6)

def lock_click():
    """the clock 'locks': two-part mechanical latch with a metallic ring"""
    d = 0.16; x = np.zeros(int(SR * d))
    a = bp(noise(0.006), 2500, 7000) * env_exp(0.006, 0.0012, 0.0003)
    x[: len(a)] += a
    o = int(SR * 0.017); t = t_(d - 0.017)
    ring = sum(np.sin(2 * np.pi * f * t) * g for f, g in [(2930, 1), (4370, 0.6), (6120, 0.35)]) * np.exp(-t / 0.022)
    clack = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.018) * 0.9
    b = bp(noise(d - 0.017), 1200, 5000) * np.exp(-t / 0.004)
    x[o:] += 0.35 * ring + clack + 0.8 * b
    return norm(x)

def tick(pitch=1.0, d=0.03):
    t = t_(d)
    x = bp(noise(d), 2000 * pitch, 7500) * np.exp(-t / 0.0018)
    x += 0.5 * np.sin(2 * np.pi * 3400 * pitch * t) * np.exp(-t / 0.006)
    return norm(x) * db(7)

def blip(f=1650, d=0.07):
    t = t_(d)
    f_ = f * (1 - 0.12 * t / d)
    x = np.sin(2 * np.pi * np.cumsum(f_) / SR) * env_exp(d, 0.018, 0.0015)
    x += 0.25 * hp(noise(d), 4000) * np.exp(-t / 0.002)
    return norm(x)

def whoosh(d, f0, f1, peak=0.6, q=1.6, pan=(0.0, 0.0), shape=2.0):
    t = t_(d) / d
    env = np.where(t < peak, (t / peak) ** shape, ((1 - t) / (1 - peak)) ** 1.3)
    fc = f0 * (f1 / f0) ** t
    x = svf(noise(d), fc, np.full(len(t), q)) * env
    x = norm(x + 0.3 * lp(noise(d), 400) * env * 0.4)
    p = np.linspace(pan[0], pan[1], len(t))
    return np.stack([x * np.sqrt((1 - p) / 2), x * np.sqrt((1 + p) / 2)], 1)

def zip_(d=0.26, f0=700, f1=7500):
    t = t_(d) / d
    x = svf(noise(d), f0 * (f1 / f0) ** t, np.full(len(t), 9.0))
    x *= np.minimum(1, t / 0.08) * (1 - t) ** 0.6
    return norm(x)

def air_rise(d=0.7):
    t = t_(d) / d
    x = svf(noise(d), 250 * (14) ** t, np.full(len(t), 0.9)) * (t ** 1.8) * np.minimum(1, (1 - t) / 0.05)
    return norm(x)

def squeeze(d=0.42):
    t = t_(d)
    thump = np.sin(2 * np.pi * np.cumsum(70 * (1 - 0.3 * t / d)) / SR) * env_exp(d, 0.08, 0.002)
    fc = 3200 * (0.06) ** (t / d)
    hiss = svf(noise(d), fc, np.full(len(t), 2.5)) * env_exp(d, 0.12, 0.01)
    return norm(thump + 0.5 * norm(hiss))

def swirl(d=0.55):
    t = t_(d)
    w = whoosh(d, 300, 2400, peak=0.45, q=1.2)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(np.linspace(16, 4, len(t))) / SR)
    rot = np.sin(2 * np.pi * np.cumsum(np.linspace(6, 2, len(t))) / SR)
    m = (w[:, 0] + w[:, 1]) * am
    return np.stack([m * np.sqrt((1 - rot) / 2), m * np.sqrt((1 + rot) / 2)], 1)

def pop(d=0.09):
    t = t_(d)
    x = np.sin(2 * np.pi * np.cumsum(620 * (0.33) ** (t / d)) / SR) * env_exp(d, 0.025, 0.001)
    return norm(x + 0.3 * hp(noise(d), 3000) * np.exp(-t / 0.0015))

def reverse_swell(d=0.7):
    x = whoosh(d, 200, 5000, peak=0.97, q=1.1, shape=3.0)
    return x

# ── bus ─────────────────────────────────────────────────────────────────────
bus = np.zeros((N, 2))
def put(sig, sec, gain_db=0.0, pan=0.0):
    i = int(sec * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt((1 - pan) / 2) * np.sqrt(2), sig * np.sqrt((1 + pan) / 2) * np.sqrt(2)], 1)
    j = min(N, i + len(sig))
    if j > i: bus[i:j] += sig[: j - i] * db(gain_db)

# Room tone: a barely-there warm air bed so silence is never digital.
room = lp(np.cumsum(rng.standard_normal(N)) * 0.02, 180)
room = norm(room - np.mean(room)) * db(-50)
bus += np.stack([room, np.roll(room, 911)], 1)

# 1  HOOK: "twenty" → the clock locks
put(sub_hit(), fr(Wd["twenty"]) - 0.005, -3)
put(lock_click(), fr(Wd["twenty"]), -9)
put(blip(2100, 0.05), fr(Wd["enough"] + 14), -20)        # the full stop lands

# 2  clock face: ring winds on (ticks rising in pitch), rules click in
put(whoosh(1.2, 180, 1400, peak=0.8, q=0.9), fr(62), -21, )
for i in range(20):
    put(tick(0.85 + i * 0.018), fr(70 + i * 1.3 + 4), -27 + i * 0.25, pan=np.sin(i / 20 * 2 * np.pi) * 0.5)
for w_ in ["five", "forty", "off", "four"]:
    put(blip(1500 if w_ != "off" else 1150), fr(Wd[w_]), -17)
for k in range(15):
    put(tick(1.1), fr(Wd["four"] + 2 + k * 1.6), -28, pan=np.sin((k + 5) / 20 * 2 * np.pi) * 0.5)

# T1 zoom through slice 1 → squat lands
put(reverse_swell(0.75), fr(196), -13)
put(sub_hit(0.9, 80, 40), fr(217), -9)

# 3  SQUAT cues
put(tick(0.7), fr(Wd["hips"] - 4), -18, pan=-0.3)
put(tick(0.8), fr(Wd["chest"] - 4), -18, pan=0.3)
# T2 whip down
put(whoosh(0.5, 2600, 260, peak=0.42, q=1.4), fr(284), -10)
put(sub_hit(0.6, 70, 38), fr(297), -15)

# 4  PUSH-UP: the line draws, knees cue, the line runs out and splits the frame
put(zip_(0.42, 600, 5200), fr(Wd["straight"]), -17, pan=0.1)
put(blip(1200), fr(Wd["knees"] + 6), -21, pan=-0.2)
put(zip_(0.38, 900, 9000), fr(106 + B["push"]), -15)
put(whoosh(0.55, 500, 3800, peak=0.35, q=1.3, pan=(-0.4, 0.4)), fr(413), -11)
put(sub_hit(0.7, 75, 38), fr(423), -15)

# 5  LUNGE: both 90° angles lock with precise ticks
put(tick(1.25), fr(Wd["both"] + 20), -14, pan=0.25)
put(tick(1.15), fr(Wd["both"] + 24), -15, pan=-0.25)
put(lock_click(), fr(Wd["ninety"]), -20)
# T4 through the numeral 4
put(reverse_swell(0.7), fr(498), -12)
put(sub_hit(0.8, 85, 40), fr(519), -11)

# 6  GLUTE BRIDGE: hips rise on air, the squeeze compresses, then a held breath
put(air_rise(0.75), fr(B["bridge"] + 4), -18)
put(squeeze(), fr(Wd["squeeze"]), -11)
# T5 spin
put(swirl(0.6), fr(582), -11)

# 7  MOUNTAIN CLIMBERS: a tick on every knee drive, tempo doubles on "Fast."
def omega(f):
    if f < 4: return 0
    if f < 66: return 1 / 22
    if f < 74: return 1 / 22 + (1 / 10 - 1 / 22) * (f - 66) / 8
    return 1 / 10
ph, last, step = 0.0, 0, 0.05
f = 0.0
while f < B["rounds"] - B["climb"] - 6:
    ph += omega(f) * step * 2 * np.pi
    n = int(ph // np.pi)
    if n > last and f > 8:
        last = n
        put(tick(0.62 if n % 2 else 0.7, 0.04), fr(B["climb"] + f), -19 + (3 if f > 72 else 0), pan=0.35 if n % 2 else -0.35)
    last = max(last, n)
    f += step
put(blip(1800, 0.06), fr(Wd["fast"]), -16)
# T6 collapse into the clock face
put(whoosh(0.6, 3500, 300, peak=0.85, q=1.5), fr(670), -13)
put(lock_click(), fr(689), -12)

# 8  ROUNDS: fast-forward, a tick per minute, the last round hits
def bez(x1, y1, x2, y2):
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            m = (lo + hi) / 2
            bx = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m * m * x2 + m ** 3
            lo, hi = (m, hi) if bx < x else (lo, m)
        m = (lo + hi) / 2
        return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m * m * y2 + m ** 3
    return f
ease = bez(0.6, 0, 0.3, 1)
keys = [(4, 0), (36, 0.25), (56, 0.75), (86, 1)]
def elapsed(lf):
    if lf <= keys[0][0]: return 0
    for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
        if lf <= f1: return v0 + (v1 - v0) * ease((lf - f0) / (f1 - f0))
    return 1
prev = 0
for k in range(0, 900):
    lf = k / 10
    m = int(elapsed(lf) * 20 + 1e-6)
    if m > prev:
        prev = m
        put(tick(0.9 + m * 0.03), fr(B["rounds"] + lf), -21 + (4 if m > 15 else 0), pan=np.sin(m / 20 * 2 * np.pi) * 0.5)
put(sub_hit(1.0, 88, 38), fr(B["rounds"] + 56), -9)
put(lock_click(), fr(B["rounds"] + 86), -15)

# T7 ring shrinks into the full stop
put(whoosh(0.55, 2800, 400, peak=0.8, q=1.6), fr(768), -13)
put(pop(), fr(787), -14)

# 9  END: the clock rolls back in, locks on "now", one tick, silence → loop
put(whoosh(0.35, 400, 2600, peak=0.6, q=1.4), fr(Wd["your"] - 6), -22)
for i in range(5):
    put(tick(0.95 + 0.05 * i), fr(Wd["twenty2"] - 3 + i * 2.2 + 6), -20)
put(sub_hit(), fr(Wd["now"]) - 0.005, -4)
put(lock_click(), fr(Wd["now"]), -9)
put(tick(0.8, 0.04), fr(884), -22)

# ── duck under the voice, then a gentle bus limiter ────────────────────────
vo, vsr = sf.read("public/vo_48k.wav")
if vo.ndim > 1: vo = vo.mean(1)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
envv = np.convolve(np.abs(vo), np.ones(int(SR * 0.03)) / int(SR * 0.03), "same")
envv = lp(envv, 8, 1)
duck = db(-4.5 * np.clip(envv / (np.percentile(envv, 95) + 1e-9), 0, 1))
bus *= duck[:, None] * db(-4)
bus = np.tanh(bus * 1.15) / 1.15
sf.write("public/sfx.wav", bus.astype(np.float32), SR, subtype="FLOAT")
mix = bus + np.stack([vo, vo], 1) * db(-1.0)
sf.write("public/mix_pre.wav", mix.astype(np.float32), SR, subtype="FLOAT")
print("peak sfx", 20 * np.log10(np.max(np.abs(bus))), "peak mix", 20 * np.log10(np.max(np.abs(mix))))
