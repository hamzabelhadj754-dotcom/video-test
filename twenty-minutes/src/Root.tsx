import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { B } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TwentyMinutes"
    component={Film}
    durationInFrames={B.total}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ audio: true }}
  />
);
