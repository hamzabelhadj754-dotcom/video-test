import { random } from "remotion";
import { C, F } from "../theme";

const START = -225; // degrees, 0 = 12 o'clock, clockwise positive
const SWEEP = 270;
const MAX = 8;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
  const a = polar(cx, cy, r, from);
  const b = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};

/**
 * The Discipline Engine tachometer. `value` 0..1 maps to 0..8k RPM.
 * `frame` adds idle needle tremor once the engine is running.
 */
export const Gauge: React.FC<{
  value: number;
  frame: number;
  size?: number;
  status?: string;
  reveal?: number; // 0..1 draws the dial in
}> = ({ value, frame, size = 560, status = "IGNITION: OFF", reveal = 1 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const tremor = value > 0.02 ? (random(`g${frame}`) - 0.5) * 3 * (0.4 + value) : 0;
  const v = Math.max(0, Math.min(1.02, value));
  const needleDeg = START + SWEEP * v + tremor;
  const rpm = Math.round((v * MAX * 1000 + tremor * 40) / 10) * 10;
  const red = v > 0.86;

  const ticks: React.ReactNode[] = [];
  const shown = Math.floor(reveal * (MAX * 4 + 1));
  for (let i = 0; i <= MAX * 4; i++) {
    if (i >= shown) break;
    const deg = START + (SWEEP * i) / (MAX * 4);
    const major = i % 4 === 0;
    const a = polar(cx, cy, r, deg);
    const b = polar(cx, cy, r - (major ? 34 : 16), deg);
    const isRed = i >= 7 * 4;
    ticks.push(
      <line
        key={i}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={isRed ? C.accent : C.ink}
        strokeWidth={major ? 5 : 2}
        strokeOpacity={major ? 1 : 0.55}
      />,
    );
    if (major) {
      const t = polar(cx, cy, r - 66, deg);
      ticks.push(
        <text
          key={`t${i}`}
          x={t.x}
          y={t.y + 9}
          textAnchor="middle"
          fontFamily={F.mono}
          fontWeight={700}
          fontSize={26}
          fill={isRed ? C.accent : C.ink}
        >
          {i / 4}
        </text>,
      );
    }
  }

  const tip = polar(cx, cy, r - 12, needleDeg);
  const tail = polar(cx, cy, 34, needleDeg + 180);
  const fillEnd = START + SWEEP * Math.min(v, 1) * reveal;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <path d={arc(cx, cy, r + 22, START, START + SWEEP * reveal)} stroke={C.ink} strokeOpacity={0.18} strokeWidth={2} fill="none" />
      <path d={arc(cx, cy, r + 22, START + (SWEEP * 7) / 8, START + SWEEP)} stroke={C.accent} strokeWidth={8} fill="none" opacity={reveal} />
      {v > 0.005 && (
        <path d={arc(cx, cy, r + 22, START, Math.max(START + 0.5, fillEnd))} stroke={red ? C.accent : C.ink} strokeWidth={8} fill="none" />
      )}
      {ticks}
      <line
        x1={tail.x}
        y1={tail.y}
        x2={tip.x}
        y2={tip.y}
        stroke={C.accent}
        strokeWidth={7}
        strokeLinecap="square"
        opacity={reveal}
      />
      <circle cx={cx} cy={cy} r={22} fill={C.bg} stroke={C.ink} strokeWidth={4} opacity={reveal} />
      <text x={cx} y={cy + 118} textAnchor="middle" fontFamily={F.display} fontSize={96} fill={C.ink} opacity={reveal}>
        {String(Math.max(0, rpm)).padStart(4, "0")}
      </text>
      <text x={cx} y={cy + 156} textAnchor="middle" fontFamily={F.mono} fontSize={22} letterSpacing={6} fill={C.dim} opacity={reveal}>
        RPM × DISCIPLINE
      </text>
      <text
        x={cx}
        y={cy + 214}
        textAnchor="middle"
        fontFamily={F.mono}
        fontWeight={700}
        fontSize={24}
        letterSpacing={5}
        fill={red ? C.accent : C.ink}
        opacity={reveal}
      >
        {status}
      </text>
    </svg>
  );
};
