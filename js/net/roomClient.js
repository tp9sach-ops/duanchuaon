// Khách đa người: thăm dò máy chủ, giữ các nhân vật của người khác, nội suy chuyển động. KHÔNG import three.js:
// mọi thứ cần ngoài (gọi mạng, dựng nhân vật, đọc trạng thái của mình) được đưa vào qua `deps` nên kiểm thử được bằng Node.
import { ROOM_CFG, pollInterval, chatOk, createRemotes } from '../engines/room.js';

/**
 * deps: {
 *   call(req) → Promise<res>     gọi máy chủ (Apps Script) hoặc kênh cục bộ
 *   getSelf() → {n,c,h,x,y,z,r,s} | null   trạng thái của mình; null = chưa vào chùa
 *   makeAvatar(p) → avatar        dựng nhân vật người khác (avatar.group, setFacing, setState, say, update, dispose)
 *   scene                         nơi thêm/bỏ avatar.group
 *   onOnline(n)                   số người đang online (kể cả mình)
 *   pageId                        mã ngẫu nhiên của lần mở trang này (KHÔNG dùng userKey để người khác không biết)
 *   schedule(fn, ms) → handle, cancel(handle)   mặc định setTimeout/clearTimeout
 * }
 */
export function createRoomClient(deps) {
  const { call, getSelf, makeAvatar, scene, onOnline = () => {}, pageId } = deps;
  const schedule = deps.schedule || ((fn, ms) => setTimeout(fn, ms)), cancel = deps.cancel || ((h) => clearTimeout(h));
  const remotes = createRemotes(), views = new Map();       // id → { av, key }
  let cursor = 0, first = true, pendingSay = '', timer = null, running = false, active = true, fails = 0, busy = false, lastCount = 1, hiddenMs = 9000;
  const API = { pageId };

  function viewFor(p) {
    const key = p.n + '|' + p.c + '|' + p.h; let v = views.get(p.id);
    if (v && v.key !== key) { scene.remove(v.av.group); v.av.dispose(); views.delete(p.id); v = null; }   // đổi tên/áo: dựng lại
    if (!v) { const av = makeAvatar({ name: p.n, color: p.c, hair: p.h }); scene.add(av.group); av.group.position.set(p.x, p.y, p.z); av.setFacing(p.ry, true); v = { av, key, name: p.n }; views.set(p.id, v); }
    return v;
  }

  /** Gọi mỗi khung hình: nội suy vị trí và cập nhật nhân vật của người khác. */
  API.frame = (dt) => {
    const list = remotes.step(dt), alive = new Set();
    for (const p of list) {
      alive.add(p.id); const { av } = viewFor(p);
      av.group.position.set(p.x, p.y, p.z); av.setFacing(p.ry);
      av.setState(p.state === 'walk' && p.speed < 0.4 ? 'idle' : p.state, p.speed); av.update(dt);
    }
    for (const [id, v] of views) if (!alive.has(id)) { scene.remove(v.av.group); v.av.dispose(); views.delete(id); }
  };

  /** Một lượt đồng bộ: gửi trạng thái của mình, nhận người khác + lời nhắn mới. */
  API.tick = async () => {
    if (busy) return; busy = true;
    let wait = ROOM_CFG.minPollMs;
    try {
      const me = getSelf();
      if (!me) { wait = 500; return; }                      // chưa vào chùa (đang ở màn nhập tên)
      const say = pendingSay; pendingSay = '';
      const res = await call({ action: 'sync', room: ROOM_CFG.room, id: pageId, n: me.n, c: me.c, h: me.h, x: me.x, y: me.y, z: me.z, r: me.r, s: me.s, since: cursor, say });
      if (res && res.ok) {
        fails = 0; remotes.ingest(res.players, pageId);
        lastCount = Math.max(1, Number(res.count) || remotes.size + 1); onOnline(lastCount);
        const seq = Number(res.seq) || 0;
        if (!first) for (const c of Array.isArray(res.chat) ? res.chat : []) {      // lần đầu chỉ lấy mốc, không hiện lại lời nhắn cũ
          if (c && c.id !== pageId) { const v = views.get(c.id), t = chatOk(c.m); if (v && t) { v.av.say(t); if (deps.onChat) deps.onChat({ name: v.name, text: t }); } }
        }
        first = false; cursor = seq;
        // Đường truyền nhanh (Firebase) tự khai chu kỳ ngắn/hệ số bám/chu kỳ khi tab ẩn; Apps Script không khai thì dùng mặc định cũ
        const lo = Number(res.minPollMs) > 0 ? Number(res.minPollMs) : ROOM_CFG.minPollMs;
        hiddenMs = Number(res.hiddenMs) > 0 ? Number(res.hiddenMs) : 9000; remotes.follow = Number(res.follow) > 0 ? Number(res.follow) : 1.4;
        wait = Number(res.pollMs) > 0 ? Math.max(lo, Math.min(ROOM_CFG.maxPollMs, Number(res.pollMs))) : pollInterval(lastCount);
      } else {
        if (say) pendingSay = say;                          // chưa gửi được thì giữ lại gửi lần sau
        fails++; wait = Math.min(10000, ROOM_CFG.minPollMs * Math.pow(2, Math.min(fails, 3)));   // lỗi liên tiếp: thưa dần, tối đa 10 giây
        if (res && res.error === 'room_full') onOnline(null);
      }
    } catch (_) { fails++; wait = Math.min(10000, ROOM_CFG.minPollMs * Math.pow(2, Math.min(fails, 3))); }
    finally { busy = false; if (running) timer = schedule(API.tick, active ? wait : Math.max(wait, hiddenMs)); }
  };

  /** Đổi sang đường truyền khác: quên mốc lời nhắn của nơi cũ, bỏ mọi người của nơi cũ (khung hình kế tiếp sẽ dọn nhân vật). */
  API.reset = () => { cursor = 0; first = true; remotes.ingest([], pageId); };
  /** Gửi một lời nhắn (hiện bong bóng trên đầu mình ở lượt đồng bộ kế tiếp của người khác). Trả chuỗi đã làm sạch hoặc ''. */
  API.say = (text) => { const t = chatOk(text); if (t) pendingSay = t; return t; };
  API.start = () => { if (running) return; running = true; timer = schedule(API.tick, 0); };
  API.stop = () => { running = false; if (timer != null) cancel(timer); timer = null; for (const v of views.values()) { scene.remove(v.av.group); v.av.dispose(); } views.clear(); };
  /** Tab ẩn thì thưa hẳn đi để đỡ tốn lượt gọi Apps Script. */
  API.setActive = (a) => { active = !!a; };
  /** Danh sách người khác đang thấy trong cảnh: [{id,n,x,z}] (vị trí đã nội suy). */
  API.players = () => [...views].map(([id, v]) => ({ id, n: v.name, x: v.av.group.position.x, z: v.av.group.position.z }));
  Object.defineProperty(API, 'count', { get: () => lastCount });
  Object.defineProperty(API, 'remoteCount', { get: () => views.size });
  return API;
}

/**
 * Khi chưa có apiUrl (chạy cục bộ): các tab CÙNG TRÌNH DUYỆT thấy nhau qua BroadcastChannel.
 * Trả hàm call(req) giống callApi hoặc null nếu trình duyệt không có BroadcastChannel.
 */
export function createLocalTransport({ BC = globalThis.BroadcastChannel, now = () => Date.now(), ttlMs = 6000 } = {}) {
  if (!BC) return null;
  const ch = new BC('dgt-room'), seen = new Map();
  if (typeof ch.unref === 'function') ch.unref();           // Node: không giữ tiến trình sống (kiểm thử)
  ch.onmessage = (e) => { const d = e && e.data; if (d && typeof d.id === 'string') seen.set(d.id, { p: d, t: now() }); };
  const call = async (req) => {
    const { id, n, c, h, x, y, z, r, s } = req;
    ch.postMessage({ id, n, c, h, x, y, z, r, s });
    const t = now(), players = [];
    for (const [k, v] of [...seen]) { if (t - v.t > ttlMs) seen.delete(k); else players.push(v.p); }
    return { ok: true, players, chat: [], seq: 0, count: players.length + 1, pollMs: ROOM_CFG.minPollMs };
  };
  call.close = () => { try { ch.close(); } catch (_) { /* bỏ qua */ } };
  return call;
}
