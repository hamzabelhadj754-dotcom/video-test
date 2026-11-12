// 3D choreography for "SETTLED." (20s). Every transform is a pure function of t.
import * as THREE from 'three';
import { makeStage, makeNote, makeFlipNote, makeReceipt, makeCoin, makePlane, makePhone, canvasTex, rr,
  sx, sy, clamp, prog, eOut, eIn, eInOut, backOut, lerp, SW, SH, C } from './world.js';

const S = {};
const P = [
  { name: 'Maya', initial: 'M', avatar: '#F2A65A', amount: '$24.00', memo: 'Pizza night', on: 0, sent: 4.85 },
  { name: 'Leo', initial: 'L', avatar: '#6DB08A', amount: '$18.50', memo: 'Taxi home', on: 6.0, sent: 7.3 },
  { name: 'Ava', initial: 'A', avatar: '#E07A8F', amount: '$45.00', memo: 'Concert · half', on: 8.0, sent: 9.3 },
  { name: 'Sam', initial: 'S', avatar: '#6F8FD8', amount: '$6.50', memo: 'Coffee', on: 10.5, sent: 11.5 },
];

// ---------- phone screen ----------
function chrome(ctx) {
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = '#111'; ctx.font = '700 42px "Plus Jakarta Sans"'; ctx.textAlign = 'left'; ctx.fillText('9:41', 80, 98);
  ctx.fillStyle = '#050608'; rr(ctx, SW / 2 - 130, 40, 260, 78, 39); ctx.fill();
  ctx.fillStyle = '#111'; for (let i = 0; i < 4; i++) { rr(ctx, 790 + i * 22, 86 - i * 7, 14, 12 + i * 7, 3); ctx.fill(); }
  rr(ctx, 890, 70, 52, 28, 7); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke(); rr(ctx, 894, 74, 36, 20, 4); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = '700 44px "Plus Jakarta Sans"'; ctx.fillText('Send', SW / 2, 240);
  ctx.fillStyle = '#111'; rr(ctx, SW / 2 - 140, SH - 40, 280, 10, 5); ctx.fill();
}
function content(ctx, p, sent, press, ox, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(ox, 0); ctx.textAlign = 'center';
  if (sent > 0) { ctx.strokeStyle = `rgba(0,140,255,${.4 * sent})`; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(SW / 2, 470, 120 + 46 * sent, 0, 7); ctx.stroke(); }
  ctx.fillStyle = p.avatar; ctx.beginPath(); ctx.arc(SW / 2, 470, 120, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 110px "Plus Jakarta Sans"'; ctx.fillText(p.initial, SW / 2, 508);
  ctx.fillStyle = '#111'; ctx.font = '700 56px "Plus Jakarta Sans"'; ctx.fillText(p.name, SW / 2, 680);
  ctx.font = '800 190px "Plus Jakarta Sans"'; ctx.fillText(p.amount, SW / 2, 960);
  ctx.fillStyle = '#F2F2EF'; ctx.font = '600 40px "Plus Jakarta Sans"';
  const mw = ctx.measureText(p.memo).width + 110; rr(ctx, SW / 2 - mw / 2, 1030, mw, 100, 50); ctx.fill();
  ctx.fillStyle = '#555'; ctx.fillText(p.memo, SW / 2, 1094);
  const by = 1820, bh = 170;
  ctx.save(); ctx.translate(SW / 2, by + bh / 2); ctx.scale(1 - press * .045, 1 - press * .045); ctx.translate(-SW / 2, -(by + bh / 2));
  ctx.fillStyle = sent > 0 ? `rgb(${lerp(0, 0, sent)},${lerp(41, 140, sent * .0)},${lerp(145, 145, sent)})` : C.deep; rr(ctx, 80, by, 840, bh, 85); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = '700 56px "Plus Jakarta Sans"';
  ctx.globalAlpha = a * (1 - sent); ctx.fillText('Send', SW / 2, by + 104);
  ctx.globalAlpha = a * sent; ctx.fillText('Sent', SW / 2 + 34, by + 104);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(SW / 2 - 96, by + 86); ctx.lineTo(SW / 2 - 72, by + 110); ctx.lineTo(SW / 2 - 30, by + 64); ctx.stroke();
  ctx.restore();
}
function drawScreen(ctx, t) {
  chrome(ctx);
  let i = 0; for (let k = 0; k < P.length; k++) if (t >= P[k].on) i = k;
  const p = P[i], k = i > 0 ? eInOut(prog(t, p.on, p.on + .4)) : 1;
  const st = q => eOut(prog(t, q.sent, q.sent + .22));
  const pr = q => (t > q.sent - .12 && t < q.sent + .14) ? Math.sin(prog(t, q.sent - .12, q.sent + .14) * Math.PI) : 0;
  if (k < 1 && i > 0) content(ctx, P[i - 1], st(P[i - 1]), 0, -k * 260, 1 - k);
  content(ctx, p, st(p), pr(p), (1 - k) * 260, k);
}

// ---------- ticket split into body + stub (shared texture, split UVs) ----------
function ticketParts() {
  const CW = 1000, CH = 420; const { ctx, t } = canvasTex(CW, CH);
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, 30);
  ctx.moveTo(766, 0); ctx.arc(740, 0, 26, 0, Math.PI, false); ctx.moveTo(766, CH); ctx.arc(740, CH, 26, 0, Math.PI, true);
  ctx.fillStyle = C.deep; ctx.fill('evenodd'); ctx.clip('evenodd');
  const gl = ctx.createRadialGradient(200, 60, 10, 200, 60, 700); gl.addColorStop(0, 'rgba(96,205,255,.45)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '600 30px "JetBrains Mono"'; ctx.fillText('LIVE  ·  FRI 14 NOV', 60, 90);
  ctx.font = '800 92px "Plus Jakarta Sans"'; ctx.fillText('The Lanterns', 56, 210);
  ctx.font = '500 32px "JetBrains Mono"'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('ROW F  ·  SEAT 12', 60, 300);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(740, 40); ctx.lineTo(740, CH - 40); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 80px "Plus Jakarta Sans"'; ctx.textAlign = 'center'; ctx.fillText('$90', 870, 235);
  ctx.font = '500 26px "JetBrains Mono"'; ctx.fillText('ADMIT 2', 870, 295); ctx.restore();
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .6, side: THREE.DoubleSide, transparent: true, alphaTest: .5 });
  const W0 = 1.0, H0 = .42, cut = .74;
  const part = (u0, u1) => {
    const g = new THREE.PlaneGeometry(W0 * (u1 - u0), H0, 16, 8), uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) { uv.setX(i, u0 + uv.getX(i) * (u1 - u0)); p.setZ(i, .012 * Math.sin(p.getX(i) * 6)); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  };
  const body = part(0, cut), stub = part(cut, 1);
  body.position.x = -W0 / 2 + W0 * cut / 2; stub.position.x = -W0 / 2 + W0 * cut + W0 * (1 - cut) / 2;
  const g = new THREE.Group(); g.add(body, stub); return { g, body, stub };
}

// ---------- build ----------
export function init(canvas) {
  const st = makeStage(canvas); Object.assign(S, st);
  S.tex = canvasTex(SW, SH);
  S.phone = makePhone(S.tex.t); S.phone.scale.setScalar(1.12);
  S.phonePivot = new THREE.Group(); S.phonePivot.add(S.phone); st.scene.add(S.phonePivot);
  S.pizza = makeNote([{ text: 'Pizza' }, { text: '$24 — Maya', size: 96 }], 1); st.scene.add(S.pizza);
  S.plane = makePlane(.62); st.scene.add(S.plane);
  S.receipt = makeReceipt('CITY TAXI', [['FARE', '15.50'], ['TIP', '3.00']], '$18.50', 2); st.scene.add(S.receipt);
  S.ticket = ticketParts(); st.scene.add(S.ticket.g);
  S.coins = [makeCoin(.1, 5), makeCoin(.09, 6), makeCoin(.08, 7)]; S.coins.forEach(c => st.scene.add(c));
  S.owe = makeFlipNote([{ text: 'you owe', size: 100 }, { text: 'me one :)', size: 100 }], [{ text: 'Settled.', size: 170 }], 9, .5);
  st.scene.add(S.owe);
}

const V = (x, y, z) => new THREE.Vector3(sx(x), sy(y), z);
function screenPoint(px, py) {
  const v = new THREE.Vector3((px / SW - .5) * 0.70, (.5 - py / SH) * 1.52, 0.05);
  S.phone.updateMatrixWorld(true); return S.phone.localToWorld(v);
}
function bob(o, t, ph, amp = 1) { o.position.y += Math.sin(t * 1.1 + ph) * .018 * amp; o.rotation.z += Math.sin(t * .8 + ph) * .03 * amp; o.rotation.x += Math.sin(t * .7 + ph * 2) * .03 * amp; }
const qbez = (a, b, c, p) => a.clone().multiplyScalar((1 - p) ** 2).add(b.clone().multiplyScalar(2 * (1 - p) * p)).add(c.clone().multiplyScalar(p * p));
function setPose(o, pos, rot, s) { o.position.copy(pos); o.rotation.set(rot[0], rot[1], rot[2]); if (s !== undefined) o.scale.setScalar(s); }
const intro = (t, i) => eOut(prog(t, .05 + i * .07, .95 + i * .07));   // objects drift in from depth

// ---------- per-frame ----------
let lastSig = '';
function screenSig(t) {
  let i = 0; for (let k = 0; k < P.length; k++) if (t >= P[k].on) i = k;
  const p = P[i], k = i > 0 ? eInOut(prog(t, p.on, p.on + .4)) : 1;
  const st = q => eOut(prog(t, q.sent, q.sent + .22)).toFixed(4);
  const pr = q => (t > q.sent - .12 && t < q.sent + .14) ? Math.sin(prog(t, q.sent - .12, q.sent + .14) * Math.PI).toFixed(4) : '0';
  return [i, k.toFixed(4), st(p), pr(p), i > 0 ? st(P[i - 1]) : ''].join('|');
}
export function render3d(t) {
  const sig = screenSig(t);                      // only redraw/upload the phone screen when it changes
  if (sig !== lastSig) { drawScreen(S.tex.ctx, t); S.tex.t.needsUpdate = true; lastSig = sig; }

  // phone: floats right of centre, then becomes the receiver, then leaves
  const pc = eInOut(prog(t, 2.5, 3.3)), pout = eIn(prog(t, 12.4, 13.2));
  S.phonePivot.position.copy(V(lerp(620, 560, pc) + pout * 260, lerp(800, 790, pc) + pout * 700, lerp(-.6, 0, intro(t, 0)) - pout * 1.5));
  S.phonePivot.rotation.set(lerp(-.1, -.06, pc) - pout * .5, lerp(-.28, -.12, pc) - pout * .6, lerp(.05, .02, pc) + pout * .5);
  S.phonePivot.position.y += Math.sin(t * .9) * .012; S.phonePivot.rotation.y += Math.sin(t * .6) * .02;
  S.phonePivot.visible = t < 13.3;

  // 1) pizza note -> folds into a plane -> flies to Maya
  const pz0 = V(255, 560, .55), pz1 = V(340, 520, 1.05);
  const lift = eInOut(prog(t, 3.0, 3.6)), fold = eIn(prog(t, 3.6, 3.86));
  setPose(S.pizza, pz0.clone().lerp(pz1, lift).add(new THREE.Vector3(0, 0, -.6 * (1 - intro(t, 1)))), [lerp(.25, .05, lift), lerp(.35, 0, lift) + fold * 1.1, lerp(-.2, -.08, lift)], 1);
  if (t < 3.0) bob(S.pizza, t, 1);
  S.pizza.scale.set(1 - fold * .92, 1 - fold * .55, 1);
  S.pizza.visible = t < 3.86;
  const fl = prog(t, 3.84, 4.82), target = screenPoint(500, 470);
  S.plane.visible = t >= 3.84 && t < 4.86;
  if (S.plane.visible) {
    const e = eInOut(fl), a = pz1.clone(), c = target.clone(); const b = V(560, 330, 1.35);
    const pos = qbez(a, b, c, e), nxt = qbez(a, b, c, Math.min(1, e + .02));
    S.plane.position.copy(pos); S.plane.lookAt(nxt); S.plane.rotateZ(-.5 + Math.sin(fl * Math.PI) * .35);
    S.plane.scale.setScalar(.62 * backOut(clamp(prog(t, 3.84, 4.0)), 2.2) * (1 - eIn(prog(t, 4.7, 4.86)) * .95));
  }

  // 2) taxi receipt -> rolls up into a tube -> shoots into the phone
  const r0 = V(930, 930, .25), r1 = V(840, 640, .9);
  const rl = eInOut(prog(t, 6.0, 6.5)), roll = eInOut(prog(t, 6.5, 6.9)), rs = eIn(prog(t, 6.9, 7.28));
  const rp = r0.clone().lerp(r1, rl).add(new THREE.Vector3(0, 0, -.6 * (1 - intro(t, 2))));
  if (rs > 0) rp.lerp(screenPoint(500, 1000), rs);
  setPose(S.receipt, rp, [lerp(.15, 0, rl) + roll * Math.PI * 3, lerp(-.45, 0, rl), lerp(.22, -.05, rl) + rs * 1.2], 1);
  if (t < 6.0) bob(S.receipt, t, 2);
  S.receipt.scale.set(1 - rs * .8, (1 - roll * .86) * (1 - rs * .8), 1);
  S.receipt.visible = t < 7.28;

  // 3) concert ticket -> tears at the perforation, stub tumbles away, ticket flies in (half: $45)
  const k0 = V(250, 1235, .45), k1 = V(250, 600, .95);
  const kl = eInOut(prog(t, 8.0, 8.5)), tear = prog(t, 8.55, 9.6), ks = eIn(prog(t, 8.8, 9.28));
  const kp = k0.clone().lerp(k1, kl).add(new THREE.Vector3(0, 0, -.6 * (1 - intro(t, 3))));
  setPose(S.ticket.g, kp, [lerp(-.35, 0, kl), lerp(.3, 0, kl), lerp(-.14, .04, kl)], 1);
  if (t < 8.0) bob(S.ticket.g, t, 3);
  const tb = eOut(clamp(tear * 3));
  S.ticket.stub.position.set(.37 + tb * .12 + eIn(tear) * 1.6, -eIn(tear) * 2.2, eIn(tear) * .4);
  S.ticket.stub.rotation.set(eIn(tear) * 4, eIn(tear) * 2, -tb * .35 - eIn(tear) * 3);
  const bodyTarget = screenPoint(500, 1000).sub(kp);
  S.ticket.body.position.set(-.13 + bodyTarget.x * ks, bodyTarget.y * ks, bodyTarget.z * ks);
  S.ticket.body.rotation.set(0, 0, tb * .08 + ks * .8); S.ticket.body.scale.setScalar(1 - ks * .85);
  S.ticket.body.visible = t < 9.28; S.ticket.stub.visible = t < 9.7;

  // 4) coins arc into the phone, one by one
  const cpos = [V(830, 1215, .7), V(165, 830, .3), V(730, 1290, .2)], crot = [[.6, -.5, .2], [-.4, .9, 0], [1.2, .2, 0]];
  S.coins.forEach((c, i) => {
    const t0 = 10.55 + i * .16, ca = prog(t, t0, t0 + .62), e = eInOut(ca);
    const a = cpos[i].clone().add(new THREE.Vector3(0, 0, -.6 * (1 - intro(t, 4 + i)))), end = screenPoint(500, 960);
    const ctrl = a.clone().lerp(end, .5).add(new THREE.Vector3(0, .9, .8));
    c.position.copy(e > 0 ? qbez(a, ctrl, end, e) : a);
    c.rotation.set(crot[i][0] + e * 9, crot[i][1] + e * 4, crot[i][2]);
    if (t < 10.55) bob(c, t, 4 + i, 1.4);
    c.scale.setScalar(1 - eIn(prog(t, t0 + .45, t0 + .62)) * .9);
    c.visible = t < t0 + .62;
  });

  // 5) the last note drifts in, grows and flips: "Settled."
  const o0 = V(905, 330, -.25), o1 = V(560, 700, .55), o2 = V(600, 830, .2);
  const ol = eInOut(prog(t, 12.7, 14.0)), flip = eInOut(prog(t, 14.2, 14.75)), oe = eInOut(prog(t, 15.0, 16.0));
  const op = o0.clone().add(new THREE.Vector3(0, 0, -.6 * (1 - intro(t, 7)))).lerp(o1, ol).lerp(o2, oe);
  setPose(S.owe, op, [lerp(-.2, 0, ol) + flip * .0 + oe * .08, lerp(-.3, 0, ol) + flip * Math.PI + oe * .18, lerp(.16, -.03, ol) - oe * .04], lerp(1, 2.05, ol));
  S.owe.position.z += Math.sin(flip * Math.PI) * .35;                  // lifts toward camera while flipping
  if (t < 12.7) bob(S.owe, t, 7); else bob(S.owe, t, 7, .35);

  // camera: slow push, a touch of drift
  S.cam.position.set(Math.sin(t * .35) * .04, Math.sin(t * .27) * .03, 5 - eInOut(prog(t, 0, 12)) * .25 + eInOut(prog(t, 12.4, 16)) * .25);
  S.cam.lookAt(0, 0, 0);
  S.r.render(S.scene, S.cam);
}
