// Bảo tháp 7 tầng trên đồi (Phiên 82). Dựng bằng hình khối đơn giản (không GLB, không ảnh bản quyền): sân lát đá, hai bậc đế bát giác, 7 tầng thân bát giác
// thu nhỏ dần, mỗi tầng một mái ngói loe bốn góc, cửa sổ vàng (sáng hơn về đêm), cột sét + chuỗi tướng luân + ngọc đỉnh, bốn đèn đá phía trước.
// Kích thước lấy từ BAO_THAP (js/world/outside.js: cùng nguồn va chạm). Trả THREE.Group. Số mesh ~70, không tạo texture.
import * as THREE from 'three';
import { BAO_THAP, OUT_WALKS } from '../world/outside.js';

const flat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, flatShading: true, ...o });
const glow = (c, k, night) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.55 }); m.userData.nightGlow = { day: k, night: night }; return m; };
function add(parent, geo, mat, x, y, z, ry = 0) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }

/** Bán kính thân từng tầng (tầng 0 ở dưới cùng), thu nhỏ đều lên đỉnh. Xuất để test kiểm tỉ lệ. */
export const towerRadii = (n = BAO_THAP.tang, r0 = 2.7, step = 0.28) => Array.from({ length: n }, (_, i) => r0 - i * step);

export function buildBaoThap() {
  const g = new THREE.Group(), T = BAO_THAP;
  const stone = flat(0xcbbd9c), stone2 = flat(0xaa9f86), paving = flat(0xb8ae98), red = flat(0xa24a33), wood = flat(0x7a4a2e), tile = flat(0x4a3b36), tile2 = flat(0x5c4a42);
  const gold = glow(0xd9b25f, 0.35, 1.8), win = glow(0xffd48a, 0.25, 2.6);
  g.position.set(T.cx, 0, T.cz);

  // sân lát đá: phủ đúng vùng đi bộ 'san-thap' (toạ độ thế giới → quy về gốc tháp)
  const sp = OUT_WALKS.find((w) => w.id === 'san-thap');
  if (sp) add(g, new THREE.BoxGeometry(sp.x1 - sp.x0, 0.05, sp.z1 - sp.z0), paving, (sp.x0 + sp.x1) / 2 - T.cx, 0.03, (sp.z0 + sp.z1) / 2 - T.cz).castShadow = false;
  // lối đá từ đường mòn lên sân
  const lp = OUT_WALKS.find((w) => w.id === 'duong-thap');
  if (lp) add(g, new THREE.BoxGeometry(lp.x1 - lp.x0, 0.05, lp.z1 - lp.z0), stone2, (lp.x0 + lp.x1) / 2 - T.cx, 0.035, (lp.z0 + lp.z1) / 2 - T.cz).castShadow = false;

  // đế: hai bậc bát giác (bậc thấp ngoài cùng đi lên được vì chỉ cao 0,18 m; bậc trong nằm trong vòng chặn r = T.r)
  const oct = (r, h) => new THREE.CylinderGeometry(r, r, h, 8, 1);
  add(g, oct(4.3, 0.18), stone2, 0, 0.09, 0, Math.PI / 8);
  add(g, oct(T.r, 0.5), stone, 0, 0.43, 0, Math.PI / 8);

  // 7 tầng thân + mái
  const radii = towerRadii(T.tang), floorH = 1.75, eaveH = 0.62;
  let y = 0.68;
  radii.forEach((r, i) => {
    add(g, oct(r, floorH), i % 2 ? wood : red, 0, y + floorH / 2, 0, Math.PI / 8);
    // bốn cửa sổ vàng ở bốn mặt chính (đặt sát mặt bát giác: bán kính mặt = r·cos(22,5°))
    const face = r * Math.cos(Math.PI / 8) + 0.02, wg = new THREE.BoxGeometry(0.42, 0.7, 0.08);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const w = add(g, wg, win, Math.sin(a) * face, y + floorH * 0.55, Math.cos(a) * face, a); w.castShadow = false; }
    // gờ cột góc: vòng mảnh trên đầu thân
    add(g, oct(r + 0.12, 0.12), wood, 0, y + floorH + 0.06, 0, Math.PI / 8);
    // mái loe: đĩa dưới + nón thấp (8 cạnh), góc mái hơi vểnh nhờ nón rộng hơn đĩa
    const er = r + 1.0 - i * 0.04;
    add(g, new THREE.CylinderGeometry(er, er * 0.92, 0.1, 8), tile2, 0, y + floorH + 0.17, 0, Math.PI / 8);
    add(g, new THREE.ConeGeometry(er * 0.98, eaveH, 8), tile, 0, y + floorH + 0.17 + eaveH / 2 + 0.05, 0, Math.PI / 8);
    y += floorH + 0.17 + eaveH + 0.05;
  });

  // đỉnh: cột sét, chín vòng tướng luân thu nhỏ dần, ngọc vàng
  add(g, new THREE.CylinderGeometry(0.1, 0.14, 2.6, 8), gold, 0, y + 1.3, 0);
  for (let k = 0; k < 7; k++) add(g, new THREE.TorusGeometry(0.62 - k * 0.07, 0.06, 6, 14), gold, 0, y + 0.45 + k * 0.3, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.SphereGeometry(0.3, 12, 10), gold, 0, y + 2.75, 0);

  // bốn đèn đá phía trước (toạ độ thế giới → gốc tháp)
  for (const d of T.den) {
    const lx = d.x - T.cx, lz = d.z - T.cz;
    add(g, new THREE.BoxGeometry(0.7, 0.25, 0.7), stone2, lx, 0.125, lz);
    add(g, new THREE.CylinderGeometry(0.16, 0.2, 1.1, 8), stone, lx, 0.8, lz);
    add(g, new THREE.BoxGeometry(0.46, 0.4, 0.46), glow(0xffd08a, 0.4, 2.4), lx, 1.55, lz).castShadow = false;
    add(g, new THREE.ConeGeometry(0.46, 0.34, 4), tile, lx, 1.92, lz, Math.PI / 4);
  }
  return g;
}
