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
  // Thùng công đức (Donations.gs, Phiên 80): trangThai cho|ok|tuchoi do người duyệt đổi; daNhan=TRUE khi game đã cộng hạt sen
  Donations: ['id', 'userKey', 'maSo', 'ten', 'soTien', 'kenh', 'loiNhan', 'ngayGui', 'trangThai', 'soTienXN', 'sen', 'daNhan', 'ngayDuyet'],
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
    if (name === 'Donations') donFormat_(sh);
  });
  Logger.log('Spreadsheet: ' + ss.getUrl());
}

function doGet() {
  return json_({ ok: true, name: 'Diệu Giang Tự API', time: new Date().toISOString() });
}

function doPost(e) {
  // Gửi bằng <form> (Phiên 55, đường dự phòng khi fetch bị chặn CORS): có trường d (JSON lệnh) + rid; trả trang nhỏ gọi postMessage về trang game.
  var p = (e && e.parameter) || {}, frame = p.d != null && p.rid != null, out;
  try {
    out = route_(JSON.parse(frame ? String(p.d) : ((e && e.postData && e.postData.contents) || '{}')));
  } catch (err) {
    out = json_({ ok: false, error: 'server_error', detail: String(err && err.message || err) });
  }
  return frame ? frame_(JSON.parse(out.getContent()), p.rid, p.o) : out;
}

function route_(req) {
  switch (req.action) {
    case 'ping':         return json_({ ok: true, pong: true });
    case 'saveProfile':  return json_(saveProfile_(req));
    case 'getProfile':   return json_(getProfile_(req));
    case 'deleteProfile': return json_(deleteProfile_(req));
    case 'analyzeHand':  return json_(analyzeImage_(req, 'hand'));   // Vision.gs
    case 'analyzeFace':  return json_(analyzeImage_(req, 'face'));
    case 'addPrayer':    return json_(addPrayer_(req));      // Prayers.gs
    case 'listPrayers':  return json_(listPrayers_());
    case 'donClaim':     return json_(donClaim_(req));       // Donations.gs (thùng công đức)
    case 'donCheck':     return json_(donCheck_(req));
    case 'donAck':       return json_(donAck_(req));
    case 'sync':         return json_(roomSync_(req));       // Room.gs (đa người)
    case 'yq':           return json_(yqSync_(req));         // Yq.gs (yêu quái đánh chung)
    case 'thr':          return json_(thrSync_(req));        // Throw.gs (ném người chơi khác)
    case 'acctCreate':   return json_(acctCreate_(req));     // Accounts.gs (tài khoản nhân vật)
    case 'acctLogin':    return json_(acctLogin_(req));
    case 'acctLoad':     return json_(acctLoad_(req));
    case 'acctSave':     return json_(acctSave_(req));
    case 'acctLogout':   return json_(acctLogout_(req));
    default:             return json_({ ok: false, error: 'unknown_action' });
  }
}

/** Trang trả về cho khung ẩn: gửi kết quả cho trang game bằng postMessage. targetOrigin = origin trang game gửi lên (hợp lệ) hoặc '*'. */
function frame_(res, rid, origin) {
  var msg = JSON.stringify({ lgt: String(rid).replace(/[^A-Za-z0-9-]/g, '').slice(0, 64), res: res })
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  var o = /^https?:\/\/[A-Za-z0-9.\-]+(:\d+)?$/.test(String(origin || '')) ? String(origin) : '*';
  var html = '<!doctype html><meta charset="utf-8"><script>(function(){var m=' + msg + ',o=' + JSON.stringify(o) + ';' +
    'try{window.parent.parent.postMessage(m,o)}catch(e){}' +
    'try{if(window.top!==window.parent.parent)window.top.postMessage(m,o)}catch(e){}})();</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
