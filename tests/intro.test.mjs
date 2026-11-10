import test from 'node:test';
import assert from 'node:assert/strict';
import { WAYPOINTS, LANDMARKS, DURATION, TRACK, buildTrack, atDistance, distanceAt, introState, introCamera, labelAt, FINAL_CAM } from '../js/world/intro.js';
import { SPAWN, BOUNDS } from '../js/world/layout.js';

test('bay một vòng: bắt đầu phía nam làng, kết thúc ĐÚNG chỗ xuất phát trước cổng chùa', () => {
  const s0 = introState(0), s1 = introState(DURATION);
  assert.ok(s0.z > 150, 'xuất phát cao phía sau làng'); assert.ok(s0.y > 40);
  assert.ok(Math.hypot(s1.x - SPAWN.x, s1.z - SPAWN.z) < 0.01, 'đáp đúng SPAWN'); assert.ok(s1.y < 0.5, 'chạm đất'); assert.equal(s1.done, true);
  assert.ok(Math.abs(Math.atan2(Math.sin(s1.heading - SPAWN.ry), Math.cos(s1.heading - SPAWN.ry))) < 0.35, 'lúc đáp nhìn về phía cổng chùa như SPAWN.ry');
});
test('đường bay phủ cả bản đồ: tây, đông, bắc (sau chùa) và nam (làng)', () => {
  const xs = TRACK.pts.map((p) => p.x), zs = TRACK.pts.map((p) => p.z);
  assert.ok(Math.min(...xs) <= -110 && Math.max(...xs) >= 115, 'qua rừng thông (tây) và thác/Đại Phật (đông)'); assert.ok(Math.min(...zs) <= BOUNDS.zMin - 30 && Math.max(...zs) >= 160, 'qua sau chùa và phía nam làng');
  assert.ok(TRACK.length > 700 && TRACK.length < 1800);
});
test('tốc độ êm: tăng tốc đầu, chậm dần khi đáp, quãng đường đơn điệu từ 0 tới hết', () => {
  let prev = -1; for (let t = 0; t <= DURATION; t += 0.5) { const d = distanceAt(t); assert.ok(d >= prev - 1e-9); prev = d; }
  assert.equal(distanceAt(0), 0); assert.ok(Math.abs(distanceAt(DURATION) - TRACK.length) < 1e-6);
  assert.ok(introState(1).speed < introState(15).speed); assert.ok(introState(DURATION - 0.5).speed < introState(15).speed * 0.25, 'đáp nhẹ');
});
test('không bao giờ chui xuống đất (trừ lúc chạm đất) và mọi số hữu hạn', () => {
  for (let t = 0; t <= DURATION; t += 0.25) { const s = introState(t), c = introCamera(s, t); for (const v of [s.x, s.y, s.z, s.heading, s.pitch, s.bank, s.speed, ...c.pos, ...c.look]) assert.ok(Number.isFinite(v)); assert.ok(s.y >= 0); assert.ok(c.pos[1] >= 3 - 1e-9, 'camera cách đất'); if (t < DURATION - 8) assert.ok(s.y >= 20, 'đủ cao khi bay vòng'); }
});
test('camera cuối khớp FINAL_CAM; đầu phim kéo xa hơn giữa phim', () => {
  const e = introCamera(introState(DURATION), DURATION); for (let i = 0; i < 3; i++) { assert.ok(Math.abs(e.pos[i] - FINAL_CAM.pos[i]) < 1e-6); assert.ok(Math.abs(e.look[i] - FINAL_CAM.look[i]) < 1e-6); }
  const a = introState(0), ca = introCamera(a, 0), b = introState(15), cb = introCamera(b, 15);
  assert.ok(Math.hypot(ca.pos[0] - a.x, ca.pos[2] - a.z) > Math.hypot(cb.pos[0] - b.x, cb.pos[2] - b.z) + 5);
});
test('địa danh: gần rừng thông → "Rừng thông"; xa tất cả → rỗng; chạy hết phim gặp ≥ 5 địa danh', () => {
  assert.equal(labelAt(-98, 89), 'Rừng thông'); assert.equal(labelAt(500, 500), '');
  const seen = new Set(); for (let t = 0; t <= DURATION; t += 0.5) { const l = introState(t).label; if (l) seen.add(l); } assert.ok(seen.size >= 5, [...seen].join('|'));
  assert.ok(LANDMARKS.every((l) => l.ten && Number.isFinite(l.x) && Number.isFinite(l.z)));
});
test('buildTrack/atDistance chịu dữ liệu lạ', () => {
  const t = buildTrack([[0, 0, 0], [10, 0, 0]], 4); assert.ok(Math.abs(t.length - 10) < 1e-9); assert.deepEqual(atDistance(t, -5), { x: 0, y: 0, z: 0 }); assert.equal(atDistance(t, 99).x, 10); assert.equal(atDistance(t, NaN).x, 0);
  assert.equal(WAYPOINTS.length, 16);
});
