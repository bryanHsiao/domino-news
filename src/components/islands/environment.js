// Scenery around the archipelago: sky, light, water, a basin of hills that
// rings the islands, satellite islets, boats and clouds, and the life along
// the shore and out on the water (piers, parasols, floating platforms, buoys).
// Purely decorative.
// The light follows one of four times of day (TIMES); scene.js blends between
// them and applies the result with applyTime().
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { WATER_Y, TOP, mulberry32 } from './layout.js';

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Sky gradient, sun (moon at night), ambient, water and haze per time of day.
// `dir` points toward the sun; `night` (0–1) lights windows, lamps and stars.
export const TIMES = {
  dawn: { top: 0xa9bde6, horizon: 0xf8d6c4, sun: 0xffcdb0, sunI: 2.1, hemiSky: 0xf4dcd6, hemiGround: 0x7a6a6e, hemiI: 1.3, shallow: 0x86bccb, deep: 0x6297ad, fog: 0xf3dfd6, dir: [0.8, 0.42, 0.45], night: 0.2 },
  day: { top: 0x9fd0ec, horizon: 0xf4eee3, sun: 0xfff1de, sunI: 2.9, hemiSky: 0xeef6fa, hemiGround: 0x8f8270, hemiI: 1.35, shallow: 0x62b2bd, deep: 0x4a96a8, fog: 0xf4eee3, dir: [-0.55, 0.85, 0.45], night: 0 },
  dusk: { top: 0x55589a, horizon: 0xf0905e, sun: 0xff8448, sunI: 1.7, hemiSky: 0xe6a88e, hemiGround: 0x5e4652, hemiI: 1.0, shallow: 0x5d85a3, deep: 0x3d5e83, fog: 0xd8957a, dir: [-0.85, 0.36, 0.4], night: 0.6 },
  // night stays readable, as on the reference's map: a bright cool moon and
  // sky fill keep the decks near their day colours, the water a deep blue
  night: { top: 0x0e1836, horizon: 0x34467a, sun: 0xc4d0ff, sunI: 1.5, hemiSky: 0xb8c4ee, hemiGround: 0x5c5878, hemiI: 1.75, shallow: 0x2f5f9a, deep: 0x1f4278, fog: 0x2c3a66, dir: [0.35, 0.8, -0.3], night: 1 },
};

// `boatProps` builds the boats into their own kit so scene.js can let them drift.
// `harbours` (layout.js) stand on the shore: the ground under them is levelled
// and kept clear of trees, cottages and the other scenery.
export function createEnvironment(THREE, scene, props, kit, { cx, cz, radius }, boatProps = props, harbours = []) {
  const rnd = mulberry32(11);
  const noise = new SimplexNoise({ random: mulberry32(7) });
  const fbm = (x, z) => {
    let s = 0, a = 1, f = 1, n = 0;
    for (let o = 0; o < 4; o++) {
      s += a * noise.noise(x * f, z * f);
      n += a;
      a *= 0.5;
      f *= 2;
    }
    return s / n;
  };
  const center = new THREE.Vector3(cx, 0, cz);
  const sunDir = new THREE.Vector3(-0.55, 0.85, 0.45).normalize();

  // ---- sky dome: horizon → zenith gradient with a soft sun glow
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(260, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x9fd0ec) },
        uHorizon: { value: new THREE.Color(0xf4eee3) },
        uSun: { value: new THREE.Color(0xfff1de) },
        uSunDir: { value: sunDir.clone() },
        uNight: { value: 0 },
      },
      vertexShader: `varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uTop, uHorizon, uSun, uSunDir; uniform float uNight; varying vec3 vDir;
        float rand(vec3 p) { return fract(sin(dot(p, vec3(91.7, 47.3, 13.1))) * 24634.63); }
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, 0.0, 1.0);
          vec3 c = mix(uHorizon, uTop, smoothstep(0.0, 0.5, h));
          c += uSun * pow(max(dot(d, normalize(uSunDir)), 0.0), 24.0) * 0.3;
          // sparse stars fading in toward the zenith at night
          float star = step(0.9968, rand(floor(d * 190.0))) * smoothstep(0.1, 0.55, h) * uNight;
          c += vec3(star * 0.85);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  sky.position.copy(center);
  sky.renderOrder = -10;
  scene.add(sky);
  scene.fog = new THREE.Fog(0xf4eee3, radius * 3.2, radius * 11);

  // ---- light: warm sun with soft shadows over the islands, cool fill
  const hemi = new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.35);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1de, 2.9);
  sun.position.copy(center).addScaledVector(sunDir, radius * 3 + 20);
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = radius + (harbours.length ? 9 : 3); // the harbour stands past the lake
  Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: radius * 6 + 60 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35);
  fill.position.set(cx + 20, 18, cz - 25);
  scene.add(fill);

  // ---- water: calm stylised surface, lighter near the islands
  const waterMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uShallow: { value: new THREE.Color(0x62b2bd) },
        uDeep: { value: new THREE.Color(0x4a96a8) },
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector2(cx, cz) },
        uR: { value: radius },
      },
    ]),
    vertexShader: `#include <fog_pars_vertex>
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `#include <fog_pars_fragment>
      uniform vec3 uShallow, uDeep; uniform float uTime, uR; uniform vec2 uCenter; varying vec3 vW;
      void main() {
        float d = length(vW.xz - uCenter);
        vec3 col = mix(uShallow, uDeep, smoothstep(uR * 0.6, uR * 2.6, d));
        float s = sin(vW.x * 0.42 + uTime * 0.5 + sin(vW.z * 0.3)) * sin(vW.z * 0.37 - uTime * 0.4);
        col *= 1.0 + s * 0.03;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(radius + 140, 96), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(cx, WATER_Y, cz);
  scene.add(water);

  // ---- basin hills: a noisy rim around the islands, kept low on the side
  // facing the default camera (+z) so it never hides the city
  const rimA = radius + 2;
  const rimB = radius + 18;
  const rawHeight = (x, z) => {
    const dx = x - cx, dz = (z - cz) * 0.92;
    const d = Math.hypot(dx, dz);
    const rim = smooth(rimA, rimB, d);
    let h = -1.4 + rim * (4 + 8 * fbm(x * 0.03, z * 0.03) + 3 * Math.abs(noise.noise(x * 0.075, z * 0.075)));
    const front = Math.max(0, Math.cos(Math.atan2(dx, dz)));
    if (h > 0) h *= 1 - 0.72 * Math.pow(front, 2.2);
    return h;
  };
  // A harbour sits on a level shelf of land: flattened behind and under it,
  // while in front of its quay the lake stays open.
  const GROUND = TOP - 0.2;
  const heightAt = (x, z) => {
    let h = rawHeight(x, z);
    for (const hb of harbours) {
      const d = Math.hypot(x - hb.x, z - hb.z);
      if (d > hb.r + 5) continue;
      const ox = hb.x - cx, oz = hb.z - cz;
      const s = ((x - hb.x) * ox + (z - hb.z) * oz) / Math.hypot(ox, oz); // + landward
      const w = (1 - smooth(hb.r + 0.8, hb.r + 5, d)) * smooth(-hb.r - 0.2, -hb.r + 1.4, s);
      h += (GROUND - h) * w;
    }
    return h;
  };
  const nearHarbour = (x, z, pad) => harbours.some((hb) => Math.hypot(x - hb.x, z - hb.z) < hb.r + pad);
  const size = 2 * (radius + 75);
  const tg = new THREE.PlaneGeometry(size, size, 170, 170).rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i) + cx, z = tp.getZ(i) + cz;
    tp.setXYZ(i, x, heightAt(x, z), z);
  }
  tg.computeVertexNormals();
  const nrm = tg.attributes.normal;
  const col = new Float32Array(tp.count * 3);
  const C = (h) => new THREE.Color(h);
  const bed = C(0x8fb3ad), sand = C(0xd9c9a3), field = C(0xaec493), grass = C(0xa3b986);
  const wood = C(0x6f8a62), wood2 = C(0x5d7656), rock = C(0xb2a38d);
  const cc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i);
    const slope = 1 - nrm.getY(i);
    const n = noise.noise(x * 0.25, z * 0.25) * 0.5 + 0.5;
    if (y < WATER_Y + 0.02) cc.copy(bed);
    else if (y < WATER_Y + 0.3) cc.copy(sand).lerp(field, smooth(WATER_Y + 0.05, WATER_Y + 0.3, y));
    else if (y < 1.8) cc.copy(field).lerp(grass, smooth(0.2, 1.6, y) * 0.8 + n * 0.2);
    else if (slope > 0.42) cc.copy(rock);
    else cc.copy(wood).lerp(wood2, n).lerp(rock, smooth(6.5, 9, y) * 0.6);
    col.set([cc.r, cc.g, cc.b], i * 3);
  }
  tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const terrain = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  // trees and a few cottages on the hills
  const slopeAt = (x, z, h) => Math.abs(heightAt(x + 0.6, z) - h) + Math.abs(heightAt(x, z + 0.6) - h);
  let placed = 0;
  for (let i = 0; i < 1400 && placed < 520; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rimA + 2 + rnd() * (rimB + 22 - rimA);
    const x = cx + Math.cos(a) * d, z = cz + (Math.sin(a) * d) / 0.92;
    const h = heightAt(x, z);
    if (h < 0.35 || h > 8 || slopeAt(x, z, h) > 0.9 || nearHarbour(x, z, 1.2)) continue;
    const s = 0.7 + rnd() * 0.6;
    if (h > 2.2 || rnd() < 0.45) props.conifer(x, z, s, rnd, h - 0.1);
    else props.tree(x, z, s, rnd, h - 0.1);
    placed++;
  }
  let homes = 0;
  for (let i = 0; i < 900 && homes < 22; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rimA + 4 + rnd() * 18;
    const x = cx + Math.cos(a) * d, z = cz + (Math.sin(a) * d) / 0.92;
    const h = heightAt(x, z);
    if (h < 0.3 || h > 1.6 || slopeAt(x, z, h) > 0.35 || nearHarbour(x, z, 2)) continue;
    props.cottage(x, z, 1 + rnd() * 0.4, rnd, h - 0.05, Math.atan2(cx - x, cz - z));
    homes++;
  }

  // ---- satellite islets (a lighthouse, wind turbines, a picnic spot), boats
  const islets = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4 + rnd() * 0.5;
    const d = radius + 2 + rnd() * 3.5;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const r = 0.8 + rnd() * 0.7;
    if (nearHarbour(x, z, r + 3.5)) continue; // leave the harbour's water open
    kit.part('cyl', [x, WATER_Y + 0.12, z], [r * 2, 0.4, r * 2], 0xe3d3b0);
    kit.part('sphere', [x, WATER_Y + 0.3, z], [r * 1.8, 0.35, r * 1.8], 0xa9c48a);
    islets.push({ x, z, r: r + 0.6 });
    if (i === 0) props.lighthouse(x, z, WATER_Y + 0.4);
    else if (i === 2) {
      turbine(x - r * 0.35, z, WATER_Y + 0.38, 1);
      turbine(x + r * 0.4, z - r * 0.3, WATER_Y + 0.38, 0.8);
    } else if (i === 4) {
      parasol(x - 0.25, z + 0.1, WATER_Y + 0.42, 0xdb6a41, rnd);
      parasol(x + 0.35, z - 0.15, WATER_Y + 0.42, 0xe9b444, rnd);
      props.tree(x, z - r * 0.5, 0.45, rnd, WATER_Y + 0.4);
    } else {
      props.tree(x + (rnd() - 0.5) * r * 0.6, z + (rnd() - 0.5) * r * 0.6, 0.55 + rnd() * 0.25, rnd, WATER_Y + 0.4);
      if (rnd() < 0.5) props.tree(x + (rnd() - 0.5) * r, z + (rnd() - 0.5) * r, 0.4, rnd, WATER_Y + 0.4);
    }
    kit.part('leaf', [x + r * 0.9, WATER_Y + 0.08, z + r * 0.5], [0.4, 0.25, 0.35], 0xb7ab98);
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius + 1 + rnd() * 5;
    boatProps.boat(cx + Math.cos(a) * d, cz + Math.sin(a) * d, rnd() * Math.PI * 2, rnd, WATER_Y);
  }

  // ---- clouds behind the hills
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + 0.3 + rnd() * (Math.PI - 0.6);
    const d = radius + 32 + rnd() * 34;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = 13 + rnd() * 8;
    const n = 4 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const s = 2.4 + rnd() * 2.2;
      kit.part('leaf', [x + (k - n / 2) * 1.7 + rnd(), y + rnd() * 0.8, z + (rnd() - 0.5) * 1.5], [s, s * 0.6, s], 0xffffff, null, [0, rnd() * 6, 0]);
    }
  }

  // ---- along the shore and out on the water
  const lrnd = mulberry32(23);
  // keep the new things clear of each other, and of the harbour and its boats
  const spots = [...islets, ...harbours.map((hb) => ({ x: hb.x, z: hb.z, r: hb.r + 4 }))];
  const clear = (x, z, r) => spots.every((s) => Math.hypot(s.x - x, s.z - z) > s.r + r);
  const at = (a, d) => [cx + Math.cos(a) * d, cz + (Math.sin(a) * d) / 0.92];
  // first point out from the centre along angle a where land rises out of the water
  const shoreAt = (a, lift = 0.05) => {
    for (let d = rimA - 2; d < rimB + 25; d += 0.15) {
      const [x, z] = at(a, d);
      if (heightAt(x, z) > WATER_Y + lift) return { x, z, d };
    }
    return null;
  };
  // local (u along, v across) -> world, for things laid out on a yawed footprint
  const frame = (x, z, yaw) => {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    return (u, v) => [x + s * u + c * v, z + c * u - s * v];
  };

  // wooden piers reaching in from the shore, a boat moored at most of them
  let piers = 0;
  for (let k = 0; k < 12 && piers < 5; k++) {
    const a = (k / 12) * Math.PI * 2 + 0.25;
    if (Math.sin(a) > 0.7) continue; // the near shore is the beach
    const sh = shoreAt(a);
    if (!sh) continue;
    const ux = cx - sh.x, uz = cz - sh.z;
    const ul = Math.hypot(ux, uz);
    const len = Math.min(2.2, ul - radius - 0.8);
    if (len < 1.2) continue;
    const yaw = Math.atan2(ux / ul, uz / ul);
    const f = frame(sh.x, sh.z, yaw);
    const [mx, mz] = f(len / 2 - 0.3, 0);
    if (!clear(mx, mz, len / 2 + 0.4)) continue;
    spots.push({ x: mx, z: mz, r: len / 2 + 0.4 });
    piers++;
    const y = WATER_Y + 0.26;
    kit.part('box', [mx, y, mz], [0.5, 0.06, len + 0.6], 0xb98a5c, null, [0, yaw, 0]);
    for (let u = -0.2; u < len; u += 0.7)
      for (const v of [-0.22, 0.22]) {
        const [px, pz] = f(u, v);
        kit.part('cyl', [px, WATER_Y + 0.02, pz], [0.06, 0.5, 0.06], 0x7a5d44);
      }
    const [lx, lz] = f(len - 0.4, 0.2);
    props.lamp(lx, lz, y);
    if (lrnd() < 0.75) {
      const [bx, bz] = f(len - 0.6, 0.55);
      props.boat(bx, bz, yaw + (lrnd() - 0.5) * 0.3, lrnd, WATER_Y);
    }
  }

  // parasols and towels on the near beach
  const BEACH = [0xdb6a41, 0xe9b444, 0x58a6a6, 0xf4efe6, 0xf2b5c6];
  for (const a of [Math.PI / 2 - 0.5, Math.PI / 2 + 0.08, Math.PI / 2 + 0.55]) {
    const sh = shoreAt(a, 0.1);
    if (!sh) continue;
    for (let n = 0; n < 3; n++) {
      const [x, z] = at(a + (n - 1) * 0.045, sh.d + 0.3 + lrnd() * 0.6);
      const h = heightAt(x, z);
      if (h < WATER_Y + 0.05 || h > 0.6) continue;
      parasol(x, z, h, BEACH[Math.floor(lrnd() * BEACH.length)], lrnd);
    }
  }

  // floating platforms stacked with colourful crates, out in the water
  const CRATES = [0xdb6a41, 0xe9b444, 0x58a6a6, 0xf2b5c6, 0xf4efe6, 0x4f86c6];
  for (let n = 0, tries = 0; n < 2 && tries < 40; tries++) {
    const a = lrnd() * Math.PI * 2;
    const [x, z] = at(a, radius + 2.2 + lrnd() * 2);
    if (!clear(x, z, 1.6)) continue;
    spots.push({ x, z, r: 1.6 });
    n++;
    const yaw = a + Math.PI / 2;
    const f = frame(x, z, yaw);
    kit.part('rbox', [x, WATER_Y + 0.04, z], [1.1, 0.1, 2.3], 0xdfe9ea, null, [0, yaw, 0]);
    for (let i = 0; i < 5; i++)
      for (const v of [-0.22, 0.22]) {
        if (lrnd() < 0.15) continue;
        const [bx, bz] = f(-0.84 + i * 0.42, v);
        const hh = 0.24 + lrnd() * 0.12;
        kit.part('rbox', [bx, WATER_Y + 0.09 + hh / 2, bz], [0.36, hh, 0.38], CRATES[Math.floor(lrnd() * CRATES.length)], null, [0, yaw, 0]);
      }
  }

  // a floating cycle deck: green lane, dashed centre line, rails, a stair
  for (let tries = 0; tries < 40; tries++) {
    const a = Math.PI / 2 + 0.9 + lrnd() * 1.2;
    const [x, z] = at(a, radius + 2.8 + lrnd() * 1.5);
    if (!clear(x, z, 2.1)) continue;
    spots.push({ x, z, r: 2.1 });
    const yaw = a + Math.PI / 2;
    const f = frame(x, z, yaw);
    const y = WATER_Y + 0.12;
    kit.part('rbox', [x, y, z], [1.0, 0.18, 3.6], 0xbab3a6, null, [0, yaw, 0]);
    kit.part('box', [x, y + 0.095, z], [0.5, 0.012, 3.2], 0x8fb59a, null, [0, yaw, 0]);
    for (let u = -1.4; u <= 1.41; u += 0.4) {
      const [dx, dz] = f(u, 0);
      kit.part('box', [dx, y + 0.104, dz], [0.03, 0.006, 0.18], 0xf7f3ec, null, [0, yaw, 0]);
    }
    for (let u = -1.6; u <= 1.61; u += 0.53)
      for (const v of [-0.46, 0.46]) {
        const [px, pz] = f(u, v);
        kit.part('cyl', [px, y + 0.2, pz], [0.025, 0.22, 0.025], 0x4a4744);
      }
    for (const v of [-0.46, 0.46]) {
      const [rx, rz] = f(0, v);
      kit.part('box', [rx, y + 0.31, rz], [0.025, 0.025, 3.2], 0x4a4744, null, [0, yaw, 0]);
    }
    for (let st = 0; st < 4; st++) {
      const [sx, sz] = f(1.55 - st * 0.06, 0);
      kit.part('box', [sx, y + 0.12 + st * 0.11, sz], [0.9, 0.11, 0.14 + st * 0.12], 0xd8cfc0, null, [0, yaw, 0]);
    }
    const [fx, fz] = f(-1.6, 0.36);
    kit.part('cyl', [fx, y + 0.45, fz], [0.025, 0.7, 0.025], 0x4a4744);
    kit.part('box', [fx, y + 0.72, fz], [0.01, 0.13, 0.2], 0xdb6a41, null, [0, yaw + Math.PI / 2, 0]);
    break;
  }

  // buoys: red with a white band and a little light on top
  for (let n = 0, tries = 0; n < 12 && tries < 120; tries++) {
    const [x, z] = at(lrnd() * Math.PI * 2, radius + 0.6 + lrnd() * 4);
    if (!clear(x, z, 0.3)) continue;
    n++;
    kit.part('cyl', [x, WATER_Y + 0.08, z], [0.16, 0.22, 0.16], 0xdb6a41);
    kit.part('cyl', [x, WATER_Y + 0.12, z], [0.17, 0.05, 0.17], 0xf4efe6);
    kit.part('bulb', [x, WATER_Y + 0.23, z], [0.06, 0.06, 0.06], 0xffb08a);
  }

  // a wind turbine, rotor facing the default camera (+z)
  function turbine(x, z, y, s) {
    kit.part('cyl', [x, y + 0.8 * s, z], [0.07 * s, 1.6 * s, 0.07 * s], 0xf4efe6);
    kit.part('rbox', [x, y + 1.62 * s, z + 0.02], [0.1 * s, 0.1 * s, 0.24 * s], 0xf4efe6);
    for (let b = 0; b < 3; b++) {
      const t = (b / 3) * Math.PI * 2 + 0.3;
      kit.part('box', [x + Math.sin(t) * 0.33 * s, y + 1.62 * s + Math.cos(t) * 0.33 * s, z + 0.15 * s], [0.045 * s, 0.66 * s, 0.02 * s], 0xf7f3ec, null, [0, 0, -t]);
    }
  }
  // a beach parasol with a towel beside it
  function parasol(x, z, y, color, r) {
    kit.part('cyl', [x, y + 0.3, z], [0.03, 0.6, 0.03], 0xf4efe6);
    kit.part('cone', [x, y + 0.6, z], [0.62, 0.18, 0.62], color);
    kit.part('box', [x + 0.22, y + 0.01, z + 0.1], [0.22, 0.015, 0.42], r() < 0.5 ? 0xf2b5c6 : 0x58a6a6, null, [0, r() * Math.PI, 0]);
  }

  return {
    update(dt) {
      waterMat.uniforms.uTime.value += dt;
    },
    // p: one blended time-of-day state (Colors, a unit `dir`, `night` 0–1)
    applyTime(p) {
      const su = sky.material.uniforms;
      su.uTop.value.copy(p.top);
      su.uHorizon.value.copy(p.horizon);
      su.uSun.value.copy(p.sun);
      su.uSunDir.value.copy(p.dir);
      su.uNight.value = p.night;
      hemi.color.copy(p.hemiSky);
      hemi.groundColor.copy(p.hemiGround);
      hemi.intensity = p.hemiI;
      sun.color.copy(p.sun);
      sun.intensity = p.sunI;
      sun.position.copy(center).addScaledVector(p.dir, radius * 3 + 20);
      fill.intensity = 0.35 * (1 - 0.6 * p.night);
      waterMat.uniforms.uShallow.value.copy(p.shallow);
      waterMat.uniforms.uDeep.value.copy(p.deep);
      scene.fog.color.copy(p.fog);
    },
  };
}
