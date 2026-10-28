// Per-island identity: every category gets its own architecture (wall
// palette, roof shape, body shape, proportions, greenery) and one landmark
// at the heart of the island that hints at what the category is about —
// the database "stacked disks", a DOM node tree, a clock tower for Calendar…
// Roof COLOUR is not themed: it keeps the legend meaning (backend / UI /
// not written / key class) on every island.
import { TOP } from './layout.js';

const BLOSSOM = [0xf2b5c6, 0xf6c9d4, 0xe9a3b8];
const AUTUMN = [0xe0a050, 0xd98a3a, 0xe8b860];
const LIME = [0xb3cf8e, 0xc4d98f, 0xa9c98a];

// roof: hip | gable | flat | saw | dome | cone   body: box | round
// tall / wide tweak the proportions; flora picks what fills free slots.
export const THEMES = {
  Session: { walls: [0xf4ede2, 0xf7f1e8], roof: 'gable', body: 'box', flora: 'tree', landmark: 'civic' },
  Database: { walls: [0xd8d2c6, 0xcfc8ba], roof: 'flat', body: 'box', flora: 'tree', landmark: 'dbstack' },
  View: { walls: [0xeef3f6, 0xe2ebef], roof: 'flat', body: 'box', tall: true, flora: 'pine', landmark: 'lookout' },
  Document: { walls: [0xfbf7ee, 0xf3ecdc], roof: 'gable', body: 'box', flora: 'tree', landmark: 'paper' },
  Item: { walls: [0xd9c3a3, 0xcdb38f], roof: 'saw', body: 'box', wide: true, flora: 'crates', landmark: 'crates' },
  'Rich Text': { walls: [0xf2c4d0, 0xf6e3a6, 0xc4e2d6, 0xd9c6f0], roof: 'gable', body: 'box', flora: 'tree', palette: BLOSSOM, landmark: 'theater' },
  'DOM/XML': { walls: [0xdfe8ea, 0xd3e0e3], roof: 'flat', body: 'box', flora: 'mixed', landmark: 'nodetree' },
  UI: { walls: [0xfbe3c8, 0xd6ecf2, 0xf6d7e0], roof: 'cone', body: 'round', flora: 'tree', palette: LIME, landmark: 'panel' },
  Admin: { walls: [0xd5d9dc, 0xc9ced2], roof: 'flat', body: 'box', flora: 'pine', landmark: 'tower' },
  JSON: { walls: [0xe6d3b8, 0xdcc6a6], roof: 'gable', body: 'box', wide: true, flora: 'crates', landmark: 'port' },
  Calendar: { walls: [0xf1e0c8, 0xe8d2b4], roof: 'hip', body: 'box', flora: 'tree', palette: AUTUMN, landmark: 'clock' },
  GPS: { walls: [0xeef0ea, 0xe3e8df], roof: 'dome', body: 'round', flora: 'pine', landmark: 'dish' },
  'Composite Apps': { walls: [0xd6ecf2, 0xfbe3c8, 0xe1f0d6], roof: 'flat', body: 'box', flora: 'tree', landmark: 'blocks' },
  DominoIQ: { walls: [0xeef2fb, 0xe4e9f6], roof: 'dome', body: 'round', flora: 'mixed', landmark: 'ailab' },
  DQL: { walls: [0xf0ece4, 0xe6e0d4], roof: 'cone', body: 'round', flora: 'pine', landmark: 'observatory' },
  HTTP: { walls: [0xe9e6e0, 0xdedad2], roof: 'hip', body: 'box', flora: 'pine', landmark: 'radio' },
  'Session File Operations': { walls: [0xe2e6e1, 0xd8ddd6], roof: 'flat', body: 'box', flora: 'crates', landmark: 'cabinet' },
};
// A category added to the catalogue later still gets a distinct look.
const FALLBACKS = [
  { walls: [0xf4ede2], roof: 'hip', body: 'box', flora: 'tree', landmark: 'obelisk' },
  { walls: [0xeef0ea], roof: 'gable', body: 'box', flora: 'pine', landmark: 'obelisk' },
];
export function themeFor(cat, index) {
  return THEMES[cat] || FALLBACKS[index % FALLBACKS.length];
}

// Landmarks are built from kit parts around (x, z) on a tile deck. They fit
// inside a ~0.7 radius (the class houses stand on a ring outside it).
export function buildLandmark(kind, kit, x, z) {
  const y = TOP;
  const P = (k, px, py, pz, sx, sy, sz, color, rot) => kit.part(k, [px, py, pz], [sx, sy, sz], color, null, rot || null);
  // cylinder between two points of the x–y plane at depth pz
  const rod = (x1, y1, x2, y2, pz, r, color) => {
    const dx = x2 - x1, dy = y2 - y1;
    P('cyl', (x1 + x2) / 2, (y1 + y2) / 2, pz, r, Math.hypot(dx, dy), r, color, [0, 0, -Math.atan2(dx, dy)]);
  };
  const disc = (px, py, pz, r, color, rot) => P('cyl', px, py, pz, r, 0.02, r, color, rot);
  const FACE_Z = [Math.PI / 2, 0, 0]; // disc facing +z
  const FACE_X = [0, 0, Math.PI / 2]; // disc facing +x

  switch (kind) {
    case 'civic': {
      // Session — the city hall every other object starts from
      P('rbox', x, y + 0.03, z, 1.35, 0.06, 1.05, 0xe4d6c3);
      P('rbox', x, y + 0.09, z, 1.25, 0.06, 0.95, 0xece2d2);
      P('rbox', x, y + 0.39, z - 0.05, 1.1, 0.54, 0.7, 0xf3ece0);
      for (let i = 0; i < 5; i++) P('cyl', x - 0.4 + i * 0.2, y + 0.36, z + 0.36, 0.08, 0.48, 0.08, 0xfbf7f0);
      P('box', x, y + 0.62, z + 0.3, 1.2, 0.05, 0.16, 0xece2d2);
      P('gable', x, y + 0.79, z - 0.02, 1.2, 0.26, 0.86, 0xdb6a41);
      P('rbox', x, y + 1.01, z - 0.25, 0.32, 0.7, 0.32, 0xf3ece0);
      disc(x, y + 1.15, z - 0.08, 0.2, 0xfffaf0, FACE_Z);
      P('box', x, y + 1.18, z - 0.065, 0.015, 0.08, 0.01, 0x3b3a42);
      P('hip', x, y + 1.51, z - 0.25, 0.4, 0.3, 0.4, 0xdb6a41);
      P('cyl', x, y + 1.78, z - 0.25, 0.02, 0.24, 0.02, 0x5a4a3c);
      P('box', x + 0.07, y + 1.85, z - 0.25, 0.13, 0.08, 0.01, 0xe9b444);
      break;
    }
    case 'dbstack': {
      // Database — the stacked-disks database icon as a tower
      P('cyl', x, y + 0.04, z, 1.25, 0.08, 1.25, 0xd8ccb8);
      for (let i = 0; i < 3; i++) {
        const b = y + 0.08 + i * 0.4;
        P('cyl', x, b + 0.17, z, 1.1, 0.34, 1.1, 0x5f86b8);
        P('cyl', x, b + 0.36, z, 1.12, 0.05, 1.12, 0x3b4a63);
        P('bulb', x + 0.3, b + 0.2, z + 0.46, 0.07, 0.07, 0.07, 0x9be38f);
        P('box', x - 0.15, b + 0.2, z + 0.5, 0.3, 0.04, 0.04, 0x9fb6d6);
      }
      P('cyl', x, y + 1.3, z, 1.08, 0.04, 1.08, 0x8fb0d8);
      break;
    }
    case 'lookout': {
      // View — an observation tower to look over everything
      P('cyl', x, y + 0.06, z, 0.7, 0.12, 0.7, 0xd8ccb8);
      P('cyl', x, y + 0.87, z, 0.24, 1.5, 0.24, 0xf4efe6);
      P('cyl', x, y + 1.66, z, 0.95, 0.08, 0.95, 0xe2d6c4);
      P('cyl', x, y + 1.86, z, 0.72, 0.32, 0.72, 0x8fc0d6);
      P('cone', x, y + 2.16, z, 0.86, 0.28, 0.86, 0xdb6a41);
      P('cyl', x, y + 2.42, z, 0.02, 0.24, 0.02, 0x5a4a3c);
      P('box', x + 0.32, y + 1.76, z + 0.2, 0.1, 0.06, 0.16, 0x3b3a42);
      break;
    }
    case 'paper': {
      // Document — a tall stack of paper, a sealed letter and a pen; a post box beside it
      const yaw = [0, 0.1, -0.06, 0.14, -0.1, 0.05, -0.13, 0.08, -0.04, 0.12];
      for (let i = 0; i < 10; i++) P('box', x, y + 0.04 + i * 0.075, z, 1.0, 0.065, 0.74, i % 2 ? 0xf3ede0 : 0xfdfbf6, [0, yaw[i], 0]);
      const t = y + 0.79;
      P('box', x - 0.05, t, z, 0.6, 0.03, 0.42, 0xf7e7c8, [0, 0.2, 0]);
      P('cyl', x - 0.05, t + 0.03, z, 0.16, 0.03, 0.16, 0xc8463a);
      P('cyl', x + 0.3, t + 0.05, z + 0.12, 0.05, 0.7, 0.05, 0x2f4f7f, [Math.PI / 2, 0.6, 0]);
      P('rbox', x + 0.5, y + 0.22, z + 0.38, 0.16, 0.44, 0.16, 0xc8463a);
      break;
    }
    case 'crates': {
      // Item — a yard of crates (items are what documents hold) and a small crane
      const wood = [0xb48560, 0xa77a55, 0xc9a27c];
      P('box', x, y + 0.02, z + 0.1, 1.15, 0.04, 0.8, 0x8a6a4e);
      const at = [[-0.36, 0, -0.08], [0, 0, -0.08], [0.36, 0, -0.08], [-0.36, 0, 0.28], [0, 0, 0.28], [0.36, 0, 0.28], [-0.18, 1, 0.1], [0.18, 1, 0.1], [0, 2, 0.1]];
      at.forEach(([dx, l, dz], i) => P('rbox', x + dx, y + 0.21 + l * 0.35, z + dz, 0.34, 0.34, 0.34, wood[i % 3], [0, (i % 3) * 0.08, 0]));
      P('cyl', x - 0.55, y + 0.8, z - 0.42, 0.08, 1.6, 0.08, 0xe8c547);
      P('box', x - 0.1, y + 1.6, z - 0.42, 1.1, 0.07, 0.07, 0xe8c547);
      P('box', x - 0.72, y + 1.56, z - 0.42, 0.18, 0.14, 0.14, 0x3b3a42);
      P('cyl', x + 0.35, y + 1.36, z - 0.42, 0.015, 0.48, 0.015, 0x3b3a42);
      P('box', x + 0.35, y + 1.1, z - 0.42, 0.08, 0.06, 0.08, 0x3b3a42);
      break;
    }
    case 'theater': {
      // Rich Text — a colourful theatre with a marquee, type blocks on the roof
      P('rbox', x, y + 0.42, z - 0.08, 1.05, 0.84, 0.72, 0xf2c4d0);
      P('box', x, y + 0.86, z - 0.08, 1.12, 0.05, 0.78, 0xfbf3ea);
      for (let i = 0; i < 6; i++) P('box', x - 0.45 + i * 0.18, y + 0.5, z + 0.36, 0.18, 0.03, 0.26, i % 2 ? 0xdb6a41 : 0xfff8f0, [0.45, 0, 0]);
      P('rbox', x, y + 0.68, z + 0.3, 0.7, 0.16, 0.05, 0xfcea8b);
      P('box', x, y + 0.2, z + 0.285, 0.3, 0.32, 0.02, 0x8a3b4a);
      [[-0.28, 0xdb6a41, 0.32], [0.05, 0x58a6a6, 0.26], [0.32, 0x6f7fb5, 0.2]].forEach(([dx, c, s]) => P('rbox', x + dx, y + 0.89 + s / 2, z - 0.08, s, s, s * 0.6, c, [0, 0.15, 0]));
      break;
    }
    case 'nodetree': {
      // DOM/XML — the document tree itself: root, children, grandchildren
      P('cyl', x, y + 0.06, z, 1.1, 0.12, 1.1, 0xd8ccb8);
      P('cyl', x, y + 0.13, z, 0.9, 0.04, 0.9, 0xbfd6df);
      rod(x, y + 0.12, x, y + 0.72, z, 0.1, 0x3e7c8c);
      P('sphere', x, y + 0.75, z, 0.3, 0.3, 0.3, 0xdb6a41);
      for (const s1 of [-1, 1]) {
        const cx = x + s1 * 0.38;
        rod(x, y + 0.75, cx, y + 1.18, z, 0.055, 0x3e7c8c);
        P('sphere', cx, y + 1.2, z, 0.22, 0.22, 0.22, 0x58a6a6);
        for (const s2 of [-1, 1]) {
          const gx = cx + s2 * 0.18;
          rod(cx, y + 1.2, gx, y + 1.56, z, 0.035, 0x3e7c8c);
          P('sphere', gx, y + 1.58, z, 0.15, 0.15, 0.15, 0xe8c547);
        }
      }
      break;
    }
    case 'panel': {
      // UI — a tilted control desk full of buttons, and one big red button
      const th = 0.5, cs = Math.cos(th), sn = Math.sin(th);
      const cy = y + 0.42;
      P('box', x - 0.4, y + 0.18, z, 0.08, 0.36, 0.08, 0x3b3a42);
      P('box', x + 0.4, y + 0.18, z, 0.08, 0.36, 0.08, 0x3b3a42);
      P('rbox', x, cy, z, 1.1, 0.1, 0.7, 0xf4efe6, [th, 0, 0]);
      const cols = [0xdb6a41, 0xe8c547, 0x58a6a6, 0x8b6fd1, 0x4f86c6, 0x9cc27a];
      let i = 0;
      for (const lz of [-0.15, 0.15])
        for (const lx of [-0.32, 0, 0.32]) {
          P('cyl', x + lx, cy + 0.08 * cs - lz * sn, z + 0.08 * sn + lz * cs, 0.17, 0.06, 0.17, cols[i++], [th, 0, 0]);
        }
      P('cyl', x + 0.62, y + 0.25, z + 0.4, 0.34, 0.5, 0.34, 0xf4efe6);
      P('cyl', x + 0.62, y + 0.54, z + 0.4, 0.26, 0.1, 0.26, 0xdb6a41);
      break;
    }
    case 'tower': {
      // Admin — a server control tower with an antenna mast
      P('rbox', x, y + 0.2, z, 0.75, 0.4, 0.75, 0xc9ced2);
      P('cyl', x, y + 1.0, z, 0.36, 1.2, 0.36, 0xe6e8ea);
      P('cyl', x, y + 1.62, z, 0.62, 0.06, 0.62, 0xd5d9dc);
      P('cyl', x, y + 1.82, z, 0.72, 0.34, 0.72, 0x4f6f88);
      P('cyl', x, y + 2.02, z, 0.82, 0.06, 0.82, 0xf4efe6);
      for (let i = 0; i < 4; i++) P('cyl', x, y + 2.13 + i * 0.16, z, 0.04, 0.16, 0.04, i % 2 ? 0xffffff : 0xdb6a41);
      P('bulb', x, y + 2.75, z, 0.08, 0.08, 0.08, 0xff5a3c);
      P('dome', x + 0.22, y + 0.42, z + 0.18, 0.24, 0.12, 0.24, 0xf4efe6, [-Math.PI / 2 - 0.5, 0, 0]);
      break;
    }
    case 'port': {
      // JSON — data interchange as a cargo port: containers and a gantry crane
      const cc = [0xdb6a41, 0x58a6a6, 0xe8c547, 0x4f86c6];
      for (let s = 0; s < 2; s++) for (let l = 0; l < 2; l++) P('rbox', x - 0.15, y + 0.15 + l * 0.29, z - 0.18 + s * 0.32, 0.72, 0.28, 0.28, cc[(s * 2 + l) % 4]);
      P('rbox', x + 0.45, y + 0.15, z + 0.22, 0.28, 0.28, 0.6, cc[1]);
      for (const lx of [-0.6, 0.6]) for (const lz of [-0.45, 0.45]) P('box', x + lx, y + 0.7, z + lz, 0.07, 1.4, 0.07, 0xe8c547);
      for (const lz of [-0.45, 0.45]) P('box', x, y + 1.4, z + lz, 1.27, 0.08, 0.08, 0xe8c547);
      P('box', x - 0.15, y + 1.36, z, 0.22, 0.12, 0.98, 0x3b3a42);
      P('cyl', x - 0.15, y + 1.05, z, 0.015, 0.6, 0.015, 0x3b3a42);
      break;
    }
    case 'clock': {
      // Calendar — a brick clock tower over a small hall with a calendar page
      P('rbox', x, y + 0.18, z + 0.05, 0.95, 0.36, 0.62, 0xf1e0c8);
      P('box', x - 0.28, y + 0.24, z + 0.37, 0.2, 0.24, 0.02, 0xfffaf0);
      P('box', x - 0.28, y + 0.34, z + 0.38, 0.2, 0.05, 0.02, 0xdb6a41);
      P('rbox', x, y + 1.06, z - 0.05, 0.44, 1.4, 0.44, 0xc77b5c);
      disc(x, y + 1.45, z + 0.18, 0.32, 0xfffaf0, FACE_Z);
      P('box', x, y + 1.5, z + 0.195, 0.02, 0.12, 0.01, 0x3b3a42);
      P('box', x + 0.04, y + 1.45, z + 0.195, 0.09, 0.02, 0.01, 0x3b3a42);
      disc(x + 0.225, y + 1.45, z - 0.05, 0.32, 0xfffaf0, FACE_X);
      P('hip', x, y + 2.01, z - 0.05, 0.56, 0.5, 0.56, 0x58806a);
      P('sphere', x, y + 2.3, z - 0.05, 0.08, 0.08, 0.08, 0xe9b444);
      break;
    }
    case 'dish': {
      // GPS — a satellite dish on a pedestal, compass rose on the deck
      P('box', x, y + 0.012, z, 0.06, 0.012, 1.3, 0xdb6a41);
      P('box', x, y + 0.012, z, 1.3, 0.012, 0.06, 0xf4efe6);
      P('cyl', x, y + 0.05, z, 0.8, 0.1, 0.8, 0xd8ccb8);
      P('cyl', x, y + 0.4, z, 0.18, 0.6, 0.18, 0xe6e8ea);
      P('dome', x, y + 0.72, z, 1.1, 0.32, 1.1, 0xf4efe6, [Math.PI + 0.7, 0, 0]);
      P('cyl', x, y + 0.72 + 0.22 * Math.cos(0.7), z + 0.22 * Math.sin(0.7), 0.03, 0.45, 0.03, 0x8a8f96, [0.7, 0, 0]);
      P('sphere', x, y + 0.72 + 0.45 * Math.cos(0.7), z + 0.45 * Math.sin(0.7), 0.09, 0.09, 0.09, 0xdb6a41);
      break;
    }
    case 'blocks': {
      // Composite Apps — an app snapped together from building blocks
      const bc = [0x58a6a6, 0xdb6a41, 0xe8c547, 0x8b6fd1, 0x4f86c6, 0x9cc27a];
      const at = [[-0.36, 0, -0.18], [0, 0, -0.18], [0.36, 0, -0.18], [-0.18, 0, 0.18], [0.18, 0, 0.18], [-0.18, 1, -0.18], [0.18, 1, -0.18], [0, 1, 0.18], [0, 2, 0], [0, 3, 0]];
      at.forEach(([dx, l, dz], i) => {
        const by = y + 0.13 + l * 0.27;
        P('rbox', x + dx, by, z + dz, 0.34, 0.26, 0.34, bc[i % bc.length]);
        for (const sx of [-0.08, 0.08]) for (const sz of [-0.08, 0.08]) P('cyl', x + dx + sx, by + 0.15, z + dz + sz, 0.08, 0.05, 0.08, bc[i % bc.length]);
      });
      break;
    }
    case 'ailab': {
      // DominoIQ — a glass-domed lab under a glowing, ringed orb
      P('cyl', x, y + 0.08, z, 1.3, 0.16, 1.3, 0xeef2fb);
      P('dome', x, y + 0.16, z, 1.15, 0.62, 1.15, 0xbfe3ee);
      P('box', x, y + 0.28, z + 0.55, 0.22, 0.26, 0.06, 0x4f6f88);
      P('cyl', x, y + 0.93, z, 0.04, 0.3, 0.04, 0x8a8f96);
      P('bulb', x, y + 1.3, z, 0.36, 0.36, 0.36, 0xfcea8b);
      P('cyl', x, y + 1.3, z, 0.82, 0.02, 0.82, 0x8b6fd1, [0.5, 0, 0.3]);
      P('cyl', x, y + 1.3, z, 0.7, 0.02, 0.7, 0x58a6a6, [-0.4, 0, -0.5]);
      break;
    }
    case 'observatory': {
      // DQL — querying the sky: an observatory with its telescope out
      P('cyl', x, y + 0.3, z, 0.9, 0.6, 0.9, 0xf0ece4);
      P('dome', x, y + 0.6, z, 0.94, 0.5, 0.94, 0xd8dde2);
      P('box', x, y + 0.86, z + 0.28, 0.16, 0.36, 0.2, 0x3b3a42, [-0.6, 0, 0]);
      P('cyl', x, y + 1.02, z + 0.34, 0.12, 0.6, 0.12, 0xdb6a41, [0.7, 0, 0]);
      P('box', x, y + 0.25, z + 0.455, 0.2, 0.3, 0.02, 0x8a6a4e);
      break;
    }
    case 'radio': {
      // HTTP — a red-and-white transmission mast with dishes, hut at its foot
      P('rbox', x + 0.05, y + 0.15, z + 0.3, 0.6, 0.3, 0.36, 0xe9e6e0);
      P('hip', x + 0.05, y + 0.4, z + 0.3, 0.66, 0.2, 0.42, 0x8a8f96);
      for (let i = 0; i < 6; i++) {
        const r = 0.32 - i * 0.04;
        P('cyl', x, y + 0.18 + i * 0.36, z - 0.2, r, 0.36, r, i % 2 ? 0xffffff : 0xdb6a41);
      }
      P('dome', x + 0.1, y + 1.3, z - 0.06, 0.32, 0.12, 0.32, 0xf4efe6, [-Math.PI / 2, 0, 0]);
      P('dome', x - 0.08, y + 1.75, z - 0.08, 0.26, 0.1, 0.26, 0xf4efe6, [-Math.PI / 2, 0, 0]);
      P('bulb', x, y + 2.36, z - 0.2, 0.08, 0.08, 0.08, 0xff5a3c);
      break;
    }
    case 'cabinet': {
      // Session File Operations — a filing cabinet with boxes of files
      P('rbox', x - 0.1, y + 0.55, z - 0.05, 0.7, 1.1, 0.56, 0x8fa3a0);
      for (let i = 0; i < 3; i++) {
        const dy = y + 0.25 + i * 0.33;
        P('box', x - 0.1, dy, z + 0.235, 0.6, 0.27, 0.02, 0x9fb2ae);
        P('box', x - 0.1, dy + 0.06, z + 0.25, 0.18, 0.04, 0.03, 0x3b3a42);
        P('box', x - 0.1, dy - 0.05, z + 0.25, 0.14, 0.06, 0.01, 0xfffaf0);
      }
      P('rbox', x + 0.42, y + 0.14, z + 0.25, 0.3, 0.28, 0.26, 0xc9a27c);
      P('rbox', x + 0.42, y + 0.42, z + 0.25, 0.26, 0.26, 0.24, 0xd6b48c, [0, 0.2, 0]);
      P('rbox', x + 0.45, y + 0.14, z - 0.15, 0.3, 0.28, 0.26, 0xbf9771);
      break;
    }
    default: {
      // obelisk for categories without a dedicated landmark
      P('rbox', x, y + 0.06, z, 0.8, 0.12, 0.8, 0xd8ccb8);
      P('rbox', x, y + 0.8, z, 0.3, 1.36, 0.3, 0xe9e1d3);
      P('hip', x, y + 1.6, z, 0.3, 0.24, 0.3, 0xe9b444);
    }
  }
}
