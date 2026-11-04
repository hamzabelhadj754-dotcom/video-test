# GainsDom: "STUDY" is not an action (20 s, 600 frames, 30 fps)

Lesson: the brain resists unclear tasks. Turn the task into the first visible, physical move.

## Safe area
- All primary text: x 110–800, y 360–1400. Max line width 700 px.
- System labels: y ≥ 300, x ≤ 800.
- Bottom rail: y 1470.
- Camera push never exceeds 112 % on the foreground. The text anchor sits at base x 170 so the left edge stays ≥ 110 (same check as test v2).

## Storyboard (30 fps)
| Frames | Time | Camera | Picture | Sound |
| --- | --- | --- | --- | --- |
| 0–90 | 0.0–3.0 | **Dolly 100 → 105 %**, cubic. Parallax 0.35 / 0.7 / 1.0. | A heavy **task card**: a 580×640 slab with a thick 6 px ink border, a slight drop shadow and a weight bar on its side. Inside it, **STUDY** (Archivo width 62, weight 900, 190 px). Above it: `TASK INPUT / UNCLEAR` (Inter, grey). Below it, a 0 % progress bar and `EST. TIME: ??`. On frame 0 the card already sits low and pressing; it sinks 8 px over 3 s (weight). | Low mechanical pulse at about 72 BPM, quiet |
| 90–98 | 3.0–3.27 | Anticipation: a 0.5 % pull-back | The card shudders once (4 px) | Click |
| 98–210 | 3.27–7.0 | **Clockwise tilt of 1°** (rotateZ on the foreground), the push continues to 108 % | **"STUDY" IS NOT AN ACTION.** (76 px Archivo, all white, "NOT" underlined) rises line by line via masks. Three prompt tags (52 px, bordered UI boxes) fly in and pile onto the card: one over its header, two under the word, so STUDY itself stays readable: **WHAT SUBJECT?** (3.9 s), **WHICH PAGE?** (4.4 s), **FOR HOW LONG?** (4.9 s), staggered with expo-out. **`FRICTION / HIGH`** in red (4.2 s). Pressure builds through tightening spacing; everything stays readable (prompts at 52 px). | Tension rise from 3.3 to 7.0 s, a click per prompt |
| 210–222 | 7.0–7.4 | Stillness before the climax (0.4 s) | Frozen | Silence |
| 222–240 | 7.4–8.0 | **Push-through.** Fast forward push 108 → 116 % through the collapsing interface. | Everything **compresses toward the centre**: the prompts scale to 0, the card squeezes to a horizontal bar | Suck-in |
| 240–390 | 8.0–13.0 | Push settles to 110 %, slow drift | The bar splits into **three action cards** stacked at three depths (parallax). Each one does a directional wipe from the left, then a lock-in with a 3-frame impact hold. 1. **OPEN THE BOOK** (8.2 s, foreground). 2. **PAGE 42** (9.4 s, between). 3. **READ ONE PARAGRAPH** (10.6 s). Each card has a check-box tick. The status label flips to **`NEXT ACTION / FOUND`** at 8.2 s with one red flash. The weight bar empties. `EST. TIME: 2 MIN`. | **Bass impact** at 8.2 s, a soft lock click per card |
| 390–510 | 13.0–17.0 | Camera keeps moving forward (110 → 113 %). Wipe the cards out to the left. | **DON'T START THE PROJECT.** (50 px, grey) and below it **START THE FIRST MOVE.** (124 px, white, 2 lines: START THE / FIRST MOVE.). A **thin red line travels under "FIRST MOVE."** (14.3 s). The phrase locks at 14.4 s with a 3-frame hold. | Click, then a low hit on the lock |
| 510–600 | 17.0–20.0 | Camera eases back to 100 %, so the loop matches frame 0's scale | Calm and minimal: **MAKE IT SO SMALL / YOUR BRAIN CAN'T NEGOTIATE.** (84 px). Below it, `NEXT ACTION: OPEN THE BOOK` (Inter, red label + white). **The red cursor blinks once** at 18.6 s. At 19.4 s the text wipes off left and the task card **STUDY** wipes back in from the right, landing on its exact frame-0 pose at frame 600. | Final subtle click on "OPEN THE BOOK" (17.6 s); the pulse continues for a seamless loop |

## Exact text timing
| Text | In | Out |
| --- | --- | --- |
| `TASK INPUT / UNCLEAR` | 0.0 | 7.4 |
| STUDY (card) | 0.0 | 7.4 (collapse) |
| "STUDY" IS NOT AN ACTION. | 3.3 / 3.5 (2 lines) | 7.4 |
| WHAT SUBJECT? / WHICH PAGE? / FOR HOW LONG? | 3.9 / 4.4 / 4.9 | 7.4 |
| FRICTION / HIGH | 4.2 | 8.2 |
| NEXT ACTION / FOUND | 8.2 | 13.0 |
| OPEN THE BOOK / PAGE 42 / READ ONE PARAGRAPH | 8.2 / 9.4 / 10.6 | 13.0 |
| DON'T START THE PROJECT. | 13.2 | 17.0 |
| START THE FIRST MOVE. | 13.7 (locks at 14.4) | 17.0 |
| MAKE IT SO SMALL / YOUR BRAIN CAN'T NEGOTIATE. | 17.2 / 17.5 | 19.4 |
| NEXT ACTION: OPEN THE BOOK | 17.6 | 19.4 |
| STUDY card returns (loop) | 19.4 | 20.0 = frame 0 |

## Camera plan (single forward direction)
1. Dolly 100 → 105 % (0–3 s).
2. Tilt 0 → +1° clockwise while the push continues to 108 % (3.3–7.0 s).
3. Hold (7.0–7.4 s).
4. **One push-through**, 108 → 116 % (7.4–8.0 s), settling to 110 %.
5. A slow push to 113 % (8–17 s).
6. Ease back to 100 % for the loop (17–20 s). The tilt returns to 0° by 8.0 s.

Hard cuts only at 8.2 s (the status flip) and on the cursor blink.

## Sound cues (sound.py: pure synthesis, no samples, loop-safe)
- **Bed:** a 40 Hz drone (800 whole cycles in 20 s) plus a soft low pulse at 72 BPM (24 whole beats in 20 s). It leans in slightly during the friction section.
- **3.0 s:** a dry click on the shudder.
- **3.3–7.0 s:** the tension rise (filtered noise plus a slow rising tone), with a click per headline line and per prompt (3.9 / 4.4 / 4.9 s).
- **7.0–7.4 s:** silence. Drone and pulse both stop.
- **7.42–8.0 s:** a suck-in swell, cut dead at the push-through.
- **8.2 s:** a clean bass impact on NEXT ACTION / FOUND.
- **8.5 / 9.7 / 10.9 s:** a soft lock click plus a small knock per card, with a tick 4 frames later when the box checks.
- **13.2 / 13.7 s:** line clicks. **14.4 s:** the low hit on FIRST MOVE.
- **17.6 s:** the final subtle click on OPEN THE BOOK. **18.6 s:** a tiny tick on the cursor blink. **19.45 s:** a soft click as the card returns.

## Versions
- `study-clean.mp4`: paper 1.2 %, grain 1.5 %, no scan lines, no dust, clean type edges.
- `study-textured.mp4`: paper 5 %, grain 6 %, faint scan lines, dust, a 1.3 px ink edge on the display type.
- `study-safe.mp4`: the textured version with the safe-area overlay. Danger zones are red: top 0–240, right x ≥ 830, bottom y ≥ 1570. The primary-text box (x 110–800, y 360–1400) is green.
