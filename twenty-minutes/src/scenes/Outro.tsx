import React from "react";
import { AbsoluteFill } from "remotion";
import { Clock, fmt, Rise, Typed } from "../components";
import { emptySlices, Ring } from "../Ring";
import { C, display, EASE, mono } from "../theme";
import { B, clamp01, kf, lerp, prog, Wd } from "../timeline";
import { HOOK, HookTitle, lockPunch, RING } from "./Opening";

// ── ROUNDS: the ring fast-forwards through all 20 minutes ───────────────────
export const roundsElapsed = (lf: number) =>
  kf(
    lf,
    [
      [4, 0],
      [36, 0.25],
      [56, 0.75],
      [86, 1],
    ],
    EASE.inOut,
  );

const ALPHA = [0.34, 0.6, 0.8, 1];

export const Rounds: React.FC<{ f: number }> = ({ f }) => {
  const e = roundsElapsed(f);
  const inT = prog(f, -8, 8, EASE.out);
  const slices = emptySlices().map((_, i) => {
    const fill = clamp01(e * 20 - i);
    const g = Math.floor(i / 5);
    return {
      track: 1,
      base: 0,
      work: clamp01(fill * 1.5),
      rest: clamp01(fill * 3 - 2),
      workAlpha: ALPHA[g],
      glow: g === 3 ? 1 : 0,
    };
  });
  const r1 = f - (Wd.round - B.rounds);
  const r4 = f - (Wd.pushLast - B.rounds);
  const swap = prog(r4, -6, 2, EASE.in);
  return (
    <AbsoluteFill style={{ opacity: inT, transform: `scale(${lerp(0.9, 1, inT)})` }}>
      <Ring {...RING} slices={slices} ticks={1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: RING.cy + 6 - 75, display: "flex", justifyContent: "center", opacity: prog(f, 3, 9, EASE.out), transform: `scale(${lerp(0.8, 1, prog(f, 3, 12, EASE.out))})` }}>
        <Clock text={fmt(1200 * (1 - e))} size={150} />
      </div>
      <div style={{ position: "absolute", left: 212, top: 1196 }}>
        <Rise text="ROUND 1" f={r1 + 4} out={r1 + 4 - r4 - 12} style={display(88)} stagger={1.4} dur={13} />
        <div style={{ marginTop: 22, opacity: 1 - swap }}>
          <Typed text="= WARM-UP. EASY." f={r1 - 6} cps={1.8} style={mono(32, { color: C.rest, fontWeight: 600, letterSpacing: "0.22em" })} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 212, top: 1196 }}>
        <Rise text="ROUND 4" f={r4 - 2} style={display(88)} stagger={1.4} dur={13} />
        <div style={{ marginTop: 22 }}>
          <Typed text="= ALL OUT." f={r4 - 4} cps={1.8} style={mono(32, { color: C.work, fontWeight: 700, letterSpacing: "0.22em" })} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── END: the ring becomes the full stop, then the clock resets to frame 0 ───
const DOT = { x: 921, y: 1053, r: 22 };

export const End: React.FC<{ f: number }> = ({ f }) => {
  // f is local to B.end
  const morph = prog(f, -6, 12, EASE.whip);
  const R = lerp(RING.r, DOT.r / 2, morph);
  const sw = lerp(RING.w, DOT.r, morph);
  const cx = lerp(RING.cx, DOT.x, morph);
  const cy = lerp(RING.cy, DOT.y, morph);
  const save = f - (Wd.save - B.end);
  const exit = Wd.your - B.end - 10;
  const dotOut = prog(f, exit + 4, exit + 14, EASE.in);
  const g = B.end + f; // global frame
  return (
    <AbsoluteFill>
      {f < exit + 16 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle
            cx={cx}
            cy={cy + dotOut * 40}
            r={R * (1 - dotOut)}
            fill="none"
            stroke={C.work}
            strokeWidth={sw * (1 - dotOut)}
            strokeOpacity={clamp01(f + 6) * 1}
          />
        </svg>
      )}
      <div style={{ position: "absolute", right: 124, top: 700, textAlign: "right" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", height: 200 }}>
          <Rise text="SAVE" f={save + 3} out={exit - (Wd.save - B.end) + 3} style={display(228)} stagger={1.6} dur={14} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", height: 200, marginRight: 66 }}>
          <Rise text="THIS" f={save - 3} out={exit - (Wd.save - B.end) - 1} style={display(228)} stagger={1.6} dur={14} />
        </div>
      </div>
      {/* the clock comes back: final frame == first frame */}
      {f >= Wd.twenty2 - B.end - 4 && (
        <HookTitle
          f={g}
          labelF={g - (Wd.twenty2 + 4)}
          g={g}
          scale={lockPunch(g, Wd.now) * (1 + 0.03 * (1 - prog(g, 836, B.total - 1, EASE.inOut)))}
          y={HOOK.y}
          size={HOOK.size}
          reveal={Wd.twenty2 - 3}
        />
      )}
    </AbsoluteFill>
  );
};
