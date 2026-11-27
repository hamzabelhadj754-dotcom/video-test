// Pure timeline data, no Remotion imports, so scripts/export-events.ts can reuse it for audio.

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const BEAT = 20; // 90 BPM -> one beat every 20 frames
export const DURATION = 1250; // 41.7 s, the voiceover is the timeline

// Seeded RNG (mulberry32): same seed, same film, every render.
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type TypeOp = { type: string } | { del: number } | { pause: number };
export type Keystroke = { f: number; kind: "char" | "space" | "del"; text: string };

// Human typing cadence: 30-70 ms per key, longer at spaces and punctuation, then fitted to [start, end].
export const typingSchedule = (ops: TypeOp[], start: number, end: number, seed: number): Keystroke[] => {
  const r = rng(seed);
  const raw: { d: number; kind: Keystroke["kind"]; ch?: string }[] = [];
  let pending = 0;
  for (const op of ops) {
    if ("pause" in op) {
      pending += op.pause;
    } else if ("del" in op) {
      for (let i = 0; i < op.del; i++) {
        raw.push({ d: pending + 1.4 + r() * 0.5, kind: "del" });
        pending = 0;
      }
    } else {
      for (const ch of op.type) {
        let d = 0.9 + r() * 1.2;
        if (ch === " ") d += 0.4 + r() * 0.9;
        if (/[.,?!]/.test(ch)) d += 1.0;
        raw.push({ d: d + pending, kind: ch === " " ? "space" : "char", ch });
        pending = 0;
      }
    }
  }
  raw[0].d = 0;
  const total = raw.reduce((s, k) => s + k.d, 0);
  const k = (end - start) / total;
  let t = start;
  let text = "";
  return raw.map((s) => {
    t += s.d * k;
    text = s.kind === "del" ? text.slice(0, -1) : text + s.ch;
    return { f: t, kind: s.kind, text };
  });
};

export const textAt = (keys: Keystroke[], frame: number) => {
  let text = "";
  for (const k of keys) {
    if (k.f <= frame) text = k.text;
    else break;
  }
  return text;
};

export const lastKeyBefore = (keys: Keystroke[], frame: number) => {
  let f = -999;
  for (const k of keys) {
    if (k.f <= frame) f = k.f;
    else break;
  }
  return f;
};

// ---------- The voiceover (ElevenLabs take 2), placed at +0.4 s. Frames at 30 fps. ----------
export const VO_OFFSET = 12;
export const VO: { text: string; f0: number; f1: number }[] = [
  ["Every day starts with a question.", 0.0, 1.935],
  ["Usually before coffee.", 2.407, 3.682],
  ["So you open ChatGPT.", 4.12, 6.067],
  ["Some questions are small…", 6.573, 7.908],
  ["is my sourdough starter dead?", 8.368, 10.037],
  ["It’s not.", 10.512, 11.061],
  ["It’s just hungry.", 11.321, 12.15],
  ["Some are just Monday.", 12.665, 14.267],
  ["A whiteboard full of half-ideas…", 14.703, 16.987],
  ["and ChatGPT turns it into a plan.", 17.362, 19.712],
  ["And some only come out at 3 a.m. …", 20.198, 22.653],
  ["when the house is quiet,", 23.056, 24.258],
  ["and you need the right words for someone you love.", 24.555, 27.013],
  ["Emails.", 27.522, 28.183],
  ["Dinner.", 28.428, 28.885],
  ["Trips.", 29.216, 29.697],
  ["Bugs.", 29.933, 30.573],
  ["Big questions, silly ones,", 30.99, 32.912],
  ["the ones you’d never say out loud.", 33.196, 34.925],
  ["Whatever’s on your mind…", 35.369, 36.499],
  ["ChatGPT.", 36.884, 37.831],
  ["Ask anything.", 38.232, 39.155],
].map(([text, a, b]) => ({ text: text as string, f0: Math.round((a as number) * FPS) + VO_OFFSET, f1: Math.round((b as number) * FPS) + VO_OFFSET }));

// ---------- The film (every beat hangs off the voice) ----------
export const INTRO = { start: 0, reveal: 128, end: 236 };
export const S1 = { start: 0, typeStart: 236, typeEnd: 302, send: 310, answerStart: 326, sweep: 352, end: 395 };
export const T1 = { start: 380, end: 412 }; // a band of sunlight passes: morning -> afternoon, on "Some are just Monday"
export const S2 = { start: 395, dragStart: 448, drop: 478, typeStart: 486, typeEnd: 522, send: 530, answerStart: 540, end: 618 };
export const T2 = { start: 572, end: 618 }; // daylight leaves the room; hard cut to night on "And some only…"
export const S3 = { start: 618, typeStart: 630, typeEnd: 712, send: 722, answerStart: 732, end: 838 };
export const BURST_CUTS = [838, 865, 889, 910, 940]; // one cut per spoken word: Emails. Dinner. Trips. Bugs.
export const BURST = { start: 838, count: 4 };
export const FIN = {
  start: 940, // "Big questions, silly ones,"
  silly: 975,
  fade: 1004, // "the ones you'd never say out loud."
  typeStart: 1012,
  typeEnd: 1060,
  send: 1088, // "Whatever's on your mind…"
  fly: 1094,
  iris: 1118, // "ChatGPT."
  irisEnd: 1140,
  headline: 1159, // "Ask anything."
  spec: 1176,
};
export const END = { start: FIN.start }; // kept for the time label and vignette

export const P1: TypeOp[] = [{ type: "my sourdough starter smells like nail polish. is it dead?" }];
export const P2: TypeOp[] = [{ type: "turn this into a plan for monday" }];
export const P3: TypeOp[] = [
  { type: "help me write a toast for my sister's wedding. she hates speac" },
  { pause: 6 },
  { del: 2 },
  { type: "eches." },
];
export const P4: TypeOp[] = [{ type: "how do i say sorry" }, { pause: 8 }, { type: " without making it weird" }];

export const KEYS1 = typingSchedule(P1, S1.typeStart, S1.typeEnd, 11);
export const KEYS2 = typingSchedule(P2, S2.typeStart, S2.typeEnd, 23);
export const KEYS3 = typingSchedule(P3, S3.typeStart, S3.typeEnd, 37);
export const KEYS4 = typingSchedule(P4, FIN.typeStart, FIN.typeEnd, 71);

export const BURST_PROMPTS = [
  { text: "make this email sound less angry", time: "11:20 AM", look: "noon" },
  { text: "what can i cook with eggs, spinach and feta", time: "6:45 PM", look: "dusk" },
  { text: "plan 3 days in lisbon on a budget", time: "9:58 PM", look: "evening" },
  { text: "why does my code return undefined", time: "1:16 AM", look: "night" },
] as const;

export const BURST_KEYS = BURST_PROMPTS.map((p, i) =>
  typingSchedule([{ type: p.text }], BURST_CUTS[i] + 1, BURST_CUTS[i] + Math.min(14, BURST_CUTS[i + 1] - BURST_CUTS[i] - 8), 50 + i),
);

// Statement lines: the voice's chapter lines, set in the serif, revealed word by word on the voice.
export const STATEMENTS = [0, 3, 7, 10].map((i) => ({ ...VO[i], italicLast: true }));

// The wall of questions (finale). Depth 0 = far, 1 = mid, 2 = near (out of focus).
export const WALL: { text: string; x: number; y: number; d: 0 | 1 | 2; size: number; at: number }[] = [
  { text: "what should i do with my life", x: 250, y: 250, d: 1, size: 34, at: 944 },
  { text: "is it too late to start over at 40", x: 1180, y: 190, d: 1, size: 30, at: 950 },
  { text: "how do i ask for a raise", x: 1290, y: 760, d: 1, size: 28, at: 956 },
  { text: "explain my electricity bill", x: 120, y: 840, d: 0, size: 22, at: 948 },
  { text: "help me understand my mom’s diagnosis", x: 560, y: 120, d: 0, size: 22, at: 960 },
  { text: "fix my resume", x: 1560, y: 470, d: 0, size: 22, at: 964 },
  { text: "is a hot dog a sandwich", x: 1210, y: 330, d: 1, size: 24, at: 976 },
  { text: "can my cat eat cheese", x: 110, y: 560, d: 1, size: 24, at: 980 },
  { text: "why do i always wake up at 3:07", x: 640, y: 830, d: 1, size: 24, at: 984 },
  { text: "name my sourdough starter", x: 1500, y: 880, d: 0, size: 20, at: 988 },
  { text: "rap battle between a cat and a toaster", x: 40, y: 360, d: 0, size: 20, at: 992 },
  { text: "am i overthinking this", x: 1380, y: 860, d: 2, size: 40, at: 966 },
  { text: "translate this menu", x: -80, y: 150, d: 2, size: 40, at: 986 },
];
// Answers (accurate, plain, specific).
export const A1_BOLD = "Not dead, just hungry.";
export const A1_REST =
  "That nail-polish smell is acetone, a sign your starter has run out of food. Discard most of it, feed it equal parts flour and water, and it should smell yeasty again within a day.";
export const A2_HEAD = "Here’s your Monday, in the order things unblock each other:";
export const A2_ROWS = [
  { t: "9:00", s: "Finalize the launch copy" },
  { t: "10:30", s: "Review the pricing page with Sam" },
  { t: "1:00", s: "QA the checkout flow" },
  { t: "3:00", s: "Send the team an update" },
];
export const A3_HEAD = "Keep it short. She’ll thank you for it. Here’s a start:";
export const A3_QUOTE =
  "“I promised Maya no speech. So this is just a toast: to the person who taught me that short and true beats long and perfect. To Maya and Leo.”";

export const WORD_RATE = 1.1; // frames per streamed word (~27 words/s)
export const WORD_RATE_NIGHT = 1.55; // the toast streams slower, to land on "someone you love"
