// Test zone phó bản (mục 4b, Phiên 139). Chạy: node --test tests/zonedungeon.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DUNGEON_IDS } from '../js/data/dungeons.js';
import { arenaOf, inArena, playerSpawn, mobSpot, dungeonZoneId, dungeonIdOfZone, dungeonZoneDef, registerDungeonZones, ARENA_R, DUNGEON_RETURN_SPAWN } from '../js/world/zoneDungeon.js';
import { createZoneRuntime } from '../js/world/zoneRuntime.js';
import { ARENA } from '../js/world/duel.js';
import { THU_DEF } from '../js/world/zoneThu.js';

const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const makeRt = () => { const store = new Map(); const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) }; const rt = createZoneRuntime({ storage }); registerDungeonZones(rt.manager); return { rt, storage }; };

test('sàn phó bản: không chồng nhau, không chồng Võ đài/Vườn thử, ngoài khung hub', () => {
  const arenas = DUNGEON_IDS.map(arenaOf);
  for (let i = 0; i < arenas.length; i++) {
    assert.equal(arenas[i].r, ARENA_R);
    assert.ok(!overlap(arenas[i].bounds, ARENA.bounds) && !overlap(arenas[i].bounds, THU_DEF.bounds), DUNGEON_IDS[i]);
    assert.ok(arenas[i].bounds.x0 > 600, 'xa hub');
    for (let j = i + 1; j < arenas.length; j++) assert.ok(!overlap(arenas[i].bounds, arenas[j].bounds), `${i}/${j}`);
  }
  assert.equal(arenaOf('khong'), null); assert.equal(dungeonZoneDef('khong'), null);
});

test('điểm xuất hiện của người và quái đều nằm trong sàn; quái ở nửa phía bắc, cách người', () => {
  for (const id of DUNGEON_IDS) {
    const a = arenaOf(id), p = playerSpawn(id);
    assert.ok(inArena(id, p.x, p.z));
    for (const n of [1, 2, 4, 8, 12]) for (let i = 0; i < n; i++) {
      const m = mobSpot(id, i, n); assert.ok(inArena(id, m.x, m.z), `${id} ${i}/${n}`); assert.ok(m.z < a.cz, 'nửa bắc'); assert.ok(Math.hypot(m.x - p.x, m.z - p.z) > 8, 'cách người');
    }
  }
  assert.equal(mobSpot('khong', 0, 3), null);
});

test('zone phó bản: cấu hình hợp lệ trong ZoneManager thật (không lỗi validate, không có cổng ở hub)', () => {
  const { rt } = makeRt(), M = rt.manager;
  assert.deepEqual(M.validate(), []);
  for (const id of DUNGEON_IDS) {
    const d = M.get(dungeonZoneId(id)); assert.ok(d, id); assert.equal(d.loai, 'QUAI'); assert.equal(d.temp, true); assert.equal(d.viaNpc, true);
    assert.equal(d.gates.length, 1); assert.equal(d.gates[0].to, 'chua'); assert.ok(d.terrain(d.bounds.x0 + 1, d.bounds.z0 + 1), 'ngoài sàn bị chặn'); assert.ok(!d.terrain(arenaOf(id).cx, arenaOf(id).cz));
    assert.ok(!M.get('chua').gates.some((g) => g.to === d.id), 'hub không có cổng thẳng vào phó bản');
  }
  assert.deepEqual(M.get('chua').spawns['tu-pho-ban'], DUNGEON_RETURN_SPAWN);
  const n = M.list().length; registerDungeonZones(M); assert.equal(M.list().length, n);   // gọi lại không đăng ký thêm
});

test('vào bằng travel, ra bằng cổng; tải lại trang thì về chùa (zone tạm không lưu)', async () => {
  const { rt, storage } = makeRt(), M = rt.manager, id = DUNGEON_IDS[0], zid = dungeonZoneId(id);
  const r = await M.travel(zid); assert.ok(r.ok); assert.equal(M.current, zid); assert.deepEqual({ x: r.spawn.x, z: r.spawn.z }, { x: playerSpawn(id).x, z: playerSpawn(id).z });
  assert.ok(M.gateNear(r.spawn.x, r.spawn.z + 3, 0), 'cổng rời gần chỗ vào');
  const back = await M.useGate('roi-pho-ban'); assert.ok(back.ok); assert.equal(M.current, 'chua');
  await M.travel(zid);   // đang ở trong phó bản, lưu rồi khôi phục bằng runtime mới
  const saved = JSON.parse(storage.getItem('lgt.zone')); assert.equal(saved.zone, zid);
  const rt2 = createZoneRuntime({ storage }); registerDungeonZones(rt2.manager); assert.equal(rt2.start.zone, 'chua');
  assert.equal(rt2.manager.restore(saved).zone, 'chua');   // restore sau khi đã đăng ký: cờ `temp` vẫn đưa về chùa
});

test('dungeonIdOfZone, nối dây (main.js + UI + cảnh)', () => {
  assert.equal(dungeonIdOfZone('pb-hothuy'), 'hothuy'); assert.equal(dungeonIdOfZone('pb-khong'), null); assert.equal(dungeonIdOfZone('vo-dai'), null); assert.equal(dungeonIdOfZone(null), null);
  assert.match(readFileSync(new URL('../js/main.js', import.meta.url), 'utf8'), /dungeonZones\.js/);
  const ui = readFileSync(new URL('../js/ui/dungeonZones.js', import.meta.url), 'utf8'); assert.match(ui, /dungeonHooks/); assert.match(ui, /LGT\.dungeonZones/);
  assert.match(readFileSync(new URL('../js/scene/dungeon.js', import.meta.url), 'utf8'), /buildGate/);
});
