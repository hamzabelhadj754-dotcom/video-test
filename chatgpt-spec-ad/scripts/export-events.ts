import { writeFileSync } from "node:fs";
import { BURST_CUTS, BURST_KEYS, FIN, KEYS1, KEYS2, KEYS3, KEYS4, S1, S2, S3, T1, T2, FPS, DURATION, VO, VO_OFFSET, WALL } from "../src/timeline";
const keys = [...KEYS1, ...KEYS2, ...KEYS3, ...KEYS4, ...BURST_KEYS.flat()].map((k) => ({ f: k.f, kind: k.kind }));
writeFileSync(
  "audio/events.json",
  JSON.stringify({ fps: FPS, duration: DURATION, voOffset: VO_OFFSET, keys, S1, S2, S3, T1, T2, BURST_CUTS, FIN, VO, wall: WALL.map((w) => w.at) }, null, 1),
);
console.log("keys", keys.length, "duration", DURATION);
