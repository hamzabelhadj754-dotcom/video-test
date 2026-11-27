# ChatGPT — "One Box" (spec ad)

**Status:** spec / concept ad, portfolio work. Not affiliated with OpenAI. Labeled on the end card.

## The idea
One box, every hour. The camera never leaves the ChatGPT composer while the light around it moves
from 7 a.m. to 3 a.m. Three real-feeling questions, a burst of four more, then the placeholder itself
becomes the line: **Ask anything.**

Feeling sentence: *"Whatever's on your mind, at any hour, this is where it starts."*

## Brand honesty
- OpenAI's design guidelines (openai.com/brand) require permission to use their logos, so the film uses
  **no Blossom and no wordmark**. The end card sets the product name "ChatGPT" as plain type.
  If permission is granted, swap the official mark into the end card.
- Only real product behaviour is shown: typing, image upload by drag and drop, streamed answers,
  dark mode. No invented features, numbers or claims.
- Answers are accurate (acetone smell = hungry starter; feed 1:1:1).
- The UI is rebuilt in HTML/CSS, simplified; icons are drawn for this film.

## Design system
| Token | Value | Role |
|---|---|---|
| Paper | `#F4F3EE` | end card |
| Ink | `#111111` | headline, brand |
| Ash | `#8C8A84` | secondary |
| Amber | `#E3A35A` | single accent: the light sweep on "Not dead, just hungry." |
| UI light / dark | `#FDFDFC` / `#212121` | ChatGPT surfaces (never pure white/black) |

Light looks (World.tsx `LOOKS`): morning (warm, long skewed window light), afternoon (neutral),
dim (light leaving), night (screen glow only), plus noon / dusk / evening for the burst.

Type: **Instrument Serif** (statement, italic for emphasis), **Geist** (UI), **Geist Mono** (time label, URL).
All OFL, from npm packages. Caveat for the whiteboard handwriting.

Motion: entrances `cubic-bezier(0.16,1,0.3,1)`, exits `(0.64,0,0.78,0)`, camera `(0.65,0,0.35,1)`.
Camera never still: slow drift layered on every move. Motion blur (CameraMotionBlur, 6 samples)
on the pull-backs, the whip, the drag and the end-card pull-back.

Transitions (3 types): light-band pass with mask reveal (morning → afternoon), color field + hard cut
on the beat (daylight leaves → 3 a.m.), hard cuts on the beat (burst, end card). Typographic
transition inside the end card (placeholder → headline).

## Timeline (30 fps, 750 frames, 90 BPM = 20 frames per beat)
| Frames | Moment |
|---|---|
| 0–204 | 7:12 AM — sourdough question, answer, amber sweep |
| 188–220 | light band passes, afternoon revealed |
| 204–400 | 2:40 PM — whiteboard photo dragged in, Monday plan |
| 352–400 | daylight leaves the room |
| 400–560 | 3:04 AM — dark mode, toast for a sister's wedding (with a typo fixed) |
| 560–640 | burst: 4 questions, 4 hours, cut on every beat |
| 640–750 | silence, pull-back, "Ask anything." / ChatGPT / chatgpt.com |

## Sound
Original score, synthesized in `scripts/sound.py` (numpy only, no samples, no licensing risk):
D major e-piano + pads, a soft pulse in the afternoon, a near-empty night, full kit and riser
for the burst, hard stop into silence, resolution chord and a bell on the brand.
Every keystroke has its own click from the real typing schedule. Final: −14 LUFS, true peak ≤ −1.5 dBFS.

## Pipeline
1. `npx tsx scripts/export-events.ts` → `audio/events.json`
2. `python3 scripts/sound.py` → `audio/premix.wav`
3. `npx remotion render ChatGPTSpec out/raw_4k.mp4 --scale=2 --crf=12`
4. `bash tools/finish.sh out/raw_4k.mp4 out/chatgpt-spec_v01.mp4` (Lanczos to 1080p, grain, BT.709, loudness)
5. `BEATS=audio/beats.txt bash tools/screening-room.sh out/chatgpt-spec_v01.mp4`

## Versions
- v01 — first full render. Screening: dead frames after each send (bubble outran camera), vignette banding into an oval ring inside the motion-blur stack.
- v02 — bubble, composer and camera share one 24-frame curve; vignette and end-card background moved outside the blur stack. Delivered as `chatgpt-spec-v02.mp4`.

## v02 rubric (honest)
| Criterion | Score | Evidence |
|---|---|---|
| Concept | 9 | one box, one day, the placeholder becomes the line (22.0 s) |
| Typography | 9 | Instrument Serif headline, Geist UI, tabular times (10.5 s, 23.5 s) |
| Composition | 8 | lower third goes quiet during answer holds (4–6 s) |
| Motion | 8 | shared camera/bubble curve, blur on fast moves (2.2 s, 7.0 s) |
| Transitions | 8 | light-band reveal (6.5 s), color field + beat cut (13.3 s), hard cuts (18.7–21.3 s) |
| Color and finish | 9 | light-led palette, grain, no banding |
| Sound | 7 (unverified by ear) | synced and on target (−14 LUFS), but synthesized instruments |
| Brand fit | 9 | real UI behaviour, OpenAI-quiet tone |
| Template test | 9 | nothing stock |
| Taste | 9 | one accent, one idea, three transition types |
| Big-brand test | 8 | |
| No basic transitions | 9 | |
| Craft level | 8 | cursor drag, typing with a typo fix, streaming |
