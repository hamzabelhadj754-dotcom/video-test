# Asset ledger

| File | What | Source | License | Credit |
|---|---|---|---|---|
| `assets/objects/{biceps,sleeping,sunglasses,meat,trophy,alarm}.png` | 3D emoji: flexed biceps, sleeping face, smiling face with sunglasses, cut of meat, trophy, alarm clock | Microsoft Fluent UI Emoji, `3D` PNGs (via jsDelivr from github.com/microsoft/fluentui-emoji) | MIT (`assets/objects/LICENSE-fluentui-emoji`) | © Microsoft Corporation |
| `assets/objects/*@3x.png` | The same emoji upscaled 3× (Lanczos + light sharpen) for large display | derived | MIT | © Microsoft Corporation |
| `assets/objects/dumbbell.png` | Glossy black hex dumbbell, transparent | Modelled and rendered in code: `tools/dumbbell.html` (Three.js r147) | ours | — |
| `assets/hdri/studio_small_09_1k.hdr` | Studio lighting for the dumbbell render | https://polyhaven.com/a/studio_small_09 | CC0 | Poly Haven |
| `assets/vendor/three/*` | Three.js r147 (used only to render the dumbbell PNG) | jsDelivr / npm `three@0.147.0` | MIT | three.js authors |
| `assets/fonts/Anton-Regular.woff2` | Accent words | Google Fonts via Fontsource | OFL 1.1 | Vernon Adams |
| `assets/fonts/Inter-Variable.woff2` | Plain words, counters | Google Fonts via Fontsource | OFL 1.1 | Rasmus Andersson |
| `assets/fonts/InstrumentSerif-Italic.woff2` | Italic contrast words | Google Fonts via Fontsource | OFL 1.1 | Instrument |

- **Built in code:** grid paper, swoosh bands, 4-point stars, crack line, dotted label boxes, circle wipes, grain and vignette (SVG/CSS).
- **Not used:** the two reference videos in `refs/` (local and git-ignored, used for analysis only) and any AI image generation (Higgsfield is excluded at the client's request; the missing dumbbell was modelled in code instead).
