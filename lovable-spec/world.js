// 3D stage for the Lovable spec ad. Everything is a pure function of t (deterministic frames).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SW, SH, BAKERY_PIECES, pieceCanvas, bakeryBase, bakeryDesktop, leagueScreen, plantsScreen, merchScreen } from './ui.js';

const W = 1080, H = 1350, FOV = 30, CZ = 5;
const UPP = 2 * CZ * Math.tan(FOV / 2 * Math.PI / 180) / H;
const sx = x => (x - W / 2) * UPP, sy = y => (H / 2 - y) * UPP;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = p => 1 - Math.pow(1 - p, 4), eIn = p => p * p * p, eInOut = p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2;
const backOut = (p, c = 1.6) => 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
const lerp = (a, b, p) => a + (b - a) * p;
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// ---------- the Lovable gradient (official palette) ----------
const PAL = {   // [left, centre, right, rim]  — sRGB 0..1
  warm: ['#4B73FF', '#FF0178', '#FF6D1B', '#FFA6F9'],
  cool: ['#4E93FF', '#BBC1FF', '#4B73FF', '#FFA6F9'],
  pink: ['#FF6D1B', '#FF0178', '#FFA6F9', '#BBC1FF'],
  hot: ['#FF0178', '#F7101D', '#FFA517', '#FFA6F9'],
};
const vc = h => new THREE.Vector3(...new THREE.Color(h).toArray().map(v => v)).applyMatrix3(new THREE.Matrix3()); // linear->kept as given below
function srgb(h) { const c = new THREE.Color(); c.setStyle(h, THREE.SRGBColorSpace); c.convertLinearToSRGB(); return new THREE.Vector3(c.r, c.g, c.b); }
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT, uBloom; uniform vec3 cL, cC, cR, cRim;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
 vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx); vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
 vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
 vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
 vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
 vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
 m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
 vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 w=vec2(snoise(uv*1.4+vec2(0.,uT*.07)),snoise(uv*1.4+vec2(4.7,-uT*.06)))*.085;
  float y0=mix(-.62,.58,uBloom);
  float R=mix(.62,1.75,smoothstep(.15,1.2,uBloom));
  vec2 d=vec2(uv.x-.5,(uv.y-y0)*1.18)+w;
  float r=length(d);
  float inside=smoothstep(R,R*.42,r);
  float a=clamp(uv.x+w.x*2.6+snoise(uv*2.2+uT*.05)*.05,0.,1.);
  vec3 col=mix(cL,cC,smoothstep(.05,.55,a));
  col=mix(col,cR,smoothstep(.48,.98,a+(y0-uv.y)*.18));
  float rim=exp(-pow((r-R*.9)/(.07*R+.015),2.));
  col=mix(col,cRim,rim*.55);
  col=mix(col,cC*.75+cR*.25,smoothstep(R*.85,R*.15,r)*.28);
  vec3 bg=vec3(.106,.106,.106);
  vec3 o=mix(bg,col,inside);
  o+=(hash(gl_FragCoord.xy+fract(uT)*91.)-.5)*(3./255.);
  gl_FragColor=vec4(o,1.);
}`;

let R, bgScene, bgCam, bgMat, scene, cam, key, phone, phoneScreen, pieces = [], browser, screens = {};

function roundedPlane(w, h, r, seg = 12) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  const g = new THREE.ShapeGeometry(s, seg), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const SCRW = .70, SCRH = 1.52;
function screenRect([x, y, w, h]) { return { w: w / SW * SCRW, h: h / SH * SCRH, cx: ((x + w / 2) / SW - .5) * SCRW, cy: (.5 - (y + h / 2) / SH) * SCRH }; }

function makePhone() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(.76, 1.58, .085, 8, .12), new THREE.MeshPhysicalMaterial({ color: 0x2A2A2E, metalness: .9, roughness: .28, clearcoat: 1, clearcoatRoughness: .12 }));
  body.castShadow = true;
  const bezel = new THREE.Mesh(roundedPlane(.738, 1.558, .105), new THREE.MeshBasicMaterial({ color: 0x050608 })); bezel.position.z = .0428;
  const scr = new THREE.Mesh(roundedPlane(SCRW, SCRH, .085), new THREE.MeshBasicMaterial({ toneMapped: false })); scr.position.z = .0432;
  const glass = new THREE.Mesh(roundedPlane(.738, 1.558, .105), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .04, transparent: true, opacity: .08, clearcoat: 1, depthWrite: false })); glass.position.z = .05; glass.renderOrder = 10;
  g.add(body, bezel, scr, glass); return { g, scr };
}

export function init(canvas) {
  R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NoToneMapping;
  R.autoClear = false; R.shadowMap.enabled = true; R.shadowMap.type = THREE.VSMShadowMap;
  // background gradient pass
  bgScene = new THREE.Scene(); bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const col = h => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); };  // shader works in sRGB values
  const hex = h => { const c = new THREE.Color(); c.setHex(parseInt(h.slice(1), 16), THREE.LinearSRGBColorSpace); return new THREE.Vector3(c.r, c.g, c.b); };
  bgMat = new THREE.ShaderMaterial({ fragmentShader: FRAG, vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}', depthTest: false, depthWrite: false,
    uniforms: { uRes: { value: new THREE.Vector2(W, H) }, uT: { value: 0 }, uBloom: { value: .2 }, cL: { value: hex('#4B73FF') }, cC: { value: hex('#FF0178') }, cR: { value: hex('#FF6D1B') }, cRim: { value: hex('#FFA6F9') } } });
  bgMat.userData.hex = hex;
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));
  // main scene
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .8;
  cam = new THREE.PerspectiveCamera(FOV, W / H, .05, 50); cam.position.set(0, 0, CZ);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffd8ef, .8));
  key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-1.5, 2.2, 4.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 14; key.shadow.blurSamples = 16; key.shadow.bias = -.0005;
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: .5, far: 12 }); scene.add(key);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: 0x3a0030, opacity: .28 }));
  catcher.position.z = -1.0; catcher.receiveShadow = true; scene.add(catcher);
  // phone + bakery pieces
  const p = makePhone(); phone = p.g; phoneScreen = p.scr; scene.add(phone);
  screens.bakery = tex(bakeryBase()); screens.league = tex(leagueScreen()); screens.plants = tex(plantsScreen()); screens.merch = tex(merchScreen());
  BAKERY_PIECES.forEach((pc, i) => {
    const r = screenRect(pc[1]);
    const m = new THREE.Mesh(roundedPlane(r.w, r.h, Math.min(r.w, r.h) * (i === 1 || i === 3 ? .02 : .12)), new THREE.MeshBasicMaterial({ map: tex(pieceCanvas(pc)), transparent: true, toneMapped: false }));
    m.castShadow = true; m.userData = { r, i }; m.renderOrder = 5; phone.add(m); pieces.push(m);
  });
  // desktop browser window
  browser = new THREE.Group();
  const bw = 1.9, bh = 1.1875;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(bw + .04, bh + .04, .03, 4, .03), new THREE.MeshPhysicalMaterial({ color: 0xF2F0EC, roughness: .4, clearcoat: .6 }));
  frame.castShadow = true; frame.position.z = -.02;
  const content = new THREE.Mesh(roundedPlane(bw, bh, .025), new THREE.MeshBasicMaterial({ map: tex(bakeryDesktop()), toneMapped: false })); content.position.z = .0;
  browser.add(frame, content); scene.add(browser);
}

const SEG = [ // background states
  [0, 'warm'], [10.0, 'cool'], [11.75, 'pink'], [13.5, 'hot'], [15.25, 'warm']];
function setPal(name) { const P = PAL[name], h = bgMat.userData.hex; ['cL', 'cC', 'cR', 'cRim'].forEach((k, i) => bgMat.uniforms[k].value.copy(h(P[i]))); }

export function render3d(t) {
  // ---- background ----
  let seg = SEG[0][1]; for (const [t0, n] of SEG) if (t >= t0) seg = n; setPal(seg);
  let bloom = .3 + Math.sin(t * 1.3) * .015;
  bloom = lerp(bloom, 1.28, eInOut(prog(t, 4.95, 5.9)));
  if (t >= 15.25) bloom = lerp(1.28, .34, eOut(prog(t, 15.25, 16.4))) + Math.sin(t * 1.1) * .01;
  bgMat.uniforms.uBloom.value = bloom; bgMat.uniforms.uT.value = t;
  R.clear(); R.render(bgScene, bgCam);

  // ---- phone ----
  const build = t >= 5.5 && t < 10.0, mont = t >= 10.0 && t < 15.25;
  phone.visible = build || mont; browser.visible = build && t > 8.1;
  if (build) {
    phoneScreen.material.map = screens.bakery; phoneScreen.material.needsUpdate = true;
    const rise = eOut(prog(t, 5.55, 6.45));
    phone.position.set(lerp(sx(540), sx(640), eInOut(prog(t, 8.0, 8.9))), lerp(sy(1700), sy(800), rise), 0);
    phone.rotation.set(lerp(.5, -.06, rise) + Math.sin(t * .8) * .02, lerp(-.5, -.22, rise) + Math.sin(t * .6) * .04 - eInOut(prog(t, 8.0, 8.9)) * .1, lerp(.15, .02, rise));
    phone.scale.setScalar(1.18);
    pieces.forEach((m, i) => {
      const t0 = 6.05 + i * .32, p = prog(t, t0, t0 + .8), e = eOut(p);
      const { r } = m.userData;
      const ang = hash(i * 3.3) * Math.PI * 2, dist = 1.1 + hash(i * 7.1) * .6;
      const from = new THREE.Vector3(Math.cos(ang) * dist, Math.sin(ang) * dist * .9 + .3, 1.4 + hash(i) * .8);
      m.position.set(lerp(from.x, r.cx, e), lerp(from.y, r.cy, e), lerp(from.z, .046 + i * .0006, e) + Math.sin(p * Math.PI) * .12);
      m.rotation.set(lerp(hash(i + 1) * 1.6 - .8, 0, e), lerp(hash(i + 2) * 1.6 - .8, 0, e), lerp(hash(i + 3) * 1.2 - .6, 0, e));
      m.scale.setScalar(t < t0 ? 0 : lerp(1.25, 1, e) * backOut(clamp(p * 2.2), 1.2));
      m.visible = t >= t0;
    });
    if (t > 8.1) {
      const bi = eOut(prog(t, 8.1, 9.0));
      browser.position.set(lerp(sx(-200), sx(330), bi), sy(620) + Math.sin(t * .7) * .01, lerp(-.9, -.45, bi));
      browser.rotation.set(-.04, lerp(.7, .32, bi), .0);
      browser.scale.setScalar(1.0);
    }
  }
  if (mont) {
    const k = t < 11.75 ? 0 : t < 13.5 ? 1 : 2, t0 = [10.0, 11.75, 13.5][k];
    phoneScreen.material.map = [screens.league, screens.plants, screens.merch][k]; phoneScreen.material.needsUpdate = true;
    pieces.forEach(m => m.visible = false);
    const pop = eOut(prog(t, t0 + .35, t0 + .95)), side = [1, -1, 1][k];
    phone.position.set(sx(540) + side * lerp(.35, 0, pop), sy(800) - lerp(.6, 0, pop), lerp(-.8, 0, pop));
    phone.rotation.set(-.05 + Math.sin(t) * .02, side * lerp(.6, .18, pop) + Math.sin(t * .7) * .03, side * lerp(.12, .02, pop));
    phone.scale.setScalar(1.18 * lerp(.85, 1, pop));
    phone.visible = t >= t0 + .35;
  }
  key.position.set(-1.5 + Math.sin(t * .3) * .4, 2.2, 4.5);
  cam.position.set(Math.sin(t * .31) * .05, Math.sin(t * .23) * .04, CZ - eInOut(prog(t, 5.5, 10)) * .2);
  cam.lookAt(0, 0, 0);
  R.render(scene, cam);
}
