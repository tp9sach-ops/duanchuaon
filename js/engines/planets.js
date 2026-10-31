// Vị trí 5 hành tinh (Thủy, Kim, Hỏa, Mộc, Thổ) theo yếu tố quỹ đạo Schlyter (độ chính xác cỡ vài phút cung,
// đủ để xác định cung hoàng đạo, nghịch hành và góc chiếu). Mặt Trời, Mặt Trăng lấy từ astro.js.
import { sunLongitude, moonLongitude } from './astro.js';

const D2R = Math.PI / 180, mod360 = (x) => ((x % 360) + 360) % 360;
const sin = (d) => Math.sin(d * D2R), cos = (d) => Math.cos(d * D2R);
export const CUNG = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'];
const KY_HIEU = { 'Mặt Trời': '☉', 'Mặt Trăng': '☽', 'Thủy Tinh': '☿', 'Kim Tinh': '♀', 'Hỏa Tinh': '♂', 'Mộc Tinh': '♃', 'Thổ Tinh': '♄' };

// [N0,N1, i0,i1, w0,w1, a, e0,e1, M0,M1]
const EL = {
  'Thủy Tinh': [48.3313, 3.24587e-5, 7.0047, 5.0e-8, 29.1241, 1.01444e-5, 0.387098, 0.205635, 5.59e-10, 168.6562, 4.0923344368],
  'Kim Tinh': [76.6799, 2.46590e-5, 3.3946, 2.75e-8, 54.8910, 1.38374e-5, 0.723330, 0.006773, -1.302e-9, 48.0052, 1.6021302244],
  'Hỏa Tinh': [49.5574, 2.11081e-5, 1.8497, -1.78e-8, 286.5016, 2.92961e-5, 1.523688, 0.093405, 2.516e-9, 18.6021, 0.5240207766],
  'Mộc Tinh': [100.4542, 2.76854e-5, 1.3030, -1.557e-7, 273.8777, 1.64505e-5, 5.20256, 0.048498, 4.469e-9, 19.8950, 0.0830853001],
  'Thổ Tinh': [113.6634, 2.38980e-5, 2.4886, -1.081e-7, 339.3939, 2.97661e-5, 9.55475, 0.055546, -9.499e-9, 316.9670, 0.0334442282],
};
const SUN_EL = { w0: 282.9404, w1: 4.70935e-5, e0: 0.016709, e1: -1.151e-9, M0: 356.0470, M1: 0.9856002585 };

function kepler(M, e) {
  let E = M + (e / D2R) * sin(M) * (1 + e * cos(M));
  for (let k = 0; k < 8; k++) { const dE = (E - (E - (e / D2R) * sin(E) - M) / (1 - e * cos(E))) - E; E += dE; if (Math.abs(dE) < 1e-7) break; }
  return E;
}
// Tọa độ nhật tâm (x, y, z) của một hành tinh, ở d ngày kể từ 1999-12-31.0 UT, kèm các tham số nhiễu loạn cho Mộc/Thổ
function helio(name, d) {
  const [N0, N1, i0, i1, w0, w1, a, e0, e1, M0, M1] = EL[name];
  const N = N0 + N1 * d, i = i0 + i1 * d, w = w0 + w1 * d, e = e0 + e1 * d, M = mod360(M0 + M1 * d);
  const E = kepler(M, e), xv = a * (cos(E) - e), yv = a * Math.sqrt(1 - e * e) * sin(E);
  const v = Math.atan2(yv, xv) / D2R, r = Math.hypot(xv, yv);
  const xh = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i));
  const yh = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i));
  const zh = r * sin(v + w) * sin(i);
  return { xh, yh, zh };
}
function earthSun(d) {
  const { w0, w1, e0, e1, M0, M1 } = SUN_EL, w = w0 + w1 * d, e = e0 + e1 * d, M = mod360(M0 + M1 * d);
  const E = kepler(M, e), xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E);
  const v = Math.atan2(yv, xv) / D2R, r = Math.hypot(xv, yv), lonsun = mod360(v + w);
  return { xs: r * cos(lonsun), ys: r * sin(lonsun) };
}

/** Kinh độ hoàng đạo (độ, nhiệt đới, địa tâm) của một hành tinh ở thời điểm jd. */
export function planetLongitude(name, jd) {
  const d = jd - 2451543.5, { xh, yh } = helio(name, d), { xs, ys } = earthSun(d);
  let lon = mod360(Math.atan2(yh + ys, xh + xs) / D2R);
  if (name === 'Mộc Tinh' || name === 'Thổ Tinh') {
    const Mj = mod360(EL['Mộc Tinh'][9] + EL['Mộc Tinh'][10] * d), Ms = mod360(EL['Thổ Tinh'][9] + EL['Thổ Tinh'][10] * d);
    if (name === 'Mộc Tinh') lon += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21) - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
    else lon += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3) + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
  }
  return mod360(lon);
}

const longitudeOf = (name, jd) => (name === 'Mặt Trời' ? sunLongitude(jd) : name === 'Mặt Trăng' ? moonLongitude(jd) : planetLongitude(name, jd));
export const TEN = Object.keys(KY_HIEU);

/** Nghịch hành: so kinh độ trước/sau 1 ngày (chỉ có nghĩa với 5 hành tinh; Mặt Trời, Mặt Trăng luôn thuận). */
export function isRetrograde(name, jd) {
  if (name === 'Mặt Trời' || name === 'Mặt Trăng') return false;
  const diff = ((longitudeOf(name, jd + 0.5) - longitudeOf(name, jd - 0.5) + 540) % 360) - 180;
  return diff < 0;
}

const GOC = [['Hợp', 0, 'trộn năng lượng'], ['Lục hợp', 60, 'hỗ trợ nhẹ'], ['Vuông', 90, 'căng thẳng, thúc đẩy'], ['Tam hợp', 120, 'thuận hòa'], ['Đối', 180, 'đối trọng, cần cân bằng']];
export function gocChieu(planets, orb = 6) {
  const out = [];
  for (let a = 0; a < planets.length; a++) for (let b = a + 1; b < planets.length; b++) {
    const diff = Math.abs(planets[a].lon - planets[b].lon), sep = diff > 180 ? 360 - diff : diff;
    for (const [ten, goc, y] of GOC) {
      const lech = Math.abs(sep - goc), lim = (planets[a].ten === 'Mặt Trăng' || planets[b].ten === 'Mặt Trăng' || planets[a].ten === 'Mặt Trời' || planets[b].ten === 'Mặt Trời') ? orb + 2 : orb;
      if (lech <= lim) out.push({ a: planets[a].ten, b: planets[b].ten, ten, y, lech: +lech.toFixed(1) });
    }
  }
  return out.sort((x, y) => x.lech - y.lech);
}

/** Bảng vị trí tại thời điểm jd. */
export function viTriHanhTinh(jd) {
  const planets = TEN.map((ten) => {
    const lon = longitudeOf(ten, jd);
    return { ten, kyHieu: KY_HIEU[ten], lon, cung: CUNG[Math.floor(lon / 30)], do: lon % 30, nghich: isRetrograde(ten, jd) };
  });
  return { planets, goc: gocChieu(planets) };
}

// ---- Chấm điểm sơ bộ cho bộ tổng hợp (quy ước dự án, độ tin cậy thấp) ----
// Hành tinh hôm nay chiếu vào Mặt Trời/Mặt Trăng lúc sinh (orb 4°). Mộc/Kim thuận: cộng; Thổ/Hỏa vuông, đối: trừ nhẹ.
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const LINH_VUC_HT = { 'Kim Tinh': ['tinh_cam', 'quy_nhan'], 'Mộc Tinh': ['tai_loc', 'quy_nhan'], 'Thổ Tinh': ['su_nghiep', 'suc_khoe'], 'Hỏa Tinh': ['suc_khoe', 'su_nghiep'], 'Thủy Tinh': ['su_nghiep'] };
const DAU = { 'Hợp': { 'Kim Tinh': 1, 'Mộc Tinh': 1, 'Thổ Tinh': -1, 'Hỏa Tinh': -0.5, 'Thủy Tinh': 0.3 }, 'Tam hợp': 1, 'Lục hợp': 0.6, 'Vuông': -1, 'Đối': -0.8 };
const MUC = { 'Kim Tinh': 3, 'Mộc Tinh': 5, 'Thổ Tinh': 5, 'Hỏa Tinh': 4, 'Thủy Tinh': 2 };

/** natal, nay = kết quả viTriHanhTinh(). Trả vector điểm cùng dạng các môn khác. */
export function scoreHoangDao(natal, nay) {
  const o = { mon: 'hoangDao', tong: 50, tai_loc: 50, su_nghiep: 50, tinh_cam: 50, suc_khoe: 50, quy_nhan: 50, doTinCay: 0.3, nhan: 'Hành tinh đi qua cung Mặt Trời/Trăng của bạn' };
  const goc = [], ly = [];
  const nat = natal.planets.filter((p) => p.ten === 'Mặt Trời' || p.ten === 'Mặt Trăng');
  nay.planets.filter((p) => LINH_VUC_HT[p.ten]).forEach((t) => nat.forEach((n) => {
    const diff = Math.abs(t.lon - n.lon), sep = diff > 180 ? 360 - diff : diff;
    for (const [ten, g] of GOC.map((x) => [x[0], x[1]])) {
      if (Math.abs(sep - g) > 4) continue;
      const base = ten === 'Hợp' ? DAU['Hợp'][t.ten] : DAU[ten];
      const d = base * MUC[t.ten] * (1 - Math.abs(sep - g) / 6);
      LINH_VUC_HT[t.ten].forEach((k) => { o[k] += d; });
      o.tong += d * 0.5; ly.push(`${t.ten} ${ten.toLowerCase()} ${n.ten} lúc sinh`);
    }
  }));
  const thuy = nay.planets.find((p) => p.ten === 'Thủy Tinh');
  if (thuy && thuy.nghich) { o.su_nghiep -= 3; o.quy_nhan -= 2; o.tong -= 1.5; ly.push('Thủy Tinh nghịch hành: nên rà soát hợp đồng, giấy tờ'); }
  ['tong', 'tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan'].forEach((k) => { o[k] = Math.round(clamp(o[k], 30, 75)); });
  if (ly.length) o.nhan = ly.slice(0, 2).join('; ');
  return o;
}
