import { Easing, interpolate } from "remotion";

export type Bz = readonly [number, number, number, number];
export const OUT: Bz = [0.16, 1, 0.3, 1];
export const INOUT: Bz = [0.65, 0, 0.35, 1];
export const IN: Bz = [0.55, 0, 0.9, 0.4];
export const LIN: Bz = [0, 0, 1, 1];
export const tw = (f: number, a: number, b: number, from: number, to: number, e: Bz = OUT) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(e[0], e[1], e[2], e[3]) });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
