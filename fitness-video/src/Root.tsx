import { Composition } from "remotion";
import { GainsDomLoop } from "./Composition";
import { FPS, HEIGHT, WIDTH } from "./constants";
import { durationOf } from "./episode";
import { EPISODES } from "./episodes";

// Each episode gets a silent render (to post, add the sound in-app) and a
// "-Music" render with the song baked in to check the beat sync.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.flatMap((episode) =>
        [false, true].map((withAudio) => (
          <Composition
            key={`${episode.id}-${withAudio}`}
            id={withAudio ? `${episode.id}-Music` : episode.id}
            component={GainsDomLoop}
            durationInFrames={durationOf(episode)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{ episode, withAudio }}
          />
        )),
      )}
    </>
  );
};
