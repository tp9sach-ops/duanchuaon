import test from 'node:test';
import assert from 'node:assert/strict';
import { KINH, BEADS_PER_ROUND, MERIT_RULES, beatsOf, kinhById, kinhDesc, checkKinh, createChanter, createBeads, meritForPull, meritForChant, loadWallet, addSen } from '../js/engines/kinh.js';

test('dữ liệu kinh: đúng 5 bài như ảnh mẫu, không lỗi, mọi câu có chữ', () => {
  assert.deepEqual(KINH.map((k) => k.ten), ['Niệm Phật', 'Bát Nhã Tâm Kinh', 'Chú Vãng Sanh', 'Chú Đại Bi', 'Kệ Hồi Hướng']);
  assert.deepEqual(checkKinh(), []);
  assert.equal(kinhById('khong-co').id, KINH[0].id);
  assert.match(kinhDesc(kinhById('daibi')), /^\d+ câu$/);
});
test('số tiếng của câu = số từ (tối thiểu 1)', () => {
  assert.equal(beatsOf('Nam mô A Di Đà Phật'), 6); assert.equal(beatsOf('Án'), 1); assert.equal(beatsOf('  '), 1); assert.equal(beatsOf('Ta bà ha, ta bà ha'), 6);
});
test('chanter: gõ đủ số tiếng thì sang câu, hết bài thì tính một vòng và quay lại đầu', () => {
  const c = createChanter({ lines: ['a b', 'c', 'd e f'] });
  assert.equal(c.view().cur, 'a b'); assert.deepEqual(c.view().next, ['c', 'd e f']);
  assert.deepEqual(c.tap(), { line: false, round: false }); assert.equal(c.view().beat, 1);
  assert.deepEqual(c.tap(), { line: true, round: false }); assert.equal(c.view().cur, 'c');
  assert.equal(c.tap().line, true); assert.equal(c.view().cur, 'd e f');
  c.tap(); c.tap(); const last = c.tap();
  assert.deepEqual(last, { line: true, round: true }); assert.equal(c.view().cur, 'a b'); assert.equal(c.view().rounds, 1); assert.equal(c.view().taps, 6);
  c.reset(); assert.equal(c.view().taps, 0);
});
test('chanter chạy được mọi bài thật đến hết một vòng', () => {
  for (const k of KINH) { const c = createChanter(k); const need = k.lines.reduce((s, l) => s + beatsOf(l), 0); let ev; for (let i = 0; i < need; i++) ev = c.tap(); assert.equal(ev.round, true, k.id); assert.equal(c.view().i, 0); }
});
test('tràng hạt: đếm 1..108, đủ 108 thì về 0 và tăng vòng; khôi phục từ lưu trữ có chặn giá trị xấu', () => {
  const b = createBeads({ dem: 105, vong: 2 });
  assert.equal(b.pull().n, 106); assert.equal(b.pull().n, 107); const r = b.pull();
  assert.deepEqual(r, { n: 108, dem: 0, vong: 3, full: true }); assert.deepEqual(b.state(), { dem: 0, vong: 3 });
  assert.deepEqual(createBeads({ dem: 999, vong: -4 }).state(), { dem: 107, vong: 0 }); assert.deepEqual(createBeads(null).state(), { dem: 0, vong: 0 });
  const z = createBeads({ dem: 0, vong: 0 }); let full = 0; for (let i = 0; i < 216; i++) if (z.pull().full) full++; assert.equal(full, 2); assert.equal(BEADS_PER_ROUND, 108);
});
test('công đức (giá trị tạm): theo quy tắc, tổng một vòng 108 hạt đúng', () => {
  const b = createBeads(); let tong = 0; for (let i = 0; i < 108; i++) tong += meritForPull(b.pull());
  assert.equal(tong, 12 * MERIT_RULES.perNineBeads + MERIT_RULES.beadRound);
  assert.equal(meritForChant({ line: true, round: false }), 0); assert.equal(meritForChant({ round: true }), MERIT_RULES.chantRound); assert.equal(meritForChant(null), 0);
});
test('ví hạt sen: đọc lưu trữ hỏng không vỡ, không âm, cộng đúng', () => {
  assert.deepEqual(loadWallet(null), { sen: 0 }); assert.deepEqual(loadWallet('rác{'), { sen: 0 }); assert.deepEqual(loadWallet('{"sen":-5}'), { sen: 0 });
  assert.deepEqual(addSen({ sen: 3 }, 4), { sen: 7 }); assert.deepEqual(addSen({ sen: 3 }, -10), { sen: 0 });
});
