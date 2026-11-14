// Rồng hồng bay quanh người khi cầm Gậy như ý và đánh thường đủ 3 đòn liên tiếp (Phiên 163, yêu cầu ptg).
// Dựng bằng khối cầu / nón của three.js (không cần tệp mô hình): đầu rồng có sừng vàng + râu + mắt, thân 24 đốt xen hai sắc hồng, gai lưng vàng, đuôi thon dần.
// Rồng bay xoắn quanh người chơi ~2,8 giây (hiện dần → bay → thu nhỏ + mờ dần rồi biến mất). Hình học dùng chung; vật liệu riêng từng con để làm mờ.
// CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — số liệu (bán kính vòng bay, tốc độ, kích thước) là TẠM, chỉnh trong DRAGON.
import * as THREE from 'three';

export const DRAGON = Object.freeze({ hits: 3, gap: 3.0, life: 2.8, segs: 24, spacing: 0.05, fadeIn: 0.35, fadeOut: 0.6, max: 2, speed: 3.4, radius: 1.9 });
const PINK = 0xff6fb5, PINK_L = 0xffa6d0, PINK_D = 0xff3f93, GOLD = 0xffe08a, WHITE = 0xffffff;

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 2, 8) });

/** Điểm trên quỹ đạo (toạ độ so với tâm người chơi) tại giây t của con rồng k = { ph, dir, R }. t có thể âm (đốt đuôi). */
export function pathAt(t, k) {
  const a = k.ph + k.dir * t * DRAGON.speed;
  const R = k.R + 0.35 * Math.sin(t * 2.1 + k.ph) + 0.25 * Math.min(1, Math.max(0, t));
  return [Math.cos(a) * R, 1.15 + 0.55 * Math.sin(t * 2.6 + k.ph * 0.5) + 0.12 * Math.max(0, t), Math.sin(a) * R];
}
const smooth = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

function makeDragon(scene, center, ry, flip) {
  const g = geos(), root = new THREE.Group(); root.renderOrder = 6;
  const mk = (c, extra) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, ...(extra || {}) });
  const mats = { a: mk(PINK), b: mk(PINK_L), head: mk(PINK_D), gold: mk(GOLD), eye: mk(WHITE), glow: mk(0xffd0ea, { blending: THREE.AdditiveBlending }) };
  const part = (geo, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x || 0, y || 0, z || 0); m.renderOrder = 6; return m; };
  const segs = [];
  for (let i = 0; i < DRAGON.segs; i++) {
    const sg = new THREE.Group(), f = i / (DRAGON.segs - 1), r = i === 0 ? 0.26 : 0.2 * (1 - 0.72 * f * f) + 0.05;
    if (i === 0) {   // đầu
      sg.add(part(g.ball, mats.head, r * 1.15, r * 0.95, r * 1.35));
      sg.add(part(g.ball, mats.a, r * 0.62, r * 0.5, r * 0.8, 0, -r * 0.1, r * 1.15));   // mõm
      sg.add(part(g.ball, mats.glow, r * 0.3, r * 0.3, r * 0.3, 0, -r * 0.05, r * 1.85));   // ngọc ở mõm
      for (const s of [-1, 1]) {
        sg.add(part(g.ball, mats.eye, r * 0.2, r * 0.2, r * 0.2, s * r * 0.55, r * 0.35, r * 0.55));   // mắt
        const horn = part(g.cone, mats.gold, r * 0.22, r * 0.9, r * 0.22, s * r * 0.5, r * 0.95, -r * 0.35); horn.rotation.x = -0.9; horn.rotation.z = -s * 0.25; sg.add(horn);   // sừng
        const whisk = part(g.cone, mats.gold, r * 0.06, r * 1.9, r * 0.06, s * r * 0.7, -r * 0.1, r * 1.0); whisk.rotation.z = s * 1.2; whisk.rotation.x = 0.55; sg.add(whisk);   // râu
      }
    } else {
      sg.add(part(g.ball, i % 2 ? mats.b : mats.a, r, r, r * 1.25));
      if (i % 3 === 0) sg.add(part(g.cone, mats.gold, r * 0.45, r * 0.8, r * 0.45, 0, r * 1.05, 0));   // gai lưng
    }
    root.add(sg); segs.push(sg);
  }
  scene.add(root);
  const k = { ph: Math.PI / 2 - ry + (flip ? Math.PI : 0), dir: flip ? -1 : 1, R: DRAGON.radius };
  return { scene, root, segs, mats, k, t: 0 };
}

const P = new THREE.Vector3(), Q = new THREE.Vector3();
function place(d, center) {
  const { t, k } = d, L = DRAGON.life, up = smooth(t / DRAGON.fadeIn), down = 1 - smooth((t - (L - DRAGON.fadeOut)) / DRAGON.fadeOut), vis = Math.min(up, down);
  const m = d.mats; m.a.opacity = m.b.opacity = m.head.opacity = m.gold.opacity = m.eye.opacity = 0.92 * vis; m.glow.opacity = 0.7 * vis;
  const grow = 0.35 + 0.65 * vis;
  for (let i = 0; i < d.segs.length; i++) {
    const ti = t - i * DRAGON.spacing, a = pathAt(ti, k), b = pathAt(ti + 0.04, k), s = d.segs[i];
    s.position.set(center.x + a[0], center.y + a[1], center.z + a[2]); s.scale.setScalar(grow);
    Q.set(center.x + b[0], center.y + b[1], center.z + b[2]); s.lookAt(Q);
  }
}

/** Bộ quản lý rồng trong một cảnh. spawn(center, ry): thả một con rồng quanh `center` (Vector3 vị trí nhân vật), `ry` = hướng mặt nhân vật. update(dt, center): bay + dọn. */
export function createDragonFx(scene) {
  const live = []; let flip = false;
  const drop = (d) => { d.scene.remove(d.root); for (const m of Object.values(d.mats)) m.dispose(); };
  return {
    get count() { return live.length; },
    get scene() { return scene; },
    spawn(center, ry = 0) {
      if (!scene || !center || live.length >= DRAGON.max) return false;
      flip = !flip; const d = makeDragon(scene, center, ry, flip); live.push(d); place(d, center); return true;
    },
    update(dt, center) {
      if (!live.length || !center) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = live.length - 1; i >= 0; i--) {
        const d = live[i]; d.t += step;
        if (d.t >= DRAGON.life) { drop(d); live.splice(i, 1); continue; }
        place(d, center);
      }
    },
    clear() { while (live.length) drop(live.pop()); },
  };
}

/** Đếm đòn đánh thường liên tiếp: trả { hits, fire } — fire = true khi vừa đủ DRAGON.hits đòn (mỗi đòn cách đòn trước ≤ DRAGON.gap giây). Hàm thuần, now = giây. */
export function countHit(state, now) {
  const s = state || { hits: 0, last: -1e9 };
  const hits = now - s.last > DRAGON.gap ? 1 : s.hits + 1, fire = hits >= DRAGON.hits;
  return { hits: fire ? 0 : hits, last: now, fire };
}
