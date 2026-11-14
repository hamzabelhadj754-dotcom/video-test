import { Still } from "remotion";
import { H, W } from "./theme";
import "./fonts";
import { Hook } from "./scenes/Hook";
import { Meter } from "./scenes/Meter";
import { Compare } from "./scenes/Compare";

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="frame-hook" component={Hook} width={W} height={H} />
    <Still id="frame-meter" component={Meter} width={W} height={H} />
    <Still id="frame-compare" component={Compare} width={W} height={H} />
  </>
);
