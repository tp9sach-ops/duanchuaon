// Test dữ liệu kỹ năng chiến đấu (G2.2). Chạy: node --test tests/combatskills.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_SKILLS, PHAP_MON, SKILL_CAP, TUYET_TAM_AN, TUYET_CD } from '../js/data/combatSkills.js';
import { HE_LIST } from '../js/data/elements.js';
import { skillById, skillsOfHe, phapMonById, phapMonOfHe, skillFor, capOfSlot, slotsUnlocked } from '../js/world/skillCatalog.js';

const bySlot = (s) => COMBAT_SKILLS.filter((x) => x.slot === s);

test('combatskills: số lượng đúng GDD (15 gốc + 10 Skill 4 + 5 Tuyệt Học = 30; 10 Pháp Môn)', () => {
  assert.equal(COMBAT_SKILLS.length, 30);
  assert.equal(bySlot(1).length + bySlot(2).length + bySlot(3).length, 15);
  assert.equal(bySlot(4).length, 10); assert.equal(bySlot('tuyet').length, 5); assert.equal(PHAP_MON.length, 10);
  assert.ok(Object.isFrozen(COMBAT_SKILLS) && Object.isFrozen(COMBAT_SKILLS[0]) && Object.isFrozen(COMBAT_SKILLS[0].fx) && Object.isFrozen(PHAP_MON));
});

test('combatskills: mỗi Hệ đủ Skill 1, 2, 3, Tuyệt Học và 2 Skill 4 (mỗi Pháp Môn một)', () => {
  for (const he of HE_LIST) {
    const l = skillsOfHe(he);
    assert.equal(l.length, 6, he);
    for (const s of [1, 2, 3, 'tuyet']) assert.equal(l.filter((x) => x.slot === s).length, 1, `${he} ô ${s}`);
    const s4 = l.filter((x) => x.slot === 4);
    assert.equal(s4.length, 2, he);
    assert.deepEqual(s4.map((x) => x.phapMon).sort(), phapMonOfHe(he).map((p) => p.id).sort(), he);
  }
});

test('combatskills: trường bắt buộc, id/tên không trùng, số hợp lệ', () => {
  const ids = new Set(), names = new Set();
  for (const s of COMBAT_SKILLS) {
    assert.ok(typeof s.id === 'string' && s.id && !ids.has(s.id), `id ${s.id}`); ids.add(s.id);
    assert.ok(typeof s.ten === 'string' && s.ten.trim() && !names.has(s.ten), `tên ${s.ten}`); names.add(s.ten);
    assert.ok(HE_LIST.includes(s.he), s.id);
    assert.ok([1, 2, 3, 4, 'tuyet'].includes(s.slot), s.id);
    assert.ok(Number.isFinite(s.cd) && s.cd > 0, `${s.id} hồi chiêu > 0`);
    assert.ok(Number.isFinite(s.heSo) && s.heSo >= 0, `${s.id} heSo >= 0`);
    assert.equal(s.cap, SKILL_CAP[s.slot], `${s.id} cấp mở khóa đúng ô`);
    assert.ok(s.fx && typeof s.fx === 'object', s.id);
    assert.equal(skillById(s.id), s);
  }
});

test('combatskills: Skill 4 gắn đúng Pháp Môn cùng Hệ; ô khác không có phapMon', () => {
  for (const s of COMBAT_SKILLS) {
    if (s.slot === 4) { const p = phapMonById(s.phapMon); assert.ok(p, s.id); assert.equal(p.he, s.he, s.id); } else assert.equal(s.phapMon, undefined, s.id);
  }
  for (const p of PHAP_MON) { assert.ok(HE_LIST.includes(p.he)); assert.equal(phapMonOfHe(p.he).filter((x) => x.id === p.id).length, 1); }
});

test('combatskills: Tuyệt Học cấp 60, tiêu 5 Tâm Ấn, hồi 60 giây', () => {
  assert.equal(TUYET_TAM_AN, 5); assert.equal(TUYET_CD, 60);
  for (const s of bySlot('tuyet')) { assert.equal(s.cap, 60); assert.equal(s.cd, 60); assert.equal(s.tamAn, 5); }
  for (const s of COMBAT_SKILLS.filter((x) => x.slot !== 'tuyet')) assert.equal(s.tamAn, undefined, s.id);
});

test('combatskills: đối chiếu số liệu GDD (hệ số, hồi chiêu, hiệu ứng chính)', () => {
  const k = (id) => skillById(id);
  assert.deepEqual([k('kim_1').heSo, k('kim_1').cd, k('kim_1').fx.choang.chance, k('kim_1').fx.choang.dur], [1.5, 6, 0.3, 2]);
  assert.deepEqual([k('moc_1').cd, k('moc_1').fx.hits, k('moc_1').fx.doc.pctPerSec, k('moc_1').fx.doc.dur], [5, 3, 0.2, 6]);
  assert.deepEqual([k('hoa_1').heSo, k('hoa_1').cd, k('hoa_1').fx.noLan.r], [1.8, 7, 4]);
  assert.deepEqual([k('kim_2').cd, k('kim_2').fx.giap, k('kim_2').fx.phanDon.pct, k('kim_2').fx.dur], [20, 0.2, 0.1, 10]);
  assert.deepEqual([k('hoa_2').fx.chiMang, k('hoa_2').fx.tocDanh, k('hoa_2').fx.dur], [0.4, 0.25, 8]);
  assert.deepEqual([k('kim_3').heSo, k('kim_3').cd, k('kim_3').fx.lao.khoang], [3, 15, 10]);
  assert.deepEqual([k('hoa_3').heSo, k('hoa_3').cd], [4.5, 25]);
  assert.deepEqual([k('thuy_3').cd, k('thuy_3').fx.dongBang.r, k('thuy_3').fx.dongBang.dur], [22, 10, 3]);
  assert.deepEqual([k('kim_thietky_4').heSo, k('kim_thietky_4').cd, k('kim_thietky_4').fx.giamGiap.pct], [2.2, 14, 0.15]);
  assert.deepEqual([k('moc_anthan_4').heSo, k('moc_anthan_4').fx.heSoKhiAnThan, k('moc_anthan_4').cd], [2.5, 4, 15]);
  assert.deepEqual([k('hoa_hoalong_4').heSo, k('hoa_hoalong_4').fx.nap, k('hoa_hoalong_4').cd], [5, 2, 18]);
  assert.deepEqual([k('hoa_liethoa_4').fx.mua.hePerSec, k('hoa_liethoa_4').fx.mua.dur, k('hoa_liethoa_4').fx.mua.r], [0.6, 4, 8]);
  assert.deepEqual([k('moc_tuyet').heSo, k('moc_tuyet').fx.hits], [0.8, 12]);
  assert.deepEqual([k('hoa_tuyet').heSo, k('hoa_tuyet').fx.hits], [1, 9]);
  assert.deepEqual([k('tho_tuyet').heSo, k('tho_tuyet').fx.choang.dur], [4, 3]);
});

test('combatskills: ô có số GDD không nêu được đánh dấu tamSo', () => {
  assert.deepEqual(skillById('tho_3').tamSo, ['fx.vung.hePerSec']);
  for (const s of COMBAT_SKILLS) if (s.tamSo !== undefined) assert.ok(Array.isArray(s.tamSo), s.id);
});

test('skillCatalog: skillFor theo ô, Pháp Môn bắt buộc cho ô 4, Hệ/ô lạ → null', () => {
  assert.equal(skillFor('kim', 1).id, 'kim_1'); assert.equal(skillFor('HOA', '3').id, 'hoa_3'); assert.equal(skillFor('tho', 'tuyet').id, 'tho_tuyet');
  assert.equal(skillFor('kim', 4, 'kimcang').id, 'kim_kimcang_4'); assert.equal(skillFor('kim', 4, 'thietky').id, 'kim_thietky_4');
  assert.equal(skillFor('kim', 4), null); assert.equal(skillFor('kim', 4, 'liethoa'), null);   // thiếu / sai Hệ
  for (const v of [undefined, null, 'x', 5, {}]) { assert.equal(skillFor(v, 1), null, String(v)); assert.equal(skillById(v), null); assert.equal(phapMonById(v), null); assert.deepEqual(skillsOfHe(v), []); assert.deepEqual(phapMonOfHe(v), []); }
  for (const v of [undefined, 0, 5, 'x', null]) assert.equal(skillFor('kim', v), null, String(v));
});

test('skillCatalog: ô mở khóa theo mốc cấp (10 / 14 / 20 / 30 / 60)', () => {
  assert.deepEqual([capOfSlot(1), capOfSlot(2), capOfSlot(3), capOfSlot(4), capOfSlot('tuyet'), capOfSlot(9), capOfSlot(null)], [10, 14, 20, 30, 60, null, null]);
  assert.deepEqual(slotsUnlocked(9), []); assert.deepEqual(slotsUnlocked(10), [1]); assert.deepEqual(slotsUnlocked(13), [1]);
  assert.deepEqual(slotsUnlocked(14), [1, 2]); assert.deepEqual(slotsUnlocked(20), [1, 2, 3]); assert.deepEqual(slotsUnlocked(30), [1, 2, 3, 4]);
  assert.deepEqual(slotsUnlocked(59), [1, 2, 3, 4]); assert.deepEqual(slotsUnlocked(60), [1, 2, 3, 4, 'tuyet']);
  for (const v of [undefined, null, NaN, 'abc', -5]) assert.deepEqual(slotsUnlocked(v), [], String(v));
});
