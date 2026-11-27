#!/usr/bin/env bash
# mix-voiceover.sh <vo.wav> <music.wav|-> <sfx.wav|-> <out.wav> [target LUFS, default -14]
# Voice leveled to -16 LUFS. Music bed leveled 8 LU under the voice, ducks further while the voice speaks
# and comes back up when it stops (cut and fade the music to the video length first). SFX added as designed.
# Then gain to the target with a 4x-oversampled peak limiter, measured and corrected twice.
set -euo pipefail
VO="$1"; MUSIC="$2"; SFX="$3"; OUT="$4"; T="${5:--14}"
lufs() { ffmpeg -nostats -i "$1" -af ebur128 -f null - 2>&1 | awk '/^ *I:/{v=$2} END{print v}'; }
gain() { awk -v a="$1" -v b="$2" 'BEGIN{printf "%.2f", a-b}'; }
GV=$(gain -16 "$(lufs "$VO")")
IN=(-i "$VO"); MIX="[vo]"; N=1; K=1
if [ "$MUSIC" != "-" ]; then
  GM=$(gain -24 "$(lufs "$MUSIC")"); IN+=(-i "$MUSIC")
  FC="[0:a]aformat=channel_layouts=stereo,volume=${GV}dB,asplit=2[vo][k0];[k0]apad[key];"
  FC+="[1:a]aformat=channel_layouts=stereo,volume=${GM}dB[bed];[bed][key]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=400[duck];"
  MIX+="[duck]"; N=2; K=2
else
  FC="[0:a]aformat=channel_layouts=stereo,volume=${GV}dB[vo];"
fi
if [ "$SFX" != "-" ]; then IN+=(-i "$SFX"); FC+="[$K:a]aformat=channel_layouts=stereo[fx];"; MIX+="[fx]"; N=$((N+1)); fi
FC+="${MIX}amix=inputs=$N:duration=longest:normalize=0[pre]"
P1="${OUT%.*}_p1.wav"; P2="${OUT%.*}_p2.wav"
LIM="aresample=192000,alimiter=limit=0.79:attack=1:release=60:level=false,aresample=48000"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map "[pre]" -ar 48000 "$P1"
ffmpeg -v error -y -i "$P1" -af "volume=$(gain "$T" "$(lufs "$P1")")dB,$LIM" "$P2"
ffmpeg -v error -y -i "$P2" -af "volume=$(gain "$T" "$(lufs "$P2")")dB,$LIM" "$OUT"
rm -f "$P1" "$P2"
ffmpeg -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | awk -v o="$OUT" '/^ *I:/{i=$2} /^ *Peak:/{p=$2} END{print "Mixed: " o "  loudness " i " LUFS, true peak " p " dBFS"}'
