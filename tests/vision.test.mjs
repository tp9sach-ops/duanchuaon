import test from 'node:test';
import assert from 'node:assert/strict';
import { chuanHoaKetQua, kichThuocThuNho, thongBaoLoi } from '../js/engines/vision.js';

test('chuẩn hóa: bỏ trường lạ, cắt dài, giới hạn 3 lời khuyên', () => {
  const r = chuanHoaKetQua({ chatLuongAnh: 'tot', tongQuan: 'x'.repeat(900), muc: [{ ten: 'Sinh mệnh', quanSat: 'dài', y: 'ổn', hack: '<img>' }, { ten: '', quanSat: 'a' }], loiKhuyen: ['a', 'b', 'c', 'd'], extra: 1 });
  assert.equal(r.tongQuan.length, 500); assert.equal(r.muc.length, 1); assert.equal(r.muc[0].hack, undefined); assert.equal(r.loiKhuyen.length, 3); assert.equal(r.extra, undefined);
});
test('chuẩn hóa: dữ liệu rỗng hoặc sai kiểu → null; chất lượng lạ → vừa', () => {
  assert.equal(chuanHoaKetQua(null), null); assert.equal(chuanHoaKetQua('x'), null); assert.equal(chuanHoaKetQua({}), null);
  assert.equal(chuanHoaKetQua({ tongQuan: 'ok', chatLuongAnh: 'siêu' }).chatLuongAnh, 'vua');
});
test('thu nhỏ ảnh giữ tỉ lệ, không phóng to', () => {
  assert.deepEqual(kichThuocThuNho(4000, 3000, 1024), { w: 1024, h: 768 });
  assert.deepEqual(kichThuocThuNho(600, 400, 1024), { w: 600, h: 400 });
});
test('thông báo lỗi có tiếng Việt cho mã đã biết và mã lạ', () => {
  assert.match(thongBaoLoi('vision_not_configured'), /khóa AI/); assert.match(thongBaoLoi('vision_http_500'), /ảnh/); assert.match(thongBaoLoi('xyz'), /lỗi/);
});
