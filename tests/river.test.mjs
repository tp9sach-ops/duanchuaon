import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/outside.js';
import { registerOutside, OUT_WALKS, OUT_ROCKS } from '../js/world/outside.js';
import { RIVER, LAKE, riverCircles } from '../js/world/river.js';
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
test('đứng giữa sông thì bị chặn; đi từ bờ này sang bờ kia chỉ qua được trên cầu đá', () => {
  assert.equal(blocked(98.8, 112.7), true, 'giữa sông (ngoài cầu)');
  const b = RIVER.bridge, zc = (b.z0 + b.z1) / 2, W = b.x0 - 0.3, E = b.x1 + 0.3;
  assert.equal(blocked(W, zc), false, 'bờ Tây đi được'); assert.equal(blocked(E, zc), false, 'bờ Đông đi được');
  let ok = true, x = W; for (; x < E; x += 0.2) if (!canStep(x, zc, x + 0.2, zc)) { ok = false; break; }
  assert.ok(ok, 'đi thẳng qua cầu bị kẹt tại x=' + x);
  assert.equal(groundY(96.3, zc), b.y, 'mặt cầu cao ' + b.y);
  assert.equal(canStep(W, 112.5, E, 112.5), false, 'ngoài cầu (phía Bắc) không băng qua được');
});
test('hai đầu cầu không vướng tảng đá; cầu nằm trong vùng đi bộ của bãi thác', () => {
  const b = RIVER.bridge; for (const r of OUT_ROCKS) assert.ok(Math.hypot(r.x - Math.max(b.x0, Math.min(r.x, b.x1)), r.z - Math.max(b.z0, Math.min(r.z, b.z1))) > r.r + 0.6, 'đá ' + r.x + ',' + r.z);
  for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z1], [b.x0, b.z1], [b.x1, b.z0]]) assert.ok(walkable(x, z));
  assert.ok(bridgeAt(96.3, 116) && !bridgeAt(90, 116));
});
test('Hồ Rừng: nằm trong bãi rừng, chặn ở giữa, đi tới mép được, không đè miếu/cổ thụ', () => {
  assert.ok(walkable(LAKE.x - LAKE.r, LAKE.z) || walkable(LAKE.x + LAKE.r, LAKE.z));
  assert.equal(blocked(LAKE.x, LAKE.z), true); assert.equal(blocked(LAKE.x + LAKE.r + 1.2, LAKE.z), false);
  assert.ok(Math.hypot(LAKE.x + 106, LAKE.z - 90) > LAKE.r + 2.2 + 1, 'cách cổ thụ'); assert.ok(WATERS.some((w) => w.x === LAKE.x && w.r === LAKE.r));
});

import { smooth, ribbonStrip } from '../js/world/river.js';
test('smooth giữ hai đầu; ribbonStrip có 2 đỉnh mỗi điểm, chỉ số hợp lệ, bề rộng đúng 2·hw', () => {
  const s = smooth(RIVER.pts); assert.deepEqual(s[0], RIVER.pts[0]); assert.deepEqual(s[s.length - 1], RIVER.pts[RIVER.pts.length - 1]); assert.ok(s.length > RIVER.pts.length);
  const { verts, idx } = ribbonStrip(s, RIVER.hw); assert.equal(verts.length, s.length * 2); assert.equal(idx.length, (s.length - 1) * 6);
  assert.ok(idx.every((i) => i >= 0 && i < verts.length));
  for (let i = 0; i < verts.length; i += 2) assert.ok(Math.abs(Math.hypot(verts[i][0] - verts[i + 1][0], verts[i][1] - verts[i + 1][1]) - 2 * RIVER.hw) < 1e-9);
});
