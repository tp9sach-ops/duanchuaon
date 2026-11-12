// Chạy CHÍNH gas/Rank.gs (cùng Code.gs, Storage.gs, Room.gs, Accounts.gs) trong vm với Sheet + Cache giả: lưu, sen không giảm, xếp hạng, online, chi tiết, làm sạch info.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

function load() {
  const data = [['pid', 'name', 'lv', 'xp', 'sen', 'la', 'ngayTao', 'lanCuoi', 'info', 'pub']], cache = {};   // hàng 1 = tiêu đề (rankSheet_ tạo sẵn)
  const cell = (r, c) => (data[r - 1] && data[r - 1][c - 1] != null ? data[r - 1][c - 1] : '');
  const sh = {
    getLastRow: () => data.length, getMaxRows: () => 5000, getLastColumn: () => 10, insertRowsAfter() {}, appendRow: (r) => { data.push(r.slice()); },
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push(cell(r + i, c + j)); o.push(row); } return o; },
      getValue: () => cell(r, c), setNumberFormat() {},
      setValues: (v) => { for (let i = 0; i < v.length; i++) { data[r - 1 + i] = data[r - 1 + i] || []; for (let j = 0; j < v[i].length; j++) data[r - 1 + i][c - 1 + j] = v[i][j]; } },
      setValue: (v) => { data[r - 1] = data[r - 1] || []; data[r - 1][c - 1] = v; },
    }),
  };
  const ctx = {
    console, Math, Date, String, Number, isFinite, JSON, Object, Array, RegExp,
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ put: (k, v) => { cache[k] = v; }, get: (k) => (k in cache ? cache[k] : null), remove: (k) => { delete cache[k]; }, getAll: (ks) => { const o = {}; ks.forEach((k) => { if (k in cache) o[k] = cache[k]; }); return o; } }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: () => crypto.randomUUID(), computeDigest: (a, s) => Array.from(crypto.createHash('sha256').update(String(s)).digest()).map((b) => (b > 127 ? b - 256 : b)), formatDate: () => '2026-11-11T10:00:00' },
    Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'x' }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sh, insertSheet: () => sh }) },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
    HtmlService: {},
  };
  vm.createContext(ctx);
  for (const f of ['Code.gs', 'Storage.gs', 'Room.gs', 'Accounts.gs', 'Rank.gs']) vm.runInContext(fs.readFileSync(new URL('../gas/' + f, import.meta.url), 'utf8'), ctx, { filename: f });
  const call = (o) => JSON.parse(vm.runInContext('route_(' + JSON.stringify(o) + ')', ctx).s);
  return { call, data, cache };
}
const UK1 = 'aaaaaaaa-1111', UK2 = 'bbbbbbbb-2222', UK3 = 'cccccccc-3333';

test('saveScore → getRank: xếp theo sen giảm, trả cấp + tên cấp, me đúng; KHÔNG trả sen/aid/userKey về cho client', () => {
  const { call } = load();
  const a = call({ action: 'saveScore', userKey: UK1, n: 'An', sen: 100, lv: 3, xp: 50, la: 2, info: { ten: 'Sơ tâm', nv: 5 } });
  assert.equal(a.ok, true); assert.match(a.id, /^[0-9a-f]{12}$/); assert.equal('sen' in a, false, 'không trả sen để client không cộng/hoàn sen');
  call({ action: 'saveScore', userKey: UK2, n: 'Bình', sen: 300, lv: 5, xp: 90, la: 1 });
  const r = call({ action: 'getRank', userKey: UK1 });
  assert.equal(r.ok, true); assert.equal(r.total, 2);
  assert.deepEqual(r.top.map((x) => [x.rank, x.n, x.lv, x.sen]), [[1, 'Bình', 5, 300], [2, 'An', 3, 100]]);
  assert.equal(r.top[1].ten, 'Sơ tâm'); assert.equal(r.me.rank, 2); assert.equal(r.me.n, 'An');
  assert.doesNotMatch(JSON.stringify(r), /aaaaaaaa|bbbbbbbb|pid|token/);
});
test('sen chỉ tăng; cấp và chi tiết lấy theo lần gửi mới nhất; ngày tạo giữ nguyên', () => {
  const { call, data } = load();
  call({ action: 'saveScore', userKey: UK1, n: 'An', sen: 100, lv: 3, xp: 50, la: 2, info: { ten: 'A', nv: 1 } });
  const created = data[1][6];
  call({ action: 'saveScore', userKey: UK1, n: 'An', sen: 40, lv: 4, xp: 70, la: 0, info: { ten: 'B' } });
  const p = call({ action: 'getRank', userKey: UK1 }).top[0];
  assert.equal(p.sen, 100); assert.equal(p.lv, 4); assert.equal(p.ten, 'B'); assert.equal(data.length, 2, 'cùng người = một hàng'); assert.equal(data[1][6], created);
});
test('online: có saveScore/rankPing thì on=true; hết hạn thì offline; người chưa ping vẫn thấy (offline)', () => {
  const { call, cache } = load();
  call({ action: 'saveScore', userKey: UK1, n: 'An', sen: 10, lv: 1 });
  call({ action: 'saveScore', userKey: UK2, n: 'Bình', sen: 5, lv: 1 });
  Object.keys(cache).filter((k) => k.startsWith('rk:on:')).forEach((k) => delete cache[k]);   // giả lập hết 150 giây
  let top = call({ action: 'getRank' }).top; assert.deepEqual(top.map((x) => x.on), [false, false]);
  assert.equal(call({ action: 'rankPing', userKey: UK2 }).ok, true);
  top = call({ action: 'getRank' }).top; assert.deepEqual(top.map((x) => [x.n, x.on]), [['An', false], ['Bình', true]]);
  assert.ok(top[0].seen > 0, 'người offline vẫn có mốc lần cuối');
});
test('getPlayer: chi tiết đầy đủ + hạng + online; id sai/không có → lỗi rõ ràng', () => {
  const { call } = load();
  const id = call({ action: 'saveScore', userKey: UK1, n: 'An', sen: 100, lv: 3, xp: 50, la: 2, info: { ten: 'Sơ tâm', nv: 5, tnv: 30, van: true } }).id;
  call({ action: 'saveScore', userKey: UK2, n: 'Bình', sen: 300, lv: 5 });
  const r = call({ action: 'getPlayer', id });
  assert.equal(r.ok, true); assert.equal(r.player.rank, 2); assert.equal(r.player.n, 'An'); assert.equal(r.player.xp, 50); assert.equal(r.player.la, 2); assert.equal(r.player.on, true);
  assert.deepEqual(r.player.info, { ten: 'Sơ tâm', nv: 5, tnv: 30, van: 1 });
  assert.equal(call({ action: 'getPlayer', id: '0123456789ab' }).error, 'not_found'); assert.equal(call({ action: 'getPlayer', id: '../x' }).error, 'bad_request');
});
test('làm sạch: khóa info lạ/link bị bỏ; tên có link/@ → "Khách"; thiếu danh tính → bad_request; kẹp số', () => {
  const { call } = load();
  assert.equal(call({ action: 'saveScore', n: 'x', sen: 1 }).error, 'bad_request');
  assert.equal(call({ action: 'saveScore', userKey: 'ngan' }).error, 'bad_request');
  const id = call({ action: 'saveScore', userKey: UK3, n: 'http://xau.com', sen: 9e15, lv: -4, xp: 'abc', info: { ok: 1, 'BAD KEY': 1, link: 'http://x.com', mail: 'a@b.c', ten: '  Tinh   tấn ' } }).id;
  const p = call({ action: 'getPlayer', id }).player;
  assert.equal(p.n, 'Khách'); assert.equal(p.sen, 1e9); assert.equal(p.lv, 1); assert.equal(p.xp, 0); assert.deepEqual(p.info, { ok: 1, ten: 'Tinh tấn' });
});
test('getRank giới hạn số hàng; mặc định 50, tối đa 100; người ngoài top vẫn có me', () => {
  const { call } = load();
  for (let i = 0; i < 5; i++) call({ action: 'saveScore', userKey: 'user-000' + i, n: 'N' + i, sen: i, lv: 1 });
  assert.equal(call({ action: 'getRank', limit: 2 }).top.length, 2);
  const r = call({ action: 'getRank', userKey: 'user-0000', limit: 2 });
  assert.equal(r.total, 5); assert.equal(r.me.rank, 5); assert.equal(r.me.n, 'N0');
  assert.equal(call({ action: 'getRank', limit: 9999 }).top.length, 5);
});
