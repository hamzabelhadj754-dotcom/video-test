# Your Muscles Don't Grow In The Gym: brief and style-frame gate

## Brief in 5 bullets

1. **Audience:** people who train, from beginners to intermediates, who think the workout itself is what builds muscle.
2. **One takeaway:** training is the *signal* and recovery is where *growth* happens, so progressive overload, protein and sleep are the system.
3. **Length and format:** about 60 s. The master is 1080×1920 at 30 fps (per the brief). The brief also asks for a 16:9 version re-composed with side-by-side layouts.
4. **Tone and look:** a confident, precise coach voice over a "sports-tech lab" film, like WHOOP, Oura or Apple Fitness+. Near-black background, electric lime `#C6FF3D` for growth, cyan `#3DD6FF` for data only, and red `#FF4D3D` for at most 2 moments.
5. **Accuracy:** claims stay mainstream. Protein is shown only as "~1.6 g per kg per day" with "general guidance — not medical advice". There are no invented statistics; chart values are illustrative and unlabelled.

## Assets and fonts

| Asset | Source | Status |
|---|---|---|
| Display font: **Anton** (OFL) | Fontsource → `assets/fonts/Anton-Regular.woff2` | ✅ |
| UI font: **Inter** variable | Fontsource | ✅ |
| Data font: **JetBrains Mono** variable | Fontsource | ✅ |
| Barbell plate, muscle line-art, fibre interior, charts, hypnogram, HUD | SVG drawn in code (no photos) | ✅ style frames |
| Voiceover | `hyperframes tts` (local Kokoro). 4 test voices in `styleframes/voice-tests/` | pick one |
| Word timestamps | `hyperframes transcribe`, per line | after VO |
| Music: 124 BPM minimal electronic, with a drop-out on "Because it is" | Synthesised in code (seeded), no licensing risk | to build |
| SFX: plate thud, sub boom, rep ticks, whooshes, glass "lock", low heartbeat pulse | Synthesised in code | to build |
| Handle or logo for the end card | **You** (placeholder `@YOURHANDLE`) | ❓ |

## Beat sheet

| # | Time | VO | Visual | Transition in | Lead technique |
|---|---|---|---|---|---|
| 1 | 0:00–0:04 | "Your muscles don't grow in the gym." | The plate drops and hits with a thud; **GROW** slams in with a velocity smear, then a lime strike-through; 3-frame shake. | **Impact cut** on frame 0 | kinetic type + SVG |
| 2 | 0:04–0:12 | "In the gym, you break them down. Every hard set sends a signal." | The muscle line-art draws itself (stroke-dashoffset); a lime signal pulse runs along the fibres; LOAD / TENSION / FATIGUE pop in; the rep counter ticks 8→9→10; the cyan heart-rate line spikes. | The plate rolls out as the GROW strike becomes the first fibre line | HUD UI |
| 3 | 0:12–0:24 | "The growth happens after… a little thicker than before." | **One take.** The camera dives through the "FIBRE 0247" reticle into the fibre (macro → micro). Microtears open, lime strands knit across, and the 0h → 24h → 48h recovery bar fills. Then it pulls back out to a slightly thicker muscle. | **Scale dive** through the reticle | one-take camera |
| 4 | 0:24–0:36 | "Three things drive it… And sleep." | The glowing strand **becomes** card 01's progress line. **01 OVERLOAD** shows bars 60 → 62.5 → 65 kg, **02 PROTEIN** a counter rolling to 1.6 g/kg with the disclaimer, **03 SLEEP** a moon and hypnogram. Each card lights up on its word. | **Carry** | glass UI |
| 5 | 0:36–0:46 | "Skip recovery… every session compounds." | "No recovery": a grey jagged line that flatlines, with a red warning tint. The camera slides right to "Recovery": a lime climbing line that grows to full frame. | **Slide-through** on a wide canvas | data + camera |
| 6 | 0:46–0:55 | "Train hard. Eat enough. Sleep like it's part of the program. Because it is." | Three lines, each with its own move: TRAIN HARD (mask wipe up), EAT ENOUGH (split-letter slide), SLEEP (scale punch-in in lime). The music drops out for half a beat on "Because it is". | Continues the slide-through | kinetic type |
| 7 | 0:55–1:02 | "Growth is built in the hours you rest." | The muscle line-art **returns** complete and glowing; the final line in Anton; the lime underline draws in; the handle fades in; 0.5 s on black. | **Return** to the scene-2 anatomy | end card |

Captions are word by word in Inter 700 at 62 px, with the active word in lime, max 2 lines × 5 words, in the lower-middle third. They are **off** in scenes 1, 6 and 7, where the big type on screen already is the voiceover.

## Style frames

`styleframes/index.html` holds one static hero frame per scene plus the thumbnail. `styleframes/contact-sheet.png` shows them all together.
