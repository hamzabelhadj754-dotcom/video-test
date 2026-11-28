import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Grain, GRADE, INK, SERIF, useFonts } from "./Reel";

// Photo dump: full-screen, locked position, one constant fast rhythm, no sound.
export const SLOT = 9; // frames per photo = 0.3 s @ 30 fps
const ORDER = [1, 2, 3, 4, 5]; // 10 full rounds in 15 s; ends on 5 → loops into 1
export const FLICKER_TOTAL = 450;

export const Flicker: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const n = ORDER[Math.floor(f / SLOT) % ORDER.length];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0A09" }}>
      {/* every plate is pre-loaded and stacked; only the current one is visible (no decode flashes) */}
      {ORDER.map((k) => (
        <Img
          key={k}
          src={staticFile(`photos/${k}_full.jpg`)}
          style={{ position: "absolute", width: 1080, height: 1920, filter: GRADE, opacity: k === n ? 1 : 0 }}
        />
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 620,
            height: 150,
            left: 230,
            top: 960 - 75,
            background: "radial-gradient(ellipse at center, rgba(5,5,5,0.38) 0%, rgba(5,5,5,0) 70%)",
          }}
        />
        <div
          style={{
            position: "relative",
            whiteSpace: "nowrap",
            color: INK,
            fontFamily: SERIF,
            fontSize: 46,
            letterSpacing: "0.01em",
            textShadow: "0 1px 12px rgba(0,0,0,0.55)",
          }}
        >
          we do <span style={{ fontStyle: "italic" }}>home workouts.</span>
        </div>
      </AbsoluteFill>
      <Grain f={f} />
    </AbsoluteFill>
  );
};
