"""Cut a recorded voice-over into the script lines.

  python3 tools/align_voice.py assets/vo-eleven.mp3
The script lines rendered by TTS (assets/vo-raw/<id>.wav) are a reference whose
line boundaries are known. MFCC + DTW maps them onto the recording, each cut is
snapped to the quietest stretch near it, and the clips are written to
assets/vo/<id>.wav. Word estimates are warped the same way into assets/words.json.
"""
import json
import re
import sys
import numpy as np
import librosa
import soundfile as sf

SR = 16000
HOP = 160
OUT_SR = 44100
lines = [l.rstrip("\n").split("\t") for l in open("tools/lines.tsv", encoding="utf-8")]


def mfcc(y):
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    return (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)


def prop_words(text, d):
    words, units, spans = text.split(), 0.0, []
    for w in words:
        n = len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 1.2
        spans.append((units, units + n))
        units += n + (5.0 if re.search(r"[,.:;!?]$", w) else 0)
    return [(w, a / units * d, b / units * d) for w, (a, b) in zip(words, spans)]


ref, bounds, words, t = [], [], [], 0.0
for k, text in lines:
    y, _ = librosa.load(f"assets/vo-raw/{k}.wav", sr=SR)
    y, _ = librosa.effects.trim(y, top_db=35)
    d = len(y) / SR
    bounds.append((k, t, t + d))
    words.append([(w, t + a, t + b) for w, a, b in prop_words(text, d)])
    ref += [y, np.zeros(int(0.35 * SR))]
    t += d + 0.35
ref = np.concatenate(ref)

rec, _ = librosa.load(sys.argv[1], sr=SR)
_, wp = librosa.sequence.dtw(X=mfcc(ref), Y=mfcc(rec), metric="cosine")
wp = wp[::-1]
rf, bf = wp[:, 0] * HOP / SR, wp[:, 1] * HOP / SR


def warp(x):
    return float(bf[min(np.searchsorted(rf, x), len(bf) - 1)])


# 10 ms loudness of the recording, for snapping cuts into pauses
db = 20 * np.log10(np.array([np.sqrt(np.mean(rec[i * HOP:(i + 1) * HOP] ** 2)) + 1e-9 for i in range(len(rec) // HOP)]))
quiet = db < max(db.max() - 38, -50)


def pause_near(t0, span=0.45):
    """Return (start, end) of the longest quiet run within ±span of t0."""
    a, b = int((t0 - span) * 100), int((t0 + span) * 100)
    a, b = max(a, 0), min(b, len(quiet))
    best, i = None, a
    while i < b:
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            k = i
            while k > 0 and quiet[k - 1]:
                k -= 1
            if best is None or (j - k) > (best[1] - best[0]):
                best = (k, j)
            i = j
        else:
            i += 1
    return (best[0] / 100, best[1] / 100) if best else (t0, t0)


voiced = np.where(~quiet)[0]
first, last = voiced[0] / 100, (voiced[-1] + 1) / 100
cuts = []
for i in range(len(bounds) - 1):
    mid = (warp(bounds[i][2]) + warp(bounds[i + 1][1])) / 2
    cuts.append(pause_near(mid))
starts = [first] + [c[1] for c in cuts]
ends = [c[0] for c in cuts] + [last]

full, _ = librosa.load(sys.argv[1], sr=OUT_SR)
out = {}
for (k, a, b), ws, s, e in zip(bounds, words, starts, ends):
    s0, e0 = max(s - 0.04, 0), e + 0.08
    clip = full[int(s0 * OUT_SR): int(e0 * OUT_SR)].copy()
    f = int(0.01 * OUT_SR)
    clip[:f] *= np.linspace(0, 1, f)
    clip[-f:] *= np.linspace(1, 0, f)
    sf.write(f"assets/vo/{k}.wav", clip, OUT_SR, subtype="PCM_16")
    # warp words, then rescale into the snapped line window
    wv = [(w, warp(x), warp(y)) for w, x, y in ws]
    w0, w1 = wv[0][1], wv[-1][2]
    sc = lambda x: s + (x - w0) / max(w1 - w0, 1e-6) * (e - s)
    out[k] = [[w, round(sc(x) - s0, 3), round(sc(y) - s0, 3)] for w, x, y in wv]
    print(f"{k}  {s:6.2f} -> {e:6.2f}  ({e - s:4.2f}s)  {' '.join(w for w, _, _ in ws[:4])}...")
json.dump(out, open("assets/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
