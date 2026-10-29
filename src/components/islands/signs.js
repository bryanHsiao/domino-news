// Article signs at the house doors: one small signboard per article written
// about the class, a white "i" on a round badge coloured by the article's
// language, so it reads as "information about this class" rather than as
// one more passer-by. Each part is one InstancedMesh (instance i = sign i =
// props.people[i]), so picking maps straight back to the article.

// badge colour per article language; keep in sync with the legend / panel
// dots in ClassIslands.astro
const LANG_BADGE = { ls: 0xdb6a41, java: 0x4f86c6, ssjs: 0x4fa36b, other: 0x9a958c };

const POST_H = 0.26;
const BOARD = [0.17, 0.19, 0.03]; // w, h, d
const BADGE_R = 0.06;

function glyphTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(32, 15, 7, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.roundRect(26, 27, 12, 28, 4);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * @param {Array<{x:number,y:number,z:number,yaw:number,info:{node:string,article:number}|null}>} spots
 * @param {(info:any) => string|undefined} langOf  article language of a spot
 */
export function createSigns(THREE, scene, material, spots, langOf) {
  const n = spots.length;
  const mesh = (geo, mat, shadow = true) => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
    m.count = n;
    m.castShadow = shadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const post = mesh(new THREE.CylinderGeometry(0.012, 0.012, POST_H, 6), material);
  const board = mesh(new THREE.BoxGeometry(...BOARD), material);
  const badge = mesh(new THREE.CylinderGeometry(BADGE_R, BADGE_R, 0.006, 20).rotateX(Math.PI / 2), material, false);
  const glyph = mesh(
    new THREE.PlaneGeometry(BADGE_R * 1.5, BADGE_R * 1.5),
    new THREE.MeshBasicMaterial({ map: glyphTexture(THREE), transparent: true, alphaTest: 0.3, depthWrite: false }),
    false,
  );

  const root = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  const boardY = POST_H + BOARD[1] / 2 - 0.02;
  spots.forEach((s, i) => {
    root.compose(v.set(s.x, s.y, s.z), q.setFromAxisAngle(up, s.yaw), one);
    const put = (m, x, y, z) => m.setMatrixAt(i, out.multiplyMatrices(root, local.makeTranslation(x, y, z)));
    put(post, 0, POST_H / 2, -0.005);
    put(board, 0, boardY, 0);
    put(badge, 0, boardY + 0.01, BOARD[2] / 2 + 0.003);
    put(glyph, 0, boardY + 0.01, BOARD[2] / 2 + 0.0075);
    post.setColorAt(i, c.set(0x4a4744));
    board.setColorAt(i, c.set(0xfbf7ee));
    badge.setColorAt(i, c.set(LANG_BADGE[langOf(s.info)] ?? LANG_BADGE.ls));
  });
  for (const m of [post, board, badge, glyph]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }

  // parts a pointer can hit, one instance per sign
  return { pickMeshes: [board, badge, post] };
}
