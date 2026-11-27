import { writeFileSync } from "node:fs";
import { BURST, BURST_KEYS, END, KEYS1, KEYS2, KEYS3, S1, S2, S3, T1, FPS, DURATION } from "../src/timeline";
const keys = [...KEYS1, ...KEYS2, ...KEYS3, ...BURST_KEYS.flat()].map((k) => ({ f: k.f, kind: k.kind }));
writeFileSync(
  "audio/events.json",
  JSON.stringify({ fps: FPS, duration: DURATION, keys, S1, S2, S3, T1, BURST, END }, null, 1),
);
console.log("keys", keys.length);
