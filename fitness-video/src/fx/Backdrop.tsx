import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackdropKind } from "../episode";

// Procedural dark visuals used for any cut whose b-roll clip isn't downloaded yet.

const Smoke: React.FC<{ frame: number }> = ({ frame }) => {
  const drift = frame * 1.4;
  return (
    <AbsoluteFill>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 540 960"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="smoke" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.011"
              numOctaves={4}
              seed={7}
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.55"
            />
          </filter>
          <radialGradient id="smokeMask" cx="50%" cy="38%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity={0.55} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <mask id="smokeFade">
            <rect width="540" height="960" fill="url(#smokeMask)" />
          </mask>
        </defs>
        <g mask="url(#smokeFade)">
          <g transform={`translate(${-60 + drift * 0.4} ${-drift})`}>
            <rect
              x={-200}
              y={-200}
              width={940}
              height={1700}
              filter="url(#smoke)"
            />
          </g>
          <g
            transform={`translate(${40 - drift * 0.3} ${-drift * 0.6}) scale(1.6)`}
            opacity={0.6}
          >
            <rect
              x={-200}
              y={-200}
              width={700}
              height={1100}
              filter="url(#smoke)"
            />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Spotlight: React.FC<{ frame: number }> = ({ frame }) => {
  const flicker = 0.85 + random(`spot-${Math.floor(frame / 2)}`) * 0.15;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -100,
          width: 1300,
          height: 2000,
          transform: "translateX(-50%)",
          clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.32), rgba(255,255,255,0.04) 75%, transparent)",
          filter: "blur(30px)",
          opacity: flicker,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 260,
          width: 900,
          height: 160,
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.28), transparent 70%)",
          filter: "blur(10px)",
          opacity: flicker,
        }}
      />
      <Dust frame={frame} count={50} spread={420} />
    </AbsoluteFill>
  );
};

const Dust: React.FC<{ frame: number; count: number; spread?: number }> = ({
  frame,
  count,
  spread,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const depth = random(`d-${i}`);
        const size = 2 + depth * 9;
        const baseX = spread
          ? width / 2 + (random(`x-${i}`) * 2 - 1) * spread
          : random(`x-${i}`) * width;
        const x = baseX + Math.sin(frame / (40 + i) + i) * 30 * depth;
        const y =
          (((random(`y-${i}`) * height - frame * (0.4 + depth * 1.6)) %
            height) +
            height) %
          height;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "white",
              opacity: 0.15 + depth * 0.5,
              filter: `blur(${(1 - depth) * 4 + (depth > 0.85 ? 3 : 0)}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Rain: React.FC<{ frame: number }> = ({ frame }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {new Array(8).fill(0).map((_, i) => (
        <div
          key={`b-${i}`}
          style={{
            position: "absolute",
            left: random(`bx-${i}`) * width - 120,
            top: 200 + random(`by-${i}`) * 900,
            width: 120 + random(`bs-${i}`) * 220,
            height: 120 + random(`bs-${i}`) * 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,215,230,0.22), transparent 65%)",
            filter: "blur(18px)",
          }}
        />
      ))}
      {new Array(140).fill(0).map((_, i) => {
        const speed = 38 + random(`rs-${i}`) * 30;
        const len = 60 + random(`rl-${i}`) * 120;
        const x = random(`rx-${i}`) * (width + 300) - 150 - frame * 4;
        const y =
          ((random(`ry-${i}`) * height + frame * speed) % (height + len)) - len;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 2,
              height: len,
              transform: "rotate(10deg)",
              background:
                "linear-gradient(to bottom, transparent, rgba(220,230,240,0.55))",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Speed: React.FC<{ frame: number }> = ({ frame }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.18), transparent 55%)",
        }}
      />
      {new Array(70).fill(0).map((_, i) => {
        const angle = random(`a-${i}`) * Math.PI * 2;
        const speed = 0.06 + random(`s-${i}`) * 0.08;
        const t = (random(`t-${i}`) + frame * speed) % 1;
        const dist = t * t * 1300;
        const len = 40 + t * 380;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width / 2 + Math.cos(angle) * dist,
              top: height / 2 + Math.sin(angle) * dist,
              width: len,
              height: 2 + t * 3,
              transformOrigin: "0 50%",
              transform: `rotate(${angle}rad)`,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.7))",
              opacity: interpolate(t, [0, 0.2, 1], [0, 0.9, 0.4]),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Backdrop: React.FC<{
  kind: BackdropKind;
  transparent?: boolean;
}> = ({ kind, transparent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ backgroundColor: transparent ? undefined : "#050505" }}
    >
      {kind === "smoke" && <Smoke frame={frame} />}
      {kind === "spotlight" && <Spotlight frame={frame} />}
      {kind === "rain" && <Rain frame={frame} />}
      {kind === "speed" && <Speed frame={frame} />}
      {kind === "dust" && (
        <>
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(ellipse at 85% 30%, rgba(255,255,255,0.16), transparent 55%)",
            }}
          />
          <Dust frame={frame} count={90} />
        </>
      )}
    </AbsoluteFill>
  );
};
