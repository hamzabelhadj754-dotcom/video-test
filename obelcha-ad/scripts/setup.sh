#!/usr/bin/env bash
# One-time setup: Node + Python deps and the local TTS / ASR models (~450 MB, cached in .cache/tts).
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --silent
python3 -m pip install -q numpy scipy soundfile pyloudnorm sherpa-onnx
mkdir -p .cache/tts && cd .cache/tts
REL=https://github.com/k2-fsa/sherpa-onnx/releases/download
[ -d kokoro-multi-lang-v1_0 ] || curl -sSL "$REL/tts-models/kokoro-multi-lang-v1_0.tar.bz2" | tar xj
[ -d sherpa-onnx-whisper-base ] || curl -sSL "$REL/asr-models/sherpa-onnx-whisper-base.tar.bz2" | tar xj   # optional VO QA
echo "✓ setup complete"
