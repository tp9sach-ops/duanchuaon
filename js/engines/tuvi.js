// Tử vi đẩu số, mức SƠ BỘ: an Mệnh/Thân, Cục, Tử Vi và 14 chính tinh, Tứ hóa theo Can năm, Đại hạn.
// Có 9 phụ tinh (Tả Hữu, Xương Khúc, Lộc Tồn, Kình Đà, Khôi Việt). CHƯA có: Không Kiếp, Hỏa Linh, Tuần Triệt, sao Thái Tuế/Bác Sĩ/Tràng Sinh, độ miếu/hãm, Tiểu hạn. Kết quả chỉ để tham khảo.
// Quy ước (ghi để ptg đối chiếu): giờ sinh tính theo chi giờ (Tý = 0); tháng nhuận từ ngày 16 trở đi tính sang tháng sau.
import { CAN, CHI, napAm, napAmHanh } from './canchi.js';
import { yearCanChi } from './canchi.js';

const mod = (a, n) => ((a % n) + n) % n;
export const CUNG_CHUC = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'];
const CUC = { Thủy: 2, Mộc: 3, Kim: 4, Thổ: 5, Hỏa: 6 };
const TEN_CUC = { 2: 'Thủy nhị cục', 3: 'Mộc tam cục', 4: 'Kim tứ cục', 5: 'Thổ ngũ cục', 6: 'Hỏa lục cục' };

// Tứ hóa theo Can năm: [Lộc, Quyền, Khoa, Kỵ]
export const TU_HOA = {
  Giáp: ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], Ất: ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
  Bính: ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], Đinh: ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
  Mậu: ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'], Kỷ: ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
  Canh: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'], Tân: ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
  Nhâm: ['Thiên Lương', 'Tử Vi', 'Tả Phụ', 'Vũ Khúc'], Quý: ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
};
const TEN_HOA = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];

/** Vị trí Tử Vi (chỉ số chi 0..11) theo cục và ngày âm. */
export function viTriTuVi(cuc, ngay) {
  let x = 0; while ((ngay + x) % cuc !== 0) x++;
  const q = (ngay + x) / cuc;
  const dan = 2 + q - 1;                            // đếm từ Dần, tiến q-1 cung
  return mod(x % 2 ? dan - x : dan + x, 12);        // x lẻ lùi, x chẵn tiến
}

/** An 14 chính tinh. Trả { 'Tử Vi': chi, ... }. */
export function anChinhTinh(tv) {
  const phu = mod(4 - tv, 12);
  return {
    'Tử Vi': tv, 'Thiên Cơ': mod(tv - 1, 12), 'Thái Dương': mod(tv - 3, 12), 'Vũ Khúc': mod(tv - 4, 12), 'Thiên Đồng': mod(tv - 5, 12), 'Liêm Trinh': mod(tv - 8, 12),
    'Thiên Phủ': phu, 'Thái Âm': mod(phu + 1, 12), 'Tham Lang': mod(phu + 2, 12), 'Cự Môn': mod(phu + 3, 12), 'Thiên Tướng': mod(phu + 4, 12),
    'Thiên Lương': mod(phu + 5, 12), 'Thất Sát': mod(phu + 6, 12), 'Phá Quân': mod(phu + 10, 12),
  };
}

/** An 9 phụ tinh thông dụng. thang = tháng âm (đã xử lý nhuận), gio = chi giờ 0..11, canNam = 0..9. */
export function anPhuTinh(thang, gio, canNam) {
  const loc = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][canNam];                       // Lộc Tồn: Giáp Dần, Ất Mão, Bính/Mậu Tỵ, Đinh/Kỷ Ngọ, Canh Thân, Tân Dậu, Nhâm Hợi, Quý Tý
  const kv = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]][canNam];   // Thiên Khôi, Thiên Việt
  return {
    'Tả Phụ': mod(4 + thang - 1, 12), 'Hữu Bật': mod(10 - (thang - 1), 12),
    'Văn Xương': mod(10 - gio, 12), 'Văn Khúc': mod(4 + gio, 12),
    'Lộc Tồn': loc, 'Kình Dương': mod(loc + 1, 12), 'Đà La': mod(loc - 1, 12),
    'Thiên Khôi': kv[0], 'Thiên Việt': kv[1],
  };
}

/** Can của cung (chi) theo Can năm sinh: Ngũ Hổ độn, Dần mang Can đầu. */
export const canCung = (canNam, chi) => mod([2, 4, 6, 8, 0][canNam % 5] + mod(chi - 2, 12), 10);

/**
 * Lập lá số. input: { lunar:{day,month,year,leap}, gio: 0..11, gioiTinh: 'nam'|'nu' }
 * Trả null nếu thiếu giờ sinh (không lập được Mệnh/Thân).
 */
export function lapLaSo({ lunar, gio, gioiTinh }) {
  if (gio == null || gio < 0 || gio > 11) return null;
  const nam = yearCanChi(lunar.year);
  const thang = lunar.leap && lunar.day > 15 ? lunar.month + 1 : lunar.month;
  const menh = mod(2 + (thang - 1) - gio, 12), than = mod(2 + (thang - 1) + gio, 12);
  const canMenh = canCung(nam.can, menh);
  const hanhCuc = napAmHanh(napAm(canMenh, menh));
  const cuc = CUC[hanhCuc];
  const tv = viTriTuVi(cuc, lunar.day), sao = anChinhTinh(tv);

  const hoa = {}; const dsHoa = TU_HOA[CAN[nam.can]];
  dsHoa.forEach((s, i) => { hoa[s] = TEN_HOA[i]; });
  const cung = Array.from({ length: 12 }, (_, c) => ({ chi: c, chiName: CHI[c], can: CAN[canCung(nam.can, c)], chucVu: CUNG_CHUC[mod(c - menh, 12)], sao: [], laThan: c === than }));
  Object.entries(sao).forEach(([s, c]) => cung[c].sao.push({ ten: s, hoa: hoa[s] || null }));
  const phu = anPhuTinh(thang, gio, nam.can);
  Object.entries(phu).forEach(([s, c]) => cung[c].sao.push({ ten: s, hoa: hoa[s] || null, phu: true }));

  // Đại hạn: Dương Nam, Âm Nữ đi thuận; Âm Nam, Dương Nữ đi nghịch. Mỗi hạn 10 năm, hạn đầu bắt đầu từ tuổi = số cục.
  // Không nêu giới tính thì không tính Đại hạn (hướng đi thuận/nghịch phụ thuộc giới tính)
  const duong = nam.can % 2 === 0, coGT = gioiTinh === 'nam' || gioiTinh === 'nu';
  const thuan = coGT ? (duong && gioiTinh === 'nam') || (!duong && gioiTinh === 'nu') : null;
  if (coGT) Array.from({ length: 12 }, (_, i) => { const c = mod(menh + (thuan ? i : -i), 12); cung[c].daiHan = [cuc + 10 * i, cuc + 10 * i + 9]; });

  return { namSinh: nam.name, menh, than, cuc, tenCuc: TEN_CUC[cuc], hanhCuc, canMenh: CAN[canMenh], thuan, tuHoa: dsHoa.map((s, i) => `${TEN_HOA[i]}: ${s}`), cung, nhuanSangThang: !!(lunar.leap && lunar.day > 15) };
}

// Chấm điểm sơ bộ: thang 50, mỗi chính tinh ±nhẹ, Tứ hóa cộng/trừ; độ tin cậy thấp vì chưa có phụ tinh, miếu/hãm.
const SAO_DIEM = { 'Tử Vi': 6, 'Thiên Phủ': 6, 'Thiên Lương': 5, 'Thái Âm': 4, 'Thái Dương': 4, 'Thiên Đồng': 4, 'Thiên Cơ': 3, 'Vũ Khúc': 3, 'Thiên Tướng': 4, 'Cự Môn': -1, 'Tham Lang': 0, 'Liêm Trinh': -1, 'Thất Sát': -2, 'Phá Quân': -3 };
const PHU_DIEM = { 'Tả Phụ': 3, 'Hữu Bật': 3, 'Văn Xương': 2, 'Văn Khúc': 2, 'Lộc Tồn': 3, 'Thiên Khôi': 3, 'Thiên Việt': 3, 'Kình Dương': -3, 'Đà La': -3 };
const HOA_DIEM = { 'Hóa Lộc': 6, 'Hóa Quyền': 3, 'Hóa Khoa': 4, 'Hóa Kỵ': -6 };
const CHUC_LV = { tai_loc: 'Tài Bạch', su_nghiep: 'Quan Lộc', tinh_cam: 'Phu Thê', suc_khoe: 'Tật Ách', quy_nhan: 'Nô Bộc' };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function diemCung(c) {
  let d = 50; c.sao.forEach((s) => { d += (SAO_DIEM[s.ten] || PHU_DIEM[s.ten] || 0) + (s.hoa ? HOA_DIEM[s.hoa] : 0); });
  return d;
}
/** Vector điểm cho bộ tổng hợp (cùng dạng các môn khác). */
export function scoreTuVi(ls) {
  if (!ls) return null;
  const by = (ten) => ls.cung.find((c) => c.chucVu === ten);
  const o = { mon: 'tuVi', nhan: `Tử vi: Mệnh ${CHI[ls.menh]}, ${ls.tenCuc}`, doTinCay: 0.35 };
  Object.entries(CHUC_LV).forEach(([k, ten]) => { o[k] = Math.round(clamp(diemCung(by(ten)), 25, 85)); });
  o.tong = Math.round((diemCung(by('Mệnh')) * 2 + o.tai_loc + o.su_nghiep + o.tinh_cam + o.suc_khoe) / 6);
  o.tong = clamp(o.tong, 25, 85);
  return o;
}
