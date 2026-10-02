#!/usr/bin/env bash
# QA renders from the final videos: contact sheets (1 frame/s), 12-frame transition strips, phone preview.
set -euo pipefail
cd "$(dirname "$0")/.."
QA=${QA_DIR:-qa}
mkdir -p "$QA"
for f in 9x16 1x1 16x9; do
  v=out/obelcha_ad_${f}_ES.mp4; [ -f "$v" ] || continue
  case $f in 9x16) s=216:384; c=10;; 1x1) s=300:300; c=10;; 16x9) s=384:216; c=5;; esac
  ffmpeg -v error -y -i "$v" -vf "fps=1,scale=$s,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='%{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=${c}x$((20/c)):padding=4:color=0x333333" -frames:v 1 "$QA/contact_sheet_${f}.png"
done
# 12-frame strips around each transition (9:16 master)
python3 - "$QA" <<'PY'
import json, subprocess, sys
qa = sys.argv[1]
tl = json.load(open('timeline.json'))
for tr in tl['transitions']:
    a, b = tr['start'], tr['end']; d = b - a
    ts = [a + d * i / 11 for i in range(12)]
    sel = '+'.join(f"eq(n\\,{round(t * 30)})" for t in ts)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'out/obelcha_ad_9x16_ES.mp4', '-vf',
                    f"select='{sel}',scale=180:320,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='%{{pts\\:hms}}':x=4:y=4:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6,tile=12x1:padding=3:color=0x333333",
                    '-vsync', '0', '-frames:v', '1', f"{qa}/transition_{tr['id']}_{tr['kind']}.png"], check=True)
PY
# phone-size preview: 9:16 at ~iPhone logical width with platform UI zones shaded
ffmpeg -v error -y -i out/obelcha_ad_9x16_ES.mp4 -vf "scale=390:694,drawbox=x=iw*80/1080:y=ih*250/1920:w=iw*860/1080:h=ih*1270/1920:color=0xff3355@0.9:t=2,drawbox=y=ih*250/1920-1:w=iw:h=1:color=0xff3355@0.5:t=fill,drawbox=y=ih-ih*400/1920:w=iw:h=1:color=0xff3355@0.5:t=fill,pad=430:774:20:40:color=0x1a1a1a" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$QA/phone_preview_9x16.mp4"
ffmpeg -v error -y -i "$QA/phone_preview_9x16.mp4" -vf "select='eq(n\,15)+eq(n\,120)+eq(n\,270)+eq(n\,400)+eq(n\,580)',tile=5x1:padding=8:color=0x000000" -vsync 0 -frames:v 1 "$QA/phone_preview_frames.png"
echo "✓ QA renders in $QA/"
