// Vật phẩm mua bằng lá bồ đề (mục 1): Ngọc hồi máu, Ngọc dịch chuyển, Gậy như ý.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMS, STAFF, HAT, REGEN_MUL, MAX_STACK, loadItems, buyGem, buyStaff, buyHat, toggleHat, hatWorn, armorMul, afterArmor, remainSec, isActive, regenMul, canRevive, dmgMul, fmtTime } from '../js/world/items.js';
import { HAT_GLB_B64 } from '../js/data/hatGlb.js';

const T = 1_000_000_000_000;

test('số liệu theo yêu cầu: 100 lá / 10 phút, 200 lá / 20 phút, gậy 400 lá +1%, hồi máu ×5', () => {
  assert.deepEqual(GEMS.map((g) => [g.id, g.gia, g.giay]), [['hoimau', 100, 600], ['dichchuyen', 200, 1200]]);
  assert.equal(STAFF.gia, 400); assert.equal(STAFF.dmg, 1.01); assert.equal(REGEN_MUL, 5);
});

test('loadItems: hỏng → trống; mốc hết hạn quá xa bị kéo về trần', () => {
  for (const bad of [null, undefined, '', 'xyz', '[]', 5]) assert.deepEqual(loadItems(bad, T), { v: 1, exp: { hoimau: 0, dichchuyen: 0 }, staff: false, hat: false, hatOn: false });
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

test('Nón Jingasa: 400 lá, mua một lần, tự đội, +3% giáp', () => {
  assert.equal(HAT.gia, 400); assert.equal(HAT.giap, 0.03);
  assert.equal(buyHat(null, 399, T).reason, 'poor'); assert.equal(buyHat(null, 'abc', T).ok, false);
  const r = buyHat(null, 400, T); assert.equal(r.ok, true); assert.equal(r.cost, 400); assert.equal(r.state.hat, true); assert.equal(r.state.hatOn, true);
  assert.equal(buyHat(r.state, 9999, T).reason, 'owned');
  assert.ok(Math.abs(armorMul(r.state) - 0.97) < 1e-12); assert.equal(armorMul(null), 1); assert.equal(armorMul({ hat: false, hatOn: true }), 1);
});
test('Nón Jingasa: cất nón thì hết giáp, đội lại thì có; chưa mua thì đội không có tác dụng', () => {
  let s = buyHat(null, 400, T).state;
  s = toggleHat(s, T); assert.equal(s.hat, true); assert.equal(s.hatOn, false); assert.equal(hatWorn(s), false); assert.equal(armorMul(s), 1);
  s = toggleHat(s, T); assert.equal(hatWorn(s), true);
  const none = toggleHat(null, T); assert.equal(none.hat, false); assert.equal(none.hatOn, false); assert.equal(hatWorn(none), false);
});
test('Nón Jingasa: đọc lại bản lưu (cũ/hỏng) an toàn', () => {
  assert.equal(loadItems({ hat: true }, T).hatOn, true);
  assert.equal(loadItems({ hat: true, hatOn: false }, T).hatOn, false);
  assert.equal(loadItems({ hat: false, hatOn: true }, T).hatOn, false);
  assert.equal(loadItems({ hat: 'yes' }, T).hat, false);
  assert.deepEqual(loadItems(JSON.stringify(buyHat(null, 400, T).state), T).hat, true);
  assert.equal(loadItems({ staff: true, exp: {} }, T).staff, true);
});
test('afterArmor: đội nón bớt ~3% mỗi đòn (làm tròn, tối thiểu 1); không đội thì giữ nguyên; dmg lạ → 0', () => {
  const on = buyHat(null, 400, T).state, off = toggleHat(on, T);
  assert.equal(afterArmor(100, on), 97); assert.equal(afterArmor(100, off), 100); assert.equal(afterArmor(100, null), 100);
  assert.equal(afterArmor(1, on), 1); assert.equal(afterArmor(10, on), 10); assert.equal(afterArmor(34, on), 33);
  for (const bad of [0, -5, NaN, 'x', undefined, null]) assert.equal(afterArmor(bad, on), 0);
  let sumOn = 0, sumOff = 0; for (let d = 20; d <= 400; d++) { sumOn += afterArmor(d, on); sumOff += afterArmor(d, off); }
  assert.ok(Math.abs(1 - sumOn / sumOff - 0.03) < 0.002, 'trung bình giảm ~3%');
});
test('hatGlb: mô hình nón nhúng là GLB hợp lệ (nhỏ, có mảnh lưới, không còn dây cằm 13 MB)', () => {
  const buf = Buffer.from(HAT_GLB_B64, 'base64');
  assert.equal(buf.toString('latin1', 0, 4), 'glTF'); assert.equal(buf.readUInt32LE(4), 2); assert.equal(buf.readUInt32LE(8), buf.length);
  assert.ok(buf.length < 20000, 'nón nhúng phải nhỏ: ' + buf.length);
  const jl = buf.readUInt32LE(12), json = JSON.parse(buf.toString('utf8', 20, 20 + jl));
  assert.ok(json.meshes.length >= 1); assert.ok(json.materials.every((m) => m.name !== 'jingasa_rope'));
});
