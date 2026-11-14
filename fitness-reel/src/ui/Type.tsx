import { C } from "../theme";
import { MONO, vf } from "../fonts";
import { OUT, tw } from "../anim";

export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.w60, size = 24, style }) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.16em", textTransform: "uppercase", color, whiteSpace: "nowrap", ...style }}>{children}</div>
);

// words rise out of a blur; exits lift and blur away
export const Words: React.FC<{
  f: number;
  text: string;
  at: number;
  out?: number;
  stagger?: number;
  style?: React.CSSProperties;
  wght?: [number, number];
  wdth?: number;
}> = ({ f, text, at, out, stagger = 3, style, wght = [700, 700], wdth = 88 }) => (
  <div style={{ whiteSpace: "nowrap", ...style }}>
    {text.split(" ").map((w, i) => {
      const p = tw(f, at + i * stagger, at + i * stagger + 14, 0, 1, OUT);
      const q = out === undefined ? 0 : tw(f, out + i * 1.5, out + i * 1.5 + 9, 0, 1, [0.6, 0, 0.9, 0.5]);
      const wg = wght[0] + (wght[1] - wght[0]) * tw(f, at + i * stagger, at + i * stagger + 12, 0, 1, OUT);
      return (
        <span
          key={i}
          style={{
            ...vf(wg, wdth),
            display: "inline-block",
            marginRight: "0.24em",
            opacity: Math.min(1, p * 1.4) * (1 - q),
            transform: `translateY(${(1 - p) * 34 - q * 40}px)`,
            filter: `blur(${(1 - p) * 10 + q * 12}px)`,
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

export const Rule: React.FC<{ p: number; w?: number; color?: string }> = ({ p, w = 56, color = C.ember }) => (
  <div style={{ width: w * p, height: 3, background: color, borderRadius: 2, boxShadow: `0 0 12px ${color}` }} />
);
