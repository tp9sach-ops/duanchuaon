// Ném người chơi khác (Phiên 72): nút "Ném người" trong cụm nút góc phải-dưới khi có người ở gần. Luật: js/world/strength.js; mạng: gas/Throw.gs.
// Đặt LGT.throwP = { status(), throw() }. Không có apiUrl / chưa vào phòng chung → không hiện nút.
import { callApi, apiEnabled } from '../api.js';
import { levelOf } from '../world/quests.js';
import { tickCooldown, markThrown, THROW_COST_SEN } from '../world/strength.js';
import { THR_POLL_MS, nearestPlayer, stateReq, planThrow, reasonText, lastThrown } from '../world/throwNet.js';

export function initThrowPlayer({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let cd = {}, near = null, busy = false, last = performance.now(), lastPoll = 0, lastBox = '';
  const W = () => LGT.world, room = () => LGT.room;
  const lv = () => levelOf(LGT.quests && LGT.quests.prog ? LGT.quests.prog.xp : 0).lv;
  const str = () => (LGT.strength ? LGT.strength.value : 0);
  const usable = () => apiEnabled() && !!room() && !!room().players && !!W() && W().mode === 'free' && !LGT.inHouse && !LGT.panelOpen;
  const meNow = () => { const p = W().pos; return { lv: lv(), str: str(), x: p.x, z: p.z }; };
  const base = () => { const m = meNow(); return stateReq({ pageId: room().id, name: (room().name && room().name()) || 'Khách', lv: m.lv, str: m.str, x: m.x, z: m.z, med: W().mode !== 'free' }); };

  function receive(inbox) {
    const t = lastThrown(inbox); if (!t) return;
    const key = `${t.x},${t.z},${t.from}`; if (key === lastBox) return; lastBox = key;
    if (W() && W().teleport) { W().teleport(t.x, t.z); toast(`${t.from} đã nhấc bạn lên và ném đi! Bạn rơi xuống an toàn, không mất gì.`, 4200); }
  }
  async function poll() {
    if (busy || !room() || !room().id || !apiEnabled()) return; busy = true;
    try { const res = await callApi('thr', base()); if (res && res.ok) receive(res.inbox); } catch (_) { /* thử lại lượt sau */ } finally { busy = false; }
  }
  function status() {
    if (!usable()) { near = null; return { near: '' }; }
    const p = W().pos, list = room().players(), n = nearestPlayer(list, p.x, p.z); near = n; return { near: n ? n.n : '' };
  }
  async function throwIt() {
    if (!usable() || busy) return; status(); if (!near) { toast('Không có ai ở gần để ném.', 2000); return; }
    const me = meNow(), W0 = W(), ry = W0.avatar && W0.avatar.group ? W0.avatar.group.rotation.y : 0;
    const plan = planThrow({ pageId: room().id, name: base().n, me, tgt: { id: near.id, lv: 0, str: 0, x: near.x, z: near.z }, cd, ry });
    // lv/str của người kia máy mình KHÔNG biết → bỏ kiểm cấp/sức mạnh ở máy khách, để máy chủ phán (nó có số thật); ở đây chỉ kiểm chùa/hồi chiêu.
    if (!plan.ok && !['level', 'strength'].includes(plan.reason)) { toast(reasonText(plan.reason, plan.wait), 3000); return; }
    const l = plan.land || { x: me.x, z: me.z }, ty = near.id, target = near.n;
    if ((LGT.getSen ? LGT.getSen() : 0) < THROW_COST_SEN) { toast('Cần 1 hạt sen để ném người (người ném người khác bị trừ 1 công đức).', 3200); return; }
    busy = true;
    try {
      const res = await callApi('thr', { ...base(), ty, lx: l.x, lz: l.z });
      if (res && res.ok && res.thrown) { cd = markThrown(cd, room().id, ty); if (LGT.spendSen) LGT.spendSen(THROW_COST_SEN); toast(`Bạn nhấc ${target} lên và ném đi! (−${THROW_COST_SEN} hạt sen)`, 3200); }
      else if (res && res.ok) toast(reasonText(res.reason, res.wait), 3200);
      else toast('Chưa kết nối được, thử lại sau.', 2200);
      if (res && res.ok) receive(res.inbox);
    } catch (_) { toast('Chưa kết nối được, thử lại sau.', 2200); } finally { busy = false; }
  }
  setInterval(() => { const now = performance.now(); cd = tickCooldown(cd, (now - last) / 1000); last = now; if (usable() && now - lastPoll >= THR_POLL_MS && room().count > 1) { lastPoll = now; poll(); } }, 500);
  LGT.throwP = { status, throw: throwIt };
  return LGT.throwP;
}
