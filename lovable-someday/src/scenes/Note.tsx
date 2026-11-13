import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { SANS, SERIF } from "../fonts";
import { Cursor } from "../ui/Cursor";
import { Grain } from "../ui/Grain";

export const IDEAS = [
  { text: "Recipe box for Grandpa's handwriting", date: "Nov 2019" },
  { text: "A booking app for Mum's salon", date: "Mar 2021" },
  { text: "Plant-swap map for our street", date: "Jun 2022" },
  { text: "Tiny CRM for the bike shop", date: "Jan 2023" },
  { text: "Chore wheel the kids can't cheat", date: "Sep 2023" },
];

export const Note: React.FC<{
  selected?: number; // 0..1 selection sweep on the hero row
  focusRow?: number;
  cam?: { rx: number; ry: number; rz: number; s: number; x: number; y: number };
  cursor?: { x: number; y: number; scale?: number } | null;
}> = ({
  selected = 1,
  focusRow = 1,
  cam = { rx: 24, ry: -15, rz: 5, s: 1.16, x: 30, y: 10 },
  cursor = { x: 1236, y: 778 },
}) => {
  return (
    <AbsoluteFill style={{ background: C.desk, overflow: "hidden" }}>
      {/* window light across the desk */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 22% 8%, #FFFDF6 0%, rgba(255,253,246,0) 70%)",
        }}
      />
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            position: "absolute",
            left: 170,
            top: 40,
            width: 1640,
            height: 1500,
            transformStyle: "preserve-3d",
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
            background: C.paper,
            borderRadius: 44,
            boxShadow:
              "0 2px 0 rgba(255,255,255,0.9) inset, 0 60px 120px rgba(84,66,30,0.22), 0 12px 30px rgba(84,66,30,0.10)",
            padding: "120px 130px",
            fontFamily: SANS,
            color: C.ink,
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.ink30,
              fontWeight: 500,
              filter: "blur(1.6px)",
            }}
          >
            Notes · Edited 3 years ago
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              marginTop: 18,
              marginLeft: -14,
              filter: "blur(0.6px)",
            }}
          >
            Someday
          </div>
          <div style={{ marginTop: 64 }}>
            {IDEAS.map((idea, i) => {
              const d = Math.abs(i - focusRow);
              const hero = i === focusRow;
              return (
                <div
                  key={idea.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 124,
                    borderTop: `2px solid ${C.ink10}`,
                    filter: `blur(${hero ? 0 : 0.9 + d * 1.3}px)`,
                    opacity: hero ? 1 : 0.72 - d * 0.08,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      border: `3px solid ${C.ink30}`,
                      marginRight: 36,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ position: "relative", fontSize: 58, letterSpacing: "-0.025em", fontWeight: 500 }}>
                    {hero ? (
                      <div
                        style={{
                          position: "absolute",
                          left: -14,
                          right: -14,
                          top: -8,
                          bottom: -10,
                          background: C.violet,
                          opacity: 0.62,
                          borderRadius: 10,
                          clipPath: `inset(0 ${(1 - selected) * 100}% 0 0)`,
                        }}
                      />
                    ) : null}
                    <span style={{ position: "relative" }}>{idea.text}</span>
                  </div>
                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: 34,
                      color: C.ink30,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {idea.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      {cursor ? <Cursor x={cursor.x} y={cursor.y} scale={cursor.scale ?? 1} /> : null}
      <Grain opacity={0.1} vignette={0.2} />
    </AbsoluteFill>
  );
};
