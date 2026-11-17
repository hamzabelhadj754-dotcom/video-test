// TRAZO 3D e-bike, built from primitives (deterministic). Units: 1 = 100 design px.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildBike({ frameColor = '#ECE8DF', accent = '#FF5A1F' } = {}) {
  const bike = new THREE.Group();
  const M = {
    frame: new THREE.MeshPhysicalMaterial({ color: frameColor, roughness: .38, metalness: 0, clearcoat: 1, clearcoatRoughness: .12 }),
    accent: new THREE.MeshPhysicalMaterial({ color: accent, roughness: .3, clearcoat: 1, clearcoatRoughness: .08 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#141416', roughness: .82 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9cbcf', roughness: .22, metalness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1d1f23', roughness: .45, metalness: .4 }),
    leather: new THREE.MeshPhysicalMaterial({ color: '#2a201b', roughness: .6, sheen: .6 }),
  };
  const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const tube = (pts, r, mat, seg = 64) => {
    const curve = pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 20, false), mat);
    m.castShadow = true; m.receiveShadow = true; bike.add(m);
    // rounded caps
    [curve.getPoint(0), curve.getPoint(1)].forEach(p => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat); s.position.copy(p); s.castShadow = true; bike.add(s); });
    return curve;
  };

  // key points
  const RA = v(0, 0), FA = v(5.6, 0), BB = v(2.38, .12), SEAT = v(2.05, 2.32), HT0 = v(4.68, 2.05), HT1 = v(4.86, 2.68);

  // wheels
  const wheel = (c, motor) => {
    const g = new THREE.Group(); g.position.copy(c);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(1.5, .085, 24, 120), M.rubber); tire.castShadow = true; g.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.39, .032, 12, 120), M.metal); g.add(rim);
    const hubR = motor ? .34 : .1;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubR, hubR, motor ? .2 : .16, 48), M.dark); hub.rotation.x = Math.PI / 2; g.add(hub);
    if (motor) { const ring = new THREE.Mesh(new THREE.TorusGeometry(hubR, .022, 12, 64), M.accent); ring.position.z = .1; g.add(ring); }
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, side = i % 2 ? .07 : -.07;
      const p0 = v(Math.cos(a + .3) * hubR * .9, Math.sin(a + .3) * hubR * .9, side), p1 = v(Math.cos(a) * 1.37, Math.sin(a) * 1.37, 0);
      const len = p0.distanceTo(p1);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, len, 6), M.metal);
      s.position.copy(p0.clone().add(p1).multiplyScalar(.5)); s.quaternion.setFromUnitVectors(v(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(s);
    }
    bike.add(g); return g;
  };
  const rearWheel = wheel(RA, true), frontWheel = wheel(FA, false);

  // frame (step-through)
  const r = .068;
  tube([BB, SEAT], r, M.frame);
  tube([SEAT, v(1.98, 2.62)], .045, M.metal);
  const down = tube([BB, v(3.0, .55), v(4.0, 1.45), HT0], r * 1.15, M.frame);
  tube([HT0, HT1], r * 1.2, M.frame);
  for (const z of [-.09, .09]) {
    tube([v(0, 0, z), v(1.2, .08, z * 1.2), v(BB.x, BB.y, z * .6)], .04, M.frame);
    tube([v(0, 0, z), v(1.96, 2.14, z * .3)], .036, M.frame);
    tube([v(HT0.x, HT0.y, z * .3), v(5.1, 1.0, z), v(5.6, 0, z)], .038, M.frame);
  }
  // battery on the down tube
  const b0 = down.getPoint(.24), b1 = down.getPoint(.74), bdir = b1.clone().sub(b0), blen = bdir.length();
  const batt = new THREE.Mesh(new RoundedBoxGeometry(blen, .26, .24, 6, .09), M.accent);
  batt.position.copy(b0.clone().add(b1).multiplyScalar(.5)).add(v(-.08, .13, 0)); batt.rotation.z = Math.atan2(bdir.y, bdir.x); batt.castShadow = true; bike.add(batt);
  const cap = new THREE.Mesh(new RoundedBoxGeometry(.16, .28, .26, 4, .05), M.dark); cap.position.copy(b1).add(v(-.12, .16, 0)); cap.rotation.z = batt.rotation.z; bike.add(cap);
  const led = new THREE.Mesh(new THREE.BoxGeometry(.3, .02, .245), new THREE.MeshBasicMaterial({ color: '#fff1e6' })); led.position.copy(batt.position).add(v(-.02, .12, 0)); led.rotation.z = batt.rotation.z; bike.add(led);
  // handlebar display
  const disp = new THREE.Mesh(new RoundedBoxGeometry(.22, .05, .16, 3, .02), M.dark); disp.position.set(4.7, 3.2, 0); bike.add(disp);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.16, .1), new THREE.MeshBasicMaterial({ color: '#FF7A45' })); scr.rotation.x = -Math.PI / 2; scr.position.set(4.7, 3.226, 0); bike.add(scr);
  // chain guard
  const cg = new THREE.Mesh(new RoundedBoxGeometry(2.0, .16, .04, 3, .02), M.dark); cg.position.set(1.2, .12, .19); cg.rotation.z = Math.atan2(.12, 2.38); bike.add(cg);
  // cockpit
  tube([HT1, v(4.72, 3.12)], .045, M.dark);
  tube([v(4.62, 3.16, -.42), v(4.72, 3.14, 0), v(4.62, 3.16, .42)], .03, M.dark);
  for (const z of [-.42, .42]) tube([v(4.62, 3.16, z), v(4.58, 3.16, z * 1.15)], .045, M.rubber);
  const light = new THREE.Mesh(new THREE.CylinderGeometry(.09, .07, .14, 32), M.dark); light.rotation.z = Math.PI / 2; light.position.set(5.0, 2.45, 0); bike.add(light);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.075, 32), new THREE.MeshBasicMaterial({ color: '#fff6e0' })); lens.rotation.y = Math.PI / 2; lens.position.set(5.075, 2.45, 0); bike.add(lens);
  // saddle
  const saddleShape = new THREE.Shape(); saddleShape.moveTo(-.42, 0); saddleShape.bezierCurveTo(-.42, .2, .1, .14, .42, .06); saddleShape.bezierCurveTo(.46, -.02, .1, -.06, -.42, 0);
  const saddle = new THREE.Mesh(new THREE.ExtrudeGeometry(saddleShape, { depth: .26, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 6, curveSegments: 24 }), M.leather);
  saddle.position.set(1.98, 2.66, -.13); saddle.castShadow = true; bike.add(saddle);
  // rack
  tube([v(-.35, 1.52, -.16), v(1.55, 1.62, -.16)], .025, M.dark); tube([v(-.35, 1.52, .16), v(1.55, 1.62, .16)], .025, M.dark);
  tube([v(0, 0, .14), v(-.1, 1.52, .16)], .022, M.dark); tube([v(1.55, 1.62, .16), v(1.82, 1.95, .05)], .022, M.dark);
  // drivetrain
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .03, 12, 64), M.metal); ring.position.set(BB.x, BB.y, .14); bike.add(ring);
  const crank = new THREE.Group(); crank.position.set(BB.x, BB.y, 0); bike.add(crank);
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.07, .7, .05), M.dark); arm.position.set(0, -.3 * s, .2 * s); crank.add(arm);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(.32, .06, .22), M.rubber); pedal.position.set(0, -.65 * s, .34 * s); crank.add(pedal);
  }
  tube([v(BB.x, BB.y + .36, .14), v(0, .12, .14)], .016, M.dark); tube([v(BB.x, BB.y - .36, .14), v(0, -.12, .14)], .016, M.dark);
  // kickstand-free; fenders
  const fender = (c, a0, a1) => { const pts = []; for (let a = a0; a <= a1; a += .1) pts.push(v(c.x + Math.cos(a) * 1.66, c.y + Math.sin(a) * 1.66, 0)); tube(pts, .05, M.frame, 48); };
  fender(RA, .35, 2.6); fender(FA, .5, 2.4);

  bike.userData = { rearWheel, frontWheel, crank, anchors: { battery: down.getPoint(.5).add(v(-.08, .13, 0)), motor: RA.clone(), light: v(5.08, 2.45, 0), saddle: v(2.05, 2.8, 0) } };
  return bike;
}

export function studio(renderer, { glow = '#FF5A1F' } = {}) {
  const scene = new THREE.Scene();
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // soft environment for reflections
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const box = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: '#0e0f11', side: THREE.BackSide })); envScene.add(box);
  const panel = (c, i, p, s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s[0], s[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); envScene.add(m); };
  panel('#ffffff', 6, [0, 9, 2], [12, 3]); panel('#ffffff', 3, [-9, 3, 4], [3, 8]); panel(glow, 4, [9, 2, -6], [4, 9]);
  scene.environment = pm.fromScene(envScene, .02).texture;

  const key = new THREE.DirectionalLight('#fff3e6', 2.2); key.position.set(-3, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 14; key.shadow.blurSamples = 20;
  Object.assign(key.shadow.camera, { left: -6, right: 10, top: 6, bottom: -6, near: .5, far: 30 }); key.target.position.set(2.8, 0, 0);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(glow, 3.2); rim.position.set(6, 3, -7); scene.add(rim);
  const fill = new THREE.DirectionalLight('#9fb4d6', .35); fill.position.set(8, 2, 6); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: .55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.585; floor.receiveShadow = true; scene.add(floor);
  scene.userData = { key, rim, fill, floor };
  return scene;
}
