import React from "react";
import { colors } from "../brand";
import { COPY } from "../copy";
import { ChannelHub } from "../components/ChannelHub";
import { Headline } from "../components/Headline";
import { LightBackdrop, SceneShell, VisualStage } from "../components/Stage";

/** One listing fans out to every channel; "60+" counts up during the entrance only. */
export const Scene06: React.FC = () => (
  <SceneShell bg={colors.cream} transition="wipeUp">
    <LightBackdrop />
    <VisualStage lines={COPY.s06.headline.length} drift={false}>
      <ChannelHub mode="fan" />
    </VisualStage>
    <Headline lines={COPY.s06.headline} tone="onLight" count={COPY.s06.count} />
  </SceneShell>
);
