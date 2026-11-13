export const Cursor: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <svg
    width={54}
    height={66}
    viewBox="0 0 27 33"
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `scale(${scale})`,
      transformOrigin: "4px 3px",
      filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.28))",
    }}
  >
    <path
      d="M3 2.2 L3 25.5 L9.2 19.9 L13.3 29.6 L17.6 27.8 L13.6 18.3 L21.8 18.1 Z"
      fill="#1B1B1B"
      stroke="#FFFFFF"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);
