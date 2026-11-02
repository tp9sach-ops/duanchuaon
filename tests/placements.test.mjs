import test from 'node:test';
import assert from 'node:assert/strict';
import { BEDS, ROUND_BEDS, STONE_LANTERNS, BENCHES, BUILDINGS, buildingFront, OLD_PROP_CIRCLES, bedRect } from '../js/world/placements.js';
import { blocked, canStep, move, SPAWN, HALL, POND, BELL, CENSER, groundY } from '../js/world/layout.js';

// Tìm đường (lưới 0,5 m, 8 hướng) từ điểm xuất hiện: trả Set các ô đi tới được
function reach() {
  const S = 0.5, key = (i, j) => i + ',' + j, seen = new Set(), q = [[Math.round(SPAWN.x / S), Math.round(SPAWN.z / S)]];
  seen.add(key(...q[0]));
  while (q.length) {
    const [i, j] = q.pop();
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj, k = key(ni, nj);
      if (seen.has(k)) continue;
      if (blocked(ni * S, nj * S) || !canStep(i * S, j * S, ni * S, nj * S)) continue;
      seen.add(k); q.push([ni, nj]);
    }
  }
  return { has: (x, z) => seen.has(key(Math.round(x / S), Math.round(z / S))), size: seen.size };
}
const R = reach();

test('tâm mọi vật mới đều là vật cản (nhân vật không đi xuyên)', () => {
  for (const b of BEDS) assert.equal(blocked((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2), true);
  for (const b of ROUND_BEDS) assert.equal(blocked(b.x, b.z), true);
  for (const l of STONE_LANTERNS) assert.equal(blocked(l.x, l.z), true);
  for (const b of BENCHES) assert.equal(blocked(b.x, b.z), true);
  for (const b of BUILDINGS) assert.equal(blocked(b.cx, b.cz), true);
  for (const c of OLD_PROP_CIRCLES.filter((c) => c.r >= 0.5)) assert.equal(blocked(c.x, c.z), true);
});
test('lối đi chính vẫn thông: từ cổng qua cầu đá tới lư hương và vào chính điện', () => {
  for (const [x, z] of [[0, 40], [0, 30], [0, 14], [0, 0], [3, -8], [0, -16], [0, -25], [-10, -22], [10, -22]]) assert.ok(R.has(x, z), `đi tới được (${x}, ${z})`);
  assert.ok(R.size > 8000, 'vùng đi được đủ lớn: ' + R.size);
});
test('đi tới được trước cửa Nhà Tổ, Nhà Khách, tháp chuông và từng ghế đá', () => {
  for (const b of BUILDINGS) { const f = buildingFront(b); assert.equal(blocked(f.x, f.z), false); assert.ok(R.has(f.x, f.z), b.id); }
  assert.ok(R.has(BELL.x - BELL.r - 1, BELL.z));
  for (const b of BENCHES) assert.ok(R.has(b.x, b.z + 1.2), `trước ghế (${b.x}, ${b.z})`);
});
test('không vật mới nào đè lên cầu đá, trục giữa, ao sen, chính điện hay nhau', () => {
  const rects = [...BEDS.map(bedRect), ...BENCHES.map((b) => ({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.d / 2, z1: b.z + b.d / 2 })), ...BUILDINGS.map((b) => ({ x0: b.cx - b.w / 2, x1: b.cx + b.w / 2, z0: b.cz - b.d / 2, z1: b.cz + b.d / 2 }))];
  for (const r of rects) {
    assert.ok(!(r.x0 < 2.2 && r.x1 > -2.2 && r.z1 > -17 && r.z0 < 36), 'đè trục giữa');
    assert.ok(r.x0 > -44 && r.x1 < 44 && r.z0 > -40 && r.z1 < 32, 'ra ngoài sân');
    assert.ok(!(r.x1 > -HALL.platX && r.x0 < HALL.platX && r.z0 < HALL.platZ1 + 0.5), 'đè chính điện');
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0, `hai vật đè nhau: ${i} và ${j}`);
  }
  for (const c of [...ROUND_BEDS, ...STONE_LANTERNS]) assert.ok(Math.hypot(c.x - POND.x, c.z - POND.z) > POND.r + (c.r || 0) + 0.3, 'chạm ao');
  for (const c of [...ROUND_BEDS, ...STONE_LANTERNS]) assert.ok(Math.hypot(c.x - CENSER.x, c.z - CENSER.z) > 3, 'sát lư hương');
});
test('đèn đá và bồn tròn không nằm trong luống hoa hay công trình', () => {
  for (const c of [...ROUND_BEDS, ...STONE_LANTERNS]) {
    for (const r of BEDS.map(bedRect)) assert.ok(!(c.x > r.x0 && c.x < r.x1 && c.z > r.z0 && c.z < r.z1), 'đè luống');
    for (const b of BUILDINGS) assert.ok(!(Math.abs(c.x - b.cx) < b.w / 2 + 0.5 && Math.abs(c.z - b.cz) < b.d / 2 + 0.5), 'đè công trình');
  }
});
test('đi từ sân (lệch lư hương) vào chính điện vẫn không bị kẹt bởi vật mới', () => {
  let p = { x: 3, z: -4 }; for (let i = 0; i < 70; i++) p = move(p.x, p.z, 0, -0.5);
  assert.ok(p.z < -20 && groundY(p.x, p.z) === HALL.h, 'đã vào chính điện: ' + p.z);
});
