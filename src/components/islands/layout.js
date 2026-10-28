// Procedural archipelago layout for the class-islands view.
//
// Every LotusScript category becomes one island built from same-size
// pointy-top hex tiles on an axial grid. The tile count grows with the
// category's class count (one tile per PER_TILE classes), so a bigger
// category is a bigger island while the whole map still tiles tightly like a
// city of plazas joined by bridges. Pure and deterministic: the same data
// always produces the same map, so islands never jump between builds.

export const R = 2.02; // hex circumradius (vertex toward ±z)
export const SPACING = 2.28; // grid pitch; leaves a narrow channel between tiles
export const TOP = 0.65; // deck height
export const WATER_Y = -0.18;
export const PER_TILE = 6; // class buildings per tile

const SQ3 = Math.sqrt(3);

// Axial neighbour deltas in angle order 0°, 60°, … 300° (measured x → z).
export const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

export function axialToXZ(q, r) {
  return [SQ3 * SPACING * (q + r / 2), 1.5 * SPACING * r];
}

// Vertex k of a pointy-top hex; k = 0 points toward +z.
export function hexVertex(cx, cz, r, k) {
  const a = Math.PI / 2 + (k * Math.PI) / 3;
  return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
}

// The edge between vertex k and k + 1 faces DIRS[edgeDir(k)].
export const edgeDir = (k) => (k + 2) % 6;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const keyOf = (q, r) => q + ',' + r;

function lexLess(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

// Lowest score wins; ties fall back to angle, then axial coordinates, so the
// choice never depends on iteration order.
function pickBest(cells, score) {
  let best = null;
  let bestRank = null;
  for (const c of cells) {
    const [x, z] = axialToXZ(c[0], c[1]);
    const rank = [Math.round(score(c) * 1e6), Math.round(Math.atan2(z, x) * 1e6), c[0], c[1]];
    if (!bestRank || lexLess(rank, bestRank)) {
      best = c;
      bestRank = rank;
    }
  }
  return best;
}

export function layoutArchipelago(data) {
  const taken = new Map(); // "q,r" -> category
  const takenCells = [];
  // Distance from the map centre, stretched along z so the archipelago grows
  // wider than deep — it is viewed from the front on a landscape screen.
  const spread = (q, r) => {
    const [x, z] = axialToXZ(q, r);
    return Math.hypot(x, z * 1.3);
  };
  const freeAround = (cells) => {
    const out = new Map();
    for (const [q, r] of cells)
      for (const [dq, dr] of DIRS) {
        const k = keyOf(q + dq, r + dr);
        if (!taken.has(k) && !out.has(k)) out.set(k, [q + dq, r + dr]);
      }
    return [...out.values()];
  };

  const clusters = data.cats.map((cat, i) => {
    // Key classes first so they land on the cluster's back tile, centre slot.
    const members = data.nodes.filter((n) => n.cat === cat).sort((a, b) => Number(b.key) - Number(a.key));
    const want = Math.max(1, Math.ceil(members.length / PER_TILE));
    const cells = [];
    const take = (c) => {
      cells.push(c);
      takenCells.push(c);
      taken.set(keyOf(c[0], c[1]), cat);
    };
    take(takenCells.length ? pickBest(freeAround(takenCells), (c) => spread(c[0], c[1])) : [0, 0]);
    while (cells.length < want) {
      let mx = 0;
      let mz = 0;
      for (const [q, r] of cells) {
        const [x, z] = axialToXZ(q, r);
        mx += x / cells.length;
        mz += z / cells.length;
      }
      take(
        pickBest(freeAround(cells), (c) => {
          const [x, z] = axialToXZ(c[0], c[1]);
          return Math.hypot(x - mx, z - mz) + 0.35 * spread(c[0], c[1]);
        }),
      );
    }

    const tiles = cells
      .map(([q, r]) => {
        const [x, z] = axialToXZ(q, r);
        return { q, r, x, z, cat, nodes: [] };
      })
      .sort((a, b) => a.z - b.z || a.x - b.x); // back to front
    members.forEach((m, j) => tiles[Math.floor((j * tiles.length) / members.length)].nodes.push(m));

    const cx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
    const cz = tiles.reduce((s, t) => s + t.z, 0) / tiles.length;
    const radius = Math.max(...tiles.map((t) => Math.hypot(t.x - cx, t.z - cz))) + R;
    // Name plate hangs on the front edge of the front-most tile.
    const front = tiles.reduce((f, t) => (t.z > f.z + 1e-6 || (Math.abs(t.z - f.z) < 1e-6 && Math.abs(t.x - cx) < Math.abs(f.x - cx)) ? t : f));
    return { cat, num: i + 1, count: members.length, members, tiles, cx, cz, radius, anchor: { x: front.x, z: front.z + R * 0.94 } };
  });

  const tiles = clusters.flatMap((c) => c.tiles);
  const tileAt = new Map(tiles.map((t) => [keyOf(t.q, t.r), t]));
  const byCat = new Map(clusters.map((c) => [c.cat, c]));

  const fused = []; // same-island neighbour tiles → filled land between them
  const junctions = []; // three same-island tiles meeting → plug the small triangle
  const bridgeCands = new Map(); // island pair → candidate tile pairs
  const seenJunction = new Set();
  for (const t of tiles) {
    DIRS.forEach(([dq, dr], d) => {
      const o = tileAt.get(keyOf(t.q + dq, t.r + dr));
      if (!o) return;
      if (d < 3) {
        // directions 0–2 visit each unordered pair exactly once
        if (o.cat === t.cat) fused.push([t, o]);
        else {
          const pk = [t.cat, o.cat].sort().join('|');
          if (!bridgeCands.has(pk)) bridgeCands.set(pk, []);
          bridgeCands.get(pk).push([t, o]);
        }
      }
      const [eq, er] = DIRS[(d + 1) % 6];
      const p = tileAt.get(keyOf(t.q + eq, t.r + er));
      if (p && o.cat === t.cat && p.cat === t.cat) {
        const jk = [keyOf(t.q, t.r), keyOf(o.q, o.r), keyOf(p.q, p.r)].sort().join('/');
        if (!seenJunction.has(jk)) {
          seenJunction.add(jk);
          junctions.push({ x: (t.x + o.x + p.x) / 3, z: (t.z + o.z + p.z) / 3, cat: t.cat });
        }
      }
    });
  }

  // One bridge per pair of touching islands: the tile pair closest to the
  // midpoint between the two island centres.
  const bridges = [];
  for (const cands of bridgeCands.values()) {
    const ca = byCat.get(cands[0][0].cat);
    const cb = byCat.get(cands[0][1].cat);
    const mx = (ca.cx + cb.cx) / 2;
    const mz = (ca.cz + cb.cz) / 2;
    let best = cands[0];
    let bd = Infinity;
    for (const pair of cands) {
      const d = Math.hypot((pair[0].x + pair[1].x) / 2 - mx, (pair[0].z + pair[1].z) / 2 - mz);
      if (d < bd - 1e-9) {
        bd = d;
        best = pair;
      }
    }
    bridges.push({ a: best[0], b: best[1] });
  }

  const bx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
  const bz = tiles.reduce((s, t) => s + t.z, 0) / tiles.length;
  const radius = Math.max(...tiles.map((t) => Math.hypot(t.x - bx, t.z - bz))) + R;
  return { clusters, tiles, fused, junctions, bridges, bounds: { cx: bx, cz: bz, radius } };
}
