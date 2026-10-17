"""Align script lines to the recorded voice-over with MFCC + DTW against a TTS reference.

Writes assets/align.json: per line {start, end} in the recording, plus per-word
estimates (words spread by letter weight inside the reference, then warped).
"""
import json, re, sys
import numpy as np
import librosa

SR = 16000
HOP = 160  # 10 ms
lines = [l.rstrip("\n").split("\t") for l in open("tools/lines.tsv", encoding="utf-8")]

def feats(y):
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    m = (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)
    return m

# reference: lines back to back, trimmed, with 0.3 s gaps
ref, bounds, words = [], [], []
t = 0.0
for k, text in lines:
    y, _ = librosa.load(f"ref/{k}.wav", sr=SR)
    y, idx = librosa.effects.trim(y, top_db=35)
    d = len(y) / SR
    bounds.append((k, t, t + d))
    ws = text.split()
    wts = np.array([len(re.sub(r"[^\wáéíóúñü%]", "", w, flags=re.I)) + 1.5 for w in ws])
    e = t + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * d
    words.append([(w, e[i], e[i + 1]) for i, w in enumerate(ws)])
    ref.append(y); ref.append(np.zeros(int(0.3 * SR)))
    t += d + 0.3
ref = np.concatenate(ref)
rec, _ = librosa.load("assets/vo-source.mp3", sr=SR)

A, B = feats(ref), feats(rec)
D, wp = librosa.sequence.dtw(X=A, Y=B, metric="cosine", subseq=False)
wp = wp[::-1]
rf, bf = wp[:, 0] * HOP / SR, wp[:, 1] * HOP / SR

def warp(tr):
    i = np.searchsorted(rf, tr)
    i = min(max(i, 0), len(bf) - 1)
    return float(bf[i])

out = {}
for (k, a, b), ws in zip(bounds, words):
    out[k] = {"start": round(warp(a), 3), "end": round(warp(b), 3),
              "words": [[w, round(warp(x), 3), round(warp(y), 3)] for w, x, y in ws]}
json.dump(out, open("assets/align.json", "w"), ensure_ascii=False, indent=1)
for k, v in out.items():
    print(f"{k:6s} {v['start']:6.2f} -> {v['end']:6.2f}   " + " ".join(f"{w}@{a:.2f}" for w, a, b in v["words"][:4]))
