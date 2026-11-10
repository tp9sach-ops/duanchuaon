import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestNpc, npcKg, planNpcThrow, poseAt, startFlight, markNpc, FLY_S, REST_S, BACK_S, MIN_RANGE, PEAK } from '../js/world/npcThrow.js';
import { inTemple } from '../js/world/strength.js';
import { VILLAGERS } from '../js/world/npc.js';

const OUT = { x: 60, z: 160 };   // ngoài khuôn viên chùa
test('điểm thử nằm ngoài chùa', () => assert.equal(inTemple(OUT.x, OUT.z), false));
test('nearestNpc chọn người gần nhất trong tầm', () => {
  const l = [{ id: 'a', x: 1, z: 0 }, { id: 'b', x: 0.5, z: 0 }, { id: 'c', x: 9, z: 0 }];
  assert.equal(nearestNpc(l, 0, 0).id, 'b'); assert.equal(nearestNpc(l, 50, 50), null); assert.equal(nearestNpc(null, 0, 0), null);
  assert.equal(nearestNpc([{ id: 'x', x: 0, z: 0, held: true }], 0, 0), null);
});
test('trẻ em nhẹ hơn người lớn', () => assert.ok(npcKg(0.6) < npcKg(1)) || assert.ok(npcKg(1) === 50));
test('ném: luôn đi theo hướng nhìn, tầm tối thiểu 3 m, mạnh hơn → xa hơn', () => {
  const npc = { id: 'v1', x: OUT.x, z: OUT.z, scale: 1 }, weak = planNpcThrow({ att: { str: 0, ...OUT }, ry: 0, npc }), strong = planNpcThrow({ att: { str: 200, ...OUT }, ry: 0, npc });
  assert.ok(weak.ok && strong.ok); assert.ok(weak.range >= MIN_RANGE); assert.ok(strong.range > weak.range);
  assert.ok(weak.land.z > OUT.z || weak.land.dist === 0, 'ry = 0 → rơi về +z');
  const side = planNpcThrow({ att: { str: 50, ...OUT }, ry: Math.PI / 2, npc }); assert.ok(side.land.x >= OUT.x - 1e-9);
});
test('không ném trong chùa, có hồi chiêu, đầu vào hỏng', () => {
  assert.equal(planNpcThrow({ att: { str: 9, x: 0, z: -30 }, ry: 0, npc: { id: 'a', x: 0, z: -30 } }).reason, 'temple');
  assert.equal(planNpcThrow({ att: { str: 9, ...OUT }, ry: 0, npc: { id: 'a', ...OUT }, cd: { a: 4.2 } }).reason, 'cooldown');
  assert.equal(planNpcThrow({ att: { str: 9, ...OUT }, ry: 0, npc: { id: 'a', ...OUT }, cd: { a: 4.2 } }).wait, 5);
  assert.equal(planNpcThrow({}).reason, 'invalid'); assert.equal(planNpcThrow({ att: { x: NaN, z: 0 }, npc: { id: 1, x: 0, z: 0 } }).reason, 'invalid');
  assert.deepEqual(markNpc({}, 'a'), { a: 10 });
});
test('poseAt: bay vòng cung → nằm nghỉ → đi về → xong', () => {
  const th = startFlight({ x: 0, z: 0 }, { x: 0, z: 10 }, 100), home = { x: 0, z: 0 };
  assert.equal(poseAt(th, 100, home).y, 0); const mid = poseAt(th, 100 + FLY_S / 2, home); assert.equal(mid.phase, 'fly'); assert.ok(Math.abs(mid.y - PEAK) < 1e-9); assert.ok(Math.abs(mid.z - 5) < 1e-9);
  const r = poseAt(th, 100 + FLY_S + 1, home); assert.deepEqual([r.phase, r.z, r.sit], ['rest', 10, true]);
  const b = poseAt(th, 100 + FLY_S + REST_S + BACK_S / 2, home); assert.equal(b.phase, 'back'); assert.ok(Math.abs(b.z - 5) < 1e-9);
  const d = poseAt(th, 100 + FLY_S + REST_S + BACK_S + 1, home); assert.deepEqual([d.phase, d.x, d.z], ['done', 0, 0]);
});
test('có dân làng ngoài chùa để ném', () => assert.ok(VILLAGERS.length > 0 && VILLAGERS.some((v) => !inTemple(v.x, v.z))));

test('dock: gần NPC (không có người chơi) → nút "Ném NPC"; có người chơi gần thì ưu tiên "Ném người"', async () => {
  const { dockButtons } = await import('../js/world/dock.js');
  assert.ok(dockButtons({ free: true, npc: { near: 'Bác Ba' } }).some((b) => b.id === 'nemnpc'));
  assert.ok(!dockButtons({ free: true, npc: { near: '' } }).some((b) => b.id === 'nemnpc'));
  const both = dockButtons({ free: true, npc: { near: 'Bác Ba' }, ply: { near: 'An' } }).map((b) => b.id); assert.ok(both.includes('nemnguoi') && !both.includes('nemnpc'));
});
