# GainsDom: Brand Lock

Last update: 2026-11-26. Decisions made by the owner are marked (owner). Everything else is a default
until the owner changes it.

## Look (v3, built in HyperFrames)
- **Reference (owner):** Apple Fitness+ clarity. Spec reference only; never copy Apple's assets.
- **Flat and matte (owner):** no glow, no gradients, no bloom, no shiny 3D. Solid colors, hairlines and clean type.
- **No orange (owner).** **No fake CG objects (owner).** Flat front-on graphics only (the weight plate, bars, rings).
- **Tool (owner):** HyperFrames. The project lives in `hf-look-v3/` (see its index.html variables to re-brand).

## Palette
| Token | Hex | Use |
|---|---|---|
| ground | #0B0D10 | background |
| ink | #ECEEF1 | primary text |
| mute | #8A939E | labels, sources |
| plate | #151A20 / #252D36 | flat graphic surfaces and hairlines |
| **accent (ice blue, owner)** | **#5BB8E8** | the one hero word, the hero data series |
| slate | #3B4C5E | second data series |

## Type
- Display: **Barlow Condensed** 800 (impact words), **Barlow** 300 / 500 / 700 (calm lines, captions, wordmark). Uppercase.
- Data and labels: IBM Plex Mono (bundled in HyperFrames), at least 28 px.
- Wordmark: GAINS in Barlow 700, DOM in Barlow 300.
- Files: `hf-look-v3/assets/fonts/` (Barlow, SIL Open Font License).

## Motion
- One continuous camera: slow push on the hook, a glide down to the next beat, slow push again.
- Titles land and stay still; motion lives in the world (the plate turns, the ring turns).
- Word entrances: blur 8 px to 0 in about 0.18 s. Captions: Barlow 700, the stressed word in ice blue, inside the platform safe zone.
- End card: a short dip to black, then GAINSDOM letter by letter, the ice rule, BUILT AT HOME., the SAVE pill.

## Open questions (defaults in use)
| # | Question | Default |
|---|---|---|
| 1 | Handles (Instagram, TikTok, YouTube) | not set: never invented; the end card shows a placeholder |
| 2 | Logo file (SVG) | the typographic GAINSDOM wordmark |
| 3 | Voiceover language and ElevenLabs voice | English, one signature voice: calm, low to mid pitch |
| 4 | Licensed music library | none: a designed bed from licensed SFX |
| 5 | Do you film your own training? | no: type, data graphics and light |

## Voice
Calm authority, short sentences, simple global English, concrete numbers. Never: "beast mode",
"hack", "secret", "shred fast", "insane results", "crush it", guilt or body shaming.

## Licenses
- Barlow, Barlow Condensed: SIL OFL 1.1 (Google Fonts)
- IBM Plex Mono: SIL OFL 1.1 (bundled with HyperFrames)
- HyperFrames CLI and skills: see heygen-com/hyperframes
- Retired looks (v1 orange 3D, v2 glowing blue) kept in `kit/` for reference only
