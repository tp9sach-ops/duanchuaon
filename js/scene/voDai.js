// Cảnh 3D Võ đài + hiệu ứng chiêu (Phiên 137). CHƯA nhìn bằng mắt (không có WebGL ở môi trường AI). Zone chỉ giữ bộ nhớ khi đang ở/được tải trước; dispose giải phóng.
import * as THREE from 'three';
import { ARENA } from '../world/duel.js';

function disposeObj(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); if (g.parent) g.parent.remove(g); }
const flat = (geo, color, y, opacity = 1) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9, transparent: opacity < 1, opacity, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; };

/** Cổng (hai cột + xà + vòng sáng) — dùng cho cổng Võ đài ở sân chùa. Trả hàm gỡ. */
export function buildGate(scene, gate, color = 0xd96b4a) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 }), glow = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 4.2, 10), wood); p.position.set(s * (gate.r - 0.6), 2.1, 0); g.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2 * gate.r, 0.4, 0.5), wood); beam.position.y = 4.3; g.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(gate.r - 0.8, gate.r, 40), glow); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  g.position.set(gate.x, 0, gate.z); scene.add(g); return () => disposeObj(g);
}

/** Hook load/dispose của zone Võ đài: sàn tròn + viền + vạch giữa + cột đá + hai cổng. */
export function arenaHooks(scene) {
  let grp = null;
  return {
    load() {
      if (grp) return; grp = new THREE.Group();
      const { cx, cz, r } = ARENA;
      grp.add(Object.assign(flat(new THREE.CircleGeometry(r, 56), 0xcdb891, 0.04), { name: 'san' }));
      grp.add(flat(new THREE.RingGeometry(r - 0.5, r, 64), 0x8a3b2a, 0.06));
      grp.add(flat(new THREE.RingGeometry(r * 0.45 - 0.1, r * 0.45, 48), 0xd9b25f, 0.06));
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, r * 1.6), new THREE.MeshStandardMaterial({ color: 0xd9b25f })); line.position.y = 0.07; line.rotation.y = Math.PI / 2; grp.add(line);
      const post = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 }), lamp = new THREE.MeshBasicMaterial({ color: 0xffd98a });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, x = Math.sin(a) * (r + 0.4), z = Math.cos(a) * (r + 0.4);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.6, 8), post); p.position.set(x, 0.8, z); grp.add(p);
        if (i % 3 === 0) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lamp); l.position.set(x, 1.9, z); grp.add(l); }
      }
      grp.position.set(cx, 0, cz); scene.add(grp);
      grp.userData.gate = buildGate(scene, { x: cx, z: cz + 10.5, r: 2 }, 0x8fd6bf);   // cổng về chùa
    },
    dispose() { if (grp) { if (grp.userData.gate) grp.userData.gate(); disposeObj(grp); grp = null; } },
  };
}

/** Hiệu ứng chiêu: vòng báo hiệu, luồng khí bay, vệt lao. Tự chạy vòng requestAnimationFrame riêng khi có hiệu ứng, tự dừng khi hết. */
export function createFx(scene) {
  const items = []; let raf = 0, last = 0;
  const kill = (it) => { scene.remove(it.mesh); it.mesh.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); };
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.t += dt; if (it.t >= it.life) { kill(it); items.splice(i, 1); } else if (it.upd) it.upd(it.t, it.t / it.life); }
    raf = items.length ? requestAnimationFrame(loop) : 0;
  }
  function add(mesh, life, upd) { scene.add(mesh); items.push({ mesh, t: 0, life, upd }); if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  const mat = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
  return {
    /** Vòng tròn dưới đất (báo hiệu đòn cận chiến / vòng Hộ thân). */
    ring(x, z, r, dur, color = 0xd9534f) {
      const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.85, r, 40), mat(color, 0.6)); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.1, z);
      add(m, Math.max(0.2, dur), (t, u) => { m.material.opacity = 0.65 * (1 - 0.6 * u); });
    },
    /** Luồng khí bay từ (x,z) theo hướng ry; xuất hiện sau `delay` giây. */
    wave(x, z, ry, range, speed, delay = 0, color = 0x8fd6bf) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), mat(color, 0.85)); m.scale.set(1.8, 0.45, 0.3); m.rotation.y = ry; m.visible = false; m.position.set(x, 1.1, z);
      add(m, delay + range / speed + 0.05, (t) => { if (t < delay) return; m.visible = true; const d = Math.min(range, speed * (t - delay)); m.position.set(x + Math.sin(ry) * d, 1.1, z + Math.cos(ry) * d); });
    },
    /** Vệt lao dài `len` m (báo hiệu Thiết đầu công). */
    line(x, z, ry, len, dur, color = 0xd9534f) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, len), mat(color, 0.4)); m.rotation.y = ry; m.position.set(x + Math.sin(ry) * len / 2, 0.1, z + Math.cos(ry) * len / 2);
      add(m, Math.max(0.2, dur), (t, u) => { m.material.opacity = 0.45 * (1 - 0.5 * u); });
    },
    clear() { for (const it of items.splice(0)) kill(it); if (raf) { cancelAnimationFrame(raf); raf = 0; } },
  };
}
