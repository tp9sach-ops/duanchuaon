// Vật phẩm mua bằng LÁ BỒ ĐỀ (mục 1): Ngọc hồi máu + Ngọc dịch chuyển (Kim Hoàn Ngọc Lan), Gậy như ý (Điện Máy Lam Sen). Ván trượt: js/world/board.js.
// LOGIC THUẦN (không DOM/three.js), có test: tests/items.test.mjs. Hạn dùng lưu bằng MỐC GIỜ THẬT (Date.now) nên đổi tab / treo web vẫn đếm đúng.
// Số liệu theo yêu cầu ptg: Ngọc hồi máu 100 lá, hồi Sinh Lực nhanh gấp 5, 10 phút. Ngọc dịch chuyển 200 lá, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (không về cổng chùa), 20 phút. Gậy như ý 400 lá, +1% sát thương, có ánh sáng + hiệu ứng lan khi đánh.

export const REGEN_MUL = 5;
export const MAX_STACK = 3;   // mua thêm khi còn hạn thì cộng dồn thời gian, tối đa 3 lần thời lượng gốc
export const GEMS = [
  { id: 'hoimau', ten: 'Ngọc hồi máu', gia: 100, giay: 600, mo: 'Hồi Sinh Lực nhanh gấp 5 lần bình thường trong 10 phút.' },
  { id: 'dichchuyen', ten: 'Ngọc dịch chuyển', gia: 200, giay: 1200, mo: 'Trong 20 phút, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (đầy Sinh Lực), không bị đưa về cổng chùa.' },
];
export const STAFF = { id: 'nhuy', ten: 'Gậy như ý', gia: 400, dmg: 1.01, mo: 'Gậy đỏ đầu đồng chạm rồng, có ánh sáng; mỗi đòn đánh lan ra một vòng sáng và tăng 1% sát thương. Mua một lần dùng mãi.' };

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
export const gemById = (id) => GEMS.find((g) => g.id === id) || null;
export const emptyItems = () => ({ v: 1, exp: { hoimau: 0, dichchuyen: 0 }, staff: false });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); hỏng → trống. Mốc hết hạn vô lý (quá xa) bị kéo về trần. */
export function loadItems(raw, now = Date.now()) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyItems(); if (!isObj(o)) return s;
  s.staff = o.staff === true;
  const e = isObj(o.exp) ? o.exp : {};
  for (const g of GEMS) s.exp[g.id] = int(e[g.id], 0, now + g.giay * MAX_STACK * 1000);
  return s;
}

/** Số giây còn lại của một ngọc (0 = hết hạn / chưa mua). */
export const remainSec = (st, id, now = Date.now()) => Math.max(0, Math.ceil(((isObj(st) && isObj(st.exp) ? Number(st.exp[id]) || 0 : 0) - now) / 1000));
export const isActive = (st, id, now = Date.now()) => remainSec(st, id, now) > 0;

/** Mua một ngọc bằng lá bồ đề. la = số lá đang có. Trả { ok, reason: ''|'unknown'|'poor', cost, state }. Nơi gọi tự trừ lá khi ok. */
export function buyGem(state, id, la, now = Date.now()) {
  const g = gemById(id), st = loadItems(state, now);
  if (!g) return { ok: false, reason: 'unknown', cost: 0, state: st };
  if (!(Number(la) >= g.gia)) return { ok: false, reason: 'poor', cost: g.gia, state: st };
  const base = Math.max(now, st.exp[g.id]), exp = Math.min(base + g.giay * 1000, now + g.giay * MAX_STACK * 1000);
  return { ok: true, reason: '', cost: g.gia, state: { ...st, exp: { ...st.exp, [g.id]: exp } } };
}

/** Mua Gậy như ý. Trả { ok, reason: ''|'owned'|'poor', cost, state }. */
export function buyStaff(state, la, now = Date.now()) {
  const st = loadItems(state, now);
  if (st.staff) return { ok: false, reason: 'owned', cost: STAFF.gia, state: st };
  if (!(Number(la) >= STAFF.gia)) return { ok: false, reason: 'poor', cost: STAFF.gia, state: st };
  return { ok: true, reason: '', cost: STAFF.gia, state: { ...st, staff: true } };
}

/** Hệ số hồi Sinh Lực: Ngọc hồi máu còn hạn → ×5, không thì ×1. */
export const regenMul = (st, now = Date.now()) => (isActive(st, 'hoimau', now) ? REGEN_MUL : 1);
/** Có được hồi sinh tại chỗ không (Ngọc dịch chuyển còn hạn). */
export const canRevive = (st, now = Date.now()) => isActive(st, 'dichchuyen', now);
/** Hệ số sát thương: có Gậy như ý → ×1,01. */
export const dmgMul = (st) => (isObj(st) && st.staff === true ? STAFF.dmg : 1);
/** 605 giây → "10:05". */
export const fmtTime = (s) => { const n = Math.max(0, Math.floor(+s || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
