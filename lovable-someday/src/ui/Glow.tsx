import { GRADIENT_STOPS } from "../theme";

// Soft brand glow built from the official gradient stops.
export const Glow: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  blur?: number;
  opacity?: number;
  from?: number;
}> = ({ x, y, w, h, rotate = 0, blur = 120, opacity = 1, from = 200 }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: "50%",
      background: `conic-gradient(from ${from}deg at 50% 50%, ${GRADIENT_STOPS.replace(
        /(\d+)%/g,
        (_, p) => `${(Number(p) * 3.6).toFixed(0)}deg`,
      )}, #4F88FF 360deg)`,
      filter: `blur(${blur}px)`,
      transform: `rotate(${rotate}deg)`,
      opacity,
    }}
  />
);
