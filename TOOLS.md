# Gains Dom motion-graphics toolkit

Reinstall everything on a fresh cloud machine: `bash scripts/setup-tools.sh`

| Tool | What it's for | How |
|---|---|---|
| **Remotion** (`fitness-video/`) | Our main editor: episodes, beat-synced cuts, captions, transitions | `npx remotion render <Id>` (render long videos in chunks of ≤233 frames) |
| **@remotion/three + React Three Fiber + drei + postprocessing** | 3D inside Remotion: extruded metal type, camera orbits, bloom, grain, DOF | Starter: `fitness-video/examples3d/` → `npx remotion still examples3d/index.ts T3D out.png --gl=swangle`. Always pass `--gl=swangle`; fonts/HDRs must be local files in `public/` (the render browser has no internet). |
| **@remotion/transitions, light-leaks, noise, motion-blur, shapes, paths, lottie** | Ready transitions, light leaks, organic noise motion, real motion blur, SVG path/shape animation, Lottie (After Effects exports) | Import in any episode |
| **HyperFrames** (HeyGen, open source) | HTML/CSS/GSAP → MP4; ~450 ready blocks (kinetic type, transitions, 3D, captions), beat detection, frame-by-frame checks; renders ~10× faster than our Remotion setup here | `hyperframes init <name> --resolution portrait --non-interactive`, `hyperframes check`, `hyperframes render`. Skills in `.agents/skills/hyperframes*`. Keep GSAP local (no CDN). |
| **Blender 5.2 LTS** (`/opt/blender`) | Real 3D: cinematic 3D titles, particles, smoke, volumetric light, then composite into Remotion/HyperFrames | `/opt/blender/blender -b -noaudio -P script.py` (Cycles on CPU, ~9 s/frame at 540×960) |
| **faster-whisper** | Word-level speech timing for caption sync | `scratchpad tools/transcribe.py` pattern (decode with ffmpeg → numpy) |
| **pinterest-dl / gallery-dl** | Footage | `scripts/pinterest-download.sh "<search or URL>" 20` |
