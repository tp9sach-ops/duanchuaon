// Test công thức sát thương mới (G1.3). Chạy: node --test tests/combat.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_CFG } from '../js/data/stats.js';
import { kHe, thuFactor, thuReducePct, damageOf, damageByTuVi, critRoll } from '../js/world/combat.js';
import { statsOf } from '../js/world/stats.js';
import { stoneDamage, spearDamage } from '../js/world/yeuquai.js';
import { khiDamage } from '../js/world/conKhi.js';
import { dashDamage } from '../js/world/thietDau.js';

test('combat: cấu hình TẠM đúng GDD (1,3 / 1 / 0,8, chí mạng 1,5, đóng băng)', () => {
  assert.equal(COMBAT_CFG.tam, true);
  assert.equal(COMBAT_CFG.kLoi, 1.3); assert.equal(COMBAT_CFG.kThuong, 1); assert.equal(COMBAT_CFG.kBat, 0.8); assert.equal(COMBAT_CFG.chiMang, 1.5);
  assert.ok(Object.isFrozen(COMBAT_CFG));
});

test('combat: kHe theo quan hệ, lạ → 1', () => {
  assert.equal(kHe('loi'), 1.3); assert.equal(kHe('thuong'), 1); assert.equal(kHe('bat'), 0.8);
  for (const v of [undefined, null, 'x', 5, {}]) assert.equal(kHe(v), 1, String(v));
});

test('combat: thuFactor = 100 ÷ (100 + Thủ); Thủ âm/lạ coi như 0', () => {
  assert.equal(thuFactor(0), 1); assert.equal(thuFactor(100), 0.5); assert.equal(thuFactor(300), 0.25);
  for (const v of [-50, NaN, null, undefined, 'abc']) assert.equal(thuFactor(v), 1, String(v));
  assert.equal(thuReducePct(0), 0); assert.equal(thuReducePct(100), 50); assert.equal(thuReducePct(300), 75);
});

test('combat: damageOf có đáp án tay', () => {
  assert.equal(damageOf({ cong: 100, heSo: 1.5, thu: 100 }), 75);                                   // 100×1,5×100/200
  assert.equal(damageOf({ cong: 97, heSo: 1.8, thu: 63 }), 107);                                    // 174,6×100/163 = 107,1
  assert.equal(damageOf({ cong: 97, heSo: 1.8, thu: 63, crit: true }), 161);                        // ×1,5 = 160,7
  assert.equal(damageOf({ cong: 97, heSo: 1.8, thu: 63, cuongHoa: 0.1, rel: 'loi' }), 153);         // ×1,1×1,3 = 153,2
  assert.equal(damageOf({ cong: 10, heSo: 1.5, thu: 5, rel: 'bat' }), 11);                          // 15×0,8×100/105 = 11,43
  assert.equal(damageOf({ cong: 457, heSo: 4.5, thu: 303, rel: 'loi', crit: true }), 995);          // Tu Vi 150 đánh Skill 450% trúng Hệ yếu, chí mạng
  assert.equal(damageOf({ cong: 100 }), 100);                                                       // mặc định: hệ số 1, không thủ
});

test('combat: rel dạng số được dùng làm K_hệ; tối thiểu 1; hệ số/Công ≤ 0 → 0', () => {
  assert.equal(damageOf({ cong: 100, rel: 1.3 }), damageOf({ cong: 100, rel: 'loi' }));
  assert.equal(damageOf({ cong: 37, heSo: 0.1, thu: 23 }), 3);
  assert.equal(damageOf({ cong: 10, thu: 1e6 }), 1);
  assert.equal(damageOf({ cong: 100, heSo: 0 }), 0);
  assert.equal(damageOf({ cong: 0 }), 0);
  assert.equal(damageOf({ cong: -5 }), 0);
});

test('combat: đầu vào lạ không bao giờ ra NaN/âm', () => {
  for (const v of [undefined, null, 5, 'x', [], {}, { cong: NaN }, { cong: 'abc', heSo: 'z' }, { cong: Infinity }]) {
    const r = damageOf(v); assert.ok(Number.isInteger(r) && r >= 0, JSON.stringify(v));
  }
  assert.ok(Number.isInteger(damageOf({ cong: 100, thu: NaN, cuongHoa: NaN, heSo: NaN })));
});

test('combat: damageByTuVi dùng Công theo Tu Vi (js/world/stats.js)', () => {
  assert.equal(damageByTuVi(30, { heSo: 1.8, thu: 63 }), 107);
  assert.equal(damageByTuVi(1), statsOf(1).cong);
  assert.equal(damageByTuVi(150, { heSo: 4.5, thu: 303, rel: 'loi', crit: true }), 995);
  assert.equal(damageByTuVi(30, { cong: 99999, heSo: 1.8, thu: 63 }), 107, 'không cho ghi đè Công');
});

test('combat: sát thương tăng theo từng cấp Tu Vi (cùng skill, cùng Thủ)', () => {
  for (let t = 2; t <= 150; t++) assert.ok(damageByTuVi(t, { heSo: 1.5, thu: 100 }) >= damageByTuVi(t - 1, { heSo: 1.5, thu: 100 }), `@${t}`);
});

test('combat: critRoll', () => {
  assert.equal(critRoll(1, () => 0.99), true);
  assert.equal(critRoll(0, () => 0), false);
  assert.equal(critRoll(0.25, () => 0.24), true);
  assert.equal(critRoll(0.25, () => 0.25), false);
  assert.equal(critRoll(0.5, 'khong-phai-ham'), false);
  assert.equal(critRoll(5, () => 0.999), true);
});

// ---- Chứng minh công thức cũ KHÔNG đổi (docs/GDD_v2_DOICHIEU.md mục 5). Nếu test này đỏ nghĩa là ai đó đã sửa sát thương cũ.
test('combat: ném đá / thương / chém khí / thiết đầu công giữ nguyên kết quả', () => {
  assert.deepEqual([0, 6, 100].map(stoneDamage), [8, 10, 43]);     // 8 + 0,35×sức mạnh
  assert.deepEqual([0, 6, 100].map(spearDamage), [20, 23, 70]);    // 20 + 0,5×sức mạnh
  assert.deepEqual([0, 6, 100].map(khiDamage), [45, 50, 125]);     // 45 + 0,8×sức mạnh
  assert.deepEqual([[4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [8, 100]].map(([b, s]) => dashDamage(b, s)), [70, 110, 160, 220, 300, 350]);
  assert.equal(dashDamage(3, 100), 0); assert.equal(dashDamage(0, 0), 0);
});
