// Thảm đỏ viền vàng + lưới bồ đoàn tròn trong chánh điện (vị trí lấy từ js/world/seats.js, một nguồn duy nhất). Tự dựng bằng khối hình học.
import * as THREE from 'three';
import { SEATS, RUG, SEAT_R } from '../world/seats.js';
import { HALL } from '../world/layout.js';
import { rugTexture } from './textures.js';

export function buildCushions() {
  const g = new THREE.Group(); g.name = 'boduon';
  const y = HALL.h;
  const w = RUG.x1 - RUG.x0, d = RUG.z1 - RUG.z0, b = RUG.border;
  const gold = new THREE.Mesh(new THREE.BoxGeometry(w + b * 2, 0.02, d + b * 2), new THREE.MeshStandardMaterial({ color: 0xd9b25f, roughness: 0.6, metalness: 0.25 }));
  gold.position.set((RUG.x0 + RUG.x1) / 2, y + 0.005, (RUG.z0 + RUG.z1) / 2);
  const rt = rugTexture(); rt.repeat.set(w / 2.4, d / 2.4);
  const red = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), new THREE.MeshStandardMaterial({ map: rt, color: 0xffffff, roughness: 0.95 }));
  red.position.set(gold.position.x, y + 0.012, gold.position.z);
  g.add(gold, red);

  // Bồ đoàn: khối cầu dẹt kiểu quả bí (nâu) + nút tròn trên đỉnh, dùng InstancedMesh cho nhẹ
  const n = SEATS.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const body = new THREE.InstancedMesh(new THREE.SphereGeometry(SEAT_R, 18, 10), new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.85 }), n);
  const top = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd9b25f, roughness: 0.5, metalness: 0.3 }), n);
  SEATS.forEach((st, i) => {
    body.setMatrixAt(i, m4.compose(p.set(st.x, y + 0.13, st.z), q, s.set(1, 0.42, 1)));
    top.setMatrixAt(i, m4.compose(p.set(st.x, y + 0.29, st.z), q, s.set(1, 0.7, 1)));
  });
  body.instanceMatrix.needsUpdate = top.instanceMatrix.needsUpdate = true;
  g.add(body, top);
  return g;
}
