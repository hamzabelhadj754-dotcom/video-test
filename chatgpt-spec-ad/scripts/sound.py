"""Original score + sound design for the ChatGPT spec ad. Pure numpy, fully synthesized, no samples.

90 BPM: one beat = 20 frames at 30 fps, so every cut in the film lands on the grid.
Writes audio/music.wav, audio/sfx.wav and audio/premix.wav (48 kHz stereo).
"""
import json
import wave
import numpy as np

SR = 48000
ev = json.load(open("audio/events.json"))
FPS = ev["fps"]
DUR = ev["duration"] / FPS + 0.0
N = int(DUR * SR)
BEAT = 20 / FPS
rng = np.random.default_rng(7)


def fr(f):
    return f / FPS


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N:
        return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(sig), 0] += sig * gain * l * 1.414
    buf[i : i + len(sig), 1] += sig * gain * r * 1.414


def env_ar(n, a, r_tau):
    t = np.arange(n) / SR
    e = np.exp(-t / r_tau)
    ai = max(1, int(a * SR))
    e[:ai] *= np.linspace(0, 1, ai)
    return e


def fft_filter(x, lo=None, hi=None, soft=0.15):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def stft_sweep(x, lo_curve, hi_curve, win=2048, hop=512):
    """Band-pass whose edges move over time (for whooshes and risers)."""
    w = np.hanning(win)
    out = np.zeros(len(x) + win)
    norm = np.zeros(len(x) + win)
    f = np.fft.rfftfreq(win, 1 / SR)
    for s in range(0, len(x) - win, hop):
        p = s / max(1, len(x) - win)
        lo, hi = lo_curve(p), hi_curve(p)
        X = np.fft.rfft(x[s : s + win] * w)
        m = (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4))
        out[s : s + win] += np.fft.irfft(X * m, win) * w
        norm[s : s + win] += w**2
    return out[: len(x)] / np.maximum(norm[: len(x)], 1e-3)


# ---------------- Instruments ----------------
def epiano(freq, dur=3.2, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = bright * 1.3 * np.exp(-t * 3.5) + 0.12
    body = np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * t))
    tine = 0.10 * bright * np.sin(2 * np.pi * freq * 7.0 * t) * np.exp(-t * 18)
    sig = (body + tine) * env_ar(n, 0.004, 1.15) * (1 - np.exp(-t * 400))
    return sig * 0.5


def pad(freqs, dur, partials=7, attack=1.4, release=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for fq in freqs:
        for det in (-0.13, 0.0, 0.11):
            ff = fq * 2 ** (det / 12)
            ph = rng.uniform(0, 2 * np.pi)
            for k in range(1, partials + 1):
                sig += (1 / k**1.35) * np.sin(2 * np.pi * ff * k * t + ph * k)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release)
    e = np.clip(e, 0, 1) ** 1.6
    sig *= e
    return sig / (len(freqs) * 3 * 2.2)


def kick(level=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 46 + 80 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = fft_filter(rng.standard_normal(n), lo=1500, hi=6000) * np.exp(-t * 300) * 0.15
    return (s + click) * level


def hat(level=1.0, open_=False):
    n = int((0.25 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    s = fft_filter(rng.standard_normal(n), lo=7000, hi=15000)
    return s * np.exp(-t * (18 if open_ else 70)) * level * 0.5


def clap(level=1.0):
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    s = fft_filter(rng.standard_normal(n), lo=900, hi=4200)
    e = np.zeros(n)
    for d in (0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) * 140), 0)
    e += np.exp(-t * 18) * 0.35
    return s * e * level * 0.6


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
    return s * env_ar(n, 0.01, 0.9) * np.minimum(1, (dur - t) / 0.05).clip(0, 1) * 0.55


def bell(freq, dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.3)
         + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 3.2)
         + 0.18 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 6))
    return s * (1 - np.exp(-t * 900)) * 0.35


def reverb(x, seconds=2.4, damp=5000):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.0 / seconds * 2.2)
        ir = fft_filter(ir, lo=180, hi=damp)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir**2))
        L = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = y
    return out


# ---------------- Harmony (D major, warm, unresolved until the end card) ----------------
CH = {
    "Dmaj9": [50, 54, 57, 61, 64],
    "Bm11": [47, 50, 54, 57, 64],
    "Gmaj9": [43, 47, 50, 54, 57],
    "Asus": [45, 50, 52, 55, 59],
    "Em9": [40, 43, 47, 50, 54],
}

music = np.zeros((N, 2))
dry = np.zeros((N, 2))  # drums, kept mostly dry


def b(beat):
    return beat * BEAT


def strum(chord, beat, gain=1.0, bright=1.0, spread=0.035, up=12):
    for i, m in enumerate(CH[chord]):
        place(music, epiano(mtof(m + up), bright=bright), b(beat) + i * spread, gain * 0.32, pan=(i - 2) * 0.18)


# S1 morning (beats 0-10): felt-soft chords, a melody that asks a question
for beat, ch in ((0, "Dmaj9"), (4, "Bm11"), (8, "Gmaj9")):
    strum(ch, beat, 0.9, 0.8)
    place(music, pad([mtof(m) for m in CH[ch][:4]], b(4) + 1.6), b(beat), 0.42)
for beat, m in ((2, 76), (2.5, 74), (3, 73), (6, 74), (6.5, 73), (7, 71)):
    place(music, epiano(mtof(m), 2.4, 0.9), b(beat), 0.16, 0.25)

# S2 afternoon (beats 10-20): the day gets moving, a soft pulse arrives
for beat, ch in ((12, "Asus"), (16, "Dmaj9")):
    strum(ch, beat, 0.85, 1.0)
    place(music, pad([mtof(m) for m in CH[ch][:4]], b(4) + 1.6), b(beat), 0.4)
place(music, pad([mtof(m) for m in CH["Gmaj9"][:4]], b(2.5) + 1.4), b(10), 0.45)
for beat in np.arange(11, 19.5, 0.5):
    m = [69, 74, 76, 78][int(beat * 2) % 4]
    place(music, epiano(mtof(m), 0.9, 0.7), b(beat), 0.07, pan=0.35 if int(beat * 2) % 2 else -0.35)
for beat in range(12, 20):
    place(dry, kick(0.5), b(beat), 0.55)
    place(dry, hat(0.55), b(beat + 0.5), 0.5, pan=0.3)

# Night (beats 20-28): everything drops away; a dark pad and three notes
place(music, pad([mtof(m) for m in CH["Bm11"][:3]], b(8) + 0.3, partials=3, attack=0.4, release=1.2), b(20), 0.75)
for beat, m in ((20.0, 66), (22.5, 69), (24.0, 71), (26.5, 66)):
    place(music, epiano(mtof(m), 3.0, 0.45), b(beat), 0.17, -0.2)
place(dry, kick(1.0)[: int(0.5 * SR)], b(20), 0.55)  # low thump on the cut to 3 a.m.

# Burst (beats 28-32): full kit, bass, riser into the silence
for beat, ch in ((28, "Dmaj9"), (29, "Bm11"), (30, "Gmaj9"), (31, "Asus")):
    strum(ch, beat, 0.62, 1.2, spread=0.012)
    place(music, bass(mtof(CH[ch][0] - 12), b(1) - 0.02), b(beat), 0.65)
    place(dry, kick(1.0), b(beat), 0.42)
    place(dry, hat(0.8), b(beat + 0.5), 0.42, pan=0.25)
    place(dry, hat(0.5), b(beat + 0.25), 0.35, pan=-0.25)
    place(dry, hat(0.5), b(beat + 0.75), 0.35, pan=-0.25)
    if beat in (29, 31):
        place(dry, clap(1.0), b(beat), 0.45)
rn = int(b(4) * SR)
riser = stft_sweep(rng.standard_normal(rn), lambda p: 300 + 3000 * p**2, lambda p: 1200 + 9000 * p**2)
riser *= np.linspace(0, 1, rn) ** 2.2 * 0.5
place(dry, riser, b(28), 0.4)

# Everything stops on the cut to the end card (beat 32 = frame 640).
cut = int(b(32) * SR)
music_wet = music + 0.30 * reverb(music)
fade = int(0.012 * SR)
for buf in (music_wet, dry):
    buf[cut - fade : cut] *= np.linspace(1, 0, fade)[:, None]
    buf[cut:] = 0

# End card: a breath of silence, then the headline swell and the resolution
end = np.zeros((N, 2))
sw_n = int(0.9 * SR)
swell = stft_sweep(rng.standard_normal(sw_n), lambda p: 400 + 1200 * p, lambda p: 2000 + 6000 * p)
swell *= np.linspace(0, 1, sw_n) ** 3 * 0.35
place(end, swell, fr(ev["END"]["headline"]) + 0.85 - 0.9, 0.5)
t_res = fr(ev["END"]["headline"]) + 0.6
for i, m in enumerate(CH["Dmaj9"]):
    place(end, epiano(mtof(m + 12), 5.0, 0.7), t_res + i * 0.05, 0.3, pan=(i - 2) * 0.2)
place(end, pad([mtof(m) for m in CH["Dmaj9"][:4]], DUR - t_res + 0.2, attack=0.9, release=1.2), t_res, 0.5)
place(end, bell(mtof(81)), fr(ev["END"]["brand"]), 0.33, 0.1)
place(end, bell(mtof(88)), fr(ev["END"]["brand"]) + 0.09, 0.14, -0.15)
end = end + 0.38 * reverb(end, 3.0)

# ---------------- Sound design ----------------
sfx = np.zeros((N, 2))


def keyclick(kind):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    lo = 1800 if kind != "space" else 900
    s = fft_filter(rng.standard_normal(n), lo=lo, hi=lo * 4)
    thock = np.sin(2 * np.pi * rng.uniform(170, 240) * t) * np.exp(-t * 120) * 0.5
    return (s * np.exp(-t * 260) + thock) * rng.uniform(0.7, 1.0)


for k in ev["keys"]:
    place(sfx, keyclick(k["kind"]), fr(k["f"]), 0.11 if k["kind"] != "space" else 0.14, pan=rng.uniform(-0.15, 0.15))


def tick(level=1.0, f0=2400):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 90) + 0.4 * np.sin(2 * np.pi * f0 * 1.5 * t) * np.exp(-t * 160)) * level


def whoosh(dur, lo0, lo1, hi0, hi1, level):
    n = int(dur * SR)
    x = stft_sweep(rng.standard_normal(n), lambda p: lo0 + (lo1 - lo0) * p, lambda p: hi0 + (hi1 - hi0) * p)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t) ** 1.6
    return x * e * level


for s in (ev["S1"], ev["S2"], ev["S3"]):
    place(sfx, tick(0.32), fr(s["send"]), 0.5)
    place(sfx, whoosh(0.5, 500, 2500, 3000, 9000, 0.22), fr(s["send"]), 1.0, 0.1)
# light pass between morning and afternoon
place(sfx, whoosh(1.1, 250, 900, 1600, 7000, 0.5), fr(ev["T1"]["start"]) - 0.1, 1.0)
# drag in, drop
place(sfx, whoosh(0.9, 700, 300, 5000, 2500, 0.18), fr(ev["S2"]["dragStart"]), 1.0, 0.4)
place(sfx, tick(0.28, 1600), fr(ev["S2"]["drop"]), 0.6)
# camera pull-back on the end card
place(sfx, whoosh(1.2, 200, 600, 1500, 4000, 0.22), fr(ev["END"]["start"] + 6), 1.0)

# room tone, always there, so silence is never digital zero
room = fft_filter(rng.standard_normal(N), lo=60, hi=900) * 0.0035
sfx[:, 0] += room
sfx[:, 1] += fft_filter(rng.standard_normal(N), lo=60, hi=900) * 0.0035

music_bus = music_wet + dry + end
# gentle bus glue: soft clip
music_bus = np.tanh(music_bus * 1.1) / 1.1
mix = music_bus * 0.9 + sfx
# head fade-in (3 ms) and tail fade-out
fi = int(0.003 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(1.4 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5


def write(path, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.89
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


write("audio/premix.wav", mix)
write("audio/music.wav", music_bus)
write("audio/sfx.wav", sfx)
print("ok", DUR, "s")
