import "./index.css";
import { Composition } from "remotion";
import { AdvertComposition } from "./Composition";

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
    </>
  );
};
