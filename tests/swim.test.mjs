import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/outside.js';
import { registerOutside } from '../js/world/outside.js';
import { blocked, WATERS, POND } from '../js/world/layout.js';
import { KOI } from '../js/world/landscape.js';
import { LAKE, THUY_TA, RIVER } from '../js/world/river.js';
import { SWIM, swimWaterAt, createSwimmer, stepSwimmer, speedMul, yOffset, pearlSpots, loadPearls, tryPearl } from '../js/world/swim.js';

registerOutside();
test('nước bơi được: Hồ Rừng, sông, hồ thác; ao sen và hồ cá chùa thì KHÔNG; trên cầu/sàn gỗ là đi bộ', () => {
  assert.equal(swimWaterAt(LAKE.x, LAKE.z - 3.8).id, 'horung'); assert.equal(blocked(LAKE.x, LAKE.z - 3.8), false, 'bơi được thì không chặn');
  assert.ok(swimWaterAt(98.8, 112.7)); assert.equal(swimWaterAt(106, 104).id, 'hothac');
  assert.equal(swimWaterAt(POND.x + 3, POND.z), null); assert.equal(blocked(POND.x + 3, POND.z), true, 'ao sen vẫn chặn');
  assert.equal(blocked(KOI.x + KOI.r * 0.8, KOI.z + 1), true, 'hồ cá chùa vẫn chặn'); assert.equal(swimWaterAt(KOI.x + KOI.r * 0.8, KOI.z + 1), null);
  assert.equal(swimWaterAt(THUY_TA.stand.x, THUY_TA.stand.z), null, 'trên sàn thủy tạ là đi bộ');
  const b = RIVER.bridge; assert.equal(swimWaterAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2), null, 'trên cầu đá là đi bộ');
  assert.equal(swimWaterAt(0, 100), null);
});
test('xuống nước → bơi; muốn lặn thì lặn; hơi cạn thì buộc nổi; lên bờ → đi bộ', () => {
  let s = createSwimmer(), r = stepSwimmer(s, { inWater: true }, 0.1); assert.equal(r.ev, 'enter'); assert.equal(r.st.mode, 'swim'); s = r.st;
  r = stepSwimmer(s, { inWater: true, wantDive: true }, 0.1); assert.equal(r.ev, 'dive'); assert.equal(r.st.mode, 'dive'); s = r.st;
  let n = 0; while (s.mode === 'dive' && n++ < 400) { r = stepSwimmer(s, { inWater: true, wantDive: true }, 0.1); s = r.st; }
  assert.equal(r.ev, 'breath'); assert.equal(s.mode, 'swim'); assert.equal(s.air, 0); assert.ok(n >= 19.5 * 10 && n <= 21 * 10, 'lặn khoảng 20 giây: ' + n);
  assert.equal(stepSwimmer(s, { inWater: true, wantDive: true }, 0.1).st.mode, 'swim', 'hết hơi: chưa lặn lại được');
  for (let i = 0; i < 40; i++) s = stepSwimmer(s, { inWater: true }, 0.1).st; assert.ok(s.air >= 15, 'trên mặt nước hồi nhanh');
  r = stepSwimmer(s, { inWater: false }, 0.1); assert.equal(r.ev, 'leave'); assert.equal(r.st.mode, 'land');
});
test('lag không làm hồi/hao hơi dư; thả nút lặn thì nổi lên', () => {
  const s = { mode: 'dive', air: 10 }; assert.equal(stepSwimmer(s, { inWater: true, wantDive: true }, 99).st.air, 9.5);
  const r = stepSwimmer(s, { inWater: true, wantDive: false }, 0.1); assert.equal(r.ev, 'surface'); assert.equal(r.st.mode, 'swim');
});
test('tốc độ và độ chìm theo trạng thái', () => {
  assert.equal(speedMul('land'), 1); assert.ok(speedMul('swim') < 1 && speedMul('dive') < speedMul('swim'));
  assert.equal(yOffset('land'), 0); assert.ok(yOffset('swim') < 0 && yOffset('dive') < yOffset('swim'));
});
test('ngọc trai: cố định, nằm trong nước bơi được, mỗi nơi ≤ 6 viên; chỉ nhặt khi LẶN; mỗi ngày tối đa 8; qua ngày mọc lại; dữ liệu hỏng không ném lỗi', () => {
  const sp = pearlSpots(); assert.ok(sp.length >= SWIM.perWater + 3); assert.deepEqual(sp, pearlSpots());
  for (const p of sp) assert.ok(swimWaterAt(p.x, p.z), 'ngọc ' + p.id + ' ngoài nước');
  let pe = loadPearls(null, '2026-11-09'); const t = sp[0];
  assert.equal(tryPearl(pe, 'swim', t.x, t.z, sp).got, null, 'bơi trên mặt không nhặt được');
  let r = tryPearl(pe, 'dive', t.x, t.z, sp); assert.equal(r.got, t.id); pe = r.pearls; assert.equal(pe.total, 1);
  assert.notEqual(tryPearl(pe, 'dive', t.x, t.z, sp).got, t.id, 'viên đã nhặt không nhặt lại');
  for (const p of sp) { r = tryPearl(pe, 'dive', p.x, p.z, sp); pe = r.pearls; }
  assert.equal(pe.got.length, SWIM.dayCap); assert.equal(tryPearl(pe, 'dive', sp[sp.length - 1].x, sp[sp.length - 1].z, sp).capped || pe.got.includes(sp[sp.length - 1].id), true);
  const next = loadPearls(JSON.stringify(pe), '2026-11-10'); assert.equal(next.got.length, 0); assert.equal(next.total, pe.total);
  for (const bad of ['{x', 5, [], { got: 'x', total: 'a' }]) assert.doesNotThrow(() => loadPearls(bad, 'd'));
});
