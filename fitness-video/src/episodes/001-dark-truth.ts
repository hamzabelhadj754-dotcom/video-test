import { Episode } from "../episode";

// 15 s loop at 120 BPM (2 beats per second). The last beat replays the opening
// shot's first second and re-slams the hook, landing exactly on frame 0.
export const episode001: Episode = {
  id: "GainsDom001",
  number: 1,
  series: "DARK TRUTH",
  bpm: 120,
  lengthBeats: 30,
  cuts: [
    {
      clip: "01-dark-gym",
      backdrop: "spotlight",
      from: 0,
      length: 4,
      trimSeconds: 1,
      push: [1.04, 1.12],
    },
    { clip: "07-sweat", backdrop: "dust", from: 4, length: 2 },
    { clip: "02-chalk", backdrop: "dust", from: 6, length: 2 },
    { clip: "03-barbell", backdrop: "speed", from: 8, length: 1 },
    { clip: "04-deadlift", backdrop: "spotlight", from: 9, length: 1 },
    { clip: "05-boxing", backdrop: "speed", from: 10, length: 1 },
    {
      clip: "03-barbell",
      backdrop: "speed",
      from: 11,
      length: 1,
      trimSeconds: 1,
    },
    {
      clip: "04-deadlift",
      backdrop: "spotlight",
      from: 12,
      length: 1,
      trimSeconds: 1,
    },
    {
      clip: "05-boxing",
      backdrop: "speed",
      from: 13,
      length: 1,
      trimSeconds: 1,
    },
    {
      clip: "04-deadlift",
      backdrop: "spotlight",
      from: 14,
      length: 2,
      trimSeconds: 2,
    },
    { clip: "06-rain-run", backdrop: "rain", from: 16, length: 6 },
    { clip: "08-silhouette", backdrop: "smoke", from: 22, length: 6 },
    {
      clip: "01-dark-gym",
      backdrop: "spotlight",
      from: 28,
      length: 2,
      trimSeconds: 0,
      push: [1.0, 1.04],
    },
  ],
  cards: [
    {
      from: 0,
      length: 4,
      instant: true,
      lines: [
        { text: "NOBODY", at: 0 },
        { text: "CARES", at: 0 },
      ],
    },
    {
      from: 4,
      length: 4,
      lines: [
        { text: "HOW TIRED", at: 0 },
        { text: "YOU ARE.", at: 2, style: "inverted" },
      ],
    },
    {
      from: 8,
      length: 8,
      lines: [
        { text: "THEY SLEEP.", at: 0 },
        { text: "YOU", at: 4, style: "outline" },
        { text: "TRAIN.", at: 5, style: "inverted" },
      ],
    },
    {
      from: 16,
      length: 6,
      lines: [
        { text: "MOTIVATION", at: 0, style: "outline" },
        { text: "FADES.", at: 2 },
      ],
    },
    {
      from: 22,
      length: 6,
      lines: [
        { text: "DISCIPLINE", at: 0, style: "inverted" },
        { text: "DOESN'T.", at: 2 },
      ],
    },
    {
      from: 28,
      length: 2,
      hold: true,
      lines: [
        { text: "NOBODY", at: 0 },
        { text: "CARES", at: 0.5 },
      ],
    },
  ],
};
