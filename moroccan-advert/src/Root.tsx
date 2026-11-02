import "./index.css";
import { Composition } from "remotion";
import { AdvertComposition } from "./Composition";
import { FulfillmentReel } from "./fulfillment/FulfillmentReel";
import { DURATION_S, FPS } from "./fulfillment/data";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AdvertComp"
        component={AdvertComposition}
        durationInFrames={192}
        fps={24}
        width={720}
        height={1280}
      />
      <Composition
        id="FulfillmentReel"
        component={FulfillmentReel}
        durationInFrames={Math.round(DURATION_S * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
