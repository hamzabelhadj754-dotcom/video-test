import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { makeBundle } from "./bundle";

const LEN = 18;
const VOLT = new THREE.Color("#FF3D14");
const HOT = new THREE.Color("#FFD9B0");
const OFF = new THREE.Color("#141514");
const BODY = new THREE.Color("#1B1D1B");
const PUSH = 0.12;

export type Shot = {
  cam: [number, number, number];
  look: [number, number, number];
  fov: number;
  roll?: number;
};

// activation 0..1: share of the recruitment threshold range that is firing. heat 0..1: white-hot core at failure.
const Bundle: React.FC<{ activation: number; heat: number }> = ({ activation, heat }) => {
  const fibers = useMemo(() => makeBundle(), []);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const cores = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const c = new THREE.Color();
    fibers.forEach((fb, i) => {
      const on = THREE.MathUtils.smoothstep(activation, fb.th - 0.05, fb.th + 0.015);
      const z = fb.z + on * PUSH * (0.7 + heat * 0.6);
      // body: long glossy cylinder behind the cut face
      m.compose(new THREE.Vector3(fb.x, fb.y, z - LEN / 2), q, new THREE.Vector3(fb.r, LEN, fb.r));
      bodies.current!.setMatrixAt(i, m);
      c.copy(BODY).lerp(VOLT, on * 0.04);
      bodies.current!.setColorAt(i, c);
      // cap: the cut face
      m.compose(new THREE.Vector3(fb.x, fb.y, z + 0.001), new THREE.Quaternion(), new THREE.Vector3(fb.r * 0.9, fb.r * 0.9, 1));
      caps.current!.setMatrixAt(i, m);
      c.copy(OFF).lerp(VOLT, on).lerp(HOT, on * Math.pow(heat, 1.5) * 0.85);
      caps.current!.setColorAt(i, c);
      // light running along the fiber
      const s = on > 0.01 ? fb.r * 1.06 : 0.0001;
      m.compose(new THREE.Vector3(fb.x, fb.y, z - LEN / 2 + 0.02), q, new THREE.Vector3(s, LEN, s));
      cores.current!.setMatrixAt(i, m);
      c.copy(VOLT).lerp(HOT, Math.max(0, heat - 0.4) * 0.8).multiplyScalar(on * (0.5 + heat * 0.5));
      cores.current!.setColorAt(i, c);
      // soft halo at the face (fake bloom)
      const h = fb.r * (2.6 + heat * 1.6);
      m.compose(new THREE.Vector3(fb.x, fb.y, z + 0.01), new THREE.Quaternion(), new THREE.Vector3(h, h, 1));
      halos.current!.setMatrixAt(i, m);
      c.copy(VOLT).multiplyScalar(on * (0.04 + heat * 0.06));
      halos.current!.setColorAt(i, c);
    });
    for (const r of [bodies, caps, cores, halos]) {
      r.current!.instanceMatrix.needsUpdate = true;
      if (r.current!.instanceColor) r.current!.instanceColor.needsUpdate = true;
    }
  }, [fibers, activation, heat]);

  const halo = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,0.35)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);

  // fade map along the fiber: bright at the cut face, gone a few units down
  const fade = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "rgb(255,255,255)");
    gr.addColorStop(0.03, "rgb(90,90,90)");
    gr.addColorStop(0.12, "rgb(10,10,10)");
    gr.addColorStop(0.25, "rgb(0,0,0)");
    gr.addColorStop(1, "rgb(0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, []);
  const n = fibers.length;
  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, n]}>
        <cylinderGeometry args={[1, 1, 1, 14, 1, true]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.55} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, n]}>
        <circleGeometry args={[1, 18]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cores} args={[undefined, undefined, n]}>
        <cylinderGeometry args={[1, 1, 1, 10, 1, true]} />
        <meshBasicMaterial color="#ffffff" alphaMap={fade} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[undefined, undefined, n]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={halo} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <mesh position={[0, 0, 0.05]} scale={[2.3, 2.3, 1]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={halo} transparent opacity={0.22 * Math.min(1, activation * 1.4) + heat * 0.18} color="#FF5A1F" blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Camera: React.FC<{ shot: Shot }> = ({ shot }) => {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...shot.cam);
  cam.up.set(0, 1, 0);
  cam.lookAt(...shot.look);
  cam.rotateZ(shot.roll ?? 0);
  cam.fov = shot.fov;
  cam.aspect = size.width / size.height;
  cam.near = 0.05;
  cam.far = 60;
  cam.updateProjectionMatrix();
  return null;
};

export const MuscleScene: React.FC<{ width: number; height: number; activation: number; heat?: number; shot: Shot }> = ({
  width,
  height,
  activation,
  heat = 0,
  shot,
}) => (
  <ThreeCanvas width={width} height={height} gl={{ antialias: true }} camera={{ position: shot.cam, fov: shot.fov }}>
    <color attach="background" args={["#0A0A0A"]} />
    <fog attach="fog" args={["#0A0A0A", 10, 19]} />
    <Camera shot={shot} />
    <ambientLight intensity={0.06} />
    <directionalLight position={[-6, 2, -5]} intensity={3.4} color="#ffffff" />
    <directionalLight position={[6, -1, -4]} intensity={1.4} color="#DDE6FF" />
    <directionalLight position={[2, 8, 6]} intensity={0.3} color="#ffffff" />
    <directionalLight position={[-5, 1, 7]} intensity={1.3} color="#ffffff" />
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <Bundle activation={activation} heat={heat} />
    </group>
  </ThreeCanvas>
);
