import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLDS, DEFAULT_HOLD, MOUNT_MUL, ownedMap, loadLoadout, chooseHold, weaponFor, mountOf, mountMul, rideLabel, isWeapon } from '../js/world/loadout.js';

test('mặc định: cầm Thương, ai cũng có thương', () => {
  assert.equal(DEFAULT_HOLD, 'thuong'); assert.deepEqual(ownedMap(), { thuong: true, nhuy: false, van: false });
  assert.deepEqual(loadLoadout(null), { hold: 'thuong', last: 'thuong' }); assert.deepEqual(loadLoadout('{hỏng'), { hold: 'thuong', last: 'thuong' });
});
test('đồ chưa có thì không cầm được; đồ lạ bị từ chối', () => {
  assert.equal(chooseHold(null, 'nhuy', ownedMap()).reason, 'notowned');
  assert.equal(chooseHold(null, 'van', ownedMap({ staff: true })).reason, 'notowned');
  assert.equal(chooseHold(null, 'kiem', ownedMap()).reason, 'unknown');
  assert.equal(loadLoadout({ hold: 'nhuy', last: 'nhuy' }, ownedMap()).hold, 'thuong');   // lưu cũ nhưng chưa sở hữu → về thương
});
test('chọn gậy → đánh bằng gậy, cưỡi gậy', () => {
  const own = ownedMap({ staff: true }), r = chooseHold(null, 'nhuy', own);
  assert.ok(r.ok); assert.equal(weaponFor(r.state, own), 'nhuy'); assert.equal(mountOf(r.state, own), 'nhuy');
});
test('ván không phải vũ khí: cầm ván thì vẫn đánh bằng vũ khí cầm trước đó', () => {
  const own = ownedMap({ staff: true, board: true });
  let s = chooseHold(null, 'nhuy', own).state; s = chooseHold(s, 'van', own).state;
  assert.equal(s.hold, 'van'); assert.equal(weaponFor(s, own), 'nhuy'); assert.equal(mountOf(s, own), 'van'); assert.equal(isWeapon('van'), false);
  s = chooseHold(s, 'thuong', own).state; assert.equal(weaponFor(s, own), 'thuong');
});
test('ván mua rồi mà chưa có gậy: cầm ván → đánh bằng thương', () => {
  const own = ownedMap({ board: true }), s = chooseHold(null, 'van', own).state;
  assert.equal(weaponFor(s, own), 'thuong');
});
test('tốc độ cưỡi: ván ×1,5 (hơn thường 0,5); thương/gậy ×1,25 (tạm); lạ ×1', () => {
  assert.equal(mountMul('van'), 1.5); assert.equal(MOUNT_MUL.thuong, 1.25); assert.equal(mountMul('nhuy'), 1.25); assert.equal(mountMul('abc'), 1);
});
test('nhãn nút cưỡi theo đồ', () => {
  assert.equal(rideLabel('thuong', false), 'Cưỡi thương'); assert.equal(rideLabel('nhuy', false), 'Cưỡi gậy'); assert.equal(rideLabel('van', false), 'Lướt ván');
  assert.equal(rideLabel('van', true), 'Xuống ván'); assert.equal(rideLabel('thuong', true), 'Xuống');
});
test('HOLDS có đúng 3 món, chỉ ván là không phải vũ khí', () => {
  assert.deepEqual(HOLDS.map((h) => h.id), ['thuong', 'nhuy', 'van']); assert.deepEqual(HOLDS.filter((h) => !h.weapon).map((h) => h.id), ['van']);
});
