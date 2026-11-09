/**
 * Thùng công đức (Phiên 80). Sheet "Donations":
 *   id | userKey | maSo | ten | soTien | kenh | loiNhan | ngayGui | trangThai | soTienXN | sen | daNhan | ngayDuyet
 * Luồng: người chơi chuyển tiền (QR MoMo / VietinBank) → bấm "Tôi đã chuyển" → donClaim_ ghi một dòng trangThai='cho'.
 * NGƯỜI DUYỆT (Gp) đối chiếu sao kê rồi đổi cột trangThai thành  ok  (hoặc  tuchoi ). Nếu số tiền thực nhận khác số khai thì ghi số thật vào cột soTienXN;
 * muốn tặng số hạt sen riêng thì ghi vào cột sen (để trống = tự tính 1.000đ = 1 hạt sen). Cam kết với người chơi: duyệt trong 24 giờ.
 * Lần sau người chơi mở thùng, donCheck_ trả các khoản đã duyệt mà chưa nhận; client cộng hạt sen rồi gọi donAck_ để đánh dấu daNhan=TRUE (hai bước để mất mạng giữa chừng không làm mất công đức;
 * client cũng nhớ id đã cộng nên không cộng hai lần). Không trả userKey/maSo của người khác ra ngoài.
 * Quy đổi phải GIỐNG js/engines/donate.js (DON.SEN_PER_1000, MIN_VND, MAX_VND, MAX_SEN, PENDING_MAX).
 */
var DON_SEN_PER_1000 = 1, DON_MIN_VND = 10000, DON_MAX_VND = 50000000, DON_MAX_SEN = 50000, DON_PENDING_MAX = 5, DON_PER_DAY = 10;
var DON_COLS = { id: 0, userKey: 1, maSo: 2, ten: 3, soTien: 4, kenh: 5, loiNhan: 6, ngayGui: 7, trangThai: 8, soTienXN: 9, sen: 10, daNhan: 11, ngayDuyet: 12 };

function donNum_(v) { var n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; }
function donSen_(vnd) { vnd = Math.floor(vnd); return vnd < 1000 ? 0 : Math.min(DON_MAX_SEN, Math.floor(vnd / 1000) * DON_SEN_PER_1000); }
function donText_(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }

/** Người chơi báo đã chuyển. req: { userKey, maSo, soTien, kenh, ten, loiNhan }. */
function donClaim_(req) {
  var userKey = clean_(req.userKey, 80);
  if (!userKey) return { ok: false, error: 'no_user' };
  var vnd = Math.floor(donNum_(req.soTien));
  if (vnd < DON_MIN_VND) return { ok: false, error: 'too_small' };
  if (vnd > DON_MAX_VND) return { ok: false, error: 'too_big' };
  var note = donText_(req.loiNhan, 60);
  if (/(https?:\/\/|www\.|\.com\b|\.vn\b|@)/i.test(note)) return { ok: false, error: 'no_links' };
  if (/\d[\d\s.\-]{7,}\d/.test(note)) return { ok: false, error: 'no_numbers' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_('Donations'), last = sh.getLastRow(), now = new Date();
    var today = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'), pending = 0, perDay = 0;
    if (last >= 2) {
      var from = Math.max(2, last - 300), rows = sh.getRange(from, 1, last - from + 1, 13).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (str_(rows[i][DON_COLS.userKey]) !== userKey) continue;
        if (str_(rows[i][DON_COLS.trangThai]) === 'cho') pending++;
        if (str_(rows[i][DON_COLS.ngayGui]).slice(0, 10) === today) perDay++;
      }
    }
    if (pending >= DON_PENDING_MAX || perDay >= DON_PER_DAY) return { ok: false, error: 'rate_limited' };
    var id = Utilities.getUuid();
    sh.appendRow([id, userKey, donText_(req.maSo, 12), donText_(req.ten, 40), String(vnd), req.kenh === 'bank' ? 'bank' : 'momo', note,
      Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', "yyyy-MM-dd'T'HH:mm:ss"), 'cho', '', '', '', '']);
    return { ok: true, id: id, sen: donSen_(vnd) };
  } finally { lock.releaseLock(); }
}

/** Hỏi trạng thái. req: { userKey }. Trả { ok, items: [{id, soTien, sen}] (đã duyệt, chưa nhận), pending (số khoản đang chờ), mine: [{soTien, trangThai, ngay}] (5 khoản gần nhất) }. */
function donCheck_(req) {
  var userKey = clean_(req.userKey, 80);
  if (!userKey) return { ok: false, error: 'no_user' };
  var sh = sheet_('Donations'), last = sh.getLastRow(), items = [], mine = [], pending = 0;
  if (last < 2) return { ok: true, items: items, pending: 0, mine: mine };
  var from = Math.max(2, last - 300), rows = sh.getRange(from, 1, last - from + 1, 13).getValues();
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i]; if (str_(r[DON_COLS.userKey]) !== userKey) continue;
    var st = str_(r[DON_COLS.trangThai]), vnd = Math.floor(donNum_(r[DON_COLS.soTienXN]) || donNum_(r[DON_COLS.soTien]));
    if (st === 'cho') pending++;
    if (mine.length < 5) mine.push({ soTien: vnd, trangThai: st === 'ok' ? 'ok' : st === 'tuchoi' ? 'tuchoi' : 'cho', ngay: str_(r[DON_COLS.ngayGui]).slice(0, 10) });
    if (st === 'ok' && str_(r[DON_COLS.daNhan]) !== 'TRUE') {
      var manual = Math.floor(donNum_(r[DON_COLS.sen]));
      items.push({ id: str_(r[DON_COLS.id]), soTien: vnd, sen: manual > 0 ? Math.min(DON_MAX_SEN, manual) : donSen_(vnd) });
    }
  }
  return { ok: true, items: items, pending: pending, mine: mine };
}

/** Client đã cộng hạt sen cho các id này → đánh dấu daNhan=TRUE (chỉ đánh dấu dòng của đúng userKey và đã duyệt). req: { userKey, ids: [] }. */
function donAck_(req) {
  var userKey = clean_(req.userKey, 80), ids = req.ids;
  if (!userKey) return { ok: false, error: 'no_user' };
  if (!ids || !ids.length) return { ok: true, acked: 0 };
  var want = {}; for (var k = 0; k < ids.length && k < 50; k++) want[String(ids[k]).slice(0, 64)] = true;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_('Donations'), last = sh.getLastRow(), n = 0;
    if (last < 2) return { ok: true, acked: 0 };
    var from = Math.max(2, last - 300), rows = sh.getRange(from, 1, last - from + 1, 13).getValues();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (want[str_(r[DON_COLS.id])] && str_(r[DON_COLS.userKey]) === userKey && str_(r[DON_COLS.trangThai]) === 'ok' && str_(r[DON_COLS.daNhan]) !== 'TRUE') {
        sh.getRange(from + i, DON_COLS.daNhan + 1).setValue('TRUE'); n++;
      }
    }
    return { ok: true, acked: n };
  } finally { lock.releaseLock(); }
}

/** (Tùy chọn, chạy tay trong Apps Script) Gắn danh sách chọn ok/tuchoi/cho cho cột trangThai để duyệt nhanh trong Google Sheet. setup() gọi hàm này. */
function donFormat_(sh) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(['cho', 'ok', 'tuchoi'], true).setAllowInvalid(false).build();
  sh.getRange(2, DON_COLS.trangThai + 1, Math.max(1, sh.getMaxRows() - 1), 1).setDataValidation(rule);
  sh.setFrozenRows(1);
}
