import { AbsoluteFill } from "remotion";
import "./fonts";
import { BackScene, FrontScene, HexDB, Shot, TypePlane, useBrandReady } from "./three/Hero";
import { Grain } from "./ui/Grain";

const shot: Shot = { cam: [0.9, 0.3, 6.2], look: [0, -0.1, 0], fov: 32, roll: -0.03, focus: 6.2 };
const dbs: HexDB[] = [{ pos: [0, -0.45, 0], rot: [0.18, -0.62, 0.08], scale: 0.92, tone: "black" }];
const type: TypePlane[] = [
  { text: "SAME", pos: [-0.45, 1.45, -3.5], h: 0.82, color: "#ffffff" },
  { text: "MUSCLE", pos: [-0.45, 0.62, -3.5], h: 0.82, color: "#ffffff", outline: true },
];

export const HeroTest: React.FC = () => {
  const ready = useBrandReady();
  if (!ready) return null;
  return (
  <AbsoluteFill style={{ background: "#060607" }}>
    <AbsoluteFill style={{ filter: "blur(5px)" }}>
      <BackScene width={1080} height={1920} shot={shot} dbs={dbs} type={type} />
    </AbsoluteFill>
    <FrontScene width={1080} height={1920} shot={shot} dbs={dbs} />
    <FrontScene width={1080} height={1920} shot={shot} dbs={dbs} style={{ filter: "blur(22px) brightness(2.2) contrast(3)", mixBlendMode: "screen", opacity: 0.35 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
    <Grain opacity={0.08} vignette={0} />
  </AbsoluteFill>
  );
};
