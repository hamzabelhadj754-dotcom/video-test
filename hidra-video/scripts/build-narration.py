"""Place each voiceover line at its cue (scripts/timing.json) into assets/narration.wav."""
import json, os
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
timing = json.load(open(f"{ROOT}/scripts/timing.json"))
lines = {l["id"]: l for l in json.load(open(f"{ROOT}/assets/vo/lines.json"))}
sr = sf.info(f"{ROOT}/assets/vo/l01.wav").samplerate
out = np.zeros(int(timing["duration"] * sr), dtype=np.float32)
for scene in timing["scenes"]:
    end = scene["start"] + scene["duration"]
    for lid, local in scene["cues"].items():
        samples, _ = sf.read(f"{ROOT}/assets/vo/{lid}.wav", dtype="float32")
        g = scene["start"] + local
        stop = g + len(samples) / sr
        flag = "  <-- overruns scene" if stop > end - 0.2 else ""
        nxt = [scene["start"] + v for k, v in scene["cues"].items() if scene["start"] + v > g]
        if nxt and stop > min(nxt) - 0.15:
            flag += "  <-- collides with next line"
        print(f"{scene['id']:13s} {lid} {g:6.2f} -> {stop:6.2f}{flag}")
        i = int(g * sr)
        out[i:i + len(samples)] += samples
peak = np.max(np.abs(out))
out *= 0.89 / peak
sf.write(f"{ROOT}/assets/narration.wav", out, sr)
