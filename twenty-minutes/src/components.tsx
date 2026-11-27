import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, display, EASE, MARGIN, mono } from "./theme";
import { clamp01, lerp, prog } from "./timeline";

// ── Background: studio black, warm light pool, vignette, living grain ───────
export const Backdrop: React.FC<{ lightY?: number }> = ({ lightY = 760 }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 90) * 40;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 1100px at ${540 + drift}px ${lightY}px, rgba(70,52,40,0.42) 0%, rgba(30,24,20,0.22) 38%, rgba(10,10,11,0) 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 120% 85% at 50% 48%, rgba(0,0,0,0) 55%, rgba(4,4,5,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  // 8 pre-baked grain plates (half-res, upscaled = film-sized grain), cycled per frame
  return (
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.32, pointerEvents: "none" }}>
      <Img src={staticFile(`grain${f % 8}.png`)} style={{ width: 1080, height: 1920, imageRendering: "auto" }} />
    </AbsoluteFill>
  );
};

// ── Timer face: tabular digits, the colon is the only accent ─────────────────
export const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export const Clock: React.FC<{
  text: string;
  size: number;
  colon?: string;
  style?: React.CSSProperties;
  reveal?: number; // local frame of an odometer-style rise-in (undefined = static)
  colonAlpha?: number;
}> = ({ text, size, colon = C.work, style, reveal, colonAlpha = 1 }) => (
  <div style={{ ...display(size), display: "flex", alignItems: "baseline", whiteSpace: "nowrap", ...style }}>
    {text.split("").map((ch, i) => {
      const t = reveal === undefined ? 1 : prog(reveal, i * 2.2, i * 2.2 + 16, EASE.settle);
      const isColon = ch === ":";
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            paddingTop: "0.08em",
            marginTop: "-0.08em",
            margin: isColon ? `0 ${size * -0.02}px` : undefined,
          }}
        >
          <span
            style={{
              display: "inline-block",
              color: isColon ? colon : undefined,
              opacity: isColon ? colonAlpha : 1,
              transform: `translateY(${(1 - t) * 110 + (isColon ? -6 : 0)}%)`,
            }}
          >
            {ch}
          </span>
        </span>
      );
    })}
  </div>
);

// ── Rising type: each glyph rises out of its own mask ────────────────────────
export const Rise: React.FC<{
  text: string;
  f: number; // local frame where 0 = start of reveal
  style: React.CSSProperties;
  stagger?: number;
  dur?: number;
  out?: number; // frame (local) to start exit, optional
  color?: string;
}> = ({ text, f, style, stagger = 1.6, dur = 16, out, color }) => {
  const chars = text.split("");
  return (
    <div style={{ display: "flex", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const t = prog(f, i * stagger, i * stagger + dur, EASE.settle);
        const o = out === undefined ? 0 : prog(f, out + i * stagger * 0.6, out + i * stagger * 0.6 + 10, EASE.in);
        const y = (1 - t) * 105 - o * 105;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingTop: "0.06em", marginTop: "-0.06em" }}>
            <span style={{ display: "inline-block", transform: `translateY(${y}%)`, color }}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
};

// ── Typed mono label ─────────────────────────────────────────────────────────
export const Typed: React.FC<{ text: string; f: number; cps?: number; style?: React.CSSProperties }> = ({
  text,
  f,
  cps = 1.4,
  style,
}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(f * cps)));
  const caret = f >= 0 && n < text.length;
  return (
    <div style={{ whiteSpace: "pre", ...style }}>
      {text.slice(0, n)}
      <span style={{ opacity: caret ? 1 : 0, color: C.work }}>▌</span>
    </div>
  );
};

// ── Cue: leader line from a joint to a mono label ────────────────────────────
export const Cue: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  label: string;
  f: number; // local, 0 = start
  align?: "left" | "right";
  color?: string;
  out?: number;
}> = ({ from, to, label, f, align = "right", color = C.ink, out }) => {
  const draw = prog(f, 0, 12, EASE.out);
  const fade = out === undefined ? 1 : 1 - prog(f, out, out + 8, EASE.in);
  if (f < 0) return null;
  const ex = lerp(from.x, to.x, draw);
  const ey = lerp(from.y, to.y, draw);
  const len = 70;
  const hx = align === "right" ? to.x + len * draw : to.x - len * draw;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fade }}>
        <circle cx={from.x} cy={from.y} r={22 * draw} fill="none" stroke={C.work} strokeWidth={2} strokeOpacity={0.9} />
        <line x1={from.x} y1={from.y} x2={ex} y2={ey} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2} />
        {draw > 0.99 && <line x1={to.x} y1={to.y} x2={hx} y2={to.y} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2} />}
      </svg>
      <div
        style={{
          position: "absolute",
          top: to.y - 46,
          ...(align === "right" ? { left: to.x } : { right: 1080 - to.x }),
          opacity: fade,
        }}
      >
        <Typed text={label} f={f - 8} cps={1.6} style={mono(30, { color, letterSpacing: "0.18em", fontWeight: 600 })} />
      </div>
    </>
  );
};

// ── Exercise header: counter + progress through the 5 moves ──────────────────
export const Header: React.FC<{ idx: number; f: number; dur: number }> = ({ idx, f, dur }) => {
  const inT = prog(f, -4, 14, EASE.out);
  const segW = (1080 - MARGIN * 2 - 4 * 12) / 5;
  return (
    <>
      <div style={{ position: "absolute", top: 232, left: MARGIN, display: "flex", gap: 18, alignItems: "baseline", opacity: inT }}>
        <span style={mono(30, { color: C.work, fontWeight: 700 })}>{`0${idx + 1}`}</span>
        <span style={mono(30, { color: C.rest })}>/ 05</span>
      </div>
      <div style={{ position: "absolute", top: 232, right: MARGIN, opacity: inT }}>
        <span style={mono(30, { color: C.ink, fontWeight: 600 })}>40</span>
        <span style={mono(30, { color: C.rest })}> SEC</span>
      </div>
      {/* 5-move progress — it is also the film's progress bar */}
      <div style={{ position: "absolute", top: 1486, left: MARGIN, display: "flex", gap: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = i < idx ? 1 : i === idx ? clamp01(f / dur) : 0;
          return (
            <div key={i} style={{ width: segW, height: 6, background: C.line, position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${fill * 100}%`,
                  background: i === idx ? C.work : C.rest,
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── Floor: a measured stage line ─────────────────────────────────────────────
export const Floor: React.FC<{ y: number; f: number }> = ({ y, f }) => {
  const t = prog(f, -6, 18, EASE.out);
  const ticks = [];
  for (let x = MARGIN; x <= 1080 - MARGIN; x += 37) ticks.push(x);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={540 - 444 * t} x2={540 + 444 * t} y1={y} y2={y} stroke={C.ink} strokeOpacity={0.32} strokeWidth={2} />
      {ticks.map((x, i) => (
        <line
          key={i}
          x1={x}
          x2={x}
          y1={y + 10}
          y2={y + (i % 5 === 0 ? 26 : 18)}
          stroke={C.ink}
          strokeOpacity={0.16 * clamp01(t * 12 - Math.abs(x - 540) / 60)}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
};

// ── Ghost number: outline numeral far behind the action (depth layer) ───────
export const GhostNum: React.FC<{ n: string; f: number }> = ({ n, f }) => (
  <div
    style={{
      position: "absolute",
      right: -60 + f * 0.9,
      top: 560,
      ...display(1150, { color: "transparent", lineHeight: 1, letterSpacing: "-0.06em" }),
      WebkitTextStroke: `2px rgba(237,235,230,0.05)`,
    }}
  >
    {n}
  </div>
);
