import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import "./fonts";
import { Film } from "./Film";
import { DUR } from "./timeline";

const FilmMB: React.FC = () => <Film sub={4} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel" component={Film} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="ReelMB" component={FilmMB} width={W} height={H} fps={FPS * 4} durationInFrames={DUR * 4} />
  </>
);
