// Procedural archipelago layout for the class-islands view.
//
// Every LotusScript category becomes one island built from same-size
// pointy-top hex tiles on an axial grid; the tile count grows with the
// category's class count (one tile per PER_TILE classes). Islands are placed
// by their relationships — the class links ("A returns B") summed per
// category pair — so related islands sit side by side, then pushed apart so
// water runs between them. Bridges exist only where categories are related,
// and together with each tile's walking ring they form a walkable network.
// Pure and deterministic: the same data always produces the same map.

export const R = 2.02; // hex circumradius (vertex toward ±z)
export const SPACING = 2.28; // grid pitch; leaves a narrow channel between tiles
export const TOP = 0.65; // deck height
export const WATER_Y = -0.18;
export const PER_TILE = 6; // class buildings per tile
// After packing, every island is pushed away from the map centre by this
// factor, then nudged until no channel between two islands is narrower than
// MIN_CHANNEL (tiles of one island stay joined).
export const SPREAD = 1.25;
const MIN_CHANNEL = 1.3;
const WALK_RING = 1.8;
// Off-shore islands sit this much open water away from the archipelago, in
// this direction (radians in the x/z plane; +z faces the default camera).
const OFFSHORE_GAP = 6;
const OFFSHORE_ANGLE = 1.1; // radius of the walking ring painted on each tile

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

// Cross-category relations from the class links, keyed by the sorted
// category pair: how many links, and which class/member each goes through.
function categoryRelations(data) {
  const catOf = new Map(data.nodes.map((n) => [n.id, n.cat]));
  const rel = new Map();
  for (const l of data.links || []) {
    const a = catOf.get(l.s);
    const b = catOf.get(l.t);
    if (!a || !b || a === b) continue;
    const [x, y] = [a, b].sort();
    const k = x + '|' + y;
    if (!rel.has(k)) rel.set(k, { a: x, b: y, n: 0, via: [] });
    const r = rel.get(k);
    r.n++;
    r.via.push({ s: l.s, t: l.t, m: (l.via || [])[0] || null });
  }
  return rel;
}

export function layoutArchipelago(data) {
  const rel = categoryRelations(data);
  const relFor = (a, b) => rel.get([a, b].sort().join('|')) || null;
  const weight = (a, b) => (relFor(a, b) || { n: 0 }).n;
  const counts = new Map(data.cats.map((c) => [c, data.nodes.filter((n) => n.cat === c).length]));

  // Placement order: the best-connected category first (Session, the hub),
  // then repeatedly the category with the most links to the islands already
  // placed, so the strong relations (Session ⇄ Database ⇄ Document ⇄ Item…)
  // are always a single bridge apart. Among equally linked ones, the island
  // whose relations are most fully covered goes first — a small island that
  // only relates to the hub claims a spot beside it before one that has
  // other partners to sit next to.
  // Off-shore islands (the XPages / web-layer posts: not Notes classes, no
  // class links) are packed on their own and set apart across open water, so
  // they never read as part of the class archipelago.
  const offshore = new Set(data.cats.filter((c) => data.nodes.some((n) => n.cat === c && n.island)));
  const coreCats = data.cats.filter((c) => !offshore.has(c));
  const total = (c) => data.cats.reduce((s, o) => s + (o === c ? 0 : weight(c, o)), 0);
  const order = [];
  const left = [...coreCats];
  while (left.length) {
    let pick = 0;
    let pickKey = null;
    left.forEach((c, i) => {
      const w = order.reduce((s, p) => s + weight(c, p), 0);
      const k = order.length
        ? [w, Math.round((1000 * w) / Math.max(1, total(c))), counts.get(c), -data.cats.indexOf(c)]
        : [total(c), 0, counts.get(c), -data.cats.indexOf(c)];
      if (!pickKey || lexLess(pickKey, k)) {
        pick = i;
        pickKey = k;
      }
    });
    order.push(left.splice(pick, 1)[0]);
  }

  // Pack the islands on the hex grid, each pulled next to the islands it
  // relates to most.
  const taken = new Map(); // "q,r" -> category
  const spread = (q, r) => {
    const [x, z] = axialToXZ(q, r);
    return Math.hypot(x, z * 1.3); // wider than deep: it is viewed from the front
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
  const affinity = (cat, q, r) => {
    const seen = new Set();
    let a = 0;
    for (const [dq, dr] of DIRS) {
      const o = taken.get(keyOf(q + dq, r + dr));
      if (o && o !== cat && !seen.has(o)) {
        seen.add(o);
        a += weight(cat, o);
      }
    }
    return a;
  };
  const cellsOf = new Map();
  for (const cat of [...order, ...offshore]) {
    const want = Math.max(1, Math.ceil(counts.get(cat) / PER_TILE));
    const cells = [];
    const take = (c) => {
      cells.push(c);
      taken.set(keyOf(c[0], c[1]), cat);
    };
    const placed = coreCats.flatMap((c) => cellsOf.get(c) || []);
    // an off-shore island starts far out on the grid, where it has no
    // neighbours (and so no bridges); it is moved into place below
    if (offshore.has(cat)) take([1000 + 40 * cellsOf.size, 0]);
    else take(placed.length ? pickBest(freeAround(placed), (c) => spread(c[0], c[1]) - 6 * affinity(cat, c[0], c[1])) : [0, 0]);
    while (cells.length < want) {
      let mx = 0;
      let mz = 0;
      for (const [q, r] of cells) {
        const [x, z] = axialToXZ(q, r);
        mx += x / cells.length;
        mz += z / cells.length;
      }
      // Bigger islands grow outward, away from the centre, so they don't wrap
      // around the hub and use up the spots its other partners need.
      take(
        pickBest(freeAround(cells), (c) => {
          const [x, z] = axialToXZ(c[0], c[1]);
          return Math.hypot(x - mx, z - mz) - 0.35 * spread(c[0], c[1]) - 1.5 * affinity(cat, c[0], c[1]);
        }),
      );
    }
    cellsOf.set(cat, cells);
  }

  // Push the islands apart: first away from the packed centre, then pairwise
  // until every channel between two islands is at least MIN_CHANNEL wide
  // (each island moves rigidly, so its own tiles stay joined).
  const packed = coreCats.flatMap((c) => cellsOf.get(c)).map(([q, r]) => axialToXZ(q, r));
  const gx = packed.reduce((s, p) => s + p[0], 0) / packed.length;
  const gz = packed.reduce((s, p) => s + p[1], 0) / packed.length;
  const home = new Map(data.cats.map((cat) => [cat, cellsOf.get(cat).map(([q, r]) => axialToXZ(q, r))]));
  const off = new Map(
    data.cats.map((cat) => {
      const ps = home.get(cat);
      const ox = ps.reduce((s, p) => s + p[0], 0) / ps.length;
      const oz = ps.reduce((s, p) => s + p[1], 0) / ps.length;
      return [cat, [(SPREAD - 1) * (ox - gx), (SPREAD - 1) * (oz - gz)]];
    }),
  );
  const INR = R * 0.866;
  for (let it = 0; it < 300; it++) {
    let moved = false;
    for (let i = 0; i < coreCats.length; i++)
      for (let j = i + 1; j < coreCats.length; j++) {
        const A = coreCats[i], B = coreCats[j];
        const oa = off.get(A), ob = off.get(B);
        let bd = Infinity, ux = 0, uz = 0;
        for (const [ax, az] of home.get(A))
          for (const [bx, bz] of home.get(B)) {
            const vx = bx + ob[0] - ax - oa[0], vz = bz + ob[1] - az - oa[1];
            const d = Math.hypot(vx, vz);
            if (d < bd) {
              bd = d;
              ux = vx / d;
              uz = vz / d;
            }
          }
        const gap = bd - 2 * INR;
        if (gap < MIN_CHANNEL - 1e-3) {
          const push = (MIN_CHANNEL - gap) / 2 + 0.01;
          oa[0] -= ux * push;
          oa[1] -= uz * push;
          ob[0] += ux * push;
          ob[1] += uz * push;
          moved = true;
        }
      }
    if (!moved) break;
  }

  // Off-shore islands: out along OFFSHORE_ANGLE from the archipelago's
  // centre, with at least OFFSHORE_GAP of water between them and the nearest
  // class island (measured along that direction, so it holds for every tile).
  const coreXZ = coreCats.flatMap((cat) => home.get(cat).map(([x, z]) => [x + off.get(cat)[0], z + off.get(cat)[1]]));
  const ccx = coreXZ.reduce((s, p) => s + p[0], 0) / coreXZ.length;
  const ccz = coreXZ.reduce((s, p) => s + p[1], 0) / coreXZ.length;
  [...offshore].forEach((cat, k) => {
    const a = OFFSHORE_ANGLE + k * 0.7;
    const ux = Math.cos(a), uz = Math.sin(a);
    const ps = home.get(cat);
    const ox = ps.reduce((s, p) => s + p[0], 0) / ps.length;
    const oz = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    const reachCore = Math.max(...coreXZ.map(([x, z]) => (x - ccx) * ux + (z - ccz) * uz));
    const reachOwn = Math.max(...ps.map(([x, z]) => -((x - ox) * ux + (z - oz) * uz)));
    const d = reachCore + reachOwn + 2 * INR + OFFSHORE_GAP;
    off.set(cat, [ccx + ux * d - ox, ccz + uz * d - oz]);
  });

  const clusters = data.cats.map((cat, i) => {
    // Key classes first so they land on the island's back tile.
    const members = data.nodes.filter((n) => n.cat === cat).sort((a, b) => Number(b.key) - Number(a.key));
    const cells = cellsOf.get(cat);
    const [dx, dz] = off.get(cat);
    const tiles = cells
      .map(([q, r]) => {
        const [x, z] = axialToXZ(q, r);
        return { q, r, x: x + dx, z: z + dz, cat, nodes: [] };
      })
      .sort((a, b) => a.z - b.z || a.x - b.x); // back to front
    members.forEach((m, j) => tiles[Math.floor((j * tiles.length) / members.length)].nodes.push(m));

    const cx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
    const cz = tiles.reduce((s, t) => s + t.z, 0) / tiles.length;
    const radius = Math.max(...tiles.map((t) => Math.hypot(t.x - cx, t.z - cz))) + R;
    // Name plate hangs on the front edge of the front-most tile.
    const front = tiles.reduce((f, t) => (t.z > f.z + 1e-6 || (Math.abs(t.z - f.z) < 1e-6 && Math.abs(t.x - cx) < Math.abs(f.x - cx)) ? t : f));
    return { cat, num: i + 1, count: members.length, members, tiles, cx, cz, radius, anchor: { x: front.x, z: front.z + R * 0.94 }, relations: [] };
  });

  const tiles = clusters.flatMap((c) => c.tiles);
  const tileAt = new Map(tiles.map((t) => [keyOf(t.q, t.r), t]));
  const byCat = new Map(clusters.map((c) => [c.cat, c]));

  const fused = []; // same-island neighbour tiles → filled land between them
  const junctions = []; // three same-island tiles meeting → plug the small triangle
  const bridgeCands = new Map(); // neighbouring island pair → candidate tile pairs
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

  // Bridges only between neighbouring islands whose categories are related:
  // the tile pair closest to the line between the two island centres.
  const pickPair = (cands) => {
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
    return best;
  };
  const bridges = [];
  for (const cands of bridgeCands.values()) {
    const r = relFor(cands[0][0].cat, cands[0][1].cat);
    if (!r) continue;
    const [a, b] = pickPair(cands);
    bridges.push({ a, b, rel: r });
  }
  // Related islands that don't touch get a longer bridge across the water
  // when nothing stands in the way — always for an island with no related
  // bridge yet, otherwise only for strong relations (3+ links).
  const hasRelBridge = (cat) => bridges.some((b) => b.rel && (b.a.cat === cat || b.b.cat === cat));
  const segDist = (px, pz, ax, az, bx, bz) => {
    const vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
    return Math.hypot(px - ax - t * vx, pz - az - t * vz);
  };
  const longCands = [...rel.values()]
    .filter((r) => !bridges.some((b) => b.rel === r))
    .sort((x, y) => y.n - x.n || (x.a + x.b).localeCompare(y.a + y.b));
  for (const r of longCands) {
    if (r.n < 3 && hasRelBridge(r.a) && hasRelBridge(r.b)) continue;
    let best = null;
    let bd = Infinity;
    for (const a of byCat.get(r.a).tiles)
      for (const b of byCat.get(r.b).tiles) {
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (d < bd) {
          bd = d;
          best = [a, b];
        }
      }
    const [a, b] = best;
    if (bd - 2 * (R * 0.866 - 0.12) > 7.5) continue;
    const blocked = tiles.some((t) => t !== a && t !== b && segDist(t.x, t.z, a.x, a.z, b.x, b.z) < R * 0.95);
    if (!blocked) bridges.push({ a, b, rel: r });
  }
  // Every island must stay reachable on foot: a group of islands cut off from
  // the rest gets a plain footbridge to a neighbouring island.
  const parent = new Map(data.cats.map((c) => [c, c]));
  const find = (c) => {
    while (parent.get(c) !== c) c = parent.get(c);
    return c;
  };
  for (const b of bridges) parent.set(find(b.a.cat), find(b.b.cat));
  for (const cands of bridgeCands.values()) {
    if (find(cands[0][0].cat) === find(cands[0][1].cat)) continue;
    const [a, b] = pickPair(cands);
    bridges.push({ a, b, rel: null });
    parent.set(find(a.cat), find(b.cat));
  }
  bridges.forEach((b, i) => (b.id = 'bridge:' + i));

  // Each island lists the categories it relates to — bridged directly, or
  // reached by walking across other islands.
  for (const r of rel.values()) {
    const bridged = bridges.some((b) => b.rel === r);
    byCat.get(r.a).relations.push({ cat: r.b, n: r.n, bridged });
    byCat.get(r.b).relations.push({ cat: r.a, n: r.n, bridged });
  }
  for (const c of clusters) c.relations.sort((x, y) => y.n - x.n || x.cat.localeCompare(y.cat));

  const walk = buildWalkGraph(tiles, fused, bridges);

  // An off-shore island is reached by ferry, not a bridge: a pier on the
  // nearest class island and one on the off-shore island, facing each other.
  const ferries = [...offshore].map((cat) => {
    let best = null;
    let bd = Infinity;
    for (const a of tiles)
      if (!offshore.has(a.cat))
        for (const b of byCat.get(cat).tiles) {
          const d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d < bd) {
            bd = d;
            best = [a, b];
          }
        }
    const [a, b] = best;
    return { cat, a: { x: a.x, z: a.z, cat: a.cat }, b: { x: b.x, z: b.z } };
  });

  const bx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
  const bz = tiles.reduce((s, t) => s + t.z, 0) / tiles.length;
  const radius = Math.max(...tiles.map((t) => Math.hypot(t.x - bx, t.z - bz))) + R;
  return { clusters, tiles, fused, junctions, bridges, relations: [...rel.values()], walk, ferries, offshore: [...offshore], bounds: { cx: bx, cz: bz, radius } };
}

// Pedestrian network for future walkers: 12 nodes on each tile's walking ring
// (vertices + edge midpoints), joined across fused tiles and over bridges.
// Not drawn in v1 — the ring paving and the bridges are its visible form.
function buildWalkGraph(tiles, fused, bridges) {
  const nodes = [];
  const edges = [];
  const adj = [];
  const add = (x, z, cat) => {
    nodes.push({ x, z, cat });
    adj.push([]);
    return nodes.length - 1;
  };
  // arch: peak height of a bridge deck along this edge (0 on land)
  const link = (a, b, arch = 0) => {
    const len = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    edges.push([a, b, len, arch]);
    adj[a].push([b, len, arch]);
    adj[b].push([a, len, arch]);
  };
  const ring = new Map();
  for (const t of tiles) {
    const ids = [];
    for (let k = 0; k < 6; k++) {
      const [vx, vz] = hexVertex(t.x, t.z, WALK_RING, k);
      const [wx, wz] = hexVertex(t.x, t.z, WALK_RING, k + 1);
      ids.push(add(vx, vz, t.cat), add((vx + wx) / 2, (vz + wz) / 2, t.cat));
    }
    for (let k = 0; k < 12; k++) link(ids[k], ids[(k + 1) % 12]);
    ring.set(t, ids);
  }
  const nearest = (t, x, z) => {
    let best = -1;
    let bd = Infinity;
    for (const id of ring.get(t)) {
      const d = Math.hypot(nodes[id].x - x, nodes[id].z - z);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    return best;
  };
  for (const [a, b] of fused) link(nearest(a, b.x, b.z), nearest(b, a.x, a.z));
  for (const br of bridges) {
    br.walk = [nearest(br.a, br.b.x, br.b.z), nearest(br.b, br.a.x, br.a.z)];
    // same arch as the drawn bridge (world.js bridgeStyle): stronger relation,
    // higher arch; long spans arch up to twice as high
    const deck = Math.hypot(br.a.x - br.b.x, br.a.z - br.b.z) - 2 * (R * 0.866 - 0.12);
    const base = !br.rel ? 0.05 : br.rel.n >= 4 ? 0.12 : br.rel.n >= 2 ? 0.09 : 0.07;
    br.arch = base * Math.min(2, Math.max(1, deck / 2));
    link(br.walk[0], br.walk[1], br.arch);
  }
  return { nodes, edges, adj };
}

// Shortest walk between two walk-graph nodes (Dijkstra); [] when unreachable.
export function walkPath(walk, from, to) {
  const n = walk.nodes.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const done = new Array(n).fill(false);
  dist[from] = 0;
  for (;;) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++)
      if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    if (u < 0 || u === to) break;
    done[u] = true;
    for (const [v, w] of walk.adj[u])
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
  }
  if (dist[to] === Infinity) return [];
  const path = [];
  for (let v = to; v >= 0; v = prev[v]) path.unshift(v);
  return path;
}
