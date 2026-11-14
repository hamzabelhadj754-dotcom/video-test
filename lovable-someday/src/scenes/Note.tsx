import { AbsoluteFill } from "remotion";
import { C, EASE, GRADIENT } from "../theme";
import { SANS, SERIF } from "../fonts";
import { Cursor } from "../ui/Cursor";
import { CamKey, camAt, camBlur, camCss, lerp, tw } from "../anim";
import { PG, PROBE } from "../probe";

const IDEAS = [
  { text: "Recipe box for Grandpa's handwriting", date: "Nov 2019" },
  { text: "A booking app for Mum's salon", date: "Mar 2021" },
  { text: "Plant-swap map for our street", date: "Jun 2022" },
  { text: "Tiny CRM for the bike shop", date: "Jan 2023" },
  { text: "Chore wheel the kids can't cheat", date: "Sep 2023" },
];
const HERO = 1;
export const LIFT = 118;

const INTRO: CamKey[] = [
  { f: 0, cam: { rx: 31, ry: -7, rz: 2.5, s: 1.62, x: 150, y: 150 } },
  { f: LIFT, cam: { rx: 23, ry: -16, rz: 5.2, s: 1.18, x: 26, y: 4 }, e: [0.3, 0.05, 0.12, 1] },
];
const PAGE_OUT: CamKey[] = [
  ...INTRO,
  { f: 150, cam: { rx: 44, ry: -22, rz: 9, s: 0.86, x: 0, y: 170 }, e: [0.5, 0, 0.9, 0.5] },
];
// The lifted line flattens and lands exactly on line one of the prompt box.
export const LAND = 152;
const GHOST: CamKey[] = [
  ...INTRO,
  { f: 127, cam: { rx: 20, ry: -13, rz: 4.4, s: 1.25, x: 34, y: -18 }, e: [0.25, 0, 0.25, 1] },
  { f: LAND, cam: { rx: 0, ry: 0, rz: 0, s: 0.724, x: -40, y: -271.5 }, e: [0.45, 0, 0.12, 1] },
];
export const CHECK_LAND = 470;
const TODAY: CamKey[] = [
  { f: 450, cam: { rx: 21, ry: -9, rz: 3, s: 1.3, x: 110, y: 96 } },
  { f: CHECK_LAND, cam: { rx: 21, ry: -9, rz: 3, s: 1.3, x: 110, y: 96 } },
  { f: 540, cam: { rx: 17, ry: -13, rz: 4.2, s: 1.42, x: 96, y: 60 }, e: [0.35, 0, 0.6, 1] },
];

export const Note: React.FC<{ f: number; mode: "intro" | "today"; layer?: "page" | "ghost" }> = ({
  f,
  mode,
  layer = "page",
}) => {
  const ghost = layer === "ghost";
  const today = mode === "today";
  const keys = today ? TODAY : ghost ? GHOST : PAGE_OUT;
  const cam = camAt(f, keys);
  const blur = today || ghost ? 0 : camBlur(f, keys) * 0.8;

  // rack focus from the title to the list
  const focus = today ? 0.55 : tw(f, 28, 78, 0, 1, EASE.inOut);
  const selected = today ? 0 : tw(f, 94, 112, 0, 1, EASE.inOut);

  // cursor (lives on the page plane, relative to the hero text)
  const ct = tw(f, 60, 90, 0, 1, [0.3, 0, 0.15, 1]);
  const cx = (1 - ct) * (1 - ct) * 980 + 2 * (1 - ct) * ct * 520 - 8;
  const cy = (1 - ct) * (1 - ct) * 460 + 2 * (1 - ct) * ct * -30 + ct * ct * 34;
  const cursorOpacity = tw(f, 60, 66, 0, 1) * tw(f, 114, 122, 1, 0);

  // "today" beats
  const strike = tw(f, 462, 484, 0, 1, EASE.inOut);
  const swap = tw(f, 492, 516, 0, 1, [0.7, 0, 0.1, 1]);
  const meta = tw(f, 512, 524, 0, 1, EASE.inOut);
  const check = 1;
  const bounce = Math.sin(tw(f, CHECK_LAND, CHECK_LAND + 12, 0, 1) * Math.PI) * 0.22;
  const sweep = tw(f, 508, 536, 0, 1, EASE.inOut);

  const ghostInk = tw(f, LIFT + 6, LAND - 2, 0, 1, EASE.inOut);
  const lift = ghost ? tw(f, LIFT - 2, LIFT + 10, 0, 1) * tw(f, LAND - 8, LAND, 1, 0) : 0;
  const ghostColor = `rgb(${lerp(27, 247, ghostInk)},${lerp(27, 244, ghostInk)},${lerp(27, 237, ghostInk)})`;
  const hide = ghost ? { visibility: "hidden" as const } : {};

  return (
    <AbsoluteFill style={{ background: ghost ? "transparent" : C.desk, overflow: "hidden" }}>
      {ghost ? null : (
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse 70% 80% at 22% 8%, #FFFDF6 0%, rgba(255,253,246,0) 70%)",
          }}
        />
      )}
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 45%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        <div
          style={{
            position: "absolute",
            left: 170,
            top: 40,
            width: 1640,
            height: 1500,
            boxSizing: "border-box",
            transform: camCss(cam),
            background: ghost ? "transparent" : C.paper,
            borderRadius: 44,
            boxShadow: ghost
              ? "none"
              : "0 2px 0 rgba(255,255,255,0.9) inset, 0 60px 120px rgba(84,66,30,0.22), 0 12px 30px rgba(84,66,30,0.10)",
            padding: "120px 130px",
            fontFamily: SANS,
            color: C.ink,
          }}
        >
          <div
            style={{
              ...hide,
              height: 32,
              lineHeight: "32px",
              overflow: "hidden",
              fontSize: 26,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.ink30,
              fontWeight: 500,
              filter: `blur(${today ? 0.8 : 1.6}px)`,
            }}
          >
            <div style={{ transform: `translateY(${-meta * 32}px)` }}>
              <div>Notes · Edited 3 years ago</div>
              <div style={{ color: C.ink60 }}>Notes · Edited just now</div>
            </div>
          </div>
          <div
            style={{
              ...hide,
              position: "relative",
              height: 285,
              marginTop: 18,
              marginLeft: -14,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 300,
              lineHeight: "285px",
              letterSpacing: "-0.035em",
              filter: `blur(${today ? 0 : focus * 1.3}px)`,
              clipPath: "inset(-40px -80px -90px -80px)",
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-swap * 430}px)`, opacity: 1 - strike * 0.55 }}>
              <span style={{ position: "relative", display: "inline-block" }}>
                Someday
                <svg
                  viewBox="0 0 1000 80"
                  preserveAspectRatio="none"
                  style={{ position: "absolute", left: "-3%", width: "108%", top: "50%", height: 80, overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="strokeG" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor="#4F88FF" />
                      <stop offset="0.38" stopColor="#E2A5F2" />
                      <stop offset="0.57" stopColor="#FD2980" />
                      <stop offset="0.8" stopColor="#FB3D26" />
                      <stop offset="1" stopColor="#FF8F1B" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M4 52 C 220 20, 420 66, 640 34 S 900 30, 996 22"
                    fill="none"
                    stroke="url(#strokeG)"
                    strokeWidth="17"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - strike}
                  />
                </svg>
              </span>
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(1 - swap) * 430}px)` }}>
              <span style={{ position: "relative", display: "inline-block" }}>
                Today.
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    backgroundImage: `linear-gradient(105deg, rgba(0,0,0,0) 35%, #4F88FF 42%, #FB65C2 50%, #FF8F1B 58%, rgba(0,0,0,0) 65%)`,
                    backgroundSize: "320% 100%",
                    backgroundPosition: `${lerp(125, -25, sweep)}% 0`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    paddingRight: 40,
                  }}
                >
                  Today.
                </span>
              </span>
            </div>
          </div>
          <div style={{ marginTop: 64 }}>
            {IDEAS.map((idea, i) => {
              const d = Math.abs(i - HERO);
              const hero = i === HERO;
              const rowBlur = hero ? lerp(4.5, 0, focus) : lerp(6 + d, 0.9 + d * 1.3, focus);
              return (
                <div
                  key={idea.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 124,
                    borderTop: `2px solid ${ghost ? "transparent" : C.ink10}`,
                    filter: ghost ? undefined : `blur(${today && hero ? 0.4 : rowBlur}px)`,
                    opacity: hero ? 1 : 0.72 - d * 0.08,
                  }}
                >
                  <div
                    style={{
                      ...hide,
                      width: 40,
                      height: 40,
                      boxSizing: "border-box",
                      borderRadius: 20,
                      border: `3px solid ${C.ink30}`,
                      marginRight: 36,
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {hero && today ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: -3,
                          borderRadius: 20,
                          background: PROBE === "check" ? PG : GRADIENT,
                          transform: `scale(${lerp(0.2, 1, check) + bounce})`,
                          opacity: check,
                          color: "#fff",
                          fontSize: 24,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✓
                      </div>
                    ) : null}
                  </div>
                  <div
                    style={{
                      position: "relative",
                      fontSize: 58,
                      lineHeight: "70px",
                      letterSpacing: "-0.025em",
                      fontWeight: 500,
                      visibility: hero ? (ghost ? "visible" : f >= LIFT && !today ? "hidden" : "visible") : ghost ? "hidden" : "visible",
                      color: ghost ? ghostColor : C.ink,
                      textShadow: lift > 0 ? `0 ${16 * lift}px ${34 * lift}px rgba(40,30,10,${0.22 * lift})` : undefined,
                    }}
                  >
                    {hero && !today ? (
                      <div
                        style={{
                          position: "absolute",
                          left: -14,
                          right: -14,
                          top: -8,
                          bottom: -10,
                          background: PROBE === "hl" ? PG : C.violet,
                          opacity: PROBE === "hl" ? 1 : ghost ? (f < LAND ? 0.62 : 0) : 0.62,
                          borderRadius: 10,
                          clipPath: `inset(0 ${(1 - selected) * 100}% 0 0)`,
                        }}
                      />
                    ) : null}
                    <span style={{ position: "relative" }}>{idea.text}</span>
                    {hero && !today && !ghost ? (
                      <div style={{ position: "absolute", left: `${selected * 100}%`, top: 0 }}>
                        <Cursor x={cx} y={cy} scale={f >= 92 && f < 115 ? 0.88 : 1} opacity={cursorOpacity} />
                      </div>
                    ) : null}
                  </div>
                  <div
                    style={{
                      ...hide,
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
    </AbsoluteFill>
  );
};
