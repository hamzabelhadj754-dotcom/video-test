import { Episode } from "../episode";

// "Lock in": the hours nobody sees. Cut to "War of the Future" (free Coverr
// track, public/music/war-of-the-future-002.m4a, 44.07–60.02 s of the song):
// ~120.4 BPM, a quiet tense build for two bars, then the drop on beat 8 with a
// hit on every bar after. Clips 21–30 are free Coverr footage, see
// clips/credits.json.
// Editorial style: kicker + hero titles, zoom-through cuts, inset frames that
// open on the beat, triptych split-screens on the drum rolls.
const TEMPO = { bpm: 120.43 };
const OFFSET = 0;
const BEATS = 32;

const SHOES = { clip: "21-shoes", backdrop: "dust" } as const;
const GYM = { clip: "23-dark-gym", backdrop: "spotlight" } as const;
const CHALK = { clip: "24-chalk", backdrop: "dust" } as const;
const ROPES = { clip: "27-ropes", backdrop: "speed" } as const;
const DUMBBELL = { clip: "28-dumbbell", backdrop: "speed" } as const;
const ROPES_MOODY = { clip: "29-ropes-moody", backdrop: "speed" } as const;
const TUNNEL = { clip: "30-tunnel", backdrop: "smoke" } as const;
const RUN = { clip: "06-rain-run", backdrop: "rain" } as const;
const BOXING = { clip: "05-boxing", backdrop: "speed" } as const;
const HERO = { clip: "08-silhouette", backdrop: "smoke" } as const;

// The hook shot starts this far in; the loop shot ends exactly here.
const HOOK_IN = 9;
const LOOP_SECONDS = (BEATS - 30) * (60 / TEMPO.bpm);

export const episode002: Episode = {
  id: "GainsDom002",
  number: 2,
  series: "DARK TRUTH",
  ...TEMPO,
  offsetSeconds: OFFSET,
  lengthBeats: BEATS,
  durationSeconds: BEATS * (60 / TEMPO.bpm),
  audio: "music/war-of-the-future-002.m4a",
  accents: [8, 12, 16, 20, 24, 28],
  streaks: true,
  burns: [8, 16, 28],
  clock: [
    { at: 0, label: "4:58 a.m." },
    { at: 4, label: "4:59 a.m." },
    { at: 8, label: "5:00 a.m." },
    { at: 16, label: "5:14 a.m." },
    { at: 20, label: "5:31 a.m." },
    { at: 28, label: "5:47 a.m." },
    { at: 30, label: "4:58 a.m." },
  ],
  cuts: [
    // Hook: lone silhouette at the end of a tunnel.
    { ...TUNNEL, from: 0, length: 4, trimSeconds: HOOK_IN, push: [1.04, 1.1] },
    { ...SHOES, from: 4, length: 2, trimSeconds: 12 },
    { ...RUN, from: 6, length: 2, trimSeconds: 3.5 },
    // The drop: alone on the road, full frame.
    {
      ...RUN,
      from: 8,
      length: 4,
      trimSeconds: 5.5,
      entry: "zoom",
      push: [1.0, 1.1],
    },
    {
      ...BOXING,
      from: 12,
      length: 1,
      panels: [
        { clip: DUMBBELL.clip, trimSeconds: 7 },
        { clip: ROPES.clip, trimSeconds: 12 },
        { clip: BOXING.clip, trimSeconds: 9 },
      ],
    },
    {
      ...GYM,
      from: 13,
      length: 3,
      trimSeconds: 0.5,
      rate: 0.8,
      entry: "inset",
      insetBeats: 1.2,
      push: [1.0, 1.06],
    },
    { ...CHALK, from: 16, length: 2, trimSeconds: 9, entry: "zoom" },
    { ...ROPES, from: 18, length: 2, trimSeconds: 12, entry: "zoom" },
    {
      ...ROPES_MOODY,
      from: 20,
      length: 4,
      trimSeconds: 0.5,
      rate: 0.8,
      push: [1.0, 1.15],
    },
    // Beat montage, footage only.
    { ...BOXING, from: 24, length: 1, trimSeconds: 2, entry: "zoom" },
    { ...DUMBBELL, from: 25, length: 1, trimSeconds: 7.5, entry: "zoom" },
    { ...SHOES, from: 26, length: 0.25, trimSeconds: 13.5 },
    {
      ...ROPES_MOODY,
      from: 26.25,
      length: 0.75,
      panels: [
        { clip: ROPES_MOODY.clip, trimSeconds: 11 },
        { clip: RUN.clip, trimSeconds: 4 },
        { clip: CHALK.clip, trimSeconds: 10 },
      ],
    },
    { ...GYM, from: 27, length: 1, trimSeconds: 3, entry: "zoom" },
    { ...HERO, from: 28, length: 2, push: [1.0, 1.1], entry: "zoom" },
    // Loop point: the hook shot, ending where frame 0 begins.
    {
      ...TUNNEL,
      from: 30,
      length: 2,
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
        { text: "Everyone wants", at: 0 },
        { text: "the result.", at: 0, hero: true },
      ],
    },
    {
      from: 4,
      length: 4,
      lines: [
        { text: "Nobody wants", at: 0 },
        { text: "the 5 a.m.", at: 0.5, hero: true },
      ],
    },
    {
      from: 8,
      length: 8,
      lines: [
        { text: "No crowd.", at: 0 },
        { text: "No applause.", at: 5, hero: true },
      ],
    },
    {
      from: 16,
      length: 4,
      lines: [
        { text: "Just the", at: 0 },
        { text: "work.", at: 0.5, hero: true },
      ],
    },
    {
      from: 20,
      length: 4,
      lines: [
        { text: "Discipline is", at: 0 },
        { text: "quiet.", at: 1, hero: true },
      ],
    },
    {
      from: 28,
      length: 2,
      lines: [
        { text: "Lock", at: 0 },
        { text: "in.", at: 0.25, hero: true },
      ],
    },
    {
      // Loop point: lands exactly like frame 0.
      from: 30,
      length: 2,
      hold: true,
      lines: [
        { text: "Everyone wants", at: 0.25 },
        { text: "the result.", at: 0.5, hero: true },
      ],
    },
  ],
};
