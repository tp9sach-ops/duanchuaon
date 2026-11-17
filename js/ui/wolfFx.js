// SÓI KHÍ VÀNG (Phiên 224, mục 1): con chó sói ĐẦU TO làm bằng khí vàng vồ ra khi cầm Gậy dạy chó đánh thường đòn THỨ 3. Chuyển động (hiện → phóng → ngoạm → tan): js/world/wolfMath.js (có test). Đây chỉ là hình khối + vẽ.
// Dựng bằng khối cầu / nón của three.js (không cần tệp mô hình), vật liệu cộng sáng màu vàng, trong suốt dần. Hình học dùng chung; vật liệu riêng từng con để làm mờ.
// CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — kích thước là số TẠM (HEAD_BIG...), chỉnh khi ptg chơi thử.
import * as THREE from 'three';
import { WOLF, wolfPose } from '../world/wolfMath.js';

export const HEAD_BIG = 1.9;   // đầu to gấp ngần này lần so với tỉ lệ thân sói thường
const GOLD = 0xffcf3a, GOLD_L = 0xfff1a8, GOLD_D = 0xffa81c, WHITE = 0xffffff;
const BASE_Y = 0.95;           // m: độ cao thân sói so với chân nhân vật

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 2, 8) });

function makeWolf(scene, pos, heading, range) {
  const g = geos(), root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.renderOrder = 6;
  const mk = (c, extra) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, ...(extra || {}) });
  const mats = { a: mk(GOLD), l: mk(GOLD_L), d: mk(GOLD_D), eye: mk(WHITE), glow: mk(0xffe27a) };
  const part = (geo, mat, sx, sy, sz, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.renderOrder = 6; (parent || body).add(m); return m; };
  // thân (nằm theo +z), đuôi, bốn chân
  part(g.ball, mats.a, 0.32, 0.3, 0.62, 0, 0, -0.15);
  part(g.ball, mats.l, 0.26, 0.24, 0.3, 0, 0.04, 0.22);   // ngực sáng
  const tail = part(g.cone, mats.d, 0.1, 0.55, 0.1, 0, 0.12, -0.85); tail.rotation.x = -1.9;
  const legs = [];
  for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, -0.45], [0.17, -0.45]]) { const l = part(g.cone, mats.a, 0.07, 0.32, 0.07, x, -0.3, z); l.rotation.x = 3.14159; legs.push(l); }
  // đầu to: sọ + mõm + hàm dưới (xoay để há mõm) + tai + mắt
  const head = new THREE.Group(); head.position.set(0, 0.2, 0.62); head.scale.setScalar(HEAD_BIG); body.add(head);
  const hp = (geo, mat, sx, sy, sz, x, y, z, parent) => part(geo, mat, sx, sy, sz, x, y, z, parent || head);
  hp(g.ball, mats.a, 0.2, 0.18, 0.2, 0, 0, 0);
  hp(g.ball, mats.l, 0.12, 0.09, 0.2, 0, -0.03, 0.2);       // mõm trên
  const jaw = new THREE.Group(); jaw.position.set(0, -0.07, 0.07); head.add(jaw);
  hp(g.ball, mats.d, 0.1, 0.05, 0.19, 0, -0.01, 0.13, jaw); // hàm dưới
  for (const s of [-1, 1]) {
    const ear = hp(g.cone, mats.d, 0.06, 0.15, 0.05, s * 0.12, 0.2, -0.03); ear.rotation.z = -s * 0.25;
    hp(g.ball, mats.eye, 0.035, 0.035, 0.035, s * 0.09, 0.07, 0.15);
    hp(g.cone, mats.l, 0.015, 0.045, 0.015, s * 0.035, -0.1, 0.27, jaw).rotation.x = 3.14159;   // nanh
  }
  hp(g.ball, mats.glow, 0.34, 0.3, 0.34, 0, 0.02, 0.02);    // quầng khí quanh đầu
  scene.add(root);
  return { scene, root, body, head, jaw, legs, mats, pos: { x: pos.x, y: pos.y, z: pos.z }, heading, range, t: 0, bitten: false };
}

const dispose = (w) => { w.scene.remove(w.root); for (const m of Object.values(w.mats)) m.dispose(); };

function place(w) {
  const p = wolfPose(w.t, w.range), q = wolfPose(w.t + 0.03, w.range);
  const sx = Math.sin(w.heading), sz = Math.cos(w.heading), dd = Math.max(0, p.dist - 0);
  w.root.position.set(w.pos.x + sx * dd, w.pos.y + BASE_Y + p.up, w.pos.z + sz * dd);
  w.root.rotation.set(0, w.heading, 0);
  const dUp = q.up - p.up, dDist = Math.max(0.001, q.dist - p.dist);
  w.body.rotation.x = -Math.max(-0.7, Math.min(0.7, Math.atan2(dUp, dDist * 3)));   // mũi hếch lên khi vọt, chúi xuống khi hạ
  w.jaw.rotation.x = p.jaw * 0.75;
  const run = Math.sin(w.t * 28); w.legs.forEach((l, i) => { l.rotation.x = 3.14159 + (i % 2 ? run : -run) * 0.6; });
  const sc = WOLF.scale * (0.35 + 0.65 * p.grow) * (p.bite ? 1.12 : 1);
  w.root.scale.setScalar(sc);
  const m = w.mats, v = p.vis; m.a.opacity = 0.78 * v; m.l.opacity = 0.85 * v; m.d.opacity = 0.7 * v; m.eye.opacity = 0.95 * v; m.glow.opacity = 0.22 * v;
  return p;
}

/**
 * Bộ quản lý sói khí trong một cảnh. spawn(pos {x,y,z}, heading, range): thả một con tại `pos` (chân nhân vật), hướng `heading` (rad quanh y, 0 = +z), vồ xa `range` m.
 * update(dt): bay + dọn; `onBite()` gọi MỘT lần khi sói ngoạm (cho tiếng / rung). Trả false khi đang đủ WOLF.max con.
 * remote = true (sói của NGƯỜI KHÁC, Phiên 224): không phát lại ra mạng. Sói của MÌNH (remote = false) tự phát qua LGT.combatLink.sendWolf để mọi người cùng thấy.
 */
export function createWolfFx(scene, { onBite = null, max = WOLF.max } = {}) {
  const live = [];
  return {
    get count() { return live.length; },
    get scene() { return scene; },
    spawn(pos, heading = 0, range = WOLF.rangeAir, remote = false) {
      if (!scene || !pos || live.length >= max) return false;
      const h = Number.isFinite(+heading) ? +heading : 0, r = Number.isFinite(+range) && +range > 0 ? +range : WOLF.rangeAir;
      const w = makeWolf(scene, pos, h, r); live.push(w); place(w);
      if (!remote) { try { const L = globalThis.LGT; if (L && L.combatLink && L.combatLink.sendWolf) L.combatLink.sendWolf(h, r); } catch (_) { /* phát lỗi không làm hỏng hiệu ứng của mình */ } }   // Phiên 224: sói của MÌNH → báo mọi người cùng thấy
      return true;
    },
    update(dt) {
      if (!live.length) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = live.length - 1; i >= 0; i--) {
        const w = live[i]; w.t += step;
        if (w.t >= WOLF.life) { dispose(w); live.splice(i, 1); continue; }
        const p = place(w);
        if (p.bite && !w.bitten) { w.bitten = true; try { if (onBite) onBite(w); } catch (_) { /* tiếng lỗi không làm hỏng hiệu ứng */ } }
      }
    },
    clear() { while (live.length) dispose(live.pop()); },
  };
}
