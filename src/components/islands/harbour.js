// The OpenNTF harbour (layout.js `harbours`): a community town on the lake
// shore rather than an island. A long jetty reaches into the lake, a couple
// of boats lie moored at it, and small cargo boats (crates of community
// tools aboard) sail out to the nearest islands and back.
import { R, TOP, WATER_Y } from './layout.js';
import { createKit } from './kit.js';

const INR = R * 0.866;
const JETTY = 3.0; // how far the jetty reaches past the quay
const BOATS = 3;
const SPEED = 0.6; // world units per second
const WAIT_HOME = 4; // seconds at the jetty
const WAIT_AWAY = 3; // seconds alongside an island

// `decor` is the static scenery kit (built later by scene.js); each sailing
// boat gets a kit of its own because it moves.
export function createHarbours(THREE, scene, decor, props, layout, material, byKind) {
  const runs = [];
  const segDist = (px, pz, ax, az, bx, bz) => {
    const vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(px - ax - t * vx, pz - az - t * vz);
  };

  for (const hb of layout.harbours) {
    const home = layout.clusters.find((c) => c.cat === hb.cat);
    const { cx, cz } = layout.bounds;
    // the jetty leaves the harbour tile nearest the lake, toward the lake's centre
    let ux = cx - hb.x, uz = cz - hb.z;
    const ul = Math.hypot(ux, uz);
    ux /= ul;
    uz /= ul;
    const quay = home.tiles.reduce((q, t) => ((t.x - hb.x) * ux + (t.z - hb.z) * uz > (q.x - hb.x) * ux + (q.z - hb.z) * uz ? t : q));
    const yaw = Math.atan2(ux, uz);
    const px = uz, pz = -ux; // sideways
    const at = (u, v) => [quay.x + ux * (INR - 0.2 + u) + px * v, quay.z + uz * (INR - 0.2 + u) + pz * v];
    const y = TOP - 0.1;
    const [mx, mz] = at(JETTY / 2, 0);
    decor.part('box', [mx, y, mz], [0.62, 0.08, JETTY], 0xb98a5c, null, [0, yaw, 0]);
    for (let k = 0; k < 10; k++) {
      const [bx, bz] = at(0.15 + (k * (JETTY - 0.3)) / 9, 0);
      decor.part('box', [bx, y + 0.045, bz], [0.66, 0.02, 0.07], 0xa67a50, null, [0, yaw, 0]);
    }
    for (let u = 0.5; u < JETTY; u += 0.8)
      for (const v of [-0.3, 0.3]) {
        const [qx, qz] = at(u, v);
        const h = y - (WATER_Y - 0.3);
        decor.part('cyl', [qx, WATER_Y - 0.3 + h / 2, qz], [0.08, h, 0.08], 0x7a5d44);
      }
    for (const u of [JETTY * 0.45, JETTY - 0.15]) {
      const [lx, lz] = at(u, 0.27);
      decor.part('cyl', [lx, y + 0.25, lz], [0.03, 0.46, 0.03], 0x4a4744);
      decor.part('bulb', [lx, y + 0.5, lz], [0.08, 0.08, 0.08], 0xfff0c2);
    }
    // two boats lie moored on the far side of the jetty
    const mrnd = ((seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646)(7);
    for (const u of [1.1, 2.1]) {
      const [bx, bz] = at(u, -0.62);
      props.boat(bx, bz, yaw + 0.08, mrnd, WATER_Y);
    }

    // cargo boats: from the jetty to the nearest islands they can reach in a
    // straight line, one boat per island
    const [tx, tz] = at(JETTY, 0);
    const targets = [];
    for (const c of layout.clusters) {
      if (c === home) continue;
      const t = c.tiles.reduce((b, s) => (Math.hypot(s.x - tx, s.z - tz) < Math.hypot(b.x - tx, b.z - tz) ? s : b));
      const d = Math.hypot(t.x - tx, t.z - tz);
      const ex = t.x + ((tx - t.x) / d) * (INR + 0.75), ez = t.z + ((tz - t.z) / d) * (INR + 0.75);
      const clear = layout.tiles.every((s) => s === t || segDist(s.x, s.z, tx, tz, ex, ez) > R + 0.15);
      if (clear) targets.push({ d, to: [ex, ez] });
    }
    targets.sort((a, b) => a.d - b.d);
    targets.slice(0, BOATS).forEach((tg, k) => {
      const from = at(JETTY - 0.45 - k * 0.95, 0.6);
      const kit = createKit(THREE);
      kit.part('rbox', [0, 0.06, 0], [0.4, 0.15, 0.9], 0xf4efe6);
      kit.part('box', [0, 0.1, 0], [0.42, 0.035, 0.92], 0xdb6a41);
      kit.part('rbox', [0, 0.22, -0.26], [0.3, 0.2, 0.26], 0xf7f3ec);
      kit.part('glass', [0, 0.25, -0.12], [0.26, 0.07, 0.02], 0x7fa6c2);
      kit.part('rbox', [0, 0.34, -0.26], [0.36, 0.04, 0.32], 0x58a6a6);
      kit.part('rbox', [-0.07, 0.22, 0.12], [0.18, 0.16, 0.18], 0xe9b444);
      kit.part('rbox', [0.09, 0.21, 0.24], [0.16, 0.14, 0.16], 0xe9b444);
      kit.part('rbox', [0.02, 0.36, 0.17], [0.15, 0.13, 0.15], 0xd9a53a);
      kit.part('cyl', [0, 0.5, -0.36], [0.018, 0.3, 0.018], 0x4a4744);
      kit.part('box', [0.045, 0.6, -0.36], [0.09, 0.06, 0.008], 0xdb6a41, null, [0, Math.PI / 2, 0]);
      const group = new THREE.Group();
      group.rotation.order = 'YXZ';
      kit.build(group, material, byKind).forEach((m) => (m.castShadow = false));
      scene.add(group);
      const cross = Math.hypot(tg.to[0] - from[0], tg.to[1] - from[1]) / SPEED;
      runs.push({ group, from, to: tg.to, out: Math.atan2(tg.to[0] - from[0], tg.to[1] - from[1]), cross, offset: k * 6.5 });
    });
  }

  const ease = (t) => t * t * (3 - 2 * t);
  return {
    update(time) {
      for (const r of runs) {
        // jetty → crossing → alongside the island (turning round) → crossing
        // back → jetty (turning round again)
        const cycle = WAIT_HOME + r.cross + WAIT_AWAY + r.cross;
        let t = (time + r.offset) % cycle;
        let k, turn;
        if (t < WAIT_HOME) {
          k = 0;
          turn = 1 + ease(t / WAIT_HOME);
        } else if ((t -= WAIT_HOME) < r.cross) {
          k = ease(t / r.cross);
          turn = 0;
        } else if ((t -= r.cross) < WAIT_AWAY) {
          k = 1;
          turn = ease(t / WAIT_AWAY);
        } else {
          k = 1 - ease((t - WAIT_AWAY) / r.cross);
          turn = 1;
        }
        const x = r.from[0] + (r.to[0] - r.from[0]) * k;
        const z = r.from[1] + (r.to[1] - r.from[1]) * k;
        r.group.position.set(x, WATER_Y + Math.sin(time * 1.3 + r.offset) * 0.02, z);
        r.group.rotation.set(Math.sin(time * 1.1 + r.offset) * 0.03, r.out + turn * Math.PI, 0);
      }
    },
  };
}
