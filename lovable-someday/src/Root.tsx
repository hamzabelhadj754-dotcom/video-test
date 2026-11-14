import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import { Film } from "./Film";

// Someday: 30fps preview. SomedayMB: 4 sub-frames per frame, blended to 30fps for real motion blur.
const FilmMB: React.FC = () => <Film sub={4} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Someday" component={Film} width={W} height={H} fps={FPS} durationInFrames={660} />
    <Composition id="SomedayMB" component={FilmMB} width={W} height={H} fps={FPS * 4} durationInFrames={660 * 4} />
  </>
);
