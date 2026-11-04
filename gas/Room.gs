/**
 * Đa người (Phiên 15a): một phòng chung "Diệu Giang Tự". Apps Script KHÔNG realtime nên client thăm dò (1,5–8 giây
 * tùy số người) và tự nội suy chuyển động. Trạng thái giữ trong CacheService (không ghi Sheet, tự hết hạn).
 *
 * Yêu cầu: client gửi { action:'sync', room, id, n, c, h, x, y, z, r, s, since, say }.
 *   id    = mã ngẫu nhiên của MỖI lần mở trang (client KHÔNG gửi userKey, để người khác không biết được).
 *   since = số thứ tự lời nhắn đã nhận; say = lời nhắn mới (tùy chọn).
 * Trả { ok, players:[{id,n,c,h,x,y,z,r,s}] (không gồm chính người gọi), chat:[{i,id,n,m}], seq, count, pollMs }.
 *
 * Quy tắc phải GIỐNG js/engines/room.js: tên ≤ 20, lời nhắn ≤ 80 và không link/email/số điện thoại,
 * tối đa 30 người, quá 12 giây không gửi thì bị coi là đã rời, mỗi người 1 lời nhắn / 2 giây.
 * Sau khi sửa file này: Deploy → Manage deployments → Edit → New version (URL /exec giữ nguyên).
 */
var ROOM = { KEY: 'dgt_room_main_v1', MAX_PLAYERS: 30, TTL_MS: 12000, CHAT_KEEP: 20, CHAT_GAP_MS: 2000, CHAT_MAX: 80,
  LIMIT: 200, MIN_POLL: 1500, MAX_POLL: 8000, PER_PLAYER: 350, CACHE_SEC: 600 };
var ROOM_STATES_ = ['idle', 'walk', 'sit', 'mo', 'beads', 'bow'];

function roomNum_(v, lo, hi, dflt) { v = Number(v); if (!isFinite(v)) return dflt; return Math.max(lo, Math.min(hi, v)); }
function roomR2_(v) { return Math.round(v * 100) / 100; }
function roomId_(s) { s = String(s == null ? '' : s); return /^[A-Za-z0-9._-]{8,64}$/.test(s) ? s : ''; }
function roomTok_(s, dflt) { s = String(s == null ? '' : s); return /^[a-z0-9]{1,12}$/.test(s) ? s : dflt; }

function roomName_(s) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
  if (/(https?:\/\/|www\.|@)/i.test(s)) s = '';
  s = s.slice(0, 20);
  return s || 'Khách';
}

function roomChat_(s) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length > ROOM.CHAT_MAX) s = s.slice(0, ROOM.CHAT_MAX);
  if (/(https?:\/\/|www\.|\.com\b|\.vn\b|@)/i.test(s)) return '';
  if (/\d[\d\s.\-]{7,}\d/.test(s)) return '';
  return s;
}

function roomPoll_(count) { return roomNum_(count * ROOM.PER_PLAYER, ROOM.MIN_POLL, ROOM.MAX_POLL, ROOM.MIN_POLL); }

function roomSync_(req) {
  var id = roomId_(req && req.id);
  if (!id) return { ok: false, error: 'bad_id' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return { ok: false, error: 'busy' };   // đang đông: client thử lại sau, không treo
  try {
    var cache = CacheService.getScriptCache(), now = Date.now(), st = null, raw = cache.get(ROOM.KEY);
    try { st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || typeof st !== 'object') st = {};
    if (!st.players || typeof st.players !== 'object') st.players = {};
    if (!Array.isArray(st.chat)) st.chat = [];
    st.seq = Number(st.seq) || 0;

    var ids = Object.keys(st.players), i;
    for (i = 0; i < ids.length; i++) if (!st.players[ids[i]] || now - Number(st.players[ids[i]].t) > ROOM.TTL_MS) delete st.players[ids[i]];

    var me = st.players[id];
    if (!me && Object.keys(st.players).length >= ROOM.MAX_PLAYERS) return { ok: false, error: 'room_full' };
    me = me || {};
    me.n = roomName_(req.n);
    me.c = roomTok_(req.c, 'nau'); me.h = roomTok_(req.h, 'troc');
    me.x = roomR2_(roomNum_(req.x, -ROOM.LIMIT, ROOM.LIMIT, 0)); me.z = roomR2_(roomNum_(req.z, -ROOM.LIMIT, ROOM.LIMIT, 0));
    me.y = roomR2_(roomNum_(req.y, -5, 20, 0)); me.r = roomR2_(roomNum_(req.r, -7, 7, 0));
    me.s = ROOM_STATES_.indexOf(req.s) >= 0 ? req.s : 'idle';
    me.t = now;
    st.players[id] = me;

    var say = roomChat_(req.say);
    if (say && (!me.sa || now - me.sa >= ROOM.CHAT_GAP_MS)) {
      st.seq++; st.chat.push({ i: st.seq, id: id, n: me.n, m: say }); me.sa = now;
      if (st.chat.length > ROOM.CHAT_KEEP) st.chat = st.chat.slice(-ROOM.CHAT_KEEP);
    }
    cache.put(ROOM.KEY, JSON.stringify(st), ROOM.CACHE_SEC);

    var since = Math.max(0, Math.floor(Number(req.since) || 0)), players = [], chat = [], pid = Object.keys(st.players);
    for (i = 0; i < pid.length; i++) {
      if (pid[i] === id) continue;
      var p = st.players[pid[i]];
      players.push({ id: pid[i], n: p.n, c: p.c, h: p.h, x: p.x, y: p.y, z: p.z, r: p.r, s: p.s });
    }
    for (i = 0; i < st.chat.length; i++) if (st.chat[i].i > since) chat.push(st.chat[i]);
    return { ok: true, players: players, chat: chat, seq: st.seq, count: pid.length, pollMs: roomPoll_(pid.length) };
  } finally { lock.releaseLock(); }
}
