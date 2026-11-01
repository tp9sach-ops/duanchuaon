import test from 'node:test';
import assert from 'node:assert/strict';
import { moonLatitude, phanLoai, sapXayRa } from '../js/engines/eclipse.js';
import { jdFromUTC } from '../js/engines/astro.js';

const jd = (y, m, d) => jdFromUTC(Date.UTC(y, m - 1, d));
const ngay = (j) => new Date((j - 2440587.5) * 86400000).toISOString().slice(0, 10);

test('vĩ độ Mặt Trăng luôn trong ±5,4°', () => { for (let k = 0; k < 400; k++) assert.ok(Math.abs(moonLatitude(jd(2026, 1, 1) + k * 0.7)) < 5.4); });
test('phân loại theo ngưỡng', () => {
  assert.equal(phanLoai('nguyet', 0.2), 'toàn phần'); assert.equal(phanLoai('nguyet', -0.8), 'một phần'); assert.equal(phanLoai('nguyet', 2), null);
  assert.equal(phanLoai('nhat', 0.5), 'toàn phần hoặc hình khuyên'); assert.equal(phanLoai('nhat', 1.2), 'một phần');
});
test('khớp các lần thực đã xảy ra/đã công bố (cùng ngày UTC ±1)', () => {
  const list = sapXayRa(jd(2025, 1, 1), 800), has = (loai, d) => list.some((e) => e.loai === loai && Math.abs(new Date(ngay(e.jd)) - new Date(d)) <= 86400000);
  assert.ok(has('nguyet', '2025-03-14'), 'nguyệt thực toàn phần 14/3/2025');
  assert.ok(has('nhat', '2025-03-29'), 'nhật thực một phần 29/3/2025');
  assert.ok(has('nguyet', '2025-09-07'), 'nguyệt thực toàn phần 7/9/2025');
  assert.ok(has('nhat', '2025-09-21'), 'nhật thực một phần 21/9/2025');
  assert.ok(has('nhat', '2026-02-17'), 'nhật thực hình khuyên 17/2/2026');
  assert.ok(has('nguyet', '2026-03-03'), 'nguyệt thực toàn phần 3/3/2026');
  assert.ok(has('nhat', '2026-08-12'), 'nhật thực toàn phần 12/8/2026');
  assert.ok(has('nguyet', '2026-08-28'), 'nguyệt thực một phần 28/8/2026');
});
test('không báo thực ở các trăng non/tròn thường (vd. tháng 1/2025 không có thực)', () => {
  const list = sapXayRa(jd(2025, 1, 1), 60); assert.equal(list.length, 0);
});
test('kiểu thực khớp thực tế: 2026 nhật hình khuyên/toàn phần, 8/2026 nguyệt thực một phần, 3/2026 toàn phần', () => {
  const list = sapXayRa(jd(2025, 1, 1), 1100), kieu = (loai, d) => list.find((e) => e.loai === loai && ngay(e.jd) === d).kieu;
  assert.match(kieu('nhat', '2026-02-17'), /hình khuyên/); assert.match(kieu('nhat', '2026-08-12'), /toàn phần/);
  assert.equal(kieu('nguyet', '2026-08-28'), 'một phần'); assert.equal(kieu('nguyet', '2026-03-03'), 'toàn phần');
  assert.equal(kieu('nhat', '2025-03-29'), 'một phần'); assert.equal(kieu('nguyet', '2027-02-20').startsWith('nửa tối'), true);
});
