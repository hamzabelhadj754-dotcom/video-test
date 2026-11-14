import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, GRADIENT_STOPS } from "../theme";
import { SANS } from "../fonts";
import { Cursor } from "../ui/Cursor";
import { Glow } from "../ui/Glow";
import { TYPED, TYPE_START, charFrame, lerp, pathAt, press, tw, typedCount } from "../anim";
import { LAND } from "./Note";
import { HL_RECT } from "../measure";

export const SEND = 230;
const BOX = { x: 460, y: 420, w: 1000, h: 250, r: 40 };

export const Prompt: React.FC<{ f: number; glow?: boolean; logo?: boolean }> = ({ f, glow = true, logo = true }) => {
  // the selection highlight grows into the prompt box
  const m = tw(f, LAND, LAND + 18, 0, 1, [0.5, 0, 0.1, 1]);
  const bx = lerp(HL_RECT.x, BOX.x, m);
  const by = lerp(HL_RECT.y, BOX.y, m);
  const bw = lerp(HL_RECT.w, BOX.w, m);
  const bh = lerp(HL_RECT.h, BOX.h, m);
  const br = lerp(HL_RECT.r, BOX.r, m);
  const inner = tw(f, LAND + 8, LAND + 20, 0, 1);

  const n = typedCount(f);
  const typing = f >= TYPE_START - 2 && f <= charFrame(TYPED.length - 1) + 4;
  const caretOn = typing || Math.floor(f / 14) % 2 === 0;
  const active = tw(f, TYPE_START, TYPE_START + 10, 0, 1);
  const ignite = tw(f, SEND, 240, 0, 1, [0.6, 0, 0.9, 0.5]);
  const think = tw(f, SEND, SEND + 5, 0, 1);
  let pulse = 0;
  for (let i = 0; i < TYPED.length; i++) {
    const cf = charFrame(i);
    if (f >= cf) pulse = Math.max(pulse, Math.exp(-(f - cf) / 5));
  }
  const cur = pathAt(f, [
    { f: 206, x: 1720, y: 1010 },
    { f: 227, x: 1386, y: 618 },
    { f: 240, x: 1390, y: 622 },
  ], 60);
  const ripple = tw(f, SEND, SEND + 12, 0, 1);
  const pressS = 1 - tw(f, SEND, SEND + 4, 0, 0.012) + tw(f, SEND + 4, 240, 0, 0.012);

  return (
    <AbsoluteFill>
      {glow ? (
        <Glow
          x={960}
          y={lerp(590, 560, ignite)}
          w={lerp(1250, 2700, ignite)}
          h={lerp(520, 1500, ignite)}
          blur={110}
          from={30 + f * 0.5}
          opacity={Math.min(1, tw(f, 138, 172, 0, 0.62) + pulse * 0.1 + active * 0.12 + ignite)}
        />
      ) : null}
      {logo ? <Img
        src={staticFile("brand/logomark-color.svg")}
        style={{
          position: "absolute",
          left: 960 - 34,
          top: 300,
          width: 68,
          opacity: tw(f, 156, 172, 0, 1) * tw(f, SEND + 1, SEND + 6, 1, 0),
          transform: `translateY(${tw(f, 156, 178, 24, 0)}px) scale(${1 + ignite * 0.12})`,
        }}
      /> : null}
      {f >= LAND ? (
        <>
          {/* thinking ring: the brand gradient runs around the box after send */}
          <div
            style={{
              position: "absolute",
              left: BOX.x - 3,
              top: BOX.y - 3,
              width: BOX.w + 6,
              height: BOX.h + 6,
              borderRadius: BOX.r + 3,
              opacity: think,
              background: `conic-gradient(from ${f * 14}deg, ${GRADIENT_STOPS.replace(/(\d+)%/g, (_, p) => `${(Number(p) * 3.6).toFixed(0)}deg`)}, #4F88FF 360deg)`,
              filter: "blur(1px)",
              transform: `scale(${pressS})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: bw,
              height: bh,
              boxSizing: "border-box",
              borderRadius: br,
              background: `rgba(${lerp(187, 48, m)},${lerp(193, 46, m)},${lerp(255, 44, m)},${lerp(0.62, 0.96, m)})`,
              border: `1.5px solid rgba(247,244,237,${0.34 * m})`,
              boxShadow: `0 40px 90px rgba(0,0,0,${0.5 * m}), 0 1px 0 rgba(255,255,255,${0.08 * m}) inset`,
              transform: `scale(${pressS})`,
              fontFamily: SANS,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 44,
                top: 42 + 51,
                height: 51,
                display: "flex",
                alignItems: "center",
                fontSize: 42,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                color: C.creme,
                whiteSpace: "pre",
              }}
            >
              {TYPED.slice(0, n)
                .split("")
                .map((ch, i) => {
                  const p = tw(f, charFrame(i), charFrame(i) + 4, 0, 1);
                  return (
                    <span key={i} style={{ display: "inline-block", opacity: p, filter: `blur(${(1 - p) * 6}px)`, transform: `translateY(${(1 - p) * 8}px)` }}>
                      {ch}
                    </span>
                  );
                })}
              <div style={{ width: 3, height: 46, marginLeft: 4, borderRadius: 2, background: C.creme, opacity: f >= LAND + 14 && caretOn && f < SEND + 4 ? 1 : 0 }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 40,
                bottom: 32,
                width: 50,
                height: 50,
                boxSizing: "border-box",
                borderRadius: 25,
                border: "1.5px solid rgba(247,244,237,0.22)",
                color: C.creme60,
                fontSize: 30,
                fontWeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                opacity: inner,
              }}
            >
              +
            </div>
            <div
              style={{
                position: "absolute",
                right: 36,
                bottom: 30,
                width: 56,
                height: 56,
                borderRadius: 28,
                background: C.creme,
                opacity: inner * lerp(0.25, 1, active),
                transform: `scale(${press(f, [SEND]) < 1 ? 0.9 : 1})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                right: 36,
                bottom: 30,
                width: 56,
                height: 56,
                borderRadius: 28,
                border: `2px solid ${C.creme}`,
                boxSizing: "border-box",
                opacity: f >= SEND ? (1 - ripple) * 0.7 : 0,
                transform: `scale(${1 + ripple * 1.8})`,
              }}
            />
          </div>
        </>
      ) : null}
      <Cursor x={cur.x} y={cur.y} scale={press(f, [SEND])} opacity={tw(f, 206, 212, 0, 1) * tw(f, 234, 240, 1, 0)} />
    </AbsoluteFill>
  );
};
