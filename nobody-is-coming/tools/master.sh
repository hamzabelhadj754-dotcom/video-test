#!/usr/bin/env bash
# Masters assets/audio/mix_pre.wav to about -14 LUFS integrated, true peak <= -1 dBTP.
set -e
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i assets/audio/mix_pre.wav -af "volume=8.7dB,alimiter=limit=0.83:attack=3:release=60:level=false" -ar 48000 -c:a pcm_s16le assets/audio/mix.wav
ffmpeg -hide_banner -i assets/audio/mix.wav -af loudnorm=I=-14:TP=-1:print_format=json -f null - 2>&1 | grep -E '"input_(i|tp)"'
