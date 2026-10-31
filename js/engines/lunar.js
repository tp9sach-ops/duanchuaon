// Lịch Âm Việt Nam (UTC+7). Thuật toán Hồ Ngọc Đức (tính theo Sóc và kinh độ Mặt Trời).
// Thuần JS, không phụ thuộc trình duyệt để chạy được cả trong test Node.
const PI = Math.PI, DR = PI / 180;
export const TZ = 7;

const INT = Math.floor;

/** Ngày dương → số ngày Julian (JD, tại 12h trưa). Dùng lịch Gregory từ 15/10/1582. */
export function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

/** JD → [ngày, tháng, năm] dương. */
export function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
  return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}

/** Thứ trong tuần: 0 = Chủ nhật … 6 = Thứ bảy. */
export const dayOfWeek = (jd) => (jd + 1) % 7;

function newMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * DR);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * DR) + 0.0021 * Math.sin(2 * DR * M);
  C1 -= 0.4068 * Math.sin(Mpr * DR) - 0.0161 * Math.sin(DR * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(DR * 3 * Mpr);
  C1 += 0.0104 * Math.sin(DR * 2 * F) - 0.0051 * Math.sin(DR * (M + Mpr));
  C1 -= 0.0074 * Math.sin(DR * (M - Mpr)) - 0.0004 * Math.sin(DR * (2 * F + M));
  C1 -= 0.0004 * Math.sin(DR * (2 * F - M)) + 0.0006 * Math.sin(DR * (2 * F + Mpr));
  C1 += 0.0010 * Math.sin(DR * (2 * F - Mpr)) + 0.0005 * Math.sin(DR * (2 * Mpr + M));
  const dt = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - dt;
}

/** Kinh độ Mặt Trời (radian, 0..2π) tại JD (theo UT). */
export function sunLongitude(jdn) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(DR * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(DR * 2 * M) + 0.00029 * Math.sin(DR * 3 * M);
  let L = (L0 + DL) * DR;
  return L - PI * 2 * INT(L / (PI * 2));
}

/** Kinh độ Mặt Trời (độ, 0..360) tại thời điểm `frac` của ngày địa phương jd:
 *  frac = 0 → 0h sáng, frac = 1 → 24h (hết ngày). */
export function sunLongitudeDeg(jd, frac = 1, tz = TZ) {
  return sunLongitude(jd - 0.5 + frac - tz / 24) / DR;
}

const sunSector = (jd, tz) => INT((sunLongitude(jd - 0.5 - tz / 24) / PI) * 6);
const newMoonDay = (k, tz) => INT(newMoon(k) + 0.5 + tz / 24);

function lunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = newMoonDay(k, tz);
  if (sunSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz);
  return nm;
}

function leapMonthOffset(a11, tz) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last, i = 1, arc = sunSector(newMoonDay(k + i, tz), tz);
  do { last = arc; i++; arc = sunSector(newMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
  return i - 1;
}

/** Dương → Âm. Trả {day, month, year, leap (0/1), jd}. */
export function solarToLunar(dd, mm, yy, tz = TZ) {
  const jd = jdFromDate(dd, mm, yy);
  const k = INT((jd - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, tz);
  if (monthStart > jd) monthStart = newMoonDay(k, tz);
  let a11 = lunarMonth11(yy, tz), b11 = a11, year;
  if (a11 >= monthStart) { year = yy; a11 = lunarMonth11(yy - 1, tz); }
  else { year = yy + 1; b11 = lunarMonth11(yy + 1, tz); }
  const day = jd - monthStart + 1, diff = INT((monthStart - a11) / 29);
  let leap = 0, month = diff + 11;
  if (b11 - a11 > 365) {
    const ld = leapMonthOffset(a11, tz);
    if (diff >= ld) { month = diff + 10; if (diff === ld) leap = 1; }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap, jd };
}

/** Âm → Dương. Trả [ngày, tháng, năm] hoặc null nếu ngày âm không tồn tại. */
export function lunarToSolar(ld, lm, ly, leap = 0, tz = TZ) {
  let a11, b11;
  if (lm < 11) { a11 = lunarMonth11(ly - 1, tz); b11 = lunarMonth11(ly, tz); }
  else { a11 = lunarMonth11(ly, tz); b11 = lunarMonth11(ly + 1, tz); }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lm - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const lo = leapMonthOffset(a11, tz);
    let leapMonth = lo - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && lm !== leapMonth) return null;
    if (leap || off >= lo) off += 1;
  } else if (leap) return null;
  return jdToDate(newMoonDay(k + off, tz) + ld - 1);
}
