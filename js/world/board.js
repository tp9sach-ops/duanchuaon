// Ván trượt (Phiên 92): mua ở Điện Máy Lam Sen, đứng lên ván thì đi nhanh gấp đôi. LOGIC THUẦN (không DOM/three.js, có test): tests/board.test.mjs. Giao diện: js/ui/board.js.
export const BOARD = { id: 'vantruot', ten: 'Ván trượt', gia: 100, mul: 2, don: 'sen' };   // giá 100 hạt sen (quy ước tạm, chờ Gp duyệt); đứng trên ván: tốc độ ×2

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); hỏng → chưa có ván, đứng dưới đất. */
export function loadBoard(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const own = isObj(o) && o.own === true;
  return { own, on: own && isObj(o) && o.on === true };
}

/** Mua ván. sen = số hạt sen đang có. Trả { ok, reason: ''|'owned'|'poor', cost, state }. Nơi gọi tự trừ hạt sen (LGT.spendSen(cost)) khi ok. */
export function buyBoard(state, sen) {
  const st = loadBoard(state), cost = BOARD.gia;
  if (st.own) return { ok: false, reason: 'owned', cost, state: st };
  if (!(Number(sen) >= cost)) return { ok: false, reason: 'poor', cost, state: st };
  return { ok: true, reason: '', cost, state: { own: true, on: false } };
}

/** Lên/xuống ván. Chưa có ván thì không lên được. Trả { ok, reason: ''|'none', state }. */
export function toggleBoard(state, want) {
  const st = loadBoard(state);
  if (!st.own) return { ok: false, reason: 'none', state: st };
  const on = typeof want === 'boolean' ? want : !st.on;
  return { ok: true, reason: '', state: { own: true, on } };
}

/** Hệ số tốc độ: đang đứng trên ván → ×2, còn lại ×1. */
export const boardSpeedMul = (state) => (loadBoard(state).on ? BOARD.mul : 1);

/** Có được phép đứng trên ván lúc này không (ngoài nhà, đi lại tự do, không bơi/lặn). c = { free, inHouse, swim }. */
export const canRide = (c = {}) => !!(isObj(c) && c.free && !c.inHouse && !c.swim);
