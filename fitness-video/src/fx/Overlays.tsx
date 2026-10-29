import React from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF, WHITE } from "../constants";

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
    random(`flicker-${frame}`) > 0.95 ? 0.1 : random(`fl-${frame}`) * 0.04;
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: dip }} />;
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.3 }}>
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

// Quiet brand mark in the lower third, clear of TikTok/Reels UI at the bottom.
export const Wordmark: React.FC<{ series: string; number: number }> = ({
  series,
  number,
}) => (
  <AbsoluteFill style={{ alignItems: "center", top: 1400 }}>
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "0.6em",
        marginRight: "-0.6em",
        color: WHITE,
        opacity: 0.8,
      }}
    >
      GAINS DOM
    </div>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 22,
        letterSpacing: "0.15em",
        marginTop: 8,
        color: WHITE,
        opacity: 0.5,
      }}
    >
      {series.toLowerCase()} · {String(number).padStart(3, "0")}
    </div>
  </AbsoluteFill>
);

// Soft white pop on the song's bass hits.
export const AccentFlash: React.FC<{ frames: number[] }> = ({ frames }) => {
  const frame = useCurrentFrame();
  let opacity = 0;
  for (const f of frames) {
    const d = frame - f;
    if (f > 0 && d >= 0 && d < 4) {
      opacity = Math.max(opacity, 0.3 * (1 - d / 4));
    }
  }
  return opacity > 0 ? (
    <AbsoluteFill style={{ backgroundColor: "white", opacity }} />
  ) : null;
};

// Hairline under the top bar that fills across the video: a quiet cue that
// the reel is worth watching to the end.
export const ProgressLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: BAR_HEIGHT,
        left: 0,
        height: 2,
        width: (width * (frame + 1)) / durationInFrames,
        background: WHITE,
        opacity: 0.55,
      }}
    />
  );
};
