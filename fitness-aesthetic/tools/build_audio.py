"""110 BPM warm ambient pulse + refined sound design + mix for the 20 s aesthetic short (all synthesised, seeded).
Outputs: assets/audio/{music,sfx,mix_pre}.wav and env.json. Then run tools/master.sh for -14 LUFS / <= -1 dBTP."""
import json, os
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda p: os.path.join(ROOT, "assets/audio", p)
SR, DUR = 48000, 20.0
N = int(SR * DUR); BPM = 110; B = 60 / BPM
rng = np.random.default_rng(110)
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

def soft_kick(g=1.0):
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR; f = 42 + 50 * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * env(n, 0.006, 9) * g
def air(d, g=1.0, lo=500, hi=6000):      # airy whoosh: band noise, smooth swell in and out
    n = int(d * SR); k = np.arange(n) / n; e = np.sin(np.pi * k) ** 2
    return fft_filter(noise(d), lo, hi) * e * g
def ping(f=1760, g=1.0, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 4) * env(n, 0.002, 9) * g
def deep_hit(g=1.0):
    d = 2.0; n = int(d * SR); t = np.arange(n) / SR; f = 36 + 30 * np.exp(-t / 0.12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.6) + fft_filter(noise(d), None, 400) * env(n, 0.003, 0.08) * 0.4) * g
def grains(d, g=1.0, seed=5, rate=60, fs=(1318.5, 1567.98, 1975.5, 2349.3, 2637.0)):   # granular shimmer
    n = int(d * SR); out = np.zeros(n); r = np.random.default_rng(seed)
    for _ in range(int(d * rate)):
        i = int(r.uniform(0, d) * SR); f = r.choice(fs) * r.choice([1, 2]); m = int(r.uniform(.04, .12) * SR)
        seg = np.sin(2 * np.pi * f * np.arange(m) / SR) * np.hanning(m); out[i:i + m] += seg[: n - i] * r.uniform(.2, 1)
    k = np.arange(n) / n; return out * np.sin(np.pi * k) ** 0.6 * g

# ---------------- score: Fmaj7 | Am7 | Dm9 | Cmaj7, one chord per 2 bars (4.36 s) ----------------
CH = [(53, 57, 60, 64), (57, 60, 64, 67), (50, 53, 57, 60, 64), (48, 52, 55, 59)]
RT = [41, 45, 38, 36]
BAR = 4 * B
for c in range(5):
    t0 = c * 2 * BAR; ch = CH[c % 4]
    add(music, t0, pad_chord([m + 12 for m in ch], 2 * BAR + 0.5, 1.7), 0.55)
    add(music, t0, bass(RT[c % 4], 2 * BAR, 0.4))
for b in range(37):                               # soft pulse on every beat, a felt-like pluck on the off-beats
    t = beat(b)
    if t > 19.2: break
    add(drums, t, soft_kick(0.75 if b % 4 == 0 else 0.45))
    ch = CH[int(t // (2 * BAR)) % 4]
    if b % 2 == 1: add(music, t + B / 2, pluck(ch[(b // 2) % len(ch)] + 24, 0.09, 0.5), pan=0.4 * np.sin(b))
    add(drums, t + B / 2, hat(0.12))

# ---------------- sound design (times from assets/audio/words.json and the timeline) ----------------
add(sfx, 0.0, air(1.6, 0.18, 200, 2500)); add(sfx, 0.05, grains(0.6, 0.06, 1))   # aurora breathes in, header decodes
add(sfx, 1.53, deep_hit(0.35)); add(sfx, 1.95, air(0.45, 0.12, 2500, 9000))      # grow + ember line
add(sfx, 2.3, riser(0.97, 0.28)); add(sfx, 2.87, air(0.42, 0.45, 300, 5000))      # low swell into the zoom-through
add(sfx, 3.273, deep_hit(0.5)); add(sfx, 3.273, air(0.5, 0.2, 150, 1200))          # land in the dark
add(sfx, 3.3, grains(0.8, 0.05, 2))                                               # fibres draw on
add(sfx, 3.93, deep_hit(0.9)); add(sfx, 3.93, fft_filter(noise(0.25), 1500, 8000) * env(int(0.25 * SR), 0.001, 0.03) * 0.25)  # breaks
for i in range(6): add(sfx, 4.55 + i * 0.055, tick(0.1, 2600 + 90 * i))          # MICRO-TEARS decode
add(sfx, 5.5, air(0.6, 0.22, 600, 7000))                                          # line carry
add(sfx, 6.2, air(1.4, 0.14, 200, 3000))                                          # orbit / rise
v_prev = 0
for i in range(1, 300):                                                           # counter ticks, power3.out over 1 s
    p = i / 300; v = int(48 * (1 - (1 - p) ** 3))
    if v != v_prev: add(sfx, 8.0 + p, tick(0.09, 2000 + 18 * v)); v_prev = v
add(sfx, 9.0, ping(1760, 0.16)); add(sfx, 9.0, deep_hit(0.25))                    # 48 lands
add(sfx, 10.05, air(0.35, 0.22, 800, 8000))                                       # shape morph
for k, t in enumerate((10.364, 10.42, 10.5)): add(sfx, t, tick(0.12, 1500 + 200 * k))
for k, t in enumerate((12.19, 12.72, 13.46)): add(sfx, t, ping((1318.5, 1567.98, 1975.5)[k], 0.1, 0.8)); add(sfx, t, air(0.3, 0.08, 1500, 8000))
add(sfx, 13.8, air(0.42, 0.55, 400, 9000), pan=0.5)                               # whip pan
add(sfx, 14.18, deep_hit(0.3))
for i in range(5): add(sfx, 14.5 + i * 0.06, tick(0.07, 2400 + 80 * i))           # labels decode
add(sfx, 15.42, air(0.25, 0.14, 2500, 9000))                                      # strike
add(sfx, 16.2, air(0.5, 0.1, 300, 2500)); add(sfx, 16.23, deep_hit(0.3))           # rack focus + recovery
for i in range(5): add(sfx, 16.7 + i * 0.06, tick(0.07, 2600 + 80 * i))
add(sfx, 17.0, grains(1.5, 0.11, 3, 90)); add(sfx, 17.0, air(1.4, 0.16, 400, 6000))  # particles dissolve + assemble
add(sfx, 18.12, rev_swell(0.5, 0.12))                                             # arch reveal
add(sfx, 18.71, deep_hit(0.45)); add(sfx, 18.71, ping(1318.5, 0.1, 1.4)); add(sfx, 18.85, air(0.4, 0.1, 2500, 9000))  # rest
add(sfx, 19.0, tick(0.1, 1500))                                                   # handle
for buf in (music, drums, sfx):
    i0, i1 = int(19.3 * SR), int(19.97 * SR); buf[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 1.5; buf[i1:] = 0
# ---------------- room reverb + sidechain ----------------
def reverb(x, rt, wet, seed):
    r = np.random.default_rng(seed); n = int(rt * SR); t = np.arange(n) / SR; out = np.zeros_like(x)
    for ch in range(2):
        ir = fft_filter(r.normal(0, 1, n) * np.exp(-t * 6.9 / rt), None, 6000); ir[: int(0.01 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        F = 1 << (len(x) + n - 1).bit_length(); y = np.fft.irfft(np.fft.rfft(x[:, ch], F) * np.fft.rfft(ir, F), F)[: len(x)]
        out[:, ch] = x[:, ch] * (1 - wet) + y * wet * 1.5
    return out
music = reverb(music, 2.2, 0.28, 1); sfx = reverb(sfx, 1.8, 0.18, 2); drums = reverb(drums, 0.9, 0.08, 3)
kenv = np.zeros(N)
for b in range(0, 32):
    i = int(beat(b) * SR); m = int(0.25 * SR); kenv[i:i + m] = np.maximum(kenv[i:i + m], np.exp(-np.arange(min(m, N - i)) / SR / 0.08))
music *= (1 - 0.45 * kenv)[:, None]
MUSIC = False   # the client adds their own track: VO + sound design only
bed = (music * 0.55 + drums * 0.75) * (1.0 if MUSIC else 0.0)

# ---------------- VO + ducking ----------------
vo, vsr = sf.read(A("vo48.wav"), dtype="float64")
if vo.ndim > 1: vo = vo.mean(1)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]; vo = vo / (np.abs(vo).max() + 1e-9) * 0.7
vo2 = reverb(np.stack([vo, vo], 1), 0.8, 0.05, 4)
hop = 480; fr = np.abs(vo[: N // hop * hop]).reshape(-1, hop).max(1); sm = np.zeros_like(fr); acc = 0.0
for i, v in enumerate(fr): acc += (0.6 if v > acc else 0.04) * (v - acc); sm[i] = acc
duck = np.interp(np.arange(N), np.arange(len(sm)) * hop + hop / 2, 10 ** (-12 * np.clip(sm / 0.08, 0, 1) / 20))
mix = vo2 + bed * duck[:, None] * 0.35 + sfx * 0.4
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
spk = np.clip(sm / 0.08, 0, 1)[np.minimum(np.arange(N) // hop, len(sm) - 1)] > 0.5
print("VO %.1f | bed under VO %.1f | bed in rests %.1f | sfx %.1f" % (db(vo2[spk]), db((bed * duck[:, None] * 0.35)[spk]), db((bed * 0.35)[~spk]), db(sfx * 0.4)))
mix = mix / np.abs(mix).max() * 0.89
if MUSIC: sf.write(A("music.wav"), (bed / np.abs(bed).max() * 0.89).astype(np.float32), SR)
sf.write(A("sfx.wav"), (sfx / np.abs(sfx).max() * 0.89).astype(np.float32), SR)
sf.write(A("mix_pre.wav"), mix.astype(np.float32), SR)
e = (bed + sfx).mean(1); h = SR // 10; rms = np.sqrt((e[: len(e) // h * h].reshape(-1, h) ** 2).mean(1)); rms = np.clip(rms / (np.percentile(rms, 98) + 1e-9), 0, 1)
json.dump([round(float(v), 3) for v in rms], open(A("env.json"), "w"))
print("ok")
