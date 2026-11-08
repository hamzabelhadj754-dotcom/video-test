# SPEC — "Anything, in motion" (HyperFrames showreel)

GOAL:    The viewer finishes thinking "motion graphics can show literally anything" — and sees it was built in HTML with HyperFrames.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    31.0 s x 30 = 930 frames. No music bed (no HeyGen sign-in); sound effects on visible actions only.

LOOK:    Swiss screen-print poster. Flat solid inks, no gradients, no glow.
         Inks: signal red #FF3B1F, cobalt #1E3CFF, sun yellow #FFC400, ink #111111, bone #F1ECE2.
         Each world owns one ground ink; the accent is whatever ink the ground is not.
         Display: Archivo Black 400, hero words 300–420 px, tracking -2%.
         Numbers: League Gothic 400, 300–360 px. Body: Montserrat 700, 34–44 px, tracking +1%.
         Command line: Space Mono 700, 40 px (the only mono, and it is a real command).
         Depth: none. Shadows: none. Grain: none. Everything is a printed shape.

OBJECTS: the sun (yellow disc) and five planets on real orbital periods (Mercury 88 d, Venus 225 d,
         Earth 365 d, Mars 687 d, Jupiter 4333 d); a population bar chart with real UN WPP 2024 values
         (1950 2.5 B, 1975 4.1 B, 2000 6.1 B, 2025 8.2 B); a vinyl record with grooves, red label and a
         tonearm, turning at a real 33⅓ rpm (200°/s); a 16 x 9 grid of shapes; the real HyperFrames logo.

MOTION:  arrive expo.out / power4.out; camera and floods power2.inOut; zoom-through and exits power3.in.
         Linear only for orbits, record spin and counters. Springs: back.out(1.6) on the mark only.
         Letter stagger 0.05 s, word stagger 0.08 s. Exits ~45% of entrance length.

SHOTS:
  1  0.0–5.0  red     "MOTION" rises letter by letter (masks), lifts up; "CAN SHOW ___" slot-rolls
                      SPACE/MUSIC/DATA/CITIES/PATTERNS → ANYTHING. The cobalt full stop grows to fill
                      the frame (object becomes the world). SFX: swoosh on MOTION, whoosh on the zoom.
  2  5.0–11.0 cobalt  Sun lands, orbits draw on, planets run on real periods; DAY counter climbs.
                      Camera dives into the sun until yellow fills the frame (zoom through).
  3  11.0–17.0 yellow Count-up to 8.2 BILLION; four bars rise, values pop, 2025 bar in red.
                      An ink slab whips in from the right (whip). SFX: pops on bars, swoosh on whip.
  4  17.0–23.0 ink    Record arrives blurred from the right and sharpens; tonearm drops (scratch);
                      equaliser plays. Iris opens from the label onto the next world.
  5  22.6–27.0 bone   Diagonal wave of shapes morphing square↔circle through all four inks.
                      Everything collapses into one red square in the centre.
  6  27.0–31.0 bone   Red square implodes, the HyperFrames mark springs in, wordmark wipes beside it,
                      "Anything. In motion." per word, then the real command. Hold 2 s. SFX: impact.

BANNED:  dark void with small floating elements; glow/bloom/neon/particles as decoration;
         purple/blue gradients, glass cards; serif + italic accents; HUD/corner brackets/frame borders;
         everything fading and sliding up; titles that keep moving after landing; three cards in a row;
         logo docked in a corner; pill chips.

QA:      t=0.5 (letters mid-rise), 3.4 (ANYTHING landed), 4.8 (cobalt flood), 8 (orbits), 10.8 (yellow
         flood), 14 (chart complete), 16.8 (whip), 19.5 (record + EQ), 22.8 (iris), 24.5 (wave),
         26.8 (single square), 28.5 (lockup), 30.5 (final hold).
