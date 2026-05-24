import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ARABIC_FONT } from "./arabicFont";

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.38) 100%)",
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
        "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)",
    }}
  />
);

const WarmTone: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(160deg, rgba(255,180,60,0.05) 0%, rgba(200,60,140,0.04) 100%)",
    }}
  />
);

const TopBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ fps, frame, config: { damping: 24, stiffness: 230, mass: 0.6 }, from: 0, to: 1 });
  const translateY = interpolate(s, [0, 1], [-24, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: s,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(12,8,4,0.62)",
          border: "1.5px solid rgba(255,208,0,0.38)",
          borderRadius: 50,
          paddingLeft: 30,
          paddingRight: 30,
          paddingTop: 11,
          paddingBottom: 11,
          display: "flex",
          alignItems: "center",
          gap: 12,
          direction: "rtl",
        }}
      >
        <GoldDot />
        <span
          style={{
            fontFamily: ARABIC_FONT,
            fontSize: 26,
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

const GoldDot: React.FC = () => (
  <div
    style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#FFD000",
      boxShadow: "0 0 7px rgba(255,208,0,0.75)",
      flexShrink: 0,
    }}
  />
);

const AccentLines: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ fps, frame: frame - 5, config: { damping: 20, stiffness: 220, mass: 0.5 }, from: 0, to: 1 });

  const lineStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    bottom: 208,
    [side]: 30,
    width: 72,
    height: 2,
    borderRadius: 2,
    background:
      side === "right"
        ? "linear-gradient(to left, transparent, rgba(255,208,0,0.75))"
        : "linear-gradient(to right, transparent, rgba(255,208,0,0.75))",
    transformOrigin: side === "right" ? "right center" : "left center",
    transform: `scaleX(${s})`,
  });

  return (
    <>
      <div style={lineStyle("right")} />
      <div style={lineStyle("left")} />
    </>
  );
};

const BottomCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const CTA_START = Math.floor(5.6 * fps);
  const local = frame - CTA_START;
  if (local < 0) return null;

  const s = spring({ fps, frame: local, config: { damping: 24, stiffness: 240, mass: 0.6 }, from: 0, to: 1 });
  const translateY = interpolate(s, [0, 1], [32, 0]);

  // pulsing dot
  const dotScale = interpolate((frame % 30) / 30, [0, 0.5, 1], [1, 1.3, 1]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 22,
        left: 22,
        right: 22,
        opacity: s,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(10,6,0,0.72)",
          border: "1.5px solid rgba(255,208,0,0.3)",
          borderRadius: 50,
          paddingLeft: 26,
          paddingRight: 26,
          paddingTop: 13,
          paddingBottom: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          direction: "rtl",
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#FFD000",
            transform: `scale(${dotScale})`,
            boxShadow: "0 0 10px rgba(255,208,0,0.8)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: ARABIC_FONT,
            fontSize: 23,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: 0.3,
          }}
        >
          تواصلي معنا من الأرقام في الوصف
        </span>
      </div>
    </div>
  );
};

export const GraphicOverlay: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <WarmTone />
      <Vignette />
      <BottomGradient />
      <TopBrand />
      <AccentLines />
      <BottomCTA />
    </AbsoluteFill>
  );
};
