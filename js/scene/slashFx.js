// Vệt chém sáng quét quanh người (Phiên 119, theo clip mẫu): cung sáng, đầu sáng dẫn đầu, đuôi mờ dần. Cộng sáng (additive) nên hợp với bloom.
// Dùng: const fx = createSlashFx(scene); fx.slash(kind, ry); mỗi khung hình gọi fx.update(pos, nowMs). Số liệu từng kiểu đòn: SLASH trong js/world/combo.js.
import * as THREE from 'three';
import { SLASH } from '../world/combo.js';

const N = 30, TAIL = 0.45, FADE = 0.22, Y = 0.95, POOL = 4;

/** Dải cung hình thoi (dày ở giữa, mỏng hai đầu) trong mặt phẳng ngang, tâm cung hướng +z. Màu đỉnh được cập nhật mỗi khung. */
function arcGeo(sp) {
  const R = sp.reach * 0.6, pos = new Float32Array((N + 1) * 6), col = new Float32Array((N + 1) * 6), idx = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, ang = (s - 0.5) * sp.arc, hw = sp.reach * 0.17 * (0.15 + 0.85 * Math.sin(Math.PI * s));
    for (let j = 0; j < 2; j++) { const r = R + (j ? hw : -hw), o = (i * 2 + j) * 3; pos[o] = Math.sin(ang) * r; pos[o + 1] = 0; pos[o + 2] = Math.cos(ang) * r; }
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}

export function createSlashFx(scene) {
  const group = new THREE.Group(); group.name = 'slash-fx'; scene.add(group);
  const slots = [];
  for (let i = 0; i < POOL; i++) {
    const geos = {}; for (const k of Object.keys(SLASH)) geos[k] = arcGeo(SLASH[k]);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const mesh = new THREE.Mesh(geos.ngang, mat); mesh.visible = false; mesh.frustumCulled = false; mesh.rotation.order = 'YXZ'; mesh.renderOrder = 6; group.add(mesh);
    slots.push({ mesh, geos, mat, s: null });
  }
  /** Bắt đầu một vệt chém kiểu kind, hướng ry (rad, 0 = +z). Kiểu không có vệt (vd. 'khi') bị bỏ qua. */
  function slash(kind, ry, nowMs = performance.now()) {
    const sp = SLASH[kind]; if (!sp) return false;
    const slot = slots.find((x) => !x.s) || slots.reduce((a, b) => (a.s.t0 <= b.s.t0 ? a : b));
    slot.s = { kind, ry: +ry || 0, t0: nowMs, sp }; slot.mesh.geometry = slot.geos[kind]; slot.mat.color.setHex(sp.tint); slot.mesh.visible = false;
    return true;
  }
  function update(pos, nowMs = performance.now()) {
    for (const slot of slots) {
      const s = slot.s; if (!s) continue;
      const sp = s.sp, el = (nowMs - s.t0) / 1000;
      if (el > sp.b + FADE + 0.05) { slot.s = null; slot.mesh.visible = false; continue; }
      if (el < sp.a) { slot.mesh.visible = false; continue; }
      const u = Math.min(1, (el - sp.a) / (sp.b - sp.a)), head = u * (1 + TAIL), fade = el > sp.b ? Math.max(0, 1 - (el - sp.b) / FADE) : 1;
      const c = slot.mesh.geometry.attributes.color, a = c.array;
      for (let i = 0; i <= N; i++) {
        const s0 = i / N, sw = sp.side > 0 ? 1 - s0 : s0;
        let b = sw <= head ? Math.max(0, 1 - (head - sw) / TAIL) : 0; b = b * b * fade;
        const o = i * 6; a[o] = a[o + 1] = a[o + 2] = b * 0.55; a[o + 3] = a[o + 4] = a[o + 5] = b;
      }
      c.needsUpdate = true;
      slot.mesh.position.set(pos.x, Y, pos.z); slot.mesh.rotation.set(0, s.ry, sp.tilt); slot.mesh.visible = true;
    }
  }
  function dispose() { for (const x of slots) { for (const g of Object.values(x.geos)) g.dispose(); x.mat.dispose(); } scene.remove(group); }
  return { slash, update, dispose, group };
}
