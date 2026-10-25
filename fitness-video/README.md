# Gains Dom: dark loop edits

Faceless, black & white, 15 s motivational loops (1080×1920, 30 fps, silent).
Add the song in-app on TikTok/Reels/Shorts.

## Daily workflow
1. **Clips**: drop stock b-roll in `clips/` (any subfolder). The file name is the slot name, e.g. `clips/01-dark-gym.mp4`.
   - Or run `npm run fetch-clips`, which needs network access to Mixkit, or Pexels with `PEXELS_API_KEY` set.
   - Use only Pexels, Pixabay or Mixkit footage: free for commercial use and safe to monetize.
   - Faceless shots only: silhouettes, backs, hands.
2. `npm run prep-clips` crops to 9:16, grades to monochrome and writes `src/clips.json`.
   - Any slot without a clip renders a procedural dark backdrop instead.
3. **New episode**: copy `src/episodes/001-dark-truth.ts` to `002-….ts`, then change `id`, `number`, the text and the clip names. Add it to `src/episodes/index.ts`.
4. **Preview**: `npm run dev`.
   **Render**: `npx remotion render GainsDom002 ../gains-dom-002.mp4 --crf=18 --concurrency=1`.

## Episode format
Everything is in beats, so set `bpm` to your song's tempo and the cuts land on the beat.
- `cuts`: `{ clip, backdrop, from, length, trimSeconds?, push? }`
- `cards`: `{ from, length, lines: [{ text, at, style }] }`
  - `style`: `solid` (white), `inverted` (black on white block) or `outline`.
  - `instant` makes the first card visible on frame 0 (the hook).
  - `hold` keeps the last card on screen to the end (the loop point).

### The loop
- The first cut uses `trimSeconds: 1`.
- The last cut replays the same clip from `trimSeconds: 0`.
- So the final frame flows straight into frame 0 and the video loops seamlessly.
