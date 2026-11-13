import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import { Film } from "./Film";

export const RemotionRoot: React.FC = () => (
  <Composition id="Someday" component={Film} width={W} height={H} fps={FPS} durationInFrames={660} />
);
