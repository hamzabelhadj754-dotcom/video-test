#!/usr/bin/env bash
# Parallel render: bash tools/render-par.sh <page.html> <out.mp4> [jobs=4] [fps=30] [sub=2]
set -euo pipefail
PAGE=$1; OUT=$2; J=${3:-4}; FPS=${4:-30}; SUB=${5:-2}
DUR=$(node -e "
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});const p=await b.newPage();await p.goto('file://'+require('path').resolve('$PAGE'));await p.waitForSelector('body[data-ready=\"1\"]',{timeout:120000});console.log(await p.evaluate(()=>window.DURATION));await b.close()})()")
TMP=$(mktemp -d); LIST=$TMP/list.txt; : > $LIST
STEP=$(awk -v d=$DUR -v j=$J 'BEGIN{printf "%.4f", d/j}')
for i in $(seq 0 $((J-1))); do
  A=$(awk -v s=$STEP -v i=$i 'BEGIN{printf "%.4f", s*i}'); B=$(awk -v s=$STEP -v i=$i 'BEGIN{printf "%.4f", s*(i+1)}')
  node tools/render.js "$PAGE" "$TMP/seg$i.mp4" $FPS $SUB $A $B > $TMP/log$i.txt 2>&1 &
  echo "file '$TMP/seg$i.mp4'" >> $LIST
done
wait
ffmpeg -v error -y -f concat -safe 0 -i $LIST -c copy "$OUT"
echo "rendered $OUT ($DUR s)"; rm -rf $TMP
