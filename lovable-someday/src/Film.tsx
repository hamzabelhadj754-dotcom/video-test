import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, EASE, GRADIENT } from "./theme";
import "./fonts";
import { lerp, tw } from "./anim";
import { CHECK_LAND, LAND, LIFT, Note } from "./scenes/Note";
import { Prompt } from "./scenes/Prompt";
import { Build } from "./scenes/Build";
import { EndCard } from "./scenes/EndCard";
import { Glow } from "./ui/Glow";
import { Grain } from "./ui/Grain";
import { CARD_ICON, LINE_AT_LIFT, NOTE_CHECK, pullback } from "./measure";

// The gradient check grows to fill the frame, then lands as the tick on the note.
const CheckField: React.FC<{ cx: number; cy: number; d: number; squash: number }> = ({ cx, cy, d, squash }) => {
  const g = tw(d, 70, 1900, 0, 1, EASE.inOut);
  const gw = lerp(d, 1920, g);
  const gh = lerp(d * squash, 1080, g);
  const glyph = tw(d, 160, 420, 1, 0);
  const feather = Math.max(1, d * 0.06);
  return (
    <AbsoluteFill
      style={{
        WebkitMaskImage: `radial-gradient(ellipse ${d / 2 + feather}px ${(d / 2) * squash + feather}px at ${cx}px ${cy}px, #000 ${(100 * (d / 2)) / (d / 2 + feather)}%, rgba(0,0,0,0) 100%)`,
        maskImage: `radial-gradient(ellipse ${d / 2 + feather}px ${(d / 2) * squash + feather}px at ${cx}px ${cy}px, #000 ${(100 * (d / 2)) / (d / 2 + feather)}%, rgba(0,0,0,0) 100%)`,
      }}
    >
      <div style={{ position: "absolute", left: lerp(cx - d / 2, 0, g), top: lerp(cy - (d * squash) / 2, 0, g), width: gw, height: gh, background: GRADIENT }} />
      <div
        style={{
          position: "absolute",
          left: cx - d,
          top: cy - d * squash,
          width: d * 2,
          height: d * 2 * squash,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontSize: d * 0.52,
          fontWeight: 700,
          opacity: glyph,
          transform: `scaleY(${squash})`,
        }}
      >
        ✓
      </div>
    </AbsoluteFill>
  );
};

export const Film: React.FC<{ sub?: number }> = ({ sub = 1 }) => {
  const f = useCurrentFrame() / sub;

  // 1. copy: a dark field opens from the selected line while it lifts into the prompt
  const push = f < LAND ? tw(f, LIFT, LAND, 1, 1.3, [0.5, 0, 0.1, 1]) : tw(f, LAND, 240, 1.3, 1.4, [0, 0, 1, 1]);
  const open = tw(f, LIFT, LIFT + 18, 0, 2300, [0.5, 0, 0.3, 1]);
  const dim = tw(f, LIFT - 4, LIFT + 8, 0, 0.5, EASE.inOut);
  const ocx = lerp(LINE_AT_LIFT.x, 960, tw(f, LIFT, LAND, 0, 1, EASE.inOut));
  const ocy = lerp(LINE_AT_LIFT.y, 600, tw(f, LIFT, LAND, 0, 1, EASE.inOut));
  const erx = 470 + open;
  const ery = 60 + open;
  const mask = `radial-gradient(ellipse ${erx}px ${ery}px at ${ocx}px ${ocy}px, #000 ${Math.min(80, 30 + open / 8)}%, rgba(0,0,0,0) 100%)`;

  // 2. send: the camera pulls back from the prompt and it becomes the chat message in the editor
  const e = tw(f, 240, 274, 0, 1, [0.62, 0, 0.18, 1]);
  const pb = pullback(e);
  const boxOpacity = tw(e, 0.38, 0.72, 1, 0);

  // 3. match cut: into the "booked" check, out of the tick on the note
  const dA = tw(f, 437, 450, CARD_ICON.w, 3600, [0.75, 0, 0.9, 0.35]);
  const dB = tw(f, 450, CHECK_LAND, 3600, NOTE_CHECK.w, [0.1, 0.65, 0.2, 1]);

  // 4. the glow floods and settles as the end-card horizon
  const rise = tw(f, 520, 540, 0, 1, [0.55, 0, 0.8, 0.5]);
  const settle = tw(f, 540, 592, 0, 1, EASE.out);
  const gy = f < 540 ? lerp(2300, 560, rise) : lerp(560, 1400, settle);
  const gw = f < 540 ? lerp(2500, 4600, rise) : lerp(4600, 2500, settle);
  const gh = f < 540 ? lerp(1050, 3300, rise) : lerp(3300, 1050, settle);
  const paper = f < LIFT + 10 || (f >= 450 && f < 530);

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {f < LAND + 2 ? <Note f={f} mode="intro" /> : null}
      {f >= LIFT - 4 && f < LAND + 2 ? <AbsoluteFill style={{ background: C.ink, opacity: dim }} /> : null}
      {f >= LIFT && f < 240 ? (
        <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <AbsoluteFill style={{ background: C.ink }} />
          <AbsoluteFill style={{ transform: `scale(${push})` }}>
            <Prompt f={f} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {f >= 240 && f < 450 ? <Build f={f} world={f < 274 ? pb.world : undefined} /> : null}
      {f >= LIFT && f < 240 ? (
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <Note f={f} mode="intro" layer="ghost" />
        </AbsoluteFill>
      ) : null}
      {f >= 240 && boxOpacity > 0 ? (
        <AbsoluteFill style={{ transform: pb.box, transformOrigin: "0 0", opacity: boxOpacity }}>
          <AbsoluteFill style={{ transform: `scale(${push})` }}>
            <Prompt f={f} glow={false} logo={false} />
            <Note f={f} mode="intro" layer="ghost" />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {f >= 437 && f < 450 ? <CheckField cx={CARD_ICON.x + CARD_ICON.w / 2} cy={CARD_ICON.y + CARD_ICON.h / 2} d={dA} squash={CARD_ICON.h / CARD_ICON.w} /> : null}
      {f >= 450 && f < 540 ? <Note f={f} mode="today" /> : null}
      {f >= 450 && f < CHECK_LAND ? (
        <CheckField cx={NOTE_CHECK.x + NOTE_CHECK.w / 2} cy={NOTE_CHECK.y + NOTE_CHECK.h / 2} d={dB} squash={lerp(1, NOTE_CHECK.h / NOTE_CHECK.w, tw(dB, NOTE_CHECK.w, 400, 1, 0))} />
      ) : null}
      {f >= 520 ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <Glow x={960} y={gy} w={gw} h={gh} blur={120} from={245 + (f - 540) * 0.25} opacity={1} />
        </AbsoluteFill>
      ) : null}
      {f >= 540 ? <EndCard f={f} /> : null}
      <Grain opacity={paper ? 0.1 : 0.12} vignette={paper ? 0.2 : 0.36} seed={Math.floor(f)} />
    </AbsoluteFill>
  );
};
