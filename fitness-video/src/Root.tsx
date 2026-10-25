import { Composition } from "remotion";
import { GainsDomLoop } from "./Composition";
import { FPS, HEIGHT, WIDTH } from "./constants";
import { durationOf } from "./episode";
import { EPISODES } from "./episodes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((episode) => (
        <Composition
          key={episode.id}
          id={episode.id}
          component={GainsDomLoop}
          durationInFrames={durationOf(episode)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ episode }}
        />
      ))}
    </>
  );
};
