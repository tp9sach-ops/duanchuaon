// HÌNH CƠN GIÓ LỐC CỦA CHỔI (Phiên 234): phễu xoáy gồm nhiều vòng trụ mờ xếp chồng (rộng dần lên trên) quay nhanh + lá / rơm bay xoáy quanh + bụi ở chân. Khối đơn giản của three.js.
// Chuyển động + chạm quái: js/world/tornadoMath.js (có test). CHƯA nhìn bằng mắt trên máy thật — kích thước / màu là số TẠM.
import * as THREE from 'three';
import { dustTexture } from './broomMesh.js';

const LEAF = [0x8fbf4a, 0xb7d36a, 0xc9a227, 0xd9c28a];
let G = null, STRIPE = null;
const geos = () => G || (G = { ring: new THREE.CylinderGeometry(1, 0.78, 1, 18, 1, true), leaf: new THREE.PlaneGeometry(1, 0.6) });
function stripeTexture() {   // sọc dọc mờ để nhìn thấy phễu QUAY
  if (STRIPE) return STRIPE;
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); g.clearRect(0, 0, 128, 32);
  for (let i = 0; i < 26; i++) { const x = (i * 128) / 26 + ((i * 37) % 5), w = 2 + ((i * 11) % 4); g.fillStyle = `rgba(235,245,215,${0.25 + ((i * 17) % 10) / 22})`; g.fillRect(x, 0, w, 32); }
  STRIPE = new THREE.CanvasTexture(c); STRIPE.wrapS = THREE.RepeatWrapping; STRIPE.colorSpace = THREE.SRGBColorSpace; return STRIPE;
}
const RINGS = 7;

/** Dựng một cơn lốc (chưa đặt chỗ, ẩn). Trả { group, rings, leaves, dust, mats }. */
export function makeTornadoMesh(scene, big) {
  const g = geos(), group = new THREE.Group(); group.visible = false;
  const fm = new THREE.MeshBasicMaterial({ map: stripeTexture(), color: 0xe9f3d4, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const rings = []; for (let i = 0; i < RINGS; i++) { const m = new THREE.Mesh(g.ring, fm); group.add(m); rings.push(m); }
  const leafMats = LEAF.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  const n = big ? 26 : 12, leaves = []; for (let k = 0; k < n; k++) { const m = new THREE.Mesh(g.leaf, leafMats[k % leafMats.length]); m.scale.setScalar(big ? 0.34 : 0.2); group.add(m); leaves.push({ m, k, ph: (k * 0.6180339) % 1 }); }
  const dust = new THREE.Sprite(new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false })); group.add(dust);
  scene.add(group);
  return { group, rings, leaves, dust, fm, leafMats, big };
}

/** Đặt dáng + vị trí. pose = tornadoAt(...); at {x,y,z} chân lốc; t = giây tuổi (cho xoay). */
export function poseTornado(m, pose, at, t) {
  m.group.visible = pose.a > 0.01; if (!m.group.visible) return;
  m.group.position.set(at.x, at.y, at.z);
  const step = pose.h / RINGS;
  m.fm.opacity = pose.a * 0.5; m.dust.material.opacity = pose.a * 0.7;
  m.rings.forEach((ring, i) => {
    const f = (i + 1) / RINGS, rad = Math.max(0.15, pose.r * (0.35 + 0.65 * f));
    ring.scale.set(rad, step * 1.15, rad); ring.position.set(Math.sin(t * 3 + i) * 0.12 * pose.r, step * (i + 0.5), Math.cos(t * 2.4 + i * 1.3) * 0.12 * pose.r);
    ring.rotation.y = t * (6 + i * 1.4);
  });
  for (const lf of m.leaves) {
    const k = (lf.ph + t * 0.7) % 1, rad = pose.r * (0.45 + 0.75 * k) * 1.1, a = lf.k * 2.399 + t * (5 + 3 * (1 - k));
    lf.m.position.set(Math.cos(a) * rad, pose.h * k, Math.sin(a) * rad); lf.m.rotation.set(t * 4 + lf.k, a, t * 3);
  }
  for (const mat of m.leafMats) mat.opacity = Math.min(1, pose.a * 1.4);
  m.dust.scale.set(pose.r * 3.2, pose.r * 1.6, 1); m.dust.position.set(0, 0.25, 0);
}

export function disposeTornadoMesh(scene, m) {   // hình khối dùng chung (không hủy); hủy chất liệu RIÊNG của cơn lốc
  scene.remove(m.group); m.fm.dispose(); for (const x of m.leafMats) x.dispose(); m.dust.material.dispose();
}
