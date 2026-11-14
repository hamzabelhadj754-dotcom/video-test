import { C } from "../theme";
import { MONO } from "../fonts";

export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.w60,
  size = 26,
  style,
}) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color, ...style }}>
    {children}
  </div>
);
