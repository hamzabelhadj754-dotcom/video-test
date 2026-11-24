import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, random, staticFile } from "remotion";

/** GainsDom palette: black, white, one controlled accent. */
export const C = {
  bg: "#050505",
  ink: "#F1F0EC",
  dim: "rgba(241,240,236,0.62)",
  mute: "rgba(241,240,236,0.32)",
  faint: "rgba(241,240,236,0.10)",
  accent: "#FF4A1C",
};

export const F = {
  display: "Anton",
  body: "Inter Tight",
  mono: "JetBrains Mono",
};

const fonts: [string, string, string][] = [
  [F.display, "anton-latin-400-normal.woff2", "400"],
  [F.body, "inter-tight-latin-500-normal.woff2", "500"],
  [F.body, "inter-tight-latin-700-normal.woff2", "700"],
  [F.body, "inter-tight-latin-800-normal.woff2", "800"],
  [F.mono, "jetbrains-mono-latin-400-normal.woff2", "400"],
  [F.mono, "jetbrains-mono-latin-700-normal.woff2", "700"],
];

for (const [family, file, weight] of fonts) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight });
}

/** Snappy "expo out" used for most entrances. */
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.7, 0, 0.2, 1);

/** 0→1 progress over [start, start+dur], clamped. */
export const prog = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EXPO,
) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Decaying camera shake that starts at `start`. Returns px offsets. */
export const shake = (frame: number, start: number, dur = 10, amp = 18) => {
  const t = frame - start;
  if (t < 0 || t > dur) return { x: 0, y: 0, r: 0 };
  const k = Math.pow(1 - t / dur, 2) * amp;
  return {
    x: (random(`sx${start}-${t}`) - 0.5) * 2 * k,
    y: (random(`sy${start}-${t}`) - 0.5) * 2 * k,
    r: (random(`sr${start}-${t}`) - 0.5) * 0.02 * k,
  };
};

/** Sum several shakes (one per impact). */
export const shakes = (frame: number, starts: number[], dur = 10, amp = 18) =>
  starts.reduce(
    (acc, s) => {
      const v = shake(frame, s, dur, amp);
      return { x: acc.x + v.x, y: acc.y + v.y, r: acc.r + v.r };
    },
    { x: 0, y: 0, r: 0 },
  );

/** Glitch intensity: 1 inside windows of `len` frames starting at each cue. */
export const glitchAt = (frame: number, starts: number[], len = 6) =>
  starts.some((s) => frame >= s && frame < s + len) ? 1 : 0;

/** Slam-in transform for oversized type. */
export const slam = (frame: number, start: number, dur = 7) => {
  const p = prog(frame, start, dur);
  return {
    opacity: frame < start ? 0 : interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
    transform: `scale(${interpolate(p, [0, 1], [1.35, 1])})`,
    filter: `blur(${interpolate(p, [0, 1], [14, 0])}px)`,
  };
};

/** Characters revealed by a typewriter that starts at `start`. */
export const typed = (text: string, frame: number, start: number, cps = 1.6) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * cps)));
