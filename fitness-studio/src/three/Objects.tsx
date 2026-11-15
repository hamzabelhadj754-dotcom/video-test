import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// rounded plate profile, lathed around Y
const plateGeo = (R: number, w: number, b: number) => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.001, -w / 2)];
  const seg = 10;
  for (let i = 0; i <= seg; i++) {
    const a = -Math.PI / 2 + (i / seg) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - b + Math.cos(a) * b, -w / 2 + b + Math.sin(a) * b));
  }
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - b + Math.cos(a) * b, w / 2 - b + Math.sin(a) * b));
  }
  pts.push(new THREE.Vector2(0.001, w / 2));
  return new THREE.LatheGeometry(pts, 64);
};

const shadowTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,0.55)");
    gr.addColorStop(0.5, "rgba(0,0,0,0.18)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(cv);
    return t;
  };
})();

export type Obj = {
  kind: "light" | "heavy";
  pos: [number, number, number];
  rot: [number, number, number];
  scale?: number;
  opacity?: number;
  shadowY?: number; // world y of the floor shadow
};

const Dumbbell: React.FC<{ o: Obj }> = ({ o }) => {
  const heavy = o.kind === "heavy";
  const mats = useMemo(() => {
    const rubber = new THREE.MeshPhysicalMaterial({
      color: heavy ? "#202024" : "#9E92FF",
      roughness: heavy ? 0.28 : 0.32,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: heavy ? 0.12 : 0.18,
      sheen: heavy ? 0 : 0.4,
      sheenColor: new THREE.Color("#ffffff"),
      transparent: true,
    });
    const chrome = new THREE.MeshPhysicalMaterial({ color: "#d9dade", metalness: 1, roughness: 0.16, transparent: true });
    return { rubber, chrome };
  }, [heavy]);
  mats.rubber.opacity = mats.chrome.opacity = o.opacity ?? 1;
  const geos = useMemo(() => {
    const plates = heavy
      ? [plateGeo(0.62, 0.15, 0.04), plateGeo(0.56, 0.15, 0.04), plateGeo(0.48, 0.13, 0.035)]
      : [plateGeo(0.38, 0.2, 0.08)];
    return { plates, collar: plateGeo(heavy ? 0.17 : 0.13, 0.09, 0.025) };
  }, [heavy]);
  const handleLen = heavy ? 0.78 : 0.62;
  const s = o.scale ?? 1;
  const platesX: number[] = [];
  let x = handleLen / 2 + 0.05;
  const widths = heavy ? [0.15, 0.15, 0.13] : [0.2];
  widths.forEach((w) => {
    platesX.push(x + w / 2);
    x += w + 0.012;
  });
  return (
    <group position={o.pos} rotation={o.rot} scale={s}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
        <cylinderGeometry args={[heavy ? 0.075 : 0.065, heavy ? 0.075 : 0.065, x * 2, 32]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh geometry={geos.collar} rotation={[0, 0, Math.PI / 2]} position={[side * (handleLen / 2), 0, 0]} material={mats.chrome} />
          {geos.plates.map((g, i) => (
            <mesh key={i} geometry={g} rotation={[0, 0, Math.PI / 2]} position={[side * platesX[i], 0, 0]} material={mats.rubber} />
          ))}
        </group>
      ))}
    </group>
  );
};

const Shadow: React.FC<{ o: Obj }> = ({ o }) => {
  if (o.shadowY === undefined) return null;
  const h = Math.max(0, o.pos[1] - o.shadowY);
  const s = (o.kind === "heavy" ? 2.4 : 1.7) * (o.scale ?? 1) * (1 + h * 0.25);
  return (
    <mesh position={[o.pos[0], o.shadowY, o.pos[2] - 0.5]} rotation={[-1.05, 0, 0]} scale={[s, s * 0.32, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={shadowTex()} transparent opacity={(o.opacity ?? 1) * Math.max(0.15, 0.85 - h * 0.35)} depthWrite={false} />
    </mesh>
  );
};

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  }, [gl, scene]);
  return null;
};

export const CAM = { pos: [0, 0.2, 9] as [number, number, number], fov: 32 };

const Cam: React.FC = () => {
  const { camera, size } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...CAM.pos);
  c.lookAt(0, 0, 0);
  c.fov = CAM.fov;
  c.aspect = size.width / size.height;
  c.updateProjectionMatrix();
  return null;
};

export const ObjectsScene: React.FC<{ width: number; height: number; objs: Obj[] }> = ({ width, height, objs }) => (
  <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} style={{ position: "absolute", inset: 0 }}>
    <Env />
    <Cam />
    <ambientLight intensity={0.25} />
    <directionalLight position={[-3, 5, 6]} intensity={1.6} />
    <directionalLight position={[4, 2, -3]} intensity={0.8} />
    {objs.map((o, i) => (
      <group key={i}>
        <Shadow o={o} />
        <Dumbbell o={o} />
      </group>
    ))}
  </ThreeCanvas>
);

export const projectStudio = (p: [number, number, number], W: number, H: number) => {
  const c = new THREE.PerspectiveCamera(CAM.fov, W / H, 0.1, 100);
  c.position.set(...CAM.pos);
  c.lookAt(0, 0, 0);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};
