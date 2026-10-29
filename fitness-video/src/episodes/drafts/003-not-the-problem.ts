import { Episode } from "../../episode";

// Educational: "Your workout isn't the problem" — three fixes for slow gains.
// Cut to "The Battle of Sports" (free Coverr track, public/music/
// battle-of-sports-003.m4a, 1.00–16.03 s of the song): ~143.8 BPM, a heavy
// hit on every bar from the first frame. Nine bars: hook, three numbered
// points of two bars each, the payoff, and the loop back to the hook.
// Protein figure: Morton et al. 2018 (BJSM) meta-analysis, gains plateau
// around 1.6 g/kg/day.
const TEMPO = { bpm: 143.76 };
const OFFSET = 0;
const BEATS = 36;

const TIRE = { clip: "34-tire", backdrop: "spotlight" } as const;
const ROPES_MOODY = { clip: "29-ropes-moody", backdrop: "speed" } as const;
const DUMBBELL = { clip: "28-dumbbell", backdrop: "speed" } as const;
const VEINS = { clip: "03-dumbbell", backdrop: "dust" } as const;
const ROPES = { clip: "27-ropes", backdrop: "speed" } as const;
const CHALK = { clip: "24-chalk", backdrop: "dust" } as const;
const PHONE = { clip: "31-phone-bed", backdrop: "void" } as const;
const GYM = { clip: "23-dark-gym", backdrop: "spotlight" } as const;
const EGGS = { clip: "32-eggs", backdrop: "dust" } as const;
const STEAK = { clip: "33-steak", backdrop: "dust" } as const;
const BOXING = { clip: "05-boxing", backdrop: "speed" } as const;
const RUN = { clip: "06-rain-run", backdrop: "rain" } as const;
const HERO = { clip: "08-silhouette", backdrop: "smoke" } as const;

// The hook shot starts this far in; the loop shot ends exactly here.
const HOOK_IN = 9;
const LOOP_SECONDS = 15.03 - (OFFSET + 32 * (60 / TEMPO.bpm));

export const episode003: Episode = {
  id: "GainsDom003",
  number: 3,
  series: "THE FIX",
  ...TEMPO,
  offsetSeconds: OFFSET,
  lengthBeats: BEATS,
  durationSeconds: 15.03,
  audio: "music/battle-of-sports-003.m4a",
  accents: [4, 8, 12, 16, 20, 24, 28],
  streaks: true,
  burns: [12, 20, 28],
  cuts: [
    // Hook: chalked hands clapping (bright, moving), then a fast cut by 0.9 s.
    { ...CHALK, from: 0, length: 2, trimSeconds: HOOK_IN, push: [1.04, 1.1] },
    { ...ROPES_MOODY, from: 2, length: 2, trimSeconds: 10, entry: "zoom" },
    // 1. Progressive overload.
    { ...DUMBBELL, from: 4, length: 2, trimSeconds: 7, entry: "zoom" },
    { ...VEINS, from: 6, length: 2, trimSeconds: 8 },
    { ...ROPES, from: 8, length: 2, trimSeconds: 12, entry: "zoom" },
    { ...TIRE, from: 10, length: 2, trimSeconds: 6 },
    // 2. Sleep: scrolling in bed as a small lonely window, then the dark gym.
    {
      ...PHONE,
      from: 12,
      length: 4,
      trimSeconds: 2,
      entry: "inset",
      insetBeats: 2.5,
      push: [1.0, 1.06],
    },
    { ...GYM, from: 16, length: 4, trimSeconds: 1, rate: 0.8, entry: "zoom" },
    // 3. Protein.
    { ...EGGS, from: 20, length: 2, trimSeconds: 7, entry: "zoom" },
    { ...STEAK, from: 22, length: 2, trimSeconds: 5, entry: "zoom" },
    {
      ...EGGS,
      from: 24,
      length: 2,
      panels: [
        { clip: EGGS.clip, trimSeconds: 9 },
        { clip: STEAK.clip, trimSeconds: 7 },
        { clip: DUMBBELL.clip, trimSeconds: 8 },
      ],
    },
    { ...BOXING, from: 26, length: 2, trimSeconds: 9, entry: "zoom" },
    // Payoff.
    { ...RUN, from: 28, length: 2, trimSeconds: 5.5, entry: "zoom" },
    { ...HERO, from: 30, length: 2, push: [1.0, 1.08] },
    // Loop point: the hook shot, ending where frame 0 begins.
    {
      ...CHALK,
      from: 32,
      length: 4,
      trimSeconds: HOOK_IN - LOOP_SECONDS,
      push: [1.0, 1.04],
    },
  ],
  cards: [
    {
      from: 0,
      length: 4,
      instant: true,
      lines: [
        { text: "Your workout", at: 0 },
        { text: "isn't the problem.", at: 0, hero: true },
      ],
    },
    {
      from: 4,
      length: 8,
      numeral: "1",
      lines: [
        { text: "Same weight every week?", at: 0 },
        { text: "Add a rep.", at: 4, hero: true },
      ],
    },
    {
      from: 12,
      length: 8,
      numeral: "2",
      lines: [
        { text: "Five hours of sleep?", at: 0 },
        { text: "Recover harder.", at: 4, hero: true },
      ],
    },
    {
      from: 20,
      length: 8,
      numeral: "3",
      lines: [
        { text: "Guessing your protein?", at: 0 },
        { text: "1.6 g per kg.", at: 4, hero: true },
      ],
    },
    {
      from: 28,
      length: 4,
      lines: [
        { text: "Fix all three.", at: 0 },
        { text: "Then grow.", at: 2, hero: true },
      ],
    },
    {
      // Loop point: lands exactly like frame 0.
      from: 32,
      length: 4,
      hold: true,
      lines: [
        { text: "Your workout", at: 0.5 },
        { text: "isn't the problem.", at: 1, hero: true },
      ],
    },
  ],
};
