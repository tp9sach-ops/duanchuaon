// Chim HẠC trắng (đầu đỏ, cổ dài, cánh chót đen) để nhân vật cưỡi bay trong cảnh mở đầu (Phiên 91). Chỉ VẼ; đường bay ở js/world/intro.js. Mũi/đầu quay về +z.
import * as THREE from 'three';

const mats = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, flatShading: true, ...o }); mats.set(k, m); } return m; };
const WHITE = 0xf7f5ee, BLACK = 0x222226, RED = 0xd8352a, LEG = 0x6a5646;

/** Trả { group, seat (Object3D: chỗ người ngồi), update(t, flap, bank) }. Kích thước gốc: sải cánh ~ 7 m, thân dài ~ 3,2 m. */
export function buildCrane() {
  const group = new THREE.Group(); group.name = 'hac-cuoi'; group.rotation.order = 'YXZ';
  const body = new THREE.Group(); group.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 9), mat(WHITE)); torso.scale.set(0.85, 0.72, 1.95); body.add(torso);
  const tailG = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.5, 5), mat(WHITE)); tailG.rotation.x = -Math.PI / 2; tailG.position.set(0, 0.0, -1.55); tailG.scale.set(1.1, 1, 0.45); body.add(tailG);
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 5), mat(BLACK)); tailTip.rotation.x = -Math.PI / 2; tailTip.position.set(0, 0.02, -2.2); tailTip.scale.set(1.1, 1, 0.4); body.add(tailTip);
  // cổ dài cong: 4 đoạn
  const neck = new THREE.Group(); neck.position.set(0, 0.12, 0.95); body.add(neck);
  const seg = [[0, 0.28, 0.5, 0.5], [0, 0.62, 0.78, 0.35], [0, 0.97, 0.98, 0.1], [0, 1.28, 1.02, -0.15]]; let prev = [0, 0, 0];
  seg.forEach((s, i) => { const dx = s[0] - prev[0], dy = s[1] - prev[1], dz = s[2] - prev[2], len = Math.hypot(dx, dy, dz); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1 - i * 0.012, 0.13 - i * 0.012, len + 0.06, 6), mat(WHITE)); m.position.set((s[0] + prev[0]) / 2, (s[1] + prev[1]) / 2, (s[2] + prev[2]) / 2); m.lookAt(new THREE.Vector3(m.position.x + dx, m.position.y + dy, m.position.z + dz)); m.rotateX(Math.PI / 2); neck.add(m); prev = s; });
  const head = new THREE.Group(); head.position.set(0, 1.34, 1.1); neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 7), mat(WHITE)); skull.scale.set(0.9, 0.9, 1.25); head.add(skull);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(RED, { emissive: RED, emissiveIntensity: 0.25 })); crown.scale.set(1, 0.55, 1.1); crown.position.set(0, 0.11, 0.0); head.add(crown);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.7, 5), mat(0x3a3a34)); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.02, 0.5); head.add(beak);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat(0x101010)); e.position.set(sx * 0.1, 0.03, 0.12); head.add(e); }
  // chân duỗi ra sau
  const legs = []; for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.9, 5), mat(LEG)); l.rotation.x = Math.PI / 2 + 0.08; l.position.set(sx * 0.2, -0.18, -2.0); body.add(l); legs.push(l); }
  // cánh: mỗi cánh = trục vai → cánh trong (trắng) → cánh ngoài (chót đen), vỗ lệch pha
  const wings = [];
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(sx * 0.35, 0.22, 0.15); body.add(shoulder);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.25), mat(WHITE)); inner.position.set(sx * 0.85, 0, -0.1); shoulder.add(inner);
    const elbow = new THREE.Group(); elbow.position.set(sx * 1.7, 0, 0); shoulder.add(elbow);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 1.05), mat(WHITE)); outer.position.set(sx * 0.95, 0, -0.15); elbow.add(outer);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.055, 0.95), mat(BLACK)); tip.position.set(sx * 2.15, 0, -0.18); elbow.add(tip);
    wings.push({ shoulder, elbow, sx });
  }
  const seat = new THREE.Object3D(); seat.position.set(0, 0.5, -0.15); body.add(seat);   // ngay trên lưng
  group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });

  /** t: giây; flap 0..1: biên độ vỗ cánh (1 = mạnh); bank: nghiêng thân (rad). */
  function update(t, flap = 0.6, bank = 0) {
    const f = Math.sin(t * 5.2), a = 0.15 + 0.55 * flap;
    for (const w of wings) { w.shoulder.rotation.z = w.sx * (f * a); w.elbow.rotation.z = w.sx * (Math.sin(t * 5.2 - 0.9) * a * 0.9); }
    body.position.y = Math.sin(t * 5.2 + 0.4) * 0.07 * flap; body.rotation.z = bank * 0.0;
    neck.rotation.x = -0.12 + Math.sin(t * 2.1) * 0.03; legs.forEach((l, i) => { l.rotation.x = Math.PI / 2 + 0.08 + Math.sin(t * 2 + i) * 0.02; });
  }
  return { group, seat, update };
}
