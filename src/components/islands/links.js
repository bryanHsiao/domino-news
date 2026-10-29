// Relation lines: the class links ("a method/property of A returns B") drawn
// as arcs from roof to roof. Kept out of the way by default: only the links
// of the focused class (hovered house, or a row in the panel) or the selected
// island light up, as flowing dashes running from A to B. "All" adds every
// link underneath as a faint web. Links across islands are coral, links
// within one island teal.
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

const SEGS = 28;
const CROSS = 0xdb6a41;
const WITHIN = 0x2f8f8a;
const FLOW = 0.45; // dash speed, world units per second

export function createLinks(THREE, scene, data, anchors) {
  const catOf = new Map(data.nodes.map((n) => [n.id, n.cat]));
  const c = new THREE.Color();
  const arcs = [];
  for (const l of data.links || []) {
    const A = anchors.get(l.s), B = anchors.get(l.t);
    if (!A || !B || l.s === l.t) continue;
    const cross = catOf.get(l.s) !== catOf.get(l.t);
    // a quadratic arc; the farther apart, the higher it rises
    const d = Math.hypot(B.x - A.x, B.z - A.z);
    const h = Math.min(0.45 + d * 0.22, 3.2);
    const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2 + h * 2, cz = (A.z + B.z) / 2;
    const pts = [];
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS, u = 1 - t;
      pts.push(u * u * A.x + 2 * u * t * cx + t * t * B.x, u * u * A.y + 2 * u * t * cy + t * t * B.y, u * u * A.z + 2 * u * t * cz + t * t * B.z);
    }
    arcs.push({ s: l.s, t: l.t, cs: catOf.get(l.s), ct: catOf.get(l.t), color: cross ? CROSS : WITHIN, pts });
  }

  const common = { vertexColors: true, transparent: true, depthWrite: false, fog: true };
  const focusMat = new LineMaterial({ ...common, linewidth: 3.2, dashed: true, dashSize: 0.22, gapSize: 0.12 });
  const webMat = new LineMaterial({ ...common, linewidth: 1.4, opacity: 0.4 });
  const focusLines = new LineSegments2(new LineSegmentsGeometry(), focusMat);
  const webLines = new LineSegments2(new LineSegmentsGeometry(), webMat);
  for (const m of [focusLines, webLines]) {
    m.visible = false;
    m.frustumCulled = false;
    m.renderOrder = 3;
    scene.add(m);
  }
  focusLines.renderOrder = 4;

  function fill(mesh, list) {
    mesh.visible = list.length > 0;
    if (!list.length) return;
    const pos = [], col = [];
    for (const a of list) {
      c.set(a.color);
      for (let i = 0; i < SEGS; i++) {
        pos.push(a.pts[i * 3], a.pts[i * 3 + 1], a.pts[i * 3 + 2], a.pts[i * 3 + 3], a.pts[i * 3 + 4], a.pts[i * 3 + 5]);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
    mesh.geometry.dispose();
    mesh.geometry = new LineSegmentsGeometry();
    mesh.geometry.setPositions(pos);
    mesh.geometry.setColors(col);
    mesh.computeLineDistances();
  }

  let mode = 'focus'; // 'off' | 'focus' | 'all'
  let focus = { cls: null, cat: null };
  function refresh() {
    let list = [];
    if (mode !== 'off') {
      if (focus.cls) list = arcs.filter((a) => a.s === focus.cls || a.t === focus.cls);
      else if (focus.cat) list = arcs.filter((a) => a.cs === focus.cat || a.ct === focus.cat);
    }
    fill(focusLines, list);
    fill(webLines, mode === 'all' ? arcs : []);
  }
  fill(webLines, []);

  return {
    count: arcs.length,
    // number of links a class takes part in (for its tooltip)
    countFor: (id) => arcs.reduce((n, a) => n + (a.s === id || a.t === id ? 1 : 0), 0),
    setMode(m) {
      mode = m;
      refresh();
      return mode;
    },
    getMode: () => mode,
    setFocus(cls, cat) {
      if (cls === focus.cls && cat === focus.cat) return;
      focus = { cls: cls || null, cat: cat || null };
      refresh();
    },
    update(dt) {
      if (focusLines.visible) focusMat.dashOffset -= dt * FLOW;
    },
    resize(w, h) {
      focusMat.resolution.set(w, h);
      webMat.resolution.set(w, h);
    },
  };
}
