# Nobody Is Coming To Save You: brief and style-frame gate

## Brief in 5 bullets

1. **Audience:** people aged 18 to 35 scrolling Reels, TikTok or Shorts at night. They know they "should" be disciplined and keep waiting to feel ready.
2. **The one takeaway:** motivation is a feeling and it fades. Discipline is a system. 1% a day compounds to 1.01³⁶⁵ ≈ **37.78**, and 1% worse decays to 0.99³⁶⁵ ≈ **0.03**.
3. **Length and format:** 70 s (60–75 s window). The master is 1080×1920 at 30 fps. A 1920×1080 version is re-composed, not cropped.
4. **Tone:** a calm, heavy, honest voice in a dark room. It never shouts. It tells the truth and then hands over a tool (the habit tracker).
5. **Look:** "Dark Premium". The background is `#07070A`, with gold `#D4A64A` for growth and payoff and red `#C2362F` only in scene 2. Type is Instrument Serif for display, Inter for UI and captions, and JetBrains Mono for numbers. It has seeded grain, a vignette and one light source per scene.

## Asset list

| Asset | Source | Status |
|---|---|---|
| Fonts: Instrument Serif (regular and italic), Inter variable, JetBrains Mono variable | Fontsource (OFL) → `assets/fonts/` | ✅ in project |
| Voiceover | `hyperframes tts` (local Kokoro-82M) | ✅ working, 3 test voices in `styleframes/voice-tests/` |
| Word timestamps | `hyperframes transcribe` (local whisper) | after VO lock |
| Collage panels: office, family table, sunrise, lone figure | Built procedurally in SVG with torn edges, halftone and paper fibre (see note) | ✅ style frames |
| Charts 1.01ⁿ / 0.99ⁿ | Computed in code (exact values) | ✅ |
| Music: dark ambient, piano and sub pulse | Generated in code with a seeded synth (per claude-motion), so no licensing risk | to build |
| SFX: sub-boom, whoosh, UI tick, paper rip | Synthesised in code, same "room" reverb | to build |
| Handle or logo for the end card | **Needed from you** (placeholder `@YOURHANDLE`) | ❓ |

**Collage note.** `gbro-collage-broll` needs a `GEMINI_API_KEY` to generate video, and this session has none. The frames therefore use hand-built SVG collage instead, which is deterministic, has no licensing problems, and animates as real layers (torn panels, strike lines, collapse). AI-generated collage plates could replace them later if you prefer.

## Beat sheet

| # | Time | VO | Visual | Lead technique | Transition in |
|---|---|---|---|---|---|
| 1 | 0:00–0:04 | Nobody is coming to save you. | Huge serif, revealed word by word from blur to sharp. A sub-boom lands on "save". | kinetic type (GSAP) | Hard open (intentional). The line is on frame 0 for the scroll-stop. |
| 2 | 0:04–0:12 | Not your boss. Not your family. Not motivation. | 3 torn red-duotone panels snap in on each beat. A red strike cuts across each one and it collapses into darkness. | SVG collage | "you." blurs out and the first panel tears in over it |
| 3 | 0:12–0:22 | Motivation is a feeling. Feelings fade by Tuesday. | Glass meter fills to 100%, then drains with a jittery decay curve. Mono % counts down. The calendar flips MON→TUE. | HTML UI | The last collapsed panel darkens to black. The meter card rises out of that dark. |
| 4 | 0:22–0:38 | But get one percent better … almost zero. | **One-take** camera through the 3D grid. Gold 1.01ⁿ climbs, grey 0.99ⁿ sinks, counters roll to 37.78 and 0.03. Push in, slight orbit, settle on the gap. | one-take principles | The decay curve's endpoint dot becomes the "1.00 · TODAY" origin dot of the chart (match on shape) |
| 5 | 0:38–0:50 | Discipline isn't punishment … no one is watching. | A spotlight cone over a collage figure. "promise" goes italic gold, "quietly" breathes in letter-spacing, and "no one is watching" arrives in a mask wipe. | kinetic type | The camera keeps pushing into the gap between the lines until it becomes the spotlight cone |
| 6 | 0:50–1:02 | So stop waiting. Start the system. Day one is today. | The habit tracker assembles. Cards stagger in, checkboxes tick (with a UI tick SFX), and the streak counter hits 1. | HTML UI | The spotlight pool on the floor turns into the gold "today" square of the streak row |
| 7 | 1:02–1:10 | Nobody is coming. Good. Now you know who has to. | Back to black. The final serif line appears and a gold underline draws left→right. 1.5 s hold, the handle fades in, then a slow fade on the reverb tail. | kinetic type | The tracker cards fall away into black and the streak "1" dissolves |

Captions are burned in word by word (Inter 600, 64 px, active word in gold, max 2 lines × 6 words, lower-middle third). They are **off** during scenes 1 and 7, where the on-screen type already *is* the VO, and on in scenes 2–6.

## Style frames

`styleframes/index.html` holds one static hero frame per scene plus the thumbnail. `styleframes/png/` has the PNGs and `styleframes/contact-sheet.png` has all of them together.
