import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../brand";
import { ease, holdDrift, lerp } from "../anim";
import { STAGE_H, STAGE_W, useLayout } from "../layout";
import { TRANSITION } from "../timing";

export type Transition = "cut" | "sweep" | "wipeRight" | "wipeLeft" | "wipeUp" | "circle";

/**
 * Scene root: opaque background + entrance transition (hard cut or a 6–9 frame wipe).
 * The previous scene stays frozen underneath while the wipe runs (see Promo.tsx).
 */
export const SceneShell: React.FC<{
  bg: string;
  transition?: Transition;
  edge?: string;
  circleCenter?: { x: number; y: number };
  children: React.ReactNode;
}> = ({ bg, transition = "cut", edge = colors.primary, circleCenter, children }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const p = transition === "cut" ? 1 : ease(frame, 0, TRANSITION);
  const done = p >= 0.999;

  let clipPath: string | undefined;
  let edgeEl: React.ReactNode = null;
  const SKEW = W * 0.35;

  if (!done) {
    switch (transition) {
      case "sweep": {
        // diagonal reveal from left to right, with a brand-coloured band on the leading edge
        const x = lerp(p, -SKEW, W + 60);
        clipPath = `polygon(0 0, ${x + SKEW}px 0, ${x}px ${H}px, 0 ${H}px)`;
        const band = (w: number, offset: number, color: string) => (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: color,
              clipPath: `polygon(${x + SKEW + offset}px 0, ${x + SKEW + offset + w}px 0, ${x + offset + w}px ${H}px, ${x + offset}px ${H}px)`,
            }}
          />
        );
        edgeEl = (
          <>
            {band(70, 0, colors.mint)}
            {band(26, 70, edge)}
          </>
        );
        break;
      }
      case "wipeRight": {
        const x = p * W;
        clipPath = `inset(0 ${W - x}px 0 0)`;
        edgeEl = <div style={{ position: "absolute", top: 0, bottom: 0, left: x, width: 18, background: edge }} />;
        break;
      }
      case "wipeLeft": {
        const x = (1 - p) * W;
        clipPath = `inset(0 0 0 ${x}px)`;
        edgeEl = <div style={{ position: "absolute", top: 0, bottom: 0, left: x - 18, width: 18, background: edge }} />;
        break;
      }
      case "wipeUp": {
        const y = (1 - p) * H;
        clipPath = `inset(${y}px 0 0 0)`;
        edgeEl = <div style={{ position: "absolute", left: 0, right: 0, top: y - 18, height: 18, background: edge }} />;
        break;
      }
      case "circle": {
        const c = circleCenter ?? { x: W / 2, y: H / 2 };
        const r = p * Math.hypot(Math.max(c.x, W - c.x), Math.max(c.y, H - c.y));
        clipPath = `circle(${r}px at ${c.x}px ${c.y}px)`;
        edgeEl = (
          <div
            style={{
              position: "absolute",
              left: c.x - r - 10,
              top: c.y - r - 10,
              width: (r + 10) * 2,
              height: (r + 10) * 2,
              borderRadius: "50%",
              border: `20px solid ${edge}`,
              boxSizing: "border-box",
            }}
          />
        );
        break;
      }
      default:
        break;
    }
  }

  return (
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {edgeEl}
      <AbsoluteFill style={{ background: bg, clipPath, overflow: "hidden" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Soft radial glows that give flat backgrounds depth. */
export const Glow: React.FC<{ color: string; x: string; y: string; size: number; opacity?: number }> = ({
  color,
  x,
  y,
  size,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity,
    }}
  />
);

export const LightBackdrop: React.FC<{ tint?: string }> = ({ tint = colors.mint }) => (
  <AbsoluteFill>
    <Glow color={tint} x="88%" y="8%" size={1300} opacity={0.75} />
    <Glow color={colors.sand} x="5%" y="96%" size={1100} opacity={0.5} />
  </AbsoluteFill>
);

export const DarkBackdrop: React.FC = () => (
  <AbsoluteFill>
    <Glow color="rgba(13,158,136,0.45)" x="85%" y="12%" size={1400} />
    <Glow color="rgba(11,54,56,0.9)" x="10%" y="90%" size={1300} />
  </AbsoluteFill>
);

/**
 * 900x740 artboard for UI illustrations, scaled & centred into the layout's visual zone
 * (scale 1 in 9:16, ~0.85 in 1:1). Optional camera shake and hold drift.
 */
export const VisualStage: React.FC<{
  children: React.ReactNode;
  /** Number of headline lines above — the stage sits in the space left below them. */
  lines?: number;
  shake?: number;
  drift?: boolean;
  style?: React.CSSProperties;
}> = ({ children, lines = 3, shake = 0, drift = true, style }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const gap = L.format === "9x16" ? 70 : 40;
  const t = Math.min(L.visual.top, L.headline.top + lines * L.headline.size + gap);
  const b = L.visual.bottom;
  const s = Math.min((L.safe.x1 - L.safe.x0) / STAGE_W, (b - t) / STAGE_H);
  const left = (L.width - STAGE_W * s) / 2;
  const y = t + (b - t - STAGE_H * s) / 2;
  const d = drift ? holdDrift(frame, 0.015) : 1;
  const sx = shake ? Math.sin(frame * 1.9) * shake + Math.sin(frame * 4.3) * shake * 0.4 : 0;
  const sy = shake ? Math.cos(frame * 2.3) * shake * 0.8 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y,
        width: STAGE_W,
        height: STAGE_H,
        transformOrigin: "top left",
        transform: `translate(${sx}px, ${sy}px) scale(${s}) translate(${STAGE_W / 2}px, ${STAGE_H / 2}px) scale(${d}) translate(${-STAGE_W / 2}px, ${-STAGE_H / 2}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
