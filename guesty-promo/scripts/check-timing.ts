/* Run with: npm run check-timing  (fails with exit code 1 on any violation) */
import { ENTER, HOLD, SCENE, SCENES, SCENE_COUNT, TOTAL, TRANSITION, FPS, OUTRO_HOLD } from "../src/timing";
import { HOLD_TEXT } from "../src/copy";

const errors: string[] = [];
const assert = (cond: boolean, msg: string) => {
  if (!cond) errors.push(msg);
};

assert(FPS === 30, `FPS must be 30, got ${FPS}`);
assert(SCENE === ENTER + HOLD, `SCENE (${SCENE}) must equal ENTER + HOLD (${ENTER + HOLD})`);
assert(SCENE === 54, `SCENE must be 54 frames, got ${SCENE}`);
assert(HOLD >= 45, `HOLD must be >= 45 frames (1.5 s), got ${HOLD}`);
assert(TRANSITION >= 6 && TRANSITION <= 9, `TRANSITION must be 6–9 frames, got ${TRANSITION}`);
assert(TRANSITION <= ENTER, `TRANSITION (${TRANSITION}) must fit inside ENTER (${ENTER})`);
assert(SCENES.length === SCENE_COUNT, `Expected ${SCENE_COUNT} scenes, got ${SCENES.length}`);
assert(OUTRO_HOLD >= 75, `Final CTA must hold >= 75 frames (2.5 s), got ${OUTRO_HOLD}`);

let cursor = 0;
for (const s of SCENES) {
  assert(s.start === cursor, `Scene ${s.id} starts at ${s.start}, expected ${cursor} (gap/overlap)`);
  assert(s.hold >= 45, `Scene ${s.id} hold is ${s.hold} frames (< 45)`);
  assert(s.enter <= ENTER, `Scene ${s.id} entrance is ${s.enter} frames (> ${ENTER})`);
  assert(s.duration === s.enter + s.hold + s.exit, `Scene ${s.id} duration mismatch`);
  const text = HOLD_TEXT[s.id];
  const words = text ? text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
  const holds = Math.floor(s.hold / 45);
  assert(text !== undefined, `Scene ${s.id} has no copy`);
  assert(words <= 6 * holds, `Scene ${s.id}: "${text}" has ${words} words (max ${6 * holds} for ${s.hold}-frame hold)`);
  console.log(
    `  #${String(s.id).padStart(2)}  ${String(s.start).padStart(3)}–${String(s.start + s.duration).padEnd(3)}  ` +
      `enter ${s.enter}  hold ${s.hold}  exit ${s.exit}  ${String(words)}w  "${text}"`,
  );
  cursor += s.duration;
}
assert(cursor === TOTAL, `Total is ${cursor} frames, expected ${TOTAL}`);

if (errors.length) {
  console.error(`\n✗ Timing check failed:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`\n✓ Timing OK — ${SCENES.length} scenes, ${cursor} frames (${cursor / FPS}s), every hold >= 45 frames.`);
