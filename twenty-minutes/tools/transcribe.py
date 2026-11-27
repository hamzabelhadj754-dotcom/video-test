import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import soundfile as sf
audio,_ = sf.read(sys.argv[1], dtype="float32")
segs, info = m.transcribe(audio, word_timestamps=True, beam_size=5)
words=[]
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)})
json.dump(words, open(sys.argv[2],"w"), indent=0)
for w in words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["w"]}')
