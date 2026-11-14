import { AbsoluteFill } from "remotion";
import { C, SAFE } from "../theme";
import { vf } from "../fonts";
import { Label } from "../ui/Label";
import { Grain } from "../ui/Grain";

export const Hook: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", left: SAFE.left, top: 470 }}>
      <Label>30% of your max</Label>
      <div style={{ ...vf(100, 62), fontSize: 330, lineHeight: 0.86, letterSpacing: "-0.02em", color: C.white, marginTop: 18, marginLeft: -8 }}>LIGHT</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "46px 0 50px 4px" }}>
        <div style={{ width: 150, height: 14, borderRadius: 7, background: C.volt, boxShadow: `0 0 40px ${C.voltGlow}` }} />
        <div style={{ width: 150, height: 14, borderRadius: 7, background: C.volt, boxShadow: `0 0 40px ${C.voltGlow}` }} />
      </div>
      <div style={{ ...vf(900, 125), fontSize: 200, lineHeight: 0.86, letterSpacing: "-0.035em", color: C.white, marginLeft: -10 }}>HEAVY</div>
      <Label style={{ marginTop: 26 }}>80% of your max</Label>
    </div>
    <div style={{ position: "absolute", left: SAFE.left, top: 1330 }}>
      <div style={{ ...vf(700, 100), fontSize: 66, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.white }}>Same muscle growth.</div>
      <div style={{ ...vf(400, 100), fontSize: 66, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.w35 }}>One condition.</div>
    </div>
    <Grain opacity={0.14} vignette={0.5} />
  </AbsoluteFill>
);
