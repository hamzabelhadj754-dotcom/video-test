# Apple spec ad: "QUIET" (AirPods Pro, 15s)
Spec ad, not affiliated with Apple Inc.
- NO Apple logo: Apple publishes no logo kit for third parties and its trademark guidelines forbid
  using the logo in others' marketing. End card uses the product name in type instead.
- NO product render: building an imitation AirPods would fake a real product. The experience is the hero.
- Claim kept to a real, generic feature: Active Noise Cancellation (AirPods Pro have it).
- Apple's SF fonts are licensed for Apple platforms only -> not used.

## Concept
The city's noise as kinetic typography (HONK, WEEE-OOOO, BRRRRRT, CALL ME BACK...) slamming, vibrating,
stacking. One soft press: everything freezes, drains to grey, breaks into dust in a left-to-right wave,
and part of that dust gathers into "Quiet." End: "Turn the world down." AirPods Pro.

## Design system
- #0A0A0A / #F5F5F7. Chaos colours (drain at the press): red #FF3B30, yellow #FFD60A, blue #0A84FF, grey #8E8E93.
- Display: Anybody (variable wdth 50-150, wght 100-900): extremes for noise, wght 250-300 for calm.
- Text: Hanken Grotesk. Canvas fontStretch keywords drive the width axis.
- Engine: comp.html, single 2D canvas, draw(t) pure function; 67k dust particles sampled from the words.

## Feedback log
- User picked concept 1 ("1 recommended"). 15s.

## Versions
- Style frames v01: frames/sf_01-04.png (3.92s chaos, 4.78s dissolve, 7.6s Quiet., 12.9s end card)
