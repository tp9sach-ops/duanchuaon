import test from 'node:test';
import assert from 'node:assert/strict';
import { NPCS, npcById, npcSpot, talk, loadNpcState, dayKey, REWARD, NPC_R } from '../js/world/npc.js';
import { spotById, pickSpot, NPC_SPOTS, isNpcSpot, SPOTS } from '../js/world/spots.js';
import { blocked, canStep, SPAWN } from '../js/world/layout.js';
import '../js/world/placements.js';
import '../js/world/landscape.js';
import { cleanSay } from '../js/world/avatarLogic.js';

function reach() {
  const S = 0.5, key = (i, j) => i + ',' + j, seen = new Set(), q = [[Math.round(SPAWN.x / S), Math.round(SPAWN.z / S)]]; seen.add(key(...q[0]));
  while (q.length) { const [i, j] = q.pop(); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj, k = key(ni, nj); if (seen.has(k)) continue; if (blocked(ni * S, nj * S) || !canStep(i * S, j * S, ni * S, nj * S)) continue; seen.add(k); q.push([ni, nj]); } }
  return (x, z) => seen.has(key(Math.round(x / S), Math.round(z / S)));
}
const has = reach();

test('NPC: id không trùng, mọi lời ≤ 80 ký tự và qua được bộ lọc bong bóng nguyên văn', () => {
  assert.equal(new Set(NPCS.map((n) => n.id)).size, NPCS.length);
  for (const n of NPCS) { assert.ok(n.lines.length >= 5, n.id); for (const l of n.lines) { assert.ok(Array.from(l).length <= 80, l); assert.equal(cleanSay(l), l, l); } }
});
test('NPC đứng trong vật cản của chính nó, điểm đứng đi tới được và cách NPC ≥ 1,5 m', () => {
  for (const n of NPCS) {
    assert.equal(blocked(n.x, n.z), true, n.id + ' có va chạm');
    assert.equal(blocked(n.stand.x, n.stand.z), false, n.id + ' điểm đứng trống');
    assert.ok(has(n.stand.x, n.stand.z), n.id + ' đi tới được từ cổng');
    assert.ok(Math.hypot(n.stand.x - n.x, n.stand.z - n.z) >= NPC_R + 1, n.id + ' không đứng sát NPC');
  }
});
test('NPC dùng chung cơ chế bấm → đi tới: có spot, bấm trúng khối cầu, không lẫn vào 6 chương', () => {
  assert.equal(SPOTS.length, 6); assert.equal(NPC_SPOTS.length, NPCS.length);
  for (const n of NPCS) { const s = spotById('npc-' + n.id); assert.ok(s && isNpcSpot(s.id)); }
  const n = NPCS[0], s = npcSpot(n), L = Math.hypot(0, s.pick.c[1] - 1.6, -5);
  const hit = pickSpot({ x: n.x, y: 1.6, z: n.z + 5 }, { x: 0, y: (s.pick.c[1] - 1.6) / L, z: -5 / L });
  assert.equal(hit && hit.spot.id, 'npc-' + n.id);
});
test('thưa chuyện: lời xoay vòng; quà 1 lần mỗi ngày, sang ngày mới nhận lại', () => {
  const t0 = new Date(2026, 10, 5, 8, 0).getTime(), t1 = new Date(2026, 10, 5, 20, 0).getTime(), t2 = new Date(2026, 10, 6, 7, 0).getTime();
  let r = talk(null, 'truru', t0); assert.equal(r.reward, REWARD); assert.equal(r.line, NPCS[0].lines[0]);
  r = talk(r.state, 'truru', t1); assert.equal(r.reward, 0); assert.equal(r.line, NPCS[0].lines[1]);
  r = talk(r.state, 'truru', t2); assert.equal(r.reward, REWARD);
  const m = talk(r.state, 'trikhach', t2); assert.equal(m.reward, REWARD, 'NPC khác có quà riêng');
  assert.equal(talk(null, 'khong-co'), null);
  let st = null; for (let i = 0; i < NPCS[2].lines.length + 1; i++) st = talk(st, 'cusi', t0).state;
  assert.equal(talk(st, 'cusi', t0).line, NPCS[2].lines[1], 'quay vòng về đầu');
});
test('trạng thái hỏng/độc không làm vỡ: chuỗi sai, id lạ, số âm', () => {
  assert.deepEqual(loadNpcState('{{{'), { last: {}, n: {} });
  assert.deepEqual(loadNpcState({ last: { x: '2026-01-01' }, n: { x: 5 } }), { last: {}, n: {} });
  assert.equal(loadNpcState({ n: { truru: -4 } }).n.truru, 0);
  assert.equal(dayKey(new Date(2026, 0, 2).getTime()), '2026-01-02');
});
