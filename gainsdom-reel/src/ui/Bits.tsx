import { C, SILVER, chamfer } from "../theme";
import { disp, ff } from "../fonts";
import { OUT, tw } from "../anim";

// Kinetic line. Small/light lines use the text face; big lines use the condensed display face in caps.
// Wrap a word in *stars* for the beveled-silver treatment.
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
}> = ({ f, text, at, out, size = 96, wght = 600, color = C.ink, stagger = 3, align = "center", glow }) => {
  const display = size >= 70 && wght >= 560;
  const face = display ? { ...disp(Math.min(900, wght + 180), 72), letterSpacing: "-0.01em", lineHeight: 0.98 } : { ...ff(wght), letterSpacing: "-0.02em", lineHeight: 1.1 };
  return (
    <div style={{ textAlign: align, whiteSpace: "nowrap", fontSize: display ? size * 1.2 : size, color, ...face }}>
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
              opacity: Math.min(1, p * 1.5) * (1 - q),
              transform: `translateY(${(1 - p) * 26 - q * 18}px) scale(${0.96 + 0.04 * p})`,
              filter: `blur(${(1 - p) * 12 + q * 14}px)${acc ? " drop-shadow(0 0 10px rgba(255,255,255,0.25))" : ""}`,
              ...(acc ? { backgroundImage: SILVER, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}),
              textShadow: glow && !acc ? "0 0 40px rgba(255,255,255,0.4)" : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const ICONS: Record<string, React.ReactNode> = {
  check: <path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
  flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.9 2.4-5 .2 1.6.9 2.6 2 3 0-3 .1-5.5.6-8z" fill="currentColor" />,
  bolt: <path d="M13 2L5 13.5h5.5L9.5 22 18 10.5h-5.5L13 2z" fill="currentColor" />,
};

// dark glass panel with a bevel-lit edge and chamfered corners
export const Glass: React.FC<{ c?: number; glow?: number; solid?: boolean; style?: React.CSSProperties; children: React.ReactNode }> = ({ c = 22, glow = 0, solid, style, children }) => (
  <div style={{ position: "relative", filter: `drop-shadow(0 24px 40px rgba(0,0,0,0.55))${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(255,255,255,${0.35 * glow}))` : ""}`, ...style }}>
    <div style={{ position: "absolute", inset: 0, clipPath: chamfer(c), background: solid ? "linear-gradient(160deg,#FFFFFF,#CFD1D6)" : `linear-gradient(160deg, rgba(255,255,255,${0.42 + glow * 0.4}), rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.18))` }} />
    <div style={{ position: "absolute", inset: solid ? 0 : 2, clipPath: chamfer(c - 1), background: solid ? "linear-gradient(170deg,#FFFFFF 0%,#E9EAED 60%,#C9CCD2 100%)" : "linear-gradient(165deg, rgba(48,51,56,0.94), rgba(16,16,18,0.96))" }} />
    <div style={{ position: "relative" }}>{children}</div>
  </div>
);

export const Card: React.FC<{ title: string; sub: string; bg: string; ink: string; icon: keyof typeof ICONS; w?: number; glow?: number; style?: React.CSSProperties }> = ({ title, sub, icon, w = 760, glow = 0, style }) => (
  <Glass glow={glow} style={{ width: w, height: 150, ...style }}>
    <div style={{ height: 150, display: "flex", alignItems: "center", padding: "0 34px", gap: 26, boxSizing: "border-box" }}>
      <div style={{ flex: 1 }}>
        <div style={{ ...disp(800, 78), fontSize: 46, letterSpacing: "0.01em", color: C.ink }}>{title}</div>
        <div style={{ ...ff(450), fontSize: 29, color: C.ink60, marginTop: 6 }}>{sub}</div>
      </div>
      <div style={{ width: 84, height: 84, clipPath: chamfer(14), background: "linear-gradient(170deg,#FFFFFF,#C9CCD2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0B0B0C" }}>
        <svg width="44" height="44" viewBox="0 0 24 24">
          {ICONS[icon]}
        </svg>
      </div>
    </div>
  </Glass>
);

export const Chip: React.FC<{ text: string; bg: string; ink: string; style?: React.CSSProperties }> = ({ text, bg, style }) => {
  const solid = bg !== "glass";
  return (
    <Glass c={14} solid={solid} style={style}>
      <div style={{ padding: "16px 30px", ...disp(800, 80), fontSize: 38, letterSpacing: "0.02em", whiteSpace: "nowrap", color: solid ? "#0B0B0C" : C.ink }}>{text}</div>
    </Glass>
  );
};
