# Same Muscle: educational fitness reel

## Concept
Hook: "LIGHT = HEAVY. Same muscle growth. One condition." The condition: train close to failure.
Evidence: Schoenfeld et al. 2017 meta-analysis (hypertrophy similar across loads from ~30% 1RM when sets
are taken to or near failure; strength gains favor heavy loads). The caveat stays in the film.
"5 kg vs 50 kg" rejected: below ~30% of max the finding does not hold, so it would mislead.

## Format
9:16, 1080x1920, 30fps, 20s. Safe area: left 96, right 930, top 250, bottom 1520.

## Direction change (user: v00 looked unprofessional and normal)
New direction "Recruitment": the hero is a 3D muscle (1,150 instanced fibers, three.js via @remotion/three,
rendered with --gl=swangle). Effort is shown as heat: fibers recruited by the size principle glow ember -> orange
-> white-hot near failure, and push forward like pin-art. Volt green dropped (looked cheap at scale).
On-screen claim simplified on purpose: "last reps: nearly all of them" (size principle near failure).

## Design system (v00, superseded)
- Black #0A0A0A, white #F2F2EE with 58/35/12/6% steps, one accent: volt #D4FF3A (placeholder until brand color),
  used ONLY for the reps that do the work.
- Type: Archivo variable (wght 100-900, wdth 62-125); load is expressed by weight+width (light = thin+narrow,
  heavy = black+wide). JetBrains Mono for labels and numbers.
- Grain 14%, vignette.

## Storyboard (20s)
0-2.5 hook · 2.5-4 "One condition" · 4-10 meter (rep stack fills, counter drains to 0) ·
10-15 compare (30/60/80%, same last reps) · 15-17.5 caveat "Strength? Heavy still wins." · 17.5-20 rule + brand.

## Log
- v00: style frames (hook, meter, compare).

- v01: 3D style frames (hook, light set early, light set at failure). Palette: black, warm white #F4F1EC, ember #FF3D14, hot #FFD9B0.
- v02 (delivered `renders/same-muscle_v02.mp4`): full film, review quality (no sub-frame motion blur).
