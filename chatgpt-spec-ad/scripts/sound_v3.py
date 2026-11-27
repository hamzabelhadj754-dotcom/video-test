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
BEAT = 0.652  # ~92 BPM pulse for the afternoon
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



# ---------------- v3 score: built on the voiceover's own timings ----------------
CH = {
    "Dmaj9": [50, 54, 57, 61, 64],
    "Bm11": [47, 50, 54, 57, 64],
    "Gmaj9": [43, 47, 50, 54, 57],
    "Asus": [45, 50, 52, 55, 59],
}
music = np.zeros((N, 2))
dry = np.zeros((N, 2))
end = np.zeros((N, 2))
F = ev["FIN"]


def strum(buf, chord, t, gain=1.0, bright=1.0, spread=0.035, up=12, dur=3.2):
    for i, m in enumerate(CH[chord]):
        place(buf, epiano(mtof(m + up), dur, bright=bright), t + i * spread, gain * 0.3, pan=(i - 2) * 0.18)


def padc(buf, chord, t, dur, gain, partials=7, n=4):
    place(buf, pad([mtof(m) for m in CH[chord][:n]], dur, partials=partials), t, gain)


# Intro and morning
strum(music, "Dmaj9", 0.05, 0.7, 0.7)
padc(music, "Dmaj9", 0.0, 7.2, 0.38)
for i, m in enumerate([62, 66, 69, 73, 76]):  # "So you open ChatGPT": the window opens
    place(music, epiano(mtof(m + 12), 2.2, 0.8), fr(136) + i * 0.09, 0.09, pan=-0.3 + i * 0.15)
strum(music, "Bm11", fr(209), 0.8, 0.8)
padc(music, "Bm11", fr(209), 4.0, 0.36)
strum(music, "Gmaj9", fr(327), 0.75, 0.75)
padc(music, "Gmaj9", fr(327), 2.6, 0.34)
# Afternoon: a soft pulse arrives with "Monday"
t_m = fr(392)
strum(music, "Asus", t_m, 0.8, 1.0)
padc(music, "Asus", t_m, 4.9, 0.34)
strum(music, "Dmaj9", fr(533), 0.8, 1.0)
padc(music, "Dmaj9", fr(533), 2.8, 0.34)
k = 0
t = t_m
while t < fr(612):
    place(dry, kick(0.5), t, 0.42)
    place(dry, hat(0.5), t + BEAT / 2, 0.35, pan=0.3)
    m = [69, 74, 76, 78][k % 4]
    place(music, epiano(mtof(m), 0.9, 0.6), t + BEAT / 2, 0.055, pan=0.35 if k % 2 else -0.35)
    t += BEAT
    k += 1
# Night: almost nothing
place(dry, kick(1.0), fr(618), 0.5)
padc(music, "Bm11", fr(618), fr(838) - fr(618) + 0.2, 0.6, partials=3, n=3)
for f_, m in ((640, 66), (690, 69), (745, 71)):
    place(music, epiano(mtof(m), 3.0, 0.45), fr(f_), 0.14, -0.2)
padc(music, "Gmaj9", fr(749), 2.6, 0.32, partials=4)
# Burst: one hit per spoken word
cuts = ev["BURST_CUTS"]
for i, ch in enumerate(["Dmaj9", "Bm11", "Gmaj9", "Asus"]):
    t0, t1 = fr(cuts[i]), fr(cuts[i + 1])
    strum(music, ch, t0, 0.55, 1.2, spread=0.012, dur=1.2)
    place(music, bass(mtof(CH[ch][0] - 12), t1 - t0 - 0.02), t0, 0.6)
    place(dry, kick(1.0), t0, 0.45)
    place(dry, hat(0.8), (t0 + t1) / 2, 0.35, pan=0.25)
    if i % 2:
        place(dry, clap(1.0), t0, 0.35)
rn = int((fr(940) - fr(810)) * SR)
riser = stft_sweep(rng.standard_normal(rn), lambda p: 300 + 3000 * p**2, lambda p: 1200 + 9000 * p**2)
riser *= np.linspace(0, 1, rn) ** 2.4 * 0.5
place(dry, riser, fr(810), 0.3)
# The wall: the emotional lift
t_w = fr(940)
place(dry, kick(1.0), t_w, 0.4)
strum(music, "Dmaj9", t_w, 0.8, 1.0, dur=4.0)
padc(music, "Dmaj9", t_w, fr(1004) - t_w + 1.2, 0.5)
arp = [62, 66, 69, 73, 74, 73, 69, 66]
t = t_w + 0.3
i = 0
while t < fr(1004):
    place(music, epiano(mtof(arp[i % 8] + 12), 1.4, 0.75), t, 0.07, pan=0.3 if i % 2 else -0.3)
    t += 0.3
    i += 1
# "...the ones you'd never say out loud": pull everything back
padc(music, "Bm11", fr(1004), fr(1118) - fr(1004) + 0.4, 0.42, partials=3, n=3)
place(music, epiano(mtof(66), 3.5, 0.4), fr(1012), 0.12, 0.1)
place(music, epiano(mtof(69), 3.5, 0.4), fr(1060), 0.1, -0.1)

music_wet = music + 0.3 * reverb(music)
# The logo: a quiet, certain resolution
t_l = fr(F["iris"])
strum(end, "Dmaj9", t_l, 0.75, 0.7, dur=5.0)
padc(end, "Dmaj9", t_l, DUR - t_l + 0.2, 0.42)
place(end, bell(mtof(81)), t_l, 0.3, 0.1)
place(end, bell(mtof(88)), t_l + 0.08, 0.12, -0.15)
place(end, epiano(mtof(86), 4.0, 0.5), fr(F["headline"]), 0.1, 0.2)
end = end + 0.38 * reverb(end, 3.0)
music_bus = music_wet + dry + end
fo = int(1.6 * SR)
music_bus[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

# ---------------- Sound design ----------------
sfx = np.zeros((N, 2))


def keyclick(kind):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    lo = 1800 if kind != "space" else 900
    s = fft_filter(rng.standard_normal(n), lo=lo, hi=lo * 4)
    thock = np.sin(2 * np.pi * rng.uniform(170, 240) * t) * np.exp(-t * 120) * 0.5
    return (s * np.exp(-t * 260) + thock) * rng.uniform(0.7, 1.0)


def tick(level=1.0, f0=2400):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 90) + 0.4 * np.sin(2 * np.pi * f0 * 1.5 * t) * np.exp(-t * 160)) * level


def whoosh(dur, lo0, lo1, hi0, hi1, level):
    n = int(dur * SR)
    x = stft_sweep(rng.standard_normal(n), lambda p: lo0 + (lo1 - lo0) * p, lambda p: hi0 + (hi1 - hi0) * p)
    tt = np.linspace(0, 1, n)
    return x * np.sin(np.pi * tt) ** 1.6 * level


def pip(f0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f0 * t) * np.exp(-t * 45) * (1 - np.exp(-t * 2000))


for k_ in ev["keys"]:
    place(sfx, keyclick(k_["kind"]), fr(k_["f"]), 0.09 if k_["kind"] != "space" else 0.11, pan=rng.uniform(-0.15, 0.15))
for s_ in (ev["S1"], ev["S2"], ev["S3"]):
    place(sfx, tick(0.3), fr(s_["send"]), 0.5)
    place(sfx, whoosh(0.5, 500, 2500, 3000, 9000, 0.2), fr(s_["send"]), 1.0, 0.1)
place(sfx, whoosh(1.2, 250, 900, 1600, 7000, 0.45), fr(ev["T1"]["start"]) - 0.1, 1.0)
place(sfx, whoosh(1.0, 200, 700, 1500, 4000, 0.22), fr(128), 1.0)  # the window reveal
place(sfx, whoosh(0.9, 700, 300, 5000, 2500, 0.16), fr(ev["S2"]["dragStart"]), 1.0, 0.4)
place(sfx, tick(0.26, 1600), fr(ev["S2"]["drop"]), 0.6)
for c in ev["BURST_CUTS"][:4]:
    place(sfx, tick(0.22, 3000), fr(c), 0.5)
for i, at in enumerate(ev["wall"]):
    place(sfx, pip(mtof([74, 78, 81, 86, 83, 79][i % 6])), fr(at), 0.05, pan=rng.uniform(-0.6, 0.6))
place(sfx, tick(0.3), fr(F["send"]), 0.5)
place(sfx, whoosh(0.9, 400, 1800, 2500, 9000, 0.3), fr(F["fly"]), 1.0)
sh_n = int(1.6 * SR)
shimmer = fft_filter(rng.standard_normal(sh_n), lo=6000, hi=14000) * np.exp(-np.arange(sh_n) / SR * 3) * 0.05
place(sfx, shimmer, fr(F["iris"]), 1.0)
room = fft_filter(rng.standard_normal(N), lo=60, hi=900) * 0.003
sfx[:, 0] += room
sfx[:, 1] += np.roll(room, 997)


def write(path, x, peak=0.89):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


write("audio/music_v3.wav", np.tanh(music_bus * 1.1) / 1.1)
write("audio/sfx_v3.wav", sfx, peak=0.25)
print("ok", DUR)
