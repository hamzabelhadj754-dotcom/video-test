"""Build the Wiley ad soundtrack: processed music bed + picture-synced SFX.

Run from the wiley-ad folder:  python3 assets/audio/build_mix.py <sfx_dir>
Writes assets/audio/music.wav, assets/audio/sfx.wav, assets/audio/mix.wav (48 kHz stereo, pre-loudnorm).
"""
import subprocess, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 30.0
FPS = 60
SFX_DIR = sys.argv[1]


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fade(n, kind="in"):
    x = np.linspace(0, 1, n, dtype=np.float32)[:, None]
    return np.sin(x * np.pi / 2) ** 2 if kind == "in" else np.cos(x * np.pi / 2) ** 2


N = int(DUR * SR)
s = lambda t: int(round(t * SR))

# ---------------- music ----------------
m = load("assets/audio/music-raw.wav")
# patch the near-silent dropout (raw 7.84-9.34 s) with the same bar 8 beats earlier
a0, a1, src = s(7.84), s(9.34), s(3.84)
xf = s(0.04)
patch = m[src:src + (a1 - a0)].copy()
seg = m[a0:a1].copy()
seg[:xf] = seg[:xf] * fade(xf, "out") + patch[:xf] * fade(xf, "in")
seg[xf:-xf] = patch[xf:-xf]
seg[-xf:] = patch[-xf:] * fade(xf, "out") + seg[-xf:] * fade(xf, "in")
m[a0:a1] = seg
# shift so the 120 bpm grid lands on whole half-seconds (cuts at 3.0, 13.0, 20.0, 25.0 ...)
m = np.vstack([np.zeros((s(0.16), 2), np.float32), m])[:N]
m = np.vstack([m, np.zeros((N - len(m), 2), np.float32)])
# hook: music is filtered and low, then opens when the brand appears at 3.0 s
sos = butter(4, 600, "low", fs=SR, output="sos")
lp = sosfilt(sos, m, axis=0).astype(np.float32)
mix_k = np.ones((N, 1), np.float32)
o0, o1 = s(2.85), s(3.05)
mix_k[:o0] = 0.0
mix_k[o0:o1] = np.linspace(0, 1, o1 - o0, dtype=np.float32)[:, None]
gain = np.ones((N, 1), np.float32)
gain[:o0] = 0.6
gain[o0:o1] = np.linspace(0.6, 1, o1 - o0, dtype=np.float32)[:, None]
m = (lp * (1 - mix_k) + m * mix_k) * gain
# fade in over the first 0.6 s, fade out under the end card
m[:s(0.6)] *= fade(s(0.6), "in")
f0 = s(28.4)
m[f0:] *= fade(N - f0, "out")
# a short duck at the finale impact so it punches
d0, d1 = s(25.1), s(25.9)
duck = np.ones((d1 - d0, 1), np.float32)
duck[:] = np.linspace(0.55, 1, d1 - d0, dtype=np.float32)[:, None]
m[d0:d1] *= duck
m *= 0.42

# ---------------- sfx ----------------
SFX = {}
def sfx(name):
    if name not in SFX:
        x = load(f"{SFX_DIR}/{name}.mp3")
        SFX[name] = x / (np.abs(x).max() + 1e-6)  # peak-normalise every take to 1.0
    return SFX[name]

PEAK = {"whoosh-short": 0.16, "whoosh-cinematic": 2.50, "impact-bass-1": 0.07, "impact-bass-2": 0.36,
        "riser": 3.53, "pop": 0.12, "click-soft": 0.07, "click": 0.07, "sparkle": 0.03, "typing": 0.0,
        "key-press": 0.07, "whoosh": 0.16}
fx = np.zeros((N, 2), np.float32)

def place(name, t_picture, g, max_len=None, pan=0.0):
    """Place a take so its peak lands one frame after the picture event."""
    x = sfx(name)
    if max_len:
        L = min(len(x), s(max_len))
        x = x[:L].copy()
        fl = min(s(0.25), L // 3)
        x[-fl:] *= fade(fl, "out")
    start = s(t_picture + 1 / FPS - PEAK[name])
    a, b = max(0, start), min(N, start + len(x))
    if b <= a:
        return
    seg = x[a - start:b - start] * g
    if pan:
        seg = seg * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32)
    fx[a:b] += seg

# 1 hook
place("whoosh-short", 0.25, 0.30, pan=-0.4)           # streak draws in
place("key-press", 0.36, 0.25); place("key-press", 0.49, 0.2); place("key-press", 0.62, 0.22); place("key-press", 0.75, 0.2)
place("key-press", 1.08, 0.24); place("key-press", 1.22, 0.28)
place("whoosh-short", 2.55, 0.28)                       # streak collapses
# 2 logo
place("impact-bass-1", 3.05, 0.85)                      # point blooms into the mark
place("sparkle", 3.4, 0.22)                             # W draws
place("sparkle", 4.75, 0.14, pan=0.3)                   # sheen across wordmark
place("whoosh-cinematic", 6.55, 0.6)                    # dive through the W, flash
# 3 phone + agent
place("whoosh-short", 6.95, 0.35)                       # phone rises
place("pop", 7.95, 0.32, pan=0.15)                      # user message
place("typing", 8.55, 0.22, max_len=0.75)               # wiley typing
place("pop", 9.38, 0.28, pan=-0.1)                      # wiley reply
place("pop", 10.0, 0.38, pan=-0.45)                     # card: meeting moved
place("pop", 10.6, 0.36, pan=0.45)                      # card: replied
place("click-soft", 11.4, 0.45, pan=0.4)                # chip: 4 tasks handled
place("whoosh-short", 12.7, 0.45, pan=0.3)              # phone slides right
# 4 features
for t0 in (13.25, 15.55, 17.85):
    place("whoosh-short", t0 + 0.05, 0.22, pan=0.4)     # screen swap
    place("pop", t0 + 0.42, 0.34, pan=-0.1)             # glass card lands
place("whoosh-cinematic", 20.0, 0.45)                   # pull back to montage
# 5 montage
for i, t in enumerate([20.55 + k * 0.22 for k in range(6)]):
    place("pop" if i % 2 == 0 else "click-soft", t + 0.08, 0.26 - i * 0.015, pan=(-0.5 if i % 2 == 0 else 0.5))
place("impact-bass-2", 22.62, 0.38)                     # "More you."
place("riser", 25.15, 0.5, max_len=3.6)                 # build into the finale (cut at the impact)
place("whoosh-cinematic", 24.7, 0.55)                   # phone spin + chips whip out
# 6 end card
place("impact-bass-1", 25.15, 1.0)                      # finale hit as the phone settles
place("sparkle", 25.62, 0.22)                           # mark draws
place("pop", 26.9, 0.3)                                 # CTA lands
place("sparkle", 27.55, 0.16, pan=-0.2)                 # button sheen

mix = m + fx
sf.write("assets/audio/music.wav", m, SR, subtype="FLOAT")
sf.write("assets/audio/sfx.wav", fx, SR, subtype="FLOAT")
sf.write("assets/audio/mix.wav", mix, SR, subtype="FLOAT")
print("peak", np.abs(mix).max(), "music rms", np.sqrt((m ** 2).mean()), "sfx peak", np.abs(fx).max())
