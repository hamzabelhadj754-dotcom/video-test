import React from "react";
import { AbsoluteFill, interpolateColors, random, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../brand";
import { ease, lerp } from "../anim";
import { Line, lineText } from "../copy";
import { countValue, CountSpec } from "../components/Headline";
import { GLASS_FILL } from "../components/UI";
import { useLayout } from "../layout";
import { ENTER } from "../timing";

/* ------------------------------------------------------------------ background */

type Palette = { base: string; blobs: [string, string, string, string, string] };

// blob order: top-left, top-right, bottom-left, bottom-right, centre. Tops stay darker so white text reads.
const WHITE: Palette = { base: "#FBF8F5", blobs: ["#FFFFFF", "#FDEDEA", "#FFFFFF", "#F7F5F2", "#FFF4F1"] };
const CHAOS: Palette = { base: "#E25A58", blobs: ["#C93A4C", "#B23A5A", "#FBA08A", "#F7C2A8", "#EE6A5E"] };
const FREEZE: Palette = { base: "#2A0E19", blobs: ["#5F1632", "#7A2A3B", "#1A2B28", "#3B1424", "#4A1A2A"] };
const CALM: Palette = { base: "#0D9E88", blobs: ["#006B5B", "#0A8F7A", "#BFEDE3", "#E3F7C5", "#1FA58E"] };
const PROOF: Palette = { base: "#072C23", blobs: ["#007A67", "#0B3638", "#14665F", "#0D9E88", "#04201A"] };
const SKY: Palette = { base: "#2BAE97", blobs: ["#006B5B", "#0A8F7A", "#D5F2F2", "#EEFAD0", "#3DB89F"] };

/** Global-frame keyframes; ~8-frame colour moves happen during scene transitions. */
const STOPS: [number, Palette][] = [
  [0, WHITE], [9, CHAOS], [108, CHAOS], [116, FREEZE], [162, FREEZE], [170, CALM],
  [594, CALM], [602, PROOF], [756, PROOF], [764, CALM], [810, CALM], [818, SKY],
];

const BLOB_POS: [number, number, number][] = [
  [16, 6, 0.95], [90, 14, 0.85], [6, 90, 0.95], [94, 94, 0.9], [52, 55, 0.7],
];

/** Soft, drifting mesh gradient behind every scene (render at composition level, global frame). */
export const MeshBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const input = STOPS.map(([f]) => f);
  const pick = (get: (p: Palette) => string) => interpolateColors(frame, input, STOPS.map(([, p]) => get(p)));
  const base = pick((p) => p.base);
  const size = Math.max(width, height);
  const layers = BLOB_POS.map(([x, y, s], i) => {
    const c = pick((p) => p.blobs[i]);
    const dx = Math.sin(frame / 80 + i * 1.7) * 7;
    const dy = Math.cos(frame / 95 + i * 2.3) * 6;
    return `radial-gradient(circle ${size * s * 0.62}px at ${x + dx}% ${y + dy}%, ${c} 0%, transparent 100%)`;
  });
  return <AbsoluteFill style={{ background: [...layers, base].join(", ") }} />;
};

/* ------------------------------------------------------------------ entrances */

/** Blur-in entrance (opacity + blur + rise + slight scale). */
export const blurIn = (frame: number, delay: number, duration = ENTER - delay, rise = 24): React.CSSProperties => {
  const p = ease(frame, delay, duration);
  return {
    opacity: Math.min(1, p * 1.4),
    filter: p < 0.999 ? `blur(${(1 - p) * 16}px)` : undefined,
    transform: `translateY(${(1 - p) * rise}px) scale(${lerp(p, 0.94, 1)})`,
  };
};

export const BlurIn: React.FC<{ delay?: number; duration?: number; rise?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  delay = 0,
  duration,
  rise,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  return <div style={{ ...style, ...blurIn(frame, delay, duration ?? ENTER - delay, rise) }}>{children}</div>;
};

/* ------------------------------------------------------------------ headline */

/**
 * Word-by-word blur reveal (the reference's signature move). All words are settled by
 * frame `delay + ENTER`, so the 45-frame hold is fully still.
 */
export const SoftHeadline: React.FC<{
  lines: readonly Line[];
  position?: "top" | "center";
  align?: "left" | "center";
  size?: number;
  weight?: number;
  accentWeight?: number;
  count?: CountSpec;
  delay?: number;
  color?: string;
}> = ({ lines, position = "top", align = "left", size, weight = 500, accentWeight = 800, count, delay = 0, color = colors.white }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const fontSize = size ?? L.headline.size;
  const words = lines.flatMap((l, li) => lineText(l).split(" ").map((w) => ({ w, li })));
  const n = words.length;
  const step = n > 1 ? Math.min(1.5, 3 / (n - 1)) : 0;
  let wi = 0;

  const block = (
    <div style={{ fontFamily, fontSize, lineHeight: 1.04, letterSpacing: "-0.025em", color, textAlign: align, textShadow: "0 6px 40px rgba(0,0,0,0.12)" }}>
      {lines.map((line, li) => {
        const accent = typeof line !== "string" && line.accent;
        return (
          <div key={li} style={{ whiteSpace: "nowrap", fontWeight: accent ? accentWeight : weight }}>
            {words
              .filter((x) => x.li === li)
              .map(({ w }, k) => {
                const i = wi++;
                const d = delay + i * step;
                const p = ease(frame, d, ENTER - (d - delay));
                const jitter = (random(`w${i}`) - 0.5) * 0.5;
                let content: React.ReactNode = w;
                if (count && w.includes(count.match)) {
                  const [a, b] = w.split(count.match);
                  content = (
                    <>
                      {a}
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{countValue(frame - delay, count.to, count.decimals)}</span>
                      {b}
                    </>
                  );
                }
                return (
                  <span
                    key={k}
                    style={{
                      display: "inline-block",
                      marginRight: "0.24em",
                      opacity: Math.min(1, p * 1.5),
                      filter: p < 0.999 ? `blur(${(1 - p) * 18}px)` : undefined,
                      transform: `translateY(${(1 - p) * (0.3 + jitter)}em) scale(${lerp(p, 0.9, 1)})`,
                    }}
                  >
                    {content}
                  </span>
                );
              })}
          </div>
        );
      })}
    </div>
  );

  const box: React.CSSProperties = { position: "absolute", left: L.safe.x0, width: L.safe.x1 - L.safe.x0 };
  return position === "center" ? (
    <div style={{ ...box, top: L.centerY, transform: "translateY(-50%)" }}>{block}</div>
  ) : (
    <div style={{ ...box, top: L.headline.top }}>{block}</div>
  );
};

/* ------------------------------------------------------------------ glass pill */

export const GlassPill: React.FC<{ children: React.ReactNode; fontSize: number; dark?: boolean; style?: React.CSSProperties }> = ({
  children,
  fontSize,
  dark,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: fontSize * 0.45,
      padding: `${fontSize * 0.55}px ${fontSize * 1.0}px`,
      borderRadius: 999,
      background: dark ? "rgba(7,44,35,0.92)" : GLASS_FILL,
      border: dark ? "2px solid rgba(255,255,255,0.12)" : "2px solid rgba(255,255,255,0.9)",
      boxShadow: dark ? "0 24px 60px rgba(4,32,26,0.35)" : "0 24px 60px rgba(7,44,35,0.18)",
      color: dark ? colors.white : colors.forest,
      fontFamily,
      fontSize,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);
