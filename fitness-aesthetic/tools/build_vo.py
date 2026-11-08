"""Place the 7 Kokoro VO lines on the 20 s timeline, resample to 48 kHz, and write the word timings.
usage: python build_vo.py <lines_dir> <tx_dir>   (lines_dir/0N.wav, tx_dir/0N/transcript.json from `hyperframes transcribe`)"""
import json, os, sys
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LD, TX = sys.argv[1], sys.argv[2]
SR, DUR = 48000, 20.0
# line start times (s) on the 110 BPM timeline; display text per word (whisper gives the timings)
LINES = {
    1: (0.35, "Your muscles don't grow in the gym."),
    2: (3.45, "Training breaks them down."),
    3: (6.10, "They grow while you recover, over the next 48 hours."),
    4: (10.50, "Three things build muscle: load, protein, and sleep."),
    5: (14.35, "Not more hours."),
    6: (15.75, "Better recovery."),
    7: (17.45, "Growth is built while you rest."),
}
buf = np.zeros(int(SR * DUR)); words = []
for k, (t0, text) in LINES.items():
    a, sr = sf.read(f"{LD}/{k:02d}.wav", dtype="float64")
    if a.ndim > 1: a = a.mean(1)
    a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    i = int(t0 * SR); buf[i:i + len(a)] += a[: len(buf) - i]
    tx = json.load(open(f"{TX}/{k:02d}/transcript.json")); tx = tx if isinstance(tx, list) else tx["words"]
    disp = text.split()
    assert len(disp) == len(tx), (k, disp, [w["text"] for w in tx])
    for d, w in zip(disp, tx):
        words.append({"line": k, "w": d, "t": round(t0 + w["start"], 3), "e": round(t0 + w["end"], 3)})
sf.write(os.path.join(ROOT, "assets/audio/vo48.wav"), buf.astype(np.float32), SR)
json.dump(words, open(os.path.join(ROOT, "assets/audio/words.json"), "w"), indent=0)
for w in words: print(w["line"], w["w"], w["t"])
