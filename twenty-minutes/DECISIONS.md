# TWENTY MINUTES: decisions

## Brief
Educational short (TikTok / Reels / Shorts), 1080×1920 @ 30fps, 30.0s, loops seamlessly.
Hook: "You've got twenty minutes." A real no-equipment home workout people can follow.
No music, only bespoke sound design. Voiceover: ElevenLabs "Alex Wright", supplied by the user.

## Approved concept: "20:00", the clock is the story
A 20:00 timer is the hero. It becomes the face of a ring of 20 one-minute slices
(4 rounds × 5 moves; each slice = 40s work + 20s rest). Each move is demonstrated by a
point-light "motion-capture" figure (joints as dots, solved with IK so limbs never stretch).

## Workout (accurate, beginner-friendly)
5 moves × 40s on / 20s off × 4 rounds = 20:00.
Squat · Push-up (knees down OK) · Reverse lunge · Glute bridge · Mountain climbers.
Round 1 = warm-up, last round = all out.

## Design system
| Token | Value | Role |
|---|---|---|
| bg | #0A0A0B | studio near-black + warm light pool + vignette + live grain |
| ink | #EDEBE6 | type, joints |
| work | #FF5B1F | effort only: active joints, work slices, the clock colon |
| rest | #5E5E63 | rest slices, secondary labels |
| line | #26262A | tracks, rulers |

- Display: Archivo, weight 900, width 125% (expanded). Tabular figures for the clock.
- Text/labels: JetBrains Mono 500–700, uppercase, tracked +0.16–0.42em.
- Grid: 96px side margins; key content inside y 230–1500 (clear of TikTok/Reels UI).
- Motion: entrances bezier(0.16,1,0.3,1); type settle bezier(0.22,0.9,0.2,1);
  whips bezier(0.75,0,0.12,1); body bezier(0.6,0,0.3,1). No bounce, no overshoot.
  Sub-frame motion blur on the figures; directional blur on whips.

## Storyboard (frames, locked to VO word timestamps, see src/timeline.ts)
| # | Frames | Scene | Transition out |
|---|---|---|---|
| 1 | 0–80 | 20:00 hook, locks on "twenty" (f13) | the clock becomes the ring's face |
| 2 | 80–212 | ring of 20 slices, rules on each word | zoom through slice 1 |
| 3 | 212–296 | 01 SQUAT, hips back / chest up | squat sinks → vertical whip down |
| 4 | 296–421 | 02 PUSH-UP, body line, knees-down variant | body line runs out and splits the frame |
| 5 | 421–511 | 03 REVERSE LUNGE, both knees 90° | through the numeral "4" |
| 6 | 511–592 | 04 GLUTE BRIDGE, hip arc, the word SQUEEZE compresses | spin |
| 7 | 592–683 | 05 MOUNTAIN CLIMBERS, tempo doubles on "Fast." | collapses into the clock face |
| 8 | 683–775 | ring fast-forwards 20 minutes; round 1 = warm-up, round 4 = all out | ring shrinks into the full stop |
| 9 | 775–900 | SAVE THIS. → clock rolls back to 20:00, locks on "now" | last frame == first frame (loop) |

## Sound
All synthesised in tools/sfx.py (numpy/scipy): sub hits with a mid "knock" for phone speakers,
a mechanical clock latch, ticks, zips, swells, spin, squeeze. SFX bus ducks 4.5 dB under the voice.
Master: two-pass loudnorm, linear, −14.0 LUFS integrated, −1.5 dBTP.

## Versions
- v01: first full render.
- v02: live clock blink, camera drift, live cue anchors, label/exit timing fixes.
- v03: hero clock + labels clear of the platform button rail. DELIVERED (repo root: twenty-minutes-v03.mp4).

## Feedback log
- "Make it shorter, ~30 seconds, storyboard built for retention." → 30s cut, loop ending.
