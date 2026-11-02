import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, free } from '../js/world/path.js';
import { SPAWN, POND, blocked, canStep } from '../js/world/layout.js';
import { createNavigator, walkStep } from '../js/world/worldLogic.js';

test('findPath: qua cổng giữa; điểm cuối là đích', () => {
  const p = findPath(0, 54, 0, 20);
  assert.ok(p && p.length >= 1);
  assert.ok(Math.hypot(p[p.length - 1].x - 0, p[p.length - 1].z - 20) < 0.3);
});
test('findPath: bên này ao sang bên kia ao phải đi qua cầu đá hoặc vòng quanh (không xuyên mặt nước)', () => {
  const p = findPath(-14, 14, 14, 14); assert.ok(p && p.length >= 1);
  let a = { x: -14, z: 14 };
  for (const b of p) { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25); for (let k = 1; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; assert.equal(blocked(x, z), false); } a = b; }
});
test('findPath: đích bị chặn (giữa ao) thì dừng ở chỗ gần nhất đi được; đích ngoài sân không có đường', () => {
  const p = findPath(0, 54, -5, POND.z); assert.ok(p && p.length);
  const l = p[p.length - 1]; assert.equal(blocked(l.x, l.z), false); assert.ok(Math.hypot(l.x + 5, l.z - POND.z) < 4.5);
  assert.equal(findPath(0, 54, 300, 300), null);
});
test('findPath: xuất phát cùng ô với đích → đường ngắn không lỗi', () => {
  const p = findPath(0, 40, 0, 40.1); assert.ok(p === null || p.length <= 1);
});
test('navigator.setPath: đi qua các mốc theo thứ tự rồi dừng ở mốc cuối', () => {
  const nav = createNavigator(), P = { x: 0, z: 54 }; nav.setPath([{ x: 0, z: 40 }, { x: 0, z: 30 }]);
  assert.deepEqual(nav.target, { x: 0, z: 30 });
  for (let f = 0; f < 60 * 60 && nav.active; f++) { const d = nav.dir(P, 1 / 60); if (d) { const r = walkStep(P, d, 1 / 60, 4.4 * (d.mag ?? 1)); P.x = r.x; P.z = r.z; } }
  assert.equal(nav.active, false); assert.ok(Math.hypot(P.x, P.z - 30) < 0.5);
  nav.setPath([]); assert.equal(nav.active, false);     // mảng rỗng: không làm gì
});
test('free: chừa khoảng sát vật cản (tâm lư hương bị chặn; điểm giữa sân thì tự do)', () => {
  assert.equal(free(0, -8), false); assert.equal(free(0, 40), true); assert.equal(free(SPAWN.x, SPAWN.z), true);
});
