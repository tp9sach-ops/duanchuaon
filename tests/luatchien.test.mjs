// Luật lõi chiến đấu (Phiên 156, Bản 2 mục 3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { kHeOf, gstTong, damage, phanUng, cdMatKhiHuy, dangEpMau, gioiHan, chamTong, createKhang, khoaLienTuc, createThieuDot, chuoiMoc } from '../js/world/luatChien.js';

test('K_hệ theo mã: ×1,3 / ×0,8 / ×1', () => {
  const v = ['kim', 'moc', 'tho', 'thuy', 'hoa'];
  v.forEach((h, i) => { assert.equal(kHeOf(h, v[(i + 1) % 5]), 1.3); assert.equal(kHeOf(v[(i + 1) % 5], h), 0.8); assert.equal(kHeOf(h, h), 1); });
  assert.equal(kHeOf('x', 'kim'), 1);
});

test('damage: công thức Bản 2, giảm tổng ≤ 70%, đoán gồng +20%, chí mạng ×1,5', () => {
  assert.equal(damage({ cong: 100, heSo: 1.5 }), 150);
  assert.equal(damage({ cong: 100, heSo: 1, thu: 100 }), 50);
  assert.equal(damage({ cong: 100, heSo: 1, ts: 0.1, cuongHoa: 0.1 }), 120);
  assert.equal(damage({ cong: 100, heSo: 1, atk: 'kim', def: 'moc' }), 130);
  assert.equal(damage({ cong: 100, heSo: 1, atk: 'moc', def: 'kim' }), 80);
  assert.equal(damage({ cong: 100, heSo: 1, gst: 0.95 }), 30); assert.equal(gstTong(0.25, 0.3, 0.3), 0.7);
  assert.equal(damage({ cong: 100, heSo: 1, doanGong: true }), 120); assert.equal(damage({ cong: 100, heSo: 1, chiMang: true }), 150);
  assert.equal(damage({ cong: 100, heSo: 0 }), 0); assert.equal(damage(), 0); assert.equal(damage({ cong: 1, heSo: 0.1 }), 1);
});

test('5 phản ứng Hệ, không phân biệt thứ tự', () => {
  for (const [a, b, id] of [['hoa', 'moc', 'bungChay'], ['thuy', 'hoa', 'hoiNuoc'], ['kim', 'hoa', 'nongChay'], ['tho', 'thuy', 'bunLay'], ['thuy', 'kim', 'gionLanh']]) { assert.equal(phanUng(a, b).id, id); assert.equal(phanUng(b, a).id, id); }
  assert.equal(phanUng('kim', 'moc'), null); assert.equal(phanUng('hoa', 'hoa'), null); assert.equal(phanUng('hoa', 'x'), null);
});

test('hủy gồng, ép máu, trần khống chế theo chế độ, làm chậm ≤ 60%', () => {
  assert.equal(cdMatKhiHuy(20), 6); assert.equal(cdMatKhiHuy(20, true), 20);
  assert.equal(dangEpMau(0.29), true); assert.equal(dangEpMau(0.3), false);
  assert.equal(gioiHan('choang', 'pve'), 3); assert.equal(gioiHan('choang', 'voDai'), 1.2); assert.equal(gioiHan('troi', 'voDai'), 1.5); assert.equal(gioiHan('cham'), Infinity);
  assert.equal(chamTong(0.5, 0.4), 0.6);
});

test('kháng lũy tiến: 100% → 60% → 30% → miễn 3 s; chung bộ đếm; hết cửa sổ 8 s thì tính lại', () => {
  const k = createKhang();
  assert.equal(k.ap('choang', 1, 0, 'voDai'), 1); assert.equal(k.ap('troi', 1.5, 1, 'voDai'), 0.9); assert.equal(k.ap('dongBang', 1.2, 2, 'voDai'), 0.36);
  assert.equal(k.ap('choang', 1, 3), 0, 'miễn nhiễm'); assert.equal(k.ap('choang', 1, 5.3), 0);
  assert.equal(k.ap('choang', 1, 5.4), 1, 'hết miễn → chu kỳ mới');
  const k2 = createKhang(); assert.equal(k2.ap('choang', 1, 0), 1); assert.equal(k2.ap('choang', 1, 9), 1);
});

test('hất tung lại trong 6 s còn 0,5 s; võ đài kẹp choáng 1,2 s', () => {
  const k = createKhang(); assert.equal(k.ap('hatTung', 1, 0), 1); assert.equal(k.ap('hatTung', 1, 3), 0.3);
  const d = createKhang(); assert.equal(d.ap('choang', 3, 0, 'voDai'), 1.2);
});

test('không ai bị khóa quá 3 s liên tục (nối khống chế dài nhất cũng dưới 3 s)', () => {
  for (const g of [1, 1.2, 1.5, 2, 3]) assert.ok(khoaLienTuc([g, g, g, g, g, g]) <= 3, `g=${g}`);
});

test('Thiêu đốt: 3 s × 8%/s, tối đa 3 tầng, không làm mới; dập tắt; kích nổ', () => {
  const t = createThieuDot(); assert.equal(t.them(1, 160, 0), 1); assert.equal(t.moiGiay(0), 12.8);
  assert.equal(t.them(5, 100, 1), 2); assert.equal(t.tang(1), 3); assert.equal(t.tang(3.1), 2, 'tầng đầu hết đúng 3 s, không làm mới'); assert.equal(t.tang(4.1), 0);
  t.them(2, 100, 10); assert.equal(t.dapTat(), 2); assert.equal(t.tang(10), 0);
  t.them(3, 100, 20); assert.equal(t.kichNo(21), 3); assert.equal(t.kichNo(21), 0); assert.equal(t.them(0, 100, 30), 0);
});

test('móc nối: +10% mỗi mắt xích (tối đa +30%), −0,5 s hồi chiêu, trong 1,5 s, tối đa 4 mắt xích', () => {
  const M = { a: ['b'], b: ['c'], c: ['d'], d: ['e'], e: [] }, f = (id) => M[id] || [];
  const r = chuoiMoc([{ id: 'a', t: 0 }, { id: 'b', t: 1 }, { id: 'c', t: 2 }, { id: 'd', t: 3 }, { id: 'e', t: 4 }], f);
  assert.deepEqual(r.map((x) => x.bonus), [0, 0.1, 0.2, 0.3, 0]); assert.deepEqual(r.map((x) => x.moc), [false, true, true, true, false]); assert.equal(r[1].giamCd, 0.5);
  assert.equal(chuoiMoc([{ id: 'a', t: 0 }, { id: 'b', t: 1.6 }], f)[1].moc, false, 'quá 1,5 s');
  assert.equal(chuoiMoc([{ id: 'a', t: 0 }, { id: 'c', t: 1 }], f)[1].moc, false, 'không phải cặp móc nối');
});
