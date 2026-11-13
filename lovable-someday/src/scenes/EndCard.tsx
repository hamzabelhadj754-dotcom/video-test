import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { SANS, SERIF } from "../fonts";
import { Glow } from "../ui/Glow";
import { Grain } from "../ui/Grain";

export const EndCard: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
    <Glow x={960} y={1500} w={2500} h={1050} blur={120} from={245} opacity={1} />
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Img
        src={staticFile("brand/lockup-creme.svg")}
        style={{ height: 62, marginTop: 150 }}
      />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 190,
          lineHeight: 0.96,
          letterSpacing: "-0.03em",
          color: C.creme,
          textAlign: "center",
          marginTop: 150,
        }}
      >
        <span style={{ fontStyle: "italic" }}>Someday</span> is a
        <br />
        sentence away.
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: C.creme,
          marginTop: 84,
        }}
      >
        lovable.dev
      </div>
    </AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 96,
        bottom: 64,
        fontFamily: SANS,
        fontSize: 22,
        letterSpacing: "0.02em",
        color: C.creme60,
      }}
    >
      Spec ad. Not affiliated with Lovable.
    </div>
    <Grain opacity={0.12} vignette={0.35} />
  </AbsoluteFill>
);
