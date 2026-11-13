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

## v2 direction (user: too many phones; end cards all the same formula)
"Words become the app" (comp2.html + grad.js). No devices anywhere. Creme background, living gradient.
- The typed idea fills the frame: "a booking app for my grandma's bakery".
- grandma's -> handwritten "Rosa" -> app logo; booking (7 letters) -> Mon..Sun chips; app -> "Book a table";
  bakery -> filled with cake -> grows into the hero image (last, as the climax). Canvas becomes a page card.
- Scroll the page (Today's bakes, opening hours). Montage = full-width page cards (no phone chrome), prompt pill typed.
- Ending: everything folds into ONE empty prompt box in a gradient halo; the placeholder
  "Let's build something Lovable" fades in word by word = the call to action. Small centred logo. No corner layout.
- Style frames v2: frames/v2_sf_01-05.png

## Film v01 (20s, 1080x1350, 30fps) — DELIVERED: out/lovable_words_v01_4x5.mp4
- Rendered at 120fps (4-subframe blend) in 134s (DOM + one shader = fast).
- Montage slides: expo.out moved ~160px per subframe -> stacked ghosts. Fixed with power3.out/power2.in
  curves plus a 30px blur during the move; re-rendered only those windows.
- Sound: audio.py, 100 BPM grid from 0.4s so montage cuts land on beats; per-character typing, seven
  rising pops as letters become days, swell as the cake grows, airy resolved ending. -14.6 LUFS, -2.4 dB peak.
