"""Original sound design for "One Second" (fully synthesized: no samples, no licences).
Arc: bright UI room tone -> tap -> FREEZE (tape-stop + silence) -> a slowed, underwater
'inside the second' drone with one rising chime per step -> SNAP back (reverse swell + hit)
-> warm resolved chord + logo sting.
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR, DUR = 48000, 15.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
bed = np.zeros((N, 2))
sfx = np.zeros((N, 2))
T = np.arange(N) / SR


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


def pad(notes, d, g=.05, cutoff=1600, att=.5, rel=.8):
    t = ta(d); out = np.zeros(len(t))
    for m in notes:
        for det in (-.003, 0, .003):
            ph = (mtof(m) * (1 + det) * t) % 1
            out += 2 * ph - 1
    out = filt(out, 'lowpass', cutoff)
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, d - t) / rel)
    return out * env * g / len(notes)


def sine_tone(m, d, g, dec=3.0, harm=((1, 1),)):
    t = ta(d); f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in harm)
    return x * np.exp(-t * dec) * np.minimum(1, t / .004) * g


def chime(m, g=.12, d=2.2):
    return sine_tone(m, d, g, 1.6, ((1, 1), (2.0, .25), (3.01, .1), (4.2, .05)))


def click(g=.5):
    t = ta(.05)
    return (filt(rng.standard_normal(len(t)), 'bandpass', [2000, 7000]) * np.exp(-t * 260) +
            .6 * np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 400)) * g


def sweep(d, f0, f1, g=.25, shape='up'):
    t = ta(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = 1024
    for s in range(0, len(t), seg):
        fc = f0 * (f1 / f0) ** (s / len(t))
        out[s:s + seg] = filt(n[max(0, s - 2048):s + seg], 'bandpass', [fc * .6, min(fc * 1.6, 20000)])[-len(n[s:s + seg]):]
    env = (t / d) ** 2 if shape == 'up' else (1 - t / d) ** 2
    return out * env * g


def hit(g=.7, f_hi=90, f_lo=38):
    t = ta(1.2)
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 16)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) +
            filt(rng.standard_normal(len(t)), 'lowpass', 1200) * np.exp(-t * 18) * .35) * g


def tape_stop(sig_len=.5, m=57, g=.2):
    """pitch falls to zero: the sound of time stopping"""
    t = ta(sig_len)
    f = mtof(m) * (1 - t / sig_len) ** 1.6
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return filt(x, 'lowpass', 2000) * (1 - t / sig_len) * g


def ping(g=.25):
    a = sine_tone(84, .5, g, 7, ((1, 1), (2, .3)))
    b = sine_tone(88, .7, g, 5, ((1, 1), (2, .3)))
    out = np.zeros(int(.8 * SR)); out[:len(a)] += a; out[int(.09 * SR):int(.09 * SR) + len(b)] += b[:len(out) - int(.09 * SR)]
    return out


# ---------------- bed ----------------
# 0-1.32: light, airy UI room tone: soft major-7 pad and a gentle pulse
place(bed, pad([65, 69, 72, 76], 1.6, .05, 2400, .3, .2), 0.0)
for i, t0 in enumerate(np.arange(0.0, 1.3, .25)):
    place(bed, sine_tone(53 if i % 2 == 0 else 60, .25, .08, 9), t0)
# the hard stop: bed simply ends at 1.32 (silence is the effect)
cut = int(1.32 * SR); bed[cut:] = 0
# 1.6-10.5: inside the second: deep, slow, underwater drone + heartbeat sub
drone = pad([41, 48, 53, 60], 9.2, .07, 500, 1.2, 1.0)
place(bed, drone, 1.55)
for t0 in np.arange(2.52, 10.4, 1.0):
    place(bed, sine_tone(29, .6, .22, 6), t0)
    place(bed, sine_tone(29, .5, .12, 7), t0 + .22)
# 11.5-15: resolved, warm F major 9 bloom
place(bed, pad([53, 57, 60, 64, 67, 72], 3.6, .07, 2600, .25, 1.2), 11.5)
place(bed, sine_tone(41, 3.4, .25, .7), 11.5)

# ---------------- sound design ----------------
place(sfx, sweep(.7, 3000, 7000, .025, 'up'), .3)          # cursor glide (air)
place(sfx, click(.55), 1.2)                                 # the tap
place(sfx, tape_stop(.55, 69, .18), 1.25)                   # time stops
place(sfx, hit(.45, 70, 32), 1.32)                          # low thud under the freeze
place(sfx, sweep(.6, 200, 2500, .12, 'up'), 1.8)            # navy floods out of the button
place(sfx, sweep(.35, 600, 5000, .2, 'up'), 2.2)            # dive into the second
place(sfx, sweep(.45, 5000, 400, .16, 'down'), 2.52)
# step chimes: one rising note per step (F A C E) = F maj7 built across the second
for t0, m in [(3.45, 77), (5.97, 81), (7.78, 84), (9.32, 88)]:
    place(sfx, chime(m, .13), t0, 1, .15)
for t0 in (4.5, 6.5, 8.5):                                  # camera continuation pans
    place(sfx, sweep(.32, 800, 6000, .18, 'up'), t0, 1, -.4)
    place(sfx, sweep(.45, 6000, 700, .15, 'down'), t0 + .32, 1, .4)
place(sfx, sweep(1.0, 900, 2600, .05, 'up'), 5.0)           # gyroscope spin-up
for i in range(4):                                          # currency strands shimmer
    place(sfx, sine_tone(84 + [0, 3, 7, 10][i], .5, .05, 6), 7.32 + i * .04, 1, [-.6, -.2, .2, .6][i])
place(sfx, ping(.2), 9.32, 1, .2)                           # business notified
bz = np.sin(2 * np.pi * 165 * ta(.32)) * ((ta(.32) < .13) | ((ta(.32) > .18) & (ta(.32) < .3)))
place(sfx, filt(bz, 'lowpass', 500) * .16, 9.3, 1, .25)       # phone vibration
for i in range(4):                                          # coins flipping to face us
    place(sfx, sine_tone(96 + i * 2, .12, .05, 30, ((1, 1), (2.7, .4))), 7.3 + i * .04, 1, [-.5, -.15, .15, .5][i])
place(sfx, sweep(.5, 700, 3000, .08, 'up'), 7.75, 1, .3)      # euro coin spins in
# snap back: reverse swell into the hit, then "Paid"
place(sfx, sweep(.55, 300, 9000, .32, 'up'), 9.95)
place(sfx, hit(.85, 110, 40), 10.5)
place(sfx, sine_tone(76, .9, .14, 4, ((1, 1), (2, .2))), 10.84, 1, .1)
place(sfx, sine_tone(81, .9, .11, 4, ((1, 1), (2, .2))), 10.92, 1, -.1)
place(sfx, hit(.35, 80, 45), 11.5)                          # into the end card
place(sfx, chime(77, .12, 2.5), 13.0, 1, -.1)               # logo sting
place(sfx, chime(84, .09, 2.5), 13.1, 1, .1)


def reverb(x, secs, mix):
    t = ta(secs); ir = filt(rng.standard_normal((len(t), 2)) * np.exp(-t * 3.8)[:, None], 'lowpass', 7000)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + wet / (np.max(np.abs(wet)) + 1e-9) * mix * np.max(np.abs(x))


bed = reverb(bed, 2.2, .3)
sfx = reverb(sfx, 1.4, .18)
# keep the freeze truly silent in the bed (reverb tail cut, then drone fades in)
fz = (T >= 1.34) & (T < 1.55); bed[fz] *= 0
mix = bed * .85 + sfx
mix *= np.where(T > 13.8, np.clip(1 - (T - 13.8) / 1.2, 0, 1) ** 1.4, 1)[:, None]
mix = filt(mix, 'highpass', 25)
mix /= np.max(np.abs(mix)) / .9
wavfile.write('render/mix_raw.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
