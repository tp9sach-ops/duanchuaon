import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_BOX, worldToMap, mapToWorld, mapHeight, buildMarkers, terrain, hitTest, describeFrom, houseMarker, EXTRA_POIS, shortName, LEGEND } from '../js/world/minimap.js';
import { NPCS } from '../js/world/npc.js';
import { PLACES } from '../js/world/outside.js';
import { SPAWN } from '../js/world/layout.js';
import { PLOTS } from '../js/world/land.js';
import { findPath } from '../js/world/path.js';

const reachable = (t) => { const p = findPath(SPAWN.x, SPAWN.z, t.x, t.z); const e = p && p[p.length - 1]; return !!e && Math.hypot(e.x - t.x, e.z - t.z) < 0.7; };

test('đổi tọa độ qua lại cho kết quả khớp, kẹp vào mép', () => {
  const w = 240, h = mapHeight(240);
  for (const p of [{ x: 0, z: 0 }, { x: -100, z: 150 }, { x: 80, z: -60 }]) {
    const q = worldToMap(p, w, h), r = mapToWorld(q.u, q.v, w, h);
    assert.ok(Math.abs(r.x - p.x) < 0.01 && Math.abs(r.z - p.z) < 0.01);
  }
  assert.deepEqual(worldToMap({ x: -999, z: 999 }, w, h), { u: 0, v: h });
  assert.deepEqual(worldToMap({ x: NaN, z: undefined }, w, h), { u: 0, v: 0 });
  assert.ok(h > w * 0.9 && h < w * 1.4);
});

test('bản đồ có đủ mọi địa điểm và mọi NPC, trong khung, id không trùng', () => {
  const ms = buildMarkers({});
  const ids = ms.map((m) => m.id); assert.equal(new Set(ids).size, ids.length);
  for (const p of PLACES) assert.ok(ids.includes(p.id), p.id);
  for (const n of NPCS) assert.ok(ids.includes(n.id), n.id);
  for (const e of EXTRA_POIS) assert.ok(ids.includes(e.id), e.id);
  for (const m of ms) {
    assert.ok(m.x >= WORLD_BOX.x0 && m.x <= WORLD_BOX.x1 && m.z >= WORLD_BOX.z0 && m.z <= WORLD_BOX.z1, m.id);
    assert.ok(['place', 'store', 'npc', 'house', 'loc', 'target'].includes(m.kind) && m.ten && shortName(m).length <= 16, m.id);
  }
  assert.ok(LEGEND.length >= 6);
});

test('mọi chỗ đứng trên bản đồ đều đi tới được từ chỗ xuất hiện (dẫn đường không bị kẹt)', () => {
  for (const m of buildMarkers({})) assert.ok(reachable(m.stand), `${m.id} @ ${m.stand.x},${m.stand.z}`);
});

test('nhà của bạn chỉ hiện khi đang xem đúng xóm của mình; lộc và đích chỉ hiện khi hợp lệ', () => {
  const pl = PLOTS[3], own = { xom: 1, plot: pl.id, lv: 2 };
  const h = houseMarker({ own, view: 1 }); assert.equal(h.kind, 'house'); assert.ok(/hoa viên/.test(h.ten)); assert.ok(reachable(h.stand));
  assert.equal(houseMarker({ own, view: 2 }), null); assert.equal(houseMarker({ own: null }), null); assert.equal(houseMarker(null), null);
  assert.equal(houseMarker({ own: { xom: 1, plot: 99, lv: 0 } }), null);
  const ms = buildMarkers({ land: { own, view: 1 }, loc: { active: () => true, spot: { x: -14, z: 28 } }, target: { x: 5, z: 6, label: 'Đích' } });
  assert.ok(['nhacuaban', 'hoasenvang', 'dich'].every((id) => ms.some((m) => m.id === id)));
  const off = buildMarkers({ loc: { active: () => false, spot: { x: 1, z: 1 } }, target: { x: NaN, z: 0 } });
  assert.ok(!off.some((m) => m.id === 'hoasenvang' || m.id === 'dich'));
});

test('chạm gần điểm nào thì chọn điểm đó; ưu tiên NPC hơn nơi khi chồng nhau; chạm xa thì không chọn', () => {
  const w = 240, h = mapHeight(240), ms = buildMarkers({});
  const tt = ms.find((m) => m.id === 'truru'), q = worldToMap(tt, w, h);
  assert.equal(hitTest(ms, q.u, q.v, w, h).id, 'truru');
  const lang = ms.find((m) => m.id === 'cusi'), q2 = worldToMap(lang, w, h); assert.equal(hitTest(ms, q2.u + 1, q2.v - 1, w, h).id, 'cusi');
  assert.equal(hitTest(ms, 2, h - 2, w, h, 6), null);
});

test('mô tả hướng và khoảng cách bằng tiếng Việt', () => {
  assert.equal(describeFrom({ x: 0, z: 0 }, { x: 1, z: 1 }), 'ngay tại đây');
  assert.match(describeFrom({ x: 0, z: 50 }, { x: 0, z: -30 }), /^80 m · phía chánh điện/);
  assert.match(describeFrom({ x: 0, z: 0 }, { x: 40, z: 5 }), /bên phải/);
  assert.match(describeFrom({ x: 0, z: 0 }, { x: -40, z: 5 }), /bên trái/);
  assert.match(describeFrom({ x: 0, z: 0 }, { x: 3, z: 90 }), /phía làng/);
});

test('hình nền: có đường đi, khuôn viên và nước', () => {
  const t = terrain(); assert.ok(t.walks.length >= 7 && t.waters.length === 3 && t.compound.x1 > t.compound.x0);
});
