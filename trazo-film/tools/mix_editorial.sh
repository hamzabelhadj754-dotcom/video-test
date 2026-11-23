#!/usr/bin/env bash
# Final mix for TRAZO · editorial: score (tools/score.py) + sound effects (tools/sound.py from the event log) under the
# voice-over, the bed ducked by the voice, loudness -14 LUFS / -1.5 dBTP → videohub/trazo-editorial/audio/mix.wav
# Usage (from trazo-film/): bash tools/mix_editorial.sh   (after audio/editorial3_events.json was refreshed)
set -euo pipefail
python3 tools/score.py
python3 tools/cues_editorial3.py
python3 tools/sound.py audio/editorial3.json audio/editorial3_bed.wav
ffmpeg -nostdin -v error -y -i audio/score.wav -i audio/editorial3_bed.wav -i audio/vo_placed5.wav -filter_complex \
 "[0:a]volume=0.42[mus];[1:a]volume=0.9[sfx];[mus][sfx]amix=inputs=2:normalize=0[bed];[2:a]asplit=2[sc][v];\
[bed][sc]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350:makeup=1[duck];\
[v]highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=5:release=120,volume=1.6[vv];\
[duck][vv]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]" -map "[out]" -ar 48000 -t 96.4 videohub/trazo-editorial/audio/mix.wav
ffmpeg -nostdin -i videohub/trazo-editorial/audio/mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
