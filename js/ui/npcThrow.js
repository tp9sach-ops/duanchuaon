// Ném NPC (Phiên 89): nút "Ném NPC" trong cụm nút góc phải-dưới khi đứng gần dân làng/NPC. Luật + tư thế bay: js/world/npcThrow.js (có test); cảnh 3D: js/scene/npc.js.
// Đặt LGT.npcThrow = { status(), throw() }. Ném THẲNG TRƯỚC MẶT nhân vật; nhân vật quay mặt về phía NPC trước nếu NPC lệch phía.
import { NPC_THROW_NEAR, nearestNpc, planNpcThrow, reasonText, markNpc } from '../world/npcThrow.js';
import { tickCooldown } from '../world/strength.js';

export function initNpcThrow({ toast = () => {} } = {}) {
  const LGT = window.LGT || (window.LGT = {});
  let cd = {}, last = performance.now();
  const W = () => LGT.world, ctl = () => LGT.npcCtl;
  const usable = () => !!ctl() && !!W() && W().mode === 'free' && !LGT.inHouse && !LGT.panelOpen;
  function nearest() { if (!usable()) return null; const p = W().pos; return nearestNpc(ctl().entities(), p.x, p.z, NPC_THROW_NEAR); }
  function status() { const n = nearest(); return { near: n ? n.ten : '' }; }
  function throwIt() {
    const n = nearest(); if (!n) { toast('Không có ai ở gần để ném.', 2000); return; }
    const W0 = W(), p = W0.pos; let ry = Number.isFinite(W0.facing) ? W0.facing : 0;
    const want = Math.atan2(n.x - p.x, n.z - p.z), df = Math.atan2(Math.sin(want - ry), Math.cos(want - ry));
    if (Math.abs(df) > 0.9) { ry = want; W0.face(ry); }   // NPC không ở phía trước → quay mặt về phía họ rồi ném
    const plan = planNpcThrow({ att: { str: LGT.strength ? LGT.strength.value : 0, x: p.x, z: p.z }, ry, npc: n, cd });
    if (!plan.ok) { toast(reasonText(plan.reason, plan.wait), 3000); return; }
    if (!ctl().launch(n.id, plan.land)) return;
    cd = markNpc(cd, n.id); toast(`Bạn nhấc ${n.ten} lên và ném ra xa khoảng ${Math.round(plan.land.dist)} m! ${n.ten} rơi xuống an toàn rồi sẽ tự quay về.`, 3600);
    if (LGT.act) LGT.act('nemnpc');
  }
  setInterval(() => { const now = performance.now(); cd = tickCooldown(cd, (now - last) / 1000); last = now; }, 500);
  LGT.npcThrow = { status, throw: throwIt };
  return LGT.npcThrow;
}
