import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, EASE } from "./theme";
import "./fonts";
import { lerp, tw } from "./anim";
import { Note } from "./scenes/Note";
import { Prompt } from "./scenes/Prompt";
import { Build } from "./scenes/Build";
import { EndCard } from "./scenes/EndCard";
import { Glow } from "./ui/Glow";
import { Grain } from "./ui/Grain";

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const dark = tw(f, 120, 143, 0, 1, [0.4, 0, 0.6, 1]);
  const push = f < 150 ? tw(f, 118, 150, 1, 1.3, [0.6, 0, 0.1, 1]) : tw(f, 150, 240, 1.3, 1.4, [0, 0, 1, 1]);
  // one glow: rises to flood the frame, then settles as the end card horizon
  const rise = tw(f, 522, 540, 0, 1, [0.6, 0, 0.85, 0.5]);
  const settle = tw(f, 540, 590, 0, 1, EASE.out);
  const gy = f < 540 ? lerp(2300, 560, rise) : lerp(560, 1400, settle);
  const gw = f < 540 ? lerp(2500, 4600, rise) : lerp(4600, 2500, settle);
  const gh = f < 540 ? lerp(1050, 3300, rise) : lerp(3300, 1050, settle);
  const paper = f < 134 || (f >= 450 && f < 532);

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {f < 150 ? <Note f={f} mode="intro" /> : null}
      {f >= 120 && f < 240 ? <AbsoluteFill style={{ background: C.ink, opacity: dark }} /> : null}
      {f >= 118 && f < 240 ? (
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          {f >= 134 ? <Prompt f={f} /> : null}
          <Note f={f} mode="intro" layer="ghost" />
        </AbsoluteFill>
      ) : null}
      {f >= 240 && f < 450 ? <Build f={f} /> : null}
      {f >= 442 && f < 450 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: tw(f, 442, 449, 0, 1, [0.6, 0, 1, 0.6]) }} /> : null}
      {f >= 450 && f < 540 ? <Note f={f} mode="today" /> : null}
      {f >= 450 && f < 464 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: tw(f, 450, 464, 1, 0) }} /> : null}
      {f >= 522 ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Glow x={960} y={gy} w={gw} h={gh} blur={120} from={245 + (f - 540) * 0.25} opacity={1} />
        </AbsoluteFill>
      ) : null}
      {f >= 540 ? <EndCard f={f} /> : null}
      <Grain opacity={paper ? 0.1 : 0.12} vignette={paper ? 0.2 : 0.36} />
    </AbsoluteFill>
  );
};
