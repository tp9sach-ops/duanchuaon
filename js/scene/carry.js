// Cảnh 3D các vật khiêng được (Phiên 63): thùng, bao gạo, đá, khúc gỗ… Chỉ VẼ; trạng thái ở js/world/strength.js (LGT.carryWorld).
// Vật đang khiêng nằm trên đầu nhân vật; vật bay theo vòng cung; vật nằm yên ở gần nhất (còn khiêng được) có vòng sáng nhỏ dưới chân.
import * as THREE from 'three';

function meshFor(def) {
  const [a, b, c] = def.size;
  const geo = def.shape === 'cyl' ? new THREE.CylinderGeometry(a, a * 1.05, b, 14) : def.shape === 'rock' ? new THREE.DodecahedronGeometry(Math.max(a, c), 0) : new THREE.BoxGeometry(a, b, c);
  if (def.shape === 'rock') geo.scale(1, b / Math.max(a, c), c / Math.max(a, c));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.85, metalness: 0.02 }));
  m.castShadow = true; m.receiveShadow = true; m.userData.h = def.shape === 'rock' ? b * 0.5 : b * 0.5; return m;
}

/** Trả { group, update(world, mine) }. world = js/world/strength.js createCarry(); mine = { x, z, y } vị trí người chơi (hoặc null). */
export function buildCarry(world) {
  const group = new THREE.Group(); group.name = 'vat-khieng';
  const nodes = world.items.map((it) => { const m = meshFor(it.def); m.position.set(it.x, m.userData.h, it.z); group.add(m); return m; });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 28), new THREE.MeshBasicMaterial({ color: 0xf1dba0, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; group.add(ring);
  return {
    group,
    update(t, mine, near) {
      world.items.forEach((it, i) => {
        const m = nodes[i];
        if (it.state === 'held' && mine) m.position.set(mine.x, (mine.y || 0) + 2.05 + m.userData.h * 0.6, mine.z);
        else m.position.set(it.x, (it.state === 'fly' ? it.y : 0) + m.userData.h, it.z);
        if (it.state === 'fly') m.rotation.y += 0.25;
      });
      if (near && near.state === 'rest') { ring.visible = true; ring.position.set(near.x, 0.05, near.z); const k = 1 + Math.sin(t * 5) * 0.08; ring.scale.set(k, k, k); } else ring.visible = false;
    },
  };
}
