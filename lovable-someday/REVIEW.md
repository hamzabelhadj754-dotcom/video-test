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

## v03
- Technical: 1920x1080, 30fps, 22.00s, h264 yuv420p bt709, -13.7 LUFS, true peak -4.4 dBFS, no warnings,
  no black or frozen frames, no hard cuts (the film is one continuous move).
- Round 1 fixes: dark stain on the page before the lift (field now grows from the line's own shape),
  prompt text and box separating for 2 frames, stepped edges on the growing check (feathered), heart logo popping off.
- Not verified by ear; mix checked with meters only.

## v04
- Feedback: the send transition was not smooth.
- Fix: send is now one camera pull-back. Prompt box and editor move as one rigid world (shared transform
  from `pullback()` in `src/measure.ts`); the box takes the chat bubble's shape and hands over to it mid-move.
- Round 1 issues fixed: app window popping in at the first frame (now fades in), brightness jump when the
  editor shading took over (now eased over 1.2s), doubled text at peak speed (longer move + speed blur).
- Technical: -13.8 LUFS, true peak -4.8 dBFS, no warnings, no hard cuts.
