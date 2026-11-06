#!/usr/bin/env bash
# Master assets/audio/mix_pre.wav to about -14 LUFS integrated, true peak <= -1 dBTP.
set -e
cd "$(dirname "$0")/.."
GAIN=${GAIN:-8.4}
ffmpeg -y -loglevel error -i assets/audio/mix_pre.wav -af "volume=${GAIN}dB,aresample=192000,alimiter=limit=0.78:attack=2:release=60:level=false,aresample=48000" -ar 48000 -c:a pcm_s16le assets/audio/mix.wav
ffmpeg -hide_banner -i assets/audio/mix.wav -af loudnorm=I=-14:TP=-1:print_format=json -f null - 2>&1 | grep -E '"input_(i|tp)"'
