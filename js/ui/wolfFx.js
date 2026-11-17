// SÓI KHÍ VÀNG (Phiên 224, mục 1; NÂNG CẤP Phiên 227): con chó sói ĐẦU TO làm bằng khí vàng vồ ra khi cầm Gậy dạy chó đánh thường đòn THỨ 3. Chuyển động (hiện → phóng → ngoạm → tan): js/world/wolfMath.js (có test). Đây là hình khối + vẽ + nối tiếng / sát thương.
// Phiên 227: TO hơn (WOLF.scale 2,2), màu vàng-cam ĐẬM có đổ bóng (vật liệu Standard + tự phát sáng nhẹ, không còn là lớp cộng sáng nhạt), bờm lửa dựng quanh cổ, sống lưng gai, nanh dài, mắt đỏ rực, đuôi lửa, vệt khí sau lưng khi phóng,
//   vòng sóng + tia lửa văng ra khi ngoạm; tiếng gầm lúc hiện ra + tiếng ngoạm riêng (js/ui/wolfSfx.js); ngoạm TRÚNG quái thì GÂY SÁT THƯƠNG (js/ui/wolfHit.js — chỉ sói của MÌNH, sói người khác chỉ để xem).
// Dựng bằng khối cầu / nón của three.js (không cần tệp mô hình). CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — kích thước là số TẠM (HEAD_BIG, WOLF.scale, H...), chỉnh khi ptg chơi thử.
import * as THREE from 'three';
import { WOLF, wolfPose } from '../world/wolfMath.js';
import { glowTexture } from './staffMesh.js';
import { wolfSfx } from './wolfSfx.js';
import { applyBite } from './wolfHit.js';
import { startLocalDogs } from './dogPack.js';

export const HEAD_BIG = 1.8;   // đầu to gấp ngần này lần so với tỉ lệ thân sói thường
const C = { fur: 0xe8920c, dark: 0xb5560a, deep: 0x6e2f05, belly: 0xffcf47, mane: 0xff6a00, fang: 0xfffbe8, claw: 0xffe9b0, nose: 0x2a1200, tongue: 0xff4d2e, eyeCore: 0xfff6c8, eyeGlow: 0xff3d00, aura: 0xffa51a, flame: 0xff7a00 };
const BASE_OP = { fur: 1, dark: 1, deep: 1, belly: 1, mane: 1, fang: 1, claw: 1, nose: 1, tongue: 1, eyeCore: 1, eyeGlow: 0.85, aura: 0.2, flame: 0.55 };
const H = 0.72;        // m (trước nhân tỉ lệ): từ tâm thân tới đất, để chân chạm đất
const START = 2.2;     // m: chỗ sói hiện ra, phía trước người chơi
const MOUTH = 1.4;     // tỉ lệ: mõm nhô ra trước tâm thân (nhân WOLF.scale) — để cú ngoạm rơi đúng vào mục tiêu
const ease = (x) => { const c = Math.max(0, Math.min(1, x)); return 1 - (1 - c) * (1 - c); };

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 16, 12), cone: new THREE.ConeGeometry(1, 2, 10), ring: new THREE.RingGeometry(0.62, 1, 56) });

function makeMats() {
  const solid = (c, em) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: em, roughness: 0.62, metalness: 0.08, transparent: true, opacity: 0 });
  const glow = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  return { fur: solid(C.fur, 0.5), dark: solid(C.dark, 0.4), deep: solid(C.deep, 0.3), belly: solid(C.belly, 0.55), mane: solid(C.mane, 0.85), fang: solid(C.fang, 0.7), claw: solid(C.claw, 0.55), nose: solid(C.nose, 0.15), tongue: solid(C.tongue, 0.6), eyeCore: glow(C.eyeCore), eyeGlow: glow(C.eyeGlow), aura: glow(C.aura), flame: glow(C.flame) };
}

function makeWolf(scene, pos, heading, range, remote) {
  const g = geos(), mats = makeMats(), extra = [], root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.renderOrder = 6;
  const part = (geo, mat, sx, sy, sz, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.renderOrder = 6; (parent || body).add(m); return m; };
  const spikes = [], flames = [];
  const reg = (m, arr) => { m.userData.sy = m.scale.y; arr.push(m); return m; };
  // thân (nằm theo +z): thân, yên lưng sẫm, ngực nở + ngực sáng, bụng, mông, cổ
  part(g.ball, mats.fur, 0.34, 0.33, 0.62, 0, 0, -0.12);
  part(g.ball, mats.dark, 0.27, 0.15, 0.6, 0, 0.2, -0.1);
  part(g.ball, mats.fur, 0.37, 0.4, 0.36, 0, 0.02, 0.34);
  part(g.ball, mats.belly, 0.26, 0.28, 0.27, 0, -0.04, 0.46);
  part(g.ball, mats.belly, 0.25, 0.18, 0.48, 0, -0.2, -0.05);
  part(g.ball, mats.fur, 0.33, 0.34, 0.34, 0, 0, -0.56);
  part(g.ball, mats.fur, 0.25, 0.27, 0.32, 0, 0.24, 0.6).rotation.x = -0.55;
  // bờm lửa: nửa vòng gai dựng quanh cổ + hàng gai dọc sống lưng
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (1 - i / 10), sp = part(g.cone, mats.mane, 0.07, 0.2 + 0.08 * (0.5 + 0.5 * Math.sin(i * 1.9)), 0.07, Math.cos(a) * 0.27, 0.22 + Math.sin(a) * 0.27, 0.55);
    sp.rotation.set(-0.85, 0, a - Math.PI / 2); reg(sp, spikes);
  }
  for (let i = 0; i < 5; i++) { const sp = part(g.cone, mats.mane, 0.055, 0.15 + 0.03 * (i % 2), 0.055, 0, 0.34, 0.3 - i * 0.25); sp.rotation.x = -0.55; reg(sp, spikes); }
  // đầu to: sọ + mõm + sống mũi + mũi + môi + tai + lông mày dữ + mắt đỏ rực + nanh trên + lông má
  const head = new THREE.Group(); head.position.set(0, 0.34, 0.8); head.scale.setScalar(HEAD_BIG); body.add(head);
  const hp = (geo, mat, sx, sy, sz, x, y, z, parent) => part(geo, mat, sx, sy, sz, x, y, z, parent || head);
  hp(g.ball, mats.fur, 0.21, 0.19, 0.22, 0, 0, 0);
  hp(g.ball, mats.fur, 0.1, 0.085, 0.22, 0, -0.035, 0.24);
  hp(g.ball, mats.dark, 0.045, 0.03, 0.19, 0, 0.035, 0.25);
  hp(g.ball, mats.nose, 0.05, 0.04, 0.045, 0, -0.012, 0.44);
  for (const s of [-1, 1]) {
    hp(g.ball, mats.belly, 0.055, 0.04, 0.16, s * 0.062, -0.078, 0.22);
    hp(g.cone, mats.dark, 0.07, 0.2, 0.05, s * 0.13, 0.22, -0.04).rotation.z = -s * 0.28;
    hp(g.cone, mats.belly, 0.04, 0.12, 0.03, s * 0.13, 0.2, -0.015).rotation.z = -s * 0.28;
    hp(g.ball, mats.deep, 0.095, 0.035, 0.11, s * 0.085, 0.105, 0.12).rotation.z = s * 0.5;
    hp(g.ball, mats.eyeGlow, 0.06, 0.06, 0.06, s * 0.09, 0.062, 0.15);
    hp(g.ball, mats.eyeCore, 0.032, 0.032, 0.032, s * 0.09, 0.062, 0.162);
    hp(g.cone, mats.fang, 0.024, 0.075, 0.024, s * 0.068, -0.115, 0.33).rotation.x = Math.PI;
    hp(g.cone, mats.fang, 0.014, 0.04, 0.014, s * 0.07, -0.1, 0.27).rotation.x = Math.PI;
    hp(g.cone, mats.mane, 0.045, 0.14, 0.04, s * 0.17, -0.02, 0.02).rotation.z = -s * 1.2;
    hp(g.cone, mats.mane, 0.04, 0.12, 0.04, s * 0.15, -0.09, 0).rotation.z = -s * 1.5;
  }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.075, 0.06); head.add(jaw);   // hàm dưới: xoay để há mõm
  hp(g.ball, mats.dark, 0.085, 0.045, 0.2, 0, -0.02, 0.15, jaw);
  hp(g.ball, mats.tongue, 0.045, 0.018, 0.14, 0, 0.012, 0.14, jaw);
  for (const s of [-1, 1]) hp(g.cone, mats.fang, 0.022, 0.06, 0.022, s * 0.05, 0.02, 0.26, jaw);
  hp(g.ball, mats.aura, 0.36, 0.32, 0.36, 0, 0.02, 0.05);   // quầng khí quanh đầu
  // bốn chân (đùi + cẳng + bàn + vuốt), mỗi chân một nhóm xoay ở hông
  const legs = [];
  for (const [x, z, off, front] of [[-0.2, 0.36, 0, true], [0.2, 0.36, Math.PI, true], [-0.2, -0.52, Math.PI, false], [0.2, -0.52, 0, false]]) {
    const hip = new THREE.Group(); hip.position.set(x, -0.04, z); body.add(hip);
    part(g.ball, mats.fur, 0.13, 0.15, 0.15, 0, -0.02, 0, hip);
    part(g.cone, mats.fur, 0.1, 0.24, 0.1, 0, -0.22, 0, hip).rotation.x = Math.PI;
    part(g.cone, mats.dark, 0.065, 0.22, 0.065, 0, -0.5, 0.02, hip).rotation.x = Math.PI;
    part(g.ball, mats.deep, 0.095, 0.05, 0.13, 0, -0.66, 0.05, hip);
    for (const cx of [-0.04, 0, 0.04]) part(g.cone, mats.claw, 0.014, 0.05, 0.014, cx, -0.67, 0.2, hip).rotation.x = Math.PI / 2;
    legs.push({ hip, off, front });
  }
  // đuôi lửa: thân đuôi + chỏm cam + hai ngọn lửa cộng sáng
  const tail = new THREE.Group(); tail.position.set(0, 0.1, -0.78); tail.rotation.x = 0.65; body.add(tail);
  part(g.cone, mats.fur, 0.12, 0.3, 0.12, 0, 0, -0.28, tail).rotation.x = -Math.PI / 2;
  part(g.cone, mats.mane, 0.1, 0.24, 0.1, 0, 0.03, -0.7, tail).rotation.x = -Math.PI / 2;
  for (const [y, z, k] of [[0.06, -0.62, 1], [0.1, -0.85, 0.8]]) { const f = part(g.cone, mats.flame, 0.17 * k, 0.36 * k, 0.17 * k, 0, y, z, tail); f.rotation.x = -Math.PI / 2; reg(f, flames); }
  for (let i = 0; i < 4; i++) { const f = part(g.cone, mats.flame, 0.1, 0.3, 0.1, 0, 0.44, 0.3 - i * 0.28); f.rotation.x = -0.4; reg(f, flames); }   // lửa dọc lưng
  const aura = part(g.ball, mats.aura, 0.55, 0.5, 1.05, 0, 0.05, 0.05);   // hào quang quanh thân
  // vệt khí phía sau khi phóng
  const trail = [];
  for (let i = 0; i < 7; i++) {
    const sm = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff9a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const sp = new THREE.Sprite(sm); sp.position.set(0, 0.1, -1.1 - i * 0.55); const k = 1.9 - i * 0.18; sp.scale.set(k, k, 1); root.add(sp); trail.push(sp); extra.push(sm);
  }
  scene.add(root);
  return { scene, root, body, head, jaw, legs, tail, spikes, flames, aura, trail, mats, extra, pos: { x: pos.x, y: pos.y, z: pos.z }, heading, range, remote: !!remote, t: 0, bitten: false };
}

const dispose = (w) => { w.scene.remove(w.root); for (const m of Object.values(w.mats)) m.dispose(); for (const m of w.extra) m.dispose(); };

function place(w) {
  const p = wolfPose(w.t, w.range), q = wolfPose(w.t + 0.03, w.range), t = w.t;
  const sc = WOLF.scale * (0.35 + 0.65 * p.grow) * (p.bite ? 1.12 : 1);
  const sx = Math.sin(w.heading), sz = Math.cos(w.heading);
  const reach = Math.max(START, w.range - MOUTH * WOLF.scale);   // chỗ thân dừng lại: mõm nhô ra trước sẽ chạm đúng mục tiêu
  const dd = START + (reach - START) * Math.min(1, p.dist / Math.max(0.01, w.range));
  w.root.position.set(w.pos.x + sx * dd, w.pos.y + H * sc + p.up, w.pos.z + sz * dd);
  w.root.rotation.set(0, w.heading, 0);
  w.root.scale.setScalar(sc);
  const dUp = q.up - p.up, dDist = Math.max(0.001, q.dist - p.dist), leap = Math.min(1, p.up / WOLF.leap);
  w.body.rotation.x = -Math.max(-0.7, Math.min(0.7, Math.atan2(dUp, dDist * 3)));   // mũi hếch lên khi vọt, chúi xuống khi hạ
  w.body.scale.set(1, 1, 1 + 0.1 * leap);                                               // thân vươn dài lúc bay
  w.jaw.rotation.x = p.jaw * 0.85;
  for (const l of w.legs) { const run = Math.sin(t * 26 + l.off) * 0.6, air = l.front ? -0.95 : 0.85; l.hip.rotation.x = run * (1 - leap) + air * leap; }   // chạy → duỗi trước/sau khi vọt
  w.tail.rotation.x = 0.65 + Math.sin(t * 10) * 0.12 + 0.3 * leap; w.tail.rotation.y = Math.sin(t * 14) * 0.3;
  w.spikes.forEach((s, i) => { s.scale.y = s.userData.sy * (1 + 0.14 * Math.sin(t * 20 + i * 1.3)); });
  w.flames.forEach((f, i) => { f.scale.y = f.userData.sy * (1 + 0.25 * Math.sin(t * 24 + i * 2.1)); });
  w.aura.scale.setScalar(1 + 0.05 * Math.sin(t * 12));
  const lungeK = p.k > WOLF.windup && p.k < WOLF.lungeEnd ? 1 : p.k >= WOLF.lungeEnd ? Math.max(0, 1 - (p.k - WOLF.lungeEnd) / 0.08) : 0;
  w.trail.forEach((sp, i) => { sp.material.opacity = 0.5 * (1 - i / 8) * lungeK * p.vis; });
  const v = p.vis;
  for (const [k, m] of Object.entries(w.mats)) m.opacity = (BASE_OP[k] === undefined ? 1 : BASE_OP[k]) * v;
  w.mats.eyeGlow.opacity = BASE_OP.eyeGlow * v * (0.8 + 0.2 * Math.sin(t * 16));
  return p;
}

// vòng sóng + tia lửa văng ra lúc ngoạm
function makeBurst(scene, x, y, z) {
  const g = geos();
  const mk = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const rings = [mk(0xffb02e, 0.9), mk(0xff5a00, 0.7)].map((mat, i) => { const m = new THREE.Mesh(g.ring, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.08 + i * 0.02, z); m.renderOrder = 7; m.visible = i === 0; scene.add(m); return m; });
  const sparks = [];
  for (let i = 0; i < 14; i++) {
    const sm = new THREE.SpriteMaterial({ map: glowTexture(), color: i % 3 ? 0xffd23a : 0xff7a00, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const sp = new THREE.Sprite(sm); sp.position.set(x, y + 0.5, z); scene.add(sp);
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 5; sparks.push({ sp, vx: Math.cos(a) * v, vy: 3 + Math.random() * 4, vz: Math.sin(a) * v });
  }
  return { scene, rings, sparks, t: 0, life: 0.6 };
}
function stepBurst(b, dt) {
  b.t += dt; const k = Math.min(1, b.t / b.life);
  b.rings.forEach((r, i) => { const kk = Math.max(0, Math.min(1, (b.t - i * 0.08) / b.life)); r.visible = kk > 0; r.scale.setScalar(0.5 + (5.5 - i * 1.5) * ease(kk)); r.material.opacity = (i ? 0.7 : 0.9) * (1 - kk); });
  for (const s of b.sparks) { s.vy -= 12 * dt; const p = s.sp.position; p.x += s.vx * dt; p.y = Math.max(0.05, p.y + s.vy * dt); p.z += s.vz * dt; const q = 0.75 * (1 - k) + 0.12; s.sp.scale.set(q, q, 1); s.sp.material.opacity = 1 - k; }
  return b.t >= b.life;
}
function disposeBurst(b) {
  for (const r of b.rings) { b.scene.remove(r); r.material.dispose(); }
  for (const s of b.sparks) { b.scene.remove(s.sp); s.sp.material.dispose(); }
}

/**
 * Bộ quản lý sói khí trong một cảnh. spawn(pos {x,y,z}, heading, range): thả một con tại `pos` (chân nhân vật), hướng `heading` (rad quanh y, 0 = +z), vồ xa `range` m.
 * update(dt): bay + dọn. Khi sói ngoạm: tiếng ngoạm + vòng sóng/tia lửa; nếu là sói của MÌNH thì gây sát thương lên quái trúng (js/ui/wolfHit.js). `onBite(w)` chỉ được gọi khi legacyBite = true (tiếng gỗ cũ của Phiên 224 đã được thay bằng tiếng ngoạm).
 * Trả false khi đang đủ `max` con.
 * remote = true (sói của NGƯỜI KHÁC, Phiên 224): không phát lại ra mạng và KHÔNG gây sát thương (máy chủ sói tự tính). Sói của MÌNH (remote = false) tự phát qua LGT.combatLink.sendWolf để mọi người cùng thấy.
 */
export function createWolfFx(scene, { onBite = null, max = WOLF.max, legacyBite = false } = {}) {
  const live = [], bursts = [];
  function bitten(w) {
    let hits = 0;
    if (!w.remote) hits = applyBite(w);   // chỉ sói của mình mới trừ máu quái
    try { wolfSfx.bite(w.remote ? true : hits > 0); } catch (_) { /* tiếng lỗi không làm hỏng hiệu ứng */ }
    try { bursts.push(makeBurst(scene, w.pos.x + Math.sin(w.heading) * w.range, w.pos.y, w.pos.z + Math.cos(w.heading) * w.range)); } catch (_) { /* hiệu ứng lỗi thì thôi */ }
    if (legacyBite && onBite) { try { onBite(w); } catch (_) { /* bỏ qua */ } }
  }
  return {
    get count() { return live.length; },
    get scene() { return scene; },
    spawn(pos, heading = 0, range = WOLF.rangeAir, remote = false) {
      if (!scene || !pos || live.length >= max) return false;
      const h = Number.isFinite(+heading) ? +heading : 0, r = Number.isFinite(+range) && +range > 0 ? +range : WOLF.rangeAir;
      const w = makeWolf(scene, pos, h, r, remote); live.push(w); place(w);
      try { wolfSfx.howl(remote ? 0.55 : 1); } catch (_) { /* tiếng lỗi không làm hỏng hiệu ứng */ }
      if (!remote) { try { const L = globalThis.LGT; if (L && L.combatLink && L.combatLink.sendWolf) L.combatLink.sendWolf(h, r); } catch (_) { /* phát lỗi không làm hỏng hiệu ứng của mình */ } }   // Phiên 224: sói của MÌNH → báo mọi người cùng thấy
      return true;
    },
    update(dt) {
      if (!live.length && !bursts.length) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = live.length - 1; i >= 0; i--) {
        const w = live[i]; w.t += step;
        if (w.t >= WOLF.life) { dispose(w); live.splice(i, 1); continue; }
        const p = place(w);
        if (p.bite && !w.bitten) { w.bitten = true; bitten(w); }
      }
      for (let i = bursts.length - 1; i >= 0; i--) if (stepBurst(bursts[i], step)) { disposeBurst(bursts[i]); bursts.splice(i, 1); }
    },
    clear() { while (live.length) dispose(live.pop()); while (bursts.length) disposeBurst(bursts.pop()); },
  };
}

try { startLocalDogs(); } catch (_) { /* bầy chó chạy theo lỗi thì thôi, không làm hỏng sói */ }   // Phiên 227: bầy chó khi cưỡi Gậy dạy chó (js/ui/dogPack.js)
