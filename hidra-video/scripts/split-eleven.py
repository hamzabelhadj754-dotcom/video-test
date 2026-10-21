"""Split the single ElevenLabs take (assets/vo-eleven/source.wav) into per-line clips.

Line boundaries were found from the take's pauses (no speech-recognition model is
reachable here) and matched to scripts/vo-lines.json in order.
"""
import json, os
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPANS = [
    (0.07, 1.12), (1.67, 4.78), (5.55, 9.37), (10.19, 13.19), (13.80, 15.06),
    (15.59, 17.42), (18.11, 19.83), (20.28, 23.45), (23.99, 26.56), (27.28, 28.41),
    (28.96, 31.57), (32.24, 32.76), (33.40, 35.92), (36.58, 39.24), (39.73, 40.87),
    (41.52, 42.70), (43.13, 44.55), (45.01, 47.03), (47.53, 50.19), (50.91, 53.44),
    (53.86, 56.33), (56.48, 58.29), (58.62, 60.77), (61.58, 64.71), (65.42, 67.93),
    (68.51, 69.40),
]
lines = json.load(open(f"{ROOT}/scripts/vo-lines.json"))
assert len(lines) == len(SPANS)
x, sr = sf.read(f"{ROOT}/assets/vo-eleven/source.wav", dtype="float32")
total = len(x) / sr
out = []
for i, (line, (a, b)) in enumerate(zip(lines, SPANS)):
    prev_end = SPANS[i - 1][1] if i else 0.0
    next_start = SPANS[i + 1][0] if i + 1 < len(SPANS) else total
    a2 = max(prev_end + 0.02, a - 0.05, 0.0)
    b2 = min(next_start - 0.02, b + 0.12, total)
    clip = x[int(a2 * sr):int(b2 * sr)]
    sf.write(f"{ROOT}/assets/vo-eleven/{line['id']}.wav", clip, sr)
    out.append({**line, "duration": round(len(clip) / sr, 3)})
json.dump(out, open(f"{ROOT}/assets/vo-eleven/lines.json", "w"), ensure_ascii=False, indent=1)
print("wrote", len(out), "clips")
