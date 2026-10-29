// Off-shore islands (layout.js `ferries`) are reached by ferry rather than a
// bridge: a wooden pier on each side and a small double-ended ferry that
// shuttles between them, waiting a moment at each end.
import { R, TOP, WATER_Y } from './layout.js';
import { createKit } from './kit.js';

const INR = R * 0.866;
const PIER = 1.35; // how far a pier reaches out past the tile edge
const SPEED = 0.55; // world units per second
const DWELL = 3.2; // seconds moored at each end

// `decor` is the static scenery kit (piers go there, before it is built);
// the ferries get kits of their own because they move.
export function createFerries(THREE, scene, decor, layout, material, byKind) {
  const runs = [];
  for (const f of layout.ferries) {
    const dx = f.b.x - f.a.x, dz = f.b.z - f.a.z;
    const L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    const yaw = Math.atan2(ux, uz);
    // piers: from under each tile's edge out over the water, facing each other
    const tips = [];
    for (const [t, s] of [[f.a, 1], [f.b, -1]]) {
      const x0 = t.x + s * ux * (INR - 0.2), z0 = t.z + s * uz * (INR - 0.2);
      const len = PIER + 0.2;
      const mx = x0 + (s * ux * len) / 2, mz = z0 + (s * uz * len) / 2;
      const y = TOP - 0.12;
      decor.part('box', [mx, y, mz], [0.56, 0.07, len], 0xb98a5c, null, [0, yaw, 0]);
      for (let k = 0; k < 6; k++) {
        const d = 0.25 + (k * (len - 0.3)) / 5;
        decor.part('box', [x0 + s * ux * d, y + 0.04, z0 + s * uz * d], [0.6, 0.02, 0.07], 0xa67a50, null, [0, yaw, 0]);
      }
      // posts down into the water, two per side
      for (const d of [0.55, len - 0.08])
        for (const side of [-1, 1]) {
          const px = x0 + s * ux * d + uz * side * 0.27, pz = z0 + s * uz * d - ux * side * 0.27;
          const h = y - (WATER_Y - 0.3);
          decor.part('cyl', [px, WATER_Y - 0.3 + h / 2 + 0.06, pz], [0.07, h + 0.12, 0.07], 0x7a5d44);
        }
      // a lamp on the pier head
      const hx = x0 + s * ux * (len - 0.1) + uz * 0.24, hz = z0 + s * uz * (len - 0.1) - ux * 0.24;
      decor.part('cyl', [hx, y + 0.24, hz], [0.03, 0.44, 0.03], 0x4a4744);
      decor.part('bulb', [hx, y + 0.48, hz], [0.08, 0.08, 0.08], 0xfff0c2);
      tips.push([x0 + s * ux * len, z0 + s * uz * len]);
    }

    // the ferry, modelled at the origin facing +z, moored beside the piers
    const kit = createKit(THREE);
    kit.part('rbox', [0, 0.06, 0], [0.5, 0.16, 1.05], 0xf4efe6);
    kit.part('box', [0, 0.1, 0], [0.52, 0.04, 1.07], 0xdb6a41);
    kit.part('rbox', [0, 0.24, 0], [0.38, 0.22, 0.56], 0xf7f3ec);
    kit.part('glass', [0, 0.27, 0], [0.4, 0.08, 0.48], 0x7fa6c2);
    kit.part('rbox', [0, 0.38, 0], [0.46, 0.05, 0.66], 0x58a6a6);
    kit.part('cyl', [0, 0.5, -0.2], [0.02, 0.22, 0.02], 0x4a4744);
    kit.part('box', [0.05, 0.57, -0.2], [0.1, 0.07, 0.01], 0xe9b444, null, [0, Math.PI / 2, 0]);
    const group = new THREE.Group();
    group.rotation.order = 'YXZ';
    kit.build(group, material, byKind).forEach((m) => (m.castShadow = false));
    scene.add(group);
    const side = 0.56; // moors alongside the pier, not on top of it
    const from = [tips[0][0] - ux * 0.35 + uz * side, tips[0][1] - uz * 0.35 - ux * side];
    const to = [tips[1][0] + ux * 0.35 + uz * side, tips[1][1] + uz * 0.35 - ux * side];
    const span = Math.hypot(to[0] - from[0], to[1] - from[1]);
    runs.push({ group, from, to, yaw, cross: span / SPEED });
  }

  return {
    update(time) {
      for (const r of runs) {
        const cycle = 2 * (r.cross + DWELL);
        let t = time % cycle;
        // 0 → moored at the first pier, crossing, moored at the second, back
        let k;
        if (t < DWELL) k = 0;
        else if ((t -= DWELL) < r.cross) k = t / r.cross;
        else if ((t -= r.cross) < DWELL) k = 1;
        else k = 1 - (t - DWELL) / r.cross;
        k = k * k * (3 - 2 * k); // ease in and out of the piers
        const x = r.from[0] + (r.to[0] - r.from[0]) * k;
        const z = r.from[1] + (r.to[1] - r.from[1]) * k;
        r.group.position.set(x, WATER_Y + Math.sin(time * 1.4) * 0.02, z);
        r.group.rotation.set(Math.sin(time * 1.1) * 0.03, r.yaw, 0);
      }
    },
  };
}
