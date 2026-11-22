import React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import T from "./timeline.json";

export const fontFamily = "Manrope";
for (const w of ["300", "400", "500", "600", "700", "800"]) {
  loadFont({
    family: fontFamily,
    url: staticFile(`fonts/manrope-latin-${w}-normal.woff2`),
    weight: w,
  });
}

export const C = {
  bg0: "#0A0A0A",
  bg1: "#2B2B2E",
  card: "#1C1C1F",
  card2: "#26262A",
  line: "rgba(255,255,255,0.08)",
  violet: "#7C5CFF",
  mint: "#3DDC97",
  coral: "#FF5A5F",
  white: "#FFFFFF",
  grey: "#B4BCD6",
};

export const EV = T.events;
export const SC = T.scenes;

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 progress between start and start+dur (frames), clamped + eased. */
export const p = (f: number, start: number, dur: number, easing = EASE) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const euro = (n: number) => "€" + Math.round(n).toLocaleString("en-GB");

/** Standard scene enter / exit (local frames). */
export const sceneMotion = (
  f: number,
  dur: number,
  opts: { from?: "right" | "left" | "scale" | "none"; to?: "left" | "right" | "scale" | "none" } = {},
) => {
  const { from = "scale", to = "left" } = opts;
  const i = from === "none" ? 1 : p(f, 3, 16);
  const o = to === "none" ? 0 : p(f, dur, 9);
  let x = 0;
  let s = 1;
  if (from === "right") x += (1 - i) * 160;
  if (from === "left") x -= (1 - i) * 160;
  if (from === "scale") s *= lerp(1.06, 1, i);
  if (to === "left") x -= o * 200;
  if (to === "right") x += o * 200;
  if (to === "scale") s *= lerp(1, 0.94, o);
  return {
    opacity: i * (1 - o),
    transform: `translateX(${x}px) scale(${s})`,
    filter: o > 0.01 || i < 0.99 ? `blur(${(1 - i) * 6 + o * 6}px)` : undefined,
  };
};

export const font = (size: number, weight = 600, color: string = C.white): React.CSSProperties => ({
  fontFamily,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.08,
  letterSpacing: size > 50 ? "-0.035em" : "-0.01em",
});

/* ---------- icons ---------- */
export const Check: React.FC<{ size?: number; color?: string; draw?: number; width?: number }> = ({
  size = 24,
  color = C.white,
  draw = 1,
  width = 2.6,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={22}
      strokeDashoffset={22 * (1 - draw)}
    />
  </svg>
);

export const DocIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M7 3h7l4 4v14H7z" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <path d="M10 12h5M10 16h5" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

/* ---------- logo ---------- */
export const LogoMark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: "linear-gradient(150deg, #9A82FF 0%, #7C5CFF 48%, #6A47F5 100%)",
      boxShadow: `0 ${size * 0.12}px ${size * 0.5}px rgba(124,92,255,${0.5 * glow}), inset 0 1.5px 0 rgba(255,255,255,0.35)`,
      position: "relative",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: size * 0.19,
        width: size * 0.16,
        height: size * 0.16,
        marginLeft: -size * 0.08,
        borderRadius: "50%",
        background: "#fff",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: size * 0.42,
        width: size * 0.16,
        height: size * 0.4,
        marginLeft: -size * 0.08,
        borderRadius: size * 0.08,
        background: "#fff",
      }}
    />
  </div>
);

export const Logo: React.FC<{ size: number; glow?: number }> = ({ size, glow }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
    <LogoMark size={size} glow={glow} />
    <div style={{ ...font(size * 0.92, 700), letterSpacing: "-0.04em", lineHeight: 1 }}>Invoza</div>
  </div>
);

/* ---------- text ---------- */
export const RevealLine: React.FC<{
  f: number;
  start: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ f, start, children, style }) => {
  const t = p(f, start, 20);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
      <div style={{ transform: `translateY(${(1 - t) * 110}%)`, opacity: t, ...style }}>{children}</div>
    </div>
  );
};

export const Eyebrow: React.FC<{ f: number; start: number; text: string; dot: string }> = ({
  f,
  start,
  text,
  dot,
}) => {
  const t = p(f, start, 18);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: t,
        transform: `translateX(${(1 - t) * -24}px)`,
        marginBottom: 30,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, background: dot, boxShadow: `0 0 18px ${dot}` }} />
      <div style={{ ...font(24, 700, C.grey), letterSpacing: "0.2em" }}>{text}</div>
    </div>
  );
};

/** Graphite UI card */
export const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "linear-gradient(180deg, #212125 0%, #1C1C1F 100%)",
  borderRadius: 22,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(0,0,0,0.4)",
  ...extra,
});

/** Big floating card (outside the phone) */
export const floatCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "linear-gradient(180deg, rgba(36,36,40,0.96) 0%, rgba(28,28,31,0.96) 100%)",
  borderRadius: 32,
  boxShadow:
    "inset 0 1.5px 0 rgba(255,255,255,0.09), 0 0 0 1px rgba(255,255,255,0.05), 0 50px 100px -20px rgba(0,0,0,0.75)",
  ...extra,
});

export const Avatar: React.FC<{ text: string; size?: number; tint?: string }> = ({
  text,
  size = 48,
  tint = "rgba(124,92,255,0.28)",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: tint,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...font(size * 0.36, 700),
      letterSpacing: 0,
    }}
  >
    {text}
  </div>
);
