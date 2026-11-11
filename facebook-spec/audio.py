"""Original sound design + music bed for the 15s spot. Fully synthesized (no samples, no licensing).
120 BPM grid from 2.0s. Cuts land on beats: 1.5 freeze, 5.0 whip, 6.5, 7.5, 10.5, 11.0, 11.5 blue.
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def t_arr(d):
    return np.arange(int(d * SR)) / SR


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    n = min(len(sig), N - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain


def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------- instruments ----------------
def kick(g=1.0):
    t = t_arr(.45)
    f = 45 + 85 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * g + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 300) * .08


def snap():
    t = t_arr(.25)
    n = rng.standard_normal(len(t))
    n = filt(n, 'bandpass', [1200, 4200])
    env = np.exp(-t * 26) + .6 * np.exp(-((t - .012) ** 2) / 1e-5)
    return n * env * .5


def hat(d=.05):
    t = t_arr(d)
    return filt(rng.standard_normal(len(t)), 'highpass', 7500) * np.exp(-t * 90) * .22


def ep(notes, d=1.6, g=.11):
    t = t_arr(d)
    out = np.zeros(len(t))
    for m in notes:
        f = mtof(m)
        for k, a, dec in [(1, 1, 2.2), (2, .35, 4), (3, .12, 7), (4, .05, 10)]:
            out += a * np.sin(2 * np.pi * f * k * t * (1 + .0007 * k)) * np.exp(-t * dec)
    att = np.minimum(1, t / .006)
    return out * att * g / len(notes) ** .5


def pad(notes, d, g=.05):
    t = t_arr(d)
    out = np.zeros(len(t))
    for m in notes:
        for det in (-.004, .004):
            ph = (mtof(m) * (1 + det) * t) % 1
            out += (2 * ph - 1)
    out = filt(out, 'lowpass', 1400)
    env = np.minimum(1, t / .4) * np.minimum(1, (d - t) / .6)
    return out * env * g / len(notes)


def bass(m, d=.45, g=.32):
    t = t_arr(d)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)
    return x * np.minimum(1, t / .005) * np.exp(-t * 2.5) * g


def noise_sweep(d, f0, f1, g=.3, shape='up'):
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    seg = 1024
    for s in range(0, len(t), seg):
        u = s / len(t)
        fc = f0 * (f1 / f0) ** u
        out[s:s + seg] = filt(n[max(0, s - 2048):s + seg], 'bandpass', [fc * .6, min(fc * 1.6, 20000)])[-len(n[s:s + seg]):]
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** (1.5 if shape == 'up' else .7)
    if shape == 'up':
        env = (t / d) ** 2
    if shape == 'down':
        env = (1 - t / d) ** 2
    return out * env * g


def pop(f=900, g=.35, bright=False):
    t = t_arr(.12)
    fr = f * (1 + .9 * np.exp(-t * 60))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) * np.exp(-t * 40)
    if bright:
        x += .4 * np.sin(2 * ph) * np.exp(-t * 55)
    return x * g


def hit(g=.6):
    t = t_arr(.9)
    f = 38 + 70 * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)
    body = filt(rng.standard_normal(len(t)), 'lowpass', 900) * np.exp(-t * 14) * .5
    return (sub + body) * g


def tick(g=.12):
    t = t_arr(.02)
    return filt(rng.standard_normal(len(t)), 'bandpass', [2500, 6000]) * np.exp(-t * 400) * g


def buzz(g=.18):
    t = t_arr(.32)
    x = np.sign(np.sin(2 * np.pi * 155 * t)) * .5 + np.sin(2 * np.pi * 155 * t)
    gate = ((t < .12) | ((t > .17) & (t < .29))).astype(float)
    return filt(x, 'lowpass', 600) * gate * g


def click(g=.35):
    t = t_arr(.08)
    return (np.sin(2 * np.pi * 1650 * t) * .5 + filt(rng.standard_normal(len(t)), 'bandpass', [900, 3000])) * np.exp(-t * 90) * g


def chime(m, g=.16, d=2.4):
    t = t_arr(d)
    f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * dec) for k, a, dec in [(1, 1, 1.4), (2.76, .3, 4), (5.4, .12, 8)])
    return x * np.minimum(1, t / .003) * g


# ---------------- music ----------------
BEAT = .5
chords = [[53, 57, 60, 64, 67], [57, 60, 64, 67], [50, 53, 57, 60, 64], [46, 50, 53, 57, 60]]
roots = [41, 45, 38, 34]
start, end = 2.0, 13.0
b = 0
while start + b * BEAT < end:
    tb = start + b * BEAT
    bar, beat = divmod(b, 4)
    ch, rt = chords[bar % 4], roots[bar % 4]
    night = 7.5 <= tb < 10.5
    if beat in (0, 2):
        place(music, kick(.55 if night else .9), tb)
    if beat in (1, 3) and not night:
        place(music, snap(), tb, .7)
    if not night:
        place(music, hat(), tb + .25, .9, .3)
        if tb >= 10.5:
            place(music, hat(.03), tb, .6, -.3)
            place(music, hat(.03), tb + .125, .4, .3)
            place(music, hat(.03), tb + .375, .4, -.3)
    if beat == 0:
        place(music, ep(ch), tb, 1, -.15)
        place(music, bass(rt, .9), tb)
    if beat == 1:
        place(music, ep(ch[1:], 1.0, .07), tb + .25, 1, .2)
        place(music, bass(rt + 12, .3, .18), tb + .25)
    if beat == 2:
        place(music, bass(rt, .45), tb)
    b += 1
# night section: muffle it like a quiet room at 3am
a, z = int(7.5 * SR), int(10.5 * SR)
music[a:z] = filt(music[a:z], 'lowpass', 700) * 1.25
# pad under everything after the freeze, swelling at the end
place(music, pad([53, 57, 60, 64], 5.5, .045), 2.0)
place(music, pad([50, 53, 57, 60, 64], 6.0, .04), 7.5)
place(music, pad([53, 57, 60, 64, 67], 3.5, .07), 11.5)
# end: settle on F chord, let it ring
place(music, ep([41, 53, 57, 60, 64, 67], 3.0, .16), 13.0)

# ---------------- sound design ----------------
# opening scroll: air + decelerating ticks
place(sfx, noise_sweep(1.45, 6000, 900, .22, 'down'), 0.0)
tt, gap = 0.0, .035
while tt < 1.42:
    place(sfx, tick(.10 * (1 - tt / 1.6)), tt, 1, rng.uniform(-.4, .4))
    tt += gap
    gap *= 1.18
place(sfx, hit(.75), 1.5)                         # the freeze
place(sfx, noise_sweep(.42, 400, 5000, .22, 'up'), 1.58)  # scale-through into the card
# sourdough chat
for t_, f_, br in [(2.85, 820, 0), (3.15, 760, 0), (3.5, 1180, 1), (4.25, 700, 0)]:
    place(sfx, pop(f_, .3, bool(br)), t_, 1, .25)
place(sfx, noise_sweep(.5, 600, 3500, .14, 'up'), 3.75)    # bubble lifts out
place(sfx, pop(1500, .12), 4.55, 1, .3)                    # typing
place(sfx, noise_sweep(.3, 900, 7000, .3, 'up'), 4.72)     # whip out
place(sfx, noise_sweep(.4, 7000, 700, .3, 'down'), 5.0)    # whip in
# vespas
place(sfx, pop(780, .3), 5.42, 1, -.25)
place(sfx, pop(1180, .3, True), 5.85, 1, .25)
# birds
place(sfx, hit(.25), 6.5)
place(sfx, pop(820, .3), 6.72, 1, -.25)
place(sfx, pop(1180, .3, True), 7.05, 1, .25)
# chess
place(sfx, hit(.35), 7.5)
for t_ in (8.55, 9.6, 10.0):
    place(sfx, buzz(.09), t_, 1, .15)
place(sfx, pop(1180, .28, True), 9.1, 1, -.2)
place(sfx, click(.4), 9.15, 1, .35)
# terrarium + karaoke
place(sfx, hit(.35), 10.5)
place(sfx, chime(91, .05, 1.0), 10.52, 1, .3)
place(sfx, hit(.3), 11.0)
place(sfx, pop(1180, .3, True), 11.04, 1, -.2)
place(sfx, noise_sweep(.3, 300, 6000, .28, 'up'), 11.2)  # blue floods in
place(sfx, hit(.95), 11.5)                                 # landing on blue
for i in range(5):
    place(sfx, noise_sweep(.35, 2500, 600, .05, 'down'), 11.52 + i * .06, 1, [-.6, .6, -.3, .4, 0][i])
# logo sting
place(sfx, chime(77, .14), 13.0, 1, -.1)
place(sfx, chime(84, .11), 13.12, 1, .1)

# ---------------- mix ----------------
def reverb(x, secs=1.6, mix=.18):
    t = t_arr(secs)
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t * 4.5)[:, None]
    ir = filt(ir, 'lowpass', 6000)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    wet /= np.max(np.abs(wet)) + 1e-9
    return x + wet * mix * np.max(np.abs(x))

music = reverb(music, 1.6, .22)
sfx = reverb(sfx, 1.0, .12)
# music silent before the freeze lands; duck under the freeze hit
env = np.ones(N)
tt = np.arange(N) / SR
env[tt < 1.95] = 0
env *= np.clip((tt - 1.95) / .05, 0, 1)
env *= np.where(tt > 13.6, np.clip(1 - (tt - 13.6) / 1.4, 0, 1) ** 1.5, 1)
mix = music * env[:, None] * .8 + sfx
mix = filt(mix, 'highpass', 28)
mix /= np.max(np.abs(mix)) / .9
fade = np.clip((DUR - tt) / .08, 0, 1)
mix *= fade[:, None]
wavfile.write('render/mix_raw.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
