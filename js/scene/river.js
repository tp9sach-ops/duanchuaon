// Sông Thác + cầu đá + Hồ Rừng (Phiên 74). Dựng từ js/world/river.js (cùng nguồn với va chạm). Trả THREE.Group; không cần cập nhật theo khung hình.
import * as THREE from 'three';
import { mulberry32 } from '../util.js';
import { RIVER, LAKE, THUY_TA, smooth, ribbonStrip } from '../world/river.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, ...o });

/** Dải phẳng (hình học three) từ ribbonStrip thuần ở js/world/river.js. */
function ribbon(pts, hw, y) {
  const { verts, idx } = ribbonStrip(pts, hw), pos = []; for (const [x, z] of verts) pos.push(x, y, z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

export function buildRiver() {
  const g = new THREE.Group(), rnd = mulberry32(74), pts = smooth(RIVER.pts);
  // bờ đá/đất sẫm rộng hơn dòng nước, rồi mặt nước xanh trong, rồi vệt sáng giữa dòng
  const bank = new THREE.Mesh(ribbon(pts, RIVER.hw + 0.8, 0.1), std(0x7d7a6b)); g.add(bank);
  const water = new THREE.Mesh(ribbon(pts, RIVER.hw + 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0x3fa9b8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 })); g.add(water);
  const glint = new THREE.Mesh(ribbon(pts, 0.35, 0.17), new THREE.MeshBasicMaterial({ color: 0xd8f4f8, transparent: true, opacity: 0.35, depthWrite: false })); g.add(glint);
  // đá bờ rải hai bên (bỏ quanh cầu để khỏi vướng)
  const b = RIVER.bridge, rockGeo = new THREE.DodecahedronGeometry(1, 0), rockMat = std(0x8a8f96);
  for (let i = 1; i < pts.length - 1; i += 2) {
    const [x, z] = pts[i], a = pts[i - 1], c = pts[i + 1]; let dx = c[0] - a[0], dz = c[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    for (const s of [-1, 1]) {
      const px = x - dz * s * (RIVER.hw + 1.1 + rnd() * 0.6), pz = z + dx * s * (RIVER.hw + 1.1 + rnd() * 0.6);
      if (px > b.x0 - 1.5 && px < b.x1 + 1.5 && pz > b.z0 - 1.5 && pz < b.z1 + 1.5) continue;
      const m = new THREE.Mesh(rockGeo, rockMat), sc = 0.35 + rnd() * 0.45; m.scale.set(sc * 1.3, sc * 0.7, sc); m.position.set(px, 0.15, pz); m.rotation.y = rnd() * 6.28; g.add(m);
    }
  }
  // cầu đá: mặt cầu + hai lan can + hai trụ đầu cầu
  const bw = b.x1 - b.x0, bd = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, stone = std(0x9a9a92), dark = std(0x7f7f78);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.3, bd), stone); deck.position.set(cx, b.y - 0.15, cz); g.add(deck);
  const under = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.6, 0.5, bd - 0.3), dark); under.position.set(cx, b.y - 0.5, cz); g.add(under);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.18, 0.16), dark); rail.position.set(cx, b.y + 0.42, cz + s * (bd / 2 - 0.08)); g.add(rail);
    const base = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.34, 0.2), stone); base.position.set(cx, b.y + 0.17, cz + s * (bd / 2 - 0.1)); g.add(base);
    for (const t of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.28), stone); post.position.set(cx + t * (bw / 2 - 0.14), b.y + 0.37, cz + s * (bd / 2 - 0.14)); g.add(post); }
  }
  // Hồ Rừng: nước + viền đá + vài lá sen
  const lake = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r, 40), new THREE.MeshStandardMaterial({ color: 0x3f9fa8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 })); lake.rotation.x = -Math.PI / 2; lake.position.set(LAKE.x, 0.14, LAKE.z); g.add(lake);
  const rim = new THREE.Mesh(new THREE.RingGeometry(LAKE.r, LAKE.r + 1.1, 40), std(0x78806f)); rim.rotation.x = -Math.PI / 2; rim.position.set(LAKE.x, 0.12, LAKE.z); g.add(rim);
  const padGeo = new THREE.CircleGeometry(0.55, 10), padMat = new THREE.MeshStandardMaterial({ color: 0x4f9a4a, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = rnd() * (LAKE.r - 1.2), p = new THREE.Mesh(padGeo, padMat); p.rotation.x = -Math.PI / 2; p.position.set(LAKE.x + Math.cos(a) * d, 0.17, LAKE.z + Math.sin(a) * d); g.add(p); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28 + rnd() * 0.3, m = new THREE.Mesh(rockGeo, rockMat), sc = 0.4 + rnd() * 0.5; m.scale.set(sc * 1.3, sc * 0.7, sc); m.position.set(LAKE.x + Math.cos(a) * (LAKE.r + 1.3), 0.15, LAKE.z + Math.sin(a) * (LAKE.r + 1.3)); g.add(m); }
  buildThuyTa(g);
  return g;
}

/** Nhà thủy tạ: sàn + lối gỗ nhô ra hồ, 4 trụ sơn đỏ, mái ngói bốn góc, đèn lồng, ghế dài. Kích thước lấy từ THUY_TA (cùng nguồn va chạm). */
function buildThuyTa(g) {
  const wood = std(0x8a5a36), red = std(0x8e2f26), tile = std(0x5b4038), d = THUY_TA.deck, p = THUY_TA.pier;
  const box = (x0, x1, z0, z1, y, h, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.add(m); return m; };
  box(d.x0, d.x1, d.z0, d.z1, d.y - 0.12, 0.24, wood); box(p.x0, p.x1, p.z0, p.z1, p.y - 0.12, 0.24, wood);
  const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
  for (const [x, z] of THUY_TA.posts) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 3.1, 10), red); c.position.set(x, d.y + 1.55, z); g.add(c); }
  // thành thấp ba phía (chừa phía Đông cho lối vào)
  box(d.x0 + 0.1, d.x0 + 0.25, d.z0 + 0.3, d.z1 - 0.3, d.y + 0.55, 0.12, red); box(d.x0 + 0.3, d.x1 - 0.3, d.z0 + 0.1, d.z0 + 0.25, d.y + 0.55, 0.12, red); box(d.x0 + 0.3, d.x1 - 0.3, d.z1 - 0.25, d.z1 - 0.1, d.y + 0.55, 0.12, red);
  box(d.x0 + 0.1, d.x1 - 0.1, d.z0 - 0.1, d.z1 + 0.1, d.y + 3.2, 0.18, red);   // xà ngang trên các trụ
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.7, 4), tile); roof.rotation.y = Math.PI / 4; roof.position.set(cx, d.y + 4.15, cz); g.add(roof);
  const ridge = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), red); ridge.position.set(cx, d.y + 5.1, cz); g.add(ridge);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb347 })); lamp.position.set(cx, d.y + 2.7, cz); g.add(lamp);
  box(d.x0 + 0.5, d.x0 + 1.0, cz - 1.0, cz + 1.0, d.y + 0.35, 0.1, wood);   // ghế dài sát thành Tây
}
