#!/usr/bin/env bash
# Build the B-roll edit (broll/*.mp4 are Mixkit free-licence clips) cut to the speech's phrases.
# each line: id  src_start  speed  crop_center_x  out_start  out_end
set -e
cd "$(dirname "$0")"
G="eq=contrast=1.12:brightness=-0.05:saturation=0.55:gamma=0.95,colorbalance=rs=0.04:gs=0.0:bs=-0.03:rh=0.05:bh=-0.04,curves=all='0/0 0.15/0.07 0.5/0.44 0.85/0.86 1/0.94'"
mkdir -p seg; : > seg/list.txt
i=0
while read -r id ss sp cx a b; do
  [ -z "$id" ] && continue; i=$((i+1)); d=$(python3 -c "print(round($b-$a,4))"); srcd=$(python3 -c "print(round(($b-$a)*$sp+0.3,3))")
  x=$(python3 -c "print(max(0,min(1920-608,int($cx)-304)))")
  f="crop=608:1080:$x:0,scale=1080:1920:flags=lanczos,setpts=PTS/$sp"
  if python3 -c "import sys; sys.exit(0 if $sp < 0.95 else 1)"; then f="$f,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1"; fi
  ffmpeg -nostdin -loglevel error -y -ss $ss -t $srcd -i broll/$id.mp4 -an -vf "$f,fps=30,trim=duration=$d,setpts=PTS-STARTPTS,$G" -c:v libx264 -crf 16 -pix_fmt yuv420p seg/$(printf %02d $i).mp4
  echo "file '$(printf %02d $i).mp4'" >> seg/list.txt
done <<'EOF'
52084  9.0  1.0  944   0.0   1.30
52089  0.55 1.0  840   1.30  2.60
52091  0.8  0.5  960   2.60  4.00
52099  2.0  1.0  960   4.00  5.20
52094  1.0  1.0  730   5.20  6.50
52102  1.0  1.0  1050  6.50  7.75
52099  11.0 0.7  960   7.75  9.90
52108  4.0  1.0  960   9.90  10.80
52097  2.6  0.6  640   10.80 12.20
52088  2.0  1.0  960   12.20 14.00
52084  14.0 1.0  944   14.00 15.90
52111  1.0  1.0  1120  15.90 17.25
52317  1.0  1.0  1380  17.25 19.35
52091  3.2  0.5  960   19.35 21.60
EOF
ffmpeg -loglevel error -y -f concat -safe 0 -i seg/list.txt -c:v libx264 -crf 16 -pix_fmt yuv420p -r 30 broll_edit.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 broll_edit.mp4
