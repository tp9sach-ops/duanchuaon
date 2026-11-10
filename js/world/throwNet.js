// Ném người chơi khác qua mạng — logic thuần (máy chủ: gas/Throw.gs, action 'thr'). Luật ném: js/world/strength.js (throwCheck).
import { throwCheck, landing, throwRange, PLAYER_KG, PICK_RADIUS, pairKey } from './strength.js';

export const THR_POLL_MS = 2500;
export const THR_POLL_FAST_MS = 1000;           // Phiên 91: có người đứng gần (hoặc đang khiêng/bị khiêng) → thăm dò dày hơn để người bị khiêng biết sớm
export const FAST_NEAR = 9;                     // "gần" cho việc thăm dò dày: người khác trong 9 m
export const HOLD_MS = 2000;                    // Phiên 91: khiêng người chơi trên vai TỐI ĐA 2 giây, hết giờ thì tự ném
export const HELD_MAX_MS = 4500;                // người bị khiêng tự được thả sau tối đa chừng này (phòng người khiêng mất mạng giữa chừng)
export const THROW_NEAR = PICK_RADIUS + 0.6;   // người khác đứng gần hơn mức này thì hiện nút Ném người
/** Người gần nhất trong tầm: list = [{id,n,x,z}]; trả phần tử hoặc null. */
export function nearestPlayer(list, x, z, maxD = THROW_NEAR) {
  let best = null, bd = maxD; for (const p of Array.isArray(list) ? list : []) { const d = Math.hypot(p.x - x, p.z - z); if (d <= bd) { bd = d; best = p; } }
  return best;
}
/** Còn bao nhiêu giây khiêng (0 = hết giờ). t0, now tính bằng ms. */
export const holdLeft = (t0, now) => Math.max(0, ((Number.isFinite(+t0) ? +t0 : 0) + HOLD_MS - (Number.isFinite(+now) ? +now : 0)) / 1000);
/** Đọc phần "đang bị khiêng" máy chủ trả về cho MÌNH → { f (mã người khiêng), n (tên), ms (còn bao lâu, đã kẹp) } hoặc null. */
export function heldInfo(res) {
  const h = res && typeof res === 'object' ? res.held : null; if (!h || typeof h !== 'object') return null;
  const ms = +h.ms; if (!Number.isFinite(ms) || ms <= 0 || typeof h.f !== 'string' || !h.f) return null;
  return { f: h.f, n: String(h.n || 'Một người').slice(0, 20), ms: Math.min(HELD_MAX_MS, ms) };
}
/** Gói báo trạng thái (không ném). */
export const stateReq = ({ pageId, name, lv, str, x, z, med }) => ({ id: pageId, n: name, lv, str, x, z, med: !!med });
/** Chuẩn bị KHIÊNG một người lên vai (Phiên 91): kiểm luật ở máy mình (cấp, sức mạnh, chùa, thiền, hồi chiêu). Trả { ok, reason, wait, cost, req }. */
export function planGrab({ pageId, name, me, tgt, cd = {} }) {
  const chk = throwCheck({ att: me, tgt, cd, attId: pageId, tgtId: tgt.id });
  if (!chk.ok) return { ...chk, req: null };
  return { ...chk, req: { ...stateReq({ pageId, name, lv: me.lv, str: me.str, x: me.x, z: me.z, med: false }), ty: tgt.id, g: 1 } };
}
/** Điểm rơi + gói ném người ĐANG KHIÊNG (không kiểm lại cấp/sức mạnh: máy chủ đã kiểm lúc khiêng). */
export function planHeldThrow({ pageId, name, me, tgtId, ry = 0 }) {
  const l = landing(me.x, me.z, ry, throwRange(me.str, PLAYER_KG));
  return { land: l, req: { ...stateReq({ pageId, name, lv: me.lv, str: me.str, x: me.x, z: me.z, med: false }), ty: tgtId, lx: l.x, lz: l.z } };
}
/** Chuẩn bị một cú ném (cũ, ném ngay không khiêng — giữ cho test/đối chiếu luật): kiểm luật ở máy mình trước (nhanh, báo lý do), tính điểm rơi tránh vật cản. Trả { ok, reason, wait, cost, req }. */
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
    far: 'Người đó đã đi xa, lại gần hơn rồi thử lại.', held: 'Người đó đang bị người khác khiêng.', busy: 'Bạn đang bận, chờ một chút.', nothold: 'Bạn chưa khiêng ai (hoặc đã quá giờ).', range: 'Không ném được hướng này.', invalid: 'Không ném được người này.' })[r] || 'Không ném được.';
}
/** Lấy cú ném mới nhất trong hộp thư (nếu có) → { x, z, from }. */
export function lastThrown(inbox) { const a = Array.isArray(inbox) ? inbox.filter((t) => t && Number.isFinite(+t.x) && Number.isFinite(+t.z)) : []; const t = a[a.length - 1]; return t ? { x: +t.x, z: +t.z, from: String(t.n || 'Một người') } : null; }
export { pairKey };
