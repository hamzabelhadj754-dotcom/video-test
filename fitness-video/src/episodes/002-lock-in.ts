import { Episode, strobe } from "../episode";

// "Lock in": the hours nobody sees. Same song and beat map as #001
// (~130 BPM, bass hits every 4th beat, drum rolls at beats 12–13 and
// 26.3–26.7). Clips 21–30 are free Coverr footage, see clips/credits.json.
const TEMPO = { bpm: 130.1 };

const HERO = { clip: "08-silhouette", backdrop: "smoke" } as const;
const SHOES = { clip: "21-shoes", backdrop: "dust" } as const;
const STAIRS = { clip: "22-stairs", backdrop: "smoke" } as const;
const GYM = { clip: "23-dark-gym", backdrop: "spotlight" } as const;
const CHALK = { clip: "24-chalk", backdrop: "dust" } as const;
const KETTLEBELL = { clip: "25-kettlebell", backdrop: "speed" } as const;
const BAG = { clip: "26-bag-sway", backdrop: "spotlight" } as const;
const ROPES = { clip: "27-ropes", backdrop: "speed" } as const;
const DUMBBELL = { clip: "28-dumbbell", backdrop: "speed" } as const;
const ROPES_MOODY = { clip: "29-ropes-moody", backdrop: "speed" } as const;
const TUNNEL = { clip: "30-tunnel", backdrop: "smoke" } as const;
const RUN = { clip: "06-rain-run", backdrop: "rain" } as const;
const BOXING = { clip: "05-boxing", backdrop: "speed" } as const;

// The hook shot starts this far in; the loop shot ends exactly here.
const HOOK_IN = 9;
const LOOP_SECONDS = 15 - (-0.055 + 30 * (60 / TEMPO.bpm));

export const episode002: Episode = {
  id: "GainsDom002",
  number: 2,
  series: "DARK TRUTH",
  ...TEMPO,
  offsetSeconds: -0.055,
  lengthBeats: 32.65,
  durationSeconds: 15,
  audio: "music/song-001.m4a",
  accents: [8, 13, 18, 24, 28],
  cuts: [
    { ...TUNNEL, from: 0, length: 4, trimSeconds: HOOK_IN, push: [1.04, 1.12] },
    { ...SHOES, from: 4, length: 2, trimSeconds: 12 },
    { ...RUN, from: 6, length: 2, trimSeconds: 3.5 },
    { ...STAIRS, from: 8, length: 4, trimSeconds: 2 },
    ...strobe(
      TEMPO,
      [
        { ...DUMBBELL, trimSeconds: 7 },
        { ...ROPES, trimSeconds: 12 },
        { ...BAG, trimSeconds: 5 },
        { ...BOXING, trimSeconds: 9 },
      ],
      12,
      13,
    ),
    { ...GYM, from: 13, length: 3, trimSeconds: 0.5, rate: 0.8 },
    { ...CHALK, from: 16, length: 2, trimSeconds: 9 },
    { ...ROPES, from: 18, length: 2, trimSeconds: 12 },
    {
      ...ROPES_MOODY,
      from: 20,
      length: 4,
      trimSeconds: 0.5,
      rate: 0.8,
      push: [1.0, 1.15],
    },
    // Beat montage, footage only.
    { ...STAIRS, from: 24, length: 1, trimSeconds: 9 },
    { ...DUMBBELL, from: 25, length: 1, trimSeconds: 7.5 },
    { ...BOXING, from: 26, length: 0.25, trimSeconds: 2 },
    ...strobe(
      TEMPO,
      [
        { ...ROPES_MOODY, trimSeconds: 11 },
        { ...KETTLEBELL, trimSeconds: 4 },
        { ...ROPES, trimSeconds: 13 },
        { ...BOXING, trimSeconds: 9 },
      ],
      26.25,
      26.75,
    ),
    { ...RUN, from: 26.75, length: 1.25, trimSeconds: 4.5 },
    { ...HERO, from: 28, length: 2, push: [1.0, 1.1] },
    // Loop point: the hook shot, ending where frame 0 begins.
    {
      ...TUNNEL,
      from: 30,
      length: 2.65,
      trimSeconds: HOOK_IN - LOOP_SECONDS,
      push: [1.0, 1.04],
    },
  ],
  cards: [
    {
      from: 0,
      length: 8,
      instant: true,
      lines: [
        { text: "Everyone wants the result.", at: 0 },
        { text: "Nobody wants the *5 a.m.*", at: 4 },
      ],
    },
    {
      from: 8,
      length: 8,
      lines: [
        { text: "No crowd.", at: 0 },
        { text: "No *applause.*", at: 5 },
      ],
    },
    {
      from: 16,
      length: 4,
      lines: [{ text: "Just the *work.*", at: 0 }],
    },
    {
      from: 20,
      length: 4,
      lines: [{ text: "Discipline is *quiet.*", at: 0 }],
    },
    {
      from: 28,
      length: 2,
      lines: [{ text: "Lock *in.*", at: 0 }],
    },
    {
      // Loop point: lands exactly like frame 0. The second line never shows
      // (it starts after the card ends) but keeps the layout identical.
      from: 30,
      length: 2.65,
      hold: true,
      lines: [
        { text: "Everyone wants the result.", at: 0.3 },
        { text: "Nobody wants the *5 a.m.*", at: 4 },
      ],
    },
  ],
};
