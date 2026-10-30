// Entry point of the 3D class-islands view. Loaded with a dynamic import()
// the first time the islands tab is shown, so three.js never weighs on the
// other two map views.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { layoutArchipelago, TOP, R, mulberry32, walkPath } from './layout.js';
import { createKit } from './kit.js';
import { createProps } from './props.js';
import { buildWorld, classKind } from './world.js';
import { createEnvironment, TIMES } from './environment.js';
import { createCrowd } from './people.js';
import { createLinks } from './links.js';
import { createHarbours } from './harbour.js';
import { createSigns } from './signs.js';
import { createWildlife } from './wildlife.js';

// Opening angle: the view the user turned to and liked on the live site
// (2026-10-30) — the camera as low as the controls allow, turned a touch so
// the two off-shore islands sit in the front corners and the archipelago
// fills the middle; every lake island is then fitted in. Measured against
// 57° / 0° (docs/map-3d-island-brief.md) it draws the houses and people
// larger.
const FOV = 32;
const HOME_POLAR = THREE.MathUtils.degToRad(70);
const HOME_AZIMUTH = THREE.MathUtils.degToRad(3);
// The opening view fits every island in the lake (off-shore ones included)
// into the part of the stage the interface leaves clear, at least this many
// px from its edges.
const HOME_PAD = 14;
const POLAR_MIN = THREE.MathUtils.degToRad(25);
const POLAR_MAX = THREE.MathUtils.degToRad(70);
const BIRD_POLAR = 0.1; // bird's-eye: almost straight down
const TIME_ORDER = ['dawn', 'day', 'dusk', 'night'];
// the visitor's local clock → time of day (05–08 dawn, 08–17 day, 17–19 dusk)
function clockTime(d = new Date()) {
  const h = d.getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night';
}
const WALKERS = 54;
const PERSON = 0.3; // world units per character unit (a person is ~0.32 tall)
const STRIDE = 0.15; // distance covered per walk cycle
const PEDAL = 0.4; // distance a cyclist covers per pedal turn
const CYCLISTS = 0.3; // share of the walkers (not porters) who ride a bicycle
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
 * @param {(node: any) => void} o.onClass    a house was clicked: show the class
 * @param {() => Array<{left:number,top:number,right:number,bottom:number}>} [o.chrome]
 *   screen rects of the interface laid over the scene (brand card, toolbar,
 *   view tabs, legend…); name plates fade out where they would run under one
 * @param {(node: any, index: number) => void} o.onArticle  a person was
 *   clicked: preview article `index` of that class
 */
export function createIslandScene({ canvas, stage, labelsEl, tipEl, data, strings, onSelect, onClass, onArticle, onTime, chrome }) {
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
  controls.minDistance = 2.2; // close enough to see the people

  // ---- world
  const buildingKit = createKit(THREE);
  const bridgeKit = createKit(THREE);
  const decorKit = createKit(THREE);
  const boatKit = createKit(THREE); // boats drift, so they get their own meshes
  const props = createProps(THREE, decorKit);
  const world = buildWorld(THREE, scene, { buildings: buildingKit, bridges: bridgeKit, decor: decorKit }, props, layout);
  const env = createEnvironment(THREE, scene, props, decorKit, layout.bounds, createProps(THREE, boatKit), layout.harbours);
  const partMat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0 });
  // windows, lamps and beacons: lit by the night factor of the time of day
  const glowMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, emissive: 0xffd28a, emissiveIntensity: 0 });
  const glowing = { glass: glowMat, bulb: glowMat };
  const harbours = createHarbours(THREE, scene, decorKit, props, layout, partMat, glowing);
  // gulls, dolphins, tuna, a bait ball now and then, drifting clouds
  const wildlife = reduced ? null : createWildlife(THREE, scene, layout);
  const buildingMeshes = buildingKit.build(scene, partMat, glowing);
  const bridgeMeshes = bridgeKit.build(scene, partMat);
  const bridgeById = new Map(layout.bridges.map((b) => [b.id, b]));
  decorKit.build(scene, partMat, glowing);
  const boatMeshes = boatKit.build(scene, partMat, glowing);
  for (const m of boatMeshes) {
    m.frustumCulled = false; // instances move away from where the bounds were computed
    m.castShadow = false;
  }
  // a soft warm halo on every rim string light, faded in with the night
  // (additive sprites: the scene has no bloom pass)
  const haloTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,236,190,1)');
    grad.addColorStop(0.25, 'rgba(255,214,140,0.55)');
    grad.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  const haloMat = new THREE.PointsMaterial({ size: 0.85, map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const halos = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(world.fairy.flat(), 3)), haloMat);
  halos.visible = false;
  scene.add(halos);

  // the article signs at the house doors: one per article written about the
  // class, its "i" badge in the article's language colour
  const signs = createSigns(THREE, scene, partMat, props.people, (info) => {
    const node = info && nodeById.get(info.node);
    const art = node && node.articles && node.articles[info.article];
    return art && art.lang;
  });

  // ---- camera framing
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  // Frames the archipelago's bounding circle; on landscape screens it may
  // overfill vertically a little and still show every island.
  const fitDistance = (r) => r * Math.max(2.35, 1.05 / (tanHalf * camera.aspect)) * 1.05;
  const sph = new THREE.Spherical();
  const posFor = (target, dist, polar, azimuth) => {
    sph.set(dist, polar, azimuth);
    return new THREE.Vector3().setFromSpherical(sph).add(target);
  };
  // The opening view (and 全景 / Fit): every island in the lake — the class
  // archipelago and the off-shore islands — fitted as tightly as it goes into
  // the clear part of the stage, measured on screen rather than with the
  // bounding circle (which wastes the corners and pushed the off-shore
  // islands out of a closer opening shot). The clear part leaves out the
  // interface laid over the scene: brand card and toolbar on top, the legend
  // below, the phones' button column on the right. The harbour and the
  // outer islets may run off the edges.
  const framePts = layout.tiles
    .filter((t) => !layout.harbours.some((h) => h.cat === t.cat))
    .flatMap((t) => [
      [t.x - R, t.z],
      [t.x + R, t.z],
      [t.x, t.z - R],
      [t.x, t.z + R],
    ])
    .map(([x, z]) => new THREE.Vector3(x, TOP, z));
  // ...and what stands on them, so a tall roof or the Session towers don't
  // run up under the toolbar: every class house's roof top and each
  // landmark's top (the Session towers ~5.8 high, the rest under ~2)
  const harbourCats = new Set(layout.harbours.map((h) => h.cat));
  for (const n of data.nodes) {
    const a = world.anchors.get(n.id);
    if (a && !harbourCats.has(n.cat)) framePts.push(new THREE.Vector3(a.x, a.y, a.z));
  }
  for (const l of world.landmarks)
    if (!layout.harbours.some((h) => Math.hypot(h.x - l.x, h.z - l.z) < h.r))
      framePts.push(new THREE.Vector3(l.x, TOP + (l.kind === 'skytower' ? 6 : 2), l.z));
  const homeTarget = new THREE.Vector3(cx, TOP, cz);
  let homeDist = 0;
  const frameCam = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);
  const pv = new THREE.Vector3();
  function clearArea(w, h) {
    // screen margins taken by the interface: a rect at the top (or bottom)
    // pushes that edge in; a tall one on the right (the phones' column)
    // pushes the right edge in. Each is capped so a big panel can't swallow
    // the view.
    const m = { l: 0, t: 0, r: 0, b: 0 };
    if (chrome) {
      const o = stage.getBoundingClientRect();
      for (const c of chrome()) {
        const l = c.left - o.left, t = c.top - o.top, r = c.right - o.left, b = c.bottom - o.top;
        if (r <= 0 || l >= w || b <= 0 || t >= h) continue; // outside the stage (the docked index)
        if (b - t > h * 0.3 && l > w * 0.6) m.r = Math.max(m.r, Math.min(w * 0.3, w - l));
        else if (t < h * 0.3) m.t = Math.max(m.t, Math.min(h * 0.3, b));
        else if (b > h * 0.7) m.b = Math.max(m.b, Math.min(h * 0.25, h - t));
      }
    }
    return {
      x0: -1 + (2 * (m.l + HOME_PAD)) / w,
      x1: 1 - (2 * (m.r + HOME_PAD)) / w,
      y0: -1 + (2 * (m.b + HOME_PAD)) / h,
      y1: 1 - (2 * (m.t + HOME_PAD)) / h,
    };
  }
  let homePolar = HOME_POLAR;
  let homeAzimuth = HOME_AZIMUTH;
  function fitHome(w, h) {
    const a = clearArea(w, h);
    frameCam.fov = camera.fov;
    frameCam.aspect = camera.aspect;
    frameCam.updateProjectionMatrix();
    const target = new THREE.Vector3(cx, TOP, cz);
    let dist = fitDistance(radius);
    // screen right and screen up, as directions on the ground
    const right = new THREE.Vector3(Math.cos(homeAzimuth), 0, -Math.sin(homeAzimuth));
    const up = new THREE.Vector3(-Math.sin(homeAzimuth), 0, -Math.cos(homeAzimuth));
    // a few rounds of: project, re-centre the target on the clear area, then
    // scale the distance to the spare room
    for (let i = 0; i < 40; i++) {
      frameCam.position.copy(posFor(target, dist, homePolar, homeAzimuth));
      frameCam.lookAt(target);
      frameCam.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of framePts) {
        pv.copy(p).project(frameCam);
        x0 = Math.min(x0, pv.x);
        x1 = Math.max(x1, pv.x);
        y0 = Math.min(y0, pv.y);
        y1 = Math.max(y1, pv.y);
      }
      // shift the target along screen right / up on the ground (up is
      // stretched by the camera's slant)
      const k = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      target.addScaledVector(right, 0.6 * (((x0 + x1) - (a.x0 + a.x1)) / 2) * k * camera.aspect);
      target.addScaledVector(up, 0.6 * (((y0 + y1) - (a.y0 + a.y1)) / 2) * k / Math.cos(homePolar));
      dist *= Math.pow(Math.max((x1 - x0) / (a.x1 - a.x0), (y1 - y0) / (a.y1 - a.y0)), 0.6);
    }
    homeTarget.copy(target);
    homeDist = dist;
  }
  const homeDistance = () => homeDist;

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
  // The light starts at the visitor's local time of day and follows the
  // clock until a time is picked by hand.
  let timeName = clockTime();
  let followClock = true;
  const light = copyLight(PRESETS[timeName]);
  let timeAnim = null;
  function blendLight(from, to, k) {
    for (const key of COLOR_KEYS) light[key].copy(from[key]).lerp(to[key], k);
    light.dir.copy(from.dir).lerp(to.dir, k).normalize();
    light.sunI = from.sunI + (to.sunI - from.sunI) * k;
    light.hemiI = from.hemiI + (to.hemiI - from.hemiI) * k;
    light.night = from.night + (to.night - from.night) * k;
    env.applyTime(light);
    glowMat.emissiveIntensity = light.night * 1.4;
    haloMat.opacity = light.night;
    halos.visible = light.night > 0.02;
    renderer.shadowMap.needsUpdate = true; // the sun moved
  }
  function setTime(name) {
    if (!PRESETS[name]) return timeName;
    timeName = name;
    timeAnim = { from: copyLight(light), to: PRESETS[name], t: reduced ? 1 : 0 };
    return timeName;
  }
  blendLight(light, PRESETS[timeName], 1);
  let clockCheck = 0;
  function followTheClock(dt) {
    if (!followClock || (clockCheck += dt) < 20) return;
    clockCheck = 0;
    const now = clockTime();
    if (now !== timeName) {
      setTime(now);
      if (onTime) onTime(now);
    }
  }

  // ---- walkers: people strolling the walk network (tile rings, the land
  // between an island's tiles, and the bridges, following their arch).
  // Porters (the ones holding a box) shuttle between two related islands;
  // a pair is picked in proportion to its number of class links, so the
  // strongest relations see the busiest traffic.
  const walk = layout.walk;
  const wrnd = mulberry32(2026);
  const nodesOf = new Map(); // category -> walk-node ids
  walk.nodes.forEach((n, i) => {
    if (!nodesOf.has(n.cat)) nodesOf.set(n.cat, []);
    nodesOf.get(n.cat).push(i);
  });
  const walkCats = [...nodesOf.keys()];
  // which part of the network each node is on: the harbour on the shore is
  // reached only by boat, so strollers there stay in town and the others stay
  // on the islands
  const region = new Array(walk.nodes.length).fill(-1);
  walk.nodes.forEach((_, i) => {
    if (region[i] >= 0) return;
    const todo = [i];
    region[i] = i;
    while (todo.length)
      for (const [v] of walk.adj[todo.pop()])
        if (region[v] < 0) {
          region[v] = i;
          todo.push(v);
        }
  });
  const crowd = createCrowd(THREE, scene, partMat, WALKERS, { rnd: wrnd, carry: 0.4, bike: CYCLISTS });
  const walkers = [];
  const relations = layout.relations.filter((r) => nodesOf.has(r.a) && nodesOf.has(r.b));
  function pickRelation(list) {
    let k = wrnd() * list.reduce((s, r) => s + r.n, 0);
    for (const r of list) if ((k -= r.n) < 0) return r;
    return list[list.length - 1];
  }
  const randomNode = (cat) => {
    const ids = nodesOf.get(cat);
    return ids[Math.floor(wrnd() * ids.length)];
  };
  function setSegment(w) {
    const e = walk.adj[w.path[w.seg]].find((x) => x[0] === w.path[w.seg + 1]);
    w.len = e ? Math.max(e[1], 0.05) : 1;
    w.arch = e ? e[2] : 0;
  }
  // a new trip: a stroller heads for a random spot on another island; a
  // porter crosses to the other end of its relation, and every few runs
  // takes up another relation of the island it stands on
  function planTrip(w) {
    const here = walk.nodes[w.at].cat;
    let cat;
    if (w.rel) {
      if (++w.runs % 3 === 0) {
        const mine = relations.filter((r) => r.a === here || r.b === here);
        if (mine.length) w.rel = pickRelation(mine);
      }
      cat = w.rel.a === here ? w.rel.b : w.rel.a;
    } else {
      const reach = walkCats.filter((c) => region[nodesOf.get(c)[0]] === region[w.at]);
      cat = reach[Math.floor(wrnd() * reach.length)];
      if (cat === here && reach.length > 1) cat = reach[(reach.indexOf(cat) + 1) % reach.length];
    }
    const path = walkPath(walk, w.at, randomNode(cat));
    w.path = path.length > 1 ? path : [w.at, walk.adj[w.at][0][0]];
    w.seg = 0;
    w.t = 0;
    setSegment(w);
  }
  for (let i = 0; i < WALKERS; i++) {
    const bike = crowd.people[i].bike;
    const w = { at: Math.floor(wrnd() * walk.nodes.length), speed: bike ? 0.5 + wrnd() * 0.15 : 0.24 + wrnd() * 0.12, side: (wrnd() - 0.5) * 0.22, gait: wrnd() * 6.28, rel: null, runs: 0, stride: bike ? PEDAL : STRIDE };
    if (crowd.people[i].carry && relations.length) {
      w.rel = pickRelation(relations);
      w.at = randomNode(w.rel.a);
    }
    planTrip(w);
    w.t = wrnd(); // spread them out along their first stretch
    walkers.push(w);
  }
  function updateWalkers(dt) {
    walkers.forEach((w, i) => {
      w.t += (w.speed * dt) / w.len;
      w.gait += ((w.speed * dt) / w.stride) * Math.PI * 2;
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
      const y = TOP + (w.arch ? 0.05 + Math.sin(w.t * Math.PI) * w.arch : 0);
      crowd.pose(i, x, y, z, Math.atan2(dx, dz), PERSON, w.gait, reduced ? 0 : 1);
    });
    crowd.commit();
  }
  updateWalkers(0); // place them (with reduced motion they stay put)
  // a selected island's porters carry coral boxes
  function markPorters(cat) {
    walkers.forEach((w, i) => {
      if (w.rel) crowd.tintBox(i, cat && (w.rel.a === cat || w.rel.b === cat) ? 0xdb6a41 : null);
    });
  }

  // ---- relation lines between the class houses
  const links = createLinks(THREE, scene, data, world.anchors);
  let hoverNode = null; // class under the mouse
  let panelNode = null; // class row hovered in the panel
  const refreshFocus = () => links.setFocus(hoverNode || panelNode, selected);

  // ---- boats: slow circles and a gentle bob; every part of a boat shares
  // its x/z, which keys the boat's own phase
  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';
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
  // As in the reference, a plate that comes near the interface laid over
  // the scene (brand card, toolbar, view tabs, legend…) fades out instead of
  // sliding underneath it, and comes back once it is clear again.
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
  const CHROME_GAP = 10; // px kept clear around the interface
  function placeLabels(w, h) {
    if (!measured) measureLabels();
    let blocks = [];
    if (chrome) {
      const o = labelsEl.getBoundingClientRect();
      blocks = chrome().map((r) => ({ l: r.left - o.left - CHROME_GAP, t: r.top - o.top - CHROME_GAP, r: r.right - o.left + CHROME_GAP, b: r.bottom - o.top + CHROME_GAP }));
    }
    const underChrome = (x, y, [bw, bh]) => blocks.some((k) => x + bw / 2 > k.l && x - bw / 2 < k.r && y + bh / 2 > k.t && y - bh / 2 < k.b);
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
      const size = compact ? L.small : L.full;
      // a plate tucked away under the interface doesn't crowd the others
      const tucked = underChrome(L.sx, L.sy, size);
      if (tucked !== !!L.tucked) {
        L.tucked = tucked;
        L.el.classList.toggle('tucked', tucked);
      }
      if (!tucked) placed.push({ x: L.sx, y: L.sy, w: size[0], h: size[1] });
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
    markPorters(selected);
    refreshFocus();
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
    const pos = bird ? posFor(homeTarget, birdDistance(), BIRD_POLAR, 0) : posFor(homeTarget, homeDistance(), homePolar, homeAzimuth);
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
    controls.maxDistance = fitDistance(radius) * 1.8;
    const pos = posFor(homeTarget, homeDistance(), homePolar, homeAzimuth);
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

  // ---- picking: the nearest of an article sign, a class house, a bridge
  // or an island deck
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const pp = ray.intersectObjects(signs.pickMeshes, false)[0];
    const b = ray.intersectObjects(buildingMeshes, false)[0];
    const br = ray.intersectObjects(bridgeMeshes, false)[0];
    const t = ray.intersectObjects(world.pickTargets, false)[0];
    const far = (h) => (h ? h.distance : Infinity);
    if (pp && far(pp) <= Math.min(far(b), far(br), far(t)) + 0.02) {
      const info = props.people[pp.instanceId].info;
      if (info && nodeById.has(info.node)) return { person: { node: nodeById.get(info.node), index: info.article } };
    }
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
      select(null, false); // also closes a class or article card
    } else if (hit.node) {
      onClass && onClass(hit.node);
    } else if (hit.person) {
      onArticle && onArticle(hit.person.node, hit.person.index);
    } else select(hit.cat, true);
  });

  // ---- hover tooltip (mouse only, resolved once per frame)
  let hoverAt = null;
  let hoverId = null;
  function hideTip() {
    tipEl.hidden = true;
    hoverId = null;
    canvas.style.cursor = '';
    setHoverNode(null);
  }
  function setHoverNode(id) {
    if (id === hoverNode) return;
    hoverNode = id;
    refreshFocus();
  }
  function updateHover() {
    if (!hoverAt) return;
    const at = hoverAt;
    hoverAt = null;
    const hit = pickAt(at.x, at.y);
    canvas.style.cursor = hit && !hit.bridge ? 'pointer' : '';
    setHoverNode(hit && hit.node ? hit.node.id : hit && hit.person ? hit.person.node.id : null);
    if (!hit || (!hit.node && !hit.bridge && !hit.person)) {
      tipEl.hidden = true;
      hoverId = null;
      return;
    }
    if (hit.person) {
      const { node, index } = hit.person;
      const key = 'p:' + node.id + ':' + index;
      if (key !== hoverId) {
        hoverId = key;
        const a = node.articles[index];
        const ll = (strings.langLabels && strings.langLabels[a.lang]) || '';
        const sub = esc(strings.article) + (ll ? ' · ' + esc(ll) : '') + (node.island ? '' : ' · ' + esc(node.name));
        tipEl.innerHTML = '<b>' + esc(a.title) + '</b><span>' + sub + '</span><em>' + esc(strings.preview) + '</em>';
        tipEl.dataset.kind = 'article';
      }
    } else if (hit.bridge) {
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
        const nl = links.countFor(n.id);
        const lk = nl ? '<span>' + esc(strings.links.replace('{n}', nl)) + '</span>' : '';
        tipEl.innerHTML = '<b>' + esc(n.name) + '</b><span>' + esc(n.cat) + ' · ' + esc(tags.join(' · ')) + '</span>' + lk + '<em>' + esc(strings.info) + '</em>';
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
    fitHome(w, h);
    links.resize(w, h);
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
  // pause freezes walkers, boats, water, clouds and the line dashes; the
  // camera stays free
  let paused = false;
  let motion = 0; // seconds of unpaused animation (boats are keyed on it)
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
    if (!reduced && !paused) {
      motion += dt;
      env.update(dt);
      updateWalkers(dt);
      updateBoats(motion);
      harbours.update(motion);
      wildlife.update(dt);
      links.update(dt);
    }
    followTheClock(dt);
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
    // picking a time by hand stops the light following the clock
    setTime: (name) => {
      followClock = false;
      return setTime(name);
    },
    getTime: () => timeName,
    setBird,
    isBird: () => bird,
    // relation lines: 'off' | 'focus' (selected island / pointed class) | 'all'
    setLinks: (m) => links.setMode(m),
    getLinks: () => links.getMode(),
    linkCount: (id) => links.countFor(id),
    // light up one class's links from outside (the panel's class rows)
    focusClass(id) {
      panelNode = id || null;
      refreshFocus();
    },
    setPaused(on) {
      paused = !!on;
      return paused;
    },
    isPaused: () => paused,
    clusters: layout.clusters,
    walk: layout.walk,
  };
}
