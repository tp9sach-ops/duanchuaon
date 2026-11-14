// Thông tin + biểu tượng chiêu (Phiên 162, Bản 2 mục 1): đủ 30 chiêu, số khớp dữ liệu nguồn, id lạ an toàn.
import test from 'node:test';
import assert from 'node:assert/strict';
import { infoOf, infoRows, iconSpec, HE_COLOR } from '../js/world/chieuInfo.js';
import { COMBAT_SKILLS, SKILL_CAP } from '../js/data/combatSkills.js';
import { congOf } from '../js/world/stats.js';
import { effectiveHeSo } from '../js/world/skillEngine.js';

test('đủ 30 chiêu đều có bảng thông tin và biểu tượng', () => {
  assert.equal(COMBAT_SKILLS.length, 30);
  for (const s of COMBAT_SKILLS) {
    const i = infoOf(s.id, { tuvi: 60, level: 1 }), ic = iconSpec(s.id);
    assert.ok(i && ic, s.id);
    assert.equal(i.ten, s.ten); assert.equal(i.cd, s.cd); assert.equal(i.cap, SKILL_CAP[s.slot]);
    assert.equal(ic.mau, HE_COLOR[s.he]); assert.ok(ic.chu.length >= 1 && ic.van);
    assert.ok(infoRows(i).length >= 5, s.id);
  }
});
test('sát thương mẫu = Công × hệ số theo cấp chiêu; chiêu hỗ trợ = 0', () => {
  const s = COMBAT_SKILLS.find((x) => x.heSo > 0), t = 40;
  const i = infoOf(s.id, { tuvi: t, level: 3 });
  assert.equal(i.level, 3);
  assert.equal(i.satThuongMau, Math.round(congOf(t) * effectiveHeSo(s, 3)));
  const sp = COMBAT_SKILLS.find((x) => !(x.heSo > 0));
  if (sp) assert.equal(infoOf(sp.id, { tuvi: 60 }).satThuongMau, 0);
});
test('cấp chiêu bị kẹp theo Tu Vi; chưa đủ cấp thì moKhoa=false', () => {
  const s = COMBAT_SKILLS.find((x) => x.slot === 3);
  const i = infoOf(s.id, { tuvi: 12, level: 9 });
  assert.equal(i.moKhoa, false); assert.equal(i.level, 1); assert.equal(i.levelToiDa, 1);
  assert.equal(infoOf(s.id, { tuvi: 100, level: 99 }).level, 10);
});
test('Hỏa có nội tại Thiêu đốt và nối tiếp; id lạ → null', () => {
  const i = infoOf('hoa_1', { tuvi: 20 });
  assert.ok(i.noiTai.some((x) => /Thiêu đốt/.test(x)));
  assert.deepEqual(i.moc.length, 1);
  assert.equal(infoOf('khong_co'), null); assert.equal(iconSpec('khong_co'), null); assert.deepEqual(infoRows(null), []);
});
