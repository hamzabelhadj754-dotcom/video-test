# FIRST 10 SECONDS: design document

- **Format:** 1080×1920, 30 fps, **11.0 s = 330 frames**, seamless loop. Frame 330 equals frame 0.
- **Message:** You are not lazy. You are negotiating. Start before your brain negotiates.
- **Metaphor:** a mental negotiation **system UI**. It starts calm, crowds up, overloads, and then one command cuts through it.

## 1. Type
| Role | Face | Setting |
| --- | --- | --- |
| Display | **Archivo** (variable grotesk; width axis 62–125, weight 100–900) | Condensed: width 62–78, weight 800–900, all caps, tracking −1 % |
| System / UI | **Inter** | Weight 500, 26–30 px, all caps, tracking +18 % |

- Archivo's width axis is the **compression** device: the word physically narrows and widens instead of being squashed with a transform.
- Nothing else is used: no third face, no italics.

## 2. Colour, grid and texture
- **Colours:**
  - Field `#080808`. Type `#F2F0EA`. Secondary `#777777`.
  - Accent `#FF3B30`, used only in these places: the cursor, the decision markers, the DELAY LOOP indicator, the cut line, and the "10".
- **Grid:**
  - 12 columns.
  - Margins 72 px left and right. Column 78 px, gutter 0 (brutalist: type sits on column lines).
  - 8 px baseline.
  - Title-safe band y 168–1330. The system UI sits at y 176 (top) and y 1690 (bottom rail).
- **Asymmetry:** the main type hangs off the left margin (x = 72). The UI metadata sits top-left (status) and top-right (indicator). The centre is used only once, for the breakthrough.
- **Texture**, applied last and always subordinate:
  - Animated film grain, 6 % overlay. It's seeded per frame, so it is deterministic.
  - 1 px scan lines at 3 %.
  - About 14 dust specks that flick per frame.
  - Ink-edge roughness on the display type: a feTurbulence displacement, scale 1.5 px.

## 3. Storyboard (frame by frame at 30 fps)
| Frames | Time | Picture | Motion | Sound |
| --- | --- | --- | --- | --- |
| 0 | 0.00 | Black field. `MENTAL STATUS / 07:42:11` top-left in grey. A 2 px progress hairline on the bottom rail at 0 %. A **red dot** after the status. | Static. This is the loop seam. | Drone only |
| 4–24 | 0.13–0.80 | `YOU ARE` (line 1) rises out of its baseline mask. | Vertical reveal 0.65 s, `power3.out`. Width expands 70 → 76 (tracking-like expansion). | Click at line start |
| 10–30 | 0.33–1.00 | `NOT LAZY` (line 2) rises. | Same move, 6 frames later | Click |
| 30 | 1.00 | The clock ticks to :12. The progress line runs to 18 %. | Step change, no tween | Tick |
| 36–58 | 1.20–1.93 | The red cursor block after `LAZY` blinks twice. | Hard on/off, 5 frames each | 2 soft clicks |
| 60 | 2.00 | **Seam 1.** `NOT LAZY` leaves to the left, mid-motion. `NEGOTIATING` arrives from the right, mid-flight. `YOU ARE` holds (the carrier). | Exit `power4.in` 0.18 s / entry `power4.out` 0.26 s, current = LEFT | Air flick |
| 75 | 2.50 | **Impact.** `NEGOTIATING` (full width, ~936 px) lands. Red corner brackets snap on, plus the label `DECISION / PENDING`. | Scale 1.05 → 1 in 6 frames, bracket expansion 0.2 s | **Impact** (sub thump + click) |
| 80–148 | 2.67–4.93 | **Indecision:** the word steps a few px (+6, −4, +9, −7, +3, −5), compresses (width 62 ↔ 70, re-fit) and re-aligns. Echo copies at 14 % trail each step. A red ruler under the word ticks. | Discrete 2-frame steps every 8 frames, settling on the grid each time | Mechanical click per step |
| 150 | 5.00 | **Seam 2.** `NEGOTIATING` compresses to width 62 and leaves to the left. The first excuse enters from the right. | Same seam vector | Air flick |
| 153–228 | 5.10–7.60 | **Overload.** Excuse slabs stack top to bottom: `TOMORROW`, `AFTER THIS`, `WHEN I FEEL READY`, `JUST FIVE MINUTES`, then repeats arrive faster and tighter. Gaps shrink 40 → 0 px, so lines touch and overlap. `DELAY LOOP / ACTIVE` switches on top-right, red. The camera pushes forward (stack scale 1 → 1.1). | Alternating hard cuts (2-frame smear) and `expo.out` decelerations, all from the right | Riser, a tick per slab, accelerating |
| 228–240 | 7.60–8.00 | **Stillness before the climax.** Everything freezes for 12 frames. | No motion | Riser cuts to silence, drone only |
| 240 | 8.00 | **Collapse.** All slabs crush to the centre line (scaleY → 0, x → centre). | `power4.in` 0.2 s | Suck-in |
| 246–250 | 8.20–8.33 | A **red line** slashes across at y 960 from left to right. | 4 frames | Slash |
| 252 | 8.40 | `START BEFORE` appears above the line (white, width 100). | Rise 0.25 s | — |
| 256 | 8.53 | **`10 SECONDS`**, the strongest moment: forward push (scale 1.5 → 0.97 → 1). "10" in red, `SECONDS` in white. | `expo.out` 0.3 s, a clean −3 % overshoot, then a **3-frame hold** | **Metallic hit** + sub |
| 265–312 | 8.83–10.40 | Hold, with a slow forward push 1 → 1.03 (camera intent, not wobble). | `sine.inOut` | Metallic tail |
| 312 | 10.40 | **Seam 3.** The command leaves to the left, mid-motion (the current). The field empties. | `power4.in` 0.2 s | Air flick |
| 318–330 | 10.60–11.00 | **Restart.** `MENTAL STATUS / 07:42:11` and the red dot are back exactly as on frame 0; the progress line resets to 0. | Step | Click |

## 4. Exact text timing (seconds)
| Text | In | Out |
| --- | --- | --- |
| `MENTAL STATUS / 07:42:11` (ticks :12 at 1.0, :13 at 2.0, :14 at 3.0…) | always | always (shows :11 again from 10.6) |
| `YOU ARE` | 0.13 | 4.95 |
| `NOT LAZY` | 0.33 | 2.00 |
| `NEGOTIATING` | 2.00 (lands 2.50) | 5.00 |
| `DECISION / PENDING` | 2.50 | 5.00 |
| `TOMORROW` / `AFTER THIS` / `WHEN I FEEL READY` / `JUST FIVE MINUTES` | 5.10 / 5.55 / 5.95 / 6.30 | 8.00 |
| Repeats (×6) | 6.62 → 7.45, accelerating | 8.00 |
| `DELAY LOOP / ACTIVE` | 5.20 | 8.00 |
| `START BEFORE` | 8.40 | 10.40 |
| `10 SECONDS` | 8.53 | 10.40 |

## 5. Motion language
- **One current:** content travels **right to left** (the camera moves left to right) at every seam. There is no other seam direction except the one Z push, which is reserved for the breakthrough.
- **Eases:**
  - Entries `power4.out` / `expo.out`.
  - Exits `power4.in` at 75 % of the entry duration.
  - Steps are hard (0–2 frames).
  - No `bounce` or `elastic` eases anywhere.
- **Anticipation:**
  - Before seam 1, `NOT LAZY` leans +8 px right for 4 frames.
  - Before the collapse, the freeze is the wind-up.
- **Impact holds:** 2–4 frames after `NEGOTIATING` lands and after `10 SECONDS` lands.
- **Banned:** idle wobble, glitch presets, camera shake, particles, explosions, crossfades.

## 6. Sound cues
- The sound is **original synthesis** (numpy), so there are no licensing issues.
- It loops cleanly: the drone has a whole number of cycles in 11 s, and every tail has decayed by 10.8 s.

| Time | Cue |
| --- | --- |
| 0–11 | Sub drone, 41 Hz sine with a little 2nd harmonic and a slight saw, −22 dB |
| 0.13, 0.33, 1.0, 2.0… | Dry mechanical clicks (band-passed noise, 6 ms) |
| 2.50 | Impact: a pitch-dropping sine (110 → 38 Hz, 0.4 s) plus a transient |
| 2.67–4.93 | A click on each indecision step |
| 5.0–7.6 | Tension riser: filtered noise and a sine glide 180 → 720 Hz, with accelerating ticks |
| 7.6–8.0 | Silence except the drone |
| 8.0 / 8.2 | Suck-in, then the slash (a high noise sweep) |
| 8.53 | **Metallic hit:** inharmonic partials at 523, 1187, 1873, 2659 and 3417 Hz, exponential decay over 1.3 s, plus a sub thump |
| 10.4 / 10.6 | Air flick, then the restart click |

## 7. Style test
- The first deliverable is the **opening and negotiation section, 0–3.2 s, rendered with sound**.
- The full render waits for approval.
