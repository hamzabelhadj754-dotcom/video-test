"""Synthesize the HIDRA music bed (assets/music.wav), locked to the film's scene timing.

0 - 16.4 s   dark open: sub drone, pad, clock-like ticks, riser into the reveal
16.4 - 80 s  light world: 100 BPM groove (Am - F - C - G), drop on the reveal
80 - 88 s    close: drums out, pad and pluck resolve, ring-out

Deterministic: the noise generator is seeded.
"""
import os
import numpy as np
import soundfile as sf
from scipy import signal

SR = 44100
DUR = 88.0
BPM = 100.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
T_DROP = 16.4
T_CLOSE = 80.0
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)

N = int(DUR * SR)
t_all = np.arange(N) / SR
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= N or i + len(sig) <= 0:
        return
    j0 = max(0, -i)
    i = max(0, i)
    n = min(len(sig) - j0, N - i)
    buf[i:i + n] += sig[j0:j0 + n] * gain


def place_st(start, sig, gain=1.0, pan=0.0):
    place(L, start, sig, gain * np.sqrt(0.5 * (1 - pan)))
    place(R, start, sig, gain * np.sqrt(0.5 * (1 + pan)))


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


_SAW_TABLES = {}


def saw(freq, n, phase=0.0):
    # Band-limited saw via a cached single-cycle wavetable (harmonics up to 9 kHz).
    harmonics = max(1, min(40, int(9000 // freq)))
    table = _SAW_TABLES.get(harmonics)
    if table is None:
        x = np.arange(4096) / 4096
        table = sum(np.sin(2 * np.pi * k * x) / k for k in range(1, harmonics + 1))
        _SAW_TABLES[harmonics] = table
    pos = (freq * np.arange(n) / SR + phase / (2 * np.pi)) % 1.0
    return np.interp(pos * 4096, np.arange(4096), table) * 0.55


# ---------------------------------------------------------------- instruments
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 300) * 0.25
    return np.tanh((body + click) * 1.4)


def clap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 3800)
    e = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        e += np.where(t >= off, np.exp(-(t - off) * 120), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) * 16) * 0.6, 0)
    return noise * e * 0.6


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 7000, 3)
    return noise * np.exp(-t * (14 if open_ else 70)) * 0.35


def tick():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) + 0.4 * hp(rng.standard_normal(n), 5000)) * np.exp(-t * 160) * 0.3


def pluck(freq, length=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(4 * np.pi * freq * t) + 0.18 * np.sin(6 * np.pi * freq * t))
    return lp(tone * np.exp(-t * 9), 5200)


def pad_chord(notes, length, bright=2400):
    n = int(length * SR)
    out = np.zeros(n)
    for i, m in enumerate(notes):
        f = midi(m)
        for det in (-0.12, 0.0, 0.11):
            out += saw(f * 2 ** (det / 12), n, phase=i * 0.7 + det * 3)
    out = lp(out / (len(notes) * 3), bright)
    return out * env_adsr(n, 0.5, 0.3, 0.85, 0.7)


def bass_note(m, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = midi(m)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sign(np.sin(2 * np.pi * f * t)) * 0.5
    return lp(tone, 420) * env_adsr(n, 0.005, 0.12, 0.7, 0.05)


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    chunks = 40
    for c in range(chunks):
        a, b = c * n // chunks, (c + 1) * n // chunks
        fc = 300 + (c / chunks) ** 2 * 7000
        out[a:b] = bp(x[a:b], fc, fc * 1.6)
    sweep = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / length) ** 2) / SR) * 0.15
    return (out * 0.5 + sweep) * (t / length) ** 2.2


def impact():
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    air = lp(rng.standard_normal(n), 1800) * np.exp(-t * 3.5) * 0.35
    return np.tanh((boom + air) * 1.2)


# --------------------------------------------------------------- arrangement
# Chords (MIDI): Am, F, C, G  — voiced around middle C.
CHORDS = [
    ([57, 60, 64, 67], 45),   # Am7  (bass A2)
    ([53, 57, 60, 64], 41),   # Fmaj7 (bass F2)
    ([55, 60, 64, 67], 48),   # C/G  (bass C3)
    ([55, 59, 62, 67], 43),   # G    (bass G2)
]

pad_bus = np.zeros(N)
bass_bus = np.zeros(N)
drum_bus_L = np.zeros(N)
sc = np.ones(N)  # sidechain gain

# Dark open: low drone + Am pad swelling, ticks on every beat from the problem scene.
drone_n = int(T_DROP * SR)
td = np.arange(drone_n) / SR
drone = (np.sin(2 * np.pi * midi(33) * td) * 0.5 + np.sin(2 * np.pi * midi(45) * td) * 0.2)
drone *= np.clip(td / 3.0, 0, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * td / 6.0) ** 2)
place(pad_bus, 0, lp(drone, 300), 0.55)
place(pad_bus, 0.0, pad_chord([57, 60, 64, 71], 8.2, bright=900), 0.5)
place(pad_bus, 7.2, pad_chord([53, 57, 60, 64], 4.6, bright=1100), 0.5)
place(pad_bus, 11.6, pad_chord([55, 59, 62, 67], 5.0, bright=1300), 0.5)
b = 7.2
while b < T_DROP - 0.3:
    place_st(b, tick(), 0.55, pan=0.35 if int(round(b / BEAT)) % 2 else -0.35)
    b += BEAT
# Sparse low pulses for tension in the problem scene.
b = 7.2
while b < T_DROP - 1.0:
    place(bass_bus, b, bass_note(45, 0.32), 0.22)
    b += BEAT * 2
place_st(T_DROP - 2.2, riser(2.2), 0.7)
place_st(T_DROP, impact(), 0.9)

# Light world groove.
bar_i = 0
t0 = T_DROP
while t0 < T_CLOSE - 0.01:
    notes, broot = CHORDS[bar_i % 4]
    blen = min(BAR, T_CLOSE - t0)
    place(pad_bus, t0, pad_chord(notes, blen + 0.6, bright=2600), 0.42)
    for step in range(8):
        st = t0 + step * BEAT / 2
        if st >= T_CLOSE:
            break
        m = broot if step % 2 == 0 else broot + 12
        place(bass_bus, st, bass_note(m, BEAT / 2 * 0.9), 0.55)
    # Pluck arpeggio in 16ths, two octaves up, gentle pattern.
    arp = [0, 2, 1, 3, 2, 1, 3, 2]
    for step in range(16):
        st = t0 + step * BEAT / 4
        if st >= T_CLOSE or step % 4 == 3:
            continue
        m = notes[arp[step % 8]] + 12
        pan = 0.4 if step % 2 else -0.4
        g = 0.16 if step % 4 == 0 else 0.1
        place_st(st, pluck(midi(m), 0.45), g, pan)
        place_st(st + BEAT * 0.75, pluck(midi(m), 0.45), g * 0.35, -pan)  # dotted-8th echo
    for beat in range(4):
        bt = t0 + beat * BEAT
        if bt >= T_CLOSE:
            break
        # First bar after the drop: kick only on 1 so the reveal breathes.
        if bar_i > 0 or beat == 0:
            k = kick()
            place_st(bt, k, 0.85)
            e = np.ones(int(0.32 * SR))
            e = 1 - 0.6 * np.exp(-np.arange(len(e)) / SR * 9)
            i = int(bt * SR)
            n = min(len(e), N - i)
            sc[i:i + n] = np.minimum(sc[i:i + n], e[:n])
        if bar_i > 0 and beat in (1, 3):
            place_st(bt, clap(), 0.5, 0.05)
        if bar_i > 1:
            place_st(bt + BEAT / 2, hat(open_=(beat == 3)), 0.5, 0.25)
            place_st(bt, hat(), 0.25, -0.25)
    bar_i += 1
    t0 += BAR

# Close: drums out, sustained Fmaj7 -> Am(add9) resolve with a few plucks.
place(pad_bus, T_CLOSE, pad_chord([53, 57, 60, 64, 69], 4.0, bright=1800), 0.5)
place(pad_bus, T_CLOSE + 3.6, pad_chord([57, 60, 64, 71], 4.4, bright=1500), 0.5)
place(bass_bus, T_CLOSE, bass_note(41, 3.6), 0.5)
place(bass_bus, T_CLOSE + 3.6, bass_note(45, 4.2), 0.5)
for k, m in enumerate([72, 76, 79, 81, 76, 72]):
    place_st(T_CLOSE + 0.3 + k * BEAT, pluck(midi(m), 0.9), 0.14, -0.3 + 0.12 * k)
place_st(T_CLOSE, impact(), 0.35)

# ------------------------------------------------------------------- mixdown
pad_bus *= sc
bass_bus *= sc
L += pad_bus * 0.9 + bass_bus
R += pad_bus * 0.9 + bass_bus
# Light stereo widening on the pad via a short Haas delay on the right channel.
d = int(0.012 * SR)
R[d:] += pad_bus[:-d] * 0.18

mix = np.stack([L, R], axis=1)
fade = int(1.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.max(np.abs(mix))
sf.write(os.path.join(ROOT, "assets", "music.wav"), mix.astype(np.float32), SR)
print("wrote assets/music.wav", mix.shape[0] / SR, "s")
