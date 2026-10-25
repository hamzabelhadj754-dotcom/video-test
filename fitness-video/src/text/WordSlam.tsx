import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BLACK, DISPLAY_FONT, WHITE } from "../constants";
import { Card, LineStyle } from "../episode";

const EXIT_FRAMES = 6;
// Far enough along that every slam has fully settled.
const LANDED = 60;

// Width-fit for Anton: condensed caps average about half an em per glyph.
const fitSize = (text: string, max: number) =>
  Math.min(max, Math.floor(900 / (text.length * 0.5)));

const SlamWord: React.FC<{
  text: string;
  frame: number;
  style: LineStyle;
  size: number;
}> = ({ text, frame, style, size }) => {
  const { fps } = useVideoConfig();
  if (frame < 0) {
    return null;
  }
  const s = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 260, mass: 0.6 },
  });
  const scale = interpolate(s, [0, 1], [1.9, 1]);
  const blur = interpolate(frame, [0, 5], [16, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 2], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ghost = interpolate(frame, [0, 6], [16, 0], {
    extrapolateRight: "clamp",
  });
  const spacing = interpolate(s, [0, 1], [0.25, 0.03]);
  // Inverted block wipes in left-to-right just behind the word.
  const wipe = interpolate(frame, [0, 6], [100, 0], {
    extrapolateRight: "clamp",
  });
  const inverted = style === "inverted";
  return (
    <div
      style={{
        position: "relative",
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity,
        padding: inverted ? "0 26px" : 0,
      }}
    >
      {inverted && (
        <div
          style={{
            position: "absolute",
            inset: "8px 0 2px 0",
            background: WHITE,
            clipPath: `inset(0 ${wipe}% 0 0)`,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          fontFamily: DISPLAY_FONT,
          fontSize: size,
          lineHeight: 1.02,
          letterSpacing: `${spacing}em`,
          whiteSpace: "nowrap",
          color: inverted ? BLACK : style === "outline" ? "transparent" : WHITE,
          WebkitTextStroke: style === "outline" ? `4px ${WHITE}` : undefined,
          textShadow:
            style !== "solid"
              ? undefined
              : `${-ghost}px 0 rgba(255,255,255,0.35), ${ghost}px 0 rgba(255,255,255,0.35), 0 0 30px rgba(0,0,0,0.85)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const WordSlam: React.FC<{
  card: Card;
  toFrames: (beats: number) => number;
}> = ({ card, toFrames }) => {
  const frame = useCurrentFrame();
  const total = toFrames(card.length);
  const out = card.hold
    ? 0
    : interpolate(frame, [total - EXIT_FRAMES, total], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 14,
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 14}px)` : undefined,
        transform: `scale(${1 + out * 0.08})`,
      }}
    >
      {card.lines.map((l) => (
        <SlamWord
          key={l.text}
          text={l.text}
          frame={card.instant ? frame + LANDED : frame - toFrames(l.at)}
          style={l.style ?? "solid"}
          size={fitSize(l.text, 250)}
        />
      ))}
    </AbsoluteFill>
  );
};
