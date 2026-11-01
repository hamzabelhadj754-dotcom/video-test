import { Episode } from "../episode";

// GAINS DOM RULES · 01: "Your ego is killing your gains". The first part of a
// numbered educational series built for saves and follows: one rule, one fix,
// "Follow for Rule 02". Cut to "Never Satisfied" (free Coverr track,
// public/music/never-satisfied-006.m4a = 56.0–73.0 s of the song): exactly
// 120 BPM, beats on whole and half seconds; 56.0 s is the big re-entry hit
// after the break, so beat 0 is a downbeat on frame 0. 32 beats = 8 bars = 16 s,
// a seamless loop. Clips 72–81 are new (Pinterest, at the owner's request);
// sources in clips/credits.json.
const TEMPO = { bpm: 120 };
const BEATS = 32;

const SQUAT_BW = { clip: "72-squat-rack-bw", backdrop: "spotlight" } as const;
const SQUAT = { clip: "73-squat-rack-color", backdrop: "spotlight" } as const;
const PLATE = { clip: "74-plate-floor", backdrop: "dust" } as const;
const INCLINE = { clip: "75-incline-press", backdrop: "spotlight" } as const;
const RACK = { clip: "76-dumbbell-rack", backdrop: "speed" } as const;
const BENCH = { clip: "78-bench-dark", backdrop: "spotlight" } as const;
const DOOR = { clip: "79-gym-door-night", backdrop: "smoke" } as const;
const TEAL = { clip: "80-teal-gym-walk", backdrop: "smoke" } as const;
const DB_ROW = { clip: "81-dumbbell-row", backdrop: "speed" } as const;

// The hook shot starts this far in; the loop shot ends exactly here.
const HOOK_IN = 3;
const LOOP_SECONDS = (BEATS - 30) * (60 / TEMPO.bpm);

export const episode006: Episode = {
  id: "GainsDom006",
  number: 6,
  series: "GAINS DOM RULES",
  ...TEMPO,
  offsetSeconds: 0,
  lengthBeats: BEATS,
  durationSeconds: BEATS * (60 / TEMPO.bpm),
  audio: "music/never-satisfied-006.m4a",
  accents: [4, 8, 12, 16, 20, 24, 28],
  streaks: true,
  burns: [12, 24],
  progress: true,
  cuts: [
    // Hook: a heavy squat in a bright black-and-white rack. Cut at 1.5 s.
    { ...SQUAT_BW, from: 0, length: 3, trimSeconds: HOOK_IN, push: [1.04, 1.1] },
    { ...PLATE, from: 3, length: 1, trimSeconds: 0.5, entry: "zoom" },
    // Too heavy. Half reps. Swinging.
    { ...DB_ROW, from: 4, length: 1, trimSeconds: 2, entry: "zoom" },
    { ...BENCH, from: 5, length: 1, trimSeconds: 0.5, entry: "zoom" },
    { ...DB_ROW, from: 6, length: 2, trimSeconds: 6, push: [1.0, 1.08] },
    // "Your muscles feel none of it."
    {
      ...TEAL,
      from: 8,
      length: 2,
      trimSeconds: 0.3,
      entry: "inset",
      insetBeats: 1,
      push: [1.0, 1.06],
    },
    {
      ...BENCH,
      from: 10,
      length: 2,
      trimSeconds: 2.4,
      rate: 0.8,
      entry: "dissolve",
    },
    // "Drop the weight 20%."
    { ...RACK, from: 12, length: 2, trimSeconds: 0.3, entry: "light" },
    { ...RACK, from: 14, length: 2, trimSeconds: 3, push: [1.0, 1.1] },
    // "Full range. Slow on the way down."
    {
      ...INCLINE,
      from: 16,
      length: 2,
      trimSeconds: 0.5,
      entry: "zoom",
      push: [1.0, 1.06],
    },
    {
      ...SQUAT,
      from: 18,
      length: 2,
      trimSeconds: 8,
      rate: 0.8,
      entry: "dissolve",
    },
    // "Lighter weight. Bigger muscles."
    { ...SQUAT, from: 20, length: 2, trimSeconds: 12, push: [1.0, 1.08] },
    {
      ...INCLINE,
      from: 22,
      length: 1,
      panels: [
        { clip: INCLINE.clip, trimSeconds: 3 },
        { clip: DB_ROW.clip, trimSeconds: 8 },
        { clip: SQUAT_BW.clip, trimSeconds: 6 },
      ],
    },
    { ...PLATE, from: 23, length: 1, trimSeconds: 2.5, entry: "zoom" },
    // "RULE 01 · Leave your ego at the door." The gym door at night.
    {
      ...DOOR,
      from: 24,
      length: 4,
      trimSeconds: 0.2,
      entry: "light",
      push: [1.0, 1.12],
    },
    { ...TEAL, from: 28, length: 2, trimSeconds: 4, entry: "dissolve" },
    // Loop point: the hook shot, ending where frame 0 begins.
    {
      ...SQUAT_BW,
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
        { text: "Your ego is", at: 0 },
        { text: "killing your gains.", at: 0, hero: true },
      ],
    },
    {
      from: 4,
      length: 4,
      lines: [
        { text: "Too heavy.", at: 0 },
        { text: "Half reps.", at: 1 },
        { text: "Swinging.", at: 2, hero: true },
      ],
    },
    {
      from: 8,
      length: 4,
      lines: [
        { text: "Your muscles", at: 0 },
        { text: "feel none of it.", at: 1, hero: true },
      ],
    },
    {
      from: 12,
      length: 4,
      numeral: "20%",
      lines: [
        { text: "Drop the weight 20%.", at: 0 },
        { text: "Feel the muscle.", at: 1, hero: true },
      ],
    },
    {
      from: 16,
      length: 4,
      lines: [
        { text: "Full range.", at: 0 },
        { text: "Slow on the way down.", at: 1, hero: true },
      ],
    },
    {
      from: 20,
      length: 4,
      lines: [
        { text: "Lighter weight.", at: 0 },
        { text: "Bigger muscles.", at: 1, hero: true },
      ],
    },
    {
      from: 24,
      length: 4,
      lines: [
        { text: "RULE 01", at: 0, style: "power" },
        { text: "Leave your ego at the door.", at: 1.5, style: "read" },
      ],
    },
    {
      from: 28,
      length: 2,
      lines: [
        { text: "Follow for", at: 0 },
        { text: "Rule 02.", at: 0.5, hero: true },
      ],
    },
    {
      // Loop point: lands exactly like frame 0.
      from: 30,
      length: 2,
      hold: true,
      lines: [
        { text: "Your ego is", at: 0.25 },
        { text: "killing your gains.", at: 0.5, hero: true },
      ],
    },
  ],
};
