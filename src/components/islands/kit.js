// Instanced part kit. Buildings and scenery are assembled from a few
// primitive parts (rounded boxes, hip roofs, foliage clumps…); parts are
// queued by geometry kind and flushed as one InstancedMesh per kind, so the
// whole archipelago costs a handful of draw calls.
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

let sharedGeo = null;

function geometries(THREE) {
  if (sharedGeo) return sharedGeo;
  // Lumpy low-poly foliage: an icosahedron with a deterministic per-vertex
  // jitter (keyed on position, so shared corners move together — no cracks).
  const leaf = new THREE.IcosahedronGeometry(0.5, 1);
  const pos = leaf.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 12.9 + y * 78.2 + z * 37.7) * 43758.5;
    const j = 1 + (n - Math.floor(n) - 0.5) * 0.18;
    pos.setXYZ(i, x * j, y * j, z * j);
  }
  leaf.computeVertexNormals();
  // gable roof: triangular prism, unit box footprint, ridge along z
  const gableShape = new THREE.Shape([new THREE.Vector2(-0.5, -0.5), new THREE.Vector2(0.5, -0.5), new THREE.Vector2(0, 0.5)]);
  sharedGeo = {
    gable: new THREE.ExtrudeGeometry(gableShape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5),
    // NB: dome sits with its base (rim) at the part's position, unlike the
    // centred kinds — scale y is the dome's height.
    dome: new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1),
    rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.09),
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cone: new THREE.ConeGeometry(0.5, 1, 7),
    sail: new THREE.ConeGeometry(0.5, 1, 3),
    // square pyramid whose base is exactly the unit square, so any w×d scale
    // stays a clean rectangular roof
    hip: new THREE.ConeGeometry(0.5, 1, 4).rotateY(Math.PI / 4).scale(Math.SQRT2, 1, Math.SQRT2),
    sphere: new THREE.SphereGeometry(0.5, 12, 8),
    trunk: new THREE.CylinderGeometry(0.32, 0.5, 1, 7),
    leaf,
    // light-emitting parts (windows, lamp heads): same shapes as box/sphere,
    // kept apart so they can get a material that glows at night
    glass: new THREE.BoxGeometry(1, 1, 1),
    bulb: new THREE.SphereGeometry(0.5, 12, 8),
    // five-pointed star, flat (unit size, depth 1 before scaling), centred:
    // the key-class marker on a roof
    star: new THREE.ExtrudeGeometry(starShape(THREE), { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5),
  };
  return sharedGeo;
}

function starShape(THREE) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.21 : 0.5;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r - 0.04));
  }
  return new THREE.Shape(pts);
}

// A banded part, for a roof in two or three colours: kind 'gable|3|1' is
// the second of three colours. Seen from above, the shape is cut like an
// umbrella into 2n equal sectors around its vertical axis, the colours
// taking turns (2 colours → 4 quarters, 3 → 6 sixths), and this is the
// sectors of colour k. Whichever side a roof is seen from, the half facing
// the camera spans every colour. The sectors together are exactly the whole
// shape, so only its outer surface is kept (no caps on the cuts). Every kit
// shape is centred on its vertical axis.
const bandCache = new Map();
function bandGeometry(THREE, base, n, k) {
  const g = base.index ? base.toNonIndexed() : base;
  const names = Object.keys(g.attributes);
  const pi = names.indexOf('position');
  const vert = (i) => names.map((nm) => {
    const a = g.attributes[nm];
    return Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize));
  });
  const mix = (a, b, t) => a.map((arr, j) => arr.map((x, c) => x + (b[j][c] - x) * t));
  // keep the part of a polygon where side(vertex) >= 0
  function clip(poly, side) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const fa = side(a[pi]), fb = side(b[pi]);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) out.push(mix(a, b, fa / (fa - fb)));
    }
    return out;
  }
  // which side of the vertical half-plane at angle `at` (about y) a point is
  const ccw = (at) => (p) => Math.cos(at) * p[2] - Math.sin(at) * p[0];
  const sectors = 2 * n;
  const step = (Math.PI * 2) / sectors;
  const data = names.map(() => []);
  const count = g.attributes.position.count;
  for (let s = k; s < sectors; s += n) {
    const a0 = s * step, a1 = a0 + step;
    const from = ccw(a0), to = ccw(a1);
    for (let t = 0; t + 2 < count; t += 3) {
      let poly = clip([vert(t), vert(t + 1), vert(t + 2)], from);
      if (poly.length) poly = clip(poly, (p) => -to(p));
      for (let i = 1; i + 1 < poly.length; i++) {
        for (const v of [poly[0], poly[i], poly[i + 1]]) v.forEach((arr, j) => data[j].push(...arr));
      }
    }
  }
  const out = new THREE.BufferGeometry();
  names.forEach((nm, j) => out.setAttribute(nm, new THREE.Float32BufferAttribute(data[j], g.attributes[nm].itemSize)));
  return out;
}
function geometryFor(THREE, geo, kind) {
  if (geo[kind]) return geo[kind];
  if (!bandCache.has(kind)) {
    const [base, n, k] = kind.split('|');
    bandCache.set(kind, bandGeometry(THREE, geo[base], +n, +k));
  }
  return bandCache.get(kind);
}

export function createKit(THREE) {
  const geo = geometries(THREE);
  const batches = new Map();
  const owned = new Map(); // owner id -> [{ mesh, index, color }]
  const tmp = new THREE.Color();

  // pos / scale are [x, y, z]; rot is [x, y, z] Euler applied yaw-first.
  function part(kind, pos, scale, color, owner = null, rot = null) {
    if (!batches.has(kind)) batches.set(kind, []);
    batches.get(kind).push({ pos, scale, color, owner, rot });
  }

  // `byKind` overrides the material for some kinds (e.g. glass/bulb → glow).
  function build(scene, material, byKind = {}) {
    const dummy = new THREE.Object3D();
    dummy.rotation.order = 'YXZ';
    const meshes = [];
    for (const [kind, items] of batches) {
      const mesh = new THREE.InstancedMesh(geometryFor(THREE, geo, kind), byKind[kind] || material, items.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      items.forEach((p, i) => {
        dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
        const r = p.rot || [0, 0, 0];
        dummy.rotation.set(r[0], r[1], r[2]);
        // tiny size jitter so coincident faces of two parts never z-fight
        const s = 1 + (((i * 7) % 9) - 4) * 0.0015;
        dummy.scale.set(p.scale[0] * s, p.scale[1] * s, p.scale[2] * s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        tmp.set(p.color);
        mesh.setColorAt(i, tmp);
        if (p.owner) {
          if (!owned.has(p.owner)) owned.set(p.owner, []);
          owned.get(p.owner).push({ mesh, index: i, color: tmp.clone() });
        }
      });
      mesh.userData.owners = items.map((p) => p.owner);
      mesh.userData.items = items; // base transforms, for parts animated later (boats)
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      meshes.push(mesh);
    }
    batches.clear();
    return meshes;
  }

  // Blend every part of one owner toward `target` (t = 0 restores the base).
  function tint(owner, target, t) {
    for (const p of owned.get(owner) || []) {
      tmp.copy(p.color).lerp(target, t);
      p.mesh.setColorAt(p.index, tmp);
      p.mesh.instanceColor.needsUpdate = true;
    }
  }

  return { part, build, tint };
}
