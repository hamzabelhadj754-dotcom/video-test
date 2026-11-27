import { interpolate } from "remotion";
import { EASE } from "./theme";

// All frames are locked to the voiceover (faster-whisper word timestamps @30fps).
// Scene boundaries = transition centres.
export const B = {
  hook: 0,
  rules: 80, // "Five moves"
  squat: 212,
  push: 296,
  lunge: 421,
  bridge: 511,
  climb: 592,
  rounds: 683,
  end: 775,
  total: 900,
};

// Word onsets (frames)
export const Wd = {
  twenty: 13,
  enough: 49,
  five: 80,
  forty: 118,
  off: 140,
  four: 172,
  squats: 221,
  hips: 246,
  chest: 267,
  pushups: 303,
  straight: 329,
  knees: 374,
  lunges: 427,
  both: 461,
  ninety: 484,
  glute: 517,
  squeeze: 558,
  mountain: 600,
  kneesIn: 639,
  fast: 664,
  round: 691,
  pushLast: 741,
  save: 781,
  your: 812,
  twenty2: 817,
  start: 836,
  now: 851,
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Normalised progress of `f` across [a,b] with an easing.
export const prog = (f: number, a: number, b: number, ease = EASE.out) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

// Keyframed scalar: [[frame, value], ...] with an easing between each pair.
export const kf = (f: number, keys: [number, number][], ease = EASE.inOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (f <= f1) {
      const t = f1 === f0 ? 1 : ease((f - f0) / (f1 - f0));
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
