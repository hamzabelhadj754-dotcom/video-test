# Stripe spec ad: "ONE SECOND"
Spec ad, not affiliated with Stripe, Inc. Wordmark: official Stripe logo kit from
stripe.com/newsroom/brand-assets (white + blurple SVGs, unmodified).

## Concept
Someone taps Pay. Time freezes and the one second is stretched into ~10s of film: a single line of
light travels through what happens inside it, then time snaps back: "Paid."
"A lot happens in one second. You'll never notice."

## Honesty rules for this brief
- No latency numbers on screen (would read as performance claims). Steps are numbered 01-04 only.
- Steps limited to what happens at payment time: card authorised, fraud checked, currency converted,
  business notified. No payouts (they take days).
- Merchant is fictional (Kiln & Co., speckled mug, €38.00). Card ends 4242 = Stripe's public test card.
- The checkout is an original UI, not a copy of Stripe Checkout.

## Design system
- Navy #0A2540, deep #061B31, blurple #635BFF, cyan #00D4FF, paper #F6F9FC, slate #8C9EB1, pink #FF5996
  (colours confirmed on stripe.com's own page)
- Display: Geist 500, tracking -0.035em. Data: Geist Mono 500
- The line of light: blurple stroke + white core + glow. It never breaks; it is the camera path.
- Gradient (blurple/cyan/pink) blooms ONCE, on the end card.
- SVG gotcha: zero-width paths break objectBoundingBox gradients/filters; use rects or userSpaceOnUse.

## Feedback log
- User approved concept 1 ("1 recommended").

## Versions
- Style frames v01: frames/sf_01-03.png
- User approved the look and asked to "make it even better" and render the final directly.

## Film (15s, 4:5 1080x1350, 30fps)
Engine: comp.html (HTML + SVG + GSAP 3.12.5), Playwright frame seeking, 120fps -> 4-subframe blend -> 30fps.
Sound: audio.py, fully synthesized; two-pass loudnorm to -14 LUFS.

| t (s) | scene | transition out |
|---|---|---|
| 0-1.32 | checkout, cursor glides, tap; ripple FREEZES mid-expansion, Pay button drains | freeze (tape-stop, silence) |
| 1.4-2.5 | "Let's slow that down." checkout explodes into 3D layers; navy floods from the tap point | dive down (vertical blur) |
| 2.5-4.5 | 01/04 Card authorized: wireframe card, line traces in, check | camera continuation pan |
| 4.8-6.5 | 02/04 Fraud checked: instrument rings, scan line, arc sweep | camera continuation pan |
| 6.8-8.5 | 03/04 Currency converted: line splits into $ £ ¥ ₹, merges into € | camera continuation pan |
| 8.8-10.5 | 04/04 Business notified: Kiln & Co. dashboard + notification | snap-back zoom (radial blur) |
| 10.5-11.5 | checkout again, t = 1.000 s, button -> "Paid" | hard cut on hit |
| 11.5-15 | "A lot happens in one second. You'll never notice." gradient blooms once, wordmark, spec label | hold |

Fixes during build: radial-gradient banding came from SVG filters in linearRGB ->
color-interpolation-filters="sRGB" + a balanced dither layer; frame 0 made visible (thumbnail);
colour drain moved off the 3D layers (filters flatten preserve-3d); ripple hidden until the tap.

## Versions
- v01: out/stripe_one_second_v01_4x5.mp4 (28MB, H.264 CRF18 cap 14M, AAC 256k). DELIVERED.
- User: "add more visual elements like 3D phone or whatever you like, you have the freedom".

## v02: real 3D layer (three.js 0.160, WebGL via SwiftShader in headless Chromium)
comp2.html + stage3d.js (ES module, served over http://127.0.0.1:8765 because modules can't load
from file://; render with `URL=http://127.0.0.1:8765/comp2.html node render2.js 120 render/g120 --range a b`).
Every 3D transform is a pure function of t -> deterministic frames. Screens are 2D canvas textures
drawn with the film's fonts and redrawn per frame.
- Open: 3D phone (rounded-box body, clearcoat metal, glass sheen) with an original checkout + speckled
  mug artwork; tap ripple drawn on the screen and frozen mid-way; camera dives into the Pay button.
- 01 Card: glossy 3D debit card (blurple, chip, contactless, 4242), the line passes BEHIND it.
- 02 Fraud: 3D gyroscope (3 metal rings on different axes, tick ring, core), cyan arc closes = passed.
- 03 Currency: USD/GBP/JPY/INR coins flip face-on as strands reach them, € coin spins in.
- 04 Notified: the merchant's phone, lock screen notification "New payment €38.00", vibration.
- Snap back: camera rockets out of the customer's screen to the phone, button -> "Paid".
- Layer order per scene: background -> SVG line -> WebGL canvas -> type, so objects occlude the light.
- Sound re-timed to the 3D beats + coin ticks + phone vibration (-14.1 LUFS).
- v02: out/stripe_one_second_v02_4x5.mp4. DELIVERED.
