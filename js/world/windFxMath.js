// Vệt gió trắng + tiếng gió khi BAY LƯỚT (Phiên 204, mục 1 danh sách ptg 16/11). LOGIC THUẦN (không three.js/WebAudio), có test: tests/windfx.test.mjs.
// Hiển thị: js/scene/windFx.js. Âm: js/ui/sfx.js (gust/windStart/windSet/windStop). Mọi số là QUY ƯỚC TẠM, chờ ptg nghe/nhìn rồi chỉnh.
import { clamp } from '../util.js';

export const WIND_FX = Object.freeze({
  streakLife: 0.5, ringLife: 0.36, maxStreaks: 22, maxRings: 3,
  rate: 16,              // vệt/giây ở mức gió tối đa
  kickStreaks: 7,        // số vệt bắn thêm mỗi cú đạp gió
});
export const WIND_SND = Object.freeze({
  fBase: 360, fSpan: 1500, q: 0.55, gainMax: 0.3, attack: 0.15, release: 0.4,
  bay: { dur: 0.55, f0: 500, f1: 2400, q: 0.9, gain: 0.5 },                       // vút lên khi bắt đầu lướt (quét tần số lên)
  dap: { dur: 0.3, f0: 4200, f1: 800, q: 0.7, gain: 0.6, thump: { f0: 190, f1: 70, dur: 0.17, gain: 0.3 } },   // cú đạp gió: xì ngắn quét xuống + thịch trầm
});

/** Tần số bộ lọc (Hz) và độ to của vòng lặp tiếng gió theo mức gió lv (0..1). */
export const windFilterHz = (lv) => WIND_SND.fBase + WIND_SND.fSpan * clamp(+lv || 0, 0, 1);
export const windGainOf = (lv) => WIND_SND.gainMax * Math.pow(clamp(+lv || 0, 0, 1), 1.2);

/** Số vệt cần sinh trong khung hình dt (có phần dư `acc` cộng dồn để đủ tốc độ ở fps thấp). Trả { n, acc }. */
export function streakSpawn(acc, dt, lv) {
  const a = (+acc || 0) + Math.max(0, +dt || 0) * WIND_FX.rate * clamp(+lv || 0, 0, 1), n = Math.floor(a);
  return { n, acc: a - n };
}
/** Chiều dài vệt (m) theo tốc độ ngang (m/s). */
export const streakLen = (speed) => 1.1 + clamp(+speed || 0, 0, 20) * 0.22;
/** Độ mờ (0..1) và tiến độ của một vệt/vòng sống `age` trên `life` giây: hiện nhanh, tan dần. */
export function fadeOf(age, life) {
  const k = clamp((+age || 0) / Math.max(1e-3, +life || 1), 0, 1);
  return { k, alpha: k >= 1 ? 0 : Math.min(1, k * 8) * (1 - k) * (1 - k * 0.3) };
}
/** Bán kính vòng sóng đạp gió theo tiến độ k: nở nhanh rồi chậm. */
export const ringRadius = (k) => 0.3 + 1.5 * (1 - Math.pow(1 - clamp(+k || 0, 0, 1), 2));
