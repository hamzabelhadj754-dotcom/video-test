import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../brand";
import { ease, enter, holdDrift, lerp, mapRange } from "../anim";
import { COPY } from "../copy";
import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";
import { Glow, VisualStage } from "../components/Stage";
import { countValue } from "../components/Headline";
import { glassSurface } from "../components/UI";
import { WorldDots } from "../components/WorldDots";
import { useLayout } from "../layout";
import { ENTER, OUTRO, OUTRO_FADE, SCENE, TRANSITION } from "../timing";
import { Scene01Stage } from "../scenes/Scene01";
import { Scene02Stage } from "../scenes/Scene02";
import { Scene08Stage } from "../scenes/Scene08";
import { Scene09Stage } from "../scenes/Scene09";
import { Scene10Stage } from "../scenes/Scene10";
import { Scene11Stage } from "../scenes/Scene11";
import { BlurIn, blurIn, GlassPill, SoftHeadline } from "./kit";
import { Clouds } from "./Clouds";
import { Hub } from "./Hub";

const Fill: React.CSSProperties = { position: "absolute", inset: 0 };

/** UI illustration from the classic version, rendered in glass with a blur-in. */
const StageIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BlurIn style={Fill} duration={ENTER} rise={40}>
    {children}
  </BlurIn>
);

/* 1 — chaos */
export const Soft01: React.FC = () => (
  <AbsoluteFill>
    <StageIn>
      <Scene01Stage />
    </StageIn>
    <SoftHeadline lines={COPY.s01.headline} />
  </AbsoluteFill>
);

/* 2 — calendar mess */
export const Soft02: React.FC = () => (
  <AbsoluteFill>
    <StageIn>
      <Scene02Stage />
    </StageIn>
    <SoftHeadline lines={COPY.s02.headline} />
  </AbsoluteFill>
);

/* 3 — the chaos freezes and blurs behind the question */
export const Soft03: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const p = ease(frame, 0, TRANSITION);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `blur(${p * 22}px) grayscale(${p * 0.6}) brightness(${lerp(p, 1, 0.7)})`, transform: `scale(${1 + p * 0.06})`, opacity: lerp(p, 1, 0.55) }}>
        <Freeze frame={SCENE - 1}>
          <Soft02 />
        </Freeze>
      </AbsoluteFill>
      <SoftHeadline lines={COPY.s03.headline} position="center" align="center" size={L.format === "9x16" ? 138 : 116} weight={300} delay={2} />
    </AbsoluteFill>
  );
};

/* 4 — logo */
export const Soft04: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const p = enter(frame, 1);
  const w = L.format === "9x16" ? 720 : 620;
  return (
    <AbsoluteFill>
      <Glow color="rgba(255,255,255,0.55)" x="50%" y={`${(L.centerY / L.height) * 100}%`} size={w * 1.8 * lerp(p, 0.6, 1)} opacity={p} />
      <div
        style={{
          position: "absolute",
          left: (L.width - w) / 2,
          top: L.centerY,
          width: w,
          opacity: Math.min(1, p * 1.3),
          filter: `blur(${(1 - p) * 24}px) drop-shadow(0 10px 40px rgba(4,32,26,0.25))`,
          transform: `translateY(-50%) scale(${lerp(p, 1.12, 1) * holdDrift(frame, 0.015)})`,
        }}
      >
        <Logo width={w} color={colors.white} />
      </div>
    </AbsoluteFill>
  );
};

/* 5–7 — the hub: search pill → feature card → orbiting channels → synced */
export const Soft05: React.FC = () => (
  <AbsoluteFill>
    <VisualStage lines={COPY.s05.headline.length} drift={false}>
      <Hub phase="morph" sceneId={5} />
    </VisualStage>
    <SoftHeadline lines={COPY.s05.headline} />
  </AbsoluteFill>
);
export const Soft06: React.FC = () => (
  <AbsoluteFill>
    <VisualStage lines={COPY.s06.headline.length} drift={false}>
      <Hub phase="orbit" sceneId={6} />
    </VisualStage>
    <SoftHeadline lines={COPY.s06.headline} count={COPY.s06.count} />
  </AbsoluteFill>
);
export const Soft07: React.FC = () => (
  <AbsoluteFill>
    <VisualStage lines={COPY.s07.headline.length} drift={false}>
      <Hub phase="synced" sceneId={7} />
    </VisualStage>
    <SoftHeadline lines={COPY.s07.headline} />
  </AbsoluteFill>
);

/* 8–11 — feature UIs in glass */
const feature = (Stage: React.FC, lines: (typeof COPY)["s08"]["headline"]): React.FC => {
  const C: React.FC = () => (
    <AbsoluteFill>
      <StageIn>
        <Stage />
      </StageIn>
      <SoftHeadline lines={lines} />
    </AbsoluteFill>
  );
  return C;
};
export const Soft08 = feature(Scene08Stage, COPY.s08.headline);
export const Soft09 = feature(Scene09Stage, COPY.s09.headline);
export const Soft10 = feature(Scene10Stage, COPY.s10.headline);
export const Soft11 = feature(Scene11Stage, COPY.s11.headline);

/* 12–14 — proof points: thin big number, bold label, glass source pill */
const SoftStat: React.FC<{ value: { to: number; decimals: number; suffix: string }; label: string; sub: readonly string[] }> = ({
  value,
  label,
  sub,
}) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const subSize = L.stat.sub * 0.88;
  return (
    <div
      style={{
        position: "absolute",
        left: L.safe.x0,
        width: L.safe.x1 - L.safe.x0,
        top: L.centerY,
        transform: `translateY(-50%) scale(${holdDrift(frame, 0.01)})`,
        textAlign: "center",
        fontFamily,
        color: colors.white,
        textShadow: "0 6px 40px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ ...blurIn(frame, 0, ENTER, 30), fontSize: L.stat.number * 1.1, fontWeight: 300, lineHeight: 0.95, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
        {countValue(frame, value.to, value.decimals)}
        <span style={{ color: colors.lime }}>{value.suffix}</span>
      </div>
      <div style={{ ...blurIn(frame, 2), fontSize: L.stat.label * 0.92, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: L.stat.label * 0.1 }}>
        {label}
      </div>
      <div style={{ ...blurIn(frame, 3), marginTop: subSize * 1.1 }}>
        <GlassPill fontSize={subSize} style={{ textShadow: "none" }}>
          <span style={{ fontWeight: 500 }}>{sub[0]}</span>
          {sub[1] ? (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ fontWeight: 800, color: colors.primary }}>{sub[1]}</span>
            </>
          ) : null}
        </GlassPill>
      </div>
    </div>
  );
};

export const Soft12: React.FC = () => {
  const L = useLayout();
  const mapW = L.format === "9x16" ? 1500 : 1080;
  const mapH = (mapW * 134) / 360;
  return (
    <AbsoluteFill>
      <WorldDots width={mapW} left={(L.width - mapW) / 2} top={L.centerY - mapH / 2} opacity={0.75} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${L.width * 0.6}px ${L.stat.number * 1.5}px at 50% ${L.centerY}px, rgba(7,44,35,0.9) 0%, rgba(7,44,35,0.6) 55%, rgba(7,44,35,0) 100%)`,
        }}
      />
      <SoftStat value={COPY.s12.value} label={COPY.s12.label} sub={COPY.s12.sub} />
    </AbsoluteFill>
  );
};
export const Soft13: React.FC = () => <SoftStat value={COPY.s13.value} label={COPY.s13.label} sub={COPY.s13.sub} />;
export const Soft14: React.FC = () => <SoftStat value={COPY.s14.value} label={COPY.s14.label} sub={COPY.s14.sub} />;

/* 15 — quote, with the red "Double booking" pill flipping to green */
export const Soft15: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const v = L.format === "9x16";
  const flip = ease(frame, 9, 9);
  const angle = flip * 180;
  const good = angle > 90;
  const alertSize = v ? 46 : 38;
  const quoteSize = v ? 74 : 66;
  const cardTop = v ? 600 : 290;
  const cardW = L.safe.x1 - L.safe.x0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: L.safe.x0,
          top: cardTop,
          width: cardW,
          padding: `${quoteSize * 1.4}px ${quoteSize * 0.85}px ${quoteSize * 0.8}px`,
          ...glassSurface(40),
          fontFamily,
          color: colors.forest,
          ...blurIn(frame, 1, 8, 50),
        }}
      >
        <svg width={quoteSize * 1.1} height={quoteSize * 0.85} viewBox="0 0 26 20" style={{ display: "block", marginBottom: quoteSize * 0.35 }}>
          <path
            fill={colors.primary}
            d="M0 20V12.2C0 5.6 3.4 1.4 10.2 0l1.2 3C8 4.2 6.2 6.4 5.9 9.6H11V20H0zm14.6 0V12.2c0-6.6 3.4-10.8 10.2-12.2l1.2 3c-3.4 1.2-5.2 3.4-5.5 6.6H25.6V20H14.6z"
          />
        </svg>
        <div style={{ fontSize: quoteSize, lineHeight: 1.12, fontWeight: 600, letterSpacing: "-0.025em" }}>{COPY.s15.quote}</div>
        <div style={{ height: 4, width: 90, background: colors.primary, borderRadius: 4, margin: `${quoteSize * 0.5}px 0` }} />
        <div style={{ fontSize: quoteSize * 0.6, fontWeight: 700 }}>— {COPY.s15.author}</div>
        <div style={{ fontSize: quoteSize * 0.48, fontWeight: 500, opacity: 0.6, marginTop: 6 }}>{COPY.s15.place}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cardTop - alertSize * 1.15,
          display: "flex",
          justifyContent: "center",
          ...blurIn(frame, 0, ENTER, -30),
        }}
      >
        <div style={{ transform: `perspective(900px) rotateX(${good ? angle - 180 : angle}deg)` }}>
          <GlassPill
            fontSize={alertSize}
            style={{
              background: good ? colors.success : colors.alert,
              color: colors.white,
              border: "2px solid rgba(255,255,255,0.5)",
              fontWeight: 800,
              boxShadow: good ? "0 20px 50px rgba(13,158,136,0.4)" : "0 20px 50px rgba(250,87,103,0.4)",
            }}
          >
            <Icon name={good ? "check" : "alert"} size={alertSize * 1.1} color={colors.white} strokeWidth={2.8} />
            {good ? COPY.s15.alertAfter : COPY.s15.alertBefore}
          </GlassPill>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 16 — sky & clouds end card */
export const Soft16: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const v = L.format === "9x16";
  const logoW = v ? 560 : 460;
  const btn = v ? 56 : 48;
  const pulse = frame >= ENTER ? ((frame - ENTER) % 30) / 30 : 0;
  const breathe = frame >= ENTER ? 1 + Math.sin(((frame - ENTER) / 30) * Math.PI * 2) * 0.012 : 1;
  const fade = mapRange(frame, [OUTRO - OUTRO_FADE - 1, OUTRO - 1], [0, 1]);
  return (
    <AbsoluteFill>
      <Clouds horizon={v ? 1330 : 900} />
      <div
        style={{
          position: "absolute",
          left: L.safe.x0,
          width: L.safe.x1 - L.safe.x0,
          top: v ? L.centerY - 60 : L.centerY - 110,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily,
          color: colors.white,
          textShadow: "0 6px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div style={blurIn(frame, 0, ENTER, 30)}>
          <Logo width={logoW} color={colors.white} />
        </div>
        <div style={{ height: v ? 76 : 50 }} />
        <div style={{ ...blurIn(frame, 2), position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              border: "3px solid rgba(255,255,255,0.8)",
              transform: `scale(${1 + pulse * 0.16}, ${1 + pulse * 0.5})`,
              opacity: (1 - pulse) * 0.8,
            }}
          />
          <div style={{ transform: `scale(${breathe})` }}>
            <GlassPill dark fontSize={btn} style={{ fontWeight: 700, padding: `${btn * 0.5}px ${btn * 0.6}px ${btn * 0.5}px ${btn * 1.0}px` }}>
              {COPY.s16.cta}
              <span
                style={{
                  width: btn * 1.2,
                  height: btn * 1.2,
                  borderRadius: 99,
                  background: colors.lime,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="arrowRight" size={btn * 0.7} color={colors.forest} strokeWidth={2.8} />
              </span>
            </GlassPill>
          </div>
        </div>
        <div style={{ ...blurIn(frame, 3), marginTop: v ? 54 : 38, fontSize: v ? 58 : 48, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {COPY.s16.url}
        </div>
        <div style={{ ...blurIn(frame, 4), marginTop: 12, display: "flex", alignItems: "center", gap: 14, fontSize: v ? 42 : 36, fontWeight: 400, opacity: 0.92 }}>
          <Icon name="headset" size={v ? 42 : 36} color={colors.lime} strokeWidth={2.2} />
          {COPY.s16.support}
        </div>
      </div>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: fade }} />
    </AbsoluteFill>
  );
};
