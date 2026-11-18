// Vật phẩm mua bằng LÁ BỒ ĐỀ (mục 1): Bánh sầu riêng 3 vị + Bánh sầu riêng pho mai than tre (tiệm Bánh Sầu Riêng 9 Sạch), Gậy như ý + Nón Jingasa (Điện Máy Lam Sen). Ván trượt: js/world/board.js.
// Phiên 163: Trà sữa xoài hoàng kim (tiệm trà Tách Hoa): mỗi ly cộng thêm 30 phút Tự động hàng yêu cho HÔM NAY (không có hạn dùng riêng: cộng thẳng vào trần ngày, xem addAutoBonus ở js/world/autoHunt.js).
// 14/11 (ptg đổi giá theo menu thật): Bánh sầu riêng 3 vị 155 lá, Bánh sầu riêng pho mai than tre 150 lá, Trà sữa xoài hoàng kim 39 lá. Ảnh vật phẩm: js/data/itemImages.js.
// Mục 3 (14/11): ĐỔI TÊN "Ngọc hồi máu" → "Bánh sầu riêng 3 vị", "Ngọc dịch chuyển" → "Bánh sầu riêng pho mai than tre"; nơi bán chuyển từ Kim Hoàn Ngọc Lan sang tiệm Bánh Sầu Riêng 9 Sạch.
//   GIỮ NGUYÊN id ('hoimau', 'dichchuyen'), thời lượng và hiệu lực để bản lưu cũ (localStorage 'lgt.items') vẫn đọc được và các chỗ gọi (regenMul / canRevive) không đổi.
// LOGIC THUẦN (không DOM/three.js), có test: tests/items.test.mjs. Hạn dùng lưu bằng MỐC GIỜ THẬT (Date.now) nên đổi tab / treo web vẫn đếm đúng.
// Số liệu theo yêu cầu ptg: Bánh sầu riêng 3 vị 155 lá, hồi Sinh Lực nhanh gấp 5, 10 phút. Bánh sầu riêng pho mai than tre 150 lá, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (không về cổng chùa), 20 phút. Gậy như ý 400 lá, +1% sát thương, có ánh sáng + hiệu ứng lan khi đánh.

export const REGEN_MUL = 5;
export const MAX_STACK = 3;   // mua thêm khi còn hạn thì cộng dồn thời gian, tối đa 3 lần thời lượng gốc
export const GEMS = [
  { id: 'hoimau', ten: 'Bánh sầu riêng 3 vị', gia: 155, giay: 600, mo: 'Ăn vào hồi Sinh Lực nhanh gấp 5 lần bình thường trong 10 phút.' },
  { id: 'dichchuyen', ten: 'Bánh sầu riêng pho mai than tre', gia: 150, giay: 1200, mo: 'Trong 20 phút, hết Sinh Lực thì hồi sinh NGAY TẠI CHỖ (đầy Sinh Lực), không bị đưa về cổng chùa.' },
];
export const STAFF = { id: 'nhuy', ten: 'Gậy như ý', gia: 400, dmg: 1.01, mo: 'Gậy đỏ đầu đồng chạm rồng, có ánh sáng; mỗi đòn đánh lan ra một vòng sáng và tăng 1% sát thương. Đánh thường đủ 3 đòn liên tiếp sẽ có rồng hồng bay quanh người. Mua một lần dùng mãi.' };

// Phiên 224 (mục 1, 17/11): GẬY DẠY CHÓ (id nội bộ 'tre'; Điện Máy Lam Sen, 150 lá bồ đề): +1% sát thương; ĐÒN ĐÁNH THƯỜNG THỨ 3 gây sát thương gấp 3 lần đòn thường (BAMBOO.hit3, thay hệ số 1,5 mặc định) và có SÓI KHÍ VÀNG vồ ra; hai đầu gậy chớp vàng đều; cưỡi gậy thì thu về tay xoay 3 vòng trên không; đánh nghe tiếng gỗ.
export const BAMBOO = { id: 'tre', ten: 'Gậy dạy chó', gia: 150, dmg: 1.01, hit3: 3, mo: 'Gậy dạy chó vàng óng, hai đầu chớp ánh sáng vàng đều; đánh nghe tiếng gỗ, +1% sát thương. Đòn đánh thường thứ 3 mạnh gấp 3 lần và có sói khí đầu to, bờm vàng vồ ra. Cưỡi gậy bay, thu về tay gậy xoay 3 vòng trên không. Mua một lần dùng mãi.' };

// Phiên 230 (mục 2, 18/11): CHỔI (id 'choi'; Điện Máy Lam Sen, 50 lá bồ đề): vũ khí thứ tư. Đòn đánh thường THỨ 3 = ĐẬP CHỔI (đầu chổi to nhấc lên rồi đập xuống, lá / cát / đá bay lên); mỗi đòn đánh có gió nhẹ thổi lên từ phía sau + tiếng quét lá, xột xoạt; cưỡi chổi: thu về tay thì chổi phi lên cao rồi nhẹ nhàng hạ xuống tay. Yêu cầu của ptg KHÔNG nêu thêm sát thương nên Chổi KHÔNG cộng % sát thương; đòn 3 giữ hệ số mặc định 1,5.
export const BROOM = { id: 'choi', ten: 'Chổi', gia: 50, mo: 'Cây chổi quét lá: đánh nghe tiếng quét lá, xột xoạt và có gió nhẹ thổi lên từ phía sau. Đòn đánh thường thứ 3 là ĐẬP CHỔI — đầu chổi to nhấc lên đập xuống, lá, cát, đá bay tung. Cưỡi chổi bay; thu về tay chổi phi vút lên cao rồi nhẹ nhàng hạ xuống tay. Mua một lần dùng mãi.' };

// Phiên 163: Trà sữa xoài hoàng kim (Tách Hoa, 39 lá bồ đề): +30 phút Tự động hàng yêu hôm nay mỗi ly (uống nhiều ly thì cộng dồn).
export const TRASUA = { id: 'trasua', ten: 'Trà sữa xoài hoàng kim', gia: 39, phut: 30, mo: 'Ly trà sữa xoài hoàng kim của tiệm Tách Hoa: uống vào được cộng thêm 30 phút Tự động hàng yêu cho hôm nay (cộng dồn với 60 phút gốc). Sang ngày mới trở về 60 phút.' };

// Phiên 154: Nón Jingasa (Điện Máy, 400 lá bồ đề): mua một lần, tự đội lên đầu, +3% giáp (đòn quái đánh trúng bớt 3%). Có thể cất / đội lại.
export const HAT = { id: 'non', ten: 'Nón Jingasa', gia: 400, giap: 0.03, mo: 'Nón lá sơn đen kiểu Jingasa: mua xong tự đội lên đầu nhân vật, tăng 3% giáp (quái đánh bớt đau 3%). Mua một lần dùng mãi.' };

const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
export const gemById = (id) => GEMS.find((g) => g.id === id) || null;
export const emptyItems = () => ({ v: 1, exp: { hoimau: 0, dichchuyen: 0 }, staff: false, tre: false, choi: false, hat: false, hatOn: false });

/** Đọc trạng thái đã lưu (chuỗi JSON hoặc đối tượng); hỏng → trống. Mốc hết hạn vô lý (quá xa) bị kéo về trần. */
export function loadItems(raw, now = Date.now()) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyItems(); if (!isObj(o)) return s;
  s.staff = o.staff === true;
  s.choi = o.choi === true;   // Phiên 230: Chổi (bản lưu cũ không có → chưa mua)
  s.tre = o.tre === true;   // Phiên 224: Gậy dạy chó (bản lưu cũ không có → chưa mua)
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

/** Mua Gậy dạy chó. Trả { ok, reason: ''|'owned'|'poor', cost, state }. */
/** Mua Chổi (50 lá). Trả { ok, reason: ''|'owned'|'poor', cost, state }. Nơi gọi tự trừ lá khi ok. */
export function buyBroom(state, la, now = Date.now()) {
  const st = loadItems(state, now);
  if (st.choi) return { ok: false, reason: 'owned', cost: BROOM.gia, state: st };
  if (!(Number(la) >= BROOM.gia)) return { ok: false, reason: 'poor', cost: BROOM.gia, state: st };
  return { ok: true, reason: '', cost: BROOM.gia, state: { ...st, choi: true } };
}
export function buyBamboo(state, la, now = Date.now()) {
  const st = loadItems(state, now);
  if (st.tre) return { ok: false, reason: 'owned', cost: BAMBOO.gia, state: st };
  if (!(Number(la) >= BAMBOO.gia)) return { ok: false, reason: 'poor', cost: BAMBOO.gia, state: st };
  return { ok: true, reason: '', cost: BAMBOO.gia, state: { ...st, tre: true } };
}

/** Hệ số hồi Sinh Lực: Bánh sầu riêng 3 vị còn hạn → ×5, không thì ×1. */
export const regenMul = (st, now = Date.now()) => (isActive(st, 'hoimau', now) ? REGEN_MUL : 1);
/** Có được hồi sinh tại chỗ không (Bánh sầu riêng pho mai than tre còn hạn). */
export const canRevive = (st, now = Date.now()) => isActive(st, 'dichchuyen', now);
/** Hệ số sát thương: có Gậy như ý → ×1,01. */
export const dmgMul = (st) => (isObj(st) && st.staff === true ? STAFF.dmg : 1);
/** Hệ số sát thương ĐÒN 3 của đánh thường khi đang cầm Gậy dạy chó (đã mua): ×3; không thì 1 (giữ hệ số đòn 3 mặc định). */
export const finisherMul = (st, holding = true) => (isObj(st) && st.tre === true && holding ? BAMBOO.hit3 : 1);
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
