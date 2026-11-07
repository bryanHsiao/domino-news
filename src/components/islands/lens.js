// The language lens: look at the map through one language (LS / Java / SSJS).
//   - every class house takes one of three states: 'lit' (an article in that
//     language: brighter, with a warm glow on its roof and a beam of light
//     rising from it — under LS too, since 2026-11-07), 'has' (the class
//     exists in that language, not written about yet: as it is) or 'none'
//     (no such class in that language — the UI, JSON, GPS… classes: faded
//     toward the haze, not grey, since grey already means "no article yet"
//     on the roofs);
//   - LS: the power plant and the XPages town dimmed — LotusScript doesn't
//     go through them.
// The cables that once ran from the power plant to the islands under Java /
// SSJS were dropped (2026-11-07): the beams alone say where a language is.
// The scene does the tinting (it also has the search's tint to combine);
// this module says what state each thing is in and draws the beams.
export const LENSES = ['all', 'ls', 'java', 'ssjs'];

export function createLens(THREE, scene, { layout, world, data, haloTex }) {
  const shoreOf = (n) => n.shore || null;

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
  function set(next) {
    lens = LENSES.includes(next) ? next : 'all';
    // only the lit houses' glows and beams: the others are parked out of
    // sight / scaled to nothing
    const at = glowGeo.attributes.position;
    lit.forEach((n, i) => {
      const a = world.anchors.get(n.id);
      const on = lens !== 'all' && stateOf(n, lens) === 'lit';
      at.setXYZ(i, a.x, on ? a.y + 0.2 : -50, a.z);
      beams.setMatrixAt(i, on ? m4.makeTranslation(a.x, a.y + 0.05, a.z) : m4.makeScale(0, 0, 0));
    });
    at.needsUpdate = true;
    beams.instanceMatrix.needsUpdate = true;
    glows.visible = beams.visible = lens !== 'all';
    return lens;
  }
  set('all');

  return {
    set,
    get: () => lens,
    stateOf: (n) => stateOf(n, lens),
    landmarkDim: (cat) => landmarkDim(lens, cat),
  };
}

