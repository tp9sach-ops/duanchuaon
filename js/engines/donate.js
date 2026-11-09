// Thùng công đức (Phiên 80). LOGIC THUẦN (không DOM/three.js), có test: tests/donate.test.mjs.
// Người chơi chuyển tiền (quét QR MoMo/VietinBank hoặc chép số tài khoản), rồi bấm "Tôi đã chuyển" kèm số tiền → máy chủ (gas/Donations.gs) ghi một dòng "chờ duyệt".
// Gp đối chiếu sao kê, đổi cột trangThai thành 'ok' (hoặc 'tuchoi') trong sheet Donations. Lần sau người chơi mở thùng, game hỏi máy chủ và cộng hạt sen MỘT LẦN cho mỗi khoản đã duyệt
// ("trong 24 giờ" là cam kết xử lý của người duyệt). Quy đổi dưới đây là QUY ƯỚC tạm — ptg chỉnh ở đây VÀ ở gas/Donations.gs (DON_SEN_PER_1000 phải giữ GIỐNG).
// Tuyệt đối không ghi số thẻ/khóa vào mã; số tài khoản nhận tiền là thông tin công khai ptg đã đưa để hiển thị.

/** Nơi nhận công đức (thông tin công khai ptg cung cấp ngày 2026-11-09). Ảnh QR nằm ở assets/. */
export const DONATE_TARGET = Object.freeze({
  chuTk: 'PHAN TRUONG GIANG',
  nganHang: 'VietinBank',
  chiNhanh: 'CN TÂN BÌNH - HỘI SỞ',
  soTk: '108002706141',
  qrMomo: 'assets/qr-momo.jpg',
  qrBank: 'assets/qr-vietinbank.jpg',
});

export const DON = Object.freeze({
  SEN_PER_1000: 1,          // 1.000 đồng = 1 hạt sen (quy ước tạm, ptg chỉnh được)
  MIN_VND: 10000,           // tối thiểu một lần xác nhận
  MAX_VND: 50000000,        // tối đa một lần (chống gõ nhầm số 0)
  MAX_SEN: 50000,           // trần hạt sen cộng cho một khoản
  PENDING_MAX: 5,           // tối đa số khoản đang chờ duyệt của một người (chống làm đầy sheet)
  HOURS: 24,                // cam kết xử lý
  PRESETS: Object.freeze([10000, 20000, 50000, 100000, 200000, 500000]),
});

/** Định dạng tiền Việt: 100000 → "100.000đ". */
export const formatVnd = (n) => {
  const v = Number.isFinite(+n) ? Math.max(0, Math.floor(+n)) : 0;
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};

/** Hạt sen nhận được cho số tiền `vnd` (làm tròn xuống theo mỗi 1.000đ, có trần). */
export function senFor(vnd) {
  const v = Number.isFinite(+vnd) ? Math.floor(+vnd) : 0;
  if (v < 1000) return 0;
  return Math.min(DON.MAX_SEN, Math.floor(v / 1000) * DON.SEN_PER_1000);
}

/** Đọc số tiền người dùng gõ: nhận "50000", "50.000", "50,000", "50k", "1tr", "1 triệu", "50 nghìn". Trả { ok, vnd } hoặc { ok:false, error }. */
export function parseAmount(text) {
  let s = String(text == null ? '' : text).trim().toLowerCase().replace(/đ|vnd|vnđ|d$/g, '').trim();
  if (!s) return { ok: false, error: 'empty' };
  let mul = 1;
  const m = s.match(/^([\d.,\s]+?)\s*(k|nghìn|ngàn|nghin|ngan|tr|triệu|trieu|m)?$/);
  if (!m) return { ok: false, error: 'bad_number' };
  const unit = m[2]; let num = m[1].replace(/\s/g, '');
  if (unit === 'k' || /^ngh|^ng[aà]n/.test(unit || '')) mul = 1000;
  else if (unit === 'tr' || unit === 'm' || /^tri/.test(unit || '')) mul = 1000000;
  if (mul > 1) {
    num = num.replace(',', '.');                                  // "1,5tr" = 1.5 triệu
    if ((num.match(/\./g) || []).length > 1) return { ok: false, error: 'bad_number' };
  } else {
    if (/[.,]\d{1,2}$/.test(num)) return { ok: false, error: 'bad_number' };   // "50.5" không hợp lệ khi không có đơn vị
    num = num.replace(/[.,]/g, '');                               // dấu chấm/phẩy là phân cách nghìn
  }
  const x = parseFloat(num); if (!Number.isFinite(x)) return { ok: false, error: 'bad_number' };
  const vnd = Math.round(x * mul);
  if (vnd < DON.MIN_VND) return { ok: false, error: 'too_small', vnd };
  if (vnd > DON.MAX_VND) return { ok: false, error: 'too_big', vnd };
  return { ok: true, vnd };
}

/**
 * Mã đối chiếu ngắn của người chơi để ghi vào NỘI DUNG chuyển khoản (giúp Gp tìm đúng người): "DGT" + 6 ký tự từ userKey/aid.
 * Cùng một khóa luôn ra cùng một mã; không dùng ký tự dễ nhầm (0/O, 1/I).
 */
export function donateCode(key) {
  const s = String(key == null ? '' : key); let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let out = '';
  for (let i = 0; i < 6; i++) { out += A[h % A.length]; h = (Math.imul(h, 1103515245) + 12345) >>> 0; h = (h ^ (h >>> 7)) >>> 0; }
  return 'DGT' + out;
}

/** Lời nhắn kèm theo (tên/lời nguyện) — cắt 60 ký tự, bỏ ký tự điều khiển; chặn đường dẫn/email/dãy số dài để không biến sheet thành nơi quảng cáo. */
export function cleanNote(text) {
  const t = String(text == null ? '' : text).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (/https?:|www\.|@|\.(com|vn|net|org)\b/i.test(t)) return { ok: false, error: 'no_links' };
  if (/\d{7,}/.test(t.replace(/[\s.\-]/g, ''))) return { ok: false, error: 'no_numbers' };
  return { ok: true, note: t };
}

/** Gói gửi máy chủ khi bấm "Tôi đã chuyển". Trả { ok, payload } hoặc { ok:false, error }. */
export function buildClaim({ amount, note, userKey, name = '', via = 'momo' }) {
  const a = parseAmount(amount); if (!a.ok) return a;
  const n = cleanNote(note); if (!n.ok) return n;
  if (!userKey) return { ok: false, error: 'no_user' };
  return { ok: true, payload: { userKey: String(userKey), maSo: donateCode(userKey), soTien: a.vnd, kenh: via === 'bank' ? 'bank' : 'momo', ten: String(name || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 40), loiNhan: n.note } };
}

/** Thông điệp lỗi hiển thị. */
export const donateError = (e) => ({
  empty: 'Hãy nhập số tiền bạn đã chuyển.', bad_number: 'Chưa đọc được số tiền. Ví dụ: 50000 hoặc 50k.',
  too_small: `Số tiền tối thiểu là ${formatVnd(DON.MIN_VND)}.`, too_big: `Số tiền tối đa một lần là ${formatVnd(DON.MAX_VND)}. Nếu lớn hơn, hãy chia nhiều lần.`,
  no_links: 'Lời nhắn không đưa đường dẫn hoặc email.', no_numbers: 'Lời nhắn không đưa số điện thoại hoặc dãy số dài.',
  no_user: 'Chưa nhận ra bạn (trình duyệt chặn lưu dữ liệu).', rate_limited: `Bạn đang có ${DON.PENDING_MAX} khoản chờ duyệt. Hãy đợi thầy duyệt xong rồi gửi tiếp.`,
  api_disabled: 'Chưa kết nối máy chủ nên chưa ghi nhận được. Bạn vẫn có thể chuyển công đức; hãy thử lại khi có mạng.',
  network: 'Chưa gửi được (mất mạng?). Hãy thử lại.', timeout: 'Máy chủ phản hồi chậm. Hãy thử lại sau ít phút.',
}[e] || 'Chưa ghi nhận được. Hãy thử lại sau.');

/**
 * Xử lý danh sách khoản ĐÃ DUYỆT máy chủ trả về cho người chơi: [{ id, soTien, sen }].
 * Chỉ cộng mỗi id một lần (`done` là mảng id đã cộng, lưu ở máy), dùng `sen` của máy chủ nếu có, không thì tính lại từ soTien. Trả { add, ids (mới), done (mảng mới, giữ ≤ 200) }.
 */
export function creditApproved(items, done = []) {
  const seen = new Set(Array.isArray(done) ? done.map(String) : []), ids = []; let add = 0;
  for (const it of Array.isArray(items) ? items : []) {
    const id = it && it.id != null ? String(it.id).slice(0, 64) : ''; if (!id || seen.has(id)) continue;
    const sen = Number.isFinite(+it.sen) && +it.sen > 0 ? Math.min(DON.MAX_SEN, Math.floor(+it.sen)) : senFor(it.soTien);
    seen.add(id); ids.push(id); add += sen;
  }
  return { add, ids, done: [...(Array.isArray(done) ? done.map(String) : []), ...ids].slice(-200) };
}

export const loadDone = (raw) => { try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a.map(String).slice(-200) : []; } catch (_) { return []; } };
