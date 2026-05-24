import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ARABIC_FONT_FAMILY } from "./arabicFont";

const fontFamily = ARABIC_FONT_FAMILY;

// Animated decorative line
const DecorLine: React.FC<{ delay: number; width: number; top: number; right: number; color: string }> = ({
  delay, width, top, right, color,
}) => {
  const frame = useCurrentFrame();
  const scaleX = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        right,
        width,
        height: 3,
        background: color,
        borderRadius: 2,
        transformOrigin: "right center",
        transform: `scaleX(${scaleX})`,
      }}
    />
  );
};

// Top brand badge
const BrandBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const scale = interpolate(frame, [4, 16], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #C8900A 0%, #FFD700 50%, #C8900A 100%)",
          borderRadius: 40,
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 10,
          paddingBottom: 10,
          boxShadow: "0 4px 24px rgba(200,144,10,0.45)",
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 26,
            color: "#1A0A00",
            direction: "rtl",
            letterSpacing: 1,
          }}
        >
          ✨ عرض خاص ✨
        </span>
      </div>
    </div>
  );
};

// Bottom call-to-action bar
const CtaBar: React.FC = () => {
  const frame = useCurrentFrame();
  const translateY = interpolate(frame, [8, 22], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle pulse on the dot
  const dotScale = interpolate(
    (frame % 30) / 30,
    [0, 0.5, 1],
    [1, 1.25, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.72) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row-reverse",
        gap: 14,
        transform: `translateY(${translateY}px)`,
        opacity,
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#FFD700",
          transform: `scale(${dotScale})`,
          boxShadow: "0 0 10px rgba(255,215,0,0.8)",
        }}
      />
      <span
        style={{
          fontFamily,
          fontSize: 28,
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: 0.5,
        }}
      >
        تواصلي معنا الآن
      </span>
    </div>
  );
};

// Corner decorative circles
const CornerDot: React.FC<{ top?: number; bottom?: number; left?: number; right?: number; delay: number }> = ({
  top, bottom, left, right, delay,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "rgba(255,215,0,0.7)",
        transform: `scale(${scale})`,
        boxShadow: "0 0 12px rgba(255,215,0,0.5)",
      }}
    />
  );
};

export const GraphicOverlay: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* decorative lines flanking the captions area */}
      <DecorLine delay={6} width={90} top={1094} right={32} color="#FFD700" />
      <DecorLine delay={10} width={60} top={1100} right={32} color="rgba(255,215,0,0.4)" />

      {/* corner accents */}
      <CornerDot top={130} right={32} delay={2} />
      <CornerDot top={130} left={32} delay={4} />

      {/* top badge */}
      <BrandBadge />

      {/* bottom CTA */}
      <CtaBar />
    </AbsoluteFill>
  );
};
