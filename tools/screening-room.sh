#!/usr/bin/env bash
# screening-room.sh: "watch" a rendered video before delivering it.
# Needs only ffmpeg, ffprobe and awk.
#
# Usage:  bash screening-room.sh <video> [out_dir] [frames_per_second_in_strips]
# Env:    BEATS=beats.txt   (optional, one beat time in seconds per line: checks cut sync)
#         LUFS_TARGET=-14   (optional loudness target, default -14)
#
# Output (in out_dir, default <video>_review/):
#   report.md         numbers, warnings, cut list, motion chart, critique template
#   contact.png       the whole film on one sheet (30 tiles, left to right, top to bottom)
#   strips/sec_NNN.png  one image per second of film, N frames side by side (read motion here)
#   first_frame.png, last_frame.png
#   safe_zones.png    vertical videos only: approximate TikTok/Reels UI zones in red
set -euo pipefail

IN="${1:?usage: screening-room.sh <video> [out_dir] [strip_fps]}"
OUT="${2:-${IN%.*}_review}"
SPS="${3:-6}"
LUFS_TARGET="${LUFS_TARGET:--14}"
mkdir -p "$OUT/strips"
rm -f "$OUT"/strips/sec_*.png

# p <stream selector or ""> <entry>: print a single value, no trailing separators.
p() { local sel=(); [ -n "$1" ] && sel=(-select_streams "$1");
      ffprobe -v error "${sel[@]}" -show_entries "$2" -of default=nw=1:nk=1 "$IN" | head -1 | tr -d ' ,\r'; }
DUR=$(p "" format=duration)
W=$(p v:0 stream=width)
H=$(p v:0 stream=height)
FPS_RAW=$(p v:0 stream=avg_frame_rate)
FPS=$(awk -v f="$FPS_RAW" 'BEGIN{split(f,a,"/"); printf "%.3f", (a[2]>0? a[1]/a[2] : a[1])}')
PIX=$(p v:0 stream=pix_fmt)
VCODEC=$(p v:0 stream=codec_name)
PRIM=$(p v:0 stream=color_primaries)
AUDIO=$(p a:0 stream=codec_name || true)
TILE_W=$([ "$W" -ge "$H" ] && echo 480 || echo 240)
STRIP_W=$([ "$W" -ge "$H" ] && echo 320 || echo 180)

# 1. Contact sheet: 30 evenly spaced frames.
CFPS=$(awk -v d="$DUR" 'BEGIN{printf "%.5f", 30/d}')
ffmpeg -v error -y -i "$IN" -vf "fps=$CFPS,scale=$TILE_W:-2,tile=6x5:padding=4:color=0x808080" \
  -frames:v 1 "$OUT/contact.png"

# 2. Per-second strips: read spacing between frames to judge easing and speed.
ffmpeg -v error -y -i "$IN" -vf "fps=$SPS,scale=$STRIP_W:-2,tile=${SPS}x1:padding=2:color=0x808080" \
  -start_number 0 "$OUT/strips/sec_%03d.png"

# 3. First and last frames (thumbnails and loop points).
ffmpeg -v error -y -i "$IN" -frames:v 1 "$OUT/first_frame.png"
ffmpeg -v error -y -sseof -0.3 -i "$IN" -update 1 "$OUT/last_frame.png"

# 4. Safe zones for vertical video (approximate platform UI areas).
if [ "$H" -gt "$W" ]; then
  SFPS=$(awk -v d="$DUR" 'BEGIN{printf "%.5f", 8/d}')
  ffmpeg -v error -y -i "$IN" -vf "fps=$SFPS,\
drawbox=x=0:y=0:w=iw:h=ih*0.10:color=red@0.35:t=fill,\
drawbox=x=0:y=ih*0.78:w=iw:h=ih*0.22:color=red@0.35:t=fill,\
drawbox=x=iw*0.85:y=ih*0.38:w=iw*0.15:h=ih*0.40:color=red@0.35:t=fill,\
scale=$TILE_W:-2,tile=4x2:padding=4:color=0x808080" -frames:v 1 "$OUT/safe_zones.png"
fi

# 5. Cuts (scene changes).
ffmpeg -nostats -i "$IN" -an -vf "select='gt(scene,0.30)',metadata=print" -f null - 2>&1 \
  | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 \
  | awk -v fps="$FPS" '$1 >= 2/fps' > "$OUT/cuts.txt" || true   # ignore the first frames

# 6. Black frames and frozen stretches.
ffmpeg -nostats -i "$IN" -an -vf "blackdetect=d=0.04:pix_th=0.08,freezedetect=n=0.002:d=0.5" -f null - 2>&1 \
  | grep -Eo 'black_start:[0-9.]+ black_end:[0-9.]+|freeze_start: [0-9.]+|freeze_end: [0-9.]+' \
  > "$OUT/black_freeze.txt" || true

# 7. Motion energy per 0.5 s (mean luma change between frames).
ffmpeg -nostats -i "$IN" -an -vf "signalstats,metadata=print:key=lavfi.signalstats.YDIF" -f null - 2>&1 \
  | awk '/pts_time:/{for(i=1;i<=NF;i++) if($i ~ /^pts_time:/){split($i,a,":"); t=a[2]}}
         /YDIF=/{split($0,b,"="); v=b[2]+0; k=int(t/0.5); s[k]+=v; c[k]++; if(k>m)m=k}
         END{for(k=0;k<=m;k++) if(c[k]) printf "%.1f %.2f\n", k*0.5, s[k]/c[k]}' > "$OUT/motion.txt" || true

# 8. Audio: loudness, true peak, silences.
LUFS="n/a"; TP="n/a"
if [ -n "$AUDIO" ]; then
  ffmpeg -nostats -i "$IN" -vn -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' > "$OUT/loudness.txt" || true
  LUFS=$(awk '/^ *I:/{print $2; exit}' "$OUT/loudness.txt")
  TP=$(awk '/True peak:/{f=1} f && /Peak:/{print $2; exit}' "$OUT/loudness.txt")
  ffmpeg -nostats -i "$IN" -vn -af silencedetect=n=-50dB:d=0.3 -f null - 2>&1 \
    | grep -Eo 'silence_(start|end): [0-9.]+' > "$OUT/silence.txt" || true
fi

# 9. Report.
R="$OUT/report.md"
{
echo "# Screening report: $(basename "$IN")"
echo
echo "| Spec | Value |"; echo "|---|---|"
echo "| Resolution | ${W}x${H} |"
echo "| Frame rate | $FPS fps |"
echo "| Duration | $(printf '%.2f' "$DUR") s |"
echo "| Video codec / pixel format | $VCODEC / $PIX |"
echo "| Color primaries tag | ${PRIM:-missing} |"
echo "| Audio | ${AUDIO:-none} |"
echo "| Integrated loudness | $LUFS LUFS (target $LUFS_TARGET) |"
echo "| True peak | $TP dBFS (max -1.0) |"
echo
echo "## Automatic warnings"
WARN=0
w() { echo "- WARNING: $1"; WARN=$((WARN+1)); }
[ "$PIX" != "yuv420p" ] && w "pixel format is $PIX; use yuv420p for delivery"
case "$PRIM" in bt709) ;; *) w "color tags missing or not bt709 (colors may look washed out)";; esac
awk -v f="$FPS" 'BEGIN{exit !(f!=int(f) && f!=23.976 && f!=29.970 && f!=59.940)}' && w "unusual frame rate $FPS"
[ -s "$OUT/black_freeze.txt" ] && grep -q black_start "$OUT/black_freeze.txt" && w "black frames detected (see list below)"
[ -s "$OUT/black_freeze.txt" ] && grep -q freeze_start "$OUT/black_freeze.txt" && w "frozen stretches of 0.5 s or more (dead holds break 'camera never fully still')"
if [ "$LUFS" != "n/a" ] && [ -n "$LUFS" ]; then
  awk -v l="$LUFS" -v t="$LUFS_TARGET" 'BEGIN{d=l-t; if(d<0)d=-d; exit !(d>1)}' && w "loudness $LUFS LUFS is more than 1 LU from target $LUFS_TARGET"
fi
if [ "$TP" != "n/a" ] && [ -n "$TP" ]; then
  awk -v p="$TP" 'BEGIN{exit !(p>-1.0)}' && w "true peak $TP dBFS is above -1.0"
fi
[ -z "$AUDIO" ] && w "no audio track (is this meant to be silent?)"
[ "$WARN" -eq 0 ] && echo "- None."
echo
echo "## Cuts and shot lengths"
if [ -s "$OUT/cuts.txt" ]; then
  awk -v d="$DUR" -v fps="$FPS" 'BEGIN{prev=0; n=1}
    {len=$1-prev; flag=(len<0.25?"  <- very short, intended?":""); printf "- Shot %d: %.2f to %.2f s (%.2f s, %d frames)%s\n", n, prev, $1, len, len*fps+0.5, flag; prev=$1; n++}
    END{len=d-prev; printf "- Shot %d: %.2f to %.2f s (%.2f s, %d frames)\n", n, prev, d, len, len*fps+0.5}' "$OUT/cuts.txt"
else
  echo "- No hard cuts detected (one continuous shot, or soft transitions only)."
fi
if [ -n "${BEATS:-}" ] && [ -s "${BEATS:-}" ] && [ -s "$OUT/cuts.txt" ]; then
  echo
  echo "## Cut-to-beat sync (BEATS=$BEATS)"
  awk -v fps="$FPS" 'NR==FNR{b[n++]=$1; next}
    {best=1e9; for(i=0;i<n;i++){d=$1-b[i]; if((d<0?-d:d)<(best<0?-best:best)) best=d}
     fr=best*fps; flag=((fr<0?-fr:fr)>1.5?"  <- off beat":"");
     printf "- Cut at %.2f s: nearest beat offset %+.0f ms (%+.1f frames)%s\n", $1, best*1000, fr, flag}' "$BEATS" "$OUT/cuts.txt"
fi
echo
echo "## Black frames and frozen stretches"
if [ -s "$OUT/black_freeze.txt" ]; then sed 's/^/- /' "$OUT/black_freeze.txt"; else echo "- None."; fi
if [ -s "${OUT}/silence.txt" ]; then echo; echo "## Silences (below -50 dB, 0.3 s or more)"; sed 's/^/- /' "$OUT/silence.txt"; fi
echo
echo "## Motion energy per half second"
echo
echo "Mean change between frames. Near 0 = still, 1 to 3 = gentle drift, 5 to 15 = clear motion, spikes = cuts or flashes."
echo "Look for: dead flat stretches, energy that never varies (no rhythm), and peaks that do not match the music."
echo
echo '```'
awk 'NR==FNR{if($2>m)m=$2; next}
     {n=(m>0? int($2/m*40+0.5):0); bar=""; for(i=0;i<n;i++)bar=bar "#"; printf "%6.1fs %6.2f %s\n", $1, $2, bar}' \
     "$OUT/motion.txt" "$OUT/motion.txt"
echo '```'
echo
echo "## Images to open now (all of them, in order)"
echo "1. \`contact.png\`: the whole film. Judge story, rhythm, color consistency, hierarchy."
echo "2. \`strips/sec_000.png\` to \`strips/$(ls "$OUT/strips" | tail -1)\`: ${SPS} frames per second of film. Judge easing, speed, overlap, blur, text."
echo "3. \`first_frame.png\` and \`last_frame.png\`: thumbnail and end card quality."
[ "$H" -gt "$W" ] && echo "4. \`safe_zones.png\`: nothing important inside the red platform UI areas."
echo
echo "## Screening notes (fill in after viewing every image)"
echo
echo "| Time | Issue | Severity (Blocker / Major / Polish) | Fix |"
echo "|---|---|---|---|"
echo "|  |  |  |  |"
echo
echo "Rubric scores with one line of evidence each (timecode). Deliver only with zero Blockers, zero Majors and every score 8 or higher."
} > "$R"

echo "Screening done: $R"
echo "Now OPEN contact.png, every strip in $OUT/strips, the first/last frames$([ "$H" -gt "$W" ] && echo ' and safe_zones.png'), then fill in the notes."
