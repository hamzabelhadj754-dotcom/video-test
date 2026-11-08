# REVIEW: "Anything, in motion"

The output is `../hyperframes-showreel.mp4`: 1920×1080, 30 fps, 31 s. It was rendered with HyperFrames 0.9.23 at `delivery` quality.

## Creative calls
- **Concept.** One showreel moves through five subjects: kinetic type, space, data, music and generative pattern. Each world starts from an object in the one before it.
- **Look.** The style is a Swiss screen-print poster with five flat inks: red, cobalt, yellow, ink and bone. The font stack is Archivo Black, League Gothic and Montserrat. There are no gradients, glows or dark void. Each scene owns one ground colour.
- **Transitions** (5 kinds, each with a cause on screen):
  - The full stop floods into cobalt.
  - The camera dives into the sun, which floods into yellow.
  - An ink slab whips across.
  - An iris opens from the record label.
  - A grid of shapes collapses to one square, which becomes the logo.
- **Real data only:**
  - The orbital periods are real: Mercury 88 d, Venus 225 d, Earth 365 d, Mars 687 d, Jupiter 4333 d.
  - The population figures come from UN WPP 2024: 2.5 / 4.1 / 6.1 / 8.2 billion.
  - The record spins at a real 33⅓ rpm.
- **Logo.** It is the real HyperFrames SVG from the repo's `docs/logo`. Nothing was redrawn.

## Measured
- `hyperframes check` passes with ok=true and 0 errors.
- I looked at snapshots of every scene, every transition and the end card.
- The sound effects were placed so their measured peaks land on the picture. I measured them; I did not listen to them.

## Warnings kept on purpose
- `line_unread` on SPACE/MUSIC/DATA/CITIES/PATTERNS: these are the slot-machine rolls. The quick roll is the effect, and the reel lands on ANYTHING, which holds for 1.5 s.
- `container_overflow` on `#data-slab`: the slab starts off-frame on purpose for the whip.

## Not done / with more time
- **No music bed.** Music needs a HeyGen sign-in (`npx hyperframes auth login`). After signing in, a bed can be pulled with `media-use resolve --type bgm` and the cuts synced to its beats.
- **Weakest shot.** The planets in the space scene are small next to the sun. A punch-in on Earth with a moon would give that scene a second beat.

## Sound credits
- Whoosh: "VS_Short Whoosh 1" by Vilkas_Sound (CC BY 4.0)
- Impact: "Deep Cinematic Impact" by MeijstroAudio (CC BY 4.0)
- Pop: "Bubble Pop - High Pitched Short" by elmasmalo1 (CC BY 3.0)
- Swoosh by qubodup (CC0)
- Record scratch by ludvique (CC0)

All are from Freesound via Openverse. The full list is in `.media/audio/sfx/CREDITS.md`.
