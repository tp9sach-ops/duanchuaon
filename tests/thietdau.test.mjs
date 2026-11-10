import '../js/world/outside.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_BAC, DASH_DIST, DASH_DMG, canUse, dashDistance, dashDamage, buttonOpen, dashPath, distToSegment, rams, tickCd, WINDOW_AFTER_LAND_S, HEAD_R } from '../js/world/thietDau.js';

test('chỉ từ bậc 4 trở lên', () => { assert.equal(MIN_BAC, 4); assert.ok(!canUse(0) && !canUse(3) && canUse(4) && canUse(8)); assert.equal(dashDamage(3, 99), 0); });
test('bậc càng cao lao càng xa, đâm càng đau; có bảng đủ 9 bậc', () => {
  assert.equal(DASH_DIST.length, 9); assert.equal(DASH_DMG.length, 9);
  for (let b = 5; b <= 8; b++) { assert.ok(dashDistance(b) > dashDistance(b - 1)); assert.ok(dashDamage(b) > dashDamage(b - 1)); }
  assert.ok(dashDamage(4, 100) > dashDamage(4, 0)); assert.equal(dashDistance(99), dashDistance(8)); assert.equal(dashDistance('x'), 0);
});
test('nút hiện khi đủ bậc và đang bay / vừa chạm đất', () => {
  assert.ok(buttonOpen({ bac: 4, air: true })); assert.ok(buttonOpen({ bac: 4, sinceAir: WINDOW_AFTER_LAND_S - 0.1 }));
  assert.ok(!buttonOpen({ bac: 4, sinceAir: WINDOW_AFTER_LAND_S + 0.1 })); assert.ok(!buttonOpen({ bac: 3, air: true })); assert.ok(!buttonOpen({ bac: 4, air: true, mode: 'sit' })); assert.ok(!buttonOpen());
});
test('đường lao theo hướng nhìn (ry = 0 là +z), độ dài ≤ tầm bậc', () => {
  const p = dashPath(0, 100, 0, 4); assert.ok(p.dist > 0 && p.dist <= dashDistance(4) + 1e-9); assert.ok(p.to.z > 100); assert.ok(Math.abs(p.to.x) < 1e-6);
  const q = dashPath(0, 100, Math.PI / 2, 8); assert.ok(q.to.x > 0 && q.dist > p.dist);
});
test('đâm trúng: quái nằm trên/gần đường lao, không trúng khi lệch xa hoặc sau lưng', () => {
  const a = { x: 0, z: 0 }, b = { x: 0, z: 10 };
  assert.ok(rams(a, b, { x: 0, z: 6 }, 1.5)); assert.ok(rams(a, b, { x: 2.0, z: 5 }, 1.5)); assert.ok(!rams(a, b, { x: 2.3, z: 5 }, 1.5) || 2.3 <= 1.5 + HEAD_R);
  assert.ok(!rams(a, b, { x: 5, z: 5 }, 1.5)); assert.ok(!rams(a, b, { x: 0, z: -4 }, 1.5)); assert.ok(!rams(a, b, null));
  assert.ok(Math.abs(distToSegment(3, 5, a, b) - 3) < 1e-9); assert.ok(Math.abs(distToSegment(0, 14, a, b) - 4) < 1e-9);
});
test('hồi chiêu', () => { assert.equal(tickCd(5, 2), 3); assert.equal(tickCd(1, 2), 0); assert.equal(tickCd(NaN, 1), 0); });

test('dock: nút Thiết đầu công hiện khi mở (cả lúc đang đánh yêu quái), ẩn khi chưa', async () => {
  const { dockButtons } = await import('../js/world/dock.js');
  assert.ok(dockButtons({ free: true, khinh: 5, head: { open: true, dist: 8, dmg: 110 } }).some((b) => b.id === 'thietdau'));
  assert.ok(dockButtons({ free: true, khinh: 5, head: { open: true }, yq: { active: true } }).some((b) => b.id === 'thietdau'));
  assert.ok(!dockButtons({ free: true, khinh: 5, head: { open: false } }).some((b) => b.id === 'thietdau'));
});
