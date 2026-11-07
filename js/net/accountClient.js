// Client tài khoản nhân vật (Phiên 53): tạo / đăng nhập / kéo bản lưu mới / đẩy tiến trình / đăng xuất, và bộ tự động lưu.
// Không đụng DOM; mọi thứ bên ngoài (gọi máy chủ, localStorage, mã hóa, đồng hồ) được TRUYỀN VÀO nên test được bằng Node (tests/account.test.mjs).
// Mọi hàm trả { ok:true, ... } hoặc { ok:false, error } — không ném lỗi ra ngoài.
import { ACCT, checkName, checkPassword, deriveKey, hash32, packSave, applySave, clearSyncKeys, hasProgress, saveSize } from '../engines/account.js';

const fail = (error, extra = {}) => ({ ok: false, error, ...extra });

/**
 * deps: { call(action, payload, opts), storage, subtle, getUserKey?(), uuid?(), iter? }
 * `call` là callApi (js/api.js): trả đối tượng JSON của máy chủ, hoặc { ok:false, error:'network'|'timeout'|… }.
 */
export function createAccountClient({ call, storage, subtle, getUserKey = () => '', uuid = () => globalThis.crypto.randomUUID(), iter = ACCT.ITER }) {
  const state = { conflict: false, expired: false };   // conflict: máy khác đã lưu bản mới hơn mà máy này cũng có thay đổi chưa lưu
  const listeners = [];
  let pendingServer = null;                            // bản lưu mới hơn của máy khác, giữ lại chờ người chơi chọn

  const account = () => { try { const a = JSON.parse(storage.getItem(ACCT.ACCT_KEY) || 'null'); return a && a.aid && a.token ? a : null; } catch (_) { return null; } };
  const setAccount = (a) => { try { if (a) storage.setItem(ACCT.ACCT_KEY, JSON.stringify(a)); else storage.removeItem(ACCT.ACCT_KEY); } catch (_) { /* chế độ riêng tư */ } };
  const snapshot = () => JSON.stringify(packSave(storage));
  /** Ghi "máy chủ đang giữ đúng bản có dấu vân `h` ở số lần lưu `rev`". `h` mặc định = bản hiện tại trên máy. */
  const mark = (a, rev, h = hash32(snapshot())) => { const n = { ...a, rev, h }; setAccount(n); return n; };
  /** Bản lưu có thay đổi chưa lên máy chủ không. */
  const dirty = () => { const a = account(); return !!a && hash32(snapshot()) !== a.h; };
  const emit = (ev) => listeners.forEach((f) => { try { f(ev); } catch (_) { /* bỏ qua */ } });

  async function key(name, password) {
    try { return { ok: true, key: await deriveKey(name, password, subtle, iter) }; } catch (e) { return fail(e && e.code === 'no_crypto' ? 'no_crypto' : 'server_error'); }
  }

  /** Tạo nhân vật mới (hoặc đặt mật khẩu cho nhân vật cũ trên máy này): gửi kèm toàn bộ dữ liệu đã chơi. `overrides` = tên/màu/kiểu đầu sắp lưu. */
  async function create({ name, password, overrides = {} }) {
    const n = checkName(name); if (!n.ok) return fail(n.error);
    const p = checkPassword(password); if (!p.ok) return fail(p.error);
    const k = await key(n.name, password); if (!k.ok) return k;
    try { getUserKey(); } catch (_) { /* bỏ qua */ }                 // đảm bảo có lgt.userKey để hồ sơ ngày sinh đi theo tài khoản
    const save = packSave(storage, { ...overrides, 'lgt.name': n.name });
    if (saveSize(save) > ACCT.SAVE_MAX) return fail('too_big');
    const r = await call('acctCreate', { aid: uuid(), name: n.name, key: k.key, save });
    if (!r || !r.ok) return fail((r && r.error) || 'network', { name: n.name, detail: r && r.detail });
    state.expired = false;
    // máy chủ đã nhận đúng bản `save`: ghi vào máy rồi đánh dấu đã khớp
    applySave(storage, save);
    const a = mark({ aid: r.aid, name: r.name, token: r.token }, r.rev);
    return { ok: true, acct: a };
  }

  /** Đăng nhập: CHƯA ghi gì vào máy. Gọi adopt(res) để nhận dữ liệu (ghi đè dữ liệu trên máy). */
  async function login({ name, password }) {
    const n = checkName(name); if (!n.ok) return fail(n.error);
    const p = checkPassword(password); if (!p.ok) return fail(p.error);
    const k = await key(n.name, password); if (!k.ok) return k;
    const r = await call('acctLogin', { name: n.name, key: k.key });
    if (!r || !r.ok) return fail((r && r.error) || 'network', { name: n.name, detail: r && r.detail });
    return { ok: true, res: r };
  }
  /** Nhận kết quả đăng nhập: thay dữ liệu game trên máy bằng bản lưu của tài khoản và nhớ phiên đăng nhập. Sau đó nên tải lại trang. */
  function adopt(res) {
    applySave(storage, res.save);
    try { storage.setItem('lgt.name', res.name); } catch (_) { /* bỏ qua */ }   // tên tài khoản là tên chuẩn
    state.expired = false; state.conflict = false; pendingServer = null;
    return mark({ aid: res.aid, name: res.name, token: res.token }, res.rev);
  }

  function applyServer(r, a) {
    applySave(storage, r.save);
    try { storage.setItem('lgt.name', a.name); } catch (_) { /* bỏ qua */ }
    mark(a, r.rev);
  }

  /** Lúc mở trang: hỏi máy chủ có bản mới hơn (do máy khác lưu) không. Máy này không có thay đổi chưa lưu → nhận luôn; có → báo xung đột để người chơi chọn. */
  async function pull() {
    const a = account(); if (!a) return { ok: true, none: true };
    const r = await call('acctLoad', { aid: a.aid, token: a.token, rev: a.rev });
    if (!r || !r.ok) {
      if (r && r.error === 'bad_token') { setAccount(null); state.expired = true; return fail('bad_token'); }
      return fail((r && r.error) || 'network');
    }
    if (!r.changed) return { ok: true, changed: false };
    if (dirty()) { pendingServer = r; state.conflict = true; emit('conflict'); return { ok: true, conflict: true }; }
    applyServer(r, a);
    return { ok: true, changed: true };
  }

  /** Đẩy tiến trình lên máy chủ (chỉ khi có thay đổi, trừ khi force). 'stale' = máy khác đã lưu bản mới hơn. */
  async function push({ force = false, keepalive = false } = {}) {
    const a = account(); if (!a) return { ok: true, none: true };
    if (!force && !dirty()) return { ok: true, same: true };
    const save = packSave(storage), size = saveSize(save), sentHash = hash32(JSON.stringify(save));
    if (size > ACCT.SAVE_MAX) return fail('too_big');
    const r = await call('acctSave', { aid: a.aid, token: a.token, base: a.rev, sid: uuid(), force, save }, { keepalive: keepalive && size < 60000 });
    // Chỉ đánh dấu "đã lưu" đúng bản VỪA GỬI: nếu trong lúc chờ người chơi tiến triển thêm thì phần mới vẫn còn "chưa lưu" (dirty) cho lần sau.
    if (r && r.ok) { const cur = account(); if (cur && cur.aid === a.aid) mark(cur, r.rev, sentHash); return { ok: true, rev: r.rev }; }
    if (r && r.error === 'stale') return fail('stale', { serverRev: r.rev });
    if (r && r.error === 'bad_token') { setAccount(null); state.expired = true; return fail('bad_token'); }
    return fail((r && r.error) || 'network');
  }

  /** Giải quyết xung đột: dùng bản của máy khác (ghi đè máy này; cần tải lại trang sau đó). */
  async function useServer() {
    const a = account(); if (!a) return fail('bad_token');
    let r = pendingServer;
    if (!r) { r = await call('acctLoad', { aid: a.aid, token: a.token, rev: -1 }); if (!r || !r.ok) return fail((r && r.error) || 'network'); }
    applyServer(r, a); pendingServer = null; state.conflict = false;
    return { ok: true };
  }
  /** Giải quyết xung đột: giữ dữ liệu máy này (ghi đè bản trên máy chủ). */
  async function keepLocal() {
    const r = await push({ force: true });
    if (r.ok) { pendingServer = null; state.conflict = false; }
    return r;
  }

  /**
   * Đăng xuất máy này. Còn thay đổi chưa lưu mà không đẩy được → trả 'unsynced' (hỏi người chơi); `force` thì vẫn đăng xuất.
   * Đăng xuất xóa dữ liệu game trên máy (để người dùng chung máy không thấy nhân vật này).
   */
  async function logout({ force = false } = {}) {
    const a = account();
    if (a) {
      if (dirty() && !state.conflict) { const r = await push(); if (!r.ok && !force) return fail('unsynced'); }
      try { await call('acctLogout', { aid: a.aid, token: a.token }); } catch (_) { /* không báo được thì máy chủ vẫn giữ token cũ, không sao */ }
    }
    clearSyncKeys(storage); setAccount(null);
    state.conflict = false; state.expired = false; pendingServer = null;
    return { ok: true };
  }

  return {
    state, account, dirty, create, login, adopt, pull, push, useServer, keepLocal, logout,
    hasProgress: () => hasProgress(storage),
    on: (f) => { listeners.push(f); },
    notifyConflict: () => { state.conflict = true; emit('conflict'); },
    notifyExpired: () => { state.expired = true; emit('expired'); },
  };
}

/**
 * Tự động lưu: cứ `checkMs` kiểm tra, có thay đổi và đã ≥ `minGapMs` từ lần lưu trước thì đẩy lên.
 * Rời/ẩn trang thì lưu ngay (gói nhỏ đi bằng keepalive). Gặp xung đột hoặc phiên hết hạn thì dừng và báo.
 * env: { doc, win, setInterval, clearInterval, now } — truyền vào để test.
 */
export function createAutoSync(client, { doc = globalThis.document, win = globalThis, setInterval: si = globalThis.setInterval.bind(globalThis), clearInterval: ci = globalThis.clearInterval.bind(globalThis), now = Date.now, checkMs = 15000, minGapMs = 45000 } = {}) {
  let timer = null, last = 0, busy = false, hooked = false;
  async function tick(urgent = false) {
    if (busy || !client.account() || client.state.conflict) return;
    if (!urgent && now() - last < minGapMs) return;
    if (!client.dirty()) return;
    busy = true;
    try {
      const r = await client.push({ keepalive: urgent });
      last = now();
      if (!r.ok && r.error === 'stale') { stop(); client.notifyConflict(); }
      else if (!r.ok && r.error === 'bad_token') { stop(); client.notifyExpired(); }
    } finally { busy = false; }
  }
  const onHide = () => { if (doc && doc.hidden) tick(true); };
  const onPageHide = () => tick(true);
  function start() {
    if (timer || !client.account()) return;
    timer = si(() => tick(), checkMs);
    if (!hooked) { hooked = true; try { doc && doc.addEventListener && doc.addEventListener('visibilitychange', onHide); win && win.addEventListener && win.addEventListener('pagehide', onPageHide); } catch (_) { /* bỏ qua */ } }
  }
  function stop() { if (timer) { ci(timer); timer = null; } }
  return { start, stop, tick, get running() { return !!timer; } };
}
