import React from "react";
import { AbsoluteFill } from "remotion";
import { Clock, Rise, Typed } from "../components";
import { emptySlices, Ring, SliceState } from "../Ring";
import { C, display, EASE, mono } from "../theme";
import { lerp, prog, Wd } from "../timeline";

// The clock is the idea: 20:00 becomes the face of a 20-slice workout ring.
export const RING = { cx: 540, cy: 760, r: 300, w: 56 };
export const HOOK = { y: 900, size: 206 }; // fits x 160–920: clear of the platform button rail

// Shared with the end card so the last frame == the first frame (seamless loop).
export const lockPunch = (f: number, at: number) => {
  const t = f - at;
  if (t < 0 || t > 18) return 1;
  return 1 + 0.045 * Math.sin((t / 18) * Math.PI) * Math.exp(-t / 10);
};

// A live clock: the colon blinks once a second (on for 20 frames, dim for 10). 900 % 30 == 0, so the loop stays seamless.
export const blink = (g: number) => {
  const p = ((g % 30) + 30) % 30;
  if (p < 20) return 1;
  if (p < 22) return lerp(1, 0.22, (p - 20) / 2);
  if (p < 28) return 0.22;
  return lerp(0.22, 1, (p - 28) / 2);
};

// Slow camera drift of the clock/ring world (keeps the zoom-through target exact).
export const openingDrift = (f: number) => 1 + 0.035 * prog(f, 66, 214, (t) => t);

export const HookTitle: React.FC<{ f: number; labelF: number; scale: number; y: number; size: number; reveal?: number; g: number }> = ({
  f,
  labelF,
  scale,
  y,
  size,
  reveal,
  g,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y - size * 0.5,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${scale})`,
        transformOrigin: `540px ${size * 0.45}px`,
      }}
    >
      <Clock text="20:00" size={size} reveal={reveal === undefined ? undefined : f - reveal} colonAlpha={blink(g)} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.5 - 92, display: "flex", justifyContent: "center" }}>
      <Typed text="YOU'VE GOT" f={labelF} cps={1.2} style={mono(34, { color: C.rest, letterSpacing: "0.42em", fontWeight: 600 })} />
    </div>
  </>
);

export const Opening: React.FC<{ f: number }> = ({ f }) => {
  // ── 1. Hook → clock face
  const toRing = prog(f, 64, 100, EASE.whip);
  const size = lerp(HOOK.size, 150, toRing);
  const y = lerp(HOOK.y, RING.cy + 6, toRing);
  const push = 1 + 0.035 * prog(f, 0, 64, EASE.inOut) * (1 - toRing);
  const punch = lockPunch(f, Wd.twenty) * push;
  const labelOut = prog(f, 64, 74, EASE.in);
  const enoughIn = f - Wd.enough + 7;

  // ── 2. Ring states, locked to the words
  const slices: SliceState[] = emptySlices().map((_, i) => {
    const group = Math.floor(i / 5);
    const sweep = prog(f, 70 + i * 1.3, 84 + i * 1.3, EASE.out);
    if (group === 0) {
      return {
        track: sweep,
        base: prog(f, Wd.five + i * 2.4, Wd.five + 10 + i * 2.4, EASE.out),
        work: prog(f, Wd.forty + i * 2.2, Wd.forty + 12 + i * 2.2, EASE.out),
        rest: prog(f, Wd.off + i * 2.2, Wd.off + 10 + i * 2.2, EASE.out),
      };
    }
    const k = i - 5;
    const at = Wd.four + 2 + k * 1.6;
    return {
      track: sweep,
      base: prog(f, at, at + 8, EASE.out),
      work: prog(f, at, at + 9, EASE.out),
      rest: prog(f, at + 3, at + 10, EASE.out),
    };
  });

  const rowY = [1196, 1296, 1396];
  const col = 212;
  const statNum = (txt: string, at: number, color: string = C.ink) => (
    <Rise text={txt} f={f - at} style={display(88, { color })} stagger={2} dur={14} />
  );
  const statLbl = (txt: string, at: number, color: string = C.ink) => (
    <Typed text={txt} f={f - at - 4} cps={1.5} style={mono(32, { color, fontWeight: 600, letterSpacing: "0.22em" })} />
  );

  const d = openingDrift(f);
  return (
    <AbsoluteFill style={{ transform: `scale(${d})`, transformOrigin: `${RING.cx}px ${RING.cy}px` }}>
      {f >= 64 && <Ring {...RING} slices={slices} ticks={prog(f, 92, 112, EASE.out)} />}

      {/* the hook */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
        <HookTitle f={f} g={f} labelF={f < 62 ? 99 : 8.4 - (f - 62) * 0.9} scale={punch} y={y} size={size} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HOOK.y + 128,
          display: "flex",
          justifyContent: "center",
          opacity: 1 - labelOut,
          transform: `translateY(${labelOut * 40}px)`,
        }}
      >
        <Rise text="THAT'S ENOUGH" f={enoughIn} style={display(64, { letterSpacing: "0.01em" })} stagger={0.7} dur={10} />
        <Rise text="." f={enoughIn - 9} style={display(64)} dur={10} color={C.work} />
      </div>

      {/* rules, one per word */}
      {f >= Wd.five - 6 && (
        <>
          <div style={{ position: "absolute", top: rowY[0], left: col, display: "flex", alignItems: "baseline", gap: 28 }}>
            <div style={{ width: 150 }}>{statNum("5", Wd.five)}</div>
            {statLbl("MOVES", Wd.five + 4)}
          </div>
          <div style={{ position: "absolute", top: rowY[1], left: col, display: "flex", alignItems: "baseline", gap: 28 }}>
            <div style={{ width: 150 }}>{statNum("40", Wd.forty, C.work)}</div>
            {statLbl("ON", Wd.forty + 2, C.work)}
            <div style={{ width: 40 }} />
            <div style={{ width: 150 }}>{statNum("20", Wd.off, C.rest)}</div>
            {statLbl("OFF", Wd.off + 2, C.rest)}
          </div>
          <div style={{ position: "absolute", top: rowY[2], left: col, display: "flex", alignItems: "baseline", gap: 28 }}>
            <div style={{ width: 150 }}>{statNum("×4", Wd.four)}</div>
            {statLbl("ROUNDS", Wd.four + 4)}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
