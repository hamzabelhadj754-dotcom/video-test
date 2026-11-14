import { AbsoluteFill } from "remotion";
import { C, SAFE } from "../theme";
import { MONO, vf } from "../fonts";
import { Label } from "../ui/Label";
import { Grain } from "../ui/Grain";

const REPS = 10;
const HARD = 3;

export const Meter: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 40, width: 860 }}>
      <Label>One set · 10 reps</Label>
      <div style={{ ...vf(800, 92), fontSize: 104, lineHeight: 0.94, letterSpacing: "-0.03em", color: C.white, marginTop: 22 }}>
        The last reps
        <br />
        do the work.
      </div>
    </div>
    {/* rep stack, rep 1 at the bottom */}
    <div style={{ position: "absolute", left: SAFE.left, bottom: SAFE.bottom === 0 ? 0 : 1920 - 1480, display: "flex", flexDirection: "column-reverse", gap: 14 }}>
      {Array.from({ length: REPS }, (_, i) => {
        const hard = i >= REPS - HARD;
        return (
          <div
            key={i}
            style={{
              width: 520,
              height: 70,
              borderRadius: 35,
              boxSizing: "border-box",
              background: hard ? C.volt : C.w06,
              border: hard ? "none" : `2px solid ${C.w12}`,
              boxShadow: hard ? `0 0 46px ${C.voltGlow}` : "none",
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              fontFamily: MONO,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: hard ? C.bg : C.w35,
            }}
          >
            {String(i + 1).padStart(2, "0")}
            <span style={{ marginLeft: "auto", fontSize: 22 }}>{hard ? `${REPS - 1 - i} left` : ""}</span>
          </div>
        );
      })}
    </div>
    {/* counter */}
    <div style={{ position: "absolute", left: 660, top: 860, width: 320 }}>
      <div style={{ ...vf(900, 70), fontSize: 420, lineHeight: 0.8, letterSpacing: "-0.04em", color: C.volt, textShadow: `0 0 60px ${C.voltGlow}` }}>0</div>
      <Label size={24} style={{ marginTop: 34, lineHeight: 1.5 }}>
        Reps left
        <br />
        in the tank
      </Label>
    </div>
    <Grain opacity={0.14} vignette={0.5} />
  </AbsoluteFill>
);
