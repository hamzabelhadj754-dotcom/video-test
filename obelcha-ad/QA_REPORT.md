# QA report

Review artifacts are in `qa/round1/` (first full render, Playwright pipeline) and `qa/round2/` (final render, HyperFrames). Each round contains:
- a contact sheet at 1 frame per second (`contact_sheet_*.png`)
- a 12-frame strip for each transition (`transition_T1…T4_*.png`)
- a phone-size preview of the 9:16 with the platform UI zones outlined (`phone_preview_9x16.mp4` and `phone_preview_frames.png`)

## Technical checks (final files)

| Check | Result |
|---|---|
| Containers | 5 × MP4, H.264, yuv420p, 30 fps, exactly 20.000 s, AAC audio, `moov` before `mdat` (faststart) |
| Sizes | 9:16 ≈ 11.0 MB · 1:1 6.7 MB · 16:9 11.3 MB · EN/FR ≈ 11.0 MB |
| Loudness | −14.1 LUFS integrated, −1.1 dBTP (target −14 / −1). Music bed normalized to −18 LUFS, ducked −6 dB under the VO |
| VO fit | All 9 lines inside their windows. Speeds: 7 lines at 1.00×, one at 1.05×, one at 1.15× |
| VO intelligibility (Whisper-base, `audio/vo_asr.json`) | Mean similarity 0.95. Lowest: v1 0.86. Whisper-base mishears short phrases; by ear the lines are clear |
| Safe zones (9:16) | All copy inside y 250–1520. The right edge of the wordmark touches the 940 px rail line (see open items) |
| Min text size (9:16) | ≥ 64 px everywhere (auto-fit floor) |
| Words on screen | ≤ 6 on every frame. The end card is exactly 6: OBELCHA · obelcha.com · Envío a toda España |
| Determinism | Renderer is a pure function of `t`, the PRNG is seeded and no clocks are read. The HyperFrames and Playwright paths produce matching frames (spot-checked at 0.3 / 6.35 / 13.8 / 18.5 s) |
| Copy compliance | Cosmetic wording only ("ayuda a", "aspecto"). No cure, elimination, guarantee or percentage claims |

## Round 1 (first full 9:16 render)

| Criterion | Score | Why |
|---|---|---|
| Hook strength (first 1.5 s) | **6** | The text is on screen from frame 0, but the drop was small (r≈108 px), started near the top inside the UI zone, and its mirrored reflection read as a second drop (a "snowman"). Most of the lower frame was empty. |
| Brand premium feel | **7** | Palette, type and bottle hold up. The T1 wipe showed a hard-edged elliptical disc. The skin texture read as a dot pattern, not skin. |
| Legibility on a phone | **7** | Supers are large and high-contrast. The end-card wordmark (150 px, tracking +0.24 em) ran into the TikTok right rail, and the URL at 84 px was the weakest line. |
| Motion smoothness | **7** | Easing is consistent and T2/T3 are smooth. In T4 the bottle travelled through the lockup while the drop crossed it, so the two motions fought each other. |
| CTA clarity | **8** | The lockup is clear and holds 2.2 s, but the drop came to rest on top of the letters "L/C" instead of the underline. |
| **Average** | **7.0** | |

### Three highest-impact fixes applied
1. **Macro hook.** The drop is 1.5× larger (r≈162 px) and fully in frame on frame 0 as a teardrop under the headline. A warm light pool grows on the glass as it approaches, and the reflection only appears at contact. On 1:1 and 16:9 the text moved up to clear the drop.
2. **T1 and skin rebuilt.** The hard clip is now a feathered radial mask with a champagne wavefront ring. The skin is a pre-rendered macro texture: soft radial pore "cups" lit from top-left, a shallow-DOF blur on the micro-texture, and a diagonal oil sheen.
3. **T4 and CTA choreography.** The bottle now settles before the drop moves (bottle 15.4 → 16.3 s; drop 16.15 → 16.5 → lands 16.8 s). The underline is placed proportionally under the caps (0.72 × cap size), and the drop shrinks and dissolves into it. On 9:16 the lockup is re-centred on the safe box (x 510). The URL went to 96 px and the wordmark's tracking bloom dropped from 0.25 to 0.1 em.

Also fixed in this pass: the bitrate (the grain had pushed the first render to 92 MB; the final is about 11 MB), and the phone-preview overlay, which now outlines the zones instead of filling them.

## Round 2 (final HyperFrames render)

| Criterion | Score | Why |
|---|---|---|
| Hook strength (first 1.5 s) | **8** | Frame 0 is a usable cover: a big gold teardrop on black under "¿Puntos negros?" with gold punctuation. The landing ripple at 0.55 s gives motion inside 1 s. A real macro product or skin shot would score higher. |
| Brand premium feel | **8** | Gold stays an accent, the type is editorial, the wipe is soft, and the skin reads as low-light skin. Held back by the procedural placeholder bottle and the synthetic music pad. |
| Legibility on a phone | **8** | At 390 pt width every super reads at arm's length. Card text and the URL are large. The wordmark is still tight to the right rail. |
| Motion smoothness | **8** | All four transitions are motivated, with no cuts and no collisions (see the strips). There is one ~0.25 s empty-card beat between cards 01 and 02. |
| CTA clarity | **9** | The drop lands, the underline draws and the chime sounds on the same beat. URL and offer sit inside the safe box, and the lockup holds 2.2 s at full opacity. |
| **Average** | **8.2** (+1.2) | |

## Open items / next fixes
1. **Swap in the real logo, product photo and music** (`MISSING_ASSETS.md`). This is the single biggest lift for premium feel; the renderer picks them up automatically.
2. Pull the 9:16 wordmark about 20 px left or drop it to 132 px so it clears the right rail completely.
3. Overlap card 02's entrance with card 01's exit by 0.15 s to remove the empty-card beat.
4. Replace the TTS with a native Castilian voice actor for the final media buy (script and timings are in `timeline.json`).
5. Note on the QA sheets: the contact sheets come from ffmpeg `fps=1` sampling. A faint plume above the dropper on the t=10 s tile is a sampling artifact; frames 294–306 of the actual video are clean (verified).
