// Thương bay (Phiên 130, trước là Ván trượt Phiên 92): giao diện. Luật/số: js/world/board.js (có test). Đặt LGT.board = { own, on, speedMul, shop(), toggle(), status() }.
// Mua ở Điện Máy Lam Sen (nói chuyện với nhân viên). CƯỠI cây thương DÀY gấp 3 (K=3 chỉ bề ngang; chiều dài giữ 2,6 m như ván; hai đầu bo tròn, không mũi nhọn; Phiên 131): nhân vật đứng trên thân thương lơ lửng ~0,45 m, thương nhấp nhô nhẹ, tốc độ ×2 (world.js nhân LGT.board.speedMul).
// Vào trận (LGT.combatPose.stance) thì KHÔNG cưỡi được: đang cưỡi → thương rời chân, xoay trọn một vòng quanh người rồi bay về bàn tay (returnPose trong js/world/board.js) và biến mất; hết giao chiến mới cưỡi lại được.
// CHƯA nhìn bằng mắt trên máy thật; người chơi khác chưa thấy thương của mình (chưa đồng bộ qua mạng).
import * as THREE from 'three';
import { BOARD, loadBoard, buyBoard, toggleBoard, boardSpeedMul, canRide, returnPose } from '../world/board.js';
import { askConfirm } from './dialog.js';

const KEY = 'lgt.board', LIFT = 0.45, BOB = 0.035, K = 3, LEN = 2.6;   // K = 3: DÀY gấp 3 (bề ngang); LEN = 2,6 m: DÀI giữ nguyên như ván cũ; không có đầu nhọn

/** Cây thương nằm ngang theo hướng nhân vật (trục +z là phía trước): cán gỗ đỏ sẫm DÀY gấp 3, dài bằng ván (2,6 m), hai đầu BO TRÒN có chụp vàng (KHÔNG mũi nhọn), dải đỏ gần đầu trước. Gốc (0,0,0) = chỗ nhân vật đứng; mặt trên cán nằm ngang chân. */
function buildSpearMesh() {
  const g = new THREE.Group(); g.name = 'thuongbay'; g.visible = false;
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a2a1c, roughness: 0.5 }), gold = new THREE.MeshStandardMaterial({ color: 0xe0a93a, roughness: 0.3, metalness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc8261c, roughness: 0.55 });
  const R = 0.055 * K, Y = -R;   // bán kính cán gấp 3; mặt trên cán chạm chân nhân vật
  const along = (geo, mat, z) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.set(0, Y, z); g.add(m); return m; };
  along(new THREE.CylinderGeometry(R, R, LEN, 16), wood, 0);                                                   // cán
  for (const z of [-0.55, 0.55]) along(new THREE.CylinderGeometry(0.07 * K, 0.07 * K, 0.1, 16), gold, z);      // hai đai vàng (chỉ phình ngang)
  along(new THREE.CylinderGeometry(0.085 * K, 0.085 * K, 0.16, 16), red, LEN / 2 - 0.2);                       // dải đỏ gần đầu trước
  for (const s of [-1, 1]) {                                                                                    // hai đầu: chụp vàng + nắp tròn dẹt (không nhọn)
    along(new THREE.CylinderGeometry(0.075 * K, 0.075 * K, 0.14, 16), gold, s * (LEN / 2));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075 * K, 16, 12), gold); cap.scale.set(1, 1, 0.45); cap.position.set(0, Y, s * (LEN / 2 + 0.05)); g.add(cap);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function initBoard({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st; try { st = loadBoard(localStorage.getItem(KEY)); } catch (_) { st = loadBoard(null); }
  st = { own: st.own, on: false };   // mở lại game thì đứng dưới đất
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ own: st.own, on: false })); } catch (_) { /* riêng tư */ } };
  let mesh = null, lift = 0, clock = 0, ret = null;   // ret = { t }: đang bay về tay

  const fighting = () => !!(LGT.combatPose && LGT.combatPose.stance);
  function startReturn() { ret = { t: 0 }; }
  function placeRiding() { mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); }
  function placeReturn(av, dt) {   // quỹ đạo quanh người (toạ độ cục bộ của nhân vật) rồi lao về bàn tay
    ret.t += dt; const p = returnPose(ret.t);
    if (p.done) { ret = null; mesh.visible = false; placeRiding(); return; }
    let hx = 0.3, hy = 1.0, hz = 0.2;
    if (av.handPos && av.group) { av.group.updateWorldMatrix(true, false); const h = av.handPos(), v = av.group.worldToLocal(new THREE.Vector3(h.x, h.y, h.z)); hx = v.x; hy = v.y; hz = v.z; }
    const ox = Math.sin(p.ang) * p.rad, oz = Math.cos(p.ang) * p.rad, oy = 1.1;   // quỹ đạo ngang ngực
    mesh.position.set(ox + (hx - ox) * p.blend, oy + (hy - oy) * p.blend, oz + (hz - oz) * p.blend);
    mesh.rotation.set(0, p.ang + Math.PI / 2, 0);   // mũi thương nhìn theo hướng bay quanh người
    { const k = 1 - 0.55 * p.blend; mesh.scale.set(k / K, k / K, k); }   // bay về tay: bề ngang chia K về cỡ cũ, chiều dài giữ, rồi nhỏ dần như cây côn cầm tay
    mesh.visible = true;
  }

  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__board || !av.group) return;
    mesh = buildSpearMesh(); av.group.add(mesh);
    const orig = av.update.bind(av); av.__board = true;
    av.update = (dt) => {
      orig(dt); clock += dt;
      const want = st.on ? LIFT + Math.sin(clock * 3) * BOB : 0;
      lift += (want - lift) * Math.min(1, 14 * dt);
      if (ret) placeReturn(av, dt);
      else { mesh.visible = st.on || lift > 0.01; if (mesh.visible) { placeRiding(); mesh.scale.setScalar(1); } }
      if (av.group) av.group.position.y += lift;
    };
  }
  function ctx() {
    const W = LGT.world;
    return { free: !!W && W.mode === 'free' && !LGT.panelOpen && !LGT.heldBy, inHouse: !!LGT.inHouse, swim: !!(LGT.swim && LGT.swim.active), fight: fighting() };
  }
  function tick() {
    wrap();
    if (!st.on) return;
    const c = ctx();
    if (!canRide(c)) {
      st = { ...st, on: false };
      if (c.fight && c.free) { startReturn(); toast('Vào trận rồi — cây thương bay về tay bạn. Đang đánh nhau không cưỡi thương được.', 3200); }   // vào nhà / bơi / bị khiêng: chỉ xuống, không diễn bay
    }
  }
  setInterval(tick, 100);

  const api = {
    get own() { return st.own; }, get on() { return st.on; }, get speedMul() { return boardSpeedMul(st); },
    toggle() {
      if (!st.own) { toast('Bạn chưa có thương bay. Mua ở Điện Máy Lam Sen (nói chuyện với nhân viên).', 3600); return; }
      if (!st.on && fighting()) { toast('Đang giao chiến, không cưỡi thương được. Hết đánh nhau rồi hãy cưỡi.', 2800); return; }
      if (!st.on && !canRide(ctx())) { toast('Chỗ này không cưỡi thương được (trong nhà, dưới nước hoặc đang bận).', 2800); return; }
      const r = toggleBoard(st); if (!r.ok) return; st = r.state; if (st.on) ret = null;
      toast(st.on ? `Bạn cưỡi cây thương bay — đi nhanh gấp ${BOARD.mul}!` : 'Bạn bước xuống thương.', 2200);
    },
    async shop() {
      if (st.own) { toast('Bạn đã có thương bay. Bấm nút “Cưỡi thương” ở góc phải-dưới để cưỡi.', 4200); return; }
      const sen = LGT.getSen ? LGT.getSen() : 0;
      const ok = await askConfirm(`Thương bay — ${BOARD.gia} hạt sen.\nCưỡi cây thương to bay là đi nhanh gấp ${BOARD.mul} lần (đánh nhau thì không cưỡi được).\nBạn đang có ${sen} hạt sen. Mua không?`, { ok: 'Mua', cancel: 'Để sau' });
      if (!ok) return;
      const now = LGT.getSen ? LGT.getSen() : 0, r = buyBoard(st, now);
      if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có thương bay rồi.' : `Chưa đủ hạt sen (cần ${r.cost}, bạn có ${now}).`, 3200); return; }
      if (!(LGT.spendSen && LGT.spendSen(r.cost))) { toast('Chưa đủ hạt sen.', 2500); return; }
      st = r.state; save();
      toast(`Đã mua thương bay (−${r.cost} hạt sen).`, 2600);
      if (canRide(ctx())) { st = toggleBoard(st, true).state; setTimeout(() => toast(`Bạn cưỡi thương — đi nhanh gấp ${BOARD.mul}! Bấm “Xuống thương” để bước xuống.`, 4200), 1800); }
    },
    status() { return { own: st.own, on: st.on }; },
  };
  LGT.board = api; return api;
}
