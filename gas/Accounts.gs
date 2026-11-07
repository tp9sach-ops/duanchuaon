/**
 * Diệu Giang Tự — TÀI KHOẢN NHÂN VẬT (Phiên 53). Dán cạnh Code.gs + Storage.gs trong cùng dự án Apps Script.
 *
 * Một tài khoản = (tên nhân vật + mật khẩu). Sheet "Accounts" (tự tạo nếu chưa có), mỗi hàng một nhân vật:
 *   aid | accKey | name | ngayTao | lanDangNhap | tokens | rev | sid | capNhat | d1 | d2 | d3 | d4
 *  - accKey = sha256('lgt-acct-v1|' + key) với key = PBKDF2 do TRÌNH DUYỆT tính từ (mật khẩu, tên). Mật khẩu thật KHÔNG bao giờ tới đây
 *    và trong Sheet cũng không có mật khẩu hay khóa đăng nhập dùng lại được. accKey là khóa duy nhất → cùng tên + cùng mật khẩu thì báo trùng.
 *  - tokens = JSON các sha256(token) của từng máy đã đăng nhập (tối đa 8, máy mới nhất giữ lại). Máy nào có token thì lưu/đọc được dữ liệu.
 *  - rev = số lần lưu (tăng 1 mỗi lần). Máy gửi kèm `base` = rev nó đã biết; lệch → báo 'stale' để KHÔNG ghi đè tiến trình của máy khác.
 *  - sid = mã của lần lưu cuối: gửi lại đúng lần lưu (do mạng chập chờn, client tự thử lại) thì coi như đã xong, không báo stale oan.
 *  - d1..d4 = bản lưu dữ liệu game (JSON các khóa lgt.* của trình duyệt), chia 4 ô ≤ 45.000 ký tự (giới hạn của một ô Sheet là 50.000).
 *
 * Hành động (POST text/plain như các hàm khác): acctCreate, acctLogin, acctLoad, acctSave, acctLogout (xem Code.gs → doPost).
 * Quy tắc phải GIỐNG js/engines/account.js. Sau khi sửa: Deploy → Manage deployments → Edit → New version (URL /exec giữ nguyên).
 */
var ACCT = { SALT: 'lgt-acct-v1|', NAME_MAX: 20, MAX_SAVE: 150000, CELL: 45000, CELLS: 4, TOKENS_KEEP: 8, FAIL_MAX: 15, FAIL_SEC: 900 };
/** Khóa localStorage chỉ là cài đặt thiết bị — không bao giờ lưu lên tài khoản (giữ giống DEVICE_KEYS trong js/engines/account.js). */
var ACCT_DEVICE_KEYS = ['lgt.acct', 'lgt.perf', 'lgt.sound', 'lgt.vol', 'lgt.vfx', 'lgt.mm', 'lgt.tut', 'lgt.khinhHint'];
// Cột (1-based) trong sheet Accounts
var AC = { AID: 1, KEY: 2, NAME: 3, CREATED: 4, LOGIN: 5, TOKENS: 6, REV: 7, SID: 8, UPDATED: 9, DATA: 10 };

function acctNow_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"); }

function acctHex_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8), out = '';
  for (var i = 0; i < b.length; i++) { var x = b[i] < 0 ? b[i] + 256 : b[i]; out += (x < 16 ? '0' : '') + x.toString(16); }
  return out;
}

/** Mở sheet Accounts; chưa có (bản triển khai cũ chưa chạy lại setup()) thì tự tạo. */
function acctSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chưa chạy setup()');
  var ss = SpreadsheetApp.openById(id), sh = ss.getSheetByName('Accounts');
  if (!sh) { sh = ss.insertSheet('Accounts'); sh.appendRow(SHEETS.Accounts); textFormat_(sh); }
  return sh;
}

/** Tên ≤ 20, không link/@; sai → '' (giống roomName_ nhưng KHÔNG đổi thành 'Khách'). */
function acctName_(s) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/(https?:\/\/|www\.|@)/i.test(s)) return '';
  return s.slice(0, ACCT.NAME_MAX).trim();
}
function acctNorm_(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }

/** Chống đoán mật khẩu: đếm lần sai theo TÊN trong 15 phút; từ FAIL_MAX lần trở đi thì khóa tới khi hết hạn. */
function acctFailKey_(name) { return 'af:' + acctHex_(acctNorm_(name)).slice(0, 24); }
function acctLimited_(name) { return (Number(CacheService.getScriptCache().get(acctFailKey_(name))) || 0) >= ACCT.FAIL_MAX; }
function acctFail_(name) { var c = CacheService.getScriptCache(), k = acctFailKey_(name); c.put(k, String((Number(c.get(k)) || 0) + 1), ACCT.FAIL_SEC); }
function acctClearFail_(name) { CacheService.getScriptCache().remove(acctFailKey_(name)); }

/** Tìm hàng theo giá trị cột `col` (chỉ đọc đúng cột đó). Trả số hàng (1-based) hoặc -1. */
function acctFind_(sh, col, value) {
  var last = sh.getLastRow();
  if (last < 2 || !value) return -1;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (str_(vals[i][0]) === value) return i + 2;
  return -1;
}
function acctRead_(sh, row) { return sh.getRange(row, 1, 1, AC.DATA + ACCT.CELLS - 1).getValues()[0].map(str_); }
/** Ghi các ô liên tiếp của một hàng từ cột `col`; ép văn bản trước để Sheets không đổi chuỗi số/ngày. Chỉ ghi phần cần đổi (đăng nhập không phải ghi lại cả bản lưu). */
function acctPut_(sh, row, col, vals) {
  var rg = sh.getRange(row, col, 1, vals.length); rg.setNumberFormat('@'); rg.setValues([vals]);
}
/** Thêm hàng mới ở cuối; vượt cỡ sheet thì nới thêm. */
function acctAppend_(sh, rec) {
  var row = sh.getLastRow() + 1;
  if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);
  acctPut_(sh, row, 1, rec);
}

function acctTokens_(cell) { try { var a = JSON.parse(cell || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function acctHasToken_(cell, token) {
  if (!/^[0-9a-f]{32}$/.test(String(token || ''))) return false;
  var h = acctHex_(token), list = acctTokens_(cell);
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].h === h) return true;
  return false;
}
/** Cấp token mới cho một máy; trả { token, cell } (cell = chuỗi JSON mới của cột tokens). */
function acctAddToken_(cell) {
  var token = Utilities.getUuid().replace(/-/g, ''), list = acctTokens_(cell);
  list.push({ h: acctHex_(token), t: acctNow_() });
  if (list.length > ACCT.TOKENS_KEEP) list = list.slice(-ACCT.TOKENS_KEEP);
  return { token: token, cell: JSON.stringify(list) };
}

/** Kiểm + làm sạch bản lưu từ client → { s: chuỗi JSON } | { error }. Chỉ nhận khóa lgt.* dạng chuỗi, bỏ khóa thiết bị. */
function acctBlob_(save) {
  if (!save || typeof save !== 'object' || !save.d || typeof save.d !== 'object') return { error: 'bad_request' };
  var d = {}, keys = Object.keys(save.d);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i], v = save.d[k];
    if (!/^lgt\.[A-Za-z0-9_.-]{1,40}$/.test(k) || typeof v !== 'string' || ACCT_DEVICE_KEYS.indexOf(k) >= 0) continue;
    d[k] = v;
  }
  var s = JSON.stringify({ v: 1, d: d });
  if (s.length > ACCT.MAX_SAVE) return { error: 'too_big' };
  return { s: s };
}
/** Chia chuỗi vào CELLS ô; không cắt giữa cặp ký tự thay thế (emoji) để Sheets không làm hỏng. */
function acctSplit_(s) {
  var out = [], pos = 0;
  for (var i = 0; i < ACCT.CELLS; i++) {
    var end = Math.min(s.length, pos + ACCT.CELL);
    if (end < s.length) { var c = s.charCodeAt(end - 1); if (c >= 0xD800 && c <= 0xDBFF) end--; }
    out.push(s.substring(pos, end)); pos = end;
  }
  return out;
}
function acctJoin_(rec) { var s = ''; for (var i = 0; i < ACCT.CELLS; i++) s += rec[AC.DATA - 1 + i] || ''; return s; }
function acctParse_(s) { try { var o = JSON.parse(s); return (o && typeof o === 'object') ? o : { v: 1, d: {} }; } catch (e) { return { v: 1, d: {} }; } }

function acctValidAid_(a) { return /^[A-Za-z0-9-]{16,64}$/.test(String(a || '')); }

/** Tạo nhân vật mới. Trùng (cùng tên + mật khẩu) → { ok:false, error:'exists' }. Gửi lại đúng yêu cầu (cùng aid) → thành công, không báo trùng. */
function acctCreate_(req) {
  var name = acctName_(req.name), key = String(req.key || ''), aid = String(req.aid || '');
  if (!name) return { ok: false, error: 'bad_name' };
  if (!/^[0-9a-f]{64}$/.test(key) || !acctValidAid_(aid)) return { ok: false, error: 'bad_request' };
  var blob = acctBlob_(req.save); if (blob.error) return { ok: false, error: blob.error };
  if (acctLimited_(name)) return { ok: false, error: 'too_many' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = acctSheet_(), accKey = acctHex_(ACCT.SALT + key), hit = acctFind_(sh, AC.KEY, accKey);
    if (hit > 0) {
      var old = acctRead_(sh, hit);
      if (old[AC.AID - 1] === aid) {                       // client gửi lại vì mất phản hồi: coi như đã tạo
        var again = acctAddToken_(old[AC.TOKENS - 1]);
        acctPut_(sh, hit, AC.LOGIN, [acctNow_(), again.cell]);
        return { ok: true, aid: aid, name: old[AC.NAME - 1], token: again.token, rev: Number(old[AC.REV - 1]) || 1 };
      }
      acctFail_(name);                                      // đoán "tên + mật khẩu" qua màn tạo cũng bị đếm như đăng nhập sai
      return { ok: false, error: 'exists' };
    }
    if (acctFind_(sh, AC.AID, aid) > 0) return { ok: false, error: 'bad_request' };
    var tk = acctAddToken_(''), now = acctNow_(), parts = acctSplit_(blob.s);
    var rec = [aid, accKey, name, now, now, tk.cell, '1', clean_(req.sid, 64), now].concat(parts);
    acctAppend_(sh, rec);
    log_('acctCreate', aid.slice(0, 8));
    return { ok: true, aid: aid, name: name, token: tk.token, rev: 1 };
  } finally { lock.releaseLock(); }
}

/** Đăng nhập bằng (tên + khóa): đúng → cấp token cho máy này và trả cả bản lưu. Sai → 'bad_login' (không nói sai tên hay sai mật khẩu). */
function acctLogin_(req) {
  var name = acctName_(req.name), key = String(req.key || '');
  if (!name || !/^[0-9a-f]{64}$/.test(key)) return { ok: false, error: 'bad_request' };
  if (acctLimited_(name)) return { ok: false, error: 'too_many' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = acctSheet_(), row = acctFind_(sh, AC.KEY, acctHex_(ACCT.SALT + key));
    if (row < 0) { acctFail_(name); return { ok: false, error: 'bad_login' }; }
    var rec = acctRead_(sh, row);
    if (acctNorm_(rec[AC.NAME - 1]) !== acctNorm_(name)) { acctFail_(name); return { ok: false, error: 'bad_login' }; }   // khóa đúng nhưng khai tên khác
    var tk = acctAddToken_(rec[AC.TOKENS - 1]);
    acctPut_(sh, row, AC.LOGIN, [acctNow_(), tk.cell]);
    acctClearFail_(name);
    return { ok: true, aid: rec[AC.AID - 1], name: rec[AC.NAME - 1], token: tk.token, rev: Number(rec[AC.REV - 1]) || 1, save: acctParse_(acctJoin_(rec)) };
  } finally { lock.releaseLock(); }
}

/** Lấy tìm hàng + kiểm token. Trả { sh, row, rec } hoặc { error }. */
function acctAuth_(req) {
  var aid = String(req.aid || '');
  if (!acctValidAid_(aid)) return { error: 'bad_request' };
  var sh = acctSheet_(), row = acctFind_(sh, AC.AID, aid);
  if (row < 0) return { error: 'bad_token' };
  var rec = acctRead_(sh, row);
  if (!acctHasToken_(rec[AC.TOKENS - 1], req.token)) return { error: 'bad_token' };
  return { sh: sh, row: row, rec: rec };
}

/** Máy đã đăng nhập hỏi "có bản mới hơn không?": cùng rev → changed:false; khác → trả bản lưu mới. rev = -1 để buộc lấy. */
function acctLoad_(req) {
  var a = acctAuth_(req); if (a.error) return { ok: false, error: a.error };
  var cur = Number(a.rec[AC.REV - 1]) || 1;
  if (Number(req.rev) === cur) return { ok: true, changed: false, rev: cur };
  return { ok: true, changed: true, rev: cur, name: a.rec[AC.NAME - 1], save: acctParse_(acctJoin_(a.rec)) };
}

/** Lưu tiến trình. base = rev máy này đã biết; lệch → 'stale' (trừ khi force). Cùng sid với lần lưu cuối → ok (gửi lại). */
function acctSave_(req) {
  var blob = acctBlob_(req.save); if (blob.error) return { ok: false, error: blob.error };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var a = acctAuth_(req); if (a.error) return { ok: false, error: a.error };
    var rec = a.rec, cur = Number(rec[AC.REV - 1]) || 1, sid = clean_(req.sid, 64);
    if (!req.force && Number(req.base) !== cur) {
      if (sid && sid === rec[AC.SID - 1]) return { ok: true, rev: cur, dup: true };
      return { ok: false, error: 'stale', rev: cur };
    }
    if (!req.force && acctJoin_(rec) === blob.s) return { ok: true, rev: cur, same: true };   // không có gì mới
    var parts = acctSplit_(blob.s);
    acctPut_(a.sh, a.row, AC.REV, [String(cur + 1), sid, acctNow_()].concat(parts));   // rev, sid, capNhat, d1..d4 là các cột liền nhau
    return { ok: true, rev: cur + 1 };
  } finally { lock.releaseLock(); }
}

/** Đăng xuất một máy: bỏ token của máy đó (máy khác vẫn đăng nhập). */
function acctLogout_(req) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var a = acctAuth_(req); if (a.error) return { ok: true };       // token đã hết hạn: coi như đã đăng xuất
    var h = acctHex_(req.token), list = acctTokens_(a.rec[AC.TOKENS - 1]).filter(function (x) { return x && x.h !== h; });
    acctPut_(a.sh, a.row, AC.TOKENS, [JSON.stringify(list)]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}
