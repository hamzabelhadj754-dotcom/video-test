import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../brand";
import { ease, enter, lerp, mapRange } from "../anim";
import { COPY } from "../copy";
import { CTAButton } from "../components/CTAButton";
import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";
import { Glow, SceneShell } from "../components/Stage";
import { useLayout } from "../layout";
import { ENTER, OUTRO, OUTRO_FADE } from "../timing";

/** End card: logo, "Book a demo" CTA with a subtle pulse, URL, 24/7 support. Fades out last 6 frames. */
export const Scene16: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const v = L.format === "9x16";
  const pLogo = enter(frame, 0);
  const pBtn = enter(frame, 2);
  const pUrl = ease(frame, 3, ENTER - 3);
  const pSup = ease(frame, 4, ENTER - 4);
  const pulse = frame >= ENTER ? ((frame - ENTER) % 30) / 30 : 0;
  const breathe = frame >= ENTER ? 1 + Math.sin(((frame - ENTER) / 30) * Math.PI * 2) * 0.012 : 1;
  const fade = mapRange(frame, [OUTRO - OUTRO_FADE - 1, OUTRO - 1], [0, 1]);

  const logoW = v ? 600 : 500;
  const btnSize = v ? 58 : 50;
  const gap = v ? 80 : 56;

  return (
    <SceneShell bg={colors.primary} transition="circle" edge={colors.lime} circleCenter={{ x: L.width / 2, y: L.centerY }}>
      <Glow color="rgba(13,158,136,0.9)" x="50%" y={`${(L.centerY / L.height) * 100}%`} size={1500} />
      <Glow color="rgba(7,44,35,0.6)" x="50%" y="105%" size={1400} />
      <div
        style={{
          position: "absolute",
          left: L.safe.x0,
          width: L.safe.x1 - L.safe.x0,
          top: L.centerY,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily,
          color: colors.white,
        }}
      >
        <div style={{ opacity: pLogo, transform: `scale(${lerp(pLogo, 0.85, 1)})` }}>
          <Logo width={logoW} color={colors.white} />
        </div>
        <div style={{ height: gap }} />
        <div style={{ opacity: pBtn, transform: `translateY(${(1 - pBtn) * 40}px) scale(${lerp(pBtn, 0.8, 1) * breathe})` }}>
          <CTAButton label={COPY.s16.cta} fontSize={btnSize} pulse={pulse} />
        </div>
        <div
          style={{
            marginTop: gap * 0.75,
            fontSize: v ? 56 : 48,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            opacity: pUrl,
            transform: `translateY(${(1 - pUrl) * 30}px)`,
          }}
        >
          {COPY.s16.url}
        </div>
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: v ? 44 : 38,
            fontWeight: 500,
            opacity: 0.85 * pSup,
            transform: `translateY(${(1 - pSup) * 30}px)`,
          }}
        >
          <Icon name="headset" size={v ? 44 : 38} color={colors.lime} strokeWidth={2.2} />
          {COPY.s16.support}
        </div>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </SceneShell>
  );
};
