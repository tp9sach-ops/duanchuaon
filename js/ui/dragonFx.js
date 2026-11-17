// RỒNG HỒNG của Gậy như ý (Phiên 163; NÂNG CẤP Phiên 227): bay quanh người khi cầm Gậy như ý và đánh thường đủ 3 đòn liên tiếp.
// Phiên 227: rồng TO hơn (30 đốt, thân dày), màu hồng ĐẬM có đổ bóng (vật liệu Standard + tự phát sáng nhẹ, bụng hồng nhạt), đầu dữ hơn (sừng chẻ nhánh vàng, nanh, râu dài, bờm cháy, ngọc sáng ở mõm, mắt rực), gai lưng vàng lớn,
//   hào quang hồng quanh đầu, đuôi bốc lửa hồng, vòng bay mở rộng dần để quét tới quái quanh người; rồng bay TRÚNG quái thì quái mất máu thật (js/world/dragonMath.js + js/ui/dragonHit.js — chỉ rồng của MÌNH, rồng người khác chỉ để xem),
//   mỗi lần trúng có tia sáng hồng bắn ra + tiếng trúng; lúc hiện ra có tiếng gầm (js/ui/dragonSfx.js).
// Dựng bằng khối cầu / nón của three.js (không cần tệp mô hình). CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — số liệu là TẠM, chỉnh trong DRAGON / DHIT.
import * as THREE from 'three';
import { glowTexture } from './staffMesh.js';
import { dragonSfx } from './dragonSfx.js';
import { applyDragonHit } from './dragonHit.js';

export const DRAGON = Object.freeze({ hits: 3, gap: 3.0, life: 2.8, segs: 30, spacing: 0.05, fadeIn: 0.35, fadeOut: 0.6, max: 2, speed: 3.4, radius: 2.4 });
const C = { body: 0xff2f8f, belly: 0xffb0d6, head: 0xd81b6b, gold: 0xffd24a, eye: 0xffffff, mane: 0xff1f8e, fang: 0xfffbf0, fire: 0xff6fc0, aura: 0xff5fae, pearl: 0xffe6f4 };
const BASE = { body: 1, belly: 1, head: 1, gold: 1, eye: 1, mane: 0.95, fang: 1, fire: 0.75, aura: 0.5, pearl: 0.9 };

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 2, 8) });

/** Điểm trên quỹ đạo (toạ độ so với tâm người chơi) tại giây t của con rồng k = { ph, dir, R }. t có thể âm (đốt đuôi). */
export function pathAt(t, k) {
  const a = k.ph + k.dir * t * DRAGON.speed;
  const R = k.R + 0.35 * Math.sin(t * 2.1 + k.ph) + 1.3 * Math.min(1, Math.max(0, t) / 1.5);   // Phiên 227: vòng bay mở rộng dần để quét tới quái
  return [Math.cos(a) * R, 1.15 + 0.55 * Math.sin(t * 2.6 + k.ph * 0.5) + 0.12 * Math.max(0, t), Math.sin(a) * R];
}
const smooth = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

function makeDragon(scene, center, ry, flip) {
  const g = geos(), root = new THREE.Group(); root.renderOrder = 6;
  const solid = (c, em) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: em, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0 });
  const add = (c, extra) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, ...(extra || {}) });
  const spr = (c) => new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const mats = { body: solid(C.body, 0.45), belly: solid(C.belly, 0.5), head: solid(C.head, 0.4), gold: solid(C.gold, 0.7), eye: solid(C.eye, 0.8), mane: solid(C.mane, 0.9), fang: solid(C.fang, 0.6), fire: add(C.fire), aura: spr(C.aura), pearl: add(C.pearl) };
  const part = (geo, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x || 0, y || 0, z || 0); m.renderOrder = 6; return m; };
  const segs = [], N = DRAGON.segs;
  for (let i = 0; i < N; i++) {
    const sg = new THREE.Group(), f = i / (N - 1), r = i === 0 ? 0.34 : 0.27 * (1 - 0.7 * Math.pow(f, 1.5)) + 0.06;
    if (i === 0) {   // đầu: sọ, mõm, hàm, nanh, ngọc, mắt, sừng chẻ nhánh, râu, bờm
      sg.add(part(g.ball, mats.head, r * 1.25, r * 1.0, r * 1.4));
      sg.add(part(g.ball, mats.body, r * 0.7, r * 0.55, r * 0.95, 0, -r * 0.1, r * 1.2));       // mõm
      sg.add(part(g.ball, mats.belly, r * 0.62, r * 0.22, r * 0.95, 0, -r * 0.55, r * 1.05));  // hàm dưới
      sg.add(part(g.ball, mats.pearl, r * 0.32, r * 0.32, r * 0.32, 0, -r * 0.05, r * 2.0));   // ngọc sáng ở mõm
      sg.add(part(g.ball, mats.head, r * 0.95, r * 0.28, r * 0.5, 0, r * 0.52, r * 0.55));     // gờ mày dữ
      for (const s of [-1, 1]) {
        sg.add(part(g.ball, mats.eye, r * 0.24, r * 0.24, r * 0.24, s * r * 0.58, r * 0.3, r * 0.65));   // mắt
        for (const [z, h] of [[r * 1.5, 0.55], [r * 1.05, 0.4]]) { const fang = part(g.cone, mats.fang, r * 0.09, r * h, r * 0.09, s * r * 0.36, -r * 0.4, z); fang.rotation.x = Math.PI; sg.add(fang); }   // nanh
        const horn = part(g.cone, mats.gold, r * 0.24, r * 1.1, r * 0.24, s * r * 0.5, r * 1.1, -r * 0.4); horn.rotation.x = -0.95; horn.rotation.z = -s * 0.28; sg.add(horn);                            // sừng chính
        const br = part(g.cone, mats.gold, r * 0.14, r * 0.6, r * 0.14, s * r * 0.82, r * 1.4, -r * 0.8); br.rotation.x = -1.2; br.rotation.z = -s * 0.7; sg.add(br);                                   // nhánh sừng
        const whisk = part(g.cone, mats.gold, r * 0.06, r * 2.6, r * 0.06, s * r * 0.75, -r * 0.1, r * 1.1); whisk.rotation.z = s * 1.25; whisk.rotation.x = 0.6; sg.add(whisk);                        // râu dài
      }
      for (let j = 0; j < 5; j++) { const t = part(g.cone, mats.mane, r * 0.22, r * (0.9 + 0.12 * j), r * 0.22, (j - 2) * r * 0.34, r * 0.55 - Math.abs(j - 2) * r * 0.12, -r * 0.9); t.rotation.x = -Math.PI / 2 - 0.35; sg.add(t); }   // bờm cháy sau đầu
      const au = new THREE.Sprite(mats.aura); au.scale.set(2.3, 2.3, 1); au.position.z = r * 0.4; sg.add(au);   // hào quang quanh đầu
    } else {
      sg.add(part(g.ball, i % 2 ? mats.belly : mats.body, r, r, r * 1.25));
      if (i % 2 === 0) sg.add(part(g.cone, mats.gold, r * 0.5, r * 1.05, r * 0.5, 0, r * 1.05, 0));    // gai lưng vàng lớn
      if (i % 4 === 1 && i < N - 6) { const fn = part(g.cone, mats.mane, r * 0.3, r * 0.9, r * 0.3, 0, -r * 0.9, 0); fn.rotation.x = Math.PI; sg.add(fn); }   // vây bụng
      if (i === N - 1) {   // đuôi bốc lửa hồng
        for (const [y, z, k] of [[0.02, -0.15, 1], [0.1, -0.4, 0.8], [0.04, -0.6, 0.6]]) { const fl = part(g.cone, mats.fire, 0.2 * k, 0.55 * k, 0.2 * k, 0, y, z); fl.rotation.x = -Math.PI / 2; sg.add(fl); }
        const ta = new THREE.Sprite(mats.aura); ta.scale.set(1.6, 1.6, 1); ta.position.z = -0.2; sg.add(ta);
      }
    }
    root.add(sg); segs.push(sg);
  }
  scene.add(root);
  const k = { ph: Math.PI / 2 - ry + (flip ? Math.PI : 0), dir: flip ? -1 : 1, R: DRAGON.radius };
  return { scene, root, segs, mats, k, t: 0, head: { x: center.x, y: center.y, z: center.z }, rec: new Map() };
}

const Q = new THREE.Vector3();
function place(d, center) {
  const { t, k } = d, L = DRAGON.life, up = smooth(t / DRAGON.fadeIn), down = 1 - smooth((t - (L - DRAGON.fadeOut)) / DRAGON.fadeOut), vis = Math.min(up, down);
  for (const [key, m] of Object.entries(d.mats)) m.opacity = (BASE[key] === undefined ? 1 : BASE[key]) * vis;
  const grow = 0.4 + 0.6 * vis;
  for (let i = 0; i < d.segs.length; i++) {
    const ti = t - i * DRAGON.spacing, a = pathAt(ti, k), b = pathAt(ti + 0.04, k), s = d.segs[i];
    s.position.set(center.x + a[0], center.y + a[1], center.z + a[2]); s.scale.setScalar(grow);
    Q.set(center.x + b[0], center.y + b[1], center.z + b[2]); s.lookAt(Q);
  }
  const h = d.segs[0].position; d.head.x = h.x; d.head.y = h.y; d.head.z = h.z;
  return vis;
}

// tia sáng hồng bắn ra khi rồng trúng quái
function makeBurst(scene, x, y, z) {
  const mk = (c) => new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const flash = new THREE.Sprite(mk(0xffd0ea)); flash.position.set(x, y, z); scene.add(flash);
  const sparks = [];
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Sprite(mk(i % 3 ? 0xff5fae : 0xffe08a)); sp.position.set(x, y, z); scene.add(sp);
    const a = Math.random() * Math.PI * 2, v = 2.5 + Math.random() * 4; sparks.push({ sp, vx: Math.cos(a) * v, vy: 1 + Math.random() * 3.5, vz: Math.sin(a) * v });
  }
  return { scene, flash, sparks, t: 0, life: 0.5 };
}
function stepBurst(b, dt) {
  b.t += dt; const k = Math.min(1, b.t / b.life);
  const fs = 0.6 + 2.8 * (1 - (1 - k) * (1 - k)); b.flash.scale.set(fs, fs, 1); b.flash.material.opacity = 0.9 * (1 - k);
  for (const s of b.sparks) { s.vy -= 9 * dt; const p = s.sp.position; p.x += s.vx * dt; p.y = Math.max(0.05, p.y + s.vy * dt); p.z += s.vz * dt; const q = 0.5 * (1 - k) + 0.1; s.sp.scale.set(q, q, 1); s.sp.material.opacity = 1 - k; }
  return b.t >= b.life;
}
function disposeBurst(b) {
  b.scene.remove(b.flash); b.flash.material.dispose();
  for (const s of b.sparks) { b.scene.remove(s.sp); s.sp.material.dispose(); }
}

/** Bộ quản lý rồng trong một cảnh. spawn(center, ry): thả một con rồng quanh `center` (Vector3 vị trí nhân vật), `ry` = hướng mặt nhân vật. update(dt, center): bay + dọn + (rồng của mình) gây sát thương. */
export function createDragonFx(scene, max = DRAGON.max) {   // Phiên 223: max riêng (bộ rồng của người khác cho nhiều con cùng lúc)
  const live = [], bursts = []; let flip = false;
  const drop = (d) => { d.scene.remove(d.root); for (const m of Object.values(d.mats)) m.dispose(); };
  return {
    get count() { return live.length; },
    get scene() { return scene; },
    /** track (tùy chọn, Phiên 223): vị trí SỐNG của một người chơi khác (vd avatar.group.position) — rồng bám theo người đó, không cần truyền center vào update. */
    spawn(center, ry = 0, track = null) {
      if (!scene || !center || live.length >= max) return false;
      flip = !flip; const d = makeDragon(scene, center, ry, flip); d.track = track || null; live.push(d); place(d, track || center);
      try { dragonSfx.roar(track ? 0.5 : 1); } catch (_) { /* tiếng lỗi không làm hỏng hiệu ứng */ }
      if (!track) { try { const L = globalThis.LGT; if (L && L.combatLink && L.combatLink.sendDragon) L.combatLink.sendDragon(ry); } catch (_) { /* phát lỗi không làm hỏng hiệu ứng của mình */ } }   // Phiên 223: rồng của MÌNH (không có track) → báo mọi người cùng thấy; rồng người khác (có track) thì không phát lại
      return true;
    },
    update(dt, center) {
      if (!live.length && !bursts.length) return;
      const step = Math.max(0, Math.min(0.1, +dt || 0));
      for (let i = live.length - 1; i >= 0; i--) {
        const d = live[i]; d.t += step;
        if (d.t >= DRAGON.life) { drop(d); live.splice(i, 1); continue; }
        const c = d.track || center; if (!c) continue;
        const vis = place(d, c);
        if (!d.track && vis > 0.5) {   // Phiên 227: chỉ rồng của MÌNH gây sát thương (rồng người khác có track, chỉ để xem)
          const r = applyDragonHit(d.head, d.t, d.rec, c);
          if (r.n > 0) { try { dragonSfx.hit(); } catch (_) { /* tiếng lỗi thì thôi */ } for (const p of r.pts) { try { bursts.push(makeBurst(scene, p.x, p.y, p.z)); } catch (_) { /* hiệu ứng lỗi thì thôi */ } } }
        }
      }
      for (let i = bursts.length - 1; i >= 0; i--) if (stepBurst(bursts[i], step)) { disposeBurst(bursts[i]); bursts.splice(i, 1); }
    },
    clear() { while (live.length) drop(live.pop()); while (bursts.length) disposeBurst(bursts.pop()); },
  };
}

/** Đếm đòn đánh thường liên tiếp: trả { hits, fire } — fire = true khi vừa đủ DRAGON.hits đòn (mỗi đòn cách đòn trước ≤ DRAGON.gap giây). Hàm thuần, now = giây. */
export function countHit(state, now) {
  const s = state || { hits: 0, last: -1e9 };
  const hits = now - s.last > DRAGON.gap ? 1 : s.hits + 1, fire = hits >= DRAGON.hits;
  return { hits: fire ? 0 : hits, last: now, fire };
}
