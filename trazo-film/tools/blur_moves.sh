#!/usr/bin/env bash
# Render every camera move with 8-sample motion blur (4 workers), into out/mv/mvNN.mp4 + out/mv/ranges.txt
set -euo pipefail
PAGE=${1:-src/film6.html}
mkdir -p out/mv
python3 - "$PAGE" <<'EOF' > out/mv/ranges.txt
import json, math, sys
m = json.load(open('audio/shots.json'))['moves']
for i, (a, b, _) in enumerate(m):
    print(i, max(0, math.floor(a * 60) - 2), math.ceil(b * 60) + 2)
EOF
run_worker() { while read -r i a b; do node tools/render_blur.js "$PAGE" "out/mv/mv$(printf %02d "$i").mp4" "$a" "$b" 8 .5 > /dev/null; done; }
for w in 0 1 2 3; do awk -v w=$w 'NR % 4 == w' out/mv/ranges.txt | run_worker & done
wait
echo "moves rendered"
