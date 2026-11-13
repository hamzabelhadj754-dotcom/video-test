// Stylised 3D AirPods Pro + case (own model from the public design; spec work only).
// Every transform is a pure function of t.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1350, FOV = 28, CZ = 5;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = p => 1 - Math.pow(1 - p, 4), eIn = p => p * p * p, eInOut = p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2;
const lerp = (a, b, p) => a + (b - a) * p;
const backOut = (p, c = 1.4) => 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);

let R, scene, cam, buds, budL, budR, ring, kase, lid, key, rim, warm;

function gloss() { return new THREE.MeshPhysicalMaterial({ color: 0xF4F4F2, roughness: .22, metalness: 0, clearcoat: 1, clearcoatRoughness: .06, sheen: .2 }); }
function dark(c = 0x2A2A2C, r = .6) { return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: .2 }); }

function makeBud() {
  const g = new THREE.Group(), m = gloss();
  // head: soft ovoid
  const head = new THREE.Mesh(new THREE.SphereGeometry(.12, 96, 64), m); head.scale.set(1.05, .9, .92); g.add(head);
  // silicone ear tip (lathe), pointing inward (-x), slightly forward
  const prof = []; for (let i = 0; i <= 24; i++) { const a = i / 24; prof.push(new THREE.Vector2(.082 * Math.sin(Math.PI * .5 + a * Math.PI * .5) * (1 - a * .15) + .0005, a * .085)); }
  prof.unshift(new THREE.Vector2(.07, -.01));
  const tip = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshPhysicalMaterial({ color: 0xE6E6E4, roughness: .62, sheen: .6, sheenRoughness: .5 }));
  tip.rotation.z = Math.PI / 2; tip.rotation.y = -.35; tip.position.set(-.1, .012, .03); g.add(tip);
  // stem: flattened capsule, slightly raked
  const stem = new THREE.Mesh(new THREE.CapsuleGeometry(.034, .27, 12, 48), m);
  stem.scale.set(1, 1, .78); stem.position.set(.035, -.215, -.005); stem.rotation.z = .13; g.add(stem);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.03, .032, .012, 48), dark(0x9A9A9E, .3));
  cap.scale.set(1, 1, .78); cap.position.set(.054, -.375, -.005); cap.rotation.z = .13; g.add(cap);
  // grilles: small dark ovals on head and stem top
  const gr1 = new THREE.Mesh(new THREE.CircleGeometry(.022, 32), dark(0x1E1E20, .9)); gr1.scale.set(1.5, .7, 1); gr1.position.set(.03, .072, .085); gr1.rotation.x = -.7; g.add(gr1);
  const gr2 = new THREE.Mesh(new THREE.CircleGeometry(.012, 32), dark(0x1E1E20, .9)); gr2.scale.set(1, 1.8, 1); gr2.position.set(.056, -.12, .028); g.add(gr2);
  g.userData.stem = stem;
  return g;
}

function trayTexture() {
  const c = document.createElement('canvas'); c.width = 620; c.height = 220; const x = c.getContext('2d');
  x.fillStyle = '#F2F2F0'; x.fillRect(0, 0, 620, 220);
  x.fillStyle = '#2B2B2D'; [[200, 110], [420, 110]].forEach(([cx, cy]) => { x.beginPath(); x.ellipse(cx, cy, 70, 52, 0, 0, 7); x.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeCase() {
  const g = new THREE.Group(), m = gloss();
  const base = new THREE.Mesh(new RoundedBoxGeometry(.64, .34, .23, 8, .095), m); base.position.y = -.075; g.add(base);
  const tray = new THREE.Mesh(new THREE.PlaneGeometry(.58, .19), new THREE.MeshStandardMaterial({ map: trayTexture(), roughness: .5 }));
  tray.rotation.x = -Math.PI / 2; tray.position.y = .093; g.add(tray);
  const led = new THREE.Mesh(new THREE.CircleGeometry(.007, 24), new THREE.MeshBasicMaterial({ color: 0x9BE38A })); led.position.set(0, -.02, .116); g.add(led);
  const hinge = new THREE.Group(); hinge.position.set(0, .095, -.112); g.add(hinge);
  const lidM = new THREE.Mesh(new RoundedBoxGeometry(.64, .13, .23, 8, .06), m); lidM.position.set(0, .066, .112); hinge.add(lidM);
  g.userData = { hinge, led };
  return g;
}

export function init(canvas) {
  R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.03).texture; scene.environmentIntensity = .75;
  cam = new THREE.PerspectiveCamera(FOV, W / H, .05, 50); cam.position.set(0, 0, CZ);
  key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 3, 3); scene.add(key);
  rim = new THREE.DirectionalLight(0xbfd8ff, 2.6); rim.position.set(3, 1, -2.5); scene.add(rim);
  warm = new THREE.DirectionalLight(0xffe2c4, .9); warm.position.set(-3, -1.5, 1); scene.add(warm);
  budL = makeBud(); budR = makeBud(); budR.rotation.y = Math.PI;
  const wl = new THREE.Group(); wl.add(budL); const wr = new THREE.Group(); wr.add(budR);
  buds = { wl, wr }; scene.add(wl, wr);
  ring = new THREE.Mesh(new THREE.TorusGeometry(.05, .004, 16, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }));
  scene.add(ring);
  kase = makeCase(); scene.add(kase);
}

const yOf = px => (H / 2 - px) * (2 * CZ * Math.tan(FOV / 2 * Math.PI / 180) / H);

export function render3d(t) {
  if (t < 3.25) { R.clear(); return; }
  const S = 1.55;                                   // overall product scale
  // ---- buds: drop into the chaos, get pressed, float as heroes, then glide into the case ----
  const drop = eOut(prog(t, 3.3, 4.0)), into = eInOut(prog(t, 10.2, 11.2));
  const spin = (t - 3.3) * .32;
  const hover = Math.sin(t * 1.1) * .02;
  const caseIn = eOut(prog(t, 8.7, 9.7)), lidOpen = eInOut(prog(t, 9.6, 10.35));
  const caseY = lerp(-2.2, -.42, caseIn);
  [[buds.wl, -1, 0], [buds.wr, 1, 1.3]].forEach(([g, side, ph]) => {
    const fx = side * .3, fy = yOf(600) + hover + Math.sin(t * .9 + ph) * .015;
    const sx = lerp(side * .9, fx, drop), sy = lerp(2.2 + ph * .2, fy, drop);
    // target inside the case cavities
    const cx = side * .113 * S, cy = caseY + .14 * S, cz = .0;
    g.position.set(lerp(sx, cx, into), lerp(sy, cy, into) + Math.sin(into * Math.PI) * .25, lerp(.2, cz, into));
    g.rotation.set(lerp(-.15 + (1 - drop) * 2.4 * side, -.05, into), lerp(spin * (side < 0 ? 1 : -1) + side * .55, side < 0 ? .5 : -.5, into), lerp(side * .1 + (1 - drop) * 1.2, side * -.05, into));
    g.scale.setScalar(S * lerp(1, .78, into));
    g.visible = t >= 3.3;
  });
  // ---- the press: a ring of light around the right stem ----
  const pr = prog(t, 4.0, 4.7);
  ring.visible = pr > 0 && pr < 1;
  if (ring.visible) {
    buds.wr.updateMatrixWorld(true);
    const p = new THREE.Vector3(.04, -.2, 0); budR.localToWorld(p);
    ring.position.copy(p); ring.lookAt(cam.position);
    ring.scale.setScalar(1 + eOut(pr) * 7); ring.material.opacity = (1 - pr) * .9;
  }
  const squeeze = t > 3.98 && t < 4.2 ? Math.sin(prog(t, 3.98, 4.2) * Math.PI) : 0;
  budR.userData.stem.scale.set(1 - squeeze * .12, 1, .78 - squeeze * .1);
  // ---- case ----
  kase.visible = t > 8.7;
  kase.position.set(0, caseY, 0);
  const caseSpin = lerp(-.55, .2, eInOut(prog(t, 9.0, 15)));
  kase.rotation.set(lerp(.5, .32, caseIn), caseSpin, 0);
  kase.scale.setScalar(S);
  kase.userData.hinge.rotation.x = -1.95 * lidOpen;
  // buds ride along with the case once they're in
  if (into >= 1) {
    [[buds.wl, -1], [buds.wr, 1]].forEach(([g, side]) => {
      const local = new THREE.Vector3(side * .113, .14, 0).applyEuler(kase.rotation).multiplyScalar(S);
      g.position.set(local.x, caseY + local.y, local.z);
      g.rotation.set(kase.rotation.x - .05, caseSpin + (side < 0 ? .5 : -.5), side * -.05);
    });
  }
  // ---- light: a slow sweep across the gloss ----
  key.position.set(lerp(-3, 2.5, prog(t, 3.3, 15)), 3, 3);
  rim.intensity = 2.6 + Math.sin(t * .5) * .4;
  cam.position.set(0, 0, CZ - eInOut(prog(t, 4.4, 9)) * .35 + eInOut(prog(t, 9, 11)) * .35);
  cam.lookAt(0, 0, 0);
  R.render(scene, cam);
}
