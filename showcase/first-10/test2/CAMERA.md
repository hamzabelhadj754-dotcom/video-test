# FIRST 10 SECONDS: style test v2, camera move frame by frame

- **Format:** 1080×1920, 30 fps, 3.0 s = 90 frames.
- **Camera:** one forward dolly with a single origin, slightly left of centre at (440, 880). It drives three planes at different depths:

| Plane | What's on it | Parallax factor | Look |
| --- | --- | --- | --- |
| Background | Paper/ink texture and the 16-line vertical grid (2.8 % opacity) | 0.35 | Permanently soft (1.2 px blur). Drifts 6 px left over the shot. |
| Midground | Guide lines, `MENTAL STATUS`, `DELAY LOOP / ACTIVE`, `DECISION / PENDING`, the reticle, the red scan line, and the ghost of the old phrase | 0.70 | — |
| Foreground | YOU ARE / NOT LAZY / NEGOTIATING, the red cursor block, the red reactive line, the corner brackets | 1.00 | Carries the 3D tilt |

- **Easing:** the camera uses a cubic in-out curve; type moves use a fast quartic ease-out (`power4.out`).
- **Safe area:** all primary text sits inside x 110–800 and y 360–1400. Nothing goes in the right-side action rail (x 850+) or the caption zone (y 1570+).

| Frames | Time | Camera | Picture |
| --- | --- | --- | --- |
| 0–13 | 0.00–0.45 | **Wide establish.** Slow dolly from 100 % to 106 %. The background moves at a third of the foreground's speed and the midground at 70 %, so the grid slides against the UI (2.5D parallax). | An almost empty interface. The guide lines draw out from the left, the vertical guide drops, and `MENTAL STATUS / 07:42:11` sits small and far away. |
| 13 | 0.45 | **Hard cut** on the first red cursor blink: the camera jumps +2 % closer in one frame. | The red cursor block switches on as the frame cuts. |
| 13–34 | 0.45–1.15 | The push continues (108 % to 112 % by frame 67). The grid drifts left. | **YOU ARE** rises out of its baseline mask in 0.35 s. Its width axis opens from 70 to 76 (the tracking expansion). The red line draws a third of the way. The cursor rides with the camera and blinks twice. The corner brackets lock on at frame 19. The reticle fades in at frame 18. |
| 34–40 | 1.15–1.33 | **Rack focus, part 1:** the foreground drops to 3.2 px blur and the UI is sharp. The 3D tilt starts. | **NOT LAZY** rises. `DELAY LOOP / ACTIVE` appears. The reticle rotates 45° and slides onto the end of the phrase. |
| 40–44 | 1.33–1.45 | — | The phrase **overshoots 6 px upward and settles**. The red line kicks to full width under the phrase. |
| 39–45 | 1.30–1.50 | **Rack focus, part 2:** the type snaps sharp and the midground UI softens to 2.2 px. | The brackets follow the new word's edges, with a 2-frame lag. |
| 39–56 | 1.30–1.85 | — | A **thin red scan line passes behind the letters**, sweeping top to bottom on the midground. |
| 34–67 | 1.15–2.25 | The tilt eases to **rotateY −1.6°, rotateX 0.9°**, and the camera keeps pushing. | The full phrase is held, alive in depth. |
| 67–71 | 2.25–2.37 | **Anticipation:** the camera eases back 1.2 % and the phrase leans 6 px right. | — |
| 70–79 | 2.33–2.62 | **Push through the gap between the lines:** 112 % to 117 % with a slight upward travel. | The old phrase **moves backward in depth**: it scales to 86 %, drifts back and down, blurs, and fades. It then hands off to a 15 % ghost on the midground. The brackets release. |
| 73–79 | 2.42–2.62 | — | **YOU ARE** wipes back in from the left with a soft directional edge. |
| 75 | 2.50 | — | **One red flash** (16 %, 2 frames). **NEGOTIATING** starts its **clean wipe from the left**: Archivo at width 62 and weight 900. Its horizontal scale goes from 112 % (stretched) to 94 % (compressed). `DECISION / PENDING` lights up red. |
| 75–83 | 2.50–2.77 | The camera lands. | It decompresses from 94 % to 100 %. The width axis opens from 62 to 66. The red line re-draws under the word. The brackets lock onto the new word's edges. |
| 83–86 | 2.77–2.87 | **Impact hold, 3 frames.** Brackets frozen. | A short scan-line pass across the frame. |
| 86–90 | 2.87–3.00 | The settle continues. | — |

**What the red does in this shot:**
- **Cursor:** the system is alive.
- **Reactive line:** it measures the thought.
- **Brackets and reticle:** the system targets the word.
- **Scan line:** the system reads the phrase.
- **Flash:** the moment the negotiation starts.
- **`DECISION / PENDING`:** the system's verdict.

There's nothing else red in the frame.

**Versions:**
- `first10-test-textured.mp4`: restrained texture. Paper 5 %, grain 6 %, scan lines, dust, and a 1.3 px ink edge on the type.
- `first10-test-clean.mp4`: almost no texture. Paper 1.2 %, grain 1.5 %, no scan lines, no dust, and clean type edges.
- `first10-test-safe.mp4`: the textured version with the mobile safe-area overlay. The danger zones are red; the primary-text box is green.
