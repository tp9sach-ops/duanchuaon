import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/placements.js';
import { SEATS, RUG, SEAT_COLS, SEAT_ROWS, SEAT_Y, seatById, pickSeat, nearestFreeSeat, standPoint, inHall, createActivity, checkSeats, BOW_SECONDS } from '../js/world/seats.js';
import { HALL, SPAWN, blocked, groundY } from '../js/world/layout.js';
import { findPath } from '../js/world/path.js';
import { HALL_POINT } from '../js/ui/hudLogic.js';
import { buildingFront } from '../js/world/placements.js';

test('lưới bồ đoàn: 3 hàng × 6, id không trùng, lối giữa để trống, quay mặt về bàn thờ', () => {
  assert.equal(SEATS.length, SEAT_ROWS.length * SEAT_COLS.length); assert.equal(SEATS.length, 18);
  assert.equal(new Set(SEATS.map((s) => s.id)).size, 18);
  assert.ok(SEATS.every((s) => Math.abs(s.x) > 2), 'lối đi giữa trống');
  assert.ok(SEATS.every((s) => Math.abs(s.ry - Math.PI) < 1e-9));
});
test('mọi bồ đoàn nằm trên sàn chánh điện, không trong vật cản, không đè nhau, nằm trong thảm', () => {
  assert.deepEqual(checkSeats(), []);
  assert.ok(RUG.z1 < HALL.platZ1 && RUG.z0 > HALL.platZ0 && RUG.x1 < HALL.wallX);
});
test('độ cao sàn khớp mặt sàn gỗ thật (bệ đá 1.0 + gỗ 0.12) và ngồi cao hơn sàn một chút', () => {
  assert.ok(Math.abs(HALL.h - 1.14) < 1e-9); assert.equal(groundY(0, -24), HALL.h); assert.ok(SEAT_Y > HALL.h && SEAT_Y < HALL.h + 0.6);
});
test('từ chỗ xuất hiện và từ cửa chánh điện đều đi được tới MỌI bồ đoàn', () => {
  assert.equal(blocked(HALL_POINT.x, HALL_POINT.z), false); assert.ok(inHall(HALL_POINT));
  for (const from of [{ x: SPAWN.x, z: SPAWN.z }, HALL_POINT]) for (const s of SEATS) {
    const p = findPath(from.x, from.z, s.x, s.z); assert.ok(p && p.length, `${s.id} từ (${from.x},${from.z})`);
    const e = p[p.length - 1]; assert.ok(Math.hypot(e.x - s.x, e.z - s.z) < 0.6, `${s.id} tới sát`);
  }
});
test('chỗ đứng khi rời bồ đoàn không bị chặn và vẫn trong chánh điện', () => {
  for (const s of SEATS) { const q = standPoint(s); assert.equal(blocked(q.x, q.z), false, s.id); assert.ok(inHall(q), s.id); }
});
test('tia từ trên cao xuống trúng đúng bồ đoàn; tia xa lệch thì không trúng', () => {
  const s = seatById('bd13');
  const hit = pickSeat({ x: s.x, y: 6, z: s.z + 4 }, norm({ x: 0, y: -(6 - HALL.h - 0.2), z: -4 }));
  assert.equal(hit.seat.id, 'bd13');
  assert.equal(pickSeat({ x: 0, y: 6, z: 20 }, norm({ x: 0, y: 0, z: 1 })), null);
  assert.equal(seatById('khongco'), null);
});
test('bồ đoàn trống gần nhất; bỏ qua chỗ đã có người', () => {
  const near = nearestFreeSeat({ x: 2.3, z: -24.6 }); assert.equal(near.id, 'bd23');
  assert.notEqual(nearestFreeSeat({ x: 2.3, z: -24.6 }, new Set(['bd23'])).id, 'bd23');
  assert.equal(nearestFreeSeat({ x: 0, z: 0 }, new Set(SEATS.map((q) => q.id))), null);
});
test('máy trạng thái: đi tới → ngồi → thiền → đứng dậy', () => {
  const a = createActivity(), s = seatById('bd00');
  assert.equal(a.mode, 'free'); assert.equal(a.avatarState(), null);
  a.goSit(s, 'meditate'); assert.equal(a.mode, 'toSeat');
  assert.equal(a.step({ x: s.x + 3, z: s.z }), null); assert.equal(a.mode, 'toSeat');
  assert.equal(a.step({ x: s.x + 0.3, z: s.z }), 'seated'); assert.equal(a.mode, 'meditate'); assert.equal(a.avatarState(), 'sit'); assert.ok(a.sitting);
  const r = a.stand(); assert.equal(r.was, 'meditate'); assert.equal(r.seat.id, 'bd00'); assert.equal(a.mode, 'free'); assert.equal(a.sitting, false);
});
test('ngồi thường rồi chọn Thiền thì chuyển chế độ; lạy chỉ khi đang đứng tự do', () => {
  const a = createActivity(), s = seatById('bd11'); a.goSit(s); a.step({ x: s.x, z: s.z });
  assert.equal(a.mode, 'sit'); assert.equal(a.bow(), false); assert.equal(a.meditate(), true); assert.equal(a.mode, 'meditate');
});
test('lạy: tự kết thúc sau một chu kỳ, có thể hủy giữa chừng', () => {
  const a = createActivity(); assert.equal(a.bow(), true); assert.equal(a.avatarState(), 'bow'); assert.equal(a.bow(), false);
  a.update(BOW_SECONDS - 0.5); assert.equal(a.mode, 'bow'); a.update(0.6); assert.equal(a.mode, 'free'); assert.equal(a.avatarState(), null);
  a.bow(); a.stand(); assert.equal(a.mode, 'free');
});
test('đi tới bồ đoàn bị kẹt thì hủy được, không treo ở trạng thái toSeat', () => {
  const a = createActivity(); a.goSit(seatById('bd20')); a.cancelWalk(); assert.equal(a.mode, 'free'); assert.equal(a.seat, null);
});
test('nhà tổ vẫn đứng được (độ cao sàn đổi không phá bố cục sân)', () => { const f = buildingFront({ cx: -30, cz: -28, d: 10 }); assert.equal(blocked(f.x, f.z), false); });

function norm(v) { const l = Math.hypot(v.x, v.y, v.z); return { x: v.x / l, y: v.y / l, z: v.z / l }; }
