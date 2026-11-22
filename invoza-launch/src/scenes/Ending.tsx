import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, Check, EV, Logo, SC, font, lerp, p, sceneMotion } from "../lib";
import { Phone, StatusBar } from "../Phone";
import { CornerClock } from "./Problem";

/* =====================  SCENE 7 — PAYOFF  ===================== */
export const S7Payoff: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const at = EV.payNotif - SC.payoff[0];
  const m = sceneMotion(f, dur, { from: "scale", to: "scale" });
  const n = p(f, at, 20);
  const glow = p(f, at, 10) * (0.75 + 0.25 * Math.sin((f - at) / 9));
  const rise = p(f, 0, 40);

  return (
    <AbsoluteFill style={m}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 45% at 50% 36%, rgba(61,220,151,${0.16 * glow}) 0%, rgba(61,220,151,0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 40% 50% at 50% 100%, rgba(124,92,255,0.14) 0%, rgba(124,92,255,0) 100%)",
        }}
      />
      {/* phone rising from the bottom */}
      <div style={{ position: "absolute", left: 960 - 270, top: lerp(560, 430, rise), perspective: 2000 }}>
        <div style={{ transform: "rotateX(14deg)" }}>
          <Phone width={540} glare={lerp(20, 60, f / dur)}>
            <AbsoluteFill
              style={{
                background: "radial-gradient(ellipse 120% 70% at 50% 0%, #2a2a30 0%, #141416 55%, #0b0b0c 100%)",
              }}
            />
            <StatusBar time="9:14" hideTime />
            <div style={{ position: "absolute", top: 100, width: "100%", textAlign: "center" }}>
              <div style={{ ...font(20, 600, C.grey) }}>Wednesday 19 November</div>
              <div style={{ ...font(104, 600), letterSpacing: "-0.03em", marginTop: 4 }}>9:14</div>
            </div>
          </Phone>
        </div>
      </div>
      {/* big payment notification */}
      <div
        style={{
          position: "absolute",
          left: 960 - 660,
          top: 196,
          width: 1320,
          height: 220,
          borderRadius: 44,
          background: "linear-gradient(180deg, rgba(40,40,44,0.97) 0%, rgba(28,28,31,0.97) 100%)",
          display: "flex",
          alignItems: "center",
          gap: 34,
          padding: "0 46px",
          opacity: n,
          transform: `translateY(${(1 - n) * -120}px) scale(${lerp(0.9, 1, n)})`,
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.1), 0 0 0 2px rgba(61,220,151,${0.75 * glow}), 0 0 ${110 * glow}px rgba(61,220,151,${0.42 * glow}), 0 60px 120px -30px rgba(0,0,0,0.9)`,
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 32,
            background: C.mint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${50 * glow}px rgba(61,220,151,0.8)`,
            flexShrink: 0,
          }}
        >
          <Check size={70} color="#0A0A0A" width={3} draw={p(f, at + 6, 14)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ ...font(30, 700, C.grey) }}>Invoza · Payment received</div>
            <div style={{ ...font(26, 500, C.grey) }}>now</div>
          </div>
          <div style={{ ...font(60, 800), marginTop: 12 }}>€1,250 received from Acme Studio</div>
        </div>
      </div>
      <CornerClock time="9:14" ampm="AM" sub="NEXT MORNING" opacity={p(f, 0, 16) * 0.9} />
    </AbsoluteFill>
  );
};

/* =====================  SCENE 8 — CTA  ===================== */
export const S8Cta: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const o = SC.cta[0];
  const m = sceneMotion(f, dur + 999, { from: "scale", to: "none" });
  const logo = p(f, 4, 24);
  const tag = p(f, 18, 22);
  const btn = p(f, EV.ctaButton - o, 22);
  const sweep = ((f - (EV.ctaButton - o) - 14) % 60) / 60; // repeating shimmer
  const sw = p(f, EV.ctaSweep - o, 24, (x) => x);

  return (
    <AbsoluteFill style={m}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 45% 50% at 50% 46%, rgba(124,92,255,0.22) 0%, rgba(124,92,255,0) 100%)",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", paddingBottom: 70 }}>
        <div style={{ opacity: logo, transform: `scale(${lerp(0.85, 1, logo)})`, filter: `blur(${(1 - logo) * 10}px)` }}>
          <Logo size={170} />
        </div>
        <div style={{ ...font(76, 600, C.grey), marginTop: 52, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)`, letterSpacing: "-0.02em" }}>
          Invoicing on autopilot
        </div>
        <div
          style={{
            marginTop: 64,
            width: 680,
            height: 136,
            borderRadius: 68,
            background: C.violet,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            opacity: btn,
            transform: `translateY(${(1 - btn) * 40}px) scale(${lerp(0.9, 1, btn)})`,
            boxShadow: "0 24px 70px rgba(124,92,255,0.55), inset 0 2px 0 rgba(255,255,255,0.3)",
          }}
        >
          <div style={{ ...font(52, 700), letterSpacing: "-0.02em", position: "relative" }}>Start free today</div>
          {f > EV.ctaButton - o + 14 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep * 200 - 40}%, rgba(255,255,255,0.28) ${sweep * 200 - 20}%, rgba(255,255,255,0) ${sweep * 200}%)`,
              }}
            />
          )}
        </div>
      </AbsoluteFill>
      {sw > 0 && sw < 1 && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(105deg, rgba(124,92,255,0) ${lerp(-40, 140, sw) - 16}%, rgba(124,92,255,0.35) ${lerp(-40, 140, sw)}%, rgba(124,92,255,0) ${lerp(-40, 140, sw) + 16}%)`,
            mixBlendMode: "screen",
            opacity: Math.sin(sw * Math.PI),
          }}
        />
      )}
    </AbsoluteFill>
  );
};
