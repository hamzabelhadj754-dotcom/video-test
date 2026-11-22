import React from "react";
import { Composition } from "remotion";
import { InvozaLaunch } from "./Video";
import T from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Invoza"
    component={InvozaLaunch}
    durationInFrames={T.durationInFrames}
    fps={T.fps}
    width={1920}
    height={1080}
  />
);
