"""TRAZO · "Un solo trazo" — original synthesized score, arranged to the film's sections (A minor / C major, 100 BPM).
Sections (film seconds): drone → pen arpeggio → light plucks on paper → groove (clientes) → build + silence → drop on
"Captación" → groove → lift (SMART) → stripped (supervisión) → riser + breakdown (motivación) → groove → riser → silence →
final chord. Writes audio/score.wav (48 kHz stereo). Usage: python3 tools/score.py
"""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, sawtooth

SR = 48000; DUR = 96.4; N = int(SR * DUR)
BPM = 100; BEAT = 60 / BPM; BAR = BEAT * 4; S16 = BEAT / 4
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N); REV = np.zeros(N)          # dry stereo + reverb send (mono)
KICKS = []                                                   # for sidechain

def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], btype='band', fs=SR, output='sos'), x)
def add(t, x, gain=1.0, pan=0.0, rev=0.0):
    a = int(t * SR)
    if a >= N or a + len(x) <= 0: return
    if a < 0: x = x[-a:]; a = 0
    x = x[:N - a]
    L[a:a + len(x)] += x * gain * (1 - max(0, pan)); R[a:a + len(x)] += x * gain * (1 + min(0, pan)); REV[a:a + len(x)] += x * gain * rev
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, sus, na) if na < n else np.linspace(0, sus, n)[:na]
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def note(m): return 440 * 2 ** ((m - 69) / 12)

# ----- instruments
def pad(midis, dur, cutoff=1400, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in midis:
        f = note(m)
        for d in (-7, 0, 7):  # cents
            x += sawtooth(2 * np.pi * f * 2 ** (d / 1200) * t + rng.uniform(0, 6))
    x = lp(x / (3 * len(midis)), cutoff * bright)
    return x * env(n, min(.9, dur * .4), min(.9, dur * .4))
def pluck(m, dur=.42, dec=6.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = note(m); x = np.zeros(n)
    for h in range(1, 9): x += np.sin(2 * np.pi * f * h * t) / h * np.exp(-t * (dec + h * 3.2))
    return x * np.minimum(1, t / .003) * .55
def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = note(m)
    x = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t)
    return np.tanh(1.6 * x) * env(n, .008, .06) * .6
def kick(level=1.0):
    n = int(SR * .5); t = np.arange(n) / SR; f = 48 + 110 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 120) * .15
    return np.tanh(x * 1.4) * level
def clap(level=1.0):
    n = int(SR * .25); x = np.zeros(n); nz = bp(rng.standard_normal(n), 900, 3500)
    for d in (0, .011, .023): a = int(d * SR); e = np.exp(-np.arange(n - a) / SR * 38); x[a:] += nz[a:] * e
    return x * .5 * level
def hat(level=1.0, open_=False):
    n = int(SR * (.18 if open_ else .05)); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500) * np.exp(-t * (14 if open_ else 70)) * .22 * level
def bell(m, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = note(m)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + .2 * np.sin(2 * np.pi * f * 4.1 * t) * np.exp(-t * 9)) * np.exp(-t * 2.2) * np.minimum(1, t / .004) * .35
def riser(dur, level=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); nz = rng.standard_normal(n)
    blocks = 40; Lb = n // blocks
    for i in range(blocks):
        fc = 400 + 7000 * (i / blocks) ** 2; seg = nz[i * Lb:(i + 1) * Lb + 512]
        y = bp(seg, max(60, fc * .5), min(20000, fc * 1.5))[:Lb]; x[i * Lb:i * Lb + len(y)] = y
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / dur)) / SR) * .25
    return (x * .6 + tone) * (t / dur) ** 2.4 * level
def drone(dur, m=33):
    n = int(dur * SR); t = np.arange(n) / SR; f = note(m)
    x = lp(sawtooth(2 * np.pi * f * t) + sawtooth(2 * np.pi * f * 1.005 * t), 300) + .5 * np.sin(2 * np.pi * f / 2 * t)
    return x * env(n, 1.0, .4) * .35

# ----- harmony: Am – F – C – G (and a lift variant)
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55, 59], [55, 59, 62]]     # pad voicings
ROOT = [45, 41, 48, 43]                                              # bass roots
ARP = [[69, 72, 76, 72], [65, 69, 72, 69], [67, 72, 76, 79], [67, 71, 74, 71]]
def bar_index(t): return int(np.floor(t / BAR + 1e-6))

def section_pads(t0, t1, cutoff=1300, gain=.55, rev=.35):
    b = bar_index(t0); t = b * BAR
    while t < t1:
        s, e = max(t, t0), min(t + BAR, t1)
        if e - s > .05: add(s, pad(CH[b % 4], e - s + .4, cutoff), gain, 0, rev)
        b += 1; t += BAR
def section_plucks(t0, t1, gain=.32, every=1, rev=.3, oct_=0):
    k = int(np.ceil(t0 / S16)); t = k * S16
    while t < t1:
        if k % every == 0:
            b = bar_index(t); step = k % 4
            add(t, pluck(ARP[b % 4][step] + 12 * oct_), gain * (1 if step == 0 else .75), .35 if step % 2 else -.35, rev)
        k += 1; t = k * S16
def section_drums(t0, t1, kick_=True, clap_=True, hats=True, hgain=1.0, avoid=()):
    k = int(np.ceil(t0 / (BEAT / 2))); t = k * BEAT / 2
    while t < t1 - .02:
        if not any(a <= t < b for a, b in avoid):
            beat = k // 2
            if k % 2 == 0 and kick_ and beat % 2 == 0: add(t, kick(.9), 1.0); KICKS.append(t)
            if k % 2 == 0 and clap_ and beat % 2 == 1: add(t, clap(), .55, .1, .25)
            if hats: add(t, hat(.8 if k % 2 else .5, open_=(k % 8 == 7)), hgain, .25)
        k += 1; t = k * BEAT / 2
def section_bass(t0, t1, gain=.55, pattern='8th'):
    k = int(np.ceil(t0 / (BEAT / 2))); t = k * BEAT / 2
    while t < t1 - .02:
        b = bar_index(t)
        if pattern == '8th' or (pattern == 'off' and k % 2 == 1) or (pattern == 'quarter' and k % 2 == 0):
            add(t, bass(ROOT[b % 4], BEAT / 2 * .9), gain)
        k += 1; t = k * BEAT / 2
def roll(t0, t1, gain=.5):
    t = t0
    while t < t1:
        q = (t - t0) / (t1 - t0); add(t, clap(.5 + .5 * q), gain * (.4 + .6 * q), 0, .2)
        t += .16 - .12 * q

# ----- arrangement (film seconds)
add(0.0, drone(3.3), .45, 0, .2)                                     # cold open drone
add(.0, riser(1.2), .35)                                            # into the YASSER slam (1.25)
for i, m in enumerate([69, 72, 76, 81, 84, 88, 93, 88, 84, 81, 76, 72, 76, 81, 84, 88]):   # the pen draws: rising arpeggio
    add(1.62 + i * .095, pluck(m, .5, 5), .26, (-.5 + i / 15), .45)
section_pads(3.25, 9.75, cutoff=1100, gain=.45, rev=.45)            # paper: light
section_plucks(3.25, 9.6, gain=.26, every=2, rev=.4)
for t in np.arange(4.8, 9.6, BEAT / 2): add(t, hat(.35), .6, .3)    # ticking lightly
section_pads(9.75, 18.55, cutoff=1400, gain=.5)                     # clientes: groove A
section_drums(9.75, 18.2, clap_=True, hats=True)
section_bass(9.75, 18.2, .5, 'quarter')
section_plucks(9.75, 18.3, gain=.22, every=2)
section_pads(18.55, 21.84, cutoff=2200, gain=.55)                   # funciones: build
section_drums(18.55, 20.4, clap_=False, hats=True, hgain=1.2)
section_bass(18.55, 21.5, .45, '8th')
add(19.8, riser(2.0), .7); roll(20.6, 21.75, .55)                   # snare roll, then silence 21.75–22.0
for c in (22.0, 28.8, 35.55, 41.1):                                 # word slams: groove resumes on each word
    pass
section_pads(22.0, 46.4, cutoff=1700, gain=.5)                      # functions: groove B
section_drums(22.0, 46.2, avoid=[(28.62, 28.82), (35.37, 35.57), (40.92, 41.12)])
section_bass(22.0, 46.2, .55, '8th')
section_plucks(22.0, 46.2, gain=.24, every=1)
add(45.0, riser(.9), .4)
section_pads(46.4, 60.95, cutoff=2400, gain=.55)                    # SMART: lift
section_drums(46.9, 60.7)
section_bass(46.4, 60.7, .55, '8th')
section_plucks(46.4, 60.7, gain=.22, every=2, oct_=1)
for t, m in ((49.24, 84), (54.22, 86), (57.54, 88)): add(t, bell(m), .5, 0, .6)   # each objective gets a bell
section_pads(60.95, 67.75, cutoff=1000, gain=.45)                   # supervisión: stripped
section_drums(60.95, 67.4, clap_=False, hats=True, hgain=.7)
section_bass(60.95, 67.4, .4, 'quarter')
add(66.9, riser(1.7), .55)                                          # into the 1:09 carry
section_pads(68.4, 73.3, cutoff=800, gain=.5, rev=.55)              # motivación: breakdown, heartbeat
for t in np.arange(68.6, 73.0, BEAT * 2): add(t, kick(.6), .8); add(t + .22, kick(.4), .6)
section_plucks(70.1, 73.2, gain=.2, every=2, rev=.5)
section_pads(73.3, 89.6, cutoff=1600, gain=.5)                      # factores + organigrama: groove
section_drums(73.6, 88.8)
section_bass(73.3, 88.8, .5, '8th')
section_plucks(73.3, 88.8, gain=.22, every=2)
add(88.0, riser(1.6), .75); roll(88.6, 89.55, .5)                   # final build … then silence 89.6–89.94
fin = pad([48, 55, 60, 62, 64, 67], 6.4, 1800); add(89.94, fin, .75, 0, .6)  # C add9 resolves on "Trazo"
add(89.94, bell(84, 3.0), .45, 0, .7); add(90.1, bell(91, 3.0), .3, .3, .7)
for t in np.arange(91.2, 95.8, BEAT): add(t, pluck(ARP[2][int((t - 91.2) / BEAT) % 4] + 12, .6, 4), .14, .2, .6)

# ----- sidechain (pads/plucks breathe with the kick), reverb, silence windows, master
sc = np.ones(N)
for t in KICKS:
    a = int(t * SR); n = int(.28 * SR); seg = 1 - .45 * np.exp(-np.arange(n) / SR * 14)
    sc[a:a + n] = np.minimum(sc[a:a + n], seg[:max(0, min(n, N - a))])
ir_n = int(2.4 * SR); tt = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-tt * 2.6); irR = rng.standard_normal(ir_n) * np.exp(-tt * 2.6)
irL = lp(irL, 6000); irR = lp(irR, 6000)
wetL = fftconvolve(REV, irL)[:N] * .02; wetR = fftconvolve(REV, irR)[:N] * .02
L = L * sc + wetL; R = R * sc + wetR
for a, b in ((21.78, 21.98), (89.6, 89.93)):                        # silence before the slams
    ia, ib = int(a * SR), int(b * SR); fade = int(.03 * SR)
    for X in (L, R):
        X[ia - fade:ia] *= np.linspace(1, 0, fade); X[ia:ib] = 0; X[ib:ib + fade] *= np.linspace(0, 1, fade)
fi, fo = int(.6 * SR), int(3.0 * SR)
for X in (L, R): X[:fi] *= np.linspace(0, 1, fi); X[-fo:] *= np.linspace(1, 0, fo)
mix = np.stack([L, R], 1); mix = np.tanh(mix * 1.1) / 1.1; mix /= np.max(np.abs(mix)) + 1e-9; mix *= .89
sf.write('audio/score.wav', mix.astype(np.float32), SR)
print('wrote audio/score.wav', mix.shape, 'kicks', len(KICKS))
