// Chạy CHÍNH gas/Donations.gs (cùng Code.gs, Storage.gs) trong vm với Sheet giả: ghi nhận → duyệt → kiểm → nhận một lần → ack; chống lạm dụng.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const rows = [['id', 'userKey', 'maSo', 'ten', 'soTien', 'kenh', 'loiNhan', 'ngayGui', 'trangThai', 'soTienXN', 'sen', 'daNhan', 'ngayDuyet']];
  const pad = (r) => { while (r.length < 13) r.push(''); return r; };
  const sh = {
    getLastRow: () => rows.length, appendRow: (r) => { rows.push(pad(r.slice())); },
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => rows.slice(r - 1, r - 1 + nr).map((x) => x.slice(c - 1, c - 1 + nc)),
      setValue: (v) => { rows[r - 1][c - 1] = v; },
    }),
  };
  let n = 0;
  const ctx = {
    console, Math, Date, String, Number, isFinite, JSON,
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'id-' + (++n), formatDate: (d, tz, f) => { const p = (x) => String(x).padStart(2, '0'); const s = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; return f.includes('HH') ? s + 'T10:00:00' : s; } },
    Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'x' }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sh }) },
    ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 1 } },
    HtmlService: {},
  };
  vm.createContext(ctx);
  for (const f of ['Code.gs', 'Storage.gs', 'Donations.gs']) vm.runInContext(fs.readFileSync(new URL('../gas/' + f, import.meta.url), 'utf8'), ctx, { filename: f });
  const call = (o) => JSON.parse(vm.runInContext('route_(' + JSON.stringify(o) + ')', ctx).s);
  return { call, rows };
}

test('ghi nhận → chưa duyệt thì chưa có hạt sen → duyệt → nhận một lần → ack', () => {
  const { call, rows } = load();
  const r = call({ action: 'donClaim', userKey: 'u1', maSo: 'DGTABC123', soTien: 50000, kenh: 'momo', ten: 'Gp', loiNhan: 'Hồi hướng' });
  assert.equal(r.ok, true); assert.equal(r.sen, 50); assert.equal(rows.length, 2); assert.equal(rows[1][8], 'cho');
  let c = call({ action: 'donCheck', userKey: 'u1' }); assert.equal(c.items.length, 0); assert.equal(c.pending, 1); assert.equal(c.mine[0].trangThai, 'cho');
  rows[1][8] = 'ok';                                             // người duyệt đổi trạng thái trong Sheet
  c = call({ action: 'donCheck', userKey: 'u1' }); assert.equal(c.items.length, 1); assert.equal(c.items[0].sen, 50); assert.equal(c.items[0].soTien, 50000);
  assert.equal(call({ action: 'donCheck', userKey: 'u1' }).items.length, 1, 'chưa ack thì còn trả lại (không mất công đức nếu mất mạng)');
  assert.equal(call({ action: 'donAck', userKey: 'u2', ids: [c.items[0].id] }).acked, 0, 'người khác không ack hộ được');
  assert.equal(call({ action: 'donAck', userKey: 'u1', ids: [c.items[0].id] }).acked, 1);
  assert.equal(call({ action: 'donCheck', userKey: 'u1' }).items.length, 0); assert.equal(rows[1][11], 'TRUE');
  assert.equal(call({ action: 'donAck', userKey: 'u1', ids: [c.items[0].id] }).acked, 0, 'ack lần hai không đếm');
});

test('số tiền xác nhận khác số khai và sen nhập tay được ưu tiên; từ chối không có sen', () => {
  const { call, rows } = load();
  call({ action: 'donClaim', userKey: 'u1', soTien: 100000 }); call({ action: 'donClaim', userKey: 'u1', soTien: 20000 }); call({ action: 'donClaim', userKey: 'u1', soTien: 30000 });
  rows[1][8] = 'ok'; rows[1][9] = '80000';           // thực nhận 80.000
  rows[2][8] = 'ok'; rows[2][10] = '999';             // tặng tay 999 sen
  rows[3][8] = 'tuchoi';
  const c = call({ action: 'donCheck', userKey: 'u1' });
  assert.deepEqual(c.items.map((i) => [i.soTien, i.sen]).sort((a, b) => a[0] - b[0]), [[20000, 999], [80000, 80]]);
  assert.equal(c.mine.find((m) => m.trangThai === 'tuchoi').soTien, 30000);
});

test('kiểm tra đầu vào và chống lạm dụng', () => {
  const { call } = load();
  assert.equal(call({ action: 'donClaim', soTien: 50000 }).error, 'no_user');
  assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 5000 }).error, 'too_small');
  assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 60000000 }).error, 'too_big');
  assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 50000, loiNhan: 'xem http://a.vn' }).error, 'no_links');
  assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 50000, loiNhan: 'gọi 0901 234 567' }).error, 'no_numbers');
  for (let i = 0; i < 5; i++) assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 10000 }).ok, true);
  assert.equal(call({ action: 'donClaim', userKey: 'u', soTien: 10000 }).error, 'rate_limited', 'tối đa 5 khoản chờ duyệt');
  assert.equal(call({ action: 'donClaim', userKey: 'v', soTien: 10000 }).ok, true, 'người khác không bị ảnh hưởng');
  assert.equal(call({ action: 'donCheck' }).error, 'no_user');
});

test('không để lộ userKey/mã của người khác ra ngoài', () => {
  const { call, rows } = load();
  call({ action: 'donClaim', userKey: 'bi-mat', maSo: 'DGTXYZ', soTien: 50000, ten: 'A' }); rows[1][8] = 'ok';
  const s = JSON.stringify(call({ action: 'donCheck', userKey: 'u-khac' })); assert.ok(!s.includes('bi-mat') && !s.includes('DGTXYZ'));
  assert.equal(JSON.parse(s).items.length, 0);
});
