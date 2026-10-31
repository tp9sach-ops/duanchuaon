// Test engine lịch (chạy bằng: node --test tests/). Đáp án lấy từ các mốc lịch Việt Nam đã biết chắc.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { solarToLunar, lunarToSolar, jdFromDate, jdToDate, dayOfWeek } from '../js/engines/lunar.js';
import { dayCanChi, yearCanChi, monthCanChi, hourCanChi, hourToChi, napAm } from '../js/engines/canchi.js';
import { analyzeDay } from '../js/engines/dayscore.js';

const K = JSON.parse(readFileSync(new URL('../js/data/knowledge.json', import.meta.url), 'utf8'));

// [dương d,m,y] → [âm ngày, tháng, năm, nhuận]
const LUNAR = [
  [[10, 2, 2024], [1, 1, 2024, 0]],   // Mùng 1 Tết Giáp Thìn
  [[29, 1, 2025], [1, 1, 2025, 0]],   // Mùng 1 Tết Ất Tỵ
  [[17, 2, 2026], [1, 1, 2026, 0]],   // Mùng 1 Tết Bính Ngọ
  [[9, 2, 2024], [30, 12, 2023, 0]],  // Giao thừa Quý Mão
  [[21, 3, 2023], [30, 2, 2023, 0]],  // cuối tháng 2 thường
  [[22, 3, 2023], [1, 2, 2023, 1]],   // Mùng 1 tháng 2 NHUẬN 2023
  [[1, 1, 2000], [25, 11, 1999, 0]],
  [[31, 10, 2026], [22, 9, 2026, 0]],
];
for (const [s, l] of LUNAR) {
  test(`dương ${s.join('/')} → âm ${l.join('/')}`, () => {
    const r = solarToLunar(...s);
    assert.deepEqual([r.day, r.month, r.year, r.leap], l);
  });
}
test('âm → dương (kể cả tháng nhuận)', () => {
  assert.deepEqual(lunarToSolar(1, 1, 2024), [10, 2, 2024]);
  assert.deepEqual(lunarToSolar(1, 2, 2023, 1), [22, 3, 2023]);
  assert.equal(lunarToSolar(1, 5, 2023, 1), null); // 2023 chỉ nhuận tháng 2
});
test('khứ hồi 1900–2100 mỗi 37 ngày', () => {
  for (let jd = jdFromDate(1, 1, 1900); jd < jdFromDate(1, 1, 2100); jd += 37) {
    const [d, m, y] = jdToDate(jd), l = solarToLunar(d, m, y);
    assert.deepEqual(lunarToSolar(l.day, l.month, l.year, l.leap), [d, m, y]);
  }
});
test('thứ trong tuần', () => {
  assert.equal(dayOfWeek(jdFromDate(1, 1, 2000)), 6);   // Thứ bảy
  assert.equal(dayOfWeek(jdFromDate(10, 2, 2024)), 6);  // Thứ bảy
});
test('Can Chi ngày/năm/tháng/giờ', () => {
  assert.equal(dayCanChi(jdFromDate(1, 1, 2000)).name, 'Mậu Ngọ');
  assert.equal(dayCanChi(jdFromDate(10, 2, 2024)).name, 'Giáp Thìn');
  assert.equal(yearCanChi(2024).name, 'Giáp Thìn');
  assert.equal(yearCanChi(2026).name, 'Bính Ngọ');
  assert.equal(monthCanChi(2024, 1).name, 'Bính Dần');  // năm Giáp, tháng Giêng = Bính Dần
  assert.equal(monthCanChi(2025, 1).name, 'Mậu Dần');   // năm Ất
  assert.equal(hourCanChi(0, 0).name, 'Giáp Tý');       // ngày Giáp, giờ Tý
  assert.equal(hourCanChi(1, 0).name, 'Bính Tý');       // ngày Ất, giờ Tý
  assert.equal(hourToChi(23), 0); assert.equal(hourToChi(0), 0); assert.equal(hourToChi(12), 6);
});
test('Nạp âm', () => {
  assert.equal(napAm(0, 4), 'Phú Đăng Hỏa');  // Giáp Thìn
  assert.equal(napAm(0, 0), 'Hải Trung Kim'); // Giáp Tý
});
test('Trực lặp ở ngày giao tiết (Lập xuân 4/2/2024)', () => {
  const a = analyzeDay(3, 2, 2024, K), b = analyzeDay(4, 2, 2024, K);
  assert.equal(b.tietKhi.ten, 'Lập xuân'); assert.equal(b.tietKhi.batDau, true);
  assert.equal(a.truc.ten, b.truc.ten);
});
test('Trực chạy tuần tự trong cùng một tháng tiết', () => {
  const names = K.truc.map((t) => t.ten), a = analyzeDay(10, 2, 2024, K), b = analyzeDay(11, 2, 2024, K);
  assert.equal(names.indexOf(b.truc.ten), (names.indexOf(a.truc.ten) + 1) % 12);
});
test('12 giờ: đúng 6 Hoàng đạo; ngày Tý là Thân, Dậu, Tý, Sửu, Mão, Ngọ', () => {
  for (let d = 1; d <= 28; d++) assert.equal(analyzeDay(d, 3, 2025, K).gio.filter((g) => g.hoang).length, 6);
  const day = [...Array(60)].map((_, i) => analyzeDay(1 + (i % 28), 1 + Math.floor(i / 28), 2025, K)).find((r) => r.canChi.ngay.chiName === 'Tý');
  assert.deepEqual(day.gio.filter((g) => g.hoang).map((g) => g.ten), ['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu']);
});
test('Điểm 0–100, mood −1…1, Tam nương', () => {
  for (let d = 1; d <= 31; d++) { const r = analyzeDay(d, 10, 2026, K); assert.ok(r.diem >= 0 && r.diem <= 100 && Math.abs(r.mood) <= 1); }
  const r = analyzeDay(31, 10, 2026, K); // 22/9 âm
  assert.ok(r.flags.includes('Tam nương'));
});
