import test from 'node:test';
import assert from 'node:assert/strict';
import { DON, DONATE_TARGET, formatVnd, senFor, parseAmount, donateCode, cleanNote, buildClaim, donateError, creditApproved, loadDone } from '../js/engines/donate.js';

test('formatVnd định dạng tiền Việt', () => {
  assert.equal(formatVnd(100000), '100.000đ'); assert.equal(formatVnd(1234567), '1.234.567đ'); assert.equal(formatVnd('x'), '0đ'); assert.equal(formatVnd(-5), '0đ');
});

test('senFor: 1.000đ = 1 hạt sen, làm tròn xuống, có trần', () => {
  assert.equal(senFor(999), 0); assert.equal(senFor(1000), 1); assert.equal(senFor(10999), 10); assert.equal(senFor(50000), 50);
  assert.equal(senFor(50000000), DON.MAX_SEN); assert.equal(senFor('abc'), 0); assert.equal(senFor(-1), 0);
});

test('parseAmount đọc các cách gõ phổ biến', () => {
  for (const [t, v] of [['50000', 50000], ['50.000', 50000], ['50,000', 50000], ['1.500.000', 1500000], ['50k', 50000], ['50 K', 50000], ['1tr', 1000000], ['1,5tr', 1500000], ['1 triệu', 1000000], ['20 nghìn', 20000], ['100000đ', 100000], ['100.000 VND', 100000], ['  200000 ', 200000]]) {
    const r = parseAmount(t); assert.ok(r.ok, t); assert.equal(r.vnd, v, t);
  }
});

test('parseAmount từ chối số sai, quá nhỏ, quá lớn', () => {
  assert.equal(parseAmount('').error, 'empty'); assert.equal(parseAmount('abc').error, 'bad_number'); assert.equal(parseAmount('50.5').error, 'bad_number');
  assert.equal(parseAmount('5000').error, 'too_small'); assert.equal(parseAmount('9999').error, 'too_small');
  assert.equal(parseAmount('60tr').error, 'too_big'); assert.equal(parseAmount('1.1.1tr').error, 'bad_number'); assert.equal(parseAmount(null).error, 'empty');
  assert.equal(parseAmount('10000').ok, true); assert.equal(parseAmount('50000000').ok, true);
});

test('donateCode: ổn định, 9 ký tự, không ký tự dễ nhầm, khác khóa khác mã', () => {
  const a = donateCode('uuid-1'); assert.equal(a, donateCode('uuid-1')); assert.match(a, /^DGT[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(a, donateCode('uuid-2')); assert.match(donateCode(''), /^DGT[A-HJ-NP-Z2-9]{6}$/);
  const set = new Set(Array.from({ length: 300 }, (_, i) => donateCode('k' + i))); assert.ok(set.size > 290, 'ít trùng mã');
});

test('cleanNote: cắt 60 ký tự, bỏ thẻ, chặn link/email/số điện thoại', () => {
  assert.equal(cleanNote('  Cầu   bình an  ').note, 'Cầu bình an');
  assert.equal(cleanNote('a'.repeat(100)).note.length, 60); assert.equal(cleanNote('<b>x</b>').note.includes('<'), false);
  assert.equal(cleanNote('xem http://x.vn').error, 'no_links'); assert.equal(cleanNote('a@b.c').error, 'no_links'); assert.equal(cleanNote('gọi 0901 234 567').error, 'no_numbers');
  assert.equal(cleanNote('').note, '');
});

test('buildClaim ghép gói gửi máy chủ', () => {
  const r = buildClaim({ amount: '50k', note: 'Hồi hướng', userKey: 'u1', name: 'Gp', via: 'bank' });
  assert.ok(r.ok); assert.deepEqual(Object.keys(r.payload).sort(), ['kenh', 'loiNhan', 'maSo', 'soTien', 'ten', 'userKey']);
  assert.equal(r.payload.soTien, 50000); assert.equal(r.payload.kenh, 'bank'); assert.equal(r.payload.maSo, donateCode('u1'));
  assert.equal(buildClaim({ amount: '50k', userKey: 'u1' }).payload.kenh, 'momo');
  assert.equal(buildClaim({ amount: '50k', userKey: '' }).error, 'no_user'); assert.equal(buildClaim({ amount: '1', userKey: 'u' }).error, 'too_small');
  assert.equal(buildClaim({ amount: '50k', note: 'x@y.com', userKey: 'u' }).error, 'no_links');
});

test('creditApproved cộng mỗi khoản đúng một lần, ưu tiên sen của máy chủ', () => {
  const a = creditApproved([{ id: 'a', soTien: 50000, sen: 60 }, { id: 'b', soTien: 20000 }, { id: 'a', soTien: 1 }, { soTien: 9 }, null], []);
  assert.equal(a.add, 60 + 20); assert.deepEqual(a.ids, ['a', 'b']);
  const b = creditApproved([{ id: 'a', soTien: 50000, sen: 60 }, { id: 'c', soTien: 10000 }], a.done); assert.equal(b.add, 10); assert.deepEqual(b.ids, ['c']);
  assert.deepEqual(creditApproved('x', []).ids, []); assert.equal(creditApproved([{ id: 'z', sen: 9e9 }]).add, DON.MAX_SEN);
  const many = creditApproved(Array.from({ length: 300 }, (_, i) => ({ id: 'i' + i, sen: 1 })), []); assert.equal(many.done.length, 200);
});

test('loadDone chịu được dữ liệu hỏng; thông báo lỗi và thông tin nhận tiền đầy đủ', () => {
  assert.deepEqual(loadDone('rác'), []); assert.deepEqual(loadDone(null), []); assert.deepEqual(loadDone('["a",2]'), ['a', '2']);
  for (const e of ['empty', 'bad_number', 'too_small', 'too_big', 'no_links', 'no_numbers', 'no_user', 'rate_limited', 'api_disabled', 'network', 'timeout']) assert.ok(donateError(e).length > 10, e);
  assert.ok(donateError('lạ').length > 5);
  assert.equal(DONATE_TARGET.soTk, '108002706141'); assert.ok(DONATE_TARGET.qrMomo.endsWith('.jpg') && DONATE_TARGET.qrBank.endsWith('.jpg'));
});
