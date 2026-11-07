// Chế độ CHỈNH SỬA nhà (Phiên 43, việc 1): trong nhà bấm nút "Chỉnh sửa" → bấm vào món đồ để chọn, GIỮ và KÉO chuột (hoặc ngón tay) để dời,
// cuộn chuột (hoặc phím R / nút Xoay) để xoay 90°, phím Delete / nút Cất để cất về túi, Esc / nút Xong để thoát.
// Logic kiểm tra chỗ đặt nằm ở js/world/furniture.js (canPlace/setPose/clampPose, có test). Cảnh 3D (chọn bằng tia, khung viền, dời tạm) ở js/scene/interior.js.
// Đang kéo thì món chỉ dời TẠM trong cảnh (khung viền xanh = đặt được, đỏ = không); thả chuột mới lưu và dựng lại phòng. Mọi chữ qua textContent.
import * as THREE from 'three';
import { canPlace, setPose, clampPose, rotateItem, pickUp, furnitureById, footprint } from '../world/furniture.js';
import { INTERIOR } from '../world/interior.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const isEditable = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function initEdit(hud, { toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let on = false, selUid = 0, drag = null, wheelAt = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const scene = () => LGT.interiorScene, F = () => LGT.furni;
  const placedOf = (uid) => { const s = F() && F().state; return s ? s.placed.find((p) => p.uid === uid) : null; };

  const open = el('button', 'ed-open', 'Chỉnh sửa'); open.type = 'button'; open.hidden = true; open.setAttribute('aria-label', 'Bật chế độ chỉnh sửa nhà');
  const bar = el('div', 'ed-bar'); bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Chỉnh sửa nhà');
  const msg = el('p', 'ed-msg'), row = el('div', 'ed-row');
  const bRot = el('button', 'ed-b', 'Xoay'), bPick = el('button', 'ed-b', 'Cất'), bDone = el('button', 'ed-b done', 'Xong');
  for (const b of [bRot, bPick, bDone]) b.type = 'button';
  row.append(bRot, bPick, bDone); bar.append(msg, row); document.body.append(open, bar);
  ['pointerdown', 'touchend', 'wheel'].forEach((ev) => [open, bar].forEach((n) => n.addEventListener(ev, (e) => e.stopPropagation(), { passive: true })));

  const HINT = 'Bấm vào món đồ để chọn, giữ và kéo để dời. Cuộn chuột (hoặc nút Xoay) để xoay.';
  function paint() {
    const p = selUid && placedOf(selUid), f = p && furnitureById(p.id);
    msg.textContent = f ? `Đang chọn: ${f.ten}. Kéo để dời, cuộn chuột / nút Xoay để xoay.` : HINT;
    bRot.disabled = bPick.disabled = !f;
    bar.hidden = !on; open.hidden = on || !LGT.inHouse;
    document.body.classList.toggle('edit-mode', on);
  }
  function select(uid) { selUid = uid || 0; const sc = scene(); if (sc) sc.select(selUid); paint(); }
  function setOn(v) {
    if (v && !LGT.inHouse) return;
    on = v; drag = null; if (v) { try { F() && F().close(); } catch (_) { /* bỏ qua */ } toast('Chế độ chỉnh sửa: bấm vào đồ để dời / xoay.', 3000); }
    select(0); if (!v && LGT.houseRemount) LGT.houseRemount(); paint();
  }
  open.addEventListener('click', () => { open.classList.remove('pulse'); setOn(true); }); bDone.addEventListener('click', () => setOn(false));
  bRot.addEventListener('click', () => rotate());
  bPick.addEventListener('click', () => pickSel());

  function rotate() {
    const f = F(); if (!on || !selUid || !f) return;
    const uid = selUid; if (f.apply((st, lv) => rotateItem(st, lv, uid))) select(uid);
  }
  function pickSel() {
    const f = F(); if (!on || !selUid || !f) return;
    const uid = selUid; select(0); f.apply((st) => pickUp(st, uid));
  }

  // --- chọn / kéo bằng chuột (bắt ở cửa sổ, pha capture, để không bị chế độ đi bộ nuốt mất)
  const aim = (e) => {
    const v = LGT.view; if (!v) return null; const r = v.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, v.camera); return ray;
  };
  const onFloor = (x, z, f, rot) => {   // người chơi đang đứng trong chỗ món đặc sắp đặt?
    if (!f.solid || !LGT.world) return false; const p = LGT.world.pos, { rw, rd } = footprint(f, rot);
    return Math.abs(p.x - INTERIOR.x - x) < rw / 2 + 0.3 && Math.abs(p.z - INTERIOR.z - z) < rd / 2 + 0.3;
  };
  function check(d) {   // kiểm vị trí tạm của món đang kéo → { ok, reason, x, z }
    const f = furnitureById(d.id), lv = F().level, c = clampPose(lv, d.id, d.x, d.z, d.rot), s = F().state;
    let r = canPlace(lv, s.placed, d.id, c.x, c.z, d.rot, d.uid);
    if (r.ok && onFloor(c.x, c.z, f, d.rot)) r = { ok: false, reason: 'person' };
    return { ok: r.ok, reason: r.reason, x: c.x, z: c.z };
  }
  function show(d) { const k = check(d); d.ok = k.ok; d.reason = k.reason; d.cx = k.x; d.cz = k.z; scene().ghost(d.uid, k.x, k.z, d.rot, k.ok); }

  addEventListener('pointerdown', (e) => {
    const v = LGT.view; if (!on || !v || e.target !== v.canvas || (e.pointerType === 'mouse' && e.button !== 0) || drag) return;
    const sc = scene(), r = aim(e); if (!sc || !r) return;
    const uid = sc.pickItem(ray); if (!uid) { select(0); return; }   // bấm chỗ trống: bỏ chọn (vẫn cho đi bộ / xoay camera như thường)
    const p = placedOf(uid), fp = sc.floorPoint(ray.ray), pos = sc.itemPos(uid); if (!p || !fp || !pos) return;
    e.stopImmediatePropagation(); e.preventDefault();
    select(uid); drag = { pid: e.pointerId, uid, id: p.id, rot: p.rot, ox: pos.x - fp.x, oz: pos.z - fp.z, x: pos.x, z: pos.z, x0: e.clientX, y0: e.clientY, moved: false, ok: true };
  }, true);
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 6) return;   // chưa kéo (chỉ chạm) thì chưa dời
    const r = aim(e), fp = r && scene().floorPoint(ray.ray); if (!fp) return;
    drag.moved = true; drag.x = fp.x + drag.ox; drag.z = fp.z + drag.oz; show(drag); e.preventDefault();
  }, true);
  const release = (e, cancel) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag; drag = null;
    if (!d.moved || cancel) { if (d.moved && LGT.houseRemount) LGT.houseRemount(); select(d.uid); return; }
    const f = F(); let done = false;
    if (d.ok) done = f.apply((st, lv) => setPose(st, lv, d.uid, d.cx, d.cz, d.rot));
    else f.toastWhy(d.reason);
    if (!done && LGT.houseRemount) LGT.houseRemount();   // không đặt được: đưa món về chỗ cũ
    select(d.uid); return done;
  };
  addEventListener('pointerup', (e) => release(e, false), true);
  addEventListener('pointercancel', (e) => release(e, true), true);

  // --- cuộn chuột = xoay món đang chọn (khi đang kéo: xoay tạm; không kéo: xoay luôn)
  addEventListener('wheel', (e) => {
    const v = LGT.view; if (!on || !selUid || !v || e.target !== v.canvas) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const now = performance.now(); if (now - wheelAt < 160) return; wheelAt = now;
    if (drag) { drag.rot = (drag.rot + (e.deltaY > 0 ? 1 : 3)) % 4; drag.moved = true; show(drag); } else rotate();
  }, { capture: true, passive: false });

  addEventListener('keydown', (e) => {
    if (!on || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') { e.stopPropagation(); setOn(false); } else if (e.code === 'KeyR') { rotate(); e.preventDefault(); } else if (e.code === 'Delete' || e.code === 'Backspace') { pickSel(); e.preventDefault(); }
  }, true);

  // Phiên 52: vừa bước vào nhà thì báo ngay có nút "Chỉnh sửa" và cho nút nhấp nháy vài giây để dễ thấy (người chơi báo không thấy nút).
  let wasIn = false, pulseTimer = 0;
  const watchEnter = () => {
    const now = !!LGT.inHouse;
    if (now && !wasIn) {
      toast('Bấm nút "Chỉnh sửa" ở giữa màn hình để dời, xoay đồ trong nhà.', 4500);
      open.classList.add('pulse'); clearTimeout(pulseTimer); pulseTimer = setTimeout(() => open.classList.remove('pulse'), 9000);
    } else if (!now) { open.classList.remove('pulse'); }
    wasIn = now;
  };
  setInterval(() => { watchEnter(); if (on && !LGT.inHouse) setOn(false); else paint(); }, 400);   // ra khỏi nhà thì tự tắt; vào nhà thì hiện nút
  LGT.edit = { get on() { return on; }, setOn, select };
  paint();
  return LGT.edit;
}
