import React from "react";
import {
  Composition,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Text3D, Center, Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

// Starter: extruded 3D lettering with studio reflections, a slow orbit camera,
// bloom, film grain and vignette. Copy and adapt for real episodes.
const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const a = frame / 45;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [Math.sin(a) * 0.9, 0.15, 5.2], fov: 38 }}
      style={{ backgroundColor: "#050505" }}
    >
      <color attach="background" args={["#050505"]} />
      <ambientLight intensity={0.15} />
      <spotLight
        position={[-4, 4, 5]}
        intensity={260}
        angle={0.6}
        penumbra={1}
      />
      {/* Local studio lighting (render browser has no internet): soft panels to reflect. */}
      <Environment resolution={256}>
        <Lightformer intensity={3} position={[0, 3, 4]} scale={[8, 1.5, 1]} />
        <Lightformer
          intensity={1.5}
          position={[-5, 0, 2]}
          rotation-y={Math.PI / 2}
          scale={[6, 2, 1]}
        />
        <Lightformer
          intensity={0.8}
          position={[5, -1, 2]}
          rotation-y={-Math.PI / 2}
          scale={[6, 2, 1]}
        />
      </Environment>
      <Center>
        <Text3D
          font={staticFile("3d/helvetiker_bold.typeface.json")}
          size={0.5}
          height={0.16}
          bevelEnabled
          bevelSize={0.015}
          bevelThickness={0.03}
          rotation={[0, Math.sin(a) * 0.25, 0]}
        >
          LOCK IN
          <meshStandardMaterial
            color="#e8e8e8"
            metalness={1}
            roughness={0.18}
          />
        </Text3D>
      </Center>
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.6} mipmapBlur />
        <Noise opacity={0.12} />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
      </EffectComposer>
    </ThreeCanvas>
  );
};

export const Root: React.FC = () => (
  <Composition
    id="T3D"
    component={Scene}
    durationInFrames={90}
    fps={30}
    width={1080}
    height={1920}
  />
);
