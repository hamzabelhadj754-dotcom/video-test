"""TRAZO sound design: synthesized, original, royalty-free.
Usage: python3 tools/sound.py <cues.json> <out.wav>
cues.json: {"duration": 8, "bpm": 112, "music": true, "cues": [{"t": 0.25, "type": "hit"}, ...]}
types: hit (sub thump), whoosh (filtered noise sweep, needs "dur"), click (UI tick), riser (needs "dur"),
       pop (soft tonal blip), tick (counter), shimmer (light sweep), boom (end-card impact)
"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)

def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e

def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)

def lp(x, f):
    return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)

def hit(level=1.0):
    n = int(SR * 1.2); t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .55, 5)
    click = bp(rng.standard_normal(n), 1500, 6000) * env(n, .0005, .02, 9) * .25
    return (body + click) * level

def boom(level=1.0):
    n = int(SR * 3.0); t = np.arange(n) / SR
    f = 38 + 70 * np.exp(-t * 14)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, 1.6, 4)
    air = lp(rng.standard_normal(n), 900) * env(n, .01, 1.2, 5) * .35
    return (body + air) * level

def whoosh(dur=.8, level=.7, up=True):
    n = int(SR * dur); x = rng.standard_normal(n); out = np.zeros(n)
    blocks = 48; L = n // blocks
    for i in range(blocks):
        k = i / blocks; fc = (300 + 5500 * k ** 2) if up else (5800 - 5500 * k ** .5)
        seg = x[i * L:(i + 1) * L + 256]
        y = bp(seg, max(80, fc * .6), min(20000, fc * 1.6))[:L]
        out[i * L:i * L + len(y)] = y
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return out * shape * level * 1.6

def riser(dur=2.0, level=.5):
    n = int(SR * dur); t = np.arange(n) / SR
    f = 180 * (2 ** (2.2 * t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    noise = bp(rng.standard_normal(n), 2000, 9000) * .5
    return (tone * .35 + noise) * (t / dur) ** 2.2 * level

def click(level=.35):
    n = int(SR * .06)
    return bp(rng.standard_normal(n), 2500, 9000) * env(n, .0003, .012, 8) * level + np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, .0003, .01, 8) * level * .5

def pop(level=.3, f=880):
    n = int(SR * .35); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t)) * env(n, .002, .12, 6) * level

def tick(level=.18):
    n = int(SR * .025)
    return np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env(n, .0002, .006, 8) * level

def shimmer(dur=2.0, level=.25):
    n = int(SR * dur); t = np.arange(n) / SR; out = np.zeros(n)
    for f in (1760, 2217, 2637, 3520):
        out += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(3, 7) * t))
    return out / 4 * np.sin(np.linspace(0, np.pi, n)) ** 2 * level

def music(duration, bpm, start=0.0, sections=None):
    """Minimal original bed: warm pad chords + soft pulse + kick/hat from `start`."""
    n = int(SR * duration); t = np.arange(n) / SR; out = np.zeros(n)
    beat = 60 / bpm
    chords = [[110, 164.8, 220, 261.6], [87.3, 130.8, 174.6, 220], [98, 146.8, 196, 246.9], [82.4, 123.5, 164.8, 207.7]]
    bar = beat * 4
    for i in range(int(duration / bar) + 1):
        c = chords[i % 4]; a = int(i * bar * SR); b = min(n, int((i + 1) * bar * SR) + int(SR * .5))
        if a >= n: break
        tt = np.arange(b - a) / SR
        pad = sum(np.sin(2 * np.pi * f * tt) + .35 * np.sin(2 * np.pi * f * 2.003 * tt) for f in c)
        e = np.minimum(1, tt / .6) * np.minimum(1, np.maximum(0, (b - a) / SR - tt) / .5)
        out[a:b] += lp(pad, 1400) * e * .05
    # pulse: plucked 8ths on root/fifth
    for k in range(int(duration / (beat / 2))):
        tk = k * beat / 2
        if tk < start: continue
        a = int(tk * SR); m = int(SR * .25)
        if a + m > n: break
        f = chords[int(tk / bar) % 4][0] * (2 if k % 2 else 4)
        tt = np.arange(m) / SR
        out[a:a + m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 22) * .07
    # kick on 1 & 3, soft hat on offbeats
    for k in range(int(duration / beat)):
        tk = k * beat
        if tk < start: continue
        a = int(tk * SR)
        if k % 2 == 0:
            h = hit(.38)[: n - a]; out[a:a + len(h)] += h
        ah = int((tk + beat / 2) * SR); m = int(SR * .05)
        if ah + m < n:
            out[ah:ah + m] += bp(rng.standard_normal(m), 7000, 14000) * env(m, .0005, .02, 8) * .06
    return out

def build(spec):
    D = spec['duration']; n = int(SR * D); mix = np.zeros((n, 2))
    if spec.get('music'):
        m = music(D, spec.get('bpm', 112), spec.get('music_start', 0))
        fi, fo = int(SR * spec.get('music_fade_in', 1.5)), int(SR * spec.get('music_fade_out', 2))
        m[:fi] *= np.linspace(0, 1, fi); m[-fo:] *= np.linspace(1, 0, fo)
        for a, b in spec.get('duck', []):  # silence windows before big hits
            ia, ib = int(a * SR), int(b * SR); m[ia:ib] *= .15
        mix += np.stack([m, m], 1) * spec.get('music_level', 1.0)
    gen = dict(hit=hit, boom=boom, whoosh=whoosh, riser=riser, click=click, pop=pop, tick=tick, shimmer=shimmer)
    for c in spec['cues']:
        kw = {k: v for k, v in c.items() if k not in ('t', 'type', 'pan')}
        x = gen[c['type']](**kw); a = int(c['t'] * SR)
        if a >= n: continue
        x = x[: n - a]; p = c.get('pan', 0)
        mix[a:a + len(x), 0] += x * (1 - max(0, p)); mix[a:a + len(x), 1] += x * (1 + min(0, p))
    # gentle bus: soft clip + normalize to about -14 LUFS-ish peak target, true peak < -1 dB
    mix = np.tanh(mix * 1.2) / 1.2
    mix *= 10 ** (-1.5 / 20) / max(1e-6, np.abs(mix).max())
    return mix

if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    sf.write(sys.argv[2], build(spec), SR, subtype='PCM_24')
    print('wrote', sys.argv[2])
