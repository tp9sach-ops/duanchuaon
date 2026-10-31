import test from 'node:test';
import assert from 'node:assert/strict';
import { viTriTuVi, anChinhTinh, canCung, lapLaSo, scoreTuVi } from '../js/engines/tuvi.js';

test('vị trí Tử Vi theo bảng quen thuộc: Thủy nhị cục', () => {
  assert.equal(viTriTuVi(2, 1), 1);   // ngày 1 → Sửu
  assert.equal(viTriTuVi(2, 2), 2);   // ngày 2 → Dần
  assert.equal(viTriTuVi(2, 3), 2);   // ngày 3 → Dần (x=1: q=2, Mão lùi 1)
  assert.equal(viTriTuVi(2, 4), 3);   // ngày 4 → Mão
});
test('Hỏa lục cục ngày 1 → Dậu; Kim tứ cục ngày 1 → Hợi', () => {
  assert.equal(viTriTuVi(6, 1), 9);   // d+x=6 → x=5, q=1, Dần lùi 5 = Dậu
  assert.equal(viTriTuVi(4, 1), 11);  // x=3, q=1, Dần lùi 3 = Hợi
});
test('14 chính tinh đủ, Tử Vi và Thiên Phủ đối xứng qua trục Dần–Thân', () => {
  for (let tv = 0; tv < 12; tv++) {
    const s = anChinhTinh(tv); assert.equal(Object.keys(s).length, 14);
    assert.equal((s['Tử Vi'] + s['Thiên Phủ']) % 12, 4);
    Object.values(s).forEach((c) => assert.ok(c >= 0 && c < 12));
  }
  assert.equal(anChinhTinh(2)['Thiên Phủ'], 2);   // Tử Vi Dần → Phủ Dần
  assert.equal(anChinhTinh(0)['Thiên Phủ'], 4);   // Tử Vi Tý → Phủ Thìn
});
test('Ngũ Hổ độn: năm Giáp/Kỷ, cung Dần = Bính', () => {
  assert.equal(canCung(0, 2), 2); assert.equal(canCung(5, 2), 2);
  assert.equal(canCung(1, 2), 4);   // Ất → Mậu Dần
  assert.equal(canCung(0, 0), 2);   // năm Giáp: tháng Tý (11) = Bính Tý
});
test('Mệnh/Thân: tháng 1 giờ Tý → Mệnh Dần; giờ Dần → Mệnh Tý, Thân Thìn', () => {
  const ls = lapLaSo({ lunar: { day: 10, month: 1, year: 1990, leap: false }, gio: 2, gioiTinh: 'nam' });
  assert.equal(ls.menh, 0); assert.equal(ls.than, 4);
  const ls2 = lapLaSo({ lunar: { day: 10, month: 1, year: 1990, leap: false }, gio: 0, gioiTinh: 'nam' });
  assert.equal(ls2.menh, 2); assert.equal(ls2.than, 2);   // giờ Tý: Mệnh = Thân = cung tháng
});
test('lá số hoàn chỉnh: 12 cung, mỗi chính tinh đúng một cung, Tứ hóa gắn đúng sao', () => {
  const ls = lapLaSo({ lunar: { day: 17, month: 4, year: 1990, leap: false }, gio: 6, gioiTinh: 'nam' });
  assert.equal(ls.cung.length, 12); assert.equal(ls.cung.reduce((n, c) => n + c.sao.length, 0), 14);
  assert.equal(ls.cung.filter((c) => c.chucVu === 'Mệnh').length, 1); assert.equal(ls.cung[ls.menh].chucVu, 'Mệnh');
  assert.equal(ls.namSinh, 'Canh Ngọ'); assert.ok(ls.cung.some((c) => c.sao.some((s) => s.hoa === 'Hóa Lộc')));  // Canh: Thái Dương hóa Lộc
  assert.equal(ls.cung.filter((c) => c.daiHan).length, 12);
  const o = scoreTuVi(ls); ['tong', 'tai_loc', 'su_nghiep', 'tinh_cam', 'suc_khoe', 'quy_nhan'].forEach((k) => assert.ok(o[k] >= 25 && o[k] <= 85));
});
test('thiếu giờ sinh thì không lập', () => { assert.equal(lapLaSo({ lunar: { day: 1, month: 1, year: 2000, leap: false }, gio: -1, gioiTinh: 'nam' }), null); });
test('không nêu giới tính: vẫn lập lá số, không có Đại hạn', () => {
  const ls = lapLaSo({ lunar: { day: 5, month: 5, year: 1985, leap: false }, gio: 3, gioiTinh: '' });
  assert.ok(ls); assert.equal(ls.cung.filter((c) => c.daiHan).length, 0); assert.equal(ls.thuan, null);
});
test('Đại hạn: Giáp (dương) nam đi thuận, nữ đi nghịch', () => {
  const a = lapLaSo({ lunar: { day: 5, month: 5, year: 1984, leap: false }, gio: 3, gioiTinh: 'nam' });
  const b = lapLaSo({ lunar: { day: 5, month: 5, year: 1984, leap: false }, gio: 3, gioiTinh: 'nu' });
  assert.equal(a.thuan, true); assert.equal(b.thuan, false);
  assert.deepEqual(a.cung[(a.menh + 1) % 12].daiHan, [a.cuc + 10, a.cuc + 19]);
  assert.deepEqual(b.cung[(b.menh + 11) % 12].daiHan, [b.cuc + 10, b.cuc + 19]);
});
