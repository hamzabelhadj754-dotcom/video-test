"""Caption groups + click track from the speech transcript.
Writes assets/caps.json (used by index.html) and assets/speech.wav (voice + a soft click on every caption).
usage: python build_caps.py   (needs audio/tx/transcript.json, audio/speech_v2.wav, sfx/*.wav)"""
import json, os
import numpy as np, soundfile as sf
R = os.path.dirname(os.path.abspath(__file__)); P = lambda *a: os.path.join(R, *a)
SR, DUR = 48000, 21.6
d = json.load(open(P("audio/aligned.json")))
W = [{"t": w["start"], "e": w["end"], "s": w["text"].strip().strip(".,").lower()} for w in d]
# timings come from forced alignment (align.py) — exact to about one video frame
SMALL = {"i'd", "the", "that", "you", "in", "is", "it", "it's", "but", "if", "and", "then", "of", "from", "to", "too", "than", "not", "just", "kind", "only", "get", "don't", "want", "do", "those"}
ACC = {"far", "reward", "easy", "easier", "results", "slacking", "really"}
caps, lead = [], []
for i, w in enumerate(W):
    nxt = next((x for x in W[i + 1:] if x["s"] not in SMALL), None)
    if w["s"] in SMALL and nxt and nxt["t"] - w["t"] < 1.4: lead.append(w); continue
    end = min(W[i + 1]["t"], w["e"] + 0.9) if i + 1 < len(W) else DUR - 0.2
    caps.append({"lead": " ".join(x["s"] for x in lead), "leadAt": round(lead[0]["t"], 3) if lead else None, "leadWords": [[x["s"], round(x["t"], 3)] for x in lead],
                 "main": w["s"], "at": round(w["t"], 3), "end": round(end, 3), "acc": w["s"] in ACC})
    lead = []
# no caption may still be on screen when the next one starts
for i in range(len(caps) - 1):
    nx = caps[i + 1]["leadAt"] if caps[i + 1]["leadAt"] is not None else caps[i + 1]["at"]
    caps[i]["end"] = round(min(caps[i]["end"], nx - 1 / 30), 3)

# placement from the athlete matte: behind the body only where the word stays readable
import subprocess
MW, MH = 270, 480
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-c:v", "libvpx-vp9", "-i", P("assets/subject.webm"), "-vf", f"alphaextract,scale={MW}:{MH},fps=30",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
mat = np.frombuffer(raw, np.uint8).reshape(-1, MH, MW).astype(np.float32) / 255
def cover(t0, t1, top, size, n):
    w = min(960, n * 0.5 * size); h = 0.86 * size; x0, x1 = (540 - w / 2) / 4, (540 + w / 2) / 4; y0, y1 = top / 4, (top + h) / 4
    fr = [min(len(mat) - 1, int(t * 30)) for t in np.linspace(t0, max(t0, t1 - 0.04), 4)]
    xs = np.linspace(x0, x1, 5)   # the worst quarter of the word counts, so no letters disappear
    return max(float(mat[f, int(y0):int(y1), int(xs[k]):int(xs[k + 1])].mean()) * (0.5 if k in (0, 3) else 1) + 0.5 * float(mat[f, int(y0):int(y1), int(x0):int(x1)].mean()) for f in fr for k in range(4))
for c in caps:
    n = len(c["main"]); size = min(360 if c["acc"] else 300, int(960 / max(1, n * 0.5)))
    c["size"] = size; best = None
    for top in (520, 300, 1180):
        cv = cover(c["at"], c["end"], top, size, n)
        if cv <= 0.38: best = (top, "back", round(cv, 2)); break
    if best is None:   # in front, where it hides the least of the athlete
        best = min(((top, "front", round(cover(c["at"], c["end"], top, size, n), 2)) for top in (300, 1180, 1400)), key=lambda x: x[2])
        if best[2] > 0.6: best = (1180, "front", best[2])   # close-ups: keep the face clear, sit on the chest
    c["top"], c["layer"], c["cov"] = best
    print(f'{c["main"]:10s} top {best[0]:5d} {best[1]:5s} covered {best[2]}')
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
    for _, lt in c["leadWords"]: put("type_click", lt - 1 / 30, -16)
    put("box_click" if not c["acc"] else "switch_tap", c["at"] - 1 / 30, -9 if not c["acc"] else -6)
out = out / max(1e-9, np.abs(out).max()) * 0.85
sf.write(P("assets/speech_pre.wav"), out.astype(np.float32), SR)
print(len(caps), "captions")
