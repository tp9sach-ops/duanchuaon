// Lá bồ đề (Phiên 35, bước 1 của hệ thống xây nhà). LOGIC THUẦN (không DOM/three.js), có test: tests/merit.test.mjs.
// Luật ptg chốt 07/11: công đức = hạt sen (ví cũ `lgt.wallet`). 10 hạt sen = 1 lá bồ đề (đổi ở NPC). 100 lá = 1 lô đất (tặng nhà trống).
// Hạt sen đã tiêu đổi lá được ghi vào `spent` để điểm bảng xếp hạng (tổng sen từng kiếm = sen còn + spent) không tụt khi đổi.
// Ví chỉ ở máy người chơi nên sửa được; xác nhận phía máy chủ làm ở bước cuối (xem docs/PHIEN34.md). Các con số là QUY ƯỚC, ptg có thể chỉnh.

export const SEN_PER_LA = 10;
export const LAND_LA = 100;                // giá một lô đất (lá bồ đề), dùng ở bước 2
export const MED_SECONDS_PER_SEN = 180;    // ngồi thiền: cứ 3 phút thật được 1 hạt sen
export const DAILY_CAP = { thien: 10 };
/** Phiên 41: hạt sen từ lạy Phật (lay), cúng/thả đèn nguyện (cung), thắp nhang (nhang): mỗi việc tối đa 10 lần được thưởng mỗi ngày (ptg chốt 07/11). */
export const ACT_CAP = { lay: 10, cung: 10, nhang: 10 };    // trần hạt sen mỗi ngày theo nguồn (để cày có nhịp, không vô hạn)
const MAX_DT = 2;                          // mỗi lần cộng giờ thiền tối đa 2 giây (chống cộng dồn)
const MAX_LA = 1e7;

const int = (x, lo, hi) => (Number.isFinite(+x) ? Math.max(lo, Math.min(hi, Math.floor(+x))) : lo);
const cleanActs = (a) => { const r = {}; if (isObj(a)) for (const k of Object.keys(ACT_CAP)) { const n = int(a[k], 0, ACT_CAP[k]); if (n > 0) r[k] = n; } return r; };
const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
export const dayKey = (now = Date.now()) => { const d = new Date(now), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

/** Trạng thái lá: la = số lá đang có; spent = tổng hạt sen đã đem đổi; day = bộ đếm trong ngày { k, thien (số sen thiền đã nhận), med (giây thiền dở) }. */
export const emptyLeaf = () => ({ v: 1, la: 0, spent: 0, day: { k: '', thien: 0, med: 0, acts: {} } });

export function loadLeaf(raw) {
  let o = raw; if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (_) { o = null; } }
  const s = emptyLeaf(); if (!isObj(o)) return s;
  s.la = int(o.la, 0, MAX_LA); s.spent = int(o.spent, 0, 1e9);
  if (s.spent < s.la * SEN_PER_LA) s.spent = s.la * SEN_PER_LA;      // dữ liệu vô lý (ít sen đã tiêu hơn số lá có) → chỉnh lại cho nhất quán
  if (isObj(o.day) && typeof o.day.k === 'string') s.day = { k: o.day.k.slice(0, 10), thien: int(o.day.thien, 0, DAILY_CAP.thien), med: int(o.day.med, 0, MED_SECONDS_PER_SEN - 1), acts: cleanActs(o.day.acts) };
  return s;
}

/** Số lá tối đa đổi được với `sen` hạt sen. */
export const maxLa = (sen) => Math.floor(int(sen, 0, 1e9) / SEN_PER_LA);

/**
 * Đổi `n` lá bồ đề: trả { ok, reason: ''|'invalid'|'poor', leaf (mới), cost (hạt sen phải trừ) }.
 * Không sửa leaf cũ; thiếu sen hoặc n không hợp lệ thì ok=false và leaf giữ nguyên.
 */
export function exchange(leaf, sen, n) {
  const k = Number.isFinite(+n) ? Math.floor(+n) : 0;
  if (k < 1 || k > 1e5) return { ok: false, reason: 'invalid', leaf, cost: 0 };
  const cost = k * SEN_PER_LA; if (int(sen, 0, 1e9) < cost) return { ok: false, reason: 'poor', leaf, cost };
  return { ok: true, reason: '', leaf: { ...leaf, day: { ...leaf.day }, la: int(leaf.la + k, 0, MAX_LA), spent: int(leaf.spent + cost, 0, 1e9) }, cost };
}

/** Tiêu `n` lá bồ đề (mua đất, đồ...). Trả { ok, leaf }; không đủ lá hoặc n sai thì ok=false, leaf giữ nguyên. `spent` (sen đã đổi) không đổi nên điểm xếp hạng không tụt. */
export function spendLa(leaf, n) {
  const k = Number.isFinite(+n) ? Math.floor(+n) : 0;
  if (k < 1 || k > leaf.la) return { ok: false, leaf };
  return { ok: true, leaf: { ...leaf, day: { ...leaf.day }, la: leaf.la - k } };
}

/** Tổng hạt sen từng kiếm = sen còn + đã đổi (dùng cho bảng xếp hạng/đồng bộ). */
export const lifetimeSen = (sen, leaf) => int(sen, 0, 1e9) + int(leaf && leaf.spent, 0, 1e9);

/**
 * Cộng thời gian ngồi thiền (giây thật, mỗi lần ≤ 2 giây). Cứ 180 giây được 1 hạt sen, tối đa DAILY_CAP.thien mỗi ngày.
 * Trả { leaf (mới), sen (hạt sen vừa được cộng, thường 0 hoặc 1) }.
 */
export function addMeditation(leaf, dt, now = Date.now()) {
  const k = dayKey(now), day = leaf.day.k === k ? { ...leaf.day } : { k, thien: 0, med: 0, acts: {} };
  const add = Number.isFinite(+dt) ? Math.max(0, Math.min(MAX_DT, +dt)) : 0;
  let sen = 0;
  if (day.thien < DAILY_CAP.thien && add > 0) {
    day.med += add;
    while (day.med >= MED_SECONDS_PER_SEN && day.thien < DAILY_CAP.thien) { day.med -= MED_SECONDS_PER_SEN; day.thien += 1; sen += 1; }
    if (day.thien >= DAILY_CAP.thien) day.med = 0;
  }
  day.med = Math.min(MED_SECONDS_PER_SEN - 1, Math.floor(day.med * 1000) / 1000);
  return { leaf: { ...leaf, day }, sen };
}

/**
 * Xin thưởng hạt sen cho một lần lạy/cúng/nhang (Phiên 41). kind: 'lay' | 'cung' | 'nhang'. Mỗi loại tối đa ACT_CAP lần mỗi ngày (sang ngày mới thì đếm lại).
 * Trả { ok, used (số lần đã dùng hôm nay, kể cả lần này), left (còn mấy lần), leaf (mới) }. Hết lượt hoặc loại lạ: ok=false, leaf giữ nguyên. Không sửa đầu vào.
 */
export function claimAct(leaf, kind, now = Date.now()) {
  const cap = ACT_CAP[kind]; if (!cap) return { ok: false, used: 0, left: 0, leaf };
  const k = dayKey(now), base = leaf.day.k === k ? leaf.day : { k, thien: 0, med: 0, acts: {} };
  const acts = { ...(base.acts || {}) }, used = int(acts[kind], 0, cap);
  if (used >= cap) return { ok: false, used, left: 0, leaf };
  acts[kind] = used + 1;
  return { ok: true, used: used + 1, left: cap - used - 1, leaf: { ...leaf, day: { ...base, acts } } };
}
