import { Easing } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// ---------- Motion: one easing family for the whole film ----------
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
  in: Easing.bezier(0.64, 0, 0.78, 0), // exits
  cam: Easing.bezier(0.65, 0, 0.35, 1), // camera, sweeps
  soft: Easing.bezier(0.45, 0, 0.55, 1), // slow drifts
};
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Color: neutrals first, one accent ----------
export const C = {
  paper: "#F4F3EE",
  stone: "#E4E2DB",
  ash: "#8C8A84",
  ink: "#111111",
  amber: "#E3A35A",
};

export type Theme = {
  dark: boolean;
  bg: string;
  text: string;
  sub: string;
  bubble: string;
  composer: string;
  border: string;
  btn: string;
  btnIcon: string;
  rule: string;
};

export const LIGHT: Theme = {
  dark: false,
  bg: "#FDFDFC",
  text: "#0D0D0D",
  sub: "#8F8F8C",
  bubble: "#F0F0EE",
  composer: "#FEFEFD",
  border: "rgba(13,13,13,0.09)",
  btn: "#0D0D0D",
  btnIcon: "#FDFDFC",
  rule: "rgba(13,13,13,0.14)",
};

export const DARK: Theme = {
  dark: true,
  bg: "#212121",
  text: "#ECECEC",
  sub: "#9A9A9A",
  bubble: "#303030",
  composer: "#303030",
  border: "rgba(255,255,255,0.07)",
  btn: "#ECECEC",
  btnIcon: "#171717",
  rule: "rgba(255,255,255,0.22)",
};

// ---------- Type ----------
export const F = {
  serif: "Instrument Serif",
  sans: "Geist",
  mono: "Geist Mono",
  hand: "Caveat",
};

export const fontsReady = Promise.all([
  loadFont({ family: F.serif, url: staticFile("fonts/instrument-serif-latin-400-italic.woff2"), style: "italic", weight: "400" }),
  loadFont({ family: F.serif, url: staticFile("fonts/instrument-serif-latin-400-normal.woff2"), style: "normal", weight: "400" }),
  loadFont({ family: F.sans, url: staticFile("fonts/Geist-Regular.woff2"), weight: "400" }),
  loadFont({ family: F.sans, url: staticFile("fonts/Geist-Medium.woff2"), weight: "500" }),
  loadFont({ family: F.sans, url: staticFile("fonts/Geist-SemiBold.woff2"), weight: "600" }),
  loadFont({ family: F.mono, url: staticFile("fonts/GeistMono-Regular.woff2"), weight: "400" }),
  loadFont({ family: F.mono, url: staticFile("fonts/GeistMono-Medium.woff2"), weight: "500" }),
  loadFont({ family: F.hand, url: staticFile("fonts/caveat-latin-500-normal.woff2"), weight: "500" }),
  loadFont({ family: F.hand, url: staticFile("fonts/caveat-latin-700-normal.woff2"), weight: "700" }),
]);
