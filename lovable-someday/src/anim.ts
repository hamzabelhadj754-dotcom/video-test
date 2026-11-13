import { Easing, interpolate } from "remotion";
import { EASE } from "./theme";

type Bz = readonly [number, number, number, number];
export const LINEAR: Bz = [0, 0, 1, 1];
export const bz = (b: Bz) => Easing.bezier(b[0], b[1], b[2], b[3]);

export const tw = (f: number, a: number, b: number, from: number, to: number, e: Bz = EASE.out) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: bz(e),
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Cam = { rx: number; ry: number; rz: number; s: number; x: number; y: number };
export type CamKey = { f: number; cam: Cam; e?: Bz };

export const camAt = (f: number, keys: CamKey[]): Cam => {
  if (f <= keys[0].f) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = tw(f, a.f, b.f, 0, 1, b.e ?? LINEAR);
      return {
        rx: lerp(a.cam.rx, b.cam.rx, t),
        ry: lerp(a.cam.ry, b.cam.ry, t),
        rz: lerp(a.cam.rz, b.cam.rz, t),
        s: lerp(a.cam.s, b.cam.s, t),
        x: lerp(a.cam.x, b.cam.x, t),
        y: lerp(a.cam.y, b.cam.y, t),
      };
    }
  }
  return keys[keys.length - 1].cam;
};

export const camCss = (c: Cam) =>
  `translate(${c.x}px, ${c.y}px) scale(${c.s}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg)`;

// Blur in px from camera velocity, so only fast moves smear.
export const camBlur = (f: number, keys: CamKey[]) => {
  const a = camAt(f - 1, keys);
  const b = camAt(f, keys);
  const v = Math.abs(Math.log(b.s / a.s)) * 60 + (Math.abs(b.x - a.x) + Math.abs(b.y - a.y)) / 30;
  return Math.min(18, Math.max(0, v - 0.8));
};

// Point on a path of timed positions with eased segments and a slight arc.
export const pathAt = (f: number, keys: { f: number; x: number; y: number }[], arc = 26) => {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = tw(f, a.f, b.f, 0, 1, [0.5, 0, 0.15, 1]);
      const moving = a.x !== b.x || a.y !== b.y;
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t) - (moving ? Math.sin(t * Math.PI) * arc : 0),
      };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y };
};

// Cursor press: 0.9 for a few frames after each click frame.
export const press = (f: number, clicks: number[]) =>
  clicks.some((c) => f >= c && f < c + 4) ? 0.88 : 1;

// Typing: frame at which character i lands (human-ish cadence, pauses on spaces).
export const TYPED = "Make it feel like her.";
export const TYPE_START = 166;
export const charFrame = (i: number) => {
  let f = TYPE_START;
  for (let k = 0; k < i; k++) f += 2 + (TYPED[k] === " " ? 1 : 0) + (k === 6 || k === 14 ? 1 : 0);
  return f;
};
export const typedCount = (f: number) => {
  let n = 0;
  while (n < TYPED.length && charFrame(n) <= f) n++;
  return n;
};
