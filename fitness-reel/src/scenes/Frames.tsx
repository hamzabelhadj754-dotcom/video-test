import { AbsoluteFill } from "remotion";
import { C, H, SAFE, W } from "../theme";
import { MONO, vf } from "../fonts";
import { MuscleScene, Shot } from "../three/MuscleScene";
import { Grain } from "../ui/Grain";

const Mono: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.w60, style }) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

const Rule: React.FC<{ w?: number; color?: string }> = ({ w = 56, color = C.ember }) => (
  <div style={{ width: w, height: 3, background: color, borderRadius: 2 }} />
);

const BASE: Shot = { cam: [2.2, 6.4, 10.5], look: [0, 0.2, 0], fov: 29 };

export const FrameHook: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <MuscleScene width={W} height={H} activation={1} heat={1} shot={{ cam: [0.5, 5.4, 6.6], look: [0, 1.5, 0], fov: 32, roll: -0.06 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 22%, rgba(10,10,10,0) 36%)" }} />
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 10 }}>
      <div style={{ ...vf(250, 78), fontSize: 132, lineHeight: 0.9, letterSpacing: "-0.035em", color: C.white }}>Light weights</div>
      <div style={{ ...vf(860, 88), fontSize: 132, lineHeight: 0.9, letterSpacing: "-0.04em", color: C.white }}>build muscle.</div>
    </div>
    <div style={{ position: "absolute", left: SAFE.left, top: 590, display: "flex", alignItems: "center", gap: 20 }}>
      <Rule />
      <Mono color={C.white}>One condition</Mono>
    </div>
    <Grain opacity={0.13} vignette={0.45} />
  </AbsoluteFill>
);

export const FrameLight: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <MuscleScene width={W} height={H} activation={0.24} heat={0} shot={BASE} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 24%, rgba(10,10,10,0) 36%)" }} />
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 10 }}>
      <Mono>Light set · rep 04 of 25</Mono>
      <div style={{ ...vf(780, 88), fontSize: 92, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.white, marginTop: 26 }}>
        Early reps:
        <br />
        <span style={{ ...vf(260, 88), color: C.w60 }}>a few fibers work.</span>
      </div>
    </div>
    <Meter pct={24} />
    <Grain opacity={0.13} vignette={0.45} />
  </AbsoluteFill>
);

export const FrameFail: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <MuscleScene width={W} height={H} activation={1} heat={1} shot={{ cam: [2.8, 5.2, 9.8], look: [0, 0.4, 0], fov: 30 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.5) 24%, rgba(10,10,10,0) 36%)" }} />
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 10 }}>
      <Mono>Light set · rep 25 of 25</Mono>
      <div style={{ ...vf(780, 88), fontSize: 92, lineHeight: 0.96, letterSpacing: "-0.035em", color: C.white, marginTop: 26 }}>
        Last reps:
        <br />
        <span style={{ ...vf(260, 88), color: C.w60 }}>nearly all of them.</span>
      </div>
    </div>
    <Meter pct={96} />
    <Grain opacity={0.13} vignette={0.45} />
  </AbsoluteFill>
);

// fibers recruited readout
const Meter: React.FC<{ pct: number }> = ({ pct }) => (
  <div style={{ position: "absolute", left: SAFE.left, top: 1560, width: SAFE.right - SAFE.left }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Mono>Fibers recruited</Mono>
      <div style={{ ...vf(700, 80), fontSize: 64, letterSpacing: "-0.03em", color: C.white, fontVariantNumeric: "tabular-nums" }}>
        {pct}
        <span style={{ fontSize: 36, color: C.w60 }}>%</span>
      </div>
    </div>
    <div style={{ marginTop: 14, height: 3, background: C.w12, borderRadius: 2 }}>
      <div style={{ width: `${pct}%`, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.ember}, ${pct > 80 ? C.hot : C.ember})`, boxShadow: `0 0 18px ${C.ember}` }} />
    </div>
  </div>
);
