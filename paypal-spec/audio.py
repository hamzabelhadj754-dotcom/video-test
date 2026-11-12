"""Original sound design + music for "SETTLED." (20s). Fully synthesized: no samples, no licences.
120 BPM grid from 0. Key: C major (bright, friendly). Paper foley built from filtered noise.
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR, DUR = 48000, 20.0
N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(12)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))


def ta(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def filt(x, k, f, o=2): return sosfilt(butter(o, f, btype=k, fs=SR, output='sos'), x, axis=0)


def place(buf, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l, sig * r], 1) * 1.414
    n = min(len(sig), N - i)
    if n > 0: buf[i:i + n] += sig[:n] * g


def tone(m, d, g, dec, harm=((1, 1),), att=.003):
    t = ta(d); f = mtof(m)
    return sum(a * np.sin(2 * np.pi * f * k * t) for k, a in harm) * np.exp(-t * dec) * np.minimum(1, t / att) * g


def pluck(m, g=.16):   # marimba-ish
    return tone(m, .7, g, 9, ((1, 1), (3.99, .35), (9.2, .08)))


def pad(notes, d, g=.05, cutoff=1800, att=.4, rel=.8):
    t = ta(d); out = np.zeros(len(t))
    for m in notes:
        for det in (-.003, 0, .003):
            ph = (mtof(m) * (1 + det) * t) % 1; out += 2 * ph - 1
    out = filt(out, 'lowpass', cutoff)
    return out * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, d - t) / rel) * g / len(notes)


def kick(g=.7):
    t = ta(.4); f = 48 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * g


def snap(g=.3):
    t = ta(.18); return filt(rng.standard_normal(len(t)), 'bandpass', [1500, 5000]) * np.exp(-t * 32) * g


def shaker(g=.07):
    t = ta(.06); return filt(rng.standard_normal(len(t)), 'highpass', 6000) * np.exp(-t * 70) * g


def noise(d, lo, hi, g, env):
    t = ta(d); return filt(rng.standard_normal(len(t)), 'bandpass', [lo, hi]) * env(t, d) * g


def rustle(d=.35, g=.18):  # paper lift
    return noise(d, 1500, 8000, g, lambda t, d: np.sin(np.pi * t / d) ** 2 * (0.6 + 0.4 * np.abs(np.sin(t * 90))))


def crinkle(d=.3, g=.35):   # fold: sharp crackles
    t = ta(d); x = np.zeros(len(t))
    for _ in range(26):
        i = rng.integers(0, len(t) - 600); x[i:i + 600] += rng.standard_normal(600) * np.exp(-np.arange(600) / 90) * rng.uniform(.3, 1)
    return filt(x, 'highpass', 1800) * g


def whoosh(d, f0, f1, g=.2):
    t = ta(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = 1024
    for s in range(0, len(t), seg):
        fc = f0 * (f1 / f0) ** (s / len(t))
        out[s:s + seg] = filt(n[max(0, s - 2048):s + seg], 'bandpass', [fc * .6, min(fc * 1.6, 20000)])[-len(n[s:s + seg]):]
    return out * np.sin(np.pi * t / d) ** 2 * g


def ratchet(d=.4, g=.2):   # receipt rolling up
    t = ta(d); x = np.zeros(len(t))
    for k in np.arange(0, d, .028):
        i = int(k * SR); x[i:i + 400] += rng.standard_normal(min(400, len(t) - i)) * np.exp(-np.arange(min(400, len(t) - i)) / 60)
    return filt(x, 'bandpass', [1200, 6000]) * g


def tear(g=.4):
    t = ta(.45); n = rng.standard_normal(len(t)) * (1 + .8 * np.sin(t * 2 * np.pi * 70))
    return filt(n, 'bandpass', [900, 7000]) * np.exp(-t * 6) * np.minimum(1, t / .01) * g


def clink(m, g=.16):
    return tone(m, .6, g, 10, ((1, 1), (2.76, .5), (5.4, .3), (8.9, .15)))


def sent(m, g=.12):   # two-note "sent" chime
    a = tone(m, .7, g, 6, ((1, 1), (2, .25))); b = tone(m + 7, .9, g, 5, ((1, 1), (2, .25)))
    out = np.zeros(int(1.0 * SR)); out[:len(a)] += a; o = int(.09 * SR); out[o:o + len(b)] += b[:len(out) - o]
    return out


def hit(g=.6):
    t = ta(1.2); f = 40 + 70 * np.exp(-t * 18)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) + filt(rng.standard_normal(len(t)), 'lowpass', 1500) * np.exp(-t * 20) * .3) * g


# ---------------- music ----------------
# 0-3: curious, unresolved (Csus2 / Fadd9 questions), soft plucks
place(mus, pad([48, 55, 62, 67], 3.2, .05, 1400, .5, .6), 0.0)
for t0, m in [(0.25, 74), (0.75, 79), (1.25, 76), (2.0, 74), (2.5, 72)]:
    place(mus, pluck(m, .1), t0, 1, .2)
# 3-12.4: the groove (C - Am - F - G), plucky bass + ostinato
prog_ = [([60, 64, 67], 36), ([57, 60, 64], 33), ([53, 57, 60], 29), ([55, 59, 62], 31)]
ost = [0, 2, 1, 2, 0, 2, 1, 2]
b = 0
while 3.0 + b * .5 < 12.4:
    tb = 3.0 + b * .5; bar, beat = divmod(b, 4); ch, root = prog_[bar % 4]
    if beat in (0, 2): place(mus, kick(.55), tb)
    if beat in (1, 3): place(mus, snap(.22), tb, 1, .1)
    place(mus, shaker(), tb + .25, 1, .4); place(mus, shaker(.04), tb + .125, 1, -.4); place(mus, shaker(.04), tb + .375, 1, -.4)
    for k in range(2):
        idx = ost[(b * 2 + k) % 8]; place(mus, pluck(ch[idx] + 12, .09), tb + k * .25, 1, -.25 + .5 * k)
    if beat == 0: place(mus, tone(root, 1.6, .28, 2.2, ((1, 1), (2, .3))), tb); place(mus, pad([n for n in ch], 2.0, .03, 1600, .3, .5), tb)
    if beat == 2: place(mus, tone(root + 7, .45, .16, 5, ((1, 1), (2, .3))), tb + .25)
    b += 1
# 12.4-14.75: breakdown (just a held, rising pad) then "Settled." lands on a full C major 9
place(mus, pad([55, 60, 64, 67], 2.5, .045, 1200, .8, .3), 12.4)
place(mus, pad([48, 55, 60, 64, 67, 74], 5.4, .075, 2600, .08, 1.6), 14.75)
place(mus, tone(36, 4.5, .3, .8, ((1, 1), (2, .25))), 14.75)
for i, m in enumerate([72, 76, 79, 84]):
    place(mus, pluck(m, .09), 14.75 + i * .09, 1, -.3 + i * .2)

# ---------------- foley ----------------
place(sfx, whoosh(.9, 300, 1500, .06), 0.0)            # objects drift in
place(sfx, rustle(), 3.0, 1, -.4)                       # pizza note lifts
place(sfx, crinkle(), 3.6, 1, -.3)                      # folds into a plane
place(sfx, whoosh(1.0, 900, 4200, .2), 3.84, 1, -.1)     # flight
place(sfx, sent(84), 4.85, 1, .1)
place(sfx, rustle(.4, .15), 6.0, 1, .4)                 # receipt lifts
place(sfx, ratchet(), 6.5, 1, .35)                      # rolls up
place(sfx, whoosh(.4, 1500, 6000, .16), 6.9, 1, .2)
place(sfx, sent(86), 7.3, 1, .1)
place(sfx, rustle(.4, .15), 8.0, 1, -.4)                # ticket lifts
place(sfx, tear(.42), 8.55, 1, -.2)                     # tears at the perforation
place(sfx, whoosh(.5, 2500, 500, .08), 8.9, 1, .5)       # stub tumbles away
place(sfx, sent(88), 9.3, 1, .1)
for i in range(3):                                      # coins arc in and clink
    place(sfx, whoosh(.5, 800, 3000, .05), 10.55 + i * .16, 1, [-.5, .5, -.1][i])
    place(sfx, clink(96 + i * 3, .13), 11.1 + i * .16, 1, [-.3, .3, 0][i])
place(sfx, sent(91), 11.5, 1, .1)
place(sfx, whoosh(.8, 2000, 300, .14), 12.4, 1, .3)     # phone exits
place(sfx, rustle(.5, .12), 12.7, 1, .5)                # last note drifts in
place(sfx, whoosh(.55, 600, 5000, .16), 14.2)           # the flip
place(sfx, hit(.55), 14.75)                             # "Settled."
place(sfx, tone(84, 2.5, .1, 1.5, ((1, 1), (2.0, .3), (3.0, .1))), 16.4, 1, -.1)   # logo sting
place(sfx, tone(91, 2.5, .08, 1.5, ((1, 1), (2.0, .3))), 16.5, 1, .1)


def reverb(x, secs, mix):
    t = ta(secs); ir = filt(rng.standard_normal((len(t), 2)) * np.exp(-t * 4.2)[:, None], 'lowpass', 8000)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + wet / (np.max(np.abs(wet)) + 1e-9) * mix * np.max(np.abs(x))


mus = reverb(mus, 1.8, .22); sfx = reverb(sfx, 1.0, .12)
mix = mus * .8 + sfx
mix *= np.where(T > 18.3, np.clip(1 - (T - 18.3) / 1.7, 0, 1) ** 1.5, 1)[:, None]
mix = filt(mix, 'highpass', 28)
mix /= np.max(np.abs(mix)) / .9
wavfile.write('render/mix_raw.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
