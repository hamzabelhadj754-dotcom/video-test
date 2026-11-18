#!/usr/bin/env bash
# Replace frame ranges of the base render with the motion-blurred move renders. Usage: splice_moves.sh <base.mp4> <out.mp4>
set -euo pipefail
BASE=$1; OUT=$2; D=${MV:-out/mv}/seg; mkdir -p $D; rm -f $D/*.mp4; : > $D/list.txt
E="-c:v libx264 -profile:v high -crf 16 -preset medium -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -an"
TOTAL=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$BASE")
prev=0; n=0
while read -r i a b; do
  if [ "$a" -gt "$prev" ]; then
    ffmpeg -nostdin -v error -y -i "$BASE" -vf "trim=start_frame=$prev:end_frame=$a,setpts=PTS-STARTPTS" $E $D/s$(printf %03d $n).mp4; echo "file 's$(printf %03d $n).mp4'" >> $D/list.txt; n=$((n+1))
  fi
  ffmpeg -nostdin -v error -y -i ${MV:-out/mv}/mv$(printf %02d $i).mp4 $E $D/s$(printf %03d $n).mp4; echo "file 's$(printf %03d $n).mp4'" >> $D/list.txt; n=$((n+1))
  prev=$b
done < <(sort -n -k2 ${MV:-out/mv}/ranges.txt)
ffmpeg -nostdin -v error -y -i "$BASE" -vf "trim=start_frame=$prev:end_frame=$TOTAL,setpts=PTS-STARTPTS" $E $D/s$(printf %03d $n).mp4; echo "file 's$(printf %03d $n).mp4'" >> $D/list.txt
ffmpeg -nostdin -v error -y -f concat -safe 0 -i $D/list.txt -c copy "$OUT"
echo "spliced $OUT ($TOTAL base frames)"
