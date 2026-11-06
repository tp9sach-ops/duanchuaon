import test from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, seasonOfMonth, parseSeasonParam, seasonState, seasonColor, isLeafGreen } from '../js/world/season.js';
import { dayState } from '../js/world/daycycle.js';

test('tháng → mùa và ?mua=', () => {
  assert.deepEqual([3, 5, 6, 8, 9, 11, 12, 1, 2].map(seasonOfMonth), ['xuan', 'xuan', 'ha', 'ha', 'thu', 'thu', 'dong', 'dong', 'dong']);
  assert.equal(parseSeasonParam('?mua=dong', new Date(2026, 5, 1)), 'dong'); assert.equal(parseSeasonParam('', new Date(2026, 10, 6)), 'thu');
  assert.equal(parseSeasonParam('?mua=abc', new Date(2026, 0, 6)), 'dong');
});
test('bốn mùa khác nhau rõ rệt (lá, cỏ, hạt rơi, sương) và dữ liệu hợp lệ', () => {
  const S = SEASONS.map(seasonState); assert.equal(S.length, 4);
  for (const s of S) {
    for (const c of [...s.leaf, s.grass, s.grassMul, s.haze, s.petals.color]) assert.ok(Number.isInteger(c) && c >= 0 && c <= 0xffffff);
    assert.ok(s.leafK > 0 && s.leafK < 1 && s.fogMul > 0 && s.petals.mul >= 0 && s.petals.speed > 0 && s.petals.opacity > 0 && s.petals.opacity <= 1);
  }
  assert.equal(new Set(S.map((s) => s.leaf[0])).size, 4); assert.equal(new Set(S.map((s) => s.petals.color)).size, 4);
  const by = Object.fromEntries(S.map((s) => [s.name, s]));
  assert.ok(by.dong.fogMul > by.xuan.fogMul && by.dong.fogMul > by.thu.fogMul && by.dong.hazeK > by.ha.hazeK, 'đông nhiều sương nhất');
  assert.ok(by.thu.warmBias > by.xuan.warmBias && by.thu.warmBias > by.dong.warmBias, 'thu ấm nhất');
  assert.ok(by.xuan.petals.mul > by.ha.petals.mul, 'xuân nhiều cánh hoa hơn hạ');
});
test('màu lá: thu ngả vàng/đỏ (không còn xanh), xuân/hạ vẫn xanh, đông xám xanh; màu gốc 0 → giữ gốc', () => {
  const base = 0x58a844;
  for (const i of [0, 1, 2, 3]) assert.ok(!isLeafGreen(seasonColor(seasonState('thu'), 'leaf', base, i)), 'thu lá ' + i + ' không xanh');
  for (const m of ['xuan', 'ha']) assert.ok(isLeafGreen(seasonColor(seasonState(m), 'leaf', base, 0)), m + ' vẫn xanh');
  assert.notEqual(seasonColor(seasonState('dong'), 'leaf', base, 0), base);
  assert.equal(seasonColor(seasonState('xuan'), 'grass', 0x7fb35a, 0, true), seasonState('xuan').grassMul);
  assert.ok(seasonColor(seasonState('thu'), 'grass', 0x7fb35a) !== 0x7fb35a);
  assert.ok(isLeafGreen(0x2f6f35) && isLeafGreen(0x6dbb5e) && !isLeafGreen(0x84573a) && !isLeafGreen(0xcfe8f5) && !isLeafGreen(0xe0a030) && !isLeafGreen(0x808080));
});
test('warmBias làm ánh trưa ấm hơn nhưng bias 0 không đổi gì; đêm không bị ảnh hưởng', () => {
  assert.deepEqual(dayState(12, 0), dayState(12));
  assert.ok(dayState(12, 0.28).warm > 0.2 && dayState(12, 0.28).sun.color !== dayState(12).sun.color);
  assert.equal(dayState(0, 0.28).sun.color, dayState(0).sun.color); assert.equal(dayState(12, -0.1).warm, 0);
});
