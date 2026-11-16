# gainsdom: Same Muscle (brand edition)

## Brand identity (from the client's logo)
- GD monogram: white beveled letters forming a pointy-top hexagon, on black. Monochrome, angular, hard-edged.
- Content tone: dark, motivational, educational. Client adds their own music.

## Design system
- Background: charcoal sweep #2B2E33 -> #17181B -> #0A0A0B, soft top light cone, drifting haze, white dust.
- Colour: white/silver only. Accent words get a beveled silver gradient (echoes the logo). No hue accents.
- Shapes: chamfered corners on every card, chip and pill (the monogram's cuts); hexagon for the end reveal.
- Type: Archivo condensed caps (800-900) for headlines, Geist for supporting text.
- 3D: white ceramic light dumbbell, black glossy heavy dumbbell, chrome handles.
- Logo: extracted from the client's screenshot (letters only, transparent) -> public/brand/gd_letters.png.
  Low source resolution (~370px); ask for the original file for sharper end cards.

## Deliverables
- gainsdom_v03.mp4: no audio (for the client's song). gainsdom_v03_sfx.wav: sound-effects stem.

## Upgrade (user: "doesn't look like a big brand video")
- No Higgsfield (user's choice). Code-only route.
- Hero: hex dumbbell (black satin rubber, chrome collars, knurled steel handle) with the GD monogram printed on the
  head faces; studio softbox-strip environment for streak highlights; layered compositing:
  background canvas (floor, contact shadow, 3D type) with CSS lens blur, sharp hero canvas, bloom pass (blurred
  bright copy, screen blend), vignette and grain. @react-three/postprocessing renders black in this headless setup.
- Brand texture must be loaded before canvases mount (useBrandReady) or Remotion captures a stale frame.
- Music: client's track (Radiohead "Kid A", copyrighted): ~117.5 BPM. Hits at 1.31/1.71/2.07/2.57, run 6.35-9.62,
  12.14/12.64, 14.16/14.66, 16.43/17.19, 19.21. Deliver silent master; client adds the track in-app.
