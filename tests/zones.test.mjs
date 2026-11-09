// Phiên 81: va chạm theo zone (layout.js) + ZoneManager (zones.js). Chạy bằng zone GIẢ, không động tới giao diện.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../js/world/layout.js';
import { blocked, bodyBlocked, groundY, region, solidAt, CIRCLES, RECTS, WATERS, addCircle, addRect, addWater, defineZone, activateZone, addToZone, activeZoneId, zoneRevision, SPAWN, HUB } from '../js/world/layout.js';
import '../js/world/placements.js';
import { createZoneManager, HUB_ID, DEFAULT_BUDGET } from '../js/world/zones.js';
import { findPath } from '../js/world/path.js';

const hubCounts = () => [CIRCLES.length, RECTS.length, WATERS.length];

test('hub là zone mặc định và chạy y như cũ', () => {
  assert.equal(activeZoneId(), HUB); assert.equal(HUB, HUB_ID);
  assert.equal(blocked(SPAWN.x, SPAWN.z), false);
  assert.equal(region(0, -30), 'plat'); assert.equal(groundY(0, -30), layout.HALL.h);
  assert.equal(blocked(-20, 34), true);    // tường tam quan
});

test('chuyển zone: vật cản của hub được cất, của zone mới được nạp, quay lại thì nguyên vẹn', () => {
  const before = hubCounts();
  defineZone('thu', { bounds: { x0: -20, x1: 20, z0: -20, z1: 20 } });
  addToZone('thu', 'circle', { x: 0, z: 0, r: 2 });
  addToZone('thu', 'rect', { x0: -10, x1: -8, z0: -10, z1: 10 });
  const rev = zoneRevision();
  assert.equal(activateZone('thu'), true);
  assert.equal(activeZoneId(), 'thu'); assert.equal(zoneRevision(), rev + 1);
  assert.deepEqual(hubCounts(), [1, 1, 0]);                 // chỉ còn vật của zone thử
  assert.equal(blocked(0, 0), true); assert.equal(blocked(-9, 0), true); assert.equal(blocked(12, 12), false);
  assert.equal(blocked(25, 0), true);                      // ngoài bounds
  assert.equal(region(0, -30), 'ground');                  // không có chính điện trong zone khác
  assert.equal(groundY(0, -10), 0);
  assert.equal(solidAt(0, -30, 0.5), false);               // khối chính điện của hub không ám vào zone khác
  assert.equal(bodyBlocked(12, 12), false);
  assert.equal(activateZone('thu'), false);               // đã ở đó
  assert.equal(activateZone(HUB), true);
  assert.deepEqual(hubCounts(), before);                   // hub nguyên vẹn
  assert.equal(blocked(-20, 34), true); assert.equal(region(0, -30), 'plat');
  assert.equal(blocked(0, 0), false);   // vòng chặn của zone thử không rò sang hub
});

test('vật cản thêm lúc đang ở zone khác không lẫn sang hub', () => {
  defineZone('thu2', { bounds: { x0: -10, x1: 10, z0: -10, z1: 10 } });
  const before = hubCounts();
  activateZone('thu2'); addCircle({ x: 0, z: 0, r: 1 }); addRect({ x0: 3, x1: 4, z0: 3, z1: 4 }); addWater({ x: -6, z: -6, r: 2, bridges: [] });
  assert.equal(blocked(0, 0), true); assert.equal(blocked(-6, -6), true);
  activateZone(HUB);
  assert.deepEqual(hubCounts(), before); assert.equal(blocked(-6, -6), false);
  activateZone('thu2'); assert.equal(blocked(0, 0), true);   // vẫn còn khi quay lại
  activateZone(HUB);
});

test('địa hình riêng và độ cao riêng của zone', () => {
  defineZone('doc', { bounds: { x0: 0, x1: 10, z0: 0, z1: 10 }, terrain: (x) => x > 8, groundY: (x) => (x > 5 ? 2 : 0) });
  activateZone('doc');
  assert.equal(blocked(9, 5), true); assert.equal(blocked(4, 5), false);
  assert.equal(groundY(6, 5), 2); assert.equal(groundY(1, 5), 0);
  activateZone(HUB);
});

test('tìm đường làm mới đệm khi đổi zone (không dùng lưới của zone cũ)', () => {
  defineZone('tr', { bounds: { x0: -30, x1: 30, z0: 0, z1: 40 } });
  const hubPath = findPath(0, 54, 0, 40);
  assert.ok(hubPath && hubPath.length >= 1);
  activateZone('tr');
  const p = findPath(-10, 10, 10, 10);
  assert.ok(p && p.length >= 1);                          // đi được trong zone trống
  assert.equal(findPath(-10, 10, 0, 60), null);   // đích ngoài bounds
  activateZone(HUB);
  assert.ok(findPath(0, 54, 0, 40));
});

test('zone khác hub phải có bounds hợp lệ; không được định nghĩa lại hub', () => {
  assert.throws(() => defineZone('x1', {}), /bounds/);
  assert.throws(() => defineZone('x2', { bounds: { x0: 1, x1: 0, z0: 0, z1: 1 } }), /bounds/);
  assert.throws(() => defineZone(HUB, { bounds: { x0: 0, x1: 1, z0: 0, z1: 1 } }), /hub/);
  assert.throws(() => activateZone('khong-co'), /chưa định nghĩa/);
});

// ---------------- ZoneManager ----------------
const mk = (over = {}) => {
  const log = [];
  const m = createZoneManager({ layout });
  m.register({ id: HUB_ID, ten: 'Chùa', spawns: { default: { x: 0, z: 54, ry: Math.PI }, rung: { x: 0, z: 40 } }, gates: [{ id: 'g-suong', x: 0, z: 60, r: 3, to: 'mz-suong', spawn: 'default' }] });
  m.register({ id: 'mz-suong', ten: 'Sương Mù', loai: 'KQ', bounds: { x0: -30, x1: 30, z0: 0, z1: 40 }, spawns: { default: { x: 0, z: 5 } },
    gates: [{ id: 'g-ve', x: 0, z: 2, r: 2, to: HUB_ID, spawn: 'rung' }], requires: (c) => (c.chuong >= 1 ? true : 'Hãy hoàn thành chương 1'),
    load: async () => { log.push('load'); }, dispose: async () => { log.push('dispose'); }, ...over });
  return { m, log };
};

test('cấu hình hợp lệ; bắt lỗi cổng trỏ sai, thiếu spawn, zone mồ côi', () => {
  const { m } = mk(); assert.deepEqual(m.validate(), []);
  const bad = createZoneManager();
  bad.register({ id: HUB_ID, spawns: { default: { x: 0, z: 0 } }, gates: [{ id: 'a', x: 0, z: 0, r: 1, to: 'nowhere' }] });
  bad.register({ id: 'mo-coi', spawns: {}, budget: { meshes: -1 } });
  const errs = bad.validate().join('|');
  assert.match(errs, /không có \(nowhere\)/); assert.match(errs, /thiếu điểm xuất hiện/); assert.match(errs, /ngân sách meshes/); assert.match(errs, /mo-coi: không có đường đi từ hub/);
  assert.throws(() => bad.register({ id: 'mo-coi' }), /Trùng/);
});

test('điều kiện mở: chưa đủ thì từ chối kèm lý do, đủ thì đi được', async () => {
  const { m } = mk();
  assert.deepEqual(m.canEnter('mz-suong', { chuong: 0 }), { ok: false, reason: 'Hãy hoàn thành chương 1' });
  const r = await m.travel('mz-suong', { ctx: { chuong: 0 } });
  assert.equal(r.ok, false); assert.equal(m.current, HUB_ID); assert.equal(activeZoneId(), HUB);
  assert.equal(m.canEnter('khong-co').ok, false);
});

test('đi qua cổng: tải, đổi va chạm, giải phóng zone cũ, đúng điểm xuất hiện; về hub dispose zone', async () => {
  const { m, log } = mk(); const seen = [];
  m.listen((e) => seen.push(e.from + '>' + e.zone));
  const go = await m.useGate('g-suong', { ctx: { chuong: 1 } });
  assert.equal(go.ok, true); assert.deepEqual(go.spawn, { x: 0, z: 5, ry: 0 });
  assert.equal(m.current, 'mz-suong'); assert.equal(activeZoneId(), 'mz-suong');
  assert.equal(m.isOpened('mz-suong'), true); assert.equal(m.isLoaded('mz-suong'), true);
  assert.equal(blocked(0, 5), false); assert.equal(blocked(0, 60), true);   // đã sang zone: tọa độ hub nằm ngoài bounds
  const back = await m.useGate('g-ve');
  assert.equal(back.ok, true); assert.deepEqual(back.spawn, { x: 0, z: 40, ry: 0 });   // điểm "rung" của hub
  assert.equal(activeZoneId(), HUB); assert.equal(m.isLoaded('mz-suong'), false);
  assert.deepEqual(log, ['load', 'dispose']); assert.deepEqual(seen, ['chua>mz-suong', 'mz-suong>chua']);
  assert.equal(blocked(layout.SPAWN.x, layout.SPAWN.z), false);
  // đã mở rồi thì không cần điều kiện nữa
  assert.equal(m.canEnter('mz-suong', { chuong: 0 }).ok, true);
});

test('tải trước khi tới gần cổng, chỉ tải một lần dù gọi nhiều lần', async () => {
  const { m, log } = mk();
  assert.equal(m.tick(0, 30, { chuong: 1 }), null);              // còn xa cổng (g-suong ở z=60, r=3, +12)
  assert.equal(m.tick(0, 50, { chuong: 1 }), 'mz-suong');
  assert.equal(m.tick(0, 50, { chuong: 1 }), null);              // đang tải rồi
  await m.preload('mz-suong'); await m.preload('mz-suong');
  assert.deepEqual(log, ['load']); assert.equal(m.isLoaded('mz-suong'), true);
  assert.equal(m.tick(0, 50, { chuong: 1 }), null);              // đã tải
  assert.equal(m.tick(0, 50, { chuong: 0 }), null);              // chưa đủ điều kiện thì không tải trước
});

test('tải lỗi: ở nguyên zone cũ, không kẹt, thử lại được', async () => {
  let fail = true;
  const { m } = mk({ load: async () => { if (fail) throw new Error('mạng'); } });
  const r = await m.travel('mz-suong', { ctx: { chuong: 1 } });
  assert.equal(r.ok, false); assert.match(r.reason, /Không tải được/); assert.equal(m.current, HUB_ID); assert.equal(activeZoneId(), HUB);
  fail = false;
  assert.equal((await m.travel('mz-suong', { ctx: { chuong: 1 } })).ok, true);
  await m.travel(HUB_ID);
});

test('không chuyển đồng thời, không chuyển vào chính nơi đang đứng', async () => {
  const { m } = mk();
  assert.equal((await m.travel(HUB_ID)).ok, false);
  const [a, b] = await Promise.all([m.travel('mz-suong', { ctx: { chuong: 1 } }), m.travel('mz-suong', { ctx: { chuong: 1 } })]);
  assert.deepEqual([a.ok, b.ok].sort(), [false, true]);
  await m.travel(HUB_ID);
});

test('khóa phòng mạng theo zone, giới hạn người, ngân sách, lưu và khôi phục', async () => {
  const { m } = mk();
  assert.equal(m.roomKey('chua-1'), 'chua-1');                    // hub giữ tên cũ
  assert.equal(m.roomKey('chua-1', 'mz-suong'), 'chua-1:mz-suong');
  assert.equal(m.maxPlayers(), DEFAULT_BUDGET.maxPlayers);
  assert.deepEqual(m.overBudget('mz-suong', { meshes: 99999, trees: 10, la: 1 }), ['meshes 99999 > ' + DEFAULT_BUDGET.meshes]);
  await m.travel('mz-suong', { ctx: { chuong: 1 } });
  const s = m.serialize({ x: 3, z: 7 });
  assert.deepEqual(s, { zone: 'mz-suong', opened: ['chua', 'mz-suong'], x: 3, z: 7 });
  const { m: m2 } = mk();
  assert.deepEqual(m2.restore(s), { zone: 'mz-suong', x: 3, z: 7 });
  assert.deepEqual(m2.restore({ zone: 'da-xoa', opened: ['da-xoa'] }), { zone: HUB_ID, x: null, z: null });   // zone không còn → về hub
  assert.deepEqual(m2.restore(null), { zone: HUB_ID, x: null, z: null });
  assert.deepEqual(mk().m.restore({ zone: 'mz-suong', opened: [] }), { zone: HUB_ID, x: null, z: null });          // chưa mở thì không được vào thẳng
  await m.travel(HUB_ID);
});
