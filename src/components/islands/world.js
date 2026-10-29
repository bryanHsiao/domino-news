// Island bodies (decks, paving, edge bands, water skirts), the land that
// joins tiles of one island, bridges between islands, the class buildings and
// the per-tile greenery.
import { R, TOP, WATER_Y, DIRS, hexVertex, edgeDir, hashString, mulberry32 } from './layout.js';
import { groundTexture, ringTexture, bandTexture } from './textures.js';
import { themeFor, buildLandmark } from './landmarks.js';

const RING_OUT = 1.94;
const RING_IN = 1.66;
const SKIRT_TOP = TOP + 0.04;
const SKIRT_BOT = WATER_Y - 0.6;
const WATER_TONE = 0x9fd3d8;

// Decorative identities, assigned in island order. Ground pattern + base tone,
// walking-ring tint and the edge band pattern.
const STYLES = {
  plaza: { ground: 'tiles', tone: 0xd9cbb4, ring: 0xe3d3b8, band: ['bricks', '#d8ccb8', '#bfae95'] },
  courtyard: { ground: 'tiles', tone: 0xd9b08c, ring: 0xe6cfb0, band: ['bricks', '#c77b5c', '#e9d8c0'] },
  lawn: { ground: 'grass', tone: 0xb9cd98, ring: 0xbfd6df, band: ['glass', '#9fc4c6', '#e6f0ef'] },
  terracotta: { ground: 'tiles', tone: 0xdcb79a, ring: 0xe6b796, band: ['bricks', '#d08a64', '#f2d0b4'] },
  garden: { ground: 'grass', tone: 0xb4c993, ring: 0xdfe6cf, band: ['ivy', '#8db86f', '#b4c993'] },
  schoolyard: { ground: 'court', tone: 0xc9785a, ring: 0xf1dc9a, band: ['dots', '#e8c547', '#58a6a6'] },
  meadow: { ground: 'grass', tone: 0xbccf9c, ring: 0xd9866a, band: ['stripes', '#c8775a', '#ffffff'] },
  softpad: { ground: 'checker', tone: 0xb9d6e6, ring: 0xf2d2d6, band: ['dots', '#f2b5c6', '#9fc4e6'] },
  street: { ground: 'tiles', tone: 0xcfc3b2, ring: 0xb9b3ab, band: ['hazard', '#e8c547', '#3b3a42'] },
  boardwalk: { ground: 'boards', tone: 0xc9a27c, ring: 0xc9a27c, band: ['timber', '#9a7a5a', '#c9a27c'] },
  farmland: { ground: 'rows', tone: 0xa9b878, ring: 0xcdb08a, band: ['ivy', '#6c4f3a', '#8fb37a'] },
  gravel: { ground: 'gravel', tone: 0xc7b08f, ring: 0xc9b89a, band: ['stripes', '#db6a41', '#f2efe8'] },
  rubber: { ground: 'court', tone: 0xe2a46f, ring: 0x8fc6c4, band: ['stripes', '#e7a383', '#58a6a6'] },
  forest: { ground: 'grass', tone: 0x9fb683, ring: 0xa98e6c, band: ['ivy', '#6f8a62', '#9cc27a'] },
};
const STYLE_ORDER = ['plaza', 'courtyard', 'lawn', 'terracotta', 'garden', 'schoolyard', 'meadow', 'softpad', 'street', 'boardwalk', 'farmland', 'gravel', 'rubber', 'forest', 'lawn', 'terracotta', 'garden'];

// Class building colours: the roof carries the meaning (legend); walls and
// shapes come from the island's theme (landmarks.js).
const ROOF = { be: 0x4f86c6, ui: 0x8b6fd1, un: 0xa8a29a, key: 0xe9b444 };
const GLASS = 0x7fa6c2;
const DOOR = 0x8a6a4e;
// Roof language flags (scene legend): Java blue, SSJS green. Must stay in sync
// with the legend swatches in ClassIslands.astro.
const LANG_FLAG = { java: 0x4f86c6, ssjs: 0x4fa36b };

// Building slots per tile: centre first, then the ring from back to front so
// any free (tree) slots end up in the foreground. The island's landmark tile
// gives its centre to the landmark and pushes the ring out a little.
const ringSlots = (r) => [240, 300, 180, 0, 120, 60].map((a) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]);
const SLOTS = [[0, 0], ...ringSlots(0.9)];
const LANDMARK_SLOTS = ringSlots(1.06);

function hexRing(THREE, rOut, rIn) {
  const s = new THREE.Shape();
  const h = new THREE.Path();
  for (let k = 0; k < 6; k++) {
    const [x, z] = hexVertex(0, 0, rOut, k);
    k ? s.lineTo(x, -z) : s.moveTo(x, -z);
    const [x2, z2] = hexVertex(0, 0, rIn, k);
    k ? h.lineTo(x2, -z2) : h.moveTo(x2, -z2);
  }
  s.closePath();
  h.closePath();
  s.holes.push(h);
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
}

// World-space UVs so a deck texture runs seamlessly across joined tiles.
function worldUV(geo) {
  const p = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2.2, p.getZ(i) / 2.2);
  return geo;
}

export function classKind(n) {
  if (n.key) return 'key';
  return !n.url ? 'un' : n.ui ? 'ui' : 'be';
}
export const ROOF_COLORS = ROOF;

export function buildWorld(THREE, scene, { buildings, bridges, decor }, props, layout) {
  const pickTargets = [];
  const outlines = new Map();
  const anchors = new Map(); // class id -> roof top of its house, where relation lines start and end
  const tileAt = new Map(layout.tiles.map((t) => [t.q + ',' + t.r, t]));
  const add = (geo, mat, { cast = false, receive = true, cat = null, x = 0, y = 0, z = 0 } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    if (cat) {
      m.userData.cat = cat;
      pickTargets.push(m);
    }
    scene.add(m);
    return m;
  };

  // ---- shared materials / geometry
  const ringTex = ringTexture(THREE);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xe4d6c3, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xf6fbfa, transparent: true, opacity: 0.55, depthWrite: false });
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0xdb6a41, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const ringGeo = hexRing(THREE, RING_OUT, RING_IN);
  const curbGeo = hexRing(THREE, R, R - 0.07);
  const innerCurbGeo = hexRing(THREE, RING_IN, RING_IN - 0.04);
  const bandGeo = new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.18, 6, 1, true);
  const haloGeo = hexRing(THREE, R + 0.75, R - 0.02);
  const foamGeo = hexRing(THREE, R + 0.17, R - 0.02);
  const skirtH = SKIRT_TOP - SKIRT_BOT;
  const skirtY = (SKIRT_TOP + SKIRT_BOT) / 2;

  // Skirt shaded from the island's shallow-water tint at the deck down to open
  // water, so the side reads as a clear shallow shelf rather than a soil wall.
  function skirtGeometry(top, open = true, radius = R) {
    const g = new THREE.CylinderGeometry(radius, radius, skirtH, 6, 4, open);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const water = new THREE.Color(WATER_TONE);
    const cc = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = (skirtH / 2 - p.getY(i)) / skirtH;
      cc.copy(top).lerp(water, Math.min(1, t * 1.5));
      col.set([cc.r, cc.g, cc.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }

  // ---- per-island look
  const looks = new Map();
  layout.clusters.forEach((c, i) => {
    const style = STYLES[STYLE_ORDER[i % STYLE_ORDER.length]];
    const seed = hashString(c.cat);
    const shallow = new THREE.Color(style.tone).lerp(new THREE.Color(WATER_TONE), 0.55);
    const ringMat = new THREE.MeshStandardMaterial({ map: ringTex, color: style.ring, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    looks.set(c.cat, {
      topMat: new THREE.MeshStandardMaterial({ map: groundTexture(THREE, style, seed), roughness: 0.92 }),
      ringMat,
      bandMat: new THREE.MeshStandardMaterial({ map: bandTexture(THREE, style, seed + 1), roughness: 0.85 }),
      wallMat: new THREE.MeshLambertMaterial({ color: shallow }),
      skirtMat: new THREE.MeshLambertMaterial({ vertexColors: true }),
      haloMat: new THREE.MeshBasicMaterial({ color: shallow, transparent: true, opacity: 0.5, depthWrite: false }),
      skirtGeo: skirtGeometry(shallow),
      plugSkirtGeo: skirtGeometry(shallow, true, 0.62),
    });
  });

  // ---- tiles
  for (const t of layout.tiles) {
    const look = looks.get(t.cat);
    const deck = new THREE.CircleGeometry(R - 0.04, 6).rotateZ(Math.PI / 6).rotateX(-Math.PI / 2).translate(t.x, TOP, t.z);
    add(worldUV(deck), look.topMat, { cat: t.cat });
    add(ringGeo, look.ringMat, { x: t.x, y: TOP + 0.012, z: t.z });
    add(curbGeo, curbMat, { x: t.x, y: TOP + 0.04, z: t.z });
    add(innerCurbGeo, curbMat, { x: t.x, y: TOP + 0.02, z: t.z });
    add(look.skirtGeo, look.skirtMat, { cast: true, cat: t.cat, x: t.x, y: skirtY, z: t.z });
    add(bandGeo, look.bandMat, { x: t.x, y: TOP - 0.07, z: t.z });
    add(haloGeo, look.haloMat, { receive: false, x: t.x, y: WATER_Y + 0.008, z: t.z });
    add(foamGeo, foamMat, { receive: false, x: t.x, y: WATER_Y + 0.012, z: t.z });
  }

  // ---- land joining tiles of the same island
  const span = R * 0.98;
  for (const [a, b] of layout.fused) {
    const look = looks.get(a.cat);
    const dx = b.x - a.x, dz = b.z - a.z;
    const L = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const len = L - 2 * R * 0.866 + 0.5;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    const deck = new THREE.PlaneGeometry(span, len).rotateX(-Math.PI / 2).rotateY(yaw).translate(mx, TOP - 0.004, mz);
    add(worldUV(deck), look.topMat, { cat: a.cat });
    add(new THREE.BoxGeometry(span, skirtH, len).rotateY(yaw).translate(mx, skirtY - 0.01, mz), look.wallMat, { cast: true, cat: a.cat });
    const px = Math.cos(yaw), pz = -Math.sin(yaw);
    for (const side of [-1, 1]) {
      const band = new THREE.BoxGeometry(0.03, 0.18, len).rotateY(yaw).translate(mx + px * (span / 2) * side, TOP - 0.07, mz + pz * (span / 2) * side);
      add(band, look.bandMat);
    }
  }
  for (const j of layout.junctions) {
    const look = looks.get(j.cat);
    const deck = new THREE.CircleGeometry(0.62, 6).rotateZ(Math.PI / 6).rotateX(-Math.PI / 2).translate(j.x, TOP - 0.005, j.z);
    add(worldUV(deck), look.topMat, { cat: j.cat });
    add(look.plugSkirtGeo, look.skirtMat, { cat: j.cat, x: j.x, y: skirtY - 0.01, z: j.z });
  }

  // ---- bridges: only between related islands; the stronger the relation
  // (number of class links), the wider and sturdier the bridge
  for (const br of layout.bridges) buildBridge(bridges, br);

  // ---- landmark, themed class buildings and greenery per tile
  layout.clusters.forEach((c, ci) => {
    const theme = themeFor(c.cat, ci);
    // the landmark stands on the tile nearest the island's centre
    const heart = c.tiles.reduce((best, t) => {
      const d = Math.hypot(t.x - c.cx, t.z - c.cz), bd = Math.hypot(best.x - c.cx, best.z - c.cz);
      return d < bd - 1e-6 ? t : best;
    });
    for (const t of c.tiles) dressTile(t, theme, t === heart);
  });

  function dressTile(t, theme, isHeart) {
    const rnd = mulberry32(hashString(t.q + ':' + t.r));
    const slots = isHeart ? LANDMARK_SLOTS : SLOTS;
    if (isHeart) buildLandmark(theme.landmark, decor, t.x, t.z);
    t.nodes.forEach((n, i) => {
      const x = t.x + slots[i][0], z = t.z + slots[i][1];
      anchors.set(n.id, { x, y: house(buildings, n, theme, x, z, isHeart ? 0.92 : 1), z });
      residents(n, t, x, z, rnd);
    });
    for (let i = t.nodes.length; i < slots.length; i++) {
      const sx = t.x + slots[i][0] + (rnd() - 0.5) * 0.2;
      const sz = t.z + slots[i][1] + (rnd() - 0.5) * 0.2;
      const flora = theme.flora === 'mixed' ? (rnd() < 0.5 ? 'pine' : 'tree') : theme.flora;
      if (flora === 'crates' && i % 2 === 0) props.crates(sx, sz, rnd, TOP);
      else if (flora === 'pine') props.conifer(sx, sz, 0.42 + rnd() * 0.1, rnd, TOP);
      else props.tree(sx, sz, 0.5 + rnd() * 0.15, rnd, TOP, theme.palette);
    }
    for (let k = 0; k < 6; k++) {
      if (rnd() < 0.55) {
        const [bx, bz] = hexVertex(t.x, t.z, 1.48, k);
        props.bush(bx, bz, 0.2 + rnd() * 0.1, rnd, TOP);
      }
    }
    // lamps on the curb, clear of the walking ring the walkers use
    for (const k of [1, 4]) {
      const [lx, lz] = hexVertex(t.x, t.z, 1.98, k);
      props.lamp(lx, lz, TOP);
    }
  }

  // One person in front of a class's house per article written about it
  // (up to three), side by side on the side facing away from the tile's
  // centre, looking out at the visitor.
  function residents(n, t, x, z, rnd) {
    const m = (n.articles || []).length;
    if (!m) return;
    let dx = x - t.x, dz = z - t.z;
    const L = Math.hypot(dx, dz);
    if (L < 0.01) (dx = 0), (dz = 1);
    else (dx /= L), (dz /= L);
    const out = classKind(n) === 'key' ? 0.56 : 0.5;
    for (let k = 0; k < m; k++) {
      const off = (k - (m - 1) / 2) * 0.17;
      const px = x + dx * out + dz * off, pz = z + dz * out - dx * off;
      props.person(px, pz, Math.atan2(dx, dz) + (rnd() - 0.5) * 0.6, TOP, { node: n.id, article: k });
    }
  }

  // ---- selection outline per island: only the edges facing another island
  for (const c of layout.clusters) {
    const pos = [];
    const y = TOP + 0.06;
    for (const t of c.tiles)
      for (let k = 0; k < 6; k++) {
        const [dq, dr] = DIRS[edgeDir(k)];
        const nb = tileAt.get(t.q + dq + ',' + (t.r + dr));
        if (nb && nb.cat === t.cat) continue;
        const [ax, az] = hexVertex(t.x, t.z, R + 0.02, k);
        const [bx, bz] = hexVertex(t.x, t.z, R + 0.02, k + 1);
        const [ix, iz] = hexVertex(t.x, t.z, R - 0.1, k);
        const [jx, jz] = hexVertex(t.x, t.z, R - 0.1, k + 1);
        pos.push(ax, y, az, bx, y, bz, jx, y, jz, ax, y, az, jx, y, jz, ix, y, iz);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, outlineMat);
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    outlines.set(c.cat, m);
  }

  return { pickTargets, outlines, anchors };
}

// Bridge look by relation strength: 4+ links a wide stone bridge, 2–3 a wooden
// one, a single link a narrow footbridge; a plain walkway (no relation, only
// there so every island can be reached) is a rope bridge.
function bridgeStyle(n) {
  if (!n) return { deck: [0xb7a993, 0xa89a84], width: 0.3, thick: 0.03, post: 0x7d6a58, rail: 0x7d6a58, arch: 0.05, walls: false };
  if (n >= 4) return { deck: [0xd6cbb8, 0xcabfab], width: 0.62, thick: 0.06, post: 0xe6dccb, rail: 0xe6dccb, arch: 0.12, walls: true };
  if (n >= 2) return { deck: [0xb48560, 0xa77a55], width: 0.46, thick: 0.04, post: 0xfff8f4, rail: 0x9a7454, arch: 0.09, walls: false };
  return { deck: [0xc9a27c, 0xb8916b], width: 0.36, thick: 0.035, post: 0xfff8f4, rail: 0x9a7454, arch: 0.07, walls: false };
}

// An arched bridge from tile a's edge to tile b's edge. Every part is owned by
// the bridge id so it can be hovered (relation tooltip) and highlighted.
function buildBridge(kit, br) {
  const { a, b, id } = br;
  const st = bridgeStyle(br.rel ? br.rel.n : 0);
  const dx = b.x - a.x, dz = b.z - a.z;
  const L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L;
  const ri = R * 0.866 - 0.12;
  const ax = a.x + ux * ri, az = a.z + uz * ri;
  const len = L - 2 * ri;
  const yaw = Math.atan2(ux, uz);
  const arch = st.arch * Math.min(2, Math.max(1, len / 2)); // long spans arch higher
  const at = (t) => [ax + ux * len * t, TOP + 0.03 + Math.sin(t * Math.PI) * arch, az + uz * len * t];
  const tilt = (t) => -Math.atan((Math.cos(t * Math.PI) * arch * Math.PI) / len);
  const px = uz, pz = -ux; // sideways unit vector
  const half = st.width / 2 - 0.02;

  const N = Math.max(6, Math.round(len / 0.3));
  for (let s = 0; s < N; s++) {
    const t = (s + 0.5) / N;
    kit.part('box', at(t), [st.width, st.thick, len / N + 0.01], st.deck[s % 2], id, [tilt(t), yaw, 0]);
  }
  const segs = Math.max(3, Math.round(len / 0.55));
  for (const side of [-1, 1]) {
    if (st.walls) {
      // low stone parapets following the arch
      for (let s = 0; s < segs; s++) {
        const t = (s + 0.5) / segs;
        const [x, y, z] = at(t);
        kit.part('box', [x + px * half * side, y + 0.08, z + pz * half * side], [0.06, 0.12, len / segs + 0.02], st.rail, id, [tilt(t), yaw, 0]);
      }
      continue;
    }
    for (let s = 0; s <= segs; s++) {
      const [x, y, z] = at(s / segs);
      kit.part('box', [x + px * half * side, y + 0.1, z + pz * half * side], [0.03, 0.18, 0.03], st.post, id);
    }
    for (let s = 0; s < segs; s++) {
      const t = (s + 0.5) / segs;
      const [x, y, z] = at(t);
      kit.part('box', [x + px * half * side, y + 0.19, z + pz * half * side], [0.022, 0.022, len / segs + 0.02], st.rail, id, [tilt(t), yaw, 0]);
    }
  }
  // piers under long spans
  if (len > 3.2) {
    for (const t of [1 / 3, 2 / 3]) {
      const [x, y, z] = at(t);
      const h = y - WATER_Y + 0.2;
      kit.part('cyl', [x, y - h / 2, z], [0.16, h, 0.16], st.walls ? 0xcabfab : 0x8a6a4e, id);
    }
  }
}

// One class = one small house in its island's architecture. The class decides
// floors and roof colour (key → three floors, gold roof and a flag;
// uncovered → one floor, flat grey roof); the theme decides walls, body and
// roof shape and proportions. Returns the height of the roof top.
function house(kit, n, theme, x, z, scale) {
  const h0 = hashString(n.id);
  const kind = classKind(n);
  const id = n.id;
  const P = (k, px, py, pz, sx, sy, sz, color) => kit.part(k, [px, py, pz], [sx, sy, sz], color, id);
  const FH = 0.32;
  let floors = kind === 'key' ? 3 : kind === 'un' ? 1 : 1 + (h0 % 2);
  if (theme.tall && kind !== 'un') floors += 1;
  if (theme.wide && kind !== 'key') floors = 1;
  let w = (kind === 'key' ? 0.72 : 0.6 + (h0 % 3) * 0.03) * scale;
  let d = (kind === 'key' ? 0.68 : 0.57 + ((h0 >>> 3) % 3) * 0.03) * scale;
  if (theme.wide) (w *= 1.2), (d *= 0.92);
  if (theme.tall) (w *= 0.86), (d *= 0.86);
  const round = theme.body === 'round';
  if (round) d = w;
  const wall = kind === 'un' ? 0xd9d3c9 : theme.walls[(h0 >>> 5) % theme.walls.length];
  const yb = TOP + 0.05;
  const bodyH = floors * FH;
  const yTop = yb + bodyH;
  const fz = z + d / 2 + 0.006;

  // plinth + body + floor lines
  P(round ? 'cyl' : 'rbox', x, TOP + 0.025, z, w + 0.08, 0.05, d + 0.08, 0xd8ccb8);
  P(round ? 'cyl' : 'rbox', x, yb + bodyH / 2, z, w, bodyH, d, wall);
  for (let f = 1; f < floors; f++) P(round ? 'cyl' : 'box', x, yb + f * FH, z, w + 0.014, 0.022, d + 0.014, 0xe2d6c4);
  // windows (front on every body, sides on box bodies) and a door
  for (let f = 0; f < floors; f++) {
    const wy = yb + f * FH + FH * 0.55;
    if (!round) {
      P('glass', x + w / 2 + 0.006, wy, z, 0.012, FH * 0.36, d * 0.56, GLASS);
      P('glass', x - w / 2 - 0.006, wy, z, 0.012, FH * 0.36, d * 0.56, GLASS);
    }
    if (f === 0) {
      P('box', x, yb + 0.085, fz, 0.13, 0.17, 0.012, DOOR);
      P('glass', x - w * 0.3, wy, fz - (round ? 0.05 : 0), w * 0.2, FH * 0.36, 0.012, GLASS);
      P('glass', x + w * 0.3, wy, fz - (round ? 0.05 : 0), w * 0.2, FH * 0.36, 0.012, GLASS);
    } else {
      P('glass', x, wy, fz, w * (round ? 0.5 : 0.7), FH * 0.36, 0.012, GLASS);
    }
  }

  // roof
  const rc = ROOF[kind];
  const rh = 0.22 + 0.04 * floors;
  let roofTop;
  const roof = kind === 'un' ? 'none' : theme.roof;
  switch (roof) {
    case 'none':
      P('rbox', x, yTop + 0.025, z, w + 0.05, 0.05, d + 0.05, ROOF.un);
      return yTop + 0.05;
    case 'gable':
      P('box', x, yTop + 0.015, z, w + 0.09, 0.03, d + 0.09, 0xefe6da);
      P('gable', x, yTop + 0.03 + rh / 2, z, w + 0.08, rh, d + 0.1, rc);
      roofTop = yTop + 0.03 + rh;
      break;
    case 'flat':
      P('rbox', x, yTop + 0.035, z, w + 0.06, 0.07, d + 0.06, rc);
      P('box', x + w * 0.18, yTop + 0.12, z - d * 0.15, w * 0.3, 0.1, d * 0.3, 0xc9ced2);
      roofTop = yTop + 0.07;
      break;
    case 'saw':
      P('box', x, yTop + 0.015, z, w + 0.05, 0.03, d + 0.05, 0xefe6da);
      for (const k of [-1, 0, 1]) P('gable', x + (k * w) / 3, yTop + 0.03 + rh * 0.4, z, w / 3 + 0.01, rh * 0.8, d + 0.04, rc);
      roofTop = yTop + 0.03 + rh * 0.8;
      break;
    case 'dome': {
      const s = Math.min(w, d) * 1.02;
      if (!round) P('box', x, yTop + 0.015, z, w + 0.04, 0.03, d + 0.04, 0xefe6da);
      P('dome', x, yTop, z, s, rh * 1.2, s, rc);
      roofTop = yTop + rh * 1.2;
      break;
    }
    case 'cone':
      P('cyl', x, yTop + 0.015, z, w + 0.08, 0.03, w + 0.08, 0xefe6da);
      P('cone', x, yTop + 0.03 + rh * 0.75, z, w * 1.18, rh * 1.5, w * 1.18, rc);
      roofTop = yTop + 0.03 + rh * 1.5;
      break;
    default:
      // hip
      P('box', x, yTop + 0.015, z, w + 0.09, 0.03, d + 0.09, 0xefe6da);
      P('hip', x, yTop + 0.03 + rh / 2, z, w + 0.06, rh, d + 0.06, rc);
      roofTop = yTop + 0.03 + rh;
  }
  if (kind === 'key') {
    P('cyl', x, roofTop + 0.15, z, 0.02, 0.3, 0.02, 0x5a4a3c);
    P('box', x + 0.07, roofTop + 0.25, z, 0.13, 0.08, 0.008, 0xdb6a41);
  }
  // Language flags: a house with a Java / SSJS article flies a pennant in that
  // colour (blue / green) so the rarer languages stand out from a distance —
  // LotusScript is on nearly every house, so it gets none. They fly on a mast
  // to the left of the ridge, clear of the key class's coral flag.
  const langFlags = [];
  for (const a of n.articles || []) {
    if (a.lang === 'java' && !langFlags.includes(LANG_FLAG.java)) langFlags.push(LANG_FLAG.java);
    if (a.lang === 'ssjs' && !langFlags.includes(LANG_FLAG.ssjs)) langFlags.push(LANG_FLAG.ssjs);
  }
  if (langFlags.length) {
    const fx = x - w * 0.34;
    const base = roofTop + 0.04;
    const poleH = 0.46 + langFlags.length * 0.19;
    P('cyl', fx, base + poleH / 2, z, 0.024, poleH, 0.024, 0x5a4a3c);
    langFlags.forEach((c, i) => {
      P('box', fx + 0.15, base + poleH - 0.1 - i * 0.22, z, 0.3, 0.18, 0.016, c);
    });
  }
  return roofTop;
}
