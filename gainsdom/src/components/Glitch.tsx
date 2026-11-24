import { random } from "remotion";

/**
 * Restrained glitch: when `intensity` > 0 the children are re-drawn as horizontal
 * slices with deterministic offsets, plus an accent/white channel split.
 * At 0 it renders the children untouched.
 */
export const Glitch: React.FC<{
  intensity: number;
  seed: string | number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ intensity, seed, children, style }) => {
  if (intensity <= 0) return <div style={{ position: "relative", ...style }}>{children}</div>;

  const slices = 7;
  const layers: React.ReactNode[] = [];
  for (let i = 0; i < slices; i++) {
    const top = (i / slices) * 100;
    const bottom = 100 - ((i + 1) / slices) * 100;
    const r = random(`${seed}-${i}`);
    const dx = (r - 0.5) * 70 * intensity * (r > 0.55 ? 1 : 0.15);
    layers.push(
      <div
        key={i}
        style={{
          position: i === 0 ? "relative" : "absolute",
          inset: i === 0 ? undefined : 0,
          clipPath: `inset(${top}% 0 ${bottom}% 0)`,
          transform: `translateX(${dx}px)`,
        }}
      >
        {children}
      </div>,
    );
  }

  return (
    <div style={{ position: "relative", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${-10 * intensity}px, 2px)`,
          opacity: 0.85,
          mixBlendMode: "screen",
        }}
      >
        <div style={{ filter: "url(#accentize)" }}>{children}</div>
      </div>
      {layers}
    </div>
  );
};

/** SVG filter that recolors whatever it touches to the accent. Mount once. */
export const GlitchDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="accentize">
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 1   0 0 0 0 0.29   0 0 0 0 0.11   0 0 0 1 0"
      />
    </filter>
  </svg>
);
