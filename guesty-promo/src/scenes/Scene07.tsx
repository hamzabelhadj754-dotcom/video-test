import React from "react";
import { colors } from "../brand";
import { COPY } from "../copy";
import { ChannelHub } from "../components/ChannelHub";
import { Headline } from "../components/Headline";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";

/** Same hub as scene 6 (continuity): pulses travel the lines, every chip updates at once. */
export const Scene07: React.FC = () => (
  <SceneShell bg={colors.cream}>
    <LightBackdrop />
    <VisualStage lines={COPY.s07.headline.length} drift={false}>
      <ChannelHub mode="sync" />
    </VisualStage>
    <Headline lines={COPY.s07.headline} tone="onLight" />
  </SceneShell>
);
