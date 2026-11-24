import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

/** Faint 12-column brutalist grid + baseline rows. */
export const Grid: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const { width, height } = useVideoConfig();
  const cols = 12;
  const col = width / cols;
  const lines: React.ReactNode[] = [];
  for (let i = 1; i < cols; i++) {
    lines.push(
      <line key={`v${i}`} x1={i * col} y1={0} x2={i * col} y2={height} stroke={C.ink} strokeOpacity={0.045} />,
    );
  }
  for (let y = 160; y < height; y += 160) {
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={C.ink} strokeOpacity={0.035} />);
  }
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width={width} height={height}>
        {lines}
      </svg>
    </AbsoluteFill>
  );
};

/** A slow, moving key light so black never feels flat. */
export const KeyLight: React.FC<{ tint?: string; strength?: number }> = ({
  tint = "255,255,255",
  strength = 0.1,
}) => {
  const frame = useCurrentFrame();
  const x = 50 + Math.sin(frame / 70) * 18;
  const y = 34 + Math.cos(frame / 90) * 10;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 45% at ${x}% ${y}%, rgba(${tint},${strength}) 0%, rgba(${tint},0) 70%)`,
      }}
    />
  );
};

/** Film grain (animated turbulence), scanlines, a rolling scan band and a vignette. */
export const Texture: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = Math.floor(frame / 2) % 97;
  const bandY = interpolate(frame % 150, [0, 150], [-200, height + 200]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} style={{ position: "absolute", mixBlendMode: "overlay", opacity: 0.55 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: bandY,
          height: 180,
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Full-frame flash used on hard cuts. */
export const Flash: React.FC<{ at: number[]; color?: string; len?: number }> = ({ at, color = C.ink, len = 4 }) => {
  const frame = useCurrentFrame();
  let o = 0;
  for (const s of at) {
    if (frame >= s && frame < s + len) o = Math.max(o, interpolate(frame, [s, s + len], [0.9, 0]));
  }
  if (o === 0) return null;
  return <AbsoluteFill style={{ backgroundColor: color, opacity: o, mixBlendMode: "difference" }} />;
};
