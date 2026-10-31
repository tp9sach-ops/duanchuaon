// Cung hoàng đạo (Tây phương, hệ nhiệt đới): Mặt Trời, Mặt Trăng, Mọc. Dùng astro.js để tính kinh độ.
import { jdFromUTC, sunLongitude, moonLongitude, ascendant } from './astro.js';

/** Chỉ số cung (0 = Bạch Dương … 11 = Song Ngư) từ kinh độ hoàng đạo. */
export const signIndex = (lon) => Math.floor((((lon % 360) + 360) % 360) / 30);
const degInSign = (lon) => (((lon % 360) + 360) % 360) % 30;

/** Giờ địa phương (UTC+7) → mốc UTC (ms). gioChi: 0..11 (Tý..Hợi) lấy giữa canh giờ; null nếu không rõ giờ (dùng 12:00). */
export function birthUTC(dd, mm, yy, gioChi) {
  const hour = gioChi == null || gioChi < 0 ? 12 : gioChi * 2; // Tý → 0h, Sửu → 2h, ...
  return Date.UTC(yy, mm - 1, dd, hour - 7, 0, 0);
}

/** Lập biểu đồ cơ bản. noiSinh = { lat, lon } hoặc null. */
export function natalSigns(dd, mm, yy, gioChi, noiSinh, Z) {
  const coGio = gioChi != null && gioChi >= 0;
  const t = birthUTC(dd, mm, yy, coGio ? gioChi : null), jd = jdFromUTC(t);
  const sunLon = sunLongitude(jd);
  const moonLon = moonLongitude(jd);
  // Nếu không rõ giờ, Mặt Trăng đi ~13°/ngày: kiểm tra đầu và cuối ngày có cùng cung không
  let chacMat = true;
  if (!coGio) {
    const j0 = jdFromUTC(Date.UTC(yy, mm - 1, dd, -7)), j1 = jdFromUTC(Date.UTC(yy, mm - 1, dd, 17));
    chacMat = signIndex(moonLongitude(j0)) === signIndex(moonLongitude(j1));
  }
  // Mặt Trời đổi cung trong ngày sinh? (chỉ cần để cảnh báo khi ở sát ranh giới)
  const sunSat = degInSign(sunLon) < 1 || degInSign(sunLon) > 29;
  const out = {
    matTroi: { lon: sunLon, cung: Z.cung[signIndex(sunLon)], do: degInSign(sunLon), satRanhGioi: sunSat && !coGio },
    matTrang: { lon: moonLon, cung: Z.cung[signIndex(moonLon)], do: degInSign(moonLon), chacChan: chacMat },
    cungMoc: null,
  };
  if (coGio && noiSinh) {
    const asc = ascendant(jd, noiSinh.lat, noiSinh.lon);
    out.cungMoc = { lon: asc, cung: Z.cung[signIndex(asc)], do: degInSign(asc) };
  }
  const trace = [
    { ten: 'Cung Mặt Trời', vi: `kinh độ ${sunLon.toFixed(2)}° → ${out.matTroi.cung.ten} (${out.matTroi.do.toFixed(1)}°)${out.matTroi.satRanhGioi ? '; sát ranh giới cung, nên cần giờ sinh để chắc chắn' : ''}` },
    { ten: 'Cung Mặt Trăng', vi: `kinh độ ${moonLon.toFixed(2)}° → ${out.matTrang.cung.ten}${out.matTrang.chacChan ? '' : '; chưa có giờ sinh nên Mặt Trăng có thể thuộc cung khác trong ngày'}` },
  ];
  trace.push(out.cungMoc
    ? { ten: 'Cung Mọc', vi: `tính từ giờ sinh + vĩ độ ${noiSinh.lat}°, kinh độ ${noiSinh.lon}° → ${out.cungMoc.cung.ten}` }
    : { ten: 'Cung Mọc', vi: coGio ? 'chưa chọn nơi sinh nên chưa tính được' : 'cần giờ sinh và nơi sinh' });
  out.trace = trace;
  out.doTinCay = coGio ? (noiSinh ? 0.85 : 0.7) : 0.55;
  return out;
}
