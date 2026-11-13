# Someday — spec ad for Lovable (not affiliated)

## Approved concept
"Someday": a notes list of unbuilt ideas; one line is lifted into Lovable, the app builds itself,
"Someday" is struck and becomes "Today." End line: "Someday is a sentence away."

## Format
16:9, 1920x1080, 30fps, 22s (660 frames).

## Design system
- Colors (official brand hub): Creme #F7F4ED, Black #1B1B1B, gradient "Horizontal Full" stops in `src/theme.ts`.
  App accent: Orange #FF6D1B. Selection: Violet #BBC1FF.
- Type: Instrument Serif (display, italic for "Someday"), Geist (UI/text). Bundled locally in `public/fonts` (OFL).
  Lovable's own Camera Plain is not used (brand-licensed).
- Logo: official SVGs from lovablebrand.lovable.app in `public/brand`, never redrawn.
- Motion: expo-out entrances cubic-bezier(0.16,1,0.3,1), snap zooms with motion blur, constant camera drift.
- Transitions: cut on action, object-led, hard cut on beat, match cut, color field.
- Finish: grain overlay, vignette, gradient glow behind hero UI.

## Honesty rules
No invented Lovable features, numbers or claims. End card carries "Spec ad. Not affiliated with Lovable."

## Log
- v00: style frames (note, build, end card) rendered to `out/styleframes` for look approval.
