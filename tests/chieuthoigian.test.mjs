// Dòng thời gian mili-giây 30 chiêu (prompt chiêu thức 3D mục 3, 14): thứ tự mốc, khớp thẻ chiêu + lịch tư thế + hồi chiêu, kiểm "đọc được".
import test from 'node:test';
import assert from 'node:assert/strict';
import { dongThoiGian, kiemDocDuoc, bangDongThoiGian, hangThoiGian, CUA_SO_NE_MS, MAT_CD_KHI_HUY, NGUONG_DOC } from '../js/world/chieuTimeline.js';
import { chieuOf } from '../js/world/chieuNguHanh.js';
import { castTimeline } from '../js/world/chieuPose.js';
import { COMBAT_SKILLS } from '../js/data/combatSkills.js';

const ms = (s) => Math.round(s * 1000);

test('đủ 30 chiêu theo thứ tự combatSkills; chiêu lạ / đầu vào hỏng → null', () => {
  const b = bangDongThoiGian(); assert.equal(b.length, 30); assert.deepEqual(b.map((x) => x.id), COMBAT_SKILLS.map((s) => s.id));
  for (const v of ['khong-co', null, undefined, 5, {}]) { assert.equal(dongThoiGian(v), null); assert.equal(kiemDocDuoc(v), null); }
  assert.deepEqual(hangThoiGian(null), []);
});

test('mốc đúng thứ tự: bấm = gồng = cảnh báo = 0 ≤ hủy ≤ phát < hết hậu động ≤ hết hồi chiêu; số nguyên mili-giây', () => {
  for (const t of bangDongThoiGian()) {
    const m = t.moc;
    assert.deepEqual([m.bam, m.gongBatDau, m.canhBaoHien], [0, 0, 0], t.id);
    assert.ok(m.huyDuocDen === m.phat && m.phat > 0 && m.phat < m.hetHauDong && m.hetHauDong <= m.hetHoiChieu, `${t.id} ${JSON.stringify(m)}`);
    assert.ok(m.trungDon >= m.phat, `${t.id} trúng không thể trước phát`);
    for (const v of Object.values(m)) assert.ok(Number.isInteger(v) && v >= 0, t.id);
    assert.equal(t.cuaSoNeDen, m.trungDon + CUA_SO_NE_MS);
  }
});

test('khớp nguồn: gồng = thẻ chiêu, hết hậu động = lịch tư thế, hồi chiêu = combatSkills; ba khung nối liền nhau', () => {
  for (const s of COMBAT_SKILLS) {
    const t = dongThoiGian(s.id), c = chieuOf(s.id), L = castTimeline(s.id);
    assert.equal(t.moc.phat, ms(c.gong), s.id); assert.equal(t.moc.hetHauDong, ms(L.tong), s.id); assert.equal(t.moc.hetHoiChieu, ms(s.cd), s.id); assert.equal(t.cdMs, ms(s.cd));
    assert.deepEqual(t.khung.gong, [0, t.moc.phat]); assert.equal(t.khung.phat[0], t.khung.gong[1]); assert.equal(t.khung.thu[0], t.khung.phat[1]); assert.equal(t.khung.thu[1], t.moc.hetHauDong);
    assert.equal(t.ten, s.ten); assert.equal(t.he, s.he);
  }
});

test('đạn bay: chỉ chiêu thẻ khai báo cả tầm lẫn tốc độ mới cộng thời gian bay vào mốc trúng', () => {
  for (const t of bangDongThoiGian()) { const c = chieuOf(t.id), bay = c.tam && c.tocDo ? ms(c.tam / c.tocDo) : 0; assert.equal(t.bayMs, bay, t.id); }
  const a = dongThoiGian('moc_1'), k = dongThoiGian('kim_1'); assert.ok(a.bayMs > 500 && a.moc.trungDon > a.moc.phat + 500); assert.equal(k.bayMs, 0);
});

test('tuyệt học: gồng ≥ 1,5 s, hồi chiêu dài nhất của Hệ, vùng cảnh báo hiện từ đầu', () => {
  for (const he of ['kim', 'moc', 'thuy', 'tho', 'hoa']) {
    const t = dongThoiGian(he + '_tuyet'); assert.ok(t.moc.phat >= 1500, he); assert.equal(t.slot, 'tuyet'); assert.equal(t.moc.canhBaoHien, 0);
    for (const s of COMBAT_SKILLS.filter((x) => x.he === he)) assert.ok(dongThoiGian(s.id).moc.hetHoiChieu <= t.moc.hetHoiChieu, `${he} ${s.id}`);
  }
});

test('kiểm "đọc được": chiêu buff/có lợi không áp ngưỡng; chiêu gây hại đạt ngưỡng Bản 2; tuyệt học đạt cả hai bộ ngưỡng', () => {
  for (const id of ['kim_2', 'moc_2', 'thuy_2', 'tho_2', 'hoa_2', 'kim_kimcang_4', 'thuy_camlo_4', 'tho_daidia_4', 'thuy_tuyet']) assert.deepEqual(kiemDocDuoc(id), { id, gayHai: false }, id);
  let hai = 0;
  for (const s of COMBAT_SKILLS) {
    const k = kiemDocDuoc(s.id); if (!k.gayHai) continue; hai++;
    assert.ok(['thuong', 'dienRong', 'tuyet'].includes(k.loai) && k.baoTruocMs === dongThoiGian(s.id).moc.trungDon, s.id);
    assert.equal(k.datBan2, k.baoTruocMs >= ms(NGUONG_DOC.ban2[k.loai])); assert.equal(k.datMoi, k.baoTruocMs >= ms(NGUONG_DOC.moi[k.loai]));
    assert.ok(k.datBan2, `${s.id} không đạt ngưỡng Bản 2 (${k.baoTruocMs} ms)`); if (k.loai === 'tuyet') assert.ok(k.datMoi, s.id);
    assert.ok(k.nguongMoiMs >= k.nguongBan2Ms, 'ngưỡng mới nghiêm hơn hoặc bằng Bản 2');
  }
  assert.ok(hai >= 15, 'có ít nhất 15 chiêu gây hại');
  assert.equal(kiemDocDuoc('moc_uminh_4').loai, 'dienRong'); assert.equal(kiemDocDuoc('kim_3').loai, 'dienRong'); assert.equal(kiemDocDuoc('kim_1').loai, 'thuong');
});

test('hằng số luật: cửa sổ né 150 ms, hủy bằng di chuyển mất 30% hồi chiêu, khống chế cắt mất 100%; hàng bảng đủ 8 dòng', () => {
  assert.equal(CUA_SO_NE_MS, 150); assert.deepEqual(MAT_CD_KHI_HUY, { diChuyen: 0.3, biKhongChe: 1 }); assert.ok(Object.isFrozen(NGUONG_DOC) && Object.isFrozen(NGUONG_DOC.moi));
  const r = hangThoiGian(dongThoiGian('hoa_3')); assert.equal(r.length, 8); assert.deepEqual(r[0], ['Bấm nút', 0, 'mốc 0']); assert.equal(r[7][1], 25000);
});
