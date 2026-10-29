#!/usr/bin/env bash
# Download Pinterest photos/videos into pinterest-downloads/<board-or-search>/.
# Usage: scripts/pinterest-download.sh <pin/board URL | "search terms"> [max items, default 40]
# Uses pinterest-dl (videos as MP4, highest quality); falls back to gallery-dl.
set -uo pipefail

TARGET="${1:?give a Pinterest pin/board URL or a search term}"
NUM="${2:-40}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/pinterest-downloads"

slug() { echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-60; }

if [[ "$TARGET" =~ ^https?:// ]]; then
  # Board URLs look like pinterest.com/<user>/<board>/; pins like /pin/<id>/.
  path="$(echo "$TARGET" | sed -E 's#^https?://[^/]+/##; s#[?].*##; s#/+$##')"
  case "$path" in
    pin/*) name="pin-$(echo "$path" | cut -d/ -f2)" ;;
    search/*) name="search-$(slug "$(echo "$TARGET" | sed -E 's/.*[?&]q=([^&]*).*/\1/' | sed 's/%20/ /g; s/+/ /g')")" ;;
    *) name="$(slug "$(echo "$path" | awk -F/ '{print ($2 ? $2 : $1)}')")" ;;
  esac
  MODE=scrape
else
  name="search-$(slug "$TARGET")"
  MODE=search
fi

OUT="$ROOT/$name"
mkdir -p "$OUT"
echo "→ $MODE: $TARGET"
echo "→ saving to $OUT"

if ! pinterest-dl "$MODE" "$TARGET" -o "$OUT" -n "$NUM" --video --timeout 30 --delay 0.5; then
  echo "pinterest-dl failed, trying gallery-dl…"
  if [[ "$MODE" == search ]]; then
    TARGET="https://www.pinterest.com/search/pins/?q=$(echo "$TARGET" | sed 's/ /%20/g')"
  fi
  gallery-dl --range "1-$NUM" -D "$OUT" "$TARGET" || echo "gallery-dl failed too."
fi

# Any leftover .ts video streams → MP4.
for ts in "$OUT"/*.ts; do
  [[ -e "$ts" ]] || continue
  ffmpeg -y -loglevel error -i "$ts" -c copy -movflags +faststart "${ts%.ts}.mp4" && rm -f "$ts"
done

photos=$(find "$OUT" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.gif' \) | wc -l)
videos=$(find "$OUT" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.webm' \) | wc -l)
echo "✓ saved $photos photos and $videos videos to pinterest-downloads/$name"
