// Ném người chơi khác qua mạng — logic thuần (máy chủ: gas/Throw.gs, action 'thr'). Luật ném: js/world/strength.js (throwCheck).
import { throwCheck, landing, throwRange, PLAYER_KG, PICK_RADIUS, pairKey } from './strength.js';

export const THR_POLL_MS = 2500;
export const THROW_NEAR = PICK_RADIUS + 0.6;   // người khác đứng gần hơn mức này thì hiện nút Ném người
/** Người gần nhất trong tầm: list = [{id,n,x,z}]; trả phần tử hoặc null. */
export function nearestPlayer(list, x, z, maxD = THROW_NEAR) {
  let best = null, bd = maxD; for (const p of Array.isArray(list) ? list : []) { const d = Math.hypot(p.x - x, p.z - z); if (d <= bd) { bd = d; best = p; } }
  return best;
}
/** Gói báo trạng thái (không ném). */
export const stateReq = ({ pageId, name, lv, str, x, z, med }) => ({ id: pageId, n: name, lv, str, x, z, med: !!med });
/** Chuẩn bị một cú ném: kiểm luật ở máy mình trước (nhanh, báo lý do), tính điểm rơi tránh vật cản. Trả { ok, reason, wait, cost, req }. */
export function planThrow({ pageId, name, me, tgt, cd = {}, ry = 0 }) {
  const chk = throwCheck({ att: me, tgt, cd, attId: pageId, tgtId: tgt.id });
  if (!chk.ok) return { ...chk, req: null };
  const l = landing(me.x, me.z, ry, throwRange(me.str, PLAYER_KG));
  return { ...chk, req: { ...stateReq({ pageId, name, lv: me.lv, str: me.str, x: me.x, z: me.z, med: false }), ty: tgt.id, lx: l.x, lz: l.z }, land: l };
}
/** Lý do (chữ dễ hiểu) cho người chơi. */
export function reasonText(r, wait = 0) {
  return ({ level: 'Cấp của người đó không nhỏ hơn bạn nên không ném được.', strength: 'Sức mạnh của người đó không nhỏ hơn bạn.', weight: `Bạn chưa đủ sức nhấc một người (cần nhấc nổi ${PLAYER_KG} kg).`,
    temple: 'Trong khuôn viên chùa không được ném người.', meditating: 'Người đó đang thiền, đừng làm phiền.', cooldown: `Vừa ném người này, chờ ${Math.max(1, Math.ceil(wait))} giây nữa.`,
    far: 'Người đó đã đi xa, lại gần hơn rồi thử lại.', range: 'Không ném được hướng này.', invalid: 'Không ném được người này.' })[r] || 'Không ném được.';
}
/** Lấy cú ném mới nhất trong hộp thư (nếu có) → { x, z, from }. */
export function lastThrown(inbox) { const a = Array.isArray(inbox) ? inbox.filter((t) => t && Number.isFinite(+t.x) && Number.isFinite(+t.z)) : []; const t = a[a.length - 1]; return t ? { x: +t.x, z: +t.z, from: String(t.n || 'Một người') } : null; }
export { pairKey };
