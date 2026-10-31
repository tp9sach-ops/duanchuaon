// Test Thần số học. Đáp án tính tay (xem chú thích từng ca).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reduce, stripName, nameNumbers, lifePath, arrows, pinnacles, personalCycle, analyzeNumerology, scoreNumerology } from '../js/engines/numerology.js';

const N = JSON.parse(readFileSync(new URL('../js/data/numerology.json', import.meta.url), 'utf8'));

test('reduce giữ số chủ đạo 11/22/33', () => {
  assert.equal(reduce(29), 11); assert.equal(reduce(22), 22); assert.equal(reduce(33), 33);
  assert.equal(reduce(38), 11); assert.equal(reduce(10), 1); assert.equal(reduce(29, false), 2);
});
test('chuẩn hóa tên tiếng Việt: bỏ dấu, đ → d', () => {
  assert.equal(stripName('Nguyễn Văn Đức'), 'NGUYEN VAN DUC');
  assert.equal(stripName('  Trần  Thị  Ánh  '), 'TRAN THI ANH');
  assert.equal(stripName(''), '');
});
test('"NGUYEN VAN A": sứ mệnh 7, linh hồn 1, nhân cách 33 (tính tay: 43 = 10 nguyên âm + 33 phụ âm)', () => {
  const r = nameNumbers('Nguyễn Văn A', N);
  assert.equal(r.tongChuCai, 43); assert.equal(r.tongNguyenAm, 10); assert.equal(r.tongPhuAm, 33);
  assert.equal(r.suMenh, 7); assert.equal(r.linhHon, 1); assert.equal(r.nhanCach, 33);
});
test('Y đứng giữa hai nguyên âm (NGUYEN) là phụ âm; Y đứng riêng (LYN) là nguyên âm', () => {
  assert.equal(nameNumbers('Nguyen', N).tongNguyenAm, 3 + 5); // U + E
  assert.equal(nameNumbers('Lyn', N).tongNguyenAm, 7);          // Y = 7
});
test('số đường đời 14/02/1985 = 3 (5 + 2 + 5 = 12 → 3)', () => assert.equal(lifePath(14, 2, 1985), 3));
test('số đường đời 20/11/1980 = 22 (số chủ đạo: 2 + 11 + 9)', () => assert.equal(lifePath(20, 11, 1980), 22));
test('số đường đời 1/1/2000 = 4', () => assert.equal(lifePath(1, 1, 2000), 4));
test('tên rỗng → nameNumbers trả null', () => assert.equal(nameNumbers('   ', N), null));

test('bốn đỉnh cao 14/02/1985 (d=5, m=2, y=5; đường đời 3 → đỉnh đầu kết thúc tuổi 33)', () => {
  const p = pinnacles(14, 2, 1985);
  assert.deepEqual(p.dinh.map((x) => x.so), [7, 1, 8, 7]);       // 2+5, 5+5→1, 7+1, 2+5
  assert.deepEqual(p.thuThach.map((x) => x.so), [3, 0, 3, 3]);   // |2−5|, |5−5|, |3−0|, |2−5|
  assert.deepEqual([p.dinh[0].den, p.dinh[1].tu, p.dinh[1].den, p.dinh[2].tu, p.dinh[3].tu], [33, 34, 42, 43, 52]);
});
test('chu kỳ cá nhân 14/02 trong ngày 31/10/2026: năm 8, tháng 9, ngày 4', () => {
  const c = personalCycle(14, 2, { dd: 31, mm: 10, yy: 2026 });
  // d=1+4=5, m=2, năm 2026 → 10 → 1 ⇒ 5+2+1 = 8 ; tháng: 8+10=18 → 9 ; ngày: 9+31=40 → 4
  assert.deepEqual(c, { nam: 8, thang: 9, ngay: 4 });
});
test('mũi tên: ngày sinh 14/02/1985 thiếu số 7 nên không có mũi tên Thực tế (1-4-7)', () => {
  const a = arrows(14, 2, 1985, N);
  assert.deepEqual(Object.keys(a.dem).map((k) => a.dem[k]), [2, 1, 0, 1, 1, 0, 0, 1, 1]);
  assert.equal(a.co.some((x) => x.id === 'thuc-te'), false);
});
test('mũi tên Quyết tâm (1-5-9) có khi ngày sinh chứa 1, 5, 9', () => {
  const a = arrows(15, 9, 2001, N); // chữ số: 1,5,9,2,0,0,1
  assert.ok(a.co.some((x) => x.id === 'quyet-tam'));
});
test('analyzeNumerology + scoreNumerology: 6 chỉ số trong 0–100, có nhãn và độ tin cậy', () => {
  const r = analyzeNumerology({ dd: 14, mm: 2, yy: 1985 }, 'Nguyễn Văn A', { dd: 31, mm: 10, yy: 2026 }, N);
  assert.equal(r.duongDoi, 3); assert.equal(r.suMenh, 7);
  const s = scoreNumerology(r, N);
  for (const k of ['tong', 'tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan']) assert.ok(s[k] >= 0 && s[k] <= 100, k);
  assert.ok(s.nhan && s.doTinCay > 0 && s.doTinCay <= 1);
});
test('không có tên: vẫn tính được đường đời, bỏ sứ mệnh/linh hồn/nhân cách và hạ độ tin cậy', () => {
  const r = analyzeNumerology({ dd: 14, mm: 2, yy: 1985 }, '', { dd: 31, mm: 10, yy: 2026 }, N);
  assert.equal(r.suMenh, null); assert.equal(r.duongDoi, 3);
  assert.ok(scoreNumerology(r, N).doTinCay < 0.45);
});
