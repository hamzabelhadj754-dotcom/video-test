"""Final soundtrack: the client's song slowed (0.88x, pitch down) + reverb as a background bed, ducked under the
sound effects, plus the recorded SFX with a shared room reverb. Writes assets/audio/mix_pre.wav (master with ffmpeg after).
Needs assets/music_src/song.wav (client-supplied, git-ignored) and assets/audio/sfx_pre.wav (tools/mix_sfx.py)."""
import os, subprocess
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
SR, DUR = 48000, 31.5; N = int(SR * DUR)
START, RATE = 9.0, 0.88          # song section start (s) and slowdown

# 1 · slowed song section (asetrate = tape-style slow: tempo and pitch drop together)
tmp = P("assets/music_src/slowed.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(START), "-i", P("assets/music_src/song.wav"), "-t", str(DUR * RATE + 0.5),
                "-af", f"asetrate={int(48000 * RATE)},aresample=48000", "-ac", "2", tmp], check=True)
m, sr = sf.read(tmp); assert sr == SR
m = np.pad(m, ((0, max(0, N - len(m))), (0, 0)))[:N]

def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    if lo: g *= 1 - 1 / (1 + (f / lo) ** 4)
    return np.fft.irfft(X * g[:, None], len(x), axis=0)
def reverb(x, rt, wet, seed, pre=0.02, tone=6000):
    r = np.random.default_rng(seed); n = int(rt * SR); t = np.arange(n) / SR; out = np.zeros_like(x)
    for ch in range(2):
        ir = r.normal(0, 1, n) * np.exp(-t * 6.9 / rt); ir[: int(pre * SR)] = 0
        X = np.fft.rfft(ir); f = np.fft.rfftfreq(n, 1 / SR); ir = np.fft.irfft(X / (1 + (f / tone) ** 2), n); ir /= np.sqrt((ir ** 2).sum())
        F = 1 << (len(x) + n - 1).bit_length(); y = np.fft.irfft(np.fft.rfft(x[:, ch], F) * np.fft.rfft(ir, F), F)[: len(x)]
        out[:, ch] = x[:, ch] * (1 - wet) + y * wet * 1.6
    return out
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)

# 2 · music bed: warm (cut lows/highs), big hall reverb, gentle fades
m = fft_filter(m, lo=45, hi=7500)
m = reverb(m, 3.2, 0.42, 11, pre=0.035, tone=4500)
fi, fo = int(0.6 * SR), int(30.3 * SR)
m[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2; m[fo:] *= np.linspace(1, 0, N - fo)[:, None] ** 1.5

# 3 · sound effects: shared room so they sit together
s, sr2 = sf.read(P("assets/audio/sfx_pre.wav")); assert sr2 == SR
s = np.pad(s, ((0, max(0, N - len(s))), (0, 0)))[:N]
s = fft_filter(s, lo=28)
s = reverb(s, 1.1, 0.16, 5, pre=0.015, tone=7000)

# 4 · sidechain: the bed ducks up to -6 dB whenever an effect hits (10 ms attack, 300 ms release)
hop = 240; e = np.abs(s).max(1)[: N // hop * hop].reshape(-1, hop).max(1); env = np.zeros_like(e); acc = 0.0
for i, v in enumerate(e): acc += (0.9 if v > acc else 1 - np.exp(-hop / SR / 0.3)) * (v - acc); env[i] = acc
k = np.clip(env / (np.percentile(env, 99) + 1e-9), 0, 1)
duck = np.interp(np.arange(N), np.arange(len(k)) * hop + hop / 2, 10 ** (-6 * k / 20))
m = m * duck[:, None]

# 5 · balance: bed about 9 dB under the effects' loud moments, then sum
m *= 10 ** ((db(s) - 6 - db(m)) / 20)
mix = s + m
mix = mix / np.abs(mix).max() * 0.89
sf.write(P("assets/audio/mix_pre.wav"), mix.astype(np.float32), SR)
sf.write(P("assets/audio/music_bed.wav"), (m / np.abs(m).max() * 0.89).astype(np.float32), SR)
print("sfx %.1f dB | bed %.1f dB" % (db(s), db(m)))
