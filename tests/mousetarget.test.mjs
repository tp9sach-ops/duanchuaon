// Phiên 159: chuột phải = đi; bấm chuột phải 2 lần vào quái = khóa mục tiêu. Phần logic thuần (js/world/mouseTarget.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDoubleClick, rayToSegment, pickMonster, monsterVolume, DOUBLE_MS, DOUBLE_PX, LOCK_RANGE } from '../js/world/mouseTarget.js';

test('bấm đúp: lần 2 trong 380 ms và 30 px thì tính; quá chậm / quá xa thì không; lần 3 không tính tiếp', () => {
  const d = createDoubleClick();
  assert.equal(d.hit(100, 100, 0), false);
  assert.equal(d.hit(110, 105, DOUBLE_MS - 10), true, 'đủ nhanh + đủ gần');
  assert.equal(d.hit(110, 105, DOUBLE_MS), false, 'sau một đúp phải quên, lần kế là lần đầu của cặp mới');
  assert.equal(d.hit(110, 105, DOUBLE_MS + 100), true, 'cặp mới');
  assert.equal(d.hit(0, 0, 5000), false); assert.equal(d.hit(0, 0, 5000 + DOUBLE_MS + 1), false, 'quá chậm');
  assert.equal(d.hit(0, 0, 9000), false); assert.equal(d.hit(DOUBLE_PX + 5, 0, 9100), false, 'quá xa nhau');
  d.reset(); assert.equal(d.hit(1, 1, 20000), false); d.reset(); assert.equal(d.hit(1, 1, 20050), false, 'reset quên lần trước');
});

test('tia ↔ đoạn thẳng: trúng thân đứng, trượt khi lệch, tia hướng ngược không tính', () => {
  const seg = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }];
  const o = { x: 0, y: 1, z: 10 };
  assert.ok(rayToSegment(o, { x: 0, y: 0, z: -1 }, ...seg).dist < 1e-9, 'bắn thẳng vào giữa thân');
  assert.ok(Math.abs(rayToSegment({ x: 3, y: 1, z: 10 }, { x: 0, y: 0, z: -1 }, ...seg).dist - 3) < 1e-9, 'lệch 3 m');
  const back = rayToSegment(o, { x: 0, y: 0, z: 1 }, ...seg); assert.ok(back.dist >= 9 && back.s === 0, 'tia quay lưng: gần nhất là điểm gốc');
  assert.ok(rayToSegment({ x: 0, y: 5, z: 10 }, { x: 0, y: -0.4, z: -1 }, ...seg).dist < 2, 'tia chếch xuống vẫn tính được');
  assert.ok(rayToSegment(o, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0 }).dist < 1e-9, 'đoạn suy biến thành điểm');
});

test('chọn quái: chọn con gần camera nhất trên đường tia; trượt thì null; dữ liệu bẩn không văng lỗi', () => {
  const mons = [{ uid: 'a:1', x: 0, z: 0 }, { uid: 'a:2', x: 0.2, z: -6 }, { uid: 'a:3', x: 9, z: 0 }];
  const o = { x: 0, y: 1.5, z: 10 }, d = { x: 0, y: 0, z: -1 };
  assert.equal(pickMonster(o, d, mons).uid, 'a:1', 'hai con thẳng hàng: lấy con gần camera');
  assert.equal(pickMonster(o, { x: 0.6, y: 0, z: -1 }, mons.slice(2)), null, 'bắn lệch khỏi mọi quái');
  assert.equal(pickMonster(o, d, mons.slice(1, 2)).uid, 'a:2');
  assert.equal(pickMonster(o, d, []), null); assert.equal(pickMonster(null, d, mons), null); assert.equal(pickMonster(o, d, null), null);
  assert.equal(pickMonster(o, d, [null, {}, { uid: 'x', x: NaN, z: 0 }, { x: 0, z: 0 }]), null);
  assert.equal(pickMonster(o, d, mons, { reach: 5 }), null, 'quá tầm tia');
});

test('vùng chạm: boss > tinh anh > quái thường; boss to nên bấm lệch vẫn trúng', () => {
  const b = monsterVolume({ boss: true }), e = monsterVolume({ elite: true }), n = monsterVolume({});
  assert.ok(b.r > e.r && e.r > n.r && b.h > e.h && e.h > n.h);
  const o = { x: 1.5, y: 1.5, z: 10 }, d = { x: 0, y: 0, z: -1 };
  assert.equal(pickMonster(o, d, [{ uid: 'n', x: 0, z: 0 }]), null, 'quái thường: lệch 1,5 m là trượt');
  assert.equal(pickMonster(o, d, [{ uid: 'b', x: 0, z: 0, boss: true }]).uid, 'b', 'boss: lệch 1,5 m vẫn trúng');
  assert.ok(LOCK_RANGE > 18, 'tầm khóa lớn hơn tầm nhìn tự chọn (18 m)');
});
