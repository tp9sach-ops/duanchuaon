// Phiên 206: Đánh thường ở khu luyện tập = lao tới + chuỗi 3 đòn (đòn 3 lan) — logic thuần js/world/luyenBasic.js + nối trong js/ui/luyenChieu.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nearestOf, planBasic, hitsFor } from '../js/world/luyenBasic.js';
const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const D = [{ x: 0, z: 0 }, { x: 3, z: 0 }, { x: 20, z: 0 }];

test('nearestOf: mộc nhân gần nhất; thiếu dữ liệu → null', () => {
  const n = nearestOf({ x: 1, z: 0 }, D); assert.equal(n.i, 0); assert.ok(Math.abs(n.dist - 1) < 1e-9);
  assert.equal(nearestOf(null, D), null); assert.equal(nearestOf({ x: 0, z: 0 }, []), null); assert.equal(nearestOf({ x: 'a', z: 0 }, D), null);
});

test('planBasic Đánh thường: gần → đánh, xa vừa → lao tới, quá xa / không có mộc nhân → vung không khí', () => {
  assert.equal(planBasic({ p: { x: 0, z: 3 }, dummies: [D[0]] }).plan, 'hit');
  const far = planBasic({ p: { x: 0, z: 9 }, dummies: [D[0]] });
  assert.equal(far.plan, 'dash'); assert.ok(Math.abs(far.dash.dist - 6.2) < 1e-6); assert.ok(Math.abs(far.dash.z - 2.8) < 1e-6);
  assert.equal(planBasic({ p: { x: 0, z: 20 }, dummies: [D[0]] }).plan, 'air');
  const none = planBasic({ p: { x: 0, z: 0 }, dummies: [] }); assert.equal(none.plan, 'air'); assert.equal(none.near, null);
});

test('planBasic Thương: không lao — trong tầm thì chạm, ngoài tầm vung không khí', () => {
  assert.equal(planBasic({ p: { x: 0, z: 3 }, dummies: [D[0]], kind: 'thuong' }).plan, 'hit');
  assert.equal(planBasic({ p: { x: 0, z: 9 }, dummies: [D[0]], kind: 'thuong' }).plan, 'air');
});

test('hitsFor: đòn 1, 2 chỉ chạm mục tiêu chính; đòn 3 lan sang mộc nhân quanh người và mạnh hơn; Thương không lan', () => {
  const p = { x: 0, z: 2 }, near = nearestOf(p, D);
  const s1 = hitsFor({ p, dummies: D, near, step: 1 }), s2 = hitsFor({ p, dummies: D, near, step: 2 }), s3 = hitsFor({ p, dummies: D, near, step: 3 });
  assert.deepEqual(s1.idx, [0]); assert.deepEqual(s2.idx, [0]); assert.deepEqual(s3.idx, [0, 1]);
  assert.ok(s3.mul > s1.mul); assert.equal(s1.mul, 1);
  const sp = hitsFor({ p, dummies: D, near, kind: 'thuong', step: 3 }); assert.deepEqual(sp.idx, [0]); assert.equal(sp.mul, 1);
  assert.deepEqual(hitsFor({ p, dummies: D, near: null, step: 3 }).idx, []);
});

test('luyenChieu.js: basic() dùng planBasic → lao tới (W.dash) → chuỗi LGT.farm.chainStep → hitsFor', () => {
  const s = r('../js/ui/luyenChieu.js');
  assert.match(s, /from '\.\.\/world\/luyenBasic\.js'/); assert.match(s, /planBasic\(\{ p, dummies: LUYEN_DUMMIES, kind: k \}\)/);
  assert.match(s, /W\.dash\(pl\.dash/); assert.match(s, /LGT\.farm\.chainStep\(\)/); assert.match(s, /hitsFor\(\{ p, dummies: LUYEN_DUMMIES, near, kind: k, step \}\)/);
});
