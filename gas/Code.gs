/**
 * Linh Quang — backend Google Apps Script (Web App trả JSON).
 * Giai đoạn 1: khung API + tạo Sheet + lưu/đọc hồ sơ. Các hàm khác để TODO theo giai đoạn.
 *
 * TRIỂN KHAI: Extensions → Apps Script → dán file này → Deploy → New deployment → Web app
 *   Execute as: Me  |  Who has access: Anyone  → copy URL (…/exec) vào js/config.js (apiUrl).
 * Mỗi lần sửa code phải Deploy → Manage deployments → Edit → New version.
 *
 * Client gọi POST Content-Type text/plain để tránh preflight CORS.
 */

var SHEETS = {
  Profiles: ['profileId', 'userKey', 'hoTen', 'ngaySinhDL', 'gioSinh', 'noiSinh', 'gioiTinh', 'ngayTao'],
  Readings: ['readingId', 'profileId', 'loai', 'ketQuaJSON', 'diem', 'ngayTao'],
  Incense:  ['userKey', 'soNhangThap', 'chuoiNgay', 'lanCuoi', 'loiNguyen'],
  Prayers:  ['id', 'userKey', 'noiDung', 'congKhai', 'ngay'],
  Scriptures: ['id', 'ten', 'nguon', 'urlAudio', 'thoiLuong', 'loai'],
  Logs:     ['thoiGian', 'hanhDong', 'ghiChu']
};

/** Chạy một lần bằng tay để tạo Spreadsheet và các sheet. Lưu id vào Script Properties. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Linh Quang — dữ liệu');
  props.setProperty('SHEET_ID', ss.getId());
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(SHEETS[name]);
  });
  Logger.log('Spreadsheet: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, name: 'Linh Quang API', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (req.action) {
      case 'ping':         return json_({ ok: true, pong: true });
      case 'saveProfile':  return json_(saveProfile_(req));
      case 'getProfile':   return json_(getProfile_(req));
      // TODO Giai đoạn 7: case 'analyzeHand' / 'analyzeFace' → Vision.gs (khóa API ở Script Properties)
      // TODO Giai đoạn 8: case 'logIncense', 'addPrayer', 'listPrayers'
      default:             return json_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chưa chạy setup()');
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

function clean_(v, max) { return String(v == null ? '' : v).slice(0, max || 200); }

function saveProfile_(req) {
  var userKey = clean_(req.userKey, 80), p = req.profile || {};
  if (!userKey) return { ok: false, error: 'missing_userKey' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);                       // chống ghi đồng thời
  try {
    var sh = sheet_('Profiles'), rows = sh.getDataRange().getValues(), rowIdx = -1;
    for (var i = 1; i < rows.length; i++) if (rows[i][1] === userKey) { rowIdx = i + 1; break; }
    var rec = [rowIdx > 0 ? rows[rowIdx - 1][0] : Utilities.getUuid(), userKey, clean_(p.hoTen), clean_(p.ngaySinhDL, 20),
      clean_(p.gioSinh, 20), clean_(p.noiSinh), clean_(p.gioiTinh, 10), rowIdx > 0 ? rows[rowIdx - 1][7] : new Date()];
    if (rowIdx > 0) sh.getRange(rowIdx, 1, 1, rec.length).setValues([rec]); else sh.appendRow(rec);
    return { ok: true, profileId: rec[0] };
  } finally { lock.releaseLock(); }
}

function getProfile_(req) {
  var userKey = clean_(req.userKey, 80), rows = sheet_('Profiles').getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (rows[i][1] === userKey) {
    return { ok: true, profile: { profileId: rows[i][0], hoTen: rows[i][2], ngaySinhDL: rows[i][3], gioSinh: rows[i][4], noiSinh: rows[i][5], gioiTinh: rows[i][6] } };
  }
  return { ok: true, profile: null };
}
