// Đường truyền Firebase Realtime Database cho đa người: đẩy tức thời qua WebSocket thay cho thăm dò Apps Script.
// Trả về đối tượng có call(req) GIỐNG callApi('sync'), nên roomClient dùng nguyên, không cần biết đang chạy trên đường nào.
// KHÔNG import three.js/DOM: SDK Firebase được đưa vào qua loadSdk() nên kiểm thử được bằng Node với Firebase giả.
import { ROOM_CFG, cleanPlayer, chatOk, validId } from '../engines/room.js';

export const FIREBASE_SDK_VERSION = '11.0.2';
const STALE_MS = 15000;       // quá hạn này không nhận được tin gì từ một người thì coi như họ đã rời
const SEND_MIN_MS = 250;      // gửi vị trí tối đa 4 lần/giây
const KEEPALIVE_MS = 5000;    // đứng yên: cứ 5 giây báo "còn đây" một lần
const SIG_GAP_MS = 120;         // Phiên 137: gói tin giao lưu võ thuật (bắt đầu bằng "#dg") có nhịp riêng, nhanh hơn lời nhắn thường (ROOM_CFG.chatGapMs)
const CHAT_KEEP = 20;         // chỉ nghe 20 lời nhắn gần nhất
const FRESH_MS = 60000;       // khi đếm chỗ trống: bỏ qua bóng ma cũ hơn 1 phút

const wrap = (a) => { a = Number(a); return Number.isFinite(a) ? Math.atan2(Math.sin(a), Math.cos(a)) : 0; };

/** Tải SDK Firebase (bản modular, ghim phiên bản) từ gstatic. Lỗi mạng/bị chặn thì ném lỗi để trình quản lý chuyển nơi khác. */
export async function loadFirebaseSdk(version = FIREBASE_SDK_VERSION, imp = (u) => import(u)) {
  const base = 'https://www.gstatic.com/firebasejs/' + version + '/';
  const [app, auth, db] = await Promise.all([imp(base + 'firebase-app.js'), imp(base + 'firebase-auth.js'), imp(base + 'firebase-database.js')]);
  return { ...app, ...auth, ...db };
}

/**
 * opts: { config, name, loadSdk() → Promise<sdk>, now, maxPlayers }
 * Dữ liệu: /players/{uid} = {n,c,h,x,y,z,r,s,t} + `i` (vật phẩm đang dùng, Phiên 166; chỉ có khi có đồ) · /chat/{pushId} = {id,n,m,t}. Mỗi lần mở trang là một uid mới (đăng nhập ẩn danh, không lưu).
 */
export function createFirebaseTransport({ config, name = 'Firebase', loadSdk, now = () => Date.now(), maxPlayers = ROOM_CFG.maxPlayers, appName }) {
  let sdk = null, app = null, db = null, uid = '', myRef = null, connected = false, closed = false;
  const players = new Map(), chatSeen = new Set(), unsubs = [];
  let chatLog = [], seq = 0, lastKey = '', lastSend = 0, lastChat = 0, lastSig = 0, gearBlocked = false;   // gearBlocked (Phiên 166): luật Firebase cũ từ chối trường `i` → thôi gửi `i`, người chơi vẫn hiện bình thường
  const API = { kind: 'firebase', name };

  /** Kết nối + đăng nhập ẩn danh + nạp danh sách hiện tại. Ném 'room_full' nếu phòng đã đủ người, 'timeout' nếu quá hạn. */
  API.connect = async (timeoutMs = 6000) => {
    const work = (async () => {
      sdk = await loadSdk();
      app = sdk.initializeApp(config, appName || ('dgt-' + name + '-' + now()));
      let auth; try { auth = sdk.initializeAuth(app, { persistence: sdk.inMemoryPersistence }); } catch (_) { auth = sdk.getAuth(app); }
      const cred = await sdk.signInAnonymously(auth);
      uid = cred && cred.user && cred.user.uid; if (!validId(uid)) throw new Error('bad_uid');
      db = sdk.getDatabase(app); myRef = sdk.ref(db, 'players/' + uid);
      await new Promise((resolve) => {                       // chờ WebSocket nối được; mỗi lần nối lại thì đăng ký lại "tự xóa khi rớt mạng"
        unsubs.push(sdk.onValue(sdk.ref(db, '.info/connected'), (s) => {
          connected = !!s.val();
          if (connected) { try { sdk.onDisconnect(myRef).remove().catch(() => {}); } catch (_) { /* bỏ qua */ } resolve(); }
        }));
      });
      const playersRef = sdk.ref(db, 'players'), snap = await sdk.get(playersRef), val = (snap && snap.val()) || {};
      let others = 0;
      for (const [k, v] of Object.entries(val)) {
        if (k === uid || !v) continue;
        if (Math.abs(now() - Number(v.t)) < FRESH_MS) others++;
        const p = cleanPlayer({ ...v, id: k }); if (p) players.set(k, { p, seen: now() });
      }
      if (others >= maxPlayers) throw new Error('room_full');
      const upsert = (s) => { if (s.key === uid) return; const p = cleanPlayer({ ...s.val(), id: s.key }); if (p) players.set(s.key, { p, seen: now() }); };
      unsubs.push(sdk.onChildAdded(playersRef, upsert), sdk.onChildChanged(playersRef, upsert), sdk.onChildRemoved(playersRef, (s) => { players.delete(s.key); }));
      const chatQ = sdk.query(sdk.ref(db, 'chat'), sdk.limitToLast(CHAT_KEEP)), cs = await sdk.get(chatQ);
      cs.forEach((c) => { chatSeen.add(c.key); });          // lời nhắn cũ: chỉ đánh dấu đã thấy, không hiện lại
      unsubs.push(sdk.onChildAdded(chatQ, (s) => {
        if (chatSeen.has(s.key)) return; chatSeen.add(s.key);
        const v = s.val() || {}, m = chatOk(v.m); if (v.id === uid || !validId(v.id) || !m) return;
        chatLog.push({ seq: ++seq, id: v.id, n: String(v.n || ''), m }); if (chatLog.length > 50) chatLog = chatLog.slice(-50);
      }));
    })();
    work.catch(() => {});
    let to; const timer = new Promise((_, rej) => { to = setTimeout(() => rej(new Error('timeout')), timeoutMs); });
    try { await Promise.race([work, timer]); } catch (e) { API.close(); throw e; } finally { clearTimeout(to); }
  };

  /** Giống callApi('sync'): gửi trạng thái của mình (có điều tiết), trả người khác + lời nhắn mới. Lệnh gọi này rất rẻ (đọc bộ nhớ). */
  API.call = async (req) => {
    if (closed || !db) return { ok: false, error: 'closed' };
    if (!connected) return { ok: false, error: 'offline' };
    req = req || {}; const t = now();
    const me = cleanPlayer({ ...req, r: wrap(req.r), id: uid });
    if (me) {
      const rec = { n: me.n, c: me.c, h: me.h, x: me.x, y: me.y, z: me.z, r: me.r, s: me.s }; if (me.i && !gearBlocked) rec.i = me.i;   // Phiên 166: chỉ gửi `i` khi có đồ
      const key = JSON.stringify(rec), hadGear = !!rec.i;
      const due = key !== lastKey ? t - lastSend >= SEND_MIN_MS : t - lastSend >= KEEPALIVE_MS;
      if (due) {
        lastKey = key; lastSend = t;
        Promise.resolve(sdk.set(myRef, { ...rec, t })).catch(() => {
          if (!hadGear || gearBlocked) return;     // lỗi thường: bỏ qua như cũ
          gearBlocked = true; lastKey = ''; lastSend = 0;     // có đồ mà bị từ chối → nhiều khả năng luật Firebase chưa có trường `i`: gửi lại KHÔNG kèm `i` để mình không biến mất
          try { console.warn('[Diệu Giang Tự] Firebase từ chối trường vật phẩm `i`: cần dán lại firebase/database.rules.json vào Rules rồi Publish. Tạm thời người khác chưa thấy đồ của bạn.'); } catch (_) { /* bỏ qua */ }
        });
      }
      const say = chatOk(req.say);
      const sig = say.startsWith('#dg');
      if (say && t - (sig ? lastSig : lastChat) >= (sig ? SIG_GAP_MS : ROOM_CFG.chatGapMs)) { if (sig) lastSig = t; else lastChat = t; Promise.resolve(sdk.push(sdk.ref(db, 'chat'), { id: uid, n: me.n, m: say, t })).catch(() => {}); }
    }
    const list = [];
    for (const [k, v] of players) { if (t - v.seen > STALE_MS) { players.delete(k); continue; } list.push({ ...v.p }); }
    const since = Number(req.since) || 0;
    return { ok: true, players: list, chat: chatLog.filter((c) => c.seq > since).map((c) => ({ ...c })), seq, count: list.length + 1, pollMs: 250, minPollMs: 200, hiddenMs: 4000, follow: 5 };
  };

  API.close = () => {
    if (closed) return; closed = true;
    for (const off of unsubs.splice(0)) { try { off(); } catch (_) { /* bỏ qua */ } }
    try { if (sdk && myRef) Promise.resolve(sdk.remove(myRef)).catch(() => {}); } catch (_) { /* bỏ qua */ }
    try { if (sdk && db && sdk.goOffline) sdk.goOffline(db); } catch (_) { /* bỏ qua */ }
    try { if (sdk && app && sdk.deleteApp) Promise.resolve(sdk.deleteApp(app)).catch(() => {}); } catch (_) { /* bỏ qua */ }
    players.clear();
  };
  Object.defineProperty(API, 'uid', { get: () => uid });
  return API;
}
