"""Forced alignment: exact word start/end times for the known transcript, using torchaudio's wav2vec2 (960h) CTC model.
usage: <venv with torch+torchaudio>/python align.py   → audio/aligned.json  [{text,start,end}, ...]"""
import json, os, re
import numpy as np, soundfile as sf, torch, torchaudio
R = os.path.dirname(os.path.abspath(__file__)); P = lambda *a: os.path.join(R, *a)
d = json.load(open(P("audio/tx/transcript.json"))); d = d if isinstance(d, list) else d["words"]
words = [w["text"].strip() for w in d]
bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
model = bundle.get_model().eval(); labels = bundle.get_labels(); idx = {c: i for i, c in enumerate(labels)}
a, sr = sf.read(P("audio/speech_v2.wav"), dtype="float32"); a = a.mean(1) if a.ndim > 1 else a
wav = torchaudio.functional.resample(torch.from_numpy(a)[None], sr, bundle.sample_rate)
with torch.inference_mode(): em, _ = model(wav); em = torch.log_softmax(em, -1)
# transcript → label ids, words separated by "|"
norm = [re.sub(r"[^A-Z']", "", w.upper().replace("48", "FORTYEIGHT")) for w in words]
toks, owner = [], []
for k, w in enumerate(norm):
    for ch in w:
        if ch in idx: toks.append(idx[ch]); owner.append(k)
    if k < len(norm) - 1: toks.append(idx["|"]); owner.append(-1)
ali, _ = torchaudio.functional.forced_align(em, torch.tensor([toks], dtype=torch.int32), blank=0)
ali = ali[0].tolist()
fps = em.shape[1] / (wav.shape[1] / bundle.sample_rate)   # emission frames per second
# map frames to tokens: walk the alignment, every non-blank change advances the token pointer
starts, ends = [None] * len(words), [None] * len(words); ti, prev = -1, 0
for f, lab in enumerate(ali):
    if lab != 0 and (lab != prev or ti < 0):
        ti += 1
        while ti < len(toks) and toks[ti] != lab: ti += 1
    prev = lab
    if lab != 0 and 0 <= ti < len(toks) and owner[ti] >= 0:
        k = owner[ti]; t = f / fps
        if starts[k] is None: starts[k] = t
        ends[k] = t + 1 / fps
out = [{"text": w, "start": round(starts[k] if starts[k] is not None else d[k]["start"], 3), "end": round(ends[k] if ends[k] is not None else d[k]["end"], 3)} for k, w in enumerate(words)]
json.dump(out, open(P("audio/aligned.json"), "w"), indent=0)
for o, w in zip(out, d): print(f'{o["text"]:10s} whisper {w["start"]:6.2f}  aligned {o["start"]:6.2f}  Δ {o["start"] - w["start"]:+.2f}')
