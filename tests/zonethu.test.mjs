// Phiên 87: cổng thử ở rìa làng → Vườn thử → quay về. Dùng layout THẬT (đã nạp vật cản hub).
import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/world/outside.js';
import * as layout from '../js/world/layout.js';
import { createZoneManager, HUB_ID } from '../js/world/zones.js';
import { HUB_DEF } from '../js/world/zoneRuntime.js';
import { THU_DEF, THU_ID, HUB_GATE, HUB_RETURN_SPAWN } from '../js/world/zoneThu.js';
import { findPath, free } from '../js/world/path.js';

const make = () => {
  const m = createZoneManager({ layout });
  m.register({ ...HUB_DEF, spawns: { default: { x: 0, z: 12, ry: 0 }, 'tu-vuon-thu': { ...HUB_RETURN_SPAWN } }, gates: [{ ...HUB_GATE }] });
  m.register({ ...THU_DEF, spawns: { default: { ...THU_DEF.spawns.default } }, gates: THU_DEF.gates.map((g) => ({ ...g })) });
  return m;
};

test('Vườn thử: cấu hình hợp lệ, cổng hub nằm trên chỗ đi được', () => {
  const m = make(); assert.deepEqual(m.validate(), []);
  assert.equal(layout.blocked(HUB_GATE.x, HUB_GATE.z), false, 'cổng ở hub không nằm trong vật cản');
  assert.equal(layout.blocked(HUB_RETURN_SPAWN.x, HUB_RETURN_SPAWN.z), false);
  assert.equal(m.gateNear(HUB_GATE.x, HUB_GATE.z).id, HUB_GATE.id);
  assert.equal(m.gateNear(HUB_RETURN_SPAWN.x, HUB_RETURN_SPAWN.z), null, 'điểm về nằm NGOÀI vòng cổng (không bị bật qua lại)');
});

test('Vườn thử: đi sang, đi bộ + tìm đường trong zone, quay về hub nguyên vẹn', async () => {
  const m = make(), hubCircles = layout.CIRCLES.length, hubFree = free(0, 100);
  const go = await m.useGate(HUB_GATE.id); assert.equal(go.ok, true); assert.equal(m.current, THU_ID);
  assert.equal(layout.activeZoneId(), THU_ID); assert.equal(layout.CIRCLES.length, 0, 'zone trống: không còn vật cản của hub');
  const sp = go.spawn; assert.equal(layout.blocked(sp.x, sp.z), false);
  assert.equal(layout.blocked(499, 0), true, 'ngoài bounds bị chặn');
  const p = findPath(sp.x, sp.z, 530, -5); assert.ok(p && p.length >= 1, 'tìm đường trong zone chạy theo bounds');
  assert.deepEqual(p[p.length - 1], { x: 530, z: -5 });
  const g = m.gateNear(sp.x, -15 + 0.1); assert.equal(g.id, 've-chua');
  const back = await m.useGate('ve-chua'); assert.equal(back.ok, true); assert.equal(m.current, HUB_ID); assert.deepEqual(back.spawn, HUB_RETURN_SPAWN);
  assert.equal(layout.CIRCLES.length, hubCircles); assert.equal(free(0, 100), hubFree);
  const hp = findPath(0, 100, 0, 150); assert.ok(hp && hp.length >= 1, 'tìm đường ở hub vẫn dùng lưới cũ');
});

test('Vườn thử: phòng mạng tách theo zone', async () => {
  const m = make(); await m.travel(THU_ID); assert.equal(m.roomKey('r'), 'r:' + THU_ID); await m.travel(HUB_ID, { spawn: 'tu-vuon-thu' }); assert.equal(m.roomKey('r'), 'r');
});
