// Nhà Tổ và Nhà Khách: nhà mái cong một tầng, mở mặt trước (+z), bệ đá, cột son, bảng hiệu, bàn thờ / bàn trà bên trong.
// Kích thước và vị trí lấy từ js/world/placements.js (BUILDINGS); mặt bằng chặn va chạm đúng bằng w × d.
import * as THREE from 'three';
import { M, roofWithRidge, box, pillar, makeLantern } from './temple.js';
import { signTexture } from './textures.js';
import { BUILDINGS } from '../world/placements.js';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });

function buildHouse(b) {
  const g = new THREE.Group(); g.position.set(b.cx, 0, b.cz);
  const W = b.w, D = b.d, H = 3.8, y0 = 0.5;
  box(W, y0, D, M.stone, 0, y0 / 2, 0, g);                                   // bệ đá
  box(W - 0.6, 0.1, D - 0.6, M.wood, 0, y0 + 0.05, 0, g);                    // sàn gỗ
  box(W - 0.6, H, 0.4, M.wall, 0, y0 + H / 2, -D / 2 + 0.5, g);              // tường hậu
  for (const s of [-1, 1]) box(0.4, H, D - 1.0, M.wall, s * (W / 2 - 0.5), y0 + H / 2, 0, g);   // hai vách
  const n = 4;
  for (let i = 0; i < n; i++) pillar(0.26, H, M.lacquer, -W / 2 + 1.4 + i * ((W - 2.8) / (n - 1)), y0, D / 2 - 0.6, g);   // hàng cột trước
  box(W + 0.2, 0.5, D - 0.4, M.lacquer, 0, y0 + H + 0.05, 0, g);             // xà
  const roof = roofWithRidge(W + 3, D + 2.5, 2.4, 1.3); roof.position.y = y0 + H + 0.3; g.add(roof);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(W - 3, H - 1.2), new THREE.MeshBasicMaterial({ color: 0xffa84a, transparent: true, opacity: 0.4 }));
  glow.position.set(0, y0 + H / 2, -D / 2 + 0.72); g.add(glow);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.0), new THREE.MeshBasicMaterial({ map: signTexture(b.ten, { font: '600 96px "Cormorant Garamond", "Noto Serif", Georgia, serif', h: 224 }) }));
  sign.position.set(0, y0 + H + 0.9, D / 2 - 0.1); g.add(sign);
  makeLantern(g, -W / 2 + 1.4, y0 + H - 0.7, D / 2 + 0.2, 0.55); makeLantern(g, W / 2 - 1.4, y0 + H - 0.7, D / 2 + 0.2, 0.55);
  if (b.id === 'nhato') {   // bàn thờ Tổ: bàn, bài vị, bát hương, hai nến
    box(5.2, 0.9, 1.4, M.lacquer, 0, y0 + 0.5, -D / 2 + 1.7, g);
    box(1.6, 1.9, 0.12, mat(0x6a1512, { emissive: 0x2a0806, emissiveIntensity: 0.5 }), 0, y0 + 1.85, -D / 2 + 1.1, g);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.3, 12), M.bronze); bowl.position.set(0, y0 + 1.1, -D / 2 + 1.7); g.add(bowl);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 8), mat(0xc8322b)); c.position.set(s * 1.5, y0 + 1.25, -D / 2 + 1.7); g.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffcc66 })); f.position.set(s * 1.5, y0 + 1.62, -D / 2 + 1.7); g.add(f); }
  } else {                  // Nhà Khách: bàn trà dài và hai ghế dài
    box(3.6, 0.1, 1.3, M.wood, 0, y0 + 0.75, -0.5, g);
    for (const s of [-1, 1]) { box(0.12, 0.7, 1.1, M.wood, s * 1.6, y0 + 0.4, -0.5, g); box(3.8, 0.1, 0.5, M.wood, 0, y0 + 0.5, -0.5 + s * 1.2, g); }
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0x8a5a36)); pot.position.set(0, y0 + 0.98, -0.5); g.add(pot);
  }
  return g;
}

export function buildHouses() { const g = new THREE.Group(); BUILDINGS.forEach((b) => g.add(buildHouse(b))); return g; }
