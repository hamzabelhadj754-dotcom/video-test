# 8 MINUTES — a HyperFrames + Three.js showcase

16 s vertical film (1080×1920, 30 fps) about the speed of light: one continuous 3D camera flight
from the Sun, riding a photon to Earth, around it 7.5 times, out to a distance diagram and on to
the Andromeda galaxy, with kinetic typography on top.

- `index.html` — the 3D world (Three.js r170, local in `assets/lib`): GLSL Sun with boiling fbm
  granulation, photon + light trail, textured Earth with fresnel atmosphere, Moon, seeded starfield,
  procedural spiral galaxy, Unreal bloom, ACES tone mapping. Every frame is a pure function of
  time, repainted from a GSAP property setter (deterministic, seekable).
- `compositions/s1…s5.html` — type scenes (Inter, JetBrains Mono, EB Garamond), each entering a
  different way: on-screen hook, per-letter label + rolling counter, scale/blur hero number,
  grey→ink words, blur-in words with a held final line.
- Facts: c = 299,792 km/s; Sun ≈ 8 min 19 s (149.6 M km); Moon ≈ 1.3 s; Earth's circumference
  40,075 km → ≈ 7.5 laps/s; Andromeda ≈ 2.5 million light-years.
- Music: "Powerful Trailer" (Coverr free license), 96.5–112.5 s, muxed after rendering because the
  render browser can't play the audio element here.

Render: `npx hyperframes render -o renders/silent.mp4 --quality delivery`, then
`ffmpeg -i renders/silent.mp4 -i assets/audio/powerful-trailer.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest out.mp4`.
Textures: three.js example planet maps (NASA-derived).
