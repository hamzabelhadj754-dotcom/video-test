"""Original score + sound design for "Words become the app" (20s). Fully synthesized, no samples.
Beat grid: 100 BPM (0.6 s) starting at 0.4 s, so montage cuts land on beats (10.6, 11.8, 13.0, 14.2).
Key: D major (warm, optimistic). Electric-piano chords, soft kick, airy pad for the open ending.
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR, DUR = 48000, 20.0
N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(21)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
def ta(d): return np.arange(int(d * SR)) / SR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def filt(x, k, f, o=2): return sosfilt(butter(o, f, btype=k, fs=SR, output='sos'), x, axis=0)
def place(buf, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); sig = np.stack([sig * l, sig * r], 1) * 1.414
    n = min(len(sig), N - i)
    if n > 0: buf[i:i + n] += sig[:n] * g
def tone(m, d, g, dec, harm=((1, 1),), att=.004):
    t = ta(d); f = mtof(m)
    return sum(a * np.sin(2 * np.pi * f * k * t) for k, a in harm) * np.exp(-t * dec) * np.minimum(1, t / att) * g
def ep(notes, d=2.0, g=.1):   # electric piano
    out = sum(tone(m, d, 1, 1.8, ((1, 1), (2, .4), (3, .12), (4.01, .05))) for m in notes)
    return out * g / len(notes) ** .5
def pad(notes, d, g=.05, cut=1800, att=.6, rel=1.2):
    t = ta(d); out = np.zeros(len(t))
    for m in notes:
        for det in (-.004, 0, .004): ph = (mtof(m) * (1 + det) * t) % 1; out += 2 * ph - 1
    out = filt(out, 'lowpass', cut)
    return out * np.minimum(1, t / att) * np.minimum(1, np.maximum(0, d - t) / rel) * g / len(notes)
def kick(g=.5):
    t = ta(.4); f = 46 + 70 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * g
def snap(g=.18): t = ta(.16); return filt(rng.standard_normal(len(t)), 'bandpass', [1600, 5200]) * np.exp(-t * 35) * g
def hat(g=.05): t = ta(.05); return filt(rng.standard_normal(len(t)), 'highpass', 7000) * np.exp(-t * 80) * g
def key_click(g=.12):
    t = ta(.035); body = filt(rng.standard_normal(len(t)), 'bandpass', [1800, 6500]) * np.exp(-t * 260)
    return (body + .4 * np.sin(2 * np.pi * rng.uniform(2200, 3200) * t) * np.exp(-t * 400)) * g
def whoosh(d, f0, f1, g=.15):
    t = ta(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = 1024
    for s in range(0, len(t), seg):
        fc = f0 * (f1 / f0) ** (s / len(t))
        out[s:s + seg] = filt(n[max(0, s - 2048):s + seg], 'bandpass', [fc * .6, min(fc * 1.6, 20000)])[-len(n[s:s + seg]):]
    return out * np.sin(np.pi * t / d) ** 2 * g
def chime(m, g=.1, d=1.6): return tone(m, d, g, 2.4, ((1, 1), (2.0, .3), (3.0, .12), (4.2, .05)))
def pop(m, g=.14): return tone(m, .25, g, 18, ((1, 1), (2, .3)))
def scribble(d=.5, g=.08):
    t = ta(d); n = rng.standard_normal(len(t)) * (0.5 + 0.5 * np.abs(np.sin(t * 2 * np.pi * 9)))
    return filt(n, 'bandpass', [2500, 7000]) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .08) * g

BEAT, G0 = .6, .4
beat = lambda k: G0 + k * BEAT
# ---------------- music ----------------
D = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]]   # Dmaj7 Bm7 Gmaj7 A
R = [38, 35, 31, 33]
for k in range(0, 23):                       # until 14.2
    t0 = beat(k); bar, b4 = divmod(k, 4); ch, rt = D[bar % 4], R[bar % 4]
    if b4 == 0: place(mus, ep(ch, 2.4, .11 if t0 < 3.4 else .13), t0, 1, -.1); place(mus, tone(rt, 2.2, .22, 1.6, ((1, 1), (2, .25))), t0)
    if b4 == 2 and t0 > 3.0: place(mus, ep(ch[1:], 1.2, .07), t0 + .3, 1, .2)
    if t0 >= 3.4:
        if b4 in (0, 2): place(mus, kick(.42), t0)
        if b4 in (1, 3): place(mus, snap(.16), t0, 1, .1)
        place(mus, hat(.045), t0 + .3, 1, .35)
        if t0 >= 10.6: place(mus, hat(.03), t0 + .15, 1, -.35); place(mus, hat(.03), t0 + .45, 1, -.35)
# ending: open, airy, resolved
place(mus, pad([62, 66, 69, 73, 76], 6.0, .06, 2400, .9, 2.0), 14.2)
place(mus, ep([50, 62, 66, 69, 73, 76], 4.5, .12), 15.6)

# ---------------- sound design ----------------
IDEA = 'a booking app for my grandma’s bakery'
for i, ch in enumerate(IDEA):                         # typing, one key per character
    if ch != ' ': place(sfx, key_click(.11 if ch not in 'ab' else .13), .45 + i * (2.3 / len(IDEA)) + rng.uniform(-.008, .008), 1, rng.uniform(-.2, .2))
place(sfx, whoosh(.5, 3000, 900, .06), 2.95, 1, -.3)  # filler words drift away
place(sfx, scribble(.45, .09), 3.18, 1, .2)           # "Rosa" written
place(sfx, chime(81, .08), 3.6, 1, .2)
place(sfx, whoosh(.6, 900, 3000, .07), 3.85, 1, -.4)
for i in range(7):                                    # the seven letters land as seven days
    place(sfx, pop([74, 76, 78, 79, 81, 83, 86][i], .11), 4.17 + i * .07, 1, -.6 + i * .2)
place(sfx, whoosh(.7, 500, 2500, .07), 4.15, 1, .4)   # app stretches into a button
place(sfx, pop(69, .16), 4.68, 1, .3)
place(sfx, whoosh(1.0, 300, 6000, .1), 4.95)          # the cake grows
place(sfx, chime(86, .1, 2.2), 5.7)
place(sfx, tone(38, .6, .2, 8), 6.55)                 # canvas becomes a page
place(sfx, whoosh(1.1, 600, 2200, .06), 8.75, 1, .2)  # scroll
place(sfx, whoosh(.45, 1200, 7000, .12), 10.2, 1, -.5)  # page leaves
MPS = [('A league table for our Sunday football', 10.6), ('Remind me to water my plants', 11.8), ('A merch store for my band', 13.0)]
for s, t0 in MPS:
    for i, ch in enumerate(s):
        if ch != ' ': place(sfx, key_click(.07), t0 + .05 + i * (.6 / len(s)), 1, rng.uniform(-.3, .3))
    place(sfx, whoosh(.5, 5000, 900, .09), t0 - .05, 1, .5)
place(sfx, whoosh(.7, 4000, 400, .1), 14.15)          # everything folds back
place(sfx, pop(62, .14), 14.7)
for i, m in enumerate([74, 78, 81, 86]):              # "Let's build something Lovable"
    place(sfx, tone(m, 1.4, .06, 3, ((1, 1), (2, .2))), 15.6 + i * .32, 1, -.3 + i * .2)
place(sfx, chime(86, .09, 2.6), 17.2, 1, -.1); place(sfx, chime(93, .06, 2.6), 17.3, 1, .1)

def reverb(x, secs, mix):
    t = ta(secs); ir = filt(rng.standard_normal((len(t), 2)) * np.exp(-t * 3.6)[:, None], 'lowpass', 8000)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + wet / (np.max(np.abs(wet)) + 1e-9) * mix * np.max(np.abs(x))
mus = reverb(mus, 2.0, .25); sfx = reverb(sfx, 1.0, .12)
mix = mus * .78 + sfx
mix *= np.where(T > 18.4, np.clip(1 - (T - 18.4) / 1.6, 0, 1) ** 1.5, 1)[:, None]
mix = filt(mix, 'highpass', 28); mix /= np.max(np.abs(mix)) / .9
wavfile.write('render/mix_raw.wav', SR, (mix * 32767).astype(np.int16)); print('ok')
