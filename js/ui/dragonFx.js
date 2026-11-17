// RỒNG HỒNG của Gậy như ý (Phiên 163; nâng cấp Phiên 227; TẠO HÌNH LẠI Phiên 228): bay quanh người khi cầm Gậy như ý và đánh thường đủ 3 đòn liên tiếp.
// Phiên 228 (yêu cầu ptg, theo ảnh rồng khớp 3D): rồng là KHÍ nên MỜ + NHÌN XUYÊN ĐƯỢC (mọi vật liệu trong suốt, không ghi độ sâu, không đổ bóng).
//   Dáng theo ảnh mẫu: thân vảy xếp lớp màu chuyển dần HỒNG (đầu) → CAM HỒNG → CAM (đuôi), bụng XANH BẠC HÀ; hàng gai lưng xòe quạt (to nhất ở giữa thân); đầu mõm dài, SỪNG HỒNG CHẺ NHÁNH, hai sợi RÂU LƯỢN SÓNG (một hồng, một vàng) đung đưa;
//   hai cặp chân nhỏ có vuốt; đuôi xòe như NGỌN LỬA HỒNG; thân uốn lượn như sóng khi bay; quầng sáng + sương khí hồng quanh đầu và dọc thân.
// Rồng bay TRÚNG quái thì quái mất máu thật (js/world/dragonMath.js + js/ui/dragonHit.js — chỉ rồng của MÌNH, rồng người khác chỉ để xem); trúng thì có tia sáng hồng + tiếng trúng; lúc hiện ra có tiếng gầm (js/ui/dragonSfx.js).
// Dựng bằng khối cầu / nón của three.js (không cần tệp mô hình). CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL) — độ mờ (userData.base của từng vật liệu), màu, kích thước là số TẠM, chỉnh trong makeDragon / DRAGON / DHIT.
import * as THREE from 'three';
import { glowTexture } from './staffMesh.js';
import { dragonSfx } from './dragonSfx.js';
import { applyDragonHit } from './dragonHit.js';

export const DRAGON = Object.freeze({ hits: 3, gap: 3.0, life: 2.8, segs: 30, spacing: 0.05, fadeIn: 0.35, fadeOut: 0.6, max: 2, speed: 3.4, radius: 2.4 });

const BANDS = 6;   // thân chia 6 dải màu chuyển dần hồng → cam (dùng chung vật liệu theo dải để ít vật liệu)
const cc = (h) => new THREE.Color(h);
const bodyAt = (f) => (f < 0.5 ? cc(0xff4fa8).lerp(cc(0xff8a8a), f * 2) : cc(0xff8a8a).lerp(cc(0xffb060), (f - 0.5) * 2));   // hồng → hồng cam → cam

let G = null;
const geos = () => G || (G = { ball: new THREE.SphereGeometry(1, 12, 8), cone: new THREE.ConeGeometry(1, 2, 7) });

/** Điểm trên quỹ đạo (toạ độ so với tâm người chơi) tại giây t của con rồng k = { ph, dir, R }. t có thể âm (đốt đuôi). */
export function pathAt(t, k) {
  const a = k.ph + k.dir * t * DRAGON.speed;
  const R = k.R + 0.35 * Math.sin(t * 2.1 + k.ph) + 1.3 * Math.min(1, Math.max(0, t) / 1.5);   // Phiên 227: vòng bay mở rộng dần để quét tới quái
  return [Math.cos(a) * R, 1.15 + 0.55 * Math.sin(t * 2.6 + k.ph * 0.5) + 0.12 * Math.max(0, t), Math.sin(a) * R];
}
const smooth = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
const wave = (ti) => 0.12 * Math.sin(ti * 6.5);   // Phiên 228: sóng uốn lượn chạy dọc thân (theo thời gian của từng đốt)

function makeDragon(scene, center, ry, flip) {
  const g = geos(), root = new THREE.Group(); root.renderOrder = 6;
  const mats = {};
  // MỜ + XUYÊN: tất cả trong suốt, depthWrite tắt; userData.base = độ đặc tối đa (nhân với độ hiện vis trong place). Muốn mờ hơn nữa → giảm số base.
  const mk = (key, color, base, add) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }); m.userData.base = base; mats[key] = m; return m; };
  const sp = (key, color, base) => { const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.base = base; mats[key] = m; return m; };
  mk('head', 0xff3f9f, 0.55); mk('snout', 0xffa0c8, 0.5); mk('jaw', 0x9ff0c8, 0.45);
  mk('horn', 0xff7fc4, 0.6); mk('eye', 0xffffff, 0.9, true); mk('fang', 0xfff6e8, 0.7); mk('pearl', 0xfff0fa, 0.85, true);
  mk('belly', 0x9ff0c8, 0.34); mk('finP', 0xff6fb8, 0.36); mk('finO', 0xffb070, 0.34);
  mk('leg', 0x8ff0c0, 0.4); mk('claw', 0xffe27a, 0.6); mk('fire', 0xff7fc8, 0.5, true);
  mk('whP', 0xff6fc0, 0.75, true); mk('whY', 0xffe45a, 0.75, true);
  for (let b = 0; b < BANDS; b++) { const c = bodyAt((b + 0.5) / BANDS); mk('bk' + b, c, 0.4); mk('bl' + b, c.clone().lerp(cc(0xffffff), 0.3), 0.36); }   // bk = vảy lưng, bl = vảy sáng hơn xen kẽ
  sp('aura', 0xff5fae, 0.3); sp('haze', 0xffb0d8, 0.18);
  const part = (geo, mat, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x || 0, y || 0, z || 0); m.renderOrder = 6; return m; };
  const segs = [], whisk = [], N = DRAGON.segs;
  for (let i = 0; i < N; i++) {
    const sg = new THREE.Group(), f = i / (N - 1), r = i === 0 ? 0.36 : 0.27 * (1 - 0.7 * Math.pow(f, 1.5)) + 0.06;
    if (i === 0) {   // đầu: sọ, mõm dài, hàm, nanh, ngọc, mắt, sừng hồng chẻ nhánh, bờm, hai râu lượn sóng
      sg.add(part(g.ball, mats.head, r * 1.2, r * 1.0, r * 1.45));
      sg.add(part(g.ball, mats.snout, r * 0.7, r * 0.52, r * 1.15, 0, -r * 0.12, r * 1.35));       // mõm dài
      sg.add(part(g.ball, mats.jaw, r * 0.6, r * 0.2, r * 1.0, 0, -r * 0.55, r * 1.2));            // hàm dưới xanh bạc hà
      sg.add(part(g.ball, mats.pearl, r * 0.3, r * 0.3, r * 0.3, 0, -r * 0.05, r * 2.3));        // ngọc sáng ở mõm
      sg.add(part(g.ball, mats.head, r * 0.95, r * 0.26, r * 0.5, 0, r * 0.5, r * 0.55));         // gờ mày
      for (const s of [-1, 1]) {
        sg.add(part(g.ball, mats.eye, r * 0.22, r * 0.22, r * 0.22, s * r * 0.58, r * 0.3, r * 0.65));   // mắt
        for (const [z, h] of [[r * 1.7, 0.5], [r * 1.25, 0.38]]) { const fang = part(g.cone, mats.fang, r * 0.08, r * h, r * 0.08, s * r * 0.34, -r * 0.4, z); fang.rotation.x = Math.PI; sg.add(fang); }   // nanh
        const horn = part(g.cone, mats.horn, r * 0.2, r * 1.2, r * 0.2, s * r * 0.45, r * 1.2, -r * 0.45); horn.rotation.x = -0.8; horn.rotation.z = -s * 0.3; sg.add(horn);               // sừng chính (hồng)
        const b1 = part(g.cone, mats.horn, r * 0.12, r * 0.65, r * 0.12, s * r * 0.7, r * 1.8, -r * 0.9); b1.rotation.x = -1.1; b1.rotation.z = -s * 0.8; sg.add(b1);                      // nhánh sừng 1
        const b2 = part(g.cone, mats.horn, r * 0.1, r * 0.5, r * 0.1, s * r * 0.55, r * 2.2, -r * 1.4); b2.rotation.x = -1.3; b2.rotation.z = -s * 0.35; sg.add(b2);                      // nhánh sừng 2
      }
      for (let j = 0; j < 5; j++) { const t = part(g.cone, mats.finP, r * 0.22, r * (0.9 + 0.12 * j), r * 0.22, (j - 2) * r * 0.34, r * 0.55 - Math.abs(j - 2) * r * 0.12, -r * 0.9); t.rotation.x = -Math.PI / 2 - 0.35; sg.add(t); }   // bờm sau đầu
      const WL = 11;   // hai sợi râu lượn sóng: chuỗi hạt nhỏ, đung đưa trong place(); trái hồng, phải vàng như ảnh mẫu
      for (const [s, key] of [[-1, 'whP'], [1, 'whY']]) for (let j = 0; j < WL; j++) {
        const q = 1 - (j / WL) * 0.5, m = part(g.ball, mats[key], r * 0.055 * q, r * 0.055 * q, r * 0.16); sg.add(m);
        whisk.push({ m, s, j, r, bx: s * (r * 0.55 + j * r * 0.13), by: -r * 0.05 - j * r * 0.03, bz: r * 2.0 + j * r * 0.3 });
      }
      const au = new THREE.Sprite(mats.aura); au.scale.set(2.3, 2.3, 1); au.position.z = r * 0.4; sg.add(au);   // hào quang quanh đầu
    } else {
      const bi = Math.min(BANDS - 1, Math.floor(f * BANDS));
      sg.add(part(g.ball, mats.belly, r * 0.95, r * 0.75, r * 1.3, 0, -r * 0.3, 0));                       // bụng xanh bạc hà
      sg.add(part(g.ball, i % 2 ? mats['bl' + bi] : mats['bk' + bi], r, r * 0.9, r * 1.3, 0, r * 0.1, 0));   // lưng (hồng → cam)
      const fh = r * (0.9 + 1.2 * Math.sin(Math.PI * Math.min(1, f * 1.25))), fin = f < 0.55 ? mats.finP : mats.finO;   // gai lưng to nhất ở giữa thân
      if (i % 2 === 0) {
        for (const s of [-1, 1]) sg.add(part(g.ball, mats['bl' + bi], r * 0.4, r * 0.5, r * 0.75, s * r * 0.78, 0, 0));   // vảy hai bên
        const c0 = part(g.cone, fin, r * 0.34, fh, r * 0.34, 0, r * 0.95, 0); c0.rotation.x = -0.5; sg.add(c0);   // gai lưng xòe quạt: giữa + hai bên
        for (const s of [-1, 1]) { const c1 = part(g.cone, fin, r * 0.24, fh * 0.7, r * 0.24, s * r * 0.5, r * 0.8, 0); c1.rotation.x = -0.45; c1.rotation.z = -s * 0.55; sg.add(c1); }
      } else { const c2 = part(g.cone, fin, r * 0.22, fh * 0.55, r * 0.22, 0, r * 0.95, 0); c2.rotation.x = -0.5; sg.add(c2); }
      if (i === 6 || i === 20) {   // hai cặp chân nhỏ có vuốt
        for (const s of [-1, 1]) {
          const leg = part(g.cone, mats.leg, r * 0.18, r * 1.1, r * 0.18, s * r * 0.9, -r * 0.9, 0); leg.rotation.z = Math.PI + s * 0.5; sg.add(leg);
          sg.add(part(g.cone, mats.claw, r * 0.1, r * 0.35, r * 0.1, s * r * 1.4, -r * 1.9, 0));
        }
      }
      if (i % 3 === 1) { const hz = new THREE.Sprite(mats.haze); hz.scale.set(1.1, 1.1, 1); sg.add(hz); }   // sương khí dọc thân
      if (i === N - 1) {   // đuôi xòe như ngọn lửa hồng
        for (let j = -2; j <= 2; j++) {
          const gr = new THREE.Group(); gr.rotation.y = j * 0.38; const sy = 0.5 + 0.18 * (2 - Math.abs(j));
          const fl = part(g.cone, mats.fire, 0.15, sy, 0.15, 0, 0, -sy); fl.rotation.x = -Math.PI / 2; gr.add(fl); sg.add(gr);
        }
        const ta = new THREE.Sprite(mats.aura); ta.scale.set(1.6, 1.6, 1); ta.position.z = -0.3; sg.add(ta);
      }
    }
    root.add(sg); segs.push(sg);
  }
  scene.add(root);
  const k = { ph: Math.PI / 2 - ry + (flip ? Math.PI : 0), dir: flip ? -1 : 1, R: DRAGON.radius };
  return { scene, root, segs, whisk, mats, k, t: 0, head: { x: center.x, y: center.y, z: center.z }, rec: new Map() };
}

const Q = new THREE.Vector3();
function place(d, center) {
  const { t, k } = d, L = DRAGON.life, up = smooth(t / DRAGON.fadeIn), down = 1 - smooth((t - (L - DRAGON.fadeOut)) / DRAGON.fadeOut), vis = Math.min(up, down);
  for (const m of Object.values(d.mats)) m.opacity = (m.userData.base === undefined ? 1 : m.userData.base) * vis;
  const grow = 0.4 + 0.6 * vis;
  for (let i = 0; i < d.segs.length; i++) {
    const ti = t - i * DRAGON.spacing, a = pathAt(ti, k), b = pathAt(ti + 0.04, k), s = d.segs[i];
    s.position.set(center.x + a[0], center.y + a[1] + wave(ti) * grow, center.z + a[2]); s.scale.setScalar(grow);
    Q.set(center.x + b[0], center.y + b[1] + wave(ti + 0.04) * grow, center.z + b[2]); s.lookAt(Q);
  }
  for (const w of d.whisk) {   // râu lượn sóng đung đưa
    const amp = w.r * 0.22 * (0.25 + w.j / 11), ph = t * 8 + w.j * 0.85 + (w.s > 0 ? 1.7 : 0);
    w.m.position.set(w.bx + Math.sin(ph) * amp, w.by + Math.cos(ph * 0.8) * amp * 0.7, w.bz);
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
