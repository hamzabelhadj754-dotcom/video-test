import { ThreeCanvas } from "@remotion/three";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender, staticFile } from "remotion";

// ---------- studio: black room with long softbox strips, used for reflections only ----------
const studioEnv = (gl: THREE.WebGLRenderer) => {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color("#000000");
  const strip = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    sc.add(m);
  };
  strip(0.45, 9, [-5, 1, 2], [0, Math.PI / 2, 0], 9); // tall key strip, left
  strip(0.6, 9, [5, 1, -1], [0, -Math.PI / 2, 0], 3.5); // rim strip, right
  strip(5, 0.9, [0, 6, 0], [Math.PI / 2, 0, 0], 2.6); // overhead panel
  strip(0.4, 7, [-2, 0.5, -6], [0, 0, 0], 2.5); // back kicker
  const pm = new THREE.PMREMGenerator(gl);
  return pm.fromScene(sc, 0.02).texture;
};

// canvas textures (cached)
const cache: Record<string, THREE.Texture> = {};
const knurl = () => {
  if (cache.k) return cache.k;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#5a5a5a";
  g.lineWidth = 3;
  for (let i = -256; i < 512; i += 12) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke();
    g.beginPath(); g.moveTo(i, 256); g.lineTo(i + 256, 0); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2);
  cache.k = t;
  return t;
};
const shadowTex = () => {
  if (cache.s) return cache.s;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const g = cv.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,0.9)");
  gr.addColorStop(0.55, "rgba(0,0,0,0.35)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  cache.s = new THREE.CanvasTexture(cv);
  return cache.s;
};
// the monogram texture is loaded before any canvas mounts (see useBrandReady)
let logoTex: THREE.Texture | null = null;
const logo = () => logoTex!;
export const useBrandReady = () => {
  const [ready, setReady] = useState(!!logoTex);
  const [handle] = useState(() => (logoTex ? null : delayRender("brand texture")));
  useEffect(() => {
    if (logoTex) return;
    const img = new Image();
    img.src = staticFile("brand/gd_letters.png");
    img
      .decode()
      .then(() => {
        const t = new THREE.Texture(img);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.needsUpdate = true;
        logoTex = t;
        setReady(true);
        if (handle !== null) continueRender(handle);
      })
      .catch(() => handle !== null && continueRender(handle));
  }, [handle]);
  return ready;
};

// big type rendered into the 3D space (it gets depth of field and parallax like a real object)
const typeTex = (text: string, color: string, outline: boolean) => {
  const key = `${text}|${color}|${outline}`;
  if (cache[key]) return cache[key];
  const cv = document.createElement("canvas");
  cv.width = 2048;
  cv.height = 512;
  const g = cv.getContext("2d")!;
  (g as unknown as { fontStretch: string }).fontStretch = "condensed";
  g.font = "900 400px Archivo";
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (outline) {
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeText(text, 1024, 270);
  } else {
    g.fillStyle = color;
    g.fillText(text, 1024, 270);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache[key] = t;
  return t;
};

export type HexDB = {
  pos: [number, number, number];
  rot: [number, number, number];
  scale?: number;
  tone: "black" | "white";
};

const hexShape = (r: number) => {
  const s = new THREE.Shape();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (k === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
};

const HexDumbbell: React.FC<{ d: HexDB }> = ({ d }) => {
  const black = d.tone === "black";
  const g = useMemo(() => {
    const head = new THREE.ExtrudeGeometry(hexShape(0.5), { depth: 0.46, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 });
    head.translate(0, 0, -0.23);
    return { head };
  }, []);
  const mats = useMemo(
    () => ({
      rubber: new THREE.MeshPhysicalMaterial({ color: black ? "#0a0a0b" : "#e8e8ea", roughness: black ? 0.5 : 0.36, clearcoat: black ? 0.35 : 0.7, clearcoatRoughness: 0.3, envMapIntensity: black ? 0.45 : 0.9 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: "#e6e8ec", metalness: 1, roughness: 0.1, envMapIntensity: 1.6 }),
      steel: new THREE.MeshPhysicalMaterial({ color: "#b8bcc4", metalness: 1, roughness: 0.32, bumpMap: knurl(), bumpScale: 2.5 }),
      decal: new THREE.MeshStandardMaterial({ map: logo(), transparent: true, roughness: 0.25, metalness: 0.1, color: black ? "#ffffff" : "#111113", emissive: black ? new THREE.Color("#9a9a9a") : new THREE.Color("#000000"), emissiveMap: logo(), polygonOffset: true, polygonOffsetFactor: -2 }),
    }),
    [black],
  );
  const s = d.scale ?? 1;
  const headX = 0.62;
  return (
    <group position={d.pos} rotation={d.rot} scale={s}>
      {/* handle */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={mats.steel}>
        <cylinderGeometry args={[0.085, 0.085, 0.86, 40]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * headX, 0, 0]}>
          <mesh rotation={[0, (side * Math.PI) / 2, 0]} geometry={g.head} material={mats.rubber} />
          <mesh position={[-side * 0.27, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
            <cylinderGeometry args={[0.13, 0.13, 0.07, 40]} />
          </mesh>
          {/* the GD monogram on each outer face */}
          <mesh position={[side * 0.285, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]} material={mats.decal}>
            <planeGeometry args={[0.52, 0.53]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export type TypePlane = { text: string; pos: [number, number, number]; h: number; color?: string; outline?: boolean; opacity?: number };

const TypeMesh: React.FC<{ t: TypePlane }> = ({ t }) => {
  const tex = typeTex(t.text, t.color ?? "#ffffff", !!t.outline);
  return (
    <mesh position={t.pos}>
      <planeGeometry args={[t.h * 4, t.h]} />
      <meshBasicMaterial map={tex} transparent opacity={t.opacity ?? 1} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export type Shot = { cam: [number, number, number]; look: [number, number, number]; fov: number; roll?: number; focus: number; aperture?: number };

const Rig: React.FC<{ shot: Shot }> = ({ shot }) => {
  const { camera, size, gl, scene } = useThree();
  useMemo(() => {
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.15;
  }, [gl, scene]);
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...shot.cam);
  c.lookAt(...shot.look);
  c.rotateZ(shot.roll ?? 0);
  c.fov = shot.fov;
  c.aspect = size.width / size.height;
  c.near = 0.1;
  c.far = 60;
  c.updateProjectionMatrix();
  return null;
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.03} />
    <spotLight position={[0, 9, 2]} angle={0.36} penumbra={0.9} intensity={34} distance={20} decay={1.6} color="#ffffff" />
    <directionalLight position={[-5, 3, 4]} intensity={0.35} />
    <directionalLight position={[4, 2.5, -4]} intensity={2.4} />
    <directionalLight position={[-4, 1, -3]} intensity={1.2} />
  </>
);

// background layer: floor, contact shadows, type standing in the room
export const BackScene: React.FC<{ width: number; height: number; shot: Shot; dbs: HexDB[]; type: TypePlane[] }> = ({ width, height, shot, dbs, type }) => (
  <ThreeCanvas width={width} height={height} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} style={{ position: "absolute", inset: 0 }}>
    <color attach="background" args={["#060607"]} />
    <fog attach="fog" args={["#060607", 8, 20]} />
    <Rig shot={shot} />
    <Lights />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshPhysicalMaterial color="#101012" roughness={0.36} metalness={0.3} clearcoat={0.5} clearcoatRoughness={0.35} />
    </mesh>
    {type.map((t, i) => (
      <TypeMesh key={i} t={t} />
    ))}
    {dbs.map((d, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[d.pos[0], -1.19, d.pos[2]]} scale={[2.4 * (d.scale ?? 1), 1.2 * (d.scale ?? 1), 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex()} transparent depthWrite={false} opacity={Math.max(0.2, 1 - (d.pos[1] + 1.2) * 0.35)} />
      </mesh>
    ))}
  </ThreeCanvas>
);

// hero layer: the dumbbells only, on transparent background
export const FrontScene: React.FC<{ width: number; height: number; shot: Shot; dbs: HexDB[]; style?: React.CSSProperties }> = ({ width, height, shot, dbs, style }) => (
  <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }} style={{ position: "absolute", inset: 0, ...style }}>
    <Rig shot={shot} />
    <Lights />
    {dbs.map((d, i) => (
      <HexDumbbell key={i} d={d} />
    ))}
  </ThreeCanvas>
);

// projection helper for 2D overlays
export const projectHero = (shot: Shot, p: [number, number, number], W: number, H: number) => {
  const c = new THREE.PerspectiveCamera(shot.fov, W / H, 0.1, 60);
  c.position.set(...shot.cam);
  c.lookAt(...shot.look);
  c.rotateZ(shot.roll ?? 0);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};
