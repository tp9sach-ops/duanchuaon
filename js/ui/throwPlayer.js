// Khiêng rồi ném người chơi khác (Phiên 72; Phiên 91 thêm bước KHIÊNG 2 giây). Luật: js/world/strength.js; mạng: gas/Throw.gs.
// Luồng: nút "Khiêng người" (có người ở gần) → nhấc họ lên vai tối đa HOLD_MS (2 giây) → bấm "Ném" (hoặc đợi hết giờ: tự ném) / "Thả xuống".
// Người bị khiêng (máy họ) nhận `held` từ máy chủ → đứng yên trên vai người khiêng → khi bị ném thì rơi xuống điểm rơi (an toàn, không mất gì).
// Đặt LGT.throwP = { status(), grab(), throw(), drop() }. Không có apiUrl / chưa vào phòng chung → không hiện nút.
import { callApi, apiEnabled } from '../api.js';
import { levelOf } from '../world/quests.js';
import { tickCooldown, markThrown, THROW_COST_SEN } from '../world/strength.js';
import { THR_POLL_MS, THR_POLL_FAST_MS, FAST_NEAR, HOLD_MS, nearestPlayer, stateReq, planGrab, planHeldThrow, reasonText, lastThrown, holdLeft, heldInfo } from '../world/throwNet.js';

export function initThrowPlayer({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let cd = {}, near = null, pollBusy = false, last = performance.now(), lastPoll = 0;
  let hold = null;      // đang khiêng ai: { id, n, t0 (ms), p (lời hứa của lệnh khiêng), ok (máy chủ xác nhận), ending }
  let heldBy = null;    // đang bị ai khiêng: { f, n, until (ms) }
  const W = () => LGT.world, room = () => LGT.room;
  const lv = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const str = () => (LGT.strength ? LGT.strength.value : 0);
  const usable = () => apiEnabled() && !!room() && !!room().players && !!W() && W().mode === 'free' && !LGT.inHouse && !LGT.panelOpen;
  const meNow = () => { const p = W().pos; return { lv: lv(), str: str(), x: p.x, z: p.z }; };
  const base = () => { const m = meNow(); return stateReq({ pageId: room().id, name: (room().name && room().name()) || 'Khách', lv: m.lv, str: m.str, x: m.x, z: m.z, med: W().mode !== 'free' }); };
  const setHold = (id) => { try { if (room() && room().hold) room().hold(id); } catch (_) { /* hình ảnh không làm hỏng luật chơi */ } };

  // ---- phía NGƯỜI BỊ KHIÊNG: đứng yên trên vai người khiêng cho tới khi bị ném / hết hạn
  function endHeld() { if (!heldBy) return; heldBy = null; LGT.heldBy = null; try { if (W() && W().hold) W().hold(null); } catch (_) { /* bỏ qua */ } }
  function onHeld(h) {
    if (!h) return;
    if (!heldBy) toast(`${h.n} nhấc bạn lên vai! Bạn sẽ rơi xuống an toàn, không mất gì.`, 3600);
    heldBy = { f: h.f, n: h.n, until: performance.now() + h.ms }; LGT.heldBy = h.f;
  }
  function followCarrier() {
    if (!heldBy) return; if (performance.now() > heldBy.until) { endHeld(); return; }
    const c = room() && room().players ? room().players().find((p) => p.id === heldBy.f) : null;
    if (c && W() && W().hold) W().hold({ x: c.x, z: c.z, y: 2.1 });
  }

  function receive(res) {
    if (!res) return;
    const t = lastThrown(res.inbox);
    if (t) {   // máy chủ giao mỗi cú ném đúng một lần → không cần chống trùng
      endHeld(); if (W() && W().teleport) { W().teleport(t.x, t.z); toast(`${t.from} đã nhấc bạn lên và ném đi! Bạn rơi xuống an toàn, không mất gì.`, 4200); }
    }
    const h = heldInfo(res); if (h) onHeld(h); else if (heldBy && !t && res.ok && !res.held) endHeld();   // máy chủ không còn coi mình bị khiêng (đã thả) → đứng dậy
  }
  async function poll() {
    if (pollBusy || !room() || !room().id || !apiEnabled()) return; pollBusy = true;
    try { const res = await callApi('thr', base()); if (res && res.ok) receive(res); } catch (_) { /* thử lại lượt sau */ } finally { pollBusy = false; }
  }

  function status() {
    const h = hold ? { holding: true, heldName: hold.n, left: Math.ceil(holdLeft(hold.t0, performance.now())) } : { holding: false, heldName: '', left: 0 };
    if (!usable()) { near = null; return { near: '', ...h }; }
    const p = W().pos, n = nearestPlayer(room().players(), p.x, p.z); near = n; return { near: n ? n.n : '', ...h };
  }

  // ---- phía NGƯỜI KHIÊNG
  function cancelHold() { hold = null; setHold(null); }
  async function grab() {
    if (!usable() || hold) return; status(); if (!near) { toast('Không có ai ở gần để khiêng.', 2000); return; }
    const me = meNow(), tgt = near;
    const plan = planGrab({ pageId: room().id, name: base().n, me, tgt: { id: tgt.id, lv: 0, str: 0, x: tgt.x, z: tgt.z }, cd });
    // lv/str của người kia máy mình KHÔNG biết → bỏ kiểm cấp/sức mạnh ở máy khách, để máy chủ phán (nó có số thật); ở đây chỉ kiểm chùa/hồi chiêu.
    if (!plan.ok && !['level', 'strength'].includes(plan.reason)) { toast(reasonText(plan.reason, plan.wait), 3000); return; }
    if ((LGT.getSen ? LGT.getSen() : 0) < THROW_COST_SEN) { toast('Cần 1 hạt sen để ném người (người ném người khác bị trừ 1 công đức).', 3200); return; }
    const h = hold = { id: tgt.id, n: tgt.n, t0: performance.now(), ok: false, ending: false, p: null };
    setHold(tgt.id); toast(`Bạn nhấc ${tgt.n} lên vai! Bấm “Ném” (tự ném sau ${HOLD_MS / 1000} giây).`, 2600);   // hiện ngay, máy chủ xác nhận sau
    h.p = (async () => {
      try {
        const res = await callApi('thr', { ...base(), ty: tgt.id, g: 1 });
        if (res && res.ok && res.grabbed) { h.ok = true; receive(res); return; }
        if (hold === h) cancelHold();
        if (res && res.ok && res.reason === 'range') toast('Máy chủ chưa cập nhật tính năng khiêng người (gas/Throw.gs). Cập nhật Apps Script rồi thử lại.', 5200);
        else if (res && res.ok) toast(reasonText(res.reason, res.wait), 3200);
        else toast('Chưa kết nối được, thử lại sau.', 2200);
      } catch (_) { if (hold === h) cancelHold(); toast('Chưa kết nối được, thử lại sau.', 2200); }
    })();
  }
  async function throwIt() {
    const h = hold; if (!h || h.ending) return; h.ending = true;
    try { await h.p; } catch (_) { /* đã báo lỗi ở grab */ }
    if (hold !== h || !h.ok) return;   // khiêng không thành
    const me = meNow(), W0 = W(), ry = Number.isFinite(W0.facing) ? W0.facing : 0, plan = planHeldThrow({ pageId: room().id, name: base().n, me, tgtId: h.id, ry });
    try { if (room() && room().toss) room().toss(h.id, plan.land); } catch (_) { /* bỏ qua */ }   // hình: người đó bay vòng cung tới điểm rơi
    setHold(null); if (LGT.sfx) LGT.sfx.play('nem');
    try {
      const res = await callApi('thr', { ...base(), ty: h.id, lx: plan.land.x, lz: plan.land.z });
      if (res && res.ok && res.thrown) { cd = markThrown(cd, room().id, h.id); if (LGT.spendSen) LGT.spendSen(THROW_COST_SEN); toast(`Bạn ném ${h.n} đi xa ${Math.round(plan.land.dist)} m! (−${THROW_COST_SEN} hạt sen)`, 3200); if (LGT.act) LGT.act('nemnguoi'); }
      else if (res && res.ok) toast(reasonText(res.reason, res.wait), 3200);
      else toast('Chưa kết nối được, thử lại sau.', 2200);
      if (res && res.ok) receive(res);
    } catch (_) { toast('Chưa kết nối được, thử lại sau.', 2200); } finally { if (hold === h) hold = null; }
  }
  async function drop() {
    const h = hold; if (!h || h.ending) return; h.ending = true; setHold(null);
    try { await h.p; } catch (_) { /* bỏ qua */ }
    if (h.ok) { try { await callApi('thr', { ...base(), ty: h.id, rl: 1 }); } catch (_) { /* hết hạn thì máy chủ tự thả */ } toast(`Đã thả ${h.n} xuống.`, 1800); }
    if (hold === h) hold = null;
  }

  setInterval(() => {
    const now = performance.now(); cd = tickCooldown(cd, (now - last) / 1000); last = now;
    if (hold && !hold.ending) { if (!usable()) drop(); else if (holdLeft(hold.t0, now) <= 0) throwIt(); }   // hết 2 giây: tự ném
    followCarrier();
    if (!usable() || !room().count || room().count <= 1) return;
    const p = W().pos, close = !!hold || !!heldBy || !!nearestPlayer(room().players(), p.x, p.z, FAST_NEAR);   // có người gần → hỏi dày để người bị khiêng biết sớm
    if (now - lastPoll >= (close ? THR_POLL_FAST_MS : THR_POLL_MS)) { lastPoll = now; poll(); }
  }, 250);
  LGT.throwP = { status, grab, throw: throwIt, drop };
  return LGT.throwP;
}
