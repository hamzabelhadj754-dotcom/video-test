import { Episode } from "../episode";

// Speech edit: David Goggins, "Believe in yourself". The video is silent; the
// owner adds the same Goggins sound in TikTok starting at 0:00. Timing is in
// seconds (bpm 60 → 1 beat = 1 s) from a word-level transcript of the owner's
// screen recording, so every word appears as he says it (`words` offsets are
// relative to each line's `at`). All footage is new: Pinterest clips 40–58,
// sources in clips/credits.json.
const ROAD = { clip: "40-road-sun", backdrop: "spotlight" } as const;
const LAMP_PATH = { clip: "41-lamp-path", backdrop: "rain" } as const;
const HILL = { clip: "42-hill-teal", backdrop: "smoke" } as const;
const WINDOW = { clip: "43-window-pullup", backdrop: "spotlight" } as const;
const PUSHUP = { clip: "44-rain-pushup", backdrop: "rain" } as const;
const ROPE = { clip: "45-rain-rope", backdrop: "rain" } as const;
const SUNSET_BOX = { clip: "46-sunset-shadowbox", backdrop: "smoke" } as const;
const HOOD = { clip: "47-hood-boxer", backdrop: "spotlight" } as const;
const HIKER = { clip: "48-hiker-climb", backdrop: "smoke" } as const;
const RUNNER = { clip: "49-golden-runner", backdrop: "spotlight" } as const;
const PULLUP = { clip: "50-pullup-orange", backdrop: "spotlight" } as const;
const MOON = { clip: "51-moon-pullup", backdrop: "smoke" } as const;
const DUSK = { clip: "52-dusk-pullups", backdrop: "smoke" } as const;
const SNOW = { clip: "53-snow-boxing", backdrop: "dust" } as const;
const UMBRELLA = { clip: "55-umbrella-light", backdrop: "rain" } as const;
const LAMP_BOX = { clip: "56-lamp-shadowbox", backdrop: "spotlight" } as const;
const PEAK = { clip: "57-cloud-peak", backdrop: "smoke" } as const;
const SUMMIT = { clip: "58-summit-arms", backdrop: "spotlight" } as const;

export const episode004: Episode = {
  id: "GainsDom004",
  number: 4,
  series: "THE VOICE",
  bpm: 60,
  offsetSeconds: 0,
  lengthBeats: 31,
  durationSeconds: 31,
  accents: [7.16, 18.32, 19.78, 21.06, 23.68, 27.02],
  streaks: true,
  calm: true,
  progress: true,
  cuts: [
    // Hook: a lone figure walking out of the sunrise toward camera.
    { ...ROAD, from: 0, length: 1.48, trimSeconds: 7, push: [1.04, 1.1] },
    { ...LAMP_PATH, from: 1.48, length: 2.34, entry: "dissolve" },
    { ...HILL, from: 3.82, length: 1.92, entry: "dissolve" },
    { ...WINDOW, from: 5.74, length: 1.42, trimSeconds: 1, entry: "dissolve" },
    // "…to push you": push-ups alone under a streetlamp in the rain.
    { ...PUSHUP, from: 7.16, length: 1.12, trimSeconds: 1, entry: "zoom" },
    { ...ROPE, from: 8.28, length: 1.96, trimSeconds: 2, entry: "dissolve" },
    {
      ...SUNSET_BOX,
      from: 10.24,
      length: 1.32,
      trimSeconds: 2,
      entry: "light",
    },
    { ...HOOD, from: 11.56, length: 1.6, trimSeconds: 2, entry: "zoom" },
    // A small framed window of the climb that opens on "make you a better person".
    {
      ...HIKER,
      from: 13.16,
      length: 3.68,
      trimSeconds: 3,
      entry: "inset",
      insetBeats: 2.58,
      push: [1.0, 1.08],
    },
    { ...RUNNER, from: 16.84, length: 1.48, trimSeconds: 2, entry: "dissolve" },
    { ...PULLUP, from: 18.32, length: 1.46, entry: "zoom" },
    { ...MOON, from: 19.78, length: 1.06, trimSeconds: 12, entry: "zoom" },
    {
      ...DUSK,
      from: 20.84,
      length: 1.78,
      panels: [
        { clip: DUSK.clip, trimSeconds: 2 },
        { clip: SNOW.clip, trimSeconds: 3 },
        { clip: LAMP_PATH.clip, trimSeconds: 5 },
      ],
    },
    {
      ...UMBRELLA,
      from: 22.62,
      length: 1.06,
      trimSeconds: 10,
      entry: "dissolve",
    },
    { ...LAMP_BOX, from: 23.68, length: 1.6, trimSeconds: 3, entry: "zoom" },
    {
      ...PEAK,
      from: 25.28,
      length: 1.74,
      trimSeconds: 1,
      push: [1.0, 1.1],
      entry: "light",
    },
    // Payoff and credit: arms wide on the summit.
    {
      ...SUMMIT,
      from: 27.02,
      length: 3.98,
      trimSeconds: 1,
      push: [1.0, 1.15],
      entry: "dissolve",
    },
  ],
  cards: [
    {
      from: 0,
      length: 5.6,
      instant: true,
      lines: [
        { text: "Believe in yourself", at: 0, hero: true },
        // He stutters "and don't, and don't rely…": keep the words he lands.
        {
          text: "and don't rely on anybody",
          at: 1.26,
          words: [0, 0.22, 1.54, 1.84, 2.02],
          style: "read",
        },
        {
          text: "to believe in you.",
          at: 3.82,
          words: [0, 0.38, 0.68, 0.88],
          style: "read",
        },
      ],
    },
    {
      from: 5.65,
      length: 4.45,
      lines: [
        {
          text: "Don't rely on anybody",
          at: 0.09,
          words: [0, 0.3, 0.56, 0.68],
          style: "read",
        },
        { text: "to push you", at: 1.15, hero: true },
        {
          text: "or make you better.",
          at: 2.63,
          words: [0, 0.56, 0.74, 0.94],
          style: "read",
        },
      ],
    },
    {
      from: 10.15,
      length: 2.9,
      lines: [
        {
          text: "Believe in yourself",
          at: 0.09,
          words: [0, 0.24, 0.44],
          style: "read",
        },
        { text: "and only yourself.", at: 1.01, hero: true },
      ],
    },
    {
      from: 13.08,
      length: 3.7,
      lines: [
        {
          text: "And allow that human being",
          at: 0.08,
          words: [0, 0.34, 0.76, 1.06, 1.32],
          style: "read",
        },
        {
          text: "to make you",
          at: 1.82,
          words: [0, 0.84, 1.02],
          style: "read",
        },
        { text: "a better person.", at: 2.66, hero: true },
      ],
    },
    {
      from: 16.8,
      length: 1.5,
      lines: [
        {
          text: "Live your life with",
          at: 0.04,
          words: [0, 0.2, 0.4, 0.68],
          style: "read",
        },
      ],
    },
    {
      from: 18.3,
      length: 1.46,
      lines: [{ text: "CHARACTER", at: 0.02, style: "power" }],
    },
    {
      from: 19.76,
      length: 1.04,
      lines: [{ text: "HONOR", at: 0.02, style: "power" }],
    },
    {
      from: 20.8,
      length: 1.75,
      lines: [
        { text: "and", at: 0.04, style: "read" },
        { text: "DISCIPLINE", at: 0.26, style: "power" },
      ],
    },
    {
      from: 22.58,
      length: 2.62,
      lines: [
        {
          text: "If you live that way,",
          at: 0.04,
          words: [0, 0.18, 0.32, 0.46, 0.68],
          style: "read",
        },
        { text: "I guarantee it.", at: 1.1, hero: true },
      ],
    },
    {
      from: 25.22,
      length: 3.7,
      lines: [
        {
          text: "Your goals and dreams",
          at: 0.06,
          words: [0, 0.32, 0.6, 0.84],
          style: "read",
        },
        { text: "will get accomplished.", at: 1.8, hero: true },
      ],
    },
    {
      from: 28.95,
      length: 2.05,
      hold: true,
      lines: [{ text: "DAVID GOGGINS", at: 0, style: "power" }],
    },
  ],
};
