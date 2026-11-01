// Nhật thực / Nguyệt thực sắp tới, tính gần đúng từ vĩ độ hoàng đạo của Mặt Trăng tại lúc trăng non/tròn.
// Ngưỡng chỉnh theo các lần thực 2025–2028 đã biết (không phải ngưỡng lý thuyết). Chỉ phân loại thô theo ngưỡng vĩ độ (không tính vùng nhìn thấy, không tính độ che chính xác).
import { nextPhaseAt } from './astro.js';

const D2R = Math.PI / 180, mod = (a, n) => ((a % n) + n) % n, sin = (d) => Math.sin(d * D2R);

/** Vĩ độ hoàng đạo của Mặt Trăng (độ), các số hạng chính theo Meeus (sai số cỡ 0,01°). */
export function moonLatitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const D = mod(297.8501921 + 445267.1114034 * T, 360), M = mod(357.5291092 + 35999.0502909 * T, 360);
  const Mp = mod(134.9633964 + 477198.8675055 * T, 360), F = mod(93.2720950 + 483202.0175233 * T, 360);
  const E = 1 - 0.002516 * T;
  const s = 5128122 * sin(F) + 280602 * sin(Mp + F) + 277693 * sin(Mp - F) + 173237 * sin(2 * D - F) + 55413 * sin(2 * D - Mp + F) + 46271 * sin(2 * D - Mp - F) +
    32573 * sin(2 * D + F) + 17198 * sin(2 * Mp + F) + 9266 * sin(2 * D + Mp - F) + 8822 * sin(2 * Mp - F) + 8216 * E * sin(2 * D - M - F) +
    4324 * sin(2 * D - 2 * Mp - F) + 4200 * sin(2 * D + Mp + F) - 3359 * E * sin(2 * D + M - F);
  return s / 1e6;
}

/** Phân loại theo |vĩ độ| (độ) tại lúc trăng non (nhật thực) hoặc trăng tròn (nguyệt thực). */
export function phanLoai(loai, beta) {
  const b = Math.abs(beta);
  if (loai === 'nguyet') return b < 0.40 ? 'toàn phần' : b < 1.03 ? 'một phần' : b < 1.55 ? 'nửa tối (mờ, khó thấy)' : null;
  return b < 0.96 ? 'toàn phần hoặc hình khuyên' : b < 1.55 ? 'một phần' : null;
}

/** Danh sách nhật/nguyệt thực trong ~ `ngay` ngày kể từ jd0. [{ loai, jd, kieu, beta, satNguong }] */
export function sapXayRa(jd0, ngay = 730) {
  const out = [];
  for (const [loai, target] of [['nhat', 0], ['nguyet', 180]]) {
    let t = jd0;
    while (t < jd0 + ngay) {
      const j = nextPhaseAt(t, target); if (j == null) break;
      const beta = moonLatitude(j), kieu = phanLoai(loai, beta);
      if (kieu) {
        const b = Math.abs(beta), edges = loai === 'nguyet' ? [0.4, 1.03, 1.55] : [0.96, 1.55];
        out.push({ loai, jd: j, kieu, beta: +beta.toFixed(2), satNguong: edges.some((e) => Math.abs(b - e) < 0.08) });
      }
      t = j + 20;
    }
  }
  return out.sort((a, b) => a.jd - b.jd);
}
