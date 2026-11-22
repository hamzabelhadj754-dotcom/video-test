import sys, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
voice = sys.argv[1]; out = sys.argv[2]
lines = {
 "vo1": "You did the work. So why are you still waiting to get paid?",
 "vo2": "Awkward follow-ups. Spreadsheets. Guesswork.",
 "vo3": "Meet Invoza.",
 "vo4": "Create pro invoices in seconds.",
 "vo5": "Reminders that send themselves.",
 "vo6": "And see every payment, in real time.",
 "vo7": "Less chasing. More doing what you love.",
 "vo8": "Invoza. Start free today.",
}
import os; os.makedirs(out, exist_ok=True)
for key, t in lines.items():
    s, sr = k.create(t, voice=voice, speed=0.98, lang="en-us")
    sf.write(f"{out}/{key}.wav", s, sr)
    print(key, round(len(s)/sr,2), sr)
