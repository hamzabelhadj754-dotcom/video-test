import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "../timeline.json";
import { C, F } from "../theme";

const SECTIONS: [number, string][] = [
  [timeline.scenes.hook.from, "01 // DIAGNOSIS"],
  [timeline.scenes.meme.from, "02 // SYSTEM LOG"],
  [timeline.scenes.reframe.from, "03 // REFRAME"],
  [timeline.scenes.protocol.from, "04 // PROTOCOL"],
  [timeline.scenes.payoff.from, "05 // IGNITION"],
  [timeline.scenes.outro.from, "06 // END OF LINE"],
];

const mono: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 22,
  letterSpacing: "0.14em",
  color: C.dim,
  textTransform: "uppercase",
};

const Corner: React.FC<{ x: "left" | "right"; y: "top" | "bottom" }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute",
      [x]: 40,
      [y]: 40,
      width: 44,
      height: 44,
      [`border${y === "top" ? "Top" : "Bottom"}`]: `3px solid ${C.ink}`,
      [`border${x === "left" ? "Left" : "Right"}`]: `3px solid ${C.ink}`,
      opacity: 0.8,
    }}
  />
);

/** Persistent operating-system chrome around every frame. */
export const HUD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const section = [...SECTIONS].reverse().find(([from]) => frame >= from)?.[1] ?? "";
  const secs = frame / fps;
  const tc = `00:${String(Math.floor(secs)).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
  const recOn = Math.floor(frame / 15) % 2 === 0;
  const progress = frame / (durationInFrames - 1);
  const intro = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: intro }}>
      <Corner x="left" y="top" />
      <Corner x="right" y="top" />
      <Corner x="left" y="bottom" />
      <Corner x="right" y="bottom" />

      <div style={{ position: "absolute", top: 56, left: 110, ...mono, color: C.ink, fontWeight: 700 }}>
        GAINSDOM<span style={{ color: C.accent }}>/</span>OS
      </div>
      <div style={{ position: "absolute", top: 56, right: 110, ...mono, display: "flex", gap: 14, alignItems: "center" }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: C.accent,
            opacity: recOn ? 1 : 0.2,
          }}
        />
        {tc}
      </div>

      {/* progress rail */}
      <div style={{ position: "absolute", top: 104, left: 110, right: 110, height: 2, backgroundColor: C.faint }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: C.accent }} />
      </div>

      <div style={{ position: "absolute", bottom: 62, left: 110, ...mono }}>
        PROTOCOL 001 <span style={{ color: C.accent }}>■</span> IGNITION
      </div>
      <div style={{ position: "absolute", bottom: 62, right: 110, ...mono }}>{section}</div>
    </AbsoluteFill>
  );
};
