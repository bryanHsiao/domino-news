// Low-poly props shared by the islands and the surrounding scenery. Each one
// is a few kit parts; nothing here carries meaning about a class.
const GREENS = [0x9cc27a, 0xa9c98a, 0x8db86f, 0xb3cf8e, 0x86ad6a];
const PINES = [0x6f8a62, 0x5d7656, 0x7d9a6a];
const ROOFS = [0xdb6a41, 0xc77b5c, 0xd08a64];
const SHIRTS = [0xdb6a41, 0x4f86c6, 0xe9b444, 0x58a6a6, 0x8b6fd1, 0x3b3a42, 0xf2b5c6];
const SKIN = [0xf1c9a5, 0xd9a27e, 0xb27b57];

export function createProps(THREE, kit) {
  const c = new THREE.Color();
  const offset = (hex, ds, dl) => c.set(hex).offsetHSL(0, ds, dl).getHex();
  const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];

  // Broadleaf tree: trunk + a ring of lumpy clumps (darker below, lighter
  // crown) so it never reads as a single smooth ball.
  function tree(x, z, s, rnd, y, palette = GREENS) {
    const g = pick(palette, rnd);
    kit.part('trunk', [x, y + s * 0.3, z], [s * 0.16, s * 0.6, s * 0.16], 0x8a6a4e);
    const n = 4 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.6;
      const r = s * (0.22 + rnd() * 0.1);
      const k = s * (0.48 + rnd() * 0.18);
      const lo = i % 2 === 0;
      kit.part('leaf', [x + Math.cos(a) * r, y + s * (lo ? 0.8 : 0.95), z + Math.sin(a) * r], [k, k * 0.86, k], lo ? offset(g, -0.05, -0.08) : g, null, [rnd(), rnd() * 6, rnd()]);
    }
    kit.part('leaf', [x, y + s * 1.12, z], [s * 0.6, s * 0.5, s * 0.6], offset(g, 0.04, 0.07), null, [rnd(), rnd() * 6, 0]);
  }

  function conifer(x, z, s, rnd, y) {
    const h = s * (1.3 + rnd() * 0.7);
    const g = pick(PINES, rnd);
    kit.part('cyl', [x, y + h * 0.12, z], [s * 0.12, h * 0.24, s * 0.12], 0x7a5d44);
    for (let t = 0; t < 3; t++) {
      const w = s * (0.95 - t * 0.24);
      kit.part('cone', [x, y + h * (0.32 + t * 0.2), z], [w, h * 0.42, w], offset(g, 0, t * 0.03));
    }
  }

  function bush(x, z, s, rnd, y) {
    kit.part('leaf', [x, y + s * 0.35, z], [s, s * 0.75, s], offset(pick(GREENS, rnd), -0.04, -0.06), null, [rnd(), rnd() * 6, 0]);
  }

  // Small house used as background scenery on the hills.
  function cottage(x, z, s, rnd, y, yaw) {
    const w = s * 0.6, d = s * 0.5, h = s * 0.42;
    kit.part('rbox', [x, y + h / 2, z], [w, h, d], 0xf4ede2, null, [0, yaw, 0]);
    kit.part('hip', [x, y + h + s * 0.13, z], [w + s * 0.06, s * 0.26, d + s * 0.06], pick(ROOFS, rnd), null, [0, yaw, 0]);
  }

  // A small pile of wooden crates (warehouse / port islands).
  function crates(x, z, rnd, y) {
    const wood = [0xb48560, 0xa77a55, 0xc9a27c];
    kit.part('rbox', [x - 0.12, y + 0.13, z], [0.26, 0.26, 0.26], pick(wood, rnd), null, [0, rnd() * 0.4, 0]);
    kit.part('rbox', [x + 0.16, y + 0.11, z + 0.06], [0.22, 0.22, 0.22], pick(wood, rnd), null, [0, rnd() * 0.4, 0]);
    if (rnd() < 0.6) kit.part('rbox', [x, y + 0.36, z + 0.02], [0.2, 0.2, 0.2], pick(wood, rnd), null, [0, rnd() * 0.6, 0]);
  }

  function lamp(x, z, y) {
    kit.part('cyl', [x, y + 0.22, z], [0.03, 0.44, 0.03], 0x4a4744);
    kit.part('sphere', [x, y + 0.46, z], [0.08, 0.08, 0.08], 0xfff0c2);
  }

  function person(x, z, rnd, y) {
    kit.part('cyl', [x, y + 0.09, z], [0.1, 0.16, 0.1], pick(SHIRTS, rnd));
    kit.part('sphere', [x, y + 0.21, z], [0.085, 0.085, 0.085], pick(SKIN, rnd));
  }

  function boat(x, z, yaw, rnd, y) {
    const rot = [0, yaw, 0];
    kit.part('rbox', [x, y + 0.05, z], [0.22, 0.12, 0.6], rnd() < 0.5 ? 0xf4efe6 : 0xdb6a41, null, rot);
    if (rnd() < 0.6) {
      kit.part('cyl', [x, y + 0.38, z], [0.02, 0.6, 0.02], 0x8a6a4e);
      kit.part('sail', [x, y + 0.38, z], [0.03, 0.5, 0.34], 0xfff8f0, null, rot);
    } else {
      kit.part('rbox', [x, y + 0.16, z], [0.16, 0.12, 0.22], 0xf7f3ec, null, rot);
    }
  }

  // Striped lighthouse with a warm lantern.
  function lighthouse(x, z, y) {
    for (let i = 0; i < 6; i++) {
      const r = 0.34 - i * 0.025;
      kit.part('cyl', [x, y + 0.15 + i * 0.3, z], [r * 2, 0.3, r * 2], i % 2 ? 0xdb6a41 : 0xf4efe6);
    }
    kit.part('cyl', [x, y + 1.95, z], [0.42, 0.06, 0.42], 0x3b3a42);
    kit.part('sphere', [x, y + 2.1, z], [0.26, 0.26, 0.26], 0xfff0c2);
    kit.part('cone', [x, y + 2.36, z], [0.4, 0.3, 0.4], 0xdb6a41);
  }

  return { tree, conifer, bush, crates, cottage, lamp, person, boat, lighthouse };
}
