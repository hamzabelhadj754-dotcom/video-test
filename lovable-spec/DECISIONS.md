# Lovable spec ad: "Got an idea?" (20s)
Spec ad, not affiliated with Lovable. Brand from the official Lovable Brand Hub
(lovablebrand.lovable.app): logos (full-white lockup, colour logomark), palette, gradients, type scale.
- Palette (official): Blue #4B73FF, Light Blue #4E93FF, Violet #BBC1FF, Bubblegum #FFA6F9, Pink #FF0178,
  Red #F7101D, Orange #FF6D1B, Yellow #FFA517, Black #1B1B1B, Creme #F7F4ED.
- Type: their brand font Camera Plain is licensed to them -> substitute Hanken Grotesk 600, -4.5% tracking,
  0.9 line height (their headline spec). Swap in Camera Plain if the user has rights.
- Logo used as downloaded, per their do/don't rules (no stretch, recolour, effects, busy backgrounds).
- Apps shown (Rosa's Bakery, Sunday League, Plant pals, Velvet Static) are fictional, labelled on the end card.
  No speed or capability claims.

## Build
comp.html (DOM type, prompt box, GSAP) + world.js (three.js: live gradient shader with dither, phone,
5 flying bakery pieces, desktop browser window "rosasbakery.lovable.app", montage phones) + ui.js (canvas app art).
Served on http://127.0.0.1:8768/comp.html.
Gotcha: transparent phone glass wrote depth and hid pieces -> depthWrite:false + renderOrder.

## Feedback log
- User approved concept 1 and asked for "all your powers".

## Versions
- Style frames v01: frames/sf_01-04.png (4.4s prompt, 9.4s assembled app, 12.6s montage, 17.5s end card)
