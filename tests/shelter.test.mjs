import test from 'node:test';
import assert from 'node:assert/strict';
import { SHELTERS, COVERED_IDS, isCovered, umbrellaOpen, wantsShelter, leavesShelter, speedFactor, kindOf, clearLine, planShelter, newWalker, stepWalker, MAX_PLAN } from '../js/world/shelter.js';
import { WALKERS } from '../js/world/outside.js';
import { NPCS } from '../js/world/npc.js';
import { blocked, canStep, SPAWN } from '../js/world/layout.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';

function reach() {
  const S = 0.5, key = (i, j) => i + ',' + j, seen = new Set(), q = [[Math.round(SPAWN.x / S), Math.round(SPAWN.z / S)]]; seen.add(key(...q[0]));
  while (q.length) { const [i, j] = q.pop(); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj, k = key(ni, nj); if (seen.has(k)) continue; if (blocked(ni * S, nj * S) || !canStep(i * S, j * S, ni * S, nj * S)) continue; seen.add(k); q.push([ni, nj]); } }
  return (x, z) => seen.has(key(Math.round(x / S), Math.round(z / S)));
}
const has = reach();
const adult = WALKERS.find((w) => kindOf(w) === 'adult'), child = WALKERS.find((w) => kindOf(w) === 'child');
const run = (k, w, level, secs, dt = 0.1) => { for (let t = 0; t < secs; t += dt) stepWalker(k, w, dt, level); };
const at = (k) => [k.x, k.z];

test('ngưỡng: dù từ mưa nhỏ; người lớn trú khi mưa lớn, trẻ em từ mưa vừa; rời khi chỉ còn mưa nhỏ', () => {
  assert.equal(umbrellaOpen(0), false); assert.equal(umbrellaOpen(1), true);
  assert.deepEqual([0, 1, 2, 3].map((l) => wantsShelter('adult', l)), [false, false, false, true]);
  assert.deepEqual([0, 1, 2, 3].map((l) => wantsShelter('child', l)), [false, false, true, true]);
  assert.deepEqual([0, 1, 2, 3].map(leavesShelter), [true, true, false, false]);
  assert.equal(speedFactor(0), 1); assert.ok(speedFactor(2) > 1);
  assert.equal(kindOf({ scale: 0.7 }), 'child'); assert.equal(kindOf({}), 'adult');
});
test('chỗ trú: id duy nhất, không bị chặn và đi tới được từ cổng chùa', () => {
  assert.equal(new Set(SHELTERS.map((s) => s.id)).size, SHELTERS.length);
  assert.ok(SHELTERS.some((s) => s.indoor) && SHELTERS.some((s) => !s.indoor));
  for (const s of SHELTERS) { assert.equal(blocked(s.x, s.z), false, s.id + ' trống'); assert.ok(has(s.x, s.z), s.id + ' đi tới được'); }
});
test('NPC che sẵn mái có thật trong danh sách NPC; dân còn lại sẽ mở dù', () => {
  for (const id of COVERED_IDS) assert.ok(NPCS.some((n) => n.id === id), id);
  assert.equal(isCovered('truru'), true); assert.equal(isCovered('bacnong'), false);
});
test('clearLine: đi được qua chỗ trống, bị chặn khi cắt vật cản', () => {
  assert.equal(clearLine([0, 64], [0, 100]), true);
  assert.equal(clearLine([0, 64], [0, 100], (x, z) => z > 80 && z < 82), false);
});
test('planShelter: mọi điểm trên đường của từng dân làng đều có chỗ trú, đường đi không xuyên vật cản và trong giới hạn', () => {
  for (const w of WALKERS) {
    const [a, b] = w.path, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s <= len; s += 3) {
      const p = [a[0] + (b[0] - a[0]) * s / len, a[1] + (b[1] - a[1]) * s / len], plan = planShelter(p, w.path, kindOf(w));
      assert.ok(plan, w.id + ' tại ' + s); assert.ok(plan.cost <= MAX_PLAN);
      for (let i = 1; i < plan.route.length; i++) assert.ok(clearLine(plan.route[i - 1], plan.route[i]), w.id + ' đoạn ' + i);
      const last = plan.route[plan.route.length - 1]; assert.deepEqual(last, [plan.shelter.x, plan.shelter.z]);
    }
  }
});
test('trẻ em ưu tiên chỗ trú trong nhà; người lớn lấy chỗ gần nhất', () => {
  const p = [-4, 70], plan = planShelter(p, child.path, 'child');
  assert.equal(plan.shelter.indoor, true);
  const near = planShelter([-95, 89], WALKERS.find((w) => w.id === 'd6').path, 'adult'); assert.equal(near.shelter.id, 'mieu');
});
test('mỗi người phản ứng với mưa lớn lệch nhau; không tìm được chỗ trú thì chờ RETRY giây rồi mới thử lại', () => {
  const ks = WALKERS.map((w, i) => newWalker(w, i)); assert.ok(ks[1].react0 > ks[0].react0 && ks[6].react0 > ks[1].react0);
  const first = ks[0], w = adult; run(first, w, 3, 0.5); assert.equal(first.mode, 'walk', 'chưa kịp phản ứng');
  run(first, w, 3, 1); assert.equal(first.mode, 'route');
  let calls = 0; const k = newWalker(w); const none = () => true;   // mọi điểm bị chặn → không có kế hoạch
  for (let t = 0; t < 20; t += 0.1) { const before = k.react; stepWalker(k, w, 0.1, 3, SHELTERS, (...a) => { calls++; return none(...a); }); void before; }
  assert.equal(k.mode, 'walk'); assert.ok(calls < 40000, 'không tính lại mỗi khung: ' + calls);
  k.react = 0; stepWalker(k, w, 0.1, 0); assert.equal(k.react, k.react0, 'hết mưa thì đặt lại độ trễ');
});
test('không có chỗ trú nào trong tầm → null (cứ che dù đi tiếp)', () => {
  assert.equal(planShelter([0, 90], [[0, 90], [0, 91]], 'adult', []), null);
  assert.equal(planShelter([0, 90], [[0, 90], [0, 91]], 'adult', SHELTERS, () => true), null);
});
test('trời quang / mưa nhỏ: đi tuần như cũ, không đi trú', () => {
  const k = newWalker(adult); run(k, adult, 0, 30); assert.equal(k.mode, 'walk');
  const d0 = k.to; run(k, adult, 1, 30); assert.equal(k.mode, 'walk'); assert.notEqual(`${at(k)}`, `${adult.path[0]}`);
  assert.ok(d0 === 0 || d0 === 1);
});
test('mưa lớn: người lớn đi tới chỗ trú, đứng yên (không biến mất); tạnh thì quay lại đúng chỗ rời đi', () => {
  const k = newWalker(adult); run(k, adult, 0, 10); while (k.mode === 'walk') stepWalker(k, adult, 0.1, 3);
  const from = k.route[0]; run(k, adult, 3, 120); assert.equal(k.mode, 'in'); assert.equal(k.hidden, false);
  assert.ok(Math.hypot(k.x - k.shelter.x, k.z - k.shelter.z) < 0.01);
  const x = k.x; run(k, adult, 2, 20); assert.equal(k.mode, 'in', 'mưa vừa vẫn ở lại'); assert.equal(k.x, x);
  let t = 0; while (k.mode !== 'walk' && t < 300) { stepWalker(k, adult, 0.1, 0); t += 0.1; }
  assert.equal(k.mode, 'walk'); assert.equal(k.shelter, null);
  assert.ok(Math.hypot(k.x - from[0], k.z - from[1]) < 0.01, 'về đúng chỗ rời đi');
});
test('quay về đúng điểm xuất phát rồi mới đi tuần tiếp', () => {
  const k = newWalker(adult); run(k, adult, 0, 7.3); while (k.mode === 'walk') stepWalker(k, adult, 0.1, 3);   // tới lúc rời đi
  const from = k.route[0], to = k.to;
  run(k, adult, 3, 120); assert.equal(k.mode, 'in'); run(k, adult, 0, 3);   // vừa tạnh: đang quay về
  assert.equal(k.mode, 'route'); assert.equal(k.dir, -1);
  let t = 0; while (k.mode === 'route' && t < 300) { stepWalker(k, adult, 0.1, 0); t += 0.1; }
  assert.equal(k.mode, 'walk'); assert.ok(Math.hypot(k.x - from[0], k.z - from[1]) < 0.01); assert.equal(k.to, to);
});
test('trẻ em: từ mưa vừa đi trú; chỗ trú là cửa hàng thì vào nhà (ẩn), tạnh thì hiện lại', () => {
  const k = newWalker(child); run(k, child, 2, 60); assert.equal(k.mode, 'in'); assert.equal(k.shelter.indoor, true); assert.equal(k.hidden, true);
  run(k, child, 2, 10); assert.equal(k.hidden, true);
  stepWalker(k, child, 0.1, 1); assert.equal(k.hidden, false); assert.equal(k.mode, 'route');
  run(k, child, 0, 200); assert.equal(k.mode, 'walk');
});
test('đổi ý giữa đường: tạnh khi đang đi trú → quay về; lại mưa lớn khi đang về → quay lại chỗ trú', () => {
  const k = newWalker(adult); run(k, adult, 0, 5);
  run(k, adult, 3, 1.5); assert.equal(k.mode, 'route'); assert.equal(k.dir, 1);
  run(k, adult, 3, 2); stepWalker(k, adult, 0.1, 0); assert.equal(k.dir, -1);
  stepWalker(k, adult, 0.1, 3); assert.equal(k.dir, 1);
  run(k, adult, 3, 200); assert.equal(k.mode, 'in');
});
test('bước đi luôn hữu hạn và không xuyên vật cản dù mưa đổi liên tục (mô phỏng 10 phút, mọi dân làng)', () => {
  for (const w of WALKERS) {
    const k = newWalker(w, WALKERS.indexOf(w)); let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    let level = 0;
    for (let t = 0; t < 600; t += 0.1) {
      if (rnd() < 0.004) level = Math.min(3, Math.max(0, level + (rnd() < 0.5 ? -1 : 1)));
      const r = stepWalker(k, w, 0.1, level);
      assert.ok(Number.isFinite(k.x) && Number.isFinite(k.z) && Number.isFinite(r.speed), w.id);
      assert.equal(blocked(k.x, k.z), false, w.id + ' tại ' + t.toFixed(1) + ' (' + k.x.toFixed(1) + ',' + k.z.toFixed(1) + ')');
    }
  }
});
