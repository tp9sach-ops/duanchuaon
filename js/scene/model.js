// Nạp quần thể chùa (file GLB quét ảnh): Lukang Longshan Temple, Taiwan — Fovea (Sketchfab), CC BY-NC-SA 4.0.
// Nếu file chưa có hoặc nạp lỗi, hàm trả về null và cảnh vẫn chạy (không có quần thể phía sau).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const MODEL_URL = 'assets/models/chua-longshan.glb';

// Vị trí / tỉ lệ mặc định. Chỉnh thử bằng địa chỉ: ?mw=150&mz=-92&mx=0&my=0&mr=0 (mr = xoay quanh trục dọc, độ)
export function modelConfig() {
  const q = new URLSearchParams(location.search), n = (k, d) => (q.has(k) && isFinite(+q.get(k)) ? +q.get(k) : d);
  return { width: n('mw', 150), x: n('mx', 0), y: n('my', 0.08), z: n('mz', -92), rot: n('mr', 0) * Math.PI / 180 };
}

export function loadTemple(onProgress) {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(MODEL_URL, (gltf) => {
      try {
        const root = gltf.scene, cfg = modelConfig();
        // Làm tối nhẹ để hợp cảnh đêm (vật liệu 'unlit' lấy từ ảnh chụp ban ngày)
        root.traverse((o) => {
          if (o.isMesh) {
            o.frustumCulled = true;
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach((m) => { if (m && m.color) m.color.setHex(0x8f99b8); });
          }
        });
        // Chuẩn hóa: đặt tâm ở gốc, mặt đất ở y=0, co theo bề rộng mong muốn
        const holder = new THREE.Group(); holder.add(root);
        const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
        root.position.set(-c.x, -box.min.y, -c.z);
        const sc = cfg.width / Math.max(size.x, size.z);
        holder.scale.setScalar(sc); holder.rotation.y = cfg.rot;
        holder.position.set(cfg.x, cfg.y, cfg.z);
        resolve(holder);
      } catch (e) { console.warn('[Diệu Giang Tự] Không xử lý được mô hình chùa:', e); resolve(null); }
    }, (ev) => { if (ev && ev.total) onProgress?.(ev.loaded / ev.total); }, (err) => {
      console.warn('[Diệu Giang Tự] Chưa nạp được mô hình chùa (', MODEL_URL, '):', err && err.message ? err.message : err);
      resolve(null);
    });
  });
}
