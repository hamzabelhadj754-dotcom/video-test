import React from "react";
import { Composition } from "remotion";
import { Reel, TOTAL } from "./Reel";

export const RemotionRoot: React.FC = () => (
  <Composition id="HomeReel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{ audio: true }} />
);
