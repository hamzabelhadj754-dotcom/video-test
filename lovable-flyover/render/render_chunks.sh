#!/usr/bin/env bash
# render_chunks.sh <outdir> <worker index> <workers> [fps] [sub]
# Resumable: renders 30-frame chunks to <outdir>/chunks/c_NNNN.mp4, skipping chunks that already exist.
set -u
OUT=$1; K=$2; NW=$3; FPS=${4:-60}; SUB=${5:-16}
cd "$(dirname "$0")/.."
TOTAL=$(python3 -c "print(round(14.5*$FPS))"); CH=30
mkdir -p "$OUT/chunks"
i=0
for ((s=0; s<TOTAL; s+=CH)); do
  if (( i % NW == K )); then
    f=$(printf "%s/chunks/c_%04d.mp4" "$OUT" $s)
    if [[ ! -s $f ]]; then
      e=$(( s + CH < TOTAL ? s + CH : TOTAL ))
      node render/render.js --fps $FPS --sub $SUB --start $s --end $e --out "$f.tmp.mp4" 2>&1 | grep -v "GPU stall" | tail -n 1
      [[ -s $f.tmp.mp4 ]] && mv "$f.tmp.mp4" "$f"
    fi
  fi
  i=$((i+1))
done
echo "worker $K done"
