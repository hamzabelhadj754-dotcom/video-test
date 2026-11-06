# Asset ledger

Every file in the film that came from outside this repository. None of the hero visuals use AI generation (Higgsfield was excluded on request), and there are no photos or stock footage. The plate, biceps and fibres are built in code with Three.js.

| File | What | Source | License | Credit |
|---|---|---|---|---|
| `assets/vendor/three/*.js` | Three.js r147 core and example modules (RGBELoader, RoomEnvironment, post-processing) | https://cdn.jsdelivr.net/npm/three@0.147.0/ | MIT (`assets/vendor/three/LICENSE`) | three.js authors |
| `assets/hdri/studio_small_09_1k.hdr` | Studio HDRI used for reflections on the steel hub, rubber and wet tissue | https://polyhaven.com/a/studio_small_09 | CC0 | Poly Haven (none required) |
| `assets/icons/moon.svg` | Moon icon for the SLEEP card | https://lucide.dev (lucide-static 0.400.0) | ISC (`assets/icons/LICENSE-lucide`) | Lucide contributors |
| `assets/fonts/Anton-Regular.woff2` | Display type | Google Fonts via Fontsource | OFL 1.1 | Vernon Adams |
| `assets/fonts/Inter-Variable.woff2` | UI and captions | Google Fonts via Fontsource | OFL 1.1 | Rasmus Andersson |
| `assets/fonts/JetBrainsMono-Variable.woff2` | Data and labels | Google Fonts via Fontsource | OFL 1.1 | JetBrains |

## Built in code (no external source)

- **Bumper plate:** lathe geometry, procedural rubber bump, steel hub, raised lettering, seeded chalk burst (`assets/3d/plate.js`).
- **Biceps:** two bent lathe "heads", tendons, procedural tissue and striation texture, wet clearcoat, lime signal filament (`assets/3d/biceps.js`).
- **Fibre bundle:** hex-packed striated fibres, microtears, frayed fibrils, lime repair strands, seeded motes (`assets/3d/fibres.js`).
- **Grain, dust, haze, chalk-smoke "footage-in-type" fill, charts, HUD:** procedural SVG/CSS, seeded and deterministic.
- **Voiceover:** Kokoro-82M via `hyperframes tts`, generated locally.
- **Music and SFX:** 124 BPM hybrid-electronic score (kick, clap, hats, bass, plucks, pads) plus sound design (layered impacts, risers, whooshes, UI ticks, glass locks, a heartbeat), all synthesised in `tools/build_audio.py` with seeded noise and no samples.

## Not used, and why

- **Pinterest / Behance:** mood reference only. No images are stored or used (see `refs/ANALYSIS.md`).
- **Pexels / Mixkit B-roll:** pexels.com refuses requests from this sandbox (HTTP 403). The one footage-in-type moment uses a procedural chalk-smoke fill instead, which also keeps renders deterministic.
- **Higgsfield / AI generation:** excluded at the client's request.
