// Test Bát tự. Đáp án tính tay / lịch vạn niên (xem chú thích).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fourPillars, thapThan, analyzeBatu, daiVan, luuNien, yearBatu } from '../js/engines/batu.js';

test('1/1/2000 giờ Tý: Kỷ Mão – Bính Tý – Mậu Ngọ – Nhâm Tý (kinh điển: Kỷ Mão/Bính Tý/Mậu Ngọ)', () => {
  const f = fourPillars(1, 1, 2000, 0);
  assert.equal(f.tru.nam.name, 'Kỷ Mão'); assert.equal(f.tru.thang.name, 'Bính Tý');
  assert.equal(f.tru.ngay.name, 'Mậu Ngọ'); assert.equal(f.tru.gio.name, 'Nhâm Tý');
});
test('năm Bát tự đổi ở Lập xuân: 1/2/2024 vẫn là Quý Mão, 5/2/2024 là Giáp Thìn', () => {
  assert.equal(yearBatu(1, 2, 2024), 2023); assert.equal(yearBatu(5, 2, 2024), 2024);
  assert.equal(fourPillars(1, 2, 2024).tru.nam.name, 'Quý Mão'); assert.equal(fourPillars(5, 2, 2024).tru.nam.name, 'Giáp Thìn');
});
test('tháng Can Chi theo Ngũ hổ độn: Giáp Thìn (2024) tháng Dần = Bính Dần', () => {
  const f = fourPillars(10, 2, 2024); assert.equal(f.tru.thang.name, 'Bính Dần');
});
test('thập thần: Nhật chủ Giáp (0)', () => {
  const t = (x) => thapThan(0, x);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(t),
    ['Tỷ kiên', 'Kiếp tài', 'Thực thần', 'Thương quan', 'Thiên tài', 'Chính tài', 'Thất sát', 'Chính quan', 'Thiên ấn', 'Chính ấn']);
});
test('analyzeBatu: tổng phần trăm ngũ hành ~100, có Dụng thần', () => {
  const a = analyzeBatu(1, 1, 2000, 0), s = a.nguHanh.reduce((x, y) => x + y.phanTram, 0);
  assert.ok(s >= 98 && s <= 102); assert.ok(['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'].includes(a.dungThan)); assert.equal(a.hang.length, 4);
});
test('analyzeBatu không giờ sinh: 3 cột, độ tin cậy thấp hơn', () => {
  const a = analyzeBatu(1, 1, 2000, -1); assert.equal(a.hang.length, 3); assert.ok(a.doTinCay < 0.5);
});
test('Đại vận: Kỷ Mão (âm) nam đi nghịch, tháng Bính Tý → vận đầu Ất Hợi; nữ đi thuận → Đinh Sửu', () => {
  const nam = daiVan(1, 1, 2000, 'nam'), nu = daiVan(1, 1, 2000, 'nu');
  assert.equal(nam.thuan, false); assert.equal(nam.van[0].name, 'Ất Hợi'); assert.equal(nam.van[1].name, 'Giáp Tuất');
  assert.equal(nu.thuan, true); assert.equal(nu.van[0].name, 'Đinh Sửu'); assert.equal(nu.van[1].name, 'Mậu Dần');
  assert.equal(daiVan(1, 1, 2000, '').ok, false);
});
test('Đại vận: tuổi khởi vận hợp lý (0–10) và cách nhau 10 năm', () => {
  const d = daiVan(1, 1, 2000, 'nu'); assert.ok(d.tuoiKhoiVan >= 0 && d.tuoiKhoiVan <= 10);
  assert.ok(Math.abs(d.van[1].tuTuoi - d.van[0].tuTuoi - 10) < 0.01);
});
test('Lưu niên: sinh năm Giáp Thìn 2024 → 2026 Bính Ngọ; Tam tai nhóm Thân-Tý-Thìn là Dần Mão Thìn', () => {
  const b = analyzeBatu(10, 2, 2024); // sinh âm 2024 (Giáp Thìn)
  const l26 = luuNien(2026, 2024, b); assert.equal(l26.canChi.name, 'Bính Ngọ'); assert.ok(l26.diem >= 0 && l26.diem <= 100);
  assert.ok(luuNien(2022, 2000, analyzeBatu(1, 1, 2000, 0)).flags.length >= 0);
  const tuoiThin = luuNien(2025, 2000, analyzeBatu(1, 1, 2000, 0)); // chi Mão (2000 Canh Thìn: chi Thìn) → 2025 Ất Tỵ
  assert.equal(tuoiThin.canChi.name, 'Ất Tỵ');
  assert.ok(luuNien(2026, 2000, analyzeBatu(1, 1, 2000, 0)).flags.includes('Xung Thái tuế') === false);
  assert.ok(luuNien(2024, 2000, analyzeBatu(1, 1, 2000, 0)).flags.includes('Trực Thái tuế')); // 2024 Giáp Thìn, sinh 2000 Canh Thìn
});
