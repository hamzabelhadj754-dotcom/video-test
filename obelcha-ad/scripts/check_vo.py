#!/usr/bin/env python3
"""QA: transcribe each VO line with Whisper (sherpa-onnx) and compare with the script.
Writes audio/vo_asr.json. Optional — skipped if the ASR model is missing."""
import json, os, re, sys, unicodedata
import numpy as np, soundfile as sf
from scipy import signal
from difflib import SequenceMatcher
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(os.environ.get('OBELCHA_TTS_DIR', os.path.join(ROOT, '.cache', 'tts')), 'sherpa-onnx-whisper-base')
if not os.path.exists(D):
    print('ASR model missing — skipping VO check'); sys.exit(0)
import sherpa_onnx
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{D}/base-encoder.int8.onnx', decoder=f'{D}/base-decoder.int8.onnx',
                                                 tokens=f'{D}/base-tokens.txt', language='es', task='transcribe', num_threads=4)
rep = json.load(open(os.path.join(ROOT, 'audio', 'audio_report.json')))
x, sr = sf.read(os.path.join(ROOT, 'audio', 'stem_vo_es.wav'))
x = x.mean(1) if x.ndim > 1 else x
x16 = signal.resample_poly(x, 16000, sr)
norm = lambda s: re.sub(r'[^a-zñ ]', '', unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()).strip()
out = []
for r in rep['vo']:
    seg = x16[int((r['start'] - 0.05) * 16000): int((r['end'] + 0.1) * 16000)].astype(np.float32)
    seg = np.concatenate([np.zeros(4000, np.float32), seg, np.zeros(4000, np.float32)])
    s = rec.create_stream(); s.accept_waveform(16000, seg); rec.decode_stream(s)
    heard = s.result.text.strip()
    sim = SequenceMatcher(None, norm(r['say']), norm(heard)).ratio()
    out.append({'id': r['id'], 'script': r['say'], 'asr': heard, 'similarity': round(sim, 2)})
    print(f"  {r['id']}: {sim:.2f}  script='{r['say']}'  heard='{heard}'")
json.dump(out, open(os.path.join(ROOT, 'audio', 'vo_asr.json'), 'w'), indent=2, ensure_ascii=False)
