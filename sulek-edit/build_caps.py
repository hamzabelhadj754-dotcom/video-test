"""Caption groups + click track from the speech transcript.
Writes assets/caps.json (used by index.html) and assets/speech.wav (voice + a soft click on every caption).
usage: python build_caps.py   (needs audio/tx/transcript.json, audio/speech_v2.wav, sfx/*.wav)"""
import json, os
import numpy as np, soundfile as sf
R = os.path.dirname(os.path.abspath(__file__)); P = lambda *a: os.path.join(R, *a)
SR, DUR = 48000, 21.6
d = json.load(open(P("audio/tx/transcript.json"))); d = d if isinstance(d, list) else d["words"]
W = [{"t": w["start"], "e": w["end"], "s": w["text"].strip().strip(".,").lower()} for w in d]
SMALL = {"i'd", "the", "that", "you", "in", "is", "it", "it's", "but", "if", "and", "then", "of", "from", "to", "too", "than", "not", "just", "kind", "only", "get", "don't", "want", "do", "those"}
ACC = {"far", "reward", "easy", "easier", "results", "slacking", "really"}
caps, lead = [], []
for i, w in enumerate(W):
    nxt = next((x for x in W[i + 1:] if x["s"] not in SMALL), None)
    if w["s"] in SMALL and nxt and nxt["t"] - w["t"] < 1.4: lead.append(w); continue
    end = min(W[i + 1]["t"], w["e"] + 0.9) if i + 1 < len(W) else DUR - 0.2
    caps.append({"lead": " ".join(x["s"] for x in lead), "leadAt": round(lead[0]["t"], 3) if lead else None,
                 "main": w["s"], "at": round(w["t"], 3), "end": round(end, 3), "acc": w["s"] in ACC})
    lead = []
json.dump(caps, open(P("assets/caps.json"), "w"), indent=1)

voice, sr = sf.read(P("audio/speech_v2.wav")); assert sr == SR
if voice.ndim == 1: voice = np.stack([voice, voice], 1)
N = int(SR * DUR); out = np.zeros((N, 2)); out[: min(N, len(voice))] = voice[:N]
def put(name, t, db):
    a, s = sf.read(P("sfx", name + ".wav"))
    if s != SR: a = np.interp(np.arange(int(len(a) * SR / s)) * s / SR, np.arange(len(a)), a.mean(1) if a.ndim > 1 else a); a = np.stack([a, a], 1)
    m = np.abs(a).max(1); on = int(np.argmax(m > m.max() * 0.1)); i0 = int(t * SR) - on; a = a * 10 ** (db / 20)
    s0 = max(0, -i0); i0 = max(0, i0); n = min(len(a) - s0, N - i0); out[i0:i0 + n] += a[s0:s0 + n]
for c in caps:
    if c["leadAt"] is not None: put("type_click", c["leadAt"] - 1 / 30, -15)
    put("box_click" if not c["acc"] else "switch_tap", c["at"] - 1 / 30, -9 if not c["acc"] else -6)
out = out / max(1e-9, np.abs(out).max()) * 0.85
sf.write(P("assets/speech_pre.wav"), out.astype(np.float32), SR)
print(len(caps), "captions")
