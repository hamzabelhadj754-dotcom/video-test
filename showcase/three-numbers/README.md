# THE 3 NUMBERS — Gains Dom educational short

A 31 s vertical (1080×1920, 30 fps) educational piece in the Apple-style "morphing UI"
grammar of the owner's reference video, rebuilt dark for Gains Dom. It renders
**silent**: the owner adds a song or motivational audio in TikTok.

Output: `gains-dom-edu-three-numbers.mp4` at the repo root.

## Grammar

- **One continuous shot.** A single rounded shape (`#sh-fill` and `#sh-edge`, a full-frame
  fill clipped by `clip-path: inset(... round r)`) keeps morphing from one element into the next:
  point of light → search bar → answer pill → three pills → card → 3D flip → timer picker
  → rest timer → point of light.
- **Kinetic type.** Words arrive one at a time (fade, blur and drift in), and the phrase slides
  so it stays centred as it grows (`kin()`; widths are measured live).
- **3D.**
  - A Three.js dumbbell (lathe-turned lacquer plates and knurled chrome, lit by strip-light
    reflections) opens and closes the film. It spins down into the point of light and comes
    back out of it.
  - The card flips in CSS 3D.
  - The timer picker is a real 3D drum.
- **Stick figure.** A pictogram barbell squat driven by forward kinematics (`drawFigure(d)`,
  where `d` is squat depth from 0 to 1).
- **Type.** Geist and Geist Mono (OFL, in `assets/fonts/`).
- **Palette.** Black, white and Apple-style greys only.

## Script

| Time | Beat | Text |
| --- | --- | --- |
| 0.0 | Hook, dumbbell | You train hard. / So why aren't you growing? |
| 4.0 | Search | "why am i not growing" → It's just 3 numbers. |
| 7.6 | Pills | 01 REPS · 02 TEMPO · 03 REST |
| 9.6 | Reps | Stop 1–2 reps / before failure. (8 reps counted, 2 left in the tank) |
| 15.3 | Tempo | Lower it slowly. / 3 seconds down. (3 s down, 1 s up) |
| 20.9 | Rest | Rest 2–3 minutes / on big lifts. (picker set to 2:00, timer runs out) |
| 27.0 | End | Reps. Tempo. Rest. / GAINS DOM / Save this for your next session. |

## Commands

```bash
npx hyperframes check --json
npx hyperframes snapshot --at 0,5.6,11.4,17.9,22.2,30.5
npx hyperframes render -o renders/three-numbers.mp4 --quality delivery
```

All the timing is in the one `<script type="module">` in `index.html`, under `TIMELINE`. It is
kept as a single composition so the morphing shape stays continuous across beats.
