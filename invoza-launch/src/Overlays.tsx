import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, fontFamily } from "./lib";
import T from "./timeline.json";

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const lx = 30 + Math.sin(f / 120) * 12;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(155deg, ${C.bg0} 0%, #151517 48%, ${C.bg1} 100%)` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at ${lx}% 8%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)" }}
  />
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.16 }}>
      <Img src={staticFile(`grain/g${f % 8}.png`)} style={{ width: 1920, height: 1080 }} />
    </AbsoluteFill>
  );
};

export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / T.fps;
  const cur = T.vo.find((v) => t >= v.subStart - 0.2 && t < v.subEnd + 0.2);
  if (!cur) return null;
  const a = interpolate(t, [cur.subStart - 0.2, cur.subStart, cur.subEnd, cur.subEnd + 0.2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 46 }}>
      <div
        style={{
          opacity: a,
          transform: `translateY(${(1 - a) * 10}px)`,
          maxWidth: 1400,
          padding: "14px 36px",
          borderRadius: 22,
          background: "rgba(8,8,10,0.6)",
          boxShadow: "0 0 50px 18px rgba(8,8,10,0.5)",
          fontFamily,
          fontSize: 42,
          fontWeight: 600,
          lineHeight: 1.3,
          color: C.white,
          textAlign: "center",
          letterSpacing: "-0.005em",
        }}
      >
        {cur.text}
      </div>
    </AbsoluteFill>
  );
};
