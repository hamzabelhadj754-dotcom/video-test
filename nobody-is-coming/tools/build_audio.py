"""Code-generated score + SFX + mix for "Nobody Is Coming To Save You".

Everything is synthesised from seeded noise and sines, so it re-renders identically
and carries no licensing risk. Outputs (48 kHz stereo):
  assets/audio/music.wav   score (pad, piano, sub pulse), un-ducked
  assets/audio/sfx.wav     sound design
  assets/audio/mix_pre.wav VO + ducked music + SFX (normalised to -14 LUFS afterwards by ffmpeg)
  assets/audio/env.json    10 Hz music/SFX energy envelope, drives the audio-reactive texture
Run: python tools/build_audio.py   (needs numpy + soundfile)
"""
import json, os, sys
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda p: os.path.join(ROOT, "assets/audio", p)
SR = 48000
DUR = 69.0
N = int(SR * DUR)
rng = np.random.default_rng(1337)
t_all = np.arange(N) / SR

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def seg(t, d): i0 = int(t * SR); return i0, min(N, i0 + int(d * SR))
def lp(x, a):  # one-pole low-pass, a in (0,1): higher = brighter
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def lp_fast(x, cutoff):  # FFT brickwall-ish low-pass with soft knee
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x))
def bp_fast(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 - 1 / (1 + (f / lo) ** 4)); return np.fft.irfft(X, len(x))
def add(buf, t, sig, gain=1.0, pan=0.0):
    i0 = int(t * SR); i1 = min(N, i0 + len(sig)); s = sig[: i1 - i0] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i0:i1, 0] += s * l * 1.414; buf[i0:i1, 1] += s * r * 1.414

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# ---------------------------------------------------------------- pad
# chord changes (time, [midi notes], level)
CH = [
    (0.0,  [38, 45, 50, 53], 0.55),   # Dm
    (4.6,  [38, 45, 50, 53], 0.7),
    (7.0,  [34, 46, 50, 53], 0.7),    # Bb
    (9.4,  [31, 43, 50, 55], 0.7),    # Gm
    (12.2, [34, 46, 53, 57], 0.6),    # Bbmaj7
    (16.0, [31, 43, 50, 55], 0.55),   # Gm
    (19.0, [33, 45, 49, 52], 0.5),    # A (tension)
    (21.0, [38, 45, 50, 53], 0.7),    # Dm
    (24.5, [34, 46, 50, 53], 0.85),   # Bb
    (26.0, [41, 48, 53, 57, 60], 1.0),# F (the 37.78 lift)
    (28.0, [36, 48, 52, 55], 0.85),   # C
    (29.7, [38, 45, 50, 53], 0.6),    # Dm (1% worse)
    (32.8, [34, 46, 50, 53], 0.55),   # Bb
    (35.3, [33, 45, 49, 52], 0.6),    # A
    (37.5, [38, 50, 52, 57], 0.32),   # Dm add9, near-silent room
    (49.5, [34, 46, 50, 53], 0.6),    # Bb
    (52.3, [41, 48, 53, 57], 0.75),   # F
    (55.3, [36, 48, 52, 55, 60], 0.85),# C
    (57.5, [38, 50, 53, 57], 0.7),    # Dm/F
    (60.0, [34, 46, 50, 53], 0.55),   # Bb
    (64.0, [38, 45, 50, 53, 57], 0.7),# Dm
    (65.8, [38, 45, 50, 57, 62], 0.8),# D open fifth, ring out
]
def pad_voice(f, dur, bright):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for det in (-0.07, 0.0, 0.06):
        ff = f * 2 ** (det / 12); ph = rng.uniform(0, 2 * np.pi)
        for k in range(1, 9):
            if ff * k > 6000: break
            out += np.sin(2 * np.pi * ff * k * t + ph * k) * (1 / k) * np.exp(-k / bright)
    return out / 3
pad = np.zeros(N)
for i, (t0, notes, lvl) in enumerate(CH):
    t1 = CH[i + 1][0] if i + 1 < len(CH) else DUR
    xf = 1.6; d = (t1 - t0) + xf + (3.0 if i + 1 == len(CH) else 0)
    d = min(d, DUR - t0)
    bright = 2.2 if t0 < 21 else (3.2 if t0 < 29.7 else (1.6 if t0 < 37.5 else (1.4 if t0 < 49.5 else 2.8)))
    v = sum(pad_voice(midi(m), d, bright) for m in notes) / len(notes)
    n = len(v); env = np.ones(n); a = int(xf * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if i + 1 < len(CH): env[-a:] = np.cos(np.linspace(0, np.pi / 2, a)) ** 2
    else: env *= np.exp(-np.linspace(0, 3.2, n))
    i0, i1 = seg(t0, d); pad[i0:i1] += (v * env * lvl)[: i1 - i0]
pad *= 1 + 0.12 * np.sin(2 * np.pi * 0.11 * t_all)
music[:, 0] += pad * 0.16; music[:, 1] += np.roll(pad, 240) * 0.16

# ---------------------------------------------------------------- sub drone + heartbeat pulse
drone = np.sin(2 * np.pi * midi(26) * t_all) * 0.5 + np.sin(2 * np.pi * midi(38) * t_all) * 0.18
dlev = np.interp(t_all, [0, 3, 21, 26, 30, 37.5, 38, 49.5, 52, 60, 66, 69], [.35, .35, .5, .9, .7, .6, .2, .2, .45, .4, .3, 0])
music[:, 0] += drone * dlev * 0.13; music[:, 1] += drone * dlev * 0.13
def thump(f0=58, f1=36, d=0.45):
    n = int(d * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
beat = thump()
for start, end, g in [(19.0, 37.0, 0.32), (52.3, 59.2, 0.2)]:
    t = start
    while t < end:
        acc = g * (1.25 if 24.5 < t < 28 else 1.0)
        add(music, t, beat, acc); add(music, t + 0.26, beat, acc * 0.55)
        t += 2.0 if t < 24 or t > 29 else 1.0

# ---------------------------------------------------------------- piano
def piano(m, vel=0.5, d=4.0):
    f = midi(m); n = int(d * SR); t = np.arange(n) / SR; out = np.zeros(n); B = 0.0004
    for k, a in zip(range(1, 8), [1, .55, .3, .2, .12, .08, .05]):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 9000: break
        out += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.5 * k) * (1 + f / 900))
    att = np.minimum(1, t / 0.004); out *= att
    out += np.exp(-t / 0.012) * rng.normal(0, 0.03, n)  # hammer
    return out * vel
P = [(0.0, 38, .55), (0.0, 50, .45),
     (4.62, 45, .3), (6.92, 41, .3), (9.3, 38, .35), (10.6, 50, .2),
     (12.4, 65, .26), (13.0, 69, .22), (14.3, 74, .28), (16.0, 72, .2), (17.0, 69, .17), (18.5, 65, .15), (19.8, 64, .13),
     (21.95, 62, .26), (22.6, 65, .26), (23.2, 69, .28), (24.6, 74, .3), (25.2, 77, .32), (25.7, 81, .34), (26.0, 86, .3), (26.0, 74, .4), (26.0, 62, .35),
     (29.75, 69, .25), (30.4, 65, .23), (31.1, 62, .22), (31.9, 57, .22), (32.85, 50, .3), (32.85, 38, .3),
     (38.2, 62, .22), (41.4, 65, .22), (41.42, 69, .2), (44.0, 64, .14), (45.7, 62, .2), (46.5, 57, .18), (47.2, 74, .12),
     (50.0, 58, .2), (52.3, 65, .22), (53.42, 69, .16), (53.97, 72, .16), (54.52, 77, .16), (55.33, 81, .22), (56.0, 77, .16),
     (60.6, 62, .22), (62.66, 69, .22), (64.13, 65, .2), (64.89, 69, .2), (65.43, 74, .22), (65.8, 62, .25), (65.8, 69, .22), (65.8, 74, .2)]
for t, m, v in P: add(music, t, piano(m, v, 5.0 if t > 60 else 4.0), 0.55, pan=(m - 62) / 40)

# ---------------------------------------------------------------- SFX
def noise(d): return rng.normal(0, 1, int(d * SR))
def env_ad(n, a, dcy): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / dcy)
def boom(g):
    d = 3.2; n = int(d * SR); t = np.arange(n) / SR; f = 30 + 34 * np.exp(-t / 0.35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    s += lp_fast(noise(d), 180) * np.exp(-t / 0.08) * 0.6
    return s * g
def whoosh(d, g, rise=0.6):
    n = int(d * SR); t = np.arange(n) / SR; x = noise(d)
    e = np.where(t < d * rise, (t / (d * rise)) ** 2, np.exp(-(t - d * rise) / (d * 0.18)))
    lo = bp_fast(x, 200, 1800); hi = bp_fast(x, 1500, 7000); m = np.clip(t / (d * rise), 0, 1)
    return (lo * (1 - m) + hi * m * 0.6) * e * g
def slap(g):
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    s = bp_fast(noise(d), 700, 4200) * env_ad(n, 0.002, 0.05) + thump(90, 45, 0.5)[:n] * 0.9
    return s * g
def zip_(g):
    d = 0.3; n = int(d * SR); t = np.arange(n) / SR; x = noise(d)
    return (bp_fast(x, 2000, 9000) * env_ad(n, 0.01, 0.07) + bp_fast(x, 400, 1500) * env_ad(n, 0.003, 0.03) * 0.5) * g
def rip(g):
    d = 0.7; n = int(d * SR); x = bp_fast(noise(d), 600, 6000); gr = np.zeros(n); r = np.random.default_rng(9)
    pos = 0
    while pos < n * 0.85:
        L = int(r.uniform(0.004, 0.02) * SR); gr[pos:pos + L] += r.uniform(0.3, 1.0); pos += int(r.uniform(0.006, 0.02) * SR)
    gr = lp_fast(gr, 400); t = np.arange(n) / SR
    return x * gr * np.exp(-t / 0.35) * g
def pop(g, f0=880):
    d = 0.18; n = int(d * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.5 * np.minimum(1, t / 0.05))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.003, 0.05) + bp_fast(noise(d), 3000, 9000) * env_ad(n, 0.001, 0.006) * 0.4) * g
def click(g, f=2200):
    d = 0.08; n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * env_ad(n, 0.001, 0.012) + bp_fast(noise(d), 2500, 10000) * env_ad(n, 0.0005, 0.004)) * g
def chime(g, m=81):
    d = 2.6; n = int(d * SR); t = np.arange(n) / SR; f = midi(m)
    return sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * dk) for k, a, dk in [(1, 1, 1.6), (2.76, .4, 3), (5.4, .15, 5)]) * env_ad(n, 0.002, 9) * g
def shimmer(g):
    d = 1.4; n = int(d * SR); t = np.arange(n) / SR
    s = bp_fast(noise(d), 4000, 12000) * np.sin(np.pi * t / d) ** 2 * 0.5
    s += np.sin(2 * np.pi * np.cumsum(2400 + 900 * t / d) / SR) * np.sin(np.pi * t / d) ** 2 * 0.15
    return s * g

add(sfx, 1.70, boom(0.9))
add(sfx, 0.0, boom(0.6)); add(sfx, 0.0, whoosh(0.35, 0.12, 0.05))  # sound on frame 1
for i, t in enumerate(np.arange(2.65, 3.72, 0.07)): add(sfx, t, click(0.03, 2600 + 60 * i))  # teaser counter
add(sfx, 3.75, chime(0.08, 86))
add(sfx, 0.0, lp_fast(noise(1.5), 120) * env_ad(int(1.5 * SR), 0.01, 0.5) * 0.25)  # frame-1 low air
for t in (4.35, 11.5, 20.4, 48.55, 58.95): add(sfx, t, whoosh(0.7, 0.22), pan=0.1)
for t, p in ((22.0, -0.3), (24.3, 0.2), (26.35, -0.1), (29.4, 0.3), (31.4, -0.2), (33.3, 0.1)): add(sfx, t, whoosh(1.6, 0.09, 0.5), pan=p)
add(sfx, 36.25, whoosh(1.25, 0.32, 0.85))
add(sfx, 49.62, whoosh(1.6, 0.14, 0.4)); add(sfx, 52.25, whoosh(0.9, 0.12, 0.5))
for t in (4.70, 7.0, 9.38): add(sfx, t, slap(0.5))
for t, p in ((5.40, -0.2), (7.70, 0.2), (9.80, 0)): add(sfx, t, zip_(0.32), pan=p)
for t in (6.40, 8.70): add(sfx, t, rip(0.5))
for t in (12.72, 15.8, 18.3): add(sfx, t, pop(0.12, 880 if t < 15 else 660))
add(sfx, 14.3, chime(0.06, 86))
add(sfx, 17.0, click(0.22, 1400)); add(sfx, 17.16, click(0.16, 1100))
add(sfx, 26.0, boom(1.0)); add(sfx, 26.0, chime(0.07, 86))
add(sfx, 32.85, boom(0.45))
for i, t in enumerate(np.arange(21.95, 26.0, 0.11)): add(sfx, t, click(0.018, 3000 + 40 * i))
for i, t in enumerate(np.arange(29.75, 32.85, 0.13)): add(sfx, t, click(0.015, 2400 - 25 * i))
add(sfx, 37.62, thump(140, 60, 0.3) * 0.5); add(sfx, 37.62, click(0.2, 900)); add(sfx, 37.76, click(0.1, 900))
add(sfx, 37.62, bp_fast(noise(0.4), 100, 400) * env_ad(int(0.4 * SR), 0.01, 0.1) * 0.15)
for t in (53.44, 53.99, 54.54): add(sfx, t, click(0.3, 2200)); add(sfx, t, pop(0.05, 1320))
add(sfx, 55.33, chime(0.16, 81)); add(sfx, 55.9, chime(0.07, 93))
add(sfx, 65.85, shimmer(0.18))

# ---------------------------------------------------------------- room reverb (shared by music + sfx)
def reverb(x, rt=2.8, wet=0.28, seed=4):
    r = np.random.default_rng(seed); n = int(rt * SR); t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = r.normal(0, 1, n) * np.exp(-t * 6.9 / rt); ir = lp_fast(ir, 5000); ir[: int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
        L = len(x[:, ch]) + n; F = 1 << (L - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[:, ch], F) * np.fft.rfft(ir, F), F)[: len(x)]
        out[:, ch] = x[:, ch] * (1 - wet) + y * wet * 1.6
    return out
music = reverb(music, 3.2, 0.34)
sfx = reverb(sfx, 2.4, 0.2, seed=5)

# ---------------------------------------------------------------- VO, ducking, mix
vo, vsr = sf.read(A("vo48.wav"), dtype="float64")
if vo.ndim > 1: vo = vo.mean(1)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
vo = vo / (np.abs(vo).max() + 1e-9) * 0.7
vo_room = reverb(np.stack([vo, vo], 1), 1.2, 0.07, seed=6)
# envelope follower on the voice → music gain (−12 dB under speech)
e = np.abs(vo); hop = 480; frames = e[: N // hop * hop].reshape(-1, hop).max(1)
sm = np.zeros_like(frames); acc = 0.0
for i, v in enumerate(frames):
    k = 0.6 if v > acc else 0.04  # fast attack, slow release
    acc += k * (v - acc); sm[i] = acc
act = np.clip(sm / 0.08, 0, 1)
duck_db = -12 * act
duck = np.interp(np.arange(N), np.arange(len(sm)) * hop + hop / 2, 10 ** (duck_db / 20))
mix = vo_room + music * duck[:, None] * 0.4 + sfx * 0.7
# fade the last second into the reverb tail
mix[-int(0.25 * SR):] *= np.linspace(1, 0, int(0.25 * SR))[:, None]
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
spk = act[np.minimum(np.arange(N) // hop, len(act) - 1)] > 0.5
print("VO rms %.1f dB | music under VO %.1f dB | music in rests %.1f dB | sfx %.1f dB" % (db(vo_room[spk]), db((music * duck[:, None] * 0.4)[spk]), db((music * 0.4)[~spk]), db(sfx * 0.7)))
peak = np.abs(mix).max(); mix = mix / peak * 0.89

sf.write(A("music.wav"), (music / (np.abs(music).max() + 1e-9) * 0.89).astype(np.float32), SR)
sf.write(A("sfx.wav"), (sfx / (np.abs(sfx).max() + 1e-9) * 0.89).astype(np.float32), SR)
sf.write(A("mix_pre.wav"), mix.astype(np.float32), SR)

# energy envelope of music + sfx (not voice) at 10 Hz, 0..1, for the audio-reactive texture
bed = (music * 0.9 + sfx).mean(1); h = SR // 10
rms = np.sqrt((bed[: len(bed) // h * h].reshape(-1, h) ** 2).mean(1))
rms = rms / (np.percentile(rms, 98) + 1e-9); rms = np.clip(rms, 0, 1)
sm2 = np.zeros_like(rms); acc = 0
for i, v in enumerate(rms): acc += (0.5 if v > acc else 0.12) * (v - acc); sm2[i] = acc
json.dump([round(float(v), 3) for v in sm2], open(A("env.json"), "w"))
print("ok", peak)
