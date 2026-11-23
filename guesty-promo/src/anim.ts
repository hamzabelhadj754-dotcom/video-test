import { Easing, interpolate, spring } from "remotion";
import { ENTER, FPS } from "./timing";

/** Expo-out bezier for slides & wipes. */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 progress with the brand ease, between `start` and `start + duration`. */
export const ease = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], { ...clamp, easing: EASE });

/**
 * UI entrance spring (damping 200 = no overshoot). By default it is stretched so it
 * settles exactly at ENTER, even with a stagger delay — the hold starts fully still.
 */
export const enter = (frame: number, delay = 0, duration = ENTER - delay) =>
  spring({
    frame: frame - delay,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: Math.max(3, duration),
  });

export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;

export const mapRange = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, clamp);

/** Subtle drift during the hold (max ~1.5% scale) so stills never feel dead. */
export const holdDrift = (frame: number, amount = 0.012) =>
  1 + interpolate(frame, [ENTER, 54], [0, amount], clamp);
