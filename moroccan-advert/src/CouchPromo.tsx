import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  Sequence,
  Easing,
  staticFile,
} from "remotion";

const GOLD = "#d8b46a";
const IVORY = "#f7efe2";
const CHARCOAL = "#090807";
const ESPRESSO = "#17110d";

const FPS = 30;
const SCENE_DUR = 40; // frames per scene (~1.33s)
const TRANS_DUR = 8;  // crossfade frames
const SCENES_COUNT = 6;

interface SceneDef {
  img: string;
  tag: string;
  caption: string;
  scaleEnd: number;
  xEnd: number;
  yEnd: number;
}

const SCENES: SceneDef[] = [
  {
    img: "couch1.jpeg",
    tag: "LUXURY SOFAS",
    caption: "صالون كيعطي الدار هيبتها",
    scaleEnd: 1.12,
    xEnd: -40,
    yEnd: -30,
  },
  {
    img: "couch2.jpeg",
    tag: "TAILORED COMFORT",
    caption: "راحة فخمة وتفصيل نقي",
    scaleEnd: 1.08,
    xEnd: 32,
    yEnd: -24,
  },
  {
    img: "couch3.jpeg",
    tag: "COLOR HARMONY",
    caption: "ألوان كتجمع الذوق والراحة",
    scaleEnd: 1.1,
    xEnd: -28,
    yEnd: 36,
  },
  {
    img: "couch4.jpeg",
    tag: "SIGNATURE LOOK",
    caption: "تصميم كيبان من أول نظرة",
    scaleEnd: 1.09,
    xEnd: 36,
    yEnd: 22,
  },
  {
    img: "couch5.jpeg",
    tag: "BUILT TO LAST",
    caption: "جلسة معمولة باش تبقى",
    scaleEnd: 1.11,
    xEnd: -32,
    yEnd: -18,
  },
  {
    img: "couch6.jpeg",
    tag: "BOOK YOUR STYLE",
    caption: "زيد اللمسة اللي كتليق بيك",
    scaleEnd: 1.1,
    xEnd: 28,
    yEnd: 28,
  },
];

// Ken Burns pan + zoom on a still image
const KenBurnsImage: React.FC<{ src: string; scaleEnd: number; xEnd: number; yEnd: number }> = ({
  src,
  scaleEnd,
  xEnd,
  yEnd,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, SCENE_DUR], [0, 1], { extrapolateRight: "clamp" });

  const scale = interpolate(progress, [0, 1], [1, scaleEnd], {
    easing: Easing.out(Easing.ease),
  });
  const x = interpolate(progress, [0, 1], [0, xEnd], {
    easing: Easing.inOut(Easing.ease),
  });
  const y = interpolate(progress, [0, 1], [0, yEnd], {
    easing: Easing.inOut(Easing.ease),
  });

  // Blur in from start
  const blurIn = interpolate(frame, [0, 8], [6, 0], { extrapolateRight: "clamp" });

  return (
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        transformOrigin: "center center",
        filter: `blur(${blurIn}px) saturate(1.06) contrast(1.06)`,
      }}
    />
  );
};

// Animated gold top rule drawing in
const TopRule: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame, config: { damping: 22, stiffness: 220, mass: 0.5 }, from: 0, to: 1 });
  return (
    <div
      style={{
        position: "absolute",
        top: 156,
        right: 78,
        height: 2,
        width: 360,
        background: GOLD,
        transformOrigin: "right center",
        transform: `scaleX(${s})`,
        opacity: s,
      }}
    />
  );
};

// Animated gold side rule drawing down
const SideRule: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 5), config: { damping: 22, stiffness: 200, mass: 0.5 }, from: 0, to: 1 });
  return (
    <div
      style={{
        position: "absolute",
        top: 156,
        right: 78,
        width: 2,
        height: 245,
        background: GOLD,
        transformOrigin: "top center",
        transform: `scaleY(${s})`,
        opacity: s,
      }}
    />
  );
};

// Bottom fine rule
const FineRule: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 8), config: { damping: 22, stiffness: 180, mass: 0.5 }, from: 0, to: 1 });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 240,
        left: 80,
        height: 2,
        width: 220,
        background: GOLD,
        opacity: s * 0.75,
        transform: `scaleX(${s})`,
        transformOrigin: "left center",
      }}
    />
  );
};

// Corner accent — four dots at corners of the rule intersection
const CornerDot: React.FC<{ top?: number; bottom?: number; left?: number; right?: number; delay?: number }> = ({
  top, bottom, left, right, delay = 0,
}) => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - delay), config: { damping: 18, stiffness: 280 }, from: 0, to: 1 });
  return (
    <div
      style={{
        position: "absolute",
        top, bottom, left, right,
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: GOLD,
        opacity: s,
        transform: `scale(${s})`,
      }}
    />
  );
};

const Brand: React.FC<{ sceneIndex: number }> = ({ sceneIndex }) => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 3), config: { damping: 20, stiffness: 240 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [-28, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 70,
        zIndex: 5,
        opacity: s,
        transform: `translateY(${y}px)`,
        color: IVORY,
        fontFamily: "Georgia, serif",
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: "0.18em",
        direction: "ltr",
        textShadow: "0 12px 30px rgba(0,0,0,0.5)",
      }}
    >
      ZEKRI INTERIORS
    </div>
  );
};

const SceneNumber: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 6), config: { damping: 20, stiffness: 200 }, from: 0, to: 1 });
  const x = interpolate(s, [0, 1], [36, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 77,
        right: 70,
        zIndex: 5,
        opacity: s * 0.75,
        transform: `translateX(${x}px)`,
        color: IVORY,
        fontFamily: "Georgia, serif",
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: "0.08em",
        direction: "ltr",
      }}
    >
      {String(index + 1).padStart(2, "0")} / {String(SCENES_COUNT).padStart(2, "0")}
    </div>
  );
};

const Tag: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 5), config: { damping: 22, stiffness: 200 }, from: 0, to: 1 });
  const x = interpolate(s, [0, 1], [-60, 0]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 42,
        padding: "0 18px",
        border: `1px solid rgba(216,180,106,0.76)`,
        color: GOLD,
        background: "rgba(9,8,7,0.46)",
        fontFamily: "Georgia, serif",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "0.18em",
        direction: "ltr",
        opacity: s,
        transform: `translateX(${x}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const s = spring({ fps: FPS, frame: Math.max(0, frame - 3), config: { damping: 18, stiffness: 220, mass: 0.6 }, from: 0, to: 1 });
  const y = interpolate(s, [0, 1], [50, 0]);
  const scale = interpolate(s, [0, 1], [0.96, 1]);

  return (
    <h1
      style={{
        margin: 0,
        color: IVORY,
        fontSize: 68,
        lineHeight: 1.08,
        fontWeight: 900,
        textAlign: "right",
        direction: "rtl",
        fontFamily: "Arial, sans-serif",
        textShadow: "0 16px 42px rgba(0,0,0,0.65)",
        opacity: s,
        transform: `translateY(${y}px) scale(${scale})`,
        maxWidth: 850,
      }}
    >
      {text}
    </h1>
  );
};

// Cinematic vignette + warm overlay
const PhotoOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 28% 18%, rgba(216,180,106,0.18), rgba(216,180,106,0) 34%)," +
        "linear-gradient(180deg, rgba(9,8,7,0.08), rgba(9,8,7,0.35) 68%, rgba(9,8,7,0.80))",
      pointerEvents: "none",
    }}
  />
);

// Warm light-leak flash on transition
const LightLeak: React.FC<{ absoluteFrame: number; sceneStart: number }> = ({ absoluteFrame, sceneStart }) => {
  const inFrames = absoluteFrame - (sceneStart - TRANS_DUR);
  const peak = interpolate(inFrames, [0, TRANS_DUR * 0.4, TRANS_DUR * 0.8, TRANS_DUR], [0, 0.72, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: "-14%",
        zIndex: 8,
        opacity: peak,
        background:
          "radial-gradient(circle at 16% 18%, rgba(247,239,226,0.38), rgba(247,239,226,0) 22%)," +
          "radial-gradient(circle at 82% 74%, rgba(183,104,71,0.42), rgba(183,104,71,0) 30%)," +
          "linear-gradient(112deg, rgba(216,180,106,0), rgba(216,180,106,0.55), rgba(216,180,106,0))",
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

// Iris blur wipe on transition out
const IrisWipe: React.FC<{ frame: number; sceneEnd: number }> = ({ frame, sceneEnd }) => {
  const outFrames = frame - (sceneEnd - TRANS_DUR);
  const opacity = interpolate(outFrames, [0, TRANS_DUR * 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 7,
        opacity,
        background: "rgba(9,8,7,0.38)",
        backdropFilter: `blur(18px)`,
        WebkitBackdropFilter: `blur(18px)`,
        pointerEvents: "none",
      }}
    />
  );
};

// One full scene
const SceneCard: React.FC<{
  scene: SceneDef;
  index: number;
  absoluteFrame: number;
}> = ({ scene, index, absoluteFrame }) => {
  const sceneStart = index * SCENE_DUR;
  const frame = absoluteFrame - sceneStart;
  const isLast = index === SCENES_COUNT - 1;

  const fadeIn = interpolate(frame, [0, TRANS_DUR], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [SCENE_DUR - TRANS_DUR, SCENE_DUR], [1, 0], { extrapolateLeft: "clamp" });

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        zIndex: index + 1,
      }}
    >
      {/* Background image with ken burns */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: ESPRESSO }}>
        <Sequence from={0} durationInFrames={SCENE_DUR} layout="none">
          <KenBurnsImage
            src={scene.img}
            scaleEnd={scene.scaleEnd}
            xEnd={scene.xEnd}
            yEnd={scene.yEnd}
          />
        </Sequence>
      </div>

      {/* Cinematic overlay */}
      <PhotoOverlay />

      {/* Motion graphics */}
      <Sequence from={0} durationInFrames={SCENE_DUR} layout="none">
        <TopRule />
        <SideRule />
        <FineRule />
        <CornerDot top={154} right={76} delay={4} />
        <CornerDot top={154} right={436} delay={6} />
        <CornerDot top={399} right={76} delay={8} />
      </Sequence>

      {/* Brand + number */}
      <Sequence from={0} durationInFrames={SCENE_DUR} layout="none">
        <Brand sceneIndex={index} />
        <SceneNumber index={index} />
      </Sequence>

      {/* Caption block */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          bottom: 116,
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <Sequence from={0} durationInFrames={SCENE_DUR} layout="none">
          <Tag text={scene.tag} />
        </Sequence>
        <Sequence from={0} durationInFrames={SCENE_DUR} layout="none">
          <Caption text={scene.caption} />
        </Sequence>
      </div>

      {/* Transition iris + light leak */}
      {!isLast && <IrisWipe frame={frame} sceneEnd={SCENE_DUR} />}
    </div>
  );
};

// Outro card (last ~20 frames)
const OutroCard: React.FC<{ absoluteFrame: number }> = ({ absoluteFrame }) => {
  const totalFrames = SCENES_COUNT * SCENE_DUR;
  const outroStart = totalFrames - 20;
  const frame = absoluteFrame - outroStart;
  const fade = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold divider
  const lineS = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        opacity: fade,
        background: CHARCOAL,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          color: IVORY,
          fontFamily: "Georgia, serif",
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: "0.2em",
          direction: "ltr",
        }}
      >
        ZEKRI INTERIORS
      </div>
      <div
        style={{
          width: `${lineS * 260}px`,
          height: 1,
          background: GOLD,
          opacity: 0.8,
        }}
      />
      <div
        style={{
          color: GOLD,
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.2em",
          direction: "ltr",
          opacity: lineS,
        }}
      >
        LUXURY · MOROCCAN DESIGN
      </div>
      <div
        style={{
          color: IVORY,
          fontFamily: "Arial, sans-serif",
          fontSize: 36,
          fontWeight: 700,
          direction: "rtl",
          marginTop: 12,
          opacity: lineS,
          textAlign: "center",
        }}
      >
        تواصل معنا اليوم
      </div>
    </div>
  );
};

// Final shade for outro
const FinalShade: React.FC<{ absoluteFrame: number }> = ({ absoluteFrame }) => {
  const totalFrames = SCENES_COUNT * SCENE_DUR;
  const opacity = interpolate(absoluteFrame, [totalFrames - 12, totalFrames - 6], [0, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 99,
        background: CHARCOAL,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export const CouchPromo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: CHARCOAL }}>
      {SCENES.map((scene, i) => {
        const sceneStart = i * SCENE_DUR;
        if (frame < sceneStart - TRANS_DUR || frame >= sceneStart + SCENE_DUR + TRANS_DUR) return null;
        return (
          <Sequence key={i} from={sceneStart} durationInFrames={SCENE_DUR + TRANS_DUR} layout="none">
            <SceneCard scene={scene} index={i} absoluteFrame={frame} />
          </Sequence>
        );
      })}

      {/* Global light leaks at each transition */}
      {SCENES.slice(1).map((_, i) => {
        const sceneStart = (i + 1) * SCENE_DUR;
        return (
          <LightLeak key={i} absoluteFrame={frame} sceneStart={sceneStart} />
        );
      })}

      <FinalShade absoluteFrame={frame} />

      {/* Outro */}
      <Sequence from={SCENES_COUNT * SCENE_DUR - 20} durationInFrames={20} layout="none">
        <OutroCard absoluteFrame={frame} />
      </Sequence>
    </AbsoluteFill>
  );
};
