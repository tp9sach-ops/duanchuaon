// Phiên 198 (mục 2): ĐÁNH THƯỜNG = lao tới + combo 3 đòn (js/world/basicCombo.js + chuỗi động tác js/world/combo.js) và việc nối vào js/ui/farm.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BASIC, planTap, nextStep, stepMul, splashTargets } from '../js/world/basicCombo.js';
import { CHAIN, SLASH, nextKind } from '../js/world/combo.js';

test('planTap: không quái → air; trong tầm đâm → hit; xa tầm đâm nhưng trong tầm lao → dash; quá xa → far', () => {
  assert.equal(planTap({ has: false }), 'air');
  assert.equal(planTap({ has: false, gap: 2 }), 'air');
  assert.equal(planTap({ has: true, gap: 3 }), 'hit');
  assert.equal(planTap({ has: true, gap: 3, body: 0.55, melee: 3.6 }), 'hit');
  assert.equal(planTap({ has: true, gap: 10, body: 0.55, melee: 3.6 }), 'dash');
  assert.equal(planTap({ has: true, gap: 18, body: 0.55, melee: 3.6 }), 'far');
  assert.equal(planTap({ has: true, gap: 9, body: 0.55, melee: 3.6, dashRange: 1 }), 'far', 'tầm lao đổi được');
});

test('nextStep: nối 1 → 2 → 3 rồi về 1; quá hạn thì về 1', () => {
  assert.equal(nextStep(0, 0), 1);
  assert.equal(nextStep(1, 0.5), 2);
  assert.equal(nextStep(2, 0.5), 3);
  assert.equal(nextStep(3, 0.5), 1, 'xong đòn 3 thì chuỗi mới');
  assert.equal(nextStep(1, BASIC.resetGap + 1), 1, 'quá hạn');
  assert.equal(nextStep(1), 1, 'thiếu số giây → coi như quá hạn');
});

test('stepMul: đòn 3 mạnh hơn; đòn lạ → 1', () => {
  assert.equal(stepMul(1), 1); assert.equal(stepMul(2), 1); assert.ok(stepMul(3) > 1);
  assert.equal(stepMul(0), 1); assert.equal(stepMul(4), 1); assert.equal(stepMul('x'), 1);
});

test('chuỗi 3 đòn có 3 động tác KHÁC nhau; đòn cuối xoay 360° có vệt đúng bằng bán kính sát thương lan', () => {
  assert.equal(BASIC.steps, 3); assert.equal(CHAIN.length, BASIC.steps); assert.equal(new Set(CHAIN).size, 3, '3 động tác khác nhau');
  assert.equal(CHAIN[2], 'xoay'); assert.ok(Math.abs(SLASH.xoay.arc - Math.PI * 2) < 1e-9, 'xoay đủ vòng');
  assert.equal(SLASH.xoay.reach, BASIC.splashR, 'vệt xoay trùng tầm sát thương lan');
  assert.equal(nextKind('', 9), 'ngang'); assert.equal(nextKind('ngang', 0.2), 'nguoc'); assert.equal(nextKind('nguoc', -0.1), 'xoay');
  assert.equal(nextKind('xoay', 0), 'ngang', 'xong đòn cuối thì về đòn đầu'); assert.equal(nextKind('ngang', 5), 'ngang', 'quá hạn');
});

test('splashTargets: quái quanh người (tính từ mép thân) trừ mục tiêu chính; giữ thứ tự; dữ liệu lạ → []', () => {
  const mons = [{ uid: 'a', x: 1, z: 0 }, { uid: 'b', x: 4, z: 0 }, { uid: 'c', x: 10, z: 0 }, { uid: 'd', x: 5, z: 0, body: 1 }];
  const r = splashTargets({ x: 0, z: 0 }, mons, BASIC.splashR, 'a', (m) => m.body || 0);
  assert.deepEqual(r.map((m) => m.uid), ['b', 'd'], 'c quá xa; a là mục tiêu chính; d nhờ thân to nên trong tầm');
  assert.deepEqual(splashTargets({ x: 0, z: 0 }, mons, 2, '').map((m) => m.uid), ['a']);
  assert.deepEqual(splashTargets(null, mons), []); assert.deepEqual(splashTargets({ x: 0, z: 0 }, null), []); assert.deepEqual(splashTargets({ x: NaN, z: 0 }, mons), []);
});

test('nối dây js/ui/farm.js: Đánh thường dùng planTap (không quái / lao / trúng / xa), đòn 3 lan, quái dính đòn đánh trả nhờ Oán Khí giảm', () => {
  const farm = readFileSync(new URL('../js/ui/farm.js', import.meta.url), 'utf8');
  assert.match(farm, /from '\.\.\/world\/basicCombo\.js'/); assert.match(farm, /from '\.\.\/world\/combo\.js'/);
  assert.match(farm, /planTap\(\{/); assert.match(farm, /if \(plan === 'air'\)/); assert.match(farm, /if \(plan === 'far'\)/); assert.match(farm, /if \(plan === 'dash'\)/);
  assert.match(farm, /stepMul\(ck\.step\)/); assert.match(farm, /splashTargets\(p, view\.mons, BASIC\.splashR, t\.uid, bodyOf\)/); assert.match(farm, /for \(const m of around\) hit\(m\.uid/);
  assert.match(farm, /skillHitDir/);
  const fc = readFileSync(new URL('../js/ui/farmCombat.js', import.meta.url), 'utf8');
  assert.match(fc, /m\.oan < m\._o/, 'quái nào Oán Khí giảm thì nổi giận đánh trả');
});
