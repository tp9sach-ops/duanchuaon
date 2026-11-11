// Test bộ máy kỹ năng (G2.3). Chạy: node --test tests/skillengine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_LV } from '../js/data/skillCfg.js';
import { skillById } from '../js/world/skillCatalog.js';
import { skillLevelCap, levelMult, effectiveHeSo, canUpgradeLevel, createSkillRuntime } from '../js/world/skillEngine.js';

test('skillengine: cấu hình TẠM đúng GDD (10 cấp, +6%/cấp, Tu Vi ÷ 10, Tâm Ấn tối đa 5)', () => {
  assert.equal(SKILL_LV.tam, true); assert.equal(SKILL_LV.max, 10); assert.equal(SKILL_LV.perLevel, 0.06);
  assert.equal(SKILL_LV.tuViPerLevel, 10); assert.equal(SKILL_LV.tamAnMax, 5); assert.equal(SKILL_LV.tamAnPerHit, 1);
  assert.ok(Object.isFrozen(SKILL_LV));
});

test('skillengine: trần cấp skill = Tu Vi ÷ 10 (xuống), tối đa 10', () => {
  assert.deepEqual([0, 9, 10, 19, 20, 59, 60, 99, 100, 150, 999].map(skillLevelCap), [0, 0, 1, 1, 2, 5, 6, 9, 10, 10, 10]);
  for (const v of [undefined, null, NaN, 'abc', -40]) assert.equal(skillLevelCap(v), 0, String(v));
});

test('skillengine: +6% hệ số mỗi cấp (cấp 1 = gốc, cấp 10 = ×1,54), cấp lạ được kẹp', () => {
  assert.equal(levelMult(1), 1); assert.equal(levelMult(2), 1.06); assert.equal(levelMult(5), 1.24); assert.equal(levelMult(10), 1.54);
  assert.equal(levelMult(0), 1); assert.equal(levelMult(99), 1.54); assert.equal(levelMult(undefined), 1); assert.equal(levelMult(NaN), 1);
  assert.equal(effectiveHeSo(skillById('kim_1'), 1), 1.5); assert.equal(effectiveHeSo(skillById('kim_1'), 10), 2.31);
  assert.equal(effectiveHeSo(skillById('hoa_3'), 10), 6.93); assert.equal(effectiveHeSo(skillById('kim_2'), 10), 0);
  assert.equal(effectiveHeSo(null, 5), 0); assert.equal(effectiveHeSo({}, 5), 0);
});

test('skillengine: canUpgradeLevel theo Tu Vi', () => {
  assert.equal(canUpgradeLevel(1, 10), false); assert.equal(canUpgradeLevel(1, 20), true);
  assert.equal(canUpgradeLevel(5, 50), false); assert.equal(canUpgradeLevel(5, 60), true); assert.equal(canUpgradeLevel(10, 150), false);
});

test('skillengine: chưa chọn Hệ → khong-co; ô lạ → khong-co; Tu Vi thấp → chua-mo kèm cấp cần', () => {
  const r = createSkillRuntime({ tuvi: 100 });
  assert.deepEqual(r.tryCast(1, 0), { ok: false, reason: 'khong-co' });
  assert.equal(r.setHe('khong-phai-he'), false); assert.equal(r.he, null);
  r.setHe('kim');
  for (const s of [0, 5, 'x', undefined, null]) assert.equal(r.tryCast(s, 0).reason, 'khong-co', String(s));
  const low = createSkillRuntime({ he: 'kim', tuvi: 9 });
  assert.deepEqual(low.tryCast(1, 0), { ok: false, reason: 'chua-mo', need: 10 });
  assert.deepEqual(createSkillRuntime({ he: 'kim', tuvi: 13 }).tryCast(2, 0), { ok: false, reason: 'chua-mo', need: 14 });
  assert.deepEqual(createSkillRuntime({ he: 'kim', tuvi: 19 }).tryCast(3, 0), { ok: false, reason: 'chua-mo', need: 20 });
  assert.deepEqual(createSkillRuntime({ he: 'kim', tuvi: 59, phapMon: 'kimcang' }).tryCast('tuyet', 0), { ok: false, reason: 'chua-mo', need: 60 });
});

test('skillengine: hồi chiêu — dùng xong phải đợi đủ giây; skill khác không bị ảnh hưởng', () => {
  const r = createSkillRuntime({ he: 'kim', tuvi: 30 });
  const a = r.tryCast(1, 100);                                   // Kim Cương Trảm, hồi 6 s
  assert.equal(a.ok, true); assert.equal(a.skill.id, 'kim_1'); assert.equal(a.cdUntil, 106);
  assert.deepEqual(r.tryCast(1, 105.9), { ok: false, reason: 'hoi-chieu', left: 0.1 });
  assert.equal(r.cooldownLeft('kim_1', 103), 3); assert.equal(r.cooldownLeft('kim_2', 103), 0);
  assert.equal(r.tryCast(2, 101).ok, true);                      // ô 2 vẫn dùng được
  assert.equal(r.tryCast(1, 106).ok, true);                      // đúng 6 s thì dùng lại
  assert.equal(r.cooldownLeft('kim_1', 999), 0);
});

test('skillengine: ô 4 cần Pháp Môn đúng Hệ; đổi Pháp Môn đổi skill', () => {
  const r = createSkillRuntime({ he: 'hoa', tuvi: 30 });
  assert.equal(r.tryCast(4, 0).reason, 'khong-co');             // chưa chọn Pháp Môn
  r.setHe('hoa', 'liethoa'); assert.equal(r.tryCast(4, 0).skill.id, 'hoa_liethoa_4');
  r.setHe('hoa', 'hoalong'); assert.equal(r.tryCast(4, 0).skill.id, 'hoa_hoalong_4');   // cùng Hệ → không xóa hồi chiêu skill cũ, skill mới độc lập
  r.setHe('hoa', 'kimcang'); assert.equal(r.tryCast(4, 99).reason, 'khong-co');          // Pháp Môn của Hệ khác
});

test('skillengine: Tâm Ấn +1 mỗi đòn, tối đa 5; Tuyệt Học tiêu 5 và hồi 60 s', () => {
  const r = createSkillRuntime({ he: 'moc', tuvi: 60 });
  assert.equal(r.tamAn, 0);
  assert.deepEqual(r.tryCast('tuyet', 0), { ok: false, reason: 'tam-an', have: 0, need: 5 });
  assert.equal(r.onHit(), 1); assert.equal(r.onHit(3), 4);
  assert.deepEqual(r.tryCast('tuyet', 0), { ok: false, reason: 'tam-an', have: 4, need: 5 });
  assert.equal(r.onHit(10), 5);                                   // trần 5
  for (const v of [-3, NaN, 'x', null, undefined]) { r.onHit(v); assert.equal(r.tamAn, 5, String(v)); }
  const c = r.tryCast('tuyet', 10);
  assert.equal(c.ok, true); assert.equal(c.skill.id, 'moc_tuyet'); assert.equal(c.cdUntil, 70); assert.equal(r.tamAn, 0);
  r.onHit(5);
  assert.deepEqual(r.tryCast('tuyet', 69), { ok: false, reason: 'hoi-chieu', left: 1 });    // hồi chiêu kiểm trước Tâm Ấn
  assert.equal(r.tamAn, 5);                                                                    // thất bại không trừ Tâm Ấn
  assert.equal(r.tryCast('tuyet', 70).ok, true);
});

test('skillengine: skill dùng thường không tiêu Tâm Ấn và không tạo Tâm Ấn', () => {
  const r = createSkillRuntime({ he: 'thuy', tuvi: 20 });
  r.onHit(2); r.tryCast(1, 0); r.tryCast(2, 0); r.tryCast(3, 0);
  assert.equal(r.tamAn, 2);
});

test('skillengine: cấp skill bị chặn bởi Tu Vi, không hạ cấp, hệ số theo cấp dùng thật', () => {
  const r = createSkillRuntime({ he: 'kim', tuvi: 50 });          // trần cấp 5
  assert.equal(r.levelOf('kim_1'), 1);
  assert.equal(r.setLevel('kim_1', 10), 5); assert.equal(r.levelOf('kim_1'), 5);
  assert.equal(r.setLevel('kim_1', 3), 5);                         // không hạ
  const c = r.tryCast(1, 0); assert.equal(c.level, 5); assert.equal(c.heSo, 1.86);   // 1,5 × 1,24
  r.setTuVi(100); assert.equal(r.setLevel('kim_1', 10), 10);
  assert.equal(r.tryCast(1, 100).heSo, 2.31);
  r.setTuVi(30);                                                   // Tu Vi giảm (ví dụ chọn lại): cấp dùng thật bị kẹp theo trần mới
  assert.equal(r.effectiveLevel('kim_1'), 3); assert.equal(r.tryCast(1, 200).heSo, 1.68);
  assert.equal(r.setLevel('', 3), 0); assert.equal(r.setLevel(undefined, 3), 0);
});

test('skillengine: đổi sang Hệ khác → kỹ năng về cấp 1 và xóa hồi chiêu; cùng Hệ giữ nguyên', () => {
  const r = createSkillRuntime({ he: 'kim', tuvi: 100 });
  r.setLevel('kim_1', 7); r.tryCast(1, 0);
  r.setHe('kim', 'kimcang'); assert.equal(r.levelOf('kim_1'), 7); assert.ok(r.cooldownLeft('kim_1', 1) > 0);
  r.setHe('hoa');                                                  // Tái Khai Ngộ
  assert.equal(r.levelOf('kim_1'), 1); assert.equal(r.cooldownLeft('kim_1', 1), 0); assert.equal(r.he, 'hoa'); assert.equal(r.phapMon, null);
  assert.equal(r.tryCast(1, 1).skill.id, 'hoa_1');
});

test('skillengine: ô mở khóa theo Tu Vi và đầu vào lạ không ném lỗi', () => {
  assert.deepEqual(createSkillRuntime({ tuvi: 14 }).unlockedSlots(), [1, 2]);
  assert.deepEqual(createSkillRuntime({ tuvi: 60 }).unlockedSlots(), [1, 2, 3, 4, 'tuyet']);
  for (const v of [undefined, null, 'x', 5, []]) { const r = createSkillRuntime(v); assert.equal(r.tuvi, 0); assert.equal(r.he, null); assert.equal(r.tryCast(1, 0).reason, 'khong-co'); }
  const r = createSkillRuntime({ he: 'kim', tuvi: 10 });
  assert.equal(r.tryCast(1, NaN).ok, true);                        // now lạ → coi như 0
  assert.equal(r.cooldownLeft('kim_1', undefined), 6);
});
