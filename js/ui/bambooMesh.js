// Cây GẬY DẠY CHÓ 3D (Phiên 224, mục 1; id nội bộ 'tre'): dùng chung cho cầm tay (js/ui/items.js, js/ui/bag.js) và cưỡi bay (js/ui/board.js, js/ui/remoteGear.js). Cùng giao diện với js/ui/staffMesh.js.
// - buildBamboo(): gậy khối (thân tre vàng có đốt, hai đầu có mấu) + 3 quầng sáng VÀNG. Dài BAMBOO_LEN m, trục y, gốc ở giữa. Dùng tạm khi GLB chưa nạp xong / lỗi.
// - loadBambooGlb(g): giải mã mô hình nhúng base64 (js/data/bambooGlb.js, ~18 KB) MỘT lần, rồi thay thân khối (GIỮ quầng sáng); lỗi thì giữ gậy khối (không hỏng game).
// - pulseBamboo(g, t, hot): HAI ĐẦU CHỚP VÀNG ĐỀU, CÙNG NHỊP (khác Gậy như ý chớp lệch pha); hot = đang đánh / đang bay → chớp nhanh, to hơn.
// - buildBambooMount(len): gậy nằm ngang để cưỡi bay, kèm vệt sáng vàng phía sau (giống buildStaffMount ở js/ui/board.js).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BAMBOO_GLB_B64 } from '../data/bambooGlb.js';

export const BAMBOO_LEN = 1.5;
export const BAMBOO_SCALE = 1.4;       // cầm tay to hơn côn mặc định như Gậy như ý (dài 2,1 m)
export const BAMBOO_GOLD = 0xffcf3a;   // màu ánh sáng vàng (quầng, vòng sáng khi đánh)

let TEX = null;
export function goldGlowTexture() {
  if (TEX) return TEX;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,250,215,1)'); gr.addColorStop(0.35, 'rgba(255,205,60,.62)'); gr.addColorStop(1, 'rgba(255,170,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.SRGBColorSpace; return TEX;
}

export function buildBamboo() {
  const g = new THREE.Group(); g.name = 'gaydaycho'; const body = new THREE.Group(); body.name = 'than'; g.add(body);
  const bamboo = new THREE.MeshStandardMaterial({ color: 0xd9b24a, roughness: 0.55, metalness: 0.05, emissive: 0x6a4a00, emissiveIntensity: 0.45 });
  const node = new THREE.MeshStandardMaterial({ color: 0x9c7a22, roughness: 0.6, metalness: 0.05, emissive: 0x3a2800, emissiveIntensity: 0.35 });
  const put = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; body.add(m); return m; };
  put(new THREE.CylinderGeometry(0.027, 0.03, 1.5, 12), bamboo, 0);
  for (const y of [-0.5, -0.25, 0, 0.25, 0.5]) { const r = put(new THREE.TorusGeometry(0.031, 0.009, 6, 14), node, y); r.rotation.x = Math.PI / 2; }   // đốt tre
  for (const s of [-1, 1]) { const cap = put(new THREE.SphereGeometry(0.033, 10, 8), node, s * 0.75); cap.scale.set(1, 0.8, 1); }
  const glows = [];   // [đầu -y, đầu +y, giữa]
  for (const y of [-0.77, 0.77, 0]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: goldGlowTexture(), transparent: true, opacity: y === 0 ? 0.35 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.y = y; const sz = y === 0 ? 0.5 : 0.42; sp.scale.set(sz, sz, 1); g.add(sp); glows.push(sp);
  }
  g.userData.glows = glows; g.userData.body = body;
  return g;
}

// Giải mã GLB nhúng MỘT lần (Promise<THREE.Group đã chuẩn hóa>), các lần sau chỉ nhân bản (dùng chung hình khối + chất liệu).
let GLB = null;
function bambooScene() {
  if (GLB) return GLB;
  GLB = new Promise((ok, no) => {
    try {
      const bin = atob(BAMBOO_GLB_B64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new GLTFLoader().parse(buf.buffer, '', (gltf) => {
        try {
          const holder = new THREE.Group(); holder.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
          const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
          if (size.x >= size.y && size.x >= size.z) holder.rotation.z = Math.PI / 2; else if (size.z >= size.y && size.z >= size.x) holder.rotation.x = Math.PI / 2;
          gltf.scene.scale.setScalar(BAMBOO_LEN / Math.max(size.x, size.y, size.z, 1e-6));
          const root = new THREE.Group(); root.add(holder); root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()); holder.position.set(-c.x, -c.y, -c.z);
          root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          ok(root);
        } catch (e) { no(e); }
      }, no);
    } catch (e) { no(e); }
  });
  return GLB;
}

/** Thay thân khối bằng mô hình GLB (bất đồng bộ). Chuẩn hóa: trục dài nhất → y, dài BAMBOO_LEN, gốc ở giữa. */
export function loadBambooGlb(g) {
  if (!g || g.userData.glbTried) return; g.userData.glbTried = true;
  bambooScene().then((root) => { g.userData.body.visible = false; const c = root.clone(true); g.add(c); g.userData.glb = c; })
    .catch((err) => console.warn('[Diệu Giang Tự] Không nạp được Gậy dạy chó 3D, giữ gậy khối:', err && err.message ? err.message : err));
}

/** Hai đầu chớp vàng ĐỀU, cùng nhịp; giữa sáng đều. t = giây, hot = đang đánh / bay. */
export function pulseBamboo(g, t, hot) {
  const gl = g && g.userData && g.userData.glows; if (!gl) return;
  const f = hot ? 11 : 5, a = 0.5 + 0.5 * Math.sin(t * f), big = hot ? 0.6 : 0.44;
  for (const i of [0, 1]) { gl[i].material.opacity = 0.25 + 0.75 * a; const s = big * (0.72 + 0.46 * a); gl[i].scale.set(s, s, 1); }
  gl[2].material.opacity = hot ? 0.6 : 0.35;
}

/** Gậy dạy chó cưỡi bay: nằm ngang, dài len m, hai đầu chớp vàng, vệt sáng vàng phía sau (thấy khi bay). userData.staff = cây gậy (cho pulseBamboo), userData.trail = vệt. */
export function buildBambooMount(len) {
  const g = new THREE.Group(); g.name = 'cuoi-daycho'; g.visible = false;
  const s = buildBamboo(); s.rotation.x = Math.PI / 2; s.scale.setScalar(len * 1.25 / BAMBOO_LEN); s.position.y = -0.07; g.add(s); loadBambooGlb(s);
  const trail = [];
  for (let i = 0; i < 9; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: goldGlowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(0, -0.07, -(len * 1.25 / 2 + 0.2 + i * 0.32)); const k = 0.9 - i * 0.07; sp.scale.set(k, k, 1); g.add(sp); trail.push(sp);
  }
  g.userData.staff = s; g.userData.trail = trail;
  return g;
}
