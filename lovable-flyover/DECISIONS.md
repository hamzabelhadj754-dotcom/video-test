# Lovable fly-over: decisions

Spec / concept ad (portfolio work), not commissioned by Lovable. Logo and wordmark from Lovable's official
brand hub (lovablebrand.lovable.app); page captured from the live site; no claims or copy invented.

## Source
- Page: `https://lovable.dev/home` (the site's own "Home" link; the bare domain answers headless browsers with
  a Cloudflare check, `/home` serves the same marketing page without one). 1440 wide, 5808 tall, captured at 2x.
- Locked state: cookie banner removed, clock-driven animations paused (scroll-linked gradients keep their timeline),
  hero placeholder frozen on one of the page's own rotating lines: "Ask Lovable to create a landing page for my...".
- 30 lifted pieces in `capture/out/layers.json`. Story strips and logo cards stay flat (their DOM boxes are wider
  than what is drawn, or not separable).
- Hero chips = the two nav pills plus the prompt's "+" button (Build/mic have no background of their own, so
  lifting them would float bare text).

## Copy
- Line: **Every page started** / *as a sentence.*  (Geist 500 74px, Instrument Serif italic 82px #8b8b92)
- Why: the film flies over a whole page, then says where it came from. Ties to the hero prompt. No claims.
- Badge: official black lockup, 21px tall, in a white pill at y 44.

## Look
- Floor #f9fbfb centre to #f2f3f6 corners (screen radial). Page shadow #1a2133 at 17%, sigma 64 page px.
- Piece shadows: flat #1a2133, offset (0.10z, 4 + 0.36z), blur 7 + 0.5z, 26% (analytic rounded-rect).
- Logo tiles: colour logomark (official 2x PNG) on a white rounded tile (23.5% radius, hairline).
- Testimonial edge: 71 world px thick so it reads as 34px on screen at 6.3s; white lip shading to 80%.
- Depth of field: 75x in front, 6x behind, cap 120px, 40 golden-angle taps with mip-matched reads; near-lens
  spill from a mipmapped near layer; focus follows the page (or lifted piece) at frame centre, averaged over 0.2s.
- Linear-light compositing (sRGB textures), triangular dither on output.

## Motion (film/scene.js is the source of truth)
- Glide: one speed curve, cruise 617 page px/s (calibrated: second-section title at centre at 1.6s, footer title
  "Ready to bring your idea to life?" at centre at 8.0s). Look-at starts at y 520 (prompt mockup).
- Distance 1360 to 1700 (ease-out, never back in), rise: log-scale trapezoid to the full-page strip (d 10224),
  bottom edge held at y 1110 from 8.3-8.65s. Overhead creep 3.5%, dive on a Hermite (no hitch), card lands at
  y 283, 1018 wide, 38px corners; hold creeps 2% about the card centre.

## Sound
- No track supplied: designed bed. Whooshes 8.66s and 9.80s, hit 9.97s.

## Render
- `node render/stills.js [t...]` for stills, `node render/render.js` for the film (60fps, 16 subframes over 0.7
  frame). Cloud container has no GPU: SwiftShader, about 8s a frame. On a Windows GPU: `GPU=1`.

## Feedback log
- (none yet)
