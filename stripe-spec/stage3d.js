// 3D layer for "One Second" v02. Every object is a pure function of t (deterministic renders).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1350, FOV = 30, CZ = 5;
const UPP = 2 * CZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) / H; // world units per pixel at z=0
const sx = x => (x - W / 2) * UPP, sy = y => (H / 2 - y) * UPP;

// ---------- easing ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = p => 1 - Math.pow(1 - p, 4);
const eIn = p => p * p * p * p;
const eInOut = p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2;
const backOut = p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const lerp = (a, b, p) => a + (b - a) * p;
const mix = (c1, c2, p) => { const a = new THREE.Color(c1), b = new THREE.Color(c2); return '#' + a.lerp(b, p).getHexString(); };

// ---------- helpers ----------
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
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function canvasTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { c, ctx: c.getContext('2d'), t };
}
function makeStage(canvas, envIntensity = 1) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 100); cam.position.set(0, 0, CZ);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9f9bff, 1.2); rim.position.set(3, -1, -2); scene.add(rim);
  return { r, scene, cam, key, rim };
}

// ---------- screen artwork (original UI, drawn with the film's fonts) ----------
const SW = 1000, SH = 2172;
function mugArt(ctx, x, y, w, h) {
  ctx.save(); rr(ctx, x, y, w, h, Math.min(w, h) * .1); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#EFE6DA'); g.addColorStop(1, '#D9C7B0');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const k = Math.min(w / 860, h / 640);            // artwork designed at 860x640, scaled to fit the box
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
  const cx = 0, cy = 38;
  ctx.fillStyle = 'rgba(80,50,20,.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 200, 230, 34, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#E9E1D6'; ctx.lineWidth = 46; ctx.beginPath(); ctx.arc(cx + 175, cy, 92, -1.2, 1.2); ctx.stroke();
  const mg = ctx.createLinearGradient(cx - 170, 0, cx + 170, 0); mg.addColorStop(0, '#DCD3C6'); mg.addColorStop(.35, '#FBF8F3'); mg.addColorStop(1, '#CFC5B6');
  ctx.fillStyle = mg; rr(ctx, cx - 170, cy - 200, 340, 400, [24, 24, 70, 70]); ctx.fill();
  ctx.fillStyle = '#E7DFD3'; ctx.beginPath(); ctx.ellipse(cx, cy - 200, 170, 26, 0, 0, 7); ctx.fill();
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  ctx.fillStyle = 'rgba(70,55,40,.55)';
  for (let i = 0; i < 140; i++) { const px = cx - 150 + rnd() * 300, py = cy - 170 + rnd() * 360; ctx.beginPath(); ctx.arc(px, py, 1.5 + rnd() * 3.2, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawCheckout(ctx, st) {
  ctx.fillStyle = '#F6F9FC'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = '#0A2540'; ctx.font = '600 42px Geist'; ctx.fillText('9:41', 80, 98);
  ctx.fillStyle = '#05070A'; rr(ctx, SW / 2 - 130, 40, 260, 78, 39); ctx.fill();
  ctx.fillStyle = '#0A2540'; for (let i = 0; i < 4; i++) { rr(ctx, 790 + i * 22, 98 - 12 - i * 7, 14, 12 + i * 7, 3); ctx.fill(); }
  rr(ctx, 890, 70, 52, 28, 7); ctx.strokeStyle = '#0A2540'; ctx.lineWidth = 3; ctx.stroke(); rr(ctx, 894, 74, 36, 20, 4); ctx.fill();
  ctx.font = '600 38px Geist'; ctx.textAlign = 'center'; ctx.fillText('Kiln & Co.', SW / 2, 222); ctx.textAlign = 'left';
  mugArt(ctx, 70, 280, 860, 640);
  ctx.fillStyle = '#0A2540'; ctx.font = '600 58px Geist'; ctx.fillText('Speckled mug', 80, 1030);
  ctx.textAlign = 'right'; ctx.fillText('€38.00', 920, 1030); ctx.textAlign = 'left';
  ctx.fillStyle = '#8C9EB1'; ctx.font = '500 36px Geist'; ctx.fillText('Handmade stoneware', 80, 1084);
  ctx.fillStyle = '#E5EDF5'; ctx.fillRect(80, 1135, 840, 3);
  const field = (x, y, w, label, val) => {
    ctx.fillStyle = '#425466'; ctx.font = '500 32px Geist'; ctx.fillText(label, x, y);
    ctx.fillStyle = '#fff'; rr(ctx, x, y + 22, w, 112, 24); ctx.fill(); ctx.strokeStyle = '#E5EDF5'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#0A2540'; ctx.font = '500 40px GeistMono'; ctx.fillText(val, x + 34, y + 92);
  };
  field(80, 1205, 840, 'Card', '•••• •••• •••• 4242');
  const bg = ctx.createLinearGradient(820, 0, 900, 0); bg.addColorStop(0, '#1A1F71'); bg.addColorStop(1, '#2B3AA8');
  ctx.fillStyle = bg; rr(ctx, 812, 1255, 76, 50, 9); ctx.fill();
  field(80, 1400, 410, 'Expiry', '12 / 29'); field(510, 1400, 410, 'CVC', '•••');
  // pay button
  const by = 1640, bh = 160, press = st.press || 0;
  ctx.save(); ctx.translate(SW / 2, by + bh / 2); ctx.scale(1 - press * .035, 1 - press * .035); ctx.translate(-SW / 2, -(by + bh / 2));
  ctx.shadowColor = 'rgba(99,91,255,' + (.55 * (1 - st.drain)) + ')'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  ctx.fillStyle = mix('#635BFF', '#9A97BF', st.drain); rr(ctx, 80, by, 840, bh, 34); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  const paid = st.paid || 0;
  ctx.globalAlpha = 1 - paid; ctx.font = '600 52px Geist'; ctx.fillText('Pay €38.00', SW / 2, by + 98 - paid * 30);
  ctx.globalAlpha = paid; ctx.save(); ctx.translate(0, (1 - paid) * 30);
  ctx.fillText('Paid', SW / 2 + 30, by + 98);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(SW / 2 - 92, by + 80); ctx.lineTo(SW / 2 - 70, by + 102); ctx.lineTo(SW / 2 - 30, by + 58); ctx.stroke(); ctx.restore();
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  // tap ripple (freezes with time)
  if (st.rip > 0) {
    const rx = 760, ry = by + bh / 2;
    ctx.strokeStyle = 'rgba(255,255,255,' + (.8 * st.ripA) + ')'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(rx, ry, 24 + st.rip * 70, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(99,91,255,' + (.45 * st.ripA) + ')'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(rx, ry, 30 + st.rip * 150, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (.35 * st.ripA) + ')'; ctx.beginPath(); ctx.arc(rx, ry, 34, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#0A2540'; rr(ctx, SW / 2 - 140, SH - 40, 280, 10, 5); ctx.fill();
}
function drawLock(ctx, note) {
  const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#1C2A5E'); g.addColorStop(.55, '#0E1838'); g.addColorStop(1, '#070C1E'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  const blob = (x, y, r, c) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, SW, SH); };
  blob(250, 1700, 700, 'rgba(99,91,255,.45)'); blob(850, 1500, 600, 'rgba(0,212,255,.22)');
  ctx.fillStyle = '#05070A'; rr(ctx, SW / 2 - 130, 40, 260, 78, 39); ctx.fill();
  ctx.fillStyle = 'rgba(246,249,252,.8)'; ctx.font = '500 42px Geist'; ctx.textAlign = 'center'; ctx.fillText('Thursday 12 November', SW / 2, 330);
  ctx.fillStyle = '#F6F9FC'; ctx.font = '500 250px Geist'; ctx.fillText('9:41', SW / 2, 590); ctx.textAlign = 'left';
  if (note > 0) {
    const p = backOut(clamp(note)), a = clamp(note * 3);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(SW / 2, 1025); ctx.scale(.7 + .3 * p, .7 + .3 * p); ctx.translate(-SW / 2, -1025);
    ctx.fillStyle = 'rgba(246,249,252,.96)'; rr(ctx, 40, 860, 920, 330, 56); ctx.fill();
    mugArt(ctx, 80, 905, 190, 190);
    ctx.fillStyle = '#8C9EB1'; ctx.font = '600 34px Geist'; ctx.fillText('KILN & CO.', 300, 950);
    ctx.textAlign = 'right'; ctx.fillText('now', 915, 950); ctx.textAlign = 'left';
    ctx.fillStyle = '#0A2540'; ctx.font = '600 66px Geist'; ctx.fillText('New payment', 300, 1035);
    ctx.fillStyle = '#635BFF'; ctx.font = '600 66px Geist'; ctx.fillText('€38.00', 300, 1112);
    ctx.fillStyle = '#425466'; ctx.font = '500 38px Geist'; ctx.textAlign = 'right'; ctx.fillText('Speckled mug', 915, 1112); ctx.textAlign = 'left';
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(246,249,252,.8)'; rr(ctx, SW / 2 - 140, SH - 40, 280, 10, 5); ctx.fill();
}
function makePhone(screenTex, frameColor = 0x1D2230) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.76, 1.58, 0.085, 8, 0.12),
    new THREE.MeshPhysicalMaterial({ color: frameColor, metalness: 0.9, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.12 }));
  const bezel = new THREE.Mesh(roundedPlane(0.738, 1.558, 0.105), new THREE.MeshBasicMaterial({ color: 0x030407 }));
  bezel.position.z = 0.0428;
  const screen = new THREE.Mesh(roundedPlane(0.70, 1.52, 0.085), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = 0.0432;
  const glass = new THREE.Mesh(roundedPlane(0.738, 1.558, 0.105),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.12, clearcoat: 1 }));
  glass.position.z = 0.0436;
  const btn = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.16, 0.03, 2, 0.005), body.material); btn.position.set(0.384, 0.3, 0);
  const btn2 = btn.clone(); btn2.position.set(-0.384, 0.38, 0); const btn3 = btn.clone(); btn3.position.set(-0.384, 0.18, 0);
  g.add(body, bezel, screen, glass, btn, btn2, btn3);
  g.userData.screen = screen;
  return g;
}
function contactShadow(w, h, a = .35) {
  const { c, ctx, t } = canvasTex(256, 256);
  const rg = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, `rgba(30,40,80,${a})`); rg.addColorStop(1, 'rgba(30,40,80,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  return m;
}

// ================== scenes ==================
const S = {};

// S1 + S6: the customer's phone
function buildCheckout(canvas) {
  const st = makeStage(canvas, 1.0);
  const tex = canvasTex(SW, SH);
  const phone = makePhone(tex.t);
  phone.scale.setScalar(1.3);
  const pivot = new THREE.Group(); pivot.add(phone); pivot.position.set(sx(540), sy(690), 0);
  const sh = contactShadow(1.6, .5); sh.rotation.x = -Math.PI / 2; sh.position.set(sx(540), sy(1300), -.4);
  st.scene.add(pivot, sh);
  return { ...st, tex, phone, pivot, sh };
}
// world position of a point on the phone screen (texture px)
function screenPoint(o, px, py) {
  const v = new THREE.Vector3((px / SW - .5) * 0.70, (.5 - py / SH) * 1.52, 0.044);
  o.phone.updateMatrixWorld(true); return o.phone.localToWorld(v);
}
function renderS1(t) {
  const o = S.s1;
  const rip = t < 1.2 ? 0 : t < 1.32 ? prog(t, 1.2, 1.32) * .55 : .55;           // ripple stops mid-way: time froze
  const drain = prog(t, 1.32, 1.5) * (1 - prog(t, 1.85, 2.05));
  const press = t > 1.2 && t < 1.45 ? Math.sin(prog(t, 1.2, 1.45) * Math.PI) : 0;
  drawCheckout(o.tex.ctx, { rip, ripA: t < 1.2 ? 0 : 1 - prog(t, 1.85, 2.0), drain, press, paid: 0 });
  o.tex.t.needsUpdate = true;
  // phone floats in, settles, drifts (frozen during the hold)
  const tin = eOut(prog(t, 0, 1.1));
  const tt = Math.min(t, 1.32) + Math.max(0, t - 1.32) * .08;
  o.pivot.rotation.set(lerp(-.32, -.12, tin) + Math.sin(tt * 1.3) * .015, lerp(.62, .2, tin) + Math.sin(tt * .9) * .02, lerp(.06, -.03, tin));
  o.pivot.position.y = sy(690) + lerp(-.35, 0, tin);
  o.sh.material.opacity = tin;
  // dive into the Pay button
  const d = eIn(prog(t, 1.85, 2.5));
  const target = screenPoint(o, 500, 1720);
  o.cam.position.set(lerp(0, target.x, d), lerp(0, target.y, d), lerp(CZ, target.z + .02, d));
  o.cam.lookAt(lerp(0, target.x, Math.min(1, d * 1.6)), lerp(0, target.y, Math.min(1, d * 1.6)), lerp(0, target.z, d));
  o.r.render(o.scene, o.cam);
}
function renderS6(t) {
  const o = S.s6;
  const paid = eOut(prog(t, 10.82, 11.1));
  const press = t > 10.84 && t < 11.1 ? Math.sin(prog(t, 10.84, 11.1) * Math.PI) * .6 : 0;
  drawCheckout(o.tex.ctx, { rip: 0, ripA: 0, drain: 0, press, paid });
  o.tex.t.needsUpdate = true;
  o.pivot.rotation.set(-.12 + Math.sin(t * 1.3) * .015, .2 + Math.sin(t * .9) * .02, -.03);
  o.sh.material.opacity = 1;
  // snap back: camera rockets out of the screen
  const z = eOut(prog(t, 10.5, 10.9));
  const target = screenPoint(o, 500, 1720);
  o.cam.position.set(lerp(target.x, 0, z), lerp(target.y, 0, z), lerp(target.z + .03, CZ, z));
  o.cam.lookAt(lerp(target.x, 0, z), lerp(target.y, 0, z), lerp(target.z, 0, z));
  o.r.render(o.scene, o.cam);
}

// S2: glossy card
function buildCard(canvas) {
  const st = makeStage(canvas, .55);
  const { c, ctx, t } = canvasTex(1712, 1080);
  const g = ctx.createLinearGradient(0, 0, 1712, 1080); g.addColorStop(0, '#7A73FF'); g.addColorStop(.45, '#635BFF'); g.addColorStop(1, '#2D22B8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1712, 1080);
  const blob = (x, y, r, col) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, 1712, 1080); };
  blob(1500, 120, 700, 'rgba(0,212,255,.45)'); blob(200, 1000, 700, 'rgba(255,89,150,.28)');
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(-100, 200 + i * 70); ctx.bezierCurveTo(500, 60 + i * 70, 1100, 420 + i * 70, 1800, 160 + i * 70); ctx.stroke(); }
  const cg = ctx.createLinearGradient(150, 380, 330, 520); cg.addColorStop(0, '#F3E2B3'); cg.addColorStop(1, '#BFA36A');
  ctx.fillStyle = cg; rr(ctx, 150, 380, 190, 145, 24); ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,30,.45)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(150, 452); ctx.lineTo(340, 452); ctx.moveTo(245, 380); ctx.lineTo(245, 525); ctx.moveTo(150, 415); ctx.lineTo(205, 415); ctx.moveTo(285, 490); ctx.lineTo(340, 490); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(420, 452, 34 + i * 26, -.75, .75); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.font = '500 92px GeistMono'; ctx.fillText('••••  ••••  ••••  4242', 150, 790);
  ctx.font = '500 52px GeistMono'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('12/29', 150, 920);
  ctx.font = '600 52px Geist'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('DEBIT', 1580, 920);
  const card = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.712, 1.08, 0.022, 4, 0.01), new THREE.MeshPhysicalMaterial({ color: 0x2D22B8, metalness: .6, roughness: .3 }));
  const face = new THREE.Mesh(roundedPlane(1.69, 1.06, 0.07), new THREE.MeshPhysicalMaterial({ map: t, metalness: .35, roughness: .32, clearcoat: 1, clearcoatRoughness: .08 }));
  face.position.z = 0.0115;
  card.add(body, face); card.scale.setScalar(.66);
  const pivot = new THREE.Group(); pivot.add(card); pivot.position.set(sx(540), sy(610), 0);
  st.scene.add(pivot);
  return { ...st, pivot };
}
function renderS2(t) {
  const o = S.s2, p = eOut(prog(t, 2.52, 3.6)), dr = t - 2.52;
  o.pivot.rotation.set(lerp(-1.1, -.62, p) + Math.sin(dr * .8) * .03, lerp(1.25, .34, p) - dr * .05, lerp(.5, .26, p));
  o.pivot.position.z = lerp(-.8, 0, p);
  o.key.position.set(-3 + dr * 2.4, 3, 3); // glint travels across the card
  o.r.render(o.scene, o.cam);
}

// S3: gyroscope
function buildGyro(canvas) {
  const st = makeStage(canvas, .5);
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xD9E2EC, metalness: 1, roughness: .18, clearcoat: 1 });
  const g = new THREE.Group(); g.position.set(sx(560), sy(620), 0);
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(.62, .014, 24, 220), metal);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(.5, .012, 24, 200), metal);
  const r3 = new THREE.Mesh(new THREE.TorusGeometry(.38, .01, 24, 180), new THREE.MeshPhysicalMaterial({ color: 0x8C9EB1, metalness: 1, roughness: .25 }));
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x00D4FF, toneMapped: false });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(.28, .016, 16, 160, .001), arcMat);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.07, 48, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0x635BFF, emissiveIntensity: 1.5, metalness: 0, roughness: .2, transmission: 0 }));
  const ticks = new THREE.Group();
  for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.006, i % 6 === 0 ? .06 : .03, .006), metal); const a = i / 24 * Math.PI * 2; m.position.set(Math.cos(a) * .74, Math.sin(a) * .74, 0); m.rotation.z = a + Math.PI / 2; ticks.add(m); }
  g.add(r1, r2, r3, arc, core, ticks); st.scene.add(g);
  return { ...st, g, r1, r2, r3, arc, core, ticks };
}
function renderS3(t) {
  const o = S.s3, d = t - 4.82;
  o.r1.rotation.set(1.15 + d * .35, .3 + d * .9, 0);
  o.r2.rotation.set(.2 + d * 1.1, 1.0 - d * .4, .3);
  o.r3.rotation.set(-.6 + d * .7, .4, d * 1.3);
  o.ticks.rotation.z = -d * .25;
  const a = eInOut(prog(t, 5.25, 6.0)) * Math.PI * 2 * .999;
  o.arc.geometry.dispose(); o.arc.geometry = new THREE.TorusGeometry(.28, .016, 16, 160, Math.max(.001, a));
  o.arc.rotation.z = Math.PI / 2;
  const pulse = prog(t, 5.3, 5.45) * (1 - prog(t, 5.45, 6.2));
  o.core.scale.setScalar(1 + pulse * .6 + (a >= 6.27 ? .15 : 0));
  o.g.position.z = lerp(-.6, 0, eOut(prog(t, 4.82, 5.5)));
  o.r.render(o.scene, o.cam);
}

// S4: coins (edge cylinder + separate face disc so the artwork maps cleanly)
function coinTex(label, face, ink, big) {
  const { c, ctx, t } = canvasTex(512, 512);
  const rg = ctx.createRadialGradient(190, 170, 20, 256, 256, 300); rg.addColorStop(0, face[0]); rg.addColorStop(1, face[1]);
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = ink; ctx.globalAlpha = .35; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(256, 256, 222, 0, 7); ctx.stroke();
  ctx.setLineDash([3, 14]); ctx.beginPath(); ctx.arc(256, 256, 196, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = big ? '600 270px Geist' : '600 118px GeistMono'; ctx.fillText(label, 256, big ? 270 : 262);
  return t;
}
function buildCoins(canvas) {
  const st = makeStage(canvas, .6);
  const coins = [];
  const mk = (label, x, y, r, face, ink, edge, big) => {
    const g = new THREE.Group();
    const cyl = new THREE.CylinderGeometry(r, r, r * .16, 96); cyl.rotateX(Math.PI / 2);
    const edgeMesh = new THREE.Mesh(cyl, new THREE.MeshPhysicalMaterial({ color: edge, metalness: 1, roughness: .3 }));
    const faceMat = new THREE.MeshPhysicalMaterial({ map: coinTex(label, face, ink, big), metalness: .45, roughness: .3, clearcoat: 1 });
    const front = new THREE.Mesh(new THREE.CircleGeometry(r * .985, 96), faceMat); front.position.z = r * .08 + .001;
    const back = front.clone(); back.rotation.y = Math.PI; back.position.z = -(r * .08 + .001);
    g.add(edgeMesh, front, back); g.position.set(sx(x), sy(y), 0); st.scene.add(g); coins.push(g); return g;
  };
  [['USD', 430], ['GBP', 540], ['JPY', 660], ['INR', 770]].forEach(([l, y]) => mk(l, 560, y, .1, ['#FFFFFF', '#C3CEDB'], '#0A2540', 0xC9D3DF, false));
  const eur = mk('€', 820, 600, .14, ['#9A94FF', '#4B40E0'], '#FFFFFF', 0x635BFF, true);
  return { ...st, coins, eur };
}
function renderS4(t) {
  const o = S.s4;
  o.coins.slice(0, 4).forEach((g, i) => {
    const p = eOut(prog(t, 7.25 + i * .04, 7.8 + i * .04));
    g.visible = t > 7.2;
    g.rotation.set(Math.sin(t * 1.3 + i) * .1 * p, lerp(Math.PI / 2, 0, p) + Math.sin(t * 1.1 + i * 2) * .14 * p, Math.sin(t + i) * .05);
    g.scale.setScalar(lerp(.5, 1, p));
  });
  const pe = prog(t, 7.75, 8.3);
  o.eur.visible = t > 7.75;
  o.eur.rotation.set(Math.sin(t * 1.2) * .08, (1 - eOut(pe)) * Math.PI * 2 + Math.sin(t) * .1, 0);
  o.eur.scale.setScalar(backOut(clamp(pe * 1.3)));
  o.r.render(o.scene, o.cam);
}

// S5: the merchant's phone
function buildMerchant(canvas) {
  const st = makeStage(canvas, .7);
  const tex = canvasTex(SW, SH);
  const phone = makePhone(tex.t, 0x2A2F3C); phone.scale.setScalar(1.22);
  const pivot = new THREE.Group(); pivot.add(phone); pivot.position.set(sx(690), sy(830), 0);
  st.scene.add(pivot);
  return { ...st, tex, phone, pivot };
}
function renderS5(t) {
  const o = S.s5;
  const note = prog(t, 9.3, 9.75);
  drawLock(o.tex.ctx, note); o.tex.t.needsUpdate = true;
  const p = eOut(prog(t, 8.82, 9.6)), d = t - 8.82;
  const buzz = t > 9.3 && t < 9.62 ? Math.sin((t - 9.3) * 110) * .035 * (1 - prog(t, 9.3, 9.62)) : 0;
  o.pivot.rotation.set(lerp(-.9, -.38, p) + Math.sin(d) * .02, lerp(-.7, -.26, p) - d * .03, lerp(.4, .14, p) + buzz);
  o.pivot.position.z = lerp(-1, 0, p) + buzz * .4;
  o.r.render(o.scene, o.cam);
}

// ================== public API ==================
const windows = { s1: [0, 2.56, renderS1], s2: [2.5, 4.9, renderS2], s3: [4.78, 6.9, renderS3], s4: [6.78, 8.9, renderS4], s5: [8.78, 10.55, renderS5], s6: [10.48, 11.55, renderS6] };
export function init() {
  S.s1 = buildCheckout(document.getElementById('gl1'));
  S.s2 = buildCard(document.getElementById('gl2'));
  S.s3 = buildGyro(document.getElementById('gl3'));
  S.s4 = buildCoins(document.getElementById('gl4'));
  S.s5 = buildMerchant(document.getElementById('gl5'));
  S.s6 = buildCheckout(document.getElementById('gl6'));
}
export function render3d(t) {
  for (const k in windows) { const [a, b, f] = windows[k]; if (t >= a && t < b) f(t); }
}
