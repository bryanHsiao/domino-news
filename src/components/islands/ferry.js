// Ferries out to the off-shore platforms (layout.ferries). A platform is where
// code runs, not a class, so it gets no bridge — bridges stand only for class
// relations — but a ferry route: a small pier on the nearest class island and
// one on the platform, a dashed line across the water, and a little ferry
// with a few passengers shuttling between them. It is kept small, white and
// navy so it never reads as the OpenNTF harbour's bigger cargo boats.
import { R, TOP, WATER_Y } from './layout.js';
import { createKit } from './kit.js';

const INR = R * 0.866;
const PIER = 0.9; // how far a pier reaches out from the deck edge
const SPEED = 0.5; // world units per second
const WAIT = 3; // seconds alongside each pier
const NAVY = 0x2f4a6b;

export function createFerries(THREE, scene, decor, layout, material, byKind) {
  const runs = [];

  layout.ferries.forEach((fr, k) => {
    const { from: a, to: b } = fr;
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L;
    const px = uz, pz = -ux; // sideways
    const yaw = Math.atan2(ux, uz);

    // a pier leaving tile t's edge toward the other end (dir = +1 / -1)
    const pier = (t, dir, len) => {
      const at = (u, v) => [t.x + ux * dir * (INR - 0.15 + u) + px * v, t.z + uz * dir * (INR - 0.15 + u) + pz * v];
      const y = TOP - 0.12;
      const [mx, mz] = at(len / 2, 0);
      decor.part('box', [mx, y, mz], [0.44, 0.06, len], 0xb98a5c, null, [0, yaw, 0]);
      for (let u = 0.25; u < len; u += 0.45)
        for (const v of [-0.2, 0.2]) {
          const [qx, qz] = at(u, v);
          const h = y - (WATER_Y - 0.3);
          decor.part('cyl', [qx, WATER_Y - 0.3 + h / 2, qz], [0.06, h, 0.06], 0x7a5d44);
        }
      const [lx, lz] = at(len - 0.1, 0.18);
      decor.part('cyl', [lx, y + 0.22, lz], [0.025, 0.4, 0.025], 0x4a4744);
      decor.part('bulb', [lx, y + 0.44, lz], [0.07, 0.07, 0.07], 0xfff0c2);
      // the ferry lies alongside the pier's end
      return at(len - 0.2, -0.38);
    };
    const p0 = pier(a, 1, PIER);
    const p1 = pier(b, -1, PIER * 0.7);

    // the route: short white dashes on the water between the two berths
    const rx = p1[0] - p0[0], rz = p1[1] - p0[1];
    const rl = Math.hypot(rx, rz);
    for (let s = 0.5; s < rl - 0.4; s += 0.48) {
      const f = s / rl;
      decor.part('box', [p0[0] + rx * f, WATER_Y + 0.012, p0[1] + rz * f], [0.05, 0.01, 0.22], 0xf2f6f7, null, [0, Math.atan2(rx, rz), 0]);
    }

    // the ferry: white hull with a navy band, a small cabin, three passengers
    const kit = createKit(THREE);
    kit.part('rbox', [0, 0.05, 0], [0.3, 0.12, 0.62], 0xf7f5f0);
    kit.part('box', [0, 0.085, 0], [0.31, 0.03, 0.63], NAVY);
    kit.part('rbox', [0, 0.19, -0.1], [0.22, 0.15, 0.22], 0xf7f5f0);
    kit.part('glass', [0, 0.21, -0.1], [0.23, 0.05, 0.23], 0x7fa6c2);
    kit.part('rbox', [0, 0.28, -0.1], [0.26, 0.03, 0.26], NAVY);
    [0xdb6a41, 0x58a6a6, 0xe9b444].forEach((c, i) => {
      const x = -0.08 + i * 0.08, z = 0.15 + (i % 2) * 0.05;
      kit.part('cyl', [x, 0.17, z], [0.06, 0.1, 0.06], c);
      kit.part('sphere', [x, 0.25, z], [0.06, 0.06, 0.06], 0xf1c9a5);
    });
    const group = new THREE.Group();
    group.rotation.order = 'YXZ';
    kit.build(group, material, byKind).forEach((m) => (m.castShadow = false));
    scene.add(group);
    runs.push({ group, from: p0, to: p1, out: Math.atan2(rx, rz), cross: rl / SPEED, offset: k * 5 });
  });

  const ease = (t) => t * t * (3 - 2 * t);
  return {
    update(time) {
      for (const r of runs) {
        // pier → crossing → alongside the platform (turning round) → back
        const cycle = WAIT + r.cross + WAIT + r.cross;
        let t = (time + r.offset) % cycle;
        let k, turn;
        if (t < WAIT) {
          k = 0;
          turn = 1 + ease(t / WAIT);
        } else if ((t -= WAIT) < r.cross) {
          k = ease(t / r.cross);
          turn = 0;
        } else if ((t -= r.cross) < WAIT) {
          k = 1;
          turn = ease(t / WAIT);
        } else {
          k = 1 - ease((t - WAIT) / r.cross);
          turn = 1;
        }
        const x = r.from[0] + (r.to[0] - r.from[0]) * k;
        const z = r.from[1] + (r.to[1] - r.from[1]) * k;
        r.group.position.set(x, WATER_Y + Math.sin(time * 1.4 + r.offset) * 0.02, z);
        r.group.rotation.set(Math.sin(time * 1.2 + r.offset) * 0.03, r.out + turn * Math.PI, 0);
      }
    },
  };
}
