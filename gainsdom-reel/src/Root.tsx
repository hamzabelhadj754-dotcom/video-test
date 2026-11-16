import { Composition } from "remotion";
import { FPS, H, W } from "./theme";
import "./fonts";
import { DUR, Film } from "./Film";
import { HeroTest } from "./HeroTest";
import { Still } from "remotion";

const FilmMB: React.FC = () => <Film sub={4} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Studio" component={Film} width={W} height={H} fps={FPS} durationInFrames={DUR} />
    <Composition id="StudioMB" component={FilmMB} width={W} height={H} fps={FPS * 4} durationInFrames={DUR * 4} />
    <Still id="hero" component={HeroTest} width={W} height={H} />
  </>
);
