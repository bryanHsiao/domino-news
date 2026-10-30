// Life on and over the lake, now and then: gulls wheeling over the islands,
// dolphins leaping in pods, tuna jumping, a bait ball boiling at the surface
// (gulls gather over it, tuna jump around it), and clouds drifting across the
// sky like the reference's. All of it is low-poly, picks nothing and only
// moves while the scene animates (scene.js calls update() unless paused or
// the visitor prefers reduced motion).
import { R, TOP, WATER_Y, mulberry32 } from './layout.js';

const GULLS = 8; // in three flocks
const CLOUDS = 6;
const GULL_WHITE = 0xf7f5f0;
const GULL_GREY = 0x9aa3ad;
const DOLPHIN = 0x6f8696;
const TUNA = 0x8fa9c6;

export function createWildlife(THREE, scene, layout) {
  const rnd = mulberry32(71);
  const { cx, cz, radius } = layout.bounds;
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, flatShading: true });
  const root = new THREE.Group();
  scene.add(root);

  // open water: off every tile (and the harbour), inside the lake
  const tiles = layout.tiles;
  const isWater = (x, z) =>
    tiles.every((t) => Math.hypot(t.x - x, t.z - z) > R + 0.9) &&
    layout.harbours.every((h) => Math.hypot(h.x - x, h.z - z) > h.r + 1.2);
  function waterSpot(minD = radius * 0.55, maxD = radius + 3.5) {
    for (let i = 0; i < 60; i++) {
      const a = rnd() * Math.PI * 2;
      const d = minD + rnd() * (maxD - minD);
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (isWater(x, z)) return { x, z };
    }
    return { x: cx, z: cz + radius + 2 };
  }

  // ---- splashes: a white ring spreading on the water, fading out
  const ringGeo = new THREE.RingGeometry(0.06, 0.1, 24).rotateX(-Math.PI / 2);
  const splashes = [];
  function splash(x, z, size = 1) {
    let s = splashes.find((p) => !p.mesh.visible);
    if (!s) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      root.add(m);
      s = { mesh: m };
      splashes.push(s);
    }
    s.mesh.position.set(x, WATER_Y + 0.02, z);
    s.t = 0;
    s.size = size;
    s.mesh.visible = true;
  }
  function updateSplashes(dt) {
    for (const s of splashes) {
      if (!s.mesh.visible) continue;
      s.t += dt / 0.9;
      if (s.t >= 1) {
        s.mesh.visible = false;
        continue;
      }
      const k = (1 + s.t * 5) * s.size;
      s.mesh.scale.set(k, 1, k);
      s.mesh.material.opacity = 0.85 * (1 - s.t);
    }
  }

  // ---- gulls: white body and head, grey-tipped wings that flap, then glide
  const gullBody = mat(GULL_WHITE), gullWing = mat(GULL_GREY), beak = mat(0xe9b444);
  const bodyGeo = new THREE.SphereGeometry(0.5, 6, 4);
  // wings hinge at the body: the left one reaches out along +x, the right along -x
  const wingGeo = new THREE.BoxGeometry(0.36, 0.012, 0.11).translate(0.18, 0, 0);
  const wingGeoR = new THREE.BoxGeometry(0.36, 0.012, 0.11).translate(-0.18, 0, 0);
  function gull() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, gullBody);
    body.scale.set(0.1, 0.08, 0.24);
    const head = new THREE.Mesh(bodyGeo, gullBody);
    head.scale.set(0.07, 0.07, 0.08);
    head.position.set(0, 0.04, 0.12);
    const bill = new THREE.Mesh(bodyGeo, beak);
    bill.scale.set(0.02, 0.02, 0.06);
    bill.position.set(0, 0.035, 0.18);
    const l = new THREE.Mesh(wingGeo, gullWing);
    const r = new THREE.Mesh(wingGeoR, gullWing);
    l.position.set(0.04, 0.01, 0);
    r.position.set(-0.04, 0.01, 0);
    g.add(body, head, bill, l, r);
    g.scale.setScalar(1.4); // big enough to read from the opening view
    g.userData = { l, r };
    root.add(g);
    return g;
  }
  const flocks = [0, 1, 2].map((k) => {
    const c = waterSpot(0, radius * 0.9);
    return { x: c.x, z: c.z, home: c, goal: null, birds: [] };
  });
  for (let i = 0; i < GULLS; i++) {
    const f = flocks[i % flocks.length];
    f.birds.push({
      mesh: gull(),
      r: 2.2 + rnd() * 2.8,
      a: rnd() * Math.PI * 2,
      w: (0.35 + rnd() * 0.25) * (rnd() < 0.5 ? 1 : -1),
      y: TOP + 2.2 + rnd() * 1.6,
      ph: rnd() * 10,
    });
  }
  let clock = 0;
  function updateGulls(dt) {
    for (const f of flocks) {
      // a flock drifts toward its goal (a bait ball) or wanders its home
      const gx = f.goal ? f.goal.x : f.home.x + Math.cos(clock * 0.05 + f.home.x) * 3;
      const gz = f.goal ? f.goal.z : f.home.z + Math.sin(clock * 0.04 + f.home.z) * 3;
      f.x += (gx - f.x) * Math.min(1, dt * 0.35);
      f.z += (gz - f.z) * Math.min(1, dt * 0.35);
      for (const b of f.birds) {
        b.a += (b.w * dt * 1.6) / Math.max(1.4, b.r * 0.6);
        const r = f.goal ? b.r * 0.55 : b.r;
        const x = f.x + Math.cos(b.a) * r, z = f.z + Math.sin(b.a) * r;
        const y = (f.goal ? TOP + 1.8 : b.y) + Math.sin(clock * 0.8 + b.ph) * 0.25;
        const m = b.mesh;
        m.position.set(x, y, z);
        // face along the circle, banked into the turn
        m.rotation.set(0, Math.atan2(-Math.sin(b.a) * Math.sign(b.w), Math.cos(b.a) * Math.sign(b.w)), -0.35 * Math.sign(b.w), 'YXZ');
        // flap for a while, then glide with the wings held up a little
        const flapping = Math.sin(clock * 0.45 + b.ph) > -0.2;
        const wing = flapping ? Math.sin(clock * 9 + b.ph * 3) * 0.55 : 0.12;
        m.userData.l.rotation.z = wing;
        m.userData.r.rotation.z = -wing;
      }
    }
  }

  // ---- leapers: dolphins (in pods) and tuna (smaller, quicker), arcing out
  // of the water and back with a splash at each end
  const dolphinMat = mat(DOLPHIN), dolphinBelly = mat(0xd9dee2), tunaMat = mat(TUNA);
  const finGeo = new THREE.ConeGeometry(0.5, 1, 3);
  function dolphin() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, dolphinMat);
    body.scale.set(0.16, 0.15, 0.62);
    const belly = new THREE.Mesh(bodyGeo, dolphinBelly);
    belly.scale.set(0.13, 0.1, 0.5);
    belly.position.y = -0.035;
    const snout = new THREE.Mesh(bodyGeo, dolphinMat);
    snout.scale.set(0.05, 0.045, 0.16);
    snout.position.set(0, -0.02, 0.33);
    const fin = new THREE.Mesh(finGeo, dolphinMat);
    fin.scale.set(0.03, 0.14, 0.1);
    fin.position.set(0, 0.11, -0.04);
    fin.rotation.x = -0.4;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.07), dolphinMat);
    tail.position.set(0, 0, -0.33);
    g.add(body, belly, snout, fin, tail);
    g.visible = false;
    root.add(g);
    return g;
  }
  function tuna() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, tunaMat);
    body.scale.set(0.07, 0.08, 0.26);
    const tail = new THREE.Mesh(finGeo, tunaMat);
    tail.scale.set(0.01, 0.1, 0.06);
    tail.position.z = -0.14;
    tail.rotation.x = Math.PI / 2;
    g.add(body, tail);
    g.visible = false;
    root.add(g);
    return g;
  }
  const dolphins = Array.from({ length: 3 }, () => ({ mesh: dolphin(), t: 1 }));
  const tunas = Array.from({ length: 5 }, () => ({ mesh: tuna(), t: 1 }));
  function leap(l, x, z, yaw, { len, h, dur, delay = 0, size = 1 }) {
    Object.assign(l, { x, z, yaw, len, h, dur, t: -delay / dur, splashed: false, size });
  }
  function updateLeapers(list, dt) {
    for (const l of list) {
      if (l.t >= 1) {
        l.mesh.visible = false;
        continue;
      }
      l.t += dt / l.dur;
      if (l.t < 0) continue;
      const s = Math.min(1, l.t);
      if (!l.splashed) {
        splash(l.x, l.z, l.size);
        l.splashed = true;
      }
      // a parabola from just under the surface to just under it again
      const u = (s - 0.5) * l.len;
      const x = l.x + Math.sin(l.yaw) * (u + l.len / 2);
      const z = l.z + Math.cos(l.yaw) * (u + l.len / 2);
      const y = WATER_Y - 0.12 + 4 * l.h * s * (1 - s);
      const m = l.mesh;
      m.visible = true;
      m.position.set(x, y, z);
      m.rotation.set(-Math.atan2(4 * l.h * (1 - 2 * s), l.len), l.yaw, 0, 'YXZ');
      if (l.t >= 1) {
        splash(x, z, l.size);
        m.visible = false;
      }
    }
  }

  // ---- bait ball: a swirl of little silver fish breaking the surface
  const BALL_FISH = 70;
  const ballMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 0.07), new THREE.MeshStandardMaterial({ color: 0xcfdbe6, roughness: 0.35, metalness: 0.4 }), BALL_FISH);
  ballMesh.visible = false;
  ballMesh.frustumCulled = false;
  root.add(ballMesh);
  const ballFish = Array.from({ length: BALL_FISH }, () => ({ r: 0.1 + rnd() * 0.42, a: rnd() * Math.PI * 2, w: 2 + rnd() * 2.5, y: rnd() * 0.05, ph: rnd() * 6 }));
  const dummy = new THREE.Object3D();
  let ball = null; // { x, z, t, life }
  function updateBall(dt) {
    if (!ball) return;
    ball.t += dt;
    const fade = Math.min(1, ball.t / 1.5, (ball.life - ball.t) / 1.5);
    if (fade <= 0) {
      ballMesh.visible = false;
      flocks[ball.flock].goal = null;
      ball = null;
      return;
    }
    ballMesh.visible = true;
    ballFish.forEach((f, i) => {
      f.a += f.w * dt;
      const r = f.r * (0.6 + 0.4 * fade);
      dummy.position.set(ball.x + Math.cos(f.a) * r, WATER_Y + 0.02 + f.y + Math.abs(Math.sin(ball.t * 6 + f.ph)) * 0.03, ball.z + Math.sin(f.a) * r);
      dummy.rotation.set(0, f.a + Math.PI, 0);
      dummy.scale.setScalar(fade);
      dummy.updateMatrix();
      ballMesh.setMatrixAt(i, dummy.matrix);
    });
    ballMesh.instanceMatrix.needsUpdate = true;
    if (rnd() < dt * 4) splash(ball.x + (rnd() - 0.5) * 0.8, ball.z + (rnd() - 0.5) * 0.8, 0.35);
  }

  // ---- clouds drifting across the sky, wrapping round
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  const span = radius + 26;
  const clouds = Array.from({ length: CLOUDS }, (_, i) => {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const p = new THREE.Mesh(puffGeo, cloudMat);
      const s = 0.9 + rnd() * 0.8;
      p.scale.set(s * 1.3, s * 0.75, s);
      p.position.set((k - n / 2) * 1.1 + rnd() * 0.4, rnd() * 0.4, (rnd() - 0.5) * 0.8);
      g.add(p);
    }
    // over the far half of the lake and the hills, where the opening view
    // shows sky, so they never hang in front of the islands
    g.position.set(cx - span + ((i + rnd() * 0.5) / CLOUDS) * span * 2, TOP + 3.6 + rnd() * 1.8, cz - radius * 1.3 + rnd() * radius * 0.6);
    g.userData.v = 0.25 + rnd() * 0.2;
    root.add(g);
    return g;
  });
  function updateClouds(dt) {
    for (const c of clouds) {
      c.position.x += c.userData.v * dt;
      if (c.position.x > cx + span) c.position.x = cx - span;
    }
  }

  // ---- what happens next, and when
  let nextDolphins = 4 + rnd() * 6;
  let nextTuna = 9 + rnd() * 8;
  let nextBall = 14 + rnd() * 10;
  function schedule(dt) {
    if ((nextDolphins -= dt) <= 0) {
      nextDolphins = 8 + rnd() * 10;
      const p = waterSpot();
      const yaw = rnd() * Math.PI * 2;
      const pod = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < pod; i++) {
        const side = (i - (pod - 1) / 2) * 0.45;
        leap(dolphins[i], p.x + Math.cos(yaw) * side, p.z - Math.sin(yaw) * side, yaw, { len: 1.8, h: 0.75, dur: 1.15, delay: i * 0.3, size: 1 });
      }
    }
    if ((nextTuna -= dt) <= 0) {
      nextTuna = 7 + rnd() * 9;
      const p = ball || waterSpot();
      tunas.forEach((t, i) => {
        const a = rnd() * Math.PI * 2, d = ball ? 0.7 + rnd() * 0.5 : rnd() * 0.8;
        leap(t, p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, rnd() * Math.PI * 2, { len: 1.1, h: 0.3, dur: 0.6, delay: i * 0.22 + rnd() * 0.2, size: 0.5 });
      });
    }
    if (!ball && (nextBall -= dt) <= 0) {
      nextBall = 30 + rnd() * 20;
      const p = waterSpot();
      const flock = Math.floor(rnd() * flocks.length);
      ball = { x: p.x, z: p.z, t: 0, life: 14, flock };
      flocks[flock].goal = ball;
      nextTuna = Math.min(nextTuna, 2.5);
    }
  }

  return {
    update(dt) {
      clock += dt;
      schedule(dt);
      updateGulls(dt);
      updateLeapers(dolphins, dt);
      updateLeapers(tunas, dt);
      updateBall(dt);
      updateSplashes(dt);
      updateClouds(dt);
    },
  };
}
