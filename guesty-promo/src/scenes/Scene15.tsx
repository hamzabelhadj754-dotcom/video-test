import React from "react";
import { useCurrentFrame } from "remotion";
import { colors, fontFamily, radius } from "../brand";
import { ease, enter, holdDrift, lerp } from "../anim";
import { COPY } from "../copy";
import { Icon } from "../components/Icon";
import { QuoteCard } from "../components/QuoteCard";
import { LightBackdrop, SceneShell } from "../components/Stage";
import { useLayout } from "../layout";

const AlertFace: React.FC<{ good: boolean; fontSize: number }> = ({ good, fontSize }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: fontSize * 0.4,
      padding: `${fontSize * 0.38}px ${fontSize * 0.7}px`,
      borderRadius: radius.card,
      background: good ? colors.success : colors.alert,
      color: colors.white,
      fontFamily,
      fontWeight: 800,
      fontSize,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      boxShadow: good ? "0 20px 50px rgba(13,158,136,0.35)" : "0 20px 50px rgba(250,87,103,0.35)",
    }}
  >
    <Icon name={good ? "check" : "alert"} size={fontSize * 1.15} color={colors.white} strokeWidth={2.8} />
    {good ? COPY.s15.alertAfter : COPY.s15.alertBefore}
  </div>
);

/** Quote card + callback: the red "Double booking" alert from scene 2 flips into a green check. */
export const Scene15: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const v = L.format === "9x16";
  const pCard = enter(frame, 1, 8);
  const pAlert = enter(frame, 0);
  const flip = ease(frame, 9, 9); // flips right after the entrance
  const angle = flip * 180;
  const good = angle > 90;
  const alertSize = v ? 48 : 38;
  const cardW = L.safe.x1 - L.safe.x0;
  const quoteSize = v ? 76 : 68;
  const cardTop = v ? 600 : 290;

  return (
    <SceneShell bg={colors.cream} transition="wipeLeft">
      <LightBackdrop />
      <QuoteCard
        quote={COPY.s15.quote}
        author={COPY.s15.author}
        place={COPY.s15.place}
        width={cardW}
        fontSize={quoteSize}
        style={{
          left: L.safe.x0,
          top: cardTop,
          paddingTop: quoteSize * 1.5,
          opacity: pCard,
          transform: `translateY(${(1 - pCard) * 80}px) scale(${lerp(pCard, 0.94, 1) * holdDrift(frame, 0.01)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cardTop - alertSize * 1.2,
          display: "flex",
          justifyContent: "center",
          opacity: pAlert,
          transform: `translateY(${(1 - pAlert) * -40}px) perspective(900px) rotateX(${good ? angle - 180 : angle}deg)`,
        }}
      >
        <AlertFace good={good} fontSize={alertSize} />
      </div>
    </SceneShell>
  );
};
