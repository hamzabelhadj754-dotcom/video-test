"""Synthesize each voiceover line with local Kokoro and trim edge silence.

Usage: python3 scripts/gen-vo.py [voice] [speed]
Writes assets/vo/<id>.wav and assets/vo/lines.json (durations in seconds).
"""
import json, os, sys
import numpy as np
import soundfile as sf
import kokoro_onnx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/hyperframes/tts")
voice = sys.argv[1] if len(sys.argv) > 1 else "em_alex"
speed = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0

model = kokoro_onnx.Kokoro(f"{CACHE}/models/kokoro-v1.0.onnx", f"{CACHE}/voices/voices-v1.0.bin")
lines = json.load(open(f"{ROOT}/scripts/vo-lines.json"))
out = []
for line in lines:
    samples, sr = model.create(line["text"], voice=voice, speed=speed, lang="es")
    samples = np.asarray(samples, dtype=np.float32)
    loud = np.where(np.abs(samples) > 0.01)[0]
    pad = int(0.04 * sr)
    samples = samples[max(0, loud[0] - pad): min(len(samples), loud[-1] + pad)]
    path = f"{ROOT}/assets/vo/{line['id']}.wav"
    sf.write(path, samples, sr)
    out.append({**line, "duration": round(len(samples) / sr, 3)})
    print(line["id"], out[-1]["duration"], line["text"])
json.dump(out, open(f"{ROOT}/assets/vo/lines.json", "w"), ensure_ascii=False, indent=1)
