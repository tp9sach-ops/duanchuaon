// Bốn mùa (Phiên 24): hàm THUẦN, có test (tests/season.test.mjs). Mùa cố định trong một lần mở trang.
// Mặc định theo tháng thật (3–5 xuân, 6–8 hạ, 9–11 thu, 12–2 đông); ?mua=xuan|ha|thu|dong để xem thử.
import { lerpHex } from './daycycle.js';

export const SEASONS = ['xuan', 'ha', 'thu', 'dong'];
export const SEASON_NAME = { xuan: 'Mùa xuân', ha: 'Mùa hạ', thu: 'Mùa thu', dong: 'Mùa đông' };

/** tháng 1..12 → mùa. */
export function seasonOfMonth(m) { return m >= 3 && m <= 5 ? 'xuan' : m >= 6 && m <= 8 ? 'ha' : m >= 9 && m <= 11 ? 'thu' : 'dong'; }
/** Đọc ?mua= ; không hợp lệ → mùa theo tháng của `now`. */
export function parseSeasonParam(search, now = new Date()) {
  const v = new URLSearchParams(search || '').get('mua');
  return SEASONS.includes(v) ? v : seasonOfMonth(now.getMonth() + 1);
}

// leaf: các màu lá (vật liệu thứ i lấy leaf[i % n]); leafK = mức pha từ màu gốc sang màu mùa; grass/grassK tương tự cho đất cỏ KHÔNG có texture;
// grassMul = màu nhân cho cỏ CÓ texture; warmBias = thêm ánh ấm ban ngày; haze/hazeK = sương phủ ban ngày; fogMul = nhân độ dày sương;
// petals = hạt rơi (màu, cỡ, tỉ lệ số lượng, tốc độ rơi, độ mờ).
const DATA = {
  xuan: { leaf: [0x8fd06a, 0x7cc95a, 0xa2d878], leafK: 0.35, grass: 0x8cc863, grassK: 0.3, grassMul: 0xeaffd8, warmBias: 0.05, haze: 0xeaf4f0, hazeK: 0.08, fogMul: 1.0,
          petals: { color: 0xf6c4d2, size: 0.34, mul: 1.5, speed: 1.0, opacity: 0.85 } },
  ha:   { leaf: [0x2f8a3a, 0x3a9a40, 0x277a33], leafK: 0.4, grass: 0x5fa83f, grassK: 0.35, grassMul: 0xd2f0b8, warmBias: 0.12, haze: 0xfff4d6, hazeK: 0.0, fogMul: 0.85,
          petals: { color: 0xe8503a, size: 0.32, mul: 0.3, speed: 1.2, opacity: 0.9 } },
  thu:  { leaf: [0xe0a030, 0xd26a2a, 0xc9452e, 0xe6c040], leafK: 0.65, grass: 0xb9b05a, grassK: 0.45, grassMul: 0xffe6a8, warmBias: 0.28, haze: 0xf6e2c0, hazeK: 0.12, fogMul: 1.1,
          petals: { color: 0xe0a030, size: 0.46, mul: 1.2, speed: 1.1, opacity: 0.9 } },
  dong: { leaf: [0x7d9a8a, 0x6f8a7e, 0x8aa396], leafK: 0.5, grass: 0xc8d8c4, grassK: 0.5, grassMul: 0xe2ecee, warmBias: -0.0, haze: 0xdfe6ee, hazeK: 0.45, fogMul: 2.0,
          petals: { color: 0xffffff, size: 0.26, mul: 0.8, speed: 0.55, opacity: 0.8 } },
};

/** Thông số mùa (bản sao, an toàn để sửa). */
export function seasonState(name) {
  const d = DATA[name] || DATA.xuan; return { name: DATA[name] ? name : 'xuan', title: SEASON_NAME[DATA[name] ? name : 'xuan'], ...d, leaf: d.leaf.slice(), petals: { ...d.petals } };
}

/** Màu mới cho vật liệu `kind` ('leaf' | 'grass') từ màu gốc `base`; `index` chọn màu lá; `textured` = có texture → trả màu nhân. */
export function seasonColor(s, kind, base, index = 0, textured = false) {
  if (kind === 'grass') return textured ? s.grassMul : lerpHex(base, s.grass, s.grassK);
  return lerpHex(base, s.leaf[index % s.leaf.length], s.leafK);
}
/** Có phải màu xanh lá (để tự nhận vật liệu lá không gắn nhãn): sắc xanh lục, đủ đậm màu. */
export function isLeafGreen(hex) {
  const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return g === mx && g > r * 1.08 && g > b * 1.15 && mx - mn > 0.12;
}
