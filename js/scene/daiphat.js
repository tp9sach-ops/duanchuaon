// Đại Phật khắc trên vách đá cạnh thác (Phiên 58). Dựng bằng hình khối đơn giản (không GLB, không ảnh bản quyền): ngách vòm đá sẫm, tượng Phật ngồi thiền
// trên đài sen, hào quang vàng (sáng hơn về đêm), bậc đá + hai đèn đá phía trước. Dữ liệu vị trí ở js/world/outside.js (DAI_PHAT). Trả THREE.Group.
import * as THREE from 'three';
import { DAI_PHAT } from '../world/outside.js';

const flat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true, ...o });
const glow = (c, k) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, roughness: 0.6 }); m.userData.nightGlow = { day: k, night: k * 4 + 0.5 }; return m; };
function add(parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, 0, rz); o.castShadow = true; parent.add(o); return o; }

export function buildDaiPhat() {
  const root = new THREE.Group(), g = new THREE.Group();
  // gốc nhóm: mặt ngách (x = face), tâm z; local +z = hướng nhìn ra (thế giới -x), local +x = thế giới +z
  g.position.set(DAI_PHAT.face, 0, DAI_PHAT.z); g.rotation.y = -Math.PI / 2; root.add(g);
  const dark = flat(0x5d564d), stone = flat(0xcbbd9c), stone2 = flat(0xb7a883), robe = flat(0xd6c79f), lotus = flat(0xe9d3d8), step = flat(0x8a8176);
  const w = DAI_PHAT.w, hBox = DAI_PHAT.h - w / 2;
  // ngách vòm: thân chữ nhật + nửa vòm tròn, cắm sâu vào vách (3,4 m) để che mọi chỗ lồi lõm của mặt đá
  add(g, new THREE.BoxGeometry(w, hBox, 3.4), dark, 0, hBox / 2, -1.7);
  const arch = new THREE.CylinderGeometry(w / 2, w / 2, 3.4, 20, 1, false, 0, Math.PI); arch.rotateX(Math.PI / 2); arch.rotateZ(Math.PI / 2);
  add(g, arch, dark, 0, hBox, -1.7);
  // viền ngách (khung đá nhạt hơn, nhô nhẹ)
  add(g, new THREE.BoxGeometry(0.7, hBox, 0.5), stone2, -w / 2 - 0.2, hBox / 2, 0.1); add(g, new THREE.BoxGeometry(0.7, hBox, 0.5), stone2, w / 2 + 0.2, hBox / 2, 0.1);
  // đài sen: bệ vuông + hai tầng tròn + cánh sen xung quanh
  add(g, new THREE.BoxGeometry(8, 1.2, 3.6), stone2, 0, 0.6, 1.2);
  add(g, new THREE.CylinderGeometry(3.7, 4.0, 0.6, 20), stone, 0, 1.5, 1.4, 1, 1, 0.55);
  const pet = new THREE.ConeGeometry(0.55, 1.5, 6);
  for (let i = 0; i < 13; i++) { const a = -Math.PI * 0.55 + (i / 12) * Math.PI * 1.1; add(g, pet, lotus, Math.sin(a) * 3.9, 1.95, 1.4 + Math.cos(a) * 1.9 * 0.9, 1, 0.8, 1, 0.5 * Math.cos(a), -0.5 * Math.sin(a)); }
  // thân tượng: chân kiết già, thân, vai, hai tay đặt gối, tay thiền định trước bụng
  add(g, new THREE.SphereGeometry(1, 14, 10), robe, 0, 2.7, 1.3, 3.6, 0.95, 1.7);
  add(g, new THREE.CylinderGeometry(1.45, 2.25, 4.3, 12), robe, 0, 5.0, 1.0, 1, 1, 0.78);
  add(g, new THREE.SphereGeometry(1, 12, 8), robe, 0, 7.05, 1.0, 2.05, 0.8, 0.8);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.42, 0.55, 3.6, 8), robe, s * 2.35, 5.1, 1.2, 1, 1, 0.9, 0, s * 0.28);
    add(g, new THREE.SphereGeometry(0.5, 8, 6), stone, s * 2.9, 3.35, 1.75);
  }
  add(g, new THREE.SphereGeometry(0.62, 8, 6), stone, 0, 3.45, 2.05, 1.6, 0.7, 0.9);   // hai bàn tay chồng lên nhau trong lòng
  // đầu: mặt tròn, bướu đỉnh đầu, hai tai dài, cổ
  add(g, new THREE.CylinderGeometry(0.55, 0.7, 0.7, 8), robe, 0, 8.0, 1.0);
  add(g, new THREE.SphereGeometry(1.2, 14, 10), stone, 0, 9.0, 1.05);
  add(g, new THREE.SphereGeometry(0.55, 10, 8), stone, 0, 10.15, 1.0, 1, 0.9, 1);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.22, 1.1, 0.3), stone, s * 1.28, 8.7, 1.0);
  add(g, new THREE.BoxGeometry(0.5, 0.07, 0.1), dark, 0, 8.85, 2.2);                    // vầng miệng khép hờ
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.3, 0.06, 0.1), dark, s * 0.45, 9.25, 2.2);   // hai mắt nhắm
  // hào quang vàng sau đầu (sáng hơn về đêm)
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.16, 8, 40), glow(0xe8c25a, 0.35)); halo.position.set(0, 9.1, 0.05); g.add(halo);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.55, 36), glow(0xf3dc8a, 0.12)); disc.material.transparent = true; disc.material.opacity = 0.5; disc.position.set(0, 9.1, 0.03); g.add(disc);
  // bậc đá phía trước (khớp vật cản DAI_PHAT.bac) + hai đèn đá
  const b = DAI_PHAT.bac, nSteps = 3, depth = (b.x1 - b.x0), wz = b.z1 - b.z0;
  for (let i = 0; i < nSteps; i++) { const d = depth * (1 - i / nSteps); const bx = new THREE.Mesh(new THREE.BoxGeometry(d, 0.22 * (i + 1), wz), step); bx.position.set(b.x1 - d / 2 - (i === 0 ? 0 : 0), 0.11 * (i + 1), (b.z0 + b.z1) / 2); bx.castShadow = bx.receiveShadow = true; root.add(bx); }
  const lampMat = glow(0xffd08a, 0.5);
  for (const l of DAI_PHAT.den) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.1, 6), stone2); base.position.set(l.x, 0.55, l.z); root.add(base);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), lampMat); box.position.set(l.x, 1.35, l.z); root.add(box);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), stone2); cap.rotation.y = Math.PI / 4; cap.position.set(l.x, 1.78, l.z); root.add(cap);
  }
  return root;
}
