// Hồn quái bay vào hồ lô (Phiên 126): đốm sáng cộng sáng (additive) kèm đuôi mờ, bay từ chỗ quái bị hạ tới hồ lô ở eo nhân vật. Đường bay: orbPos trong js/world/soul.js.
// Dùng: const fx = createSoulFx(scene); fx.launch({x,y,z}, color, nowMs, onArrive); mỗi khung hình fx.update(() => vị trí hồ lô hoặc null, nowMs).
import * as THREE from 'three';
import { SOUL_S, orbPos, orbScale } from '../world/soul.js';

const POOL = 6, TRAIL = 3, TRAIL_GAP = 0.05;

function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createSoulFx(scene) {
  const group = new THREE.Group(); group.name = 'soul-fx'; scene.add(group);
  const tex = glowTex(), orbs = [];
  for (let i = 0; i < POOL; i++) {
    const sprites = [];
    for (let j = 0; j <= TRAIL; j++) {
      const m = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0 });
      const s = new THREE.Sprite(m); s.visible = false; s.renderOrder = 9; group.add(s); sprites.push(s);
    }
    orbs.push({ sprites, o: null });
  }
  /** Thả một đốm hồn: from = {x,y,z} chỗ quái, color = màu hex, onArrive() gọi khi chui vào hồ lô. Hết ô trống thì đè ô cũ nhất. */
  function launch(from, color, nowMs = performance.now(), onArrive = null) {
    if (!from) return false;
    const slot = orbs.find((x) => !x.o) || orbs.reduce((a, b) => (a.o.t0 <= b.o.t0 ? a : b));
    if (slot.o && slot.o.onArrive) { try { slot.o.onArrive(); } catch (_) { /* bỏ qua */ } }
    slot.o = { from: { x: +from.x || 0, y: Number.isFinite(+from.y) ? +from.y : 0.8, z: +from.z || 0 }, color, t0: nowMs, onArrive };
    for (const s of slot.sprites) s.material.color.setHex(color);
    return true;
  }
  function update(targetFn, nowMs = performance.now()) {
    const target = targetFn ? targetFn() : null;
    for (const slot of orbs) {
      const o = slot.o; if (!o) continue;
      const u = (nowMs - o.t0) / (SOUL_S * 1000);
      if (u >= 1 || !target) {
        if (u >= 1 && o.onArrive) { try { o.onArrive(); } catch (_) { /* bỏ qua */ } }
        if (u >= 1 || !target) { slot.o = null; for (const s of slot.sprites) s.visible = false; }
        continue;
      }
      for (let j = 0; j < slot.sprites.length; j++) {
        const s = slot.sprites[j], uj = u - j * TRAIL_GAP;
        if (uj < 0) { s.visible = false; continue; }
        const p = orbPos(o.from, target, uj), sc = orbScale(uj) * (0.62 - 0.14 * j) * 1.5;
        s.position.set(p.x, p.y, p.z); s.scale.set(sc, sc, 1); s.material.opacity = (1 - j / (TRAIL + 1)) * 0.95; s.visible = true;
      }
    }
  }
  function dispose() { for (const x of orbs) for (const s of x.sprites) s.material.dispose(); tex.dispose(); scene.remove(group); }
  return { launch, update, dispose, group };
}
