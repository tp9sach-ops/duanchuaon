// Vật phẩm mua bằng LÁ BỒ ĐỀ (mục 1): Bánh sầu riêng 3 vị + Bánh sầu riêng pho mai than tre (tiệm Bánh Sầu Riêng 9 Sạch), Gậy như ý + Nón Jingasa (Điện Máy Lam Sen). Ván trượt: js/world/board.js.
// Phiên 163: Trà sữa xoài hoàng kim (tiệm trà Tách Hoa, 50 lá bồ đề): mỗi ly cộng thêm 30 phút Tự động hàng yêu cho HÔM NAY (không có hạn dùng riêng: cộng thẳng vào trần ngày, xem addAutoBonus ở js/world/autoHunt.js).
// Mục 3 (14/11): ĐỔI TÊN "Ngọc hồi máu" → "Bánh sầu riêng 3 vị", "Ngọc dịch chuyển" → "Bánh sầu riêng pho mai than tre"; nơi bán chuyển từ Kim Hoàn Ngọc Lan sang tiệm Bánh Sầu Riêng 9 Sạch.
//   GIỮ NGUYÊN id ('hoimau', 'dichchuyen'), giá, thời lượng và hiệu lực để bản lưu cũ (localStorage 'lgt.items') vẫn đọc được và các chỗ gọi (regenMul / canRevive) không đổi.
// LOGIC THUẦN (không DOM/three.js), có test: tests/items.test.mjs. Hạn dùng lưu bằng MỐC GIỜ THẬT (Date.now) nên đổi tab / treo web vẫn đếm đúng.
// Số liệu theo yêu cầu ptg: Bánh sầu riêng 3 vị 100 lá, hồi Sinh Lực nhanh gấp 5, 10 phút. Bánh sầu riêng pho mai than tre 200 lá, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (không về cổng chùa), 20 phút. Gậy như ý 400 lá, +1% sát thương, có ánh sáng + hiệu ứng lan khi đánh.

export const REGEN_MUL = 5;
export const MAX_STACK = 3;   // mua thêm khi còn hạn thì cộng dồn thời gian, tối đa 3 lần thời lượng gốc
export const GEMS = [
  { id: 'hoimau', ten: 'Bánh sầu riêng 3 vị', gia: 100, giay: 600, mo: 'Ăn vào hồi Sinh Lực nhanh gấp 5 lần bình thường trong 10 phút.' },
  { id: 'dichchuyen', ten: 'Bánh sầu riêng pho mai than tre', gia: 200, giay: 1200, mo: 'Trong 20 phút, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (đầy Sinh Lực), không bị đưa về cổng chùa.' },
];
export const STAFF = { id: 'nhuy', ten: 'Gậy như ý', gia: 400, dmg: 1.01, mo: 'Gậy đỏ đầu đồng chạm rồng, có ánh sáng; mỗi đòn đánh lan ra một vòng sáng và tăng 1% sát thương. Đánh thường đủ 3 đòn liên tiếp sẽ có rồng hồng bay quanh người. Mua một lần dùng mãi.' };

// Phiên 163: Trà sữa xoài hoàng kim (Tách Hoa, 50 lá bồ đề): +30 phút Tự động hàng yêu hôm nay mỗi ly (uống nhiều ly thì cộng dồn).
export const TRASUA = { id: 'trasua', ten: 'Trà sữa xoài hoàng kim', gia: 50, phut: 30, mo: 'Ly trà sữa xoài hoàng kim của tiệm Tách Hoa: uống vào được cộng thêm 30 phút Tự động hàng yêu cho hôm nay (cộng dồn với 60 phút gốc). Sang ngày mới trở về 60 phút.' };

// Phiên 154: Nón Jingasa (Điện Máy, 400 lá bồ đề): mua một lần, tự đội lên đầu, +3% giáp (đòn quái đánh trúng bớt 3%). Có thể cất / đội lại.
export const HAT = { id: 'non', ten: 'Nón Jingasa', gia: 400, giap: 0.03, mo: 'Nón lá sơn đen kiểu Jingasa: mua xong tự đội lên đầu nhân vật, tăng 3% giáp (quái đánh bớt đau 3%). Mua một lần dùng mãi.' };

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
export const gemById = (id) => GEMS.find((g) => g.id === id) || null;
export const emptyItems = () => ({ v: 1, exp: { hoimau: 0, dichchuyen: 0 }, staff: false, hat: false, hatOn: false });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); hỏng → trống. Mốc hết hạn vô lý (quá xa) bị kéo về trần. */
export function loadItems(raw, now = Date.now()) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyItems(); if (!isObj(o)) return s;
  s.staff = o.staff === true;
  s.hat = o.hat === true; s.hatOn = s.hat && o.hatOn !== false;   // bản lưu cũ không có hat → chưa mua; đã mua mà không ghi hatOn → đang đội
  const e = isObj(o.exp) ? o.exp : {};
  for (const g of GEMS) s.exp[g.id] = int(e[g.id], 0, now + g.giay * MAX_STACK * 1000);
  return s;
}

/** Số giây còn lại của một món (bánh) (0 = hết hạn / chưa mua). */
export const remainSec = (st, id, now = Date.now()) => Math.max(0, Math.ceil(((isObj(st) && isObj(st.exp) ? Number(st.exp[id]) || 0 : 0) - now) / 1000));
export const isActive = (st, id, now = Date.now()) => remainSec(st, id, now) > 0;

/** Mua một món bánh bằng lá bồ đề. la = số lá đang có. Trả { ok, reason: ''|'unknown'|'poor', cost, state }. Nơi gọi tự trừ lá khi ok. */
export function buyGem(state, id, la, now = Date.now()) {
  const g = gemById(id), st = loadItems(state, now);
  if (!g) return { ok: false, reason: 'unknown', cost: 0, state: st };
  if (!(Number(la) >= g.gia)) return { ok: false, reason: 'poor', cost: g.gia, state: st };
  const base = Math.max(now, st.exp[g.id]), exp = Math.min(base + g.giay * 1000, now + g.giay * MAX_STACK * 1000);
  return { ok: true, reason: '', cost: g.gia, state: { ...st, exp: { ...st.exp, [g.id]: exp } } };
}

/** Mua một ly Trà sữa xoài hoàng kim. Trả { ok, reason: ''|'poor', cost, sec } (sec = số giây cộng vào trần Tự động hàng yêu hôm nay). Nơi gọi tự trừ lá và gọi addAutoBonus khi ok. Không có trạng thái riêng nên bản lưu 'lgt.items' không đổi. */
export function buyTraSua(la) {
  if (!(Number(la) >= TRASUA.gia)) return { ok: false, reason: 'poor', cost: TRASUA.gia, sec: 0 };
  return { ok: true, reason: '', cost: TRASUA.gia, sec: TRASUA.phut * 60 };
}

/** Mua Gậy như ý. Trả { ok, reason: ''|'owned'|'poor', cost, state }. */
export function buyStaff(state, la, now = Date.now()) {
  const st = loadItems(state, now);
  if (st.staff) return { ok: false, reason: 'owned', cost: STAFF.gia, state: st };
  if (!(Number(la) >= STAFF.gia)) return { ok: false, reason: 'poor', cost: STAFF.gia, state: st };
  return { ok: true, reason: '', cost: STAFF.gia, state: { ...st, staff: true } };
}

/** Hệ số hồi Sinh Lực: Bánh sầu riêng 3 vị còn hạn → ×5, không thì ×1. */
export const regenMul = (st, now = Date.now()) => (isActive(st, 'hoimau', now) ? REGEN_MUL : 1);
/** Có được hồi sinh tại chỗ không (Bánh sầu riêng pho mai than tre còn hạn). */
export const canRevive = (st, now = Date.now()) => isActive(st, 'dichchuyen', now);
/** Hệ số sát thương: có Gậy như ý → ×1,01. */
export const dmgMul = (st) => (isObj(st) && st.staff === true ? STAFF.dmg : 1);
/** 605 giây → "10:05". */
export const fmtTime = (s) => { const n = Math.max(0, Math.floor(+s || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

/** Mua Nón Jingasa (tự đội). Trả { ok, reason: ''|'owned'|'poor', cost, state }. */
export function buyHat(state, la, now = Date.now()) {
  const st = loadItems(state, now);
  if (st.hat) return { ok: false, reason: 'owned', cost: HAT.gia, state: st };
  if (!(Number(la) >= HAT.gia)) return { ok: false, reason: 'poor', cost: HAT.gia, state: st };
  return { ok: true, reason: '', cost: HAT.gia, state: { ...st, hat: true, hatOn: true } };
}
/** Đội / cất nón (chưa mua thì không đổi gì). */
export function toggleHat(state, now = Date.now()) {
  const st = loadItems(state, now); if (!st.hat) return st;
  return { ...st, hatOn: !st.hatOn };
}
export const hatWorn = (st) => isObj(st) && st.hat === true && st.hatOn !== false;
/** Hệ số giáp: đang đội nón → ×0,97 lượng sát thương nhận, không thì ×1. */
export const armorMul = (st) => (hatWorn(st) ? 1 - HAT.giap : 1);
/** Sát thương sau giáp (làm tròn, tối thiểu 1; giá trị lạ → 0). */
export function afterArmor(dmg, st) {
  const d = Number(dmg); if (!Number.isFinite(d) || d <= 0) return 0;
  return Math.max(1, Math.round(d * armorMul(st)));
}
