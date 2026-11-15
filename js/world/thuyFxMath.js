// TOÁN THUẦN cho hiệu ứng THỦY 3D (Phiên 203, docs/KE_HOACH_HIEU_UNG_3D_V2.md, MỤC 3). Không import three → test được trong Node: tests/thuyfx.test.mjs. Dựng hình: js/scene/fxThuy.js.
// 6 chữ ký: giáo tinh thể băng · bong bóng nước có giọt ngọc lơ lửng · thảm băng lan có gai · sen nước · xích băng · sóng thần có bọt.
import { h01 } from './hoaFxMath.js';

/** id chiêu → kiểu hình. thuy_1 Thủy Tiễn (giáo băng) · thuy_2 bong bóng · thuy_3 thảm băng · thuy_camlo_4 Thanh Tâm Chú (sen nước) · thuy_huyenbang_4 Hàn BƒÉng Tỏa (xích) · thuy_tuyet sóng thần. */
export const THUY_KIEU = Object.freeze({ thuy_1: 'giao_bang', thuy_2: 'bong_nuoc', thuy_3: 'tham_bang', thuy_camlo_4: 'sen_nuoc', thuy_huyenbang_4: 'xich_bang', thuy_tuyet: 'song_than' });
export const kieuThuy = (id) => (Object.prototype.hasOwnProperty.call(THUY_KIEU, id) ? THUY_KIEU[id] : null);

const M = (mesh, hat, khoi, vong = 0) => ({ mesh, hat, khoi, vong });
/** mesh = số vật thể chính (tinh thể/giọt/gai/cánh sen mỗi vòng/mắt xích/con sóng); hat = hạt; khoi = tấm sương; vong = số vòng cánh sen. */
const DEM = {
  giao_bang: { yeu: M(3, 40, 1), vua: M(4, 90, 2), cao: M(5, 150, 3) },
  bong_nuoc: { yeu: M(4, 40, 0), vua: M(5, 90, 0), cao: M(7, 150, 0) },
  tham_bang: { yeu: M(10, 40, 1), vua: M(16, 90, 2), cao: M(24, 150, 3) },
  sen_nuoc: { yeu: M(6, 40, 0, 1), vua: M(8, 90, 0, 1), cao: M(10, 150, 0, 2) },
  xich_bang: { yeu: M(8, 40, 1), vua: M(12, 90, 2), cao: M(16, 150, 3) },
  song_than: { yeu: M(1, 40, 1), vua: M(2, 90, 2), cao: M(3, 150, 3) },
};
export function demThuy(kieu, tier) { const b = DEM[kieu]; if (!b) return M(0, 0, 0); return { ...(b[tier] || b.vua) }; }

/** Thảm băng: gai thứ i trong n gai, rải theo góc vàng trong bán kính 0,92·R. delay = độ trễ mọc (gai xa tâm mọc muộn hơn → thảm lan ra từ tâm). */
export function gaiBang(i, n, R) {
  const f = Math.sqrt((i + 0.5) / Math.max(1, n)), r = R * 0.92 * f, a = i * 2.399963 + h01(i, 6) * 0.3;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: (0.9 + 1.7 * h01(i, 4)) * (1 - 0.45 * f), w: 0.16 + 0.12 * h01(i, 5), lean: 0.05 + 0.2 * h01(i, 7), yaw: a, delay: f * 0.35 };
}

/** Xích băng: mắt thứ i trong n mắt nối từ người (z = 0,4) tới đầu chiêu pz, rung nhẹ; odd = mắt lẻ xoay vuông góc mắt chẵn (như xích thật). */
export function xichBang(i, n, t, pz) {
  const f = n > 1 ? i / (n - 1) : 0, z0 = 0.4, z1 = Math.max(z0, pz);
  return { x: 0.1 * Math.sin(t * 6 + i), y: 1.15 + 0.12 * Math.sin(t * 9 + i * 1.3), z: z0 + (z1 - z0) * f, odd: i % 2 };
}

/** Bong bóng nước: giọt ngọc thứ i trong n giọt xoay quanh người bán kính 0,75, nhún lên xuống. */
export function quanhGiot(i, n, t) { const a = i / Math.max(1, n) * 6.2832 + t * 2.2; return { x: Math.cos(a) * 0.75, y: 0.9 + 0.35 * Math.sin(t * 3 + i * 1.7), z: Math.sin(a) * 0.75 }; }

/** Sóng thần: sau `after` giây từ lúc phát → bán kính đầu sóng r (tối đa min(reach,12), đơn điệu) và chiều cao h (dâng lên nhanh, thấp dần khi sắp tan; ≤ 3,2 m). Trước lúc phát: 0. */
export function songThan(after, reach) {
  const R = Math.min(reach, 12), u = Math.max(0, Math.min(1, after / 0.8)), e = 1 - (1 - u) * (1 - u);
  const ss = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  return { r: R * e, h: after <= 0 ? 0 : 0.2 + 3.0 * ss(0, 0.25, u) * (1 - 0.6 * ss(0.7, 1, u)) };
}
