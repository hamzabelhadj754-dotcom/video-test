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
