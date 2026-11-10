// Ván trượt (Phiên 92): giao diện. Luật/số: js/world/board.js (có test). Đặt LGT.board = { own, on, speedMul, shop(), toggle(), status() }.
// Mua ở Điện Máy Lam Sen (nói chuyện với nhân viên). Đứng lên ván: nhân vật nâng lên ~0,1 m trên một tấm ván có 4 bánh, tư thế đứng yên, tốc độ ×2 (world.js nhân LGT.board.speedMul).
// CHƯA nhìn bằng mắt trên máy thật; người chơi khác chưa thấy ván của mình (chưa đồng bộ qua mạng).
import * as THREE from 'three';
import { BOARD, loadBoard, buyBoard, toggleBoard, boardSpeedMul, canRide } from '../world/board.js';
import { askConfirm } from './dialog.js';

const KEY = 'lgt.board', LIFT = 0.1;

function buildBoardMesh() {
  const g = new THREE.Group(); g.name = 'vantruot'; g.visible = false;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.96), new THREE.MeshStandardMaterial({ color: 0xf2a31b, roughness: 0.5 })); deck.position.y = -0.02; g.add(deck);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.042, 0.1), new THREE.MeshStandardMaterial({ color: 0x1f64d0, roughness: 0.5 }));
  for (const z of [-0.32, 0.32]) { const s = stripe.clone(); s.position.set(0, -0.02, z); g.add(s); }
  const wm = new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.7 }), wg = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12);
  for (const x of [-0.14, 0.14]) for (const z of [-0.33, 0.33]) { const w = new THREE.Mesh(wg, wm); w.rotation.z = Math.PI / 2; w.position.set(x, -0.065, z); g.add(w); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function initBoard({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let st; try { st = loadBoard(localStorage.getItem(KEY)); } catch (_) { st = loadBoard(null); }
  st = { own: st.own, on: false };   // mở lại game thì đứng dưới đất
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ own: st.own, on: false })); } catch (_) { /* riêng tư */ } };
  let mesh = null, lift = 0;

  function wrap() {
    const av = LGT.world && LGT.world.avatar; if (!av || av.__board || !av.group) return;
    mesh = buildBoardMesh(); av.group.add(mesh);
    const orig = av.update.bind(av); av.__board = true;
    av.update = (dt) => { orig(dt); lift += ((st.on ? LIFT : 0) - lift) * Math.min(1, 14 * dt); mesh.visible = st.on || lift > 0.01; if (av.group) av.group.position.y += lift; };
  }
  function ctx() {
    const W = LGT.world;
    return { free: !!W && W.mode === 'free' && !LGT.panelOpen && !LGT.heldBy, inHouse: !!LGT.inHouse, swim: !!(LGT.swim && LGT.swim.active) };
  }
  function tick() { wrap(); if (st.on && !canRide(ctx())) { st = { ...st, on: false }; } }   // vào nhà / bơi / bị khiêng → tự xuống ván
  setInterval(tick, 100);

  const api = {
    get own() { return st.own; }, get on() { return st.on; }, get speedMul() { return boardSpeedMul(st); },
    toggle() {
      if (!st.own) { toast('Bạn chưa có ván trượt. Mua ở Điện Máy Lam Sen (nói chuyện với nhân viên).', 3600); return; }
      if (!st.on && !canRide(ctx())) { toast('Chỗ này không đứng lên ván được (trong nhà, dưới nước hoặc đang bận).', 2800); return; }
      const r = toggleBoard(st); if (!r.ok) return; st = r.state;
      toast(st.on ? `Bạn đứng lên ván trượt — đi nhanh gấp ${BOARD.mul}!` : 'Bạn bước xuống ván.', 2200);
    },
    async shop() {
      if (st.own) { toast('Bạn đã có ván trượt. Bấm nút “Lên ván” ở góc phải-dưới để đứng lên ván.', 4200); return; }
      const sen = LGT.getSen ? LGT.getSen() : 0;
      const ok = await askConfirm(`Ván trượt — ${BOARD.gia} hạt sen.\nĐứng lên ván là đi nhanh gấp ${BOARD.mul} lần.\nBạn đang có ${sen} hạt sen. Mua không?`, { ok: 'Mua', cancel: 'Để sau' });
      if (!ok) return;
      const now = LGT.getSen ? LGT.getSen() : 0, r = buyBoard(st, now);
      if (!r.ok) { toast(r.reason === 'owned' ? 'Bạn đã có ván trượt rồi.' : `Chưa đủ hạt sen (cần ${r.cost}, bạn có ${now}).`, 3200); return; }
      if (!(LGT.spendSen && LGT.spendSen(r.cost))) { toast('Chưa đủ hạt sen.', 2500); return; }
      st = r.state; save();
      toast(`Đã mua ván trượt (−${r.cost} hạt sen).`, 2600);
      if (canRide(ctx())) { st = toggleBoard(st, true).state; setTimeout(() => toast(`Bạn đứng lên ván — đi nhanh gấp ${BOARD.mul}! Bấm “Xuống ván” để bước xuống.`, 4200), 1800); }
    },
    status() { return { own: st.own, on: st.on }; },
  };
  LGT.board = api; return api;
}
