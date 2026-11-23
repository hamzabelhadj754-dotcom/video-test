# Guesty — 30 s promo (Remotion)

"Chaos → Calm": 16 scenes, 900 frames @ 30 fps, in two formats.

| Output | Composition | Size |
|---|---|---|
| `out/guesty-promo-9x16.mp4` | `Promo9x16` | 1080×1920 (Reels) |
| `out/guesty-promo-1x1.mp4` | `Promo1x1` | 1080×1080 |

```bash
npm install
npm run check-timing   # asserts every hold >= 45 frames, total = 900, <= 6 words per hold
npm run dev            # Remotion Studio
npm run stills         # mid-hold still of every scene -> out/stills/<format>/
npm run render         # check-timing + both MP4s (H.264, CRF 18, veryfast)
```

## Where things live

- `src/timing.ts`: `ENTER = 9`, `HOLD = 45`, `SCENE = 54`, transition and outro constants. Every scene is built from these.
- `src/copy.ts`: all on-screen text. The proof points carry their source wording from guesty.com as comments.
- `src/brand.ts`: real colors and font taken from guesty.com.
- `src/components/`: `Headline`, `StatCard`, `Chip`, `UICard`, `QuoteCard`, `Logo`, `CTAButton`, plus the scene shell, wipes and UI stage.
- `src/scenes/Scene01.tsx` … `Scene16.tsx`

## Optional assets (picked up automatically from `public/`)

| File | Effect |
|---|---|
| `guesty-logo.svg` | Logo (currently the header logo from guesty.com). Delete it to fall back to a text wordmark. |
| `music.mp3` | Soundtrack, 0.5 s fade-in and 1 s fade-out |
| `sfx/*whoosh*.mp3`, `sfx/*pop*.mp3` | Whoosh on wipes, pop on chip/stat entrances |
| `channels/airbnb.svg`, `booking.svg`, `vrbo.svg`, `expedia.svg`, `google-travel.svg`, `hopper.svg` (or `.png`) | Replace the text chips with official channel logos |
