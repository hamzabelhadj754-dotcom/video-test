# sound.py: the designed sound bed for the fly-over, synthesised from scratch (no samples, nothing to license).
# python3 render/sound.py out.wav
# Cues come from the brief: whooshes on 8.66 and 9.80, the hit on 9.97. Silence just before the hit.
import sys, numpy as np
from scipy import signal
from scipy.io import wavfile

SR, DUR = 48000, 14.5
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
db = lambda x: 10 ** (x / 20)

def smooth(a, b, x):                      # smootherstep, vectorised
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * u * (u * (6 * u - 15) + 10)
def bp(x, lo, hi, order=4): return signal.sosfiltfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=4): return signal.sosfiltfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=4): return signal.sosfiltfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x)
def pink(n):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[1:] /= np.sqrt(f[1:]); X[0] = 0
    y = np.fft.irfft(X, n); return y / np.abs(y).max()
def pan(x, p):                            # equal-power, p in [-1, 1] (scalar or array)
    a = (np.asarray(p) + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)])
def speed_share(tt):                      # mirrors film/scene.js speedShare
    s = np.where(tt <= 0.6, 0.5 * smooth(0, 0.6, tt), 0.5)
    s = np.where(tt > 1.25, 0.5 + 0.5 * smooth(1.25, 1.6, tt), s)
    s = np.where(tt > 1.6, 1.0, s)
    s = np.where(tt > 7.3, 1.0 - 0.88 * smooth(7.3, 8.3, tt), s)
    return s
def swept_noise(t0, t1, f0, f1, peak, attack_shape=2.0, release_shape=3.0, octaves=1.1):
    """noise through a band that glides from f0 to f1 (log), swelling to its peak and falling away"""
    i0, i1 = int(t0 * SR), int(t1 * SR); n = i1 - i0
    x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, SR, nperseg=2048, noverlap=1536)
    tc = t0 + tt; u = np.clip((tc - t0) / (t1 - t0), 0, 1)
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * u)
    mask = np.exp(-0.5 * (np.log2(np.maximum(f[:, None], 1) / fc[None, :]) / (octaves / 2)) ** 2)
    _, y = signal.istft(Z * mask, SR, nperseg=2048, noverlap=1536); y = y[:n]
    tl = t0 + np.arange(n) / SR
    env = np.where(tl < peak, ((tl - t0) / (peak - t0)) ** attack_shape, np.clip(1 - (tl - peak) / (t1 - peak), 0, 1) ** release_shape)
    y = y * env; y /= np.abs(y).max() + 1e-9
    out = np.zeros(N); out[i0:i1] = y; return out
def tone(freqs, amps, env, h2=0.10):
    # one pure voice per note (no detuned pairs: they beat and pump), a breath of slow vibrato, a soft 2nd harmonic
    y = np.zeros(N)
    for f, a in zip(freqs, amps):
        ph = rng.uniform(0, 2 * np.pi, 2); vib = 1 + 0.0007 * np.sin(2 * np.pi * rng.uniform(0.11, 0.19) * t + ph[0])
        phase = 2 * np.pi * np.cumsum(f * vib) / SR
        y += a * (np.sin(phase + ph[1]) + h2 * np.sin(2 * phase))
    return y * env
def reverb_ir(seconds=2.6, pre=0.018):
    n = int(seconds * SR); tt = np.arange(n) / SR
    irs = []
    for _ in range(2):
        x = rng.standard_normal(n) * np.exp(-6.9 * tt / seconds)            # RT60 = seconds
        x = lp(x, 7000) * 0.6 + lp(x, 1800) * 0.4                            # darker tail
        x = np.concatenate([np.zeros(int(pre * SR)), x]); irs.append(x / np.sqrt((x ** 2).sum()))
    return irs
IR = reverb_ir()
def verb(st, wet):
    return np.stack([signal.fftconvolve(st[0], IR[0])[:N], signal.fftconvolve(st[1], IR[1])[:N]]) * wet

mix = np.zeros((2, N)); send = np.zeros((2, N))

# 1. air bed: a quiet room that breathes with the glide, gone before the hit
air = hp(lp(pink(N), 2400), 180)
air_env = smooth(0, 0.8, t) * (0.55 + 0.45 * speed_share(np.minimum(t, 8.3))) * (1 - smooth(9.25, 9.62, t)) + 0.35 * smooth(10.1, 11.0, t)
air_env *= 1 - smooth(13.7, 14.5, t)
mix += np.stack([air, np.roll(air, 2400)]) * air_env * db(-47)

# 2. score: a calm Dmaj9 voicing under the flight, swelling into the rise, silent before the hit
pad_env = smooth(0.15, 1.7, t) * (1 + 0.35 * smooth(7.7, 8.6, t)) * (1 - smooth(8.75, 9.45, t))
pad = hp(lp(tone([146.83, 220.0, 329.63, 369.99, 554.37], [0.8, 0.8, 0.6, 0.45, 0.2], pad_env), 2600), 110, 2)
mix += pan(pad, 0) * db(-34); send += pan(pad, 0) * db(-38)
# after the hit: the chord resolves and blooms under the title, then fades with the film
res_env = smooth(10.0, 10.9, t) * (1 - smooth(13.5, 14.5, t))
res = hp(lp(tone([146.83, 220.0, 293.66, 369.99, 440.0], [0.85, 0.75, 0.6, 0.45, 0.25], res_env), 3200), 100, 2)
mix += pan(res, 0) * db(-31); send += pan(res, 0) * db(-33)

# 3. the four tiles lift (0.1-0.28s): soft plucks, one per tile, staggered like the motion
for i, (f, at) in enumerate(zip([587.33, 739.99, 880.0, 1108.73], [0.10, 0.16, 0.22, 0.28])):
    m = t >= at; e = np.zeros(N); e[m] = np.exp(-(t[m] - at) / 0.32) * (1 - np.exp(-(t[m] - at) / 0.004))
    pl = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * e
    p = [-0.55, -0.2, 0.2, 0.55][i]
    mix += pan(pl, p) * db(-33); send += pan(pl, p) * db(-26)

# 4. pass-bys: the two chips leave the frame at 2.5s; the tile drifts past the lens at 5.4s
for c, p in [(2.5, -0.7), (2.5, 0.7)]:
    w = swept_noise(c - 0.45, c + 0.35, 900, 2600, c, 2.2, 2.5, 1.4); mix += pan(w, p) * db(-34)
w = swept_noise(4.95, 5.85, 500, 1600, 5.4, 2.0, 2.0, 1.6); mix += pan(w, -0.6) * db(-30)
# the testimonial rises and stands (5.45-6.3): a low, soft lift
w = swept_noise(5.45, 6.4, 160, 520, 6.1, 1.6, 2.2, 1.2); mix += pan(w, 0) * db(-33)

# 5. whooshes: the rise (peak 8.66, sweeping up) and the dive (peak 9.80, sweeping down into the hit)
w = swept_noise(8.0, 9.2, 260, 3200, 8.66, 2.4, 2.2, 1.2)
mix += pan(w, np.clip((t - 8.0) / 1.2, 0, 1) * 0.6 - 0.3) * db(-17); send += pan(w, 0) * db(-26)
w = swept_noise(9.38, 9.93, 4200, 420, 9.80, 2.6, 1.4, 1.0)
mix += pan(w, 0) * db(-16); send += pan(w, 0) * db(-24)
# 70 ms of near-silence between the dive and the hit: the hit lands
gap = 1 - smooth(9.89, 9.92, t) * (1 - smooth(9.965, 9.97, t)) * 0.92
mix *= gap; send *= gap

# 6. the hit on 9.97s: sub with a pitch drop, a short knock, a bell-like body, all into the room
h0 = 9.97; m = t >= h0; th = np.where(m, t - h0, 0)
f_sub = 44 + 30 * np.exp(-th / 0.07)
sub = np.sin(2 * np.pi * np.cumsum(f_sub) / SR) * np.exp(-th / 0.5) * m
sub = np.tanh(sub * 1.6) / np.tanh(1.6)
knock = bp(rng.standard_normal(N), 1400, 6500) * np.exp(-th / 0.012) * m
click = rng.standard_normal(N) * np.exp(-th / 0.0018) * m
body = sum(a * np.sin(2 * np.pi * f * th) * np.exp(-th / d) for f, a, d in [(293.66, 1.0, 1.3), (440.0, 0.6, 0.9), (587.33, 0.45, 0.7), (880.0, 0.2, 0.45)]) * m
hit = sub * db(-6) + knock * db(-17) + click * db(-24) + body * db(-19)
mix += pan(hit, 0); send += pan(knock * db(-17) + body * db(-16), 0)

# 7. the title: a soft key tick per word as it rises, the badge a touch lower
for at, f in [(10.02, 1250), (10.12, 2350), (10.18, 2500), (10.24, 2420), (10.36, 2150), (10.41, 2280), (10.46, 2200)]:
    mm = t >= at; tt = np.where(mm, t - at, 0)
    tk = (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.018) + 0.4 * bp(rng.standard_normal(N), 3000, 9000) * np.exp(-tt / 0.004)) * mm
    mix += pan(tk, 0) * db(-36 if f > 2000 else -33); send += pan(tk, 0) * db(-34)

mix += verb(send, 1.0)
mix[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))          # no click at the first sample
mix[:, -int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))           # nor at the last
mix /= np.abs(mix).max() / db(-6)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'bed.wav', SR, mix.T.astype(np.float32))
print('wrote', sys.argv[1] if len(sys.argv) > 1 else 'bed.wav', f'{DUR}s')
