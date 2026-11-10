"""Sound effects for the overload v2 test (all synthesised, seeded). No music: the client adds their own.
Outputs: assets/audio/{music,sfx,mix_pre}.wav and env.json. Then run tools/master.sh for -14 LUFS / <= -1 dBTP."""
import json, os
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda p: os.path.join(ROOT, "assets/audio", p)
SR, DUR = 48000, 31.5
N = int(SR * DUR); BPM = 120; B = 60 / BPM
rng = np.random.default_rng(120)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    if lo: g *= 1 - 1 / (1 + (f / lo) ** 4)
    return np.fft.irfft(X * g, len(x))
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def noise(d): return rng.normal(0, 1, int(d * SR))
def add(buf, t, s, g=1.0, pan=0.0):
    i0 = int(t * SR)
    if i0 >= N: return
    i1 = min(N, i0 + len(s)); s = s[: i1 - i0] * g
    buf[i0:i1, 0] += s * np.cos((pan + 1) * np.pi / 4) * 1.414; buf[i0:i1, 1] += s * np.sin((pan + 1) * np.pi / 4) * 1.414
music = np.zeros((N, 2)); drums = np.zeros((N, 2)); sfx = np.zeros((N, 2))
beat = lambda n: n * B

# ---------------- instruments ----------------
def kick(g=1.0):
    d = 0.45; n = int(d * SR); t = np.arange(n) / SR; f = 45 + 95 * np.exp(-t / 0.035)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) + fft_filter(noise(d), 2000, 8000) * env(n, 0.001, 0.004) * 0.4) * g
def clap(g=1.0):
    d = 0.35; n = int(d * SR); x = fft_filter(noise(d), 900, 4000); e = np.zeros(n)
    for o in (0, 0.012, 0.024): i = int(o * SR); e[i:] += env(n - i, 0.001, 0.02 if o < 0.02 else 0.12)
    return x * e * 0.6 * g
def hat(g=1.0, open_=False):
    d = 0.25 if open_ else 0.06; n = int(d * SR); return fft_filter(noise(d), 7000, None) * env(n, 0.001, 0.07 if open_ else 0.015) * 0.35 * g
def pluck(m, g=1.0, d=0.35):
    n = int(d * SR); t = np.arange(n) / SR; f = midi(m)
    s = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in ((1, 1), (2, .4), (3, .18), (4, .08)))
    return s * env(n, 0.002, 0.09) * g
def pad_chord(notes, d, bright=2.2):
    n = int(d * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in notes:
        for det in (-0.08, 0.0, 0.07):
            f = midi(m) * 2 ** (det / 12); ph = rng.uniform(0, 6.28)
            for k in range(1, 8):
                if f * k > 7000: break
                out += np.sin(2 * np.pi * f * k * t + ph * k) / k * np.exp(-k / bright)
    a = int(0.4 * SR); e = np.ones(n); e[:a] = np.linspace(0, 1, a); e[-a:] = np.linspace(1, 0, a)
    return out * e / (len(notes) * 3)
def bass(m, d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR; f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return s * env(n, 0.005, d * 0.7) * g
def boom(g=1.0):
    d = 2.6; n = int(d * SR); t = np.arange(n) / SR; f = 32 + 40 * np.exp(-t / 0.3)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.75) + fft_filter(noise(d), None, 200) * env(n, 0.002, 0.07) * 0.7) * g
def ring(g=1.0, base=176.0):   # metallic plate ring: inharmonic partials
    d = 2.2; n = int(d * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * base * k * t) * np.exp(-t * dk) for k, a, dk in ((1, 1, 1.8), (2.76, .7, 2.6), (5.40, .45, 3.8), (8.93, .25, 5.0))) * env(n, 0.001, 9) * 0.35 * g
def rev_swell(d=0.55, g=1.0):
    n = int(d * SR); x = fft_filter(noise(d), 300, 6000) * np.linspace(0, 1, n) ** 2.5; return x * g
def riser(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR; x = noise(d); k = t / d
    lo = fft_filter(x, 300, 1500); hi = fft_filter(x, 2000, 9000)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1600 * k ** 2) / SR) * 0.25
    return (lo * (1 - k) + hi * k + tone) * k ** 2 * g
def whoosh(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d; x = noise(d)
    e = np.where(k < 0.55, (k / 0.55) ** 2, np.exp(-(k - 0.55) / 0.12))
    return (fft_filter(x, 250, 1800) * (1 - k) + fft_filter(x, 1500, 7000) * k * 0.7) * e * g
def tick(g=1.0, f=2400):
    d = 0.07; n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * env(n, 0.0008, 0.012) + fft_filter(noise(d), 3000, None) * env(n, 0.0005, 0.004)) * g
def glass_lock(g=1.0):
    d = 0.9; n = int(d * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dk) for f, a, dk in ((2350, 1, 7), (3520, .6, 9), (5280, .35, 12)))
    out = s * 0.3; c = tick(1, 1800); out[: len(c)] += c; return out * g
def chirp(g=1.0):
    d = 0.08; n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(1800 + 3000 * t / d) / SR) * env(n, 0.002, 0.03) * g
def heart(g=1.0):
    d = 0.3; n = int(d * SR); t = np.arange(n) / SR; f = 38 + 30 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09) * g
def shimmer(d, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR; out = np.zeros(n); r = np.random.default_rng(7)
    for _ in range(int(d * 18)):
        i = int(r.uniform(0, d - 0.1) * SR); f = r.choice([1318.5, 1567.98, 1975.5, 2637.0]); m = int(0.25 * SR)
        seg = np.sin(2 * np.pi * f * np.arange(m) / SR) * env(m, 0.003, 0.06); out[i:i + m] += seg[: n - i] * r.uniform(0.3, 1)
    return out * g

def pop(g=1.0, f0=520):
    d = 0.12; n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 + 1.6 * np.exp(-t / 0.014))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.035) + fft_filter(noise(d), 2500, None) * env(n, 0.0005, 0.003) * 0.3) * g
def unpop(g=1.0, f0=900):   # reverse pop: pitch falls as the object collapses
    d = 0.16; n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1.2 - 0.7 * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.06) * g
def crack(g=1.0):
    d = 0.4; n = int(d * SR); out = np.zeros(n); r = np.random.default_rng(3)
    for k in range(9):
        i = int(r.uniform(0, 0.09) * SR); m = int(0.03 * SR); out[i:i + m] += fft_filter(r.normal(0, 1, m), 1800, 9000) * env(m, 0.0003, 0.004) * r.uniform(.4, 1)
    th = int(0.3 * SR); t = np.arange(th) / SR; out[:th] += np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / .02)) / SR) * np.exp(-t / .08) * .8
    return out * g
def hit(t, g=1.0):          # bass hit under an accent word
    add(sfx, t, kick(0.8 * g)); add(sfx, t, boom(0.35 * g)); add(sfx, t, fft_filter(noise(0.18), 3000, None) * env(int(0.18 * SR), 0.001, 0.03) * 0.25 * g)

def soft_hit(t, g=1.0):
    add(sfx, t, kick(0.55 * g)); add(sfx, t, boom(0.22 * g)); add(sfx, t, fft_filter(noise(0.12), 3000, None) * env(int(0.12 * SR), 0.001, 0.02) * 0.18 * g)
add(sfx, 0.0, rev_swell(0.25, 0.15)); add(sfx, 0.05, boom(0.35))
add(sfx, 0.15, pop(0.45, 420)); add(sfx, 0.2, shimmer(0.8, 0.07))
for t in (0.55, 0.78): add(sfx, t, tick(0.16, 2100))
add(sfx, 1.1, pop(0.35, 700)); soft_hit(1.4, 0.9)
add(sfx, 2.15, riser(0.47, 0.3)); add(sfx, 2.4, whoosh(0.3, 0.4)); add(sfx, 2.62, boom(0.35))
add(sfx, 2.6, whoosh(0.5, 0.35), pan=0.4)
add(sfx, 2.95, tick(0.16, 1900)); soft_hit(3.25)
add(sfx, 4.45, whoosh(0.4, 0.45), pan=0.5); add(sfx, 4.92, kick(0.7)); add(sfx, 4.92, boom(0.3))
for t in (5.05, 5.28): add(sfx, t, tick(0.16, 2200))
soft_hit(5.62, 0.9); soft_hit(5.98, 1.1)

add(sfx, 7.15, pop(0.5, 520)); add(sfx, 7.3, whoosh(0.3, 0.18))
for t in (7.35, 7.55): add(sfx, t, tick(0.16, 2000))
soft_hit(7.9)
for i, t in enumerate((8.0, 8.18, 8.36, 8.54)): add(sfx, t, tick(0.2, 1500 + 150 * i))
add(sfx, 8.62, chirp(0.12)); add(sfx, 8.62, fft_filter(noise(0.2), 100, 600) * env(int(0.2 * SR), 0.002, 0.06) * 0.25)
add(sfx, 8.95, whoosh(0.35, 0.3)); add(sfx, 9.0, riser(0.4, 0.35)); add(sfx, 9.4, boom(0.6)); add(sfx, 9.4, kick(0.7))
add(sfx, 9.45, whoosh(0.6, 0.3))
add(sfx, 9.85, rev_swell(0.5, 0.15)); add(sfx, 10.2, shimmer(0.9, 0.08))
soft_hit(10.55, 1.2); add(sfx, 10.55, ring(0.18, 176))
add(sfx, 11.15, tick(0.16, 1700))
# ---- smooth-transition updates for 0-12 s ----
add(sfx, 6.2, rev_swell(0.3, 0.1)); add(sfx, 6.5, whoosh(0.7, 0.35)); add(sfx, 7.1, boom(0.25))
# ---- scenes 6-10 ----
add(sfx, 12.0, whoosh(0.6, 0.25), pan=-0.2); add(sfx, 12.6, shimmer(0.8, 0.07))
for t in (12.85, 13.05): add(sfx, t, tick(0.16, 2000))
add(sfx, 13.25, whoosh(0.3, 0.2)); soft_hit(13.55)
for i in range(6): add(sfx, 13.6 + i * 0.3, tick(0.22, 1500 + 160 * i)); add(sfx, 13.6 + i * 0.3, pop(0.12, 400 + 60 * i))
add(sfx, 15.15, glass_lock(0.25)); add(sfx, 15.3, whoosh(0.5, 0.15))
add(sfx, 15.95, rev_swell(0.3, 0.1)); add(sfx, 16.2, whoosh(0.7, 0.35)); add(sfx, 16.8, boom(0.25))
add(sfx, 16.85, whoosh(0.5, 0.35), pan=-0.4); add(sfx, 17.1, tick(0.16, 1900)); soft_hit(17.35); add(sfx, 17.85, chirp(0.08))
add(sfx, 19.0, whoosh(0.45, 0.4), pan=-0.5); add(sfx, 19.25, whoosh(0.7, 0.3)); add(sfx, 19.85, boom(0.3)); add(sfx, 19.85, kick(0.5))
for i in range(8): add(sfx, 20.05 + i * 0.07, tick(0.1, 2600))
add(sfx, 20.6, whoosh(0.5, 0.25)); add(sfx, 21.9, whoosh(0.5, 0.25))
for t in (21.0, 21.22, 21.44, 22.3, 22.52, 22.74): add(sfx, t, pop(0.25, 560)); add(sfx, t, tick(0.08, 2400))
add(sfx, 23.75, whoosh(0.5, 0.25)); add(sfx, 24.15, rev_swell(0.5, 0.12)); add(sfx, 24.4, shimmer(1.2, 0.08))
add(sfx, 24.75, tick(0.16, 1800)); soft_hit(25.1, 1.0)
add(sfx, 26.6, rev_swell(0.3, 0.1)); add(sfx, 26.85, whoosh(0.7, 0.35)); add(sfx, 27.45, boom(0.25))
add(sfx, 27.7, shimmer(0.9, 0.08))
for t in (28.15, 28.35): add(sfx, t, tick(0.16, 2000))
soft_hit(28.75, 0.9); soft_hit(29.05, 1.1); add(sfx, 29.05, ring(0.15, 264)); add(sfx, 29.7, shimmer(0.8, 0.08))
i0 = int(30.8 * SR); sfx[i0:] *= np.linspace(1, 0, len(sfx) - i0)[:, None]
def reverb(x, rt, wet, seed):
    r = np.random.default_rng(seed); n = int(rt * SR); t = np.arange(n) / SR; out = np.zeros_like(x)
    for ch in range(2):
        ir = fft_filter(r.normal(0, 1, n) * np.exp(-t * 6.9 / rt), None, 6000); ir[: int(0.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        F = 1 << (len(x) + n - 1).bit_length(); y = np.fft.irfft(np.fft.rfft(x[:, ch], F) * np.fft.rfft(ir, F), F)[: len(x)]
        out[:, ch] = x[:, ch] * (1 - wet) + y * wet * 1.5
    return out
out = reverb(sfx, 1.4, 0.16, 2); out = out / np.abs(out).max() * 0.89
os.makedirs(os.path.join(ROOT, "assets/audio"), exist_ok=True)
sf.write(A("sfx_pre.wav"), out.astype(np.float32), SR); print("ok")
