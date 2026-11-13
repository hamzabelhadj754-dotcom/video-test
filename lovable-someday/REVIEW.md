# Screening notes

## v01 (first full render)
| Time | Issue | Severity | Fix |
|---|---|---|---|
| 4.5s | Prompt box appeared over the still-bright page | Major | Darken the world first, box enters after (fixed before v01 render) |
| 5.0–8.0s | Prompt box low contrast, shot felt dim and dead | Major | Brighter box and border, larger and stronger glow (v02) |
| 10.0s | Selected day number invisible under the sliding pill | Blocker | Pill now carries its own inverted labels (fixed before v01 render) |
| 18.0–22.0s | End-card glow sat too low | Polish | Raised the resting glow (v02) |

## v02
- Technical: 1920x1080, 30fps, 22.00s, h264 yuv420p bt709, -13.7 LUFS, true peak -4.1 dBFS, no warnings, no black or frozen frames.
- Cuts land on the 120bpm grid at 8.0s, 10.0s, 11.5s, 13.0s and 15.0s.
- Not verified by ear: the mix was checked with meters and a spectrogram only.
- Known limits: snap-zoom motion blur is a velocity-driven gaussian blur, not true per-object blur.
