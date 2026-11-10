/**
 * Khiêng rồi ném người chơi khác qua mạng (Phiên 72, sửa Phiên 91). Luật GIỐNG js/world/strength.js (canGrab + throwCheck, ptg chốt 08/11):
 *   cấp VÀ sức mạnh của người bị khiêng đều nhỏ hơn người khiêng; người khiêng phải nhấc nổi 55 kg; không khiêng/ném trong khuôn viên chùa;
 *   không khiêng người đang thiền; hồi chiêu 10 giây cho mỗi cặp. Người bị ném rơi an toàn (chỉ bị dời tới điểm rơi), người ném mất 1 hạt sen (client trừ).
 * PHIÊN 91 — KHIÊNG TRƯỚC, NÉM SAU (ptg: "cho phép khiêng người chơi trong 2 giây và ném đi"):
 *   1) KHIÊNG:  { ty = id người kia, g: 1 }  → máy chủ kiểm luật + cự ly (≤ 6 m) + hồi chiêu, rồi đánh dấu người kia "đang bị khiêng" (tối đa HOLD_MS + SLACK_MS).
 *      Trả { grabbed:true, holdMs }. Người bị khiêng nhận { held:{ f, n, ms } } ở lượt thăm dò kế tiếp để biết mà đứng yên trên vai.
 *   2) NÉM:     { ty, lx, lz }  → chỉ ném được khi MÌNH đang khiêng đúng người đó (còn hạn). Máy khách tự ném sau 2 giây.
 *   3) THẢ:     { ty, rl: 1 }   → thả xuống không ném (không mất hạt sen).
 * Mỗi máy gọi { action:'thr', id, n, lv, str, x, z, med, ty?, g?, rl?, lx?, lz? } mỗi 1–2,5 giây để (1) báo sức mạnh/vị trí của mình, (2) nhận "hộp thư bị ném" + trạng thái bị khiêng.
 * Trả { ok, grabbed?, thrown?, released?, reason?, wait?, held?, inbox:[{f,n,x,z}] } — inbox = các cú ném vào MÌNH chưa nhận (mỗi cú chỉ giao một lần).
 * Lý do từ chối: invalid | level | strength | weight | temple | meditating | cooldown | far | range | held | busy | nothold.
 */
var THR = { KEY: 'dgt_thr_v1', TTL_MS: 15000, CD_MS: 10000, HOLD_MS: 2000, SLACK_MS: 2500, PLAYER_KG: 55, GRAB_DIST: 6, CACHE_SEC: 600, MAX: 80, INBOX_KEEP: 5, XMAX: 78, ZMIN: -78, GATEZ: 34 };

function thrCarryLimit_(str) { return Math.round((8 + Math.max(0, Math.min(1e4, str)) * 1.6) * 10) / 10; }
function thrRange_(str) {   // = throwRange(str, PLAYER_KG) ở strength.js
  var lim = thrCarryLimit_(str); if (THR.PLAYER_KG > lim) return 0;
  return Math.round(Math.max(2, Math.min(40, 3 + 22 * (1 - THR.PLAYER_KG / lim) + Math.max(0, Math.min(1e4, str)) * 0.1)) * 10) / 10;
}
function thrInTemple_(x, z) { return Math.abs(x) <= THR.XMAX && z >= THR.ZMIN && z <= THR.GATEZ + 2.4; }
/** Người p có đang bị khiêng (còn hạn) không? p.cb = { f: id người khiêng, n: tên, u: hạn (ms) }. */
function thrHeld_(p, now) { return !!(p && p.cb && now <= Number(p.cb.u)); }

function thrSync_(req) {
  var id = roomId_(req && req.id);
  if (!id) return { ok: false, error: 'bad_id' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return { ok: false, error: 'busy' };
  try {
    var cache = CacheService.getScriptCache(), now = Date.now(), st = null, raw = cache.get(THR.KEY);
    try { st = raw ? JSON.parse(raw) : null; } catch (e) { st = null; }
    if (!st || typeof st !== 'object') st = {};
    if (!st.p || typeof st.p !== 'object') st.p = {};
    if (!st.inbox || typeof st.inbox !== 'object') st.inbox = {};
    if (!st.cd || typeof st.cd !== 'object') st.cd = {};
    var k, ids = Object.keys(st.p);
    for (k = 0; k < ids.length; k++) if (now - Number(st.p[ids[k]].t) > THR.TTL_MS) { delete st.p[ids[k]]; delete st.inbox[ids[k]]; }
    ids = Object.keys(st.cd); for (k = 0; k < ids.length; k++) if (now - Number(st.cd[ids[k]]) > THR.CD_MS) delete st.cd[ids[k]];
    if (!st.p[id] && Object.keys(st.p).length >= THR.MAX) return { ok: false, error: 'full' };

    var old = st.p[id];
    var me = {
      n: roomName_(req.n), lv: Math.floor(roomNum_(req.lv, 1, 99, 1)), str: Math.floor(roomNum_(req.str, 0, 10000, 0)),
      x: roomNum_(req.x, -ROOM.LIMIT, ROOM.LIMIT, 0), z: roomNum_(req.z, -ROOM.LIMIT, ROOM.LIMIT, 0), med: req.med ? 1 : 0, t: now };
    if (thrHeld_(old, now)) me.cb = old.cb;   // giữ dấu "đang bị khiêng" qua các lượt báo vị trí của chính người đó
    st.p[id] = me;

    var out = { ok: true, inbox: [] }, tid = req.ty ? roomId_(req.ty) : '';
    if (tid) {
      var tg = st.p[tid], lx = roomNum_(req.lx, -ROOM.LIMIT, ROOM.LIMIT, NaN), lz = roomNum_(req.lz, -ROOM.LIMIT, ROOM.LIMIT, NaN), why = '', pk = id + '>' + tid;
      var mode = req.rl ? 'rel' : (req.g ? 'grab' : 'throw');
      if (!tg || tid === id) why = 'invalid';
      else if (mode === 'rel') { if (tg.cb && tg.cb.f === id) delete tg.cb; out.released = true; }
      else {
        if (mode === 'grab') { if (thrHeld_(me, now)) why = 'busy'; else if (thrHeld_(tg, now)) why = 'held'; }
        else if (!(thrHeld_(tg, now) && tg.cb.f === id)) why = 'nothold';
        if (!why) {   // luật chung: cấp, sức mạnh, nhấc nổi 55 kg, chùa, đang thiền
          if (!(tg.lv < me.lv)) why = 'level';
          else if (!(tg.str < me.str)) why = 'strength';
          else if (THR.PLAYER_KG > thrCarryLimit_(me.str)) why = 'weight';
          else if (thrInTemple_(me.x, me.z) || thrInTemple_(tg.x, tg.z)) why = 'temple';
          else if (mode === 'grab' && tg.med) why = 'meditating';
        }
        if (!why && mode === 'grab') {   // chỉ lúc KHIÊNG mới kiểm hồi chiêu + cự ly (lúc ném người kia đã nằm trên vai, vị trí họ báo lên có thể lệch)
          if (st.cd[pk] && now - st.cd[pk] < THR.CD_MS) { why = 'cooldown'; out.wait = Math.ceil((THR.CD_MS - (now - st.cd[pk])) / 1000); }
          else if (Math.hypot(tg.x - me.x, tg.z - me.z) > THR.GRAB_DIST) why = 'far';
        }
        if (!why && mode === 'throw') {
          if (!isFinite(lx) || !isFinite(lz) || Math.hypot(lx - me.x, lz - me.z) > thrRange_(me.str) + 1.5) why = 'range';
          else if (thrInTemple_(lx, lz)) why = 'temple';
        }
        if (!why && mode === 'grab') {
          st.cd[pk] = now; tg.cb = { f: id, n: me.n, u: now + THR.HOLD_MS + THR.SLACK_MS }; out.grabbed = true; out.holdMs = THR.HOLD_MS;
        } else if (!why) {
          delete tg.cb; var box = st.inbox[tid] || []; box.push({ f: id, n: me.n, x: Math.round(lx * 10) / 10, z: Math.round(lz * 10) / 10 });
          st.inbox[tid] = box.slice(-THR.INBOX_KEEP); tg.x = lx; tg.z = lz; out.thrown = true;
        }
      }
      if (why) { out[mode === 'grab' ? 'grabbed' : 'thrown'] = false; out.reason = why; }   // mọi lý do từ chối (kể cả 'invalid') đều được báo
    }
    out.inbox = st.inbox[id] || []; delete st.inbox[id];
    if (thrHeld_(me, now)) out.held = { f: me.cb.f, n: me.cb.n, ms: Math.max(0, Math.round(me.cb.u - now)) };   // MÌNH đang bị khiêng: báo để máy mình đứng yên trên vai người đó
    cache.put(THR.KEY, JSON.stringify(st), THR.CACHE_SEC);
    return out;
  } finally { lock.releaseLock(); }
}
