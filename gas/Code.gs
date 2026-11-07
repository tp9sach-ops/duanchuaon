/**
 * Diệu Giang Tự — backend Google Apps Script (Web App trả JSON).
 * Giai đoạn 3: lưu/đọc/xóa hồ sơ (Storage.gs). Phiên 53: tài khoản nhân vật (Accounts.gs). Các hàm khác để TODO theo giai đoạn.
 *
 * TRIỂN KHAI: Extensions → Apps Script → dán file này → Deploy → New deployment → Web app
 *   Execute as: Me  |  Who has access: Anyone  → copy URL (…/exec) vào js/config.js (apiUrl).
 * Mỗi lần sửa code phải Deploy → Manage deployments → Edit → New version.
 *
 * Client gọi POST Content-Type text/plain để tránh preflight CORS.
 */

var SHEETS = {
  Profiles: ['profileId', 'userKey', 'hoTen', 'ngaySinhDL', 'gioSinh', 'noiSinh', 'gioiTinh', 'ngayTao', 'loaiLich', 'ngaySinhNhap'],
  Readings: ['readingId', 'profileId', 'loai', 'ketQuaJSON', 'diem', 'ngayTao'],
  Incense:  ['userKey', 'soNhangThap', 'chuoiNgay', 'lanCuoi', 'loiNguyen'],
  Prayers:  ['id', 'userKey', 'noiDung', 'congKhai', 'ngay'],
  Scriptures: ['id', 'ten', 'nguon', 'urlAudio', 'thoiLuong', 'loai'],
  Logs:     ['thoiGian', 'hanhDong', 'ghiChu'],
  // Tài khoản nhân vật + bản lưu dữ liệu game (Accounts.gs, Phiên 53). Cột d1..d4 = bản lưu chia 4 ô.
  Accounts: ['aid', 'accKey', 'name', 'ngayTao', 'lanDangNhap', 'tokens', 'rev', 'sid', 'capNhat', 'd1', 'd2', 'd3', 'd4']
};

/** Chạy một lần bằng tay để tạo Spreadsheet và các sheet. Lưu id vào Script Properties. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Diệu Giang Tự — dữ liệu');
  props.setProperty('SHEET_ID', ss.getId());
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(SHEETS[name]);
    textFormat_(sh);
  });
  Logger.log('Spreadsheet: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, name: 'Diệu Giang Tự API', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (req.action) {
      case 'ping':         return json_({ ok: true, pong: true });
      case 'saveProfile':  return json_(saveProfile_(req));
      case 'getProfile':   return json_(getProfile_(req));
      case 'deleteProfile': return json_(deleteProfile_(req));
      case 'analyzeHand':  return json_(analyzeImage_(req, 'hand'));   // Vision.gs
      case 'analyzeFace':  return json_(analyzeImage_(req, 'face'));
      case 'addPrayer':    return json_(addPrayer_(req));      // Prayers.gs
      case 'listPrayers':  return json_(listPrayers_());
      case 'sync':         return json_(roomSync_(req));       // Room.gs (đa người)
      case 'acctCreate':   return json_(acctCreate_(req));     // Accounts.gs (tài khoản nhân vật)
      case 'acctLogin':    return json_(acctLogin_(req));
      case 'acctLoad':     return json_(acctLoad_(req));
      case 'acctSave':     return json_(acctSave_(req));
      case 'acctLogout':   return json_(acctLogout_(req));
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
