# Invoza — 45s launch video

Remotion project for a 1920×1080 / 30fps launch film for the fictional SaaS **Invoza**
("Get paid without chasing").

## Structure
- `src/timeline.json` — single source of truth: scene boundaries, voiceover cues/subtitles,
  typing schedule and every SFX/animation event frame. Both the picture and the audio script read it.
- `src/scenes/` — `Problem.tsx` (hook + pain), `Turn.tsx` (logo reveal), `Features.tsx`
  (invoice builder, auto-reminders, dashboard), `Ending.tsx` (payoff + CTA).
- `src/Phone.tsx` — unbranded smartphone mock (screens designed on a 406px canonical width).
- `src/Overlays.tsx` — background light, vignette, film grain, subtitles.
- `scripts/generate_voiceover.py` — voiceover via Kokoro-82M (open-weights TTS, voice `af_heart`).
- `scripts/make_audio.py` — original synthesized score + UI sound design + VO mix with ducking,
  loudness-normalised to −15 LUFS → `public/audio/mix.wav`.
- `scripts/make_grain.py` — film-grain frames.

## Render
```bash
npm install
python3 scripts/make_audio.py          # needs numpy, scipy, soundfile, ffmpeg
npx remotion render Invoza out/invoza-launch.mp4 --crf=16
```
Preview with `npm run dev`. Font: Manrope (SIL OFL), bundled in `public/fonts`.
