import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { SANS, SERIF } from "../fonts";
import { tw } from "../anim";

const WORDS: { w: string; i?: boolean; br?: boolean }[] = [
  { w: "Someday", i: true },
  { w: "is" },
  { w: "a", br: true },
  { w: "sentence" },
  { w: "away." },
];

export const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const logo = tw(f, 554, 578, 0, 1);
  const url = tw(f, 600, 622, 0, 1);
  return (
    <AbsoluteFill style={{ alignItems: "center", transform: `scale(${tw(f, 540, 660, 1, 1.035, [0, 0, 1, 1])})` }}>
      <Img
        src={staticFile("brand/lockup-creme.svg")}
        style={{ height: 62, marginTop: 150, opacity: logo, transform: `translateY(${(1 - logo) * 18}px)`, filter: `blur(${(1 - logo) * 8}px)` }}
      />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 190,
          lineHeight: "182px",
          letterSpacing: "-0.03em",
          color: C.creme,
          textAlign: "center",
          marginTop: 150,
        }}
      >
        {WORDS.map((x, k) => {
          const p = tw(f, 562 + k * 5, 590 + k * 5, 0, 1);
          return (
            <span key={x.w}>
              <span
                style={{
                  display: "inline-block",
                  fontStyle: x.i ? "italic" : "normal",
                  opacity: Math.min(1, p * 1.6),
                  transform: `translateY(${(1 - p) * 70}px)`,
                  filter: `blur(${(1 - p) * 14}px)`,
                  marginRight: x.br || k === WORDS.length - 1 ? 0 : "0.22em",
                }}
              >
                {x.w}
              </span>
              {x.br ? <br /> : null}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: C.creme,
          marginTop: 84,
          opacity: url,
          transform: `translateY(${(1 - url) * 14}px)`,
        }}
      >
        lovable.dev
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 64,
          fontFamily: SANS,
          fontSize: 22,
          letterSpacing: "0.02em",
          color: C.creme60,
          opacity: tw(f, 606, 626, 0, 1),
        }}
      >
        Spec ad. Not affiliated with Lovable.
      </div>
    </AbsoluteFill>
  );
};
