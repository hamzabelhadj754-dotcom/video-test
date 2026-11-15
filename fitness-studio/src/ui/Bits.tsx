import { C } from "../theme";
import { ff } from "../fonts";
import { OUT, tw } from "../anim";

// Centered kinetic line. Wrap a word in *stars* to colour it with the accent.
export const Line: React.FC<{
  f: number;
  text: string;
  at: number;
  out?: number;
  size?: number;
  wght?: number;
  color?: string;
  stagger?: number;
  align?: "center" | "left";
  glow?: boolean;
}> = ({ f, text, at, out, size = 96, wght = 600, color = C.ink, stagger = 3, align = "center", glow }) => (
  <div style={{ textAlign: align, whiteSpace: "nowrap", fontSize: size, lineHeight: 1.04, letterSpacing: "-0.035em", ...ff(wght), color }}>
    {text.split(" ").map((w, i) => {
      const acc = w.startsWith("*");
      const word = w.replace(/\*/g, "");
      const p = tw(f, at + i * stagger, at + i * stagger + 16, 0, 1, OUT);
      const q = out === undefined ? 0 : tw(f, out + i * 1.2, out + i * 1.2 + 10, 0, 1, [0.6, 0, 0.9, 0.5]);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.22em",
            color: acc ? C.accent : undefined,
            opacity: Math.min(1, p * 1.5) * (1 - q),
            transform: `translateY(${(1 - p) * 26 - q * 18}px) scale(${0.96 + 0.04 * p})`,
            filter: `blur(${(1 - p) * 12 + q * 14}px)`,
            textShadow: glow ? "0 0 40px rgba(255,255,255,0.45)" : undefined,
          }}
        >
          {word}
        </span>
      );
    })}
  </div>
);

const ICONS: Record<string, React.ReactNode> = {
  check: <path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  flame: (
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.4-5 .2 1.6.9 2.6 2 3 0-3 .1-5.5.6-8z" fill="currentColor" />
  ),
  bolt: <path d="M13 2L5 13.5h5.5L9.5 22 18 10.5h-5.5L13 2z" fill="currentColor" />,
  dumbbell: (
    <g fill="currentColor">
      <rect x="2" y="8" width="3" height="8" rx="1.2" />
      <rect x="5.5" y="6" width="3" height="12" rx="1.2" />
      <rect x="15.5" y="6" width="3" height="12" rx="1.2" />
      <rect x="19" y="8" width="3" height="8" rx="1.2" />
      <rect x="8.5" y="10.8" width="7" height="2.4" rx="1" />
    </g>
  ),
};

export const Card: React.FC<{ title: string; sub: string; bg: string; ink: string; icon: keyof typeof ICONS; w?: number; glow?: number; style?: React.CSSProperties }> = ({ title, sub, bg, ink, icon, w = 760, glow = 0, style }) => (
  <div
    style={{
      width: w,
      height: 150,
      boxSizing: "border-box",
      borderRadius: 34,
      background: bg,
      display: "flex",
      alignItems: "center",
      padding: "0 34px",
      gap: 26,
      boxShadow: `0 24px 60px rgba(0,0,0,0.08), 0 2px 0 rgba(255,255,255,0.8) inset, 0 0 ${60 * glow}px rgba(255,77,26,${0.35 * glow})`,
      ...style,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ ...ff(650), fontSize: 46, letterSpacing: "-0.03em", color: C.ink }}>{title}</div>
      <div style={{ ...ff(450), fontSize: 30, letterSpacing: "-0.01em", color: C.ink60, marginTop: 4 }}>{sub}</div>
    </div>
    <div style={{ width: 84, height: 84, borderRadius: 24, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", color: ink, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
      <svg width="46" height="46" viewBox="0 0 24 24">
        {ICONS[icon]}
      </svg>
    </div>
  </div>
);

export const Chip: React.FC<{ text: string; bg: string; ink: string; style?: React.CSSProperties }> = ({ text, bg, ink, style }) => (
  <div
    style={{
      padding: "18px 30px",
      borderRadius: 999,
      background: bg,
      color: ink,
      ...ff(650),
      fontSize: 38,
      letterSpacing: "-0.02em",
      whiteSpace: "nowrap",
      boxShadow: "0 16px 40px rgba(0,0,0,0.08), 0 2px 0 rgba(255,255,255,0.8) inset",
      ...style,
    }}
  >
    {text}
  </div>
);
