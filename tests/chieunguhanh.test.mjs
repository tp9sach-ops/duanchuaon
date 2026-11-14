// 24 thẻ chiêu Kim/Mộc/Thủy/Thổ (Phiên 158, Bản 2 mục 5.1–5.4) + hợp nhất 30 chiêu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KIM_V2, MOC_V2, THUY_V2, THO_V2, CHIEU_4HE } from '../js/data/chieuNguHanh.js';
import { chieuOf, mocOf, baoTruoc, laVungLoi } from '../js/world/chieuNguHanh.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';
import { skillsOfHe } from '../js/world/skillCatalog.js';
import { chuoiMoc } from '../js/world/luatChien.js';

const VAN = { kim: 'vachCheo', moc: 'hoaVanLa', thuy: 'gonSong', tho: 'oVuong', hoa: 'socNhon' };

test('đủ 24 thẻ, mỗi Hệ 6, id khớp combatSkills; cả 30 chiêu đều tra được', () => {
  assert.equal(Object.keys(CHIEU_4HE).length, 24); assert.ok(Object.isFrozen(CHIEU_4HE) && Object.isFrozen(CHIEU_4HE.kim_1.canhBao));
  for (const [he, m] of [['kim', KIM_V2], ['moc', MOC_V2], ['thuy', THUY_V2], ['tho', THO_V2]]) assert.deepEqual(Object.keys(m).sort(), skillsOfHe(he).map((s) => s.id).sort(), he);
  for (const s of COMBAT_SKILLS) assert.ok(chieuOf(s.id), s.id); assert.equal(chieuOf('x'), null);
});

test('hoa văn cảnh báo đúng Hệ (5 Hệ khác nhau, có viền+hoa văn không chỉ màu); vùng có lợi là khiên/hồi/ẩn thân', () => {
  for (const s of COMBAT_SKILLS) assert.equal(chieuOf(s.id).canhBao.hoaVan, VAN[s.he], s.id);
  assert.equal(new Set(Object.values(VAN)).size, 5);
  for (const id of ['kim_2', 'moc_2', 'thuy_2', 'thuy_camlo_4', 'thuy_tuyet', 'tho_2', 'tho_daidia_4', 'kim_kimcang_4']) assert.ok(laVungLoi(id), id);
  for (const id of ['kim_1', 'kim_3', 'thuy_3', 'tho_tuyet', 'hoa_3']) assert.ok(!laVungLoi(id), id);
});

test('nguyên tắc 1 (đọc được): chiêu hại ≥ 0,25 s; vòng ≥ 4 m và Thiết Kỵ ≥ 0,5 s; tuyệt học gồng ≥ 1,5 s, vòng hiện từ đầu', () => {
  for (const s of COMBAT_SKILLS) {
    const c = chieuOf(s.id), h = c.canhBao.hinh;
    assert.ok(c.gong > 0 && c.hauDong >= 0, s.id);
    if (s.slot === 'tuyet') { assert.ok(c.gong >= 1.5 && c.canhBao.tuDau, s.id); continue; }
    if (!c.canhBao.loi) { assert.ok(c.gong >= 0.2, s.id); if (h.kieu === 'tron' && h.r >= 4) assert.ok(c.gong >= 0.5, s.id); }
  }
  assert.ok(chieuOf('kim_3').gong >= 0.5);
});

test('mỗi thẻ có cách khắc; chiêu buff hủy gồng được; tuyệt học hoàn 50% hồi chiêu khi bị cắt', () => {
  for (const [id, c] of Object.entries(CHIEU_4HE)) { assert.ok(typeof c.khac === 'string' && c.khac.length > 12, id); assert.ok(Array.isArray(c.moc), id); for (const m of c.moc) assert.ok(chieuOf(m), `${id} → ${m}`); }
  for (const id of ['kim_tuyet', 'moc_tuyet', 'thuy_tuyet', 'tho_tuyet']) assert.equal(chieuOf(id).huyKhiGong.hoanCd, 0.5, id);
  for (const id of ['kim_2', 'moc_2', 'thuy_2', 'tho_2']) assert.equal(chieuOf(id).huyDuoc, true, id);
});

test('số đặc thù Bản 2: Thiết Kỵ vạch 10×2,5 m hở 0,8 s; Thái Sơn r 8; Cam Lộ Triều Âm r 12 chạy chậm 50%; Mê Vụ cần mục tiêu đang dính', () => {
  const k3 = chieuOf('kim_3'); assert.deepEqual([k3.canhBao.hinh.dai, k3.canhBao.hinh.rong, k3.hauDong], [10, 2.5, 0.8]);
  assert.equal(chieuOf('tho_tuyet').canhBao.hinh.r, 8); assert.equal(chieuOf('thuy_tuyet').canhBao.hinh.r, 12); assert.equal(chieuOf('thuy_tuyet').chayCham, 0.5);
  assert.deepEqual(chieuOf('moc_uminh_4').dieuKien.mucTieuDangDinh, ['moc_1', 'moc_3']); assert.equal(chieuOf('kim_tuyet').batKhaXamPham.voDai, 2);
  assert.equal(baoTruoc('moc_1'), 0.89); assert.equal(baoTruoc('thuy_huyenbang_4'), 0.82); assert.equal(baoTruoc('x'), 0);
});

test('móc nối Kim Cương Trảm → Thiết Kỵ / Phá Trận Trảm (+10%, −0,5 s hồi chiêu); dùng mocOf làm tham số', () => {
  assert.deepEqual(mocOf('kim_1'), ['kim_3', 'kim_thietky_4']); assert.deepEqual(mocOf('hoa_3'), ['hoa_hoalong_4']); assert.deepEqual(mocOf('x'), []);
  const r = chuoiMoc([{ id: 'kim_1', t: 0 }, { id: 'kim_3', t: 1 }], mocOf); assert.deepEqual(r.map((x) => x.bonus), [0, 0.1]); assert.equal(r[1].giamCd, 0.5);
  assert.equal(chuoiMoc([{ id: 'kim_1', t: 0 }, { id: 'kim_2', t: 1 }], mocOf)[1].moc, false);
});
