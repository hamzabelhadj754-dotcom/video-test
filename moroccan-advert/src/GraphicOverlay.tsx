import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";
import { ARABIC_FONT } from "./arabicFont";
import { SWEEP_FRAMES } from "./constants";

/* ─────────────────────────────────────────────────────────
   Persistent overlays
───────────────────────────────────────────────────────── */

const WarmGrade: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(155deg, rgba(255,170,50,0.055) 0%, rgba(200,55,130,0.04) 100%)",
    }}
  />
);

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 48%, transparent 38%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);

const BottomGradient: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 440,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
    }}
  />
);

const TopGradient: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      background:
        "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
    }}
  />
);

/* ─────────────────────────────────────────────────────────
   Corner brackets — animated in on start
───────────────────────────────────────────────────────── */

const CornerBracket: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  progress: number;
}> = ({ corner, progress }) => {
  const isTop = corner[0] === "t";
  const isLeft = corner[1] === "l";
  const SIZE = 46;
  const THICKNESS = 3;
  const COLOR = "rgba(255,208,0,0.85)";
  const EDGE = 28;

  const hScale = interpolate(progress, [0, 0.6], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vScale = interpolate(progress, [0.3, 1], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        [isTop ? "top" : "bottom"]: EDGE,
        [isLeft ? "left" : "right"]: EDGE,
        width: SIZE,
        height: SIZE,
      }}
    >
      {/* horizontal bar */}
      <div
        style={{
          position: "absolute",
          [isTop ? "top" : "bottom"]: 0,
          [isLeft ? "left" : "right"]: 0,
          width: SIZE,
          height: THICKNESS,
          background: COLOR,
          boxShadow: `0 0 6px rgba(255,208,0,0.5)`,
          transformOrigin: isLeft ? "left center" : "right center",
          transform: `scaleX(${hScale})`,
        }}
      />
      {/* vertical bar */}
      <div
        style={{
          position: "absolute",
          [isTop ? "top" : "bottom"]: 0,
          [isLeft ? "left" : "right"]: 0,
          width: THICKNESS,
          height: SIZE,
          background: COLOR,
          boxShadow: `0 0 6px rgba(255,208,0,0.5)`,
          transformOrigin: isTop ? "center top" : "center bottom",
          transform: `scaleY(${vScale})`,
        }}
      />
    </div>
  );
};

const CornerBrackets: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame, config: { damping: 20, stiffness: 200, mass: 0.7 }, from: 0, to: 1 });

  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <CornerBracket key={c} corner={c} progress={s} />
      ))}
    </>
  );
};

/* ─────────────────────────────────────────────────────────
   Top brand badge
───────────────────────────────────────────────────────── */

const TopBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame, config: { damping: 24, stiffness: 230, mass: 0.6 }, from: 0, to: 1 });

  return (
    <div
      style={{
        position: "absolute",
        top: 58,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [-26, 0])}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(8,5,0,0.65)",
          border: "1.5px solid rgba(255,208,0,0.35)",
          borderRadius: 50,
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 10,
          paddingBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          direction: "rtl",
        }}
      >
        <Dot />
        <span
          style={{
            fontFamily: ARABIC_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: 0.5,
          }}
        >
          الراحة والأناقة
        </span>
        <Dot />
      </div>
    </div>
  );
};

const Dot: React.FC = () => (
  <div
    style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#FFD000",
      boxShadow: "0 0 8px rgba(255,208,0,0.75)",
      flexShrink: 0,
    }}
  />
);

/* ─────────────────────────────────────────────────────────
   Opening flash (camera-on feel)
───────────────────────────────────────────────────────── */

const OpeningFlash: React.FC = () => {
  const frame = useCurrentFrame(); // 0–9 inside its Sequence
  const opacity = interpolate(frame, [0, 1, 5, 9], [0.75, 0.55, 0.08, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity }}
    />
  );
};

/* ─────────────────────────────────────────────────────────
   Sweep line — professional transition between caption groups
───────────────────────────────────────────────────────── */

const SweepLine: React.FC = () => {
  const frame = useCurrentFrame(); // 0–9 inside its Sequence
  const { width } = useVideoConfig();

  const x = interpolate(frame, [0, 9], [width + 60, -90], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Primary glowing bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: x,
          width: 5,
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(255,220,0,0.95) 15%, #FFFFFF 50%, rgba(255,220,0,0.95) 85%, transparent 100%)",
          boxShadow:
            "0 0 18px rgba(255,215,0,0.7), 0 0 36px rgba(255,215,0,0.35)",
        }}
      />
      {/* Secondary soft halo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: x - 24,
          width: 52,
          background:
            "linear-gradient(to right, transparent, rgba(255,215,0,0.12), rgba(255,255,255,0.06), transparent)",
        }}
      />
    </>
  );
};

/* ─────────────────────────────────────────────────────────
   Subtle mid-screen divider line (always visible after reveal)
───────────────────────────────────────────────────────── */

const DividerLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - 8, config: { damping: 22, stiffness: 220, mass: 0.5 }, from: 0, to: 1 });

  return (
    <div
      style={{
        position: "absolute",
        top: "52%",
        left: "50%",
        transform: `translate(-50%, -50%) scaleX(${s})`,
        marginTop: -62,
        width: 200,
        height: 1,
        background:
          "linear-gradient(to right, transparent, rgba(255,208,0,0.5), transparent)",
        transformOrigin: "center",
        opacity: interpolate(s, [0, 1], [0, 0.7]),
      }}
    />
  );
};

/* ─────────────────────────────────────────────────────────
   Root export
───────────────────────────────────────────────────────── */

export const GraphicOverlay: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <WarmGrade />
      <Vignette />
      <TopGradient />
      <BottomGradient />
      <CornerBrackets />
      <TopBrand />
      <DividerLine />

      {/* Opening flash — 10 frames */}
      <Sequence from={0} durationInFrames={10} layout="none">
        <OpeningFlash />
      </Sequence>

      {/* Sweep at every caption group boundary */}
      {SWEEP_FRAMES.map((sf) => (
        <Sequence key={sf} from={sf} durationInFrames={10} layout="none">
          <SweepLine />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
