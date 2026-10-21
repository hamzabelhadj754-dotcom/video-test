// HIDRA 3D kit: studio lighting, the HIDRA smart bottle, and clay-style icons.
// Shared by the live Three.js scenes and scripts/render-stills.mjs (PNG stills).
// Deterministic: no clocks, no randomness; every look is a function of its inputs.
import * as THREE from "../../vendor/three/three.module.js";
import { RoomEnvironment } from "../../vendor/three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../../vendor/three/addons/geometries/RoundedBoxGeometry.js";

export { THREE };

export const PALETTE = {
  cobalt: 0x2447e6,
  cobaltDeep: 0x1b27a8,
  orange: 0xff8a1f,
  lime: 0xb9e34c,
  white: 0xf3f3f6,
  graphite: 0x24262e,
  steel: 0xc9ccd3,
  red: 0xe5322d,
  kraft: 0xd59a5c,
  ice: 0xbfe3ff,
};

export function makeRenderer(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

// Softbox studio: dimmed room fill plus two tall emissive strips for long specular highlights.
export function makeStudio(renderer, scene, { keyDeg = -38, rimDeg = 125, warm = false } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  const room = new RoomEnvironment();
  room.traverse((o) => {
    if (o.isLight) o.intensity *= 0.35;
    if (o.material && o.material.emissiveIntensity) o.material.emissiveIntensity *= 0.35;
  });
  studio.add(room);
  for (const [deg, intensity] of [
    [keyDeg, 6],
    [rimDeg, 9],
  ]) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 9),
      new THREE.MeshLambertMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveIntensity: intensity,
        side: THREE.DoubleSide,
      }),
    );
    const a = THREE.MathUtils.degToRad(deg);
    strip.position.set(6 * Math.sin(a), 1.2, 6 * Math.cos(a));
    strip.lookAt(0, 1.2, 0);
    studio.add(strip);
  }
  scene.environment = pmrem.fromScene(studio, 0.025).texture;

  const key = new THREE.DirectionalLight(warm ? 0xfff2e2 : 0xffffff, 1.7);
  key.position.set(-3.5, 5.5, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8f0ff, 2.0);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x30323a, 0.35));
}

function clay(color, { rough = 0.38, coat = 0.55, metal = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: metal,
    clearcoat: coat,
    clearcoatRoughness: 0.28,
  });
}

function metal(color = PALETTE.steel, rough = 0.26) {
  return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough });
}

function lathe(points, segments = 128) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

// ---------------------------------------------------------------------------
// The HIDRA smart bottle. Origin at the base centre; total height ~3.25 units.
// ---------------------------------------------------------------------------

function wordmarkTexture() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  // Wordmark runs vertically (bottom to top) on the front face, as printed on sport bottles.
  g.save();
  g.translate(1024 + 40, 960);
  g.rotate(-Math.PI / 2);
  g.fillStyle = "rgba(246,247,250,0.96)";
  g.textBaseline = "middle";
  g.font = '400 210px "Hidra Display", "Archivo Black", sans-serif';
  g.fillText("HIDRA", 0, 0);
  g.font = '700 46px "Hidra Sans", Montserrat, sans-serif';
  g.fillStyle = "rgba(246,247,250,0.7)";
  g.fillText("SMART BOTTLE  ·  750 ML", 8, 150);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createBottle({ bodyColor = PALETTE.cobalt } = {}) {
  const group = new THREE.Group();

  // Powder-coated double-wall body with a soft shoulder.
  const body = new THREE.Mesh(
    lathe([
      [0.0, 0.17],
      [0.44, 0.17],
      [0.5, 0.2],
      [0.515, 0.28],
      [0.515, 2.22],
      [0.505, 2.34],
      [0.47, 2.46],
      [0.41, 2.55],
      [0.375, 2.6],
      [0.375, 2.66],
      [0.0, 2.66],
    ]),
    new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      roughness: 0.42,
      metalness: 0.12,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
    }),
  );
  group.add(body);

  // Printed wordmark: a transparent sleeve hugging the body.
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5175, 0.5175, 1.9, 128, 1, true),
    new THREE.MeshPhysicalMaterial({
      map: wordmarkTexture(),
      transparent: true,
      roughness: 0.5,
      clearcoat: 0.7,
      depthWrite: false,
    }),
  );
  sleeve.position.y = 1.28;
  sleeve.rotation.y = Math.PI;
  group.add(sleeve);

  // Sensor base: graphite ring with a thin glowing seam.
  const base = new THREE.Mesh(
    lathe([
      [0.0, 0.0],
      [0.47, 0.0],
      [0.515, 0.03],
      [0.522, 0.1],
      [0.52, 0.2],
      [0.0, 0.2],
    ]),
    clay(PALETTE.graphite, { rough: 0.32, coat: 0.4, metal: 0.4 }),
  );
  group.add(base);
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x0b1020,
    emissive: 0x9fd8ff,
    emissiveIntensity: 0.0,
  });
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.521, 0.008, 8, 128), seamMat);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = 0.205;
  group.add(seam);

  // Steel neck band.
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.392, 0.392, 0.12, 128, 1, false),
    metal(PALETTE.steel, 0.2),
  );
  band.position.y = 2.66;
  group.add(band);

  // Matte cap with a carry loop.
  const capMat = clay(0x15161b, { rough: 0.55, coat: 0.25 });
  const cap = new THREE.Mesh(
    lathe([
      [0.0, 2.72],
      [0.4, 2.72],
      [0.41, 2.76],
      [0.41, 3.04],
      [0.395, 3.1],
      [0.36, 3.13],
      [0.0, 3.13],
    ]),
    capMat,
  );
  group.add(cap);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 24, 64, Math.PI), capMat);
  loop.position.set(0, 3.12, 0);
  group.add(loop);

  // LED reminder ring on the cap top.
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0d1424,
    emissive: 0x9fd8ff,
    emissiveIntensity: 0.0,
    roughness: 0.3,
  });
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.022, 16, 128), ledMat);
  led.rotation.x = Math.PI / 2;
  led.position.y = 3.135;
  group.add(led);
  // LED ring around the cap's lower edge, visible from the side.
  const led2 = new THREE.Mesh(new THREE.TorusGeometry(0.412, 0.012, 12, 128), ledMat);
  led2.rotation.x = Math.PI / 2;
  led2.position.y = 2.78;
  group.add(led2);

  return {
    group,
    height: 3.3,
    setLed(level) {
      ledMat.emissiveIntensity = 0.05 + level * 1.7;
      seamMat.emissiveIntensity = level * 1.4;
    },
  };
}

// ---------------------------------------------------------------------------
// Clay icons. Each returns a Group roughly 2 units across, centred at origin.
// ---------------------------------------------------------------------------

function petBottle() {
  const g = new THREE.Group();
  const pet = new THREE.MeshPhysicalMaterial({
    color: 0xcfe6ff,
    emissive: 0x1c3350,
    emissiveIntensity: 0.6,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.62,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pts = [[0, 0.02], [0.32, 0.0], [0.36, 0.06], [0.36, 0.3], [0.33, 0.36], [0.36, 0.42]];
  for (let i = 0; i < 5; i++) {
    const y = 0.5 + i * 0.22;
    pts.push([0.36, y], [0.335, y + 0.08], [0.36, y + 0.16]);
  }
  pts.push([0.36, 1.66], [0.3, 1.86], [0.16, 2.02], [0.13, 2.08], [0.13, 2.16]);
  g.add(new THREE.Mesh(lathe(pts, 96), pet));
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.364, 0.364, 0.42, 96, 1, true),
    clay(PALETTE.cobalt, { rough: 0.3, coat: 0.6 }),
  );
  label.position.y = 1.08;
  g.add(label);
  const capM = clay(0x3a7bff, { rough: 0.3 });
  const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 48), capM);
  capMesh.position.y = 2.22;
  g.add(capMesh);
  g.position.y = -1.1;
  const w = new THREE.Group();
  w.add(g);
  return w;
}

function droplet() {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const a = t * Math.PI;
    // Teardrop: round bottom, pinched tip.
    const r = Math.sin(a) * (1 - t) ** 0.9 * 1.05;
    const y = -Math.cos(a) * 0.95 + t * t * 0.9;
    pts.push([Math.max(0, r), y]);
  }
  const m = new THREE.Mesh(
    lathe(pts, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x2f6bff,
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      transparent: true,
      opacity: 0.9,
    }),
  );
  const g = new THREE.Group();
  m.position.y = -0.35;
  g.add(m);
  return g;
}

function gradCap() {
  const g = new THREE.Group();
  const dark = clay(0x1d2030, { rough: 0.45 });
  const board = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.1, 2.0, 4, 0.04), dark);
  board.rotation.y = Math.PI / 4;
  board.position.y = 0.35;
  g.add(board);
  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.55, 64), dark);
  skull.position.y = 0.05;
  g.add(skull);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), clay(PALETTE.orange));
  button.position.y = 0.43;
  g.add(button);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 12), clay(PALETTE.orange));
  cord.rotation.z = Math.PI / 2;
  cord.rotation.y = Math.PI / 4;
  cord.position.set(0.35, 0.42, 0.35);
  g.add(cord);
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.5, 24), clay(PALETTE.orange));
  tassel.position.set(0.7, 0.12, 0.7);
  g.add(tassel);
  return g;
}

function dumbbell() {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 32), metal(PALETTE.steel, 0.22));
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 32), clay(PALETTE.graphite, { rough: 0.7, coat: 0.1 }));
  grip.rotation.z = Math.PI / 2;
  g.add(grip);
  for (const s of [-1, 1]) {
    for (const [x, r, w, c] of [
      [0.62, 0.62, 0.2, PALETTE.cobalt],
      [0.84, 0.5, 0.18, PALETTE.cobalt],
      [1.02, 0.36, 0.14, PALETTE.lime],
    ]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 64), clay(c));
      plate.rotation.z = Math.PI / 2;
      plate.position.x = s * x;
      g.add(plate);
    }
  }
  return g;
}

function briefcase() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.4, 0.7, 6, 0.16), clay(PALETTE.orange));
  g.add(body);
  const flap = new THREE.Mesh(new RoundedBoxGeometry(2.04, 0.08, 0.74, 3, 0.03), clay(0xe0731a));
  flap.position.y = 0.18;
  g.add(flap);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 16, 48, Math.PI), clay(PALETTE.graphite));
  handle.position.y = 0.7;
  g.add(handle);
  for (const s of [-1, 1]) {
    const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.2, 0.08, 2, 0.03), metal(0xf0d48a, 0.3));
    clasp.position.set(s * 0.55, 0.18, 0.37);
    g.add(clasp);
  }
  return g;
}

function factory() {
  const g = new THREE.Group();
  const wall = clay(PALETTE.white, { rough: 0.5 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.9, 1.2, 4, 0.06), wall);
  base.position.y = -0.3;
  g.add(base);
  const roofM = clay(PALETTE.cobalt);
  roofM.side = THREE.DoubleSide;
  for (let i = 0; i < 3; i++) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.72, 0);
    shape.lineTo(0.72, 0.45);
    shape.closePath();
    const roof = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }),
      roofM,
    );
    roof.position.set(-1.1 + i * 0.73, 0.15, -0.6);
    g.add(roof);
  }
  for (const [x, h] of [[0.65, 1.3], [0.95, 1.0]]) {
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, h, 32), clay(PALETTE.graphite));
    ch.position.set(x, 0.15 + h / 2, -0.25);
    g.add(ch);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 32), clay(PALETTE.orange));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.15 + h - 0.12, -0.25);
    g.add(ring);
  }
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.5, 0.06, 2, 0.02), clay(PALETTE.graphite));
  door.position.set(-0.55, -0.5, 0.61);
  g.add(door);
  for (const x of [0.1, 0.55]) {
    const win = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.22, 0.05, 2, 0.02), clay(PALETTE.lime));
    win.position.set(x, -0.35, 0.61);
    g.add(win);
  }
  g.position.y = -0.1;
  return g;
}

function parcel() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.25, 1.6, 5, 0.08), clay(PALETTE.kraft, { rough: 0.6, coat: 0.15 }));
  g.add(box);
  const tape = new THREE.Mesh(new RoundedBoxGeometry(0.34, 1.27, 1.62, 2, 0.02), clay(PALETTE.cobalt, { rough: 0.35 }));
  g.add(tape);
  const label = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.36, 0.03, 2, 0.02), clay(PALETTE.white));
  label.position.set(0.48, -0.2, 0.81);
  g.add(label);
  return g;
}

function globe() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 64, 48), clay(PALETTE.cobalt, { rough: 0.3, coat: 0.7 })));
  const lineM = clay(PALETTE.white, { rough: 0.4 });
  for (const lat of [-0.5, 0, 0.5]) {
    const r = Math.cos(lat) * 0.955;
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 96), lineM);
    t.rotation.x = Math.PI / 2;
    t.position.y = Math.sin(lat) * 0.955;
    g.add(t);
  }
  for (const lon of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.018, 8, 96), lineM);
    t.rotation.y = lon;
    g.add(t);
  }
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.035, 12, 128), clay(PALETTE.orange));
  orbit.rotation.set(Math.PI / 2.4, 0.3, 0);
  g.add(orbit);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 24), clay(PALETTE.lime));
  moon.position.set(1.3, 0.28, 0.25);
  g.add(moon);
  return g;
}

function store() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.2, 1.1, 4, 0.06), clay(PALETTE.white, { rough: 0.5 }));
  body.position.y = -0.35;
  g.add(body);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(2.15, 0.16, 1.22, 3, 0.04), clay(PALETTE.graphite));
  roof.position.y = 0.33;
  g.add(roof);
  // Striped awning, slanted forward.
  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new RoundedBoxGeometry(0.34, 0.06, 0.55, 2, 0.02),
      clay(i % 2 ? PALETTE.white : PALETTE.orange),
    );
    stripe.position.set(-0.85 + i * 0.34, 0.12, 0.72);
    stripe.rotation.x = 0.42;
    g.add(stripe);
  }
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.7, 0.05, 2, 0.02), clay(PALETTE.cobalt));
  door.position.set(0.45, -0.6, 0.56);
  g.add(door);
  const win = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.45, 0.05, 2, 0.02), clay(0x9fd8ff, { rough: 0.15, coat: 1 }));
  win.position.set(-0.4, -0.45, 0.56);
  g.add(win);
  return g;
}

function person() {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 32), clay(PALETTE.white, { rough: 0.45 }));
  head.position.y = 0.6;
  g.add(head);
  const bodyM = clay(PALETTE.lime);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.5, 8, 32), bodyM);
  torso.position.y = -0.55;
  torso.scale.set(1, 1, 0.75);
  g.add(torso);
  return g;
}

function heart() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.15, -0.75, -1.0, -0.2, -1.0, 0.25);
  s.bezierCurveTo(-1.0, 0.7, -0.6, 0.95, -0.32, 0.95);
  s.bezierCurveTo(-0.12, 0.95, 0.0, 0.8, 0.0, 0.66);
  s.bezierCurveTo(0.0, 0.8, 0.12, 0.95, 0.32, 0.95);
  s.bezierCurveTo(0.6, 0.95, 1.0, 0.7, 1.0, 0.25);
  s.bezierCurveTo(1.0, -0.2, 0.15, -0.75, 0, -0.9);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.16,
    bevelSegments: 10,
    curveSegments: 48,
  });
  geo.center();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, clay(0xff4d5e, { rough: 0.25, coat: 0.9 })));
  return g;
}

function megaphone() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.28, 1.5, 64, 1, true), clay(PALETTE.cobalt));
  cone.material.side = THREE.DoubleSide;
  cone.rotation.z = -Math.PI / 2;
  cone.position.x = 0.35;
  g.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 16, 64), clay(PALETTE.white));
  rim.rotation.y = Math.PI / 2;
  rim.position.x = 1.1;
  g.add(rim);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.35, 48), clay(PALETTE.white));
  back.rotation.z = Math.PI / 2;
  back.position.x = -0.55;
  g.add(back);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.65, 0.24, 3, 0.08), clay(PALETTE.graphite));
  handle.position.set(-0.15, -0.5, 0);
  handle.rotation.z = 0.15;
  g.add(handle);
  return g;
}

function target() {
  const g = new THREE.Group();
  const colors = [PALETTE.red, PALETTE.white, PALETTE.red, PALETTE.white, PALETTE.red];
  colors.forEach((c, i) => {
    const r = 1.0 - i * 0.2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.16 + i * 0.03, 96), clay(c, { rough: 0.35 }));
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
  });
  const dart = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 16), clay(PALETTE.graphite));
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.55;
  dart.add(shaft);
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.28, 0.32, 1, 0.01), clay(PALETTE.lime));
    fin.position.z = 1.0;
    fin.rotation.z = (i * Math.PI * 2) / 3;
    fin.translateY(0.12);
    dart.add(fin);
  }
  dart.rotation.set(-0.35, 0.45, 0);
  dart.position.set(0.05, 0.05, 0.12);
  g.add(dart);
  return g;
}

function priceTag() {
  const s = new THREE.Shape();
  s.moveTo(-0.9, -0.55);
  s.lineTo(0.55, -0.55);
  s.lineTo(1.0, 0);
  s.lineTo(0.55, 0.55);
  s.lineTo(-0.9, 0.55);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0.6, 0, 0.11, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 6,
    curveSegments: 32,
  });
  geo.center();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, clay(PALETTE.orange, { rough: 0.3, coat: 0.8 })));
  return g;
}

function iceCube() {
  const g = new THREE.Group();
  const cube = new THREE.Mesh(
    new RoundedBoxGeometry(1.3, 1.3, 1.3, 6, 0.22),
    new THREE.MeshPhysicalMaterial({
      color: PALETTE.ice,
      roughness: 0.12,
      clearcoat: 1,
      transparent: true,
      opacity: 0.75,
    }),
  );
  cube.rotation.set(0.35, 0.6, 0.1);
  g.add(cube);
  return g;
}

const ICONS = {
  pet: petBottle,
  drop: droplet,
  gradcap: gradCap,
  dumbbell,
  briefcase,
  factory,
  parcel,
  globe,
  store,
  person,
  heart,
  megaphone,
  target,
  tag: priceTag,
  ice: iceCube,
};

export const ICON_NAMES = Object.keys(ICONS);

export function createIcon(name) {
  const make = ICONS[name];
  if (!make) throw new Error(`unknown icon ${name}`);
  return make();
}
