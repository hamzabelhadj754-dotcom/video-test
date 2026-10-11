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
   Persistent colour overlays
───────────────────────────────────────────────────────── */

const WarmGrade: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(150deg, rgba(255,160,50,0.06) 0%, rgba(200,50,130,0.04) 100%)",
    }}
  />
);

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.48) 100%)",
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
      height: 420,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
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
      height: 180,
      background:
        "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 100%)",
    }}
  />
);

/* ─────────────────────────────────────────────────────────
   Animated corner brackets
───────────────────────────────────────────────────────── */

const CornerBracket: React.FC<{
  corner: "tl" | "tr" | "bl" | "br";
  progress: number;
}> = ({ corner, progress }) => {
  const isTop = corner[0] === "t";
  const isLeft = corner[1] === "l";
  const SIZE = 44;
  const T = 3;
  const COLOR = "rgba(255,208,0,0.82)";
  const EDGE = 30;

  const hP = interpolate(progress, [0, 0.55], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const vP = interpolate(progress, [0.28, 1], [0, 1], {
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
      <div
        style={{
          position: "absolute",
          [isTop ? "top" : "bottom"]: 0,
          [isLeft ? "left" : "right"]: 0,
          width: SIZE,
          height: T,
          background: COLOR,
          boxShadow: "0 0 5px rgba(255,208,0,0.45)",
          transformOrigin: isLeft ? "left center" : "right center",
          transform: `scaleX(${hP})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          [isTop ? "top" : "bottom"]: 0,
          [isLeft ? "left" : "right"]: 0,
          width: T,
          height: SIZE,
          background: COLOR,
          boxShadow: "0 0 5px rgba(255,208,0,0.45)",
          transformOrigin: isTop ? "center top" : "center bottom",
          transform: `scaleY(${vP})`,
        }}
      />
    </div>
  );
};

const CornerBrackets: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    fps,
    frame,
    config: { damping: 20, stiffness: 190, mass: 0.7 },
    from: 0,
    to: 1,
  });
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

const GoldDot: React.FC = () => (
  <div
    style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#FFD000",
      boxShadow: "0 0 7px rgba(255,208,0,0.8)",
      flexShrink: 0,
    }}
  />
);

const TopBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    fps,
    frame,
    config: { damping: 24, stiffness: 230, mass: 0.6 },
    from: 0,
    to: 1,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [-28, 0])}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(8,5,0,0.62)",
          border: "1.5px solid rgba(255,208,0,0.32)",
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
        <GoldDot />
        <span
          style={{
            fontFamily: ARABIC_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: 0.4,
          }}
        >
          الراحة والأناقة
        </span>
        <GoldDot />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Opening flash
───────────────────────────────────────────────────────── */

const OpeningFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 1, 5, 9], [0.72, 0.5, 0.07, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity }}
    />
  );
};

/* ─────────────────────────────────────────────────────────
   Gold sweep line (transition between caption groups)
───────────────────────────────────────────────────────── */

const SweepLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const x = interpolate(frame, [0, 9], [width + 60, -90], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: "clamp",
  });

  return (
    <>
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
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: x - 26,
          width: 56,
          background:
            "linear-gradient(to right, transparent, rgba(255,215,0,0.1), rgba(255,255,255,0.05), transparent)",
        }}
      />
    </>
  );
};

/* ─────────────────────────────────────────────────────────
   Sliding highlight badge
   Smooth card that slides in from the right with spring physics,
   inspired by the reference video's clean card-reveal style.
   Each badge matches the active caption group's key phrase.
───────────────────────────────────────────────────────── */

type BadgeConfig = {
  text: string;
  startFrame: number;
  holdFrames: number;
  yPos: number;
};

const BADGES: BadgeConfig[] = [
  // Group 1 (0–43f): الراحة والأناقة في قلب دارك
  { text: "الراحة والأناقة", startFrame: 6,   holdFrames: 34, yPos: 248 },
  // Group 2 (52–115f): صالون مخدوم باش يعطيك
  { text: "صالون مخدوم",    startFrame: 58,  holdFrames: 50, yPos: 248 },
  // Group 3 (116–146f): لمسة عصرية وراقية
  { text: "عصرية وراقية",   startFrame: 120, holdFrames: 24, yPos: 248 },
  // Group 4 (155–187f): بالجودة لي كتستاهله
  { text: "بالجودة",        startFrame: 158, holdFrames: 28, yPos: 248 },
];

const FADE_OUT_FRAMES = 10;

const HighlightBadge: React.FC<{ cfg: BadgeConfig }> = ({ cfg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 200, mass: 0.75 },
    from: 0,
    to: 1,
  });

  const exitOpacity = interpolate(
    frame,
    [cfg.holdFrames - FADE_OUT_FRAMES, cfg.holdFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideX = interpolate(enterSpring, [0, 1], [180, 0]);
  const scale = interpolate(enterSpring, [0, 1], [0.88, 1]);
  const opacity = Math.min(enterSpring * 3, 1) * exitOpacity;

  return (
    <div
      style={{
        position: "absolute",
        right: 24,
        top: cfg.yPos,
        transform: `translateX(${slideX}px) scale(${scale})`,
        transformOrigin: "right center",
        opacity,
        background: "rgba(8,5,2,0.80)",
        border: "1.5px solid rgba(255,208,0,0.50)",
        borderRadius: 44,
        paddingLeft: 20,
        paddingRight: 24,
        paddingTop: 10,
        paddingBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        direction: "rtl",
        boxShadow: "0 6px 28px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,208,0,0.15)",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#FFD000",
          boxShadow: "0 0 8px rgba(255,208,0,1)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: ARABIC_FONT,
          fontSize: 22,
          fontWeight: 900,
          color: "#FFFFFF",
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
        }}
      >
        {cfg.text}
      </span>
    </div>
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

      {/* Opening camera-flash */}
      <Sequence from={0} durationInFrames={10} layout="none">
        <OpeningFlash />
      </Sequence>

      {/* Gold sweep at each caption group boundary */}
      {SWEEP_FRAMES.map((sf) => (
        <Sequence key={sf} from={sf} durationInFrames={10} layout="none">
          <SweepLine />
        </Sequence>
      ))}

      {/* Sliding highlight badges — smooth card-reveal style */}
      {BADGES.map((cfg) => (
        <Sequence
          key={cfg.startFrame}
          from={cfg.startFrame}
          durationInFrames={cfg.holdFrames}
          layout="none"
        >
          <HighlightBadge cfg={cfg} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
