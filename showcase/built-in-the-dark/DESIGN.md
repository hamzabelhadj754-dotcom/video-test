# BUILT IN THE DARK. (14 s loop, real-time 3D, one take)

**The idea:** you only see what the light hits. The three words are giant 3D concrete architecture standing in a pitch-black, wet hall. One camera flies through them in a single take. The light reveals each word and then takes it away. It fits the brand: the work nobody sees.

- **Engine:** Three.js r170 inside HyperFrames.
  - Every frame is a pure function of time.
  - Five sub-frames are accumulated per frame for real motion blur (180° shutter).
  - Then bloom, ACES tone mapping, and a lens pass (edge chromatic fringe, vignette, grain).
- **Type:** Anton (OFL), extruded into real geometry with bevels.
  - The surface is procedural concrete: mottled albedo, bump and roughness maps, all generated from seeded noise.
- **World:** a wet black floor (a mirrored copy of each standing word under a semi-transparent floor, so every frame is exact) plus exponential fog. The red pool and the light cones are drawn in their own additive pass.
- **Lights:**
  - A warm tungsten key spot casting soft shadows, with an additive volumetric cone.
  - Two red rim spots.
  - Nothing else.
- **Palette:** black #050505, tungsten #FFE2B8, red #FF2A1F.

| Frames | Time | Camera | Light / picture |
| --- | --- | --- | --- |
| 0–2 | 0.0–0.1 | Nose to the concrete of the B | Black, then the key **ignites**: a 2-frame flicker, then on (relay clacks) |
| 3–73 | 0.1–2.45 | A tracking glide along the letters B-U-I-L-T, arcing out | The key rides the camera rig and ramps up. A red rim sits behind the word. |
| 74–96 | 2.45–3.2 | 3/4 view: **BUILT** fully readable, with its mirror reflection | — |
| 96–107 | 3.2–3.55 | **Whip pan** of about 60°, with real motion blur | The key swings off toward the next word |
| 107–204 | 3.55–6.8 | **Crane up** to a straight-down view of **IN / THE**, flat on the floor | The key **orbits**, so the letter shadows sweep across the floor |
| 204–216 | 6.8–7.2 | Hold | The key **cuts out**. Silence. |
| 216–253 | 7.2–8.45 | Tilt up and fly forward | IN THE goes dark. **DARK.** stands 50 m away, a black silhouette in red haze. |
| 253–288 | 8.45–9.6 | **Dolly zoom** (FOV 28 → 58 while pushing from 50 m to 22 m) | The background stretches while DARK. holds its size; the tension rises |
| 288–291 | 9.6–9.7 | **3-frame impact hold** | **THE SLAM:** the key hits DARK. at 2.6× from behind the camera |
| 291–372 | 9.7–12.4 | **Reverse crane**, up and back | Settles to a high wide. `NOBODY WATCHES THE WORK.` fades in at 10.9 s. |
| 372–419 | 12.4–14.0 | Slow drift | DARK. **dies letter by letter** (D, A, R, K, then the full stop, each with a flicker and a relay click), then black, which loops to frame 0 |

- **Camera:** a time-parameterised Hermite spline through 13 keys. It stays continuous in position and velocity, and comes to a dead stop only at the two holds.
- **Sound** (`sound.py`, pure synthesis):
  - A 40 Hz sub and a room tone.
  - Relay clacks on every light event.
  - Whip air, panned with the move.
  - A red-rim hum.
  - A dolly-zoom riser cut dead into a deep impact with a 2.4 s hall tail.
  - Five relay clicks for the letter deaths.
- **Safe area:** all type sits inside x 110–830 and y 240–1570. The tagline is at y 1352.
