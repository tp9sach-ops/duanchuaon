// Phiên 205: Đánh thường vào yêu quái hằng tháng cũng lao tới + chuỗi 3 đòn (dùng chung với quái bãi rừng).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planTap, stepMul, BASIC } from '../js/world/basicCombo.js';
const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
test('yeuquai.js: Đánh thường = planTap → lao tới (rushPoint) → đòn nhân stepMul', () => {
  const y = r('../js/ui/yeuquai.js');
  assert.match(y, /from '\.\.\/world\/basicCombo\.js'/); assert.match(y, /planTap\(\{ has: true, gap: distBoss\(\)/);
  assert.match(y, /F\.rushPoint\(boss, bd\)/); assert.match(y, /stoneDamage\(str\(\)\) \* \(F && F\.stepMulFor \? F\.stepMulFor\(step\) : stepMul\(step\)\)/);   // Phiên 224: Gậy dạy chó đòn 3 ×3 assert.match(y, /F\.chainStep\(\)/);
});
test('farm.js: xuất rushPoint + chainStep cho yêu quái; rush() của quái bãi rừng gọi lại rushPoint', () => {
  const f = r('../js/ui/farm.js');
  assert.match(f, /rushPoint, stepMulFor, chainStep: \(\) => advanceChain\(performance\.now\(\)\)\.step/); assert.match(f, /function rush\(m\) \{ return rushPoint\(m, bodyOf\(m\)\); \}/);
});
test('kế hoạch đòn với yêu quái thân to: xa → lao, gần → đánh', () => {
  const body = 2.2, melee = 3.6;
  assert.equal(planTap({ has: true, gap: body + melee - 0.1, body, melee }), 'hit');
  assert.equal(planTap({ has: true, gap: body + melee + 5, body, melee }), 'dash');
  assert.equal(planTap({ has: true, gap: body + melee + BASIC.dashRange + 1, body, melee }), 'far');
  assert.ok(stepMul(3) > stepMul(1));
});
