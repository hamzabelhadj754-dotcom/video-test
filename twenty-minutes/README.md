# Twenty Minutes

30s vertical educational short: a 20-minute no-equipment home workout.
Remotion (React) picture, bespoke synthesised sound design, ElevenLabs voiceover.
See `DECISIONS.md` for the concept, design system and storyboard.

## Rebuild
```bash
npm install
ffmpeg -y -i public/vo.mp3 -ar 48000 -ac 1 public/vo_48k.wav
python3 tools/transcribe.py <16k wav> public/words.json   # word timings (faster-whisper)
python3 tools/sfx.py                                       # sound design -> public/mix_pre.wav
# master to -14 LUFS (two-pass loudnorm) -> public/mix.wav
npx remotion render TwentyMinutes out/twenty-minutes_vNN.mp4 --codec=h264 --crf=16 --audio-codec=aac --audio-bitrate=320k
bash tools/screening-room.sh out/twenty-minutes_vNN.mp4     # QA: contact sheet, strips, report
```
