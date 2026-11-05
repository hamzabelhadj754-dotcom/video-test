// "The Fold" — a paper world that folds until two lights meet.
// Every frame is a pure function of t (seconds). No clocks, no unseeded randomness.
import * as THREE from "three";
import { EffectComposer } from "./lib/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./lib/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./lib/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "./lib/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "./lib/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "./lib/jsm/postprocessing/OutputPass.js";
import { SVGLoader } from "./lib/jsm/loaders/SVGLoader.js";

const W = 1080, H = 1920;
const host = window.__fold;

// ───────────────────────── palette ─────────────────────────
const C = {
  ink: new THREE.Color("#0e141b"),
  paper: new THREE.Color("#f3eee4"),
  vellum: new THREE.Color("#d9dcd9"),
  orange: new THREE.Color("#ff9900"),
};

// ───────────────────────── helpers ─────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
function fbm(x, z, seed, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f, seed + i * 17); f *= 2.03; a *= 0.5; }
  return s;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOutExpo = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));

// ───────────────────────── the smile, read from the official mark ─────────────────────────
const svgText = await (await fetch("assets/images/amazon-logo.svg")).text();
const svgData = new SVGLoader().parse(svgText);
const smilePath = svgData.paths.find((p) => p.userData?.node?.id === "path8");
const arrowPath = svgData.paths.find((p) => p.userData?.node?.id === "path10");
const smileShapes = SVGLoader.createShapes(smilePath);
const arrowShapes = SVGLoader.createShapes(arrowPath);

// centre line and thickness of the smile per svg-x
const SM_X0 = 84, SM_X1 = 380;
const bins = new Map();
for (const sh of smileShapes) {
  for (const p of sh.getSpacedPoints(1600)) {
    const k = Math.round(p.x);
    const b = bins.get(k) || { lo: Infinity, hi: -Infinity };
    b.lo = Math.min(b.lo, p.y); b.hi = Math.max(b.hi, p.y);
    bins.set(k, b);
  }
}
const centre = [], thick = [];
for (let x = SM_X0; x <= SM_X1; x++) {
  const b = bins.get(x);
  centre.push(b ? (b.lo + b.hi) / 2 : NaN); thick.push(b ? b.hi - b.lo : NaN);
}
for (let i = 0; i < centre.length; i++) { // fill holes
  if (!Number.isNaN(centre[i])) continue;
  let j = i; while (j < centre.length && Number.isNaN(centre[j])) j++;
  const a = i > 0 ? centre[i - 1] : centre[j], b2 = j < centre.length ? centre[j] : centre[i - 1];
  const ta = i > 0 ? thick[i - 1] : thick[j], tb = j < centre.length ? thick[j] : thick[i - 1];
  for (let k = i; k < j; k++) { const f = (k - i + 1) / (j - i + 1); centre[k] = lerp(a, b2, f); thick[k] = lerp(ta, tb, f); }
}
// smooth the centre line
const cs = centre.map((_, i) => { let s = 0, n = 0; for (let k = -6; k <= 6; k++) { const v = centre[i + k]; if (v !== undefined) { s += v; n++; } } return s / n; });
// ends are thin and noisy: take slopes a little way in
const slopeL = (cs[22] - cs[2]) / 20, slopeR = (cs[cs.length - 3] - cs[cs.length - 23]) / 20;
function smileCentre(sx) {
  if (sx < SM_X0 + 2) return cs[2] + (sx - (SM_X0 + 2)) * slopeL;
  if (sx > SM_X1 - 2) return cs[cs.length - 3] + (sx - (SM_X1 - 2)) * slopeR;
  const f = sx - SM_X0, i = Math.floor(f), fr = f - i;
  return lerp(cs[i], cs[Math.min(i + 1, cs.length - 1)], fr);
}

// ───────────────────────── world layout ─────────────────────────
const R = 3.5;                 // bend radius of the fold
const K = 0.075;               // world units per svg unit
const SX0 = 285;               // svg-x that maps to world x = 0 (where the lights meet)
const SY0 = smileCentre(SX0);
const Z_EDGE0 = -34.5;         // the fold's outer edge at x = 0
const zEdge = (x) => Z_EDGE0 + (smileCentre(x / K + SX0) - SY0) * K;
const zHinge = (x) => zEdge(x) + R;
const A = new THREE.Vector3(0, 0, 0);
const ZB = 2 * zHinge(0) - Math.PI * R - A.z; // mirror of A across the fold
const X_MIN = -18, X_MAX = 18, Z_NEAR = 10, Z_FAR = -84;
host.layout = { R, K, SX0, SY0, Z_EDGE0, ZB };

// fold state
let theta = 0;
function deform(x, z, hn, out) {
  const zc = zHinge(x);
  const d = zc - z;
  if (d <= 0 || theta <= 0) { out.set(x, hn, z); return 0; }
  const arc = R * theta;
  let u, h, phi;
  if (d <= arc) { phi = d / R; u = R * Math.sin(phi); h = R * (1 - Math.cos(phi)); }
  else { phi = theta; const r = d - arc; u = R * Math.sin(theta) + r * Math.cos(theta); h = R * (1 - Math.cos(theta)) + r * Math.sin(theta); }
  out.set(x, h + hn * Math.cos(phi), zc - u + hn * Math.sin(phi));
  return phi;
}

// regions → terrain height (piecewise-linear on a coarse jittered grid: paper facets)
function regionHeight(x, z) {
  const d = zHinge(x) - z;
  const flatBand = smooth(-9, -5, d) * (1 - smooth(R * Math.PI + 5, R * Math.PI + 9, d));
  // towns stay flat
  const townA = 1 - smooth(4.5, 7.5, Math.hypot(x - A.x, (z - A.z) * 1.15));
  const townB = 1 - smooth(4.5, 7.5, Math.hypot(x, (z - ZB) * 1.15));
  const townC = 1 - smooth(1.5, 3.5, Math.hypot(x - 11.5, z - 3.5));
  const townD = 1 - smooth(1.5, 3.5, Math.hypot(x + 10.5, z + 78.5));
  const flat = Math.max(flatBand, townA, townB, townC, townD);
  // near side: a range of folded-paper ridges between A and the crease (they end up inside the fold)
  let h = 0;
  const range = smooth(-6.5, -9.5, z) * (1 - smooth(-22.5, -25.5, z));
  const ridges = [
    [-12.0, 4.2, 2.3, 0.16, 1],
    [-16.2, 5.0, 2.9, 0.12, 2],
    [-20.4, 4.4, 2.4, 0.14, 3],
  ];
  for (const [rz, w, peak, f, sd] of ridges) {
    const spine = rz + Math.sin(x * 0.23 + sd) * 1.1 + Math.sin(x * 0.61 + sd * 2) * 0.35;
    const dz = z - spine, cr = 0.45;
    let tri = Math.max(0, 1 - (Math.sqrt(dz * dz + cr * cr) - cr) / w);  // a paper crease, crest eased so it never saw-tooths
    const ab = 0.18; tri = tri < ab ? (tri * tri) / (2 * ab) : tri - ab / 2;      // soften the foot of each slope
    // peaks: piecewise-linear along x too, so every face stays a flat facet
    const px = x * f + sd * 3.7, i0 = Math.floor(px), fr = px - i0;
    const pk = lerp(0.35 + 0.65 * hash2(i0, sd, 7), 0.35 + 0.65 * hash2(i0 + 1, sd, 7), fr);
    h = Math.max(h, tri * pk * peak);
  }
  h *= range;
  // far side: a vellum sea between the crease plains and B
  const coast = fbm(x * 0.18, z * 0.18, 23, 3) * 5;
  const sea = smooth(-47.5, -50.5, z + coast * 0.3) * (1 - smooth(-62, -65.5, z - coast * 0.4));
  h = lerp(h, -0.1, sea);
  return { h: h * (1 - flat), sea: sea * (1 - flat) };
}

// coarse jittered triangle grid for faceted terrain
const CELL = 1.25;
function facetHeight(x, z) {
  const gx = (x - X_MIN) / CELL, gz = (z - Z_FAR) / CELL;
  const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
  const node = (i, j) => {
    const nx = X_MIN + (i + (hash2(i, j, 3) - 0.5) * 0.0) * CELL, nz = Z_FAR + j * CELL;
    return regionHeight(nx, nz).h * (0.85 + 0.3 * hash2(i, j, 9));
  };
  const flip = hash2(ix, iz, 41) > 0.5;
  const h00 = node(ix, iz), h10 = node(ix + 1, iz), h01 = node(ix, iz + 1), h11 = node(ix + 1, iz + 1);
  if (!flip) {
    return fx + fz < 1 ? h00 + (h10 - h00) * fx + (h01 - h00) * fz : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  }
  return fx > fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h01 - h00) * fz + (h11 - h01) * fx;
}

// ───────────────────────── renderer ─────────────────────────
const canvas = document.getElementById("fold-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = C.ink.clone();
scene.fog = new THREE.FogExp2(C.ink.getHex(), 0.0);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.01, 600);

// lights
const hemi = new THREE.HemisphereLight(0x7d92b4, 0x141a22, 0.75);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const KEY_DIR = new THREE.Vector3(-1, 0.5, 0.5).normalize(); // low and raking, from front-left

// ───────────────────────── paper material ─────────────────────────
const paperUniforms = {
  uGlowPos: { value: new THREE.Vector3(0, -100, 0) },
  uGlowI: { value: 0 },
  uGlowR: { value: 3 },
  uGlowCol: { value: C.orange.clone() },
  uFiber: { value: 1 },
};
const NOISE_GLSL = /* glsl */ `
  float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x), u.y); }
  float paperH(vec2 p, float fw){
    float h = 0.0;
    // cloudy pulp
    h += (vn(p*7.0)-0.5)*0.55 + (vn(p*19.0)-0.5)*0.3;
    // fibres: long thin strands in several directions, faded where they would alias
    float fib = 0.0;
    for (int i=0;i<5;i++){
      float a = float(i)*1.2566 + 0.37;
      mat2 r = mat2(cos(a),-sin(a),sin(a),cos(a));
      vec2 q = r*p*vec2(55.0, 700.0) + float(i)*13.1;
      fib += smoothstep(0.78, 1.0, vn(q)) * 0.32;
    }
    h += fib * (1.0 - smoothstep(0.002, 0.012, fw));
    h += (vn(p*90.0)-0.5)*0.35*(1.0 - smoothstep(0.004, 0.02, fw));
    return h;
  }
`;
function makePaperMaterial(opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.93, metalness: 0, vertexColors: true,
    side: THREE.DoubleSide, flatShading: opts.flat ?? true,
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, paperUniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aPaper; varying vec2 vPaper; varying vec3 vWorldP;")
      .replace("#include <fog_vertex>", "#include <fog_vertex>\nvPaper = aPaper; vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPaper; varying vec3 vWorldP;\nuniform vec3 uGlowPos; uniform float uGlowI; uniform float uGlowR; uniform vec3 uGlowCol; uniform float uFiber;\n" + NOISE_GLSL)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float fw = length(fwidth(vPaper));
        float ph = paperH(vPaper, fw);
        diffuseColor.rgb *= 0.955 + 0.06*ph*uFiber;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        {
          vec3 sp = -vViewPosition;
          vec3 vSx = dFdx(sp), vSy = dFdy(sp);
          vec3 vN = normal;
          vec3 R1 = cross(vSy, vN), R2 = cross(vN, vSx);
          float fDet = dot(vSx, R1) * faceDirection;
          float hh = ph * 0.0011 * uFiber;
          vec2 dH = vec2(dFdx(hh), dFdy(hh));
          vec3 vGrad = sign(fDet) * (dH.x * R1 + dH.y * R2);
          normal = normalize(abs(fDet) * vN - vGrad);
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        {
          float gd = length(vWorldP - uGlowPos);
          totalEmissiveRadiance += uGlowCol * uGlowI * exp(-gd*gd/(uGlowR*uGlowR));
        }`);
  };
  return m;
}

// ───────────────────────── the sheet ─────────────────────────
const NX = 240, NZ = 640;
const sheetGeo = new THREE.BufferGeometry();
const vCount = (NX + 1) * (NZ + 1);
const base = new Float32Array(vCount * 3);   // x, z, local height
const pos = new Float32Array(vCount * 3);
const col = new Float32Array(vCount * 3);
const aPaper = new Float32Array(vCount * 2);
for (let j = 0; j <= NZ; j++) {
  for (let i = 0; i <= NX; i++) {
    const k = j * (NX + 1) + i;
    const x = X_MIN + (X_MAX - X_MIN) * (i / NX);
    const z = Z_NEAR + (Z_FAR - Z_NEAR) * (j / NZ);
    const { sea, h: h0 } = regionHeight(x, z);
    let h = h0;
    // vellum ripples on the sea
    h = lerp(h, -0.12 + 0.03 * Math.sin(z * 8.5 + fbm(x * 0.4, z * 0.4, 77, 2) * 6) * Math.sin(x * 0.7 + z * 0.2) , sea);
    base[k * 3] = x; base[k * 3 + 1] = z; base[k * 3 + 2] = h;
    aPaper[k * 2] = x; aPaper[k * 2 + 1] = z;
    const c = C.paper.clone().lerp(C.vellum, sea * 0.85);
    const tint = 0.97 + 0.05 * fbm(x * 0.3, z * 0.3, 91, 2);
    col[k * 3] = c.r * tint; col[k * 3 + 1] = c.g * tint; col[k * 3 + 2] = c.b * tint;
  }
}
const idx = new Uint32Array(NX * NZ * 6);
let ii = 0;
for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
  const a = j * (NX + 1) + i, b = a + 1, c2 = a + NX + 1, d = c2 + 1;
  idx[ii++] = a; idx[ii++] = c2; idx[ii++] = b; idx[ii++] = b; idx[ii++] = c2; idx[ii++] = d;
}
sheetGeo.setIndex(new THREE.BufferAttribute(idx, 1));
const posAttr = new THREE.BufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
sheetGeo.setAttribute("position", posAttr);
sheetGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
sheetGeo.setAttribute("aPaper", new THREE.BufferAttribute(aPaper, 2));
const paperMat = makePaperMaterial();
const sheet = new THREE.Mesh(sheetGeo, paperMat);
sheet.castShadow = true; sheet.receiveShadow = true;
sheet.frustumCulled = false;
scene.add(sheet);
const tmpV = new THREE.Vector3();
function updateSheet() {
  for (let k = 0; k < vCount; k++) {
    deform(base[k * 3], base[k * 3 + 1], base[k * 3 + 2], tmpV);
    pos[k * 3] = tmpV.x; pos[k * 3 + 1] = tmpV.y; pos[k * 3 + 2] = tmpV.z;
  }
  posAttr.needsUpdate = true;
  sheetGeo.computeBoundingSphere();
}

// ───────────────────────── paper houses ─────────────────────────
const rnd = mulberry32(20261105);
const houses = [];
function addTown(cx, cz, rad, n, minGap = 0.42) {
  let tries = 0;
  while (n > 0 && tries++ < n * 40) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * rad;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * 0.85;
    if (houses.some((h) => Math.hypot(h.x - x, h.z - z) < minGap)) continue;
    // keep the opening lens clear: nothing between the camera and the first window
    if (Math.abs(x - A.x) < 0.9 && z > A.z - 0.2 && z < A.z + 2.4) continue;
    if (Math.abs(x) < 0.9 && z < ZB + 0.2 && z > ZB - 2.4) continue;
    const s = 0.75 + rnd() * 0.6;
    houses.push({ x, z, s, w: 0.2 * s, d: (0.16 + rnd() * 0.08) * s, h: (0.12 + rnd() * 0.1) * s, rot: (rnd() < 0.5 ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.25, shade: 0.9 + rnd() * 0.1 });
    n--;
  }
}
// the two hero houses first
houses.push({ x: A.x, z: A.z, s: 1, w: 0.2, d: 0.17, h: 0.14, rot: 0, shade: 1, hero: "A" });
houses.push({ x: 0, z: ZB, s: 1, w: 0.2, d: 0.17, h: 0.14, rot: Math.PI, shade: 1, hero: "B" });
addTown(A.x, A.z, 4.4, 150);
addTown(0, ZB, 4.4, 150);
addTown(11.5, 3.5, 2.2, 28);
addTown(-10.5, -78.5, 2.2, 28);
const bodyGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
const HOUSE_LIFT = 0.006; // never coplanar with the sheet
const roofGeo = new THREE.CylinderGeometry(0.62, 0.62, 1, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 2 + Math.PI / 6);
// orient prism: ridge along local z, apex up
roofGeo.rotateX(-Math.PI / 2 - Math.PI / 6).rotateZ(0);
const roofGeo2 = (() => {
  const g = new THREE.BufferGeometry();
  const v = [
    // triangular prism, ridge along z, base width 1 (x), height 0.55, length 1 (z)
    -0.55, 0, -0.5, 0.55, 0, -0.5, 0, 0.55, -0.5,
    -0.55, 0, 0.5, 0, 0.55, 0.5, 0.55, 0, 0.5,
    -0.55, 0, -0.5, 0, 0.55, -0.5, 0, 0.55, 0.5, -0.55, 0, -0.5, 0, 0.55, 0.5, -0.55, 0, 0.5,
    0.55, 0, -0.5, 0.55, 0, 0.5, 0, 0.55, 0.5, 0.55, 0, -0.5, 0, 0.55, 0.5, 0, 0.55, -0.5,
  ];
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
})();
const houseMat = new THREE.MeshStandardMaterial({ color: 0xf6f1e7, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
const bodies = new THREE.InstancedMesh(bodyGeo, houseMat, houses.length);
const roofs = new THREE.InstancedMesh(roofGeo2, houseMat, houses.length);
for (const m of [bodies, roofs]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
houses.forEach((h, i) => { const c = new THREE.Color(0xffffff).multiplyScalar(h.shade); bodies.setColorAt(i, c); roofs.setColorAt(i, c); });

// local frame of the deformed paper at (x, z)
const fP = new THREE.Vector3(), fZ = new THREE.Vector3(), fY = new THREE.Vector3(), fX = new THREE.Vector3(1, 0, 0);
const frameM = new THREE.Matrix4();
function paperFrame(x, z, hn, out) {
  deform(x, z, hn, fP);
  deform(x, z + 0.01, hn, fZ); fZ.sub(fP).normalize();
  deform(x, z, hn + 0.01, fY); fY.sub(fP).normalize();
  out.makeBasis(fX, fY, fZ).setPosition(fP);
  return out;
}
const mLocal = new THREE.Matrix4(), mTmp = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), tr = new THREE.Vector3();
function houseLocal(h, part) {
  q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h.rot);
  if (part === "body") { tr.set(0, 0, 0); sc.set(h.w, h.h, h.d); }
  else { tr.set(0, h.h, 0); sc.set(h.w * 0.95, h.w * 0.95, h.d * 1.08); }
  return mLocal.compose(tr.applyQuaternion(q), q, sc);
}
// windows (only the two hero houses carry light)
function windowLocal(h) { // point on the front face, relative to house origin, in house space
  return new THREE.Vector3(0.0, h.h * 0.5, h.d / 2 + 0.002).applyAxisAngle(new THREE.Vector3(0, 1, 0), h.rot);
}
function updateHouses() {
  houses.forEach((h, i) => {
    paperFrame(h.x, h.z, HOUSE_LIFT, frameM);
    bodies.setMatrixAt(i, mTmp.multiplyMatrices(frameM, houseLocal(h, "body")));
    roofs.setMatrixAt(i, mTmp.multiplyMatrices(frameM, houseLocal(h, "roof")));
  });
  bodies.instanceMatrix.needsUpdate = true; roofs.instanceMatrix.needsUpdate = true;
}

// ───────────────────────── the two lights ─────────────────────────
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,236,200,1)");
  gr.addColorStop(0.12, "rgba(255,190,90,0.85)");
  gr.addColorStop(0.35, "rgba(255,153,0,0.28)");
  gr.addColorStop(1, "rgba(255,153,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = glowTexture();
const windowTex = (() => {
  const c = document.createElement("canvas"); c.width = 128; c.height = 160;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 92, 6, 64, 80, 90);
  gr.addColorStop(0, "#fff6e2"); gr.addColorStop(1, "#ffb35a");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
  g.fillStyle = "rgba(60,40,25,0.9)";
  g.fillRect(60, 0, 8, 160); g.fillRect(0, 74, 128, 8);           // mullions
  g.strokeStyle = "rgba(60,40,25,0.9)"; g.lineWidth = 10; g.strokeRect(0, 0, 128, 160);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function makeLight() {
  const grp = new THREE.Group();
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.2, 0.6), map: windowTex, transparent: true, toneMapped: true }));
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const pl = new THREE.PointLight(0xffa033, 0, 0, 2);
  grp.add(spr, pl);
  scene.add(grp, win);
  return { grp, win, spr, pl };
}
const LA = makeLight(), LB = makeLight();
const heroA = houses.find((h) => h.hero === "A"), heroB = houses.find((h) => h.hero === "B");

// ───────────────────────── tissue-paper clouds ─────────────────────────
function tissueTexture(seed) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d");
  const r = mulberry32(seed);
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    const x = 256 + (r() - 0.5) * 260, y = 256 + (r() - 0.5) * 160, rr = 60 + r() * 120;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.7, "rgba(255,255,255,0.25)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  // torn fibre edge speckle
  const img = g.getImageData(0, 0, 512, 512);
  for (let p = 0; p < img.data.length; p += 4) img.data[p + 3] *= 0.75 + 0.25 * r();
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const clouds = [];
const cloudSpecs = [
  [-2.5, 6, 1.5, 9], [3.5, 9, -3, 12], [-4, 13, -6, 15], [2, 18, -9, 18],
  [-6, 24, -13, 22], [6, 31, -18, 26], [-3, 38, -24, 30], [8, 22, -40, 24], [-9, 28, -55, 28], [5, 34, -70, 30],
];
cloudSpecs.forEach(([x, y, z, s], i) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.62), new THREE.MeshLambertMaterial({
    map: tissueTexture(100 + i), transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, color: 0xf3eee4,
  }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = (i * 0.9) % 3;
  m.position.set(x, y, z);
  m.userData.baseOpacity = 0.55;
  scene.add(m); clouds.push(m);
});

// ───────────────────────── the smile ribbon (official shape, mapped onto the fold edge) ─────────────────────────
const RIBBON_Y = R + 0.06;
const svgToWorld = new THREE.Matrix4().set(
  K, 0, 0, -SX0 * K,
  0, 0, 0, RIBBON_Y,
  0, K, 0, Z_EDGE0 - SY0 * K,
  0, 0, 0, 1,
);
const ribbonUniforms = { uProg: { value: 0 }, uOpacity: { value: 0 }, uCol: { value: new THREE.Color(3.2, 1.75, 0.0) } };
const ribbonMat = new THREE.ShaderMaterial({
  uniforms: ribbonUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  vertexShader: `varying float vSx; void main(){ vSx = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform float uProg; uniform float uOpacity; uniform vec3 uCol; varying float vSx;
    void main(){ float m = 1.0 - smoothstep(uProg - 14.0, uProg, vSx); gl_FragColor = vec4(uCol, uOpacity * m); }`,
});
function shapeMesh(shapes, mat) {
  const g = new THREE.ShapeGeometry(shapes, 24);
  const mesh = new THREE.Mesh(g, mat);
  mesh.matrixAutoUpdate = false; mesh.matrix.copy(svgToWorld);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}
const ribbon = shapeMesh(smileShapes, ribbonMat);
const arrowMat = ribbonMat.clone(); arrowMat.uniforms = THREE.UniformsUtils.clone(ribbonUniforms);
const arrow = shapeMesh(arrowShapes, arrowMat);

// ───────────────────────── post ─────────────────────────
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 0.3, aperture: 0.004, maxblur: 0.012 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.55, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uFade: { value: 1 }, uVig: { value: 0.32 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame; uniform float uFade; uniform float uVig; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = vUv - 0.5; d.x *= 0.5625;
      c *= 1.0 - uVig * smoothstep(0.18, 0.62, length(d));
      float g = h(vUv*vec2(1080.0,1920.0) + fract(uFrame*0.6180339)*917.0) - 0.5;
      c += g * 0.028;
      gl_FragColor = vec4(c * uFade, 1.0);
    }`,
});
composer.addPass(finish);

// ───────────────────────── camera path (time-knotted Hermite, C1 continuous) ─────────────────────────
const T_END = 20;
const zE = Z_EDGE0;
// final top-down lock: logo maps exactly onto the ribbon
const LOGO_W = 860, LOGO_SCALE = LOGO_W / 603;           // px per svg unit
const PX_PER_UNIT = LOGO_SCALE / K;
const FINAL_FOV = 34;
const FINAL_D = H / (2 * PX_PER_UNIT * Math.tan(THREE.MathUtils.degToRad(FINAL_FOV / 2)));
const SMILE_SCREEN_Y = 1010;
const FINAL_X = (301.5 - SX0) * K;                       // centre the wordmark
const FINAL_Z = zE - (SMILE_SCREEN_Y - H / 2) / PX_PER_UNIT;
const FINAL_Y = RIBBON_Y + FINAL_D;
host.logoPlacement = {
  scale: LOGO_SCALE,
  // screen position of svg origin
  left: W / 2 + ((0 - SX0) * K - FINAL_X) * PX_PER_UNIT,
  top: H / 2 + ((Z_EDGE0 - SY0 * K) - FINAL_Z) * PX_PER_UNIT,
};

const keys = [
  // t, position, target, fov, focusDist, aperture
  [0.0, [0.26, 0.085, 1.05], [0.0, 0.085, 0.0], 30, 0.32, 0.03],
  [1.2, [0.24, 0.09, 0.98], [0.0, 0.085, 0.0], 30, 0.36, 0.03],
  [2.2, [0.21, 0.11, 0.9], [0.0, 0.085, 0.0], 30, 0.92, 0.02],
  [3.3, [0.2, 1.0, 1.7], [0.0, 0.02, -0.8], 32, 1.8, 0.0012],
  [4.6, [0.3, 7.5, 7.0], [0.0, 0.0, -8], 34, 10, 0.0],
  [6.2, [0.0, 56, 34], [0.0, 0.0, -24], 36, 40, 0.0],
  [7.4, [0.6, 104, 40], [0.0, 0.0, -30], 38, 60, 0.0],
  [9.0, [12, 72, 34], [0.0, 8, -30], 38, 50, 0.0],
  [10.6, [30, 15, 6], [0.0, 9, -24], 34, 40, 0.0],
  [12.0, [22.5, 5.2, 4.0], [0.0, 3.6, -1.0], 34, 22, 0.0],
  [13.4, [12.5, 3.7, 2.2], [0.0, 3.5, 0.0], 32, 12.5, 0.0],
  [14.5, [9.5, 3.6, 1.6], [0.0, 3.5, 0.0], 32, 9.5, 0.0],
  [15.4, [26, 22, -8], [FINAL_X, 0.0, FINAL_Z + 2], 34, 30, 0.0],
  [16.4, [FINAL_X, FINAL_Y, FINAL_Z], [FINAL_X, 0.0, FINAL_Z], FINAL_FOV, 100, 0.0],
  [20.0, [FINAL_X, FINAL_Y, FINAL_Z], [FINAL_X, 0.0, FINAL_Z], FINAL_FOV, 100, 0.0],
];
function hermiteChannel(getter) {
  const n = keys.length;
  const tangents = keys.map((k, i) => {
    if (i === 0 || i === n - 1) return getter(k).map(() => 0);
    const a = getter(keys[i - 1]), b = getter(keys[i + 1]);
    const dt = keys[i + 1][0] - keys[i - 1][0];
    return a.map((v, j) => (b[j] - v) / dt);
  });
  return (t) => {
    if (t <= keys[0][0]) return getter(keys[0]);
    if (t >= keys[n - 1][0]) return getter(keys[n - 1]);
    let i = 0; while (keys[i + 1][0] < t) i++;
    const t0 = keys[i][0], t1 = keys[i + 1][0], h = t1 - t0, s = (t - t0) / h;
    const p0 = getter(keys[i]), p1 = getter(keys[i + 1]), m0 = tangents[i], m1 = tangents[i + 1];
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    return p0.map((v, j) => h00 * v + h10 * h * m0[j] + h01 * p1[j] + h11 * h * m1[j]);
  };
}
// the last two keys are identical, so the move into the lock must arrive with zero velocity
keys[keys.length - 2].lock = true;
const camPos = hermiteChannel((k) => k[1]);
const camTgt = hermiteChannel((k) => k[2]);
const camMisc = hermiteChannel((k) => [k[3], k[4], k[5]]);
const upV = new THREE.Vector3();

// fold progress: heavy start, gathering speed, a soft settle
function foldAt(t) {
  const p = seg(t, 7.2, 11.9);
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const settle = Math.sin(seg(t, 11.9, 12.7) * Math.PI) * 0.035 * (1 - seg(t, 11.9, 12.7));
  return Math.PI * Math.min(1, e) - settle;
}

// project helper for DOM labels
const proj = new THREE.Vector3();
function toScreen(v) { proj.copy(v).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, z: proj.z }; }

const wA = new THREE.Vector3(), wB = new THREE.Vector3(), meet = new THREE.Vector3(), nA = new THREE.Vector3(), nB = new THREE.Vector3();
const labels = { here: document.getElementById("lbl-here"), there: document.getElementById("lbl-there") };

function render(t) {
  t = Math.max(0, Math.min(T_END, t));
  const frame = Math.round(t * 30);

  // fold + geometry
  theta = foldAt(t);
  updateSheet();
  updateHouses();

  // camera
  const p = camPos(t), g = camTgt(t), [fov, focus, aperture] = camMisc(t);
  camera.position.set(p[0], p[1], p[2]);
  const dir = new THREE.Vector3(g[0] - p[0], g[1] - p[1], g[2] - p[2]).normalize();
  const steep = smooth(0.82, 0.995, -dir.y);           // blend the up vector as the camera looks straight down
  upV.set(0, 1 - steep, -steep).normalize();
  camera.up.copy(upV);
  camera.fov = fov;
  const focusDist = Math.hypot(g[0] - p[0], g[1] - p[1], g[2] - p[2]);
  camera.near = Math.max(0.008, focusDist * 0.03);           // keep depth precision at every scale
  camera.far = Math.max(60, focusDist * 4 + 200);
  camera.updateProjectionMatrix();
  camera.lookAt(g[0], g[1], g[2]);
  camera.updateMatrixWorld();

  // key light & shadow frustum follow the action
  const shotScale = Math.max(1.2, Math.min(70, camera.position.distanceTo(new THREE.Vector3(g[0], g[1], g[2])) * 1.1));
  const tgt = new THREE.Vector3(g[0], 0, g[2]);
  key.target.position.copy(tgt);
  key.position.copy(tgt).addScaledVector(KEY_DIR, 120);
  const sc2 = key.shadow.camera;
  sc2.left = -shotScale; sc2.right = shotScale; sc2.top = shotScale; sc2.bottom = -shotScale;
  sc2.near = 1; sc2.far = 260; sc2.updateProjectionMatrix();
  // the paper world goes dark at the end, leaving only the smile
  const dim = 1 - 0.965 * easeInOutCubic(seg(t, 16.5, 17.6));
  key.intensity = 2.5 * dim;
  hemi.intensity = 0.75 * (0.12 + 0.88 * dim);
  paperUniforms.uFiber.value = 1;

  // lights in their windows
  const pulseA = 0.55 + 0.45 * easeOutExpo(seg(t, 0.75, 1.15)) - 0.12 * Math.exp(-Math.pow((t - 1.2) / 0.25, 2)) * 0;
  paperFrame(heroA.x, heroA.z, 0, frameM); wA.copy(windowLocal(heroA)).applyMatrix4(frameM); nA.set(0, 0, 1).transformDirection(frameM);
  paperFrame(heroB.x, heroB.z, 0, frameM); wB.copy(windowLocal(heroB)).applyMatrix4(frameM); nB.set(0, 0, -1).transformDirection(frameM);
  // window quads
  LA.win.position.copy(wA); LA.win.scale.set(0.045, 0.055, 1); LA.win.lookAt(tmpV.copy(wA).add(nA));
  LB.win.position.copy(wB); LB.win.scale.set(0.045, 0.055, 1); LB.win.lookAt(tmpV.copy(wB).add(nB));
  // orbs: leave the windows and meet in the fold
  meet.copy(wA).add(wB).multiplyScalar(0.5);
  const travel = easeInOutCubic(seg(t, 12.4, 14.0));
  const oA = tmpV.copy(wA).addScaledVector(nA, 0.05).lerp(meet, travel).clone();
  const oB = new THREE.Vector3().copy(wB).addScaledVector(nB, 0.05).lerp(meet, travel);
  LA.grp.position.copy(oA); LB.grp.position.copy(oB);
  const meetFlash = Math.exp(-Math.pow((t - 14.05) / 0.35, 2));
  const merged = seg(t, 13.95, 14.1);
  const orbSize = (camD) => Math.max(0.06, camD * 0.035);
  const dA = camera.position.distanceTo(oA), dB = camera.position.distanceTo(oB);
  const intensityA = pulseA * (1 + travel * 0.6);
  LA.spr.scale.setScalar(orbSize(dA) * (0.8 + travel * 1.4 + meetFlash * 3.5));
  LB.spr.scale.setScalar(orbSize(dB) * (0.8 + travel * 1.4 + meetFlash * 3.5) * (1 - merged * 0.999));
  LA.spr.material.opacity = Math.min(1, intensityA);
  LB.spr.material.opacity = 1;
  const lift = Math.max(travel, 0.35 * easeInOutCubic(seg(t, 11.2, 12.4))); // the windows swell first, then the orbs leave
  LA.pl.intensity = (0.02 + lift * 30 + meetFlash * 70) * intensityA; LA.pl.distance = 0;
  LB.pl.intensity = (0.02 + lift * 30) * (1 - merged);
  LA.pl.decay = LB.pl.decay = 2;
  // fade the window quads once the orbs have left
  LA.win.material.color.setRGB(4, 2.2, 0.6).multiplyScalar(intensityA * (1 - travel * 0.85));
  LB.win.material.color.setRGB(4, 2.2, 0.6).multiplyScalar(1 - travel * 0.85);

  // glow through the paper ceiling after the meeting
  paperUniforms.uGlowPos.value.set(meet.x, 2 * R, meet.z);
  paperUniforms.uGlowI.value = (meetFlash * 2.2 + seg(t, 14.0, 15.0) * 0.9) * (1 - 0.75 * seg(t, 16.6, 17.6));
  paperUniforms.uGlowR.value = 2.2 + seg(t, 14.0, 16.0) * 1.6;

  // clouds: present for the climb only
  clouds.forEach((m) => { m.material.opacity = m.userData.baseOpacity * seg(t, 2.6, 3.4) * (1 - seg(t, 7.0, 8.4)); m.visible = m.material.opacity > 0.002; });

  // smile ribbon draws left → right along the crease, then the tip tucks in
  ribbonUniforms.uProg.value = lerp(SM_X0 - 16, SM_X1 + 16, easeInOutCubic(seg(t, 16.2, 17.0)));
  ribbonUniforms.uOpacity.value = seg(t, 16.15, 16.35) * (1 - seg(t, 17.55, 17.85));
  arrowMat.uniforms.uProg.value = 1000;
  arrowMat.uniforms.uOpacity.value = seg(t, 16.85, 17.05) * (1 - seg(t, 17.55, 17.85));

  // bokeh only while it matters
  bokeh.enabled = aperture > 0.0001;
  bokeh.uniforms.focus.value = focus;
  bokeh.uniforms.aperture.value = aperture;
  bokeh.uniforms.maxblur.value = 0.02;
  bloom.strength = 0.5 + meetFlash * 0.6 + seg(t, 16.2, 16.8) * 0.25;

  // finish
  finish.uniforms.uFrame.value = frame;
  finish.uniforms.uFade.value = 0.45 + 0.55 * easeInOutCubic(seg(t, 0.0, 0.5));
  scene.fog.density = 0.0075 * seg(t, 4, 7) * (1 - seg(t, 11, 13));

  composer.render();

  // DOM labels ride on the lights
  const sA = toScreen(wA), sB = toScreen(wB);
  // labels sit up and to the right of each house, in world space so they scale with the shot
  const lA = toScreen(tmpV.copy(wA).add(new THREE.Vector3(0.17, 0.13, 0)));
  const lB = toScreen(tmpV.copy(wB).add(new THREE.Vector3(0.17, 0.13, 0)));
  const cx = (v) => Math.min(W * 0.9 - 150, Math.max(W * 0.1, v)), cy = (v) => Math.min(1260, Math.max(200, v));
  if (labels.here) labels.here.style.transform = `translate(${cx(lA.x + 14).toFixed(1)}px, ${cy(lA.y - 58).toFixed(1)}px)`;
  if (labels.there) labels.there.style.transform = `translate(${cx(lB.x + 18).toFixed(1)}px, ${cy(lB.y - 58).toFixed(1)}px)`;
  host.debug = { t, theta, sA, sB, cam: p };
}

{
  const wrap = document.getElementById("logo-wrap");
  const lp = host.logoPlacement;
  if (wrap) wrap.style.transform = `translate(${lp.left.toFixed(2)}px, ${lp.top.toFixed(2)}px) scale(${lp.scale.toFixed(5)})`;
}
host.render = render;
host.dbg = { scene, houses: [bodies, roofs], paperUniforms, LA, LB };
render(host.clock.t || 0);
host.ready();
