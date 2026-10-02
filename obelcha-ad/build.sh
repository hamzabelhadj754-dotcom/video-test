#!/usr/bin/env bash
# One command: audio -> captions -> 5 videos (HyperFrames) -> QA sheets.
#   ./build.sh               render with the HyperFrames CLI (default)
#   RENDERER=playwright ./build.sh   fallback: built-in Playwright + ffmpeg renderer
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules/gsap ] || npm install --silent
python3 scripts/audio.py
python3 scripts/check_vo.py || true
python3 scripts/captions.py
if [ "${RENDERER:-hyperframes}" = "hyperframes" ]; then
  bash scripts/hf_render.sh
else
  R="node scripts/render.mjs --audio audio/mix.wav"
  $R --format 9x16 --lang es --out out/obelcha_ad_9x16_ES.mp4
  $R --format 1x1  --lang es --out out/obelcha_ad_1x1_ES.mp4
  $R --format 16x9 --lang es --out out/obelcha_ad_16x9_ES.mp4
  $R --format 9x16 --lang en --out out/obelcha_ad_9x16_EN.mp4
  $R --format 9x16 --lang fr --out out/obelcha_ad_9x16_FR.mp4
fi
bash scripts/qa.sh
ls -la out/*.mp4
