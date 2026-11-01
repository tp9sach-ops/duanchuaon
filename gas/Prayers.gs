/**
 * Tường nguyện chung (Giai đoạn 8). Sheet "Prayers": id | userKey | noiDung | congKhai | ngay.
 * Quy tắc: ẩn danh (không trả userKey về client), tối đa 120 ký tự, không link/số điện thoại/email,
 * tối đa 5 điều nguyện mỗi người mỗi ngày, chỉ liệt kê điều nguyện có congKhai = 'TRUE'.
 * Logic kiểm nội dung phải GIỐNG js/engines/temple.js › kiemTraNguyen (client chỉ lọc trước cho tiện).
 */
var PRAYER_MAX_LEN = 120, PRAYER_PER_DAY = 5, PRAYER_LIST_MAX = 30;

function prayerOk_(s) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!s) return { ok: false, error: 'empty' };
  if (s.length > PRAYER_MAX_LEN) s = s.slice(0, PRAYER_MAX_LEN);
  if (/(https?:\/\/|www\.|\.com\b|\.vn\b|@)/i.test(s)) return { ok: false, error: 'no_links' };
  if (/\d[\d\s.\-]{7,}\d/.test(s)) return { ok: false, error: 'no_numbers' };
  return { ok: true, text: s };
}

function addPrayer_(req) {
  var userKey = clean_(req.userKey, 80);
  if (!userKey) return { ok: false, error: 'no_user' };
  var v = prayerOk_(req.noiDung);
  if (!v.ok) return v;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_('Prayers'), last = sh.getLastRow(), today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'), n = 0;
    if (last >= 2) {
      var from = Math.max(2, last - 200), rows = sh.getRange(from, 2, last - from + 1, 4).getValues();
      for (var i = 0; i < rows.length; i++) if (str_(rows[i][0]) === userKey && str_(rows[i][3]).slice(0, 10) === today) n++;
    }
    if (n >= PRAYER_PER_DAY) return { ok: false, error: 'rate_limited' };
    sh.appendRow([Utilities.getUuid(), userKey, v.text, req.congKhai === false ? 'FALSE' : 'TRUE', today]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function listPrayers_() {
  var sh = sheet_('Prayers'), last = sh.getLastRow();
  if (last < 2) return { ok: true, items: [] };
  var from = Math.max(2, last - 200), rows = sh.getRange(from, 1, last - from + 1, 5).getValues(), out = [];
  for (var i = rows.length - 1; i >= 0 && out.length < PRAYER_LIST_MAX; i--) {
    if (str_(rows[i][3]) === 'TRUE') out.push({ noiDung: str_(rows[i][2]), ngay: str_(rows[i][4]).slice(0, 10) });
  }
  return { ok: true, items: out };
}
