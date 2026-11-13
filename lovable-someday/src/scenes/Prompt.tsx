import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { SANS } from "../fonts";
import { Cursor } from "../ui/Cursor";
import { Glow } from "../ui/Glow";
import { TYPED, TYPE_START, charFrame, lerp, pathAt, press, tw, typedCount } from "../anim";

const SEND = 230;

export const Prompt: React.FC<{ f: number }> = ({ f }) => {
  const boxIn = tw(f, 141, 160, 0, 1);
  const n = typedCount(f);
  const typing = f >= TYPE_START - 2 && f <= charFrame(TYPED.length - 1) + 4;
  const caretOn = typing || Math.floor(f / 14) % 2 === 0;
  const active = tw(f, TYPE_START, TYPE_START + 10, 0, 1);
  const ignite = tw(f, SEND, 240, 0, 1, [0.6, 0, 0.9, 0.5]);
  // each keystroke nudges the glow
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

  return (
    <AbsoluteFill>
      <Glow
        x={960}
        y={lerp(590, 560, ignite)}
        w={lerp(1250, 2700, ignite)}
        h={lerp(520, 1500, ignite)}
        blur={110}
        from={150 + f * 0.5}
        opacity={Math.min(1, tw(f, 140, 172, 0, 0.62) + pulse * 0.1 + active * 0.12 + ignite)}
      />
      <Img
        src={staticFile("brand/logomark-color.svg")}
        style={{
          position: "absolute",
          left: 960 - 34,
          top: 300,
          width: 68,
          opacity: tw(f, 150, 170, 0, 1),
          transform: `translateY(${tw(f, 150, 174, 24, 0)}px) scale(${1 + ignite * 0.12})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 460,
          top: 420,
          width: 1000,
          height: 250,
          boxSizing: "border-box",
          borderRadius: 40,
          background: "rgba(48,46,44,0.94)",
          border: "1.5px solid rgba(247,244,237,0.34)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08) inset",
          opacity: boxIn,
          transform: `scale(${lerp(0.93, 1, boxIn) - tw(f, SEND, SEND + 4, 0, 0.012) + tw(f, SEND + 4, 240, 0, 0.012)})`,
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
          {TYPED.slice(0, n)}
          <div
            style={{
              width: 3,
              height: 46,
              marginLeft: 4,
              borderRadius: 2,
              background: C.creme,
              opacity: f >= 152 && caretOn ? 1 : 0,
            }}
          />
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
            opacity: lerp(0.25, 1, active),
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
      <Cursor x={cur.x} y={cur.y} scale={press(f, [SEND])} opacity={tw(f, 206, 212, 0, 1)} />
    </AbsoluteFill>
  );
};
