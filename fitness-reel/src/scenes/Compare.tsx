import { AbsoluteFill } from "remotion";
import { C, SAFE } from "../theme";
import { vf } from "../fonts";
import { Label } from "../ui/Label";
import { Grain } from "../ui/Grain";

const LOADS = [
  { pct: 30, reps: 25, wght: 150, wdth: 70 },
  { pct: 60, reps: 15, wght: 500, wdth: 95 },
  { pct: 80, reps: 8, wght: 900, wdth: 120 },
];
const HARD = 4;

export const Compare: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, width: 860 }}>
      <Label>Each set taken close to failure</Label>
      <div style={{ ...vf(800, 92), fontSize: 104, lineHeight: 0.94, letterSpacing: "-0.03em", color: C.white, marginTop: 22 }}>
        Any weight.
        <br />
        Same finish.
      </div>
    </div>
    <div style={{ position: "absolute", left: SAFE.left, right: 150, bottom: 1920 - 1500, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      {LOADS.map((l) => (
        <div key={l.pct} style={{ width: 230, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column-reverse", gap: 6 }}>
            {Array.from({ length: l.reps }, (_, i) => {
              const hard = i >= l.reps - HARD;
              return (
                <div
                  key={i}
                  style={{
                    width: 200,
                    height: 19,
                    borderRadius: 13,
                    boxSizing: "border-box",
                    background: hard ? C.volt : C.w06,
                    border: hard ? "none" : `2px solid ${C.w12}`,
                    boxShadow: hard ? `0 0 34px ${C.voltGlow}` : "none",
                  }}
                />
              );
            })}
          </div>
          <div style={{ ...vf(l.wght, l.wdth), fontSize: 96, lineHeight: 1, letterSpacing: "-0.03em", color: C.white, marginTop: 30 }}>{l.pct}%</div>
          <Label size={22} style={{ marginTop: 8 }}>{l.reps} reps</Label>
        </div>
      ))}
    </div>
    <Grain opacity={0.14} vignette={0.5} />
  </AbsoluteFill>
);
