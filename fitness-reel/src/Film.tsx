import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useMemo } from "react";
import { C, H, SAFE, W } from "./theme";
import "./fonts";
import { MONO, vf } from "./fonts";
import { INOUT, OUT, clamp01, lerp, tw } from "./anim";
import { MuscleScene, fiberOn, project } from "./three/MuscleScene";
import { makeBundle } from "./three/bundle";
import { LIGHT_REPS, T, bundlesAt, cmpCounts, shotAt } from "./timeline";
import { Grain } from "./ui/Grain";
import { Mono, Rule, Words } from "./ui/Type";

const FIBERS = makeBundle();
const pick = (pred: (i: number) => boolean, score: (i: number) => number) => {
  let best = -1;
  FIBERS.forEach((_, i) => {
    if (pred(i) && (best < 0 || score(i) < score(best))) best = i;
  });
  return best;
};
const SMALL = pick((i) => FIBERS[i].y < -0.75 && FIBERS[i].x > 0.15 && FIBERS[i].x < 0.9, (i) => FIBERS[i].th);
const BIG = pick((i) => FIBERS[i].y < -0.7 && FIBERS[i].x < -0.15 && FIBERS[i].x > -0.9, (i) => -FIBERS[i].th);

const CHAPTERS = [
  { at: 0, t: "01 — The claim" },
  { at: T.light, t: "02 — A light set" },
  { at: T.compare, t: "03 — Light vs heavy" },
  { at: T.rule, t: "04 — The rule" },
];

const Chapter: React.FC<{ f: number }> = ({ f }) => {
  const i = CHAPTERS.reduce((a, c, k) => (f >= c.at ? k : a), 0);
  const p = tw(f, CHAPTERS[i].at + (i ? 2 : 6), CHAPTERS[i].at + (i ? 14 : 18), 0, 1, OUT);
  const end = tw(f, 586, 598, 1, 0);
  return (
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top - 24, display: "flex", alignItems: "center", gap: 18, opacity: end }}>
      <Rule p={tw(f, 4, 20, 0, 1, OUT)} w={40} />
      <div style={{ height: 30, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${(1 - p) * 30}px)`, opacity: p }}>
          <Mono color={C.w60}>{CHAPTERS[i].t}</Mono>
        </div>
      </div>
    </div>
  );
};

// fibers actually firing, counted from the same model the renderer uses
const pctOn = (f: number, b = 0) => {
  const s = bundlesAt(f)[b];
  if (!s) return 0;
  let n = 0;
  for (const fb of FIBERS) n += fiberOn(fb, s) > 0.5 ? 1 : 0;
  return n / FIBERS.length;
};

const Meter: React.FC<{ f: number; pct: number; o: number; left?: number; width?: number; label?: string }> = ({ f, pct, o, left = SAFE.left, width = SAFE.right - SAFE.left, label = "Fibers recruited" }) => (
  <div style={{ position: "absolute", left, top: 1310, width, opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Mono size={21}>{label}</Mono>
      <div style={{ ...vf(700, 80), fontSize: 60, letterSpacing: "-0.03em", color: C.white, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(pct * 100)}
        <span style={{ fontSize: 32, color: C.w60 }}>%</span>
      </div>
    </div>
    <div style={{ marginTop: 12, height: 3, background: C.w12, borderRadius: 2 }}>
      <div style={{ width: `${pct * 100}%`, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.ember}, ${pct > 0.8 ? C.hot : C.ember})`, boxShadow: `0 0 16px ${C.ember}` }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
      {Array.from({ length: 11 }, (_, i) => (
        <div key={i} style={{ width: 2, height: i % 5 === 0 ? 10 : 5, background: C.w35 }} />
      ))}
    </div>
    <span style={{ display: "none" }}>{f}</span>
  </div>
);

// rep counter: the number rolls up on every rep
const RepCounter: React.FC<{ f: number; reps: number[]; total: number; x: number; y: number; o: number; size?: number; label?: string }> = ({ f, reps, total, x, y, o, size = 120, label = "Rep" }) => {
  let n = 0;
  let last = -1e9;
  for (const r of reps) if (f >= r) { n++; last = r; }
  const roll = tw(f, last, last + 5, 0, 1, OUT);
  const pad = (v: number) => String(Math.max(0, v)).padStart(2, "0");
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
      <Mono size={21}>{label}</Mono>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 6 }}>
        <div style={{ height: size * 0.82, overflow: "hidden", ...vf(800, 76), fontSize: size, lineHeight: 0.82, letterSpacing: "-0.04em", color: C.white, fontVariantNumeric: "tabular-nums" }}>
          <div style={{ transform: `translateY(${-roll * size * 0.82}px)` }}>
            <div>{pad(n - 1 < 0 ? 0 : n - 1)}</div>
            <div>{pad(n)}</div>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.w35, paddingBottom: 6 }}>/{total}</div>
      </div>
    </div>
  );
};

const Callout: React.FC<{ f: number; at: number; out: number; px: number; py: number; text: string; sub: string }> = ({ f, at, out, px, py, text, sub }) => {
  const side: 1 | -1 = px > W / 2 ? -1 : 1;
  const draw = tw(f, at, at + 14, 0, 1, OUT);
  const lab = tw(f, at + 8, at + 20, 0, 1, OUT);
  const gone = tw(f, out, out + 10, 0, 1, INOUT);
  const ex = px + side * 90;
  const ey = 600;
  const lx = side > 0 ? Math.min(ex + 70, SAFE.right - 330) : Math.max(ex - 70, SAFE.left + 330);
  return (
    <AbsoluteFill style={{ opacity: 1 - gone }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={px} cy={py} r={10 + (1 - draw) * 16} fill="none" stroke={C.white} strokeWidth={2} opacity={draw} />
        <circle cx={px} cy={py} r={3} fill={C.white} opacity={draw} />
        <polyline points={`${px},${py} ${ex},${ey} ${lx},${ey}`} fill="none" stroke={C.white} strokeWidth={1.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={0.8} />
      </svg>
      <div style={{ position: "absolute", left: side > 0 ? lx + 14 : undefined, right: side < 0 ? W - lx + 14 : undefined, top: ey - 34, opacity: lab, transform: `translateX(${(1 - lab) * side * 16}px)`, textAlign: side > 0 ? "left" : "right" }}>
        <div style={{ ...vf(650, 86), fontSize: 36, letterSpacing: "-0.02em", color: C.white }}>{text}</div>
        <Mono size={19} style={{ marginTop: 6 }}>{sub}</Mono>
      </div>
    </AbsoluteFill>
  );
};

const faceEllipse = (f: number, bx = 0, sc = 1) => {
  const shot = shotAt(f);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const p = project(shot, [bx + Math.cos(a) * 1.53 * sc, 0.08 * sc, -Math.sin(a) * 1.53 * sc], W, H);
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 };
};

export const Film: React.FC<{ sub?: number }> = ({ sub = 1 }) => {
  const f = useCurrentFrame() / sub;
  const shot = shotAt(f);
  const bundles = useMemo(() => bundlesAt(f), [f]);
  const topShade = f < T.compare ? 0.92 : 0.85;

  // dial -> face ellipse morph (light set intro)
  const dialOn = f >= T.light && f < 166;
  const arc = tw(f, 100, 126, 0, 0.3, INOUT);
  const morph = tw(f, 126, 150, 0, 1, INOUT);
  const fe = dialOn ? faceEllipse(Math.max(f, 126)) : { cx: 0, cy: 0, rx: 0, ry: 0 };
  const dial = { cx: lerp(540, fe.cx, morph), cy: lerp(1080, fe.cy, morph), rx: lerp(250, fe.rx, morph), ry: lerp(250, fe.ry, morph) };
  const dialO = tw(f, T.light + 2, T.light + 12, 0, 1) * tw(f, 148, 164, 1, 0);

  // projected anchors for callouts
  const fp = (i: number) => {
    const fb = FIBERS[i];
    return project(shot, [fb.x, 0.14, -fb.y], W, H);
  };
  const small = fp(SMALL);
  const big = fp(BIG);

  // dive white-out
  const white = f < T.compare ? tw(f, 358, 371, 0, 1, [0.6, 0, 0.9, 0.5]) : tw(f, T.compare, T.compare + 16, 1, 0, OUT);

  // compare labels above each muscle
  const cm = cmpCounts(f);
  const lPos = f >= T.compare && f < T.rule ? project(shot, [-1.02, 0.1, 0], W, H) : { x: 0, y: 0 };
  const hPos = f >= T.compare && f < T.rule ? project(shot, [1.02, 0.1, 0], W, H) : { x: 0, y: 0 };
  const cmpO = tw(f, T.compare + 4, T.compare + 16, 0, 1) * tw(f, T.merge, T.merge + 12, 1, 0);

  const failFlash = f >= T.rep25 ? Math.exp(-(f - T.rep25) / 7) : 0;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <MuscleScene width={W} height={H} f={f} bundles={bundles} shot={shot} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,10,10,${topShade}) 0%, rgba(10,10,10,0.55) 24%, rgba(10,10,10,0) 37%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.82) 30%, rgba(10,10,10,0) 48%)" }} />

      {/* ---------- 01 hook ---------- */}
      {f < T.light ? (
        <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, color: C.white }}>
          <Words f={f} text="Light weights" at={1} out={T.hookOut - 4} wght={[160, 250]} wdth={78} style={{ fontSize: 132, lineHeight: 0.92, letterSpacing: "-0.035em" }} />
          <div style={{ transform: `scale(${1 + 0.06 * (1 - tw(f, 14, 28, 0, 1, OUT))})`, transformOrigin: "0% 50%" }}>
            <Words f={f} text="build muscle." at={14} out={T.hookOut - 1} stagger={4} wght={[200, 860]} wdth={88} style={{ fontSize: 132, lineHeight: 0.92, letterSpacing: "-0.04em" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 48, opacity: tw(f, 32, 42, 0, 1) * tw(f, T.hookOut, T.hookOut + 8, 1, 0) }}>
            <Rule p={tw(f, 32, 48, 0, 1, OUT)} />
            <Mono color={C.white}>One condition</Mono>
          </div>
        </div>
      ) : null}

      {/* ---------- 02 light set ---------- */}
      {dialOn ? (
        <AbsoluteFill style={{ opacity: dialO }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={dial.cx} cy={dial.cy} rx={dial.rx} ry={dial.ry} fill="none" stroke={C.w12} strokeWidth={3} />
            <ellipse
              cx={dial.cx}
              cy={dial.cy}
              rx={dial.ry}
              ry={dial.rx}
              fill="none"
              stroke={C.ember}
              strokeWidth={4}
              pathLength={1}
              strokeDasharray={`${lerp(arc, 1, morph)} 1`}
              transform={`rotate(-90 ${dial.cx} ${dial.cy})`}
              style={{ filter: `drop-shadow(0 0 10px ${C.ember})` }}
              strokeLinecap="round"
            />
            {Array.from({ length: 40 }, (_, k) => {
              const a = (k / 40) * Math.PI * 2 - Math.PI / 2;
              const r0 = dial.rx + 22;
              return <line key={k} x1={dial.cx + Math.cos(a) * r0} y1={dial.cy + Math.sin(a) * (dial.ry + 22)} x2={dial.cx + Math.cos(a) * (r0 + (k % 5 ? 8 : 16))} y2={dial.cy + Math.sin(a) * (dial.ry + 22 + (k % 5 ? 8 : 16))} stroke={C.w35} strokeWidth={2} opacity={1 - morph} />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080 - 90, textAlign: "center", opacity: tw(f, 128, 136, 1, 0) }}>
            <div style={{ ...vf(260, 80), fontSize: 150, lineHeight: 1, letterSpacing: "-0.04em", color: C.white, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(arc * 100)}
              <span style={{ fontSize: 70, color: C.w60 }}>%</span>
            </div>
            <Mono style={{ marginTop: 6 }}>Of your max</Mono>
          </div>
        </AbsoluteFill>
      ) : null}
      {f >= T.light && f < T.compare ? (
        <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, color: C.white }}>
          {f < 154 ? (
            <>
              <Words f={f} text="A light set." at={T.light + 6} out={146} wght={[300, 780]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em" }} />
              <Words f={f} text="25 reps to failure." at={T.light + 14} out={147} wght={[260, 260]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.w60 }} />
            </>
          ) : f < T.fail ? (
            <>
              <Words f={f} text="Early reps:" at={154} out={T.fail - 8} wght={[300, 780]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em" }} />
              <Words f={f} text="a few fibers work." at={160} out={T.fail - 7} wght={[260, 260]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.w60 }} />
            </>
          ) : (
            <>
              <Words f={f} text="Last reps:" at={T.fail} out={T.dive} wght={[300, 780]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em" }} />
              <Words f={f} text="nearly all of them." at={T.fail + 6} out={T.dive + 1} wght={[260, 260]} style={{ fontSize: 96, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.w60 }} />
            </>
          )}
        </div>
      ) : null}
      {f >= 140 && f < T.compare ? (
        <>
          <RepCounter f={f} reps={LIGHT_REPS} total={25} x={SAFE.left} y={1110} o={tw(f, 144, 156, 0, 1) * tw(f, T.dive, T.dive + 8, 1, 0)} />
          <Meter f={f} pct={pctOn(f)} o={tw(f, 148, 162, 0, 1) * tw(f, T.dive, T.dive + 8, 1, 0)} />
          {f >= 176 && f < 250 ? <Callout f={f} at={178} out={238} px={small.x} py={small.y} text="Small fibers first" sub="Low-threshold units" /> : null}
          {f >= 276 && f < 345 ? <Callout f={f} at={278} out={332} px={big.x} py={big.y} text="Big fibers join late" sub="High-threshold units" /> : null}
          {f >= T.rep25 && f < T.dive + 8 ? (
            <div style={{ position: "absolute", left: SAFE.left + 330, top: 1180, opacity: tw(f, T.rep25, T.rep25 + 4, 0, 1) * tw(f, T.dive, T.dive + 8, 1, 0), display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: C.ember, boxShadow: `0 0 14px ${C.ember}` }} />
              <Mono color={C.white}>0 reps in reserve</Mono>
            </div>
          ) : null}
        </>
      ) : null}
      {failFlash > 0.01 && f < T.compare ? <AbsoluteFill style={{ background: C.hot, opacity: failFlash * 0.18, mixBlendMode: "screen" }} /> : null}

      {/* ---------- 03 light vs heavy ---------- */}
      {f >= T.compare && f < T.rule + 20 ? (
        <>
          <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, color: C.white }}>
            {f < 432 ? (
              <>
                <Words f={f} text="Heavy fires early." at={T.compare + 2} out={426} wght={[300, 780]} style={{ fontSize: 92, lineHeight: 0.96, letterSpacing: "-0.035em" }} />
                <Words f={f} text="Light fires late." at={T.compare + 8} out={427} wght={[260, 260]} style={{ fontSize: 92, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.w60 }} />
              </>
            ) : (
              <Words f={f} text="Same finish." at={434} out={T.rule + 4} wght={[200, 860]} stagger={5} style={{ fontSize: 132, lineHeight: 0.96, letterSpacing: "-0.04em" }} />
            )}
          </div>
          {f < T.merge + 14 ? (
            <AbsoluteFill style={{ opacity: cmpO }}>
              <div style={{ position: "absolute", left: lPos.x - 170, top: 1130, width: 340, textAlign: "center" }}>
                <div style={{ ...vf(220, 72), fontSize: 64, letterSpacing: "-0.03em", color: C.white }}>Light</div>
                <Mono size={20} style={{ marginTop: 4 }}>30% · rep {String(cm.light).padStart(2, "0")}/25</Mono>
              </div>
              <div style={{ position: "absolute", left: hPos.x - 170, top: 1130, width: 340, textAlign: "center" }}>
                <div style={{ ...vf(900, 118), fontSize: 64, letterSpacing: "-0.03em", color: C.white }}>Heavy</div>
                <Mono size={20} style={{ marginTop: 4 }}>80% · rep {String(cm.heavy).padStart(2, "0")}/8</Mono>
              </div>
              <Meter f={f} pct={pctOn(f, 0)} o={1} left={SAFE.left} width={330} label="Light" />
              <Meter f={f} pct={pctOn(f, 1)} o={1} left={SAFE.right - 330} width={330} label="Heavy" />
            </AbsoluteFill>
          ) : null}
        </>
      ) : null}

      {/* ---------- 04 the rule + end ---------- */}
      {f >= T.rule ? (
        <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, color: C.white }}>
          {f < T.end ? (
            <>
              <Words f={f} text="Stop 0–3 reps" at={T.rule + 6} out={T.end - 6} wght={[300, 820]} style={{ fontSize: 112, lineHeight: 0.94, letterSpacing: "-0.04em" }} />
              <Words f={f} text="before failure." at={T.rule + 14} out={T.end - 5} wght={[260, 260]} style={{ fontSize: 112, lineHeight: 0.94, letterSpacing: "-0.04em", color: C.w60 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40, opacity: tw(f, T.rule + 26, T.rule + 38, 0, 1) * tw(f, T.end - 6, T.end + 2, 1, 0) }}>
                <Rule p={tw(f, T.rule + 26, T.rule + 42, 0, 1, OUT)} w={40} color={C.w35} />
                <Mono size={27} color={C.w60}>Max strength? Heavy still wins.</Mono>
              </div>
            </>
          ) : (
            <>
              <Words f={f} text="Save this for" at={T.end + 4} wght={[300, 300]} style={{ fontSize: 112, lineHeight: 0.94, letterSpacing: "-0.04em", color: C.w60 }} />
              <Words f={f} text="your next set." at={T.end + 10} wght={[300, 820]} style={{ fontSize: 112, lineHeight: 0.94, letterSpacing: "-0.04em" }} />
            </>
          )}
        </div>
      ) : null}
      {f >= T.end ? (
        <div style={{ position: "absolute", left: SAFE.left, top: 1300, display: "flex", alignItems: "center", gap: 18, opacity: tw(f, T.end + 18, T.end + 30, 0, 1) }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.w35}` }} />
          <div>
            <div style={{ ...vf(700, 90), fontSize: 38, letterSpacing: "-0.02em", color: C.white }}>@yourbrand</div>
            <Mono size={19} style={{ marginTop: 4 }}>Train smarter</Mono>
          </div>
        </div>
      ) : null}

      <Chapter f={f} />
      {white > 0.001 ? <AbsoluteFill style={{ background: C.hot, opacity: white }} /> : null}
      <Grain opacity={0.13} vignette={0.45} seed={Math.floor(f)} />
      <span style={{ display: "none" }}>{clamp01(0)}</span>
    </AbsoluteFill>
  );
};
