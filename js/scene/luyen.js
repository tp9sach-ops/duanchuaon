// Cảnh 3D Võ đường luyện chiêu (Phiên 150). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI). Dựng khi vào zone, dispose khi ra.
// Sàn tròn + viền + 12 đèn lồng + 3 mộc nhân (cọc gỗ) + cổng về chánh điện. hit(i) làm mộc nhân rung và nháy sáng.
import * as THREE from 'three';
import { LUYEN_ARENA, LUYEN_DUMMIES } from '../world/zoneLuyen.js';
import { buildGate } from './voDai.js';

function disposeObj(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); if (g.parent) g.parent.remove(g); }
const flat = (geo, color, y) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; };

function makeDummy() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x9a6b3a, roughness: 0.85, emissive: 0x000000 }), band = new THREE.MeshStandardMaterial({ color: 0xc8322b, roughness: 0.8 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 2.0, 10), wood); post.position.y = 1.0; g.add(post);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.22), wood); arm.position.y = 1.5; g.add(arm);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), wood); head.position.y = 2.25; g.add(head);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 16), band); ring.rotation.x = Math.PI / 2; ring.position.y = 0.9; g.add(ring);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.14, 14), new THREE.MeshStandardMaterial({ color: 0x6a4f2f, roughness: 0.9 })); base.position.y = 0.07; g.add(base);
  g.userData.parts = [post, arm, head];
  return g;
}

export function luyenHooks(scene) {
  let grp = null, gateOff = null, dummies = [], raf = 0, last = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; let any = false;
    for (const d of dummies) {
      if (d.t > 0) { d.t = Math.max(0, d.t - dt); any = true; const k = d.t / 0.45; d.g.rotation.z = Math.sin(d.t * 40) * 0.12 * k; d.g.userData.parts.forEach((m) => m.material.emissive.setHex(k > 0.5 ? 0xff7a30 : 0x000000)); if (d.t === 0) { d.g.rotation.z = 0; d.g.userData.parts.forEach((m) => m.material.emissive.setHex(0x000000)); } }
    }
    raf = any ? requestAnimationFrame(loop) : 0;
  }
  return {
    load() {
      if (grp) return; grp = new THREE.Group(); const r = LUYEN_ARENA.r;
      grp.add(flat(new THREE.CircleGeometry(r, 56), 0xcdb891, 0.04));
      grp.add(flat(new THREE.RingGeometry(r - 0.5, r, 64), 0x8a3b2a, 0.06));
      grp.add(flat(new THREE.RingGeometry(r * 0.5 - 0.1, r * 0.5, 48), 0xd9b25f, 0.06));
      const post = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 }), lamp = new THREE.MeshBasicMaterial({ color: 0xffd98a });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2; if (Math.abs(a - Math.PI) < 0.3) continue;   // chừa chỗ cổng
        const x = Math.sin(a) * (r + 0.4), z = Math.cos(a) * (r + 0.4);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.6, 8), post); p.position.set(x, 0.8, z); grp.add(p);
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lamp); l.position.set(x, 1.9, z); grp.add(l);
      }
      grp.position.set(LUYEN_ARENA.cx, 0, LUYEN_ARENA.cz); scene.add(grp);
      dummies = LUYEN_DUMMIES.map((d) => { const g = makeDummy(); g.position.set(d.x, 0, d.z); scene.add(g); return { id: d.id, g, t: 0 }; });
      gateOff = buildGate(scene, { x: LUYEN_ARENA.cx, z: LUYEN_ARENA.cz + 12.5, r: 2 }, 0xf1db9f);
    },
    dispose() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      for (const d of dummies) disposeObj(d.g); dummies = [];
      if (gateOff) { gateOff(); gateOff = null; }
      if (grp) { disposeObj(grp); grp = null; }
    },
    /** Mộc nhân thứ i bị trúng đòn: rung + nháy cam 0,45 giây. */
    hit(i) { const d = dummies[i]; if (!d) return; d.t = 0.45; if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } },
  };
}
