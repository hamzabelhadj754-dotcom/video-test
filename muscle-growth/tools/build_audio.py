"""124 BPM hybrid-electronic score + sound design + mix for the fitness film (all synthesised, seeded).
Outputs: assets/audio/{music,sfx,mix_pre}.wav and env.json. Then run tools/master.sh for -14 LUFS / <= -1 dBTP."""
import json, os
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda p: os.path.join(ROOT, "assets/audio", p)
SR, DUR = 48000, 62.0
N = int(SR * DUR); BPM = 124; B = 60 / BPM
rng = np.random.default_rng(124)
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

# ---------------- score ----------------
E, C_, G_, D_ = 40, 36, 43, 38   # Em – C – G – D roots (E2...)
CH = {E: [52, 55, 59, 64], C_: [48, 52, 55, 60], G_: [50, 55, 59, 62], D_: [50, 54, 57, 62]}
prog = [E, C_, G_, D_]
bar = 4 * B
# pads: whole film, density by section
def pad_at(t0, root, d, lvl, bright):
    add(music, t0, pad_chord(CH[root], d + 0.4, bright), lvl, 0)
add(music, 0, pad_chord([40, 47, 52, 59], beat(8) + 0.4, 1.6), 0.55)          # hook: open E drone
for i, t in enumerate(np.arange(beat(8), beat(25), bar)): pad_at(t, prog[i % 4], bar, 0.42, 2.0)
add(music, beat(25), pad_chord([52, 54, 59, 64, 66], beat(25) + 0.4, 1.4), 0.5)  # inside the fibre: Em(add9) bed
for i, t in enumerate(np.arange(beat(50), beat(114), bar)): pad_at(t, prog[i % 4], bar, 0.5, 2.6)
end_ch = [[48, 52, 55, 60], [50, 55, 59, 62], [52, 59, 64, 71]]
for i, t in enumerate([beat(114), beat(114) + bar, beat(114) + 2 * bar]): add(music, t, pad_chord(end_ch[i], bar + (1.8 if i == 2 else 0.4), 2.0), 0.55)

# drums: groove from scene 2, half-time in scene 3, full in 4–6, sparse outro; silent in the drop-out
def groove(b0, b1, full=True, half=False):
    for b in range(b0, b1):
        t = beat(b)
        if half:
            if b % 4 == 0: add(drums, t, kick(0.8))
            if b % 4 == 2: add(drums, t, clap(0.5))
            continue
        add(drums, t, kick(0.9 if b % 4 == 0 else 0.75))
        if b % 2 == 1 and full: add(drums, t, clap(0.55), pan=0.05)
        add(drums, t + B / 2, hat(0.6), pan=0.25); add(drums, t, hat(0.35), pan=-0.2)
        if full and b % 8 == 7: add(drums, t + B / 2, hat(0.5, True), pan=0.3)
groove(8, 22, full=False)
groove(25, 50, half=True)
groove(50, 74, full=True)
groove(74, 95, full=True)
groove(95, 112, full=True)
for b in (114, 118, 122): add(drums, beat(b), kick(0.7))
# bass follows the progression, ducked by the kick
for i, t in enumerate(np.arange(beat(8), beat(22), bar)):
    for k in range(4): add(music, t + k * B, bass(prog[i % 4], B * 0.9, 0.5))
for i, t in enumerate(np.arange(beat(50), beat(112), bar)):
    for k in range(8): add(music, t + k * B / 2, bass(prog[i % 4], B * 0.45, 0.55 if k % 2 == 0 else 0.35))
# plucked arpeggio in the system / compare / kinetic sections
arp = {E: [64, 67, 71, 76], C_: [60, 64, 67, 72], G_: [62, 67, 71, 74], D_: [62, 66, 69, 74]}
for i, t in enumerate(np.arange(beat(50), beat(112), bar)):
    for k in range(16): add(music, t + k * B / 4, pluck(arp[prog[i % 4]][k % 4] + (12 if k % 8 > 5 else 0), 0.13), pan=(k % 4 - 1.5) / 4)
# heartbeat pulse under scene 3
for t in np.arange(beat(25), beat(50), 1.2): add(music, t, heart(0.6)); add(music, t + 0.24, heart(0.38))

# ---------------- sound design ----------------
def impact(t, g=1.0):
    add(sfx, t - 0.55, rev_swell(0.55, 0.35 * g)); add(sfx, t, boom(0.9 * g)); add(sfx, t, ring(0.8 * g)); add(sfx, t, kick(0.6 * g))
add(sfx, 0.0, boom(0.45)); add(sfx, 0.0, whoosh(0.4, 0.15))                       # sound on frame 1
add(sfx, 0.75, whoosh(0.65, 0.18))                                                # the plate falling
impact(1.40, 1.0)                                                                 # plate thud + GROW
add(sfx, 1.62, chirp(0.12)); add(sfx, 1.62, fft_filter(noise(0.25), 2000, 9000) * env(int(0.25 * SR), 0.01, 0.06) * 0.25)
add(sfx, 3.4, whoosh(0.5, 0.2)); add(sfx, 3.871, tick(0.4, 1600))                  # match cut
for t in (4.65, 5.15, 5.65): add(sfx, t, chirp(0.12), pan=0.2)                     # scramble decode
for t in (6.95, 7.75, 8.55): add(sfx, t, tick(0.5, 2600)); add(sfx, t, heart(0.5))  # reps
for t in np.arange(4.86, 5.2, 0.04): add(sfx, t, tick(0.05, 3000))                 # split-flap
add(sfx, 10.6, riser(1.45, 0.4)); add(sfx, 11.6, whoosh(0.5, 0.3))                 # scale dive
add(sfx, 12.097, boom(0.35))
add(sfx, 15.4, shimmer(4.0, 0.12)); add(sfx, 18.6, rev_swell(0.9, 0.18)); add(sfx, 19.5, ring(0.3, 352))  # repair + thicker
add(sfx, 20.2, whoosh(1.0, 0.25)); add(sfx, 23.25, chirp(0.15)); add(sfx, 23.6, whoosh(0.5, 0.2))       # pull back + carry
add(sfx, 26.15, whoosh(0.4, 0.12))
for t in (27.5, 31.45, 34.44): add(sfx, t, glass_lock(0.45))                       # cards lock
for i in range(6): add(sfx, 28.3 + i * 0.12, tick(0.18, 1800 + 120 * i))           # bars
for t in np.arange(30.9, 31.45, 0.05): add(sfx, t, tick(0.08, 2800))               # protein flap
for t in (29.62, 33.62): add(sfx, t - 0.35, riser(0.35, 0.25)); add(sfx, t, whoosh(0.4, 0.4))  # whip pans
add(sfx, 35.4, whoosh(0.4, 0.2))                                                   # card unfold
add(sfx, 38.84, boom(0.35)); add(sfx, 38.84, fft_filter(noise(0.5), 80, 600) * env(int(0.5 * SR), 0.005, 0.15) * 0.3)  # damage
for i in range(24): add(sfx, 41.6 + (i / 24) ** (1 / 1.4) * 1.6, tick(0.12, 1500 + 60 * i))  # sessions
add(sfx, 44.4, riser(1.3, 0.45)); add(sfx, 45.7, boom(0.5)); add(sfx, 45.7, ring(0.25, 264))  # push-through bloom
add(sfx, 46.36, kick(0.5)); add(sfx, 47.97, kick(0.5)); impact(49.46, 0.85)       # kinetic hits
add(sfx, 53.3, whoosh(0.4, 0.2))
impact(55.161, 1.0)                                                                # downbeat into the end card
add(sfx, 57.75, shimmer(0.8, 0.12))

# beat drop-out: music + drums silent for the half beat before the end-card downbeat
def gate(buf, a, b, fade=0.02):
    i0, i1, f = int(a * SR), int(b * SR), int(fade * SR)
    buf[i0:i1] *= 0; buf[i0 - f:i0] *= np.linspace(1, 0, f)[:, None]
gate(music, 54.55, 55.161); gate(drums, 54.55, 55.161)
# end: gentle fade into 0.5 s of silence
for buf in (music, drums, sfx):
    i0, i1 = int(60.6 * SR), int(61.5 * SR); buf[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None]; buf[i1:] = 0

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
for b in range(0, 128):
    i = int(beat(b) * SR); m = int(0.25 * SR); kenv[i:i + m] = np.maximum(kenv[i:i + m], np.exp(-np.arange(min(m, N - i)) / SR / 0.08))
music *= (1 - 0.45 * kenv)[:, None]
bed = music * 0.55 + drums * 0.75

# ---------------- VO + ducking ----------------
vo, vsr = sf.read(A("vo48.wav"), dtype="float64")
if vo.ndim > 1: vo = vo.mean(1)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]; vo = vo / (np.abs(vo).max() + 1e-9) * 0.7
vo2 = reverb(np.stack([vo, vo], 1), 0.8, 0.05, 4)
hop = 480; fr = np.abs(vo[: N // hop * hop]).reshape(-1, hop).max(1); sm = np.zeros_like(fr); acc = 0.0
for i, v in enumerate(fr): acc += (0.6 if v > acc else 0.04) * (v - acc); sm[i] = acc
duck = np.interp(np.arange(N), np.arange(len(sm)) * hop + hop / 2, 10 ** (-12 * np.clip(sm / 0.08, 0, 1) / 20))
mix = vo2 + bed * duck[:, None] * 0.35 + sfx * 0.55
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
spk = np.clip(sm / 0.08, 0, 1)[np.minimum(np.arange(N) // hop, len(sm) - 1)] > 0.5
print("VO %.1f | bed under VO %.1f | bed in rests %.1f | sfx %.1f" % (db(vo2[spk]), db((bed * duck[:, None] * 0.35)[spk]), db((bed * 0.35)[~spk]), db(sfx * 0.55)))
mix = mix / np.abs(mix).max() * 0.89
sf.write(A("music.wav"), (bed / np.abs(bed).max() * 0.89).astype(np.float32), SR)
sf.write(A("sfx.wav"), (sfx / np.abs(sfx).max() * 0.89).astype(np.float32), SR)
sf.write(A("mix_pre.wav"), mix.astype(np.float32), SR)
e = (bed + sfx).mean(1); h = SR // 10; rms = np.sqrt((e[: len(e) // h * h].reshape(-1, h) ** 2).mean(1)); rms = np.clip(rms / (np.percentile(rms, 98) + 1e-9), 0, 1)
json.dump([round(float(v), 3) for v in rms], open(A("env.json"), "w"))
print("ok")
