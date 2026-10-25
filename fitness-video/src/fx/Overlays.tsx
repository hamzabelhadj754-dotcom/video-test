import React from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LABEL_FONT, WHITE } from "../constants";

const GLITCH_LENGTH = 4;

export const glitchProgress = (frame: number, cutFrames: number[]) => {
  for (const f of cutFrames) {
    const d = frame - f;
    if (f > 0 && d >= 0 && d < GLITCH_LENGTH) {
      return 1 - d / GLITCH_LENGTH;
    }
  }
  return 0;
};

// Monochrome ghost-split for the footage layer on each cut (no colour fringing).
export const GhostSplitFilter: React.FC<{ offset: number }> = ({ offset }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="ghostsplit" x="-5%" y="0" width="110%" height="100%">
      <feOffset in="SourceGraphic" dx={offset} result="right" />
      <feOffset in="SourceGraphic" dx={-offset} result="left" />
      <feBlend in="right" in2="left" mode="lighten" result="ghost" />
      <feComponentTransfer in="ghost" result="dim">
        <feFuncA type="linear" slope={0.55} />
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="dim" mode="lighten" />
    </filter>
  </svg>
);

export const GlitchBars: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  if (progress === 0) {
    return null;
  }
  return (
    <AbsoluteFill style={{ mixBlendMode: "difference" }}>
      {new Array(6).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: random(`gy-${frame}-${i}`) * height,
            left: (random(`gx-${frame}-${i}`) * 2 - 1) * 140 * progress,
            width: "100%",
            height: 6 + random(`gh-${frame}-${i}`) * 60,
            background: "white",
            opacity: progress * 0.9,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Crushed edges so the eye locks on the centre text.
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 50% 48%, transparent 28%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.92) 100%)",
    }}
  />
);

export const Flicker: React.FC = () => {
  const frame = useCurrentFrame();
  const dip =
    random(`flicker-${frame}`) > 0.92 ? 0.16 : random(`fl-${frame}`) * 0.05;
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: dip }} />;
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.35 }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 540 960"
        preserveAspectRatio="none"
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={frame % 60}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="540" height="960" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const BAR_HEIGHT = 120;

// Static cinema bars: open from frame 0 so the hook is visible immediately.
export const Letterbox: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        background: "black",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        background: "black",
      }}
    />
  </>
);

// Brand mark in the lower third, clear of TikTok/Reels UI at the very bottom.
export const Wordmark: React.FC<{ series: string; number: number }> = ({
  series,
  number,
}) => {
  const rule: React.CSSProperties = {
    width: 70,
    height: 2,
    background: WHITE,
    opacity: 0.7,
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 1390 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div style={rule} />
        <div
          style={{
            fontFamily: LABEL_FONT,
            fontSize: 34,
            letterSpacing: "0.55em",
            marginRight: "-0.55em",
            color: WHITE,
          }}
        >
          GAINS DOM
        </div>
        <div style={rule} />
      </div>
      <div
        style={{
          fontFamily: LABEL_FONT,
          fontSize: 22,
          letterSpacing: "0.5em",
          marginRight: "-0.5em",
          marginTop: 12,
          color: WHITE,
          opacity: 0.6,
        }}
      >
        {series} #{String(number).padStart(3, "0")}
      </div>
    </AbsoluteFill>
  );
};

// White pop on the song's bass hits.
export const AccentFlash: React.FC<{ frames: number[] }> = ({ frames }) => {
  const frame = useCurrentFrame();
  let opacity = 0;
  for (const f of frames) {
    const d = frame - f;
    if (f > 0 && d >= 0 && d < 4) {
      opacity = Math.max(opacity, 0.7 * (1 - d / 4));
    }
  }
  return opacity > 0 ? (
    <AbsoluteFill style={{ backgroundColor: "white", opacity }} />
  ) : null;
};
