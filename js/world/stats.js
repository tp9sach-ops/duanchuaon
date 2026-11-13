// Chỉ số chiến đấu theo Tu Vi: Công, Thủ, Sinh Lực (G1.1, GDD v2). LOGIC THUẦN (không DOM, không three.js), có test: tests/stats.test.mjs.
// Tu Vi (không có trần, Phiên 139) là hệ riêng với bậc công hạnh (`level` trong js/world/quests.js). Số liệu: js/data/stats.js (TẠM).
// Cố ý KHÔNG dùng `strengthOf` (js/world/strength.js) ở đây: thành phần √hạt sen của nó cho phép nạp tiền tăng sức mạnh (xem docs/GDD_v2_DOICHIEU.md mục 8, câu 15).
import { STATS_CFG, EXP_CFG } from '../data/stats.js';

const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Đưa Tu Vi về số nguyên ≥ 1 (không có trần chơi; chỉ chặn kỹ thuật `tuViKyThuat`). Đầu vào lạ (null, chữ, NaN) → 1. */
export const clampTuVi = (tv) => clamp(Math.floor(num(tv, STATS_CFG.tuViMin)), STATS_CFG.tuViMin, STATS_CFG.tuViKyThuat);

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

// ---- Đường cong Tu Vi (G1.2). Tu Vi hiện có của người chơi = tổng EXP tích lũy (số nguyên ≥ 0); cấp tính từ đó.
/** EXP cần để lên từ cấp `n` lên cấp n+1 = round(30 × n^1,6). Không có cấp tối đa (chỉ trả 0 ở chặn kỹ thuật). */
export const expToNext = (n) => { const t = clampTuVi(n); return t >= STATS_CFG.tuViKyThuat ? 0 : Math.round(EXP_CFG.heSo * Math.pow(t, EXP_CFG.mu)); };
/** Giá trị công thức thô tại cấp n, dùng để đối chiếu mốc GDD. */
export const expCurve = (n) => Math.round(EXP_CFG.heSo * Math.pow(clampTuVi(n), EXP_CFG.mu));
// Bảng tổng EXP tích lũy để ĐẠT cấp t (cấp 1 = 0), dựng một lần.
const CUM = (() => { const a = [0, 0]; for (let t = 2; t <= STATS_CFG.tuViKyThuat; t++) a[t] = a[t - 1] + expToNext(t - 1); return a; })();
/** Tổng EXP tích lũy cần để đạt cấp `tv`. */
export const totalExpFor = (tv) => CUM[clampTuVi(tv)];
/** Cấp Tu Vi từ tổng EXP (không trần; EXP lạ/âm → cấp 1). */
export function levelFromExp(exp) {
  const e = Math.max(0, Math.floor(num(exp, 0)));
  let lo = 1, hi = STATS_CFG.tuViKyThuat;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (CUM[mid] <= e) lo = mid; else hi = mid - 1; }
  return lo;
}
/** EXP còn thiếu để lên cấp kế. */
export function expRemaining(exp) {
  const e = Math.max(0, Math.floor(num(exp, 0))), lv = levelFromExp(e);
  return lv >= STATS_CFG.tuViKyThuat ? 0 : CUM[lv + 1] - e;
}
/** Tiến độ trong cấp hiện tại: { tuvi, into (EXP đã có trong cấp), need (EXP cả cấp), pct (0..1) }. Không có cấp tối đa. */
export function progressOf(exp) {
  const e = Math.max(0, Math.floor(num(exp, 0))), lv = levelFromExp(e);
  if (lv >= STATS_CFG.tuViKyThuat) return { tuvi: lv, into: 0, need: 0, pct: 1 };
  const need = expToNext(lv), into = e - CUM[lv];
  return { tuvi: lv, into, need, pct: into / need };
}
