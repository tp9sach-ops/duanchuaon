import test from 'node:test';
import assert from 'node:assert/strict';
import { xinXam, rutXam, tongKetNhang, thapNhang, ngayKey, SO_QUE } from '../js/engines/temple.js';

test('100 quẻ đều khác nhau và hợp lệ', () => {
  const loi = new Set();
  for (let i = 1; i <= SO_QUE; i++) { const q = xinXam(i); assert.equal(q.so, i); assert.ok(q.muc && q.loi); loi.add(q.loi); }
  assert.equal(loi.size, 100);
});
test('quẻ ngoài khoảng được cuộn về 1–100', () => { assert.equal(xinXam(101).so, 1); assert.equal(xinXam(0).so, 100); });
test('rút xăm theo rnd cố định', () => { assert.equal(rutXam(() => 0).so, 1); assert.equal(rutXam(() => 0.999).so, 100); });
test('thắp nhang chỉ nhận 1/3/9', () => { assert.throws(() => thapNhang({}, 2)); assert.deepEqual(thapNhang({}, 3, new Date(2026, 9, 31)), { '2026-10-31': 3 }); });
test('chuỗi ngày liên tiếp qua ranh giới tháng', () => {
  const now = new Date(2026, 10, 2);
  const so = { '2026-10-30': 1, '2026-10-31': 3, '2026-11-01': 1, '2026-11-02': 9, '2026-10-20': 1 };
  const t = tongKetNhang(so, now); assert.equal(t.chuoi, 4); assert.equal(t.homNay, 9); assert.equal(t.tong, 15); assert.equal(t.chuoiDai, 4);
});
test('hôm nay chưa thắp: chuỗi vẫn tính đến hôm qua; cách 1 ngày thì về 0', () => {
  assert.equal(tongKetNhang({ '2026-11-01': 1 }, new Date(2026, 10, 2)).chuoi, 1);
  assert.equal(tongKetNhang({ '2026-10-30': 1 }, new Date(2026, 10, 2)).chuoi, 0);
});
test('ngayKey dùng giờ địa phương', () => { assert.equal(ngayKey(new Date(2026, 0, 5)), '2026-01-05'); });
