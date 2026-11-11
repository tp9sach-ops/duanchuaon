// Test chỉ số theo Tu Vi (G1.1). Chạy: node --test tests/stats.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { STATS_CFG } from '../js/data/stats.js';
import { clampTuVi, congOf, thuOf, sinhLucOf, statsOf } from '../js/world/stats.js';

test('stats: cấu hình đánh dấu TẠM, khoảng Tu Vi 1..150 và đóng băng', () => {
  assert.equal(STATS_CFG.tam, true);
  assert.equal(STATS_CFG.tuViMin, 1);
  assert.equal(STATS_CFG.tuViMax, 150);
  assert.ok(Object.isFrozen(STATS_CFG) && Object.isFrozen(STATS_CFG.cong) && Object.isFrozen(STATS_CFG.thu) && Object.isFrozen(STATS_CFG.sinhLuc));
});

test('stats: clampTuVi kẹp 1..150, làm tròn xuống, đầu vào lạ về 1', () => {
  assert.equal(clampTuVi(1), 1);
  assert.equal(clampTuVi(150), 150);
  assert.equal(clampTuVi(0), 1);
  assert.equal(clampTuVi(-7), 1);
  assert.equal(clampTuVi(999), 150);
  assert.equal(clampTuVi(12.9), 12);
  assert.equal(clampTuVi('30'), 30);
  for (const bad of [null, undefined, NaN, 'abc', {}, [], Infinity]) assert.equal(clampTuVi(bad), 1, String(bad));
});

test('stats: giá trị mốc có đáp án tay (cấp 1, 10, 30, 60, 150)', () => {
  assert.deepEqual(statsOf(1), { tuvi: 1, cong: 10, thu: 5, sinhLuc: 120 });
  assert.deepEqual(statsOf(10), { tuvi: 10, cong: 37, thu: 23, sinhLuc: 345 });      // 10+3*9, 5+2*9, 120+25*9
  assert.deepEqual(statsOf(30), { tuvi: 30, cong: 97, thu: 63, sinhLuc: 845 });      // 10+3*29, 5+2*29, 120+25*29
  assert.deepEqual(statsOf(60), { tuvi: 60, cong: 187, thu: 123, sinhLuc: 1595 });   // 10+3*59, 5+2*59, 120+25*59
  assert.deepEqual(statsOf(150), { tuvi: 150, cong: 457, thu: 303, sinhLuc: 3845 }); // 10+3*149, 5+2*149, 120+25*149
});

test('stats: mọi chỉ số là số nguyên và tăng nghiêm ngặt theo từng cấp 1..150', () => {
  for (let tv = 1; tv <= 150; tv++) {
    const s = statsOf(tv);
    for (const k of ['cong', 'thu', 'sinhLuc']) assert.ok(Number.isInteger(s[k]) && s[k] > 0, `${k} @${tv}`);
    if (tv > 1) {
      const p = statsOf(tv - 1);
      for (const k of ['cong', 'thu', 'sinhLuc']) assert.ok(s[k] > p[k], `${k} tăng @${tv}`);
    }
  }
});

test('stats: hàm lẻ khớp statsOf; ngoài khoảng dùng giá trị biên', () => {
  assert.equal(congOf(77), statsOf(77).cong);
  assert.equal(thuOf(77), statsOf(77).thu);
  assert.equal(sinhLucOf(77), statsOf(77).sinhLuc);
  assert.deepEqual(statsOf(0), statsOf(1));
  assert.deepEqual(statsOf(500), statsOf(150));
  assert.deepEqual(statsOf(undefined), statsOf(1));
});

test('stats: không đổi chỉ số khi gọi lặp (hàm thuần)', () => {
  const a = statsOf(42), b = statsOf(42);
  assert.deepEqual(a, b);
  a.cong = 0;
  assert.equal(statsOf(42).cong, b.cong);
});
