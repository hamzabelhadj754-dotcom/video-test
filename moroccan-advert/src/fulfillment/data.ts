// All times are in seconds, measured on fulfillment-source.mp4 (Whisper word timestamps + scene detection).

export const FPS = 30;
export const DURATION_S = 45.4;
export const SOURCE = "fulfillment-source.mp4";

export const PINK = "#FF2D87";
export const YELLOW = "#FFD23F";
export const DARK = "#0B0710";

// ---------------------------------------------------------------- captions
// [word, start]; a word ends where the next one starts (or at the group end).
// `*` prefix = keyword, shown in accent colour.
export type CaptionGroup = { end: number; words: [string, number][] };

export const CAPTIONS: CaptionGroup[] = [
  { end: 4.3, words: [["نتا", 2.4], ["اللي", 3.35], ["كتشوف", 3.6], ["هاد", 3.95], ["الفيديو", 4.1]] },
  { end: 6.35, words: [["كنحساب", 4.3], ["ليك", 4.65], ["محتاج", 5.0], ["*الفولفيلمنت", 5.6]] },
  { end: 8.15, words: [["صيفط", 6.4], ["لينا", 6.8], ["*البرودكت", 7.2], ["ديالك", 7.7]] },
  { end: 10.25, words: [["غنحطوه", 8.2], ["*فالويرهاوس", 9.0], ["ديالنا", 9.8]] },
  { end: 11.75, words: [["وأي", 10.3], ["أوردر", 11.0], ["جاك", 11.3]] },
  { end: 14.4, words: [["حنا", 11.8], ["اللي", 13.0], ["*غنكونفيرميوه", 13.2], ["ليك", 14.0]] },
  { end: 17.75, words: [["ألو،", 14.9], ["معاك", 15.9], ["سيرفيس", 16.3], ["الطلبيات", 16.7], ["*يوكان", 17.2]] },
  { end: 19.8, words: [["بغينا", 17.8], ["*نكونفيرميو", 18.1], ["معاك", 18.7], ["الطلبية", 18.9], ["ديالك", 19.4]] },
  { end: 22.95, words: [["و*الباكاجينغ", 21.3], ["حتى", 22.3], ["هو", 22.6]] },
  { end: 25.2, words: [["على", 23.0], ["*حسابنا", 23.3]] },
  { end: 31.35, words: [["وحتى", 30.1], ["*التوصيل", 30.8]] },
  { end: 32.45, words: [["ما", 31.4], ["تضرب", 31.6], ["ليه", 31.9], ["حساب", 32.1]] },
  { end: 33.75, words: [["*الكوليات", 32.5], ["ديالك", 33.1], ["توصل", 33.4]] },
  { end: 36.35, words: [["من", 33.8], ["يدينا", 34.0], ["ليد", 34.6], ["*الكليان", 35.3], ["ديالك", 35.9]] },
  { end: 38.7, words: [["*وفلوسك", 36.4], ["يوصلوك", 37.3], ["حتى", 37.9], ["لعندك", 38.2]] },
  { end: 40.25, words: [["وهادشي", 38.8], ["كامل", 39.5], ["يلا", 39.8], ["شفتي", 39.9]] },
  { end: 41.7, words: [["هو", 40.3], ["*يوكان", 40.8], ["*فولفيلمنت", 41.1]] },
];

// ---------------------------------------------------------------- hard cuts in the source
export const CUTS = [11.367, 13.167, 19.833, 21.733, 30.467, 36.633];

// ---------------------------------------------------------------- camera moves
// Digital punch-ins between cuts / sentence starts. `to` lets a segment drift (slow push).
export type Zoom = { at: number; from: number; to: number; ox?: number; oy?: number };
export const ZOOMS: Zoom[] = [
  { at: 0, from: 1.06, to: 1.14, oy: 35 }, // hook: slow push on the sip
  { at: 2.4, from: 1.0, to: 1.04 },
  { at: 6.4, from: 1.16, to: 1.18 }, // punch-in: "صيفط لينا"
  { at: 11.367, from: 1.0, to: 1.07, oy: 50 }, // phone b-roll
  { at: 13.167, from: 1.0, to: 1.03 },
  { at: 17.8, from: 1.14, to: 1.15 }, // punch-in: "بغينا نكونفيرميو"
  { at: 19.833, from: 1.0, to: 1.06, oy: 30 }, // dashboard
  { at: 21.733, from: 1.12, to: 1.13 }, // packaging line
  { at: 25.2, from: 1.0, to: 1.08, oy: 60 }, // packing b-roll
  { at: 30.467, from: 1.0, to: 1.02 },
  { at: 32.5, from: 1.1, to: 1.12 }, // punch-in: "الكوليات ديالك"
  { at: 36.633, from: 1.0, to: 1.03 },
  { at: 38.8, from: 1.13, to: 1.15 }, // punch-in: "وهادشي كامل"
  { at: 41.7, from: 1.0, to: 1.0 },
];

// ---------------------------------------------------------------- step tracker
export type StepIcon = "warehouse" | "check" | "box" | "truck" | "cash";
export const STEPS: { label: string; icon: StepIcon; at: number }[] = [
  { label: "التخزين", icon: "warehouse", at: 8.2 },
  { label: "التأكيد", icon: "check", at: 11.8 },
  { label: "التغليف", icon: "box", at: 21.3 },
  { label: "التوصيل", icon: "truck", at: 30.1 },
  { label: "الخلاص", icon: "cash", at: 36.4 },
];
export const STEPS_IN = 7.9;
export const STEPS_OUT = 41.5;

// ---------------------------------------------------------------- callouts during speech-free b-roll
export const CALLOUTS: { text: string; sub: string; from: number; to: number }[] = [
  { text: "الطلبيات مأكدة", sub: "Confirmé ✓", from: 19.95, to: 21.3 },
  { text: "تغليف احترافي", sub: "على حسابنا", from: 25.4, to: 30.0 },
];

export const HOOK_END = 2.35;
export const END_CARD = 41.75;
