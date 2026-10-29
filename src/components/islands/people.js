// Chibi townsfolk, after the reference's people: an oversized round head
// with a hair cap (some with a bun), dot eyes, a rounded torso, short legs
// and arms that swing while walking; some carry a yellow box and some ride
// a bicycle (sat a little higher, pedalling, hands on the bar). Every body
// part is one InstancedMesh, so a crowd of any size costs a fixed dozen
// draw calls. Local units: a character is ~1.05 tall, facing +z.
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const SHIRTS = [0xdb6a41, 0x4f86c6, 0xe9b444, 0x58a6a6, 0x8b6fd1, 0xf2b5c6, 0x9cc27a, 0xf4efe6, 0x4fa36b];
const SKIN = [0xf3cfae, 0xe6b48f, 0xc98f68, 0x9a6646];
const HAIR = [0x2b2422, 0x3d2b22, 0x5a3b28, 0x1f1d22, 0x6b4a32];
const PANTS = [0x3b3a42, 0x4a4f63, 0x5b4a3e, 0x2f3a4a, 0x6a6f7a];
const BOX = 0xe9b444;
const EYE = 0x2a2522;
const FRAMES = [0x4f86c6, 0xdb6a41, 0x58a6a6, 0xe9b444, 0x3b3a42, 0x9cc27a];
const TYRE = 0x2a2826;
const TRIM = 0x3b3a42; // saddle, handlebar

const HIP = 0.27; // leg pivot height
const SHOULDER = 0.56; // arm pivot height
const HEAD_Y = 0.8;
// bicycle (character units): wheels of radius 0.2 at z = ±0.34; a rider's
// body is lifted so the hips sit on the saddle
const WHEEL = 0.2;
const HUB_Z = 0.34;
const LIFT = 0.28;

let sharedGeo = null;
function geometries(THREE) {
  if (sharedGeo) return sharedGeo;
  sharedGeo = {
    // limbs hang from their pivot: geometry spans y ∈ [-1, 0]
    limb: new RoundedBoxGeometry(1, 1, 1, 2, 0.35).translate(0, -0.5, 0),
    torso: new RoundedBoxGeometry(1, 1, 1, 3, 0.3),
    ball: new THREE.SphereGeometry(0.5, 16, 12),
    // hair: a cap a bit past the head's equator, tilted back when placed so
    // it frames the face and covers the back of the head
    cap: new THREE.SphereGeometry(0.5, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    box: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
    // a wheel standing in the y/z plane, unit diameter
    wheel: new THREE.TorusGeometry(0.5, 0.09, 6, 18).rotateY(Math.PI / 2),
    rod: new THREE.BoxGeometry(1, 1, 1),
  };
  return sharedGeo;
}

/**
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {import('three').Material} material
 * @param {number} count
 * @param {{ rnd: () => number, shadow?: boolean, carry?: number, bike?: number }} o
 *   carry = share of people holding a box; bike = share of the others riding
 *   a bicycle
 */
export function createCrowd(THREE, scene, material, count, { rnd, shadow = false, carry = 0, bike = 0 }) {
  const geo = geometries(THREE);
  const meshes = {};
  const add = (name, g, per = 1) => {
    const m = new THREE.InstancedMesh(g, material, count * per);
    m.frustumCulled = false; // instances move away from where the bounds were computed
    m.castShadow = shadow;
    m.receiveShadow = true;
    meshes[name] = m;
    scene.add(m);
    return m;
  };
  add('legs', geo.limb, 2);
  add('arms', geo.limb, 2);
  add('hands', geo.ball, 2);
  add('torso', geo.torso);
  add('head', geo.ball);
  add('hair', geo.cap);
  add('bun', geo.ball);
  add('eyes', geo.ball, 2);
  add('box', geo.box);
  if (bike > 0) {
    add('wheels', geo.wheel, 2);
    add('frame', geo.rod, 6);
    add('trim', geo.rod, 2);
  }

  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const c = new THREE.Color();
  const people = [];
  for (let i = 0; i < count; i++) {
    const p = {
      bun: rnd() < 0.4,
      carry: rnd() < carry,
      // a slightly different build per person
      girth: 0.92 + rnd() * 0.16,
      height: 0.94 + rnd() * 0.12,
    };
    p.bike = bike > 0 && !p.carry && rnd() < bike;
    const shirt = pick(SHIRTS);
    const skin = pick(SKIN);
    const hair = pick(HAIR);
    const pants = pick(PANTS);
    meshes.torso.setColorAt(i, c.set(shirt));
    meshes.head.setColorAt(i, c.set(skin));
    meshes.hair.setColorAt(i, c.set(hair));
    meshes.bun.setColorAt(i, c.set(hair));
    meshes.box.setColorAt(i, c.set(BOX));
    if (bike > 0) {
      const frame = pick(FRAMES);
      for (let k = 0; k < 6; k++) meshes.frame.setColorAt(i * 6 + k, c.set(frame));
      for (let k = 0; k < 2; k++) {
        meshes.wheels.setColorAt(i * 2 + k, c.set(TYRE));
        meshes.trim.setColorAt(i * 2 + k, c.set(TRIM));
      }
    }
    for (let s = 0; s < 2; s++) {
      meshes.legs.setColorAt(i * 2 + s, c.set(pants));
      meshes.arms.setColorAt(i * 2 + s, c.set(shirt));
      meshes.hands.setColorAt(i * 2 + s, c.set(skin));
      meshes.eyes.setColorAt(i * 2 + s, c.set(EYE));
    }
    people.push(p);
  }
  for (const m of Object.values(meshes)) m.instanceColor.needsUpdate = true;

  const root = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const sv = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const put = (mesh, idx) => mesh.setMatrixAt(idx, out.multiplyMatrices(root, local));
  // local = T(px,py,pz) · Rx(rx) · S(sx,sy,sz)
  const part = (px, py, pz, rx, sx, sy, sz) => {
    local.makeRotationX(rx).scale(sv.set(sx, sy, sz));
    local.setPosition(px, py, pz);
  };
  // a thin bar from (ay, az) to (by, bz) on the bicycle's centre plane
  const rod = (mesh, idx, ay, az, by, bz, t) => {
    const dy = by - ay, dz = bz - az;
    local.makeRotationX(Math.atan2(dz, dy)).scale(sv.set(t, Math.hypot(dy, dz), t));
    local.setPosition(0, (ay + by) / 2, (az + bz) / 2);
    put(mesh, idx);
  };
  // the bicycle's tubes: rear stays, seat tube, down tube, top tube, fork
  const SEAT = [0.52, -0.1], CRANK = [0.22, 0.02], HEAD = [0.6, 0.24], BAR = [0.68, 0.25];
  const TUBES = [
    [[WHEEL, -HUB_Z], SEAT],
    [[WHEEL, -HUB_Z], CRANK],
    [CRANK, SEAT],
    [CRANK, HEAD],
    [SEAT, HEAD],
    [[WHEEL, HUB_Z], BAR],
  ];

  /**
   * Pose person i standing at (x, y, z) facing `yaw`, `size` world units
   * per character unit. `gait` is the walk-cycle angle and `swing` how much
   * the limbs move (0 = standing still).
   */
  function pose(i, x, y, z, yaw, size, gait = 0, swing = 0) {
    const p = people[i];
    const s = Math.sin(gait) * swing;
    const bob = p.bike ? 0 : Math.abs(Math.cos(gait)) * swing * 0.035;
    const ly = p.bike ? LIFT : 0; // riders sit on the saddle
    q.setFromAxisAngle(up, yaw);
    root.compose(v.set(x, y + bob * size, z), q, sv.set(size * p.girth, size * p.height, size * p.girth));

    for (const side of [0, 1]) {
      const sx = side ? 1 : -1;
      // legs swing opposite each other; a rider's push the pedals round
      const legRx = p.bike ? -0.75 + Math.sin(gait + side * Math.PI) * 0.35 * (swing ? 1 : 0) : (side ? s : -s) * 0.6;
      part(sx * 0.09, HIP + ly, 0, legRx, 0.15, HIP + 0.01, 0.17);
      put(meshes.legs, i * 2 + side);
      // arms swing opposite their leg; carriers hold them forward, riders
      // reach for the handlebar
      const armRx = p.bike ? -1.2 : p.carry ? -1.05 : (side ? -s : s) * 0.55;
      part(sx * 0.245, SHOULDER + ly, 0, armRx, 0.09, 0.24, 0.1);
      put(meshes.arms, i * 2 + side);
      // hand at the end of the arm
      tmp.makeRotationX(armRx);
      v.set(0, -0.26, 0).applyMatrix4(tmp);
      local.makeScale(0.095, 0.095, 0.095).setPosition(sx * 0.245, SHOULDER + ly + v.y, v.z);
      put(meshes.hands, i * 2 + side);
      // eyes: two dots on the front of the face
      local.makeScale(0.052, 0.062, 0.03).setPosition(sx * 0.085, HEAD_Y + ly - 0.01, 0.238);
      put(meshes.eyes, i * 2 + side);
    }
    part(0, 0.42 + ly, 0, 0, 0.42, 0.34, 0.3);
    put(meshes.torso, i);
    local.makeScale(0.5, 0.48, 0.48).setPosition(0, HEAD_Y + ly, 0);
    put(meshes.head, i);
    part(0, HEAD_Y + ly + 0.012, -0.01, -0.5, 0.52, 0.5, 0.515);
    put(meshes.hair, i);
    if (p.bun) {
      local.makeScale(0.2, 0.2, 0.2).setPosition(0, HEAD_Y + ly + 0.2, -0.17);
      put(meshes.bun, i);
    } else meshes.bun.setMatrixAt(i, zero);
    if (bike > 0) {
      if (p.bike) {
        for (const k of [0, 1]) {
          local.makeScale(WHEEL * 2, WHEEL * 2, WHEEL * 2).setPosition(0, WHEEL, k ? HUB_Z : -HUB_Z);
          put(meshes.wheels, i * 2 + k);
        }
        TUBES.forEach(([a, b], k) => rod(meshes.frame, i * 6 + k, a[0], a[1], b[0], b[1], 0.045));
        local.makeScale(0.34, 0.035, 0.035).setPosition(0, BAR[0], BAR[1]);
        put(meshes.trim, i * 2);
        local.makeScale(0.11, 0.04, 0.17).setPosition(0, SEAT[0] + 0.02, SEAT[1]);
        put(meshes.trim, i * 2 + 1);
      } else {
        for (let k = 0; k < 2; k++) {
          meshes.wheels.setMatrixAt(i * 2 + k, zero);
          meshes.trim.setMatrixAt(i * 2 + k, zero);
        }
        for (let k = 0; k < 6; k++) meshes.frame.setMatrixAt(i * 6 + k, zero);
      }
    }
    if (p.carry) {
      part(0, 0.43, 0.27, 0, 0.42, 0.26, 0.24);
      put(meshes.box, i);
    } else meshes.box.setMatrixAt(i, zero);
  }

  function commit() {
    for (const m of Object.values(meshes)) m.instanceMatrix.needsUpdate = true;
  }

  // recolour person i's box (e.g. to mark the porters of a selected island)
  function tintBox(i, hex) {
    meshes.box.setColorAt(i, c.set(hex == null ? BOX : hex));
    meshes.box.instanceColor.needsUpdate = true;
  }

  // recolour person i's shirt (torso + both arms), e.g. to badge a door-person
  // with its article's language; skin, hair and trousers stay as they were
  function tintShirt(i, hex) {
    meshes.torso.setColorAt(i, c.set(hex));
    meshes.arms.setColorAt(i * 2, c.set(hex));
    meshes.arms.setColorAt(i * 2 + 1, c.set(hex));
    meshes.torso.instanceColor.needsUpdate = true;
    meshes.arms.instanceColor.needsUpdate = true;
  }

  // parts a pointer can hit, one instance per person
  const pickMeshes = [meshes.torso, meshes.head, meshes.hair];

  return { pose, commit, tintBox, tintShirt, people, pickMeshes, meshes: Object.values(meshes) };
}
