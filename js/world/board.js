// Ván trượt 3D (mục 1; trước là Thương bay Phiên 130, Ván trượt Phiên 92): mua ở Điện Máy Lam Sen bằng 100 LÁ BỒ ĐỀ, đứng lên ván đi nhanh gấp 1,5 lần. LOGIC THUẦN (không DOM/three.js, có test): tests/board.test.mjs. Giao diện: js/ui/board.js.
// Giữ nguyên tên hàm/khóa (BOARD, 'vantruot', lgt.board) để không mất dữ liệu đã lưu: người đã có Thương bay thì nhận ván trượt không phải mua lại.
export const BOARD = { id: 'vantruot', ten: 'Ván trượt', gia: 100, mul: 1.5, don: 'la' };   // 100 lá bồ đề; đứng trên ván: tốc độ ×1,5 (hơn bình thường 0,5 lần)

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); hỏng → chưa có ván, đứng dưới đất. */
export function loadBoard(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const own = isObj(o) && o.own === true;
  return { own, on: own && isObj(o) && o.on === true };
}

/** Mua ván. la = số lá bồ đề đang có. Trả { ok, reason: ''|'owned'|'poor', cost, state }. Nơi gọi tự trừ lá (LGT.merit.spendLa(cost)) khi ok. */
export function buyBoard(state, la) {
  const st = loadBoard(state), cost = BOARD.gia;
  if (st.own) return { ok: false, reason: 'owned', cost, state: st };
  if (!(Number(la) >= cost)) return { ok: false, reason: 'poor', cost, state: st };
  return { ok: true, reason: '', cost, state: { own: true, on: false } };
}

/** Lên/xuống ván. Chưa có ván thì không lên được. Trả { ok, reason: ''|'none', state }. */
export function toggleBoard(state, want) {
  const st = loadBoard(state);
  if (!st.own) return { ok: false, reason: 'none', state: st };
  const on = typeof want === 'boolean' ? want : !st.on;
  return { ok: true, reason: '', state: { own: true, on } };
}

/** Hệ số tốc độ: đang đứng trên ván → ×1,5, còn lại ×1. */
export const boardSpeedMul = (state) => (loadBoard(state).on ? BOARD.mul : 1);

/** Có được phép lướt ván lúc này không (ngoài nhà, đi lại tự do, không bơi/lặn, KHÔNG đang giao chiến). c = { free, inHouse, swim, fight }. */
export const canRide = (c = {}) => !!(isObj(c) && c.free && !c.inHouse && !c.swim && !c.fight);

/** Ván bay về tay khi vào trận: xoay trọn MỘT vòng quanh người (SPIN_S giây) rồi lao về bàn tay (FLY_S giây). */
export const SPIN_S = 0.55, FLY_S = 0.35, RETURN_S = SPIN_S + FLY_S, ORBIT_R = 0.95;
const ease = (x) => x * x * (3 - 2 * x);
/** Tư thế ván tại giây t kể từ lúc bắt đầu bay về. Trả { done, ang (rad, 0..2π quanh người), rad (bán kính quỹ đạo), blend (0 = trên quỹ đạo, 1 = đã ở tay) }. t lạ → coi như 0. */
export function returnPose(t) {
  const x = Number.isFinite(+t) ? Math.max(0, +t) : 0;
  if (x >= RETURN_S) return { done: true, ang: Math.PI * 2, rad: 0, blend: 1 };
  if (x < SPIN_S) return { done: false, ang: (x / SPIN_S) * Math.PI * 2, rad: ORBIT_R, blend: 0 };
  const e = ease((x - SPIN_S) / FLY_S);
  return { done: false, ang: Math.PI * 2, rad: ORBIT_R * (1 - e), blend: e };
}
