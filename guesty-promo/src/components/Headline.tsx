import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../brand";
import { ease } from "../anim";
import { Line, lineText } from "../copy";
import { useLayout } from "../layout";
import { ENTER } from "../timing";

export type CountSpec = { match: string; to: number; decimals?: number };

/** Animated number: counts during the entrance only, then holds the final value. */
export const countValue = (frame: number, to: number, decimals = 0) => {
  const v = to * ease(frame, 0, ENTER);
  return frame >= ENTER ? to.toFixed(decimals) : v.toFixed(decimals);
};

/**
 * Headline — 96–120px bold, -2% tracking. Lines slide up out of a mask with a 2-frame
 * stagger and are fully settled at frame ENTER (start of the hold).
 */
export const Headline: React.FC<{
  lines: readonly Line[];
  tone: "onLight" | "onDark";
  align?: "left" | "center";
  /** "top" = shared headline zone; "center" = vertically centred at layout.centerY. */
  position?: "top" | "center";
  size?: number;
  count?: CountSpec;
  delay?: number;
}> = ({ lines, tone, align = "left", position = "top", size, count, delay = 0 }) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const fontSize = size ?? L.headline.size;
  const base = tone === "onDark" ? colors.white : colors.forest;
  const accent = tone === "onDark" ? colors.mint : colors.primary;

  const renderText = (text: string) => {
    if (!count || !text.includes(count.match)) return text;
    const [before, after] = text.split(count.match);
    return (
      <>
        {before}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {countValue(frame - delay, count.to, count.decimals)}
        </span>
        {after}
      </>
    );
  };

  const block = (
    <div
      style={{
        fontFamily,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.0,
        letterSpacing: "-0.02em",
        textAlign: align,
        color: base,
      }}
    >
      {lines.map((line, i) => {
        const d = delay + Math.min(i * 2, 4);
        const p = ease(frame, d, ENTER - Math.min(i * 2, 4));
        const isAccent = typeof line !== "string" && line.accent;
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.04em" }}>
            <div
              style={{
                transform: `translateY(${(1 - p) * 105}%)`,
                opacity: Math.min(1, p * 1.6),
                color: isAccent ? accent : base,
                whiteSpace: "nowrap",
              }}
            >
              {renderText(lineText(line))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (position === "center") {
    return (
      <div
        style={{
          position: "absolute",
          left: L.safe.x0,
          width: L.safe.x1 - L.safe.x0,
          top: L.centerY,
          transform: "translateY(-50%)",
        }}
      >
        {block}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: L.safe.x0, width: L.safe.x1 - L.safe.x0, top: L.headline.top }}>
      {block}
    </div>
  );
};
