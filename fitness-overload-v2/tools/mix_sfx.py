"""Mix the recorded Mixkit sound effects onto the 31.5 s timeline (no synthesised tones, no music).
Sources: assets/sfx_src/*.wav (Mixkit Sound Effects Free License, kept out of git). Output: assets/audio/sfx_pre.wav
Each event: (name, time, gain dB, align) where align = "onset" puts the transient on the time, "peak" puts the loudest moment on it."""
import os
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, DUR = 48000, 31.5
N = int(SR * DUR); out = np.zeros((N, 2))
SRC = {}
def load(name):
    if name not in SRC:
        a, sr = sf.read(os.path.join(ROOT, "assets/sfx_src", name + ".wav")); assert sr == SR
        m = np.abs(a).max(1); e = np.convolve(m, np.ones(480) / 480, "same")
        SRC[name] = (a, np.argmax(m > m.max() * 0.1), int(np.argmax(e)))
    return SRC[name]
def put(name, t, db=0.0, align="onset", pan=0.0):
    a, on, pk = load(name); ref = on if align == "onset" else pk
    i0 = int(t * SR) - ref; a = a * 10 ** (db / 20)
    if pan: a = a * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * 1.414
    s0 = max(0, -i0); i0 = max(0, i0); n = min(len(a) - s0, N - i0)
    if n > 0: out[i0:i0 + n] += a[s0:s0 + n]

# 1 · hook
put("deep_impact", 0.02, -3); put("bubble_pop", 0.15, -5)
for t in (0.55, 0.78): put("box_click", t, -9)
put("light_pop", 1.1, -8); put("blow", 1.4, -4)
put("windy_swoosh", 2.55, -5, "peak")
# 2 · same body
put("air_woosh", 2.95, -7, "peak", 0.4); put("box_click", 2.95, -9); put("blow", 3.25, -3)
put("whoosh_fast", 4.85, -2, "peak"); put("zoom_impact", 4.92, -4)
# 3 · stop growing
for t in (5.05, 5.28): put("box_click", t, -9)
put("blow", 5.62, -5); put("heartbeat", 5.98, -2)
put("windy_swoosh", 6.95, -6, "peak")
# 4 · log card
put("bubble_pop", 7.25, -5); put("small_sweep", 7.55, -9, "peak")
for t in (7.25, 7.45): put("box_click", t, -10)
put("blow", 7.8, -4)
for i, t in enumerate((8.0, 8.18, 8.36, 8.54)): put("type_click", t, -4, pan=-0.3 + 0.2 * i)
put("blow", 8.62, -8)
put("zoom_vacuum", 9.42, -3, "peak"); put("deep_impact", 9.42, -4)
# 5 · demand
put("small_sweep", 10.25, -10, "peak"); put("intro_impact", 10.55, -8, "peak"); put("switch_tap", 11.15, -6)
# 6 · bars (vertical whip in)
put("small_sweep", 12.1, -8, "peak"); put("whoosh_fast", 12.42, -2, "peak"); put("zoom_impact", 12.5, -6)
for t in (12.85, 13.05): put("box_click", t, -9)
put("small_sweep", 13.42, -9, "peak"); put("blow", 13.55, -5)
for i in range(6): put("bubble_pop", 13.6 + i * 0.3, -10 + i * 0.5, pan=-0.4 + 0.16 * i); put("type_click", 13.6 + i * 0.3, -8)
put("blow", 15.15, -6)
put("windy_swoosh", 16.6, -6, "peak")
# 7 · small steps
put("air_woosh", 17.2, -7, "peak", -0.4); put("box_click", 17.1, -9); put("blow", 17.35, -3); put("light_pop", 17.85, -12)
put("small_sweep", 19.2, -7, "peak", -0.4); put("windy_swoosh", 19.65, -6, "peak")
# 8 · the rule
for i in range(8): put("type_click", 20.05 + i * 0.07, -6)
put("small_sweep", 20.8, -7, "peak"); put("small_sweep", 22.1, -7, "peak")
for t in (21.0, 21.22, 21.44, 22.3, 22.52, 22.74): put("box_click", t, -7); put("light_pop", t, -14)
put("zoom_vacuum", 24.2, -2, "peak")
# 9 · recover
put("sparkle", 24.4, -5); put("box_click", 24.75, -9); put("heartbeat", 25.1, -3)
put("windy_swoosh", 27.25, -6, "peak")
# 10 · outro
put("sparkle", 27.7, -9);
for t in (28.15, 28.35): put("box_click", t, -9)
put("blow", 28.75, -5); put("deep_impact", 29.05, -5); put("sparkle", 29.7, -9)
i0 = int(30.8 * SR); out[i0:] *= np.linspace(1, 0, N - i0)[:, None]
out = out / np.abs(out).max() * 0.89
os.makedirs(os.path.join(ROOT, "assets/audio"), exist_ok=True)
sf.write(os.path.join(ROOT, "assets/audio/sfx_pre.wav"), out.astype(np.float32), SR); print("ok")
