"""Tiny SFX mixer for the style samples. usage: python mix.py <project_dir> <duration> '<json events>'
events: [[name, time, db, "onset"|"peak"], ...] using <project>/assets/sfx_src/<name>.wav (Mixkit, git-ignored)."""
import sys, os, json
import numpy as np, soundfile as sf
P, DUR, EV = sys.argv[1], float(sys.argv[2]), json.loads(sys.argv[3])
SR = 48000; N = int(SR * DUR); out = np.zeros((N, 2))
for name, t, db, align in EV:
    a, sr = sf.read(os.path.join(P, "assets/sfx_src", name + ".wav")); m = np.abs(a).max(1); e = np.convolve(m, np.ones(480) / 480, "same")
    ref = np.argmax(m > m.max() * 0.1) if align == "onset" else int(np.argmax(e)); i0 = int(t * SR) - ref; a = a * 10 ** (db / 20)
    s0 = max(0, -i0); i0 = max(0, i0); n = min(len(a) - s0, N - i0)
    if n > 0: out[i0:i0 + n] += a[s0:s0 + n]
f = int(0.25 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None]
out = out / (np.abs(out).max() + 1e-9) * 0.89
os.makedirs(os.path.join(P, "assets/audio"), exist_ok=True); sf.write(os.path.join(P, "assets/audio/sfx_pre.wav"), out.astype(np.float32), SR); print("ok")
