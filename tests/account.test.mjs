// Tài khoản nhân vật (Phiên 53): logic thuần, máy chủ gas/Accounts.gs (chạy THẬT trong vm với Sheet/Cache/Lock giả) và client nhiều máy.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { webcrypto, pbkdf2Sync, createHash, randomUUID } from 'node:crypto';
import {
  ACCT, DEVICE_KEYS, IDENTITY_KEYS, isSyncKey, normName, checkName, checkPassword, deriveKey, hash32, listKeys, packSave, applySave, clearSyncKeys,
  hasProgress, entryMode, signupMode, validateEntry, MODE_UI, errMsg, isNetworkError,
} from '../js/engines/account.js';
import { createAccountClient, createAutoSync } from '../js/net/accountClient.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** localStorage giả */
class Store {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

// ---------------------------------------------------------------- máy chủ GAS thật trong vm, dịch vụ giả
function makeGas({ maxRows = 1000 } = {}) {
  let clock = 0;
  const sheets = {}, cacheMap = new Map();
  const mkSheet = (name) => {
    const rows = []; let max = maxRows;
    const sh = {
      name, rows,
      getLastRow: () => rows.length, getMaxRows: () => max, getLastColumn: () => (rows[0] ? rows[0].length : 1),
      insertRowsAfter: (_pos, n) => { max += n; },
      appendRow: (a) => { rows.push(a.slice()); },
      getRange: (r, c, nr = 1, nc = 1) => {
        const rg = {
          text: false,
          setNumberFormat() { rg.text = true; return rg; },
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const v = rows[r - 1 + i] && rows[r - 1 + i][c - 1 + j]; return v === undefined ? '' : v; })),
          setValues: (vals) => {
            if (r - 1 + nr > max) throw new Error('Tọa độ vượt cỡ sheet (chưa nới hàng)');
            vals.forEach((row, i) => row.forEach((x, j) => {
              let v = x;
              if (typeof v === 'string' && v.length > 50000) throw new Error('Ô quá 50.000 ký tự');
              if (!rg.text && typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) v = Number(v);   // Google Sheets tự đổi chuỗi số thành số nếu ô chưa ép văn bản
              const R = r - 1 + i; while (rows.length <= R) rows.push([]); rows[R][c - 1 + j] = v;
            }));
          },
        };
        return rg;
      },
      deleteRow: (n) => { rows.splice(n - 1, 1); },
    };
    return sh;
  };
  const ctx = {
    console, Date,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'SHEET_ID' ? 'sheet-1' : null), setProperty() {} }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = mkSheet(n)) }) },
    Session: { getScriptTimeZone: () => 'UTC' },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
      computeDigest: (_a, s) => Array.from(createHash('sha256').update(String(s), 'utf8').digest(), (b) => (b > 127 ? b - 256 : b)),
      getUuid: () => randomUUID(),
      formatDate: (d) => d.toISOString().slice(0, 19),
    },
    CacheService: { getScriptCache: () => ({ get: (k) => { const e = cacheMap.get(k); return e && e.exp > clock ? e.v : null; }, put: (k, v, sec = 600) => { cacheMap.set(k, { v: String(v), exp: clock + sec * 1000 }); }, remove: (k) => { cacheMap.delete(k); } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }) },
  };
  vm.createContext(ctx);
  for (const f of ['Code.gs', 'Storage.gs', 'Accounts.gs']) vm.runInContext(readFileSync(path.join(root, 'gas', f), 'utf8'), ctx, { filename: f });
  let calls = 0, lose = 0;
  const post = (action, payload = {}) => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify({ action, ...payload }) } }).getContent());
  /** Giống callApi: mỗi lần gọi đi qua doPost thật. `lose` = số phản hồi tiếp theo bị "mất" (máy chủ đã làm nhưng client không nhận được). */
  const call = async (action, payload = {}, opts = {}) => { calls++; const r = post(action, JSON.parse(JSON.stringify(payload))); if (lose > 0) { lose--; return { ok: false, error: 'network' }; } return r; };
  return {
    call, post, ctx, sheets, get calls() { return calls; }, advance: (ms) => { clock += ms; }, loseNext: (n = 1) => { lose = n; },
    accounts: () => sheets.Accounts, getVar: (n) => vm.runInContext(n, ctx),
  };
}

const IT = 1000;   // số vòng PBKDF2 trong test (cho nhanh); phía trên có test riêng với giá trị thật
function device(gas, preset = {}) {
  const storage = new Store();
  for (const [k, v] of Object.entries(preset)) storage.setItem(k, v);
  const client = createAccountClient({
    call: gas.call, storage, subtle: webcrypto.subtle, iter: IT, uuid: () => randomUUID(),
    getUserKey: () => { if (!storage.getItem('lgt.userKey')) storage.setItem('lgt.userKey', 'uk-' + randomUUID()); return storage.getItem('lgt.userKey'); },
  });
  return { storage, client };
}
const OVR = { 'lgt.color': 'lam', 'lgt.hair': 'bui' };
const newChar = (d, name, password, extra = {}) => d.client.create({ name, password, overrides: { ...OVR, ...extra } });

// ---------------------------------------------------------------- logic thuần (js/engines/account.js)
test('normName: không phân biệt hoa/thường, gộp khoảng trắng, NFC (dấu tiếng Việt viết sẵn = tổ hợp)', () => {
  assert.equal(normName('  Minh   AN '), 'minh an');
  assert.equal(normName('Nguyễn'), normName('Nguyễn'));
  assert.notEqual(normName('Ân'), normName('An'), 'khác dấu là khác tên');
  assert.equal(normName(null), '');
});
test('checkName: ≤ 20 ký tự, bỏ ký tự điều khiển/<>, chặn link và @, rỗng báo lỗi', () => {
  assert.deepEqual(checkName('  Minh   An '), { ok: true, name: 'Minh An' });
  assert.equal(checkName('a'.repeat(50)).name.length, 20);
  assert.equal(checkName('<b>An</b>').name, 'b An /b');
  for (const bad of ['http://x.vn', 'www.abc', 'a@b']) assert.equal(checkName(bad).error, 'name_bad', bad);
  for (const empty of ['', '   ', null, undefined, '​​']) assert.equal(checkName(empty).error, 'name_empty', String(empty));
  assert.equal(Array.from(checkName('🪷'.repeat(30)).name).length, 20, 'cắt theo ký tự Unicode, không cắt đôi cặp thay thế');
});
test('checkPassword: 6–64 ký tự, nhập lại phải khớp, không cắt khoảng trắng', () => {
  assert.equal(checkPassword('').error, 'pw_empty'); assert.equal(checkPassword('12345').error, 'pw_short');
  assert.equal(checkPassword('x'.repeat(65)).error, 'pw_long'); assert.equal(checkPassword('123456').ok, true);
  assert.equal(checkPassword('abcdef', 'abcdeg').error, 'pw_mismatch'); assert.equal(checkPassword('abcdef', 'abcdef').ok, true);
  assert.equal(checkPassword('      ').ok, true, 'toàn dấu cách vẫn là mật khẩu hợp lệ (không tự cắt)');
});
test('deriveKey: đúng PBKDF2-SHA256 (muối = tên chuẩn hóa), hoa/thường của TÊN không đổi khóa, mật khẩu thì có', async () => {
  const k = await deriveKey('Minh An', 'matkhau1', webcrypto.subtle);
  assert.match(k, /^[0-9a-f]{64}$/);
  assert.equal(k, pbkdf2Sync(Buffer.from('matkhau1'.normalize('NFC')), Buffer.from('lgt-acct-v1|minh an'), ACCT.ITER, 32, 'sha256').toString('hex'));
  assert.equal(await deriveKey('  minh   AN', 'matkhau1', webcrypto.subtle), k);
  assert.notEqual(await deriveKey('Minh An', 'Matkhau1', webcrypto.subtle), k, 'mật khẩu phân biệt hoa/thường');
  assert.notEqual(await deriveKey('Minh Anh', 'matkhau1', webcrypto.subtle), k);
  await assert.rejects(() => deriveKey('a', 'b', null), (e) => e.code === 'no_crypto');
});
test('isSyncKey: mọi khóa lgt.* là dữ liệu game, trừ cài đặt thiết bị; khóa lạ bị bỏ', () => {
  for (const k of ['lgt.wallet', 'lgt.la', 'lgt.land', 'lgt.furni', 'lgt.prog', 'lgt.story', 'lgt.npc', 'lgt.profile', 'lgt.userKey', 'lgt.name', 'lgt.fish', 'lgt.loc', 'lgt.den', 'lgt.nhang', 'lgt.kinh', 'lgt.xam36', 'lgt.iching', 'lgt.act', 'lgt.noiSinhToaDo']) assert.equal(isSyncKey(k), true, k);
  for (const k of DEVICE_KEYS) assert.equal(isSyncKey(k), false, k);
  for (const k of ['lgt.sound', 'lgt.vol', 'lgt.vfx', 'lgt.perf', 'lgt.mm', 'lgt.tut', 'lgt.khinhHint', 'lgt.acct']) assert.ok(DEVICE_KEYS.includes(k), k);
  for (const k of ['other.key', 'lgt.', 'lgt.a b', 'LGT.x', '', null, 5, 'lgt.' + 'x'.repeat(50)]) assert.equal(isSyncKey(k), false, String(k));
});
test('DEVICE_KEYS ở client = ACCT_DEVICE_KEYS ở gas/Accounts.gs (hai nơi phải giống nhau)', () => {
  assert.deepEqual([...makeGas().getVar('ACCT_DEVICE_KEYS')], DEVICE_KEYS);
});
test('mọi khóa lgt.* mà mã nguồn dùng: cài đặt thiết bị nằm trong DEVICE_KEYS, còn lại được đồng bộ', () => {
  const seen = new Set();
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) for (const m of readFileSync(p, 'utf8').matchAll(/['"`](lgt\.[A-Za-z0-9_.-]+)['"`]/g)) seen.add(m[1]); } };
  walk(path.join(root, 'js'));
  for (const k of ['lgt.wallet', 'lgt.la', 'lgt.land', 'lgt.furni', 'lgt.prog', 'lgt.story', 'lgt.npc', 'lgt.profile', 'lgt.name', 'lgt.color', 'lgt.hair', 'lgt.userKey']) assert.ok(seen.has(k) && isSyncKey(k), 'dữ liệu game ' + k);
  for (const k of ['lgt.sound', 'lgt.vol', 'lgt.vfx', 'lgt.perf', 'lgt.mm', 'lgt.tut', 'lgt.khinhHint']) assert.ok(seen.has(k) && DEVICE_KEYS.includes(k), 'cài đặt thiết bị ' + k);
});

test('packSave / applySave: gói đủ khóa game, bỏ cài đặt thiết bị, overrides ghi đè mà chưa đụng storage; mở thì thay toàn bộ', () => {
  const s = new Store(); s.setItem('lgt.wallet', '{"sen":5}'); s.setItem('lgt.sound', '0'); s.setItem('lgt.acct', '{"token":"x"}'); s.setItem('other', 'y'); s.setItem('lgt.name', 'An');
  const p = packSave(s, { 'lgt.color': 'lam', 'lgt.perf': '9', 'bad key': 'z', 'lgt.hair': null });
  assert.deepEqual(Object.keys(p.d), ['lgt.color', 'lgt.name', 'lgt.wallet']);
  assert.equal(s.getItem('lgt.color'), null, 'overrides chưa ghi vào storage');
  const t = new Store(); t.setItem('lgt.old', '1'); t.setItem('lgt.sound', '0'); t.setItem('other', 'keep');
  applySave(t, p);
  assert.equal(t.getItem('lgt.old'), null, 'khóa game cũ bị thay'); assert.equal(t.getItem('lgt.sound'), '0', 'cài đặt thiết bị giữ nguyên'); assert.equal(t.getItem('other'), 'keep');
  assert.equal(t.getItem('lgt.wallet'), '{"sen":5}'); assert.equal(t.getItem('lgt.acct'), null, 'không bao giờ nhận lgt.acct');
  clearSyncKeys(t); assert.deepEqual(listKeys(t), []); assert.equal(t.getItem('lgt.sound'), '0');
  assert.deepEqual(packSave(new Store()), { v: 1, d: {} });
});
test('hasProgress: chỉ danh tính (tên/màu/kiểu đầu/userKey) thì chưa tính là đã chơi', () => {
  const s = new Store(); for (const k of IDENTITY_KEYS) s.setItem(k, 'x'); s.setItem('lgt.sound', '1');
  assert.equal(hasProgress(s), false); s.setItem('lgt.wallet', '{}'); assert.equal(hasProgress(s), true);
});
test('hash32: ổn định, khác khi nội dung khác', () => {
  assert.equal(hash32('abc'), hash32('abc')); assert.notEqual(hash32('abc'), hash32('abd')); assert.match(hash32(''), /^[0-9a-f]{8}$/);
});
test('entryMode: chưa có máy chủ → offline; đã đăng nhập → back; nhân vật cũ → claim; chưa gì → new; chọn đăng nhập → login', () => {
  assert.equal(entryMode({ apiOn: false, hasAcct: true, hasLegacy: true }), 'offline');
  assert.equal(entryMode({ apiOn: true, hasAcct: true, hasLegacy: true }), 'back');
  assert.equal(entryMode({ apiOn: true, hasAcct: false, hasLegacy: true }), 'claim');
  assert.equal(entryMode({ apiOn: true, hasAcct: false, hasLegacy: false }), 'new');
  assert.equal(entryMode({ apiOn: true, hasAcct: false, hasLegacy: true, wantLogin: true }), 'login');
  assert.equal(signupMode(true), 'claim'); assert.equal(signupMode(false), 'new');
});
test('validateEntry: new/claim cần tên + mật khẩu khớp; login chỉ cần tên + mật khẩu; back/offline không đòi gì', () => {
  assert.equal(validateEntry('new', { name: '', password: '123456', password2: '123456' }).error, 'name_empty');
  assert.equal(validateEntry('new', { name: 'An', password: '123', password2: '123' }).error, 'pw_short');
  const mm = validateEntry('claim', { name: 'An', password: '123456', password2: '654321' }); assert.equal(mm.error, 'pw_mismatch'); assert.equal(mm.field, 'pw2');
  assert.deepEqual(validateEntry('new', { name: ' An ', password: '123456', password2: '123456' }), { ok: true, name: 'An' });
  assert.equal(validateEntry('login', { name: 'An', password: '123456', password2: 'khác' }).ok, true, 'đăng nhập không có ô nhập lại');
  assert.equal(validateEntry('back', {}).ok, true); assert.equal(validateEntry('offline', {}).ok, true);
  assert.ok(MODE_UI.new.pw2 && MODE_UI.claim.pw2 && !MODE_UI.login.pw2 && !MODE_UI.back.pw);
});
test('errMsg: báo trùng nêu tên nhân vật; mã lạ → lỗi chung; lỗi mạng cho phép chơi tạm', () => {
  assert.match(errMsg('exists', { name: 'Minh An' }), /“Minh An”.*đã có trên hệ thống/);
  assert.equal(errMsg('zzz'), errMsg('server_error'));
  assert.ok(isNetworkError('network') && isNetworkError('timeout') && !isNetworkError('exists') && !isNetworkError('bad_login'));
  // Máy chủ GAS CŨ (chưa dán Accounts.gs) trả unknown_action; cũng như http_5xx, JSON hỏng...: KHÔNG được khóa người chơi ngoài cửa chùa
  for (const c of ['unknown_action', 'http_500', 'http_404', 'unknown', 'server_error', 'bad_request', 'api_disabled', 'busy']) assert.equal(isNetworkError(c), true, c);
  for (const c of ['name_empty', 'name_bad', 'bad_name', 'pw_empty', 'pw_short', 'pw_long', 'pw_mismatch', 'exists', 'bad_login', 'too_many', 'too_big', 'no_crypto', 'bad_token']) assert.equal(isNetworkError(c), false, c);
});

// ---------------------------------------------------------------- máy chủ gas/Accounts.gs
test('GAS: tạo nhân vật; cùng tên + cùng mật khẩu báo trùng (kể cả hoa/thường); cùng tên khác mật khẩu vẫn tạo được', async () => {
  const gas = makeGas(), a = device(gas), b = device(gas), c = device(gas), d = device(gas);
  const r1 = await newChar(a, 'Minh An', 'matkhau1'); assert.equal(r1.ok, true); assert.equal(r1.acct.rev, 1);
  const r2 = await newChar(b, 'Minh An', 'matkhau1'); assert.equal(r2.ok, false); assert.equal(r2.error, 'exists');
  assert.match(errMsg(r2.error, { name: r2.name }), /“Minh An”/);
  assert.equal((await newChar(c, 'minh   AN', 'matkhau1')).error, 'exists', 'tên viết hoa/thường khác vẫn là trùng');
  assert.equal((await newChar(d, 'Minh An', 'matkhau2')).ok, true, 'cùng tên nhưng khác mật khẩu = nhân vật khác');
  assert.equal(gas.accounts().rows.length, 3, 'tiêu đề + 2 nhân vật; lần báo trùng không tạo hàng');
  assert.equal(b.client.account(), null, 'tạo thất bại thì máy không bị gắn tài khoản');
});
test('GAS: trong Sheet không có mật khẩu hay khóa dùng lại được; tên "007" không mất số 0 đầu; token chỉ lưu dạng băm', async () => {
  const gas = makeGas(), a = device(gas);
  const key = await deriveKey('007', 'matkhau1', webcrypto.subtle, IT);
  const r = await newChar(a, '007', 'matkhau1'); assert.equal(r.ok, true);
  const row = gas.accounts().rows[1], dump = JSON.stringify(row);
  assert.equal(row[2], '007', 'ô được ép văn bản nên "007" không bị đổi thành số 7'); assert.equal(row[6], '1');
  assert.ok(!dump.includes(key), 'khóa gửi lên không nằm nguyên trong Sheet'); assert.ok(!dump.includes('matkhau1'));
  assert.equal(row[1], createHash('sha256').update('lgt-acct-v1|' + key).digest('hex'));
  assert.ok(!dump.includes(a.client.account().token), 'token không nằm nguyên trong Sheet'); assert.ok(JSON.parse(row[5])[0].h.length === 64);
});
test('GAS: gửi lại đúng yêu cầu tạo (mất phản hồi, cùng aid) → thành công, không báo trùng oan; người khác thì vẫn báo trùng', async () => {
  const gas = makeGas(), a = device(gas);
  gas.loseNext(1);
  const lost = await newChar(a, 'An', 'matkhau1'); assert.equal(lost.ok, false, 'client không nhận được phản hồi');
  assert.equal(gas.accounts().rows.length, 2, 'nhưng máy chủ đã tạo');
  // client thử lại với CÙNG aid (callApi tự thử lại 1 lần): mô phỏng bằng gọi thẳng
  const aid = gas.accounts().rows[1][0], key = await deriveKey('An', 'matkhau1', webcrypto.subtle, IT);
  const again = await gas.call('acctCreate', { aid, name: 'An', key, save: { v: 1, d: { 'lgt.name': 'An' } } });
  assert.equal(again.ok, true); assert.equal(again.rev, 1); assert.equal(gas.accounts().rows.length, 2);
  const other = await gas.call('acctCreate', { aid: randomUUID(), name: 'An', key, save: { v: 1, d: {} } }); assert.equal(other.error, 'exists');
});
test('GAS: đăng nhập đúng trả bản lưu + token mới; sai mật khẩu / sai tên / tên không tồn tại đều chỉ báo "bad_login"', async () => {
  const gas = makeGas(), a = device(gas), b = device(gas);
  await newChar(a, 'An', 'matkhau1', { 'lgt.wallet': '{"sen":42}' });
  const r = await b.client.login({ name: 'An', password: 'matkhau1' }); assert.equal(r.ok, true);
  assert.equal(r.res.name, 'An'); assert.equal(r.res.save.d['lgt.wallet'], '{"sen":42}'); assert.notEqual(r.res.token, a.client.account().token);
  assert.equal(b.client.account(), null, 'login CHƯA ghi gì vào máy (adopt mới ghi)');
  assert.equal((await b.client.login({ name: 'An', password: 'sai-mat-khau' })).error, 'bad_login');
  assert.equal((await b.client.login({ name: 'Bình', password: 'matkhau1' })).error, 'bad_login');
  assert.equal((await b.client.login({ name: 'An', password: '123' })).error, 'pw_short', 'sai định dạng bị chặn ngay ở máy, không gọi máy chủ');
  // khóa đúng nhưng khai tên khác (kẻ cố dùng lại khóa) → từ chối
  const key = await deriveKey('An', 'matkhau1', webcrypto.subtle, IT);
  assert.equal((await gas.call('acctLogin', { name: 'Bình', key })).error, 'bad_login');
});
test('GAS: chống đoán mật khẩu — sai 15 lần thì khóa cả khi nhập đúng, hết 15 phút thì mở; đăng nhập đúng xóa bộ đếm', async () => {
  const gas = makeGas(), a = device(gas), b = device(gas);
  await newChar(a, 'An', 'matkhau1');
  for (let i = 0; i < 14; i++) assert.equal((await b.client.login({ name: 'An', password: 'sai' + i + 'xx' })).error, 'bad_login');
  assert.equal((await b.client.login({ name: 'An', password: 'matkhau1' })).ok, true, 'còn dưới ngưỡng: đúng thì vào, và xóa bộ đếm');
  for (let i = 0; i < 15; i++) await b.client.login({ name: 'An', password: 'sai' + i + 'yy' });
  assert.equal((await b.client.login({ name: 'An', password: 'matkhau1' })).error, 'too_many');
  assert.equal((await newChar(device(gas), 'An', 'matkhau1')).error, 'too_many', 'đoán qua màn tạo cũng bị chặn');
  gas.advance(15 * 60 * 1000 + 1000);
  assert.equal((await b.client.login({ name: 'An', password: 'matkhau1' })).ok, true, 'hết hạn khóa');
  assert.equal((await newChar(device(gas), 'Khác', 'matkhau1')).ok, true, 'bộ đếm theo TÊN, người khác không bị ảnh hưởng');
});
test('GAS: báo trùng khi tạo cũng được tính như một lần đoán sai', async () => {
  const gas = makeGas(); await newChar(device(gas), 'An', 'matkhau1');
  for (let i = 0; i < 15; i++) assert.equal((await newChar(device(gas), 'An', 'matkhau1')).error, i < 15 ? 'exists' : 'too_many');
  assert.equal((await newChar(device(gas), 'An', 'matkhau1')).error, 'too_many');
});

// ---------------------------------------------------------------- nhiều máy: dữ liệu theo nhân vật
test('Máy A tạo + chơi, máy B đăng nhập → thấy ĐÚNG dữ liệu (kể cả userKey), không nhận cài đặt thiết bị của A', async () => {
  const gas = makeGas();
  const A = device(gas, { 'lgt.wallet': '{"sen":120}', 'lgt.la': '{"la":3}', 'lgt.land': '{"x":1}', 'lgt.sound': '0', 'lgt.perf': '2', 'lgt.profile': '{"hoTen":"Minh An"}' });
  const r = await newChar(A, 'Minh An', 'matkhau1'); assert.equal(r.ok, true);
  const B = device(gas, { 'lgt.sound': '1', 'lgt.old': 'xoa-di' });
  const login = await B.client.login({ name: 'minh an', password: 'matkhau1' }); assert.equal(login.ok, true);
  B.client.adopt(login.res);
  for (const k of ['lgt.wallet', 'lgt.la', 'lgt.land', 'lgt.profile', 'lgt.userKey', 'lgt.color', 'lgt.hair']) assert.equal(B.storage.getItem(k), A.storage.getItem(k) ?? B.storage.getItem(k), k);
  assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":120}'); assert.equal(B.storage.getItem('lgt.userKey'), A.storage.getItem('lgt.userKey'));
  assert.equal(B.storage.getItem('lgt.color'), 'lam'); assert.equal(B.storage.getItem('lgt.hair'), 'bui'); assert.equal(B.storage.getItem('lgt.name'), 'Minh An', 'tên chuẩn theo tài khoản (không theo cách gõ)');
  assert.equal(B.storage.getItem('lgt.sound'), '1', 'cài đặt thiết bị của B giữ nguyên'); assert.equal(B.storage.getItem('lgt.perf'), null, 'cài đặt thiết bị của A không sang B');
  assert.equal(B.storage.getItem('lgt.old'), null, 'dữ liệu game cũ của B bị thay bằng dữ liệu tài khoản');
  assert.equal(B.client.dirty(), false); assert.equal(B.client.account().rev, 1);
});
test('Nhân vật cũ (đã có dữ liệu trên máy, chưa mật khẩu) đặt mật khẩu → dữ liệu hiện có được giữ và lưu lên tài khoản', async () => {
  const gas = makeGas();
  const old = device(gas, { 'lgt.name': 'Thầy Nam', 'lgt.color': 'nau', 'lgt.hair': 'troc', 'lgt.wallet': '{"sen":999}', 'lgt.story': '{"step":"done"}' });
  assert.equal(old.client.hasProgress(), true);
  const r = await old.client.create({ name: 'Thầy Nam', password: 'matkhau1', overrides: { 'lgt.name': 'Thầy Nam', 'lgt.color': 'nau', 'lgt.hair': 'troc' } });
  assert.equal(r.ok, true); assert.equal(old.storage.getItem('lgt.wallet'), '{"sen":999}'); assert.ok(old.storage.getItem('lgt.userKey'), 'tự có userKey để hồ sơ đi theo');
  const other = device(gas); const l = await other.client.login({ name: 'Thầy Nam', password: 'matkhau1' }); other.client.adopt(l.res);
  assert.equal(other.storage.getItem('lgt.wallet'), '{"sen":999}'); assert.equal(other.storage.getItem('lgt.story'), '{"step":"done"}');
  // máy thứ hai cũng có nhân vật cũ trùng tên + đặt cùng mật khẩu → báo trùng, KHÔNG tạo đè
  const dup = device(gas, { 'lgt.name': 'Thầy Nam', 'lgt.wallet': '{"sen":1}' });
  assert.equal((await dup.client.create({ name: 'Thầy Nam', password: 'matkhau1' })).error, 'exists');
  assert.equal(dup.storage.getItem('lgt.wallet'), '{"sen":1}', 'báo trùng không đụng dữ liệu trên máy');
});
test('Đẩy / kéo: máy A lưu → máy B (không đổi gì) mở trang thì tự nhận bản mới; chưa đổi gì thì không gọi lưu', async () => {
  const gas = makeGas(), A = device(gas), B = device(gas);
  await newChar(A, 'An', 'matkhau1', { 'lgt.wallet': '{"sen":1}' });
  B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res);
  const before = gas.calls; assert.deepEqual(await A.client.push(), { ok: true, same: true }); assert.equal(gas.calls, before, 'không đổi gì → không gọi máy chủ');
  A.storage.setItem('lgt.wallet', '{"sen":50}'); assert.equal(A.client.dirty(), true);
  const p = await A.client.push(); assert.equal(p.ok, true); assert.equal(p.rev, 2); assert.equal(A.client.dirty(), false);
  assert.deepEqual(await B.client.pull(), { ok: true, changed: true }); assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":50}'); assert.equal(B.client.account().rev, 2);
  assert.deepEqual(await B.client.pull(), { ok: true, changed: false });
});
test('Xung đột: cả hai máy cùng đổi → máy kéo thấy conflict (KHÔNG ghi đè), máy đẩy muộn bị stale; chọn "dùng bản kia" hoặc "giữ máy này"', async () => {
  const gas = makeGas(), A = device(gas), B = device(gas);
  await newChar(A, 'An', 'matkhau1', { 'lgt.wallet': '{"sen":1}' });
  B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res);
  A.storage.setItem('lgt.wallet', '{"sen":100}'); await A.client.push();            // A lưu rev 2
  B.storage.setItem('lgt.wallet', '{"sen":7}');                                      // B cũng có thay đổi chưa lưu
  const events = []; B.client.on((e) => events.push(e));
  const pull = await B.client.pull(); assert.equal(pull.conflict, true); assert.deepEqual(events, ['conflict']); assert.equal(B.client.state.conflict, true);
  assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":7}', 'không tự ghi đè tiến trình chưa lưu của máy B');
  const st = await B.client.push(); assert.equal(st.error, 'stale'); assert.equal(st.serverRev, 2);
  // chọn dùng bản máy kia
  assert.equal((await B.client.useServer()).ok, true); assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":100}'); assert.equal(B.client.state.conflict, false); assert.equal(B.client.dirty(), false);
  // làm lại tình huống, chọn giữ máy này
  B.storage.setItem('lgt.wallet', '{"sen":8}'); A.storage.setItem('lgt.wallet', '{"sen":200}'); await A.client.push();
  assert.equal((await B.client.pull()).conflict, true);
  const kl = await B.client.keepLocal(); assert.equal(kl.ok, true); assert.equal(B.client.state.conflict, false);
  assert.equal((await A.client.pull()).changed, true, 'A (không đổi gì) nhận bản mà B vừa chọn giữ'); assert.equal(A.storage.getItem('lgt.wallet'), '{"sen":8}');
});
test('Đẩy lại đúng lần lưu (mất phản hồi): không báo stale oan và không tăng rev hai lần', async () => {
  const gas = makeGas(), A = device(gas);
  await newChar(A, 'An', 'matkhau1'); A.storage.setItem('lgt.wallet', '{"sen":3}');
  const a = A.client.account(), save = packSave(A.storage), sid = randomUUID();
  const first = await gas.call('acctSave', { aid: a.aid, token: a.token, base: 1, sid, save }); assert.equal(first.rev, 2);
  const retry = await gas.call('acctSave', { aid: a.aid, token: a.token, base: 1, sid, save }); assert.equal(retry.ok, true); assert.equal(retry.rev, 2, 'cùng sid → coi như đã xong');
  const other = await gas.call('acctSave', { aid: a.aid, token: a.token, base: 1, sid: randomUUID(), save: { v: 1, d: { 'lgt.wallet': '{"sen":9}' } } }); assert.equal(other.error, 'stale');
});
test('Trong lúc đang gửi mà người chơi tiến triển thêm → phần mới VẪN còn "chưa lưu" (không đánh dấu nhầm là đã lưu)', async () => {
  const gas = makeGas(), A = device(gas); await newChar(A, 'An', 'matkhau1');
  A.storage.setItem('lgt.wallet', '{"sen":1}');
  const realCall = gas.call; let injected = false;
  const slow = createAccountClient({ call: async (...args) => { const r = await realCall(...args); if (!injected && args[0] === 'acctSave') { injected = true; A.storage.setItem('lgt.wallet', '{"sen":2}'); } return r; }, storage: A.storage, subtle: webcrypto.subtle, iter: IT, uuid: randomUUID });
  const r = await slow.push(); assert.equal(r.ok, true);
  assert.equal(slow.dirty(), true, 'sen=2 chưa lên máy chủ');
  assert.equal((await slow.push()).ok, true); assert.equal(slow.dirty(), false);
  const B = device(gas); B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res); assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":2}');
});
test('Lưu bản lớn: chia ô ≤ 45.000, không cắt đôi emoji ở ranh giới, đọc lại đúng từng ký tự; quá 150.000 thì báo too_big', async () => {
  const gas = makeGas(), A = device(gas); await newChar(A, 'An', 'matkhau1');
  const big = 'a'.repeat(ACCT.SAVE_MAX - 20000 - 2) + '🪷'.repeat(5000);   // ~ 148.000 ký tự, có cặp thay thế khắp nơi
  const cut = 'x'.repeat(44999) + '🪷' + 'y'.repeat(50000);                 // emoji đúng vị trí cắt (ô 1 kết thúc giữa cặp thay thế)
  for (const payload of [cut, big.slice(0, 120000)]) {
    A.storage.setItem('lgt.furni', payload);
    const r = await A.client.push(); assert.equal(r.ok, true, r.error);
    const row = gas.accounts().rows[1]; for (let i = 9; i < 13; i++) assert.ok(String(row[i] ?? '').length <= 45000, 'ô ' + i);
    const B = device(gas); B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res);
    assert.equal(B.storage.getItem('lgt.furni'), payload, 'đọc lại giống hệt');
  }
  A.storage.setItem('lgt.furni', 'z'.repeat(ACCT.SAVE_MAX + 10)); assert.equal((await A.client.push()).error, 'too_big', 'client chặn trước');
  const a = A.client.account();
  assert.equal((await gas.call('acctSave', { aid: a.aid, token: a.token, base: 99, force: true, save: { v: 1, d: { 'lgt.furni': 'z'.repeat(ACCT.SAVE_MAX + 10) } } })).error, 'too_big', 'máy chủ cũng chặn');
});
test('Máy chủ làm sạch bản lưu: bỏ lgt.acct/cài đặt thiết bị/khóa lạ/giá trị không phải chuỗi; yêu cầu sai định dạng bị từ chối', async () => {
  const gas = makeGas(), A = device(gas); await newChar(A, 'An', 'matkhau1'); const a = A.client.account();
  const r = await gas.call('acctSave', { aid: a.aid, token: a.token, base: 1, save: { v: 1, d: { 'lgt.acct': 'TOKEN', 'lgt.sound': '0', 'lgt.ok': '1', 'evil': 'x', 'lgt.obj': { a: 1 }, 'lgt.n': 5 } } }); assert.equal(r.ok, true);
  const got = (await gas.call('acctLoad', { aid: a.aid, token: a.token, rev: -1 })).save.d; assert.deepEqual(Object.keys(got), ['lgt.ok']);
  assert.equal((await gas.call('acctSave', { aid: a.aid, token: a.token, base: 2, save: null })).error, 'bad_request');
  assert.equal((await gas.call('acctSave', { aid: 'x', token: a.token, base: 2, save: { v: 1, d: {} } })).error, 'bad_request');
  assert.equal((await gas.call('acctCreate', { aid: randomUUID(), name: 'x@y.vn', key: 'a'.repeat(64), save: { v: 1, d: {} } })).error, 'bad_name');
  assert.equal((await gas.call('acctCreate', { aid: randomUUID(), name: 'Ok', key: 'KHONG-PHAI-HEX', save: { v: 1, d: {} } })).error, 'bad_request');
  assert.equal((await gas.call('acctLogin', { name: 'Ok', key: '123' })).error, 'bad_request');
  assert.equal((await gas.post('khong-co')).error, 'unknown_action');
});
test('Token: sai/hết hạn → bad_token; đăng xuất chỉ thu hồi token của máy đó; giữ tối đa 8 máy (máy cũ nhất bị loại)', async () => {
  const gas = makeGas(), A = device(gas), B = device(gas); await newChar(A, 'An', 'matkhau1');
  B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res);
  const a = A.client.account(), b = B.client.account();
  assert.equal((await gas.call('acctLoad', { aid: a.aid, token: 'f'.repeat(32), rev: 1 })).error, 'bad_token');
  assert.equal((await gas.call('acctLoad', { aid: a.aid, token: 'khong-hop-le', rev: 1 })).error, 'bad_token');
  assert.equal((await gas.call('acctLoad', { aid: randomUUID(), token: a.token, rev: 1 })).error, 'bad_token');
  assert.equal((await B.client.logout()).ok, true);
  assert.equal(B.client.account(), null); assert.equal(B.storage.getItem('lgt.wallet'), null);
  assert.equal((await gas.call('acctLoad', { aid: b.aid, token: b.token, rev: 1 })).error, 'bad_token', 'token máy B đã bị thu hồi');
  assert.equal((await A.client.pull()).ok, true, 'máy A vẫn đăng nhập');
  for (let i = 0; i < 8; i++) await gas.call('acctLogin', { name: 'An', key: await deriveKey('An', 'matkhau1', webcrypto.subtle, IT) });
  assert.equal((await A.client.pull()).error, 'bad_token', 'đăng nhập từ 8 máy khác → máy A (cũ nhất) bị loại');
  assert.equal(A.client.account(), null); assert.equal(A.client.state.expired, true, 'báo hết hạn để màn vào cửa hỏi lại');
});
test('Đăng xuất: xóa dữ liệu game khỏi máy (giữ cài đặt thiết bị); còn thay đổi chưa lưu mà mất mạng → hỏi trước (unsynced), force thì vẫn thoát', async () => {
  const gas = makeGas(), A = device(gas, { 'lgt.sound': '0' }); await newChar(A, 'An', 'matkhau1', { 'lgt.wallet': '{"sen":1}' });
  A.storage.setItem('lgt.wallet', '{"sen":9}');
  gas.loseNext(1);                                            // lần lưu cuối cùng lúc đăng xuất bị mất mạng
  const r1 = await A.client.logout(); assert.equal(r1.error, 'unsynced'); assert.ok(A.client.account(), 'chưa thoát');
  assert.equal(A.storage.getItem('lgt.wallet'), '{"sen":9}');
  assert.equal((await A.client.logout({ force: true })).ok, true);
  assert.deepEqual(listKeys(A.storage), []); assert.equal(A.storage.getItem('lgt.sound'), '0'); assert.equal(A.storage.getItem('lgt.acct'), null);
  const A2 = device(gas), B = device(gas), C = device(gas); await newChar(A2, 'Bình', 'matkhau1', { 'lgt.wallet': '{"sen":1}' }); A2.storage.setItem('lgt.wallet', '{"sen":5}');
  assert.equal((await A2.client.logout()).ok, true, 'có mạng: lưu bản mới nhất rồi mới thoát');
  B.client.adopt((await B.client.login({ name: 'Bình', password: 'matkhau1' })).res); assert.equal(B.storage.getItem('lgt.wallet'), '{"sen":5}'); void C;
});
test('Tạo nhân vật thất bại vì mạng/máy chủ: báo lỗi mạng, máy không bị gắn tài khoản, dữ liệu máy giữ nguyên', async () => {
  const gas = makeGas(), A = device(gas, { 'lgt.name': 'An', 'lgt.wallet': '{"sen":4}' });
  gas.loseNext(1); const r = await newChar(A, 'An', 'matkhau1'); assert.equal(r.error, 'network'); assert.ok(isNetworkError(r.error));
  assert.equal(A.client.account(), null); assert.equal(A.storage.getItem('lgt.wallet'), '{"sen":4}');
  const off = createAccountClient({ call: async () => ({ ok: false, error: 'api_disabled' }), storage: new Store(), subtle: webcrypto.subtle, iter: IT });
  assert.equal((await off.create({ name: 'An', password: 'matkhau1' })).error, 'api_disabled');
  const nocrypto = createAccountClient({ call: gas.call, storage: new Store(), subtle: undefined, iter: IT });
  assert.equal((await nocrypto.create({ name: 'An', password: 'matkhau1' })).error, 'no_crypto');
  assert.equal((await nocrypto.login({ name: 'An', password: 'matkhau1' })).error, 'no_crypto');
});
test('GAS cũ chưa có Accounts.gs: tạo/đăng nhập đều báo lỗi máy chủ (cho Chơi tạm), không đụng dữ liệu máy, không ném lỗi', async () => {
  const old = async (action) => (action.startsWith('acct') ? { ok: false, error: 'unknown_action' } : { ok: true });
  const st = new Store(); st.setItem('lgt.name', 'An'); st.setItem('lgt.wallet', '{"sen":5}');
  const c = createAccountClient({ call: old, storage: st, subtle: webcrypto.subtle, iter: IT });
  const r1 = await c.create({ name: 'An', password: 'matkhau1' }), r2 = await c.login({ name: 'An', password: 'matkhau1' });
  for (const r of [r1, r2]) { assert.equal(r.ok, false); assert.equal(r.error, 'unknown_action'); assert.equal(isNetworkError(r.error), true); assert.match(errMsg(r.error), /Máy chủ gặp lỗi/); }
  assert.equal(st.getItem('lgt.wallet'), '{"sen":5}'); assert.equal(c.account(), null);
});
test('Sheet vượt cỡ: tạo nhiều tài khoản hơn số hàng của sheet vẫn được (tự nới hàng)', async () => {
  const gas = makeGas({ maxRows: 3 });
  for (let i = 0; i < 4; i++) assert.equal((await newChar(device(gas), 'N' + i, 'matkhau1')).ok, true, 'tài khoản ' + i);
  assert.equal(gas.accounts().rows.length, 5);
});
test('Vá cũ: dữ liệu trên Sheet có số rev kiểu số (Sheets tự đổi) hoặc hỏng cũng không làm hỏng đăng nhập/lưu', async () => {
  const gas = makeGas(), A = device(gas); await newChar(A, 'An', 'matkhau1');
  gas.accounts().rows[1][6] = 1;                              // rev thành SỐ như khi ô chưa ép văn bản
  A.storage.setItem('lgt.wallet', '{"sen":2}'); assert.equal((await A.client.push()).rev, 2);
  gas.accounts().rows[1][9] = '{hong json';                   // bản lưu hỏng
  const B = device(gas); const r = await B.client.login({ name: 'An', password: 'matkhau1' }); assert.equal(r.ok, true); assert.deepEqual(r.res.save, { v: 1, d: {} });
});

// ---------------------------------------------------------------- tự động lưu
function fakeEnv(startAt = 1_000_000) {
  let t = startAt, timer = null; const handlers = {};
  const doc = { hidden: false, addEventListener: (ev, f) => { handlers[ev] = f; } }, win = { addEventListener: (ev, f) => { handlers[ev] = f; } };
  return { doc, win, handlers, setInterval: (f) => { timer = f; return 1; }, clearInterval: () => { timer = null; }, now: () => t, advance: (ms) => { t += ms; }, fire: () => timer && timer(), get armed() { return !!timer; } };
}
test('createAutoSync: chỉ lưu khi có thay đổi VÀ đã đủ 45 giây; rời/ẩn trang thì lưu ngay; không đổi gì thì không gọi máy chủ', async () => {
  const gas = makeGas(), A = device(gas); await newChar(A, 'An', 'matkhau1');
  const env = fakeEnv(), sync = createAutoSync(A.client, env);
  sync.start(); assert.equal(env.armed, true); sync.start();                                  // gọi lại không đăng ký thêm
  let c = gas.calls; await sync.tick(); assert.equal(gas.calls, c, 'không đổi gì → không gọi');
  A.storage.setItem('lgt.wallet', '{"sen":1}'); await sync.tick(); assert.equal(gas.calls, c + 1, 'lần đầu: lưu ngay');
  A.storage.setItem('lgt.wallet', '{"sen":2}'); env.advance(10_000); await sync.tick(); assert.equal(gas.calls, c + 1, 'mới 10 giây: chờ thêm');
  env.advance(36_000); await sync.tick(); assert.equal(gas.calls, c + 2, 'đủ 45 giây: lưu');
  A.storage.setItem('lgt.wallet', '{"sen":3}'); env.doc.hidden = true; env.handlers.visibilitychange(); await new Promise((r) => setTimeout(r, 10)); assert.equal(gas.calls, c + 3, 'ẩn trang: lưu ngay, bỏ qua giãn cách');
  A.storage.setItem('lgt.wallet', '{"sen":4}'); env.handlers.pagehide(); await new Promise((r) => setTimeout(r, 10)); assert.equal(gas.calls, c + 4, 'rời trang: lưu ngay');
  env.doc.hidden = false; env.handlers.visibilitychange(); await new Promise((r) => setTimeout(r, 10)); assert.equal(gas.calls, c + 4, 'quay lại trang: không lưu');
  sync.stop(); assert.equal(env.armed, false);
});
test('createAutoSync: máy chưa đăng nhập không làm gì; gặp xung đột thì dừng và báo; phiên hết hạn thì dừng và báo', async () => {
  const gas = makeGas(), none = device(gas), e0 = fakeEnv(), s0 = createAutoSync(none.client, e0); s0.start(); assert.equal(e0.armed, false); await s0.tick(true);
  const A = device(gas), B = device(gas); await newChar(A, 'An', 'matkhau1'); B.client.adopt((await B.client.login({ name: 'An', password: 'matkhau1' })).res);
  const eA = fakeEnv(), sA = createAutoSync(A.client, eA); sA.start(); const ev = []; A.client.on((x) => ev.push(x));
  B.storage.setItem('lgt.wallet', '{"sen":9}'); await B.client.push();                      // B lưu trước
  A.storage.setItem('lgt.wallet', '{"sen":1}'); await sA.tick(true);                          // A lưu → stale
  assert.deepEqual(ev, ['conflict']); assert.equal(sA.running, false); assert.equal(A.client.state.conflict, true);
  const c = gas.calls; await sA.tick(true); assert.equal(gas.calls, c, 'đang xung đột: không gọi nữa');
  const C = device(gas), eC = fakeEnv(), sC = createAutoSync(C.client, eC); C.client.adopt((await C.client.login({ name: 'An', password: 'matkhau1' })).res); sC.start();
  await B.client.logout(); for (let i = 0; i < 9; i++) await gas.call('acctLogin', { name: 'An', key: await deriveKey('An', 'matkhau1', webcrypto.subtle, IT) });
  const ev2 = []; C.client.on((x) => ev2.push(x)); C.storage.setItem('lgt.wallet', '{"sen":5}'); await sC.tick(true);
  assert.deepEqual(ev2, ['expired']); assert.equal(sC.running, false);
});

// ---------------------------------------------------------------- wiring mã nguồn thật
test('Nối vào trang: main.js, hud.js, index.html, sw.js, api.js đã được cập nhật đúng chỗ', () => {
  const rd = (f) => readFileSync(path.join(root, f), 'utf8');
  const main = rd('js/main.js'), hud = rd('js/ui/hud.js'), html = rd('index.html'), sw = rd('sw.js'), api = rd('js/api.js'), code = rd('gas/Code.gs');
  assert.match(main, /import \{ initAccount \} from '\.\/net\/account\.js'/); assert.match(main, /acct\.attach\(window\.LGT\)/);
  assert.ok(main.indexOf("window.LGT = window.LGT || {};") < main.indexOf('acct.attach(window.LGT)'), 'chỉ gắn vào LGT SAU khi cảnh dựng xong');
  assert.ok(main.indexOf('await Promise.race([acct.ready') < main.indexOf("await import('./scene/index.js')"), 'bản lưu từ tài khoản phải xuống trước khi dựng cảnh');
  assert.doesNotMatch(rd('js/net/account.js').replace(/\/\/.*$/gm, ''), /window\.LGT\s*=/, 'js/net/account.js không được tự tạo window.LGT (scene/index.js cần tự tạo LGT mặc định)');
  assert.match(hud, /initAccountGate\(/); assert.match(hud, /enterWorld/); assert.match(hud, /id="en-pw"/); assert.match(hud, /id="en-pw2"/);
  assert.match(html, /css\/account\.css/); assert.ok(html.indexOf('css/account.css') < html.indexOf('css/responsive.css'), 'account.css nạp trước responsive.css');
  assert.match(rd('css/account.css'), /body\.entering #sound-invite\{bottom:auto!important;top:/, 'lời mời bật nhạc không được đè lên nút gửi trên điện thoại');
  assert.match(api, /keepalive: !!opts\.keepalive/);
  for (const a of ['acctCreate', 'acctLogin', 'acctLoad', 'acctSave', 'acctLogout']) assert.match(code, new RegExp("case '" + a + "'"), a);
  assert.match(code, /Accounts: \['aid', 'accKey'/);
  assert.match(sw, /VERSION = 'dgt-v(5[2-9]|[6-9]\d|\d{3,})'/, 'sw.js phải tăng VERSION khi đổi mã');
});
