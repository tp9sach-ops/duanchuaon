// Hỏa v2 (Phiên 157, Bản 2 mục 5.5): thẻ bổ sung khớp combatSkills (không đổi id/tên/cấp/hồi/tổng hệ số), cơ chế Thiêu đốt/hất tung/trên không.
import test from 'node:test';
import assert from 'node:assert/strict';
import { HOA_V2 } from '../js/data/chieuHoa.js';
import { chieuHoa, baoTruoc, hoa3Trung, longTuc, phanThienKichNo, muaLua } from '../js/world/chieuHoa.js';
import { skillById, skillsOfHe } from '../js/world/skillCatalog.js';
import { chuoiMoc, createThieuDot } from '../js/world/luatChien.js';

test('đủ 6 chiêu Hỏa; id/tên/cấp/hồi/hệ số trong combatSkills giữ nguyên số Bản 2', () => {
  const ids = skillsOfHe('hoa').map((s) => s.id); assert.equal(ids.length, 6); assert.deepEqual(Object.keys(HOA_V2).sort(), [...ids].sort());
  const k = (id) => skillById(id); const row = (id) => [k(id).ten, k(id).cap, k(id).cd, k(id).heSo];
  assert.deepEqual(row('hoa_1'), ['Liệt Hỏa Chưởng', 10, 7, 1.8]); assert.deepEqual(row('hoa_2'), ['Cuồng Long Phẫn Nộ', 14, 18, 0]);
  assert.deepEqual(row('hoa_3'), ['Hỏa Long Xuất Hải', 20, 25, 4.5]); assert.deepEqual(row('hoa_liethoa_4'), ['Bạo Liệt Hỏa Vũ', 30, 20, 0]);
  assert.deepEqual(row('hoa_hoalong_4'), ['Long Tức Trảm', 30, 18, 5]); assert.deepEqual(row('hoa_tuyet'), ['Liên Hoa Hỏa Thế', 60, 60, 1]);
  assert.ok(Object.isFrozen(HOA_V2) && Object.isFrozen(HOA_V2.hoa_3.hatTung)); assert.equal(chieuHoa('kim_1'), null);
});

test('mỗi chiêu Hỏa: có gồng, vùng cảnh báo hoa văn sọc nhọn, cách khắc; móc nối trỏ tới chiêu có thật', () => {
  for (const [id, c] of Object.entries(HOA_V2)) {
    assert.ok(c.gong > 0, id); assert.equal(c.canhBao.hoaVan, 'socNhon', id); assert.ok(typeof c.khac === 'string' && c.khac.length > 15, id);
    for (const m of c.moc) assert.ok(skillById(m), `${id} → ${m}`);
  }
  assert.ok(HOA_V2.hoa_tuyet.gong >= 1.5 && HOA_V2.hoa_tuyet.canhBao.tuDau, 'tuyệt học: gồng ≥ 1,5 s, vòng cảnh báo hiện từ đầu');
  assert.ok(baoTruoc('hoa_1') >= 0.25 && baoTruoc('hoa_liethoa_4') >= 0.8, 'diện rộng ≥ 0,5 s');
  assert.equal(baoTruoc('hoa_1'), 0.69); assert.equal(baoTruoc('kim_1'), 0);
});

test('Hỏa Long Xuất Hải: dưới 2 tầng hất 1,0 s; từ 2 tầng hất 1,3 s, tiêu tầng, +0,4 hệ số mỗi tầng', () => {
  assert.deepEqual(hoa3Trung(0), { heSo: 4.5, hatTung: 1, tieuTang: 0 }); assert.deepEqual(hoa3Trung(1), { heSo: 4.5, hatTung: 1, tieuTang: 0 });
  assert.deepEqual(hoa3Trung(2), { heSo: 5.3, hatTung: 1.3, tieuTang: 2 }); assert.deepEqual(hoa3Trung(3), { heSo: 5.7, hatTung: 1.3, tieuTang: 3 });
  assert.deepEqual(hoa3Trung('x'), { heSo: 4.5, hatTung: 1, tieuTang: 0 });
});

test('Long Tức Trảm: thường nạp 2 s (5,0); trên không chỉ khi mục tiêu bị hất, nạp 0,8 s, tổng 5,0; bị khống chế thì mất nhát còn lại', () => {
  assert.deepEqual(longTuc(false), { dang: 'thuong', nap: 2, heSo: 5, nhat: [5] });
  const a = longTuc(true); assert.equal(a.dang, 'trenKhong'); assert.equal(a.nap, 0.8); assert.equal(a.heSo, 5); assert.deepEqual(a.nhat, [0.9, 0.9, 0.9, 0.9, 1.4]);
  assert.equal(longTuc(true, 2).heSo, 1.8); assert.equal(longTuc(true, 0).heSo, 0);
});

test('Liên Hoa Hỏa Thế: +0,6 mỗi tầng; dưới 30% Sinh Lực +30%; Bạo Liệt Hỏa Vũ tổng 2,4', () => {
  assert.deepEqual(phanThienKichNo(3, 1), { congHeSo: 1.8, nhanEpMau: 1 }); assert.deepEqual(phanThienKichNo(0, 0.29), { congHeSo: 0, nhanEpMau: 1.3 }); assert.equal(phanThienKichNo(1, 0.3).nhanEpMau, 1);
  assert.deepEqual(muaLua(4), { heSo: 2.4, tang: 3 }); assert.deepEqual(muaLua(2), { heSo: 1.2, tang: 2 }); assert.deepEqual(muaLua(99), { heSo: 2.4, tang: 3 });
});

test('combo Hỏa: Liệt Hỏa Chưởng → Hỏa Long Xuất Hải → Long Tức Trảm móc nối +10% rồi +20%; chuỗi tích tầng Thiêu đốt', () => {
  const r = chuoiMoc([{ id: 'hoa_1', t: 0 }, { id: 'hoa_3', t: 1 }, { id: 'hoa_hoalong_4', t: 2 }]);
  assert.deepEqual(r.map((x) => x.bonus), [0, 0.1, 0.2]); assert.equal(r[1].giamCd, 0.5);
  const t = createThieuDot(); t.them(1, 180, 0); t.them(1, 180, 0.5);   // 2 chưởng
  assert.equal(hoa3Trung(t.tang(1)).tieuTang, 2); assert.equal(t.kichNo(1), 2);
});
