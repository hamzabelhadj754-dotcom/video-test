#!/usr/bin/env bash
# Builds review contact sheets (4 stills each, safe zone drawn in red) from out/stills/<format>/.
set -euo pipefail
fmt="${1:-9x16}"; dir="out/stills/$fmt"; outdir="out/stills/sheets"; mkdir -p "$outdir"
if [ "$fmt" = "9x16" ]; then box="drawbox=x=90:y=260:w=900:h=1240:color=red@0.8:t=4"; sc="540:960"; else box="drawbox=x=90:y=70:w=900:h=940:color=red@0.8:t=4"; sc="540:540"; fi
files=("$dir"/scene*.png)
for ((i=0; i<${#files[@]}; i+=4)); do
  set -- "${files[@]:i:4}"
  inputs=(); for f in "$@"; do inputs+=(-i "$f"); done
  n=$#; filt=""; for ((k=0;k<n;k++)); do filt+="[$k:v]$box,scale=$sc[v$k];"; done
  for ((k=0;k<n;k++)); do filt+="[v$k]"; done
  ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "${filt}xstack=inputs=$n:layout=0_0|w0_0|0_h0|w0_h0:fill=black" -frames:v 1 "$outdir/${fmt}-$((i/4+1)).png"
done
ls "$outdir"
