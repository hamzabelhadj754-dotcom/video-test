"""GAINSDOM · MOTIVATION.EXE: original score + sound design, all synthesized (royalty-free), placed from timing.js.
Score: dark minimal trap / phonk feel, A minor, 96 BPM (the film's grid). Drone + clock ticks under the hook, silence on the
crash, drop on the truth, a rising arp while discipline installs, total silence before START NOW, the biggest hit on it,
a sub tail under the sign-off. Effects come from the film's event list (EV). Mix → loudness −14 LUFS, −1 dBTP.
Usage (from the film folder): python3 tools/audio.py   → audio/mix.wav
"""
import json, subprocess, sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, sawtooth, fftconvolve

SR = 48000
d = json.loads(subprocess.check_output(['node', 'tools/events.js']))
TL, EV, BEAT, B0 = d['TL'], d['EV'], d['BEAT'], d['B0']
DUR = TL['DUR']; N = int(SR * DUR)
rng = np.random.default_rng(3)
b = lambda k: B0 + BEAT * k

def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def bp(x, a, c): return sosfilt(butter(2, [a, c], btype='band', fs=SR, output='sos'), x)
def env(n, a, r):   # attack, exponential release (time constant r)
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
def note(m): return 440 * 2 ** ((m - 69) / 12)
class Bus:
    def __init__(s): s.L = np.zeros(N); s.R = np.zeros(N)
    def add(s, t, x, g=1.0, pan=0.0):
        a = int(round(t * SR))
        if a >= N: return
        if a < 0: x = x[-a:]; a = 0
        x = x[:N - a]; s.L[a:a + len(x)] += x * g * (1 - max(0, pan)); s.R[a:a + len(x)] += x * g * (1 + min(0, pan))
    def st(s): return np.stack([s.L, s.R], 1)
def reverb(x, secs=1.8, mix=.25):
    n = int(SR * secs); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2); ir = lp(ir, 5000); ir /= np.abs(ir).sum() ** .5 * 6
    return x + mix * fftconvolve(x, ir)[:len(x)]

# ---------- instruments
def kick(level=1.0, long=.45):
    n = int(SR * (long + .1)); t = np.arange(n) / SR; f = 48 + 110 * np.exp(-t * 34)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, long * .45); x += bp(rng.standard_normal(n), 2000, 7000) * env(n, .0003, .006) * .3
    return np.tanh(x * 1.6) * level
def sub808(m, dur, level=1.0, glide=0.0):
    n = int(SR * dur); t = np.arange(n) / SR; f = note(m) * (1 + glide * np.exp(-t * 10))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR); x = np.tanh(x * 2.2) * .8 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * .08
    e = np.minimum(1, t / .004) * np.minimum(1, (dur - t) / .05); return x * e * level
def clap(level=1.0):
    n = int(SR * .5); x = np.zeros(n)
    for k, dt in enumerate((0, .011, .022)):
        a = int(dt * SR); m = n - a; x[a:] += bp(rng.standard_normal(m), 900, 5200) * env(m, .0005, .05 if k == 2 else .008)
    return reverb(x, 1.4, .5) * level
def hat(level=1.0, open_=False):
    n = int(SR * (.25 if open_ else .05)); return hp(rng.standard_normal(n), 7000) * env(n, .0003, .08 if open_ else .012) * level
def pad(ms, dur, level=1.0, cut=900):
    n = int(SR * dur); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for c in (-8, 0, 8): x += sawtooth(2 * np.pi * note(m) * 2 ** (c / 1200) * t + rng.uniform(0, 6))
    x = lp(x / (3 * len(ms)), cut); e = np.minimum(1, t / min(.6, dur * .3)) * np.minimum(1, (dur - t) / min(.4, dur * .3))
    return x * e * level
def pluck(m, level=1.0, dec=.18):
    n = int(SR * .5); t = np.arange(n) / SR; x = sawtooth(2 * np.pi * note(m) * t) * .6 + np.sin(2 * np.pi * note(m) * 2 * t) * .3
    return lp(x, 2400) * env(n, .002, dec) * level
def drone(dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    x = sawtooth(2 * np.pi * 55 * t) + sawtooth(2 * np.pi * 55.4 * t) + .5 * np.sin(2 * np.pi * 27.5 * t)
    cut = 120 + 900 * (t / dur) ** 2; y = np.zeros(n); B = 2400
    for i in range(0, n, B): y[i:i + B] = lp(x[max(0, i - 512):i + B], cut[i])[-len(x[i:i + B]):]
    return y * np.minimum(1, t / .4) * level * .5

# ---------- sound effects
def hit(level=1.0):
    n = int(SR * 1.0); t = np.arange(n) / SR; f = 45 + 120 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .3) + bp(rng.standard_normal(n), 1200, 6000) * env(n, .0004, .015) * .5) * level
def boom(level=1.0):
    n = int(SR * 2.6); t = np.arange(n) / SR; f = 34 + 60 * np.exp(-t * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .9) + lp(rng.standard_normal(n), 700) * env(n, .005, .5) * .4) * level
def whoosh(dur=.4, level=1.0, up=True):
    n = int(SR * dur); x = rng.standard_normal(n); out = np.zeros(n); B = max(256, n // 40)
    for i in range(0, n, B):
        k = i / n; fc = (400 + 5000 * k ** 2) if up else (5400 - 5000 * k ** .5)
        out[i:i + B] = bp(x[max(0, i - 256):i + B], max(80, fc * .6), min(20000, fc * 1.6))[-len(x[i:i + B]):]
    return out * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * level
def tick(level=1.0):
    n = int(SR * .02); return np.sin(2 * np.pi * 3600 * np.arange(n) / SR) * env(n, .0002, .004) * level
def key(level=1.0):
    n = int(SR * .03); return bp(rng.standard_normal(n), 1800, 7000) * env(n, .0002, .005) * level + np.sin(2 * np.pi * rng.uniform(900, 1400) * np.arange(n) / SR) * env(n, .0002, .003) * level * .4
def click(level=1.0):
    n = int(SR * .05); return (bp(rng.standard_normal(n), 2500, 9000) * env(n, .0002, .008) + np.sin(2 * np.pi * 1700 * np.arange(n) / SR) * env(n, .0002, .006) * .6) * level
def glitchfx(dur=.08, level=1.0):
    n = int(SR * dur); x = np.zeros(n); i = 0
    while i < n:   # chopped, bit-crushed bursts
        m = int(SR * rng.uniform(.004, .014)); f = rng.choice([180, 440, 1250, 3100]); seg = np.sign(np.sin(2 * np.pi * f * np.arange(m) / SR)) * .6 + rng.standard_normal(m) * .5
        x[i:i + m] = seg[:n - i] * rng.uniform(.3, 1); i += m + int(SR * rng.uniform(0, .004))
    return np.round(x * 6) / 6 * level
def error_tone(level=1.0):
    out = np.zeros(int(SR * .45))
    for k, m in enumerate((57, 52)):
        n = int(SR * .2); t = np.arange(n) / SR; x = (np.sign(np.sin(2 * np.pi * note(m) * t)) * .3 + np.sin(2 * np.pi * note(m) * t)) * env(n, .003, .09)
        a = int(k * .13 * SR); out[a:a + n] += lp(x, 3000)
    return out * level
def chime(level=1.0):
    out = np.zeros(int(SR * 1.4))
    for k, m in enumerate((76, 81, 88)):
        n = int(SR * 1.1); t = np.arange(n) / SR; x = (np.sin(2 * np.pi * note(m) * t) + .3 * np.sin(2 * np.pi * note(m) * 2.76 * t) * np.exp(-t * 9)) * env(n, .002, .35)
        a = int(k * .07 * SR); out[a:a + n] += x
    return reverb(out, 1.6, .4) * level * .5
def zap(level=1.0):
    n = int(SR * .2); t = np.arange(n) / SR; f = 3800 * np.exp(-t * 18) + 60
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .07) * level

# ---------- score
mus = Bus()
mus.add(TL['hook'], drone(TL['black1'] - TL['hook'], .55))
mus.add(TL['hook'], sub808(45, 1.2, .55, glide=.6))
k = b(2)                                                       # clock ticks: the waiting, louder each beat
while k < TL['glitch1']: mus.add(k, tick(.5 + .4 * (k - b(2)))); mus.add(k, hat(.08)); k += BEAT / 2
mus.add(b(3), whoosh(TL['win'] - b(3), .22))                   # pressure into the error
# the drop: from YOU'RE to the collapse
bass = {5: 45, 6: 45, 7: 45, 8: 41, 9: 41, 10: 45, 11: 45, 12: 43, 13: 43, 14: 40, 15: 40, 16: 45, 17: 45}
for bt in range(5, 18):
    t = b(bt); mus.add(t, kick(.9)); mus.add(t, sub808(bass[bt], BEAT * .95, .55, glide=.3 if bt in (5, 8, 12) else 0))
    if bt % 2 == 0: mus.add(t, clap(.45))
    for s in range(4 if bt >= 10 else 2):
        mus.add(t + s * BEAT / (4 if bt >= 10 else 2), hat(.14 if s % 2 == 0 else .08))
mus.add(b(5), pad([57, 60, 64], b(9) - b(5), .22)); mus.add(b(9), pad([53, 57, 60], b(10) - b(9), .22))
mus.add(b(10), pad([57, 60, 64], b(14) - b(10), .2, 1200)); mus.add(b(14), pad([52, 55, 59], TL['collapse'] - b(14), .2, 1400))
arp = [69, 72, 76, 79, 81, 84]                                 # discipline installing: an 8th-note arp that keeps climbing
for i in range(int((TL['done'] - TL['install']) / (BEAT / 2))):
    mus.add(TL['install'] + i * BEAT / 2, pluck(arp[i % 6] + 12 * (i // 6 >= 1) * 0 + (i // 6) * 2, .16), pan=.25 if i % 2 else -.25)
mus.add(TL['done'], pad([69, 72, 76, 81], TL['collapse'] - TL['done'], .16, 2600))
# silence: TL.collapse → TL.start (nothing at all)
for bt in (19, 19.5, 20, 20.5):                                 # the action
    t = b(bt); mus.add(t, kick(1.0 if bt == 19 else .85)); mus.add(t, sub808(45 if bt < 20 else 43, BEAT * .5, .6, glide=.5 if bt == 19 else 0))
    for s in range(4): mus.add(t + s * BEAT / 8, hat(.13))
    if bt in (20,): mus.add(t, clap(.55))
mus.add(b(19), pad([57, 60, 64, 69], TL['glitch3'] - b(19), .25, 1800))
mus.add(TL['glitch3'] + .05, sub808(33, 1.8, .5)); mus.add(TL['sign'], pad([45, 52, 57], DUR - TL['sign'], .14, 700))
M = mus.st()
M[int(TL['collapse'] * SR):int(TL['start'] * SR)] = 0           # hard silence before START NOW
M[int(TL['black1'] * SR):int(TL['you'] * SR)] *= .0             # the task is killed: dead air
fo = int(.3 * SR); M[-fo:] *= np.linspace(1, 0, fo)[:, None]

# ---------- effects from the film's events
fx = Bus()
for typ, t, *ex in EV:
    ex = ex[0] if ex else {}
    if typ == 'slam':
        big = ex.get('big', 0); fx.add(t, hit(.8 + .2 * big)); fx.add(t, boom(.55 + .3 * big))
        if ex.get('accent'): fx.add(t, glitchfx(.03, .15))
    elif typ == 'slamS': fx.add(t, hit(.45))
    elif typ == 'cutfx': fx.add(t - .06, whoosh(.16, .25))
    elif typ == 'roll':
        for i in range(24): fx.add(t + ex['dur'] * (i / 24) ** 1.6, tick(.35))
    elif typ == 'type':
        cps = ex.get('cps', 40)
        for i in range(ex['n']): fx.add(t + i / cps, key(.25), pan=rng.uniform(-.2, .2))
    elif typ == 'error': fx.add(t, error_tone(.5))
    elif typ == 'move': fx.add(t, whoosh(ex['dur'], .12))
    elif typ == 'click': fx.add(t, click(.7))
    elif typ == 'glitch': fx.add(t, glitchfx(.09, .6))
    elif typ == 'whoosh': fx.add(t - .05, whoosh(ex['dur'] + .1, .35))
    elif typ == 'strike': fx.add(t, whoosh(ex['dur'], .3, up=True))
    elif typ == 'check': fx.add(t, click(.6)); fx.add(t + .01, tick(.3))
    elif typ == 'complete': fx.add(t, chime(.7))
    elif typ == 'off': fx.add(t, zap(.35))
    elif typ == 'tag': fx.add(t, tick(.3))
for t in (TL['now'] + BEAT / 2, TL['now'] + BEAT): fx.add(t - .05, whoosh(.14, .22))   # action footage cuts
X = fx.st()

mix = M * .62 + X
mix = np.tanh(mix * 1.1) / 1.1
mix *= .5 / max(1e-6, np.abs(mix).max())
os.makedirs('audio', exist_ok=True); sf.write('audio/raw.wav', mix, SR, subtype='PCM_24')
subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/raw.wav', '-af', 'loudnorm=I=-14:TP=-1.2:LRA=9', '-ar', '48000', 'audio/mix.wav'])
os.remove('audio/raw.wav')
out = subprocess.run(['ffmpeg', '-nostdin', '-i', 'audio/mix.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print('\n'.join(l for l in out.splitlines() if l.strip().startswith(('I:', 'Peak:')))[-200:])
