// Phiên 225 (mục 4): bầu trời không vật cản thì bay qua được + mọi vật nhìn thấy đều đứng được (không còn vật chặn mọi độ cao).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CIRCLES, RECTS, SKY, HALL, POND, BOUNDS, blocked, bodyBlocked, canStep, floorAt, moveBody } from '../js/world/layout.js';
import '../js/world/standTops.js';
import { landingAt } from '../js/world/standOn.js';

const hasTop = (o) => Number.isFinite(+o.top) || Number.isFinite(+o.h);

test('mọi vật cản trong chùa/ngoài chùa đều có mặt đứng (không còn chặn mọi độ cao)', () => {
  assert.equal(CIRCLES.filter((o) => !hasTop(o)).length, 0);
  assert.equal(RECTS.filter((o) => !hasTop(o)).length, 0);
});

test('cột chính điện: chân thấp bị chặn, chân đủ cao đứng lên được', () => {
  const x = -17.5, z = -21.5;
  assert.equal(blocked(x, z, 0), true);
  assert.equal(blocked(x, z, HALL.h + 9.0), false);
  assert.ok(floorAt(x, z, HALL.h + 9.0) >= HALL.h + 9.0 - 1e-9, 'đứng trên đỉnh cột');
});

test('ranh giới/núi: thấp bị chặn, trên đỉnh (SKY.ridge) bay qua được và đứng lên được', () => {
  const x = BOUNDS.xMax + 20, z = 0;
  assert.equal(blocked(x, z, 0), true);
  assert.equal(blocked(x, z, SKY.ridge), false);
  assert.equal(floorAt(x, z, SKY.ridge), SKY.ridge);
  assert.equal(floorAt(x, z, 0), 0, 'đứng dưới đất thì không bị nhấc lên');
});

test('ao sen: thấp bị chặn, bay qua được, đáp xuống đứng trên mặt lá sen (không lún)', () => {
  const x = POND.x + 5, z = POND.z;
  assert.equal(blocked(x, z, 0), true);
  assert.equal(blocked(x, z, SKY.water), false);
  assert.equal(floorAt(x, z, SKY.water), SKY.water);
});

test('tường chính điện: chỉ bay qua khi cao hơn mái tường', () => {
  const x = HALL.wallX + 1, z = -30;
  assert.equal(blocked(x, z, 5), true);
  assert.equal(blocked(x, z, SKY.wall), false);
});

test('nền chính điện: chân đủ cao nhảy thẳng lên nền; chân thấp vẫn phải đi bậc thềm', () => {
  assert.equal(canStep(HALL.platX + 2, -19, HALL.platX - 2, -19, 0), false);
  assert.equal(canStep(HALL.platX + 2, -19, HALL.platX - 2, -19, HALL.h), true);
});

test('lao/lướt có feetH cao đi hết quãng qua phía trên núi; thấp thì dừng trước ranh giới', () => {
  const lo = landingAt(BOUNDS.xMax - 2, 0, Math.PI / 2, 20, 0);
  const hi = landingAt(BOUNDS.xMax - 2, 0, Math.PI / 2, 20, SKY.ridge);
  assert.ok(lo.dist < 4, 'thấp: dừng sát ranh giới');
  assert.ok(hi.dist >= 19.5, 'cao: đi hết quãng');
});

test('thân người đi trên mặt đất bình thường không bị ảnh hưởng (không kẹt)', () => {
  assert.equal(bodyBlocked(0, 54, 0), false);
  const q = moveBody(0, 54, 0, -1, 0); assert.ok(q.z < 54);
});
