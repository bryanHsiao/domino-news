// Scenery around the archipelago: sky, light, water, a basin of hills that
// rings the islands, satellite islets, boats and clouds. Purely decorative —
// a fixed bright day (v1 has no day/night cycle).
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { WATER_Y, mulberry32 } from './layout.js';

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createEnvironment(THREE, scene, props, kit, { cx, cz, radius }) {
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
        uSunDir: { value: sunDir },
      },
      vertexShader: `varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uTop, uHorizon, uSun, uSunDir; varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 c = mix(uHorizon, uTop, smoothstep(0.0, 0.5, h));
          c += uSun * pow(max(dot(normalize(vDir), uSunDir), 0.0), 24.0) * 0.3;
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
  scene.add(new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.35));
  const sun = new THREE.DirectionalLight(0xfff1de, 2.9);
  sun.position.copy(center).addScaledVector(sunDir, radius * 3 + 20);
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = radius + 3;
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
  const heightAt = (x, z) => {
    const dx = x - cx, dz = (z - cz) * 0.92;
    const d = Math.hypot(dx, dz);
    const rim = smooth(rimA, rimB, d);
    let h = -1.4 + rim * (4 + 8 * fbm(x * 0.03, z * 0.03) + 3 * Math.abs(noise.noise(x * 0.075, z * 0.075)));
    const front = Math.max(0, Math.cos(Math.atan2(dx, dz)));
    if (h > 0) h *= 1 - 0.72 * Math.pow(front, 2.2);
    return h;
  };
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
    if (h < 0.35 || h > 8 || slopeAt(x, z, h) > 0.9) continue;
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
    if (h < 0.3 || h > 1.6 || slopeAt(x, z, h) > 0.35) continue;
    props.cottage(x, z, 1 + rnd() * 0.4, rnd, h - 0.05, Math.atan2(cx - x, cz - z));
    homes++;
  }

  // ---- satellite islets, a lighthouse, boats
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4 + rnd() * 0.5;
    const d = radius + 2 + rnd() * 3.5;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const r = 0.8 + rnd() * 0.7;
    kit.part('cyl', [x, WATER_Y + 0.12, z], [r * 2, 0.4, r * 2], 0xe3d3b0);
    kit.part('sphere', [x, WATER_Y + 0.3, z], [r * 1.8, 0.35, r * 1.8], 0xa9c48a);
    if (i === 0) props.lighthouse(x, z, WATER_Y + 0.4);
    else {
      props.tree(x + (rnd() - 0.5) * r * 0.6, z + (rnd() - 0.5) * r * 0.6, 0.55 + rnd() * 0.25, rnd, WATER_Y + 0.4);
      if (rnd() < 0.5) props.tree(x + (rnd() - 0.5) * r, z + (rnd() - 0.5) * r, 0.4, rnd, WATER_Y + 0.4);
    }
    kit.part('leaf', [x + r * 0.9, WATER_Y + 0.08, z + r * 0.5], [0.4, 0.25, 0.35], 0xb7ab98);
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius + 1 + rnd() * 5;
    props.boat(cx + Math.cos(a) * d, cz + Math.sin(a) * d, rnd() * Math.PI * 2, rnd, WATER_Y);
  }

  // ---- clouds drifting behind the hills (static in v1)
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

  return {
    update(dt) {
      waterMat.uniforms.uTime.value += dt;
    },
  };
}
