// Pure timeline data, no Remotion imports, so scripts/export-events.ts can reuse it for audio.

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const BEAT = 20; // 90 BPM -> one beat every 20 frames
export const DURATION = 750;

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

// ---------- The film ----------
export const S1 = { start: 0, typeStart: 5, typeEnd: 60, send: 64, answerStart: 76, sweep: 146, end: 204 };
export const T1 = { start: 188, end: 220 }; // shadow passes, morning -> afternoon
export const S2 = { start: 204, dragStart: 214, drop: 244, typeStart: 252, typeEnd: 286, send: 290, answerStart: 300, rowsStart: 310, end: 400 };
export const T2 = { start: 352, end: 400 }; // daylight leaves the room, hard cut to night on the beat
export const S3 = { start: 400, typeStart: 404, typeEnd: 472, send: 478, answerStart: 488, end: 560 };
export const BURST = { start: 560, shot: BEAT, count: 4 };
export const END = { start: 640, lift: 656, headline: 662, brand: 700, spec: 708 };

export const P1: TypeOp[] = [{ type: "my sourdough starter smells like nail polish. is it dead?" }];
export const P2: TypeOp[] = [{ type: "turn this into a plan for monday" }];
export const P3: TypeOp[] = [
  { type: "help me write a toast for my sister's wedding. she hates speac" },
  { pause: 6 },
  { del: 2 },
  { type: "eches." },
];

export const KEYS1 = typingSchedule(P1, S1.typeStart, S1.typeEnd, 11);
export const KEYS2 = typingSchedule(P2, S2.typeStart, S2.typeEnd, 23);
export const KEYS3 = typingSchedule(P3, S3.typeStart, S3.typeEnd, 37);

export const BURST_PROMPTS = [
  { text: "make this email sound less angry", time: "11:20 AM", look: "noon" },
  { text: "what can i cook with eggs, spinach and feta", time: "6:45 PM", look: "dusk" },
  { text: "plan 3 days in lisbon on a budget", time: "9:58 PM", look: "evening" },
  { text: "why does my code return undefined", time: "1:16 AM", look: "night" },
] as const;

export const BURST_KEYS = BURST_PROMPTS.map((p, i) =>
  typingSchedule([{ type: p.text }], BURST.start + i * BURST.shot + 1, BURST.start + i * BURST.shot + 12, 50 + i),
);

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
