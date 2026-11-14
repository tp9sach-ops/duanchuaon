// Test 5 bồ đoàn Ngũ Hành (G2.4b). Chạy: node --test tests/hesseats.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import '../js/world/npc.js';   // đăng ký vật cản NPC (thầy Trụ trì đứng gần bồ đoàn)
import { free } from '../js/world/path.js';
import { HE_LIST } from '../js/data/elements.js';
import { HE_SEAT_ID, HE_COLOR, seatOfHe, heOfSeat, heAt, heLabel, checkHeSeats } from '../js/world/heSeats.js';

test('đủ 5 Hệ, mỗi Hệ một bồ đoàn có thật, không trùng, có màu', () => {
  assert.deepEqual(checkHeSeats(), []);
  assert.equal(new Set(Object.values(HE_SEAT_ID)).size, 5);
  assert.ok(Object.isFrozen(HE_SEAT_ID) && Object.isFrozen(HE_COLOR));
});
test('seatOfHe / heOfSeat khớp hai chiều; Hệ lạ và bồ đoàn thường → null', () => {
  for (const h of HE_LIST) { const s = seatOfHe(h); assert.ok(s); assert.equal(heOfSeat(s.id), h); }
  assert.equal(seatOfHe('lạ'), null); assert.equal(seatOfHe(null), null);
  assert.equal(heOfSeat('bd00'), null); assert.equal(heOfSeat(undefined), null);
});
test('5 bồ đoàn Hệ nằm cùng hàng gần bàn thờ nhất và cách nhau đủ xa để không nhầm', () => {
  const seats = HE_LIST.map(seatOfHe);
  assert.ok(seats.every((s) => s.row === 0));
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(Math.hypot(seats[i].x - seats[j].x, seats[i].z - seats[j].z) > 2);
});
test('heAt: đứng đúng bồ đoàn Hệ → Hệ đó; đứng xa hoặc dữ liệu hỏng → null', () => {
  for (const h of HE_LIST) { const s = seatOfHe(h); assert.equal(heAt({ x: s.x, z: s.z }), h); assert.equal(heAt({ x: s.x + 0.3, z: s.z }), h); }
  assert.equal(heAt({ x: 0, z: -24 }), null);
  assert.equal(heAt({ x: seatOfHe('kim').x, z: seatOfHe('kim').z + 3 }), null);
  assert.equal(heAt(null), null); assert.equal(heAt({ x: NaN, z: 1 }), null);
});
test('heLabel', () => { assert.equal(heLabel('kim'), 'Hệ Kim'); assert.equal(heLabel('thuy'), 'Hệ Thủy'); assert.equal(heLabel('x'), ''); });
test('Phiên 153: mọi bồ đoàn Hệ đều đi tới và ngồi được (không nằm sát NPC/vật cản); Hỏa ở góc phải', () => {
  for (const h of HE_LIST) { const s = seatOfHe(h); assert.equal(free(s.x, s.z), true, h + ': bồ đoàn bị chặn, nhân vật không ngồi vào được'); }
  const hoa = seatOfHe('hoa'), maxX = Math.max(...HE_LIST.map((h) => seatOfHe(h).x));
  assert.equal(hoa.x, maxX, 'Hỏa phải là bồ đoàn phải nhất');
  assert.ok(hoa.x > 10 && hoa.row === 0);
});
