// Can Chi, Nạp âm. Thuần JS.
export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const CAN_HANH = ['Mộc', 'Mộc', 'Hỏa', 'Hỏa', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Thủy', 'Thủy'];
export const CHI_HANH = ['Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa', 'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy'];

// 30 Nạp âm, mỗi nạp âm ứng với một cặp Can Chi liền nhau trong 60 Giáp Tý.
const NAP_AM = [
  'Hải Trung Kim', 'Lư Trung Hỏa', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Kiếm Phong Kim',
  'Sơn Đầu Hỏa', 'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Bạch Lạp Kim', 'Dương Liễu Mộc',
  'Tuyền Trung Thủy', 'Ốc Thượng Thổ', 'Tích Lịch Hỏa', 'Tùng Bách Mộc', 'Trường Lưu Thủy',
  'Sa Trung Kim', 'Sơn Hạ Hỏa', 'Bình Địa Mộc', 'Bích Thượng Thổ', 'Kim Bạch Kim',
  'Phú Đăng Hỏa', 'Thiên Hà Thủy', 'Đại Trạch Thổ', 'Thoa Xuyến Kim', 'Tang Đố Mộc',
  'Đại Khê Thủy', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thạch Lựu Mộc', 'Đại Hải Thủy',
];

const mod = (a, n) => ((a % n) + n) % n;

/** Chỉ số 0..59 trong chu kỳ 60 Giáp Tý từ (can, chi). Trả -1 nếu can/chi lệch âm dương. */
export function sexagenary(can, chi) {
  for (let k = 0; k < 6; k++) { const n = can + 10 * k; if (n % 12 === chi) return n; }
  return -1;
}
export const napAm = (can, chi) => NAP_AM[Math.floor(sexagenary(can, chi) / 2)];
export const napAmHanh = (name) => name.split(' ').pop();

const pack = (can, chi) => ({ can, chi, canName: CAN[can], chiName: CHI[chi], name: `${CAN[can]} ${CHI[chi]}`, napAm: napAm(can, chi) });

/** Can Chi ngày từ JD (kiểm: 1/1/2000 = Mậu Ngọ). */
export const dayCanChi = (jd) => pack(mod(jd + 9, 10), mod(jd + 1, 12));
/** Can Chi năm âm lịch (2024 = Giáp Thìn). */
export const yearCanChi = (y) => pack(mod(y + 6, 10), mod(y + 8, 12));
/** Can Chi tháng theo tháng âm (tháng 1 = Dần). Quy ước lịch Việt, theo số tháng âm. */
export const monthCanChi = (lunarYear, lunarMonth) =>
  pack(mod(yearCanChi(lunarYear).can * 2 + lunarMonth + 1, 10), mod(lunarMonth + 1, 12));
/** Can Chi giờ: chi giờ 0..11 (Tý..Hợi), can lấy theo Can ngày (giờ Tý sớm: 23h–1h tính cùng ngày). */
export const hourCanChi = (dayCan, hourChi) => pack(mod(dayCan * 2 + hourChi, 10), hourChi);
/** Chi giờ từ giờ đồng hồ 0..23. */
export const hourToChi = (h) => Math.floor(((h + 1) % 24) / 2);
