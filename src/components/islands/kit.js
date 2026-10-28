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
  };
  return sharedGeo;
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

  function build(scene, material) {
    const dummy = new THREE.Object3D();
    dummy.rotation.order = 'YXZ';
    const meshes = [];
    for (const [kind, items] of batches) {
      const mesh = new THREE.InstancedMesh(geo[kind], material, items.length);
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
