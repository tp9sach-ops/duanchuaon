// Chùa online: sổ nhang (chuỗi ngày), xăm 100 quẻ, đếm niệm. Thuần hàm, không đụng DOM, có test.
// Lời xăm do dự án soạn (ghép 10 hình ảnh × 10 lời nhắn = 100 quẻ), mang tính chiêm nghiệm, không phải xăm cổ.

const HINH_ANH = [
  'Trăng soi mặt nước', 'Mây tan trên đỉnh núi', 'Sen nở giữa đầm', 'Chuông ngân đầu hồi',
  'Nắng sớm qua tàng bồ đề', 'Suối chảy qua khe đá', 'Gió nhẹ lay ngọn tre', 'Đèn dầu trong gian thờ',
  'Cầu đá bắc qua ao', 'Sương mai trên mái ngói',
];
const LOI_NHAN = [
  'việc đang chậm sẽ thông khi bạn bình tâm', 'hãy giữ lời hứa nhỏ trước khi nhận việc lớn',
  'người giúp bạn đang ở gần, đừng ngại mở lời', 'bớt vội vàng, một nhịp dừng đáng giá hơn một bước vội',
  'điều tích lũy lâu ngày sắp cho kết quả', 'hãy chăm sức khỏe và giấc ngủ trước mọi tính toán',
  'tránh tranh hơn thua, nhường một bước là đi xa', 'chuyện cũ nên buông để đường mới rộng ra',
  'cần kiểm tra lại giấy tờ, con số trước khi quyết', 'sống chân thành, lòng người sẽ tự hồi đáp',
];
// Mức xăm theo số quẻ: quy ước dự án (đều nhau để không quẻ nào "xấu" nặng)
const MUC = [
  { ten: 'Thượng cát', ghi: 'Thuận lợi, nên tiến có chừng mực.' },
  { ten: 'Trung cát', ghi: 'Khá tốt, giữ vững điều đang làm.' },
  { ten: 'Bình', ghi: 'Bình ổn, đợi thời và chuẩn bị thêm.' },
  { ten: 'Trung bình', ghi: 'Có trở ngại nhỏ, thận trọng và kiên nhẫn.' },
  { ten: 'Cần cẩn trọng', ghi: 'Chưa phải lúc mạo hiểm, nên chậm lại và hỏi ý người tin cậy.' },
];
const MUC_THEO_QUE = (n) => [0, 1, 1, 2, 2, 2, 3, 3, 4, 2][n % 10];

export const SO_QUE = 100;

/** Quẻ số n (1–100). */
export function xinXam(n) {
  const q = ((Math.floor(n) - 1) % SO_QUE + SO_QUE) % SO_QUE;    // 0–99
  const muc = MUC[MUC_THEO_QUE(q)];
  return {
    so: q + 1,
    muc: muc.ten, ghi: muc.ghi,
    loi: `${HINH_ANH[q % 10]}: ${LOI_NHAN[Math.floor(q / 10)]}.`,
  };
}

/** Rút quẻ ngẫu nhiên; rnd có thể thay để test. */
export function rutXam(rnd = Math.random) { return xinXam(1 + Math.floor(rnd() * SO_QUE)); }

/** Ngày dạng yyyy-mm-dd theo giờ địa phương. */
export const ngayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lui = (key, n) => { const [y, m, d] = key.split('-').map(Number); const t = new Date(y, m - 1, d - n); return ngayKey(t); };

/**
 * Sổ nhang: so = { 'yyyy-mm-dd': số nén }. Trả { homNay, tong, chuoi, chuoiDai }.
 * chuoi = số ngày liên tiếp tính đến hôm nay (nếu hôm nay chưa thắp thì tính đến hôm qua).
 */
export function tongKetNhang(so, now = new Date()) {
  const today = ngayKey(now), has = (k) => (so[k] || 0) > 0;
  let chuoi = 0, k = has(today) ? today : lui(today, 1);
  while (has(k)) { chuoi++; k = lui(k, 1); }
  const keys = Object.keys(so).filter(has).sort();
  let dai = 0, run = 0, prev = null;
  keys.forEach((key) => { run = prev && lui(key, 1) === prev ? run + 1 : 1; prev = key; dai = Math.max(dai, run); });
  return { homNay: so[today] || 0, tong: keys.reduce((s, key) => s + so[key], 0), chuoi, chuoiDai: dai };
}

/** Thêm nén nhang (1, 3 hoặc 9) cho hôm nay; trả bản sao mới. */
export function thapNhang(so, nen, now = new Date()) {
  if (![1, 3, 9].includes(nen)) throw new Error('Chỉ thắp 1, 3 hoặc 9 nén');
  const k = ngayKey(now); return { ...so, [k]: (so[k] || 0) + nen };
}

/** Kiểm tra điều nguyện (giống gas/Prayers.gs › prayerOk_). Trả { ok, text } hoặc { ok:false, error }. */
export function kiemTraNguyen(s) {
  let t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!t) return { ok: false, error: 'empty' };
  if (t.length > 120) t = t.slice(0, 120);
  if (/(https?:\/\/|www\.|\.com\b|\.vn\b|@)/i.test(t)) return { ok: false, error: 'no_links' };
  if (/\d[\d\s.\-]{7,}\d/.test(t)) return { ok: false, error: 'no_numbers' };
  return { ok: true, text: t };
}
