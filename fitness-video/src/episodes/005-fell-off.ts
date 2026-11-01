import { Episode } from "../episode";

// "You fell off": the comeback. Cut to "The Final Scene" (free Coverr track,
// public/music/the-final-scene-005.m4a = 33.95–49.15 s of the song). Beats sit
// at 34.455 s + k × 0.5094 s; the drop's pickup lands a 16th before one, so the
// cut starts one beat earlier: a hit on frame 0 and the drop slams under the
// hook. ~117.8 BPM; 28 beats = 7 bars, a seamless loop.
// Clips 59–71 are new (Pinterest, at the owner's request); sources in
// clips/credits.json.
// Look: punchy zoom-through cuts, an inset that opens on the beat, a triptych
// before the power word, a white-glow cut into the "Day one" numeral.
const TEMPO = { bpm: 117.79 };
const BEATS = 28;

const FALL = { clip: "59-falling-sky", backdrop: "smoke" } as const;
const CURB = { clip: "60-curb-rain", backdrop: "rain" } as const;
const LAKE = { clip: "61-lake-sitdown", backdrop: "smoke" } as const;
const HOOD_SIT = { clip: "62-gym-hood-sit", backdrop: "spotlight" } as const;
const RAIN_HOOD = { clip: "63-rain-hood", backdrop: "rain" } as const;
const WALK = { clip: "64-night-walk", backdrop: "smoke" } as const;
const ROAD = { clip: "65-night-road", backdrop: "spotlight" } as const;
const DEADLIFT = { clip: "66-deadlift-hood", backdrop: "spotlight" } as const;
const PLATE = { clip: "67-plate-smoke", backdrop: "dust" } as const;
const ROW = { clip: "68-barbell-row", backdrop: "speed" } as const;
const RACK = { clip: "69-hood-rack", backdrop: "spotlight" } as const;
const LIGHTNING = { clip: "70-lightning-arms", backdrop: "smoke" } as const;
const ARMS = { clip: "71-arms-raised", backdrop: "smoke" } as const;

// The hook shot starts this far in; the loop shot ends exactly here.
const HOOK_IN = 6;
const LOOP_SECONDS = (BEATS - 26) * (60 / TEMPO.bpm);

export const episode005: Episode = {
  id: "GainsDom005",
  number: 5,
  series: "THE COMEBACK",
  ...TEMPO,
  offsetSeconds: 0,
  lengthBeats: BEATS,
  durationSeconds: BEATS * (60 / TEMPO.bpm),
  audio: "music/the-final-scene-005.m4a",
  accents: [4, 8, 12, 16, 20, 24],
  streaks: true,
  burns: [12, 20],
  cuts: [
    // Hook: a man falling through bright cloud. Cut by 1.5 s.
    { ...FALL, from: 0, length: 3, trimSeconds: HOOK_IN, push: [1.04, 1.1] },
    { ...CURB, from: 3, length: 1, trimSeconds: 4, push: [1.0, 1.05] },
    // "Missed a week": he sits down by the water, a small window that opens.
    {
      ...LAKE,
      from: 4,
      length: 2,
      trimSeconds: 0.2,
      entry: "inset",
      insetBeats: 1,
      push: [1.0, 1.06],
    },
    { ...RAIN_HOOD, from: 6, length: 2, trimSeconds: 2, entry: "zoom" },
    {
      ...HOOD_SIT,
      from: 8,
      length: 2,
      trimSeconds: 0.2,
      rate: 0.8,
      entry: "zoom",
      push: [1.0, 1.08],
    },
    // "Few come back": he starts walking.
    { ...WALK, from: 10, length: 2, trimSeconds: 1, entry: "dissolve" },
    {
      ...ROAD,
      from: 12,
      length: 2,
      trimSeconds: 3,
      entry: "zoom",
      push: [1.0, 1.12],
    },
    { ...RACK, from: 14, length: 1, trimSeconds: 1, entry: "zoom" },
    {
      ...ROW,
      from: 15,
      length: 1,
      panels: [
        { clip: ROW.clip, trimSeconds: 1 },
        { clip: DEADLIFT.clip, trimSeconds: 4 },
        { clip: RACK.clip, trimSeconds: 3 },
      ],
    },
    // "GET UP.": the lockout, standing up with the weight.
    {
      ...DEADLIFT,
      from: 16,
      length: 2,
      trimSeconds: 0,
      rate: 1.1,
      entry: "zoom",
      push: [1.0, 1.06],
    },
    { ...ROW, from: 18, length: 1, trimSeconds: 2, entry: "zoom" },
    {
      ...RACK,
      from: 19,
      length: 1,
      panels: [
        { clip: LIGHTNING.clip, trimSeconds: 0.5 },
        { clip: RACK.clip, trimSeconds: 5 },
        { clip: DEADLIFT.clip, trimSeconds: 7 },
      ],
    },
    // "Day one. Again." through a white glow.
    {
      ...PLATE,
      from: 20,
      length: 2,
      trimSeconds: 0.2,
      entry: "light",
      push: [1.0, 1.15],
    },
    {
      ...LIGHTNING,
      from: 22,
      length: 2,
      trimSeconds: 0.4,
      entry: "zoom",
      push: [1.0, 1.06],
    },
    // Arms up.
    {
      ...ARMS,
      from: 24,
      length: 2,
      trimSeconds: 9.4,
      entry: "dissolve",
      push: [1.0, 1.06],
    },
    // Loop point: the hook shot, ending where frame 0 begins.
    {
      ...FALL,
      from: 26,
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
        { text: "You fell", at: 0 },
        { text: "off.", at: 0, hero: true },
      ],
    },
    {
      from: 4,
      length: 4,
      lines: [
        { text: "Missed a week.", at: 0 },
        { text: "Then a month.", at: 1.5, hero: true },
      ],
    },
    {
      from: 8,
      length: 4,
      lines: [
        { text: "Everyone falls off.", at: 0 },
        { text: "*Few* come back.", at: 1.5, hero: true },
      ],
    },
    {
      from: 12,
      length: 4,
      lines: [
        { text: "Don't wait", at: 0 },
        { text: "for Monday.", at: 0.75, hero: true },
      ],
    },
    {
      from: 16,
      length: 4,
      lines: [{ text: "GET UP.", at: 0, style: "power" }],
    },
    {
      from: 20,
      length: 4,
      numeral: "01",
      lines: [
        { text: "Day one.", at: 0 },
        { text: "Again.", at: 1, hero: true },
      ],
    },
    {
      from: 24,
      length: 2,
      lines: [
        { text: "Then come back", at: 0 },
        { text: "harder.", at: 0.5, hero: true },
      ],
    },
    {
      // Loop point: lands exactly like frame 0.
      from: 26,
      length: 2,
      hold: true,
      lines: [
        { text: "You fell", at: 0.25 },
        { text: "off.", at: 0.5, hero: true },
      ],
    },
  ],
};
