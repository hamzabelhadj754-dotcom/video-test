# OBELCHA — Style Guide (launch ad, Spain)

## Concept (3 sentences)
A single drop of liquid gold falls into darkness. It reaches the problem (clogged pores, dull skin), becomes the serum inside the bottle, then marks each benefit before landing as the gold underline beneath the OBELCHA wordmark. One drop carries the story from question to product to brand, so the ad reads as a premium, trustworthy object and not as a promise.

## Palette
| Token | Hex | Use |
|---|---|---|
| `black` | `#0B0B0B` | Canvas. Always the dominant field (≥ 70 % of every frame). |
| `gold` | `#C9A24A` | Accent only: the droplet, punctuation in the hook, eyebrow, card index and frame, underline, offer line. Never a background fill. |
| `champagne` | `#E8D9B5` | Light: rim lights, ripples, sweeps, URL. |
| `offwhite` | `#F5F1EA` | Headline type, specular highlights. |

The serum and droplet use a derived gold ramp (`#4E3A10 → #A27C2C → #D9B35A → #F3DE9F`) so the liquid looks dimensional while staying inside the brand hue.

## Type
| Role | Face | Weight | Size (9:16) | Notes |
|---|---|---|---|---|
| Hook / titles / benefits | Cormorant Garamond | 600 | 104–210 px | Gold `¿ ?` in the hook. |
| Tension lines | Cormorant Garamond Italic | 500 | 170 px | Softer, more editorial tone. |
| Eyebrow (NUEVO), card index | Jost | 500 | 64 px | Tracking +0.25–0.38 em, caps. |
| URL | Jost | 400 | 84 px | Champagne. |
| Offer | Jost | 500 | 64 px | Caps, tracking +0.08 em, gold. |
| Wordmark (placeholder) | Cormorant Garamond | 600 | 150 px | Tracking +0.24 em. Replaced by `assets/logo.svg` when supplied. |

Rules: no more than 6 words on screen at once. Nothing under 64 px on the 1080-wide 9:16 cut; the renderer's auto-fit never shrinks below that and re-wraps instead. All copy stays inside the platform-safe box (9:16: y 250–1520, x 80–940).

Fonts are SIL OFL (Google Fonts) and are stand-ins until the brand fonts arrive (see MISSING_ASSETS.md).

## Motion language
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for every entrance and move. Gravity (quad-in) is used only for falling drops.
- **Text in:** 0.75 s rise (≈ 0.3 × cap height) + fade + 6 % blur-to-sharp + tracking settle (+0.08 em → 0). Lines stagger by 0.09 s.
- **Text out:** 0.4 s smoothstep fade with a small upward drift. No slams, no bounces, no hard cuts.
- **Product:** slow cylindrical rotation, read from the wrapped wordmark, suspended micro-bubbles and the drifting caustic. Highlights stay fixed to the "studio" so the rotation looks physical. Two light sweeps on the glass and one sheen across the logo.
- **Spine:** one gold droplet, always on screen except while it *is* the serum (6.6–11.1 s).
- **Texture:** temporal film grain (ffmpeg `noise=alls=5:allf=t`, fixed seed), soft vignette, and a warm halo behind the product.
- **Banned:** sparkles and star bursts, lens-flare spam, neon "tech glow", particle confetti, whip-pans, glitch.

## Copy tone (EU cosmetics compliance)
Cosmetic, observational wording only: "ayuda a", "aspecto", textures and sensations. No medical verbs (cura, elimina, trata), no guarantees, no percentages or clinical claims. Current lines:
- ¿Puntos negros? / Poros obstruidos. / Piel apagada.
- Nuevo Sérum Purificante, de OBELCHA
- Ayuda a limpiar los poros · Aspecto más luminoso · Ligero, no graso
- obelcha.com · Envío a toda España

## Formats (built natively, not cropped)
- **9:16 (1080×1920, master):** stacked layout. Copy sits in the upper safe area, the product sits low, and the end card puts the product above the lockup.
- **1:1 (1080×1080):** the hook and headline sit high. In the benefits scene the product is on the left and the card on the right; the end card is centred.
- **16:9 (1920×1080):** two columns. Copy is on the left and the product on the right from the reveal onwards.
