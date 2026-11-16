// Vệt GIÓ TRẮNG khi bay lướt + vòng sóng khi đạp gió (Phiên 204). Cộng sáng (additive), không ghi độ sâu → hợp bloom, không đè lên nhân vật sai chỗ.
// Dùng: const fx = createWindFx(scene); mỗi khung hình fx.update(dt, { on, x, y, z, ry, speed, level, camera }); mỗi cú đạp fx.kick(x, y, z, ry). Số liệu: js/world/windFxMath.js (có test).
import * as THREE from 'three';
import { WIND_FX, streakSpawn, streakLen, fadeOf, ringRadius } from '../world/windFxMath.js';

function tex(draw, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function createWindFx(scene) {
  const group = new THREE.Group(); group.name = 'wind-fx'; scene.add(group);
  const streakTex = tex((g, w, h) => { const a = g.createLinearGradient(0, 0, w, 0); a.addColorStop(0, 'rgba(255,255,255,0)'); a.addColorStop(0.55, 'rgba(255,255,255,0.9)'); a.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = a; g.fillRect(0, h * 0.35, w, h * 0.3); }, 128, 16);
  const ringTex = tex((g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.5); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.7, 'rgba(255,255,255,0.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }, 128, 128);
  const mk = (map, geo) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide })); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; group.add(m); return m; };
  const planeG = new THREE.PlaneGeometry(1, 1);
  const streaks = [], rings = [];
  for (let i = 0; i < WIND_FX.maxStreaks; i++) streaks.push({ m: mk(streakTex, planeG), age: 99, life: 1, len: 1, ry: 0, w: 0.08, vx: 0, vz: 0 });
  for (let i = 0; i < WIND_FX.maxRings; i++) rings.push({ m: mk(ringTex, planeG), age: 99 });
  let acc = 0;
  const cam = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4();

  function addStreak(x, y, z, ry, speed, spread) {
    const s = streaks.find((q) => q.age >= q.life); if (!s) return;
    const side = (Math.random() - 0.5) * 2 * spread, h = 0.2 + Math.random() * 1.2;
    s.age = 0; s.life = WIND_FX.streakLife * (0.8 + Math.random() * 0.5); s.len = streakLen(speed) * (0.8 + Math.random() * 0.5); s.ry = ry; s.w = 0.05 + Math.random() * 0.06;
    const bx = -Math.sin(ry) * (0.2 + Math.random() * 0.6), bz = -Math.cos(ry) * (0.2 + Math.random() * 0.6);   // sinh sau lưng một chút
    s.m.position.set(x + Math.cos(ry) * side + bx, y + h, z - Math.sin(ry) * side + bz); s.vx = -Math.sin(ry) * 1.2; s.vz = -Math.cos(ry) * 1.2;
  }
  function kick(x, y, z, ry) {
    const r = rings.find((q) => q.age >= WIND_FX.ringLife) || rings[0];
    r.age = 0; r.m.position.set(x - Math.sin(ry) * 0.5, y + 0.45, z - Math.cos(ry) * 0.5); r.m.rotation.set(0, ry, 0);   // vòng đứng vuông góc hướng bay, ngay sau lưng
    for (let i = 0; i < WIND_FX.kickStreaks; i++) addStreak(x, y, z, ry, 12, 0.7);
  }
  function update(dt, o) {
    o = o || {}; const d = Math.max(0, Math.min(0.1, +dt || 0));
    if (o.on) { const sp = streakSpawn(acc, d, o.level); acc = sp.acc; for (let i = 0; i < sp.n; i++) addStreak(o.x, o.y, o.z, o.ry, o.speed, 0.55); } else acc = 0;
    if (o.camera) cam.copy(o.camera.position);
    for (const s of streaks) {
      s.age += d; const f = fadeOf(s.age, s.life); if (f.alpha <= 0) { s.m.visible = false; continue; }
      s.m.visible = true; s.m.material.opacity = f.alpha * 0.7;
      s.m.position.x += s.vx * d; s.m.position.z += s.vz * d;
      X.set(Math.sin(s.ry), 0, Math.cos(s.ry));   // dọc theo hướng bay; mặt vệt quay về phía camera (billboard quanh trục dọc)
      Z.copy(cam).sub(s.m.position); Z.addScaledVector(X, -Z.dot(X)); if (Z.lengthSq() < 1e-6) Z.set(0, 1, 0); Z.normalize(); Y.crossVectors(Z, X).normalize();
      M.makeBasis(X, Y, Z); s.m.quaternion.setFromRotationMatrix(M); s.m.scale.set(s.len * (0.7 + 0.5 * f.k), s.w, 1);
    }
    for (const r of rings) {
      r.age += d; const f = fadeOf(r.age, WIND_FX.ringLife); if (f.alpha <= 0) { r.m.visible = false; continue; }
      const R = ringRadius(f.k); r.m.visible = true; r.m.material.opacity = f.alpha * 0.8; r.m.scale.set(R * 2, R * 2, 1);
    }
  }
  return { update, kick, dispose() { scene.remove(group); streakG(); } };
  function streakG() { planeG.dispose(); streakTex.dispose(); ringTex.dispose(); streaks.concat(rings).forEach((q) => q.m.material.dispose()); }
}
