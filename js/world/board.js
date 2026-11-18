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
// Phiên 224: GẬY TRE cưỡi — thu về tay thì bay lên cao, XOAY 3 VÒNG trên không (TRE_SPIN_S giây, TRE_LIFT m nhấc lên) rồi nhẹ nhàng về tay (FLY_S giây).
export const TRE_TURNS = 3, TRE_SPIN_S = 1.2, TRE_LIFT = 0.9, TRE_RETURN_S = TRE_SPIN_S + FLY_S;
// Phiên 230: CHỔI cưỡi — thu về tay thì PHI VÚT LÊN CAO (CHOI_UP_S giây, CHOI_LIFT m), lơ lửng một nhịp (CHOI_HOVER_S) rồi NHẸ NHÀNG HẠ xuống tay (CHOI_DOWN_S giây, êm dần). Số TẠM, chờ ptg xem.
export const CHOI_UP_S = 0.6, CHOI_HOVER_S = 0.25, CHOI_DOWN_S = 1.1, CHOI_LIFT = 3.2, CHOI_RAD = 0.55, CHOI_RETURN_S = CHOI_UP_S + CHOI_HOVER_S + CHOI_DOWN_S;
const easeOut3 = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
/** Tư thế ván tại giây t kể từ lúc bắt đầu bay về. Trả { done, lift (m, chỉ Gậy tre), ang (rad, 0..2π quanh người; Gậy tre 0..6π = 3 vòng), rad (bán kính quỹ đạo), blend (0 = trên quỹ đạo, 1 = đã ở tay) }. t lạ → coi như 0. */
export function returnPose(t, id) {
  const x = Number.isFinite(+t) ? Math.max(0, +t) : 0;
  if (id === 'tre') {   // Phiên 224: 3 vòng trên không, nhấc lên rồi hạ xuống tay. lift (m) = độ nhấc thêm so với quỹ đạo thường.
    if (x >= TRE_RETURN_S) return { done: true, ang: Math.PI * 2 * TRE_TURNS, rad: 0, blend: 1, lift: 0 };
    if (x < TRE_SPIN_S) { const k = x / TRE_SPIN_S; return { done: false, ang: k * Math.PI * 2 * TRE_TURNS, rad: ORBIT_R, blend: 0, lift: Math.sin(Math.PI * Math.min(1, k * 1.0)) * TRE_LIFT }; }
    const e2 = ease((x - TRE_SPIN_S) / FLY_S);
    return { done: false, ang: Math.PI * 2 * TRE_TURNS, rad: ORBIT_R * (1 - e2), blend: e2, lift: 0 };
  }
  if (id === 'choi') {   // Phiên 230: phi lên cao → lơ lửng → hạ nhẹ xuống tay (không xoay vòng; ang cố định để chổi không lật)
    if (x >= CHOI_RETURN_S) return { done: true, ang: 0.6, rad: 0, blend: 1, lift: 0 };
    if (x < CHOI_UP_S) return { done: false, ang: 0.6, rad: CHOI_RAD, blend: 0, lift: CHOI_LIFT * easeOut3(x / CHOI_UP_S) };
    if (x < CHOI_UP_S + CHOI_HOVER_S) return { done: false, ang: 0.6, rad: CHOI_RAD, blend: 0, lift: CHOI_LIFT + 0.08 * Math.sin(((x - CHOI_UP_S) / CHOI_HOVER_S) * Math.PI * 2) };
    const e3 = ease((x - CHOI_UP_S - CHOI_HOVER_S) / CHOI_DOWN_S);
    return { done: false, ang: 0.6, rad: CHOI_RAD * (1 - e3), blend: e3, lift: CHOI_LIFT * (1 - e3) };
  }
  if (x >= RETURN_S) return { done: true, ang: Math.PI * 2, rad: 0, blend: 1, lift: 0 };
  if (x < SPIN_S) return { done: false, ang: (x / SPIN_S) * Math.PI * 2, rad: ORBIT_R, blend: 0, lift: 0 };
  const e = ease((x - SPIN_S) / FLY_S);
  return { done: false, ang: Math.PI * 2, rad: ORBIT_R * (1 - e), blend: e, lift: 0 };
}
