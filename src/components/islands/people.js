// Chibi townsfolk, after the reference's people: an oversized round head
// with a hair cap (some with a bun), dot eyes, a rounded torso, short legs
// and arms that swing while walking; some carry a yellow box. Every body
// part is one InstancedMesh, so a crowd of any size costs a fixed dozen
// draw calls. Local units: a character is ~1.05 tall, facing +z.
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const SHIRTS = [0xdb6a41, 0x4f86c6, 0xe9b444, 0x58a6a6, 0x8b6fd1, 0xf2b5c6, 0x9cc27a, 0xf4efe6, 0x4fa36b];
const SKIN = [0xf3cfae, 0xe6b48f, 0xc98f68, 0x9a6646];
const HAIR = [0x2b2422, 0x3d2b22, 0x5a3b28, 0x1f1d22, 0x6b4a32];
const PANTS = [0x3b3a42, 0x4a4f63, 0x5b4a3e, 0x2f3a4a, 0x6a6f7a];
const BOX = 0xe9b444;
const EYE = 0x2a2522;

const HIP = 0.27; // leg pivot height
const SHOULDER = 0.56; // arm pivot height
const HEAD_Y = 0.8;

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
  };
  return sharedGeo;
}

/**
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {import('three').Material} material
 * @param {number} count
 * @param {{ rnd: () => number, shadow?: boolean, carry?: number }} o
 *   carry = share of people holding a box
 */
export function createCrowd(THREE, scene, material, count, { rnd, shadow = false, carry = 0 }) {
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
    const shirt = pick(SHIRTS);
    const skin = pick(SKIN);
    const hair = pick(HAIR);
    const pants = pick(PANTS);
    meshes.torso.setColorAt(i, c.set(shirt));
    meshes.head.setColorAt(i, c.set(skin));
    meshes.hair.setColorAt(i, c.set(hair));
    meshes.bun.setColorAt(i, c.set(hair));
    meshes.box.setColorAt(i, c.set(BOX));
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

  /**
   * Pose person i standing at (x, y, z) facing `yaw`, `size` world units
   * per character unit. `gait` is the walk-cycle angle and `swing` how much
   * the limbs move (0 = standing still).
   */
  function pose(i, x, y, z, yaw, size, gait = 0, swing = 0) {
    const p = people[i];
    const s = Math.sin(gait) * swing;
    const bob = Math.abs(Math.cos(gait)) * swing * 0.035;
    q.setFromAxisAngle(up, yaw);
    root.compose(v.set(x, y + bob * size, z), q, sv.set(size * p.girth, size * p.height, size * p.girth));

    for (const side of [0, 1]) {
      const sx = side ? 1 : -1;
      // legs swing opposite each other
      part(sx * 0.09, HIP, 0, (side ? s : -s) * 0.6, 0.15, HIP + 0.01, 0.17);
      put(meshes.legs, i * 2 + side);
      // arms swing opposite their leg; carriers hold them forward
      const armRx = p.carry ? -1.05 : (side ? -s : s) * 0.55;
      part(sx * 0.245, SHOULDER, 0, armRx, 0.09, 0.24, 0.1);
      put(meshes.arms, i * 2 + side);
      // hand at the end of the arm
      tmp.makeRotationX(armRx);
      v.set(0, -0.26, 0).applyMatrix4(tmp);
      local.makeScale(0.095, 0.095, 0.095).setPosition(sx * 0.245, SHOULDER + v.y, v.z);
      put(meshes.hands, i * 2 + side);
      // eyes: two dots on the front of the face
      local.makeScale(0.052, 0.062, 0.03).setPosition(sx * 0.085, HEAD_Y - 0.01, 0.238);
      put(meshes.eyes, i * 2 + side);
    }
    part(0, 0.42, 0, 0, 0.42, 0.34, 0.3);
    put(meshes.torso, i);
    local.makeScale(0.5, 0.48, 0.48).setPosition(0, HEAD_Y, 0);
    put(meshes.head, i);
    part(0, HEAD_Y + 0.012, -0.01, -0.5, 0.52, 0.5, 0.515);
    put(meshes.hair, i);
    if (p.bun) {
      local.makeScale(0.2, 0.2, 0.2).setPosition(0, HEAD_Y + 0.2, -0.17);
      put(meshes.bun, i);
    } else meshes.bun.setMatrixAt(i, zero);
    if (p.carry) {
      part(0, 0.43, 0.27, 0, 0.42, 0.26, 0.24);
      put(meshes.box, i);
    } else meshes.box.setMatrixAt(i, zero);
  }

  function commit() {
    for (const m of Object.values(meshes)) m.instanceMatrix.needsUpdate = true;
  }

  return { pose, commit, people, meshes: Object.values(meshes) };
}
