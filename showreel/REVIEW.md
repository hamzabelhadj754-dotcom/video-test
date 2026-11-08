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

## v2: more dynamic transitions and text animation

**Text animation**
- MOTION and the closing tagline are printed in three plates, yellow then cobalt then ink. Each letter rises out of a mask stretched and skewed, and the plates jump off-register when the word lands.
- CAN and SHOW slam in, starting 2.4× size and blurred.
- The slot reel smears vertically while it spins. ANYTHING lands with an elastic squash and stretch.
- SPACE drops in letter by letter, each letter with its own spin.
- In the data scene, DATA and BILLION rise letter by letter. The 8.2 count-up squash-punches when it lands, and the caption blurs in word by word.
- The MUSIC letters drop in, then hop on the 120 BPM kick as a wave.
- PATTERNS flips in like a split-flap board.
- The end card's command types itself, followed by a blinking cursor.

**Transitions**
- **Hook to space:** the camera pulls back, then pushes in with a −4° tilt while a yellow ring leads the cobalt flood.
- **Space:** the camera arrives tilted at −10° and 1.45× and settles. A shockwave ring fires when the sun lands. The dive spins 35° on `power4.in`.
- **Data:** the camera picks up the sun's spin. The stamp slams down and shakes the frame. The exit whip is three skewed stripes: red, cobalt, then ink.
- **Music:** the record dips when the needle drops. On the exit, the camera pushes into the label (1.9×, +20°) while the tonearm flies off.
- **Patterns:** the iris opens in two rings, yellow then bone. The grid spins in from −25°. The collapse twists into a 90° vortex and ends with a shockwave from the red square.
- **End card:** two shockwave rings fire and the frame shakes on the logo impact.

**Global**
- Render-time motion blur is on (`data-motion-blur="on"`). It drew 263 moving elements with 0 failed frames.

## Measured
- `hyperframes check` passes with ok=true and 0 errors.
- I looked at snapshots of every scene, every transition and the end card.
- The sound effects were placed so their measured peaks land on the picture. I measured them; I did not listen to them.

## Warnings kept on purpose
- `line_unread` on SPACE/MUSIC/DATA/CITIES/PATTERNS: these are the slot-machine rolls. The quick roll is the effect, and the reel lands on ANYTHING, which holds for 1.5 s.
- `container_overflow` / `escaped_container` on the whip stripes: they start off-frame on purpose.
- `contrast_aa_failure` on the yellow and cobalt print plates: these are decorative layers that settle under the ink copy, so the words themselves read at full contrast.
- Info-level `content_overlap` on skewed letters: these occur only mid-entrance.

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
