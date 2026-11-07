// Tài khoản nhân vật (Phiên 53) — LOGIC THUẦN, không đụng DOM/mạng, có test (tests/account.test.mjs).
// Quy tắc ở đây phải GIỐNG gas/Accounts.gs (tên ≤ 20, mật khẩu 6–64, danh sách khóa không đồng bộ, giới hạn dung lượng).
//
// Ý tưởng: một tài khoản = (tên nhân vật + mật khẩu). Khóa đăng nhập `key` được TÍNH Ở MÁY NGƯỜI CHƠI bằng PBKDF2
// (mật khẩu thật không bao giờ rời khỏi máy); máy chủ chỉ lưu sha256(key). Hai người cùng tên nhưng khác mật khẩu
// là hai nhân vật khác nhau; cùng tên VÀ cùng mật khẩu thì không tạo được (báo trùng).

export const ACCT = {
  NAME_MAX: 20, PW_MIN: 6, PW_MAX: 64,
  ITER: 60000,            // số vòng PBKDF2 (đủ chậm với kẻ đoán mật khẩu, vẫn dưới ~0,5 giây trên điện thoại thường)
  SAVE_MAX: 150000,       // tối đa ký tự của bản lưu (máy chủ chia 4 ô × 45.000)
  SALT: 'lgt-acct-v1|',
  ACCT_KEY: 'lgt.acct',   // phiên đăng nhập của MÁY NÀY (không đồng bộ)
};

/** Khóa localStorage chỉ là cài đặt của từng thiết bị → KHÔNG đồng bộ lên tài khoản. Giữ giống ACCT_DEVICE_KEYS trong gas/Accounts.gs. */
export const DEVICE_KEYS = ['lgt.acct', 'lgt.perf', 'lgt.sound', 'lgt.vol', 'lgt.vfx', 'lgt.mm', 'lgt.tut', 'lgt.khinhHint'];
/** Khóa "danh tính" — có mặt không có nghĩa là máy này đã chơi gì. */
export const IDENTITY_KEYS = ['lgt.name', 'lgt.color', 'lgt.hair', 'lgt.userKey'];

/** Mọi khóa `lgt.*` đều là dữ liệu game, trừ cài đặt thiết bị. Khóa mới của các phiên sau tự được đồng bộ. */
export const isSyncKey = (k) => typeof k === 'string' && /^lgt\.[A-Za-z0-9_.-]{1,40}$/.test(k) && !DEVICE_KEYS.includes(k);

const BAD_RE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿<>]/g;

/** Chuẩn hóa tên để so trùng: Unicode NFC, bỏ khoảng trắng thừa, không phân biệt hoa/thường. */
export function normName(s) { return String(s == null ? '' : s).normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi'); }

/** Kiểm tên nhân vật: → { ok, name } | { ok:false, error }. Giống luật tên trong phòng chơi (không link, không @). */
export function checkName(raw) {
  let t = String(raw == null ? '' : raw).replace(BAD_RE, ' ').replace(/\s+/g, ' ').trim();
  if (/(https?:\/\/|www\.|@)/i.test(t)) return { ok: false, error: 'name_bad' };
  t = Array.from(t).slice(0, ACCT.NAME_MAX).join('').trim();
  return t ? { ok: true, name: t } : { ok: false, error: 'name_empty' };
}

/** Kiểm mật khẩu. `confirm` (tùy chọn): ô nhập lại, phải giống hệt. Không cắt khoảng trắng (khoảng trắng là một phần của mật khẩu). */
export function checkPassword(pw, confirm) {
  const p = String(pw == null ? '' : pw);
  if (!p) return { ok: false, error: 'pw_empty' };
  if (p.length < ACCT.PW_MIN) return { ok: false, error: 'pw_short' };
  if (p.length > ACCT.PW_MAX) return { ok: false, error: 'pw_long' };
  if (confirm !== undefined && String(confirm) !== p) return { ok: false, error: 'pw_mismatch' };
  return { ok: true };
}

const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');

/** Khóa đăng nhập 64 ký tự hex = PBKDF2-SHA256(mật khẩu, muối = tên đã chuẩn hóa). `subtle` = crypto.subtle (truyền vào để test được). */
export async function deriveKey(name, password, subtle, iter = ACCT.ITER) {
  if (!subtle || typeof subtle.importKey !== 'function') { const e = new Error('no_crypto'); e.code = 'no_crypto'; throw e; }
  const enc = new TextEncoder();
  const base = await subtle.importKey('raw', enc.encode(String(password).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(ACCT.SALT + normName(name)), iterations: iter }, base, 256);
  return hex(new Uint8Array(bits));
}

/** Băm nhanh 32 bit (FNV-1a) để nhận ra "dữ liệu máy này có đổi so với lần lưu cuối không". Không dùng cho bảo mật. */
export function hash32(s) {
  let h = 0x811c9dc5; const t = String(s);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------- bản lưu (gói / mở các khóa lgt.*)
/** Các khóa đồng bộ đang có trong storage (đã sắp xếp). `storage` cần length + key(i) như localStorage. */
export function listKeys(storage) {
  const out = [];
  try { for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (isSyncKey(k)) out.push(k); } } catch (_) { /* bỏ qua */ }
  return out.sort();
}
/** Gói dữ liệu game thành { v:1, d:{ khóa: chuỗi } } (khóa sắp xếp để so sánh ổn định). `overrides` ghi đè/thêm khóa mà chưa đụng storage. */
export function packSave(storage, overrides = {}) {
  const tmp = {};
  for (const k of listKeys(storage)) { let v = null; try { v = storage.getItem(k); } catch (_) { /* bỏ qua */ } if (typeof v === 'string') tmp[k] = v; }
  for (const [k, v] of Object.entries(overrides)) if (isSyncKey(k) && v != null) tmp[k] = String(v);
  const d = {}; for (const k of Object.keys(tmp).sort()) d[k] = tmp[k];
  return { v: 1, d };
}
/** Xóa mọi khóa đồng bộ trong storage (không đụng cài đặt thiết bị). */
export function clearSyncKeys(storage) { for (const k of listKeys(storage)) { try { storage.removeItem(k); } catch (_) { /* bỏ qua */ } } }
/** Thay TOÀN BỘ dữ liệu game của máy bằng bản lưu `save`. */
export function applySave(storage, save) {
  clearSyncKeys(storage);
  const d = (save && typeof save === 'object' && save.d && typeof save.d === 'object') ? save.d : {};
  for (const [k, v] of Object.entries(d)) if (isSyncKey(k) && typeof v === 'string') { try { storage.setItem(k, v); } catch (_) { /* bỏ qua */ } }
}
/** Máy này đã chơi gì đó chưa (có khóa đồng bộ nào ngoài danh tính)? Dùng để cảnh báo trước khi đăng nhập ghi đè. */
export function hasProgress(storage) { return listKeys(storage).some((k) => !IDENTITY_KEYS.includes(k)); }
export const saveSize = (save) => JSON.stringify(save).length;

// ---------------------------------------------------------------- màn vào cửa
/** Chế độ màn vào cửa: 'offline' (chưa có máy chủ → như cũ), 'back' (đã đăng nhập), 'login', 'claim' (nhân vật cũ chưa có mật khẩu), 'new'. */
export function entryMode({ apiOn, hasAcct, hasLegacy, wantLogin = false }) {
  if (!apiOn) return 'offline';
  if (hasAcct) return 'back';
  if (wantLogin) return 'login';
  return hasLegacy ? 'claim' : 'new';
}
/** Chế độ "tạo" tương ứng khi bấm "Chưa có nhân vật?" từ màn đăng nhập. */
export const signupMode = (hasLegacy) => (hasLegacy ? 'claim' : 'new');

/** Giao diện từng chế độ (chữ + ô nào hiện). */
export const MODE_UI = {
  offline: { title: 'Bước vào cửa chùa', sub: '', go: 'Vào chùa', pw: false, pw2: false, look: true, lock: false, note: 'Tên hiện trên đầu nhân vật. Chỉ lưu trong trình duyệt của bạn.' },
  back:    { title: 'Chào mừng trở lại', sub: '', go: 'Vào chùa', pw: false, pw2: false, look: true, lock: true, note: '' },
  login:   { title: 'Đăng nhập', sub: 'Nhập tên và mật khẩu nhân vật của bạn để vào đúng nhân vật đã chơi, ở bất kỳ máy nào.', go: 'Đăng nhập', pw: true, pw2: false, look: false, lock: false, note: '' },
  new:     { title: 'Tạo nhân vật', sub: 'Đặt tên và mật khẩu để giữ nhân vật và vào lại từ bất kỳ máy nào.', go: 'Tạo nhân vật & vào chùa', pw: true, pw2: true, look: true, lock: false, note: 'Hãy nhớ kỹ mật khẩu: hiện chưa có cách lấy lại.' },
  claim:   { title: 'Đặt mật khẩu cho nhân vật', sub: 'Nhân vật này đã tạo trên máy này từ trước. Đặt mật khẩu để giữ dữ liệu và chơi được ở máy khác.', go: 'Đặt mật khẩu & vào chùa', pw: true, pw2: true, look: true, lock: false, note: 'Hãy nhớ kỹ mật khẩu: hiện chưa có cách lấy lại.' },
};

/** Kiểm các ô trước khi gửi. → { ok, name } | { ok:false, error, field }. */
export function validateEntry(mode, { name, password, password2 } = {}) {
  if (mode === 'back' || mode === 'offline') return { ok: true, name: String(name || '') };
  const n = checkName(name); if (!n.ok) return { ...n, field: 'name' };
  const p = checkPassword(password, MODE_UI[mode] && MODE_UI[mode].pw2 ? password2 : undefined); if (!p.ok) return { ...p, field: p.error === 'pw_mismatch' ? 'pw2' : 'pw' };
  return { ok: true, name: n.name };
}

export const ACCT_MSG = {
  name_empty: 'Hãy nhập tên nhân vật.',
  name_bad: 'Tên không được chứa liên kết hoặc ký tự @.',
  pw_empty: 'Hãy nhập mật khẩu.',
  pw_short: 'Mật khẩu cần có ít nhất 6 ký tự.',
  pw_long: 'Mật khẩu tối đa 64 ký tự.',
  pw_mismatch: 'Hai ô mật khẩu chưa giống nhau.',
  exists: 'Nhân vật “{name}” với mật khẩu này đã có trên hệ thống nên không tạo mới được. Nếu là nhân vật của bạn, hãy bấm “Đăng nhập”; nếu không, hãy chọn mật khẩu khác.',
  bad_login: 'Sai tên hoặc mật khẩu.',
  too_many: 'Bạn đã thử sai quá nhiều lần. Vui lòng chờ khoảng 15 phút rồi thử lại.',
  network: 'Chưa kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.',
  timeout: 'Chưa kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.',
  api_disabled: 'Chưa cấu hình máy chủ lưu tài khoản.',
  no_crypto: 'Trình duyệt này chưa hỗ trợ mã hóa mật khẩu (cần mở trang bằng https).',
  too_big: 'Dữ liệu chơi quá lớn để lưu. Hãy báo cho quản trị.',
  busy: 'Máy chủ đang bận, hãy thử lại sau ít giây.',
  bad_token: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.',
  server_error: 'Máy chủ gặp lỗi, hãy thử lại sau.',
};
export const errMsg = (code, ctx = {}) => String(ACCT_MSG[code] || ACCT_MSG.server_error).replace('{name}', ctx.name || '');
/** Lỗi do NGƯỜI CHƠI tự sửa được (nhập sai, trùng tên, bị khóa tạm...). Mọi mã khác (network, timeout, http_5xx, server_error,
 *  unknown_action = máy chủ GAS chưa được cập nhật Accounts.gs, bad_request...) coi là SỰ CỐ MÁY CHỦ → không được chặn cửa chùa, cho "Chơi tạm". */
export const USER_ERRORS = new Set(['name_empty', 'name_bad', 'bad_name', 'pw_empty', 'pw_short', 'pw_long', 'pw_mismatch', 'exists', 'bad_login', 'too_many', 'too_big', 'no_crypto', 'bad_token']);
export const isNetworkError = (code) => !USER_ERRORS.has(code);
