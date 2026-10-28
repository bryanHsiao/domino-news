// Entry point of the 3D class-islands view. Loaded with a dynamic import()
// the first time the islands tab is shown, so three.js never weighs on the
// other two map views.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { layoutArchipelago, TOP, mulberry32, walkPath } from './layout.js';
import { createKit } from './kit.js';
import { createProps } from './props.js';
import { buildWorld, classKind } from './world.js';
import { createEnvironment, TIMES } from './environment.js';

const FOV = 32;
const HOME_POLAR = THREE.MathUtils.degToRad(57);
const POLAR_MIN = THREE.MathUtils.degToRad(25);
const POLAR_MAX = THREE.MathUtils.degToRad(70);
const BIRD_POLAR = 0.1; // bird's-eye: almost straight down
const TIME_ORDER = ['dawn', 'day', 'dusk', 'night'];
const WALKERS = 42;
const SHIRTS = [0xdb6a41, 0x4f86c6, 0xe9b444, 0x58a6a6, 0x8b6fd1, 0x3b3a42, 0xf2b5c6, 0x9cc27a];
const SKIN = [0xf1c9a5, 0xd9a27e, 0xb27b57];
const PALE = new THREE.Color(0xe9e4da);
const CORAL = new THREE.Color(0xdb6a41);

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
  // The islands never move: shadows are rendered once and again only while
  // the time of day changes (walkers and boats don't cast shadows).
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minPolarAngle = POLAR_MIN;
  controls.maxPolarAngle = POLAR_MAX;
  controls.minDistance = 5;

  // ---- world
  const buildingKit = createKit(THREE);
  const bridgeKit = createKit(THREE);
  const decorKit = createKit(THREE);
  const boatKit = createKit(THREE); // boats drift, so they get their own meshes
  const props = createProps(THREE, decorKit);
  const world = buildWorld(THREE, scene, { buildings: buildingKit, bridges: bridgeKit, decor: decorKit }, props, layout);
  const env = createEnvironment(THREE, scene, props, decorKit, layout.bounds, createProps(THREE, boatKit));
  const partMat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0 });
  // windows, lamps and beacons: lit by the night factor of the time of day
  const glowMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, emissive: 0xffd28a, emissiveIntensity: 0 });
  const glowing = { glass: glowMat, bulb: glowMat };
  const buildingMeshes = buildingKit.build(scene, partMat, glowing);
  const bridgeMeshes = bridgeKit.build(scene, partMat);
  const bridgeById = new Map(layout.bridges.map((b) => [b.id, b]));
  decorKit.build(scene, partMat, glowing);
  const boatMeshes = boatKit.build(scene, partMat, glowing);
  for (const m of boatMeshes) {
    m.frustumCulled = false; // instances move away from where the bounds were computed
    m.castShadow = false;
  }

  // ---- camera framing
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  // Frames the archipelago's bounding circle; on landscape screens it may
  // overfill vertically a little and still show every island.
  const fitDistance = (r) => r * Math.max(2.35, 1.05 / (tanHalf * camera.aspect)) * 1.05;
  const homeTarget = new THREE.Vector3(cx, TOP, cz);
  const sph = new THREE.Spherical();
  const posFor = (target, dist, polar, azimuth) => {
    sph.set(dist, polar, azimuth);
    return new THREE.Vector3().setFromSpherical(sph).add(target);
  };

  // ---- time of day: blend from the current light to a preset over ~1.2 s;
  // the night factor lights windows, lamps and stars
  const COLOR_KEYS = ['top', 'horizon', 'sun', 'hemiSky', 'hemiGround', 'shallow', 'deep', 'fog'];
  const toLight = (t) => {
    const s = { dir: new THREE.Vector3(...t.dir).normalize(), sunI: t.sunI, hemiI: t.hemiI, night: t.night };
    for (const k of COLOR_KEYS) s[k] = new THREE.Color(t[k]);
    return s;
  };
  const copyLight = (s) => {
    const c = { dir: s.dir.clone(), sunI: s.sunI, hemiI: s.hemiI, night: s.night };
    for (const k of COLOR_KEYS) c[k] = s[k].clone();
    return c;
  };
  const PRESETS = Object.fromEntries(TIME_ORDER.map((k) => [k, toLight(TIMES[k])]));
  const light = copyLight(PRESETS.day);
  let timeName = 'day';
  let timeAnim = null;
  function blendLight(from, to, k) {
    for (const key of COLOR_KEYS) light[key].copy(from[key]).lerp(to[key], k);
    light.dir.copy(from.dir).lerp(to.dir, k).normalize();
    light.sunI = from.sunI + (to.sunI - from.sunI) * k;
    light.hemiI = from.hemiI + (to.hemiI - from.hemiI) * k;
    light.night = from.night + (to.night - from.night) * k;
    env.applyTime(light);
    glowMat.emissiveIntensity = light.night * 1.4;
    renderer.shadowMap.needsUpdate = true; // the sun moved
  }
  function setTime(name) {
    if (!PRESETS[name]) return timeName;
    timeName = name;
    timeAnim = { from: copyLight(light), to: PRESETS[name], t: reduced ? 1 : 0 };
    return timeName;
  }

  // ---- walkers: people strolling the walk network (tile rings, the land
  // between an island's tiles, and the bridges, following their arch)
  const walk = layout.walk;
  const wrnd = mulberry32(2026);
  const nodesOf = new Map(); // category -> walk-node ids
  walk.nodes.forEach((n, i) => {
    if (!nodesOf.has(n.cat)) nodesOf.set(n.cat, []);
    nodesOf.get(n.cat).push(i);
  });
  const walkCats = [...nodesOf.keys()];
  const bodyMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.42, 1, 8), partMat, WALKERS);
  const headMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 10, 8), partMat, WALKERS);
  for (const m of [bodyMesh, headMesh]) {
    m.frustumCulled = false;
    m.receiveShadow = true;
  }
  const walkers = [];
  const tint = new THREE.Color();
  function setSegment(w) {
    const e = walk.adj[w.path[w.seg]].find((x) => x[0] === w.path[w.seg + 1]);
    w.len = e ? Math.max(e[1], 0.05) : 1;
    w.arch = e ? e[2] : 0;
  }
  // a new trip: from where the walker stands to a random spot on another island
  function planTrip(w) {
    let cat = walkCats[Math.floor(wrnd() * walkCats.length)];
    if (cat === walk.nodes[w.at].cat) cat = walkCats[(walkCats.indexOf(cat) + 1) % walkCats.length];
    const ids = nodesOf.get(cat);
    const path = walkPath(walk, w.at, ids[Math.floor(wrnd() * ids.length)]);
    w.path = path.length > 1 ? path : [w.at, walk.adj[w.at][0][0]];
    w.seg = 0;
    w.t = 0;
    setSegment(w);
  }
  for (let i = 0; i < WALKERS; i++) {
    const w = { at: Math.floor(wrnd() * walk.nodes.length), speed: 0.3 + wrnd() * 0.2, side: (wrnd() - 0.5) * 0.22, phase: wrnd() * 6.28 };
    planTrip(w);
    w.t = wrnd(); // spread them out along their first stretch
    bodyMesh.setColorAt(i, tint.set(SHIRTS[i % SHIRTS.length]));
    headMesh.setColorAt(i, tint.set(SKIN[Math.floor(wrnd() * SKIN.length)]));
    walkers.push(w);
  }
  scene.add(bodyMesh, headMesh);
  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';
  function updateWalkers(dt, time) {
    walkers.forEach((w, i) => {
      w.t += (w.speed * dt) / w.len;
      while (w.t >= 1) {
        w.t -= 1;
        w.seg++;
        if (w.seg >= w.path.length - 1) {
          w.at = w.path[w.path.length - 1];
          planTrip(w);
          break;
        }
        setSegment(w);
      }
      const a = walk.nodes[w.path[w.seg]];
      const b = walk.nodes[w.path[w.seg + 1]];
      const dx = b.x - a.x, dz = b.z - a.z;
      const L = Math.hypot(dx, dz) || 1;
      const x = a.x + dx * w.t - (dz / L) * w.side;
      const z = a.z + dz * w.t + (dx / L) * w.side;
      const y = TOP + (w.arch ? 0.05 + Math.sin(w.t * Math.PI) * w.arch : 0) + Math.abs(Math.sin(time * 7 + w.phase)) * 0.012;
      dummy.rotation.set(0, Math.atan2(dx, dz), 0);
      dummy.position.set(x, y + 0.09, z);
      dummy.scale.set(0.1, 0.16, 0.1);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y + 0.21, z);
      dummy.scale.set(0.085, 0.085, 0.085);
      dummy.updateMatrix();
      headMesh.setMatrixAt(i, dummy.matrix);
    });
    bodyMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
  }
  updateWalkers(0, 0); // place them (with reduced motion they stay put)

  // ---- boats: slow circles and a gentle bob; every part of a boat shares
  // its x/z, which keys the boat's own phase
  function updateBoats(time) {
    for (const m of boatMeshes) {
      m.userData.items.forEach((p, i) => {
        const h = Math.sin(p.pos[0] * 12.9898 + p.pos[2] * 78.233) * 43758.5453;
        const ph = (h - Math.floor(h)) * Math.PI * 2;
        const a = ph + time * 0.035;
        const x = p.pos[0] + (Math.cos(a) - Math.cos(ph)) * 0.7;
        const z = p.pos[2] + (Math.sin(a) - Math.sin(ph)) * 0.7;
        dummy.position.set(x, p.pos[1] + Math.sin(time * 1.3 + ph) * 0.025, z);
        dummy.rotation.set(Math.sin(time * 1.1 + ph) * 0.04, Math.atan2(-Math.sin(a), Math.cos(a)), 0);
        dummy.scale.set(p.scale[0], p.scale[1], p.scale[2]);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
  }

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
    // light up the selected island's bridges: its direct routes
    for (const b of layout.bridges) bridgeKit.tint(b.id, CORAL, selected && (b.a.cat === selected || b.b.cat === selected) ? 0.55 : 0);
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
  function flyTo(target, pos, done) {
    if (reduced) {
      controls.target.copy(target);
      camera.position.copy(pos);
      if (done) done();
      return;
    }
    anim = { t: 0, camFrom: camera.position.clone(), camTo: pos, tgtFrom: controls.target.clone(), tgtTo: target, done };
  }

  // ---- bird's-eye: look almost straight down on the whole map (still free
  // to turn and zoom); the polar limits switch once the camera arrives
  let bird = false;
  const birdDistance = () => radius * Math.max(1.05 / tanHalf, 1.05 / (tanHalf * camera.aspect));
  function setBird(on) {
    bird = !!on;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = POLAR_MAX;
    const pos = bird ? posFor(homeTarget, birdDistance(), BIRD_POLAR, 0) : posFor(homeTarget, fitDistance(radius), HOME_POLAR, 0);
    flyTo(homeTarget.clone(), pos, () => {
      controls.minPolarAngle = bird ? 0 : POLAR_MIN;
      controls.maxPolarAngle = bird ? BIRD_POLAR + 0.05 : POLAR_MAX;
    });
    return bird;
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
    const polar = bird ? BIRD_POLAR : THREE.MathUtils.clamp(sph.phi, THREE.MathUtils.degToRad(40), THREE.MathUtils.degToRad(58));
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
  // back to the default view (leaving bird's-eye too)
  function reset() {
    select(null, false);
    if (bird) setBird(false);
    else home(false);
  }

  // ---- picking: the nearest of a class house, a bridge or an island deck
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const b = ray.intersectObjects(buildingMeshes, false)[0];
    const br = ray.intersectObjects(bridgeMeshes, false)[0];
    const t = ray.intersectObjects(world.pickTargets, false)[0];
    const far = (h) => (h ? h.distance : Infinity);
    if (b && far(b) <= Math.min(far(br), far(t) + 0.05)) {
      const id = b.object.userData.owners[b.instanceId];
      if (id && nodeById.has(id)) return { node: nodeById.get(id) };
    }
    if (br && far(br) <= far(t) + 0.05) {
      const id = br.object.userData.owners[br.instanceId];
      if (id && bridgeById.has(id)) return { bridge: bridgeById.get(id) };
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
    if (hit && hit.bridge) return; // bridges only explain themselves on hover
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
    canvas.style.cursor = hit && !hit.bridge ? 'pointer' : '';
    if (!hit || (!hit.node && !hit.bridge)) {
      tipEl.hidden = true;
      hoverId = null;
      return;
    }
    if (hit.bridge) {
      const b = hit.bridge;
      if (b.id !== hoverId) {
        hoverId = b.id;
        const title = '<b>' + esc(b.a.cat) + ' ⇄ ' + esc(b.b.cat) + '</b>';
        if (!b.rel) {
          tipEl.innerHTML = title + '<span>' + esc(strings.path) + '</span>';
        } else {
          // which class/member makes the link, e.g. NotesDatabase.CreateDocument → NotesDocument
          const lines = b.rel.via.slice(0, 4).map((v) => '<code>' + esc(v.s) + (v.m ? '.' + esc(v.m) : '') + ' → ' + esc(v.t) + '</code>');
          const more = b.rel.via.length > 4 ? '<span>' + esc(strings.more.replace('{n}', b.rel.via.length - 4)) + '</span>' : '';
          tipEl.innerHTML = title + '<span>' + b.rel.n + esc(strings.rel) + '</span>' + lines.join('') + more;
        }
        tipEl.dataset.kind = 'bridge';
      }
    } else {
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
    const time = clock.elapsedTime;
    if (!reduced) {
      env.update(dt);
      updateWalkers(dt, time);
      updateBoats(time);
    }
    if (timeAnim) {
      timeAnim.t = Math.min(1, timeAnim.t + dt / 1.2);
      const k = timeAnim.t * timeAnim.t * (3 - 2 * timeAnim.t);
      blendLight(timeAnim.from, timeAnim.to, k);
      if (timeAnim.t >= 1) timeAnim = null;
    }
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / 0.8);
      const k = 1 - Math.pow(1 - anim.t, 3);
      camera.position.lerpVectors(anim.camFrom, anim.camTo, k);
      controls.target.lerpVectors(anim.tgtFrom, anim.tgtTo, k);
      if (anim.t >= 1) {
        const done = anim.done;
        anim = null;
        if (done) done();
      }
    }
    controls.update();
    renderer.render(scene, camera);
    placeLabels(stage.clientWidth, stage.clientHeight);
    updateHover();
  }
  raf = requestAnimationFrame(frame);

  // `walk` is the pedestrian network (tile rings + bridges) the walkers use.
  return {
    select: (cat) => select(cat, true),
    reset,
    filter,
    setTime,
    // step to the next time of day (dawn → day → dusk → night → dawn)
    nextTime: () => setTime(TIME_ORDER[(TIME_ORDER.indexOf(timeName) + 1) % TIME_ORDER.length]),
    getTime: () => timeName,
    setBird,
    isBird: () => bird,
    clusters: layout.clusters,
    walk: layout.walk,
  };
}
