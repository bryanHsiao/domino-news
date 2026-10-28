// Entry point of the 3D class-islands view. Loaded with a dynamic import()
// the first time the islands tab is shown, so three.js never weighs on the
// other two map views.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { layoutArchipelago, TOP } from './layout.js';
import { createKit } from './kit.js';
import { createProps } from './props.js';
import { buildWorld, classKind } from './world.js';
import { createEnvironment } from './environment.js';

const FOV = 32;
const HOME_POLAR = THREE.MathUtils.degToRad(57);
const PALE = new THREE.Color(0xe9e4da);

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} o.stage    element the canvas fills
 * @param {HTMLElement} o.labelsEl overlay for island name plates
 * @param {HTMLElement} o.tipEl    hover tooltip
 * @param {{nodes: any[], cats: string[]}} o.data
 * @param {Record<string,string>} o.strings  kind words for the tooltip
 * @param {(cluster: any|null) => void} o.onSelect
 * @param {(node: any) => void} o.onOpen
 */
export function createIslandScene({ canvas, stage, labelsEl, tipEl, data, strings, onSelect, onOpen }) {
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const layout = layoutArchipelago(data);
  const clusterByCat = new Map(layout.clusters.map((c) => [c.cat, c]));
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
  const { cx, cz, radius } = layout.bounds;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Nothing in the scene moves, so shadows are rendered once.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minPolarAngle = THREE.MathUtils.degToRad(25);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
  controls.minDistance = 5;

  // ---- world
  const buildingKit = createKit(THREE);
  const decorKit = createKit(THREE);
  const props = createProps(THREE, decorKit);
  const world = buildWorld(THREE, scene, { buildings: buildingKit, decor: decorKit }, props, layout);
  const env = createEnvironment(THREE, scene, props, decorKit, layout.bounds);
  const partMat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0 });
  const buildingMeshes = buildingKit.build(scene, partMat);
  decorKit.build(scene, partMat);

  // ---- camera framing
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  // The archipelago is wider than deep, so on landscape screens its bounding
  // circle can overfill vertically a little and still show every island.
  const fitDistance = (r) => r * Math.max(2.1, 1.05 / (tanHalf * camera.aspect)) * 1.05;
  const homeTarget = new THREE.Vector3(cx, TOP, cz);
  const sph = new THREE.Spherical();
  const posFor = (target, dist, polar, azimuth) => {
    sph.set(dist, polar, azimuth);
    return new THREE.Vector3().setFromSpherical(sph).add(target);
  };

  // ---- name plates: cream pills hung on each island's front edge
  const labels = layout.clusters.map((c) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ci-lbl';
    el.innerHTML = '<b>' + String(c.num).padStart(2, '0') + '</b><span>' + esc(c.cat) + '</span><i>' + c.count + '</i>';
    el.setAttribute('aria-label', c.cat);
    el.addEventListener('click', () => select(c.cat, true));
    labelsEl.appendChild(el);
    return { c, el, p: new THREE.Vector3(c.anchor.x, TOP - 0.2, c.anchor.z) };
  });
  const v = new THREE.Vector3();
  // Plates are decluttered every frame: in priority order (selected island,
  // then bigger islands, then nearer ones) a plate that would overlap one
  // already placed shrinks to its number; hovering it shows the name again.
  let measured = false;
  function measureLabels() {
    for (const L of labels) {
      L.el.style.display = '';
      L.el.classList.remove('compact');
      L.full = [L.el.offsetWidth, L.el.offsetHeight];
      L.el.classList.add('compact');
      L.small = [L.el.offsetWidth, L.el.offsetHeight];
      L.el.classList.toggle('compact', !!L.compact);
    }
    measured = labels.every((L) => L.full[0] > 0);
  }
  function placeLabels(w, h) {
    if (!measured) measureLabels();
    const visible = [];
    for (const L of labels) {
      v.copy(L.p).project(camera);
      L.off = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
      L.sx = (v.x * 0.5 + 0.5) * w;
      L.sy = (-v.y * 0.5 + 0.5) * h;
      L.depth = v.z;
      if (!L.off) visible.push(L);
    }
    visible.sort((a, b) => Number(b.c.cat === selected) - Number(a.c.cat === selected) || b.c.count - a.c.count || a.depth - b.depth);
    const placed = [];
    const overlaps = (x, y, [bw, bh]) => placed.some((r) => Math.abs(r.x - x) * 2 < r.w + bw + 4 && Math.abs(r.y - y) * 2 < r.h + bh + 2);
    for (const L of visible) {
      const compact = L.c.cat !== selected && overlaps(L.sx, L.sy, L.full);
      const [bw, bh] = compact ? L.small : L.full;
      placed.push({ x: L.sx, y: L.sy, w: bw, h: bh });
      if (compact !== !!L.compact) {
        L.compact = compact;
        L.el.classList.toggle('compact', compact);
      }
    }
    for (const L of labels) {
      L.el.style.display = L.off ? 'none' : '';
      if (L.off) continue;
      L.el.style.transform = `translate(${L.sx.toFixed(1)}px, ${L.sy.toFixed(1)}px) translate(-50%, -50%)`;
      L.el.style.zIndex = String(1000 - Math.round(L.depth * 1000));
    }
  }

  // ---- selection + search state
  let selected = null;
  let matchCats = null; // null = no active search
  function refreshLabels() {
    for (const L of labels) {
      const cat = L.c.cat;
      L.el.classList.toggle('sel', cat === selected);
      L.el.classList.toggle('dim', (selected && cat !== selected) || (matchCats && !matchCats.has(cat)));
    }
  }
  function select(cat, fly) {
    selected = cat || null;
    for (const [k, m] of world.outlines) m.visible = k === selected;
    refreshLabels();
    if (selected && fly) flyToCluster(clusterByCat.get(selected));
    onSelect && onSelect(selected ? clusterByCat.get(selected) : null);
  }
  function filter(term) {
    const q = (term || '').trim().toLowerCase();
    matchCats = q ? new Set() : null;
    for (const n of data.nodes) {
      const hit = !q || n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
      buildingKit.tint(n.id, PALE, hit ? 0 : 0.8);
      if (q && hit) matchCats.add(n.cat);
    }
    refreshLabels();
    return matchCats ? matchCats.size : null;
  }

  // ---- camera moves
  let anim = null;
  function flyTo(target, pos) {
    if (reduced) {
      controls.target.copy(target);
      camera.position.copy(pos);
      return;
    }
    anim = { t: 0, camFrom: camera.position.clone(), camTo: pos, tgtFrom: controls.target.clone(), tgtTo: target };
  }
  function flyToCluster(c) {
    const target = new THREE.Vector3(c.cx, TOP, c.cz);
    // The panel covers the right of the stage on wide screens and its bottom
    // half on phones (bottom sheet): aim beside / in front of the island so it
    // settles in the clear area.
    if (!window.matchMedia('(max-width: 640px)').matches) {
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
      target.addScaledVector(right, c.radius * 0.5);
    } else {
      const toCamera = new THREE.Vector3().subVectors(camera.position, controls.target).setY(0).normalize();
      target.addScaledVector(toCamera, c.radius * 1.6 + 2);
    }
    sph.setFromVector3(v.subVectors(camera.position, controls.target));
    const polar = THREE.MathUtils.clamp(sph.phi, THREE.MathUtils.degToRad(40), THREE.MathUtils.degToRad(58));
    flyTo(target, posFor(target, Math.max(17, fitDistance(c.radius) * 1.7), polar, sph.theta));
  }
  function home(instant) {
    const dist = fitDistance(radius);
    controls.maxDistance = dist * 1.8;
    const pos = posFor(homeTarget, dist, HOME_POLAR, 0);
    if (instant) {
      controls.target.copy(homeTarget);
      camera.position.copy(pos);
    } else flyTo(homeTarget.clone(), pos);
  }
  function reset() {
    select(null, false);
    home(false);
  }

  // ---- picking: buildings first (they stand on the decks)
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const b = ray.intersectObjects(buildingMeshes, false)[0];
    const t = ray.intersectObjects(world.pickTargets, false)[0];
    if (b && (!t || b.distance <= t.distance + 0.05)) {
      const id = b.object.userData.owners[b.instanceId];
      if (id && nodeById.has(id)) return { node: nodeById.get(id) };
    }
    if (t) return { cat: t.object.userData.cat };
    return null;
  }

  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, moved: false };
    hideTip();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (down) {
      if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) down.moved = true;
      return;
    }
    if (e.pointerType === 'mouse') hoverAt = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerleave', () => {
    hoverAt = null;
    hideTip();
  });
  canvas.addEventListener('pointerup', (e) => {
    const d = down;
    down = null;
    if (!d || d.moved) return;
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) {
      if (selected) select(null, false);
    } else if (hit.node) {
      if (hit.node.url) onOpen && onOpen(hit.node);
      else select(hit.node.cat, true);
    } else select(hit.cat, true);
  });

  // ---- hover tooltip (mouse only, resolved once per frame)
  let hoverAt = null;
  let hoverId = null;
  function hideTip() {
    tipEl.hidden = true;
    hoverId = null;
    canvas.style.cursor = '';
  }
  function updateHover() {
    if (!hoverAt) return;
    const at = hoverAt;
    hoverAt = null;
    const hit = pickAt(at.x, at.y);
    canvas.style.cursor = hit ? 'pointer' : '';
    if (!hit || !hit.node) {
      tipEl.hidden = true;
      hoverId = null;
      return;
    }
    const n = hit.node;
    if (n.id !== hoverId) {
      hoverId = n.id;
      const kind = classKind(n);
      const tags = [n.ui ? strings.ui : strings.be];
      if (n.key) tags.push(strings.key);
      if (!n.url) tags.push(strings.un);
      tipEl.innerHTML = '<b>' + esc(n.name) + '</b><span>' + esc(n.cat) + ' · ' + esc(tags.join(' · ')) + '</span>' + (n.url ? '<em>' + esc(strings.open) + '</em>' : '');
      tipEl.dataset.kind = kind;
    }
    const r = stage.getBoundingClientRect();
    tipEl.style.transform = `translate(${Math.round(at.x - r.left + 14)}px, ${Math.round(at.y - r.top + 16)}px)`;
    tipEl.hidden = false;
  }

  // ---- size + loop
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measured = false; // plate font size can change at the mobile breakpoint
    // Portrait screens frame the islands from farther away; keep the haze
    // behind them so they never look washed out.
    const dist = fitDistance(radius);
    controls.maxDistance = dist * 1.8;
    scene.fog.near = dist + radius * 0.3;
    scene.fog.far = dist + radius * 8;
  }
  resize();
  home(true);
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    if (!canvas.isConnected) {
      // the page navigated away (Astro view transition): release the GPU
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      return;
    }
    raf = requestAnimationFrame(frame);
    if (!canvas.offsetParent) return; // tab hidden
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced) env.update(dt);
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / 0.8);
      const k = 1 - Math.pow(1 - anim.t, 3);
      camera.position.lerpVectors(anim.camFrom, anim.camTo, k);
      controls.target.lerpVectors(anim.tgtFrom, anim.tgtTo, k);
      if (anim.t >= 1) anim = null;
    }
    controls.update();
    renderer.render(scene, camera);
    placeLabels(stage.clientWidth, stage.clientHeight);
    updateHover();
  }
  raf = requestAnimationFrame(frame);

  return { select: (cat) => select(cat, true), reset, filter, clusters: layout.clusters };
}
