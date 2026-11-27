#!/usr/bin/env bash
# finish.sh <raw_render> <out.mp4>: loudness-normalise the premix, supersample down to 1080p,
# add fine temporal grain against banding, encode H.264 High with BT.709 tags and +faststart.
set -euo pipefail
RAW="$1"; OUT="$2"
M=$(ffmpeg -nostats -i audio/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | awk -F'"' -v k="$1" '$2==k{print $4}'; }
ffmpeg -v error -y -i audio/premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -ar 48000 audio/mix.wav
ffmpeg -v error -y -i "$RAW" -i audio/mix.wav \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,noise=c0s=5:c0f=t+u:c1s=2:c1f=t+u:c2s=2:c2f=t+u,format=yuv420p" \
  -map 0:v -map 1:a -c:v libx264 -profile:v high -preset slow -crf 15 -tune film \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest "$OUT"
echo "finished: $OUT"
