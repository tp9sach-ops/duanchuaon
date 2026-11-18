// ĐÔI DÉP LÀO (Phiên 233, mục 2 đợt Chổi): khi người chơi dùng CHỔI (cầm hoặc cưỡi) thì chân mang đôi dép lào — đế xanh lá, quai chữ V + núm kẹp ngón màu trắng.
// Gắn vào xương bàn chân (footL / footR) của nhân vật chibi. Không cần đồng bộ riêng: người khác thấy được vì gói đồ đã có cờ chổi (js/ui/remoteGear.js).
// Hình khối đơn giản của three.js, hình + chất liệu DÙNG CHUNG cho mọi nhân vật (không hủy). Kích thước là số TẠM, CHƯA nhìn bằng mắt trên máy thật.
import * as THREE from 'three';
import { LIMB } from '../world/chibiRig.js';

export const SLIPPER = Object.freeze({ tam: true, len: 0.2, wide: 0.085, thick: 0.018, shift: 0.04, sole: 0x2fa84f, strap: 0xf4f1e6 });
let SH = null;
const shared = () => SH || (SH = {
  sole: new THREE.MeshStandardMaterial({ color: SLIPPER.sole, roughness: 0.85 }), strap: new THREE.MeshStandardMaterial({ color: SLIPPER.strap, roughness: 0.7 }),
  soleGeo: new THREE.BoxGeometry(SLIPPER.wide, SLIPPER.thick, SLIPPER.len), rod: new THREE.CylinderGeometry(0.0055, 0.0055, 1, 6), post: new THREE.SphereGeometry(0.011, 8, 6),
});

/** Một chiếc dép (đối xứng trái-phải nên dùng chung cho cả hai chân). Gốc ở cổ chân; đế nằm ở y = −ankleH, mũi hướng +z. */
export function buildSlipper() {
  const s = shared(), g = new THREE.Group(); g.name = 'dep-lao';
  const y0 = -LIMB.ankleH + SLIPPER.thick / 2 - 0.004;   // đế hơi lún vào đáy bàn chân để không hở
  const sole = new THREE.Mesh(s.soleGeo, s.sole); sole.position.set(0, y0, SLIPPER.shift); g.add(sole);
  const top = y0 + SLIPPER.thick / 2, toe = new THREE.Vector3(0, top + 0.012, SLIPPER.shift + 0.07);
  const post = new THREE.Mesh(s.post, s.strap); post.position.copy(toe); g.add(post);   // núm kẹp ngón
  for (const sx of [-1, 1]) {   // hai nhánh quai chữ V: từ núm kẹp ra hai mép đế phía mu bàn chân
    const to = new THREE.Vector3(sx * SLIPPER.wide * 0.46, top + 0.006, SLIPPER.shift - 0.015), d = to.clone().sub(toe), len = d.length();
    const rod = new THREE.Mesh(s.rod, s.strap); rod.scale.y = len; rod.position.copy(toe).addScaledVector(d, 0.5);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(rod);
  }
  return g;
}

/** Tìm xương bàn chân theo tên (xương do js/scene/chibiBody.js đặt tên 'footL' / 'footR'). Nhân vật không phải chibi → null. */
export function findFootBones(av) {
  if (!av || !av.group) return null;
  if (av.__feet) return av.__feet;
  let L = null, R = null; av.group.traverse((o) => { if (o.name === 'footL') L = o; else if (o.name === 'footR') R = o; });
  return L && R ? (av.__feet = { L, R }) : null;
}

/** Mang / tháo dép. st = chỗ nhớ riêng của người đó ({ L, R } hoặc rỗng); on = có đang dùng chổi. Gọi mỗi khung hình được (rẻ: chỉ làm khi đổi trạng thái). */
export function applySlippers(av, st, on) {
  if (!st) return; const has = !!st.L;
  if (on && !has) { const f = findFootBones(av); if (!f) return; st.L = buildSlipper(); st.R = buildSlipper(); f.L.add(st.L); f.R.add(st.R); }
  else if (!on && has) { const f = findFootBones(av); if (f) { f.L.remove(st.L); f.R.remove(st.R); } st.L = st.R = null; }
}
