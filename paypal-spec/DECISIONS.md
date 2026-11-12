# PayPal spec ad: "SETTLED." (20s)
Spec ad, not affiliated with PayPal, Inc. Logos: official 2024 wordmark (black/white) and monogram
from newsroom.paypal-corp.com/media-resources, unmodified. Brand blues sampled from the monogram:
deep #002991, bright #008CFF, sky #60CDFF.

## Concept
A cloud of everyday IOUs (sticky notes, receipts, a concert ticket, coins) floats around a phone.
One by one each is settled with a satisfying physical move (note folds into a paper plane and flies
into the phone, receipt rolls up, ticket tears, coins drop) with a "Sent to <friend>" chip.
The frame empties; the last note flips: "Settled." End: "Money stuff. Settled." + wordmark.

## Honesty
- No fees, speeds, protections or availability claims. Only the generic act of sending money to a friend.
- Phone screen is an original "Send" UI, not a copy of the PayPal app. Friends, band, taxi are fictional.

## Design system
- Background warm white #FAFAF7 (radial to #EFECE5). Ink #111. Notes #FFE27A. Receipt paper #F7F3EA.
- Display: Plus Jakarta Sans 800, tracking -0.045em. Receipts: JetBrains Mono. Handwriting: Caveat 700.
- 3D: three.js 0.160, NoToneMapping (AgX washed the yellows), VSM soft shadows on a shadow catcher,
  curled paper planes, flat-shaded paper plane with crease contrast.
- Chips: deep blue pill with bright-blue check.

## Feedback log
- User picked concept 1 ("yes the first one recommended"). USD, English.

## Versions
- Style frames v01: frames/sf_01-03.png
- User approved the look ("render it and make it better if you want to"); later asked for a faster render
  without hurting quality.

## Film (20s, 4:5 1080x1350, 30fps)
comp.html (DOM type + GSAP) + film.js (three.js choreography, pure functions of t), served on :8766.
| t (s) | beat |
|---|---|
| 0-3 | the mess drifts in from depth; "Who owes who?" |
| 3-5.9 | Pizza note lifts, folds, becomes a paper plane, flies into Maya's avatar; "Sent to Maya · $24" |
| 6-7.9 | screen -> Leo; taxi receipt rolls into a tube, shoots in; "Sent to Leo · $18.50" |
| 8-10.4 | screen -> Ava; ticket tears at the perforation, stub tumbles away; "$45, your half" |
| 10.5-12.4 | screen -> Sam; three coins arc in and clink; "Sent to Sam · $6.50"; 04/04 settled |
| 12.4-15 | phone exits; "you owe me one :)" drifts to centre, grows, flips to "Settled." (hit) |
| 15-20 | "Money stuff." + Settled note, wordmark, spec label |
Sound: audio.py (C major groove, paper foley, rising "sent" chimes), -14.4 LUFS, true peak -1.6 dBFS
(limiter after loudnorm; before it the true peak was -0.6).

## Render speed-ups (no visual change)
- Phone screen texture only redrawn/uploaded when its state changes (was ~8MB upload per frame).
- render_fast.js renders all 4 sub-frames only inside fast-motion windows; elsewhere one per output frame,
  and fill.py copies it to the 3 identical neighbours. 1132 renders instead of 1841 for the remainder.
- v01: out/paypal_settled_v01_4x5.mp4 (10.8MB). DELIVERED.
