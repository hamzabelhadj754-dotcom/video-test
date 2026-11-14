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
import { BUBBLE, CARD_ICON, HL_RECT, LINE_AT_LIFT, NOTE_CHECK } from "./measure";

// The gradient check grows to fill the frame, then lands as the tick on the note.
const CheckField: React.FC<{ cx: number; cy: number; d: number; squash: number }> = ({ cx, cy, d, squash }) => {
  const g = tw(d, 70, 1900, 0, 1, EASE.inOut);
  const gw = lerp(d, 1920, g);
  const gh = lerp(d * squash, 1080, g);
  const glyph = tw(d, 160, 420, 1, 0);
  return (
    <AbsoluteFill style={{ clipPath: `ellipse(${d / 2}px ${(d / 2) * squash}px at ${cx}px ${cy}px)` }}>
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
  const open = tw(f, LIFT - 1, LIFT + 16, 0, 2300, [0.5, 0, 0.3, 1]);
  const dim = tw(f, LIFT - 4, LIFT + 8, 0, 0.5, EASE.inOut);
  const ocx = lerp(LINE_AT_LIFT.x, 960, tw(f, LIFT, LAND, 0, 1, EASE.inOut));
  const ocy = lerp(LINE_AT_LIFT.y, 600, tw(f, LIFT, LAND, 0, 1, EASE.inOut));
  const mask = `radial-gradient(circle at ${ocx}px ${ocy}px, #000 ${open}px, rgba(0,0,0,0) ${open + 420}px)`;

  // 2. send: the prompt travels into the chat panel while the app rises
  const k = tw(f, 236, 256, 0, 1, [0.55, 0, 0.15, 1]);
  const kb = BUBBLE.h / 127;
  const sFin = (29 * kb) / 42;
  const sNow = lerp(push, sFin, k);
  const tx = (BUBBLE.x + 31 * kb - (960 + (HL_RECT.x + 10 - 960) * sFin)) * k;
  const ty = (BUBBLE.y + 26 * kb - (540 + (HL_RECT.y + 4 - 540) * sFin)) * k;
  const fly = `translate(${tx}px, ${ty}px) scale(${sNow})`;
  const flyStyle = { transform: fly, filter: k > 0.02 ? `blur(${k * 1.6}px)` : undefined, opacity: tw(f, 249, 256, 1, 0) };

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
      {f >= LIFT - 2 && f < 238 ? (
        <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <AbsoluteFill style={{ background: C.ink }} />
          <AbsoluteFill style={{ transform: `scale(${push})` }}>
            <Prompt f={f} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {f >= 236 && f < 450 ? <Build f={f} /> : null}
      {f >= 238 && f < 256 ? (
        <AbsoluteFill style={flyStyle}>
          <Prompt f={f} glow={false} logo={false} />
        </AbsoluteFill>
      ) : null}
      {f >= LIFT && f < 256 ? (
        <AbsoluteFill style={f >= 236 ? flyStyle : { transform: `scale(${push})` }}>
          <Note f={f} mode="intro" layer="ghost" />
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
