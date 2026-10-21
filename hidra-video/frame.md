# HIDRA — design truth

Concept angle: **"from noise to clarity"** — the film opens in a dark, cinematic world of
plastic waste (reference A: black stage, glowing kinetic type, red highlight bars), a
white-light bloom births the product, and the plan unfolds on clean grid paper
(reference B: indigo pill title, lime ball, orange glowing count-ups, italic serif +
heavy sans, dotted-box labels, 3D clay objects). The close returns to dark with the
bottle's LED glowing — the light it brought.

## Palette
| token | hex | use |
| --- | --- | --- |
| ink-dark (bg) | #07090F | dark world background |
| paper (bg) | #ECEDEF | light world background, grid lines rgba(21,22,28,.06) every 60px |
| ink | #15161C | text on paper |
| snow | #F2F4F8 | text on dark |
| cobalt (brand) | #2447E6 | HIDRA brand, pills, bars, underline |
| orange | #FF8A1F | numbers, prices, data glow |
| lime | #B9E34C | small accent ball / dots only |
| alarm red | #E5322D | problem highlight bar only |

## Type (all embedded via @font-face from assets/fonts)
- **Hidra Display** = Archivo Black 400 — headlines, wordmark, big numbers. Tracking -0.03em.
- **Hidra Serif** = Instrument Serif (italic) — the narrator's commentary voice, labels.
- **Hidra Sans** = Montserrat 500–800 — small caps labels, UI, pills.

## Motion grammar
- Entrances: blur-to-sharp + rise (0.5s, power3.out/expo.out), letters cascade with stagger 0.03.
- Emphasis: marker/bar sweeps (scaleX from 0, transform-origin left), spring pops (back.out(1.8)).
- Exits: fast blur + drift (0.3s, power2.in) — scenes hand off on shared paper background.
- Ambient: every scene has 2–4 slow drifting decoratives (glow, ghost word, star, lime ball).
- 3D: bottle and clay icons float with slow sine bob (seeded, deterministic).
