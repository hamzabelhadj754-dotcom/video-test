#!/usr/bin/env bash
# assemble.sh <version dir> <out.mp4>: concat the chunks (stream copy) and mux the mastered sound bed
set -e
D=$1; OUT=$2
ls "$D"/chunks/c_*.mp4 | grep -v tmp | sort | sed "s|^|file '$PWD/|; s|$|'|" > "$D/concat.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$D/concat.txt" -i "$D/bed_master.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart \
  -metadata title="Lovable fly-over (spec)" "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,color_primaries,color_transfer,nb_frames,sample_rate,channels -show_entries format=duration,size -of compact "$OUT"
