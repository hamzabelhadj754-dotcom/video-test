import { Still } from "remotion";
import { H, W } from "./theme";
import "./fonts";
import { FrameFail, FrameHook, FrameLight } from "./scenes/Frames";
import { Test3D } from "./scenes/Test3D";

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="frame-hook" component={FrameHook} width={W} height={H} />
    <Still id="frame-light" component={FrameLight} width={W} height={H} />
    <Still id="frame-fail" component={FrameFail} width={W} height={H} />
    <Still id="test-3d" component={Test3D} width={W} height={H} />
  </>
);
