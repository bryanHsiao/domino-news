// The language lens: look at the map through one language (LS / Java / SSJS).
//   - every class house takes one of three states: 'lit' (an article in that
//     language: brighter and, under Java / SSJS, a beam of light rising from
//     the roof — and its flag),
//     'has' (the class exists in that language, not written about yet: as it
//     is) or 'none' (no such class in that language — the UI, JSON, GPS…
//     classes: faded toward the haze, not grey, since grey already means "no
//     article yet" on the roofs);
//   - Java / SSJS: from the power plant on the shore a cable runs out along
//     the water to every island with a class in that language, lights flowing
//     on it toward the islands. SSJS first comes from the XPages town to the
//     plant over land, in green; from the plant on, the cables are the
//     back-end's charcoal (SSJS calls the same Java objects);
//   - LS: the class islands as they are, the plant and the XPages town dimmed
//     — LotusScript doesn't go through them.
// The scene does the tinting (it also has the search's tint to combine);
// this module says what state each thing is in and draws the cables.
import { R } from './layout.js';

export const LENSES = ['all', 'ls', 'java', 'ssjs'];
const CABLE = { java: 0x2d2d3a, ssjs: 0x4fa36b };
const SPARK = { java: 0xffd27a, ssjs: 0xb9f5c9 };
const RISE = 0.035; // cable centre above the water / ground

export function createLens(THREE, scene, { layout, world, data, heightAt, haloTex }) {
  const shoreOf = (n) => n.shore || null;
  const plant = world.landmarks.find((l) => l.kind === 'powerplant');
  const town = world.landmarks.find((l) => l.kind === 'glasshall');

  // ---- what state a class (or shore building) is in under a lens
  function stateOf(n, lens) {
    if (lens === 'all') return 'has';
    const shore = shoreOf(n);
    const has = (lang) => (n.articles || []).some((a) => a.lang === lang);
    if (shore === 'openntf') return 'none'; // community, not a language
    if (shore) return lens === 'ls' ? 'none' : has(lens) ? 'lit' : 'has';
    if (lens === 'ls') return has('ls') ? 'lit' : 'has';
    if (has(lens)) return 'lit';
    return (lens === 'java' ? n.jv : n.sv) ? 'has' : 'none';
  }
  // a shore area's landmark: dimmed under LS, as it is otherwise
  const landmarkDim = (lens, cat) => lens === 'ls' && layout.harbours.some((h) => h.cat === cat && h.kind !== 'openntf');

  // ---- cables
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const cableSets = { java: [], ssjs: [] }; // per lens: { curve, len, color, spark }
  const lift = (x, z) => heightAt(x, z) + RISE;
  function cable(lens, from, to, color, spark, landOnly) {
    const L = Math.hypot(to.x - from.x, to.z - from.z);
    const n = Math.max(8, Math.round(L / 0.5));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      // a slight sideways sway so a fan of cables doesn't read as ruled lines
      const sway = landOnly ? 0 : Math.sin(f * Math.PI) * 0.35 * Math.sin(L);
      const x = from.x + (to.x - from.x) * f + ((to.z - from.z) / L) * sway;
      const z = from.z + (to.z - from.z) * f - ((to.x - from.x) / L) * sway;
      pts.push(new THREE.Vector3(x, lift(x, z), z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, n * 2, landOnly ? 0.04 : 0.028, 6, false),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 }),
    );
    mesh.userData.lens = lens;
    group.add(mesh);
    cableSets[lens].push({ curve, len: curve.getLength(), spark, mesh });
  }
  if (plant) {
    // the cable leaves the plant on its lake side and reaches each island at
    // the edge of its tile nearest the plant
    for (const lens of ['java', 'ssjs']) {
      const key = lens === 'java' ? 'jv' : 'sv';
      for (const c of layout.clusters) {
        if (c.members.some((n) => n.shore) || !c.members.some((n) => n[key])) continue;
        const t = c.tiles.reduce((a, b) => (Math.hypot(b.x - plant.x, b.z - plant.z) < Math.hypot(a.x - plant.x, a.z - plant.z) ? b : a));
        const d = Math.hypot(plant.x - t.x, plant.z - t.z);
        const end = { x: t.x + ((plant.x - t.x) / d) * R * 0.8, z: t.z + ((plant.z - t.z) / d) * R * 0.8 };
        cable(lens, plant, end, CABLE.java, SPARK[lens], false);
      }
    }
    // SSJS: the XPages town feeds the plant over land, in green
    if (town) cable('ssjs', town, plant, CABLE.ssjs, SPARK.ssjs, true);
  }

  // ---- lights flowing along the cables (one Points cloud, re-filled per frame)
  const PER = 3; // lights per cable
  const maxPts = Math.max(cableSets.java.length, cableSets.ssjs.length) * PER;
  const pos = new Float32Array(maxPts * 3);
  const col = new Float32Array(maxPts * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sparks = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.95, map: haloTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  sparks.frustumCulled = false;
  sparks.renderOrder = 5;
  group.add(sparks);

  // ---- a lit house: a warm glow on its roof and a soft beam of light rising
  // from it, readable in daylight too (one instance per class house; the
  // unlit ones are scaled to nothing)
  const lit = data.nodes.filter((n) => world.anchors.has(n.id));
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(lit.length * 3), 3));
  const glowMat = new THREE.PointsMaterial({ size: 1.3, map: haloTex, color: 0xffd98a, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  const glows = new THREE.Points(glowGeo, glowMat);
  glows.visible = false;
  glows.frustumCulled = false;
  glows.renderOrder = 4;
  scene.add(glows);
  const BEAM_H = 1.6;
  const beamGeo = new THREE.CylinderGeometry(0.07, 0.24, BEAM_H, 12, 1, true).translate(0, BEAM_H / 2, 0);
  {
    // fade the beam out toward its top
    const at = beamGeo.attributes.position;
    const a = new Float32Array(at.count);
    for (let i = 0; i < at.count; i++) a[i] = 1 - at.getY(i) / BEAM_H;
    beamGeo.setAttribute('alpha', new THREE.BufferAttribute(a, 1));
  }
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xffc861) } },
    vertexShader: 'attribute float alpha; varying float vA; void main() { vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uColor; varying float vA; void main() { gl_FragColor = vec4(uColor * vA * 0.75, 1.0); }',
  });
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, lit.length);
  beams.visible = false;
  beams.frustumCulled = false;
  beams.renderOrder = 4;
  scene.add(beams);
  const m4 = new THREE.Matrix4();

  let lens = 'all';
  let time = 0;
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  function set(next) {
    lens = LENSES.includes(next) ? next : 'all';
    const wired = lens === 'java' || lens === 'ssjs';
    group.visible = wired;
    for (const m of group.children) if (m.userData.lens) m.visible = m.userData.lens === lens;
    // only the lit houses' glows and beams: the others are parked out of
    // sight / scaled to nothing
    const at = glowGeo.attributes.position;
    lit.forEach((n, i) => {
      const a = world.anchors.get(n.id);
      // LotusScript has an article on nearly every house: under LS the warm
      // tint alone says "lit", or the beams would drown the islands
      const on = (lens === 'java' || lens === 'ssjs') && stateOf(n, lens) === 'lit';
      at.setXYZ(i, a.x, on ? a.y + 0.2 : -50, a.z);
      beams.setMatrixAt(i, on ? m4.makeTranslation(a.x, a.y + 0.05, a.z) : m4.makeScale(0, 0, 0));
    });
    at.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;
    glows.visible = beams.visible = lens !== 'all';
    geo.setDrawRange(0, wired ? cableSets[lens].length * PER : 0);
    return lens;
  }
  function update(dt) {
    if (lens !== 'java' && lens !== 'ssjs') return;
    time += dt;
    let k = 0;
    for (const cb of cableSets[lens]) {
      for (let j = 0; j < PER; j++) {
        // about one unit a second, evenly spaced, from the plant outward
        const f = (((time * 1.1) / cb.len + j / PER) % 1 + 1) % 1;
        cb.curve.getPointAt(f, p);
        pos[k * 3] = p.x;
        pos[k * 3 + 1] = p.y + 0.05;
        pos[k * 3 + 2] = p.z;
        c.set(cb.spark);
        col[k * 3] = c.r;
        col[k * 3 + 1] = c.g;
        col[k * 3 + 2] = c.b;
        k++;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }
  set('all');
  update(0);

  return {
    set,
    get: () => lens,
    stateOf: (n) => stateOf(n, lens),
    landmarkDim: (cat) => landmarkDim(lens, cat),
    update,
  };
}

