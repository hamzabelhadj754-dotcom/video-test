/**
 * THE TIMING RULE
 * Every scene = ENTER frames of entrance + HOLD frames where the information is fully
 * visible, still and readable. Scenes 1–15 end on a hard cut / quick wipe (no exit
 * animation eating into the hold). Scene 16 holds longer and fades out at the very end.
 */
export const FPS = 30;
export const ENTER = 9; // 0.3 s entrance
export const HOLD = 45; // 1.5 s minimum readable hold
export const SCENE = ENTER + HOLD; // 54 frames = 1.8 s

/** Wipes / blur transitions between scenes (must stay within 6–9 frames). */
export const TRANSITION = 8;
/**
 * The previous scene stays on screen (frozen on its last hold frame) underneath the
 * next scene while that scene's wipe plays. This only ADDS readable time to the hold.
 */
export const TRANSITION_OVERLAP = ENTER;

export const OUTRO_HOLD = 75; // final CTA readable for 2.5 s
export const OUTRO_FADE = 6; // fade to black on the last 6 frames
export const OUTRO = ENTER + OUTRO_HOLD + OUTRO_FADE; // 90 frames

export const TOTAL = 900; // 30 s
export const SCENE_COUNT = 16;

/** Frame (relative to the scene) used for review stills: the middle of the hold. */
export const MID_HOLD = ENTER + Math.floor(HOLD / 2); // 31

export type SceneTiming = {
  id: number;
  start: number;
  duration: number;
  enter: number;
  hold: number;
  exit: number;
};

const sceneDurations: { enter: number; hold: number; exit: number }[] = [
  ...Array.from({ length: SCENE_COUNT - 1 }, () => ({ enter: ENTER, hold: HOLD, exit: 0 })),
  { enter: ENTER, hold: OUTRO_HOLD, exit: OUTRO_FADE },
];

export const SCENES: SceneTiming[] = sceneDurations.reduce<SceneTiming[]>((acc, d, i) => {
  const prev = acc[acc.length - 1];
  const start = prev ? prev.start + prev.duration : 0;
  acc.push({ id: i + 1, start, duration: d.enter + d.hold + d.exit, ...d });
  return acc;
}, []);

export const sceneStart = (id: number): number => SCENES[id - 1].start;
