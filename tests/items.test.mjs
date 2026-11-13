// Vật phẩm mua bằng lá bồ đề (mục 1): Ngọc hồi máu, Ngọc dịch chuyển, Gậy như ý.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMS, STAFF, REGEN_MUL, MAX_STACK, loadItems, buyGem, buyStaff, remainSec, isActive, regenMul, canRevive, dmgMul, fmtTime } from '../js/world/items.js';

const T = 1_000_000_000_000;

test('số liệu theo yêu cầu: 100 lá / 10 phút, 200 lá / 20 phút, gậy 400 lá +1%, hồi máu ×5', () => {
  assert.deepEqual(GEMS.map((g) => [g.id, g.gia, g.giay]), [['hoimau', 100, 600], ['dichchuyen', 200, 1200]]);
  assert.equal(STAFF.gia, 400); assert.equal(STAFF.dmg, 1.01); assert.equal(REGEN_MUL, 5);
});

test('loadItems: hỏng → trống; mốc hết hạn quá xa bị kéo về trần', () => {
  for (const bad of [null, undefined, '', 'xyz', '[]', 5]) assert.deepEqual(loadItems(bad, T), { v: 1, exp: { hoimau: 0, dichchuyen: 0 }, staff: false });
  const s = loadItems({ exp: { hoimau: T + 99e9 }, staff: true }, T);
  assert.equal(s.exp.hoimau, T + 600 * MAX_STACK * 1000); assert.equal(s.staff, true);
  assert.equal(loadItems({ staff: 'yes' }, T).staff, false);
});

test('buyGem: đủ lá thì mua, thiếu thì không, id lạ thì không; còn hạn mua thêm thì cộng dồn có trần', () => {
  assert.equal(buyGem(null, 'hoimau', 99, T).reason, 'poor'); assert.equal(buyGem(null, 'zzz', 999, T).reason, 'unknown'); assert.equal(buyGem(null, 'hoimau', 'abc', T).ok, false);
  const a = buyGem(null, 'hoimau', 100, T); assert.equal(a.ok, true); assert.equal(a.cost, 100); assert.equal(remainSec(a.state, 'hoimau', T), 600); assert.equal(isActive(a.state, 'hoimau', T), true);
  const b = buyGem(a.state, 'hoimau', 100, T + 100_000); assert.equal(remainSec(b.state, 'hoimau', T + 100_000), 1100);
  let s = a.state; for (let i = 0; i < 10; i++) s = buyGem(s, 'hoimau', 100, T).state; assert.equal(remainSec(s, 'hoimau', T), 600 * MAX_STACK);
  const d = buyGem(null, 'dichchuyen', 200, T); assert.equal(remainSec(d.state, 'dichchuyen', T), 1200); assert.equal(buyGem(null, 'dichchuyen', 199, T).ok, false);
});

test('hạn dùng: hết giờ thì mất hiệu lực', () => {
  const s = buyGem(null, 'hoimau', 100, T).state;
  assert.equal(regenMul(s, T + 1000), 5); assert.equal(regenMul(s, T + 600_000), 1); assert.equal(regenMul(null, T), 1);
  const d = buyGem(null, 'dichchuyen', 200, T).state;
  assert.equal(canRevive(d, T + 1_199_000), true); assert.equal(canRevive(d, T + 1_200_000), false); assert.equal(canRevive(null, T), false);
});

test('Gậy như ý: mua một lần, +1% sát thương', () => {
  assert.equal(buyStaff(null, 399, T).reason, 'poor');
  const r = buyStaff(null, 400, T); assert.equal(r.ok, true); assert.equal(r.cost, 400); assert.equal(r.state.staff, true);
  assert.equal(buyStaff(r.state, 9999, T).reason, 'owned');
  assert.equal(dmgMul(r.state), 1.01); assert.equal(dmgMul(null), 1); assert.equal(dmgMul({ staff: false }), 1);
});

test('fmtTime', () => { assert.equal(fmtTime(605), '10:05'); assert.equal(fmtTime(0), '0:00'); assert.equal(fmtTime(-4), '0:00'); assert.equal(fmtTime('x'), '0:00'); });
