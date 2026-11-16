// Cỡ nút bấm (Phiên 188, mục 2): LOGIC THUẦN, có test (tests/btnscale.test.mjs). Hệ số k nhân vào mọi nút thao tác (cụm chiêu, cụm Nhảy/Đánh thường...).
export const SCALE_KEY = 'lgt.btnScale', SCALE_MIN = 0.7, SCALE_MAX = 1.6, SCALE_STEP = 0.05, SCALE_DEF = 1;
/** Số bất kỳ / chuỗi lưu → hệ số hợp lệ [0.7; 1.6], làm tròn bước 0.05; rác → 1. */
export function clampScale(v) {
  const n = v == null || (typeof v === 'string' && v.trim() === '') ? NaN : +v;
  if (!Number.isFinite(n)) return SCALE_DEF;
  return +(Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, n)) / SCALE_STEP) * SCALE_STEP).toFixed(2);
}
export const scaleLabel = (k) => Math.round(clampScale(k) * 100) + '%';
/** Phiên 204: máy cảm ứng hoặc màn hẹp (≤ 899px, trùng mốc CSS điện thoại) → nút ⚙ "Cỡ nút bấm" nằm DƯỚI bản đồ nhỏ (cột trái-trên), không nằm trên cần đi nữa. */
export const isPhoneLayout = ({ coarse = false, w = 1280 } = {}) => !!coarse || (Number.isFinite(+w) && +w <= 899);
