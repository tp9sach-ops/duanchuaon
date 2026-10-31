// Thiên văn cơ bản: kinh độ Mặt Trời/Mặt Trăng (công thức Meeus rút gọn), pha Trăng, cung Mọc.
// Độ chính xác: Mặt Trời ~0,01°, Mặt Trăng ~0,02°, thời điểm trăng tròn/non sai số vài phút.
const D2R = Math.PI / 180;
const mod = (a, n) => ((a % n) + n) % n;
const sin = (d) => Math.sin(d * D2R);
const cos = (d) => Math.cos(d * D2R);

/** Ngày Julian từ mốc thời gian UTC (ms) hoặc Date. */
export const jdFromUTC = (t) => (t instanceof Date ? t.getTime() : t) / 86400000 + 2440587.5;
export const dateFromJD = (jd) => new Date((jd - 2440587.5) * 86400000);

/** Kinh độ biểu kiến Mặt Trời (độ, hệ nhiệt đới). */
export function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  return mod(L0 + C - 0.00569 - 0.00478 * sin(omega), 360);
}

// Bảng 47.A (Meeus) — các số hạng chính của kinh độ Mặt Trăng: [D, M, M', F, hệ số (1e-6 độ)]
const MOON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
];

/** Kinh độ Mặt Trăng (độ, hệ nhiệt đới). */
export function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let s = 0;
  for (const [d, m, mp, f, c] of MOON_TERMS) {
    s += c * Math.pow(E, Math.abs(m)) * sin(d * D + m * M + mp * Mp + f * F);
  }
  // Số hạng bổ sung (Venus, Jupiter, độ dẹt Trái Đất)
  const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T;
  s += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
  return mod(Lp + s / 1e6, 360);
}

/** Góc pha (độ, 0 = trăng non, 180 = trăng tròn). */
export const phaseAngle = (jd) => mod(moonLongitude(jd) - sunLongitude(jd), 360);

/** Pha Trăng tại một thời điểm: góc, % sáng, tuổi trăng (ngày), tên pha. */
export function moonPhase(jd, Z) {
  const a = phaseAngle(jd);
  const sang = (1 - cos(a)) / 2;
  const ten = Z.phaTrang.find((p) => a < p.den).ten;
  return { goc: a, phanTramSang: sang * 100, tuoi: (a / 360) * 29.530588, ten, tangDan: a < 180 };
}

/** Tìm thời điểm kế tiếp (sau jd0) mà góc pha đạt mục tiêu (0 = non, 180 = tròn). Trả JD. */
export function nextPhaseAt(jd0, target) {
  const f = (jd) => mod(phaseAngle(jd) - target + 180, 360) - 180; // −180..180, đổi dấu âm→dương tại mục tiêu
  let a = jd0, fa = f(a);
  for (let i = 0; i < 40; i++) { // bước 1 ngày: tối đa ~ 40 ngày
    const b = a + 1, fb = f(b);
    if (fa < 0 && fb >= 0) {
      let lo = a, hi = b;
      for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; }
      return (lo + hi) / 2;
    }
    a = b; fa = fb;
  }
  return null;
}

/** Độ nghiêng hoàng đạo (độ). */
const obliquity = (jd) => { const T = (jd - 2451545.0) / 36525; return 23.4392911 - 0.0130042 * T; };

/** Cung Mọc (Ascendant, độ 0–360) từ JD (UT), vĩ độ, kinh độ đông dương. */
export function ascendant(jd, lat, lon) {
  const T = (jd - 2451545.0) / 36525;
  const gmst = mod(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T, 360);
  const ramc = mod(gmst + lon, 360);
  const e = obliquity(jd);
  const y = cos(ramc), x = -(sin(ramc) * cos(e) + Math.tan(lat * D2R) * sin(e));
  return mod(Math.atan2(y, x) / D2R, 360);
}
