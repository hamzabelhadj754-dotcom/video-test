#!/usr/bin/env bash
# Regenerates the 16:9 project (../nobody-is-coming-16x9) from the 9:16 master.
# Scenes are shared source; each scene's CSS has an (orientation: landscape) layout,
# so only the declared canvas size changes here.
set -e
cd "$(dirname "$0")/.."
OUT=../nobody-is-coming-16x9
mkdir -p "$OUT/compositions"
rm -f "$OUT/compositions" 2>/dev/null || true
mkdir -p "$OUT/compositions"
for f in compositions/*.html; do
  sed -e 's/data-width="1080" data-height="1920"/data-width="1920" data-height="1080"/' "$f" > "$OUT/$f"
done
sed -e 's/width=1080, height=1920/width=1920, height=1080/' \
    -e 's/width: 1080px; height: 1920px;/width: 1920px; height: 1080px;/' \
    -e 's/data-width="1080" data-height="1920"/data-width="1920" data-height="1080"/g' index.html > "$OUT/index.html"
ln -sfn ../nobody-is-coming/assets "$OUT/assets"
cp hyperframes.json "$OUT/"
echo "16:9 project regenerated"
