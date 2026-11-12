/**
 * Diệu Giang Tự — BẢNG XẾP HẠNG (máy chủ). Dán cạnh Code.gs + Accounts.gs + Room.gs trong CÙNG dự án Apps Script.
 *
 * Hành động (POST text/plain như các hàm khác; thêm 4 dòng case vào route_ trong Code.gs):
 *   saveScore  { aid?, token?, userKey, n, sen, lv, xp, la, info? }  → lưu/cập nhật điểm của người chơi. Trả { ok, id }.
 *   rankPing   { aid?, token?, userKey }                              → "tôi đang online" (client gọi ~60 giây một lần). Trả { ok }.
 *   getRank    { aid?, token?, userKey?, limit? }                     → { ok, total, top:[{rank,id,n,lv,ten,sen,on,seen}], me }.
 *   getPlayer  { id }                                                 → { ok, player:{rank,id,n,lv,xp,sen,la,created,seen,on,info} }.
 *
 * Danh tính: có aid + token hợp lệ (tài khoản nhân vật, Accounts.gs) → dòng riêng theo tài khoản, tên lấy từ tài khoản.
 *            Không có → dùng userKey của máy (mỗi máy một dòng).
 * id công khai (`id`) = 12 ký tự băm từ danh tính; aid/token/userKey KHÔNG BAO GIỜ trả về cho người khác.
 * Điểm xếp hạng `sen` chỉ tăng (giữ giá trị lớn nhất đã gửi); lv/xp/la/info lấy theo lần gửi mới nhất.
 * Online = có rankPing/saveScore trong ~150 giây (giữ trong CacheService, không ghi Sheet). `seen` = lần cuối thấy (ghi Sheet, tối đa 10 phút một lần).
 * Sheet "Ranking" tự tạo khi cần: pid | name | lv | xp | sen | la | ngayTao | lanCuoi | info | pub
 * Phụ thuộc hàm có sẵn: roomId_, roomName_ (Room.gs); acctAuth_, acctName_, acctValidAid_, acctHex_, AC (Accounts.gs); textFormat_ (Storage.gs/Code.gs).
 * Sau khi sửa: Deploy → Manage deployments → Edit → New version (URL /exec giữ nguyên).
 */
var RANK = { SHEET: 'Ranking', TOP_DEFAULT: 50, TOP_MAX: 100, ONLINE_SEC: 150, SEEN_GAP_SEC: 600, INFO_KEYS: 12, INFO_MAX: 1500, ON_PREFIX: 'rk:on:', SEEN_PREFIX: 'rk:sn:' };
var RK = { PID: 1, NAME: 2, LV: 3, XP: 4, SEN: 5, LA: 6, CREATED: 7, SEEN: 8, INFO: 9, PUB: 10 };
var RANK_HEAD = ['pid', 'name', 'lv', 'xp', 'sen', 'la', 'ngayTao', 'lanCuoi', 'info', 'pub'];

function rankSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chưa chạy setup()');
  var ss = SpreadsheetApp.openById(id), sh = ss.getSheetByName(RANK.SHEET);
  if (!sh) { sh = ss.insertSheet(RANK.SHEET); sh.appendRow(RANK_HEAD); textFormat_(sh); }
  return sh;
}

function rankInt_(v, lo, hi) {
  v = Math.floor(Number(v));
  if (!isFinite(v)) v = lo;
  return Math.max(lo, Math.min(hi, v));
}

function rankPub_(pid) { return acctHex_('lgt-rank-v1|' + pid).slice(0, 12); }

/** Làm sạch bảng chi tiết do client gửi: tối đa 12 khóa [a-z0-9]{1,12}, giá trị là số hoặc chữ ≤ 40 ký tự (không link/@). */
function rankInfo_(o) {
  var out = {}, n = 0;
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  var keys = Object.keys(o);
  for (var i = 0; i < keys.length && n < RANK.INFO_KEYS; i++) {
    var k = keys[i], v = o[k];
    if (!/^[a-z0-9]{1,12}$/.test(k)) continue;
    if (typeof v === 'boolean') v = v ? 1 : 0;
    if (typeof v === 'number') {
      if (!isFinite(v)) continue;
      v = Math.max(-1000000000, Math.min(1000000000, Math.round(v * 100) / 100));
    } else if (typeof v === 'string') {
      v = v.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (/(https?:\/\/|www\.|@)/i.test(v)) continue;
    } else { continue; }
    out[k] = v; n++;
  }
  return out;
}

function rankInfoParse_(s) {
  try { var o = JSON.parse(s); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch (e) { return {}; }
}

/** Xác định người gọi → { pid, name } hoặc null. Tài khoản (aid+token đúng) ưu tiên; không thì userKey. */
function rankWho_(req) {
  var aid = String(req && req.aid || '');
  if (acctValidAid_(aid) && req.token) {
    var a = acctAuth_({ aid: aid, token: req.token });
    if (!a.error) return { pid: 'a:' + aid, name: acctName_(a.rec[AC.NAME - 1]) || '' };
  }
  var uk = roomId_(req && req.userKey);
  if (uk) return { pid: 'u:' + uk, name: '' };
  return null;
}

function rankFind_(sh, pid) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var vals = sh.getRange(2, RK.PID, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === pid) return i + 2;
  return -1;
}

function rankAll_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var v = sh.getRange(2, 1, last - 1, RK.PUB).getValues(), out = [];
  for (var i = 0; i < v.length; i++) {
    var r = v[i];
    if (!r[0] || !r[RK.PUB - 1]) continue;
    out.push({ pid: String(r[0]), name: String(r[1] || 'Khách'), lv: Number(r[2]) || 1, xp: Number(r[3]) || 0, sen: Number(r[4]) || 0,
      la: Number(r[5]) || 0, created: Number(r[6]) || 0, seen: Number(r[7]) || 0, info: String(r[8] || ''), pub: String(r[RK.PUB - 1]) });
  }
  return out;
}

function rankSort_(list) {
  list.sort(function (a, b) { return (b.sen - a.sen) || (b.lv - a.lv) || (b.xp - a.xp) || (a.created - b.created); });
  return list;
}

function rankRow_(p, rank, on) {
  var info = rankInfoParse_(p.info);
  return { rank: rank, id: p.pub, n: p.name, lv: p.lv, ten: String(info.ten || ''), sen: p.sen, on: !!on, seen: p.seen };
}

/** Lưu điểm + chi tiết. Gửi bằng tài khoản thì tên lấy từ tài khoản (không tin tên client gửi). */
function rankSave_(req) {
  var who = rankWho_(req);
  if (!who) return { ok: false, error: 'bad_request' };
  var sen = rankInt_(req.sen, 0, 1000000000), lv = rankInt_(req.lv, 1, 999), xp = rankInt_(req.xp, 0, 1000000000), la = rankInt_(req.la, 0, 1000000000);
  var name = who.name || roomName_(req.n), infoS = JSON.stringify(rankInfo_(req.info));
  if (infoS.length > RANK.INFO_MAX) return { ok: false, error: 'too_big' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: 'busy' };
  try {
    var sh = rankSheet_(), row = rankFind_(sh, who.pid), now = Date.now(), pub = rankPub_(who.pid);
    CacheService.getScriptCache().put(RANK.ON_PREFIX + pub, '1', RANK.ONLINE_SEC);
    if (row < 0) {
      row = sh.getLastRow() + 1;
      if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);
      sh.getRange(row, 1, 1, RK.PUB).setValues([[who.pid, name, lv, xp, sen, la, now, now, infoS, pub]]);
    } else {
      var old = sh.getRange(row, RK.SEN, 1, 1).getValue();
      sen = Math.max(sen, Number(old) || 0);
      sh.getRange(row, RK.NAME, 1, RK.PUB - RK.NAME + 1).setValues([[name, lv, xp, sen, la, Number(sh.getRange(row, RK.CREATED).getValue()) || now, now, infoS, pub]]);
    }
    return { ok: true, id: pub };
  } finally { lock.releaseLock(); }
}

/** "Tôi đang online": chỉ ghi CacheService; ghi Sheet (lanCuoi) tối đa 10 phút một lần. */
function rankPing_(req) {
  var who = rankWho_(req);
  if (!who) return { ok: false, error: 'bad_request' };
  var pub = rankPub_(who.pid), cache = CacheService.getScriptCache();
  cache.put(RANK.ON_PREFIX + pub, '1', RANK.ONLINE_SEC);
  if (!cache.get(RANK.SEEN_PREFIX + pub)) {
    cache.put(RANK.SEEN_PREFIX + pub, '1', RANK.SEEN_GAP_SEC);
    var lock = LockService.getScriptLock();
    if (lock.tryLock(3000)) {
      try {
        var sh = rankSheet_(), row = rankFind_(sh, who.pid);
        if (row > 0) sh.getRange(row, RK.SEEN).setValue(Date.now());
      } finally { lock.releaseLock(); }
    }
  }
  return { ok: true };
}

/** Danh sách xếp hạng (cao → thấp theo hạt sen, hòa thì theo cấp, điểm, ai vào trước). */
function rankList_(req) {
  var limit = rankInt_(req && req.limit ? req.limit : RANK.TOP_DEFAULT, 1, RANK.TOP_MAX);
  var all = rankSort_(rankAll_(rankSheet_()));
  var who = (req && (req.aid || req.userKey)) ? rankWho_(req) : null, mine = -1, i;
  if (who) for (i = 0; i < all.length; i++) if (all[i].pid === who.pid) { mine = i; break; }
  var page = all.slice(0, limit), keys = [], top = [];
  for (i = 0; i < page.length; i++) keys.push(RANK.ON_PREFIX + page[i].pub);
  var on = keys.length ? CacheService.getScriptCache().getAll(keys) : {};
  for (i = 0; i < page.length; i++) top.push(rankRow_(page[i], i + 1, on[keys[i]]));
  return { ok: true, total: all.length, top: top, me: mine >= 0 ? rankRow_(all[mine], mine + 1, true) : null };
}

/** Thông tin chi tiết một người (theo id công khai). */
function rankPlayer_(req) {
  var id = String(req && req.id || '');
  if (!/^[0-9a-f]{12}$/.test(id)) return { ok: false, error: 'bad_request' };
  var all = rankSort_(rankAll_(rankSheet_()));
  for (var i = 0; i < all.length; i++) {
    if (all[i].pub !== id) continue;
    var p = all[i], on = !!CacheService.getScriptCache().get(RANK.ON_PREFIX + id);
    return { ok: true, player: { rank: i + 1, id: id, n: p.name, lv: p.lv, xp: p.xp, sen: p.sen, la: p.la, created: p.created, seen: p.seen, on: on, info: rankInfoParse_(p.info) } };
  }
  return { ok: false, error: 'not_found' };
}
