// Đại Phật KHẮC TRÊN VÁCH ĐÁ cạnh thác (Phiên 58; làm lại Phiên 83 theo ptg: lấy hình Phật trong chánh điện, làm thành vách đá, xử lý màu cho giống đá).
// Tượng là ảnh assets/buddha.webp (Phật chánh điện) đã được tools/make-daiphat-da.py đổi thành đá: assets/daiphat-da.webp (màu đá, vân, rêu; alpha = hình vòm)
// + assets/daiphat-cao.webp (độ cao, sáng = nhô). Cảnh dùng đúng hai ảnh này làm map + bumpMap + displacementMap trên một mặt phẳng chia lưới, nên nét chạm LÕM/NỔI thật theo ánh sáng.
// Tấm vách nằm sát mặt vách thác (mặt vách quanh tượng được làm phẳng ở buildWaterfall, js/scene/outside.js); rải đá tảng quanh viền cho liền với vách. Ban đêm tượng sáng nhẹ ánh vàng.
// Hằng số PANEL (js/world/daiphatPanel.js) phải khớp tools/make-daiphat-da.py. Dữ liệu vị trí/va chạm ở js/world/outside.js (DAI_PHAT). Trả THREE.Group.
import * as THREE from 'three';
import { DAI_PHAT } from '../world/outside.js';
import { PANEL, archOutline } from '../world/daiphatPanel.js';

const flat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true, ...o });
const glow = (c, k) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.6 }); m.userData.nightGlow = { day: k, night: k * 4 + 0.5 }; return m; };
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

let tex = null;
function loadTex(name, srgb) {
  const t = new THREE.TextureLoader().load(new URL(`../../assets/${name}`, import.meta.url).href);
  if (srgb) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
  return t;
}
function textures() { return tex || (tex = { da: loadTex('daiphat-da.webp', true), cao: loadTex('daiphat-cao.webp', false) }); }

export function buildDaiPhat() {
  const root = new THREE.Group(), g = new THREE.Group();
  // gốc nhóm: mặt ngách (x = face), tâm z; local +z = hướng nhìn ra (thế giới -x), local +x = thế giới +z
  g.position.set(DAI_PHAT.face, 0, DAI_PHAT.z); g.rotation.y = -Math.PI / 2; root.add(g);
  const T = textures();
  const stone = flat(0xcbbd9c), stone2 = flat(0xb7a883), step = flat(0x8a8176);

  // ---- tấm vách chạm tượng: mặt phẳng chia lưới + độ cao thật
  const mat = new THREE.MeshStandardMaterial({
    map: T.da, alphaTest: 0.5, roughness: 0.96, metalness: 0,
    bumpMap: T.cao, bumpScale: 3.2,
    displacementMap: T.cao, displacementScale: PANEL.relief, displacementBias: PANEL.bias,
    emissive: 0xffd9a0, emissiveMap: T.da, emissiveIntensity: 0.06,
  });
  mat.userData.nightGlow = { day: 0.06, night: 0.5 };   // ban đêm tượng ánh vàng nhẹ (như đèn rọi), ban ngày gần như không
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL.w, PANEL.h, PANEL.segX, PANEL.segY), mat);
  panel.position.set(0, PANEL.h / 2, -PANEL.back); panel.castShadow = panel.receiveShadow = true; panel.name = 'daiphat-vach'; g.add(panel);

  // ---- đá tảng rải quanh viền vòm cho liền với mặt vách (dẹt theo chiều sâu, màu như đá thác)
  const rnd = mulberry32(8303), tones = [0x8a8176, 0x7d756a, 0x968c7d, 0x70695f];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const o = archOutline((i + rnd() * 0.5) / N, 0.15 + rnd() * 0.5), s = 0.7 + rnd() * 0.9;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), flat(tones[i % tones.length]));
    m.scale.set(s * (0.9 + rnd() * 0.5), s * (0.8 + rnd() * 0.6), 0.45 + rnd() * 0.25);
    m.position.set(o.x, o.y, -PANEL.back + 0.05 + rnd() * 0.2); m.rotation.set(rnd() * 0.5, rnd() * 0.5, rnd() * 3); m.castShadow = m.receiveShadow = true; g.add(m);
  }
  // đá tảng chân vách (hai bên chân tượng) để chân vách không "mọc" thẳng từ cỏ
  for (let i = 0; i < 9; i++) {
    const x = -PANEL.r - 0.5 + (i / 8) * (PANEL.w + 1), s = 0.8 + rnd() * 0.8;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), flat(tones[(i + 1) % tones.length]));
    m.scale.set(s * 1.1, s * 0.55, 0.9 + rnd() * 0.5); m.position.set(x, s * 0.2, -PANEL.back + 0.3 + rnd() * 0.3); m.rotation.set(rnd(), rnd(), rnd()); m.castShadow = m.receiveShadow = true; g.add(m);
  }

  // bậc đá phía trước (khớp vật cản DAI_PHAT.bac) + hai đèn đá
  const b = DAI_PHAT.bac, nSteps = 3, depth = (b.x1 - b.x0), wz = b.z1 - b.z0;
  for (let i = 0; i < nSteps; i++) { const d = depth * (1 - i / nSteps); const bx = new THREE.Mesh(new THREE.BoxGeometry(d, 0.22 * (i + 1), wz), step); bx.position.set(b.x1 - d / 2, 0.11 * (i + 1), (b.z0 + b.z1) / 2); bx.castShadow = bx.receiveShadow = true; root.add(bx); }
  const lampMat = glow(0xffd08a, 0.5);
  for (const l of DAI_PHAT.den) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.1, 6), stone2); base.position.set(l.x, 0.55, l.z); root.add(base);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), lampMat); box.position.set(l.x, 1.35, l.z); root.add(box);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), stone2); cap.rotation.y = Math.PI / 4; cap.position.set(l.x, 1.78, l.z); root.add(cap);
  }
  void stone;
  return root;
}
