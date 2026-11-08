# HyperFrames showreel: "Anything, in motion"

This is a 31-second motion-graphics showreel built in HTML and GSAP with [HyperFrames](https://github.com/heygen-com/hyperframes).
The rendered video is `../hyperframes-showreel.mp4`.

| Time | Scene | File |
| --- | --- | --- |
| 0–5 s | Kinetic type: MOTION / CAN SHOW → ANYTHING (slot machine) | `compositions/hook.html` |
| 5–11 s | Space: solar system on real orbital periods | `compositions/space.html` |
| 11–17 s | Data: world population, UN WPP 2024 | `compositions/data.html` |
| 17–23 s | Music: 33⅓ rpm vinyl, tonearm drop, equaliser | `compositions/music.html` |
| 22.6–27 s | Generative: a 16×9 grid of shapes in a diagonal wave | `compositions/pattern.html` |
| 27–31 s | End card: HyperFrames lockup and CTA | `compositions/endcard.html` |

```bash
npx hyperframes preview      # live preview / Studio
npx hyperframes check        # lint + layout + motion checks
npx hyperframes render -q delivery -o ../hyperframes-showreel.mp4
```

`SPEC.md` is the design brief, and `REVIEW.md` holds the review notes and sound credits.
