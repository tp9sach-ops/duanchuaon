// Cảnh 3D yêu quái (Phiên 64): thân đá / nước / lửa, vùng đỏ báo đòn gồng, đá đang bay, túi lá bồ đề rơi. Chỉ VẼ; trạng thái ở js/world/yeuquai.js (LGT.yqView do js/ui/yeuquai.js cập nhật).
import * as THREE from 'three';
import { YQ } from '../world/yeuquai.js';
import { wavePoint } from '../world/conKhi.js';

const mat = (c, e = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: e ? 0.7 : 0, roughness: 0.8 });
function body(type) {
  const g = new THREE.Group(), t = YQ[type], b = t.body;
  if (type === 'da') {
    const m = mat(t.color); const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(b, 0), m); torso.position.y = b * 1.2; g.add(torso);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(b * 0.5, 0), mat(0x6a6f75)); head.position.set(0, b * 2.5, 0.2); g.add(head);
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.DodecahedronGeometry(b * 0.45, 0), m); arm.position.set(s * b * 1.25, b * 1.1, 0.2); g.add(arm); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xffd04a, 0xffa200)); eye.position.set(s * 0.25, b * 2.55, b * 0.45); g.add(eye); }
  } else if (type === 'nuoc') {
    const m = new THREE.MeshStandardMaterial({ color: t.color, transparent: true, opacity: 0.78, roughness: 0.15, emissive: 0x1b6f95, emissiveIntensity: 0.4 });
    const blob = new THREE.Mesh(new THREE.SphereGeometry(b, 18, 14), m); blob.position.y = b; blob.scale.set(1, 1.5, 1); g.add(blob);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0xffffff, 0xffffff)); e.position.set(s * 0.4, b * 1.6, b * 0.8); g.add(e); }
  } else {
    const m = mat(t.color, 0xff4a10); const cone = new THREE.Mesh(new THREE.ConeGeometry(b, b * 3, 12), m); cone.position.y = b * 1.5; g.add(cone);
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(b * 0.35, b * 1.4, 8), mat(0xffb020, 0xff8a00)); const a = i * 1.26; f.position.set(Math.cos(a) * b * 0.8, b * 0.9, Math.sin(a) * b * 0.8); g.add(f); }
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

/** Hình trăng khuyết nằm ngang (Phiên 93): trục "tiến" là +z, sừng hai bên chĩa ra sau; W = nửa bề rộng, H = độ cong về phía trước, T = độ dày ở giữa. */
function crescentGeo(W = 1.5, H = 1.1, T = 0.5) {
  const sh = new THREE.Shape(), N = 16;
  for (let i = 0; i <= N; i++) { const u = -1 + 2 * i / N, x = u * W, y = H * (1 - u * u); if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const u = -1 + 2 * i / N; sh.lineTo(u * W, (H - T) * (1 - u * u)); }
  const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2); return g;   // y của hình phẳng → +z của cảnh
}

/** Trả { group, update(t, view) }. view = LGT.yqView { boss, shapes, wt (0..1 khi gồng, -1 khi vừa đánh), flash, loot, stones }. */
export function buildYeuQuai() {
  const group = new THREE.Group(); group.name = 'yeu-quai';
  const models = {}; for (const id of Object.keys(YQ)) { const m = body(id); m.visible = false; group.add(m); models[id] = m; }
  const redMat = () => new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const marks = [0, 1, 2].map(() => { const c = new THREE.Mesh(new THREE.CircleGeometry(1, 40), redMat()); c.rotation.x = -Math.PI / 2; c.visible = false; group.add(c); const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 1, 48), redMat()); r.rotation.x = -Math.PI / 2; r.visible = false; group.add(r); return { c, r }; });
  const stoneGeo = new THREE.DodecahedronGeometry(0.22, 0), stones = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(stoneGeo, mat(0x8c9096)); m.visible = false; group.add(m); return m; });
  const lootGeo = new THREE.SphereGeometry(0.28, 12, 10), loots = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(lootGeo, mat(0x6fe0a0, 0x2fd078)); m.visible = false; group.add(m); return m; });
  // Luồng khí của Côn Khí Trảm (Phiên 93): 3 cái dùng lại; vị trí tính theo đồng hồ riêng (performance.now) nên không cần vòng lặp thời gian ở nơi bắn
  const khiGeo = crescentGeo(), khiGlowGeo = crescentGeo(1.9, 1.5, 0.95);
  const khiMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const waves = [0, 1, 2].map(() => { const g = new THREE.Group(), core = new THREE.Mesh(khiGeo, khiMat(0xf4fbff, 0.95)), glow = new THREE.Mesh(khiGlowGeo, khiMat(0x6fc8ff, 0.4)); core.position.z = 0.05; g.add(glow, core); g.visible = false; group.add(g); return { g, core, glow }; });
  return {
    group,
    update(t, view) {
      const b = view && view.boss, v = view || {};
      for (const id of Object.keys(models)) models[id].visible = !!b && !b.dead && b.type === id;
      if (b && !b.dead) { const m = models[b.type]; m.position.set(b.x, 0, b.z); m.rotation.y = b.ry; const s = 1 + (b.state === 'windup' ? Math.sin(t * 30) * 0.03 : 0); m.scale.set(s, s, s); }
      const shapes = b && !b.dead ? v.shapes || [] : [];
      marks.forEach((mk, i) => {
        const s = shapes[i]; mk.c.visible = mk.r.visible = false; if (!s) return;
        const op = v.wt >= 0 ? 0.18 + 0.4 * v.wt * (0.7 + 0.3 * Math.sin(t * 14)) : 0.7;   // gồng: đỏ dần; vừa đánh: sáng rực
        const o = s.k === 'ring' ? mk.r : mk.c; o.visible = true; o.material.opacity = op; o.position.set(s.x, 0.06, s.z);
        if (s.k === 'ring') { o.geometry.dispose(); o.geometry = new THREE.RingGeometry(s.r0, s.r, 56); o.scale.set(1, 1, 1); } else o.scale.set(s.r, s.r, 1);
      });
      (v.stones || []).forEach((s, i) => { const m = stones[i]; if (!m) return; const u = Math.min(1, s.t / s.dur); m.visible = true; m.position.set(s.x0 + (s.x1 - s.x0) * u, 1.6 + 2.2 * u * (1 - u) * 2 - u * 0.4, s.z0 + (s.z1 - s.z0) * u); m.rotation.x += 0.4; });
      for (let i = (v.stones || []).length; i < stones.length; i++) stones[i].visible = false;
      const ws = v.waves || [], tnow = performance.now();   // luồng khí: u = 0..1 là đang bay, > 1 là vừa chạm (nổ tan ra)
      waves.forEach((o, i) => {
        const w = ws[ws.length - 1 - i]; if (!w) { o.g.visible = false; return; }
        const u = (tnow - w.t0) / Math.max(50, w.dur * 1000); if (u < 0 || u > 1.3) { o.g.visible = false; return; }
        const q = wavePoint(w, Math.min(1, u)), fade = u > 1 ? Math.max(0, 1 - (u - 1) / 0.3) : 1, grow = u > 1 ? 1 + (u - 1) * 1.6 : 0.7 + 0.3 * u;
        o.g.visible = true; o.g.position.set(q.x, 1.0, q.z); o.g.rotation.set(0, w.ry, 0.38); o.g.scale.set(grow * 1.1, 1, grow);
        o.core.material.opacity = 0.95 * fade; o.glow.material.opacity = 0.4 * fade * (0.8 + 0.2 * Math.sin(t * 40));
      });
      loots.forEach((m, i) => { const d = (v.loot || [])[i]; m.visible = !!d; if (d) m.position.set(d.x, 0.5 + Math.sin(t * 3 + i) * 0.12, d.z); });
    },
  };
}
