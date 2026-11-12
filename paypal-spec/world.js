// Shared 3D paper world for the PayPal "SETTLED." spec ad. Pure builders, deterministic.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const W = 1080, H = 1350, FOV = 30, CZ = 5;
export const UPP = 2 * CZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) / H;
export const sx = x => (x - W / 2) * UPP, sy = y => (H / 2 - y) * UPP;
export const C = { deep: '#002991', blue: '#008CFF', sky: '#60CDFF', ink: '#1A1A1A', paper: '#F7F3EA', note: '#FFE27A', bg: '#FAFAF7' };

// ---------- easing ----------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const eOut = p => 1 - Math.pow(1 - p, 4);
export const eIn = p => p * p * p;
export const eInOut = p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2;
export const backOut = (p, c = 1.7) => 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
export const lerp = (a, b, p) => a + (b - a) * p;
export function rngf(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------- canvas helpers ----------
export function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { c, ctx: c.getContext('2d'), t };
}
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function paperGrain(ctx, w, h, seed, a = .05) {
  const r = rngf(seed);
  for (let i = 0; i < w * h / 60; i++) { ctx.fillStyle = r() > .5 ? `rgba(0,0,0,${a * r()})` : `rgba(255,255,255,${a * 1.5 * r()})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
}

// ---------- stage ----------
export function makeStage(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = .55;
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 100); cam.position.set(0, 0, CZ);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e2d6, 1.9));
  const key = new THREE.DirectionalLight(0xfff8ee, 1.25); key.position.set(-1.2, 2.0, 4.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 18; key.shadow.blurSamples = 24; key.shadow.bias = -0.0006;
  const sc = key.shadow.camera; sc.left = -2.4; sc.right = 2.4; sc.top = 2.4; sc.bottom = -2.4; sc.near = .5; sc.far = 12;
  scene.add(key);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: .1 }));
  catcher.position.z = -.75; catcher.receiveShadow = true; scene.add(catcher);
  return { r, scene, cam, key, catcher };
}

// ---------- paper geometry: curled plane ----------
function curledPlane(w, h, curl = .12, wave = .015, seg = 24) {
  const g = new THREE.PlaneGeometry(w, h, seg, seg), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), v = (y + h / 2) / h; // 0 bottom .. 1 top
    const lift = curl * Math.pow(Math.max(0, .45 - v) / .45, 2);
    p.setZ(i, lift + wave * Math.sin(x / w * 5 + y * 3));
  }
  g.computeVertexNormals(); return g;
}
function paperMat(tex, opts = {}) {
  return new THREE.MeshStandardMaterial({ map: tex, roughness: .92, metalness: 0, side: THREE.DoubleSide, ...opts });
}
function shadowed(m) { m.castShadow = true; m.receiveShadow = true; return m; }

// ---------- sticky note ----------
export function makeNote(lines, seed = 1, size = .62, color = C.note) {
  const { ctx, t } = canvasTex(640, 640);
  const g = ctx.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, color); g.addColorStop(1, '#F5D45F');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 640);
  ctx.fillStyle = 'rgba(160,120,0,.08)'; ctx.fillRect(0, 0, 640, 90);
  paperGrain(ctx, 640, 640, seed, .06);
  ctx.fillStyle = '#23262E'; ctx.textAlign = 'center';
  const r = rngf(seed + 3);
  lines.forEach((l, i) => {
    ctx.save(); ctx.translate(320, 250 + i * 150 - (lines.length - 1) * 40); ctx.rotate((r() - .5) * .08);
    ctx.font = `700 ${l.size || 132}px Caveat`; ctx.fillText(l.text, 0, 0); ctx.restore();
  });
  const m = shadowed(new THREE.Mesh(curledPlane(size, size, .1), paperMat(t)));
  m.userData.draw = (newLines) => { /* placeholder for flips */ };
  return m;
}
// double-sided note whose back can carry different writing (for the final flip)
export function makeFlipNote(front, back, seed = 9, size = .9) {
  const g = new THREE.Group();
  const a = makeNote(front, seed, size); const b = makeNote(back, seed + 1, size);
  b.rotation.y = Math.PI; b.position.z = -.002;
  a.material.side = THREE.FrontSide; b.material.side = THREE.FrontSide;
  g.add(a, b); return g;
}

// ---------- receipt ----------
export function makeReceipt(title, rows, total, seed = 2, wid = .5, hei = 1.05) {
  const CW = 500, CH = Math.round(500 * hei / wid);
  const { ctx, t } = canvasTex(CW, CH);
  ctx.beginPath(); const z = 22; ctx.moveTo(0, z);
  for (let x = 0; x <= CW; x += z * 2) { ctx.lineTo(x + z, 0); ctx.lineTo(x + 2 * z, z); }
  ctx.lineTo(CW, CH - z); for (let x = CW; x >= 0; x -= z * 2) { ctx.lineTo(x - z, CH); ctx.lineTo(x - 2 * z, CH - z); }
  ctx.closePath(); ctx.fillStyle = C.paper; ctx.fill(); ctx.save(); ctx.clip();
  paperGrain(ctx, CW, CH, seed, .05);
  ctx.fillStyle = '#2A2A2A'; ctx.textAlign = 'center'; ctx.font = '700 46px "JetBrains Mono"'; ctx.fillText(title, CW / 2, 120);
  ctx.font = '400 24px "JetBrains Mono"'; ctx.fillStyle = '#6B6B6B'; ctx.fillText('12 NOV  ·  21:47', CW / 2, 165);
  ctx.strokeStyle = '#9A9A9A'; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 200); ctx.lineTo(CW - 40, 200); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#2A2A2A'; ctx.font = '400 30px "JetBrains Mono"';
  rows.forEach(([a, b], i) => { ctx.fillText(a, 44, 260 + i * 50); ctx.textAlign = 'right'; ctx.fillText(b, CW - 44, 260 + i * 50); ctx.textAlign = 'left'; });
  const ty = 260 + rows.length * 50 + 30;
  ctx.beginPath(); ctx.moveTo(40, ty - 30); ctx.lineTo(CW - 40, ty - 30); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '700 40px "JetBrains Mono"'; ctx.fillText('TOTAL', 44, ty + 22); ctx.textAlign = 'right'; ctx.fillText(total, CW - 44, ty + 22); ctx.textAlign = 'left';
  const br = rngf(seed + 7); let x = 60; ctx.fillStyle = '#2A2A2A';
  while (x < CW - 60) { const bw = 2 + Math.floor(br() * 6); ctx.fillRect(x, CH - 190, bw, 90); x += bw + 2 + Math.floor(br() * 5); }
  ctx.restore();
  const geo = curledPlane(wid, hei, .05, .02);
  const m = shadowed(new THREE.Mesh(geo, paperMat(t, { transparent: true, alphaTest: .5 })));
  return m;
}

// ---------- concert ticket ----------
export function makeTicket(seed = 4, wid = 1.0, hei = .42) {
  const CW = 1000, CH = 420; const { ctx, t } = canvasTex(CW, CH);
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, 30);
  ctx.moveTo(740 + 26, 0); ctx.arc(740, 0, 26, 0, Math.PI, false); ctx.moveTo(740 + 26, CH); ctx.arc(740, CH, 26, 0, Math.PI, true);
  ctx.fillStyle = C.deep; ctx.fill('evenodd'); ctx.clip('evenodd');
  const gl = ctx.createRadialGradient(200, 60, 10, 200, 60, 700); gl.addColorStop(0, 'rgba(96,205,255,.45)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, CW, CH);
  paperGrain(ctx, CW, CH, seed, .08);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '600 30px "JetBrains Mono"'; ctx.fillText('LIVE  ·  FRI 14 NOV', 60, 90);
  ctx.font = '800 92px "Plus Jakarta Sans"'; ctx.fillText('The Lanterns', 56, 210);
  ctx.font = '500 32px "JetBrains Mono"'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('ROW F  ·  SEAT 12', 60, 300);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(740, 40); ctx.lineTo(740, CH - 40); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 80px "Plus Jakarta Sans"'; ctx.textAlign = 'center'; ctx.fillText('$90', 870, 235);
  ctx.font = '500 26px "JetBrains Mono"'; ctx.fillText('ADMIT 2', 870, 295);
  ctx.restore();
  return shadowed(new THREE.Mesh(curledPlane(wid, hei, .03, .012), paperMat(t, { transparent: true, alphaTest: .5, roughness: .6 })));
}

// ---------- coin ----------
export function makeCoin(r = .1, seed = 5) {
  const { ctx, t } = canvasTex(512, 512);
  const rg = ctx.createRadialGradient(190, 170, 20, 256, 256, 300); rg.addColorStop(0, '#F4F4F2'); rg.addColorStop(1, '#AEB3B9');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(40,40,40,.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(256, 256, 220, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(40,44,52,.75)'; ctx.font = '800 250px "Plus Jakarta Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 256, 268);
  const g = new THREE.Group();
  const cyl = new THREE.CylinderGeometry(r, r, r * .15, 80); cyl.rotateX(Math.PI / 2);
  const edge = shadowed(new THREE.Mesh(cyl, new THREE.MeshStandardMaterial({ color: 0xBFC4CA, metalness: 1, roughness: .32 })));
  const face = new THREE.MeshStandardMaterial({ map: t, metalness: .85, roughness: .3 });
  const f = new THREE.Mesh(new THREE.CircleGeometry(r * .985, 80), face); f.position.z = r * .075 + .001;
  const b = f.clone(); b.rotation.y = Math.PI; b.position.z = -f.position.z;
  g.add(edge, f, b); return g;
}

// ---------- paper plane (classic dart) ----------
export function makePlane(scale = .5) {
  const { ctx, t } = canvasTex(256, 256); ctx.fillStyle = C.note; ctx.fillRect(0, 0, 256, 256); paperGrain(ctx, 256, 256, 11, .06);
  const v = [0, 0, .62, -.44, .11, -.4, 0, 0, -.4, .44, .11, -.4, 0, -.16, -.4];
  const idx = [0, 1, 2, 0, 2, 3, 0, 4, 2, 0, 2, 4];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([.5, 1, 0, 0, .5, 0, 1, 0, .5, .2], 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = shadowed(new THREE.Mesh(geo, paperMat(t, { roughness: .85, emissive: new THREE.Color('#FFE27A'), emissiveIntensity: .08, flatShading: true, color: new THREE.Color('#F2C94C') })));
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(scale); return g;
}

// ---------- phone ----------
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
export const SW = 1000, SH = 2172;
export function makePhone(screenTex) {
  const g = new THREE.Group();
  const body = shadowed(new THREE.Mesh(new RoundedBoxGeometry(0.76, 1.58, 0.085, 8, 0.12),
    new THREE.MeshPhysicalMaterial({ color: 0xE9E6E1, metalness: .85, roughness: .3, clearcoat: 1, clearcoatRoughness: .15 })));
  const bezel = new THREE.Mesh(roundedPlane(0.738, 1.558, 0.105), new THREE.MeshBasicMaterial({ color: 0x050608 })); bezel.position.z = .0428;
  const screen = new THREE.Mesh(roundedPlane(0.70, 1.52, 0.085), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })); screen.position.z = .0432;
  const glass = new THREE.Mesh(roundedPlane(0.738, 1.558, 0.105), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .1, clearcoat: 1 })); glass.position.z = .0436;
  g.add(body, bezel, screen, glass); g.userData.screen = screen; return g;
}
// original "send money" screen (not a copy of any real app UI)
export function drawSend(ctx, st) {
  const { name = 'Maya', initial = 'M', avatar = '#F2A65A', amount = '$24.00', memo = 'Pizza night', sent = 0, press = 0 } = st;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = '#111'; ctx.font = '700 42px "Plus Jakarta Sans"'; ctx.fillText('9:41', 80, 98);
  ctx.fillStyle = '#050608'; rr(ctx, SW / 2 - 130, 40, 260, 78, 39); ctx.fill();
  ctx.fillStyle = '#111'; for (let i = 0; i < 4; i++) { rr(ctx, 790 + i * 22, 86 - i * 7, 14, 12 + i * 7, 3); ctx.fill(); }
  rr(ctx, 890, 70, 52, 28, 7); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke(); rr(ctx, 894, 74, 36, 20, 4); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = '700 44px "Plus Jakarta Sans"'; ctx.fillText('Send', SW / 2, 240);
  // recipient
  ctx.fillStyle = avatar; ctx.beginPath(); ctx.arc(SW / 2, 470, 120, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 110px "Plus Jakarta Sans"'; ctx.fillText(initial, SW / 2, 508);
  ctx.fillStyle = '#111'; ctx.font = '700 56px "Plus Jakarta Sans"'; ctx.fillText(name, SW / 2, 680);
  ctx.fillStyle = '#111'; ctx.font = '800 190px "Plus Jakarta Sans"'; ctx.fillText(amount, SW / 2, 960);
  ctx.fillStyle = '#F2F2EF'; rr(ctx, SW / 2 - 230, 1030, 460, 100, 50); ctx.fill();
  ctx.fillStyle = '#555'; ctx.font = '600 40px "Plus Jakarta Sans"'; ctx.fillText(memo, SW / 2, 1094);
  // button -> sent state
  const by = 1820, bh = 170;
  ctx.save(); ctx.translate(SW / 2, by + bh / 2); ctx.scale(1 - press * .04, 1 - press * .04); ctx.translate(-SW / 2, -(by + bh / 2));
  ctx.fillStyle = C.deep; rr(ctx, 80, by, 840, bh, 85); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = '700 56px "Plus Jakarta Sans"';
  ctx.globalAlpha = 1 - sent; ctx.fillText('Send', SW / 2, by + 104);
  ctx.globalAlpha = sent; ctx.fillText('Sent', SW / 2 + 34, by + 104);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(SW / 2 - 96, by + 86); ctx.lineTo(SW / 2 - 72, by + 110); ctx.lineTo(SW / 2 - 30, by + 64); ctx.stroke();
  ctx.globalAlpha = 1;
  if (sent > 0) { // soft success ring around the amount
    ctx.strokeStyle = `rgba(0,140,255,${.35 * sent})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(SW / 2, 470, 120 + 40 * sent, 0, 7); ctx.stroke();
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111'; rr(ctx, SW / 2 - 140, SH - 40, 280, 10, 5); ctx.fill();
}
export function makeSendPhone(st) {
  const tex = canvasTex(SW, SH); drawSend(tex.ctx, st); tex.t.needsUpdate = true;
  const p = makePhone(tex.t); p.userData.tex = tex; return p;
}
