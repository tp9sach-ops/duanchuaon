// Nón Jingasa 3D (Phiên 154): dùng cho nhân vật chibi (js/ui/items.js). Mô hình GLB nhúng sẵn trong js/data/hatGlb.js (không cần tải thêm file).
// - buildHat(): trả nhóm nón NGAY (nón khối đơn giản), rồi thay bằng GLB khi nạp xong (lỗi thì giữ nón khối, game không hỏng).
// - Chuẩn hóa: vành rộng HAT_DIAM, gốc ở GIỮA VÀNH DƯỚI (y = 0), đỉnh nón hướng +y. Nơi gắn: HAT_POS trong hệ tọa độ "mặt" của chibi (đầu cầu bán kính ~0,42). Các số vị trí là TẠM, CHƯA nhìn bằng mắt.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HAT_GLB_B64 } from '../data/hatGlb.js';

export const HAT_DIAM = 1.0;                    // đường kính vành (đơn vị mặt: đầu rộng ~0,84)
export const HAT_POS = { x: 0, y: 0.24, z: -0.03 };   // vành dưới đặt ngang trán, lùi nhẹ ra sau để lộ mặt

let parsed = null, pending = null;
const listeners = new Set();

function b64ToBuf(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }

function normalize(scene) {
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    const m = o.material; if (m && m.color && m.color.getHex() === 0) { m.color.setHex(0x1c1612); m.roughness = 0.5; }
    if (m) m.side = THREE.DoubleSide;
  });
  const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const holder = new THREE.Group(); holder.add(scene); scene.position.set(-c.x, -box.min.y, -c.z);
  const k = HAT_DIAM / Math.max(size.x, size.z, 1e-6); const root = new THREE.Group(); root.add(holder); holder.scale.setScalar(k);
  return root;
}

function blockHat() {   // nón khối dự phòng: chóp thấp + vành rộng, đen bóng
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x1c1612, roughness: 0.5, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(HAT_DIAM / 2, 0.33, 28, 1, true), mat); cone.position.y = 0.165; g.add(cone);
  return g;
}

function ensure() {
  if (parsed || pending) return;
  pending = true;
  try {
    new GLTFLoader().parse(b64ToBuf(HAT_GLB_B64), '', (gltf) => {
      try { parsed = normalize(gltf.scene); for (const f of listeners) f(); } catch (e) { console.warn('[Diệu Giang Tự] Không xử lý được nón Jingasa 3D, giữ nón khối:', e); }
      listeners.clear();
    }, (e) => { console.warn('[Diệu Giang Tự] Không đọc được nón Jingasa 3D, giữ nón khối:', e && e.message ? e.message : e); listeners.clear(); });
  } catch (e) { console.warn('[Diệu Giang Tự] Không nạp được nón Jingasa 3D:', e); }
}

/** Nhóm nón sẵn dùng (đã có nón khối; GLB thay vào khi nạp xong). Nơi gọi đặt vị trí theo HAT_POS. */
export function buildHat() {
  const g = new THREE.Group(); g.name = 'non-jingasa';
  const fallback = blockHat(); g.add(fallback);
  const swap = () => { if (!parsed || g.userData.glb) return; g.userData.glb = true; g.remove(fallback); g.add(parsed.clone(true)); };
  if (parsed) swap(); else { listeners.add(swap); ensure(); }
  return g;
}
