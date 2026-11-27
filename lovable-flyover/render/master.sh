#!/usr/bin/env bash
# master.sh <in.wav> <out.wav>: gain to -14 LUFS with a 4x-oversampled limiter at -1 dBTP, measured and corrected twice
set -e
meas() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk '/I:/{i=$2} /LRA:/{l=$2} /Peak:/{tp=$2} END{print i, l, tp}'; }
cur="$1"
for pass in 1 2 3; do
  read I L TP < <(meas "$cur"); G=$(awk -v i="$I" 'BEGIN{print -14 - i}')
  ffmpeg -hide_banner -loglevel error -y -i "$cur" -af "volume=${G}dB,aresample=192000,alimiter=limit=0.88:attack=1:release=60:level=disabled,aresample=48000" -c:a pcm_s24le "$2.p$pass.wav"
  cur="$2.p$pass.wav"
done
mv "$cur" "$2"; rm -f "$2".p*.wav
read I L TP < <(meas "$2"); echo "master: I=$I LUFS  LRA=$L LU  TP=$TP dBTP"
