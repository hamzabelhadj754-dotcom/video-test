#!/usr/bin/env bash
# Render all 5 deliverables with the HyperFrames CLI (npx hyperframes render).
set -euo pipefail
cd "$(dirname "$0")/.."
export HYPERFRAMES_TELEMETRY=0 DO_NOT_TRACK=1
# Reuse a local Chromium headless shell if present (skips `hyperframes browser ensure` download)
HS=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1 || true)
[ -n "$HS" ] && export PRODUCER_HEADLESS_SHELL_PATH="$HS" HYPERFRAMES_BROWSER_PATH="$HS"
HF="npx --yes hyperframes@0.8.112"
node scripts/hf_build.mjs
mkdir -p out
for v in 9x16_es 1x1_es 16x9_es 9x16_en 9x16_fr; do
  f=${v%_*}; l=${v#*_}
  (cd "hyperframes/$v" && $HF render . -o "../../out/obelcha_ad_${f}_${l^^}.mp4" --fps 30 --quality high --crf 19 --workers 4)
done
ls -la out/*.mp4
