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
- v01: first full animation with synthesized sound design (`tools/sound.py`). Internal review only.
- v02: stronger prompt shot, raised end-card glow. Delivered: `renders/someday_v02.mp4`.

## Timeline (frames, 30fps)
0 note · 60–114 cursor selects the line · 118–150 line lifts into the prompt · 166–212 typing · 230 send ·
240 build (music in, 120bpm) · 300 day shot · 345 slots shot · 390 wide, 412 book, 416 card ·
450 back to the note · 462 strike · 492 "Today." · 522–540 glow floods · 540–660 end card.
- Feedback on v02 (user): transitions and visuals not strong enough for Lovable; the copy into the prompt must feel smooth.
- v03: transitions rebuilt as one continuous process:
  - Copy: the selected line lifts off the page with a shadow, darkness opens from behind it, and the
    violet selection highlight itself grows into the prompt box (shape morph, pixel-matched by probe).
  - Send: a gradient ring runs around the box, the app window swings up out of the glow, and the prompt
    flies into the chat panel (camera continuation; glow handed over without a cut).
  - Booked to Today: the "You're booked" check grows to fill the frame with the brand gradient, then
    shrinks into the tick on the note row (match cut). White flashes removed.
  - Real motion blur: rendered at 4 sub-frames per frame (`SomedayMB`, 120fps) and blended to 30fps.
  - Per-letter blur-in typing, light sweep across the app window, reworked sound cues for the new moves.
  - Element positions for the match cuts come from `tools/probe.py` into `src/measure.ts`.
