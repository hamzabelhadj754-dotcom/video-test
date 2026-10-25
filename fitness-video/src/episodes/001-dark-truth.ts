import { Episode, strobe } from "../episode";

// Cut to the song in public/music/song-001.m4a: ~130 BPM, bass hits on every
// 4th beat (1.79 s, 3.64 s, 5.5 s …), drum rolls at beats 12–13 and 26.3–26.7.
// The last 2.65 beats replay the hook so the 15 s video loops with the song.
const TEMPO = { bpm: 130.1 };

const SWEAT = { clip: "07-sweat", backdrop: "dust" } as const;
const LIFT = { clip: "04-deadlift", backdrop: "spotlight" } as const;
const BAG = { clip: "05-boxing", backdrop: "speed" } as const;
const DUMBBELL = { clip: "03-dumbbell", backdrop: "dust" } as const;
const RUN = { clip: "06-rain-run", backdrop: "rain" } as const;
const HERO = { clip: "08-silhouette", backdrop: "smoke" } as const;

export const episode001: Episode = {
  id: "GainsDom001",
  number: 1,
  series: "DARK TRUTH",
  ...TEMPO,
  offsetSeconds: -0.055,
  lengthBeats: 32.65,
  durationSeconds: 15,
  audio: "music/song-001.m4a",
  accents: [8, 13, 18, 24, 28],
  cuts: [
    // Hook: sweat close-up, text already on screen.
    { ...SWEAT, from: 0, length: 4, push: [1.04, 1.12] },
    { ...DUMBBELL, from: 4, length: 2, trimSeconds: 12, overlay: "dust" },
    { ...SWEAT, from: 6, length: 2, push: [1.4, 1.5] },
    { ...LIFT, from: 8, length: 4, trimSeconds: 0.8, rate: 1.15 },
    ...strobe(
      TEMPO,
      [
        { ...LIFT, trimSeconds: 3.2 },
        { ...BAG, trimSeconds: 9 },
        { ...DUMBBELL, trimSeconds: 8.5 },
      ],
      12,
      13,
    ),
    { ...BAG, from: 13, length: 3, trimSeconds: 4, rate: 0.75 },
    // Runner keeps going… then collapses on "FADES."
    { ...RUN, from: 16, length: 2, trimSeconds: 10.6 },
    { ...RUN, from: 18, length: 2, trimSeconds: 12.6, rate: 0.8 },
    { ...HERO, from: 20, length: 4, push: [1.0, 1.15], overlay: "smoke" },
    // Beat montage, footage only.
    { ...BAG, from: 24, length: 1, trimSeconds: 1 },
    { ...LIFT, from: 25, length: 1, trimSeconds: 2.6 },
    { ...DUMBBELL, from: 26, length: 0.25, trimSeconds: 8 },
    ...strobe(
      TEMPO,
      [
        { ...BAG, trimSeconds: 12 },
        { ...RUN, trimSeconds: 4 },
        { ...LIFT, trimSeconds: 4 },
      ],
      26.25,
      26.75,
    ),
    { ...DUMBBELL, from: 26.75, length: 1.25, trimSeconds: 9.5 },
    { ...BAG, from: 28, length: 2, trimSeconds: 6, rate: 0.6 },
    // Loop point: back to the hook shot, ending where frame 0 begins.
    { ...SWEAT, from: 30, length: 2.65, push: [1.0, 1.04] },
  ],
  cards: [
    {
      from: 0,
      length: 8,
      instant: true,
      lines: [
        { text: "Nobody cares", at: 0 },
        { text: "how *tired* you are.", at: 4 },
      ],
    },
    {
      from: 8,
      length: 8,
      lines: [
        { text: "Do it *tired.*", at: 0 },
        { text: "Do it *alone.*", at: 5 },
      ],
    },
    {
      from: 16,
      length: 4,
      lines: [
        { text: "Motivation", at: 0 },
        { text: "*fades.*", at: 2 },
      ],
    },
    {
      from: 20,
      length: 4,
      lines: [
        { text: "Discipline", at: 0 },
        { text: "*doesn't.*", at: 2 },
      ],
    },
    {
      from: 28,
      length: 2,
      lines: [{ text: "So get up.", at: 0 }],
    },
    {
      // Loop point: lands exactly like frame 0. The second line never shows
      // (it starts after the card ends) but keeps the layout identical.
      from: 30,
      length: 2.65,
      hold: true,
      lines: [
        { text: "Nobody cares", at: 0.3 },
        { text: "how *tired* you are.", at: 4 },
      ],
    },
  ],
};
