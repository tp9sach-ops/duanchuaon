import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/outside.js';
import { SPECIES } from '../js/world/fishing.js';
import { LAKE } from '../js/world/river.js';
import { fishLook, fishPose, shownFish, MAX_SHOWN, WATER_TOP } from '../js/world/pondFish.js';

test('mọi loài đều có kiểu dáng hợp lệ; cỡ lớn dài hơn; loài hiếm không ngắn hơn', () => {
  for (const s of SPECIES) { const a = fishLook(s.id, false), b = fishLook(s.id, true); assert.equal(a.shape, s.loai); assert.ok(a.len > 0.2 && b.len > a.len); assert.ok(Number.isInteger(a.c1) && Number.isInteger(a.c2)); }
  assert.equal(fishLook('khongco').shape, 'ca');
});
test('cá luôn bơi TRONG hồ, dưới mặt nước, hướng đầu hữu hạn — 30 con × 400 thời điểm', () => {
  for (let uid = 1; uid <= 30; uid++) for (const sp of ['chep', 'koi', 'ruavang', 'babahoa', 'mucnang', 'caleng']) for (const lon of [false, true]) {
    for (let t = 0; t < 400; t += 1) {
      const p = fishPose({ uid, sp, lon }, t * 7.3);
      const d = Math.hypot(p.x - LAKE.x, p.z - LAKE.z); assert.ok(d < LAKE.r - 0.4, `uid ${uid} ${sp} ra ngoài hồ (${d.toFixed(2)})`);
      assert.ok(p.y < WATER_TOP && p.y > -0.05); assert.ok(Number.isFinite(p.ry) && Number.isFinite(p.tail));
    }
  }
});
test('ổn định: cùng uid + thời gian → cùng vị trí; khác uid → khác đường bơi; chuyển động mượt', () => {
  const a = fishPose({ uid: 5, sp: 'chep' }, 10), b = fishPose({ uid: 5, sp: 'chep' }, 10), c = fishPose({ uid: 6, sp: 'chep' }, 10);
  assert.deepEqual(a, b); assert.ok(Math.hypot(a.x - c.x, a.z - c.z) > 0.01);
  const p0 = fishPose({ uid: 5, sp: 'chep' }, 20), p1 = fishPose({ uid: 5, sp: 'chep' }, 20.1); assert.ok(Math.hypot(p1.x - p0.x, p1.z - p0.z) < 0.2, 'không nhảy vọt');
});
test('shownFish: bỏ dữ liệu hỏng, tối đa 30', () => {
  assert.deepEqual(shownFish(null), []); assert.equal(shownFish([{ uid: 1, sp: 'xx' }, null, { uid: 'a', sp: 'chep' }, { uid: 2, sp: 'chep' }]).length, 1);
  assert.equal(shownFish(Array.from({ length: 40 }, (_, i) => ({ uid: i + 1, sp: 'chep' }))).length, MAX_SHOWN);
});
