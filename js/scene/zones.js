// Dựng/dỡ cảnh 3D cho zone (Phiên 87). Zone chỉ giữ bộ nhớ khi đang ở/được tải trước; dispose giải phóng hình học + vật liệu. CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI).
import * as THREE from 'three';

function dispose(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); }
/** Cổng: hai cột + xà ngang + vòng sáng dưới đất. */
function gateMesh(x, z, r, color) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 }), glow = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.2, 10), m); p.position.set(s * (r - 0.6), 2.1, 0); g.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2 * r, 0.4, 0.5), m); beam.position.y = 4.3; g.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.8, r, 40), glow); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  g.position.set(x, 0, z); return g;
}
/** Cổng ở hub dẫn sang Vườn thử — dựng một lần, luôn có mặt. Trả hàm gỡ. */
export function buildHubGate(scene, gate) { const g = gateMesh(gate.x, gate.z, gate.r, 0xf1db9f); scene.add(g); return () => dispose(g); }
/** Hook load/dispose của Vườn thử: nền cỏ + cổng về. Trả { load, dispose }. */
export function thuHooks(scene, def) {
  let grp = null;
  return {
    load() {
      if (grp) return; grp = new THREE.Group();
      const b = def.bounds, w = b.x1 - b.x0, d = b.z1 - b.z0;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0x5f8f4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); grp.add(ground);
      for (const gt of def.gates) grp.add(gateMesh(gt.x, gt.z, gt.r, 0x8fd6bf));
      scene.add(grp);
    },
    dispose() { if (grp) { dispose(grp); grp = null; } },
  };
}
