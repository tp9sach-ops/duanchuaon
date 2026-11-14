// Khách đa người: thăm dò máy chủ, giữ các nhân vật của người khác, nội suy chuyển động. KHÔNG import three.js:
// mọi thứ cần ngoài (gọi mạng, dựng nhân vật, đọc trạng thái của mình) được đưa vào qua `deps` nên kiểm thử được bằng Node.
import { ROOM_CFG, pollInterval, chatOk, createRemotes } from '../engines/room.js';
import { isSignal } from '../world/duel.js';   // Phiên 137: gói tin giao lưu võ thuật đi chung kênh chat nhưng KHÔNG hiện thành lời nhắn

/**
 * deps: {
 *   call(req) → Promise<res>     gọi máy chủ (Apps Script) hoặc kênh cục bộ
 *   getSelf() → {n,c,h,x,y,z,r,s,i?} | null   trạng thái của mình (i = chuỗi vật phẩm, Phiên 166); null = chưa vào chùa
 *   makeAvatar(p) → avatar        dựng nhân vật người khác (avatar.group, setFacing, setState, say, update, dispose)
 *   scene                         nơi thêm/bỏ avatar.group
 *   applyGear(av, tok, dt)        (tùy chọn, Phiên 166) vẽ vật phẩm của người khác (gậy, nón, ván, bánh) lên avatar mỗi khung hình; dropGear(av) dọn khi người đó rời / dựng lại
 *   onOnline(n)                   số người đang online (kể cả mình)
 *   pageId                        mã ngẫu nhiên của lần mở trang này (KHÔNG dùng userKey để người khác không biết)
 *   schedule(fn, ms) → handle, cancel(handle)   mặc định setTimeout/clearTimeout
 * }
 */
export function createRoomClient(deps) {
  const { call, getSelf, makeAvatar, scene, onOnline = () => {}, pageId } = deps;
  const schedule = deps.schedule || ((fn, ms) => setTimeout(fn, ms)), cancel = deps.cancel || ((h) => clearTimeout(h));
  const remotes = createRemotes(), views = new Map();       // id → { av, key }
  const sigQ = [];                                           // Phiên 137: gói tin giao lưu chờ gửi (mỗi lượt đồng bộ gửi một gói, ưu tiên hơn lời nhắn thường)
  let holdId = null; const flies = new Map();               // Phiên 91: người đang được MÌNH khiêng trên vai / đang bị MÌNH ném bay vòng cung (id → { x0,y0,z0,x1,z1,t,dur,peak })
  let lastRoom = null, cursor = 0, first = true, pendingSay = '', timer = null, running = false, active = true, fails = 0, busy = false, lastCount = 1, hiddenMs = 9000;
  const API = { pageId };

  const killView = (v) => { try { if (deps.dropGear) deps.dropGear(v.av); } catch (_) { /* dọn đồ lỗi không làm hỏng đồng bộ */ } scene.remove(v.av.group); v.av.dispose(); };
  function viewFor(p) {
    const key = p.n + '|' + p.c + '|' + p.h; let v = views.get(p.id);
    if (v && v.key !== key) { killView(v); views.delete(p.id); v = null; }   // đổi tên/áo: dựng lại
    if (!v) { const av = makeAvatar({ name: p.n, color: p.c, hair: p.h }); scene.add(av.group); av.group.position.set(p.x, p.y, p.z); av.setFacing(p.ry, true); v = { av, key, name: p.n }; views.set(p.id, v); }
    return v;
  }

  /** Gọi mỗi khung hình: nội suy vị trí và cập nhật nhân vật của người khác. */
  API.frame = (dt) => {
    const list = remotes.step(dt), alive = new Set();
    for (const p of list) {
      alive.add(p.id); const { av } = viewFor(p);
      const q = deps.xform ? deps.xform(p) : p;           // Phiên 137: trong võ đài, vị trí đối thủ (mượn khung ±200) được đổi về tọa độ võ đài
      av.group.position.set(q.x, p.y, q.z); av.setFacing(p.ry);
      av.setState(p.state === 'walk' && p.speed < 0.4 ? 'idle' : p.state, p.speed); av.update(dt);
      if (deps.applyGear) { try { deps.applyGear(av, p.i || '', dt); } catch (e) { /* vẽ đồ lỗi thì bỏ qua, người vẫn hiện */ } }   // Phiên 166: gậy / nón / ván / bánh của người khác (sau update, cộng độ cao khi cưỡi)
      const fl = flies.get(p.id), me = p.id === holdId && deps.selfPose ? deps.selfPose() : null, rot = av.group.rotation;   // (nhân vật giả trong test có thể không có rotation)
      if (fl) { fl.t += dt; const u = Math.min(1, fl.t / fl.dur); av.group.position.set(fl.x0 + (fl.x1 - fl.x0) * u, fl.y0 * (1 - u) + 4 * fl.peak * u * (1 - u), fl.z0 + (fl.z1 - fl.z0) * u); if (rot) rot.x = u >= 1 ? 0 : 1.3 * (1 - u); if (u >= 1) flies.delete(p.id); }
      else if (me) { av.group.position.set(me.x, (me.y || 0) + 2.05, me.z); av.setFacing(me.r, true); if (rot) rot.x = 1.3; }   // nằm vắt trên vai mình
      else if (rot && rot.x) rot.x = 0;
    }
    for (const [id, v] of views) if (!alive.has(id)) { killView(v); views.delete(id); flies.delete(id); if (holdId === id) holdId = null; }
  };

  /** Một lượt đồng bộ: gửi trạng thái của mình, nhận người khác + lời nhắn mới. */
  API.tick = async () => {
    if (busy) return; busy = true;
    let wait = ROOM_CFG.minPollMs;
    try {
      const me = getSelf();
      if (!me) { wait = 500; return; }                      // chưa vào chùa (đang ở màn nhập tên)
      const rn = deps.roomOf ? deps.roomOf(ROOM_CFG.room) : ROOM_CFG.room;     // tên phòng theo zone hiện tại (hub = 'main', như cũ)
      if (lastRoom !== null && rn !== lastRoom) API.reset();                  // sang zone khác: quên người + lời nhắn của zone cũ
      lastRoom = rn;
      let say = '', isSig = false; if (sigQ.length) { say = sigQ.shift(); isSig = true; } else { say = pendingSay; pendingSay = ''; }
      const res = await call({ action: 'sync', room: rn, id: pageId, n: me.n, c: me.c, h: me.h, x: me.x, y: me.y, z: me.z, r: me.r, s: me.s, i: me.i || '', since: cursor, say });
      if (res && res.ok) {
        fails = 0; remotes.ingest(res.players, pageId);
        lastCount = Math.max(1, Number(res.count) || remotes.size + 1); onOnline(lastCount);
        const seq = Number(res.seq) || 0;
        if (!first) for (const c of Array.isArray(res.chat) ? res.chat : []) {      // lần đầu chỉ lấy mốc, không hiện lại lời nhắn cũ
          if (c && c.id !== pageId) {
            const t = chatOk(c.m);
            if (t && isSignal(t)) { if (deps.onSignal) { try { deps.onSignal(c.id, String(c.n || ''), t); } catch (_) { /* người nghe lỗi không làm hỏng đồng bộ */ } } continue; }   // gói giao lưu: không hiện thành bong bóng chat
            const v = views.get(c.id); if (v && t) { v.av.say(t); if (deps.onChat) deps.onChat({ name: v.name, text: t }); }
          }
        }
        first = false; cursor = seq;
        // Đường truyền nhanh (Firebase) tự khai chu kỳ ngắn/hệ số bám/chu kỳ khi tab ẩn; Apps Script không khai thì dùng mặc định cũ
        const lo = Number(res.minPollMs) > 0 ? Number(res.minPollMs) : ROOM_CFG.minPollMs;
        hiddenMs = Number(res.hiddenMs) > 0 ? Number(res.hiddenMs) : 9000; remotes.follow = Number(res.follow) > 0 ? Number(res.follow) : 1.4;
        wait = Number(res.pollMs) > 0 ? Math.max(lo, Math.min(ROOM_CFG.maxPollMs, Number(res.pollMs))) : pollInterval(lastCount);
      } else {
        if (say) { if (isSig) sigQ.unshift(say); else pendingSay = say; }   // chưa gửi được thì giữ lại gửi lần sau
        fails++; wait = Math.min(10000, ROOM_CFG.minPollMs * Math.pow(2, Math.min(fails, 3)));   // lỗi liên tiếp: thưa dần, tối đa 10 giây
        if (res && res.error === 'room_full') onOnline(null);
      }
    } catch (_) { fails++; wait = Math.min(10000, ROOM_CFG.minPollMs * Math.pow(2, Math.min(fails, 3))); }
    finally { busy = false; if (running) timer = schedule(API.tick, active ? wait : Math.max(wait, hiddenMs)); }
  };

  /** Đổi sang đường truyền khác: quên mốc lời nhắn của nơi cũ, bỏ mọi người của nơi cũ (khung hình kế tiếp sẽ dọn nhân vật). */
  API.reset = () => { cursor = 0; first = true; remotes.ingest([], pageId); };
  /** Phiên 91: hiện người `id` nằm trên vai MÌNH (id = null: thôi). Vị trí lấy từ deps.selfPose() ({x,y,z,r}) mỗi khung hình. */
  API.hold = (id) => { holdId = id || null; };
  /** Phiên 91: người `id` bị mình ném bay vòng cung từ vai mình tới `to` ({x,z}, mét); sau đó vị trí thật (nhận từ mạng) tiếp quản. */
  API.toss = (id, to) => {
    const c = deps.selfPose ? deps.selfPose() : null, v = views.get(id); if (!v || !to) return false;
    const x0 = c ? c.x : v.av.group.position.x, z0 = c ? c.z : v.av.group.position.z, range = Math.hypot(to.x - x0, to.z - z0);
    flies.set(id, { x0, y0: 2.05 + (c && c.y ? c.y : 0), z0, x1: to.x, z1: to.z, t: 0, dur: 0.5 + range * 0.035, peak: 1.2 + range * 0.1 }); if (holdId === id) holdId = null; return true;
  };
  /** Gửi một lời nhắn (hiện bong bóng trên đầu mình ở lượt đồng bộ kế tiếp của người khác). Trả chuỗi đã làm sạch hoặc ''. */
  API.say = (text) => { const t = chatOk(text); if (t) pendingSay = t; return t; };
  /** Phiên 137: gửi một gói giao lưu (chuỗi "#dg…"). Tối đa 6 gói chờ; đầy thì bỏ gói cũ nhất. */
  API.signal = (text) => { const t = chatOk(text); if (!t || !isSignal(t)) return false; sigQ.push(t); while (sigQ.length > 6) sigQ.shift(); return true; };
  API.start = () => { if (running) return; running = true; timer = schedule(API.tick, 0); };
  API.stop = () => { running = false; if (timer != null) cancel(timer); timer = null; for (const v of views.values()) killView(v); views.clear(); };
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
    const { id, n, c, h, x, y, z, r, s, i } = req;
    ch.postMessage({ id, n, c, h, x, y, z, r, s, i });
    const t = now(), players = [];
    for (const [k, v] of [...seen]) { if (t - v.t > ttlMs) seen.delete(k); else players.push(v.p); }
    return { ok: true, players, chat: [], seq: 0, count: players.length + 1, pollMs: ROOM_CFG.minPollMs };
  };
  call.close = () => { try { ch.close(); } catch (_) { /* bỏ qua */ } };
  return call;
}
