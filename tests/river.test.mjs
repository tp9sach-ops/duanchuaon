import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/outside.js';
import { registerOutside, OUT_WALKS, OUT_ROCKS } from '../js/world/outside.js';
import { RIVER, LAKE, riverCircles } from '../js/world/river.js';
import { swimWaterAt } from '../js/world/swim.js';
import { blocked, canStep, groundY, WATERS, bridgeAt } from '../js/world/layout.js';

registerOutside();
const walkable = (x, z) => OUT_WALKS.some((w) => x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1);

test('dải nước phủ kín: không có khe giữa các hình tròn (cách nhau < bán kính)', () => {
  const cs = riverCircles(); assert.ok(cs.length > 20);
  for (let i = 1; i < cs.length; i++) assert.ok(Math.hypot(cs[i].x - cs[i - 1].x, cs[i].z - cs[i - 1].z) <= RIVER.hw * 1.2, 'khe ở ' + i);
});
test('sông bắt đầu ở mép hồ thác (nối liền) và hết trong vùng chặn (không để lọt người ra ngoài)', () => {
  const [sx, sz] = RIVER.pts[0]; assert.ok(Math.hypot(sx - 106, sz - 104) <= 7.5 + 1.7 + 0.2);
  assert.equal(walkable(...RIVER.pts[RIVER.pts.length - 1]), false);
});
test('sông bơi được (không chặn) nhưng vẫn có cầu đá đi bộ qua; mặt cầu cao 0,45', () => {
  assert.equal(blocked(98.8, 112.7), false, 'giữa sông: bơi được (Phiên 87)'); assert.ok(swimWaterAt(98.8, 112.7), 'giữa sông là nước bơi');
  const b = RIVER.bridge, zc = (b.z0 + b.z1) / 2, W = b.x0 - 0.3, E = b.x1 + 0.3;
  assert.equal(blocked(W, zc), false, 'bờ Tây đi được'); assert.equal(blocked(E, zc), false, 'bờ Đông đi được');
  let ok = true, x = W; for (; x < E; x += 0.2) if (!canStep(x, zc, x + 0.2, zc)) { ok = false; break; }
  assert.ok(ok, 'đi thẳng qua cầu bị kẹt tại x=' + x);
  assert.equal(groundY(96.3, zc), b.y, 'mặt cầu cao ' + b.y);
  assert.equal(swimWaterAt(98.8, 112.5) !== null && bridgeAt(98.8, 112.5) === null, true, 'ngoài cầu (phía Bắc) là nước, phải bơi');
});
test('hai đầu cầu không vướng tảng đá; cầu nằm trong vùng đi bộ của bãi thác', () => {
  const b = RIVER.bridge; for (const r of OUT_ROCKS) assert.ok(Math.hypot(r.x - Math.max(b.x0, Math.min(r.x, b.x1)), r.z - Math.max(b.z0, Math.min(r.z, b.z1))) > r.r + 0.6, 'đá ' + r.x + ',' + r.z);
  for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z1], [b.x0, b.z1], [b.x1, b.z0]]) assert.ok(walkable(x, z));
  assert.ok(bridgeAt(96.3, 116) && !bridgeAt(90, 116));
});
test('Hồ Rừng: nằm trong bãi rừng, chặn ở giữa, đi tới mép được, không đè miếu/cổ thụ', () => {
  assert.ok(walkable(LAKE.x - LAKE.r, LAKE.z) || walkable(LAKE.x + LAKE.r, LAKE.z));
  assert.equal(blocked(LAKE.x, LAKE.z - 3.8), false, 'mặt hồ (ngoài sàn): bơi được'); assert.ok(swimWaterAt(LAKE.x, LAKE.z - 3.8)); assert.equal(blocked(LAKE.x + LAKE.r + 1.2, LAKE.z + 4), false);
  assert.ok(Math.hypot(LAKE.x + 106, LAKE.z - 90) > LAKE.r + 2.2 + 1, 'cách cổ thụ'); assert.ok(WATERS.some((w) => w.x === LAKE.x && w.r === LAKE.r));
});

import { smooth, ribbonStrip } from '../js/world/river.js';
test('smooth giữ hai đầu; ribbonStrip có 2 đỉnh mỗi điểm, chỉ số hợp lệ, bề rộng đúng 2·hw', () => {
  const s = smooth(RIVER.pts); assert.deepEqual(s[0], RIVER.pts[0]); assert.deepEqual(s[s.length - 1], RIVER.pts[RIVER.pts.length - 1]); assert.ok(s.length > RIVER.pts.length);
  const { verts, idx } = ribbonStrip(s, RIVER.hw); assert.equal(verts.length, s.length * 2); assert.equal(idx.length, (s.length - 1) * 6);
  assert.ok(idx.every((i) => i >= 0 && i < verts.length));
  for (let i = 0; i < verts.length; i += 2) assert.ok(Math.abs(Math.hypot(verts[i][0] - verts[i + 1][0], verts[i][1] - verts[i + 1][1]) - 2 * RIVER.hw) < 1e-9);
});

import { THUY_TA } from '../js/world/river.js';
import { placesAt, placeById } from '../js/world/outside.js';
test('Thủy tạ: đi từ bờ Đông theo lối gỗ ra sàn được, mặt sàn cao 0,4; trụ chặn; vùng nước cạnh sàn bơi được; tính là đã ghé', () => {
  const { deck: d, pier: p, stand } = THUY_TA, zc = (p.z0 + p.z1) / 2;
  assert.equal(blocked(p.x1 + 0.4, zc), false, 'bờ Đông đầu lối gỗ');
  let x = p.x1 + 0.4; for (; x > stand.x; x -= 0.2) if (!canStep(x, zc, x - 0.2, zc)) break;
  assert.ok(x <= stand.x + 0.01, 'đi tới giữa sàn bị kẹt tại x=' + x);
  assert.equal(groundY(stand.x, stand.z), d.y); assert.equal(groundY(p.x0 + 1, zc), p.y);
  for (const [px, pz] of THUY_TA.posts) assert.equal(blocked(px, pz), true, 'trụ ' + px + ',' + pz);
  assert.equal(blocked(stand.x, stand.z), false, 'giữa sàn đứng được');
  assert.ok(swimWaterAt(d.x0 - 0.8, stand.z), 'ngoài mép sàn phía Tây là nước bơi');
  assert.ok(swimWaterAt(p.x0 + 0.5, p.z1 + 0.8), 'cạnh lối gỗ là nước bơi');
  assert.ok(placeById('thuyta') && placesAt(stand).includes('thuyta'));
});

import { nearWater } from '../js/world/fishing.js';
test('Suối Trong là nơi để ghé: đứng ở bờ Đông được, tính là đã ghé, và đứng đó câu được ở suối', () => {
  const p = placeById('suoitrong'); assert.ok(p); assert.equal(blocked(p.x, p.z), false);
  assert.ok(placesAt({ x: p.x, z: p.z }).includes('suoitrong')); assert.equal(nearWater(p.x, p.z).id, 'suoitrong');
  assert.ok(walkable(p.x, p.z));
});
