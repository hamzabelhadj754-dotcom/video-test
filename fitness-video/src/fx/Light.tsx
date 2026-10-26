import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF, WHITE } from "../constants";

const STREAK_FRAMES = 12;
const BURN_FRAMES = 14;

// Anamorphic light streak flaring across the frame on each bass hit.
export const LightStreaks: React.FC<{ frames: number[] }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const hit = frames.find(
    (f) => f > 0 && frame >= f && frame < f + STREAK_FRAMES,
  );
  if (hit === undefined) {
    return null;
  }
  const d = frame - hit;
  const grow = interpolate(d, [0, 4], [0.2, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(d, [2, STREAK_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
  });
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: fade }}>
      <div
        style={{
          position: "absolute",
          top: height / 2 - 160,
          left: "50%",
          width: 1600 * grow,
          height: 320,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.35), transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: height / 2 - 2,
          left: "50%",
          width: 1400 * grow,
          height: 4,
          transform: "translateX(-50%)",
          background:
            "linear-gradient(to right, transparent, white 35%, white 65%, transparent)",
          filter: "blur(1.5px)",
        }}
      />
    </AbsoluteFill>
  );
};

// Soft film-burn: a wash of light sweeping across at section changes.
export const FilmBurns: React.FC<{ frames: number[] }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const hit = frames.find(
    (f) => f > 0 && frame >= f - 4 && frame < f + BURN_FRAMES,
  );
  if (hit === undefined) {
    return null;
  }
  const d = frame - (hit - 4);
  const x = interpolate(d, [0, BURN_FRAMES + 4], [-0.6, 1.2]) * width;
  const peak = interpolate(d, [0, 4, BURN_FRAMES + 4], [0, 0.75, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: peak }}>
      <div
        style={{
          position: "absolute",
          top: -200,
          left: x - 500,
          width: 1000,
          height: 2400,
          transform: "rotate(14deg)",
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};

// Small italic timestamp under the top bar; each new time fades through blur.
export const Clock: React.FC<{ times: { frame: number; label: string }[] }> = ({
  times,
}) => {
  const frame = useCurrentFrame();
  const current =
    [...times].reverse().find((t) => frame >= t.frame) ?? times[0];
  const since = frame - current.frame;
  const t =
    current.frame === 0
      ? 1
      : interpolate(since, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 168,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 34,
        letterSpacing: "0.12em",
        color: WHITE,
        opacity: 0.75 * t,
        filter: t < 1 ? `blur(${(1 - t) * 6}px)` : undefined,
      }}
    >
      {current.label}
    </div>
  );
};
