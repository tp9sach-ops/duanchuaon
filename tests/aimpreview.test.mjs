// Phiên 207: vùng tung chiêu xem trước khi lướt tay (hình học thuần) + nối trong heSkill.js / luyenChieu.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewPoly } from '../js/world/aimPreview.js';
const r = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

test('previewPoly đường: hình chữ nhật từ chân người chơi ra phía trước; thiếu bề rộng → 2 m', () => {
  assert.deepEqual(previewPoly({ kieu: 'duong', dai: 10, rong: 2 }), [[-1, 0], [1, 0], [1, 10], [-1, 10]]);
  assert.deepEqual(previewPoly({ kieu: 'duong', dai: 6 }), [[-1, 0], [1, 0], [1, 6], [-1, 6]]);
});

test('previewPoly nón: đỉnh ở chân, cung tròn cân hai bên trục z, mọi điểm cung cách đỉnh đúng "dai"', () => {
  const p = previewPoly({ kieu: 'non', dai: 6, goc: 90 }, 2);
  assert.equal(p.length, 4); assert.deepEqual(p[0], [0, 0]);
  assert.ok(Math.abs(p[2][0]) < 1e-9 && Math.abs(p[2][1] - 6) < 1e-9);
  assert.ok(Math.abs(p[1][0] + p[3][0]) < 1e-9 && Math.abs(p[1][1] - p[3][1]) < 1e-9);
  for (const q of p.slice(1)) assert.ok(Math.abs(Math.hypot(q[0], q[1]) - 6) < 1e-9);
  const def = previewPoly({ kieu: 'non' }); assert.ok(Math.abs(Math.hypot(def[1][0], def[1][1]) - 8) < 1e-9);   // thiếu số đo → dài 8 m
});

test('previewPoly: vòng tròn / hình lạ / rỗng → null (không vẽ xem trước)', () => {
  assert.equal(previewPoly({ kieu: 'tron', r: 4 }), null); assert.equal(previewPoly(null), null); assert.equal(previewPoly('x'), null); assert.equal(previewPoly({}), null);
});

test('heSkill.js: lướt chiêu định hướng vẽ vùng xem trước trên đất, và khu luyện tập nhận hướng lướt', () => {
  const s = r('../js/ui/heSkill.js');
  assert.match(s, /import\('\.\.\/scene\/aimPreview\.js'\)/); assert.match(s, /showGround\(s, sw\)/); assert.match(s, /gPrev\.show\(\{ x: p\.x, z: p\.z, ry: sd\.ry/);
  assert.match(s, /luyenCast\(slot, swipe\)/); assert.match(s, /L\.castById\(sk\.id, sd \? \{ ry: sd\.ry \} : null\)/);
});

test('luyenChieu.js: chiêu định hướng ở khu luyện tập bay theo hướng lướt và chỉ nháy mộc nhân trong vùng báo', () => {
  const s = r('../js/ui/luyenChieu.js');
  assert.match(s, /pickInDir\(p, aim\.ry/); assert.match(s, /function cast\(i, aim\)/); assert.match(s, /castById = \(id, aim\)/);
});
