// Nguồn Tu Vi (G1.4, GDD v2 mục 4.3). LOGIC THUẦN (không DOM, không three.js, không đọc đồng hồ): mọi hàm nhận `now` (ms) từ ngoài.
// Số liệu: js/data/nguon.js (TẠM). Test: tests/nguontuvi.test.mjs. CHƯA nối giao diện/sự kiện (việc của G1.5–G1.6).
import { NGUON_CFG } from '../data/nguon.js';
import { clampTuVi, expToNext, levelFromExp } from './stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
export const NGUON_IDS = Object.freeze(['hangYeu', 'nhiemVu', 'hoatDong', 'boss']);

/** Khóa ngày theo giờ Việt Nam: 'YYYY-MM-DD'. `now` lạ → ngày 1970-01-01 (không ném lỗi). */
export function dayKeyVN(now) {
  const ms = Math.floor(num(now, 0)) + NGUON_CFG.muiGio * 3600 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Trạng thái đếm hoạt động chùa của một ngày: { day, counts: {thien, tung, lay} }. */
export function freshState(now) {
  const counts = {};
  for (const k of NGUON_CFG.nguon.hoatDong.loai) counts[k] = 0;
  return { day: dayKeyVN(now), counts };
}

/** Đưa trạng thái lưu (có thể thiếu/hỏng) về dạng chuẩn và RESET khi sang ngày mới (giờ VN). Không sửa đối tượng đầu vào. */
export function normalizeState(state, now) {
  const f = freshState(now);
  if (!state || typeof state !== 'object' || state.day !== f.day) return f;
  for (const k of NGUON_CFG.nguon.hoatDong.loai) {
    const c = Math.floor(num(state.counts && state.counts[k], 0));
    f.counts[k] = Math.max(0, Math.min(NGUON_CFG.nguon.hoatDong.tranNgay, c));
  }
  return f;
}

/** Hệ số chống cày quái yếu: 1 nếu Tu Vi hơn quái ≤ mienGiam cấp; mỗi cấp vượt giảm giamMoiCap; thấp nhất san. Cấp quái lạ → 1. */
export function chenhLechFactor(tuvi, monsterLevel) {
  if (monsterLevel === undefined || monsterLevel === null || !Number.isFinite(+monsterLevel)) return 1;
  const c = NGUON_CFG.chenhLech, gap = clampTuVi(tuvi) - Math.floor(+monsterLevel);
  if (gap <= c.mienGiam) return 1;
  return Math.max(c.san, 1 - (gap - c.mienGiam) * c.giamMoiCap);
}

/** EXP của MỘT lần nhận từ nguồn `nguon` ở Tu Vi `tuvi` (chưa tính trần ngày). Ở cấp tối đa hoặc nguồn lạ → 0. Tối thiểu 1 khi còn lên cấp được. */
export function expPerAction(nguon, tuvi, opts = {}) {
  const cfg = NGUON_CFG.nguon[nguon];
  if (!cfg) return 0;
  const need = expToNext(tuvi);
  if (need <= 0) return 0;
  const f = nguon === 'hangYeu' ? chenhLechFactor(tuvi, opts.monsterLevel) : 1;
  return Math.max(1, Math.round(need * cfg.moiLan * f));
}

/**
 * Cộng EXP từ một sự kiện. Trả { gain, exp, tuvi, leveledUp, state, reason }.
 *  in: { exp (tổng hiện có), nguon, loai ('thien'|'tung'|'lay', bắt buộc với hoatDong), monsterLevel?, state, now }
 *  reason: 'ok' | 'tran-ngay' (hoạt động đã đủ 5 lần hôm nay) | 'nguon-la' | 'loai-la' | 'cap-toi-da'.
 * Không sửa `state` đầu vào; trả trạng thái mới.
 */
export function award({ exp = 0, nguon, loai, monsterLevel, state, now = 0 } = {}) {
  const e0 = Math.max(0, Math.floor(num(exp, 0)));
  const st = normalizeState(state, now);
  const lv0 = levelFromExp(e0);
  const out = (gain, reason, s = st) => ({ gain, exp: e0 + gain, tuvi: levelFromExp(e0 + gain), leveledUp: levelFromExp(e0 + gain) > lv0, state: s, reason });
  if (!NGUON_CFG.nguon[nguon]) return out(0, 'nguon-la');
  if (nguon === 'hoatDong') {
    const h = NGUON_CFG.nguon.hoatDong;
    if (!h.loai.includes(loai)) return out(0, 'loai-la');
    if (st.counts[loai] >= h.tranNgay) return out(0, 'tran-ngay');
    const gain = expPerAction(nguon, lv0);
    if (gain <= 0) return out(0, 'cap-toi-da');
    const s2 = { day: st.day, counts: { ...st.counts, [loai]: st.counts[loai] + 1 } };
    return out(gain, 'ok', s2);
  }
  const gain = expPerAction(nguon, lv0, { monsterLevel });
  return gain <= 0 ? out(0, 'cap-toi-da') : out(gain, 'ok');
}
