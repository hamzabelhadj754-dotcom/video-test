import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { makeBundle } from "./bundle";

const LEN = 18;
const EMBER = new THREE.Color("#FF3D14");
const HOT = new THREE.Color("#FFD9B0");
const OFF = new THREE.Color("#141514");
const BODY = new THREE.Color("#1B1D1B");
const PUSH = 0.12;

export type Shot = { cam: [number, number, number]; look: [number, number, number]; fov: number; roll?: number };

export type BundleState = {
  x?: number; // world offset
  scale?: number;
  activation: number; // 0..1 share of recruitment thresholds firing
  heat: number; // 0..1 white-hot at failure
  pulse?: number; // 0..1 momentary contraction on each rep
  wave?: number; // radial ignition radius (world units); overrides thresholds inside it
  waveIn?: boolean; // true: fibers outside the radius are off (power-down from the edge)
  seed?: number;
};

const texCache: Record<string, THREE.Texture> = {};
const radialTex = () => {
  if (texCache.r) return texCache.r;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  texCache.r = new THREE.CanvasTexture(cv);
  return texCache.r;
};
const fadeTex = () => {
  if (texCache.f) return texCache.f;
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
  texCache.f = new THREE.CanvasTexture(cv);
  return texCache.f;
};

export const fiberOn = (fb: { x: number; y: number; th: number }, s: BundleState) => {
  let on = THREE.MathUtils.smoothstep(s.activation, fb.th - 0.05, fb.th + 0.015);
  if (s.wave !== undefined) {
    const d = Math.hypot(fb.x, fb.y);
    const w = THREE.MathUtils.smoothstep(s.wave - d, -0.02, 0.12);
    on = s.waveIn ? on * w : Math.max(on, w);
  }
  return on;
};

const Bundle: React.FC<{ s: BundleState; f: number }> = ({ s, f }) => {
  const fibers = useMemo(() => makeBundle(), []);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const cores = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const pulse = s.pulse ?? 0;
  const heat = s.heat;

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    const c = new THREE.Color();
    const I = new THREE.Quaternion();
    fibers.forEach((fb, i) => {
      const on = fiberOn(fb, s);
      const z = fb.z + on * PUSH * (0.7 + heat * 0.6 + pulse * 0.9);
      m.compose(new THREE.Vector3(fb.x, fb.y, z - LEN / 2), q, new THREE.Vector3(fb.r, LEN, fb.r));
      bodies.current!.setMatrixAt(i, m);
      c.copy(BODY).lerp(EMBER, on * 0.04);
      bodies.current!.setColorAt(i, c);
      m.compose(new THREE.Vector3(fb.x, fb.y, z + 0.001), I, new THREE.Vector3(fb.r * 0.9, fb.r * 0.9, 1));
      caps.current!.setMatrixAt(i, m);
      c.copy(OFF).lerp(EMBER, on).lerp(HOT, on * Math.min(1, Math.pow(heat, 1.5) * 0.85 + pulse * 0.25));
      caps.current!.setColorAt(i, c);
      const sz = on > 0.01 ? fb.r * 1.06 : 0.0001;
      m.compose(new THREE.Vector3(fb.x, fb.y, z - LEN / 2 + 0.02), q, new THREE.Vector3(sz, LEN, sz));
      cores.current!.setMatrixAt(i, m);
      c.copy(EMBER).lerp(HOT, Math.max(0, heat - 0.4) * 0.8).multiplyScalar(on * (0.5 + heat * 0.5 + pulse * 0.3));
      cores.current!.setColorAt(i, c);
      const h = fb.r * (2.6 + heat * 1.6 + pulse);
      m.compose(new THREE.Vector3(fb.x, fb.y, z + 0.01), I, new THREE.Vector3(h, h, 1));
      halos.current!.setMatrixAt(i, m);
      c.copy(EMBER).multiplyScalar(on * (0.04 + heat * 0.06 + pulse * 0.04));
      halos.current!.setColorAt(i, c);
    });
    for (const r of [bodies, caps, cores, halos]) {
      r.current!.instanceMatrix.needsUpdate = true;
      if (r.current!.instanceColor) r.current!.instanceColor.needsUpdate = true;
    }
  }, [fibers, s.activation, s.heat, s.pulse, s.wave, s.waveIn]);

  // sparks rising off the face when it runs hot
  const N_SP = 140;
  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_SP * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N_SP * 3), 3));
    return g;
  }, []);
  useLayoutEffect(() => {
    const p = sparkGeo.attributes.position as THREE.BufferAttribute;
    const col = sparkGeo.attributes.color as THREE.BufferAttribute;
    const seed = s.seed ?? 0;
    const k = Math.max(0, heat - 0.35) / 0.65;
    for (let i = 0; i < N_SP; i++) {
      const r1 = Math.abs(Math.sin((i + seed) * 12.9898) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin((i + seed) * 78.233) * 12543.1234) % 1;
      const r3 = Math.abs(Math.sin((i + seed) * 39.425) * 9631.77) % 1;
      const life = 40 + r3 * 50;
      const t = ((f + r1 * life) % life) / life;
      const a = r2 * Math.PI * 2;
      const rr = 1.45 * Math.sqrt(r1);
      p.setXYZ(i, Math.cos(a) * rr + Math.sin(t * 6 + i) * 0.08, Math.sin(a) * rr + Math.cos(t * 5 + i) * 0.08, 0.1 + t * (1.4 + r3 * 1.6));
      const b = k * (1 - t) * (t < 0.08 ? t / 0.08 : 1);
      col.setXYZ(i, 1 * b, 0.62 * b, 0.4 * b);
    }
    p.needsUpdate = true;
    col.needsUpdate = true;
  }, [f, heat, s.seed]);

  const n = fibers.length;
  return (
    <group position={[s.x ?? 0, 0, 0]} scale={s.scale ?? 1}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
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
          <meshBasicMaterial color="#ffffff" alphaMap={fadeTex()} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={halos} args={[undefined, undefined, n]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial map={radialTex()} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </instancedMesh>
        <mesh position={[0, 0, 0.05]} scale={[2.3, 2.3, 1]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            map={radialTex()}
            transparent
            opacity={0.22 * Math.min(1, s.activation * 1.4 + (s.wave ? 0.6 : 0)) + heat * 0.18 + pulse * 0.08}
            color="#FF5A1F"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <points geometry={sparkGeo}>
          <pointsMaterial size={0.05} map={radialTex()} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} sizeAttenuation />
        </points>
      </group>
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

export const MuscleScene: React.FC<{ width: number; height: number; f: number; bundles: BundleState[]; shot: Shot }> = ({
  width,
  height,
  f,
  bundles,
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
    {bundles.map((b, i) => (
      <Bundle key={i} s={b} f={f} />
    ))}
  </ThreeCanvas>
);

// screen-space projection for 2D overlays (callouts, the dial-to-face morph)
export const project = (shot: Shot, p: [number, number, number], W: number, H: number) => {
  const cam = new THREE.PerspectiveCamera(shot.fov, W / H, 0.05, 60);
  cam.position.set(...shot.cam);
  cam.up.set(0, 1, 0);
  cam.lookAt(...shot.look);
  cam.rotateZ(shot.roll ?? 0);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};
