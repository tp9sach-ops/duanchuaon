import test from 'node:test';
import assert from 'node:assert/strict';
import { blocked, SPAWN, BOUNDS, groundY, canStep, CIRCLES, RECTS } from '../js/world/layout.js';
import { findPath, free } from '../js/world/path.js';
import { STONE_PATHS, FEATURES, KOI, ZEN, FLOWER_FIELDS, PLAZA, glbTrees, distToPaths, registerGlbTrees, TREE_MODELS } from '../js/world/landscape.js';

// Đi dọc đường tim, mẫu mỗi 0,25 m: mọi điểm phải đi được (cả khi chừa lề như bộ tìm đường) và từng bước canStep.
function walkCenterline(pts) {
  let px = pts[0][0], pz = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 0.25);
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
      if (!free(x, z)) return { ok: false, at: [x, z] };
      if (!canStep(px, pz, x, z)) return { ok: false, at: [x, z] };
      px = x; pz = z;
    }
  }
  return { ok: true };
}

test('khuôn viên mở rộng: ranh giới 78 / -78', () => {
  assert.equal(BOUNDS.xMax, 78); assert.equal(BOUNDS.zMin, -78);
  assert.equal(blocked(60, 0), false); assert.equal(blocked(0, -60), false);
  assert.equal(blocked(79, 0), true); assert.equal(blocked(0, -79), true);
});
for (const p of STONE_PATHS) {
  test(`dải đường đá "${p.id}": tim đường không chạm vật cản`, () => {
    const r = walkCenterline(p.pts);
    assert.ok(r.ok, 'vướng tại ' + (r.at || []).map((v) => v.toFixed(2)).join(','));
  });
}
test('đường đá không chồng lên vật cản nào, kể cả lề rộng của dải', () => {
  for (const p of STONE_PATHS) for (let i = 1; i < p.pts.length; i++) {
    const [ax, az] = p.pts[i - 1], [bx, bz] = p.pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / 0.5), nx = -(bz - az) / L, nz = (bx - ax) / L;
    for (let k = 0; k <= n; k++) for (const s of [-1, 1]) {
      const x = ax + (bx - ax) * k / n + nx * s * p.w / 2, z = az + (bz - az) * k / n + nz * s * p.w / 2;
      assert.equal(blocked(x, z), false, `${p.id} mép dải chạm vật cản tại ${x.toFixed(1)},${z.toFixed(1)}`);
    }
  }
});
test('mọi điểm đến FEATURES đi tới được từ điểm xuất hiện', () => {
  for (const f of FEATURES) {
    assert.equal(blocked(f.stand.x, f.stand.z), false, f.id + ' điểm đứng bị chặn');
    assert.ok(free(f.stand.x, f.stand.z), f.id + ' điểm đứng sát vật cản');
    const path = findPath(SPAWN.x, SPAWN.z, f.stand.x, f.stand.z);
    assert.ok(path && path.length, f.id + ' không có đường');
    const end = path[path.length - 1];
    assert.ok(Math.hypot(end.x - f.stand.x, end.z - f.stand.z) <= f.r, f.id + ' dừng cách đích ' + Math.hypot(end.x - f.stand.x, end.z - f.stand.z).toFixed(1) + ' m');
  }
});
test('đi qua từng cặp điểm đến (không có điểm cụt)', () => {
  for (let i = 0; i < FEATURES.length; i++) for (let j = 0; j < FEATURES.length; j++) {
    if (i === j) continue;
    const a = FEATURES[i].stand, b = FEATURES[j].stand;
    assert.ok(findPath(a.x, a.z, b.x, b.z), `${FEATURES[i].id} → ${FEATURES[j].id}`);
  }
});
test('lương đình giữa hồ: đi được bằng cầu, cao 0,3 m; mặt hồ ngoài cầu bị chặn', () => {
  assert.equal(blocked(KOI.x, KOI.z), false); assert.equal(groundY(KOI.x, KOI.z), KOI.y); assert.equal(groundY(54, KOI.z - 0.0), KOI.y);
  assert.equal(blocked(KOI.x, KOI.z - 5), true); assert.equal(blocked(KOI.x + 5, KOI.z), true);
});
test('mọi FEATURES nằm trong ranh giới và không đè nhau', () => {
  for (const f of FEATURES) { assert.ok(Math.abs(f.stand.x) <= BOUNDS.xMax && f.stand.z >= BOUNDS.zMin, f.id); }
  for (let i = 0; i < FEATURES.length; i++) for (let j = i + 1; j < FEATURES.length; j++) {
    const a = FEATURES[i].stand, b = FEATURES[j].stand; assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 4, `${FEATURES[i].id} sát ${FEATURES[j].id}`);
  }
});
test('vườn thiền và thảm hoa đi được (không có vật cản trừ đá lớn)', () => {
  assert.equal(blocked(-58, -26), false); assert.equal(blocked(-64, -20), true);   // sỏi đi được, đá lớn chặn
  for (const f of FLOWER_FIELDS) assert.equal(blocked((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2), false, 'thảm hoa chạm vật cản');
  assert.ok(PLAZA.x0 < 0 && PLAZA.x1 > 0 && PLAZA.z1 <= 32.2);
});
test('cây GLB: tất định, ngoài đường, ngoài vật cản; đăng ký xong các điểm đến vẫn đi tới được', () => {
  const a = glbTrees(90), b = glbTrees(90);
  assert.deepEqual(a, b); assert.ok(a.length >= 60, 'chỉ rải được ' + a.length);
  const ids = new Set(TREE_MODELS.map((m) => m.id));
  for (const t of a) { assert.ok(ids.has(t.model)); assert.equal(blocked(t.x, t.z), false); assert.ok(distToPaths(t.x, t.z) >= 2.5, 'sát đường'); }
  registerGlbTrees(a);
  for (const f of FEATURES) assert.ok(findPath(SPAWN.x, SPAWN.z, f.stand.x, f.stand.z), f.id + ' mất đường sau khi trồng cây');
  for (const p of STONE_PATHS) assert.ok(walkCenterline(p.pts).ok, p.id + ' bị cây chặn');
});
