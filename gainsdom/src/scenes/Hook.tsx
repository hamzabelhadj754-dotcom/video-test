import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Glitch } from "../components/Glitch";
import { C, F, glitchAt, prog, shakes, slam, typed } from "../theme";

const big: React.CSSProperties = {
  fontFamily: F.display,
  fontSize: 300,
  lineHeight: 0.9,
  letterSpacing: "-0.01em",
  color: C.ink,
  transformOrigin: "left center",
  textTransform: "uppercase",
};

/** "You're not lazy." → strike → "You're waiting." */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const s = shakes(frame, [24, 68], 10, 22);
  const g = glitchAt(frame, [50], 6);

  const phaseA = frame < 56;
  const strike = prog(frame, 38, 10);
  const sub = "// for a feeling that isn't coming.";

  return (
    <AbsoluteFill
      style={{
        padding: "0 96px",
        justifyContent: "center",
        transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}rad)`,
      }}
    >
      {phaseA ? (
        <Glitch intensity={g} seed={`hookA${frame}`}>
          <div style={{ ...big, ...slam(frame, 6) }}>You&rsquo;re</div>
          <div style={{ ...big, ...slam(frame, 14) }}>not</div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ ...big, ...slam(frame, 24) }}>Lazy.</div>
            <div
              style={{
                position: "absolute",
                left: -12,
                top: "52%",
                height: 30,
                width: `calc(${strike * 100}% + 24px)`,
                backgroundColor: C.accent,
              }}
            />
          </div>
        </Glitch>
      ) : (
        <div>
          <div style={{ ...big, ...slam(frame, 56, 6) }}>You&rsquo;re</div>
          <div
            style={{
              ...big,
              fontSize: 250,
              color: C.accent,
              ...slam(frame, 66, 6),
            }}
          >
            Waiting.
          </div>
          <div
            style={{
              marginTop: 54,
              fontFamily: F.mono,
              fontSize: 40,
              color: C.ink,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              opacity: interpolate(frame, [72, 74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {typed(sub, frame, 72, 1.8)}
            <span style={{ color: C.accent, opacity: Math.floor(frame / 6) % 2 ? 1 : 0 }}>█</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
