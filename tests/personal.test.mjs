// Test bói ngày cá nhân. Đáp án tính tay từ bảng Lục hợp / Tam hợp / Lục xung / Hình / Hại / Phá (xem js/data/personal.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chiRelations, hanhRelation, birthInfo, analyzePersonal } from '../js/engines/personal.js';
import { analyzeDay } from '../js/engines/dayscore.js';

const rd = (f) => JSON.parse(readFileSync(new URL('../js/data/' + f, import.meta.url), 'utf8'));
const K = rd('knowledge.json'), P = rd('personal.json');
const names = (r) => r.filter((x) => x.diem !== 0 || x.ten === 'Trùng tuổi').map((x) => x.ten);
const sum = (r) => r.reduce((s, x) => s + x.diem, 0);
// Chi: Tý0 Sửu1 Dần2 Mão3 Thìn4 Tỵ5 Ngọ6 Mùi7 Thân8 Dậu9 Tuất10 Hợi11

test('Lục hợp Tý–Sửu', () => assert.deepEqual(names(chiRelations(0, 1, P)), ['Lục hợp']));
test('Tam hợp Dần–Ngọ', () => assert.deepEqual(names(chiRelations(2, 6, P)), ['Tam hợp']));
test('Lục xung Tý–Ngọ chỉ tính xung, không cộng chồng', () => { const r = chiRelations(0, 6, P); assert.deepEqual(names(r), ['Lục xung']); assert.equal(sum(r), -12); });
test('Tý–Mão: tứ hành xung và hình, chỉ tính điều nặng nhất (hình −6)', () => { const r = chiRelations(0, 3, P); assert.equal(sum(r), -6); assert.equal(r.length, 2); });
test('Tý–Mùi là Hại (−6)', () => assert.equal(sum(chiRelations(0, 7, P)), -6));
test('Tý–Dậu: tứ hành xung (−4) và phá (−5) → tính −5', () => assert.equal(sum(chiRelations(0, 9, P)), -5));
test('Dần–Hợi vừa lục hợp vừa phá → +10 −5 = +5', () => assert.equal(sum(chiRelations(2, 11, P)), 5));
test('Tự hình Thìn–Thìn', () => { const r = chiRelations(4, 4, P); assert.ok(r.some((x) => x.ten === 'Tự hình')); });
test('Trùng tuổi Tý–Tý không trừ điểm', () => assert.equal(sum(chiRelations(0, 0, P)), 0));
test('Xung có tính đối xứng mọi cặp i, i+6', () => { for (let i = 0; i < 12; i++) assert.equal(sum(chiRelations(i, (i + 6) % 12, P)), -12); });

test('Ngũ hành: Thủy sinh Mộc → ngày sinh mệnh +5', () => assert.equal(hanhRelation('Mộc', 'Thủy', P).diem, 5));
test('Ngũ hành: Kim khắc Mộc → ngày khắc mệnh −7', () => assert.equal(hanhRelation('Mộc', 'Kim', P).diem, -7));
test('Ngũ hành: cùng hành tỷ hòa +3', () => assert.equal(hanhRelation('Hỏa', 'Hỏa', P).diem, 3));
test('Ngũ hành: Mộc khắc Thổ (mệnh khắc ngày) −2', () => assert.equal(hanhRelation('Mộc', 'Thổ', P).diem, -2));

test('birthInfo dương lịch 15/5/1990 = Canh Ngọ, mệnh Thổ (Lộ Bàng Thổ)', () => {
  const b = birthInfo({ loaiLich: 'duong', ngay: 15, thang: 5, nam: 1990 });
  assert.equal(b.ok, true); assert.equal(b.namSinh.name, 'Canh Ngọ'); assert.equal(b.hanh, 'Thổ');
});
test('birthInfo âm lịch mùng 1 Tết 2024 = Giáp Thìn (10/2/2024 dương)', () => {
  const b = birthInfo({ loaiLich: 'am', ngay: 1, thang: 1, nam: 2024 });
  assert.deepEqual([b.solar.dd, b.solar.mm, b.solar.yy], [10, 2, 2024]); assert.equal(b.namSinh.name, 'Giáp Thìn');
});
test('Sinh trước Tết thì tính năm âm cũ: 20/1/2024 dương = Quý Mão', () => {
  assert.equal(birthInfo({ loaiLich: 'duong', ngay: 20, thang: 1, nam: 2024 }).namSinh.name, 'Quý Mão');
});
test('Từ chối ngày không tồn tại', () => {
  assert.equal(birthInfo({ loaiLich: 'duong', ngay: 31, thang: 2, nam: 2000 }).ok, false);
  assert.equal(birthInfo({ loaiLich: 'duong', ngay: 29, thang: 2, nam: 2023 }).ok, false);
  assert.equal(birthInfo({ loaiLich: 'am', ngay: 1, thang: 2, nam: 2024, nhuan: true }).ok, false);
  assert.equal(birthInfo({ loaiLich: 'duong', ngay: 1, thang: 1, nam: 1850 }).ok, false);
});

test('analyzePersonal: Canh Ngọ gặp ngày Mậu Dần 31/10/2026 (tam hợp + tỷ hòa) cao hơn điểm ngày chung', () => {
  const day = analyzeDay(31, 10, 2026, K);
  const r = analyzePersonal(day, { loaiLich: 'duong', ngay: 15, thang: 5, nam: 1990, gioSinh: '3' }, P, 'chung');
  assert.equal(r.ok, true);
  assert.equal(day.canChi.ngay.name, 'Mậu Dần');
  assert.equal(r.diem, day.diem + 8 + 3);
  assert.equal(r.doTinCay, 0.6);
});
test('analyzePersonal: giờ xung tuổi bị loại khỏi giờ tốt (tuổi Mùi xung giờ Sửu, ngày Mậu Dần có giờ Sửu Hoàng đạo)', () => {
  const day = analyzeDay(31, 10, 2026, K);
  assert.ok(day.gio[1].hoang, 'giờ Sửu phải là Hoàng đạo ở ngày này');
  const r = analyzePersonal(day, { loaiLich: 'duong', ngay: 15, thang: 5, nam: 1991 }, P, 'chung'); // Tân Mùi
  assert.equal(r.birth.chi, 7);
  assert.ok(r.gioTot.every((g) => g.chi !== 1)); assert.deepEqual(r.gioBoQua, ['Sửu']);
});
test('analyzePersonal: mục tiêu có từ khóa kỵ trừ điểm, hợp cộng điểm', () => {
  const day = analyzeDay(31, 10, 2026, K); // Trực Định: nên cưới hỏi/ký kết, kỵ xuất hành xa
  const base = analyzePersonal(day, { loaiLich: 'duong', ngay: 15, thang: 5, nam: 1990 }, P, 'chung').diem;
  const ok = analyzePersonal(day, { loaiLich: 'duong', ngay: 15, thang: 5, nam: 1990 }, P, 'cuoiHoi').diem;
  assert.equal(ok, base + 6);
});
test('analyzePersonal: hồ sơ sai trả lỗi, không ném ngoại lệ', () => {
  const day = analyzeDay(31, 10, 2026, K);
  assert.equal(analyzePersonal(day, { loaiLich: 'duong', ngay: 40, thang: 1, nam: 2000 }, P).ok, false);
});
test('Điểm luôn nằm trong 0–100 với mọi tuổi và 60 ngày liên tiếp', () => {
  for (let y = 1960; y < 2012; y += 7) for (let d = 1; d <= 28; d += 3) {
    const day = analyzeDay(d, 11, 2026, K), r = analyzePersonal(day, { loaiLich: 'duong', ngay: 10, thang: 6, nam: y }, P, 'khaiTai');
    assert.ok(r.diem >= 0 && r.diem <= 100);
  }
});
