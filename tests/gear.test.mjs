// Phiên 210 (S2): test hạ tầng trang bị mới (js/gear/*). Dùng danh sách món GIẢ, không phụ thuộc món thật.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, RARITY, MAX_UPGRADE, BONUS_CAP } from '../js/gear/gearConfig.js';
import { GEAR_ITEMS, gearEnabled, emptyGear, loadGear, saveGear, addItem, equip, unequip, upgrade, upgradeCost, capBonus } from '../js/gear/gearState.js';
import { CONFIG } from '../js/config.js';

const REG = [
  { id: 'non_thu', ten: 'Nón thử', slot: 'dau', rarity: 2 },
  { id: 'non_thu2', ten: 'Nón thử 2', slot: 'dau', rarity: 1 },
  { id: 'dep_thu', ten: 'Dép thử', slot: 'chan', rarity: 3 },
];

test('bảy ô, bốn bậc hiếm, màu đúng', () => {
  assert.equal(SLOTS.length, 7); assert.equal(RARITY.length, 4);
  assert.deepEqual(RARITY.map((r) => r.mau), ['#cfc8b4', '#4aa58a', '#d9b25f', '#e8a0b8']);
  assert.deepEqual(RARITY.map((r) => r.noiTai), [0, 1, 2, 3]);
});
test('cờ tính năng mặc định TẮT; thiếu/lạ cũng tắt', () => {
  assert.equal(gearEnabled(CONFIG), false);
  for (const c of [null, undefined, {}, { features: null }, { features: { gear: 'true' } }, { features: { gear: 1 } }]) assert.equal(gearEnabled(c), false);
  assert.equal(gearEnabled({ features: { gear: true } }), true);
});
test('danh sách món mặc định rỗng → mọi thứ về trống, không ném lỗi', () => {
  assert.equal(GEAR_ITEMS.length, 0);
  for (const raw of [undefined, null, '', 'xx{', 5, [], { owned: { a: { lv: 1 } } }]) assert.deepEqual(loadGear(raw), emptyGear());
});
test('thêm / mặc / cởi: món cũ cùng ô tự cởi', () => {
  let s = emptyGear();
  assert.equal(addItem(s, 'khongco', REG).reason, 'unknown');
  s = addItem(s, 'non_thu', REG).state; s = addItem(s, 'non_thu2', REG).state;
  assert.equal(addItem(s, 'non_thu', REG).reason, 'owned');
  assert.equal(equip(s, 'dep_thu', REG).reason, 'notowned');
  s = equip(s, 'non_thu', REG).state; assert.equal(s.worn.dau, 'non_thu');
  s = equip(s, 'non_thu2', REG).state; assert.equal(s.worn.dau, 'non_thu2');
  s = unequip(s, 'dau', REG); assert.equal(s.worn.dau, undefined);
  assert.deepEqual(unequip(s, 'lạ', REG), s);
});
test('đọc dữ liệu lưu: bỏ món lạ, kẹp bậc, bỏ đồ mặc sai ô / không sở hữu', () => {
  const raw = JSON.stringify({ v: 1, owned: { non_thu: { lv: 99 }, xxx: { lv: 1 }, dep_thu: { lv: -5 } }, worn: { dau: 'non_thu', chan: 'non_thu', co: 'dep_thu', than: 'non_thu2' } });
  const s = loadGear(raw, REG);
  assert.equal(s.owned.non_thu.lv, MAX_UPGRADE); assert.equal(s.owned.dep_thu.lv, 0); assert.equal(s.owned.xxx, undefined);
  assert.deepEqual(s.worn, { dau: 'non_thu' });
  assert.deepEqual(loadGear(saveGear(s, REG), REG), s);   // lưu rồi đọc lại không đổi
});
test('nâng cấp: đúng chi phí, thiếu đồ thì không nâng, tối đa 4, luôn thành công khi đủ', () => {
  let s = addItem(emptyGear(), 'dep_thu', REG).state;   // bậc Quý → nguyên liệu ×2
  assert.deepEqual(upgradeCost(s, 'dep_thu', REG), { la: 50, nl: 0 });
  assert.equal(upgrade(s, 'dep_thu', { la: 49, nl: 9 }, REG).reason, 'poor');
  assert.equal(upgrade(s, 'dep_thu', {}, REG).reason, 'poor');
  s = upgrade(s, 'dep_thu', { la: 50, nl: 0 }, REG).state; assert.equal(s.owned.dep_thu.lv, 1);
  assert.deepEqual(upgradeCost(s, 'dep_thu', REG), { la: 120, nl: 2 });
  s = upgrade(s, 'dep_thu', { la: 999, nl: 99 }, REG).state; s = upgrade(s, 'dep_thu', { la: 999, nl: 99 }, REG).state; s = upgrade(s, 'dep_thu', { la: 999, nl: 99 }, REG).state;
  assert.equal(s.owned.dep_thu.lv, 4);
  const r = upgrade(s, 'dep_thu', { la: 999, nl: 99 }, REG); assert.equal(r.reason, 'max'); assert.equal(upgradeCost(s, 'dep_thu', REG), null);
  assert.equal(upgrade(emptyGear(), 'dep_thu', { la: 999, nl: 99 }, REG).reason, 'notowned');
});
test('trần hệ số chung +25%, giá trị lạ/âm bị bỏ', () => {
  assert.equal(BONUS_CAP, 0.25);
  assert.equal(capBonus([0.1, 0.1, 0.1]), 0.25);
  assert.equal(capBonus([0.1, -1, 'x', NaN, 0.05]), 0.15000000000000002);
  assert.equal(capBonus(null), 0);
});
