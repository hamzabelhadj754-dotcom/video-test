import React from "react";
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { SoftPromo } from "./soft/SoftPromo";
import { getLayout } from "./layout";
import { FPS, TOTAL } from "./timing";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Promo9x16"
      component={Promo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={getLayout("9x16").width}
      height={getLayout("9x16").height}
      defaultProps={{ format: "9x16" }}
    />
    <Composition
      id="Promo1x1"
      component={Promo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={getLayout("1x1").width}
      height={getLayout("1x1").height}
      defaultProps={{ format: "1x1" }}
    />
    <Composition
      id="Soft9x16"
      component={SoftPromo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={getLayout("9x16").width}
      height={getLayout("9x16").height}
      defaultProps={{ format: "9x16" }}
    />
    <Composition
      id="Soft1x1"
      component={SoftPromo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={getLayout("1x1").width}
      height={getLayout("1x1").height}
      defaultProps={{ format: "1x1" }}
    />
  </>
);
