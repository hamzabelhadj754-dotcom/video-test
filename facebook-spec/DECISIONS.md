# Facebook spec ad: "Your weird has a group."
Spec ad, not affiliated with Meta. Logo from Meta's official Facebook Brand Asset Pack (unmodified).

## Concept
Feed rush, hard freeze, then 6 hyper-specific interests, each in its own visual world,
collapsing into a Facebook-blue field: "Your weird has a group." End: logo + "Find yours."

## Design system
- Facebook blue #0866FF (sampled from official logo file), ink #0B0C10, bone #F4F1EA
- Guest worlds: flour #EDE5D6 + crust #8A5A2B (sourdough), night #0C1020 + lamp #FFC46B (chess)
- Display: Bricolage Grotesque 800, wdth 75, opsz 96, tracking -0.012em (tighter causes glyph overlap seams)
- Accent voice: Instrument Serif Italic. Text/labels: Instrument Sans 500
- Grid: 1080x1350 (4:5), 84px margins. Persistent label "There's a group for" top-left
- Curves: in cubic-bezier(0.16,1,0.3,1) · out (0.64,0,0.78,0) · camera (0.65,0,0.35,1)
- Finish: grain overlay ~22% (overlay blend), soft vignette

## Feedback log
- User: wants beautiful, real motion graphics, "not slop". Language: English (default chosen).

## Versions
- Style frames v01: frames/styleframe_01-03.png
- User (round 2): "more visuals, not only text, like a phone texting your friends, be more creative".
  -> Each world now has 3 depth layers: big type (back), tilted phone with an ORIGINAL stylised
     chat UI (mid, not Facebook's real UI), floating bubble lifted out of the screen (front).
  -> Rule: "you" is always Facebook blue. Friends are warm neutrals / world colours.
- Style frames v02: frames/sf2_01-03.png (styleframes_v2.html)
- User approved v2 look ("it looks better now").

## Film (15s, 4:5 1080x1350, 30fps)
Engine: HTML + GSAP 3.12.5 timeline (comp.html), seeked per frame in Playwright (render.js),
rendered at 120fps and blended 4 subframes -> 30fps (180°-style motion blur). Sound: audio.py,
fully synthesized (no samples/licences), 120 BPM grid from 2.0s, two-pass loudnorm to -14 LUFS.

| t (s) | scene | transition out |
|---|---|---|
| 0-1.5 | abstract feed rush, decelerates, lands on "Starter Club" card | freeze + hit, punch |
| 1.58-1.95 | card scales through to fill frame | scale-through / colour field |
| 1.95-5.0 | SOURDOUGH: type rises, phone arcs in, chat pops, your blue reply lifts out | whip pan (camera continuation) |
| 5.0-6.5 | VINTAGE VESPAS: speed lines, Rosa + your reply | hard cut on beat |
| 6.5-7.5 | BIRDS AT 5AM: sun rises behind horizon | hard cut on beat |
| 7.5-10.5 | 3AM CHESS: lock screen notifications, buzz, your move lights a square | hard cut on beat |
| 10.5-11.0 | TINY TERRARIUMS: letters grow | hard cut |
| 11.0-11.5 | BAD KARAOKE: lyric wipe, your "duet?" | your blue bubble floods frame |
| 11.5-15 | Blue: bubbles gather, "Your weird has a group.", logo, Find yours., spec label | hold |

## Versions
- v01: first full render (2-subframe blur showed ghosting)
- v02: 4-subframe blur at 120fps, punch on the freeze
- v03: blur on the fast colour-field expansions; capped bitrate 12M (24MB). DELIVERED.
