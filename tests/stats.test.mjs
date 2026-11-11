// Test chỉ số theo Tu Vi (G1.1). Chạy: node --test tests/stats.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { STATS_CFG, EXP_CFG } from '../js/data/stats.js';
import { clampTuVi, congOf, thuOf, sinhLucOf, statsOf, expToNext, expCurve, totalExpFor, levelFromExp, expRemaining, progressOf } from '../js/world/stats.js';

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

// ---- G1.2: đường cong Tu Vi
test('exp: mốc GDD v2 mục 4.2 (EXP một cấp = 30 × n^1,6) đúng trong 1%', () => {
  assert.equal(EXP_CFG.heSo, 30); assert.equal(EXP_CFG.mu, 1.6); assert.equal(EXP_CFG.tam, true);
  const goc = { 10: 1200, 30: 6900, 60: 21000, 90: 40000, 120: 64000, 150: 91000 };
  for (const [n, v] of Object.entries(goc)) assert.ok(Math.abs(expCurve(+n) - v) / v < 0.01, `cấp ${n}: ${expCurve(+n)} vs ${v}`);
  assert.equal(expCurve(10), 1194); assert.equal(expCurve(30), 6927); assert.equal(expCurve(1), 30);
});

test('exp: expToNext — cấp 1 = 30, tăng dần, cấp 150 = 0, đầu vào lạ → như cấp 1', () => {
  assert.equal(expToNext(1), 30);
  assert.equal(expToNext(10), 1194);
  assert.equal(expToNext(150), 0);
  assert.equal(expToNext('abc'), 30);
  for (let n = 2; n < 150; n++) assert.ok(expToNext(n) > expToNext(n - 1), `tăng @${n}`);
});

test('exp: totalExpFor là tổng cộng dồn, cấp 1 = 0; levelFromExp là hàm ngược', () => {
  assert.equal(totalExpFor(1), 0);
  assert.equal(totalExpFor(2), 30);
  let sum = 0; for (let t = 1; t < 150; t++) { assert.equal(totalExpFor(t), sum, `cum ${t}`); sum += expToNext(t); assert.equal(totalExpFor(t + 1), sum); }
  for (let t = 1; t <= 150; t++) {
    assert.equal(levelFromExp(totalExpFor(t)), t, `đạt đúng cấp ${t}`);
    if (t > 1) assert.equal(levelFromExp(totalExpFor(t) - 1), t - 1, `thiếu 1 EXP @${t}`);
  }
});

test('exp: levelFromExp kẹp biên và đầu vào lạ', () => {
  for (const v of [0, -5, NaN, null, undefined, 'x', 29, 29.9]) assert.equal(levelFromExp(v), 1, String(v));
  assert.equal(levelFromExp(30), 2);
  assert.equal(levelFromExp(1e12), 150);
  assert.equal(levelFromExp(Infinity), 1);
});

test('exp: expRemaining và progressOf nhất quán', () => {
  assert.equal(expRemaining(0), 30);
  assert.equal(expRemaining(29), 1);
  assert.equal(expRemaining(30), expToNext(2));
  assert.equal(expRemaining(1e12), 0);
  assert.deepEqual(progressOf(0), { tuvi: 1, into: 0, need: 30, pct: 0 });
  assert.deepEqual(progressOf(15), { tuvi: 1, into: 15, need: 30, pct: 0.5 });
  assert.deepEqual(progressOf(1e12), { tuvi: 150, into: 0, need: 0, pct: 1 });
  for (const e of [0, 7, 30, 500, 12345, 999999]) { const p = progressOf(e); assert.equal(p.into + expRemaining(e), p.need, `into+còn=need @${e}`); assert.ok(p.pct >= 0 && p.pct < 1); }
});

test('exp: thời gian mục tiêu — cấp 10 cần khoảng 4.000 EXP tích lũy (số liệu để G8.1 playtest)', () => {
  assert.equal(totalExpFor(10), 4012);
});
