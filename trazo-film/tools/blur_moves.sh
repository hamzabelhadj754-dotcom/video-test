#!/usr/bin/env bash
# Render every camera move with 8-sample motion blur (4 workers), into ${MV:-out/mv}/mvNN.mp4 + ${MV:-out/mv}/ranges.txt
set -euo pipefail
PAGE=${1:-src/film6.html}
mkdir -p ${MV:-out/mv}
python3 - "$PAGE" <<'EOF' > ${MV:-out/mv}/ranges.txt
import json, math, sys
import os; m = json.load(open(os.environ.get('SHOTS', 'audio/shots.json')))['moves']
for i, (a, b, _) in enumerate(m):
    if a >= float(os.environ.get('FROM', 0)): print(i, max(0, math.floor(a * 60) - 2), math.ceil(b * 60) + 2)
EOF
run_worker() { while read -r i a b; do node tools/render_blur.js "$PAGE" "${MV:-out/mv}/mv$(printf %02d "$i").mp4" "$a" "$b" 8 .5 > /dev/null; done; }
for w in 0 1 2 3; do awk -v w=$w 'NR % 4 == w' ${MV:-out/mv}/ranges.txt | run_worker & done
wait
echo "moves rendered"
