// Phiên 85: nối ZoneManager vào game (zoneRuntime) + roomClient đổi phòng theo zone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createZoneRuntime, loadZoneState, saveZoneState, ZONE_STORAGE_KEY, HUB_DEF } from '../js/world/zoneRuntime.js';
import { HUB_ID } from '../js/world/zones.js';
import { createRoomClient } from '../js/net/roomClient.js';

const memStore = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, raw: m }; };

test('zoneRuntime: chỉ có hub, hợp lệ, khôi phục về hub, roomKey giữ tên cũ', () => {
  const rt = createZoneRuntime({ storage: memStore() });
  assert.deepEqual(rt.manager.validate(), []);
  assert.equal(rt.manager.current, HUB_ID); assert.equal(rt.start.zone, HUB_ID);
  assert.equal(rt.manager.roomKey('main'), 'main');
  assert.equal(HUB_DEF.id, HUB_ID);
});
test('zoneRuntime: lưu và đọc; dữ liệu hỏng hoặc zone lạ thì về hub', () => {
  const st = memStore(); const rt = createZoneRuntime({ storage: st, getPos: () => ({ x: 3, z: 4 }) });
  assert.equal(rt.save(), true);
  assert.deepEqual(JSON.parse(st.raw[ZONE_STORAGE_KEY]).zone, HUB_ID);
  assert.equal(JSON.parse(st.raw[ZONE_STORAGE_KEY]).x, 3);
  assert.equal(loadZoneState(memStore({ [ZONE_STORAGE_KEY]: '{hỏng' })), null);
  const bad = memStore({ [ZONE_STORAGE_KEY]: JSON.stringify({ zone: 'khong-co', opened: ['khong-co'] }) });
  assert.equal(createZoneRuntime({ storage: bad }).start.zone, HUB_ID);
  assert.equal(saveZoneState(null, rt.manager, null), false);
  assert.equal(createZoneRuntime({ storage: null }).save(), false);
});
test('zoneRuntime: có thêm zone thì chuyển được, lưu zone cuối, phòng mạng đổi hậu tố', async () => {
  const st = memStore(); const rt = createZoneRuntime({ storage: st });
  rt.manager.register({ id: 'thu', ten: 'Zone thử', loai: 'AN', bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, spawns: { default: { x: 0, z: 0 } }, gates: [] });
  const hub = rt.manager.get(HUB_ID); hub.gates.push({ id: 'g1', x: 5, z: 5, r: 2, to: 'thu' });
  assert.deepEqual(rt.manager.validate(), []);
  const r = await rt.manager.travel('thu'); assert.equal(r.ok, true);
  assert.equal(rt.manager.roomKey('main'), 'main:thu');
  assert.equal(JSON.parse(st.raw[ZONE_STORAGE_KEY]).zone, 'thu');          // onChange đã lưu
  const rt2 = createZoneRuntime({ storage: st }); assert.equal(rt2.start.zone, HUB_ID);   // zone 'thu' chưa đăng ký ở lần chạy mới → về hub
  await rt.manager.travel(HUB_ID);
});

function fake(roomOf) {
  const reqs = [], scene = { add() {}, remove() {} };
  const c = createRoomClient({ call: async (q) => { reqs.push(q); return { ok: true, players: [], chat: [], seq: 5, count: 1, pollMs: 1500 }; }, getSelf: () => ({ n: 'T', c: 'nau', h: 'troc', x: 0, y: 0, z: 0, r: 0, s: 'idle' }), makeAvatar: () => ({}), scene, pageId: 'page-self0001', schedule: () => 0, cancel() {}, roomOf });
  return { c, reqs };
}
test('roomClient: không có roomOf thì phòng "main" như cũ', async () => {
  const { c, reqs } = fake(undefined); await c.tick(); assert.equal(reqs[0].room, 'main');
});
test('roomClient: đổi zone thì đổi tên phòng và quên mốc cũ (since về 0)', async () => {
  let key = 'main'; const { c, reqs } = fake((b) => (key === 'main' ? b : b + ':' + key));
  await c.tick(); await c.tick(); assert.equal(reqs[1].since, 5);
  key = 'thu'; await c.tick();
  assert.equal(reqs[2].room, 'main:thu'); assert.equal(reqs[2].since, 0);
  await c.tick(); assert.equal(reqs[3].since, 5);
});
