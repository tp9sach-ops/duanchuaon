/**
 * Diệu Giang Tự — GỬI QUÀ giữa người chơi (máy chủ). Phiên 160. Dán cạnh Code.gs + Rank.gs + Accounts.gs + Room.gs trong CÙNG dự án Apps Script.
 *
 * Hành động (POST text/plain như các hàm khác; thêm 3 dòng case vào route_ trong Code.gs):
 *   giftSend  { aid?, token?, userKey, to, kind, qty, note? }  → gửi quà tới người có id công khai `to` (12 ký tự, lấy từ bảng xếp hạng).
 *                                                                kind = 'sen' (hạt sen, ≤ 1000 mỗi lần) | 'la' (lá bồ đề, ≤ 100 mỗi lần). Trả { ok, id }.
 *   giftInbox { aid?, token?, userKey }                         → hộp quà của mình (quà chưa nhận). Trả { ok, gifts:[{id, from, kind, qty, note, ngay}] }.
 *   giftClaim { aid?, token?, userKey, ids:[…] }                → nhận quà (tối đa 20 cái một lần). Mỗi quà chỉ nhận được MỘT lần. Trả { ok, got:[{id, from, kind, qty}] }.
 *
 * Mã lỗi: bad_request, not_ranked (người gửi chưa có trong bảng xếp hạng), not_found (người nhận không có), self (tự gửi cho mình),
 *         limit (gửi quá 20 lần / 6 giờ), full (hộp quà người nhận đã đầy 50 quà), busy, server_error.
 * Danh tính người gửi/nhận: giống Rank.gs (rankWho_ → id công khai rankPub_). aid/token/userKey KHÔNG BAO GIỜ trả về cho người khác.
 * Sheet "Gifts" tự tạo khi cần: id | toPub | fromPub | fromName | kind | qty | note | ngay | trangThai (cho | nhan)
 * Phụ thuộc hàm có sẵn: rankWho_, rankPub_, rankSheet_, rankFind_, rankAll_, rankInt_, RK (Rank.gs); textFormat_ (Storage.gs/Code.gs).
 * Lưu ý: máy chủ chỉ chuyển quà; việc trừ/cộng hạt sen, lá bồ đề trong game do máy người chơi làm (giống phần còn lại của game: ví nằm ở máy).
 * Sau khi sửa: Deploy → Manage deployments → Edit → New version (URL /exec giữ nguyên).
 */
var GIFT = { SHEET: 'Gifts', CAP: { sen: 1000, la: 100 }, NOTE_MAX: 60, INBOX_MAX: 50, CLAIM_MAX: 20, PENDING_MAX: 50, SEND_MAX: 20, SEND_WINDOW_SEC: 21600, SEND_PREFIX: 'gf:n:' };
var GF = { ID: 1, TO: 2, FROM: 3, FNAME: 4, KIND: 5, QTY: 6, NOTE: 7, DAY: 8, ST: 9 };
var GIFT_HEAD = ['id', 'toPub', 'fromPub', 'fromName', 'kind', 'qty', 'note', 'ngay', 'trangThai'];

function giftSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chưa chạy setup()');
  var ss = SpreadsheetApp.openById(id), sh = ss.getSheetByName(GIFT.SHEET);
  if (!sh) { sh = ss.insertSheet(GIFT.SHEET); sh.appendRow(GIFT_HEAD); textFormat_(sh); }
  return sh;
}

/** Lời nhắn: bỏ ký tự điều khiển, < >, link/@; không để bắt đầu bằng = + - @ (tránh công thức trong Sheet); ≤ 60 ký tự. */
function giftNote_(s) {
  var t = String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, GIFT.NOTE_MAX);
  if (/(https?:\/\/|www\.|@)/i.test(t)) return '';
  return t.replace(/^[=+\-@]+/, '').trim();
}

/** Người gọi → { pid, pub, name } hoặc { error }. Phải đã có dòng trong bảng xếp hạng (chống tạo hàng loạt khóa ảo để gửi bậy). */
function giftSelf_(req) {
  var who = rankWho_(req);
  if (!who) return { error: 'bad_request' };
  var rsh = rankSheet_(), row = rankFind_(rsh, who.pid);
  if (row < 0) return { error: 'not_ranked' };
  var name = who.name || String(rsh.getRange(row, RK.NAME).getValue() || 'Khách');
  return { pid: who.pid, pub: rankPub_(who.pid), name: name };
}

function giftRows_(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, GF.ST).getValues();
}

function giftSend_(req) {
  var me = giftSelf_(req);
  if (me.error) return { ok: false, error: me.error };
  var to = String(req && req.to || ''), kind = String(req && req.kind || '');
  if (!/^[0-9a-f]{12}$/.test(to) || !GIFT.CAP[kind]) return { ok: false, error: 'bad_request' };
  var qty = rankInt_(req.qty, 0, GIFT.CAP[kind]);
  if (qty < 1) return { ok: false, error: 'bad_request' };
  if (to === me.pub) return { ok: false, error: 'self' };
  var note = giftNote_(req.note);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: 'busy' };
  try {
    var all = rankAll_(rankSheet_()), found = false, i;
    for (i = 0; i < all.length; i++) if (all[i].pub === to) { found = true; break; }
    if (!found) return { ok: false, error: 'not_found' };
    var cache = CacheService.getScriptCache(), key = GIFT.SEND_PREFIX + me.pub, n = Number(cache.get(key)) || 0;
    if (n >= GIFT.SEND_MAX) return { ok: false, error: 'limit' };
    var sh = giftSheet_(), rows = giftRows_(sh), pending = 0;
    for (i = 0; i < rows.length; i++) if (String(rows[i][GF.TO - 1]) === to && String(rows[i][GF.ST - 1]) === 'cho') pending++;
    if (pending >= GIFT.PENDING_MAX) return { ok: false, error: 'full' };
    var id = Utilities.getUuid().replace(/-/g, '').slice(0, 16), row = sh.getLastRow() + 1;
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);
    sh.getRange(row, 1, 1, GF.ST).setValues([[id, to, me.pub, me.name, kind, qty, note, Date.now(), 'cho']]);
    cache.put(key, String(n + 1), GIFT.SEND_WINDOW_SEC);
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}

function giftInbox_(req) {
  var me = giftSelf_(req);
  if (me.error === 'bad_request') return { ok: false, error: 'bad_request' };
  if (me.error) return { ok: true, gifts: [] };   // chưa có trong bảng xếp hạng thì chắc chắn chưa ai gửi được cho mình
  var rows = giftRows_(giftSheet_()), out = [];
  for (var i = 0; i < rows.length && out.length < GIFT.INBOX_MAX; i++) {
    var r = rows[i];
    if (String(r[GF.TO - 1]) !== me.pub || String(r[GF.ST - 1]) !== 'cho') continue;
    out.push({ id: String(r[GF.ID - 1]), from: String(r[GF.FNAME - 1] || 'Một người bạn'), kind: String(r[GF.KIND - 1]), qty: Number(r[GF.QTY - 1]) || 0, note: String(r[GF.NOTE - 1] || ''), ngay: Number(r[GF.DAY - 1]) || 0 });
  }
  return { ok: true, gifts: out };
}

function giftClaim_(req) {
  var me = giftSelf_(req);
  if (me.error) return { ok: false, error: me.error };
  var ids = (req && Array.isArray(req.ids)) ? req.ids.slice(0, GIFT.CLAIM_MAX) : [], want = {}, i;
  for (i = 0; i < ids.length; i++) if (/^[0-9a-f]{16}$/.test(String(ids[i]))) want[String(ids[i])] = true;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, error: 'busy' };
  try {
    var sh = giftSheet_(), rows = giftRows_(sh), got = [];
    for (i = 0; i < rows.length; i++) {
      var r = rows[i], id = String(r[GF.ID - 1]);
      if (!want[id] || String(r[GF.TO - 1]) !== me.pub || String(r[GF.ST - 1]) !== 'cho') continue;
      sh.getRange(i + 2, GF.ST).setValue('nhan');
      got.push({ id: id, from: String(r[GF.FNAME - 1] || 'Một người bạn'), kind: String(r[GF.KIND - 1]), qty: Number(r[GF.QTY - 1]) || 0 });
    }
    return { ok: true, got: got };
  } finally { lock.releaseLock(); }
}
