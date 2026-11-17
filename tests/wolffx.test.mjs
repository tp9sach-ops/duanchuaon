// Phiên 224 (mục 1): chuyển động sói khí vàng của Gậy tre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WOLF, wolfRange, headingTo, wolfPose } from '../js/world/wolfMath.js';

test('wolfRange: kẹp trong khoảng, không mục tiêu thì tầm vung không khí', () => {
  assert.equal(wolfRange(0), WOLF.rangeAir); assert.equal(wolfRange(NaN), WOLF.rangeAir); assert.equal(wolfRange(-4), WOLF.rangeAir);
  assert.equal(wolfRange(1), WOLF.rangeMin); assert.equal(wolfRange(99), WOLF.rangeMax); assert.equal(wolfRange(5), 5);
});
test('headingTo: đúng hướng, trùng điểm thì giữ hướng cũ', () => {
  assert.ok(Math.abs(headingTo({ x: 0, z: 0 }, { x: 1, z: 0 }) - Math.PI / 2) < 1e-9);
  assert.equal(headingTo({ x: 1, z: 1 }, { x: 1, z: 1 }, 0.7), 0.7); assert.equal(headingTo(null, { x: 1, z: 1 }, 0.3), 0.3);
});
test('wolfPose: hiện → vồ tới đúng tầm → ngoạm → tan, hết đời thì done', () => {
  const R = 6, a = wolfPose(0, R); assert.equal(a.done, false); assert.ok(a.vis < 0.01);
  const mid = wolfPose(WOLF.life * 0.4, R); assert.ok(mid.dist > 0.35 && mid.dist < R); assert.ok(mid.up > 0); assert.equal(mid.vis, 1);
  const bite = wolfPose(WOLF.life * 0.68, R); assert.equal(bite.bite, true); assert.equal(bite.dist, R);
  const fade = wolfPose(WOLF.life * 0.9, R); assert.ok(fade.vis < 1 && fade.vis > 0);
  assert.equal(wolfPose(WOLF.life, R).done, true); assert.equal(wolfPose(99, R).vis, 0);
  for (const bad of [NaN, undefined, 'x', -3]) assert.equal(wolfPose(bad, R).done, false);
});
