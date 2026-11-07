// Hồ bơi villa chặn đi bộ nhưng không chặn lối vào lô (Phiên 37, bước 3d).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PLOTS, LOT_W, LOT_D, houseRect, poolRect, houseLevel } from '../js/world/land.js';

const inter = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;

test('chỉ villa (cấp 3) có hồ bơi', () => {
  for (const p of PLOTS) { for (const lv of [0, 1, 2]) assert.equal(poolRect(p, lv), null); assert.ok(poolRect(p, 3)); assert.ok(poolRect(p, 9)); }
});
test('hồ bơi nằm trong lô, không đè thân nhà, không chắn điểm đứng trước nhà', () => {
  for (const p of PLOTS) {
    const pr = poolRect(p, 3), hr = houseRect(p, 3);
    assert.ok(pr.x0 >= p.x0 && pr.x1 <= p.x1 && pr.z0 >= p.z0 && pr.z1 <= p.z1, `lô ${p.id}: hồ tràn ra ngoài lô`);
    assert.ok(!inter(pr, hr), `lô ${p.id}: hồ đè thân nhà`);
    assert.ok(!(p.front.x > pr.x0 && p.front.x < pr.x1 && p.front.z > pr.z0 && p.front.z < pr.z1), `lô ${p.id}: điểm đứng trước nhà nằm trong hồ`);
    // hồ nằm phía mặt tiền (cùng phía với p.front so với thân nhà)
    const c = (hr.z0 + hr.z1) / 2, pc = (pr.z0 + pr.z1) / 2; assert.equal(Math.sign(pc - c), p.face);
  }
});
test('kích thước hồ khớp mô hình 3D (1,7·hw, sâu 3 m)', () => {
  const p = PLOTS[0], pr = poolRect(p, 3), hw = houseLevel(3).hw;
  assert.ok(Math.abs((pr.x1 - pr.x0) - (hw * 1.7 + 0.5)) < 1e-9); assert.ok(Math.abs((pr.z1 - pr.z0) - 3.5) < 1e-9);
  assert.ok(fs.readFileSync(new URL('../js/scene/land.js', import.meta.url), 'utf8').includes('pw = hw * 1.7, pz0 = hd + 0.8, pz1 = hd + 3.8'));
  assert.ok(LOT_W > 0 && LOT_D > 0);
});
