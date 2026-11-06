# Your Muscles Don't Grow In The Gym

A 62 s sports-tech explainer built with HyperFrames (HTML + GSAP + live Three.js). The master is 1080×1920 at 30 fps.

| Deliverable | File |
|---|---|
| Reel master, 9:16 | `renders/fitness_9x16.mp4` |
| Captions | `captions.srt` |
| Thumbnail, 1080×1920 (fibre hero plus title) | `thumbnail/thumbnail.png` |
| Brief, beat sheet, mood-board analysis, asset ledger | `BRIEF.md`, `refs/ANALYSIS.md`, `ASSETS.md` |

## How it is built

- **Root:** `index.html` holds 7 scene sub-compositions, every boundary on a 124 BPM downbeat, plus the caption track, the texture overlay and the audio mix.
- **3D heroes:** `assets/3d/plate.js`, `biceps.js` and `fibres.js` are built in code with Three.js r147 and lit by a Poly Haven CC0 HDRI. Each renders from a pure function of time, driven by the timeline and `hf-seek`.
- **Effects:** `assets/fx.js` is the text-effect library (slam, cascade, mask rise, tracking collapse, outline → fill, swap, highlight, scramble, split-flap) plus the 3D wiring.
- **Generated files:** `tools/build_captions.py` writes the captions and `captions.srt`, `tools/build_audio.py` writes the score, SFX and ducked mix, and `tools/build_texture.py` writes the grain.

## Rebuild

`build_audio.py` needs `numpy` and `soundfile`. Run every command from this folder.

Rebuild the captions:

```bash
python tools/build_captions.py
```

Rebuild the score, SFX and ducked mix:

```bash
python tools/build_audio.py
```

Master to about −14 LUFS with true peak ≤ −1 dBTP:

```bash
./tools/master.sh
```

Rebuild the grain texture:

```bash
python tools/build_texture.py
```

Preview one scene fast (needs `python -m http.server 8765` running in this folder):

```bash
python tools/scene_shot.py s3-fibre s3 12.097 13,16,19 out.png
```

Render the master:

```bash
npx hyperframes render --quality delivery --fps 30 -o renders/fitness_9x16.mp4
```

`hyperframes snapshot` and `check` replay every frame up to each sample, which is very slow with live 3D on software GL. Use `tools/scene_shot.py` instead.

To change the end-card handle, edit the `handle` variable on `index.html`.
