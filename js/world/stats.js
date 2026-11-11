// Chỉ số chiến đấu theo Tu Vi: Công, Thủ, Sinh Lực (G1.1, GDD v2). LOGIC THUẦN (không DOM, không three.js), có test: tests/stats.test.mjs.
// Tu Vi 1..150 là hệ riêng với bậc công hạnh (`level` 1..10 trong js/world/quests.js). Số liệu: js/data/stats.js (TẠM).
// Cố ý KHÔNG dùng `strengthOf` (js/world/strength.js) ở đây: thành phần √hạt sen của nó cho phép nạp tiền tăng sức mạnh (xem docs/GDD_v2_DOICHIEU.md mục 8, câu 15).
import { STATS_CFG } from '../data/stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Đưa Tu Vi về số nguyên trong [1, 150]. Đầu vào lạ (null, chữ, NaN) → 1. */
export const clampTuVi = (tv) => clamp(Math.floor(num(tv, STATS_CFG.tuViMin)), STATS_CFG.tuViMin, STATS_CFG.tuViMax);

const line = (c, tv) => Math.floor(c.base + c.perLevel * (clampTuVi(tv) - 1));

/** Công (sức đánh gốc) ở Tu Vi `tv`. */
export const congOf = (tv) => line(STATS_CFG.cong, tv);
/** Thủ (giảm sát thương nhận) ở Tu Vi `tv`. */
export const thuOf = (tv) => line(STATS_CFG.thu, tv);
/** Sinh Lực tối đa ở Tu Vi `tv`. (Người chơi có Sinh Lực, không có "máu": GDD v2 mục 0.) */
export const sinhLucOf = (tv) => line(STATS_CFG.sinhLuc, tv);

/** Gói đủ chỉ số của một Tu Vi: { tuvi, cong, thu, sinhLuc }. */
export function statsOf(tv) {
  const t = clampTuVi(tv);
  return { tuvi: t, cong: congOf(t), thu: thuOf(t), sinhLuc: sinhLucOf(t) };
}
