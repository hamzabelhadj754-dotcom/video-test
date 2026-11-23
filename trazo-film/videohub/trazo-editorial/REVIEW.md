# TRAZO · "Un solo trazo" — screening notes

Concept: *TRAZO means "stroke": one continuous orange line draws the entire film and ends as the logo's dot.*
Method: persona section 7 — render, `tools/screening-room.sh` (contact sheet, a strip for every second at 6 fps,
motion chart, freeze/black, loudness), every strip opened, notes below, fix, re-render, compare.

## Round 1 — v08 (`out/TRAZO_Editorial_v08.mp4`, `out/review_v08/`)

Specs: 1920x1080, 60 fps, 96.40 s, h264 yuv420p, −14.1 LUFS, true peak −1.3 dBFS.

| Time | Finding | Class | Fix in v09 |
|---|---|---|---|
| 0:01.6–0:03.2 | Dot of YASSER. launches the pen; e-bike drawn in one stroke; reads instantly | works | — |
| 0:03.25 | Paper floods out of the pen tip (iris) with the drawing in place | works | — |
| 0:05.2–0:06.2 | Line drawing lands exactly on the real photo bike (drawing → reality) | works | — |
| 0:09.75 | Camera follows the pen into Clientes; directional blur clean after softening | works | — |
| 0:10.4–0:10.9 | Comet path into the circle wiggles (S-shape) before the ring starts | Polish | flat approach into the bottom of the circle; ring starts there |
| 0:12.6–0:15.3 | Student hold: frames nearly identical for ~3 s | Major | glint travels the ring; slow push on the subject |
| 0:22.0 / 0:28.8 / 0:35.55 / 0:41.1 | Giant-word cuts land on the voice and shrink into the title box | works | (shrink slowed to 0.6 s + 9-sample blur before v08) |
| 0:50.5–0:53.9, 0:55–0:57.3, 0:58.6–0:60.2 | SMART cards hold still for 3+ s each | Major | each card pushes in slowly; arrow tip breathes, a light runs the 15 ticks, the star pulses |
| 0:55.8 | The 15 tick marks cross the date pill | Major | ticks moved below the pill |
| 1:22–1:25.6 | Org chart: top node waits alone | Major | stem + bar split on "por cliente"; each drop arrives with its node |
| 1:29.3–1:29.6 | Mostly black while the pen writes TRAZO (flagged "black") | intended | silence-before-the-hit beat |
| color tag | `unknown` (VideoHub template encodes BT.601/smpte170m by design) | known | kept for VideoHub's contract |

## Round 2 — v09 (`out/TRAZO_Editorial_v09.mp4`, `out/review_v09/`)

Specs: 1920x1080, 60 fps, 96.40 s, h264 yuv420p, −14.1 LUFS, true peak −1.4 dBFS. Freeze list: only 1:25.27–1:25.77 (0.5 s,
org chart between the split and the first drop — Polish, accepted). Black: 1:29.28–1:29.57 = intended (the pen writes TRAZO on black).

Compared with v08 side by side: 0:10.4 the line now runs flat into the bottom of the circle (no wiggle); 0:12.6–0:15.3 a glint
travels the ring and the subject pushes in; 0:50–1:00 each SMART card pushes in, the arrow tip breathes, a light runs the 15 ticks,
the star pulses; 0:55.8 ticks clear of the pill; 1:24.2–1:25.1 the structure splits on "por cliente". Blockers 0, Majors 0.

| Criterion | Score | Evidence |
|---|---|---|
| Concept | 9 | One idea, bookended: the dot of YASSER. becomes the pen (0:01.6) and the pen ends as the dot of TRAZO. (1:29.9) |
| Typography | 8 | Bricolage Grotesque display (−2 % tracking), Cormorant serif titles; pills still small on purpose (secondary) |
| Composition | 8 | One hero per beat; function scenes keep a list + one visual (0:27, 0:35, 0:40) |
| Motion quality | 8 | Custom curves, springs, 5–9 sample motion blur on slams/word cuts (0:22.6), push-ins on holds |
| Transitions | 9 | Only line-led travel (0:09.75), giant-word cuts on the voice (0:22.0), iris and match cuts (0:03.25, 1:08.4) |
| Color and finish | 8 | Orange reserved for the trazo, navy/paper/black world, grain, vignette, bloom; color tag per VideoHub template |
| Sound | 8 | Composed score by section, silence before "Captación" and the final slam, hits on every word cut (can't listen: checked by structure and levels) |
| Brand fit | 9 | The film literally draws the brand name's meaning |
| Template test | 9 | Custom pen engine, one-line bike traced from the photo, monoline wordmark |
| Taste | 8 | Sub-captions and paragraphs removed; dots removed; one accent colour |
| Big-brand test | 8 | Holds up as a brand-system film (Grammar 3) |
| No basic transitions | 9 | No crossfade between unrelated shots; every cut is carried by the line or the word |
| Craft level | 8 | Drawing → photo match at 0:05.2 lines up to the pixel; comet/scene seams camera-exact |

Decision: **pass** (every line ≥ 8, zero Blockers, zero Majors).
