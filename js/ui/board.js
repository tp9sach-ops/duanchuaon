// Ván trượt 3D (mục 1; trước là Thương bay Phiên 130, Ván trượt Phiên 92): giao diện. Luật/số: js/world/board.js (có test). Đặt LGT.board = { own, on, speedMul, buy(), shop(), toggle(), status() }.
// Mua ở Điện Máy Lam Sen bằng 100 LÁ BỒ ĐỀ (LGT.merit.spendLa). Hình 3D từ assets/models/skateboard.glb (nạp lúc cần, chuẩn hóa dài 1,1 m, mặt ván ngang chân); chưa có file GLB hoặc lỗi nạp thì dùng ván dựng bằng khối (không bao giờ hỏng game).
// Vào trận (LGT.combatPose.stance) thì KHÔNG lướt được: ván rời chân, xoay trọn một vòng quanh người rồi bay về bàn tay (returnPose) và biến mất; hết giao chiến mới lướt lại được. Tốc độ: world.js nhân LGT.board.speedMul.
// CHƯA nhìn bằng mắt trên máy thật; người chơi khác chưa thấy ván của mình (chưa đồng bộ qua mạng).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BOARD, loadBoard, buyBoard, toggleBoard, boardSpeedMul, canRide, returnPose } from '../world/board.js';
import { askConfirm } from './dialog.js';

const KEY = 'lgt.board', GLB = new URL('../../assets/models/skateboard.glb', import.meta.url).href;
const LEN = 1.1, BOB = 0.006;   // LEN: chiều dài ván (m); BOB: rung nhẹ khi lướt

/** Ván dựng bằng khối (dùng khi chưa có GLB): mặt ván cam, 2 đầu cong, 4 bánh xe. Gốc = chỗ người đứng, mặt trên ván ở y = 0, chân bánh xe ở y = -0,14. */
function buildProcBoard() {
  const g = new THREE.Group(); g.name = 'vantruot-khoi';
  const deck = new THREE.MeshStandardMaterial({ color: 0xf2a31b, roughness: 0.5 }), dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 }), wheel = new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.4 }), metal = new THREE.MeshStandardMaterial({ color: 0xaab2bd, roughness: 0.35, metalness: 0.7 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(0.24, 0.03, LEN * 0.72), deck, 0, -0.015, 0);
  for (const s of [-1, 1]) { const k = add(new THREE.BoxGeometry(0.24, 0.03, LEN * 0.15), deck, 0, 0.0, s * LEN * 0.4); k.rotation.x = -s * 0.28; }
  add(new THREE.BoxGeometry(0.235, 0.004, LEN * 0.72), dark, 0, 0.001, 0);   // giấy nhám mặt trên
  for (const z of [-0.3, 0.3]) {
    add(new THREE.BoxGeometry(0.2, 0.02, 0.035), metal, 0, -0.05, z);
    for (const x of [-0.1, 0.1]) { const w = add(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 14), wheel, x, -0.1, z); w.rotation.z = Math.PI / 2; }
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root: g, height: 0.14 };
}

/** Chuẩn hóa mô hình GLB: trục dài nhất → +z (hướng nhân vật nhìn), dài LEN m, giữa theo x/z, mặt trên cùng của ván ở y = 0. Trả { root, height (từ mặt ván xuống đáy bánh xe) }. */
function normalizeGlb(model) {
  const holder = new THREE.Group(); holder.add(model);
  model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  if (size.x > size.z && size.x >= size.y) holder.rotation.y = Math.PI / 2;   // dài theo x → xoay về z (trục y giữ làm chiều cao)
  model.scale.setScalar(LEN / Math.max(size.x, size.y, size.z, 1e-6));
  const root = new THREE.Group(); root.add(holder); root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3());
  holder.position.set(-c.x, -box.max.y, -c.z);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, height: Math.max(0.05, box.max.y - box.min.y) };
}

export function initBoard({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st; try { st = loadBoard(localStorage.getItem(KEY)); } catch (_) { st = loadBoard(null); }
  st = { own: st.own, on: false };   // mở lại game thì đứng dưới đất
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ own: st.own, on: false })); } catch (_) { /* riêng tư */ } };
  let mesh = null, proc = null, glb = null, base = 0.14, lift = 0, clock = 0, ret = null, loading = false;   // ret = { t }: đang bay về tay; base = độ nâng người khi lướt (= chiều cao ván)

  const fighting = () => !!(LGT.combatPose && LGT.combatPose.stance);
  const la = () => (LGT.merit && LGT.merit.leaf ? LGT.merit.leaf.la : 0);
  function startReturn() { ret = { t: 0 }; }
  function placeRiding() { mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); }
  function placeReturn(av, dt) {   // quỹ đạo quanh người (toạ độ cục bộ của nhân vật) rồi lao về bàn tay
    ret.t += dt; const p = returnPose(ret.t);
    if (p.done) { ret = null; mesh.visible = false; placeRiding(); return; }
    let hx = 0.3, hy = 1.0, hz = 0.2;
    if (av.handPos && av.group) { av.group.updateWorldMatrix(true, false); const h = av.handPos(), v = av.group.worldToLocal(new THREE.Vector3(h.x, h.y, h.z)); hx = v.x; hy = v.y; hz = v.z; }
    const ox = Math.sin(p.ang) * p.rad, oz = Math.cos(p.ang) * p.rad, oy = 1.1;   // quỹ đạo ngang ngực
    mesh.position.set(ox + (hx - ox) * p.blend, oy + (hy - oy) * p.blend, oz + (hz - oz) * p.blend);
    mesh.rotation.set(0, p.ang + Math.PI / 2, 0);
    mesh.scale.setScalar(1 - 0.55 * p.blend);   // bay về tay: nhỏ dần
    mesh.visible = true;
  }

  /** Nạp GLB một lần (chỉ khi đã có ván). Xong thì thay ván khối; lỗi/thiếu file thì giữ ván khối. */
  function ensureModel() {
    if (loading || glb || !mesh || !st.own) return; loading = true;
    try {
      new GLTFLoader().load(GLB, (gltf) => {
        try { const r = normalizeGlb(gltf.scene); glb = r.root; base = r.height + 0.01; mesh.add(glb); if (proc) proc.visible = false; }
        catch (err) { console.warn('[Diệu Giang Tự] Không xử lý được ván trượt 3D, dùng ván dựng bằng khối:', err); }
      }, undefined, (err) => { console.warn('[Diệu Giang Tự] Chưa nạp được assets/models/skateboard.glb, dùng ván dựng bằng khối:', err && err.message ? err.message : err); });
    } catch (err) { console.warn('[Diệu Giang Tự] Không nạp được ván trượt 3D:', err); }
  }

  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__board || !av.group) return;
    mesh = new THREE.Group(); mesh.name = 'vantruot'; mesh.visible = false;
    const p = buildProcBoard(); proc = p.root; base = p.height; mesh.add(proc); av.group.add(mesh);
    const orig = av.update.bind(av); av.__board = true;
    av.update = (dt) => {
      orig(dt); clock += dt;
      const want = st.on ? base + Math.sin(clock * 9) * BOB : 0;
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
    wrap(); ensureModel();
    if (!st.on) return;
    const c = ctx();
    if (!canRide(c)) {
      st = { ...st, on: false };
      if (c.fight && c.free) { startReturn(); toast('Vào trận rồi — bạn nhấc ván trượt lên tay. Đang đánh nhau không lướt ván được.', 3200); }   // vào nhà / bơi / bị khiêng: chỉ xuống, không diễn bay
    }
  }
  setInterval(tick, 100);

  /** Mua ván bằng lá bồ đề. Trả Promise<boolean> (true = mua xong). */
  async function buy() {
    if (st.own) { toast('Bạn đã có ván trượt. Bấm nút “Lướt ván” ở góc phải-dưới để dùng.', 4200); return false; }
    const ok = await askConfirm(`Ván trượt — ${BOARD.gia} lá bồ đề.\nLướt ván đi nhanh gấp ${String(BOARD.mul).replace('.', ',')} lần bình thường (đánh nhau thì không lướt được).\nBạn đang có ${la()} lá bồ đề. Mua không?`, { ok: 'Mua', cancel: 'Để sau' });
    if (!ok) return false;
    const r = buyBoard(st, la());
    if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có ván trượt rồi.' : `Chưa đủ lá bồ đề (cần ${r.cost}, bạn có ${la()}). Đổi thêm lá ở Thầy Tri khách.`, 3600); return false; }
    if (!(LGT.merit && LGT.merit.spendLa && LGT.merit.spendLa(r.cost))) { toast('Chưa đủ lá bồ đề.', 2500); return false; }
    st = r.state; save(); ensureModel();
    toast(`Đã mua ván trượt (−${r.cost} lá bồ đề).`, 2600);
    if (canRide(ctx())) { st = toggleBoard(st, true).state; setTimeout(() => toast(`Bạn lướt ván — đi nhanh gấp ${String(BOARD.mul).replace('.', ',')}! Bấm “Xuống ván” để bước xuống.`, 4200), 1800); }
    return true;
  }

  const api = {
    get own() { return st.own; }, get on() { return st.on; }, get speedMul() { return boardSpeedMul(st); },
    toggle() {
      if (!st.own) { toast('Bạn chưa có ván trượt. Mua ở Điện Máy Lam Sen (nói chuyện với nhân viên), 100 lá bồ đề.', 3600); return; }
      if (!st.on && fighting()) { toast('Đang giao chiến, không lướt ván được. Hết đánh nhau rồi hãy lướt.', 2800); return; }
      if (!st.on && !canRide(ctx())) { toast('Chỗ này không lướt ván được (trong nhà, dưới nước hoặc đang bận).', 2800); return; }
      const r = toggleBoard(st); if (!r.ok) return; st = r.state; if (st.on) { ret = null; ensureModel(); }
      toast(st.on ? `Bạn lướt ván trượt — đi nhanh gấp ${String(BOARD.mul).replace('.', ',')}!` : 'Bạn bước xuống ván.', 2200);
    },
    buy, shop: buy,   // shop() giữ tên cũ cho nơi gọi cũ
    status() { return { own: st.own, on: st.on }; },
  };
  LGT.board = api;
  import('./items.js').then((m) => m.initItems({ toast })).catch((e) => console.warn('[Diệu Giang Tự] Vật phẩm lá bồ đề lỗi:', e && e.message));   // Ngọc hồi máu / dịch chuyển / Gậy như ý (mục 1)
  return api;
}
