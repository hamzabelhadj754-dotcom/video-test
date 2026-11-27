# Screening notes: TWENTY MINUTES

Method: `tools/screening-room.sh` on every render; contact sheet, all 30 per-second strips
(6 frames each), first/last frames, safe-zone sheet, report numbers.

## v01: round 1
| Time | Issue | Severity | Fix in v02 |
|---|---|---|---|
| 0.0–1.5s | Hook is a frozen frame (identical strip frames) | Major | Colon blinks like a live clock (1 Hz) + slow push-in |
| 2.3–4.4s | "YOU'VE GOT" rides into the ring, erases ~2s late | Major | Label backspaces out in ~10 frames |
| 3.0–3.9s, 5.0–5.8s | Near-static stretches between words | Major | Slow drift on the clock/ring world (zoom target re-computed) |
| 8–9s, holds in every move | Action freezes during holds | Major | Camera push on the action layer only; title/header stay locked (parallax) |
| 8.6–9.5s | Squat cue lines point at where the hip *was* | Major | Cues anchored to live joints (tracking callouts) |
| 27.1s | "SAVE THIS." exit overlaps the clock roll-in | Polish | Exit 4 frames earlier |
| 28–30s | Final hold is static | Major | Colon blink + settle drift back to the exact frame-0 framing |

## v02: round 2
| Time | Issue | Severity | Fix in v03 |
|---|---|---|---|
| 0–2s, 27.5–30s | Last "0" of the hero clock sits under the TikTok/Reels button rail | Blocker | Hook clock 250 → 206px; measured: 0 ink pixels in the rail zone |
| 11–13s | "ONE STRAIGHT LINE" label runs into the rail | Major | Label moved left |
Everything else: holds now breathe, transitions land on their words, loop seam = grain + blink only
(mean frame-0 vs frame-899 difference 1.8/255).

## Technical (v03)
1080×1920 · 30.000 fps · 30.06s · h264 yuv420p · BT.709 tagged · AAC 320k ·
−14.1 LUFS integrated · −1.5 dBFS true peak · no black frames, no freezes, no warnings.
Fonts verified rendered (no fallback) on every strip.

## Rubric (v03)
| Criterion | Score | Evidence |
|---|---|---|
| Concept | 9 | The hook *is* the system: 20:00 becomes the ring that explains the whole workout (0–7s) and returns as the loop (27–30s) |
| Typography | 9 | Archivo expanded black + tracked mono; tabular clock figures; one accent (the colon) |
| Composition | 8 | One hero per moment; fixed header/progress grid across all five moves |
| Motion quality | 8 | Custom curves, staggered glyph rises, sub-frame figure blur, whip blur (9.5s), live drift |
| Transitions | 9 | Each motivated: clock→face, zoom through slice 1, sink→whip down, body line splits frame, through the "4", spin, collapse into clock, ring→full stop |
| Color and finish | 8 | Near-black studio, warm light pool, grain plates, no banding (checked at 100%) |
| Sound | 8 | All synthesised; hits on every transition; −14 LUFS; voice-first ducking (judged by measurement, not by ear) |
| Brand fit | 8 | Feels like a training-app identity rather than a generic fitness edit |
| Template test | 9 | IK point-light figures + clock-ring system are bespoke |
| Taste | 8 | Single accent colour, one surprise (ring → full stop), effects all carry information |
| Big-brand test | 8 | Holds up as an Apple Fitness+/NTC-adjacent spot; figure is abstract by design |
| No basic transitions | 9 | Zero crossfades or preset wipes |
| Craft level (2C) | 8 | Precise rhythm locked to VO word timestamps; numbers/counters are functional |

## Known limits (honest)
- The point-light figure is deliberately abstract; it shows form and rhythm, not a real athlete.
- Sound was balanced by loudness measurement and peak analysis; a listen on a phone speaker
  is the one check I cannot do myself.
