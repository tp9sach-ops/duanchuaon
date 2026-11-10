// Nhà dựng từ mô hình GLB (cấp 1 "Nhà lầu" và cấp 2 "Nhà hoa viên"), nạp khi cần. Gắn vào js/scene/land.js (houseModel).
// Nếu file chưa có hoặc nạp lỗi, nhà vẫn hiện bằng bản dựng bằng mã (không vỡ cảnh). Hình + vật liệu của bản mẫu dùng CHUNG
// (userData.shared = true) nên refresh() của land.js dọn nhà cũ sẽ không hủy bản mẫu.
// Mô hình đã tối ưu bằng công cụ riêng: mặt trước +z, gốc ở tâm thân nhà, sàn tầng trệt y = 0, đơn vị mét, khớp thân nhà HOUSE_LEVELS (js/world/land.js).
//   nha-lau.glb       = "VIANNEY HOUSE 2" của fantecboisseau (CC-BY-4.0)   — nhà phố hiện đại 3 tầng, mặt tiền kính
//   nha-hoa-vien.glb  = "Autumn House" của Zhenya (CC-BY-4.0)             — nhà gỗ có hiên, dây leo và lá thu
// Ghi công xem THIRD_PARTY.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Cấp nhà -> file GLB. Muốn đổi mô hình chỉ cần đổi url (giữ quy ước: mặt trước +z, gốc ở tâm thân nhà). Cấp không có trong bảng dùng bản dựng bằng mã. */
export const HOUSE_GLB = {
  1: { url: 'assets/models/houses/nha-lau.glb', lift: 0.06 },
  2: { url: 'assets/models/houses/nha-hoa-vien.glb', lift: 0.06 },
};

const store = new Map();   // lv -> { tpl, p }
const entry = (lv) => { let e = store.get(lv); if (!e) store.set(lv, (e = { tpl: null, p: null })); return e; };

function prepare(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry) o.geometry.userData.shared = true;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    let glass = false;
    for (const m of ms) {
      if (!m) continue;
      m.userData.shared = true;
      if (m.isMeshStandardMaterial) { m.metalness = 0; m.roughness = Math.max(m.roughness, 0.85); }
      if (m.transparent && !m.alphaTest) { glass = true; m.depthWrite = false; m.roughness = 0.2; }   // kính: nửa trong suốt, không ghi độ sâu
    }
    o.castShadow = !glass; o.receiveShadow = true;
  });
  return root;
}

/** Bắt đầu nạp mô hình cấp lv (chỉ nạp một lần). Trả Promise<boolean>: true = đã có bản mẫu. */
export function loadHouseGlb(lv) {
  const spec = HOUSE_GLB[lv]; if (!spec) return Promise.resolve(false);
  const e = entry(lv);
  if (!e.p) {
    e.p = new Promise((resolve) => {
      try {
        new GLTFLoader().load(spec.url, (gltf) => { try { e.tpl = prepare(gltf.scene); resolve(true); } catch (err) { console.warn('[Diệu Giang Tự] Không xử lý được mô hình nhà', spec.url, err); resolve(false); } },
          undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được mô hình nhà (', spec.url, '):', err && err.message ? err.message : err); resolve(false); });
      } catch (err) { console.warn('[Diệu Giang Tự] Không nạp được mô hình nhà:', err); resolve(false); }
    });
  }
  return e.p;
}
/** Gọi cb(ok) khi việc nạp mô hình cấp lv xong (ok = có bản mẫu). Luôn bất đồng bộ. */
export const onHouseGlb = (lv, cb) => { loadHouseGlb(lv).then(cb); };
/** Bản sao dựng sẵn của mô hình cấp lv (chia sẻ hình + vật liệu), đã nâng lên `lift` mét; null nếu chưa nạp xong / không có. */
export function houseGlbClone(lv) {
  const e = store.get(lv), spec = HOUSE_GLB[lv]; if (!e || !e.tpl || !spec) return null;
  const c = e.tpl.clone(true); c.position.y = spec.lift || 0; return c;
}
