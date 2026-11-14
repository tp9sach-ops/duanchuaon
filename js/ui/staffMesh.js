// Cây Gậy như ý 3D (mục 1): dùng chung cho cầm tay (js/ui/items.js) và cưỡi bay (js/ui/board.js).
// - buildStaff(): cây gậy dựng bằng khối theo ảnh mẫu (cán đỏ, hai đầu đồng chạm rồng) + 3 quầng sáng. Dài STAFF_LEN m, trục y, gốc ở giữa.
// - loadStaffGlb(g): nạp assets/models/gay-nhu-y.glb MỘT lần rồi thay thân khối (GIỮ quầng sáng); thiếu file / lỗi thì giữ gậy khối (không hỏng game).
// - pulseGlows(g, t, hot): HAI ĐẦU CHỚP CHỚP lệch pha (hot = đang đánh / đang bay → chớp nhanh, to hơn); quầng giữa sáng đều.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const STAFF_LEN = 1.5;
export const STAFF_SCALE = 1.4;      // Phiên 149: Gậy như ý to hơn cây côn/thương mặc định (dài 1,5 m) → cầm tay dài 2,1 m, dày gấp 1,4 lần
export const STAFF_PINK = 0xff7ac8;  // Phiên 149: ánh sáng hồng (quầng, vòng sáng khi đánh)
const GLB = new URL('../../assets/models/gay-nhu-y.glb', import.meta.url).href;
let TEX = null;
export function glowTexture() {
  if (TEX) return TEX;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,238,250,1)'); gr.addColorStop(0.35, 'rgba(255,122,200,.6)'); gr.addColorStop(1, 'rgba(255,70,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.SRGBColorSpace; return TEX;
}

export function buildStaff() {
  const g = new THREE.Group(); g.name = 'gaynhuy'; const body = new THREE.Group(); body.name = 'than'; g.add(body);
  const red = new THREE.MeshStandardMaterial({ color: 0xb3202e, roughness: 0.32, metalness: 0.55, emissive: 0x8a1f5c, emissiveIntensity: 0.9 });   // Phiên 149: cán đỏ ánh hồng
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8c5a3c, roughness: 0.42, metalness: 0.7, emissive: 0x3a2006, emissiveIntensity: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0b73c, roughness: 0.28, metalness: 0.8, emissive: 0x7a5200, emissiveIntensity: 0.9 });
  const put = (geo, mat, y, flip) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; if (flip) m.rotation.x = Math.PI; body.add(m); return m; };
  put(new THREE.CylinderGeometry(0.03, 0.03, 0.98, 14), red, 0, false);
  for (const s of [-1, 1]) {
    const fl = s < 0;
    const r1 = put(new THREE.TorusGeometry(0.036, 0.012, 8, 18), gold, s * 0.495, false); r1.rotation.x = Math.PI / 2;
    put(new THREE.CylinderGeometry(0.058, 0.04, 0.07, 14), bronze, s * 0.54, fl);
    const r2 = put(new THREE.TorusGeometry(0.05, 0.01, 8, 18), gold, s * 0.585, false); r2.rotation.x = Math.PI / 2;
    put(new THREE.CylinderGeometry(0.04, 0.045, 0.16, 14), bronze, s * 0.67, fl);
    for (let i = 0; i < 18; i++) {
      const a = i * 0.95, y = 0.595 + (i / 17) * 0.15, b = put(new THREE.SphereGeometry(0.017, 8, 6), i % 3 === 0 ? gold : bronze, s * y, false);
      b.position.x = Math.cos(a) * 0.047; b.position.z = Math.sin(a) * 0.047;
    }
    const cap = put(new THREE.SphereGeometry(0.052, 14, 10), bronze, s * 0.77, false); cap.scale.set(1, 1.15, 1);
    const r3 = put(new THREE.TorusGeometry(0.046, 0.009, 8, 18), gold, s * 0.73, false); r3.rotation.x = Math.PI / 2;
  }
  const glows = [];   // [đầu -y, đầu +y, giữa, quầng hồng -y, quầng hồng +y] (Phiên 149: thêm 2 quầng hồng dọc thân → cả cây gậy tỏa ánh hồng)
  for (const y of [-0.77, 0.77, 0, -0.38, 0.38]) {
    const aura = Math.abs(y) === 0.38;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, opacity: aura ? 0.4 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.y = y; const sz = aura ? 0.62 : y === 0 ? 0.55 : 0.42; sp.scale.set(sz, sz, 1); g.add(sp); glows.push(sp);
  }
  g.userData.glows = glows; g.userData.body = body;
  return g;
}

/** Thay thân khối bằng mô hình GLB (nạp bất đồng bộ). Chuẩn hóa: trục dài nhất → y, dài STAFF_LEN, gốc ở giữa. */
export function loadStaffGlb(g) {
  if (!g || g.userData.glbTried) return; g.userData.glbTried = true;
  try {
    new GLTFLoader().load(GLB, (gltf) => {
      try {
        const holder = new THREE.Group(); holder.add(gltf.scene); gltf.scene.updateMatrixWorld(true);
        const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
        if (size.x >= size.y && size.x >= size.z) holder.rotation.z = Math.PI / 2; else if (size.z >= size.y && size.z >= size.x) holder.rotation.x = Math.PI / 2;
        gltf.scene.scale.setScalar(STAFF_LEN / Math.max(size.x, size.y, size.z, 1e-6));
        const root = new THREE.Group(); root.add(holder); root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3()); holder.position.set(-c.x, -c.y, -c.z);
        g.userData.body.visible = false; g.add(root); g.userData.glb = root;
      } catch (err) { console.warn('[Diệu Giang Tự] Không xử lý được gậy như ý 3D, giữ gậy khối:', err); }
    }, undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được assets/models/gay-nhu-y.glb, giữ gậy khối:', err && err.message ? err.message : err); });
  } catch (err) { console.warn('[Diệu Giang Tự] Không nạp được gậy như ý 3D:', err); }
}

/** Hai đầu chớp chớp lệch pha; giữa sáng đều. t = giây, hot = đang đánh / bay. */
export function pulseGlows(g, t, hot) {
  const gl = g && g.userData && g.userData.glows; if (!gl) return;
  const f = hot ? 14 : 6, a = 0.5 + 0.5 * Math.sin(t * f), b = 0.5 + 0.5 * Math.sin(t * f + Math.PI), big = hot ? 0.62 : 0.46;
  gl[0].material.opacity = 0.2 + 0.8 * a; gl[0].scale.set(big * (0.7 + 0.5 * a), big * (0.7 + 0.5 * a), 1);
  gl[1].material.opacity = 0.2 + 0.8 * b; gl[1].scale.set(big * (0.7 + 0.5 * b), big * (0.7 + 0.5 * b), 1);
  gl[2].material.opacity = hot ? 0.75 : 0.5;
  for (let i = 3; i < gl.length; i++) { const w = 0.5 + 0.5 * Math.sin(t * (hot ? 5 : 2.4) + i), s = 0.62 * (0.9 + 0.2 * w); gl[i].material.opacity = (hot ? 0.55 : 0.4) * (0.75 + 0.25 * w); gl[i].scale.set(s, s, 1); }   // Phiên 149: quầng hồng thở nhẹ
}
