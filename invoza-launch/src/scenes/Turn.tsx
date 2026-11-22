import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EV, Logo, SC, font, lerp, p, sceneMotion } from "../lib";

export const S3Turn: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const sweepStart = EV.sweep - SC.turn[0];
  const logoAt = EV.logo - SC.turn[0];
  const sw = p(f, sweepStart, 26, (x) => x); // linear sweep
  const sweepX = lerp(-40, 140, sw); // % across frame
  const reveal = p(f, logoAt - 6, 22);
  const bg = p(f, logoAt, 40);
  const tag = p(f, logoAt + 22, 20);
  const exit = sceneMotion(f, dur, { from: "none", to: "scale" });
  const breathe = 1 + Math.sin(f / 18) * 0.01;

  return (
    <AbsoluteFill style={{ background: "#000", opacity: exit.opacity, transform: exit.transform, filter: exit.filter }}>
      <AbsoluteFill
        style={{
          opacity: bg,
          background: "linear-gradient(155deg, #0A0A0A 0%, #141416 50%, #2B2B2E 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: bg,
          background: "radial-gradient(ellipse 40% 40% at 50% 44%, rgba(124,92,255,0.22) 0%, rgba(124,92,255,0) 100%)",
        }}
      />
      {/* logo + tagline */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div
          style={{
            opacity: reveal,
            transform: `scale(${lerp(0.86, 1, reveal) * breathe})`,
            clipPath: `inset(-40% ${lerp(100, -20, reveal)}% -40% -20%)`,
            marginTop: -70,
          }}
        >
          <Logo size={190} glow={reveal} />
        </div>
        <div
          style={{
            ...font(96, 700),
            marginTop: 80,
            opacity: tag,
            transform: `translateY(${(1 - tag) * 30}px)`,
            filter: `blur(${(1 - tag) * 8}px)`,
          }}
        >
          Get paid without chasing.
        </div>
      </AbsoluteFill>
      {/* violet light sweep */}
      {sw > 0 && sw < 1 && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(105deg, rgba(124,92,255,0) ${sweepX - 18}%, rgba(124,92,255,0.45) ${sweepX - 5}%, rgba(225,215,255,0.85) ${sweepX}%, rgba(124,92,255,0.45) ${sweepX + 5}%, rgba(124,92,255,0) ${sweepX + 18}%)`,
            mixBlendMode: "screen",
            opacity: Math.sin(sw * Math.PI),
          }}
        />
      )}
    </AbsoluteFill>
  );
};
