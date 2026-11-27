import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Grain } from "./components";
import { pushLineScreen, Bridge, Climb, Lunge, Push, Squat } from "./scenes/Exercises";
import { Opening, openingDrift, RING } from "./scenes/Opening";
import { End, Rounds } from "./scenes/Outro";
import { sliceStart, SLICE } from "./Ring";
import { C, DISPLAY, EASE, useFonts } from "./theme";
import { B, lerp, prog } from "./timeline";

const lin = (t: number) => t;
// speed of an eased transition at frame g (for motion blur amount)
const speed = (g: number, a: number, b: number, ease: (t: number) => number) =>
  Math.abs(prog(g + 0.5, a, b, ease) - prog(g - 0.5, a, b, ease));

const Layer: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <AbsoluteFill style={{ willChange: "transform", ...style }}>{children}</AbsoluteFill>
);

// Glyph "4" used as the window into the bridge scene. Origin = stem/crossbar joint.
const NUM = { size: 520, ox: 0.645, oy: -0.27 };

export const Film: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useFonts();
  const g = useCurrentFrame();
  const layers: React.ReactNode[] = [];

  // T1  clock → zoom through slice 1 → squat
  const s1 = sliceStart(0) + SLICE / 2;
  const dr = openingDrift(g);
  const z0 = {
    x: RING.cx + dr * RING.r * Math.cos((s1 * Math.PI) / 180),
    y: RING.cy + dr * RING.r * Math.sin((s1 * Math.PI) / 180),
  };
  const zoom = prog(g, 198, 220, EASE.in);
  if (g < 222) {
    layers.push(
      <Layer
        key="open"
        style={{
          transform: `scale(${1 + zoom * zoom * 11})`,
          transformOrigin: `${z0.x}px ${z0.y}px`,
          opacity: 1 - prog(g, 205, 213, lin),
          filter: zoom > 0.02 ? `blur(${zoom * 6}px)` : undefined,
        }}
      >
        <Opening f={g} />
      </Layer>,
    );
  }

  // T2  squat sinks → camera whips down to the floor → push-up
  const whip = prog(g, 287, 305, EASE.whip);
  const vb = Math.min(70, speed(g, 287, 305, EASE.whip) * 1920 * 0.09);
  if (g >= 206 && g < 305) {
    const e = prog(g, 206, 226, EASE.out);
    layers.push(
      <Layer
        key="squat"
        style={{
          transform: `translateY(${-whip * 1920}px) scale(${lerp(1.22, 1, e)})`,
          opacity: prog(g, 209, 217, lin),
          filter: g < 220 ? `blur(${(1 - e) * 14}px)` : vb > 0.5 ? "url(#vblur)" : undefined,
        }}
      >
        <Squat f={g - B.squat} />
      </Layer>,
    );
  }

  // T3  body line runs out of frame and splits the picture open → lunge
  const split = prog(g, 414, 432, EASE.whip);
  if (g >= 414 && g < 522) {
    const e = prog(g, 414, 438, EASE.out);
    layers.push(
      <Layer key="lunge" style={{ transform: `scale(${lerp(1.1, 1, e)})` }}>
        <Lunge f={g - B.lunge} />
      </Layer>,
    );
  }
  if (g >= 287 && g < 432) {
    const lf = g - B.push;
    const style: React.CSSProperties = {
      transform: `translateY(${(1 - whip) * 1920}px)`,
      filter: vb > 0.5 && g < 306 ? "url(#vblur)" : undefined,
    };
    if (split <= 0) {
      layers.push(
        <Layer key="push" style={style}>
          <Push f={lf} />
        </Layer>,
      );
    } else {
      const { a, b } = pushLineScreen(lf);
      const ux = (b.x - a.x) / Math.hypot(b.x - a.x, b.y - a.y);
      const uy = (b.y - a.y) / Math.hypot(b.x - a.x, b.y - a.y);
      const nx = -uy;
      const ny = ux;
      const F = 4000;
      const half = (sgn: 1 | -1) => {
        const pts = [
          [a.x - ux * F, a.y - uy * F],
          [a.x + ux * F, a.y + uy * F],
          [a.x + ux * F + sgn * nx * F, a.y + uy * F + sgn * ny * F],
          [a.x - ux * F + sgn * nx * F, a.y - uy * F + sgn * ny * F],
        ];
        return `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
      };
      const d = split * 1250;
      ([1, -1] as const).forEach((sgn) =>
        layers.push(
          <Layer
            key={`push${sgn}`}
            style={{ transform: `translate(${sgn * nx * d}px, ${sgn * ny * d}px)` }}
          >
            <AbsoluteFill style={{ clipPath: half(sgn) }}>
              <Backdrop />
              <Push f={lf} />
            </AbsoluteFill>
          </Layer>,
        ),
      );
    }
  }

  // T4  lunge → through the numeral "4" → bridge
  const num = prog(g, 498, 520, EASE.in);
  const T5 = prog(g, 584, 600, EASE.whip);
  if (g >= 498 && g < 600) {
    const k = lerp(0.12, 22, num * num);
    const sx = 540;
    const sy = 1010;
    const gx = NUM.size * NUM.ox;
    const gy = NUM.size * NUM.oy;
    const tf = `translate(${sx} ${sy}) scale(${k}) translate(${-gx} ${-gy})`;
    const clipped = g < 520;
    layers.push(
      <Layer
        key="bridge"
        style={{
          clipPath: clipped ? "url(#num4)" : undefined,
          transform: `rotate(${-T5 * 16}deg) scale(${1 + T5 * 0.3})`,
          transformOrigin: "540px 1000px",
          opacity: 1 - prog(g, 590, 599, lin),
          filter: T5 > 0.02 ? `blur(${speed(g, 584, 600, EASE.whip) * 140}px)` : undefined,
        }}
      >
        <AbsoluteFill>
          {clipped && <Backdrop lightY={1000} />}
          <Bridge f={g - B.bridge} />
        </AbsoluteFill>
      </Layer>,
    );
    if (clipped) {
      layers.push(
        <svg key="num4" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id="num4" clipPathUnits="userSpaceOnUse">
              <text transform={tf} fontFamily={DISPLAY} fontWeight={900} fontStretch="125%" fontSize={NUM.size}>
                4
              </text>
            </clipPath>
          </defs>
          <text
            transform={tf}
            fontFamily={DISPLAY}
            fontWeight={900}
            fontStretch="125%"
            fontSize={NUM.size}
            fill="none"
            stroke={C.work}
            strokeWidth={3 / k}
          >
            4
          </text>
        </svg>,
      );
    }
  }

  // T5  bridge spins out → climbers spin in
  if (g >= 588 && g < 692) {
    const e = prog(g, 588, 604, EASE.out);
    const c = prog(g, 670, 690, EASE.whip);
    layers.push(
      <Layer
        key="climb"
        style={{
          transform:
            g < 640
              ? `rotate(${(1 - e) * 14}deg) scale(${lerp(0.84, 1, e)})`
              : `translate(${(RING.cx - 540) * c}px, ${(RING.cy - 960) * c}px) scale(${lerp(1, 0.04, c)})`,
          transformOrigin: g < 640 ? "540px 1000px" : "540px 960px",
          opacity: g < 640 ? prog(g, 588, 596, lin) : 1 - prog(g, 684, 690, lin),
          borderRadius: `${c * 50}%`,
          overflow: "hidden",
          filter: g < 640 && e < 0.98 ? `blur(${(1 - e) * 10}px)` : undefined,
        }}
      >
        <Climb f={g - B.climb} />
      </Layer>,
    );
  }

  // T6  climber collapses into the clock face → rounds
  if (g >= 676 && g < 780) {
    layers.push(
      <Layer key="rounds" style={{ opacity: 1 - prog(g, 770, 778, lin) }}>
        <Rounds f={g - B.rounds} />
      </Layer>,
    );
  }

  // T7  the ring shrinks into the full stop of "THIS." → end card → loop
  if (g >= 769) {
    layers.push(
      <Layer key="end">
        <End f={g - B.end} />
      </Layer>,
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="vblur" x="0" y="-20%" width="100%" height="140%">
          <feGaussianBlur stdDeviation={`0 ${vb}`} />
        </filter>
      </svg>
      <Backdrop />
      {layers}
      <Grain />
      {audio && <Audio src={staticFile("mix.wav")} />}
    </AbsoluteFill>
  );
};
