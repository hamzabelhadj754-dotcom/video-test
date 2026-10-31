#!/usr/bin/env bash
# Reinstall the motion-graphics toolkit on a fresh cloud machine (it is temporary).
# Usage: bash scripts/setup-tools.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Remotion project deps (3D, effects, Lottie, GSAP...) from the lockfile.
(cd "$ROOT/fitness-video" && npm ci --no-audit --no-fund)

# 2. HyperFrames CLI (HTML → video, GSAP timelines, beat detection, frame checks).
npm install -g --no-audit --no-fund hyperframes@0.8.223

# 3. Blender (real 3D: extruded type, particles, volumetrics), checksum-verified.
BLENDER_VER=5.2.3
BLENDER_SHA=78486c018b4443efe5e75ab54c290ed8c15abafd249b862c2c9ce2530a918eec
if ! /opt/blender/blender --version >/dev/null 2>&1; then
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/blender.tar.xz" \
    "https://download.blender.org/release/Blender${BLENDER_VER%.*}/blender-${BLENDER_VER}-linux-x64.tar.xz"
  echo "$BLENDER_SHA  $tmp/blender.tar.xz" | sha256sum -c -
  mkdir -p /opt/blender && tar -xf "$tmp/blender.tar.xz" -C /opt/blender --strip-components=1
  rm -rf "$tmp"
fi

# 4. Speech transcription (word timestamps for caption sync) and Pinterest downloader.
pip install -q faster-whisper pinterest-dl gallery-dl

echo "✓ Remotion $(cd "$ROOT/fitness-video" && node -p 'require("remotion/package.json").version')"
echo "✓ $(hyperframes --version 2>/dev/null | head -1)"
echo "✓ $(/opt/blender/blender --version 2>/dev/null | head -1)"
