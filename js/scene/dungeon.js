// Cảnh 3D phó bản (mục 4b, Phiên 139). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI). Mỗi phó bản dựng khi vào zone, dispose khi ra. Dùng buildGate của voDai.js cho cổng rời.
import * as THREE from 'three';
import { arenaOf } from '../world/zoneDungeon.js';
import { buildGate } from './voDai.js';

// Chủ đề từng phó bản: màu sàn, màu viền, kiểu vật trang trí quanh sàn.
const THEME = Object.freeze({
  rungmoc: { floor: 0x4c6b3a, rim: 0x2d4a24, deco: 'cay', color: 0x2f6b34, gate: 0x7fd68f },
  hangkim: { floor: 0x6d6a63, rim: 0x3f3d39, deco: 'da', color: 0x8a8576, gate: 0xd9b25f },
  hothuy: { floor: 0x4f7f95, rim: 0x2f5870, deco: 'tru', color: 0x7fb8d6, gate: 0x8fd6e8 },
  thaptho: { floor: 0x9a7b52, rim: 0x6a4f2f, deco: 'thap', color: 0xb8975f, gate: 0xe0b86a },
});
function disposeObj(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); if (g.parent) g.parent.remove(g); }
const flat = (geo, color, y) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; };

/** Hook load/dispose của zone phó bản `id` (gắn vào def.load / def.dispose). */
export function dungeonHooks(scene, id) {
  let grp = null, gateOff = null;
  const a = arenaOf(id), th = THEME[id];
  return {
    load() {
      if (grp || !a || !th) return; grp = new THREE.Group();
      grp.add(flat(new THREE.CircleGeometry(a.r, 56), th.floor, 0.04));
      grp.add(flat(new THREE.RingGeometry(a.r - 0.6, a.r, 64), th.rim, 0.06));
      const mat = new THREE.MeshStandardMaterial({ color: th.color, roughness: 0.85 }), n = 20;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2, x = Math.sin(ang) * (a.r + 1.2), z = Math.cos(ang) * (a.r + 1.2);
        if (Math.abs(ang - Math.PI) < 0.22) continue;   // chừa chỗ cổng rời ở phía nam
        let m;
        if (th.deco === 'cay') { m = new THREE.Mesh(new THREE.ConeGeometry(1.3 + (i % 3) * 0.3, 4.2 + (i % 4) * 0.5, 8), mat); m.position.set(x, 2.3, z); }
        else if (th.deco === 'da') { m = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3 + (i % 3) * 0.4), mat); m.position.set(x, 0.9, z); }
        else if (th.deco === 'tru') { m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3 + (i % 3), 8), mat); m.position.set(x, 1.6, z); }
        else { m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3 + (i % 3) * 1.2, 1.8), mat); m.position.set(x, 1.8, z); }
        grp.add(m);
      }
      grp.position.set(a.cx, 0, a.cz); scene.add(grp);
      gateOff = buildGate(scene, { x: a.cx, z: a.cz + 14, r: 2 }, th.gate);   // cổng rời phó bản
    },
    dispose() { if (gateOff) { gateOff(); gateOff = null; } if (grp) { disposeObj(grp); grp = null; } },
  };
}
