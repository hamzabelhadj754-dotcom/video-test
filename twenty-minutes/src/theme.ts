import { continueRender, delayRender, Easing } from "remotion";
import { ARCHIVO_B64, JBMONO_B64 } from "./fonts.generated";

export const C = {
  bg: "#0A0A0B", // studio near-black (never #000)
  bgLift: "#15110E", // warm light pool behind the hero
  ink: "#EDEBE6", // warm off-white (never #FFF)
  work: "#FF5B1F", // heat orange = effort. Used rarely.
  rest: "#5E5E63", // cool grey = rest / secondary
  line: "#26262A", // tracks, rulers, inactive UI
  lineSoft: "#1A1A1D",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const MARGIN = 96;

// ── Type ─────────────────────────────────────────────────────────────────────
export const DISPLAY = "Archivo Display";
export const MONO = "JB Mono";

// Fonts are embedded as data URIs: no network fetch, nothing to hang in a render tab.
if (typeof document !== "undefined" && !document.getElementById("tm-fonts")) {
  const st = document.createElement("style");
  st.id = "tm-fonts";
  st.textContent = `
@font-face{font-family:"${DISPLAY}";src:url(data:font/woff2;base64,${ARCHIVO_B64}) format("woff2");font-weight:100 900;font-stretch:62% 125%;font-display:block}
@font-face{font-family:"${MONO}";src:url(data:font/woff2;base64,${JBMONO_B64}) format("woff2");font-weight:100 800;font-display:block}`;
  document.head.appendChild(st);
  const handle = delayRender("Embedded fonts", { timeoutInMilliseconds: 60000 });
  Promise.all([document.fonts.load(`900 100px "${DISPLAY}"`), document.fonts.load(`500 30px "${MONO}"`)])
    .then(() => document.fonts.ready)
    .finally(() => continueRender(handle));
}

// Wide, heavy display voice: Archivo at full expansion.
export const display = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: 900,
  fontStretch: "125%",
  fontSize: size,
  lineHeight: 0.86,
  letterSpacing: "-0.02em",
  fontFeatureSettings: '"tnum" 1',
  color: C.ink,
  ...extra,
});

export const mono = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.ink,
  ...extra,
});

// ── Motion personality ───────────────────────────────────────────────────────
// Fast out, long soft settle. No overshoot, no bounce.
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // entrances
  settle: Easing.bezier(0.22, 0.9, 0.2, 1), // type landing
  whip: Easing.bezier(0.75, 0, 0.12, 1), // camera whips / transitions
  inOut: Easing.bezier(0.6, 0, 0.3, 1), // body motion
  in: Easing.bezier(0.55, 0, 0.9, 0.4), // exits
};
