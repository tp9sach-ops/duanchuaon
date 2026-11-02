// Hoa viên: luống hoa có viền đá, bồn hoa tròn, đèn đá, ghế đá. Dựng từ js/world/placements.js (cùng dữ liệu với va chạm).
import * as THREE from 'three';
import { M, box } from './temple.js';
import { BEDS, ROUND_BEDS, STONE_LANTERNS, BENCHES } from '../world/placements.js';
import { mulberry32 } from '../util.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...o });

// Một mặt phẳng đất + rất nhiều bông hoa (InstancedMesh: một lệnh vẽ cho cả luống)
function flowers(g, pts, color, seed) {
  const rnd = mulberry32(seed), n = pts.length;
  const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 4), mat(0x3f7a3a), n);
  const bloom = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), mat(color, { roughness: 0.6, emissive: color, emissiveIntensity: 0.18 }), n);
  const m = new THREE.Matrix4();
  pts.forEach((p, i) => {
    const h = 0.45 + rnd() * 0.3;
    m.compose(new THREE.Vector3(p[0], h / 2 + 0.1, p[1]), new THREE.Quaternion(), new THREE.Vector3(1, h / 0.5, 1)); stem.setMatrixAt(i, m);
    m.compose(new THREE.Vector3(p[0], h + 0.12, p[1]), new THREE.Quaternion(), new THREE.Vector3(1, 0.8, 1)); bloom.setMatrixAt(i, m);
  });
  g.add(stem, bloom);
}

function stoneLantern(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const st = M.stone;
  box(0.9, 0.25, 0.9, st, 0, 0.125, 0, g);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 8), st); col.position.y = 0.7; g.add(col);
  box(0.62, 0.12, 0.62, st, 0, 1.2, 0, g);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), new THREE.MeshBasicMaterial({ color: 0xffc977 })); lamp.position.y = 1.5; g.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 4), st); roof.rotation.y = Math.PI / 4; roof.position.y = 1.9; g.add(roof);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), st); top.position.y = 2.15; g.add(top);
  return g;
}

export function buildGarden() {
  const g = new THREE.Group(), rim = mat(0x8a929a), soil = mat(0x3a2a1e, { roughness: 1 });
  let seed = 7;
  BEDS.forEach((b) => {
    const w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    box(w + 0.6, 0.22, d + 0.6, rim, cx, 0.11, cz, g); box(w, 0.26, d, soil, cx, 0.13, cz, g);
    const pts = []; for (let x = b.x0 + 0.4; x < b.x1; x += 0.55) for (let z = b.z0 + 0.4; z < b.z1; z += 0.55) pts.push([x + Math.sin(x * 7 + z) * 0.12, z + Math.cos(z * 5 + x) * 0.12]);
    flowers(g, pts, b.hoa, seed++);
  });
  ROUND_BEDS.forEach((b) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(b.r + 0.3, b.r + 0.3, 0.22, 24), rim); ring.position.set(b.x, 0.11, b.z); g.add(ring);
    const dirt = new THREE.Mesh(new THREE.CylinderGeometry(b.r, b.r, 0.26, 24), soil); dirt.position.set(b.x, 0.13, b.z); g.add(dirt);
    const pts = []; for (let r = 0.4; r < b.r; r += 0.55) for (let a = 0; a < Math.PI * 2; a += 0.55 / r) pts.push([b.x + Math.cos(a) * r, b.z + Math.sin(a) * r]);
    flowers(g, pts, b.hoa, seed++);
  });
  STONE_LANTERNS.forEach((l) => g.add(stoneLantern(l.x, l.z)));
  BENCHES.forEach((b) => {
    box(b.w, 0.12, b.d, M.stone, b.x, 0.5, b.z, g);
    box(0.25, 0.45, b.d - 0.1, M.stone, b.x - b.w / 2 + 0.3, 0.22, b.z, g); box(0.25, 0.45, b.d - 0.1, M.stone, b.x + b.w / 2 - 0.3, 0.22, b.z, g);
  });
  return g;
}
