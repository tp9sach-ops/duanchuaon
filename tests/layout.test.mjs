import test from 'node:test';
import assert from 'node:assert/strict';
import { blocked, canStep, move, groundY, region, SPAWN, CENSER, POND, HALL } from '../js/world/layout.js';

test('điểm xuất hiện không bị chặn và trên mặt đất', () => { assert.equal(blocked(SPAWN.x, SPAWN.z), false); assert.equal(groundY(SPAWN.x, SPAWN.z), 0); });
test('qua cổng giữa được, đâm vào tường tam quan thì không', () => {
  assert.equal(canStep(0, 38, 0, 30), true); assert.equal(blocked(0, 34), false);
  assert.equal(blocked(4, 34), true);          // giữa cổng giữa và cổng phụ
  assert.equal(blocked(8.1, 34), false);       // cổng phụ
  assert.equal(blocked(-20, 34), true);        // tường
});
test('ao sen chặn, cầu đá đi qua được và cao hơn mặt đất', () => {
  assert.equal(blocked(5, POND.z), true); assert.equal(blocked(0, POND.z), false); assert.ok(groundY(0, POND.z) > 0.3);
  let p = { x: 0, z: 26 }; for (let i = 0; i < 56; i++) p = move(p.x, p.z, 0, -0.5); assert.ok(p.z < 0, 'đi hết cầu: ' + p.z);
});
test('lư hương và cột chính điện là vật cản', () => { assert.equal(blocked(CENSER.x, CENSER.z), true); assert.equal(blocked(-12.5, HALL.cz + 6.5), true); });
test('lên chính điện chỉ qua bậc thềm giữa, không leo từ bên hông', () => {
  assert.equal(region(0, -15), 'step'); assert.equal(region(0, -20), 'plat'); assert.equal(region(10, -15), 'ground');
  assert.equal(canStep(0, -15, 0, -18), true); assert.equal(canStep(10, -16, 10, -19), false);
  assert.ok(groundY(0, -15.5) > 0 && groundY(0, -15.5) < HALL.h); assert.equal(groundY(0, -24), HALL.h);
  let p = { x: 3, z: -4 }; for (let i = 0; i < 70; i++) p = move(p.x, p.z, 0, -0.5);
  assert.ok(p.z < -20 && p.z > -34.5, 'đã vào chính điện: ' + p.z);   // đi thẳng từ sân vào (x=3 để tránh lư hương)
});
test('trong chính điện: tường bên và tường hậu chặn, bàn thờ chặn', () => {
  assert.equal(blocked(13.5, -28), true); assert.equal(blocked(0, -36), true); assert.equal(blocked(0, -33), true); assert.equal(blocked(0, -26), false);
});
test('ngoài ranh giới bị chặn', () => { assert.equal(blocked(60, 0), true); assert.equal(blocked(0, -45), true); assert.equal(blocked(20, 50), true); });
test('move trượt dọc tường thay vì đứng yên', () => { const p = move(-20, 30, 0.5, 1.5); assert.ok(p.x > -20); });
