import test from 'node:test';
import assert from 'node:assert/strict';
import { createSwarm, allocate, fireflyLevel, ZONES, MAX_SPEED } from '../js/world/fireflies.js';
test('chia đủ n con, mỗi vùng ≥1 khi n đủ lớn', () => { for (const n of [40, 70, 170]) { const a = allocate(n); assert.equal(a.reduce((s, v) => s + v, 0), n); assert.ok(a.every((v) => v >= 1)); } });
test('đom đóm sáng dần theo độ tối, mưa thì tắt', () => { assert.equal(fireflyLevel(0.4, 0), 0); assert.ok(fireflyLevel(0.7, 0) > 0 && fireflyLevel(0.7, 0) < 1); assert.equal(fireflyLevel(1, 0), 1); assert.equal(fireflyLevel(1, 0.1), 0); });
test('bay mượt: tốc độ ≤ 1,6 m/s, vị trí không nhảy vọt', () => {
  const s = createSwarm(120), dt = 1 / 60, prev = s.flies.map((f) => [f.x, f.y, f.zz]);
  for (let k = 0; k < 60 * 120; k++) { s.step(dt); s.flies.forEach((f, i) => { const d = Math.hypot(f.x - prev[i][0], f.y - prev[i][1], f.zz - prev[i][2]); assert.ok(d <= MAX_SPEED * dt + 1e-9, 'nhảy ' + d); prev[i] = [f.x, f.y, f.zz]; }); }
});
test('ở lại gần vùng của mình (không trôi mất)', () => {
  const s = createSwarm(120); for (let k = 0; k < 60 * 180; k++) s.step(1 / 60);
  for (const f of s.flies) assert.ok(Math.hypot(f.x - f.z.x, f.zz - f.z.z) <= f.z.r + 4, f.z.id);
});
test('không đứng yên: sau 20 s mỗi con đã di chuyển', () => { const s = createSwarm(60), p0 = s.flies.map((f) => [f.x, f.zz]); for (let k = 0; k < 1200; k++) s.step(1 / 60); assert.ok(s.flies.every((f, i) => Math.hypot(f.x - p0[i][0], f.zz - p0[i][1]) > 0.2)); });
test('nhấp nháy mỗi con một nhịp, trong 0..1', () => { const s = createSwarm(30); const v = s.flies.map((_, i) => s.blink(i, 3.3)); assert.ok(v.every((x) => x >= 0 && x <= 1)); assert.ok(new Set(v.map((x) => x.toFixed(3))).size > 10); });
test('có đủ 6 vùng', () => assert.deepEqual(ZONES.map((z) => z.id), ['aosen', 'sanchua', 'vuonthien', 'aoca', 'bongthong', 'hothac']));
