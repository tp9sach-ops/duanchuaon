// NỀN NỨT TỎA TIA cho Thổ (Phiên 211, làm giống gói hiệu ứng tham khảo "100 Special Skills Effects Pack": đất nứt tỏa tia từ điểm chạm + sóng chấn + bụi). TOÁN THUẦN (không three.js), có test: tests/thofx.test.mjs.
// Phần vẽ: js/scene/fxTho.js (vẽ các nhánh này lên canvas 1 lần rồi dán lên mặt đất). Không dùng file ảnh của gói (chỉ lấy ý tưởng hình dạng) nên không vướng bản quyền.
import { NUI, h01 } from './thoFxMath.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (k) => { const t = clamp(k, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 2.4);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Mốc nền nứt xuất hiện (giây, mốc 0 = lúc phát): trùng lúc sóng chấn / chạm đất. Chỉ 3 kiểu có nền nứt. */
export const T_NEN = Object.freeze({ gai_da: 0.1, mach_dat: 0.1, nui_roi: NUI.land });
export const NEN_GIU = 1.0, NEN_TAN = 0.9;   // giữ sáng 1,0 s rồi nguội dần 0,9 s
export const coNen = (kieu) => has(T_NEN, kieu);

/** Nền nứt ở giây `after`: { hien, k (nứt lan tới đâu 0..1), op (độ đậm 0..1) }. Kiểu khác → không hiện. */
export function nutNen(kieu, after) {
  const off = { hien: false, k: 0, op: 0 };
  if (typeof kieu !== 'string' || !has(T_NEN, kieu)) return off;
  const u = after - T_NEN[kieu]; if (!(u >= 0)) return off;
  const k = easeOut(u / 0.22), op = 1 - sm((u - NEN_GIU) / NEN_TAN);
  return op > 0.01 && k > 0.01 ? { hien: true, k, op } : off;
}
/** Vị trí + cỡ nền nứt (đơn vị mét): { z (lệch về phía trước), r (bán kính) }. gai_da: dọc đường chiêu · mach_dat: quanh tâm · nui_roi: rộng nhất. ctx = { reach, R2, W }. */
export function nenCo(kieu, ctx = {}) {
  const { reach = 4, R2 = 2, W = 1 } = ctx;
  if (kieu === 'gai_da') return { z: Math.max(1, reach * 0.55), r: Math.max(1.4, Math.min(reach * 0.62, W * 2.2 + 0.6)) };
  if (kieu === 'mach_dat') return { z: 0, r: Math.max(1.2, R2 * 1.25) };
  if (kieu === 'nui_roi') return { z: 0, r: Math.max(1.6, R2 * 1.7) };
  return { z: 0, r: 0 };
}
/**
 * Các nhánh nứt toả từ tâm (tọa độ -1..1, tâm = (0,0), có hốc nhỏ ở giữa như vết nứt trong gói tham khảo).
 * Trả mảng { w (độ dày tương đối 0..1), pts: [[x,y],...] }. Cố định theo `seed` (cùng seed → cùng hình). nTia ≥ 3.
 */
export function nhanhNut(seed = 0, nTia = 11) {
  const N = Math.max(3, nTia | 0), out = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * 6.2832 + (h01(i, seed + 1) - 0.5) * 0.5, dai = 0.55 + 0.43 * h01(i, seed + 2), K = 7, pts = [];
    for (let j = 0; j < K; j++) {
      const f = j / (K - 1), r = 0.07 + (dai - 0.07) * f, a = a0 + (j === 0 ? 0 : (h01(i * 31 + j, seed + 3) - 0.5) * 0.22);
      pts.push([Math.sin(a) * r, Math.cos(a) * r]);
    }
    out.push({ w: 0.7 + 0.3 * h01(i, seed + 4), pts });
    if (h01(i, seed + 5) > 0.35) {   // nhánh phụ rẽ ra từ giữa tia
      const j = 2 + Math.floor(h01(i, seed + 6) * 2), b = pts[j], side = h01(i, seed + 7) > 0.5 ? 1 : -1, ab = a0 + side * (0.5 + 0.5 * h01(i, seed + 8)), L = (dai - Math.hypot(b[0], b[1])) * (0.6 + 0.5 * h01(i, seed + 9));
      out.push({ w: 0.45, pts: [b, [b[0] + Math.sin(ab) * L * 0.5, b[1] + Math.cos(ab) * L * 0.5], [b[0] + Math.sin(ab + side * 0.15) * L, b[1] + Math.cos(ab + side * 0.15) * L]] });
    }
  }
  return out;
}
