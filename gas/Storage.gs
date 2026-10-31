/**
 * Diệu Giang Tự — lưu trữ Google Sheet (hồ sơ người dùng).
 * Dán file này cạnh Code.gs trong cùng dự án Apps Script. Mẫu theo bài học thực tế:
 *  - ép cột là văn bản để Sheets KHÔNG tự đổi chuỗi ngày thành Date;
 *  - khi đọc, chuẩn hóa mọi Date thành chuỗi, KHÔNG trả Date về client;
 *  - upsert chỉ đọc cột khóa (userKey), không đọc cả bảng;
 *  - LockService chống ghi đồng thời; CacheService để đọc nhanh.
 */

var PROFILE_CACHE_SEC = 300;

/** Ép toàn bộ cột của một sheet là văn bản (gọi khi tạo và mỗi khi mở sheet). */
function textFormat_(sh) {
  var cols = Math.max(1, sh.getLastColumn());
  sh.getRange(1, 1, sh.getMaxRows(), cols).setNumberFormat('@');
}

function str_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  return v == null ? '' : String(v);
}

/** Tìm hàng theo userKey (cột B) — chỉ đọc cột này. Trả số hàng (1-based) hoặc -1. */
function findRow_(sh, userKey) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var keys = sh.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) if (str_(keys[i][0]) === userKey) return i + 2;
  return -1;
}

function validKey_(k) { return /^[A-Za-z0-9\-_.]{8,80}$/.test(k); }

function saveProfile_(req) {
  var userKey = clean_(req.userKey, 80), p = req.profile || {};
  if (!validKey_(userKey)) return { ok: false, error: 'bad_userKey' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_('Profiles'); textFormat_(sh);
    var row = findRow_(sh, userKey), headers = SHEETS.Profiles, now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
    var old = row > 0 ? sh.getRange(row, 1, 1, headers.length).getValues()[0] : null;
    var rec = [
      old ? str_(old[0]) : Utilities.getUuid(), userKey,
      clean_(p.hoTen, 80), clean_(p.ngaySinhDL, 12), clean_(p.gioSinh, 4), clean_(p.noiSinh, 80), clean_(p.gioiTinh, 6),
      old ? str_(old[7]) : now, clean_(p.loaiLich, 6), clean_(p.ngaySinhNhap, 20)
    ];
    if (row > 0) sh.getRange(row, 1, 1, rec.length).setValues([rec]); else sh.appendRow(rec);
    CacheService.getScriptCache().remove('profile:' + userKey);
    log_('saveProfile', userKey.slice(0, 8));
    return { ok: true, profileId: rec[0] };
  } finally { lock.releaseLock(); }
}

function getProfile_(req) {
  var userKey = clean_(req.userKey, 80);
  if (!validKey_(userKey)) return { ok: false, error: 'bad_userKey' };
  var cache = CacheService.getScriptCache(), hit = cache.get('profile:' + userKey);
  if (hit) return JSON.parse(hit);
  var sh = sheet_('Profiles'), row = findRow_(sh, userKey), res;
  if (row < 0) res = { ok: true, profile: null };
  else {
    var v = sh.getRange(row, 1, 1, SHEETS.Profiles.length).getValues()[0].map(str_);
    res = { ok: true, profile: { profileId: v[0], hoTen: v[2], ngaySinhDL: v[3], gioSinh: v[4], noiSinh: v[5], gioiTinh: v[6], loaiLich: v[8], ngaySinhNhap: v[9] } };
  }
  cache.put('profile:' + userKey, JSON.stringify(res), PROFILE_CACHE_SEC);
  return res;
}

/** Xóa toàn bộ dữ liệu của một userKey: hồ sơ, bài đọc, nhang, lời nguyện. Không xóa Nhật ký (chỉ chứa 8 ký tự đầu của khóa). */
function deleteProfile_(req) {
  var userKey = clean_(req.userKey, 80);
  if (!validKey_(userKey)) return { ok: false, error: 'bad_userKey' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var removed = 0, profileId = '';
    var sh = sheet_('Profiles'), row = findRow_(sh, userKey);
    if (row > 0) { profileId = str_(sh.getRange(row, 1).getValue()); sh.deleteRow(row); removed++; }
    // Readings khóa theo profileId (cột B); Incense/Prayers khóa theo userKey (cột A / B)
    removed += deleteWhere_('Readings', 2, profileId);
    removed += deleteWhere_('Incense', 1, userKey);
    removed += deleteWhere_('Prayers', 2, userKey);
    CacheService.getScriptCache().remove('profile:' + userKey);
    log_('deleteProfile', userKey.slice(0, 8));
    return { ok: true, removed: removed };
  } finally { lock.releaseLock(); }
}

/** Xóa mọi hàng có cột `col` (1-based) bằng `value`, duyệt từ dưới lên để không lệch chỉ số. */
function deleteWhere_(sheetName, col, value) {
  if (!value) return 0;
  var sh = sheet_(sheetName), last = sh.getLastRow(), n = 0;
  if (last < 2) return 0;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (str_(vals[i][0]) === value) { sh.deleteRow(i + 2); n++; }
  return n;
}

function log_(action, note) {
  try { sheet_('Logs').appendRow([Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"), action, note || '']); } catch (e) { /* ghi log không được làm hỏng yêu cầu chính */ }
}
