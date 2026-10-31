// Bói ngày chung: Trực, Tú, 12 thần Hoàng/Hắc đạo, giờ Hoàng đạo, Tam nương, Nguyệt kỵ, Dương công kỵ nhật, Bành Tổ.
// Nhận bảng tra `K` (js/data/knowledge.json) làm tham số để chạy được cả ở trình duyệt lẫn Node.
import { jdFromDate, solarToLunar, sunLongitudeDeg, dayOfWeek } from './lunar.js';
import { CHI, dayCanChi, yearCanChi, monthCanChi, hourCanChi } from './canchi.js';

const mod = (a, n) => ((a % n) + n) % n;
export const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export const TIET_KHI = ['Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập'];
export const GIO_KHOANG = ['23h–1h', '1h–3h', '3h–5h', '5h–7h', '7h–9h', '9h–11h', '11h–13h', '13h–15h', '15h–17h', '17h–19h', '19h–21h', '21h–23h'];

/** Tiết khí: tiết hiện tại của ngày và có phải ngày bắt đầu tiết không. */
export function tietKhi(jd) {
  const a = sunLongitudeDeg(jd, 0), b = sunLongitudeDeg(jd, 1);
  const ia = Math.floor(a / 15), ib = Math.floor(b / 15);
  return { ten: TIET_KHI[ib % 24], batDau: ia !== ib, kinhDo: Math.round(b * 10) / 10 };
}

/** Tháng theo tiết (1 = Dần, bắt đầu Lập xuân; ngày giao tiết thuộc tháng mới). */
export function thangTiet(jd) {
  const m = Math.floor(mod(sunLongitudeDeg(jd, 1) + 45, 360) / 30);
  return { so: m + 1, chi: mod(m + 2, 12) };
}

function pickTu(jd, K) {
  const n = K.tu.danhSach.length;
  return { ...K.tu.danhSach[mod(jd + K.tu.offsetJd, n)], canDoiChieu: !!K.tu.canDoiChieu };
}

/** 12 giờ trong ngày, mỗi giờ là Hoàng đạo hay Hắc đạo. */
export function gioHoangDao(dayChi, dayCan, K) {
  const start = K.thanKhoiGio[String(dayChi)];
  return CHI.map((ten, h) => {
    const than = K.than12[mod(h - start, 12)];
    return { chi: h, ten, khoang: GIO_KHOANG[h], than: than.ten, hoang: than.hoang, canChi: hourCanChi(dayCan, h).name };
  });
}

/** Phân tích đầy đủ một ngày dương. Trả đối tượng có điểm 0–100 và danh sách yếu tố cộng/trừ (dấu vết suy luận). */
export function analyzeDay(dd, mm, yy, K) {
  const jd = jdFromDate(dd, mm, yy);
  const al = solarToLunar(dd, mm, yy);
  const cc = dayCanChi(jd), tm = thangTiet(jd);
  const trucIdx = mod(cc.chi - tm.chi, 12), truc = K.truc[trucIdx];
  const tu = pickTu(jd, K);
  const khoiNgay = K.thanKhoiNgay[(tm.so - 1) % 6];
  const thanNgay = K.than12[mod(cc.chi - khoiNgay, 12)];
  const gio = gioHoangDao(cc.chi, cc.can, K);
  const tk = tietKhi(jd);

  const trace = [{ ten: 'Điểm nền', diem: 50, vi: 'Ngày trung tính' }];
  const add = (ten, diem, vi) => { if (diem) trace.push({ ten, diem, vi }); };
  add(`Trực ${truc.ten}`, truc.diem, truc.diem > 0 ? 'Trực tốt cho việc khởi đầu' : 'Trực nên cẩn trọng việc lớn');
  add(`${thanNgay.ten} (${thanNgay.hoang ? 'Hoàng đạo' : 'Hắc đạo'})`, thanNgay.hoang ? K.diemHoangDao : K.diemHacDao, 'Thần trực ngày theo tháng tiết');
  add(`Sao ${tu.ten}`, tu.diem, 'Nhị thập bát tú');

  const flags = [];
  if (K.tamNuong.ngay.includes(al.day)) { flags.push('Tam nương'); add('Ngày Tam nương', K.tamNuong.diem, 'Nên tránh việc đại sự'); }
  if (K.nguyetKy.ngay.includes(al.day)) { flags.push('Nguyệt kỵ'); add('Ngày Nguyệt kỵ', K.nguyetKy.diem, 'Ngày nên nghỉ ngơi, giảm việc lớn'); }
  if ((K.duongCongKy.theoThang[al.month] || []).includes(al.day)) { flags.push('Dương công kỵ nhật'); add('Dương công kỵ nhật', K.duongCongKy.diem, 'Ngày kỵ theo tháng âm'); }
  if (al.day === 1) { flags.push('Mùng 1'); add('Mùng 1', K.ngayDacBiet.mung1, 'Ngày đầu tháng, hợp lễ chùa'); }
  if (al.day === 15) { flags.push('Rằm'); add('Rằm', K.ngayDacBiet.ram, 'Ngày trăng tròn, hợp lễ chùa'); }

  const score = Math.max(0, Math.min(100, Math.round(trace.reduce((s, t) => s + t.diem, 0))));
  const nen = [...truc.nen], ky = [...truc.ky];
  if (!thanNgay.hoang) ky.push('việc đại sự (ngày Hắc đạo)');
  if (flags.includes('Tam nương') || flags.includes('Nguyệt kỵ')) ky.push('khởi sự việc lớn');

  return {
    solar: { dd, mm, yy, jd, thu: THU[dayOfWeek(jd)] },
    lunar: al,
    canChi: { ngay: cc, thang: monthCanChi(al.year, al.month), nam: yearCanChi(al.year) },
    tietKhi: tk, thangTiet: tm,
    truc: { ten: truc.ten, nen: truc.nen, ky: truc.ky }, tu,
    thanNgay: { ten: thanNgay.ten, hoang: thanNgay.hoang },
    gio, flags, banhTo: { can: K.banhTo.can[cc.can], chi: K.banhTo.chi[cc.chi] },
    diem: score, mood: Math.max(-1, Math.min(1, (score - 50) / 40)),
    nen: [...new Set(nen)], ky: [...new Set(ky)], trace,
    chuaDua: K.chuaDua,
  };
}
