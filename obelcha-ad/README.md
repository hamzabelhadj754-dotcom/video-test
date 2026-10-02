# OBELCHA — 20 s launch ad (Spain)

Deterministic HTML/canvas motion graphics, rendered with the **HyperFrames CLI** (`npx hyperframes render`). A built-in Playwright + ffmpeg renderer is kept as a fallback. **`timeline.json` is the single source of truth** for every timing, plus copy (ES/EN/FR), VO script and audio cues.

> **Concept:** One drop of liquid gold falls into darkness. It reaches the problem (clogged pores, dull skin), becomes the serum inside the bottle, then marks each benefit before landing as the gold underline beneath the OBELCHA wordmark. One drop carries the story from question to product to brand, so the ad reads as a premium, trustworthy object and not as a promise.

## Re-render (one command)

```bash
./build.sh                     # audio → VO check → SRTs → 5 videos (HyperFrames) → QA sheets
RENDERER=playwright ./build.sh  # same, with the fallback Playwright renderer
```

First time on a new machine, run `scripts/setup.sh` once. It installs Node/Python deps and downloads the local TTS voice plus the optional Whisper QA model (~450 MB into `.cache/tts`). Requirements: Node 18+, Python 3.10+, ffmpeg, and Chromium for Playwright.

## Deliverables

| File | What |
|---|---|
| `out/obelcha_ad_9x16_ES.mp4` | **Master.** 1080×1920, ES supers + ES VO |
| `out/obelcha_ad_1x1_ES.mp4` | 1080×1080, native layout |
| `out/obelcha_ad_16x9_ES.mp4` | 1920×1080, native two-column layout |
| `out/obelcha_ad_9x16_EN.mp4` | 9:16, EN captions/supers (ES VO) |
| `out/obelcha_ad_9x16_FR.mp4` | 9:16, FR captions/supers (ES VO) |
| `out/captions/obelcha_ad_{ES,EN,FR}.srt` | Sidecar captions for platform upload |
| `audio/mix.wav` | Final mix, −14 LUFS / −1 dBTP (24-bit, 48 kHz) |
| `style_guide.md` · `storyboard.md` · `sound_map.md` | Creative docs |
| `QA_REPORT.md` · `qa/` | Two scored QA rounds: contact sheets, transition strips, phone preview |
| `MISSING_ASSETS.md` | What to drop into `assets/` to replace placeholders |

All videos: H.264, yuv420p, 30 fps, HyperFrames `--quality high --crf 19`, AAC audio.

## How it works

```
timeline.json ──► src/ad.js (canvas renderer, window.seek(t))
      │              └─► scripts/hf_build.mjs → hyperframes/<variant>/index.html ──► npx hyperframes render → out/*.mp4
      │                   (one HyperFrames project per variant; a paused GSAP timeline registered on
      │                    window.__timelines.root drives seek(t) through a proxy setter; mix.wav is an <audio> clip)
      │
      └────────► scripts/audio.py (TTS VO, synthesized SFX, music bed, ducking, loudness) ──► audio/mix.wav
                 scripts/captions.py ──► out/captions/*.srt
```

- **Deterministic:** `window.seek(t)` renders the exact frame for time `t` as a pure function. Randomness comes only from a seeded mulberry32, and nothing reads a clock. Film grain is added by ffmpeg with a fixed seed. TTS lines are cached in `audio/vo_cache/` (keyed by text, voice and speed), so audio rebuilds are bit-identical.
- **Native layouts:** `LAYOUTS` in `src/ad.js` positions everything per format; timings stay in `timeline.json`. On 9:16, all copy stays inside the platform-safe box (top 250 px, bottom 400 px, right rail 140 px). Text auto-fits to its box and never goes below 64 px on 9:16; if it would, it re-wraps instead.
- **Captions:** the supers *are* the burned-in captions. They mirror the VO verbatim, which keeps every frame at 6 words or fewer. `?lang=en|fr` swaps the supers for the EN/FR variants. SRTs are exported for all three languages.
- **Real assets:** put `assets/logo.svg|png`, `assets/product.png` or `assets/music.mp3` in place and rebuild. Each one replaces its placeholder automatically.

## Live preview / scrubbing

```bash
npm run preview      # then open http://localhost:8080/src/index.html?format=9x16&lang=es
```

Query params: `format=9x16|1x1|16x9`, `lang=es|en|fr`, `safe=1` (shades the platform UI zones), `grain=0|1`.

## Useful commands

```bash
node scripts/render.mjs --format 9x16 --lang es --stills 0,6.35,17.5 --outdir qa/dev   # quick stills
node scripts/render.mjs --format 1x1 --lang es --audio audio/mix.wav --out out/x.mp4   # one video
python3 scripts/audio.py [--no-vo] [--regen-vo]                                         # audio only / captions-only mix
python3 scripts/check_vo.py                                                             # Whisper intelligibility check
bash scripts/qa.sh                                                                      # QA sheets from out/*.mp4
```

## Editing

- **Copy:** `timeline.json → copy.{es,en,fr}` (`\n` = line break), `vo.lines[].say`, `captions.cues`.
- **Timing:** `text[]` in/out, `droplet.keys` (the spine path via named anchors), `bottle.keys/rotation/sweeps`, `transitions`, `audio.sfx`.
- **Colors / easing / grain:** `meta.palette`, `meta.easing`, `meta.grain`.
