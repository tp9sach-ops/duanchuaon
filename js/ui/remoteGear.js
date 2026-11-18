// Phiên 166 (mục 1, lộ trình 14/11): VẼ ĐỒ CỦA NGƯỜI KHÁC — gậy như ý, nón Jingasa, cưỡi thương/gậy/ván, hào quang bánh sầu riêng.
// Trước đây chỉ máy người mua mới vẽ (js/ui/items.js + js/ui/board.js bọc avatar của CHÍNH MÌNH); nhân vật người khác (js/net/room.js → createAvatar) không có gì nên không ai thấy.
// Dữ liệu đến từ gói tin mạng (trường `i`, js/world/gearSync.js). Dùng: const gv = createGearView(); roomClient deps: applyGear: (av, tok, dt) => gv.apply(av, tok, dt), dropGear: (av) => gv.drop(av).
// apply() gọi MỖI KHUNG HÌNH SAU av.update(dt) (roomClient đặt lại vị trí mỗi khung nên cộng độ cao khi cưỡi không bị dồn lại).
// Phiên 227: người khác cưỡi Gậy dạy chó thì CŨNG có bầy chó chạy theo (js/ui/dogPack.js) — dùng sẵn trường cưỡi `ride === 'tre'` trong gói tin, không thêm gói mạng; xuống gậy thì chó mờ dần rồi biến mất.
// Chưa đồng bộ (làm sau): vòng sáng lan + rồng hồng khi đánh (cần gói tin "đang vung"), ván GLB 3D (người khác dùng ván khối), thương cưỡi hạ xuống mượt khi vào trận.
// CHƯA nhìn bằng mắt trên máy thật (môi trường AI không có WebGL): vị trí/độ sáng dùng đúng số của đồ mình tự mang (STAFF_SCALE, HAT_POS, FLY_LIFT...).
import * as THREE from 'three';
import { decodeGear } from '../world/gearSync.js';
import { kitOf } from './weaponKit.js';   // Phiên 224: gậy phát sáng theo bảng KIT (nhuy / tre)
import { buildBambooMount, pulseBamboo } from './bambooMesh.js';
import { buildBroomMount, pulseBroom } from './broomMesh.js';   // Phiên 230: Chổi
import { buildHat, HAT_POS } from './hatMesh.js';
import { applySlippers } from './slipperMesh.js';   // Phiên 233: dép lào khi dùng chổi
import { buildSpearMount, buildStaffMount, buildProcBoard, FLY_LIFT, FLY_BOB, VBOB, VBASE } from './board.js';
import { createDogPack } from './dogPack.js';   // Phiên 227: bầy chó chạy theo người cưỡi Gậy dạy chó

const AURA = { regen: { color: 0x7dffb0, r0: 0.55, r1: 0.78 }, revive: { color: 0x7fd0ff, r0: 0.86, r1: 1.04 } };   // Bánh 3 vị: vòng xanh lá nhỏ · Bánh pho mai than tre: vòng xanh trời lớn

function disposeTree(o) {   // chỉ giải phóng hình khối + chất liệu của chính đồ này (texture ánh sáng dùng chung thì KHÔNG hủy)
  if (!o) return;
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    const m = c.material; if (m) for (const x of Array.isArray(m) ? m : [m]) x.dispose();
  });
}

/** Tìm nhóm cây côn của nhân vật chibi (giống js/ui/items.js wrapAvatar). */
function findHandHost(av) {
  let host = null; av.group.traverse((o) => { if (!host && o.isBone && o.name === 'handR') host = o.children.find((c) => c.isGroup && c.rotation.order === 'YXZ') || null; });   // Phiên 204: group nhân vật cũng 'YXZ' → tìm trong bàn tay phải
  if (!host) av.group.traverse((o) => { if (!host && o !== av.group && o.isGroup && o.rotation.order === 'YXZ' && o.children.length >= 4) host = o; });
  return host;
}

export function createGearView() {
  function init(av) {
    const hand = findHandHost(av), back = av.backHost || null;
    const s = {
      clock: 0, lift: 0,
      hand: hand ? { host: hand, orig: hand.children.slice(), mesh: null } : null,     // cây gậy trên tay (chỉ hiện khi người đó vào thế đánh; hiện chưa đồng bộ nên thường ẩn)
      back: back ? { host: back, orig: back.children.slice(), mesh: null } : null,     // gậy thu gọn đeo sau lưng
      hat: null, slip: {}, mounts: null, auras: {}, dogs: null,
    };
    av.__rg = s; return s;
  }

  // Phiên 224: kind = 'nhuy' | 'tre' | '' (không cầm gậy phát sáng); đổi gậy thì dựng lại cây mới.
  function swapStaff(slot, kind, scaleMul, clock) {
    if (!slot) return;
    const kit = kitOf(kind);
    if (slot.mesh && (!kit || slot.kind !== kit.id)) {
      slot.host.remove(slot.mesh); if (slot.kind !== 'tre' && slot.kind !== 'choi') disposeTree(slot.mesh); slot.mesh = null; slot.kind = '';   // gậy dạy chó / chổi nhân bản chung hình khối → không hủy
      if (!kit) for (const c of slot.orig) c.visible = true;       // trả cây côn mặc định
    }
    if (kit && !slot.mesh) {
      for (const c of slot.orig) c.visible = false;
      slot.mesh = kit.build(); slot.kind = kit.id; slot.mesh.scale.setScalar(kit.scale * scaleMul); slot.host.add(slot.mesh); kit.load(slot.mesh);
    }
    if (slot.mesh) kitOf(slot.kind).pulse(slot.mesh, clock, false);
  }

  function ensureMounts(av, s) {
    if (s.mounts) return s.mounts;
    const van = new THREE.Group(); van.name = 'cuoi-van'; const proc = buildProcBoard(); van.add(proc);
    s.mounts = { thuong: buildSpearMount(), nhuy: buildStaffMount(), tre: buildBambooMount(2.6), choi: buildBroomMount(2.6), van };   // 2.6 = SLEN của js/ui/board.js
    for (const k of Object.keys(s.mounts)) { s.mounts[k].visible = false; av.group.add(s.mounts[k]); }
    return s.mounts;
  }

  function aura(av, s, key, on, dt) {
    let a = s.auras[key];
    if (on && !a) {
      const cfg = AURA[key], mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.RingGeometry(cfg.r0, cfg.r1, 48), mat); m.rotation.x = -Math.PI / 2; m.position.y = 0.06; m.renderOrder = 4; av.group.add(m);
      a = s.auras[key] = { m, k: 0, cfg };
    }
    if (!a) return;
    a.k += ((on ? 1 : 0) - a.k) * Math.min(1, 6 * dt);                     // hiện / tắt mượt
    const w = 0.5 + 0.5 * Math.sin(s.clock * (key === 'regen' ? 3.2 : 1.8));
    a.m.material.opacity = a.k * (0.35 + 0.35 * w); a.m.scale.setScalar(0.92 + 0.14 * w);
    if (!on && a.k < 0.02) { av.group.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); delete s.auras[key]; }
  }

  /** Vẽ đồ cho nhân vật người khác theo chuỗi `tok` (từ mạng). Gọi mỗi khung hình sau av.update(dt). */
  function apply(av, tok, dt) {
    if (!av || !av.group) return;
    const g = decodeGear(tok); let s = av.__rg;
    if (!s) { if (!tok) return; s = init(av); }                              // chưa từng có đồ và hiện không có đồ: khỏi tốn gì
    s.clock += dt;

    const held = g.staff ? 'nhuy' : g.bamboo ? 'tre' : g.broom ? 'choi' : '';   // Phiên 224: cầm Gậy như ý hoặc Gậy dạy chó
    swapStaff(s.hand, held, 1, s.clock);
    swapStaff(s.back, held, 0.7, s.clock);

    applySlippers(av, s.slip, !!g.broom || g.ride === 'choi');   // Phiên 233: người khác dùng chổi (cầm hoặc cưỡi) cũng mang dép lào
    const head = av.headHost;
    if (head) {
      if (g.hat && !s.hat) { s.hat = buildHat(); s.hat.position.set(HAT_POS.x, HAT_POS.y, HAT_POS.z); head.add(s.hat); if (av.setHat) av.setHat(true); }
      else if (!g.hat && s.hat) { head.remove(s.hat); s.hat = null; if (av.setHat) av.setHat(false); }   // nón dùng chung hình khối đã nạp → không hủy
    }

    // Cưỡi: đồ hiện dưới chân, người nâng lên (cùng số với js/ui/board.js)
    const isVan = g.ride === 'van';
    if (g.ride || s.mounts) {
      const M = ensureMounts(av, s);
      const want = g.ride ? (isVan ? VBASE : FLY_LIFT) + Math.sin(s.clock * (isVan ? 9 : 3)) * (isVan ? VBOB : FLY_BOB) : 0;
      s.lift += (want - s.lift) * Math.min(1, 14 * dt);
      for (const k of Object.keys(M)) M[k].visible = false;
      const m = g.ride ? M[g.ride] : null;
      if (m) { m.visible = true; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.setScalar(1); }
      if (g.ride === 'tre' && m) {                                            // Phiên 224: gậy dạy chó cưỡi: chớp vàng đều + vệt vàng
        pulseBamboo(m.userData.staff, s.clock, true);
        m.userData.trail.forEach((sp, i) => { sp.material.opacity = Math.max(0, 0.55 - i * 0.055) * (0.7 + 0.3 * Math.sin(s.clock * 10 + i)); });
      }
      if (g.ride === 'choi' && m) {                                           // Phiên 230: chổi cưỡi: đầu chổi đưa nhẹ + vệt bụi rơm
        pulseBroom(m.userData.staff, s.clock, true);
        m.userData.trail.forEach((sp, i) => { sp.material.opacity = Math.max(0, 0.4 - i * 0.04) * (0.7 + 0.3 * Math.sin(s.clock * 8 + i)); });
      }
      if (g.ride === 'nhuy' && m) {                                           // gậy cưỡi: hai đầu chớp nhanh + vệt sáng phía sau
        kitOf('nhuy').pulse(m.userData.staff, s.clock, true);
        m.userData.trail.forEach((sp, i) => { sp.material.opacity = Math.max(0, 0.55 - i * 0.055) * (0.7 + 0.3 * Math.sin(s.clock * 10 + i)); });
      }
      if (av.setBackHidden) av.setBackHidden(!!(m && !isVan));              // cưỡi thương/gậy thì cây đeo lưng biến mất (ván thì giữ)
      av.group.position.y += s.lift;
    }

    // Phiên 227: bầy chó chạy theo người cưỡi Gậy dạy chó; xuống gậy thì chó mờ dần rồi biến mất (gọi SAU khi đã cộng độ nâng để chó đứng đúng dưới đất)
    if (g.ride === 'tre' || s.dogs) {
      if (!s.dogs) s.dogs = createDogPack({ sound: false });
      s.dogs.update(av, dt, g.ride === 'tre');
      if (g.ride !== 'tre' && !s.dogs.alive) s.dogs = null;
    }

    aura(av, s, 'regen', g.regen, dt);
    aura(av, s, 'revive', g.revive, dt);
  }

  /** Dọn toàn bộ đồ đã gắn (người đó rời chùa / dựng lại nhân vật). */
  function drop(av) {
    const s = av && av.__rg; if (!s) return;
    for (const slot of [s.hand, s.back]) if (slot && slot.mesh) { slot.host.remove(slot.mesh); if (slot.kind !== 'tre' && slot.kind !== 'choi') disposeTree(slot.mesh); slot.mesh = null; slot.kind = ''; for (const c of slot.orig) c.visible = true; }
    if (s.hat && av.headHost) { av.headHost.remove(s.hat); s.hat = null; }
    applySlippers(av, s.slip, false);
    if (s.mounts) { for (const m of Object.values(s.mounts)) { av.group.remove(m); disposeTree(m); } s.mounts = null; }
    if (s.dogs) { s.dogs.dispose(); s.dogs = null; }   // Phiên 227: bầy chó của người đó
    for (const a of Object.values(s.auras)) { av.group.remove(a.m); a.m.geometry.dispose(); a.m.material.dispose(); }
    s.auras = {}; av.__rg = null;
  }

  return { apply, drop };
}
