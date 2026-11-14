import { AbsoluteFill, getInputProps } from "remotion";
import { MuscleScene } from "../three/MuscleScene";
import { Grain } from "../ui/Grain";

const P = getInputProps() as { a?: number; h?: number };

export const Test3D: React.FC = () => (
  <AbsoluteFill style={{ background: "#0A0A0A" }}>
    <MuscleScene width={1080} height={1920} activation={P.a ?? 0.55} heat={P.h ?? 0} shot={{ cam: [2.2, 6.2, 10.5], look: [0, -1.6, 0], fov: 28 }} />
    <Grain opacity={0.12} vignette={0.5} />
  </AbsoluteFill>
);
